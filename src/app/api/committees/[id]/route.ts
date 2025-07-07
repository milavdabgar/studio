import { NextResponse, type NextRequest } from 'next/server';
import type { Committee, UserRole, SystemUser as User, Role } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { userService } from '@/lib/api/users';
import { connectMongoose } from '@/lib/mongodb';
import { CommitteeModel } from '@/lib/models';


interface RouteParams {
  params: Promise<{
    id: string;
  }>;
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
  await connectMongoose();
  const { RoleModel, UserModel } = await import('@/lib/models');
  
  const committeeRolesInfo = [
    { type: 'Convener', permissions: ['view_committee_info', 'manage_committee_meetings', 'manage_committee_members'] },
    { type: 'Co-Convener', permissions: ['view_committee_info', 'manage_committee_meetings'] },
    { type: 'Member', permissions: ['view_committee_info'] },
  ];

  for (const roleInfo of committeeRolesInfo) {
    const roleNameSuffix = roleInfo.type; 
    const newRoleName = `${committee.name} ${roleNameSuffix}`;
    const newRoleCode = `${committee.code.toLowerCase()}_${roleNameSuffix.toLowerCase().replace(/\s+/g, '_')}`;
    
    let existingRole;
    let oldRoleCodeForSearch: string | undefined = undefined;

    if (isUpdate && oldCommitteeDetails) {
      oldRoleCodeForSearch = `${oldCommitteeDetails.code.toLowerCase()}_${roleNameSuffix.toLowerCase().replace(/\s+/g, '_')}`;
      existingRole = await RoleModel.findOne({ code: oldRoleCodeForSearch, committeeId: committee.id });
    } else {
       // For new committees or if old details not provided (shouldn't happen for update)
       existingRole = await RoleModel.findOne({ code: newRoleCode, committeeId: committee.id });
    }

    if (existingRole) { 
      const oldRoleCodeActual = existingRole.code;

      await RoleModel.updateOne(
        { _id: existingRole._id },
        {
          name: newRoleName,
          code: newRoleCode, 
          description: `${roleInfo.type} for the ${committee.name} committee.`,
          committeeCode: committee.code, 
          updatedAt: new Date().toISOString(),
        }
      );

      if (oldRoleCodeActual !== newRoleCode) { // If role code itself changed
        await UserModel.updateMany(
          { roles: oldRoleCodeActual },
          { $set: { "roles.$": newRoleCode } }
        );
      }

    } else { 
      const existingRoleWithCode = await RoleModel.findOne({ code: newRoleCode });
      if (existingRoleWithCode) { 
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
      await RoleModel.create(newRole);
    }
  }
}


export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    await connectMongoose();
    
    const { id } = await context.params;
    
    // Try to find by custom id field first, then by _id
    let committee = await CommitteeModel.findOne({ id }).lean();
    
    if (!committee) {
      // Try finding by MongoDB _id if id looks like an ObjectId
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        committee = await CommitteeModel.findById(id).lean();
      }
    }
    
    if (!committee) {
      return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
    }
    
    // Format committee to ensure proper id field
    const committeeWithId = {
      ...committee,
      id: (committee as unknown as { id?: string; _id: { toString(): string } }).id || (committee as unknown as { id?: string; _id: { toString(): string } })._id.toString()
    };
    
    return NextResponse.json(committeeWithId);
  } catch (error) {
    console.error('Error in GET /api/committees/[id]:', error);
    return NextResponse.json({ 
      message: 'Internal server error fetching committee.', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const committeeData = await request.json() as Partial<Omit<Committee, 'id' | 'createdAt' | 'updatedAt'>>;
    
    const existingCommittee = await CommitteeModel.findOne({
      $or: [{ id }, { _id: id }]
    });

    if (!existingCommittee) {
      return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
    }
    
    const oldCommitteeDetails = { name: existingCommittee.name, code: existingCommittee.code };

    // Validation
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
    if (newCode && newCode !== existingCommittee.code.toUpperCase()) {
      const existingWithCode = await CommitteeModel.findOne({
        code: { $regex: new RegExp(`^${newCode}$`, 'i') },
        instituteId: committeeData.instituteId || existingCommittee.instituteId,
        $nor: [{ id }, { _id: id }]
      });
      if (existingWithCode) {
        return NextResponse.json({ message: `Committee with code '${newCode}' already exists for this institute.` }, { status: 409 });
      }
    }
    
    const newName = committeeData.name?.trim();
    if (newName && newName.toLowerCase() !== existingCommittee.name.toLowerCase()) {
      const existingWithName = await CommitteeModel.findOne({
        name: { $regex: new RegExp(`^${newName}$`, 'i') },
        instituteId: committeeData.instituteId || existingCommittee.instituteId,
        $nor: [{ id }, { _id: id }]
      });
      if (existingWithName) {
        return NextResponse.json({ message: `Committee with name '${newName}' already exists for this institute.` }, { status: 409 });
      }
    }

    const oldConvenerId = existingCommittee.convenerId;
    const newConvenerId = committeeData.convenerId === undefined ? existingCommittee.convenerId : (committeeData.convenerId === null ? undefined : committeeData.convenerId);

    const updateData = {
      ...committeeData,
      name: newName || existingCommittee.name,
      code: newCode || existingCommittee.code,
      description: committeeData.description !== undefined ? committeeData.description?.trim() || undefined : existingCommittee.description,
      purpose: committeeData.purpose ? committeeData.purpose.trim() : existingCommittee.purpose,
      dissolutionDate: committeeData.dissolutionDate === null ? undefined : committeeData.dissolutionDate || existingCommittee.dissolutionDate,
      convenerId: newConvenerId, 
      updatedAt: new Date().toISOString(),
    };

    const updatedCommittee = await CommitteeModel.findOneAndUpdate(
      { $or: [{ id }, { _id: id }] },
      updateData,
      { new: true, lean: true }
    );

    if (!updatedCommittee) {
      return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
    }

    // Cast to Committee type for consistency
    const committee = updatedCommittee as unknown as Committee;
    
    if (committee.name !== oldCommitteeDetails.name || committee.code !== oldCommitteeDetails.code) {
        await createOrUpdateCommitteeRoles(committee, true, oldCommitteeDetails);
    }
    
    if (oldConvenerId && oldConvenerId !== newConvenerId) { 
      await updateUserConvenerRole(oldConvenerId, oldCommitteeDetails.code, oldCommitteeDetails.name, false);
    }
    if (newConvenerId && newConvenerId !== oldConvenerId) { 
      await updateUserConvenerRole(newConvenerId, committee.code, committee.name, true);
    } else if (newConvenerId && newConvenerId === oldConvenerId && (committee.name !== oldCommitteeDetails.name || committee.code !== oldCommitteeDetails.code)) { 
      await updateUserConvenerRole(newConvenerId, oldCommitteeDetails.code, oldCommitteeDetails.name, false);
      await updateUserConvenerRole(newConvenerId, committee.code, committee.name, true);
    }

    // Transform response
    const committeeResponse = {
      ...committee,
      id: committee.id || (committee as unknown as { _id?: { toString(): string } })._id?.toString()
    };

    return NextResponse.json(committeeResponse);
  } catch (error) {
    console.error('Error updating committee:', error);
    return NextResponse.json({ 
      message: 'Error updating committee', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    const { RoleModel, UserModel } = await import('@/lib/models');
    
    const existingCommittee = await CommitteeModel.findOne({
      $or: [{ id }, { _id: id }]
    });

    if (!existingCommittee) {
      return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
    }

    // Find and delete associated roles
    const rolesToDelete = await RoleModel.find({ committeeId: id });
    const roleCodesList = rolesToDelete.map(role => role.code);

    // Remove roles from users who have them
    if (roleCodesList.length > 0) {
      await UserModel.updateMany(
        { roles: { $in: roleCodesList } },
        { $pullAll: { roles: roleCodesList } }
      );
    }

    // Delete the roles
    await RoleModel.deleteMany({ committeeId: id });

    // Delete the committee
    await CommitteeModel.deleteOne({ $or: [{ id }, { _id: id }] });

    // Update convener role if needed
    if (existingCommittee.convenerId) {
      await updateUserConvenerRole(existingCommittee.convenerId, existingCommittee.code, existingCommittee.name, false);
    }

    return NextResponse.json({ message: 'Committee and associated roles deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting committee:', error);
    return NextResponse.json({ 
      message: 'Error deleting committee', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
