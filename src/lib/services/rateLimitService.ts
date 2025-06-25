import IORedis from 'ioredis';

export class RateLimitExceededError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public limit: number,
    public remaining: number = 0
  ) {
    super(message);
    this.name = 'RateLimitExceededError';
  }
}

export interface RateLimitOptions {
  windowSizeMs: number;
  maxRequests: number;
  keyGenerator?: (identifier: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimitService {
  private redis: IORedis;
  private options: RateLimitOptions;

  constructor(redis: IORedis, options: RateLimitOptions) {
    this.redis = redis;
    this.options = options;
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = this.options.keyGenerator 
      ? this.options.keyGenerator(identifier)
      : `rate_limit:${identifier}`;
    
    const now = Date.now();
    const windowStart = now - this.options.windowSizeMs;

    // Use Redis pipeline for atomic operations
    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.expire(key, Math.ceil(this.options.windowSizeMs / 1000));

    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error('Redis pipeline execution failed');
    }

    const currentCount = (results[1][1] as number) || 0;
    const remaining = Math.max(0, this.options.maxRequests - currentCount - 1);
    const resetTime = now + this.options.windowSizeMs;

    if (currentCount >= this.options.maxRequests) {
      const retryAfter = Math.ceil(this.options.windowSizeMs / 1000);
      throw new RateLimitExceededError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
        this.options.maxRequests,
        0
      );
    }

    return {
      allowed: true,
      limit: this.options.maxRequests,
      remaining,
      resetTime,
    };
  }

  async resetLimit(identifier: string): Promise<void> {
    const key = this.options.keyGenerator 
      ? this.options.keyGenerator(identifier)
      : `rate_limit:${identifier}`;
    
    await this.redis.del(key);
  }

  async getRemainingRequests(identifier: string): Promise<number> {
    const key = this.options.keyGenerator 
      ? this.options.keyGenerator(identifier)
      : `rate_limit:${identifier}`;
    
    const now = Date.now();
    const windowStart = now - this.options.windowSizeMs;

    await this.redis.zremrangebyscore(key, 0, windowStart);
    const currentCount = await this.redis.zcard(key);
    
    return Math.max(0, this.options.maxRequests - currentCount);
  }
}
