
import { NextResponse, type NextRequest } from 'next/server';
import type { Student, SystemUser } from '@/types/entities';
import { userService } from '@/lib/api/users'; // For updating/deleting linked user

// In-memory store (replace with DB)
let studentsStore: Student[] = (global as any).__API_STUDENTS_STORE__ || [];
if (!(global as any).__API_STUDENTS_STORE__) {
  (global as any).__API_STUDENTS_STORE__ = studentsStore;
}

interface RouteParams {
  params: {
    id: string;
  };
}

const findUserByStudentEmail = async (email: string): Promise<SystemUser | undefined> => {
    const users = await userService.getAllUsers(); 
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};


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

    // Update linked system user if email or name changes
    const linkedUser = await findUserByStudentEmail(existingStudent.instituteEmail);
    if (linkedUser) {
        const userUpdateData: Partial<SystemUser> = {
            name: updatedStudent.gtuName || `${updatedStudent.firstName || ''} ${updatedStudent.lastName || ''}`.trim() || updatedStudent.enrollmentNumber,
            status: updatedStudent.status === 'active' ? 'active' : 'inactive',
            department: updatedStudent.department,
        };
        // Assuming instituteEmail (login email) does not change after creation for simplicity here
        try {
            await userService.updateUser(linkedUser.id, userUpdateData);
        } catch(userError) {
            console.error(`Failed to update linked system user ${linkedUser.id} for student ${updatedStudent.id}:`, userError);
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

  const linkedUser = await findUserByStudentEmail(deletedStudent.instituteEmail);
  if (linkedUser) {
      try {
          await userService.deleteUser(linkedUser.id);
      } catch (userError) {
          console.error(`Failed to delete linked system user ${linkedUser.id} for student ${id}:`, userError);
      }
  }

  return NextResponse.json({ message: 'Student deleted successfully' }, { status: 200 });
}
