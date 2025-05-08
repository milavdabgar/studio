
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
    { id: "3", name: "Faculty", code: "faculty", description: "Access to faculty-specific features.", permissions: ["manage_courses", "grade_assignments", "evaluate_projects", "view_committee_info"], isSystemRole: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "4", name: "HOD", code: "hod", description: "Head of Department access.", permissions: ["manage_faculty", "view_department_reports", "manage_courses", "evaluate_projects", "view_committee_info"], isSystemRole: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "5", name: "Jury", code: "jury", description: "Project fair jury access.", permissions: ["evaluate_projects", "view_committee_info"], isSystemRole: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "6", name: "Unknown", code: "unknown", description: "Default role with no permissions.", permissions: [], isSystemRole: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "7", name: "Super Admin", code: "super_admin", description: "System-wide super admin.", permissions: allPermissions, isSystemRole: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    // Generic committee roles
    { id: "cm_convener", name: "Committee Convener (Generic)", code: "committee_convener", description: "Generic convener role for committees.", permissions: ["view_committee_info", "manage_committee_meetings", "manage_committee_members"], isSystemRole: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "cm_co_convener", name: "Committee Co-Convener (Generic)", code: "committee_co_convener", description: "Generic co-convener role for committees.", permissions: ["view_committee_info", "manage_committee_meetings"], isSystemRole: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "cm_member", name: "Committee Member (Generic)", code: "committee_member", description: "Generic member role for committees.", permissions: ["view_committee_info"], isSystemRole: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
}
const rolesStore: Role[] = global.__API_ROLES_STORE__;

const generateRoleId = (): string => `role_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;


export async function GET() {
  if (!Array.isArray(global.__API_ROLES_STORE__)) {
      global.__API_ROLES_STORE__ = []; 
      return NextResponse.json({ message: 'Internal server error: Role data store corrupted.' }, { status: 500 });
  }
  return NextResponse.json(global.__API_ROLES_STORE__);
}

export async function POST(request: NextRequest) {
  try {
    const roleData = await request.json() as Omit<Role, 'id' | 'createdAt' | 'updatedAt'>;

    if (!roleData.name || !roleData.name.trim()) {
      return NextResponse.json({ message: 'Role Name cannot be empty.' }, { status: 400 });
    }
    if (!roleData.code || !roleData.code.trim()) {
        return NextResponse.json({ message: 'Role Code cannot be empty.' }, { status: 400 });
    }
    const roleCodeToCreate = roleData.code.trim().toLowerCase();
    if (rolesStore.some(r => r.code.toLowerCase() === roleCodeToCreate)) {
        return NextResponse.json({ message: `Role with code '${roleCodeToCreate}' already exists.` }, { status: 409 });
    }
     if (rolesStore.some(r => r.name.toLowerCase() === roleData.name.trim().toLowerCase())) {
        return NextResponse.json({ message: `Role with name '${roleData.name.trim()}' already exists.` }, { status: 409 });
    }
    
    const now = new Date().toISOString();
    const newRole: Role = {
      id: generateRoleId(),
      name: roleData.name.trim(),
      code: roleCodeToCreate,
      description: roleData.description?.trim() || "",
      permissions: roleData.permissions ? roleData.permissions.filter(p => allPermissions.includes(p)) : [],
      isSystemRole: roleData.isSystemRole || false,
      isCommitteeRole: roleData.isCommitteeRole || false,
      committeeId: roleData.committeeId || undefined,
      committeeCode: roleData.committeeCode || undefined,
      createdAt: now,
      updatedAt: now,
    };
    rolesStore.push(newRole);
    global.__API_ROLES_STORE__ = rolesStore; 
    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ message: 'Error creating role', error: (error as Error).message }, { status: 500 });
  }
}
