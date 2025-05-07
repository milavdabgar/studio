
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
// let committeesStore: Committee[] = global.__API_COMMITTEES_STORE__; // Use global directly

if (!global.__API_ROLES_STORE__) {
  global.__API_ROLES_STORE__ = [];
}
// let rolesStore: Role[] = global.__API_ROLES_STORE__; // Use global directly

if (!global.__API_USERS_STORE__) {
  global.__API_USERS_STORE__ = [];
}
// let usersStore: User[] = global.__API_USERS_STORE__; // Use global directly


interface RouteParams {
  params: {
    id: string;
  };
}

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

    // Only update if roles actually changed
    if (JSON.stringify(newRoles.sort()) !== JSON.stringify(user.roles.sort())) {
      await userService.updateUser(userId, { roles: newRoles });
    }
  } catch (error) {
    console.error(`Failed to update role '${roleName}' for user ${userId}:`, error);
  }
}

async function updateCommitteeRoleNames(oldCommitteeName: string, newCommitteeName: string, committeeId: string, newCommitteeCode: string) {
    let currentRolesStore: Role[] = global.__API_ROLES_STORE__ || [];
    let currentUsersStore: User[] = global.__API_USERS_STORE__ || []; // For direct manipulation, if needed

    const roleTypes = ['Convener', 'Co-Convener', 'Member'];
    for (const type of roleTypes) {
        const oldRoleName = `${oldCommitteeName} ${type}`;
        const newRoleName = `${newCommitteeName} ${type}`;
        const newRoleCode = `${newCommitteeCode.toLowerCase()}_${type.toLowerCase().replace(/\s+/g, '_')}`;

        const roleIndex = currentRolesStore.findIndex(r => r.committeeId === committeeId && r.name === oldRoleName);
        if (roleIndex !== -1) {
            currentRolesStore[roleIndex].name = newRoleName;
            currentRolesStore[roleIndex].code = newRoleCode; // Also update code
            currentRolesStore[roleIndex].description = `${type} for the ${newCommitteeName} committee.`;
            currentRolesStore[roleIndex].updatedAt = new Date().toISOString();

            // Update users who have the old role name
            // This is for direct manipulation of in-memory usersStore. If userService updates users through API, this part might differ.
            currentUsersStore.forEach(user => {
                const userRoleIndex = user.roles.indexOf(oldRoleName);
                if (userRoleIndex !== -1) {
                    user.roles[userRoleIndex] = newRoleName;
                }
            });
        }
    }
    global.__API_ROLES_STORE__ = currentRolesStore;
    global.__API_USERS_STORE__ = currentUsersStore; // Persist changes if usersStore was manipulated
}


export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const committeesStore = global.__API_COMMITTEES_STORE__ || [];
  const committee = committeesStore.find(c => c.id === id);
  if (committee) {
    return NextResponse.json(committee);
  }
  return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  let committeesStore = global.__API_COMMITTEES_STORE__ || [];
  
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
    const newConvenerId = committeeData.convenerId === undefined ? existingCommittee.convenerId : (committeeData.convenerId === null ? undefined : committeeData.convenerId) ; // Handle null for unassigning

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
      convenerId: newConvenerId, // This is now correctly handling null or new ID
      updatedAt: new Date().toISOString(),
    };

    committeesStore[committeeIndex] = updatedCommittee;
    global.__API_COMMITTEES_STORE__ = committeesStore;

    if (newCommitteeName !== oldCommitteeName || newCommitteeCode !== existingCommittee.code) {
        await updateCommitteeRoleNames(oldCommitteeName, newCommitteeName, existingCommittee.id, newCommitteeCode);
    }
    
    // Handle convener role changes
    if (oldConvenerId && oldConvenerId !== newConvenerId) { // If old convener existed and is different from new one
      await updateUserSpecificConvenerRole(oldConvenerId, oldCommitteeName, false); // Remove role from old convener using old committee name
    }
    if (newConvenerId && newConvenerId !== oldConvenerId) { // If new convener exists and is different from old one
      await updateUserSpecificConvenerRole(newConvenerId, newCommitteeName, true); // Add role to new convener using new committee name
    } else if (newConvenerId && newConvenerId === oldConvenerId && (newCommitteeName !== oldCommitteeName)) { 
      // Convener is the same, but committee name changed, so update the role name for the convener
      await updateUserSpecificConvenerRole(newConvenerId, oldCommitteeName, false); // Remove old named role
      await updateUserSpecificConvenerRole(newConvenerId, newCommitteeName, true);  // Add new named role
    }


    return NextResponse.json(updatedCommittee);
  } catch (error) {
    console.error(`Error updating committee ${id}:`, error);
    return NextResponse.json({ message: `Error updating committee ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  let committeesStore = global.__API_COMMITTEES_STORE__ || [];
  let currentRolesStore = global.__API_ROLES_STORE__ || [];
  let currentUsersStore = global.__API_USERS_STORE__ || [];
  
  const committeeIndex = committeesStore.findIndex(c => c.id === id);
  if (committeeIndex === -1) {
    return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
  }

  const deletedCommittee = committeesStore.splice(committeeIndex, 1)[0];
  global.__API_COMMITTEES_STORE__ = committeesStore;

  // Delete associated committee roles
  const rolesToDelete = currentRolesStore.filter(r => r.committeeId === id);
  currentRolesStore = currentRolesStore.filter(r => r.committeeId !== id);
  global.__API_ROLES_STORE__ = currentRolesStore;

  // Remove these roles from any users who have them
  for (const role of rolesToDelete) {
      currentUsersStore.forEach(user => {
          if (user.roles.includes(role.name)) {
              user.roles = user.roles.filter(rName => rName !== role.name);
          }
      });
  }
  global.__API_USERS_STORE__ = currentUsersStore;


  // If there was a convener, remove their specific convener role for this committee
  if (deletedCommittee.convenerId) {
    await updateUserSpecificConvenerRole(deletedCommittee.convenerId, deletedCommittee.name, false);
  }

  return NextResponse.json({ message: 'Committee and associated roles deleted successfully' }, { status: 200 });
}
