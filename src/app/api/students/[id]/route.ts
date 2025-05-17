

import { NextResponse, type NextRequest } from 'next/server';
import type { Student, User } from '@/types/entities'; // Updated User import
import { userService } from '@/lib/api/users'; 

let studentsStore: Student[] = (global as any).__API_STUDENTS_STORE__ || [];
if (!(global as any).__API_STUDENTS_STORE__) {
  (global as any).__API_STUDENTS_STORE__ = studentsStore;
}

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const student = studentsStore.find(s => s.id === id);
  if (student) {
    return NextResponse.json(student);
  }
  return NextResponse.json({ message: 'Student not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const studentDataToUpdate = await request.json() as Partial<Omit<Student, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
    const studentIndex = studentsStore.findIndex(s => s.id === id);

    if (studentIndex === -1) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }
    const existingStudent = studentsStore[studentIndex];
    
    if (studentDataToUpdate.enrollmentNumber && studentDataToUpdate.enrollmentNumber.trim() !== existingStudent.enrollmentNumber && studentsStore.some(s => s.id !== id && s.enrollmentNumber === studentDataToUpdate.enrollmentNumber!.trim())) {
        return NextResponse.json({ message: `Enrollment number '${studentDataToUpdate.enrollmentNumber.trim()}' already exists.` }, { status: 409 });
    }
    if (studentDataToUpdate.instituteEmail && studentDataToUpdate.instituteEmail.trim().toLowerCase() !== existingStudent.instituteEmail?.toLowerCase() && studentsStore.some(s => s.id !== id && s.instituteEmail?.toLowerCase() === studentDataToUpdate.instituteEmail!.trim().toLowerCase())) {
        return NextResponse.json({ message: `Institute email '${studentDataToUpdate.instituteEmail.trim()}' is already in use.` }, { status: 409 });
    }


    const updatedStudent: Student = { 
      ...existingStudent,
      // Apply only the fields that are present in studentDataToUpdate
      ...(studentDataToUpdate.enrollmentNumber && { enrollmentNumber: studentDataToUpdate.enrollmentNumber.trim() }),
      ...(studentDataToUpdate.gtuEnrollmentNumber && { gtuEnrollmentNumber: studentDataToUpdate.gtuEnrollmentNumber.trim() }),
      ...(studentDataToUpdate.programId && { programId: studentDataToUpdate.programId }),
      ...(studentDataToUpdate.department && { department: studentDataToUpdate.department }),
      ...(studentDataToUpdate.batchId && { batchId: studentDataToUpdate.batchId }),
      ...(studentDataToUpdate.currentSemester && { currentSemester: studentDataToUpdate.currentSemester }),
      ...(studentDataToUpdate.admissionDate && { admissionDate: studentDataToUpdate.admissionDate }),
      ...(studentDataToUpdate.category && { category: studentDataToUpdate.category }),
      ...(studentDataToUpdate.shift && { shift: studentDataToUpdate.shift }),
      ...(studentDataToUpdate.isComplete !== undefined && { isComplete: studentDataToUpdate.isComplete }),
      ...(studentDataToUpdate.termClose !== undefined && { termClose: studentDataToUpdate.termClose }),
      ...(studentDataToUpdate.isCancel !== undefined && { isCancel: studentDataToUpdate.isCancel }),
      ...(studentDataToUpdate.isPassAll !== undefined && { isPassAll: studentDataToUpdate.isPassAll }),
      ...(studentDataToUpdate.fullNameGtuFormat && { fullNameGtuFormat: studentDataToUpdate.fullNameGtuFormat.trim() }),
      ...(studentDataToUpdate.firstName && { firstName: studentDataToUpdate.firstName.trim() }),
      ...(studentDataToUpdate.middleName !== undefined && { middleName: studentDataToUpdate.middleName.trim() || undefined }),
      ...(studentDataToUpdate.lastName && { lastName: studentDataToUpdate.lastName.trim() }),
      ...(studentDataToUpdate.gender && { gender: studentDataToUpdate.gender }),
      ...(studentDataToUpdate.dateOfBirth && { dateOfBirth: studentDataToUpdate.dateOfBirth }),
      ...(studentDataToUpdate.bloodGroup && { bloodGroup: studentDataToUpdate.bloodGroup }),
      ...(studentDataToUpdate.aadharNumber && { aadharNumber: studentDataToUpdate.aadharNumber.trim() }),
      ...(studentDataToUpdate.personalEmail !== undefined && { personalEmail: studentDataToUpdate.personalEmail.trim() || undefined }),
      ...(studentDataToUpdate.instituteEmail && { instituteEmail: studentDataToUpdate.instituteEmail.trim() }),
      ...(studentDataToUpdate.contactNumber !== undefined && { contactNumber: studentDataToUpdate.contactNumber.trim() || undefined }),
      ...(studentDataToUpdate.address !== undefined && { address: studentDataToUpdate.address.trim() || undefined }),
      ...(studentDataToUpdate.guardianDetails && { guardianDetails: studentDataToUpdate.guardianDetails }),
      ...(studentDataToUpdate.status && { status: studentDataToUpdate.status }),
      ...(studentDataToUpdate.convocationYear && { convocationYear: studentDataToUpdate.convocationYear }),
      ...(studentDataToUpdate.instituteId && { instituteId: studentDataToUpdate.instituteId }),
      ...(studentDataToUpdate.photoURL !== undefined && { photoURL: studentDataToUpdate.photoURL.trim() || undefined }),
      // Semester statuses update
      ...(studentDataToUpdate.sem1Status && { sem1Status: studentDataToUpdate.sem1Status }),
      ...(studentDataToUpdate.sem2Status && { sem2Status: studentDataToUpdate.sem2Status }),
      ...(studentDataToUpdate.sem3Status && { sem3Status: studentDataToUpdate.sem3Status }),
      ...(studentDataToUpdate.sem4Status && { sem4Status: studentDataToUpdate.sem4Status }),
      ...(studentDataToUpdate.sem5Status && { sem5Status: studentDataToUpdate.sem5Status }),
      ...(studentDataToUpdate.sem6Status && { sem6Status: studentDataToUpdate.sem6Status }),
      ...(studentDataToUpdate.sem7Status && { sem7Status: studentDataToUpdate.sem7Status }),
      ...(studentDataToUpdate.sem8Status && { sem8Status: studentDataToUpdate.sem8Status }),
      ...(studentDataToUpdate.academicRemarks !== undefined && { academicRemarks: studentDataToUpdate.academicRemarks.trim() || undefined }),
      updatedAt: new Date().toISOString(), // Always update the timestamp
    };

    studentsStore[studentIndex] = updatedStudent;
    (global as any).__API_STUDENTS_STORE__ = studentsStore;

    if (updatedStudent.userId) {
        const userUpdateData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> = {};
        let userNeedsUpdate = false;

        const newDisplayName = updatedStudent.fullNameGtuFormat || `${updatedStudent.firstName || ''} ${updatedStudent.lastName || ''}`.trim() || updatedStudent.enrollmentNumber;
        // Check against existing displayName on User record if available, else derive from existingStudent
        const existingUserRecord = await userService.getUserById(updatedStudent.userId).catch(() => null);
        const oldUserDisplayName = existingUserRecord?.displayName || existingStudent.fullNameGtuFormat || `${existingStudent.firstName || ''} ${existingStudent.lastName || ''}`.trim();
        
        if (newDisplayName !== oldUserDisplayName) {
             userUpdateData.displayName = newDisplayName;
             userNeedsUpdate = true;
        }
        if (updatedStudent.status === 'active' !== (existingUserRecord?.isActive ?? existingStudent.isActive) ) { 
             userUpdateData.isActive = updatedStudent.status === 'active';
             userNeedsUpdate = true;
        }

        if (updatedStudent.personalEmail && updatedStudent.personalEmail !== (existingUserRecord?.email === existingStudent.instituteEmail ? existingStudent.personalEmail : existingUserRecord?.email)){
            userUpdateData.email = updatedStudent.personalEmail; // Primary email for User is personal if available
            userNeedsUpdate = true;
        }
        if (updatedStudent.instituteEmail && updatedStudent.instituteEmail !== existingStudent.instituteEmail) {
            userUpdateData.instituteEmail = updatedStudent.instituteEmail;
            // If personalEmail was not set, or if instituteEmail was primary, update User.email
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
            try {
                await userService.updateUser(updatedStudent.userId, userUpdateData);
            } catch(userError) {
                console.error(`Failed to update linked system user ${updatedStudent.userId} for student ${updatedStudent.id}:`, userError);
            }
        }
    }

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error(`Error updating student ${id}:`, error);
    return NextResponse.json({ message: `Error updating student ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const studentIndex = studentsStore.findIndex(s => s.id === id);

  if (studentIndex === -1) {
    return NextResponse.json({ message: 'Student not found' }, { status: 404 });
  }
  
  const deletedStudent = studentsStore.splice(studentIndex, 1)[0];
  (global as any).__API_STUDENTS_STORE__ = studentsStore;

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
}

```
  </change>
  <change>
    <file>/