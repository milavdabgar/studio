import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { 
          error: 'No authentication token found',
          code: 'NO_TOKEN'
        },
        { status: 401 }
      );
    }

    // Verify token and get user
    const user = await AuthService.verifyToken(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        currentRole: user.currentRole,
        roles: user.roles,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);

    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json(
          { 
            error: 'User not found',
            code: 'USER_NOT_FOUND'
          },
          { status: 404 }
        );
      }
      
      if (error.message === 'Account is deactivated') {
        return NextResponse.json(
          { 
            error: 'Account is deactivated',
            code: 'ACCOUNT_DEACTIVATED'
          },
          { status: 403 }
        );
      }
      
      if (error.message === 'Invalid or expired token') {
        return NextResponse.json(
          { 
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
          },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Token verification failed',
        code: 'VERIFICATION_ERROR'
      },
      { status: 500 }
    );
  }
}