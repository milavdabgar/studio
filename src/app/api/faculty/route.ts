
import { NextResponse, type NextRequest } from 'next/server';
import type { Faculty, User, Institute } from '@/types/entities'; 
import { userService } from '@/lib/api/users'; 
import { instituteService } from '@/lib/api/institutes'; 

declare global {
  var __API_FACULTY_STORE__: Faculty[] | undefined;
}
const now = new Date().toISOString();

if (!global.__API_FACULTY_STORE__ || global.__API_FACULTY_STORE__.length === 0) {
  global.__API_FACULTY_STORE__ = [
    {
      id: "fac_cs01_gpp",
      userId: "user_faculty_cs01_gpp", // Link to an existing User ID
      staffCode: "FCS01",
      gtuName: "PROF. FACULTY CS01 GPP",
      title: "Prof.",
      firstName: "CS01",
      lastName: "FACULTY",
      personalEmail: "faculty.cs01@example.com",
      instituteEmail: "faculty.cs01@gppalanpur.ac.in",
      department: "Computer Engineering",
      designation: "Lecturer",
      jobType: "Regular",
      status: "active",
      instituteId: "inst1",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "fac_me01_gpp",
      userId: "user_faculty_me01_gpp", // Link to an existing User ID
      staffCode: "FME01",
      gtuName: "DR. PATEL RAJ KUMAR",
      title: "Dr.",
      firstName: "RAJ",
      middleName: "KUMAR",
      lastName: "PATEL",
      personalEmail: "faculty.me01@example.com",
      instituteEmail: "faculty.me01@gppalanpur.ac.in",
      department: "Mechanical Engineering",
      designation: "Associate Professor",
      jobType: "Regular",
      status: "active",
      instituteId: "inst1",
      createdAt: now,
      updatedAt: now,
    },
    { // HOD of Computer Engineering
      id: "fac_hod_ce_gpp",
      userId: "user_hod_ce_gpp",
      staffCode: "HODCE",
      gtuName: "DR. HOD COMPUTER ENGINEERING",
      title: "Dr.",
      firstName: "COMPUTER",
      lastName: "HOD",
      personalEmail: "hod.ce@example.com",
      instituteEmail: "hod.ce@gppalanpur.ac.in",
      department: "Computer Engineering",
      designation: "Head of Department",
      jobType: "Regular",
      status: "active",
      instituteId: "inst1",
      createdAt: now,
      updatedAt: now,
    },
    { // Committee Convener
      id: "fac_cwan_conv_gpp",
      userId: "user_committee_convener_gpp",
      staffCode: "CWANCONV",
      gtuName: "CONVENER CWAN GPP",
      firstName: "CWAN",
      lastName: "CONVENER",
      personalEmail: "convener.cwan@example.com",
      instituteEmail: "convener.cwan@gppalanpur.ac.in",
      department: "General Department", // Or relevant dept
      designation: "Lecturer",
      jobType: "Regular",
      status: "active",
      instituteId: "inst1",
      createdAt: now,
      updatedAt: now,
    }
  ];
}
let facultyStore: Faculty[] = global.__API_FACULTY_STORE__;


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
    const facultyData = await request.json() as Omit<Faculty, 'id' | 'userId'> & { userId?: string, instituteId?: string };

    if (!facultyData.staffCode || !facultyData.staffCode.trim()) {
      return NextResponse.json({ message: 'Staff Code is required.' }, { status: 400 });
    }
    if ((!facultyData.firstName || !facultyData.firstName.trim()) && (!facultyData.lastName || !facultyData.lastName.trim())) {
      return NextResponse.json({ message: 'First Name and Last Name are required if GTU Name is not provided.' }, { status: 400 });
    }
    
    let instituteDomain = 'gpp.ac.in'; // Default domain
    let facultyInstituteId = facultyData.instituteId;

    if (facultyInstituteId) {
        try {
            const institute = await instituteService.getInstituteById(facultyInstituteId);
            if (institute && institute.domain) {
                instituteDomain = institute.domain;
            }
        } catch (error) {
            console.warn(`Error fetching institute ${facultyInstituteId} for domain: ${(error as Error).message}. Using default domain '${instituteDomain}'.`);
        }
    } else {
         // If no institute ID, try to assign to a default one or handle error
        console.warn(`Institute ID not provided for faculty ${facultyData.staffCode}. Using default domain '${instituteDomain}'. Consider making instituteId mandatory.`);
        // For now, let's try to find a default institute for user creation if possible
        const institutes = await instituteService.getAllInstitutes();
        if(institutes.length > 0) {
            facultyInstituteId = institutes[0].id; // Assign to first available institute
            if(institutes[0].domain) instituteDomain = institutes[0].domain;
             facultyData.instituteId = facultyInstituteId; // Persist this on faculty record
        } else {
            return NextResponse.json({ message: 'No institutes found. Cannot create faculty without an institute context.' }, { status: 400 });
        }
    }
    
    const instituteEmail = facultyData.instituteEmail?.trim() || generateInstituteEmailForFaculty(facultyData.firstName, facultyData.lastName, instituteDomain);


    if (facultyStore.some(f => f.staffCode === facultyData.staffCode.trim())) {
      return NextResponse.json({ message: `Faculty with staff code '${facultyData.staffCode.trim()}' already exists.` }, { status: 409 });
    }
    if (facultyStore.some(f => f.instituteEmail.toLowerCase() === instituteEmail.toLowerCase())) {
      return NextResponse.json({ message: `Faculty with institute email '${instituteEmail}' already exists.` }, { status: 409 });
    }
     if (facultyData.personalEmail && !/\S+@\S+\.\S+/.test(facultyData.personalEmail)) {
        return NextResponse.json({ message: 'Invalid personal email format.' }, { status: 400 });
    }


    const newFacultyId = generateId();
    const newFaculty: Faculty = {
      id: newFacultyId,
      ...facultyData,
      instituteEmail, // Use the generated or provided one
      instituteId: facultyInstituteId, // Ensure it's set
    };
    
    const displayName = facultyData.gtuName || `${facultyData.title || ''} ${facultyData.firstName || ''} ${facultyData.middleName || ''} ${facultyData.lastName || ''}`.replace(/\s+/g, ' ').trim() || facultyData.staffCode;
    
    let createdUserId: string | undefined;

    try {
        const userToCreate: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'authProviders' | 'isEmailVerified' | 'preferences'> & { password?: string } = {
            displayName,
            email: facultyData.personalEmail || instituteEmail, 
            instituteEmail: instituteEmail,
            password: facultyData.staffCode, 
            roles: ['faculty'], 
            isActive: facultyData.status === 'active',
            instituteId: facultyInstituteId, 
            fullName: facultyData.gtuName || `${facultyData.lastName || ''} ${facultyData.firstName || ''} ${facultyData.middleName || ''}`.trim(),
            firstName: facultyData.firstName,
            middleName: facultyData.middleName,
            lastName: facultyData.lastName,
        };

        const createdUser = await userService.createUser(userToCreate);
        createdUserId = createdUser.id;
        newFaculty.userId = createdUserId; 

    } catch (userCreationError: unknown) {
        if (userCreationError.message?.includes("already exists")) {
            console.warn(`System user with email ${instituteEmail} or ${facultyData.personalEmail} already exists. Attempting to link faculty ${newFaculty.staffCode}.`);
            const allUsers = await userService.getAllUsers();
            const existingUser = allUsers.find(u => u.instituteEmail === instituteEmail || u.email === facultyData.personalEmail);
            if (existingUser) {
                newFaculty.userId = existingUser.id;
                if (!existingUser.roles.includes('faculty')) {
                    await userService.updateUser(existingUser.id, { roles: [...existingUser.roles, 'faculty'] });
                }
            } else {
                 console.error(`Could not link faculty ${newFaculty.staffCode} to an existing user despite 'already exists' error.`);
            }
        } else {
          console.error(`Failed to create/link system user for new faculty ${newFaculty.staffCode}:`, userCreationError);
        }
    }
    
    facultyStore.push(newFaculty);
    global.__API_FACULTY_STORE__ = facultyStore;

    return NextResponse.json(newFaculty, { status: 201 });
  } catch (error) {
    console.error('Error creating faculty:', error);
    return NextResponse.json({ message: 'Error creating faculty', error: (error as Error).message }, { status: 500 });
  }
}

const generateInstituteEmailForFaculty = (firstName?: string, lastName?: string, instituteDomain: string = "gppalanpur.ac.in"): string => {
  const fn = (firstName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  const ln = (lastName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  if (fn && ln) return `${fn}.${ln}@${instituteDomain}`;
  return `faculty_${Date.now().toString().slice(-5)}_${Math.random().toString(36).substring(2,5)}@${instituteDomain}`;
};
