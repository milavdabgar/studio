// Rate Limit middleware
import { NextResponse } from 'next/server';

export const rateLimit = (_options?: unknown) => {
  void _options; // Unused in mock implementation
  return async (_req?: unknown, _res?: unknown, _next?: unknown) => {
    void _req; // Unused in mock implementation
    void _res; // Unused in mock implementation
    void _next; // Unused in mock implementation
    // Mock implementation - in real app would use Redis
    return NextResponse.next();
  };
};
