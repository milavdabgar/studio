import { NextResponse, type NextRequest } from 'next/server';
import type { Department } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { DepartmentModel } from '@/lib/models';
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
    
    // TODO: Add validation to prevent deletion of departments that have associated programs, courses, or users
    
    await DepartmentModel.findByIdAndDelete(departmentToDelete._id);
    return NextResponse.json({ message: 'Department deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting department:`, error);
    return NextResponse.json({ message: 'Error deleting department' }, { status: 500 });
  }
}
