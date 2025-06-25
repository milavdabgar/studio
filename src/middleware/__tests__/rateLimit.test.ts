import { NextResponse } from 'next/server';
import { rateLimit } from '../rateLimit';

// Mock the Redis client
jest.mock('@/lib/redis', () => ({
  get: jest.fn(),
  set: jest.fn().mockResolvedValue('OK'),
  expire: jest.fn().mockResolvedValue(1),
  incr: jest.fn().mockResolvedValue(1),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn().mockReturnValue(new Response(null, { status: 200 })),
    json: jest.fn().mockImplementation((data, init) => 
      new Response(JSON.stringify(data), { ...init })
    ),
  },
}));

describe('Rate Limit Middleware', () => {
  const mockRequest = (ip = '192.168.1.1', method = 'GET', url = '/api/test') => ({
    ip,
    method,
    nextUrl: new URL(`http://localhost${url}`),
    headers: new Headers({
      'x-forwarded-for': ip,
    }),
  });

  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  });

  const mockNext = jest.fn().mockResolvedValue(NextResponse.next());

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset rate limit counters between tests
    jest.spyOn(global.Math, 'floor').mockReturnValue(1000); // Mock current time
  });

  it('should allow requests under the rate limit', async () => {
    const req = mockRequest();
    const res = mockResponse();
    
    await rateLimit({
      limit: 100,
      windowMs: 60 * 1000,
      message: 'Too many requests',
    })(req as any, res as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should block requests over the rate limit', async () => {
    const req = mockRequest();
    const res = mockResponse();
    
    // Mock that we've already hit the rate limit
    const redis = require('@/lib/redis');
    redis.incr.mockResolvedValue(101);
    
    await rateLimit({
      limit: 100,
      windowMs: 60 * 1000,
      message: 'Too many requests',
    })(req as any, res as any, mockNext);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Too many requests',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should use IP from x-forwarded-for header', async () => {
    const ip = '192.168.1.100';
    const req = {
      ip: '192.168.1.1',
      method: 'GET',
      nextUrl: new URL('http://localhost/api/test'),
      headers: new Headers({
        'x-forwarded-for': `${ip}, 10.0.0.1`,
      }),
    };
    
    await rateLimit({
      limit: 100,
      windowMs: 60 * 1000,
    })(req as any, mockResponse() as any, mockNext);

    const redis = require('@/lib/redis');
    expect(redis.incr).toHaveBeenCalledWith(`rate-limit:${ip}:1000`);
  });

  it('should apply different limits to different endpoints', async () => {
    const ip = '192.168.1.1';
    const req1 = mockRequest(ip, 'GET', '/api/endpoint1');
    const req2 = mockRequest(ip, 'GET', '/api/endpoint2');
    
    await rateLimit({
      limit: 10,
      windowMs: 60 * 1000,
      keyGenerator: (req) => `custom:${req.nextUrl.pathname}:${req.ip}`,
    })(req1 as any, mockResponse() as any, mockNext);

    await rateLimit({
      limit: 20,
      windowMs: 60 * 1000,
      keyGenerator: (req) => `custom:${req.nextUrl.pathname}:${req.ip}`,
    })(req2 as any, mockResponse() as any, mockNext);

    const redis = require('@/lib/redis');
    expect(redis.incr).toHaveBeenNthCalledWith(1, 'custom:/api/endpoint1:192.168.1.1:1000');
    expect(redis.incr).toHaveBeenNthCalledWith(2, 'custom:/api/endpoint2:192.168.1.1:1000');
  });

  it('should skip rate limiting for whitelisted IPs', async () => {
    const whitelistedIP = '10.0.0.1';
    const req = {
      ip: whitelistedIP,
      method: 'GET',
      nextUrl: new URL('http://localhost/api/test'),
      headers: new Headers({}),
    };
    
    await rateLimit({
      limit: 0, // No requests allowed
      windowMs: 60 * 1000,
      skip: (req) => req.ip === whitelistedIP,
    })(req as any, mockResponse() as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle Redis errors gracefully', async () => {
    const redis = require('@/lib/redis');
    redis.incr.mockRejectedValueOnce(new Error('Redis error'));
    
    const req = mockRequest();
    const res = mockResponse();
    
    await rateLimit({
      limit: 100,
      windowMs: 60 * 1000,
    })(req as any, res as any, mockNext);
    
    // Should allow the request to proceed if there's a Redis error
    expect(mockNext).toHaveBeenCalled();
  });

  it('should include rate limit headers in the response', async () => {
    const req = mockRequest();
    const res = {
      ...mockResponse(),
      headers: new Headers(),
      setHeader: jest.fn(),
      getHeader: jest.fn(),
      getHeaders: jest.fn(),
    };
    
    const redis = require('@/lib/redis');
    redis.incr.mockResolvedValue(42);
    
    await rateLimit({
      limit: 100,
      windowMs: 60 * 1000,
      message: 'Too many requests',
      standardHeaders: true,
    })(req as any, res as any, mockNext);
    
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '58');
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
  });
});
