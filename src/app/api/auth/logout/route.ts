import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/middleware/authMiddleware';
import { auditLogger } from '@/lib/audit/audit-logger';

export async function POST(request: NextRequest) {
  try {
    // Get user info from request if available
    const user = getUserFromRequest(request);
    
    // Log logout event
    if (user) {
      await auditLogger.logAction({
        userId: user.id.toString(),
        userEmail: user.email,
        userRole: user.role || 'unknown',
        action: 'LOGOUT',
        resource: 'authentication',
        status: 'success',
        details: {
          userAgent: request.headers.get('user-agent') || 'unknown',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        }
      });
    }

    // Clear the auth token cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    // Also clear the legacy auth_user cookie if it exists
    response.cookies.set('auth_user', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear cookies even if logging fails
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    response.cookies.set('auth_user', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;
  }
}