import { NextResponse, type NextRequest } from 'next/server';
import type { Department } from '@/types/entities';

// In-memory store for departments
let departmentsStore: Department[] = (global as any).departmentsStore || [];
if (!(global as any).departmentsStore) {
  (global as any).departmentsStore = departmentsStore;
}


const generateId = (): string => `dept_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  return NextResponse.json(departmentsStore);
}

export async function POST(request: NextRequest) {
  try {
    const departmentData = await request.json() as Omit<Department, 'id'>;

    if (!departmentData.name || !departmentData.name.trim()) {
      return NextResponse.json({ message: 'Department Name cannot be empty.' }, { status: 400 });
    }
    if (!departmentData.code || !departmentData.code.trim()) {
      return NextResponse.json({ message: 'Department Code cannot be empty.' }, { status: 400 });
    }
    if (departmentsStore.some(d => d.code.toLowerCase() === departmentData.code.trim().toLowerCase())) {
        return NextResponse.json({ message: `Department with code '${departmentData.code.trim()}' already exists.` }, { status: 409 });
    }
    if (departmentData.establishmentYear && (isNaN(departmentData.establishmentYear) || departmentData.establishmentYear < 1900 || departmentData.establishmentYear > new Date().getFullYear())) {
      return NextResponse.json({ message: 'Please enter a valid establishment year.' }, { status: 400 });
    }
    
    const newDepartment: Department = {
      id: generateId(),
      name: departmentData.name.trim(),
      code: departmentData.code.trim().toUpperCase(),
      description: departmentData.description?.trim() || undefined,
      hodId: departmentData.hodId || undefined,
      establishmentYear: departmentData.establishmentYear ? Number(departmentData.establishmentYear) : undefined,
      status: departmentData.status || 'active',
    };
    departmentsStore.push(newDepartment);
    return NextResponse.json(newDepartment, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ message: 'Error creating department', error: (error as Error).message }, { status: 500 });
  }
}