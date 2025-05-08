
import { NextResponse, type NextRequest } from 'next/server';
import type { Student, User, Program, Institute } from '@/types/entities'; 
import { userService } from '@/lib/api/users'; 
import { instituteService } from '@/lib/api/institutes';
import { programService } from '@/lib/api/programs';


declare global {
  var __API_STUDENTS_STORE__: Student[] | undefined;
}
const now = new Date().toISOString();

if (!global.__API_STUDENTS_STORE__ || global.__API_STUDENTS_STORE__.length === 0) {
  global.__API_STUDENTS_STORE__ = [
    {
      id: "std_ce_001_gpp",
      userId: "user_student_ce001_gpp", // Link to an existing User ID
      enrollmentNumber: "220010107001",
      gtuEnrollmentNumber: "220010107001",
      programId: "prog_dce_gpp", // Link to an existing Program ID
      department: "dept_ce_gpp", // Department ID from program
      batchId: "batch_dce_2022_gpp", // Link to an existing Batch ID
      currentSemester: 3,
      admissionDate: "2022-07-01T00:00:00.000Z",
      category: "OPEN",
      shift: "Morning",
      isComplete: false,
      termClose: false,
      isCancel: false,
      isPassAll: false,
      sem1Status: "Passed",
      sem2Status: "Passed",
      sem3Status: "Pending",
      fullNameGtuFormat: "DOE JOHN MICHAEL",
      firstName: "JOHN",
      middleName: "MICHAEL",
      lastName: "DOE",
      gender: "Male",
      dateOfBirth: "2003-08-15T00:00:00.000Z",
      personalEmail: "student.ce001@example.com",
      instituteEmail: "220010107001@gppalanpur.ac.in",
      contactNumber: "9988776655",
      status: "active",
      instituteId: "inst1",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "std_me_002_gpp",
      userId: "user_student_me002_gpp", // Link to an existing User ID
      enrollmentNumber: "220010108002",
      gtuEnrollmentNumber: "220010108002",
      programId: "prog_dme_gpp", 
      department: "dept_me_gpp",
      batchId: "batch_dme_2023_gpp", 
      currentSemester: 1,
      admissionDate: "2023-07-10T00:00:00.000Z",
      category: "SEBC",
      shift: "Afternoon",
      isComplete: false,
      termClose: false,
      isCancel: false,
      isPassAll: true, // Assuming passed first sem
      sem1Status: "Passed",
      fullNameGtuFormat: "SMITH JANE ANNA",
      firstName: "JANE",
      middleName: "ANNA",
      lastName: "SMITH",
      gender: "Female",
      dateOfBirth: "2004-01-20T00:00:00.000Z",
      personalEmail: "student.me002@example.com",
      instituteEmail: "220010108002@gppalanpur.ac.in",
      contactNumber: "9876500002",
      status: "active",
      instituteId: "inst1",
      createdAt: now,
      updatedAt: now,
    }
  ];
}
const studentsStore: Student[] = global.__API_STUDENTS_STORE__;

const generateId = (): string => `std_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  return NextResponse.json(studentsStore);
}

export async function POST(request: NextRequest) {
  try {
    const studentData = await request.json() as Omit<Student, 'id' | 'userId'> & { userId?: string, instituteId?: string };

    if (!studentData.enrollmentNumber || !studentData.enrollmentNumber.trim()) {
      return NextResponse.json({ message: 'Enrollment Number is required.' }, { status: 400 });
    }
    if ((!studentData.fullNameGtuFormat || !studentData.fullNameGtuFormat.trim()) && (!studentData.firstName || !studentData.firstName.trim() || !studentData.lastName || !studentData.lastName.trim())) {
      return NextResponse.json({ message: 'Student Name (GTU Format or First/Last Name) is required.' }, { status: 400 });
    }
    
    if (!studentData.programId) { 
        return NextResponse.json({ message: 'Program ID (which implies Institute) is required.'}, {status: 400});
    }

    let studentInstituteId = studentData.instituteId;
    if (!studentInstituteId) {
        const programs = await programService.getAllPrograms();
        const program = programs.find(p => p.id === studentData.programId);
        if (program && program.instituteId) {
            studentInstituteId = program.instituteId;
        } else {
            console.warn(`Could not determine instituteId for student ${studentData.enrollmentNumber} from program ${studentData.programId}. User account linking might be inaccurate.`);
            // Fallback or error if institute is strictly required for user creation.
            // For now, let it proceed, but User creation might use a default or fail if institute is mandatory there.
        }
    }


    let instituteDomain = 'gpp.ac.in'; // Default domain
    if (studentInstituteId) {
        try {
            const institute = await instituteService.getInstituteById(studentInstituteId);
            if (institute && institute.domain) {
                instituteDomain = institute.domain;
            }
        } catch (error) {
            console.warn(`Error fetching institute ${studentInstituteId} for domain: ${(error as Error).message}. Using default domain '${instituteDomain}'.`);
        }
    } else {
         console.warn(`Institute ID not determined for student ${studentData.enrollmentNumber}. Using default domain '${instituteDomain}' for institute email generation.`);
    }
    const instituteEmail = studentData.instituteEmail?.trim() || `${studentData.enrollmentNumber.trim()}@${instituteDomain}`;


    if (studentsStore.some(s => s.enrollmentNumber === studentData.enrollmentNumber.trim())) {
      return NextResponse.json({ message: `Student with enrollment number '${studentData.enrollmentNumber.trim()}' already exists.` }, { status: 409 });
    }
    if (studentsStore.some(s => s.instituteEmail.toLowerCase() === instituteEmail.toLowerCase())) {
      return NextResponse.json({ message: `Student with institute email '${instituteEmail}' already exists.` }, { status: 409 });
    }
     if (studentData.personalEmail && !/\S+@\S+\.\S+/.test(studentData.personalEmail)) {
        return NextResponse.json({ message: 'Invalid personal email format.' }, { status: 400 });
    }

    const newStudentId = generateId();
    const newStudent: Student = {
      id: newStudentId,
      ...studentData,
      instituteEmail,
      instituteId: studentInstituteId, // Ensure instituteId is set on the student record
    };
    
    const displayName = studentData.fullNameGtuFormat || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || studentData.enrollmentNumber;
    let createdUserId: string | undefined;
    
    try {
        const userToCreate: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'authProviders' | 'isEmailVerified' | 'preferences'> & { password?: string } = {
            displayName,
            email: studentData.personalEmail || instituteEmail, // Use personal as primary if available
            instituteEmail: instituteEmail,
            password: studentData.enrollmentNumber, // Default password as enrollment number
            roles: ['student'], 
            isActive: studentData.status === 'active',
            instituteId: studentInstituteId, 
            fullName: studentData.fullNameGtuFormat || `${studentData.lastName || ''} ${studentData.firstName || ''} ${studentData.middleName || ''}`.trim(),
            firstName: studentData.firstName,
            middleName: studentData.middleName,
            lastName: studentData.lastName,
        };

        const createdUser = await userService.createUser(userToCreate);
        createdUserId = createdUser.id;
        newStudent.userId = createdUserId;

    } catch (userCreationError: any) {
        if (userCreationError.message?.includes("already exists")) {
            console.warn(`System user with email ${instituteEmail} or ${studentData.personalEmail} already exists. Attempting to link student ${newStudent.enrollmentNumber}.`);
            const allUsers = await userService.getAllUsers();
            const existingUser = allUsers.find(u => u.instituteEmail === instituteEmail || u.email === studentData.personalEmail);
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
    global.__API_STUDENTS_STORE__ = studentsStore;

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ message: 'Error creating student', error: (error as Error).message }, { status: 500 });
  }
}
