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
    
    // Try to find by MongoDB ObjectId first, then by custom id field
    let department;
    if (Types.ObjectId.isValid(id)) {
      department = await DepartmentModel.findById(id);
    } else {
      department = await DepartmentModel.findOne({ id });
    }
    
    if (!department) {
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }
    
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
    
    // Try to find by MongoDB ObjectId first, then by custom id field
    let existingDepartment;
    if (Types.ObjectId.isValid(id)) {
      existingDepartment = await DepartmentModel.findById(id);
    } else {
      existingDepartment = await DepartmentModel.findOne({ id });
    }
    
    if (!existingDepartment) {
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }
    
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
    
    // Try to find by MongoDB ObjectId first, then by custom id field
    let departmentToDelete;
    if (Types.ObjectId.isValid(id)) {
      departmentToDelete = await DepartmentModel.findById(id);
    } else {
      departmentToDelete = await DepartmentModel.findOne({ id });
    }
    
    if (!departmentToDelete) {
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }
    
    // TODO: Add validation to prevent deletion of departments that have associated programs, courses, or users
    
    await DepartmentModel.findByIdAndDelete(departmentToDelete._id);
    return NextResponse.json({ message: 'Department deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting department:`, error);
    return NextResponse.json({ message: 'Error deleting department' }, { status: 500 });
  }
}
