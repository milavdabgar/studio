
import { NextResponse, type NextRequest } from 'next/server';
import type { Committee, UserRole, SystemUser as User, Role } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { userService } from '@/lib/api/users';

declare global {
  var __API_COMMITTEES_STORE__: Committee[] | undefined;
  var __API_ROLES_STORE__: Role[] | undefined;
}

if (!global.__API_COMMITTEES_STORE__) {
  global.__API_COMMITTEES_STORE__ = [];
}
// const committeesStore: Committee[] = global.__API_COMMITTEES_STORE__; // Use global directly

if (!global.__API_ROLES_STORE__) { 
  global.__API_ROLES_STORE__ = [];
}
// const rolesStore: Role[] = global.__API_ROLES_STORE__; // Use global directly


const generateId = (): string => `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const generateRoleId = (): string => `role_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

// This function now updates the specific committee convener role, e.g., "CWAN Convener"
async function updateUserSpecificConvenerRole(userId: string, committeeName: string, add: boolean) {
  const roleName: UserRole = `${committeeName} Convener`;
  try {
    const user = await userService.getUserById(userId) as User; 
    if (!user) {
        console.warn(`User ${userId} not found for role update to ${roleName}`);
        return;
    }

    let newRoles = [...user.roles];
    if (add && !newRoles.includes(roleName)) {
      newRoles.push(roleName);
    } else if (!add) {
      newRoles = newRoles.filter(r => r !== roleName);
    }

    if (JSON.stringify(newRoles.sort()) !== JSON.stringify(user.roles.sort())) {
      await userService.updateUser(userId, { roles: newRoles });
    }
  } catch (error) {
    console.error(`Failed to update role '${roleName}' for user ${userId}:`, error);
  }
}

async function createCommitteeRoles(committee: Committee) {
  let currentRolesStore: Role[] = global.__API_ROLES_STORE__ || [];
  const committeeRolesInfo = [
    { type: 'Convener', permissions: ['view_committee_info', 'manage_committee_meetings', 'manage_committee_members'] },
    { type: 'Co-Convener', permissions: ['view_committee_info', 'manage_committee_meetings'] },
    { type: 'Member', permissions: ['view_committee_info'] },
  ];

  for (const roleInfo of committeeRolesInfo) {
    const roleName = `${committee.name} ${roleInfo.type}`;
    const roleCode = `${committee.code.toLowerCase()}_${roleInfo.type.toLowerCase().replace(/\s+/g, '_')}`;
    
    if (!currentRolesStore.some(r => r.code === roleCode)) {
      const newRole: Role = {
        id: generateRoleId(),
        name: roleName,
        code: roleCode,
        description: `${roleInfo.type} for the ${committee.name} committee.`,
        permissions: roleInfo.permissions,
        isSystemRole: false,
        isCommitteeRole: true,
        committeeId: committee.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      currentRolesStore.push(newRole);
    }
  }
  global.__API_ROLES_STORE__ = currentRolesStore;
}


export async function GET() {
  const committeesStore = global.__API_COMMITTEES_STORE__ || [];
  return NextResponse.json(committeesStore);
}

export async function POST(request: NextRequest) {
  let committeesStore = global.__API_COMMITTEES_STORE__ || [];
  try {
    const committeeData = await request.json() as Omit<Committee, 'id' | 'createdAt' | 'updatedAt'>;

    if (!committeeData.name || !committeeData.name.trim()) {
      return NextResponse.json({ message: 'Committee Name is required.' }, { status: 400 });
    }
    if (!committeeData.code || !committeeData.code.trim()) {
      return NextResponse.json({ message: 'Committee Code is required.' }, { status: 400 });
    }
    if (!committeeData.purpose || !committeeData.purpose.trim()) {
      return NextResponse.json({ message: 'Committee Purpose is required.' }, { status: 400 });
    }
    if (!committeeData.instituteId) {
      return NextResponse.json({ message: 'Institute ID is required.' }, { status: 400 });
    }
    if (!committeeData.formationDate || !isValid(parseISO(committeeData.formationDate))) {
        return NextResponse.json({ message: 'Valid Formation Date is required (YYYY-MM-DD).' }, { status: 400 });
    }
    if (committeeData.dissolutionDate && !isValid(parseISO(committeeData.dissolutionDate))) {
        return NextResponse.json({ message: 'Valid Dissolution Date is required (YYYY-MM-DD) if provided.' }, { status: 400 });
    }
    if (committeesStore.some(c => c.code.toLowerCase() === committeeData.code.trim().toLowerCase() && c.instituteId === committeeData.instituteId)) {
      return NextResponse.json({ message: `Committee with code '${committeeData.code.trim()}' already exists for this institute.` }, { status: 409 });
    }
    if (committeesStore.some(c => c.name.toLowerCase() === committeeData.name.trim().toLowerCase() && c.instituteId === committeeData.instituteId)) {
      return NextResponse.json({ message: `Committee with name '${committeeData.name.trim()}' already exists for this institute.` }, { status: 409 });
    }


    const now = new Date().toISOString();
    const newCommittee: Committee = {
      id: generateId(),
      name: committeeData.name.trim(),
      code: committeeData.code.trim().toUpperCase(),
      description: committeeData.description?.trim() || undefined,
      purpose: committeeData.purpose.trim(),
      instituteId: committeeData.instituteId,
      formationDate: committeeData.formationDate, 
      dissolutionDate: committeeData.dissolutionDate || undefined,
      status: committeeData.status || 'active',
      convenerId: committeeData.convenerId || undefined,
      createdAt: now,
      updatedAt: now,
    };
    
    committeesStore.push(newCommittee); // Add to store before creating roles, as createCommitteeRoles needs the ID
    global.__API_COMMITTEES_STORE__ = committeesStore;
    
    await createCommitteeRoles(newCommittee); 

    if (newCommittee.convenerId) {
      await updateUserSpecificConvenerRole(newCommittee.convenerId, newCommittee.name, true);
    }
    
    return NextResponse.json(newCommittee, { status: 201 });
  } catch (error) {
    console.error('Error creating committee:', error);
    return NextResponse.json({ message: 'Error creating committee', error: (error as Error).message }, { status: 500 });
  }
}
