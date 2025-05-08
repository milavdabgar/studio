
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

if (!global.__API_ROLES_STORE__) {
  global.__API_ROLES_STORE__ = [];
}

if (!global.__API_USERS_STORE__) {
  global.__API_USERS_STORE__ = [];
}


interface RouteParams {
  params: {
    id: string;
  };
}

async function updateUserConvenerRole(userId: string, committeeCode: string, committeeName: string, add: boolean) {
  const roleCode: UserRole = `${committeeCode.toLowerCase()}_convener`;
  const roleName = `${committeeName} Convener`; 
  try {
    const user = await userService.getUserById(userId) as User;
    if (!user) {
        console.warn(`User ${userId} not found for convener role update (Role Code: ${roleCode})`);
        return;
    }

    let newRoles = [...user.roles]; // User roles are codes
    if (add && !newRoles.includes(roleCode)) {
      newRoles.push(roleCode);
    } else if (!add) {
      newRoles = newRoles.filter(r => r !== roleCode);
    }

    if (JSON.stringify(newRoles.sort()) !== JSON.stringify(user.roles.sort())) {
      await userService.updateUser(userId, { roles: newRoles });
    }
  } catch (error) {
    console.error(`Failed to update role (Code: '${roleCode}', Name: '${roleName}') for user ${userId}:`, error);
  }
}

async function createOrUpdateCommitteeRoles(committee: Committee, isUpdate: boolean = false, oldCommitteeDetails?: {name: string, code: string}) {
  let currentRolesStore: Role[] = global.__API_ROLES_STORE__ || [];
  const committeeRolesInfo = [
    { type: 'Convener', permissions: ['view_committee_info', 'manage_committee_meetings', 'manage_committee_members'] },
    { type: 'Co-Convener', permissions: ['view_committee_info', 'manage_committee_meetings'] },
    { type: 'Member', permissions: ['view_committee_info'] },
  ];

  for (const roleInfo of committeeRolesInfo) {
    const roleNameSuffix = roleInfo.type; 
    const newRoleName = `${committee.name} ${roleNameSuffix}`;
    const newRoleCode = `${committee.code.toLowerCase()}_${roleNameSuffix.toLowerCase().replace(/\s+/g, '_')}`;
    
    let existingRoleIndex = -1;
    let oldRoleCodeForSearch: string | undefined = undefined;

    if (isUpdate && oldCommitteeDetails) {
      oldRoleCodeForSearch = `${oldCommitteeDetails.code.toLowerCase()}_${roleNameSuffix.toLowerCase().replace(/\s+/g, '_')}`;
      existingRoleIndex = currentRolesStore.findIndex(r => r.code === oldRoleCodeForSearch && r.committeeId === committee.id);
    } else {
       // For new committees or if old details not provided (shouldn't happen for update)
       existingRoleIndex = currentRolesStore.findIndex(r => r.code === newRoleCode && r.committeeId === committee.id);
    }

    if (existingRoleIndex !== -1) { 
      const existingRole = currentRolesStore[existingRoleIndex];
      const oldRoleCodeActual = existingRole.code;

      currentRolesStore[existingRoleIndex] = {
        ...existingRole,
        name: newRoleName,
        code: newRoleCode, 
        description: `${roleInfo.type} for the ${committee.name} committee.`,
        committeeCode: committee.code, 
        updatedAt: new Date().toISOString(),
      };

      if (oldRoleCodeActual !== newRoleCode) { // If role code itself changed
        let currentUsersStore: User[] = (global as any).__API_USERS_STORE__ || [];
        currentUsersStore.forEach(user => {
          const userRoleIndex = user.roles.indexOf(oldRoleCodeActual);
          if (userRoleIndex !== -1) {
            user.roles[userRoleIndex] = newRoleCode; // Update to new role code
          }
        });
        (global as any).__API_USERS_STORE__ = currentUsersStore;
      }

    } else { 
      if (currentRolesStore.some(r => r.code === newRoleCode)) { 
          console.warn(`Role with code ${newRoleCode} already exists. Skipping creation for ${committee.name} ${roleInfo.type}.`);
          continue;
      }
      const newRole: Role = {
        id: `role_cmt_${committee.id.substring(0,4)}_${roleInfo.type.toLowerCase()}_${Date.now().toString().slice(-4)}`,
        name: newRoleName,
        code: newRoleCode,
        description: `${roleInfo.type} for the ${committee.name} committee.`,
        permissions: roleInfo.permissions,
        isSystemRole: false,
        isCommitteeRole: true,
        committeeId: committee.id,
        committeeCode: committee.code,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      currentRolesStore.push(newRole);
    }
  }
  global.__API_ROLES_STORE__ = currentRolesStore;
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
    const oldCommitteeDetails = { name: existingCommittee.name, code: existingCommittee.code };


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
    
    const newCode = committeeData.code?.trim().toUpperCase();
    if (newCode && newCode !== existingCommittee.code.toUpperCase() && 
        committeesStore.some(c => c.id !== id && c.code.toUpperCase() === newCode && c.instituteId === (committeeData.instituteId || existingCommittee.instituteId))) {
      return NextResponse.json({ message: `Committee with code '${newCode}' already exists for this institute.` }, { status: 409 });
    }
    const newName = committeeData.name?.trim();
     if (newName && newName.toLowerCase() !== existingCommittee.name.toLowerCase() && 
        committeesStore.some(c => c.id !== id && c.name.toLowerCase() === newName.toLowerCase() && c.instituteId === (committeeData.instituteId || existingCommittee.instituteId))) {
      return NextResponse.json({ message: `Committee with name '${newName}' already exists for this institute.` }, { status: 409 });
    }


    const oldConvenerId = existingCommittee.convenerId;
    const newConvenerId = committeeData.convenerId === undefined ? existingCommittee.convenerId : (committeeData.convenerId === null ? undefined : committeeData.convenerId);


    const updatedCommittee = { 
      ...existingCommittee, 
      ...committeeData,
      name: newName || existingCommittee.name,
      code: newCode || existingCommittee.code,
      description: committeeData.description !== undefined ? committeeData.description.trim() || undefined : existingCommittee.description,
      purpose: committeeData.purpose ? committeeData.purpose.trim() : existingCommittee.purpose,
      dissolutionDate: committeeData.dissolutionDate === null ? undefined : committeeData.dissolutionDate || existingCommittee.dissolutionDate,
      convenerId: newConvenerId, 
      updatedAt: new Date().toISOString(),
    };

    committeesStore[committeeIndex] = updatedCommittee;
    global.__API_COMMITTEES_STORE__ = committeesStore;

    if (updatedCommittee.name !== oldCommitteeDetails.name || updatedCommittee.code !== oldCommitteeDetails.code) {
        await createOrUpdateCommitteeRoles(updatedCommittee, true, oldCommitteeDetails);
    }
    
    if (oldConvenerId && oldConvenerId !== newConvenerId) { 
      await updateUserConvenerRole(oldConvenerId, oldCommitteeDetails.code, oldCommitteeDetails.name, false);
    }
    if (newConvenerId && newConvenerId !== oldConvenerId) { 
      await updateUserConvenerRole(newConvenerId, updatedCommittee.code, updatedCommittee.name, true);
    } else if (newConvenerId && newConvenerId === oldConvenerId && (updatedCommittee.name !== oldCommitteeDetails.name || updatedCommittee.code !== oldCommitteeDetails.code) ) { 
      await updateUserConvenerRole(newConvenerId, oldCommitteeDetails.code, oldCommitteeDetails.name, false);
      await updateUserConvenerRole(newConvenerId, updatedCommittee.code, updatedCommittee.name, true);
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
  let currentUsersStore: User[] = (global as any).__API_USERS_STORE__ || [];
  
  const committeeIndex = committeesStore.findIndex(c => c.id === id);
  if (committeeIndex === -1) {
    return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
  }

  const deletedCommittee = committeesStore.splice(committeeIndex, 1)[0];
  global.__API_COMMITTEES_STORE__ = committeesStore;

  const rolesToDelete = currentRolesStore.filter(r => r.committeeId === id);
  currentRolesStore = currentRolesStore.filter(r => r.committeeId !== id);
  global.__API_ROLES_STORE__ = currentRolesStore;

  for (const role of rolesToDelete) {
      currentUsersStore.forEach(user => {
          if (user.roles.includes(role.code)) { // Check against role CODE
              user.roles = user.roles.filter(rCode => rCode !== role.code);
          }
      });
  }
  (global as any).__API_USERS_STORE__ = currentUsersStore;

  if (deletedCommittee.convenerId) {
    await updateUserConvenerRole(deletedCommittee.convenerId, deletedCommittee.code, deletedCommittee.name, false);
  }

  return NextResponse.json({ message: 'Committee and associated roles deleted successfully' }, { status: 200 });
}
