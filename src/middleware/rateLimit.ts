// Rate Limit middleware
import { NextResponse } from 'next/server';

export const rateLimit = () => {
  return async () => {
    // Mock implementation - in real app would use Redis
    return NextResponse.next();
  };
};
