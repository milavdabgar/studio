// Auth middleware
import { NextRequest, NextResponse } from 'next/server';

export const authMiddleware = async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  
  const token = authHeader.replace('Bearer ', '').trim();
  
  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  // Mock implementation - in real app would verify JWT
  return NextResponse.next();
};
