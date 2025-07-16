import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { UserModel, StudentModel } from '@/lib/models';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    // Check if the ID is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const userToDelete = await UserModel.findById(id);
    if (!userToDelete) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Prevent deletion of a super_admin or a primary admin email
    if (userToDelete.roles.includes('super_admin') || userToDelete.email === "admin@gppalanpur.in" || userToDelete.instituteEmail === "admin@gppalanpur.in") {
        return NextResponse.json({ message: 'Cannot delete this administrative user.' }, { status: 403 });
    }

    // Delete all role-specific data associated with this user
    try {
      // Delete student record if user has student role
      if (userToDelete.roles.includes('student')) {
        const studentRecord = await StudentModel.findOne({ userId: id });
        if (studentRecord) {
          await StudentModel.findByIdAndDelete(studentRecord._id);
          console.log(`Deleted student record for user ${id}`);
        }
      }
      
      // Add more role-specific cleanup here as needed
      // if (userToDelete.roles.includes('faculty')) {
      //   // Delete faculty record
      // }
      
      // if (userToDelete.roles.includes('staff')) {
      //   // Delete staff record
      // }
      
    } catch (cleanupError) {
      console.error(`Error cleaning up role-specific data during complete deletion:`, cleanupError);
      // Continue with user deletion even if some cleanup fails
    }

    // Delete the user
    await UserModel.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      message: 'User and all associated data deleted successfully' 
    }, { status: 200 });
    
  } catch (error) {
    console.error(`Error completely deleting user:`, error);
    return NextResponse.json({ message: 'Error deleting user' }, { status: 500 });
  }
}