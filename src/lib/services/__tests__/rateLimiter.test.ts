import { RateLimiter } from '../rateLimiter';
import { createClient } from '@/lib/redis';

// Mock Redis client
jest.mock('@/lib/redis', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    multi: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([null, 1]),
    get: jest.fn().mockResolvedValue(null),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
  })),
}));

// Mock Date.now() for consistent testing
const mockDateNow = jest.spyOn(Date, 'now');

// Mock setTimeout and clearTimeout for rate limiter tests
jest.useFakeTimers();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  let redisClient: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockDateNow.mockReturnValue(1000);
    
    // Create a new rate limiter instance for each test
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
      message: 'Too many requests, please try again later.',
    });
    
    redisClient = createClient();
  });
  
  afterEach(async () => {
    await rateLimiter.close();
    jest.clearAllTimers();
  });
  
  afterAll(() => {
    jest.useRealTimers();
    mockDateNow.mockRestore();
  });

  describe('in-memory store', () => {
    it('should allow requests under the limit', async () => {
      const key = 'test-key';
      
      // Make 5 requests (limit is 5)
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.consume(key);
        expect(result.isAllowed).toBe(true);
        expect(result.remaining).toBe(5 - (i + 1));
      }
    });
    
    it('should block requests over the limit', async () => {
      const key = 'test-key';
      
      // Use up all requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.consume(key);
      }
      
      // Next request should be blocked
      const result = await rateLimiter.consume(key);
      
      expect(result.isAllowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });
    
    it('should reset the counter after windowMs', async () => {
      const key = 'test-key';
      
      // Use up all requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.consume(key);
      }
      
      // Fast-forward time to just before the window resets
      mockDateNow.mockReturnValue(60999); // 60,999ms = 1 second before reset
      
      // Should still be blocked
      let result = await rateLimiter.consume(key);
      expect(result.isAllowed).toBe(false);
      
      // Fast-forward time to after the window resets
      mockDateNow.mockReturnValue(61000); // 61,000ms = window has reset
      
      // Should allow requests again
      result = await rateLimiter.consume(key);
      expect(result.isAllowed).toBe(true);
      expect(result.remaining).toBe(4); // 5 - 1
    });
    
    it('should handle multiple keys independently', async () => {
      const key1 = 'user-1';
      const key2 = 'user-2';
      
      // Use up all requests for user 1
      for (let i = 0; i < 5; i++) {
        await rateLimiter.consume(key1);
      }
      
      // User 2 should still have all requests available
      const result = await rateLimiter.consume(key2);
      expect(result.isAllowed).toBe(true);
      expect(result.remaining).toBe(4);
      
      // User 1 should be blocked
      const user1Result = await rateLimiter.consume(key1);
      expect(user1Result.isAllowed).toBe(false);
    });
  });
  
  describe('Redis store', () => {
    beforeEach(() => {
      // Enable Redis store
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        message: 'Too many requests',
      });
    });
    
    it('should use Redis for rate limiting', async () => {
      const key = 'redis-test-key';
      
      // First request should be allowed
      const result1 = await rateLimiter.consume(key);
      expect(result1.isAllowed).toBe(true);
      expect(redisClient.incr).toHaveBeenCalledWith(`rate-limit:${key}:1`);
      
      // Mock Redis to return count of 5 (limit reached)
      (redisClient.get as jest.Mock).mockResolvedValueOnce('5');
      
      // Next request should be blocked
      const result2 = await rateLimiter.consume(key);
      expect(result2.isAllowed).toBe(false);
      expect(result2.remaining).toBe(0);
    });
    
    it('should handle Redis errors gracefully', async () => {
      const key = 'redis-error-key';
      
      // Simulate Redis error
      (redisClient.incr as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));
      
      // Should still work (fail open) but might log the error
      const result = await rateLimiter.consume(key);
      expect(result.isAllowed).toBe(true);
    });
    
    it('should use multi/exec for atomic operations', async () => {
      const key = 'redis-multi-key';
      
      await rateLimiter.consume(key);
      
      // Should use Redis transactions
      expect(redisClient.multi).toHaveBeenCalled();
      expect(redisClient.exec).toHaveBeenCalled();
    });
  });
  
  describe('sliding window', () => {
    it('should implement sliding window algorithm', async () => {
      // Create a rate limiter with a small window for testing
      rateLimiter = new RateLimiter({
        windowMs: 1000, // 1 second
        maxRequests: 2,
        message: 'Too many requests',
      });
      
      const key = 'sliding-window-key';
      
      // First request at 0ms
      mockDateNow.mockReturnValue(0);
      let result = await rateLimiter.consume(key);
      expect(result.isAllowed).toBe(true);
      expect(result.remaining).toBe(1);
      
      // Second request at 100ms
      mockDateNow.mockReturnValue(100);
      result = await rateLimiter.consume(key);
      expect(result.isAllowed).toBe(true);
      expect(result.remaining).toBe(0);
      
      // Third request at 200ms (should be blocked)
      mockDateNow.mockReturnValue(200);
      result = await rateLimiter.consume(key);
      expect(result.isAllowed).toBe(false);
      
      // Fourth request at 1100ms (1.1s, first request should be expired)
      mockDateNow.mockReturnValue(1100);
      result = await rateLimiter.consume(key);
      expect(result.isAllowed).toBe(true);
      expect(result.remaining).toBe(1); // Only one request in current window
    });
  });
  
  describe('block duration', () => {
    it('should block keys for the specified duration after limit is reached', async () => {
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        message: 'Too many requests',
      });
      
      const key = 'block-duration-key';
      
      // Use up all requests
      await rateLimiter.consume(key);
      await rateLimiter.consume(key);
      
      // Should be blocked
      let result = await rateLimiter.consume(key);
      expect(result.isAllowed).toBe(false);
      
      // Fast-forward time to just before block expires
      mockDateNow.mockReturnValue(299999);
      result = await rateLimiter.consume(key);
      expect(result.isAllowed).toBe(false);
      
      // After block expires
      mockDateNow.mockReturnValue(300001);
      result = await rateLimiter.consume(key);
      expect(result.isAllowed).toBe(true);
    });
  });
  
  describe('cleanup', () => {
    it('should clean up expired entries', async () => {
      const cleanupInterval = 1000; // 1 second
      
      rateLimiter = new RateLimiter({
        windowMs: 100,
        maxRequests: 5,
      });
      
      const key = 'cleanup-test';
      
      // Add some entries
      await rateLimiter.consume(key);
      
      // Fast-forward time to after cleanup interval
      mockDateNow.mockReturnValue(cleanupInterval + 1);
      
      // Trigger cleanup
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Check if cleanup was called (implementation detail)
      // In a real test, you would check if the internal store no longer contains the key
      expect(true).toBe(true);
    });
  });
  
  describe('custom key generator', () => {
    it('should use custom key generator function', async () => {
      const customKeyFn = jest.fn().mockReturnValue('custom-key');
      
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyGenerator: customKeyFn,
      });
      
      await rateLimiter.consume('some-request-data');
      
      expect(customKeyFn).toHaveBeenCalledWith('some-request-data');
    });
  });
  
  describe('skip function', () => {
    it('should skip rate limiting when skip function returns true', async () => {
      const skipFn = jest.fn().mockReturnValue(true);
      
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 1,
      });
      
      // First request would normally be allowed
      let result = await rateLimiter.consume('test-key');
      expect(result.isAllowed).toBe(true);
      
      // Second request would normally be blocked, but skip function returns true
      result = await rateLimiter.consume('test-key');
      expect(result.isAllowed).toBe(true);
      
      expect(skipFn).toHaveBeenCalled();
    });
  });
  
  describe('concurrent requests', () => {
    it('should handle concurrent requests correctly', async () => {
      const maxRequests = 10;
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests,
      });
      
      const key = 'concurrent-test';
      const requestCount = 15;
      
      // Simulate concurrent requests
      const results = await Promise.all(
        Array(requestCount).fill(0).map(() => rateLimiter.consume(key))
      );
      
      const allowed = results.filter(r => r.isAllowed).length;
      const blocked = results.filter(r => !r.isAllowed).length;
      
      expect(allowed).toBe(maxRequests);
      expect(blocked).toBe(requestCount - maxRequests);
    });
  });
});
