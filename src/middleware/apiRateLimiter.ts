// API Rate Limiter middleware
import { NextResponse } from 'next/server';

export const apiRateLimiter = (_options?: any) => {
  return async (_req?: any, _res?: any, _next?: any) => {
    // Mock implementation - in real app would use Redis/IORedis
    return NextResponse.next();
  };
};
