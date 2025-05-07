
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
    const studentData = await request.json() as Partial<Omit<Student, 'id'>>;
    const studentIndex = studentsStore.findIndex(s => s.id === id);

    if (studentIndex === -1) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }
    const existingStudent = studentsStore[studentIndex];
    
    if (studentData.enrollmentNumber && studentData.enrollmentNumber.trim() !== existingStudent.enrollmentNumber && studentsStore.some(s => s.id !== id && s.enrollmentNumber === studentData.enrollmentNumber!.trim())) {
        return NextResponse.json({ message: `Enrollment number '${studentData.enrollmentNumber.trim()}' already exists.` }, { status: 409 });
    }
     if (studentData.instituteEmail && studentData.instituteEmail.trim().toLowerCase() !== existingStudent.instituteEmail.toLowerCase() && studentsStore.some(s => s.id !== id && s.instituteEmail.toLowerCase() === studentData.instituteEmail!.trim().toLowerCase())) {
        return NextResponse.json({ message: `Institute email '${studentData.instituteEmail.trim()}' is already in use.` }, { status: 409 });
    }


    const updatedStudent = { ...existingStudent, ...studentData };
    studentsStore[studentIndex] = updatedStudent;
    (global as any).__API_STUDENTS_STORE__ = studentsStore;

    if (updatedStudent.userId) {
        const userUpdateData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> = { // Use Omit User
            displayName: updatedStudent.gtuName || `${updatedStudent.firstName || ''} ${updatedStudent.lastName || ''}`.trim() || updatedStudent.enrollmentNumber,
            isActive: updatedStudent.status === 'active',
            // department is on Student model, User's instituteId needs to be accurate
        };
         if (updatedStudent.instituteEmail.toLowerCase() !== existingStudent.instituteEmail.toLowerCase()) {
            userUpdateData.instituteEmail = updatedStudent.instituteEmail;
             if (existingStudent.personalEmail === existingStudent.instituteEmail) { 
                userUpdateData.email = updatedStudent.personalEmail || updatedStudent.instituteEmail;
             }
        }
        if(updatedStudent.personalEmail && updatedStudent.personalEmail !== existingStudent.personalEmail){
            userUpdateData.email = updatedStudent.personalEmail;
        }

        try {
            await userService.updateUser(updatedStudent.userId, userUpdateData);
        } catch(userError) {
            console.error(`Failed to update linked system user ${updatedStudent.userId} for student ${updatedStudent.id}:`, userError);
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
      } catch (userError: any) {
           if (userError.message?.includes('Cannot delete this administrative user')) {
            console.warn(`Administrative user ${deletedStudent.userId} linked to student ${id} was not deleted.`);
          } else {
            console.error(`Failed to delete linked system user ${deletedStudent.userId} for student ${id}:`, userError);
          }
      }
  }

  return NextResponse.json({ message: 'Student deleted successfully' }, { status: 200 });
}
