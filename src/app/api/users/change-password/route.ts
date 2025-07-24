import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import { z } from 'zod';
import bcrypt from 'bcrypt';

// Validation schema for password change
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
  userEmail: z.string().email('Valid email is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New password and confirmation password don't match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const requestData = await request.json();
    
    // Validate input data
    const validationResult = changePasswordSchema.safeParse(requestData);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors;
      return NextResponse.json({ 
        message: 'Validation failed', 
        errors: errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }
    
    const { currentPassword, newPassword, userEmail } = validationResult.data;
    
    // Find user by email
    const user = await UserModel.findOne({ 
      email: { $regex: new RegExp(`^${userEmail.trim()}$`, 'i') } 
    });
    
    if (!user) {
      return NextResponse.json({ 
        message: 'User not found' 
      }, { status: 404 });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ 
        message: 'Current password is incorrect' 
      }, { status: 400 });
    }
    
    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    
    if (isSamePassword) {
      return NextResponse.json({ 
        message: 'New password must be different from current password' 
      }, { status: 400 });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    // Update user password
    await UserModel.findByIdAndUpdate(user._id, {
      password: hashedNewPassword,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      message: 'Password changed successfully' 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ 
      message: 'Internal server error during password change',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}