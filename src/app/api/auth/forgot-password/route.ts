import { NextRequest, NextResponse } from 'next/server';
import { generateInstituteEmail } from '@/lib/config/email';
import emailService from '@/lib/email';
import { identifyUser, getUserTypeDisplayName, UserType } from '@/lib/utils/userIdentification';
import { connectMongoose } from '@/lib/mongodb';
import { FacultyModel } from '@/lib/models';
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

    await connectMongoose();

    let actualInstituteEmail = identification.instituteEmail;
    let userName = identification.identifier;

    // For faculty, resolve staff code to actual email
    if (identification.type === UserType.FACULTY) {
      try {
        const faculty = await FacultyModel.findOne({ 
          staffCode: identification.identifier 
        }).select('staffCode instituteEmail firstName lastName name').lean() as any;
        
        if (faculty) {
          actualInstituteEmail = faculty.instituteEmail;
          userName = faculty.name || `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim();
        } else {
          return NextResponse.json(
            { error: 'Faculty member not found in database' },
            { status: 404 }
          );
        }
      } catch (error) {
        console.error('Error resolving faculty email:', error);
        return NextResponse.json(
          { error: 'Failed to resolve faculty information' },
          { status: 500 }
        );
      }
    }

    // TODO: Check if user exists in database based on type
    // For students: check enrollment number in student records
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // TODO: Store reset token in database with expiry
    // await storePasswordResetToken(identification.identifier, resetToken, resetTokenExpiry);

    // Send email using the resolved email
    const emailSent = await emailService.sendPasswordResetEmail(actualInstituteEmail, resetToken);
    
    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send reset email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password reset instructions sent to ${getUserTypeDisplayName(identification.type).toLowerCase()} institute email`,
      instituteEmail: actualInstituteEmail,
      userType: identification.type,
      userName: userName,
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}