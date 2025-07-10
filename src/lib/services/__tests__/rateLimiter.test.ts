import { RateLimiter, createRateLimiter, RateLimiterPresets, RateLimiterConfig } from '../rateLimiter';
import { jest } from '@jest/globals';

// Mock timers for precise control over time-based tests
jest.useFakeTimers();

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  const defaultConfig: RateLimiterConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 5,
    message: 'Rate limit exceeded',
  };

  beforeEach(() => {
    rateLimiter = new RateLimiter(defaultConfig);
    jest.clearAllTimers();
  });

  afterEach(async () => {
    await rateLimiter.close();
    jest.clearAllTimers();
  });

  describe('Constructor', () => {
    it('should create rate limiter with default config', () => {
      const limiter = new RateLimiter(defaultConfig);
      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    it('should merge provided config with defaults', () => {
      const customConfig: RateLimiterConfig = {
        windowMs: 30000,
        maxRequests: 10,
      };
      const limiter = new RateLimiter(customConfig);
      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    it('should setup cleanup timer', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      new RateLimiter(defaultConfig);
      expect(setIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('consume() method', () => {
    it('should allow requests within limit', async () => {
      const result = await rateLimiter.consume('test-key');
      
      expect(result.isAllowed).toBe(true);
      expect(result.remaining).toBe(4); // 5 - 1 = 4
      expect(result.totalHits).toBe(1);
      expect(result.retryAfter).toBe(0);
      expect(result.resetTime).toBeInstanceOf(Date);
    });

    it('should track multiple requests from same key', async () => {
      // First request
      const result1 = await rateLimiter.consume('test-key');
      expect(result1.isAllowed).toBe(true);
      expect(result1.remaining).toBe(4);
      expect(result1.totalHits).toBe(1);

      // Second request
      const result2 = await rateLimiter.consume('test-key');
      expect(result2.isAllowed).toBe(true);
      expect(result2.remaining).toBe(3);
      expect(result2.totalHits).toBe(2);
    });

    it('should block requests when limit exceeded', async () => {
      // Consume all allowed requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.consume('test-key');
      }

      // Next request should be blocked
      const result = await rateLimiter.consume('test-key');
      expect(result.isAllowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.totalHits).toBe(6);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should handle different keys independently', async () => {
      // Consume all requests for key1
      for (let i = 0; i < 5; i++) {
        await rateLimiter.consume('key1');
      }

      // key2 should still be allowed
      const result = await rateLimiter.consume('key2');
      expect(result.isAllowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.totalHits).toBe(1);
    });

    it('should reset counter after window expires', async () => {
      // Consume all allowed requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.consume('test-key');
      }

      // Should be blocked
      const blockedResult = await rateLimiter.consume('test-key');
      expect(blockedResult.isAllowed).toBe(false);

      // Fast-forward past the window
      jest.advanceTimersByTime(60001); // windowMs + 1

      // Should be allowed again
      const allowedResult = await rateLimiter.consume('test-key');
      expect(allowedResult.isAllowed).toBe(true);
      expect(allowedResult.remaining).toBe(4);
      expect(allowedResult.totalHits).toBe(1);
    });
  });

  describe('reset() method', () => {
    it('should reset counter for specific key', async () => {
      // Consume some requests
      await rateLimiter.consume('test-key');
      await rateLimiter.consume('test-key');

      // Reset the key
      await rateLimiter.reset('test-key');

      // Should be back to full limit
      const result = await rateLimiter.consume('test-key');
      expect(result.isAllowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.totalHits).toBe(1);
    });

    it('should not affect other keys when resetting', async () => {
      // Consume requests for both keys
      await rateLimiter.consume('key1');
      await rateLimiter.consume('key2');

      // Reset only key1
      await rateLimiter.reset('key1');

      // key1 should be reset
      const result1 = await rateLimiter.consume('key1');
      expect(result1.totalHits).toBe(1);

      // key2 should maintain its count
      const result2 = await rateLimiter.consume('key2');
      expect(result2.totalHits).toBe(2);
    });
  });

  describe('getHits() method', () => {
    it('should return current hit count', async () => {
      await rateLimiter.consume('test-key');
      await rateLimiter.consume('test-key');

      const hits = await rateLimiter.getHits('test-key');
      expect(hits).toBe(2);
    });

    it('should return 0 for non-existent key', async () => {
      const hits = await rateLimiter.getHits('non-existent');
      expect(hits).toBe(0);
    });

    it('should return 0 for expired key', async () => {
      await rateLimiter.consume('test-key');
      
      // Fast-forward past window
      jest.advanceTimersByTime(60001);
      
      const hits = await rateLimiter.getHits('test-key');
      expect(hits).toBe(0);
    });
  });

  describe('getRemainingRequests() method', () => {
    it('should return remaining requests', async () => {
      await rateLimiter.consume('test-key');
      
      const remaining = await rateLimiter.getRemainingRequests('test-key');
      expect(remaining).toBe(4);
    });

    it('should return max requests for non-existent key', async () => {
      const remaining = await rateLimiter.getRemainingRequests('non-existent');
      expect(remaining).toBe(5);
    });

    it('should return max requests for expired key', async () => {
      await rateLimiter.consume('test-key');
      
      // Fast-forward past window
      jest.advanceTimersByTime(60001);
      
      const remaining = await rateLimiter.getRemainingRequests('test-key');
      expect(remaining).toBe(5);
    });
  });

  describe('getResetTime() method', () => {
    it('should return reset time for existing key', async () => {
      await rateLimiter.consume('test-key');
      
      const resetTime = await rateLimiter.getResetTime('test-key');
      expect(resetTime).toBeInstanceOf(Date);
      expect(resetTime.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return future time for non-existent key', async () => {
      const resetTime = await rateLimiter.getResetTime('non-existent');
      expect(resetTime).toBeInstanceOf(Date);
      expect(resetTime.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('cleanup() method', () => {
    it('should automatically clean up expired entries', async () => {
      // Create entries
      await rateLimiter.consume('key1');
      await rateLimiter.consume('key2');

      // Fast-forward past window to expire entries
      jest.advanceTimersByTime(60001);

      // Trigger cleanup
      jest.advanceTimersByTime(60000);

      // New requests should start fresh
      const result1 = await rateLimiter.getHits('key1');
      const result2 = await rateLimiter.getHits('key2');
      
      expect(result1).toBe(0);
      expect(result2).toBe(0);
    });
  });

  describe('close() method', () => {
    it('should clear timer and store', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      await rateLimiter.consume('test-key');
      await rateLimiter.close();

      expect(clearIntervalSpy).toHaveBeenCalled();
      
      // Store should be cleared
      const hits = await rateLimiter.getHits('test-key');
      expect(hits).toBe(0);
    });
  });

  describe('middleware() method', () => {
    let req: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    let res: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    let next: jest.MockedFunction<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

    beforeEach(() => {
      req = { ip: '127.0.0.1' };
      res = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it('should allow requests within limit', async () => {
      const middleware = rateLimiter.middleware();
      
      await middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': 5,
        'X-RateLimit-Remaining': 4,
        'X-RateLimit-Reset': expect.any(Number),
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block requests when limit exceeded', async () => {
      const middleware = rateLimiter.middleware();
      
      // Consume all allowed requests
      for (let i = 0; i < 5; i++) {
        await middleware(req, res, next);
        next.mockClear();
      }

      // Next request should be blocked
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Rate limit exceeded',
        retryAfter: expect.any(Number),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should use custom key generator', async () => {
      const customLimiter = new RateLimiter({
        ...defaultConfig,
        keyGenerator: (req: any) => (req as { userId?: string }).userId || 'anonymous', // eslint-disable-line @typescript-eslint/no-explicit-any
      });

      const middleware = customLimiter.middleware();
      req.userId = 'user123';

      await middleware(req, res, next);
      expect(next).toHaveBeenCalled();

      await customLimiter.close();
    });

    it('should call onLimitReached callback', async () => {
      const onLimitReached = jest.fn();
      const customLimiter = new RateLimiter({
        ...defaultConfig,
        onLimitReached,
      });

      const middleware = customLimiter.middleware();

      // Consume all allowed requests
      for (let i = 0; i < 5; i++) {
        await middleware(req, res, next);
      }

      // Next request should trigger callback
      await middleware(req, res, next);

      expect(onLimitReached).toHaveBeenCalledWith(req, res);
      await customLimiter.close();
    });

    it('should handle errors gracefully', async () => {
      const errorLimiter = new RateLimiter(defaultConfig);
      // Force an error by closing the limiter
      await errorLimiter.close();
      
      const middleware = errorLimiter.middleware();
      
      // Mock consume to throw an error
      jest.spyOn(errorLimiter, 'consume').mockRejectedValue(new Error('Test error'));

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should use IP as default key', async () => {
      const middleware = rateLimiter.middleware();
      req.ip = '192.168.1.1';

      await middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should use anonymous as fallback key', async () => {
      const middleware = rateLimiter.middleware();
      delete req.ip;

      await middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle concurrent requests correctly', async () => {
      const promises = [];
      
      // Make 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(rateLimiter.consume('test-key'));
      }

      const results = await Promise.all(promises);
      
      // Should have exactly 5 allowed and 5 denied
      const allowed = results.filter(r => r.isAllowed).length;
      const denied = results.filter(r => !r.isAllowed).length;
      
      expect(allowed).toBe(5);
      expect(denied).toBe(5);
    });

    it('should handle very large window sizes', async () => {
      const largeLimiter = new RateLimiter({
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        maxRequests: 1000,
      });

      const result = await largeLimiter.consume('test-key');
      expect(result.isAllowed).toBe(true);
      
      await largeLimiter.close();
    });

    it('should handle zero max requests', async () => {
      const zeroLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 0,
      });

      const result = await zeroLimiter.consume('test-key');
      expect(result.isAllowed).toBe(false);
      expect(result.remaining).toBe(0);
      
      await zeroLimiter.close();
    });

    it('should handle negative values gracefully', async () => {
      // This tests the Math.max(0, ...) logic
      await rateLimiter.consume('test-key');
      await rateLimiter.consume('test-key');
      await rateLimiter.consume('test-key');
      await rateLimiter.consume('test-key');
      await rateLimiter.consume('test-key');
      
      // Should be at limit
      const result = await rateLimiter.consume('test-key');
      expect(result.remaining).toBe(0);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('createRateLimiter factory function', () => {
  it('should create RateLimiter instance', () => {
    const config: RateLimiterConfig = {
      windowMs: 60000,
      maxRequests: 10,
    };
    
    const limiter = createRateLimiter(config);
    expect(limiter).toBeInstanceOf(RateLimiter);
  });
});

describe('RateLimiterPresets', () => {
  it('should have predefined configurations', () => {
    expect(RateLimiterPresets.strict).toBeDefined();
    expect(RateLimiterPresets.moderate).toBeDefined();
    expect(RateLimiterPresets.lenient).toBeDefined();
    expect(RateLimiterPresets.api).toBeDefined();
    expect(RateLimiterPresets.login).toBeDefined();
  });

  it('should have correct structure for each preset', () => {
    Object.values(RateLimiterPresets).forEach(preset => {
      expect(preset).toHaveProperty('windowMs');
      expect(preset).toHaveProperty('maxRequests');
      expect(preset).toHaveProperty('message');
      expect(typeof preset.windowMs).toBe('number');
      expect(typeof preset.maxRequests).toBe('number');
      expect(typeof preset.message).toBe('string');
    });
  });

  it('should work with createRateLimiter', async () => {
    const limiter = createRateLimiter(RateLimiterPresets.api);
    
    const result = await limiter.consume('test-key');
    expect(result.isAllowed).toBe(true);
    
    await limiter.close();
  });

  it('login preset should be more restrictive', () => {
    expect(RateLimiterPresets.login.maxRequests).toBeLessThan(RateLimiterPresets.api.maxRequests);
  });

  it('lenient preset should be less restrictive', () => {
    expect(RateLimiterPresets.lenient.maxRequests).toBeGreaterThan(RateLimiterPresets.strict.maxRequests);
  });
});

describe('Memory management and performance', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      windowMs: 1000, // Short window for testing
      maxRequests: 10,
    });
  });

  afterEach(async () => {
    await rateLimiter.close();
  });

  it('should handle many different keys efficiently', async () => {
    const promises = [];
    
    // Create requests for 1000 different keys
    for (let i = 0; i < 1000; i++) {
      promises.push(rateLimiter.consume(`key-${i}`));
    }

    const results = await Promise.all(promises);
    
    // All should be allowed (first request for each key)
    expect(results.every(r => r.isAllowed)).toBe(true);
  });

  it('should clean up expired entries automatically', async () => {
    // Generate many keys
    for (let i = 0; i < 100; i++) {
      await rateLimiter.consume(`key-${i}`);
    }

    // Fast-forward to expire all entries
    jest.advanceTimersByTime(2000);

    // Trigger cleanup
    jest.advanceTimersByTime(60000);

    // New requests should work normally
    const result = await rateLimiter.consume('new-key');
    expect(result.isAllowed).toBe(true);
    expect(result.totalHits).toBe(1);
  });
});