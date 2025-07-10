import { NextResponse, type NextRequest } from 'next/server';
import type { Role } from '@/types/entities';
import { allPermissions } from '@/lib/api/roles'; 
import { connectMongoose } from '@/lib/mongodb';
import { RoleModel, UserModel } from '@/lib/models';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    // Check if the ID is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 });
    }
    
    const role = await RoleModel.findById(id);
    if (!role) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 });
    }
    
    return NextResponse.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json({ message: 'Error fetching role' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    // Check if the ID is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 });
    }
    
    const roleData = await request.json() as Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt'>>;

    const existingRole = await RoleModel.findById(id);
    if (!existingRole) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 });
    }

    if (existingRole.isSystemRole && roleData.name && roleData.name.trim().toLowerCase() !== existingRole.name.toLowerCase()) {
        return NextResponse.json({ message: `Cannot change the name of the system role '${existingRole.name}'.` }, { status: 400 });
    }
    
    // Disallow changing the code of any role after creation
    if (roleData.code && roleData.code.trim().toLowerCase() !== existingRole.code.toLowerCase()) {
        return NextResponse.json({ message: `Changing the 'code' of a role is not allowed. Create a new role if a different code is needed.` }, { status: 400 });
    }

    if (roleData.name !== undefined && !roleData.name.trim()) {
        return NextResponse.json({ message: 'Role Name cannot be empty.' }, { status: 400 });
    }
    
    if (roleData.name && roleData.name.trim().toLowerCase() !== existingRole.name.toLowerCase()) {
        const nameExists = await RoleModel.findOne({ 
          _id: { $ne: id }, 
          name: { $regex: new RegExp(`^${roleData.name.trim()}$`, 'i') } 
        });
        if (nameExists) {
            return NextResponse.json({ message: `Role with name '${roleData.name.trim()}' already exists.` }, { status: 409 });
        }
    }

    if(roleData.permissions){
        roleData.permissions = roleData.permissions.filter(p => allPermissions.includes(p));
    }

    const updatedRoleData = { ...roleData };
    if (updatedRoleData.name) updatedRoleData.name = updatedRoleData.name.trim();
    // Code is not updated here as it's disallowed
    if (updatedRoleData.description !== undefined) updatedRoleData.description = updatedRoleData.description.trim();

    const updateData = { 
      ...updatedRoleData,
      code: existingRole.code, // Ensure code remains unchanged
      committeeCode: roleData.committeeCode ? roleData.committeeCode.toLowerCase() : existingRole.committeeCode,
      updatedAt: new Date().toISOString()
    };

    const updatedRole = await RoleModel.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error(`Error updating role:`, error);
    return NextResponse.json({ message: `Error updating role` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    // Check if the ID is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 });
    }
    
    const roleToDelete = await RoleModel.findById(id);
    if (!roleToDelete) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 });
    }
    
    if (roleToDelete.isSystemRole && !roleToDelete.isCommitteeRole) { // System roles (non-committee) are protected
        return NextResponse.json({ message: `Cannot delete the system role '${roleToDelete.name}'.` }, { status: 403 });
    }
    
    // Remove this role (by code) from all users
    await UserModel.updateMany(
      { roles: roleToDelete.code },
      { $pull: { roles: roleToDelete.code } }
    );

    await RoleModel.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Role deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting role:`, error);
    return NextResponse.json({ message: 'Error deleting role' }, { status: 500 });
  }
}
    