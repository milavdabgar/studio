// Error Handler middleware
import { NextRequest, NextResponse } from 'next/server';

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
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export const errorHandler = (error: Error) => {
  let status = 500;
  let message = 'Internal Server Error';

  if (error instanceof AuthenticationError) {
    status = 401;
    message = error.message;
  } else if (error instanceof AuthorizationError) {
    status = 403;
    message = error.message;
  } else if (error instanceof NotFoundError) {
    status = 404;
    message = error.message;
  } else if (error instanceof RateLimitError) {
    status = 429;
    message = error.message;
  }

  return NextResponse.json({ error: message }, { status });
};
