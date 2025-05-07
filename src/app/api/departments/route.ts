
import { NextResponse, type NextRequest } from 'next/server';
import type { Department } from '@/types/entities';

// More robust global store initialization for development
declare global {
  // eslint-disable-next-line no-var
  var __API_DEPARTMENTS_STORE__: Department[] | undefined;
}

if (!global.__API_DEPARTMENTS_STORE__) {
  global.__API_DEPARTMENTS_STORE__ = [
    // Example:
    // { id: "dept_comp", name: "Computer Engineering", code: "CE", status: "active", establishmentYear: 1984 },
    // { id: "dept_mech", name: "Mechanical Engineering", code: "ME", status: "active", establishmentYear: 1964 },
  ];
}
const departmentsStore: Department[] = global.__API_DEPARTMENTS_STORE__;


const generateId = (): string => `dept_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  if (!Array.isArray(global.__API_DEPARTMENTS_STORE__)) {
      console.error("/api/departments GET: global.__API_DEPARTMENTS_STORE__ is not an array!", global.__API_DEPARTMENTS_STORE__);
      global.__API_DEPARTMENTS_STORE__ = []; 
      return NextResponse.json({ message: 'Internal server error: Department data store corrupted.' }, { status: 500 });
  }
  return NextResponse.json(global.__API_DEPARTMENTS_STORE__);
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
    if (global.__API_DEPARTMENTS_STORE__?.some(d => d.code.toLowerCase() === departmentData.code.trim().toLowerCase())) {
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
    global.__API_DEPARTMENTS_STORE__?.push(newDepartment);
    return NextResponse.json(newDepartment, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ message: 'Error creating department', error: (error as Error).message }, { status: 500 });
  }
}
