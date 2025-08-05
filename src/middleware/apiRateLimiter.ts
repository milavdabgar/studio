// API Rate Limiter middleware with Redis
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  maxRequests?: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Function to generate rate limit key
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (req: NextRequest) => void;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalRequests: number;
}

// Redis client with fallback for development
let redisClient: Redis | null = null;

const getRedisClient = (): Redis | null => {
  if (redisClient) return redisClient;
  
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.warn('REDIS_URL not configured, rate limiting will use in-memory fallback');
      return null;
    }
    
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 5000,
    });
    
    redisClient.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
    
    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });
    
    return redisClient;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    return null;
  }
};

// In-memory fallback for development
const memoryCache = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = async (
  key: string, 
  options: Required<RateLimitOptions>
): Promise<RateLimitResult> => {
  const redis = getRedisClient();
  const now = Date.now();
  const windowStart = Math.floor(now / options.windowMs) * options.windowMs;
  const resetTime = windowStart + options.windowMs;
  
  if (redis) {
    try {
      // Use Redis sliding window rate limiting
      const pipeline = redis.pipeline();
      const windowKey = `${key}:${windowStart}`;
      
      pipeline.incr(windowKey);
      pipeline.expire(windowKey, Math.ceil(options.windowMs / 1000));
      
      const results = await pipeline.exec();
      const count = results?.[0]?.[1] as number || 0;
      
      return {
        allowed: count <= options.maxRequests,
        remaining: Math.max(0, options.maxRequests - count),
        resetTime,
        totalRequests: count
      };
    } catch (error) {
      console.error('Redis rate limit check failed:', error);
      // Fall back to memory cache
    }
  }
  
  // In-memory fallback
  const cached = memoryCache.get(key);
  
  if (!cached || now >= cached.resetTime) {
    // New window or expired
    memoryCache.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime,
      totalRequests: 1
    };
  }
  
  // Increment counter
  cached.count++;
  
  return {
    allowed: cached.count <= options.maxRequests,
    remaining: Math.max(0, options.maxRequests - cached.count),
    resetTime: cached.resetTime,
    totalRequests: cached.count
  };
};

const cleanupMemoryCache = () => {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (now >= value.resetTime) {
      memoryCache.delete(key);
    }
  }
};

// Cleanup memory cache every 5 minutes
setInterval(cleanupMemoryCache, 5 * 60 * 1000);

export const apiRateLimiter = (options: RateLimitOptions = {}) => {
  const config: Required<RateLimitOptions> = {
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    maxRequests: options.maxRequests || 100, // 100 requests per window
    keyGenerator: options.keyGenerator || ((req: NextRequest) => {
      // Use IP address or user ID from headers
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
      const userId = req.headers.get('x-user-id');
      return userId ? `user:${userId}` : `ip:${ip}`;
    }),
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    onLimitReached: options.onLimitReached || (() => {})
  };
  
  return async (req: NextRequest) => {
    try {
      const key = config.keyGenerator(req);
      const result = await checkRateLimit(key, config);
      
      // Add rate limit headers
      const headers = new Headers();
      headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      headers.set('X-RateLimit-Remaining', result.remaining.toString());
      headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
      
      if (!result.allowed) {
        config.onLimitReached(req);
        
        headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());
        
        return NextResponse.json(
          {
            error: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            details: {
              limit: config.maxRequests,
              remaining: result.remaining,
              resetTime: result.resetTime,
              retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
            }
          },
          { status: 429, headers }
        );
      }
      
      // Add headers to successful response
      const response = NextResponse.next();
      for (const [key, value] of headers.entries()) {
        response.headers.set(key, value);
      }
      
      return response;
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow the request but log the issue
      return NextResponse.next();
    }
  };
};

/**
 * Predefined rate limiters for different API types
 */
export const authRateLimiter = apiRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 auth attempts per 15 minutes
  keyGenerator: (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
    return `auth:${ip}`;
  }
});

export const generalApiRateLimiter = apiRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  maxRequests: 1000, // 1000 requests per 15 minutes for general API
});

export const strictApiRateLimiter = apiRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute for sensitive operations
});

/**
 * Cleanup function for graceful shutdown
 */
export const cleanup = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  memoryCache.clear();
};
