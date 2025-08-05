import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';
import { auditLogger } from '@/lib/audit/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle password reset request
    if (body.email && !body.token && !body.newPassword) {
      const { email } = body;

      if (!email || typeof email !== 'string') {
        return NextResponse.json(
          { 
            error: 'Email is required',
            code: 'MISSING_EMAIL'
          },
          { status: 400 }
        );
      }

      // Request password reset
      const result = await AuthService.requestPasswordReset(email);
      
      // Log password reset request
      await auditLogger.logAction({
        userId: 'unknown',
        userEmail: email,
        userRole: 'unknown',
        action: 'PASSWORD_RESET_REQUESTED',
        resource: 'authentication',
        status: 'success',
        details: {
          userAgent: request.headers.get('user-agent') || 'unknown',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset instructions sent to your email',
        // Don't return the actual token for security
      });
    }
    
    // Handle password reset with token
    if (body.token && body.newPassword) {
      const { token, newPassword } = body;

      if (!token || !newPassword || typeof token !== 'string' || typeof newPassword !== 'string') {
        return NextResponse.json(
          { 
            error: 'Token and new password are required',
            code: 'MISSING_FIELDS'
          },
          { status: 400 }
        );
      }

      // Validate password strength
      if (newPassword.length < 8) {
        return NextResponse.json(
          { 
            error: 'Password must be at least 8 characters long',
            code: 'WEAK_PASSWORD'
          },
          { status: 400 }
        );
      }

      // Reset password
      await AuthService.resetPassword(token, newPassword);
      
      // Log successful password reset (we can't get user info from expired token)
      await auditLogger.logAction({
        userId: 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        action: 'PASSWORD_RESET_COMPLETED',
        resource: 'authentication',
        status: 'success',
        details: {
          userAgent: request.headers.get('user-agent') || 'unknown',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully'
      });
    }

    return NextResponse.json(
      { 
        error: 'Invalid request. Either provide email for reset request or token and newPassword for reset.',
        code: 'INVALID_REQUEST'
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Password reset error:', error);
    
    // Log failed password reset attempt
    try {
      const body = await request.json();
      const { email } = body;
      
      await auditLogger.logAction({
        userId: 'unknown',
        userEmail: email || 'unknown',
        userRole: 'unknown',
        action: 'PASSWORD_RESET_FAILED',
        resource: 'authentication',
        status: 'failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          userAgent: request.headers.get('user-agent') || 'unknown',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        }
      });
    } catch (auditError) {
      console.error('Failed to log failed password reset attempt:', auditError);
    }

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
      
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return NextResponse.json(
          { 
            error: 'Invalid or expired reset token',
            code: 'INVALID_TOKEN'
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Password reset failed',
        code: 'RESET_ERROR'
      },
      { status: 500 }
    );
  }
}