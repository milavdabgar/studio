// Rate Limit middleware
import { NextRequest, NextResponse } from 'next/server';

export const rateLimit = (_options: { windowMs: number; max: number }) => {
  return async (_req: NextRequest) => {
    // Mock implementation - in real app would use Redis
    return NextResponse.next();
  };
};
