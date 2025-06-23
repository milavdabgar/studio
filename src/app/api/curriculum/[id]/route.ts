import { NextResponse, type NextRequest } from 'next/server';
import type { Curriculum } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';

declare global {
  var __API_CURRICULUM_STORE__: Curriculum[] | undefined;
}
if (!global.__API_CURRICULUM_STORE__) {
  global.__API_CURRICULUM_STORE__ = [];
}
let curriculumStore: Curriculum[] = global.__API_CURRICULUM_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!Array.isArray(global.__API_CURRICULUM_STORE__)) {
    global.__API_CURRICULUM_STORE__ = [];
    return NextResponse.json({ message: 'Curriculum data store corrupted.' }, { status: 500 });
  }
  const curriculum = global.__API_CURRICULUM_STORE__.find(c => c.id === id);
  if (curriculum) {
    return NextResponse.json(curriculum);
  }
  return NextResponse.json({ message: 'Curriculum not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_CURRICULUM_STORE__)) {
    global.__API_CURRICULUM_STORE__ = [];
    return NextResponse.json({ message: 'Curriculum data store corrupted.' }, { status: 500 });
  }
  try {
    const curriculumDataToUpdate = await request.json() as Partial<Omit<Curriculum, 'id' | 'createdAt' | 'updatedAt'>>;
    const curriculumIndex = global.__API_CURRICULUM_STORE__.findIndex(c => c.id === id);

    if (curriculumIndex === -1) {
      return NextResponse.json({ message: 'Curriculum not found' }, { status: 404 });
    }
    const existingCurriculum = global.__API_CURRICULUM_STORE__[curriculumIndex];

    if (curriculumDataToUpdate.version !== undefined && !curriculumDataToUpdate.version.trim()) {
        return NextResponse.json({ message: 'Version cannot be empty.' }, { status: 400 });
    }
    if (curriculumDataToUpdate.effectiveDate && !isValid(parseISO(curriculumDataToUpdate.effectiveDate))) {
        return NextResponse.json({ message: 'Invalid Effective Date format. Use YYYY-MM-DD.' }, { status: 400 });
    }
     if (curriculumDataToUpdate.courses && curriculumDataToUpdate.courses.length === 0) {
        return NextResponse.json({ message: 'Curriculum must contain at least one course.' }, { status: 400 });
    }
    if (curriculumDataToUpdate.version && curriculumDataToUpdate.version.trim().toLowerCase() !== existingCurriculum.version.toLowerCase() && 
        global.__API_CURRICULUM_STORE__.some(c => c.id !== id && c.programId === (curriculumDataToUpdate.programId || existingCurriculum.programId) && c.version.toLowerCase() === curriculumDataToUpdate.version!.trim().toLowerCase())) {
        return NextResponse.json({ message: `Curriculum version '${curriculumDataToUpdate.version.trim()}' already exists for this program.` }, { status: 409 });
    }

    const updatedCurriculum: Curriculum = { 
        ...existingCurriculum, 
        ...curriculumDataToUpdate,
        updatedAt: new Date().toISOString(),
    };
    if(curriculumDataToUpdate.version) updatedCurriculum.version = curriculumDataToUpdate.version.trim();


    global.__API_CURRICULUM_STORE__[curriculumIndex] = updatedCurriculum;
    curriculumStore = global.__API_CURRICULUM_STORE__;
    return NextResponse.json(updatedCurriculum);
  } catch (error) {
    console.error(`Error updating curriculum ${id}:`, error);
    return NextResponse.json({ message: `Error updating curriculum ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!Array.isArray(global.__API_CURRICULUM_STORE__)) {
    global.__API_CURRICULUM_STORE__ = [];
    return NextResponse.json({ message: 'Curriculum data store corrupted.' }, { status: 500 });
  }
  const initialLength = global.__API_CURRICULUM_STORE__.length;
  const newStore = global.__API_CURRICULUM_STORE__.filter(c => c.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Curriculum not found' }, { status: 404 });
  }
  
  global.__API_CURRICULUM_STORE__ = newStore;
  curriculumStore = global.__API_CURRICULUM_STORE__;
  return NextResponse.json({ message: 'Curriculum deleted successfully' }, { status: 200 });
}