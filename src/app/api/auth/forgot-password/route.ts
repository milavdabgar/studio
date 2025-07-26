import { NextRequest, NextResponse } from 'next/server';
import { generateInstituteEmail } from '@/lib/config/email';
import emailService from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId } = body;

    // Validate input
    if (!studentId || typeof studentId !== 'string') {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Validate student ID format (basic validation)
    const studentIdPattern = /^[0-9]{2}[A-Z]{2,4}[0-9]{3}$/;
    if (!studentIdPattern.test(studentId.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid student ID format' },
        { status: 400 }
      );
    }

    // TODO: Check if student exists in database
    // For now, we'll assume the student exists
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // TODO: Store reset token in database with expiry
    // await storePasswordResetToken(studentId, resetToken, resetTokenExpiry);

    // Send email
    const emailSent = await emailService.sendPasswordResetEmail(studentId, resetToken);
    
    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send reset email' },
        { status: 500 }
      );
    }

    // Generate institute email for response
    const instituteEmail = generateInstituteEmail(studentId);

    return NextResponse.json({
      success: true,
      message: 'Password reset instructions sent to your institute email',
      instituteEmail,
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}