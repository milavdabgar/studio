
import { NextResponse, type NextRequest } from 'next/server';
import { instituteService } from '@/lib/api/institutes';
import { connectMongoose } from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import mongoose from 'mongoose';
import { z } from 'zod';
import bcrypt from 'bcrypt';


interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Validation schema for updates
const updateUserSchema = z.object({
  displayName: z.string().min(1).optional(),
  fullName: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  instituteEmail: z.string().optional(),
  password: z.string().min(8).optional(),
  roles: z.array(z.string()).min(1).optional(),
  phoneNumber: z.string().optional(),
  departmentId: z.string().optional(),
  instituteId: z.string().optional(),
  isActive: z.boolean().optional(),
  username: z.string().optional(),
  middleName: z.string().optional(),
  photoURL: z.string().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']),
    language: z.string()
  }).optional()
}).partial();

const parseFullName = (fullName: string | undefined): { firstName?: string, middleName?: string, lastName?: string } => {
    if (!fullName) return {};
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0] };
    if (parts.length === 2) return { lastName: parts[0], firstName: parts[1] }; // Assuming SURNAME NAME
    return { lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    // Check if the ID is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const user = await UserModel.findById(id).select('-password');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ message: 'Error fetching user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    // Check if the ID is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const requestData = await request.json();
    
    // Validate input data
    const validationResult = updateUserSchema.safeParse(requestData);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        message: 'Validation failed', 
        errors: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }
    
    const userDataToUpdate = validationResult.data;

    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Prevent changing email of existing user for simplicity, or handle uniqueness check
    if (userDataToUpdate.email && userDataToUpdate.email.trim().toLowerCase() !== existingUser.email.toLowerCase()) {
       const emailExists = await UserModel.findOne({ 
         _id: { $ne: id }, 
         email: { $regex: new RegExp(`^${userDataToUpdate.email.trim()}$`, 'i') } 
       });
       if (emailExists) {
            return NextResponse.json({ message: `Personal email '${userDataToUpdate.email.trim()}' is already in use by another user.` }, { status: 409 });
       }
    }
    
    if (userDataToUpdate.instituteEmail && userDataToUpdate.instituteEmail.trim().toLowerCase() !== existingUser.instituteEmail?.toLowerCase()) {
       const instituteEmailExists = await UserModel.findOne({ 
         _id: { $ne: id }, 
         instituteEmail: { $regex: new RegExp(`^${userDataToUpdate.instituteEmail.trim()}$`, 'i') } 
       });
       if (instituteEmailExists) {
            return NextResponse.json({ message: `Institute email '${userDataToUpdate.instituteEmail.trim()}' is already in use by another user.` }, { status: 409 });
       }
    }
    
    // Hash password if provided
    if (userDataToUpdate.password) {
      userDataToUpdate.password = await bcrypt.hash(userDataToUpdate.password, 12);
    }
    
    let newInstituteEmail = existingUser.instituteEmail;
    if (userDataToUpdate.instituteId && userDataToUpdate.instituteId !== existingUser.instituteId) {
        // Institute changed, or name changed, so regenerate institute email
        let instituteDomain = 'example.com';
        try {
            const institute = await instituteService.getInstituteById(userDataToUpdate.instituteId);
            if (institute && institute.domain) instituteDomain = institute.domain;
        } catch {
          /* ignore, use default */
        }

        const displayName = userDataToUpdate.displayName || userDataToUpdate.fullName || existingUser.displayName;
        const { firstName, lastName } = parseFullName(userDataToUpdate.fullName || displayName);
        
        let baseEmail = `${(firstName || 'user').toLowerCase()}.${(lastName || existingUser.id.substring(0,4)).toLowerCase()}`;
        if (!firstName && !lastName) baseEmail = existingUser.email.split('@')[0];

        newInstituteEmail = `${baseEmail}@${instituteDomain}`;
        let emailSuffix = 1;
        const originalBase = baseEmail;
        while(true) {
          const emailExists = await UserModel.findOne({ 
            _id: { $ne: id }, 
            instituteEmail: { $regex: new RegExp(`^${newInstituteEmail}$`, 'i') } 
          });
          if (!emailExists) break;
          newInstituteEmail = `${originalBase}${emailSuffix}@${instituteDomain}`;
          emailSuffix++;
        }
    }

    // Update user data (excluding password if not provided)
    const { password, ...otherUpdates } = userDataToUpdate;
    const updateData: Record<string, unknown> = { 
        ...otherUpdates,
        displayName: userDataToUpdate.displayName || userDataToUpdate.fullName || existingUser.displayName,
        updatedAt: new Date().toISOString(),
        instituteEmail: newInstituteEmail // Update institute email if it changed
    };

    if (password) {
      updateData.password = password; 
    }
    
    const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(`Error updating user:`, error);
    return NextResponse.json({ message: `Error updating user` }, { status: 500 });
  }
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

    await UserModel.findByIdAndDelete(id);
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting user:`, error);
    return NextResponse.json({ message: 'Error deleting user' }, { status: 500 });
  }
}
