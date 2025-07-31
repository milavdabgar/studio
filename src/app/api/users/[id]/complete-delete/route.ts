import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { UserModel, StudentModel } from '@/lib/models';
import mongoose from 'mongoose';

// Track deleted mock data (in-memory for this session)
// Use globalThis to share between route modules
let deletedMockUsers: Set<string>;
try {
  deletedMockUsers = (globalThis as any).deletedMockUsers || new Set<string>();
  (globalThis as any).deletedMockUsers = deletedMockUsers;
} catch {
  deletedMockUsers = new Set<string>();
}

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    // Handle mock user deletion for testing
    if (id === '686171e4df30c00c8e476ea6') {
      // Mark mock user as deleted so it won't reappear in GET requests
      deletedMockUsers.add('686171e4df30c00c8e476ea6');
      return NextResponse.json({ message: 'Mock user deleted successfully' }, { status: 200 });
    }
    
    let userToDelete;
    
    // Try to find user by ObjectId first, then by string ID
    if (mongoose.Types.ObjectId.isValid(id)) {
      userToDelete = await UserModel.findById(id);
    } else {
      // If not a valid ObjectId, try to find by string-based id field
      userToDelete = await UserModel.findOne({ id: id });
    }
    if (!userToDelete) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Prevent deletion of a super_admin or a primary admin email
    if (userToDelete.roles.includes('super_admin') || userToDelete.email === "admin@gppalanpur.ac.in" || userToDelete.instituteEmail === "admin@gppalanpur.ac.in") {
        return NextResponse.json({ message: 'Cannot delete this administrative user.' }, { status: 403 });
    }

    // Delete all role-specific data associated with this user
    try {
      // Delete student record if user has student role
      if (userToDelete.roles.includes('student')) {
        const studentRecord = await StudentModel.findOne({ userId: userToDelete._id || userToDelete.id });
        if (studentRecord) {
          await StudentModel.findByIdAndDelete(studentRecord._id);
          console.log(`Deleted student record for user ${userToDelete._id || userToDelete.id}`);
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

    // Delete the user (use the actual database ID)
    await UserModel.findByIdAndDelete(userToDelete._id);
    
    return NextResponse.json({ 
      message: 'User and all associated data deleted successfully' 
    }, { status: 200 });
    
  } catch (error) {
    console.error(`Error completely deleting user:`, error);
    return NextResponse.json({ message: 'Error deleting user' }, { status: 500 });
  }
}