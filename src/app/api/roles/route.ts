
import { NextResponse, type NextRequest } from 'next/server';
import type { Role } from '@/types/entities';
import { allPermissions } from '@/lib/api/roles'; // Import allPermissions

// In-memory store for roles (replace with actual DB interaction)
let rolesStore: Role[] = (global as any).roles || [
  { id: "1", name: "Admin", description: "Full access to all system features.", permissions: ["manage_users", "manage_roles", "manage_settings", "manage_institutes", "manage_buildings", "manage_rooms", "manage_departments", "manage_programs", "manage_courses"] },
  { id: "2", name: "Student", description: "Access to student-specific features.", permissions: ["view_courses", "submit_assignments"] },
  { id: "3", name: "Faculty", description: "Access to faculty-specific features.", permissions: ["manage_courses", "grade_assignments", "evaluate_projects"] },
  { id: "4", name: "HOD", description: "Head of Department access.", permissions: ["manage_faculty", "view_department_reports", "manage_courses", "evaluate_projects"] },
  { id: "5", name: "Jury", description: "Project fair jury access.", permissions: ["evaluate_projects"] },
];
(global as any).roles = rolesStore;

const generateClientId = (): string => `role_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;


export async function GET() {
  return NextResponse.json(rolesStore);
}

export async function POST(request: NextRequest) {
  try {
    const roleData = await request.json() as Omit<Role, 'id'>;

    if (!roleData.name || roleData.name.trim() === "") {
      return NextResponse.json({ message: 'Role Name cannot be empty.' }, { status: 400 });
    }
    if (rolesStore.some(r => r.name.toLowerCase() === roleData.name.trim().toLowerCase())) {
        return NextResponse.json({ message: `Role with name '${roleData.name.trim()}' already exists.` }, { status: 409 });
    }
    
    const newRole: Role = {
      id: generateClientId(),
      name: roleData.name.trim(),
      description: roleData.description?.trim() || "",
      permissions: roleData.permissions ? roleData.permissions.filter(p => allPermissions.includes(p)) : [],
    };
    rolesStore.push(newRole);
    (global as any).roles = rolesStore; 
    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ message: 'Error creating role' }, { status: 500 });
  }
}

