
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@/types/entities'; 
import { instituteService } from '@/lib/api/institutes'; 

declare global {
  var __API_USERS_STORE__: User[] | undefined;
}

const now = new Date().toISOString();

if (!global.__API_USERS_STORE__ || global.__API_USERS_STORE__.length === 0) {
  global.__API_USERS_STORE__ = [
    { 
      id: "user_admin_gpp", 
      displayName: "GPP Super Admin", 
      username: "gpp_superadmin",
      email: "admin@gppalanpur.in", 
      instituteEmail: "admin@gppalanpur.ac.in", 
      password: "Admin@123", 
      roles: ["super_admin", "admin"], 
      isActive: true, 
      instituteId: "inst1", 
      authProviders: ['password'],
      createdAt: now,
      updatedAt: now,
      isEmailVerified: true,
      preferences: { theme: 'system', language: 'en' },
      fullName: "ADMIN SUPER GPP",
      firstName: "SUPER",
      lastName: "ADMIN"
    },
     { 
      id: "user_hod_ce_gpp", 
      displayName: "HOD Computer", 
      username: "hod_ce_gpp",
      email: "hod.ce@gppalanpur.in", 
      instituteEmail: "hod.ce@gppalanpur.ac.in", 
      password: "Password@123", 
      roles: ["hod", "faculty"], 
      isActive: true, 
      instituteId: "inst1", 
      authProviders: ['password'],
      createdAt: now,
      updatedAt: now,
      isEmailVerified: true,
      preferences: { theme: 'system', language: 'en' },
      fullName: "HOD COMPUTER ENGINEERING",
      firstName: "COMPUTER",
      lastName: "HOD"
    },
    { 
      id: "user_faculty_cs01_gpp", 
      displayName: "Faculty CS01", 
      email: "faculty.cs01@gppalanpur.in", 
      instituteEmail: "faculty.cs01@gppalanpur.ac.in", 
      password: "Password@123", 
      roles: ["faculty"], 
      isActive: true, 
      instituteId: "inst1", 
      authProviders: ['password'],
      createdAt: now,
      updatedAt: now,
      isEmailVerified: true,
      preferences: { theme: 'system', language: 'en' },
      fullName: "FACULTY CS01 GPP",
      firstName: "CS01",
      lastName: "FACULTY"
    },
    { 
      id: "user_student_ce001_gpp", 
      displayName: "Student CE001", 
      email: "student.ce001@gppalanpur.in", 
      instituteEmail: "220010107001@gppalanpur.ac.in", // Example, derived from enrollment
      password: "220010107001", 
      roles: ["student"], 
      isActive: true, 
      instituteId: "inst1", 
      authProviders: ['password'],
      createdAt: now,
      updatedAt: now,
      isEmailVerified: true,
      preferences: { theme: 'system', language: 'en' },
      fullName: "STUDENT CE001 GPP",
      firstName: "CE001",
      lastName: "STUDENT"
    },
    { 
      id: "user_committee_convener_gpp", 
      displayName: "Committee Convener", 
      email: "convener.arc@gppalanpur.in", 
      instituteEmail: "convener.arc@gppalanpur.ac.in", 
      password: "Password@123", 
      roles: ["faculty", "arc_gpp_convener"], // Example specific committee role code
      isActive: true, 
      instituteId: "inst1", 
      authProviders: ['password'],
      createdAt: now,
      updatedAt: now,
      isEmailVerified: true,
      preferences: { theme: 'system', language: 'en' },
      fullName: "CONVENER COMMITTEE GPP",
      firstName: "COMMITTEE",
      lastName: "CONVENER"
    },
  ];
}
const usersStore: User[] = global.__API_USERS_STORE__;

const generateId = (): string => `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const parseFullNameForEmail = (fullName: string | undefined, displayName?: string): { firstName?: string, lastName?: string } => {
    const nameToParse = fullName || displayName;
    if (!nameToParse) return {};
    const parts = nameToParse.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0].toLowerCase() };
    if (parts.length >= 2) { // SURNAME NAME FATHERNAME -> lastName=SURNAME, firstName=NAME
      return { firstName: parts[1].toLowerCase() , lastName: parts[0].toLowerCase() };
    }
    return {};
};

export async function GET(request: NextRequest) {
  try {
    if (!Array.isArray(global.__API_USERS_STORE__)) {
      global.__API_USERS_STORE__ = []; 
      return NextResponse.json({ message: 'Internal server error: User data store corrupted.' }, { status: 500 });
    }
    const usersWithoutPassword = global.__API_USERS_STORE__.map(({ password, ...user }) => user);
    return NextResponse.json(usersWithoutPassword);
  } catch (e) {
    return NextResponse.json({ message: 'Internal server error during JSON response creation.', error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json() as Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'authProviders' | 'isEmailVerified' | 'preferences'> & { password?: string };

    if (!userData.fullName || !userData.fullName.trim()) {
        return NextResponse.json({ message: 'Full Name (GTU Format) is required.' }, { status: 400 });
    }
    if (!userData.firstName || !userData.firstName.trim()) {
      return NextResponse.json({ message: 'First Name is required.' }, { status: 400 });
    }
    if (!userData.lastName || !userData.lastName.trim()) {
      return NextResponse.json({ message: 'Last Name is required.' }, { status: 400 });
    }
    if (!userData.email || !userData.email.trim()) {
      return NextResponse.json({ message: 'Personal Email is required.' }, { status: 400 });
    }
     if (usersStore?.some(u => u.email.toLowerCase() === userData.email.trim().toLowerCase())) {
        return NextResponse.json({ message: `User with personal email '${userData.email.trim()}' already exists.` }, { status: 409 });
    }
    if (!userData.roles || userData.roles.length === 0) {
        return NextResponse.json({ message: 'User must have at least one role.' }, { status: 400 });
    }
    if (!userData.password || userData.password.length < 6) {
         return NextResponse.json({ message: 'Password must be at least 6 characters long for new users.' }, { status: 400 });
    }
    
    let instituteDomain = 'gpp.ac.in'; // Default domain
    if (userData.instituteId) {
        try {
            const institute = await instituteService.getInstituteById(userData.instituteId);
            if (institute && institute.domain) {
                instituteDomain = institute.domain;
            } else {
                console.warn(`Institute with ID ${userData.instituteId} not found or has no domain. Using default domain '${instituteDomain}'.`);
            }
        } catch (error) {
            console.warn(`Error fetching institute ${userData.instituteId} for domain: ${(error as Error).message}. Using default domain '${instituteDomain}'.`);
        }
    } else {
         console.warn(`Institute ID not provided for user ${userData.email}. Using default domain '${instituteDomain}' for institute email generation.`);
    }
    
    const firstNameForEmail = (userData.firstName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
    const lastNameForEmail = (userData.lastName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
    let baseInstituteEmail = `${firstNameForEmail}.${lastNameForEmail}`;

    if (!firstNameForEmail || !lastNameForEmail) { 
        const emailParts = userData.email.split('@');
        const usernamePart = emailParts[0].replace(/[^a-z0-9]/g, '');
        if (usernamePart) {
            baseInstituteEmail = usernamePart;
        } else { // Fallback if username part is also empty
            baseInstituteEmail = `user${generateId().substring(5,10)}`;
        }
    }
    
    let instituteEmail = `${baseInstituteEmail}@${instituteDomain}`;
    let emailSuffix = 1;
    while(usersStore?.some(u => u.instituteEmail?.toLowerCase() === instituteEmail.toLowerCase())) {
        instituteEmail = `${baseInstituteEmail}${emailSuffix}@${instituteDomain}`;
        emailSuffix++;
    }

    const currentTimestamp = new Date().toISOString();
    const newUser: User = {
      id: generateId(),
      displayName: userData.displayName || `${userData.firstName.trim()} ${userData.lastName.trim()}`,
      fullName: userData.fullName.trim(),
      firstName: userData.firstName.trim(),
      middleName: userData.middleName?.trim() || undefined,
      lastName: userData.lastName.trim(),
      username: userData.username?.trim() || undefined,
      email: userData.email.trim(),
      instituteEmail: instituteEmail,
      photoURL: userData.photoURL || undefined,
      phoneNumber: userData.phoneNumber || undefined,
      authProviders: ['password'],
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      lastLoginAt: undefined,
      isActive: userData.isActive === undefined ? true : userData.isActive,
      isEmailVerified: false,
      roles: userData.roles,
      currentRole: userData.roles[0], // Default to first role
      preferences: userData.preferences || { theme: 'system', language: 'en'},
      instituteId: userData.instituteId || undefined,
      password: userData.password, 
    };
    usersStore?.push(newUser);
    const { password, ...userToReturn } = newUser;
    return NextResponse.json(userToReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Error creating user', error: (error as Error).message }, { status: 500 });
  }
}
