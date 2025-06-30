
import { NextResponse, type NextRequest } from 'next/server';
import type { Committee, UserRole, SystemUser as User, Role } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { userService } from '@/lib/api/users';
import { connectMongoose } from '@/lib/mongodb';
import { CommitteeModel, RoleModel } from '@/lib/models';

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
  await connectMongoose();
  const committeeRolesInfo = [
    { type: 'Convener', permissions: ['view_committee_info', 'manage_committee_meetings', 'manage_committee_members'] },
    { type: 'Co-Convener', permissions: ['view_committee_info', 'manage_committee_meetings'] },
    { type: 'Member', permissions: ['view_committee_info'] },
  ];

  for (const roleInfo of committeeRolesInfo) {
    const roleNameSuffix = roleInfo.type; // "Convener", "Co-Convener", "Member"
    const newRoleName = `${committee.name} ${roleNameSuffix}`;
    const newRoleCode = `${committee.code.toLowerCase()}_${roleNameSuffix.toLowerCase().replace(/\s+/g, '_')}`;
    
    let existingRole = null;
    if (isUpdate && oldCommitteeDetails) {
      const oldRoleCode = `${oldCommitteeDetails.code.toLowerCase()}_${roleNameSuffix.toLowerCase().replace(/\s+/g, '_')}`;
      existingRole = await RoleModel.findOne({ code: oldRoleCode, committeeId: committee.id });
    } else {
      existingRole = await RoleModel.findOne({ code: newRoleCode, committeeId: committee.id });
    }

    if (existingRole) { // Update existing role
      const oldRoleCode = existingRole.code;

      await RoleModel.findByIdAndUpdate(existingRole._id, {
        name: newRoleName,
        code: newRoleCode, 
        description: `${roleInfo.type} for the ${committee.name} committee.`,
        committeeCode: committee.code, 
        updatedAt: new Date().toISOString(),
      });

      // Update user roles if the role code changed
      if (oldRoleCode !== newRoleCode) {
        try {
          // Find users with the old role code and update them
          const { UserModel } = await import('@/lib/models');
          await UserModel.updateMany(
            { roles: oldRoleCode },
            { $set: { "roles.$": newRoleCode } }
          );
        } catch (error) {
          console.error(`Failed to update user roles from ${oldRoleCode} to ${newRoleCode}:`, error);
        }
      }

    } else { // Create new role
      const existingRoleByCode = await RoleModel.findOne({ code: newRoleCode });
      if (existingRoleByCode) { 
          console.warn(`Role with code ${newRoleCode} already exists. Skipping creation for ${committee.name} ${roleInfo.type}.`);
          continue;
      }
      const currentTimestamp = new Date().toISOString();
      const newRole = new RoleModel({
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
      });
      await newRole.save();
    }
  }
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
  try {
    await connectMongoose();
    
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
    
    // Check for duplicates
    const existingByCode = await CommitteeModel.findOne({
      code: { $regex: new RegExp(`^${committeeData.code.trim()}$`, 'i') },
      instituteId: committeeData.instituteId
    });
    if (existingByCode) {
      return NextResponse.json({ message: `Committee with code '${committeeData.code.trim()}' already exists for this institute.` }, { status: 409 });
    }
    
    const existingByName = await CommitteeModel.findOne({
      name: { $regex: new RegExp(`^${committeeData.name.trim()}$`, 'i') },
      instituteId: committeeData.instituteId
    });
    if (existingByName) {
      return NextResponse.json({ message: `Committee with name '${committeeData.name.trim()}' already exists for this institute.` }, { status: 409 });
    }

    const currentTimestamp = new Date().toISOString();
    const newCommitteeData = {
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
      members: committeeData.members || [],
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newCommittee = new CommitteeModel(newCommitteeData);
    await newCommittee.save();
    
    // TODO: Role management functions need to be updated for MongoDB
    // await createOrUpdateCommitteeRoles(newCommittee, false); 
    // if (newCommittee.convenerId) {
    //   await updateUserConvenerRole(newCommittee.convenerId, newCommittee.code, newCommittee.name, true);
    // }
    
    return NextResponse.json(newCommittee.toJSON(), { status: 201 });
  } catch (error) {
    console.error('Error creating committee:', error);
    return NextResponse.json({ message: 'Error creating committee', error: (error as Error).message }, { status: 500 });
  }
}
