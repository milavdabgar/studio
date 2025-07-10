export interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: unknown) => string;
  onLimitReached?: (req: unknown, res: unknown) => void;
}

export interface RateLimitResult {
  isAllowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter: number;
  totalHits: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private config: RateLimiterConfig;
  private store: Map<string, RequestRecord> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: RateLimiterConfig) {
    this.config = {
      message: 'Too many requests',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Setup cleanup timer to remove expired entries
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, Math.min(this.config.windowMs, 60000)); // Cleanup every minute or windowMs, whichever is smaller
  }

  async consume(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    
    let record = this.store.get(key);
    
    // If no record exists or the record is expired, create a new one
    if (!record || record.resetTime <= now) {
      record = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
    }

    // Increment the count
    record.count++;
    this.store.set(key, record);

    const isAllowed = record.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - record.count);
    const resetTime = new Date(record.resetTime);
    const retryAfter = isAllowed ? 0 : Math.ceil((record.resetTime - now) / 1000);

    return {
      isAllowed,
      remaining,
      resetTime,
      retryAfter,
      totalHits: record.count,
    };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getHits(key: string): Promise<number> {
    const record = this.store.get(key);
    if (!record || record.resetTime <= Date.now()) {
      return 0;
    }
    return record.count;
  }

  async getRemainingRequests(key: string): Promise<number> {
    const record = this.store.get(key);
    if (!record || record.resetTime <= Date.now()) {
      return this.config.maxRequests;
    }
    return Math.max(0, this.config.maxRequests - record.count);
  }

  async getResetTime(key: string): Promise<Date> {
    const record = this.store.get(key);
    if (!record || record.resetTime <= Date.now()) {
      return new Date(Date.now() + this.config.windowMs);
    }
    return new Date(record.resetTime);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (record.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  async close(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.store.clear();
  }

  // Express middleware factory
  middleware() {
    return async (req: unknown, res: unknown, next: (...args: unknown[]) => void) => {
      try {
        const key = this.config.keyGenerator ? this.config.keyGenerator(req) : (req as { ip?: string }).ip || 'anonymous';
        const result = await this.consume(key);

        // Set rate limit headers
        (res as { set: (headers: Record<string, unknown>) => void }).set({
          'X-RateLimit-Limit': this.config.maxRequests,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000),
        });

        if (!result.isAllowed) {
          (res as { set: (header: string, value: unknown) => void }).set('Retry-After', result.retryAfter);
          
          if (this.config.onLimitReached) {
            this.config.onLimitReached(req, res);
          }

          return (res as { status: (code: number) => { json: (body: unknown) => void } }).status(429).json({
            error: this.config.message,
            retryAfter: result.retryAfter,
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

// Factory function for creating rate limiters
export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  return new RateLimiter(config);
}

// Common rate limiter configurations
export const RateLimiterPresets = {
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later.',
  },
  moderate: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 500,
    message: 'Too many requests from this IP, please try again later.',
  },
  lenient: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: 'Too many requests from this IP, please try again later.',
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'API rate limit exceeded, please try again later.',
  },
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts, please try again later.',
  },
};
