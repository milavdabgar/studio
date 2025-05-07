
import { NextResponse, type NextRequest } from 'next/server';
import type { Faculty, User } from '@/types/entities'; // Updated User import
import { userService } from '@/lib/api/users'; 
import { instituteService } from '@/lib/api/institutes'; // To fetch institute domain

let facultyStore: Faculty[] = (global as any).__API_FACULTY_STORE__ || [];
if (!(global as any).__API_FACULTY_STORE__) {
  (global as any).__API_FACULTY_STORE__ = facultyStore;
}

const generateId = (): string => `fac_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const parseFullName = (fullName: string | undefined): { firstName?: string, middleName?: string, lastName?: string } => {
    if (!fullName) return {};
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0] };
    if (parts.length === 2) return { lastName: parts[0], firstName: parts[1] }; 
    return { lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') };
};

export async function GET() {
  return NextResponse.json(facultyStore);
}

export async function POST(request: NextRequest) {
  try {
    const facultyData = await request.json() as Omit<Faculty, 'id' | 'userId'> & { userId?: string, instituteId?: string }; // instituteId is for User creation

    if (!facultyData.staffCode || !facultyData.staffCode.trim()) {
      return NextResponse.json({ message: 'Staff Code is required.' }, { status: 400 });
    }
    if ((!facultyData.firstName || !facultyData.firstName.trim()) && (!facultyData.lastName || !facultyData.lastName.trim())) {
      return NextResponse.json({ message: 'First Name and Last Name are required if GTU Name is not provided.' }, { status: 400 });
    }
    if (!facultyData.instituteEmail || !facultyData.instituteEmail.trim()) {
        return NextResponse.json({ message: 'Institute Email is required.'}, {status: 400});
    }
    if (facultyStore.some(f => f.staffCode === facultyData.staffCode.trim())) {
      return NextResponse.json({ message: `Faculty with staff code '${facultyData.staffCode.trim()}' already exists.` }, { status: 409 });
    }
    if (facultyStore.some(f => f.instituteEmail.toLowerCase() === facultyData.instituteEmail.trim().toLowerCase())) {
      return NextResponse.json({ message: `Faculty with institute email '${facultyData.instituteEmail.trim()}' already exists.` }, { status: 409 });
    }
     if (facultyData.personalEmail && !/\S+@\S+\.\S+/.test(facultyData.personalEmail)) {
        return NextResponse.json({ message: 'Invalid personal email format.' }, { status: 400 });
    }


    const newFacultyId = generateId();
    const newFaculty: Faculty = {
      id: newFacultyId,
      ...facultyData,
    };
    
    // Create linked system user
    const displayName = facultyData.gtuName || `${facultyData.title || ''} ${facultyData.firstName || ''} ${facultyData.middleName || ''} ${facultyData.lastName || ''}`.replace(/\s+/g, ' ').trim() || facultyData.staffCode;
    
    let createdUserId: string | undefined;

    try {
        const userToCreate: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'authProviders' | 'isEmailVerified' | 'preferences'> & { password?: string } = {
            displayName,
            email: facultyData.personalEmail || facultyData.instituteEmail, // Use personal as primary if available, else institute
            instituteEmail: facultyData.instituteEmail,
            password: facultyData.staffCode, // Default password as staff code
            roles: ['faculty'], 
            isActive: facultyData.status === 'active',
            instituteId: facultyData.instituteId, // Pass instituteId for user creation
        };

        const createdUser = await userService.createUser(userToCreate);
        createdUserId = createdUser.id;
        newFaculty.userId = createdUserId; // Link faculty to the new user

    } catch (userCreationError: any) {
        if (userCreationError.message?.includes("already exists")) {
            console.warn(`System user with email ${facultyData.instituteEmail} or ${facultyData.personalEmail} already exists. Attempting to link faculty ${newFaculty.staffCode}.`);
            // Try to find existing user by instituteEmail or personalEmail
            const allUsers = await userService.getAllUsers();
            const existingUser = allUsers.find(u => u.instituteEmail === facultyData.instituteEmail || u.email === facultyData.personalEmail);
            if (existingUser) {
                newFaculty.userId = existingUser.id;
                 // Optionally update existing user's roles if needed
                if (!existingUser.roles.includes('faculty')) {
                    await userService.updateUser(existingUser.id, { roles: [...existingUser.roles, 'faculty'] });
                }
            } else {
                 console.error(`Could not link faculty ${newFaculty.staffCode} to an existing user despite 'already exists' error.`);
                 // Proceed without userId if linking fails after "already exists" error
            }
        } else {
          console.error(`Failed to create/link system user for new faculty ${newFaculty.staffCode}:`, userCreationError);
        }
    }
    
    facultyStore.push(newFaculty);
    (global as any).__API_FACULTY_STORE__ = facultyStore;

    return NextResponse.json(newFaculty, { status: 201 });
  } catch (error) {
    console.error('Error creating faculty:', error);
    return NextResponse.json({ message: 'Error creating faculty', error: (error as Error).message }, { status: 500 });
  }
}
