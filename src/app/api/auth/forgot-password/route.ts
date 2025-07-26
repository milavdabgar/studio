import { NextRequest, NextResponse } from 'next/server';
import { generateInstituteEmail } from '@/lib/config/email';
import emailService from '@/lib/email';
import { identifyUser, getUserTypeDisplayName } from '@/lib/utils/userIdentification';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userCode } = body;

    // Validate input
    if (!userCode || typeof userCode !== 'string') {
      return NextResponse.json(
        { error: 'Enrollment number or staff code is required' },
        { status: 400 }
      );
    }

    // Identify user type and validate format
    const identification = identifyUser(userCode.trim());
    if (!identification.isValid) {
      return NextResponse.json(
        { error: 'Invalid enrollment number or staff code format' },
        { status: 400 }
      );
    }

    // TODO: Check if user exists in database based on type
    // For students: check enrollment number in student records
    // For faculty: check staff code in faculty records
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // TODO: Store reset token in database with expiry
    // await storePasswordResetToken(identification.identifier, resetToken, resetTokenExpiry);

    // Send email
    const emailSent = await emailService.sendPasswordResetEmail(identification.identifier, resetToken);
    
    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send reset email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password reset instructions sent to ${getUserTypeDisplayName(identification.type).toLowerCase()} institute email`,
      instituteEmail: identification.instituteEmail,
      userType: identification.type,
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}