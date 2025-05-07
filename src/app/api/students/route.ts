
import { NextResponse, type NextRequest } from 'next/server';
import type { Student, User } from '@/types/entities'; // Updated User import
import { userService } from '@/lib/api/users'; 
import { instituteService } from '@/lib/api/institutes';

let studentsStore: Student[] = (global as any).__API_STUDENTS_STORE__ || [];
if (!(global as any).__API_STUDENTS_STORE__) {
  (global as any).__API_STUDENTS_STORE__ = studentsStore;
}

const generateId = (): string => `std_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const parseFullName = (fullName: string | undefined): { firstName?: string, middleName?: string, lastName?: string } => {
    if (!fullName) return {};
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0] };
    if (parts.length === 2) return { lastName: parts[0], firstName: parts[1] }; 
    return { lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') };
};

export async function GET() {
  return NextResponse.json(studentsStore);
}

export async function POST(request: NextRequest) {
  try {
    const studentData = await request.json() as Omit<Student, 'id' | 'userId'> & { userId?: string, instituteId?: string };

    if (!studentData.enrollmentNumber || !studentData.enrollmentNumber.trim()) {
      return NextResponse.json({ message: 'Enrollment Number is required.' }, { status: 400 });
    }
    if ((!studentData.gtuName || !studentData.gtuName.trim()) && (!studentData.firstName || !studentData.firstName.trim() || !studentData.lastName || !studentData.lastName.trim())) {
      return NextResponse.json({ message: 'Student Name (GTU Name or First/Last Name) is required.' }, { status: 400 });
    }
    if (!studentData.instituteEmail || !studentData.instituteEmail.trim()) {
        return NextResponse.json({ message: 'Institute Email is required.'}, {status: 400});
    }
    if (!studentData.programId) { // programId includes institute context
        return NextResponse.json({ message: 'Program ID (which implies Institute) is required.'}, {status: 400});
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

    const newStudentId = generateId();
    const newStudent: Student = {
      id: newStudentId,
      ...studentData,
    };
    
    const displayName = studentData.gtuName || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || studentData.enrollmentNumber;
    let createdUserId: string | undefined;
    
    // TODO: Extract instituteId from programId or pass it explicitly for User creation.
    // For now, assuming studentData includes an instituteId or it's derived.
    // Let's assume programId gives us a way to find the institute or instituteId is directly on studentData.
    // This part might need more robust logic if instituteId isn't directly available.
    const studentInstituteId = studentData.instituteId; // Placeholder
     if (!studentInstituteId) {
        console.warn(`instituteId is missing for student ${newStudent.enrollmentNumber}. Cannot create linked user account accurately without it.`);
        // Decide if user creation should proceed with a default/no instituteId or fail.
        // For now, let it proceed but log.
    }


    try {
        const userToCreate: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'authProviders' | 'isEmailVerified' | 'preferences'> & { password?: string } = {
            displayName,
            email: studentData.personalEmail || studentData.instituteEmail,
            instituteEmail: studentData.instituteEmail,
            password: studentData.enrollmentNumber, 
            roles: ['student'], 
            isActive: studentData.status === 'active',
            instituteId: studentInstituteId, // Pass the student's instituteId
        };

        const createdUser = await userService.createUser(userToCreate);
        createdUserId = createdUser.id;
        newStudent.userId = createdUserId;

    } catch (userCreationError: any) {
        if (userCreationError.message?.includes("already exists")) {
            console.warn(`System user with email ${studentData.instituteEmail} or ${studentData.personalEmail} already exists. Attempting to link student ${newStudent.enrollmentNumber}.`);
            const allUsers = await userService.getAllUsers();
            const existingUser = allUsers.find(u => u.instituteEmail === studentData.instituteEmail || u.email === studentData.personalEmail);
            if (existingUser) {
                newStudent.userId = existingUser.id;
                if (!existingUser.roles.includes('student')) {
                    await userService.updateUser(existingUser.id, { roles: [...existingUser.roles, 'student'] });
                }
            } else {
                 console.error(`Could not link student ${newStudent.enrollmentNumber} to an existing user despite 'already exists' error.`);
            }
        } else {
          console.error(`Failed to create/link system user for new student ${newStudent.enrollmentNumber}:`, userCreationError);
        }
    }
    
    studentsStore.push(newStudent);
    (global as any).__API_STUDENTS_STORE__ = studentsStore;

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ message: 'Error creating student', error: (error as Error).message }, { status: 500 });
  }
}
