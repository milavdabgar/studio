import { NextResponse, type NextRequest } from 'next/server';
import type { Student, User } from '@/types/entities'; 
import { userService } from '@/lib/api/users';
import { connectMongoose } from '@/lib/mongodb';
import { StudentModel } from '@/lib/models';

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
    let student = await StudentModel.findOne({ id }).lean() as Student | null;
    if (!student && id.match(/^[0-9a-fA-F]{24}$/)) {
      student = await StudentModel.findById(id).lean() as Student | null;
    }
    
    if (student) {
      const studentWithId: Student = {
        ...student,
        id: student.id || (student as any)._id?.toString() || id
      };
      return NextResponse.json(studentWithId);
    }
    
    return NextResponse.json({ message: 'Student not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ 
      message: 'Internal server error during student fetch.', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    
    const { id } = await params;
    const studentDataToUpdate = await request.json() as Partial<Omit<Student, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
    
    // Find the existing student
    let existingStudent = await StudentModel.findOne({ id }).lean() as Student | null;
    if (!existingStudent && id.match(/^[0-9a-fA-F]{24}$/)) {
      existingStudent = await StudentModel.findById(id).lean() as Student | null;
    }
    
    if (!existingStudent) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    // Check for duplicate enrollment number
    if (studentDataToUpdate.enrollmentNumber && studentDataToUpdate.enrollmentNumber.trim() !== existingStudent.enrollmentNumber) {
      const duplicateEnrollment = await StudentModel.findOne({
        enrollmentNumber: studentDataToUpdate.enrollmentNumber.trim(),
        _id: { $ne: (existingStudent as any)._id }
      });
      if (duplicateEnrollment) {
        return NextResponse.json({ message: `Enrollment number '${studentDataToUpdate.enrollmentNumber.trim()}' already exists.` }, { status: 409 });
      }
    }

    // Check for duplicate institute email
    if (studentDataToUpdate.instituteEmail && studentDataToUpdate.instituteEmail.trim().toLowerCase() !== existingStudent.instituteEmail?.toLowerCase()) {
      const duplicateEmail = await StudentModel.findOne({
        instituteEmail: { $regex: new RegExp(`^${studentDataToUpdate.instituteEmail.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        _id: { $ne: (existingStudent as any)._id }
      });
      if (duplicateEmail) {
        return NextResponse.json({ message: `Institute email '${studentDataToUpdate.instituteEmail.trim()}' is already in use.` }, { status: 409 });
      }
    }

    // Prepare update data
    const updateData: any = {
      ...studentDataToUpdate,
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

    // Update the student
    const updatedStudent = await StudentModel.findOneAndUpdate(
      { _id: (existingStudent as any)._id },
      updateData,
      { new: true, lean: true }
    ) as Student | null;

    if (!updatedStudent) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    // Update linked user if necessary
    if (updatedStudent.userId) {
      try {
        const userUpdateData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> = {};
        let userNeedsUpdate = false;

        const newDisplayName = updatedStudent.fullNameGtuFormat || `${updatedStudent.firstName || ''} ${updatedStudent.lastName || ''}`.trim() || updatedStudent.enrollmentNumber;
        const existingUserRecord = await userService.getUserById(updatedStudent.userId).catch(() => null);
        const oldUserDisplayName = existingUserRecord?.displayName || existingStudent.fullNameGtuFormat || `${existingStudent.firstName || ''} ${existingStudent.lastName || ''}`.trim();
        
        if (newDisplayName !== oldUserDisplayName) {
          userUpdateData.displayName = newDisplayName;
          userNeedsUpdate = true;
        }
        
        if (updatedStudent.status === 'active' !== (existingUserRecord?.isActive ?? existingStudent.isActive)) { 
          userUpdateData.isActive = updatedStudent.status === 'active';
          userNeedsUpdate = true;
        }

        if (updatedStudent.personalEmail && updatedStudent.personalEmail !== (existingUserRecord?.email === existingStudent.instituteEmail ? existingStudent.personalEmail : existingUserRecord?.email)) {
          userUpdateData.email = updatedStudent.personalEmail;
          userNeedsUpdate = true;
        }
        
        if (updatedStudent.instituteEmail && updatedStudent.instituteEmail !== existingStudent.instituteEmail) {
          userUpdateData.instituteEmail = updatedStudent.instituteEmail;
          if (!updatedStudent.personalEmail || existingUserRecord?.email === existingStudent.instituteEmail) {
            userUpdateData.email = updatedStudent.instituteEmail;
          }
          userNeedsUpdate = true;
        }

        if (updatedStudent.photoURL && updatedStudent.photoURL !== existingStudent.photoURL) {
          userUpdateData.photoURL = updatedStudent.photoURL;
          userNeedsUpdate = true;
        }

        if (userNeedsUpdate) {
          await userService.updateUser(updatedStudent.userId, userUpdateData);
        }
      } catch (userError) {
        console.error(`Failed to update linked system user ${updatedStudent.userId} for student ${updatedStudent.id}:`, userError);
      }
    }

    // Format response
    const studentToReturn: Student = {
      ...updatedStudent,
      id: updatedStudent.id || (updatedStudent as any)._id?.toString() || id
    };

    return NextResponse.json(studentToReturn);
  } catch (error) {
    console.error(`Error updating student:`, error);
    return NextResponse.json({ message: `Error updating student`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    
    const { id } = await params;
    
    // Find and delete the student
    let deletedStudent = await StudentModel.findOneAndDelete({ id }).lean() as Student | null;
    if (!deletedStudent && id.match(/^[0-9a-fA-F]{24}$/)) {
      deletedStudent = await StudentModel.findByIdAndDelete(id).lean() as Student | null;
    }

    if (!deletedStudent) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    // Delete linked user if exists
    if (deletedStudent.userId) {
      try {
        await userService.deleteUser(deletedStudent.userId);
      } catch (userError: unknown) {
        const typedError = userError as Error & {data?: {message?: string}};
        if (typedError.message?.includes('Cannot delete this administrative user') || (typedError.data && typedError.data.message?.includes('administrative user'))) {
          console.warn(`Administrative user ${deletedStudent.userId} linked to student ${id} was not deleted.`);
        } else {
          console.error(`Failed to delete linked system user ${deletedStudent.userId} for student ${id}:`, userError);
        }
      }
    }

    return NextResponse.json({ message: 'Student deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting student:`, error);
    return NextResponse.json({ message: `Error deleting student`, error: (error as Error).message }, { status: 500 });
  }
}