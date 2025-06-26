// Error Handler middleware
import { NextRequest, NextResponse } from 'next/server';
import { ValidationError } from 'yup';

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Authorization failed') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  public retryAfter?: number;
  public limit?: number;
  public remaining?: number;
  public reset?: number;
  
  constructor(message: string = 'Rate limit exceeded', options?: {
    retryAfter?: number;
    limit?: number;
    remaining?: number;
    reset?: number;
  }) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = options?.retryAfter;
    this.limit = options?.limit;
    this.remaining = options?.remaining;
    this.reset = options?.reset;
  }
}

export class CustomError extends Error {
  public statusCode: number;
  public data?: any;
  
  constructor(message: string, statusCode: number = 500, data?: any) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export const errorHandler = async (
  error: Error | unknown,
  req: NextRequest,
  res: any,
  next: Function
) => {
  // If no error, call next
  if (!error) {
    return next();
  }

  // Handle non-Error objects thrown as errors
  if (!(error instanceof Error)) {
    console.error('Non-Error object thrown:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }

  console.error(error);

  let status = 500;
  let responseData: any = {
    status: 'error',
    message: 'Internal server error',
  };
  let headers: Record<string, string> = {};

  // Handle Yup ValidationError
  if (error instanceof ValidationError) {
    status = 400;
    responseData = {
      status: 'error',
      message: error.message,
      errors: (error as any).inner?.map((err: any) => ({
        path: err.path,
        message: err.message,
      })) || [],
    };
  }
  // Handle custom errors
  else if (error instanceof AuthenticationError) {
    status = 401;
    responseData = {
      status: 'error',
      message: error.message,
    };
  }
  else if (error instanceof AuthorizationError) {
    status = 403;
    responseData = {
      status: 'error',
      message: error.message,
    };
  }
  else if (error instanceof NotFoundError) {
    status = 404;
    responseData = {
      status: 'error',
      message: error.message,
    };
  }
  else if (error instanceof RateLimitError) {
    status = 429;
    responseData = {
      status: 'error',
      message: error.message,
    };
    
    if (error.retryAfter) headers['Retry-After'] = String(error.retryAfter);
    if (error.limit) headers['X-RateLimit-Limit'] = String(error.limit);
    if (error.remaining !== undefined) headers['X-RateLimit-Remaining'] = String(error.remaining);
    if (error.reset) headers['X-RateLimit-Reset'] = String(error.reset);
  }
  else if (error instanceof CustomError) {
    status = error.statusCode;
    responseData = {
      status: 'error',
      message: error.message,
      ...(error.data && { data: error.data }),
    };
  }
  // Handle generic errors
  else {
    // In production, don't expose internal error messages
    if (process.env.NODE_ENV === 'production') {
      responseData.message = 'Internal server error';
    } else {
      responseData.message = error.message;
      responseData.stack = error.stack;
    }
  }

  return NextResponse.json(responseData, { 
    status, 
    ...(Object.keys(headers).length > 0 && { headers }) 
  });
};
