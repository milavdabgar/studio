
import { NextResponse, type NextRequest } from 'next/server';
import type { Committee, UserRole, SystemUser as User, Role } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { userService } from '@/lib/api/users';

declare global {
  var __API_COMMITTEES_STORE__: Committee[] | undefined;
  var __API_ROLES_STORE__: Role[] | undefined;
  var __API_USERS_STORE__: User[] | undefined;
}

if (!global.__API_COMMITTEES_STORE__) {
  global.__API_COMMITTEES_STORE__ = [];
}
let committeesStore: Committee[] = global.__API_COMMITTEES_STORE__;

if (!global.__API_ROLES_STORE__) {
  global.__API_ROLES_STORE__ = [];
}
let rolesStore: Role[] = global.__API_ROLES_STORE__;

if (!global.__API_USERS_STORE__) {
  global.__API_USERS_STORE__ = [];
}
let usersStore: User[] = global.__API_USERS_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

async function updateUserRole(userId: string, roleName: UserRole, add: boolean) {
  try {
    const user = await userService.getUserById(userId) as User;
    if (!user) return;

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

async function updateCommitteeRoleNames(oldCommitteeName: string, newCommitteeName: string, committeeId: string, newCommitteeCode: string) {
    const roleTypes = ['Convener', 'Co-Convener', 'Member'];
    for (const type of roleTypes) {
        const oldRoleName = `${oldCommitteeName} ${type}`;
        const newRoleName = `${newCommitteeName} ${type}`;
        const newRoleCode = `${newCommitteeCode.toLowerCase()}_${type.toLowerCase().replace(/\s+/g, '_')}`;

        const roleIndex = rolesStore.findIndex(r => r.committeeId === committeeId && r.name === oldRoleName);
        if (roleIndex !== -1) {
            rolesStore[roleIndex].name = newRoleName;
            rolesStore[roleIndex].code = newRoleCode; // Also update code if it's derived from committee code
            rolesStore[roleIndex].description = `${type} for the ${newCommitteeName} committee.`;
            rolesStore[roleIndex].updatedAt = new Date().toISOString();

            // Update users who have the old role name
            usersStore.forEach(user => {
                if (user.roles.includes(oldRoleName)) {
                    user.roles = user.roles.map(r => r === oldRoleName ? newRoleName : r);
                    // No direct call to userService.updateUser here to avoid circular dependencies / complexity
                    // This assumes usersStore is the source of truth or will be persisted by userService eventually
                }
            });
        }
    }
    global.__API_ROLES_STORE__ = rolesStore;
    global.__API_USERS_STORE__ = usersStore;
}


export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_COMMITTEES_STORE__)) {
    global.__API_COMMITTEES_STORE__ = [];
    return NextResponse.json({ message: 'Committee data store corrupted.' }, { status: 500 });
  }
  const committee = committeesStore.find(c => c.id === id);
  if (committee) {
    return NextResponse.json(committee);
  }
  return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_COMMITTEES_STORE__) || !Array.isArray(global.__API_ROLES_STORE__) || !Array.isArray(global.__API_USERS_STORE__)) {
    // Initialize stores if they are not arrays
    global.__API_COMMITTEES_STORE__ = global.__API_COMMITTEES_STORE__ || [];
    global.__API_ROLES_STORE__ = global.__API_ROLES_STORE__ || [];
    global.__API_USERS_STORE__ = global.__API_USERS_STORE__ || [];
    return NextResponse.json({ message: 'Data store corrupted.' }, { status: 500 });
  }

  try {
    const committeeData = await request.json() as Partial<Omit<Committee, 'id' | 'createdAt' | 'updatedAt'>>;
    const committeeIndex = committeesStore.findIndex(c => c.id === id);

    if (committeeIndex === -1) {
      return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
    }
    const existingCommittee = committeesStore[committeeIndex];

    if (committeeData.name !== undefined && !committeeData.name.trim()) {
      return NextResponse.json({ message: 'Committee Name cannot be empty.' }, { status: 400 });
    }
    if (committeeData.code !== undefined && !committeeData.code.trim()) {
      return NextResponse.json({ message: 'Committee Code cannot be empty.' }, { status: 400 });
    }
    if (committeeData.purpose !== undefined && !committeeData.purpose.trim()) {
      return NextResponse.json({ message: 'Committee Purpose cannot be empty.' }, { status: 400 });
    }
     if (committeeData.instituteId !== undefined && !committeeData.instituteId) {
      return NextResponse.json({ message: 'Institute ID cannot be empty if provided for update.' }, { status: 400 });
    }
    if (committeeData.formationDate && !isValid(parseISO(committeeData.formationDate))) {
        return NextResponse.json({ message: 'Valid Formation Date is required (YYYY-MM-DD).' }, { status: 400 });
    }
    if (committeeData.dissolutionDate && committeeData.dissolutionDate !== null && !isValid(parseISO(committeeData.dissolutionDate))) {
        return NextResponse.json({ message: 'Valid Dissolution Date is required (YYYY-MM-DD) if provided.' }, { status: 400 });
    }
    if (committeeData.code && committeeData.code.trim().toUpperCase() !== existingCommittee.code.toUpperCase() && 
        committeesStore.some(c => c.id !== id && c.code.toUpperCase() === committeeData.code!.trim().toUpperCase() && c.instituteId === (committeeData.instituteId || existingCommittee.instituteId))) {
      return NextResponse.json({ message: `Committee with code '${committeeData.code.trim()}' already exists for this institute.` }, { status: 409 });
    }
     if (committeeData.name && committeeData.name.trim().toLowerCase() !== existingCommittee.name.toLowerCase() && 
        committeesStore.some(c => c.id !== id && c.name.toLowerCase() === committeeData.name!.trim().toLowerCase() && c.instituteId === (committeeData.instituteId || existingCommittee.instituteId))) {
      return NextResponse.json({ message: `Committee with name '${committeeData.name.trim()}' already exists for this institute.` }, { status: 409 });
    }


    const oldConvenerId = existingCommittee.convenerId;
    const newConvenerId = committeeData.convenerId === undefined ? existingCommittee.convenerId : committeeData.convenerId;
    const oldCommitteeName = existingCommittee.name;
    const newCommitteeName = committeeData.name ? committeeData.name.trim() : existingCommittee.name;
    const newCommitteeCode = committeeData.code ? committeeData.code.trim().toUpperCase() : existingCommittee.code;


    const updatedCommittee = { 
      ...existingCommittee, 
      ...committeeData,
      name: newCommitteeName,
      code: newCommitteeCode,
      description: committeeData.description !== undefined ? committeeData.description.trim() || undefined : existingCommittee.description,
      purpose: committeeData.purpose ? committeeData.purpose.trim() : existingCommittee.purpose,
      dissolutionDate: committeeData.dissolutionDate === null ? undefined : committeeData.dissolutionDate || existingCommittee.dissolutionDate,
      convenerId: newConvenerId,
      updatedAt: new Date().toISOString(),
    };

    committeesStore[committeeIndex] = updatedCommittee;
    global.__API_COMMITTEES_STORE__ = committeesStore;

    if (newCommitteeName !== oldCommitteeName || newCommitteeCode !== existingCommittee.code) {
        await updateCommitteeRoleNames(oldCommitteeName, newCommitteeName, existingCommittee.id, newCommitteeCode);
    }

    const convenerRoleName = `${newCommitteeName} Convener`;
    if (oldConvenerId && oldConvenerId !== newConvenerId) {
      const oldConvenerRoleName = `${oldCommitteeName} Convener`;
      await updateUserRole(oldConvenerId, oldConvenerRoleName, false);
    }
    if (newConvenerId && newConvenerId !== oldConvenerId) {
      await updateUserRole(newConvenerId, convenerRoleName, true);
    } else if (newConvenerId && newCommitteeName !== oldCommitteeName) { // Convener same, but committee name changed
        const oldConvenerRoleName = `${oldCommitteeName} Convener`;
        await updateUserRole(newConvenerId, oldConvenerRoleName, false); // Remove old role name
        await updateUserRole(newConvenerId, convenerRoleName, true); // Add new role name
    }


    return NextResponse.json(updatedCommittee);
  } catch (error) {
    console.error(`Error updating committee ${id}:`, error);
    return NextResponse.json({ message: `Error updating committee ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_COMMITTEES_STORE__) || !Array.isArray(global.__API_ROLES_STORE__) || !Array.isArray(global.__API_USERS_STORE__)) {
    global.__API_COMMITTEES_STORE__ = global.__API_COMMITTEES_STORE__ || [];
    global.__API_ROLES_STORE__ = global.__API_ROLES_STORE__ || [];
    global.__API_USERS_STORE__ = global.__API_USERS_STORE__ || [];
    return NextResponse.json({ message: 'Data store corrupted.' }, { status: 500 });
  }
  
  const committeeIndex = committeesStore.findIndex(c => c.id === id);
  if (committeeIndex === -1) {
    return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
  }

  const deletedCommittee = committeesStore.splice(committeeIndex, 1)[0];
  global.__API_COMMITTEES_STORE__ = committeesStore;

  // Delete associated committee roles
  const rolesToDelete = rolesStore.filter(r => r.committeeId === id);
  rolesStore = rolesStore.filter(r => r.committeeId !== id);
  global.__API_ROLES_STORE__ = rolesStore;

  // Remove these roles from any users who have them
  for (const role of rolesToDelete) {
      usersStore.forEach(user => {
          if (user.roles.includes(role.name)) {
              user.roles = user.roles.filter(rName => rName !== role.name);
              // Consider calling userService.updateUser if user store is not directly managed here for persistence
          }
      });
  }
  global.__API_USERS_STORE__ = usersStore;


  // If there was a convener, remove their specific convener role for this committee
  if (deletedCommittee.convenerId) {
    const convenerRoleName = `${deletedCommittee.name} Convener`;
    await updateUserRole(deletedCommittee.convenerId, convenerRoleName, false);
  }

  return NextResponse.json({ message: 'Committee and associated roles deleted successfully' }, { status: 200 });
}

    