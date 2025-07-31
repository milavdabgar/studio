import { NextResponse, type NextRequest } from 'next/server';
import type { Student, User } from '@/types/entities'; 
import { userService } from '@/lib/api/users'; 
import { instituteService } from '@/lib/api/institutes';
import { programService } from '@/lib/api/programs';
import { connectMongoose } from '@/lib/mongodb';
import { StudentModel } from '@/lib/models';

const generateId = (): string => `std_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  try {
    await connectMongoose();
    
    const students = await StudentModel.find({}).lean();
    const studentsWithId = students.map(student => ({
      ...student,
      id: student.id || (student as { _id: unknown })._id?.toString(),
      fullName: student.fullNameGtuFormat || `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.replace(/\s+/g, ' ').trim(),
      // Keep both email field and personalEmail for backward compatibility
      email: student.instituteEmail || student.personalEmail || '',
      personalEmail: student.personalEmail || student.instituteEmail || '',
      // Ensure status field is returned according to Student interface
      status: student.status || (student.isActive ? 'active' : 'inactive')
    }));
    
    return NextResponse.json(studentsWithId);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ 
      message: 'Internal server error during student fetch.', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const studentData = await request.json() as Omit<Student, 'id' | 'userId'> & { userId?: string, instituteId?: string };

    if (!studentData.enrollmentNumber || (typeof studentData.enrollmentNumber === 'string' && !studentData.enrollmentNumber.trim())) {
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
        }
    }

    let instituteDomain = 'gppalanpur.ac.in'; // Default domain
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

    // Check for existing students
    const existingEnrollmentStudent = await StudentModel.findOne({ 
      enrollmentNumber: studentData.enrollmentNumber.trim() 
    });
    if (existingEnrollmentStudent) {
      return NextResponse.json({ message: `Student with enrollment number '${studentData.enrollmentNumber.trim()}' already exists.` }, { status: 409 });
    }
    
    const existingEmailStudent = await StudentModel.findOne({ 
      instituteEmail: { $regex: new RegExp(`^${instituteEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (existingEmailStudent) {
      return NextResponse.json({ message: `Student with institute email '${instituteEmail}' already exists.` }, { status: 409 });
    }
    
    if (studentData.personalEmail && !/\S+@\S+\.\S+/.test(studentData.personalEmail)) {
        return NextResponse.json({ message: 'Invalid personal email format.' }, { status: 400 });
    }

    const currentTimestamp = new Date().toISOString();
    const newStudentData = {
      id: generateId(),
      ...studentData,
      instituteEmail,
      instituteId: studentInstituteId,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const displayName = studentData.fullNameGtuFormat || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || studentData.enrollmentNumber;
    let createdUserId: string | undefined;
    
    try {
        const userToCreate: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'authProviders' | 'isEmailVerified' | 'preferences'> & { password?: string } = {
            displayName,
            email: instituteEmail, // Use institute email as primary login email
            instituteEmail: instituteEmail,
            password: studentData.enrollmentNumber, // Default password as enrollment number
            roles: ['student'], 
            currentRole: 'student',
            isActive: studentData.status === 'active',
            instituteId: studentInstituteId, 
            fullName: studentData.fullNameGtuFormat || `${studentData.lastName || ''} ${studentData.firstName || ''} ${studentData.middleName || ''}`.trim(),
            firstName: studentData.firstName,
            middleName: studentData.middleName,
            lastName: studentData.lastName,
        };

        const createdUser = await userService.createUser(userToCreate);
        createdUserId = createdUser.id;
        newStudentData.userId = createdUserId;

    } catch (userCreationError: unknown) {
        if ((userCreationError as Error).message?.includes("already exists")) {
            console.warn(`System user with email ${instituteEmail} or ${studentData.personalEmail} already exists. Attempting to link student ${newStudentData.enrollmentNumber}.`);
            const allUsers = await userService.getAllUsers();
            const existingUser = allUsers.find(u => u.instituteEmail === instituteEmail || u.email === studentData.personalEmail);
            if (existingUser) {
                newStudentData.userId = existingUser.id;
                if (!existingUser.roles.includes('student')) {
                    await userService.updateUser(existingUser.id, { roles: [...existingUser.roles, 'student'] });
                }
            } else {
                 console.error(`Could not link student ${newStudentData.enrollmentNumber} to an existing user despite 'already exists' error.`);
            }
        } else {
          console.error(`Failed to create/link system user for new student ${newStudentData.enrollmentNumber}:`, userCreationError);
        }
    }
    
    const newStudent = new StudentModel(newStudentData);
    await newStudent.save();
    
    // Return student with properly formatted id and computed fields
    const studentToReturn = {
      ...newStudent.toJSON(),
      fullName: newStudent.fullNameGtuFormat || `${newStudent.firstName || ''} ${newStudent.middleName || ''} ${newStudent.lastName || ''}`.replace(/\s+/g, ' ').trim(),
      email: newStudent.instituteEmail || newStudent.personalEmail || ''
    };

    return NextResponse.json(studentToReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    
    // SECURITY FIX: Handle validation errors properly
    if (error instanceof Error && error.message.includes('validation failed')) {
      return NextResponse.json({ 
        message: 'Validation failed. Please check your input data.', 
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      message: 'Error creating student',
      error: error instanceof Error ? error.message : 'Database save failed'
    }, { status: 500 });
  }
}