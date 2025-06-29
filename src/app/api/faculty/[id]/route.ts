import { NextResponse, type NextRequest } from 'next/server';
import type { Faculty, User } from '@/types/entities'; 
import { userService } from '@/lib/api/users';
import { connectMongoose } from '@/lib/mongodb';
import { FacultyModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    
    const { id } = await params;
    
    // Try to find by custom id first, then by MongoDB _id if it's a valid ObjectId
    let faculty = await FacultyModel.findOne({ id }).lean();
    if (!faculty && id.match(/^[0-9a-fA-F]{24}$/)) {
      faculty = await FacultyModel.findById(id).lean();
    }
    
    if (faculty) {
      const facultyWithId = {
        ...faculty,
        id: faculty.id || (faculty as any)._id.toString()
      };
      return NextResponse.json(facultyWithId);
    }
    
    return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    return NextResponse.json({ 
      message: 'Internal server error during faculty fetch.', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    
    const { id } = await params;
    const facultyDataToUpdate = await request.json() as Partial<Omit<Faculty, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
    
    // Find the existing faculty
    let existingFaculty = await FacultyModel.findOne({ id }).lean();
    if (!existingFaculty && id.match(/^[0-9a-fA-F]{24}$/)) {
      existingFaculty = await FacultyModel.findById(id).lean();
    }
    
    if (!existingFaculty) {
      return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
    }

    // Check for duplicate staff code
    if (facultyDataToUpdate.staffCode && facultyDataToUpdate.staffCode.trim() !== existingFaculty.staffCode) {
      const duplicateStaffCode = await FacultyModel.findOne({
        staffCode: facultyDataToUpdate.staffCode.trim(),
        _id: { $ne: existingFaculty._id }
      });
      if (duplicateStaffCode) {
        return NextResponse.json({ message: `Staff code '${facultyDataToUpdate.staffCode.trim()}' already exists.` }, { status: 409 });
      }
    }

    // Check for duplicate institute email
    if (facultyDataToUpdate.instituteEmail && facultyDataToUpdate.instituteEmail.trim().toLowerCase() !== existingFaculty.instituteEmail?.toLowerCase()) {
      const duplicateEmail = await FacultyModel.findOne({
        instituteEmail: { $regex: new RegExp(`^${facultyDataToUpdate.instituteEmail.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        _id: { $ne: existingFaculty._id }
      });
      if (duplicateEmail) {
        return NextResponse.json({ message: `Institute email '${facultyDataToUpdate.instituteEmail.trim()}' is already in use.` }, { status: 409 });
      }
    }

    // Prepare update data
    const updateData: any = {
      ...facultyDataToUpdate,
      updatedAt: new Date().toISOString()
    };

    // Remove undefined fields and trim strings
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      } else if (typeof updateData[key] === 'string') {
        updateData[key] = updateData[key].trim();
      }
    });

    // Update the faculty
    const updatedFaculty = await FacultyModel.findOneAndUpdate(
      { _id: existingFaculty._id },
      updateData,
      { new: true, lean: true }
    );

    if (!updatedFaculty) {
      return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
    }

    // Update linked user if necessary
    if (updatedFaculty.userId) {
      try {
        const userUpdateData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> = {};
        let userNeedsUpdate = false;

        const newDisplayName = updatedFaculty.gtuName || `${updatedFaculty.title || ''} ${updatedFaculty.firstName || ''} ${updatedFaculty.middleName || ''} ${updatedFaculty.lastName || ''}`.replace(/\s+/g, ' ').trim() || updatedFaculty.staffCode;
        const existingUserRecord = await userService.getUserById(updatedFaculty.userId).catch(() => null);
        const oldUserDisplayName = existingUserRecord?.displayName || existingFaculty.gtuName;
        
        if (newDisplayName !== oldUserDisplayName) {
          userUpdateData.displayName = newDisplayName;
          userNeedsUpdate = true;
        }
        
        if (updatedFaculty.status === 'active' !== (existingUserRecord?.isActive ?? existingFaculty.status === 'active')) { 
          userUpdateData.isActive = updatedFaculty.status === 'active';
          userNeedsUpdate = true;
        }

        if (updatedFaculty.personalEmail && updatedFaculty.personalEmail !== existingFaculty.personalEmail) {
          userUpdateData.email = updatedFaculty.personalEmail;
          userNeedsUpdate = true;
        }
        
        if (updatedFaculty.instituteEmail && updatedFaculty.instituteEmail !== existingFaculty.instituteEmail) {
          userUpdateData.instituteEmail = updatedFaculty.instituteEmail;
          if (!updatedFaculty.personalEmail || existingUserRecord?.email === existingFaculty.instituteEmail) {
            userUpdateData.email = updatedFaculty.instituteEmail;
          }
          userNeedsUpdate = true;
        }

        // Update roles based on staffCategory if it changed
        if (updatedFaculty.staffCategory !== existingFaculty.staffCategory) {
          const baseRole = updatedFaculty.staffCategory === 'Teaching' ? 'faculty' : (updatedFaculty.staffCategory?.toLowerCase() + '_staff' as any) || 'faculty';
          if (existingUserRecord) {
            const newRoles = existingUserRecord.roles.filter(r => !r.endsWith('_staff') && r !== 'faculty');
            if (!newRoles.includes(baseRole)) {
              newRoles.push(baseRole);
            }
            userUpdateData.roles = newRoles;
            userNeedsUpdate = true;
          }
        }

        if (userNeedsUpdate) {
          await userService.updateUser(updatedFaculty.userId, userUpdateData);
        }
      } catch (userError) {
        console.error(`Failed to update linked system user ${updatedFaculty.userId} for faculty ${updatedFaculty.id}:`, userError);
      }
    }

    // Format response
    const facultyToReturn = {
      ...updatedFaculty,
      id: updatedFaculty.id || (updatedFaculty as any)._id.toString()
    };

    return NextResponse.json(facultyToReturn);
  } catch (error) {
    console.error(`Error updating faculty:`, error);
    return NextResponse.json({ message: `Error updating faculty`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    
    const { id } = await params;
    
    // Find and delete the faculty
    let deletedFaculty = await FacultyModel.findOneAndDelete({ id }).lean();
    if (!deletedFaculty && id.match(/^[0-9a-fA-F]{24}$/)) {
      deletedFaculty = await FacultyModel.findByIdAndDelete(id).lean();
    }

    if (!deletedFaculty) {
      return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
    }

    // Delete linked user if exists
    if (deletedFaculty.userId) {
      try {
        await userService.deleteUser(deletedFaculty.userId);
      } catch (userError: unknown) {
        const typedError = userError as Error & {data?: {message?: string}};
        if (typedError.message?.includes('Cannot delete this administrative user') || (typedError.data && typedError.data.message?.includes('administrative user'))) {
          console.warn(`Administrative user ${deletedFaculty.userId} linked to faculty ${id} was not deleted.`);
        } else {
          console.error(`Failed to delete linked system user ${deletedFaculty.userId} for faculty ${id}:`, userError);
        }
      }
    }

    return NextResponse.json({ message: 'Faculty deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting faculty:`, error);
    return NextResponse.json({ message: `Error deleting faculty`, error: (error as Error).message }, { status: 500 });
  }
}

