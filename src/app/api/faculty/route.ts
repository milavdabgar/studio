
import { NextResponse, type NextRequest } from 'next/server';
import type { Faculty, SystemUser } from '@/types/entities';
import { userService } from '@/lib/api/users'; // For creating linked user

// In-memory store (replace with DB)
let facultyStore: Faculty[] = (global as any).__API_FACULTY_STORE__ || [];
if (!(global as any).__API_FACULTY_STORE__) {
  (global as any).__API_FACULTY_STORE__ = facultyStore;
}

const generateId = (): string => `fac_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  return NextResponse.json(facultyStore);
}

export async function POST(request: NextRequest) {
  try {
    const facultyData = await request.json() as Omit<Faculty, 'id'>;

    if (!facultyData.staffCode || !facultyData.staffCode.trim()) {
      return NextResponse.json({ message: 'Staff Code is required.' }, { status: 400 });
    }
    if (!facultyData.firstName || !facultyData.firstName.trim() || !facultyData.lastName || !facultyData.lastName.trim()) {
      return NextResponse.json({ message: 'First Name and Last Name are required.' }, { status: 400 });
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


    const newFaculty: Faculty = {
      id: generateId(),
      ...facultyData,
    };
    facultyStore.push(newFaculty);
    (global as any).__API_FACULTY_STORE__ = facultyStore;

    // Create linked system user
    const systemUserName = newFaculty.gtuName || `${newFaculty.title || ''} ${newFaculty.firstName || ''} ${newFaculty.middleName || ''} ${newFaculty.lastName || ''}`.replace(/\s+/g, ' ').trim() || newFaculty.staffCode;
    try {
        await userService.createUser({
            name: systemUserName,
            email: newFaculty.instituteEmail, // Use institute email for login
            password: newFaculty.staffCode, // Default password as staff code
            roles: ['faculty'], // Default role
            status: newFaculty.status === 'active' ? 'active' : 'inactive', // Sync status
            department: newFaculty.department,
        });
    } catch (userCreationError: any) {
        // If user already exists (e.g. due to race condition or prior manual creation), log it.
        // Don't fail faculty creation if user creation fails due to existing email,
        // but log other errors.
        if (userCreationError.message?.includes("already exists")) {
            console.warn(`System user with email ${newFaculty.instituteEmail} already exists. Faculty ${newFaculty.staffCode} created, but check user linkage.`);
        } else {
          console.error(`Failed to create system user for new faculty ${newFaculty.staffCode}:`, userCreationError);
          // Optionally, roll back faculty creation or mark as needing user setup
          // For now, let faculty creation succeed and log the user creation issue.
        }
    }

    return NextResponse.json(newFaculty, { status: 201 });
  } catch (error) {
    console.error('Error creating faculty:', error);
    return NextResponse.json({ message: 'Error creating faculty', error: (error as Error).message }, { status: 500 });
  }
}
