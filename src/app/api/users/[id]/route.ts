
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@/types/entities'; // Updated import
import { instituteService } from '@/lib/api/institutes';

declare global {
  var __API_USERS_STORE__: User[] | undefined;
}
if (!global.__API_USERS_STORE__) {
  global.__API_USERS_STORE__ = []; 
}
let usersStore: User[] = global.__API_USERS_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

const parseFullName = (fullName: string | undefined): { firstName?: string, middleName?: string, lastName?: string } => {
    if (!fullName) return {};
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0] };
    if (parts.length === 2) return { lastName: parts[0], firstName: parts[1] }; // Assuming SURNAME NAME
    return { lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') };
};


export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const user = usersStore.find(u => u.id === id);
  if (user) {
    const { password, ...userToReturn } = user;
    return NextResponse.json(userToReturn);
  }
  return NextResponse.json({ message: 'User not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const userDataToUpdate = await request.json() as Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> & { password?: string, fullName?: string };
    const userIndex = usersStore.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const existingUser = usersStore[userIndex];

    // Prevent changing email of existing user for simplicity, or handle uniqueness check
    if (userDataToUpdate.email && userDataToUpdate.email.trim().toLowerCase() !== existingUser.email.toLowerCase()) {
       if (usersStore.some(u => u.id !== id && u.email.toLowerCase() === userDataToUpdate.email!.trim().toLowerCase())) {
            return NextResponse.json({ message: `Personal email '${userDataToUpdate.email.trim()}' is already in use by another user.` }, { status: 409 });
       }
    }
    if (userDataToUpdate.instituteEmail && userDataToUpdate.instituteEmail.trim().toLowerCase() !== existingUser.instituteEmail?.toLowerCase()) {
       if (usersStore.some(u => u.id !== id && u.instituteEmail?.toLowerCase() === userDataToUpdate.instituteEmail!.trim().toLowerCase())) {
            return NextResponse.json({ message: `Institute email '${userDataToUpdate.instituteEmail.trim()}' is already in use by another user.` }, { status: 409 });
       }
    }
     if (userDataToUpdate.password && userDataToUpdate.password.length < 6) {
        return NextResponse.json({ message: 'New password must be at least 6 characters long.' }, { status: 400 });
    }
    
    let newInstituteEmail = existingUser.instituteEmail;
    if (userDataToUpdate.instituteId && userDataToUpdate.instituteId !== existingUser.instituteId) {
        // Institute changed, or name changed, so regenerate institute email
        let instituteDomain = 'example.com';
        try {
            const institute = await instituteService.getInstituteById(userDataToUpdate.instituteId);
            if (institute && institute.domain) instituteDomain = institute.domain;
        } catch (e) { /* ignore, use default */ }

        const displayName = userDataToUpdate.displayName || userDataToUpdate.fullName || existingUser.displayName;
        const { firstName, lastName } = parseFullName(userDataToUpdate.fullName || displayName);
        
        let baseEmail = `${(firstName || 'user').toLowerCase()}.${(lastName || existingUser.id.substring(0,4)).toLowerCase()}`;
        if (!firstName && !lastName) baseEmail = existingUser.email.split('@')[0];

        newInstituteEmail = `${baseEmail}@${instituteDomain}`;
        let emailSuffix = 1;
        const originalBase = baseEmail;
        while(usersStore.some(u => u.id !== id && u.instituteEmail?.toLowerCase() === newInstituteEmail?.toLowerCase())) {
            newInstituteEmail = `${originalBase}${emailSuffix}@${instituteDomain}`;
            emailSuffix++;
        }
    }


    // Update user data (excluding password if not provided)
    const { password, fullName, ...otherUpdates } = userDataToUpdate;
    const updatedUser: User = { 
        ...existingUser, 
        ...otherUpdates,
        displayName: userDataToUpdate.displayName || userDataToUpdate.fullName || existingUser.displayName,
        updatedAt: new Date().toISOString(),
        instituteEmail: newInstituteEmail // Update institute email if it changed
    };

    if (password) {
      updatedUser.password = password; 
    }
    
    usersStore[userIndex] = updatedUser;
    const { password: _, ...userToReturn } = updatedUser;
    return NextResponse.json(userToReturn);
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    return NextResponse.json({ message: `Error updating user ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const userToDelete = usersStore.find(u => u.id === id);
  // Prevent deletion of a super_admin or a primary admin email
  if (userToDelete && (userToDelete.roles.includes('super_admin') || userToDelete.email === "admin@gppalanpur.in" || userToDelete.instituteEmail === "admin@gppalanpur.in")) {
      return NextResponse.json({ message: 'Cannot delete this administrative user.' }, { status: 403 });
  }

  const initialLength = usersStore.length;
  const newStore = usersStore.filter(u => u.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'User not found or could not be deleted' }, { status: 404 });
  }
  
  global.__API_USERS_STORE__ = newStore; 
  usersStore = global.__API_USERS_STORE__; 
  
  return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
}
