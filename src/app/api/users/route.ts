import { NextResponse, type NextRequest } from 'next/server';
import type { User, UserRole } from '@/types/entities'; 
import { instituteService } from '@/lib/api/institutes';
import { connectMongoose } from '@/lib/mongodb';
import { UserModel } from '@/lib/models';

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
    await connectMongoose();
    
    const users = await UserModel.find({}, '-password').lean();
    const usersWithId = users.map(user => ({
      ...user,
      id: (user as any)._id.toString()
    }));
    
    return NextResponse.json(usersWithId);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      message: 'Internal server error during user fetch.', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const userData = await request.json() as Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'authProviders' | 'isEmailVerified'> & { password?: string };

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
    
    // Check if user already exists
    const existingUser = await UserModel.findOne({ 
      email: { $regex: new RegExp(`^${userData.email.trim()}$`, 'i') } 
    });
    if (existingUser) {
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
        } else { 
            baseInstituteEmail = `user${generateId().substring(5,10)}`;
        }
    }
    
    let instituteEmail = `${baseInstituteEmail}@${instituteDomain}`;
    let emailSuffix = 1;
    
    // Check for existing institute email in MongoDB
    let existingInstituteEmailUser = await UserModel.findOne({ 
      instituteEmail: { $regex: new RegExp(`^${instituteEmail}$`, 'i') } 
    });
    
    while(existingInstituteEmailUser) {
        instituteEmail = `${baseInstituteEmail}${emailSuffix}@${instituteDomain}`;
        emailSuffix++;
        existingInstituteEmailUser = await UserModel.findOne({ 
          instituteEmail: { $regex: new RegExp(`^${instituteEmail}$`, 'i') } 
        });
    }

    const currentTimestamp = new Date().toISOString();
    const newUserData = {
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
      currentRole: userData.roles[0], 
      preferences: userData.preferences || { theme: 'system', language: 'en'},
      instituteId: userData.instituteId || undefined,
      password: userData.password, 
    };
    
    const newUser = new UserModel(newUserData);
    await newUser.save();
    
    // Return user without password
    const userToReturn = newUser.toJSON();
    delete userToReturn.password;
    
    return NextResponse.json(userToReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Error creating user', error: (error as Error).message }, { status: 500 });
  }
}
