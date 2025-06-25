import { NextResponse } from 'next/server';
import { authMiddleware } from '../authMiddleware';
import * as jwt from 'jsonwebtoken';

// Mock JWT and other dependencies
jest.mock('jsonwebtoken');
jest.mock('@/lib/redis', () => ({
  get: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn().mockReturnValue(new Response(null, { status: 200 })),
    json: jest.fn().mockImplementation((data, init) => ({
      ...init,
      json: () => Promise.resolve(data),
    })),
    redirect: jest.fn().mockImplementation((url) => ({
      url,
      status: 302,
    })),
  },
}));

describe('Auth Middleware', () => {
  const mockRequest = (headers = {}, cookies = {}) => ({
    headers: new Headers({
      authorization: '',
      ...headers,
    }),
    cookies: {
      get: jest.fn((name) => ({
        name,
        value: cookies[name] || null,
      })),
    },
    nextUrl: new URL('http://localhost:3000/api/protected'),
  });

  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  });

  const mockNext = jest.fn().mockResolvedValue(NextResponse.next());

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('should allow access to public routes without authentication', async () => {
    const req = mockRequest();
    const res = mockResponse();
    
    await authMiddleware({
      publicRoutes: ['/api/public'],
    })(req as any, res as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  it('should allow access with valid JWT token in Authorization header', async () => {
    const mockUser = { id: '123', role: 'user' };
    (jwt.verify as jest.Mock).mockReturnValueOnce(mockUser);
    
    const req = mockRequest({
      authorization: 'Bearer valid.token.here',
    });
    
    await authMiddleware()(req as any, mockResponse() as any, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith('valid.token.here', 'test-secret');
    expect(mockNext).toHaveBeenCalled();
    expect((mockNext.mock.calls[0][0] as any).user).toEqual(mockUser);
  });

  it('should allow access with valid JWT token in cookies', async () => {
    const mockUser = { id: '123', role: 'user' };
    (jwt.verify as jest.Mock).mockReturnValueOnce(mockUser);
    
    const req = mockRequest({}, {
      'auth-token': 'valid.token.here',
    });
    
    await authMiddleware({
      tokenSources: ['cookies'],
      cookieName: 'auth-token',
    })(req as any, mockResponse() as any, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith('valid.token.here', 'test-secret');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 for missing token', async () => {
    const req = mockRequest();
    const res = mockResponse();
    
    await authMiddleware()(req as any, res as any, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Authentication required',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid token', async () => {
    (jwt.verify as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });
    
    const req = mockRequest({
      authorization: 'Bearer invalid.token',
    });
    const res = mockResponse();
    
    await authMiddleware()(req as any, res as any, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid or expired token',
    });
  });

  it('should check user roles when requiredRoles is specified', async () => {
    const mockUser = { id: '123', role: 'user' };
    (jwt.verify as jest.Mock).mockReturnValueOnce(mockUser);
    
    const req = mockRequest({
      authorization: 'Bearer valid.token',
    });
    const res = mockResponse();
    
    await authMiddleware({
      requiredRoles: ['admin'],
    })(req as any, res as any, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Insufficient permissions',
    });
  });

  it('should allow access when user has required role', async () => {
    const mockUser = { id: '123', role: 'admin' };
    (jwt.verify as jest.Mock).mockReturnValueOnce(mockUser);
    
    const req = mockRequest({
      authorization: 'Bearer valid.admin.token',
    });
    
    await authMiddleware({
      requiredRoles: ['admin'],
    })(req as any, mockResponse() as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should check token in Redis if checkRevoked is true', async () => {
    const mockUser = { id: '123', role: 'user', jti: 'token-id' };
    (jwt.verify as jest.Mock).mockReturnValueOnce(mockUser);
    
    const redis = require('@/lib/redis');
    redis.get.mockResolvedValueOnce('revoked');
    
    const req = mockRequest({
      authorization: 'Bearer valid.but.revoked',
    });
    const res = mockResponse();
    
    await authMiddleware({
      checkRevoked: true,
    })(req as any, res as any, mockNext);

    expect(redis.get).toHaveBeenCalledWith(`token:revoked:${mockUser.jti}`);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Token has been revoked',
    });
  });

  it('should redirect to login for unauthorized API requests', async () => {
    const req = mockRequest();
    const res = mockResponse();
    
    await authMiddleware({
      loginPath: '/login',
      redirectToLogin: true,
    })(req as any, res as any, mockNext);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL('/login?redirect=%2Fapi%2Fprotected', 'http://localhost:3000')
    );
  });

  it('should set CORS headers when enabled', async () => {
    const mockUser = { id: '123', role: 'user' };
    (jwt.verify as jest.Mock).mockReturnValueOnce(mockUser);
    
    const req = mockRequest({
      authorization: 'Bearer valid.token',
      origin: 'http://example.com',
    });
    
    const response = await authMiddleware({
      cors: {
        origin: 'http://example.com',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
    })(req as any, mockResponse() as any, mockNext);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://example.com');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
  });

  it('should handle OPTIONS preflight requests', async () => {
    const req = mockRequest({
      'access-control-request-method': 'POST',
      origin: 'http://example.com',
    });
    req.method = 'OPTIONS';
    
    const response = await authMiddleware({
      cors: {
        origin: 'http://example.com',
      },
    })(req as any, mockResponse() as any, mockNext);

    expect(response.status).toBe(204);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should allow access to public paths with wildcard', async () => {
    const req = mockRequest();
    req.nextUrl.pathname = '/api/public/items/123';
    
    await authMiddleware({
      publicRoutes: ['/api/public/*'],
    })(req as any, mockResponse() as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should allow access based on custom validation function', async () => {
    const mockUser = { id: '123', role: 'user' };
    (jwt.verify as jest.Mock).mockReturnValueOnce(mockUser);
    
    const customValidator = jest.fn((user, req) => {
      return user.role === 'admin' || req.nextUrl.pathname.includes('profile');
    });
    
    const req = mockRequest({
      authorization: 'Bearer valid.token',
    });
    req.nextUrl.pathname = '/api/users/123/profile';
    
    await authMiddleware({
      validate: customValidator,
    })(req as any, mockResponse() as any, mockNext);

    expect(customValidator).toHaveBeenCalledWith(mockUser, expect.any(Object));
    expect(mockNext).toHaveBeenCalled();
  });
});
