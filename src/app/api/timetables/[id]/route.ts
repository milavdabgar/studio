
import { NextResponse, type NextRequest } from 'next/server';
import type { Timetable } from '@/types/entities';

declare global {
  var __API_TIMETABLES_STORE__: Timetable[] | undefined;
}
// Ensure store is initialized (can be moved to a shared util if used across many routes)
if (!global.__API_TIMETABLES_STORE__) {
  global.__API_TIMETABLES_STORE__ = [];
}
let timetablesStore: Timetable[] = global.__API_TIMETABLES_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_TIMETABLES_STORE__)) {
    global.__API_TIMETABLES_STORE__ = [];
    return NextResponse.json({ message: 'Timetable data store corrupted.' }, { status: 500 });
  }
  const timetable = global.__API_TIMETABLES_STORE__.find(t => t.id === id);
  if (timetable) {
    return NextResponse.json(timetable);
  }
  return NextResponse.json({ message: 'Timetable not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_TIMETABLES_STORE__)) {
    global.__API_TIMETABLES_STORE__ = [];
    return NextResponse.json({ message: 'Timetable data store corrupted.' }, { status: 500 });
  }
  try {
    const timetableDataToUpdate = await request.json() as Partial<Omit<Timetable, 'id' | 'createdAt' | 'updatedAt'>>;
    const timetableIndex = global.__API_TIMETABLES_STORE__.findIndex(t => t.id === id);

    if (timetableIndex === -1) {
      return NextResponse.json({ message: 'Timetable not found' }, { status: 404 });
    }
    
    // Add any specific validation for update here if needed

    const updatedTimetable: Timetable = { 
        ...global.__API_TIMETABLES_STORE__[timetableIndex], 
        ...timetableDataToUpdate,
        updatedAt: new Date().toISOString(),
    };

    global.__API_TIMETABLES_STORE__[timetableIndex] = updatedTimetable;
    timetablesStore = global.__API_TIMETABLES_STORE__; 
    return NextResponse.json(updatedTimetable);
  } catch (error) {
    console.error(`Error updating timetable ${id}:`, error);
    return NextResponse.json({ message: `Error updating timetable ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_TIMETABLES_STORE__)) {
    global.__API_TIMETABLES_STORE__ = [];
    return NextResponse.json({ message: 'Timetable data store corrupted.' }, { status: 500 });
  }
  const initialLength = global.__API_TIMETABLES_STORE__.length;
  const newStore = global.__API_TIMETABLES_STORE__.filter(t => t.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Timetable not found' }, { status: 404 });
  }
  
  global.__API_TIMETABLES_STORE__ = newStore;
  timetablesStore = global.__API_TIMETABLES_STORE__; 
  return NextResponse.json({ message: 'Timetable deleted successfully' }, { status: 200 });
}
