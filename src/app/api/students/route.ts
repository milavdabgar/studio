
import { NextResponse, type NextRequest } from 'next/server';
import type { Student, SystemUser } from '@/types/entities';
import { userService } from '@/lib/api/users'; // For creating linked user

// In-memory store (replace with DB)
let studentsStore: Student[] = (global as any).__API_STUDENTS_STORE__ || [];
if (!(global as any).__API_STUDENTS_STORE__) {
  (global as any).__API_STUDENTS_STORE__ = studentsStore;
}

const generateId = (): string => `std_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  return NextResponse.json(studentsStore);
}

export async function POST(request: NextRequest) {
  try {
    const studentData = await request.json() as Omit<Student, 'id'>;

    if (!studentData.enrollmentNumber || !studentData.enrollmentNumber.trim()) {
      return NextResponse.json({ message: 'Enrollment Number is required.' }, { status: 400 });
    }
    if ((!studentData.gtuName || !studentData.gtuName.trim()) && (!studentData.firstName || !studentData.firstName.trim() || !studentData.lastName || !studentData.lastName.trim())) {
      return NextResponse.json({ message: 'Student Name (GTU Name or First/Last Name) is required.' }, { status: 400 });
    }
    if (!studentData.instituteEmail || !studentData.instituteEmail.trim()) {
        return NextResponse.json({ message: 'Institute Email is required.'}, {status: 400});
    }
    if (studentsStore.some(s => s.enrollmentNumber === studentData.enrollmentNumber.trim())) {
      return NextResponse.json({ message: `Student with enrollment number '${studentData.enrollmentNumber.trim()}' already exists.` }, { status: 409 });
    }
    if (studentsStore.some(s => s.instituteEmail.toLowerCase() === studentData.instituteEmail.trim().toLowerCase())) {
      return NextResponse.json({ message: `Student with institute email '${studentData.instituteEmail.trim()}' already exists.` }, { status: 409 });
    }
     if (studentData.personalEmail && !/\S+@\S+\.\S+/.test(studentData.personalEmail)) {
        return NextResponse.json({ message: 'Invalid personal email format.' }, { status: 400 });
    }

    const newStudent: Student = {
      id: generateId(),
      ...studentData,
    };
    studentsStore.push(newStudent);
    (global as any).__API_STUDENTS_STORE__ = studentsStore;

    // Create linked system user
    const systemUserName = newStudent.gtuName || `${newStudent.firstName || ''} ${newStudent.lastName || ''}`.trim() || newStudent.enrollmentNumber;
    try {
        await userService.createUser({
            name: systemUserName,
            email: newStudent.instituteEmail, // Use institute email for login
            password: newStudent.enrollmentNumber, // Default password as enrollment number
            roles: ['student'], // Default role
            status: newStudent.status === 'active' ? 'active' : 'inactive', // Sync status
            department: newStudent.department,
        });
    } catch (userCreationError: any) {
        if (userCreationError.message?.includes("already exists")) {
            console.warn(`System user with email ${newStudent.instituteEmail} already exists. Student ${newStudent.enrollmentNumber} created, but check user linkage.`);
        } else {
          console.error(`Failed to create system user for new student ${newStudent.enrollmentNumber}:`, userCreationError);
        }
    }

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ message: 'Error creating student', error: (error as Error).message }, { status: 500 });
  }
}
