// Auth middleware
import { NextRequest, NextResponse } from 'next/server';

export const authMiddleware = async (req: NextRequest) => {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  // Mock implementation - in real app would verify JWT
  return NextResponse.next();
};
