
import { NextResponse, type NextRequest } from 'next/server';
import type { Department } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { DepartmentModel } from '@/lib/models';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = params;
    
    // Check if the ID is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }
    
    const department = await DepartmentModel.findById(id);
    if (!department) {
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }
    
    return NextResponse.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json({ message: 'Error fetching department', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = params;
    
    // Check if the ID is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }
    
    const departmentData = await request.json() as Partial<Omit<Department, 'id' | 'createdAt' | 'updatedAt'>>;
    
    const existingDepartment = await DepartmentModel.findById(id);
    if (!existingDepartment) {
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }

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
        _id: { $ne: id },
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
    const updateData: any = {
      ...departmentData,
      updatedAt: new Date().toISOString()
    };

    if (departmentData.name) updateData.name = departmentData.name.trim();
    if (departmentData.code) updateData.code = departmentData.code.trim().toUpperCase();
    if (departmentData.description !== undefined) updateData.description = departmentData.description?.trim() || undefined;
    if (departmentData.establishmentYear !== undefined) updateData.establishmentYear = departmentData.establishmentYear ? Number(departmentData.establishmentYear) : undefined;

    const updatedDepartment = await DepartmentModel.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(updatedDepartment);
  } catch (error) {
    console.error(`Error updating department ${params.id}:`, error);
    return NextResponse.json({ message: `Error updating department ${params.id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_DEPARTMENTS_STORE__)) {
    global.__API_DEPARTMENTS_STORE__ = [];
    return NextResponse.json({ message: 'Department data store corrupted.' }, { status: 500 });
  }
  const initialLength = global.__API_DEPARTMENTS_STORE__.length;
  const newStore = global.__API_DEPARTMENTS_STORE__.filter(d => d.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Department not found' }, { status: 404 });
  }
  global.__API_DEPARTMENTS_STORE__ = newStore;
  departmentsStore = global.__API_DEPARTMENTS_STORE__;
  return NextResponse.json({ message: 'Department deleted successfully' }, { status: 200 });
}
