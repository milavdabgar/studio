
import { NextResponse, type NextRequest } from 'next/server';
import type { Committee, UserRole, SystemUser as User, Role } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { userService } from '@/lib/api/users';
import { connectMongoose } from '@/lib/mongodb';
import { CommitteeModel } from '@/lib/models';

// Initialize default committees if none exist
async function initializeDefaultCommittees() {
  await connectMongoose();
  const committeeCount = await CommitteeModel.countDocuments();
  
  if (committeeCount === 0) {
    const now = new Date().toISOString();
    const defaultCommittees = [
      {
        id: "cmt_arc_gpp",
        name: "Anti-Ragging Committee",
        code: "ARC_GPP",
        purpose: "To prevent ragging and ensure a safe campus environment.",
        instituteId: "inst1",
        formationDate: "2023-07-01",
        status: "active",
        convenerId: "user_hod_ce_gpp",
        members: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "cmt_cwan_gpp",
        name: "College Website & Network Committee",
        code: "CWAN_GPP",
        description: "Manages and maintains the college website and network infrastructure.",
        purpose: "To oversee digital presence and IT infrastructure.",
        instituteId: "inst1",
        formationDate: "2023-01-15",
        status: "active",
        convenerId: "user_committee_convener_gpp",
        members: [],
        createdAt: now,
        updatedAt: now,
      }
    ];
    
    await CommitteeModel.insertMany(defaultCommittees);
  }
}


const generateId = (): string => `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const generateRoleId = (): string => `role_cmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

async function updateUserConvenerRole(userId: string, committeeCode: string, committeeName: string, add: boolean) {
  const roleCode: UserRole = `${committeeCode.toLowerCase()}_convener`; // e.g., cwan_convener
  const roleName = `${committeeName} Convener`; // e.g., CWAN Convener

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
  const currentRolesStore: Role[] = global.__API_ROLES_STORE__ || [];
  const committeeRolesInfo = [
    { type: 'Convener', permissions: ['view_committee_info', 'manage_committee_meetings', 'manage_committee_members'] },
    { type: 'Co-Convener', permissions: ['view_committee_info', 'manage_committee_meetings'] },
    { type: 'Member', permissions: ['view_committee_info'] },
  ];

  for (const roleInfo of committeeRolesInfo) {
    const roleNameSuffix = roleInfo.type; // "Convener", "Co-Convener", "Member"
    const newRoleName = `${committee.name} ${roleNameSuffix}`;
    const newRoleCode = `${committee.code.toLowerCase()}_${roleNameSuffix.toLowerCase().replace(/\s+/g, '_')}`;
    
    let existingRoleIndex = -1;
    if (isUpdate && oldCommitteeDetails) {
      const oldRoleCode = `${oldCommitteeDetails.code.toLowerCase()}_${roleNameSuffix.toLowerCase().replace(/\s+/g, '_')}`;
      existingRoleIndex = currentRolesStore.findIndex(r => r.code === oldRoleCode && r.committeeId === committee.id);
    } else {
       existingRoleIndex = currentRolesStore.findIndex(r => r.code === newRoleCode && r.committeeId === committee.id);
    }


    if (existingRoleIndex !== -1) { // Update existing role
      const existingRole = currentRolesStore[existingRoleIndex];
      const oldRoleName = existingRole.name; 

      currentRolesStore[existingRoleIndex] = {
        ...existingRole,
        name: newRoleName,
        code: newRoleCode, 
        description: `${roleInfo.type} for the ${committee.name} committee.`,
        committeeCode: committee.code, 
        updatedAt: new Date().toISOString(),
      };

      if (oldRoleName !== newRoleName) {
        if (existingRole.code !== newRoleCode) {
          const currentUsersStore: User[] = (global as any).__API_USERS_STORE__ || [];
          currentUsersStore.forEach(user => {
            const userRoleIndex = user.roles.indexOf(existingRole.code);
            if (userRoleIndex !== -1) {
              user.roles[userRoleIndex] = newRoleCode;
            }
          });
          (global as any).__API_USERS_STORE__ = currentUsersStore;
        }
      }

    } else { // Create new role
      if (currentRolesStore.some(r => r.code === newRoleCode)) { 
          console.warn(`Role with code ${newRoleCode} already exists. Skipping creation for ${committee.name} ${roleInfo.type}.`);
          continue;
      }
      const currentTimestamp = new Date().toISOString();
      const newRole: Role = {
        id: generateRoleId(),
        name: newRoleName,
        code: newRoleCode,
        description: `${roleInfo.type} for the ${committee.name} committee.`,
        permissions: roleInfo.permissions,
        isSystemRole: false,
        isCommitteeRole: true,
        committeeId: committee.id,
        committeeCode: committee.code,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      };
      currentRolesStore.push(newRole);
    }
  }
  global.__API_ROLES_STORE__ = currentRolesStore;
}


export async function GET() {
  try {
    await connectMongoose();
    await initializeDefaultCommittees();
    
    const committees = await CommitteeModel.find({}).lean();
    
    // Format committees to ensure proper id field
    const committeesWithId = committees.map(committee => ({
      ...committee,
      id: committee.id || (committee as any)._id.toString()
    }));

    return NextResponse.json(committeesWithId);
  } catch (error) {
    console.error('Error in GET /api/committees:', error);
    return NextResponse.json({ message: 'Internal server error processing committees request.', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const committeesStore = global.__API_COMMITTEES_STORE__ || [];
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


    const currentTimestamp = new Date().toISOString();
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
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    committeesStore.push(newCommittee); 
    global.__API_COMMITTEES_STORE__ = committeesStore;
    
    await createOrUpdateCommitteeRoles(newCommittee, false); 

    if (newCommittee.convenerId) {
      await updateUserConvenerRole(newCommittee.convenerId, newCommittee.code, newCommittee.name, true);
    }
    
    return NextResponse.json(newCommittee, { status: 201 });
  } catch (error) {
    console.error('Error creating committee:', error);
    return NextResponse.json({ message: 'Error creating committee', error: (error as Error).message }, { status: 500 });
  }
}
