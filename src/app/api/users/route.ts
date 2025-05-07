
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@/types/entities'; // Updated import
import { instituteService } from '@/lib/api/institutes'; // To fetch institute domain

declare global {
  var __API_USERS_STORE__: User[] | undefined;
}

if (!global.__API_USERS_STORE__) {
  global.__API_USERS_STORE__ = [
    { 
      id: "user1", 
      displayName: "Alice Admin", 
      username: "admin",
      email: "admin@example.com", 
      instituteEmail: "admin@gppalanpur.in", // Example, assuming gppalanpur.in is a domain
      password: "Admin@123", 
      roles: ["admin", "super_admin"], 
      isActive: true, 
      instituteId: "inst1", // Assuming inst1 is Government Polytechnic Palanpur
      authProviders: ['password'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEmailVerified: true,
      preferences: { theme: 'system', language: 'en' }
    },
  ];
}
const usersStore: User[] = global.__API_USERS_STORE__;

const generateId = (): string => `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const parseFullName = (fullName: string | undefined): { firstName?: string, middleName?: string, lastName?: string } => {
    if (!fullName) return {};
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0] };
    if (parts.length === 2) return { lastName: parts[0], firstName: parts[1] }; // Assuming SURNAME NAME
    return { lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') };
};

export async function GET(request: NextRequest) {
  try {
    if (!Array.isArray(global.__API_USERS_STORE__)) {
      global.__API_USERS_STORE__ = []; 
      return NextResponse.json({ message: 'Internal server error: User data store corrupted.' }, { status: 500 });
    }
    // Exclude password field from the response
    const usersWithoutPassword = global.__API_USERS_STORE__.map(({ password, ...user }) => user);
    return NextResponse.json(usersWithoutPassword);
  } catch (e) {
    return NextResponse.json({ message: 'Internal server error during JSON response creation.', error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json() as Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'authProviders' | 'isEmailVerified' | 'preferences'> & { password?: string, fullName?: string };

    if (!userData.displayName && !userData.fullName) {
        return NextResponse.json({ message: 'Display Name or Full Name (GTU Format) is required.' }, { status: 400 });
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
    if (!userData.instituteId) {
      return NextResponse.json({ message: 'Institute ID is required to generate institute email.' }, { status: 400 });
    }

    let instituteDomain = 'example.com'; // Default domain
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
    
    const displayName = userData.displayName || userData.fullName || userData.email;
    const { firstName, lastName } = parseFullName(userData.fullName || userData.displayName);

    let instituteEmail = `${(firstName || '').toLowerCase()}.${(lastName || 'user').toLowerCase()}@${instituteDomain}`;
    if (!firstName && !lastName) { // Fallback if names can't be parsed
        instituteEmail = `${userData.email.split('@')[0]}@${instituteDomain}`;
    }
    // Ensure instituteEmail is unique
    let emailSuffix = 1;
    const originalInstituteEmailBase = instituteEmail.split('@')[0];
    while(usersStore?.some(u => u.instituteEmail?.toLowerCase() === instituteEmail.toLowerCase())) {
        instituteEmail = `${originalInstituteEmailBase}${emailSuffix}@${instituteDomain}`;
        emailSuffix++;
    }


    const newUser: User = {
      id: generateId(),
      displayName: displayName.trim(),
      username: userData.username?.trim() || undefined,
      email: userData.email.trim(),
      instituteEmail: instituteEmail,
      photoURL: userData.photoURL || undefined,
      phoneNumber: userData.phoneNumber || undefined,
      authProviders: ['password'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: undefined,
      isActive: userData.isActive === undefined ? true : userData.isActive,
      isEmailVerified: false,
      roles: userData.roles,
      preferences: userData.preferences || { theme: 'system', language: 'en'},
      instituteId: userData.instituteId,
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
