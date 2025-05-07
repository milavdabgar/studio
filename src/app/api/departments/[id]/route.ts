import { NextResponse, type NextRequest } from 'next/server';
import type { Department } from '@/types/entities';

// In-memory store for departments
let departmentsStore: Department[] = (global as any).departmentsStore || [];
if (!(global as any).departmentsStore) {
  (global as any).departmentsStore = departmentsStore;
}


interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const department = departmentsStore.find(d => d.id === id);
  if (department) {
    return NextResponse.json(department);
  }
  return NextResponse.json({ message: 'Department not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const departmentData = await request.json() as Partial<Omit<Department, 'id'>>;
    const departmentIndex = departmentsStore.findIndex(d => d.id === id);

    if (departmentIndex === -1) {
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }

    const existingDepartment = departmentsStore[departmentIndex];

    // Basic validation for partial update
    if (departmentData.name !== undefined && !departmentData.name.trim()) {
        return NextResponse.json({ message: 'Department Name cannot be empty.' }, { status: 400 });
    }
    if (departmentData.code !== undefined && !departmentData.code.trim()) {
        return NextResponse.json({ message: 'Department Code cannot be empty.' }, { status: 400 });
    }
     if (departmentData.code && departmentData.code.trim().toUpperCase() !== existingDepartment.code.toUpperCase() && departmentsStore.some(d => d.id !== id && d.code.toLowerCase() === departmentData.code!.trim().toLowerCase())) {
        return NextResponse.json({ message: `Department with code '${departmentData.code.trim()}' already exists.` }, { status: 409 });
    }
    if (departmentData.establishmentYear && (isNaN(departmentData.establishmentYear) || departmentData.establishmentYear < 1900 || departmentData.establishmentYear > new Date().getFullYear())) {
      return NextResponse.json({ message: 'Please enter a valid establishment year.' }, { status: 400 });
    }

    const updatedDepartment = { ...existingDepartment, ...departmentData };
    if(departmentData.code) updatedDepartment.code = departmentData.code.trim().toUpperCase();
    if(departmentData.name) updatedDepartment.name = departmentData.name.trim();
    if(departmentData.description !== undefined) updatedDepartment.description = departmentData.description.trim() || undefined;


    departmentsStore[departmentIndex] = updatedDepartment;
    return NextResponse.json(updatedDepartment);
  } catch (error) {
    console.error(`Error updating department ${id}:`, error);
    return NextResponse.json({ message: `Error updating department ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const initialLength = departmentsStore.length;
  departmentsStore = departmentsStore.filter(d => d.id !== id);

  if (departmentsStore.length === initialLength) {
    return NextResponse.json({ message: 'Department not found' }, { status: 404 });
  }
  // (global as any).departmentsStore = departmentsStore; // Already updated by filter
  return NextResponse.json({ message: 'Department deleted successfully' }, { status: 200 });
}