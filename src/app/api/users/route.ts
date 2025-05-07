
import { NextResponse, type NextRequest } from 'next/server';
import type { SystemUser, UserRole } from '@/types/entities';

// More robust global store initialization for development
declare global {
  // eslint-disable-next-line no-var
  var __API_USERS_STORE__: SystemUser[] | undefined;
}

if (!global.__API_USERS_STORE__) {
  global.__API_USERS_STORE__ = [
    { id: "user1", name: "Alice Admin", email: "admin@gppalanpur.in", password: "Admin@123", roles: ["admin"], status: "active", department: "Administration" },
    { id: "user2", name: "Bob Faculty", email: "faculty@example.com", password: "password123", roles: ["faculty"], status: "active", department: "Computer Science" },
    { id: "user3", name: "Charlie Student", email: "student@example.com", password: "password123", roles: ["student"], status: "active", department: "Computer Science" },
    { id: "user4", name: "David HOD", email: "hod@example.com", password: "password123", roles: ["hod", "faculty"], status: "active", department: "Electrical Engineering" },
    { id: "user5", name: "Eve Jury", email: "jury@example.com", password: "password123", roles: ["jury"], status: "active", department: "General" },
  ];
}
// Use a const to hold the reference to the global store for this module's scope
const usersStore: SystemUser[] = global.__API_USERS_STORE__;

const generateId = (): string => `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    // Ensure usersStore is an array before sending
    if (!Array.isArray(global.__API_USERS_STORE__)) {
      console.error("/api/users GET: global.__API_USERS_STORE__ is not an array!", global.__API_USERS_STORE__);
      // Attempt to re-initialize if corrupted, though this indicates a deeper issue
      global.__API_USERS_STORE__ = []; 
      return NextResponse.json({ message: 'Internal server error: User data store corrupted.' }, { status: 500 });
    }
    return NextResponse.json(global.__API_USERS_STORE__);
  } catch (e) {
    console.error("/api/users GET: Exception during NextResponse.json()", e);
    return NextResponse.json({ message: 'Internal server error during JSON response creation.', error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json() as Omit<SystemUser, 'id'> & { password?: string };

    if (!userData.name || !userData.name.trim() || !userData.email || !userData.email.trim()) {
      return NextResponse.json({ message: 'Name and Email are required.' }, { status: 400 });
    }
    if (global.__API_USERS_STORE__?.some(u => u.email.toLowerCase() === userData.email.trim().toLowerCase())) {
        return NextResponse.json({ message: `User with email '${userData.email.trim()}' already exists.` }, { status: 409 });
    }
    if (!userData.roles || userData.roles.length === 0) {
        return NextResponse.json({ message: 'User must have at least one role.' }, { status: 400 });
    }
    
    if (!userData.password && (!currentUser || !currentUser.id)) { // Require password for new users only
        if (!userData.password || userData.password.length < 6) {
             return NextResponse.json({ message: 'Password must be at least 6 characters long for new users.' }, { status: 400 });
        }
    }


    const newUser: SystemUser = {
      id: generateId(),
      name: userData.name.trim(),
      email: userData.email.trim(),
      roles: userData.roles,
      status: userData.status || 'active',
      department: userData.department?.trim() || undefined,
      password: userData.password, // Store password (insecurely for this mock)
    };
    global.__API_USERS_STORE__?.push(newUser);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Error creating user', error: (error as Error).message }, { status: 500 });
  }
}
