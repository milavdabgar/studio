
import { NextResponse, type NextRequest } from 'next/server';
import type { Role } from '@/types/entities';
import { allPermissions } from '@/lib/api/roles'; 
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { z } from 'zod';

const createRoleSchema = z.object({
    name: z.string().min(1, "Role Name cannot be empty.").trim(),
    code: z.string().min(1, "Role Code cannot be empty.").trim(),
    description: z.string().optional().nullable(),
    permissions: z.array(z.string()).optional(),
    isSystemRole: z.boolean().optional(),
    isCommitteeRole: z.boolean().optional(),
    committeeId: z.string().optional(),
    committeeCode: z.string().optional().nullable(),
});

const updateRoleSchema = z.object({
    name: z.string().min(1, "Role Name cannot be empty.").trim().optional(),
    description: z.string().optional().nullable(),
    permissions: z.array(z.string()).optional(),
});

const rateLimiter = new RateLimiterMemory({
    points: 10, 
    duration: 1, 
});

const rateLimiterMiddleware = async (req: NextRequest) => {
    try {
        await rateLimiter.consume(req.ip || 'anonymous');
    } catch (rejRes) {
        throw new Error('Too Many Requests');
    }
};

declare global {
  var __API_ROLES_STORE__: Role[] | undefined;
}

const now = new Date().toISOString();

const initialRoles: Role[] = [
    { id: "role_super_admin", name: "Super Admin", code: "super_admin", description: "System-wide super administrator with all permissions.", permissions: allPermissions, isSystemRole: true, createdAt: now, updatedAt: now },
    { id: "role_admin", name: "Admin", code: "admin", description: "Administrator with broad access to system features.", permissions: allPermissions.filter(p => !p.includes('super')), isSystemRole: true, createdAt: now, updatedAt: now },
    { id: "role_student", name: "Student", code: "student", description: "Access to student-specific features.", permissions: ["view_courses", "submit_assignments"], isSystemRole: true, createdAt: now, updatedAt: now },
    { id: "role_faculty", name: "Faculty", code: "faculty", description: "Access to faculty-specific features.", permissions: ["manage_courses", "grade_assignments", "evaluate_projects", "view_committee_info"], isSystemRole: true, createdAt: now, updatedAt: now },
    { id: "role_hod", name: "HOD", code: "hod", description: "Head of Department access.", permissions: ["manage_faculty", "view_department_reports", "manage_courses", "evaluate_projects", "view_committee_info"], isSystemRole: true, createdAt: now, updatedAt: now },
    { id: "role_jury", name: "Jury", code: "jury", description: "Project fair jury access.", permissions: ["evaluate_projects", "view_committee_info"], isSystemRole: true, createdAt: now, updatedAt: now },
    { id: "role_unknown", name: "Unknown", code: "unknown", description: "Default role with no permissions.", permissions: [], isSystemRole: true, createdAt: now, updatedAt: now },
    // Example of a dynamically generated committee role (actual ones created by committee API)
    // { id: "role_cwan_convener", name: "CWAN Convener", code: "cwan_convener", description: "Convener for the CWAN committee.", permissions: ["view_committee_info", "manage_committee_meetings"], isSystemRole: false, isCommitteeRole: true, committeeId: "cmt_cwan_gpp", committeeCode:"CWAN", createdAt: now, updatedAt: now },
];

if (!global.__API_ROLES_STORE__ || global.__API_ROLES_STORE__.length === 0) {
    global.__API_ROLES_STORE__ = initialRoles;
}
const rolesStore: Role[] = global.__API_ROLES_STORE__;

const getRole = (id: string): Role | undefined => {
 return rolesStore.find(r => r.id === id);
};

const getAllRoles = (): Role[] => {
 return rolesStore;
};

const createRole = (data: z.infer<typeof createRoleSchema>): Role => {
 const currentTimestamp = new Date().toISOString();
 const newRole: Role = {
    id: generateRoleId(),
    name: data.name,
    code: data.code.toLowerCase(),
    description: data.description ?? "",
    permissions: data.permissions ? data.permissions.filter(p => allPermissions.includes(p)) : [],
    isSystemRole: data.isSystemRole ?? false,
    isCommitteeRole: data.isCommitteeRole ?? false,
    committeeId: data.committeeId,
    committeeCode: data.committeeCode?.toLowerCase(),
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp,
  };
 rolesStore.push(newRole);
 global.__API_ROLES_STORE__ = rolesStore; 
 return newRole;
};

const updateRole = (id: string, data: z.infer<typeof updateRoleSchema>): Role | undefined => {
 const roleIndex = rolesStore.findIndex(r => r.id === id);
 if (roleIndex === -1) return undefined;
 const updatedRole = { ...rolesStore[roleIndex], ...data, updatedAt: new Date().toISOString() };
 rolesStore[roleIndex] = updatedRole;
 global.__API_ROLES_STORE__ = rolesStore; 
 return updatedRole;
};
const generateRoleId = (): string => `role_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;


export async function GET(request: NextRequest) {
    try {
        await rateLimiterMiddleware(request);

        if (!Array.isArray(global.__API_ROLES_STORE__)) {
            global.__API_ROLES_STORE__ = [];
            return NextResponse.json({ message: 'Internal server error: Role data store corrupted.' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

 if (id) {
 const role = getRole(id);
 return role ? NextResponse.json(role) : NextResponse.json({ message: 'Role not found' }, { status: 404 });
 } else { return NextResponse.json(getAllRoles()); }
    } catch (error: unknown) {
        if (error.message === 'Too Many Requests') {
            return NextResponse.json({ message: 'Too Many Requests' }, { status: 429 });
        }
        console.error('Error fetching roles:', error);
        return NextResponse.json({ message: 'Error fetching roles', error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await rateLimiterMiddleware(request);
        const body = await request.json();
        const validationResult = createRoleSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.errors }, { status: 400 });
        }

        const roleData = validationResult.data;
        const roleCodeToCreate = roleData.code.toLowerCase();

        if (rolesStore.some(r => r.code.toLowerCase() === roleCodeToCreate)) {
            return NextResponse.json({ message: `Role with code '${roleCodeToCreate}' already exists.` }, { status: 409 });
        }
        if (rolesStore.some(r => r.name.toLowerCase() === roleData.name.toLowerCase())) {
            return NextResponse.json({ message: `Role with name '${roleData.name}' already exists.` }, { status: 409 });
        }

 const newRole = createRole(roleData);
        return NextResponse.json(newRole, { status: 201 });
    } catch (error: unknown) {
        if (error.message === 'Too Many Requests') {
            return NextResponse.json({ message: 'Too Many Requests' }, { status: 429 });
        }
        console.error('Error creating role:', error);
        return NextResponse.json({ message: 'Error creating role', error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        await rateLimiterMiddleware(request);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'Role ID is required for update.' }, { status: 400 });
        }

        const body = await request.json();
        const validationResult = updateRoleSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.errors }, { status: 400 });
        }

        const updateData = validationResult.data;

        const roleIndex = rolesStore.findIndex(r => r.id === id);

        if (roleIndex === -1) {
            return NextResponse.json({ message: 'Role not found.' }, { status: 404 });
        }

        
        if (rolesStore[roleIndex].isSystemRole && updateData.name && updateData.name.toLowerCase() !== rolesStore[roleIndex].name.toLowerCase()) {
             return NextResponse.json({ message: 'Cannot change the name of a system role.' }, { status: 403 });
        }

 const updatedRole = updateRole(id, updateData);
 if (!updatedRole) return NextResponse.json({ message: 'Role not found' }, { status: 404 });
        return NextResponse.json(updatedRole);
    } catch (error: unknown) {
         if (error.message === 'Too Many Requests') {
            return NextResponse.json({ message: 'Too Many Requests' }, { status: 429 });
        }
        console.error('Error updating role:', error);
        return NextResponse.json({ message: 'Error updating role', error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await rateLimiterMiddleware(request);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'Role ID is required for deletion.' }, { status: 400 });
        }

        const initialLength = rolesStore.length;
        
        const roleToDelete = rolesStore.find(r => r.id === id);
        if (roleToDelete && roleToDelete.isSystemRole && !roleToDelete.isCommitteeRole) {
             return NextResponse.json({ message: 'Cannot delete a non-committee system role.' }, { status: 403 });
        }

        global.__API_ROLES_STORE__ = rolesStore.filter(r => r.id !== id);

        if (global.__API_ROLES_STORE__.length === initialLength) {
            return NextResponse.json({ message: 'Role not found.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Role deleted successfully.' });
    } catch (error: unknown) {
         if (error.message === 'Too Many Requests') {
            return NextResponse.json({ message: 'Too Many Requests' }, { status: 429 });
        }
        console.error('Error deleting role:', error);
        return NextResponse.json({ message: 'Error deleting role', error: error.message }, { status: 500 });
    }
}
