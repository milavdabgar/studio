import IORedis from 'ioredis';

export class RateLimitExceededError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public limit: number,
    public remaining: number = 0,
    public resetTime?: Date
  ) {
    super(message);
    this.name = 'RateLimitExceededError';
  }
}

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: unknown) => string;
  skip?: (req: unknown) => boolean;
  throwOnLimit?: boolean;
}

export interface RateLimitConfig {
  redis?: IORedis | {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
  defaultWindowMs?: number;
  defaultMaxRequests?: number;
  logger?: {
    warn?: (message: string, meta?: unknown) => void;
    error?: (message: string, meta?: unknown) => void;
    debug?: (message: string, meta?: unknown) => void;
  };
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter: number;
  total: number;
}

export class RateLimitService {
  private redis: IORedis;
  private defaultWindowMs: number;
  private defaultMaxRequests: number;
  private logger?: RateLimitConfig['logger'];

  constructor(config: RateLimitConfig) {
    // Set up Redis connection
    if (config.redis instanceof IORedis) {
      this.redis = config.redis;
    } else if (config.redis) {
      this.redis = new IORedis(config.redis);
    } else {
      this.redis = new IORedis();
    }

    this.defaultWindowMs = config.defaultWindowMs || 60000; // 1 minute
    this.defaultMaxRequests = config.defaultMaxRequests || 100;
    this.logger = config.logger;
  }

  async checkRateLimit(
    key: string, 
    options: RateLimitOptions = {}
  ): Promise<RateLimitResult> {
    const windowMs = options.windowMs || this.defaultWindowMs;
    const maxRequests = options.maxRequests || this.defaultMaxRequests;
    const now = Date.now();

    try {
      // Lua script for atomic rate limiting with sliding window
      const luaScript = `
        local key = KEYS[1]
        local limit = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        
        -- Remove expired entries
        redis.call('zremrangebyscore', key, 0, now - window)
        
        -- Get current count
        local current = redis.call('zcard', key)
        
        if current < limit then
          -- Add current request
          redis.call('zadd', key, now, now .. '-' .. math.random())
          redis.call('expire', key, math.ceil(window / 1000))
          return {current + 1, now + window}
        else
          return {current, now + window}
        end
      `;

      const result = await this.redis.eval(
        luaScript,
        1,
        `rate_limit:${key}`,
        maxRequests.toString(),
        windowMs.toString(),
        now.toString()
      ) as [number, number];

      const [count, resetTimeMs] = result;
      const remaining = Math.max(0, maxRequests - count);
      const allowed = count <= maxRequests;
      const retryAfter = allowed ? 0 : Math.ceil((resetTimeMs - now) / 1000);

      const rateLimitResult: RateLimitResult = {
        allowed,
        remaining,
        resetTime: new Date(resetTimeMs),
        retryAfter,
        total: maxRequests,
      };

      if (!allowed && options.throwOnLimit) {
        throw new RateLimitExceededError(
          'Rate limit exceeded',
          retryAfter,
          maxRequests,
          remaining,
          rateLimitResult.resetTime
        );
      }

      return rateLimitResult;
    } catch (error) {
      // Re-throw RateLimitExceededError as it's intentional
      if (error instanceof RateLimitExceededError) {
        throw error;
      }
      
      // Fail open - allow the request if Redis fails
      this.logger?.error?.('Rate limit check failed', { error, key });
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: new Date(now + windowMs),
        retryAfter: 0,
        total: maxRequests,
      };
    }
  }

  getRateLimitHeaders(result?: RateLimitResult): Record<string, string> {
    if (!result) {
      return {
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': '0',
        'Retry-After': '0',
      };
    }

    return {
      'X-RateLimit-Limit': result.total.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
      'Retry-After': result.retryAfter.toString(),
    };
  }

  middleware(options: RateLimitOptions = {}) {
    return async (req: unknown, res: unknown, next: (...args: unknown[]) => void) => {
      try {
        // Check if request should be skipped
        if (options.skip && options.skip(req)) {
          return next();
        }

        // Generate key for this request
        const key = options.keyGenerator 
          ? options.keyGenerator(req)
          : (req as { ip?: string }).ip || 'unknown';

        // Check rate limit
        const result = await this.checkRateLimit(key, options);

        // Set rate limit headers
        const headers = this.getRateLimitHeaders(result);
        Object.entries(headers).forEach(([header, value]) => {
          (res as { setHeader: (header: string, value: string) => void }).setHeader(header, value);
        });

        if (!result.allowed) {
          return (res as { status: (code: number) => { json: (body: unknown) => void } }).status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            retryAfter: result.retryAfter,
          });
        }

        next();
      } catch (error) {
        this.logger?.error?.('Rate limiting middleware error', { error });
        next(); // Fail open
      }
    };
  }

  async close(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      this.logger?.error?.('Failed to close Redis connection', error);
    }
  }

  async resetLimit(key: string): Promise<void> {
    await this.redis.del(`rate_limit:${key}`);
  }

  async getRemainingRequests(key: string, options: RateLimitOptions = {}): Promise<number> {
    const windowMs = options.windowMs || this.defaultWindowMs;
    const maxRequests = options.maxRequests || this.defaultMaxRequests;
    const now = Date.now();

    try {
      const redisKey = `rate_limit:${key}`;
      await this.redis.zremrangebyscore(redisKey, 0, now - windowMs);
      const currentCount = await this.redis.zcard(redisKey);
      return Math.max(0, maxRequests - currentCount);
    } catch (error) {
      this.logger?.error?.('Failed to get remaining requests', { error, key });
      return maxRequests; // Fail open
    }
  }
}