
import { NextResponse, type NextRequest } from 'next/server';
import type { Program } from '@/types/entities'; 

// More robust global store initialization for development
declare global {
  // eslint-disable-next-line no-var
  var __API_PROGRAMS_STORE__: Program[] | undefined;
}

if (!global.__API_PROGRAMS_STORE__) {
  global.__API_PROGRAMS_STORE__ = [
    // Example initial data:
    // { id: "prog1", name: "Diploma in Computer Engineering", code: "DCE", departmentId: "dept_comp", durationYears: 3, totalSemesters: 6, status: "active" },
    // { id: "prog2", name: "Diploma in Mechanical Engineering", code: "DME", departmentId: "dept_mech", durationYears: 3, totalSemesters: 6, status: "active" },
  ];
}
// This variable will reference the global store.
// IMPORTANT: If this variable is reassigned (e.g., by .filter()), 
// global.__API_PROGRAMS_STORE__ must also be reassigned to reflect the change.
const programsStore: Program[] = global.__API_PROGRAMS_STORE__;

const generateId = (): string => `prog_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  // Ensure programsStore (via global) is an array before sending
  if (!Array.isArray(global.__API_PROGRAMS_STORE__)) {
      console.error("/api/programs GET: global.__API_PROGRAMS_STORE__ is not an array!", global.__API_PROGRAMS_STORE__);
      // Attempt to re-initialize if corrupted, though this indicates a deeper issue
      global.__API_PROGRAMS_STORE__ = []; 
      return NextResponse.json({ message: 'Internal server error: Program data store corrupted.' }, { status: 500 });
  }
  return NextResponse.json(global.__API_PROGRAMS_STORE__);
}

export async function POST(request: NextRequest) {
  try {
    const programData = await request.json() as Omit<Program, 'id'>;

    if (!programData.name || !programData.name.trim()) {
      return NextResponse.json({ message: 'Program Name cannot be empty.' }, { status: 400 });
    }
    if (!programData.code || !programData.code.trim()) {
      return NextResponse.json({ message: 'Program Code cannot be empty.' }, { status: 400 });
    }
    if (!programData.departmentId) {
      return NextResponse.json({ message: 'Department ID is required.' }, { status: 400 });
    }
     if (global.__API_PROGRAMS_STORE__?.some(p => p.code.toLowerCase() === programData.code.trim().toLowerCase() && p.departmentId === programData.departmentId)) {
        return NextResponse.json({ message: `Program with code '${programData.code.trim()}' already exists for this department.` }, { status: 409 });
    }
    if ((programData.durationYears && (isNaN(programData.durationYears) || programData.durationYears <= 0 || programData.durationYears > 10)) ||
        (programData.totalSemesters && (isNaN(programData.totalSemesters) || programData.totalSemesters <= 0 || programData.totalSemesters > 20))) {
      return NextResponse.json({ message: 'Please enter valid duration (1-10 years) and semester (1-20) numbers.' }, { status: 400 });
    }


    const newProgram: Program = {
      id: generateId(),
      name: programData.name.trim(),
      code: programData.code.trim().toUpperCase(),
      description: programData.description?.trim() || undefined,
      departmentId: programData.departmentId,
      durationYears: programData.durationYears ? Number(programData.durationYears) : undefined,
      totalSemesters: programData.totalSemesters ? Number(programData.totalSemesters) : undefined,
      status: programData.status || 'active',
    };
    global.__API_PROGRAMS_STORE__?.push(newProgram); // Modifies the array in place
    return NextResponse.json(newProgram, { status: 201 });
  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json({ message: 'Error creating program', error: (error as Error).message }, { status: 500 });
  }
}
