import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { UserModel, StudentModel } from '@/lib/models';
import mongoose from 'mongoose';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const removeRoleSchema = z.object({
  roleToRemove: z.string().min(1, 'Role to remove is required')
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    // Check if the ID is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const requestData = await request.json();
    
    // Validate input data
    const validationResult = removeRoleSchema.safeParse(requestData);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        message: 'Validation failed', 
        errors: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }
    
    const { roleToRemove } = validationResult.data;
    
    const user = await UserModel.findById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Prevent removal of super_admin role or removal from primary admin
    if (roleToRemove === 'super_admin' || user.email === "admin@gppalanpur.ac.in" || user.instituteEmail === "admin@gppalanpur.ac.in") {
      return NextResponse.json({ message: 'Cannot remove administrative privileges from this user.' }, { status: 403 });
    }
    
    // Check if user has this role
    if (!user.roles.includes(roleToRemove)) {
      return NextResponse.json({ message: `User does not have role '${roleToRemove}'` }, { status: 400 });
    }
    
    // Remove role-specific data based on the role being removed
    try {
      if (roleToRemove === 'student') {
        // Find and delete student record
        const studentRecord = await StudentModel.findOne({ userId: id });
        if (studentRecord) {
          await StudentModel.findByIdAndDelete(studentRecord._id);
          console.log(`Deleted student record for user ${id}`);
        }
      }
      
      // Add more role-specific cleanup here as needed
      // if (roleToRemove === 'faculty') {
      //   // Delete faculty record
      // }
      
    } catch (cleanupError) {
      console.error(`Error cleaning up role-specific data for ${roleToRemove}:`, cleanupError);
      // Continue with role removal even if cleanup fails
    }
    
    // Remove the role from user's roles array
    const updatedRoles = user.roles.filter((role: string) => role !== roleToRemove);
    
    if (updatedRoles.length === 0) {
      // If no roles left, delete the user completely
      await UserModel.findByIdAndDelete(id);
      return NextResponse.json({ 
        userDeleted: true, 
        message: `Role '${roleToRemove}' removed. User deleted as it was their last role.` 
      });
    } else {
      // Update user with remaining roles
      const updatedUser = await UserModel.findByIdAndUpdate(
        id, 
        { 
          roles: updatedRoles,
          currentRole: updatedRoles.includes(user.currentRole) ? user.currentRole : updatedRoles[0],
          updatedAt: new Date().toISOString()
        }, 
        { new: true }
      ).select('-password');
      
      return NextResponse.json({ 
        userDeleted: false, 
        message: `Role '${roleToRemove}' removed successfully.`,
        user: updatedUser 
      });
    }
    
  } catch (error) {
    console.error(`Error removing role:`, error);
    return NextResponse.json({ message: `Error removing role` }, { status: 500 });
  }
}