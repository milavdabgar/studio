import { NextResponse, type NextRequest } from 'next/server';
import type { Department } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { DepartmentModel, UserModel } from '@/lib/models';
import { Types } from 'mongoose';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    console.log(`[GET Department] Looking for ID: "${id}"`);
    
    // Try to find by MongoDB ObjectId first, then by custom id field
    let department;
    if (Types.ObjectId.isValid(id)) {
      console.log(`[GET Department] Searching by MongoDB ObjectId: ${id}`);
      department = await DepartmentModel.findById(id);
    } else {
      console.log(`[GET Department] Searching by custom id field: ${id}`);
      department = await DepartmentModel.findOne({ id });
    }
    
    // If not found by exact match, try a case-insensitive search
    if (!department) {
      console.log(`[GET Department] Exact match failed, trying case-insensitive search`);
      department = await DepartmentModel.findOne({ 
        id: { $regex: new RegExp(`^${id}$`, 'i') } 
      });
    }
    
    // If still not found, try to find by _id if it looks like an ObjectId
    if (!department && id.length === 24) {
      try {
        console.log(`[GET Department] Trying as MongoDB _id: ${id}`);
        department = await DepartmentModel.findById(id);
      } catch (err) {
        console.log(`[GET Department] MongoDB _id search failed:`, err);
      }
    }
    
    if (!department) {
      console.log(`[GET Department] Department not found for ID: "${id}"`);
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }
    
    console.log(`[GET Department] Found department: ${department.name} (ID: ${department.id})`);
    return NextResponse.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json({ message: 'Error fetching department' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    console.log(`[PUT Department] Looking for ID: "${id}"`);
    
    // Try to find by MongoDB ObjectId first, then by custom id field
    let existingDepartment;
    if (Types.ObjectId.isValid(id)) {
      console.log(`[PUT Department] Searching by MongoDB ObjectId: ${id}`);
      existingDepartment = await DepartmentModel.findById(id);
    } else {
      console.log(`[PUT Department] Searching by custom id field: ${id}`);
      existingDepartment = await DepartmentModel.findOne({ id });
    }
    
    // If not found by exact match, try a case-insensitive search
    if (!existingDepartment) {
      console.log(`[PUT Department] Exact match failed, trying case-insensitive search`);
      existingDepartment = await DepartmentModel.findOne({ 
        id: { $regex: new RegExp(`^${id}$`, 'i') } 
      });
    }
    
    // If still not found, try to find by _id if it looks like an ObjectId
    if (!existingDepartment && id.length === 24) {
      try {
        console.log(`[PUT Department] Trying as MongoDB _id: ${id}`);
        existingDepartment = await DepartmentModel.findById(id);
      } catch (err) {
        console.log(`[PUT Department] MongoDB _id search failed:`, err);
      }
    }
    
    if (!existingDepartment) {
      console.log(`[PUT Department] Department not found for ID: "${id}"`);
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }
    
    console.log(`[PUT Department] Found department: ${existingDepartment.name} (ID: ${existingDepartment.id})`);
    
    
    const departmentData = await request.json() as Partial<Omit<Department, 'id' | 'createdAt' | 'updatedAt'>>;

    // Validate required fields if they're being updated
    if (departmentData.name !== undefined && (!departmentData.name || !departmentData.name.trim())) {
      return NextResponse.json({ message: 'Department Name cannot be empty.' }, { status: 400 });
    }
    if (departmentData.code !== undefined && (!departmentData.code || !departmentData.code.trim())) {
      return NextResponse.json({ message: 'Department Code cannot be empty.' }, { status: 400 });
    }
    
    // Check for duplicate department code within the institute if code is being changed
    if (departmentData.code && departmentData.code.trim().toUpperCase() !== existingDepartment.code) {
      const duplicateCode = await DepartmentModel.findOne({ 
        _id: { $ne: existingDepartment._id },
        code: { $regex: new RegExp(`^${departmentData.code.trim()}$`, 'i') },
        instituteId: departmentData.instituteId || existingDepartment.instituteId 
      });
      
      if (duplicateCode) {
        return NextResponse.json({ message: `Department with code '${departmentData.code.trim()}' already exists for this institute.` }, { status: 409 });
      }
    }
    
    if (departmentData.establishmentYear !== undefined && departmentData.establishmentYear && (isNaN(departmentData.establishmentYear) || departmentData.establishmentYear < 1900 || departmentData.establishmentYear > new Date().getFullYear())) {
      return NextResponse.json({ message: 'Please enter a valid establishment year.' }, { status: 400 });
    }

    // Handle HOD role assignment changes
    const oldHodId = existingDepartment.hodId;
    const newHodId = departmentData.hodId;
    
    // Update department data
    const updateData: Record<string, unknown> = {
      ...departmentData,
      updatedAt: new Date().toISOString()
    };

    if (departmentData.name) updateData.name = departmentData.name.trim();
    if (departmentData.code) updateData.code = departmentData.code.trim().toUpperCase();
    if (departmentData.description !== undefined) updateData.description = departmentData.description?.trim() || undefined;
    if (departmentData.establishmentYear !== undefined) updateData.establishmentYear = departmentData.establishmentYear ? Number(departmentData.establishmentYear) : undefined;

    const updatedDepartment = await DepartmentModel.findByIdAndUpdate(existingDepartment._id, updateData, { new: true });

    // Handle HOD role changes if hodId was updated
    if (departmentData.hodId !== undefined && oldHodId !== newHodId) {
      console.log(`[PUT Department] HOD changed from ${oldHodId} to ${newHodId}`);
      
      // Remove 'hod' role from previous HOD if exists
      if (oldHodId) {
        try {
          const oldHod = await UserModel.findById(oldHodId);
          if (oldHod && oldHod.roles.includes('hod')) {
            const updatedRoles = oldHod.roles.filter(role => role !== 'hod');
            await UserModel.findByIdAndUpdate(oldHodId, { 
              roles: updatedRoles,
              updatedAt: new Date().toISOString()
            });
            console.log(`[PUT Department] Removed 'hod' role from user ${oldHodId}`);
          }
        } catch (error) {
          console.error(`[PUT Department] Error removing hod role from ${oldHodId}:`, error);
          // Don't fail the department update if this fails, just log it
        }
      }
      
      // Add 'hod' role to new HOD if exists
      if (newHodId) {
        try {
          const newHod = await UserModel.findById(newHodId);
          if (newHod && !newHod.roles.includes('hod')) {
            const updatedRoles = [...newHod.roles, 'hod'];
            await UserModel.findByIdAndUpdate(newHodId, { 
              roles: updatedRoles,
              updatedAt: new Date().toISOString()
            });
            console.log(`[PUT Department] Added 'hod' role to user ${newHodId}`);
          }
        } catch (error) {
          console.error(`[PUT Department] Error adding hod role to ${newHodId}:`, error);
          // Don't fail the department update if this fails, just log it
        }
      }
      
      // Clear login cache to ensure updated roles are reflected immediately
      console.log(`[PUT Department] Role changes detected - recommending cache clear for login`);
    }

    return NextResponse.json(updatedDepartment);
  } catch (error) {
    console.error(`Error updating department:`, error);
    return NextResponse.json({ message: `Error updating department` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    console.log(`[DELETE Department] Looking for ID: "${id}"`);
    
    // Try to find by MongoDB ObjectId first, then by custom id field
    let departmentToDelete;
    if (Types.ObjectId.isValid(id)) {
      console.log(`[DELETE Department] Searching by MongoDB ObjectId: ${id}`);
      departmentToDelete = await DepartmentModel.findById(id);
    } else {
      console.log(`[DELETE Department] Searching by custom id field: ${id}`);
      departmentToDelete = await DepartmentModel.findOne({ id });
    }
    
    // If not found by exact match, try a case-insensitive search
    if (!departmentToDelete) {
      console.log(`[DELETE Department] Exact match failed, trying case-insensitive search`);
      departmentToDelete = await DepartmentModel.findOne({ 
        id: { $regex: new RegExp(`^${id}$`, 'i') } 
      });
    }
    
    // If still not found, try to find by _id if it looks like an ObjectId
    if (!departmentToDelete && id.length === 24) {
      try {
        console.log(`[DELETE Department] Trying as MongoDB _id: ${id}`);
        departmentToDelete = await DepartmentModel.findById(id);
      } catch (err) {
        console.log(`[DELETE Department] MongoDB _id search failed:`, err);
      }
    }
    
    if (!departmentToDelete) {
      console.log(`[DELETE Department] Department not found for ID: "${id}"`);
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }
    
    console.log(`[DELETE Department] Found department: ${departmentToDelete.name} (ID: ${departmentToDelete.id})`);
    
    // Remove 'hod' role from current HOD if exists before deleting department
    if (departmentToDelete.hodId) {
      try {
        const currentHod = await UserModel.findById(departmentToDelete.hodId);
        if (currentHod && currentHod.roles.includes('hod')) {
          const updatedRoles = currentHod.roles.filter(role => role !== 'hod');
          await UserModel.findByIdAndUpdate(departmentToDelete.hodId, { 
            roles: updatedRoles,
            updatedAt: new Date().toISOString()
          });
          console.log(`[DELETE Department] Removed 'hod' role from user ${departmentToDelete.hodId} due to department deletion`);
        }
      } catch (error) {
        console.error(`[DELETE Department] Error removing hod role from ${departmentToDelete.hodId}:`, error);
        // Don't fail the department deletion if this fails, just log it
      }
    }
    
    // TODO: Add validation to prevent deletion of departments that have associated programs, courses, or users
    
    await DepartmentModel.findByIdAndDelete(departmentToDelete._id);
    return NextResponse.json({ message: 'Department deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting department:`, error);
    return NextResponse.json({ message: 'Error deleting department' }, { status: 500 });
  }
}
