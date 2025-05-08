
import { NextResponse, type NextRequest } from 'next/server';
import type { Role } from '@/types/entities';
import { allPermissions } from '@/lib/api/roles'; 

declare global {
  var __API_ROLES_STORE__: Role[] | undefined;
}

if (!global.__API_ROLES_STORE__) {
  global.__API_ROLES_STORE__ = [
    { id: "1", name: "Admin", code: "admin", description: "Full access to all system features.", permissions: allPermissions, isSystemRole: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "2", name: "Student", code: "student", description: "Access to student-specific features.", permissions: ["view_courses", "submit_assignments"], isSystemRole: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
}
let rolesStore: Role[] = global.__API_ROLES_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const role = rolesStore.find(r => r.id === id);
  if (role) {
    return NextResponse.json(role);
  }
  return NextResponse.json({ message: 'Role not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const roleData = await request.json() as Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt'>>;
    const roleIndex = rolesStore.findIndex(r => r.id === id);

    if (roleIndex === -1) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 });
    }

    const existingRole = rolesStore[roleIndex];
    if (existingRole.isSystemRole && roleData.name && roleData.name.trim().toLowerCase() !== existingRole.name.toLowerCase()) {
        return NextResponse.json({ message: `Cannot change the name of the system role '${existingRole.name}'.` }, { status: 400 });
    }
    if (existingRole.isSystemRole && roleData.code && roleData.code.trim().toLowerCase() !== existingRole.code.toLowerCase()) {
        return NextResponse.json({ message: `Cannot change the code of the system role '${existingRole.name}'.` }, { status: 400 });
    }

    if (roleData.name !== undefined && !roleData.name.trim()) {
        return NextResponse.json({ message: 'Role Name cannot be empty.' }, { status: 400 });
    }
    
    const newCode = roleData.code?.trim().toLowerCase();
    if (newCode && newCode !== existingRole.code.toLowerCase() && rolesStore.some(r => r.id !== id && r.code.toLowerCase() === newCode)) {
      return NextResponse.json({ message: `Role with code '${newCode}' already exists.` }, { status: 409 });
    }
    if (roleData.name && roleData.name.trim().toLowerCase() !== existingRole.name.toLowerCase() && rolesStore.some(r => r.id !== id && r.name.toLowerCase() === roleData.name!.trim().toLowerCase())) {
        return NextResponse.json({ message: `Role with name '${roleData.name.trim()}' already exists.` }, { status: 409 });
    }


    if(roleData.permissions){
        roleData.permissions = roleData.permissions.filter(p => allPermissions.includes(p));
    }

    const updatedRoleData = { ...roleData };
    if (updatedRoleData.name) updatedRoleData.name = updatedRoleData.name.trim();
    if (updatedRoleData.code) updatedRoleData.code = updatedRoleData.code.trim().toLowerCase();
    if (updatedRoleData.description !== undefined) updatedRoleData.description = updatedRoleData.description.trim();


    const updatedRole = { 
      ...existingRole, 
      ...updatedRoleData,
      updatedAt: new Date().toISOString()
    };

    rolesStore[roleIndex] = updatedRole;
    global.__API_ROLES_STORE__ = rolesStore; 
    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error(`Error updating role ${id}:`, error);
    return NextResponse.json({ message: `Error updating role ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  let currentUsersStore: User[] = (global as any).__API_USERS_STORE__ || [];
  const roleIndex = rolesStore.findIndex(r => r.id === id);

  if (roleIndex === -1) {
    return NextResponse.json({ message: 'Role not found' }, { status: 404 });
  }
  
  const roleToDelete = rolesStore[roleIndex];
  if (roleToDelete.isSystemRole) {
      return NextResponse.json({ message: `Cannot delete the system role '${roleToDelete.name}'.` }, { status: 403 });
  }
  
  // Remove this role (by code) from all users
  currentUsersStore.forEach(user => {
      if (user.roles.includes(roleToDelete.code)) {
          user.roles = user.roles.filter(rCode => rCode !== roleToDelete.code);
      }
  });
  (global as any).__API_USERS_STORE__ = currentUsersStore;


  rolesStore.splice(roleIndex, 1);
  global.__API_ROLES_STORE__ = rolesStore;
  return NextResponse.json({ message: 'Role deleted successfully' }, { status: 200 });
}
