// Rate Limit middleware
import { NextResponse } from 'next/server';

export const rateLimit = (_options?: any) => {
  return async (_req?: any, _res?: any, _next?: any) => {
    // Mock implementation - in real app would use Redis
    return NextResponse.next();
  };
};
