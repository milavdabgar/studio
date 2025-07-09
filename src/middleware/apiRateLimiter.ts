// API Rate Limiter middleware
import { NextRequest, NextResponse } from 'next/server';

export const apiRateLimiter = (_options: { requests: number; window: number }) => {
  return async (_req: NextRequest) => {
    // Mock implementation - in real app would use Redis/IORedis
    return NextResponse.next();
  };
};
