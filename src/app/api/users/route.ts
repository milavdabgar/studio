
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@/types/entities'; 
import { instituteService } from '@/lib/api/institutes'; 

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
      instituteEmail: "admin@gppalanpur.in", 
      password: "Admin@123", 
      roles: ["admin", "super_admin"], 
      isActive: true, 
      instituteId: "inst1", 
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

const parseFullNameForEmail = (fullName: string | undefined, displayName?: string): { firstName?: string, lastName?: string } => {
    const nameToParse = fullName || displayName;
    if (!nameToParse) return {};
    const parts = nameToParse.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0].toLowerCase() };
    if (parts.length >= 2) return { firstName: parts.find(p => p.toLowerCase() !== parts[0].toLowerCase())?.toLowerCase() || parts[1].toLowerCase() , lastName: parts[0].toLowerCase() };
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
    
    let instituteDomain = 'gpp.ac.in'; // Default domain if institute not found or no domain set
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
    if (!firstNameForEmail || !lastNameForEmail) { // Fallback if names are insufficient
        baseInstituteEmail = userData.email.split('@')[0].replace(/[^a-z0-9]/g, '');
    }
    
    let instituteEmail = `${baseInstituteEmail}@${instituteDomain}`;
    let emailSuffix = 1;
    while(usersStore?.some(u => u.instituteEmail?.toLowerCase() === instituteEmail.toLowerCase())) {
        instituteEmail = `${baseInstituteEmail}${emailSuffix}@${instituteDomain}`;
        emailSuffix++;
    }

    const newUser: User = {
      id: generateId(),
      displayName: `${userData.firstName.trim()} ${userData.lastName.trim()}`,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: undefined,
      isActive: userData.isActive === undefined ? true : userData.isActive,
      isEmailVerified: false,
      roles: userData.roles,
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
