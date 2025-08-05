import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';
import { auditLogger } from '@/lib/audit/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { 
          error: 'Email and password are required',
          code: 'MISSING_CREDENTIALS'
        },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { 
          error: 'Invalid credentials format',
          code: 'INVALID_FORMAT'
        },
        { status: 400 }
      );
    }

    // Attempt login
    const result = await AuthService.login({ email, password });
    
    // Log successful login
    await auditLogger.logAction({
      userId: result.user.id,
      userEmail: result.user.email,
      userRole: result.user.currentRole,
      action: 'LOGIN',
      resource: 'authentication',
      status: 'success',
      details: {
        loginMethod: 'jwt',
        userAgent: request.headers.get('user-agent') || 'unknown',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      }
    });

    // Set secure HTTP-only cookie with token
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        currentRole: result.user.currentRole,
        roles: result.user.roles,
        isActive: result.user.isActive
      }
    });

    // Set token as HTTP-only cookie for security
    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    
    // Log failed login attempt
    try {
      const body = await request.json();
      const { email } = body;
      
      if (email) {
        await auditLogger.logAction({
          userId: 'unknown',
          userEmail: email,
          userRole: 'unknown',
          action: 'LOGIN_FAILED',
          resource: 'authentication',
          status: 'failed',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            userAgent: request.headers.get('user-agent') || 'unknown',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
          }
        });
      }
    } catch (auditError) {
      console.error('Failed to log failed login attempt:', auditError);
    }

    if (error instanceof Error) {
      if (error.message === 'Invalid credentials') {
        return NextResponse.json(
          { 
            error: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS'
          },
          { status: 401 }
        );
      }
      
      if (error.message === 'Account is deactivated') {
        return NextResponse.json(
          { 
            error: 'Account is deactivated. Please contact administrator.',
            code: 'ACCOUNT_DEACTIVATED'
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      },
      { status: 500 }
    );
  }
}