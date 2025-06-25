import { NextResponse } from 'next/server';
import { errorHandler } from '../errorHandler';
import { ValidationError } from 'yup';
import { AuthenticationError, AuthorizationError, NotFoundError, RateLimitError } from '@/lib/errors';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      ...init,
      json: () => Promise.resolve(data),
    })),
  },
}));

describe('errorHandler Middleware', () => {
  const mockRequest = () => ({});
  
  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  });

  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should handle ValidationError from Yup', async () => {
    const error = new ValidationError('Validation failed');
    error.inner = [
      { path: 'email', message: 'Invalid email', type: 'email' },
      { path: 'password', message: 'Password is required', type: 'required' },
    ];

    const req = mockRequest();
    const res = mockResponse();

    await errorHandler(error, req as any, res as any, mockNext);

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        status: 'error',
        message: 'Validation failed',
        errors: [
          { path: 'email', message: 'Invalid email' },
          { path: 'password', message: 'Password is required' },
        ],
      },
      { status: 400 }
    );
  });

  it('should handle AuthenticationError with 401 status', async () => {
    const error = new AuthenticationError('Invalid credentials');
    
    const req = mockRequest();
    const res = mockResponse();

    await errorHandler(error, req as any, res as any, mockNext);

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        status: 'error',
        message: 'Invalid credentials',
      },
      { status: 401 }
    );
  });

  it('should handle AuthorizationError with 403 status', async () => {
    const error = new AuthorizationError('Insufficient permissions');
    
    const req = mockRequest();
    const res = mockResponse();

    await errorHandler(error, req as any, res as any, mockNext);

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        status: 'error',
        message: 'Insufficient permissions',
      },
      { status: 403 }
    );
  });

  it('should handle NotFoundError with 404 status', async () => {
    const error = new NotFoundError('User not found');
    
    const req = mockRequest();
    const res = mockResponse();

    await errorHandler(error, req as any, res as any, mockNext);

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        status: 'error',
        message: 'User not found',
      },
      { status: 404 }
    );
  });

  it('should handle RateLimitError with 429 status', async () => {
    const error = new RateLimitError('Too many requests');
    
    const req = mockRequest();
    const res = mockResponse();

    await errorHandler(error, req as any, res as any, mockNext);

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        status: 'error',
        message: 'Too many requests',
      },
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': expect.any(Number)
        }
      }
    );
  });

  it('should handle generic Error with 500 status', async () => {
    const error = new Error('Something went wrong');
    
    const req = mockRequest();
    const res = mockResponse();

    await errorHandler(error, req as any, res as any, mockNext);

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        status: 'error',
        message: 'Internal server error',
      },
      { status: 500 }
    );
    expect(console.error).toHaveBeenCalledWith('Unhandled error:', error);
  });

  it('should handle custom error with additional data', async () => {
    class CustomError extends Error {
      statusCode: number;
      data: any;
      
      constructor(message: string, statusCode: number, data: any) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
      }
    }

    const error = new CustomError('Custom error', 400, { field: 'value' });
    
    const req = mockRequest();
    const res = mockResponse();

    await errorHandler(error, req as any, res as any, mockNext);

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        status: 'error',
        message: 'Custom error',
        data: { field: 'value' },
      },
      { status: 400 }
    );
  });

  it('should handle non-Error objects', async () => {
    const error = 'This is a string error';
    
    const req = mockRequest();
    const res = mockResponse();

    await errorHandler(error as any, req as any, res as any, mockNext);

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        status: 'error',
        message: 'Internal server error',
      },
      { status: 500 }
    );
    expect(console.error).toHaveBeenCalledWith('Non-Error object thrown:', error);
  });

  it('should handle errors in production mode', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const error = new Error('Sensitive error message');
    
    const req = mockRequest();
    const res = mockResponse();

    await errorHandler(error, req as any, res as any, mockNext);

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        status: 'error',
        message: 'Internal server error',
      },
      { status: 500 }
    );

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should include stack trace in development mode', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const error = new Error('Test error');
    
    const req = mockRequest();
    const res = mockResponse();

    await errorHandler(error, req as any, res as any, mockNext);

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        status: 'error',
        message: 'Test error',
        stack: expect.any(String),
      },
      { status: 500 }
    );

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should call next if no error is provided', async () => {
    const req = mockRequest();
    const res = mockResponse();

    await errorHandler(undefined, req as any, res as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(NextResponse.json).not.toHaveBeenCalled();
  });
});
