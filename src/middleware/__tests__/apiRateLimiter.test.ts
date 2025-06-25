import { NextRequest, NextResponse } from 'next/server';
import { createApiRateLimiter } from '../apiRateLimiter';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis-mock';

// Mock the rate-limiter-flexible module
jest.mock('rate-limiter-flexible');

// Mock Redis
jest.mock('ioredis', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      ttl: jest.fn(),
      pttl: jest.fn(),
      expire: jest.fn(),
      pexpire: jest.fn(),
      disconnect: jest.fn(),
      quit: jest.fn(),
    })),
  };
});

describe('API Rate Limiter Middleware', () => {
  let mockRequest: NextRequest;
  let mockResponse: NextResponse;
  let mockNext: jest.Mock;
  
  // Mock RateLimiterMemory and RateLimiterRedis instances
  let mockMemoryLimiter: jest.Mocked<RateLimiterMemory>;
  let mockRedisLimiter: jest.Mocked<RateLimiterRedis>;
  
  // Default config
  const defaultConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.',
    statusCode: 429,
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req: NextRequest) => req.ip || 'unknown',
    handler: (req: NextRequest, res: NextResponse) => {
      return res;
    },
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock request
    mockRequest = {
      ip: '127.0.0.1',
      headers: new Headers(),
      nextUrl: new URL('http://example.com/api/test'),
      method: 'GET',
    } as unknown as NextRequest;
    
    // Create mock response
    mockResponse = new NextResponse();
    
    // Mock next function
    mockNext = jest.fn().mockResolvedValue(undefined);
    
    // Setup mock rate limiters
    mockMemoryLimiter = {
      consume: jest.fn().mockResolvedValue({
        msBeforeNext: 1000,
        remainingPoints: 99,
        consumedPoints: 1,
        isFirstInDuration: false,
      }),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
      block: jest.fn().mockResolvedValue(true),
      getKey: jest.fn().mockReturnValue('127.0.0.1'),
      points: 100,
      duration: 900,
      blockDuration: 0,
      execEvenly: false,
      keyPrefix: 'rlflx',
      storeClient: {},
    } as unknown as jest.Mocked<RateLimiterMemory>;
    
    mockRedisLimiter = {
      ...mockMemoryLimiter,
      storeClient: new Redis(),
    } as unknown as jest.Mocked<RateLimiterRedis>;
    
    // Mock the RateLimiterMemory and RateLimiterRedis constructors
    (RateLimiterMemory as jest.Mock).mockImplementation(() => mockMemoryLimiter);
    (RateLimiterRedis as jest.Mock).mockImplementation(() => mockRedisLimiter);
  });
  
  describe('Memory Store', () => {
    it('should create a memory store rate limiter with default options', () => {
      const rateLimiter = createApiRateLimiter({});
      
      expect(RateLimiterMemory).toHaveBeenCalledWith({
        points: defaultConfig.max,
        duration: defaultConfig.windowMs / 1000, // convert to seconds
        blockDuration: 0,
        keyPrefix: 'api_limiter',
      });
      
      expect(rateLimiter).toBeDefined();
    });
    
    it('should allow requests under the limit', async () => {
      const rateLimiter = createApiRateLimiter({});
      const middleware = rateLimiter(mockRequest, mockResponse, mockNext);
      
      await expect(middleware).resolves.not.toThrow();
      expect(mockNext).toHaveBeenCalled();
      
      // Check rate limit headers
      expect(mockResponse.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(mockResponse.headers.get('X-RateLimit-Remaining')).toBe('99');
      expect(mockResponse.headers.get('X-RateLimit-Reset')).toBeDefined();
    });
    
    it('should block requests over the limit', async () => {
      // Setup mock to reject after first request
      mockMemoryLimiter.consume.mockRejectedValueOnce({
        msBeforeNext: 5000,
        remainingPoints: 0,
        consumedPoints: 101,
        isFirstInDuration: false,
      });
      
      const rateLimiter = createApiRateLimiter({});
      const middleware = rateLimiter(mockRequest, mockResponse, mockNext);
      
      await expect(middleware).resolves.not.toThrow();
      
      // Should not call next
      expect(mockNext).not.toHaveBeenCalled();
      
      // Should return 429 status
      expect(mockResponse.status).toBe(429);
      expect(await mockResponse.text()).toContain('Too many requests');
      
      // Check rate limit headers
      expect(mockResponse.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(mockResponse.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(mockResponse.headers.get('Retry-After')).toBe('5');
    });
    
    it('should use custom key generator', async () => {
      const customKey = 'custom-key';
      const keyGenerator = jest.fn().mockReturnValue(customKey);
      
      const rateLimiter = createApiRateLimiter({
        keyGenerator,
      });
      
      await rateLimiter(mockRequest, mockResponse, mockNext);
      
      expect(keyGenerator).toHaveBeenCalledWith(mockRequest);
      expect(mockMemoryLimiter.consume).toHaveBeenCalledWith(customKey);
    });
    
    it('should skip rate limiting for specific paths', async () => {
      const rateLimiter = createApiRateLimiter({
        skip: (req) => req.nextUrl.pathname === '/api/test',
      });
      
      await rateLimiter(mockRequest, mockResponse, mockNext);
      
      // Should call next without rate limiting
      expect(mockNext).toHaveBeenCalled();
      expect(mockMemoryLimiter.consume).not.toHaveBeenCalled();
    });
  });
  
  describe('Redis Store', () => {
    let redisClient: Redis;
    
    beforeEach(() => {
      redisClient = new Redis();
    });
    
    afterEach(async () => {
      await redisClient.quit();
    });
    
    it('should create a Redis store rate limiter', () => {
      const rateLimiter = createApiRateLimiter({
        storeClient: redisClient,
      });
      
      expect(RateLimiterRedis).toHaveBeenCalledWith({
        storeClient: redisClient,
        points: defaultConfig.max,
        duration: defaultConfig.windowMs / 1000,
        keyPrefix: 'api_limiter',
      });
      
      expect(rateLimiter).toBeDefined();
    });
    
    it('should handle Redis connection errors', async () => {
      const redisError = new Error('Redis connection failed');
      
      // Mock Redis client to simulate connection error
      (redisClient as any).on.mockImplementation((event: string, handler: Function) => {
        if (event === 'error') {
          handler(redisError);
        }
      });
      
      const rateLimiter = createApiRateLimiter({
        storeClient: redisClient,
      });
      
      // Should still work with degraded functionality
      const middleware = rateLimiter(mockRequest, mockResponse, mockNext);
      await expect(middleware).resolves.not.toThrow();
      expect(mockNext).toHaveBeenCalled();
    });
  });
  
  describe('Multiple Rate Limits', () => {
    it('should apply multiple rate limits', async () => {
      const rateLimiter = createApiRateLimiter({
        limits: [
          {
            windowMs: 60 * 1000, // 1 minute
            max: 10,
            keyGenerator: (req) => `minute:${req.ip}`,
          },
          {
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 100,
            keyGenerator: (req) => `hour:${req.ip}`,
          },
        ],
      });
      
      await rateLimiter(mockRequest, mockResponse, mockNext);
      
      // Should call consume for each limit
      expect(mockMemoryLimiter.consume).toHaveBeenCalledTimes(2);
      expect(mockNext).toHaveBeenCalled();
    });
    
    it('should fail if any limit is exceeded', async () => {
      // First limit passes, second fails
      mockMemoryLimiter.consume
        .mockResolvedValueOnce({
          msBeforeNext: 1000,
          remainingPoints: 9,
          consumedPoints: 1,
          isFirstInDuration: false,
        })
        .mockRejectedValueOnce({
          msBeforeNext: 5000,
          remainingPoints: 0,
          consumedPoints: 101,
          isFirstInDuration: false,
        });
      
      const rateLimiter = createApiRateLimiter({
        limits: [
          { windowMs: 60000, max: 10 },
          { windowMs: 3600000, max: 100 },
        ],
      });
      
      await rateLimiter(mockRequest, mockResponse, mockNext);
      
      // Should not call next
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toBe(429);
    });
  });
  
  describe('Custom Handlers', () => {
    it('should use custom handler when rate limited', async () => {
      const customHandler = jest.fn().mockImplementation((req, res) => {
        return new NextResponse('Custom rate limit message', { status: 429 });
      });
      
      // Setup to be rate limited
      mockMemoryLimiter.consume.mockRejectedValueOnce({
        msBeforeNext: 5000,
        remainingPoints: 0,
        consumedPoints: 101,
        isFirstInDuration: false,
      });
      
      const rateLimiter = createApiRateLimiter({
        handler: customHandler,
      });
      
      const response = await rateLimiter(mockRequest, mockResponse, mockNext);
      
      expect(customHandler).toHaveBeenCalled();
      expect(await response.text()).toBe('Custom rate limit message');
    });
    
    it('should use custom skip function', async () => {
      const shouldSkip = jest.fn().mockReturnValue(true);
      
      const rateLimiter = createApiRateLimiter({
        skip: shouldSkip,
      });
      
      await rateLimiter(mockRequest, mockResponse, mockNext);
      
      expect(shouldSkip).toHaveBeenCalledWith(mockRequest);
      expect(mockNext).toHaveBeenCalled();
      expect(mockMemoryLimiter.consume).not.toHaveBeenCalled();
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle missing IP address', async () => {
      // Create request without IP
      const reqWithoutIp = {
        ...mockRequest,
        ip: undefined,
      } as NextRequest;
      
      const rateLimiter = createApiRateLimiter({});
      
      // Should use default key
      await expect(rateLimiter(reqWithoutIp, mockResponse, mockNext)).resolves.not.toThrow();
      expect(mockMemoryLimiter.consume).toHaveBeenCalledWith('unknown');
    });
    
    it('should handle rate limiter errors gracefully', async () => {
      mockMemoryLimiter.consume.mockRejectedValue(new Error('Rate limiter error'));
      
      const rateLimiter = createApiRateLimiter({});
      
      // Should not throw, just log the error
      await expect(rateLimiter(mockRequest, mockResponse, mockNext)).resolves.not.toThrow();
      expect(mockNext).toHaveBeenCalled();
    });
    
    it('should handle concurrent rate limiting', async () => {
      // Simulate concurrent requests
      const rateLimiter = createApiRateLimiter({
        windowMs: 60000,
        max: 10,
      });
      
      // Run multiple requests in parallel
      const requests = Array(5).fill(0).map(() => 
        rateLimiter(
          { ...mockRequest, ip: `ip-${Math.random()}` } as NextRequest,
          new NextResponse(),
          jest.fn()
        )
      );
      
      await Promise.all(requests);
      
      // Should handle all requests without errors
      expect(mockMemoryLimiter.consume).toHaveBeenCalledTimes(5);
    });
  });
});
