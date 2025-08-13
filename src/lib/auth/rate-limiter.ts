import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (request) => this.getClientIP(request) || 'unknown',
      message: 'Too many requests, please try again later.',
      ...config
    };
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private getClientIP(request: NextRequest): string | null {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = request.headers.get('cf-connecting-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return realIP || clientIP || null;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  async isAllowed(request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.config.keyGenerator!(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Initialize or get existing record
    if (!this.store[key] || this.store[key].resetTime <= now) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
    }

    const record = this.store[key];
    
    // Check if limit exceeded
    if (record.count >= this.config.maxRequests) {
      return {
        allowed: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      };
    }

    // Increment counter
    record.count++;

    return {
      allowed: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime
    };
  }

  getHeaders(result: Awaited<ReturnType<RateLimiter['isAllowed']>>): HeadersInit {
    const headers: HeadersInit = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    };

    if (result.retryAfter) {
      headers['Retry-After'] = result.retryAfter.toString();
    }

    return headers;
  }
}

// Pre-configured rate limiters for different operation types
export const createRateLimiters = () => ({
  // General API rate limiter
  general: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests. Please try again later.'
  }),

  // Authentication rate limiter
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (request) => {
      const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 'unknown';
      return `auth:${clientIP}`;
    },
    message: 'Too many authentication attempts. Please try again later.'
  }),

  // Sensitive operations (delete, bulk operations)
  sensitive: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyGenerator: (request) => {
      const authHeader = request.headers.get('authorization');
      const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 'unknown';
      return `sensitive:${authHeader || clientIP}`;
    },
    message: 'Too many sensitive operations. Please try again later.'
  }),

  // Timetable auto-generation (resource intensive)
  autoGenerate: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (request) => {
      const authHeader = request.headers.get('authorization');
      return `autogen:${authHeader || 'anonymous'}`;
    },
    message: 'Auto-generation limit exceeded. Please try again later.'
  }),

  // Data export operations
  export: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    keyGenerator: (request) => {
      const authHeader = request.headers.get('authorization');
      return `export:${authHeader || 'anonymous'}`;
    },
    message: 'Export limit exceeded. Please try again later.'
  })
});

// Rate limiting middleware
export function withRateLimit(limiter: RateLimiter) {
  return async function<T extends any[]>(
    handler: (request: NextRequest, ...args: T) => Promise<Response>
  ) {
    return async (request: NextRequest, ...args: T): Promise<Response> => {
      const result = await limiter.isAllowed(request);
      const headers = limiter.getHeaders(result);

      if (!result.allowed) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate Limit Exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: result.retryAfter
          }), 
          { 
            status: 429, 
            headers: {
              'Content-Type': 'application/json',
              ...headers
            }
          }
        );
      }

      const response = await handler(request, ...args);
      
      // Add rate limit headers to successful responses
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    };
  };
}

export const rateLimiters = createRateLimiters();