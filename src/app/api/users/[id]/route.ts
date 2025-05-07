
import { NextResponse, type NextRequest } from 'next/server';
import type { SystemUser } from '@/types/entities';

// Ensure the global store is initialized only once (copied from main route for consistency)
declare global {
  // eslint-disable-next-line no-var
  var __API_USERS_STORE__: SystemUser[] | undefined;
}
if (!global.__API_USERS_STORE__) {
  // Initialize with a default structure or let the main route handle full initialization
  global.__API_USERS_STORE__ = []; 
}
// This variable will reference the global store.
// Modifications to this array (e.g. push, splice) will modify the global store directly.
// If this variable is reassigned (e.g. usersStore = usersStore.filter(...)), 
// then global.__API_USERS_STORE__ must also be reassigned.
let usersStore: SystemUser[] = global.__API_USERS_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const user = usersStore.find(u => u.id === id);
  if (user) {
    return NextResponse.json(user);
  }
  return NextResponse.json({ message: 'User not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const userDataToUpdate = await request.json() as Partial<Omit<SystemUser, 'id'>> & { password?: string };
    const userIndex = usersStore.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const existingUser = usersStore[userIndex];

    // Prevent changing email of existing user for simplicity, or handle uniqueness check
    if (userDataToUpdate.email && userDataToUpdate.email.trim().toLowerCase() !== existingUser.email.toLowerCase()) {
       if (usersStore.some(u => u.id !== id && u.email.toLowerCase() === userDataToUpdate.email!.trim().toLowerCase())) {
            return NextResponse.json({ message: `Email '${userDataToUpdate.email.trim()}' is already in use.` }, { status: 409 });
       }
    }
     if (userDataToUpdate.password && userDataToUpdate.password.length < 6) {
        return NextResponse.json({ message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }


    // Update user data (excluding password if not provided)
    const { password, ...otherUpdates } = userDataToUpdate;
    const updatedUser = { ...existingUser, ...otherUpdates };
    if (password) {
      updatedUser.password = password; // Store new password (insecurely for mock)
    }
    
    usersStore[userIndex] = updatedUser; // Modifies the array in place, global store is updated.
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    return NextResponse.json({ message: `Error updating user ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const initialLength = usersStore.length;
  
  const userToDelete = usersStore.find(u => u.id === id);
  if (userToDelete && userToDelete.email === "admin@gppalanpur.in") {
      return NextResponse.json({ message: 'Cannot delete the primary admin user.' }, { status: 403 });
  }

  // .filter creates a new array, so the global reference needs to be updated.
  const newStore = usersStore.filter(u => u.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'User not found or could not be deleted (e.g. primary admin)' }, { status: 404 });
  }
  
  global.__API_USERS_STORE__ = newStore; // Update the global store reference
  usersStore = global.__API_USERS_STORE__; // Update local reference as well, if other functions in this file use it.
  
  return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
}
