import { RateLimitService, RateLimitExceededError } from '../rateLimitService';
import IORedis from 'ioredis';

// Mock ioredis
jest.mock('ioredis');
const MockIORedis = IORedis as jest.MockedClass<typeof IORedis>;

// Mock logger
const mockLogger = {
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

describe('RateLimitService', () => {
  let rateLimitService: RateLimitService;
  let mockRedis: jest.Mocked<IORedis>;
  
  // Test data
  const testKey = 'test-key';
  const testWindowMs = 60000; // 1 minute
  const testMaxRequests = 100;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock Redis methods
    const mockEval = jest.fn().mockImplementation(async (): Promise<unknown> => {
      // Default behavior: allow requests (count within limit)
      return [1, Date.now() + testWindowMs]; // [count, resetTime]
    });

    const mockQuit = jest.fn().mockResolvedValue('OK');
    const mockDel = jest.fn().mockResolvedValue(1);
    const mockZremrangebyscore = jest.fn().mockResolvedValue(0);
    const mockZcard = jest.fn().mockResolvedValue(0);
    
    // Create mock Redis instance with all required methods
    mockRedis = {
      eval: mockEval,
      quit: mockQuit,
      del: mockDel,
      zremrangebyscore: mockZremrangebyscore,
      zcard: mockZcard,
    } as any as jest.Mocked<IORedis>; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    MockIORedis.mockImplementation(() => mockRedis);
    
    // Create a new instance for each test
    rateLimitService = new RateLimitService({
      redis: mockRedis,
      defaultWindowMs: testWindowMs,
      defaultMaxRequests: testMaxRequests,
      logger: mockLogger as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    });
  });
  
  afterEach(async () => {
    await rateLimitService.close();
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      expect(rateLimitService).toBeDefined();
      expect(MockIORedis).toHaveBeenCalled();
    });
    
    it('should initialize with default Redis when no config provided', () => {
      const defaultService = new RateLimitService({});
      
      expect(MockIORedis).toHaveBeenCalledWith();
      expect(defaultService).toBeDefined();
    });
    
    it('should initialize with custom options', () => {
      new RateLimitService({
        redis: {
          host: 'custom-redis',
          port: 6380,
        },
        defaultWindowMs: 30000, // 30 seconds
        defaultMaxRequests: 50,
      });
      
      expect(MockIORedis).toHaveBeenCalledWith({
        host: 'custom-redis',
        port: 6380,
      });
    });
    
    it('should use existing Redis client if provided', () => {
      const existingClient = mockRedis;
      const service = new RateLimitService({
        redis: existingClient,
      });
      
      expect((service as any).redis).toBe(existingClient); // eslint-disable-line @typescript-eslint/no-explicit-any
    });
  });
  
  describe('rate limiting', () => {
    it('should allow requests under limit', async () => {
      const result = await rateLimitService.checkRateLimit(testKey);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(testMaxRequests - 1);
      expect(result.resetTime).toBeInstanceOf(Date);
      expect(result.retryAfter).toBe(0);
    });
    
    it('should block requests over limit', async () => {
      // Mock to return count over the limit
      const mockEval = mockRedis.eval as jest.Mock;
      mockEval.mockResolvedValueOnce([testMaxRequests + 1, Date.now() + 5000]);
      
      const result = await rateLimitService.checkRateLimit(testKey);
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });
    
    it('should use custom limits when provided', async () => {
      const customLimit = 10;
      const customWindow = 30000; // 30 seconds
      
      await rateLimitService.checkRateLimit(testKey, {
        windowMs: customWindow,
        maxRequests: customLimit,
      });
      
      // Verify the script was called with custom parameters
      expect(mockRedis.eval).toHaveBeenCalledWith(
        expect.any(String),
        1, // Number of keys
        expect.stringContaining(testKey),
        customLimit.toString(),
        customWindow.toString(),
        expect.any(String) // Current timestamp
      );
    });
    
    it('should handle concurrent rate limit checks', async () => {
      // Simulate concurrent requests
      const results = await Promise.all([
        rateLimitService.checkRateLimit(testKey),
        rateLimitService.checkRateLimit(testKey),
        rateLimitService.checkRateLimit(testKey),
      ]);
      
      // All requests should be allowed
      results.forEach(result => {
        expect(result.allowed).toBe(true);
      });
      
      // Verify the script was called multiple times
      expect(mockRedis.eval).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('error handling', () => {
    it('should allow requests when Redis is down', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.eval.mockRejectedValueOnce(error);
      
      const result = await rateLimitService.checkRateLimit(testKey);
      
      // Should fail open (allow request) when Redis fails
      expect(result.allowed).toBe(true);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Rate limit check failed',
        expect.objectContaining({
          error,
          key: testKey,
        })
      );
    });
    
    it('should throw RateLimitExceededError when throwOnLimit is true', async () => {
      // Create a mock Redis instance that passes instanceof check
      const testMockRedis = Object.create(IORedis.prototype);
      testMockRedis.eval = jest.fn().mockResolvedValue([testMaxRequests + 1, Date.now() + 5000]);
      testMockRedis.quit = jest.fn().mockResolvedValue('OK');
      testMockRedis.del = jest.fn().mockResolvedValue(1);
      testMockRedis.zremrangebyscore = jest.fn().mockResolvedValue(0);
      testMockRedis.zcard = jest.fn().mockResolvedValue(0);
      
      const testService = new RateLimitService({
        redis: testMockRedis,
        defaultWindowMs: testWindowMs,
        defaultMaxRequests: testMaxRequests,
        logger: mockLogger as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      });
      
      await expect(
        testService.checkRateLimit(testKey, { throwOnLimit: true })
      ).rejects.toThrow(RateLimitExceededError);
      
      await testService.close();
    });
    
    it('should include retry headers in the error', async () => {
      const resetTime = Date.now() + 5000;
      
      // Create a mock Redis instance that passes instanceof check
      const testMockRedis = Object.create(IORedis.prototype);
      testMockRedis.eval = jest.fn().mockResolvedValue([testMaxRequests + 1, resetTime]);
      testMockRedis.quit = jest.fn().mockResolvedValue('OK');
      testMockRedis.del = jest.fn().mockResolvedValue(1);
      testMockRedis.zremrangebyscore = jest.fn().mockResolvedValue(0);
      testMockRedis.zcard = jest.fn().mockResolvedValue(0);
      
      const testService = new RateLimitService({
        redis: testMockRedis,
        defaultWindowMs: testWindowMs,
        defaultMaxRequests: testMaxRequests,
        logger: mockLogger as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      });
      
      try {
        await testService.checkRateLimit(testKey, { throwOnLimit: true });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitExceededError);
        
        const rateLimitError = error as RateLimitExceededError;
        expect(rateLimitError.retryAfter).toBeGreaterThan(0);
        expect(rateLimitError.resetTime).toBeInstanceOf(Date);
        expect(rateLimitError.limit).toBe(testMaxRequests);
        expect(rateLimitError.remaining).toBe(0);
      }
      
      await testService.close();
    });
  });
  
  describe('rate limit headers', () => {
    it('should generate rate limit headers', () => {
      const result = {
        allowed: true,
        remaining: 42,
        resetTime: new Date(Date.now() + 5000),
        retryAfter: 0,
        total: testMaxRequests,
      };
      
      const headers = rateLimitService.getRateLimitHeaders(result);
      
      expect(headers).toEqual({
        'X-RateLimit-Limit': testMaxRequests.toString(),
        'X-RateLimit-Remaining': '42',
        'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
        'Retry-After': '0',
      });
    });
    
    it('should handle undefined result in headers', () => {
      const headers = rateLimitService.getRateLimitHeaders(undefined);
      
      // Should return default values when result is undefined
      expect(headers).toEqual({
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': '0',
        'Retry-After': '0',
      });
    });
  });
  
  describe('middleware', () => {
    it('should create rate limiting middleware', async () => {
      const middleware = rateLimitService.middleware({
        keyGenerator: (req) => (req as any).ip, // eslint-disable-line @typescript-eslint/no-explicit-any
        skip: (req) => (req as any).user?.isAdmin, // eslint-disable-line @typescript-eslint/no-explicit-any
      });
      
      const req = { ip: '127.0.0.1', user: { isAdmin: false } };
      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();
      
      await middleware(req as any, res as any, next); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      // Should call next() when under limit
      expect(next).toHaveBeenCalled();
      
      // Should set rate limit headers
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        expect.any(String)
      );
    });
    
    it('should skip rate limiting for admin users', async () => {
      const middleware = rateLimitService.middleware({
        keyGenerator: (req) => (req as any).ip, // eslint-disable-line @typescript-eslint/no-explicit-any
        skip: (req) => (req as any).user?.isAdmin, // eslint-disable-line @typescript-eslint/no-explicit-any
      });
      
      const req = { ip: '127.0.0.1', user: { isAdmin: true } };
      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();
      
      await middleware(req as any, res as any, next); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      // Should skip rate limiting and call next()
      expect(next).toHaveBeenCalled();
      expect(mockRedis.eval).not.toHaveBeenCalled();
    });
    
    it('should return 429 when rate limit is exceeded', async () => {
      // Mock to return count over the limit
      const mockEval = mockRedis.eval as jest.Mock;
      mockEval.mockResolvedValueOnce([testMaxRequests + 1, Date.now() + 5000]);
      
      const middleware = rateLimitService.middleware({
        keyGenerator: (req) => (req as any).ip, // eslint-disable-line @typescript-eslint/no-explicit-any
      });
      
      const req = { ip: '127.0.0.1' };
      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();
      
      await middleware(req as any, res as any, next); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      // Should not call next() and should send 429 response
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: expect.any(Number),
      });
    });
  });
  
  describe('cleanup', () => {
    it('should close Redis connection on cleanup', async () => {
      await rateLimitService.close();
      
      expect(mockRedis.quit).toHaveBeenCalled();
    });
    
    it('should handle Redis close errors', async () => {
      const error = new Error('Failed to close');
      mockRedis.quit.mockRejectedValueOnce(error);
      
      await rateLimitService.close();
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to close Redis connection',
        error
      );
    });
  });
  
  describe('sliding window algorithm', () => {
    it('should use sliding window counter for rate limiting', async () => {
      // First request in the window
      await rateLimitService.checkRateLimit(testKey);
      
      // Verify the Lua script was called with correct parameters
      expect(mockRedis.eval).toHaveBeenCalledWith(
        expect.stringContaining('redis.call(\'zremrangebyscore\''), // Should contain sliding window logic
        1, // Number of keys
        expect.stringContaining(testKey),
        testMaxRequests.toString(),
        testWindowMs.toString(),
        expect.any(String) // Current timestamp
      );
    });
    
    it('should handle multiple requests within the same window', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      // First request
      await rateLimitService.checkRateLimit(testKey);
      
      // Second request 10 seconds later (same window)
      jest.spyOn(Date, 'now').mockReturnValue(now + 10000);
      await rateLimitService.checkRateLimit(testKey);
      
      // Should have 2 requests in the current window
      expect(mockRedis.eval).toHaveBeenCalledTimes(2);
    });
    
    it('should expire old requests from the window', async () => {
      const now = Date.now();
      
      // Mock the Lua script to simulate requests aging out
      (mockRedis.eval as jest.Mock).mockImplementation(async (script: any): Promise<unknown> => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (script.includes('zremrangebyscore')) {
          // Simulate that some old requests were removed
          return [5, now + testWindowMs]; // 5 requests in the current window
        }
        return [5, now + testWindowMs];
      });
      
      const result = await rateLimitService.checkRateLimit(testKey);
      
      expect(result.remaining).toBe(testMaxRequests - 5);
    });
  });
  
  describe('multiple rate limiters', () => {
    it('should handle multiple rate limiters with different keys', async () => {
      const key1 = 'user-1';
      const key2 = 'user-2';
      
      // First user
      await rateLimitService.checkRateLimit(key1);
      
      // Second user
      await rateLimitService.checkRateLimit(key2);
      
      // Both should be allowed
      expect(mockRedis.eval).toHaveBeenCalledTimes(2);
      expect(mockRedis.eval).toHaveBeenCalledWith(
        expect.any(String),
        1,
        expect.stringContaining(key1),
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
      expect(mockRedis.eval).toHaveBeenCalledWith(
        expect.any(String),
        1,
        expect.stringContaining(key2),
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });
    
    it('should handle different rate limits for different routes', async () => {
      const route1Limit = 10;
      const route2Limit = 100;
      
      // First route with lower limit
      await rateLimitService.checkRateLimit('route-1', {
        maxRequests: route1Limit,
      });
      
      // Second route with higher limit
      await rateLimitService.checkRateLimit('route-2', {
        maxRequests: route2Limit,
      });
      
      // Verify different limits were used
      expect(mockRedis.eval).toHaveBeenCalledWith(
        expect.any(String),
        1,
        expect.stringContaining('route-1'),
        route1Limit.toString(),
        expect.any(String),
        expect.any(String)
      );
      
      expect(mockRedis.eval).toHaveBeenCalledWith(
        expect.any(String),
        1,
        expect.stringContaining('route-2'),
        route2Limit.toString(),
        expect.any(String),
        expect.any(String)
      );
    });
  });
  
  describe('getRemainingRequests', () => {
    it('should return remaining requests count', async () => {
      // Mock Redis methods for getRemainingRequests
      mockRedis.zremrangebyscore.mockResolvedValueOnce(0);
      mockRedis.zcard.mockResolvedValueOnce(25); // 25 requests used
      
      const remaining = await rateLimitService.getRemainingRequests(testKey);
      
      expect(remaining).toBe(testMaxRequests - 25); // 75 remaining
      expect(mockRedis.zremrangebyscore).toHaveBeenCalledWith(
        `rate_limit:${testKey}`,
        0,
        expect.any(Number)
      );
      expect(mockRedis.zcard).toHaveBeenCalledWith(`rate_limit:${testKey}`);
    });
    
    it('should use custom options for getRemainingRequests', async () => {
      const customMax = 50;
      mockRedis.zremrangebyscore.mockResolvedValueOnce(0);
      mockRedis.zcard.mockResolvedValueOnce(10);
      
      const remaining = await rateLimitService.getRemainingRequests(testKey, {
        maxRequests: customMax,
      });
      
      expect(remaining).toBe(customMax - 10); // 40 remaining
    });
    
    it('should handle Redis errors in getRemainingRequests', async () => {
      const error = new Error('Redis error');
      mockRedis.zremrangebyscore.mockRejectedValueOnce(error);
      
      const remaining = await rateLimitService.getRemainingRequests(testKey);
      
      expect(remaining).toBe(testMaxRequests); // Fail open
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get remaining requests',
        expect.objectContaining({ error, key: testKey })
      );
    });
  });

  describe('resetLimit', () => {
    it('should reset rate limit for a key', async () => {
      mockRedis.del.mockResolvedValueOnce(1);
      
      await rateLimitService.resetLimit(testKey);
      
      expect(mockRedis.del).toHaveBeenCalledWith(`rate_limit:${testKey}`);
    });
  });
});
