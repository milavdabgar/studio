import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';
import { auditLogger } from '@/lib/audit/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, displayName, fullName, roles, currentRole } = body;

    // Validate input
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { 
          error: 'Email, password, and display name are required',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || typeof password !== 'string' || typeof displayName !== 'string') {
      return NextResponse.json(
        { 
          error: 'Invalid field formats',
          code: 'INVALID_FORMAT'
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { 
          error: 'Password must be at least 8 characters long',
          code: 'WEAK_PASSWORD'
        },
        { status: 400 }
      );
    }

    // Validate roles
    const validRoles = ['student', 'faculty', 'admin', 'hod', 'super_admin'];
    const userRoles = roles && Array.isArray(roles) ? roles : ['student'];
    const userCurrentRole = currentRole || 'student';

    if (!validRoles.includes(userCurrentRole)) {
      return NextResponse.json(
        { 
          error: 'Invalid current role',
          code: 'INVALID_ROLE'
        },
        { status: 400 }
      );
    }

    // Attempt registration
    const user = await AuthService.register({
      email,
      password,
      displayName,
      fullName: fullName || displayName,
      roles: userRoles,
      currentRole: userCurrentRole
    });
    
    // Log successful registration
    await auditLogger.logAction({
      userId: user.id,
      userEmail: user.email,
      userRole: user.currentRole,
      action: 'USER_REGISTRATION',
      resource: 'authentication',
      status: 'success',
      details: {
        registrationMethod: 'jwt',
        userAgent: request.headers.get('user-agent') || 'unknown',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        roles: user.roles
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        currentRole: user.currentRole,
        roles: user.roles,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Log failed registration attempt
    try {
      const body = await request.json();
      const { email } = body;
      
      if (email) {
        await auditLogger.logAction({
          userId: 'unknown',
          userEmail: email,
          userRole: 'unknown',
          action: 'REGISTRATION_FAILED',
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
      console.error('Failed to log failed registration attempt:', auditError);
    }

    if (error instanceof Error) {
      if (error.message === 'Email already registered') {
        return NextResponse.json(
          { 
            error: 'An account with this email already exists',
            code: 'EMAIL_EXISTS'
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Registration failed',
        code: 'REGISTRATION_ERROR'
      },
      { status: 500 }
    );
  }
}