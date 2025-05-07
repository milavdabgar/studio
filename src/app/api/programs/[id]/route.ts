
import { NextResponse, type NextRequest } from 'next/server';
import type { Program } from '@/types/entities';

// More robust global store initialization
declare global {
  // eslint-disable-next-line no-var
  var __API_PROGRAMS_STORE__: Program[] | undefined;
}
if (!global.__API_PROGRAMS_STORE__) {
  global.__API_PROGRAMS_STORE__ = [];
}
// This variable will reference the global store.
// IMPORTANT: If this variable is reassigned (e.g., by .filter()), 
// global.__API_PROGRAMS_STORE__ must also be reassigned to reflect the change.
let programsStore: Program[] = global.__API_PROGRAMS_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  // Ensure the store is an array before searching
  if (!Array.isArray(global.__API_PROGRAMS_STORE__)) {
    console.error(`/api/programs/[id] GET: global.__API_PROGRAMS_STORE__ is not an array for id ${id}!`, global.__API_PROGRAMS_STORE__);
    global.__API_PROGRAMS_STORE__ = []; // Recover if possible
    return NextResponse.json({ message: 'Program data store corrupted.' }, { status: 500 });
  }
  const program = global.__API_PROGRAMS_STORE__.find(p => p.id === id);
  if (program) {
    return NextResponse.json(program);
  }
  return NextResponse.json({ message: 'Program not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_PROGRAMS_STORE__)) {
    console.error(`/api/programs/[id] PUT: global.__API_PROGRAMS_STORE__ is not an array for id ${id}!`);
    global.__API_PROGRAMS_STORE__ = [];
    return NextResponse.json({ message: 'Program data store corrupted.' }, { status: 500 });
  }

  try {
    const programDataToUpdate = await request.json() as Partial<Omit<Program, 'id'>>;
    const programIndex = global.__API_PROGRAMS_STORE__.findIndex(p => p.id === id);

    if (programIndex === -1) {
      return NextResponse.json({ message: 'Program not found' }, { status: 404 });
    }

    const existingProgram = global.__API_PROGRAMS_STORE__[programIndex];

    if (programDataToUpdate.name !== undefined && !programDataToUpdate.name.trim()) {
        return NextResponse.json({ message: 'Program Name cannot be empty.' }, { status: 400 });
    }
    if (programDataToUpdate.code !== undefined && !programDataToUpdate.code.trim()) {
        return NextResponse.json({ message: 'Program Code cannot be empty.' }, { status: 400 });
    }
    if (programDataToUpdate.code && programDataToUpdate.code.trim().toUpperCase() !== existingProgram.code.toUpperCase() && 
        global.__API_PROGRAMS_STORE__.some(p => p.id !== id && p.departmentId === (programDataToUpdate.departmentId || existingProgram.departmentId) && p.code.toLowerCase() === programDataToUpdate.code!.trim().toLowerCase())) {
        return NextResponse.json({ message: `Program with code '${programDataToUpdate.code.trim()}' already exists for this department.` }, { status: 409 });
    }
     if ((programDataToUpdate.durationYears && (isNaN(programDataToUpdate.durationYears) || programDataToUpdate.durationYears <= 0 || programDataToUpdate.durationYears > 10)) ||
        (programDataToUpdate.totalSemesters && (isNaN(programDataToUpdate.totalSemesters) || programDataToUpdate.totalSemesters <= 0 || programDataToUpdate.totalSemesters > 20))) {
      return NextResponse.json({ message: 'Please enter valid duration (1-10 years) and semester (1-20) numbers.' }, { status: 400 });
    }


    const updatedProgram = { ...existingProgram, ...programDataToUpdate };
    if(programDataToUpdate.code) updatedProgram.code = programDataToUpdate.code.trim().toUpperCase();
    if(programDataToUpdate.name) updatedProgram.name = programDataToUpdate.name.trim();
    if(programDataToUpdate.description !== undefined) updatedProgram.description = programDataToUpdate.description.trim() || undefined;

    global.__API_PROGRAMS_STORE__[programIndex] = updatedProgram; // Modifies array in place
    programsStore = global.__API_PROGRAMS_STORE__; // Keep local ref in sync
    return NextResponse.json(updatedProgram);
  } catch (error) {
    console.error(`Error updating program ${id}:`, error);
    return NextResponse.json({ message: `Error updating program ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_PROGRAMS_STORE__)) {
    console.error(`/api/programs/[id] DELETE: global.__API_PROGRAMS_STORE__ is not an array for id ${id}!`);
    global.__API_PROGRAMS_STORE__ = [];
    return NextResponse.json({ message: 'Program data store corrupted during delete operation.' }, { status: 500 });
  }

  const initialLength = global.__API_PROGRAMS_STORE__.length;
  const newStore = global.__API_PROGRAMS_STORE__.filter(p => p.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Program not found' }, { status: 404 });
  }
  
  global.__API_PROGRAMS_STORE__ = newStore; // Update the global store reference
  programsStore = global.__API_PROGRAMS_STORE__; // Update local reference
  
  return NextResponse.json({ message: 'Program deleted successfully' }, { status: 200 });
}

