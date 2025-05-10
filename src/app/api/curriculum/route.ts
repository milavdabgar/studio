import { NextResponse, type NextRequest } from 'next/server';
import type { Curriculum } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';

declare global {
  var __API_CURRICULUM_STORE__: Curriculum[] | undefined;
}

const now = new Date().toISOString();

if (!global.__API_CURRICULUM_STORE__ || global.__API_CURRICULUM_STORE__.length === 0) {
  global.__API_CURRICULUM_STORE__ = [
    {
      id: "curr_dce_v1_gpp",
      programId: "prog_dce_gpp",
      version: "1.0",
      effectiveDate: "2024-07-01",
      courses: [
        { courseId: "course_cs101_dce_gpp", semester: 1, isElective: false },
        { courseId: "course_math1_gen_gpp", semester: 1, isElective: false },
      ],
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
  ];
}
const curriculumStore: Curriculum[] = global.__API_CURRICULUM_STORE__;

const generateId = (): string => `curr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  if (!Array.isArray(global.__API_CURRICULUM_STORE__)) {
    global.__API_CURRICULUM_STORE__ = [];
    return NextResponse.json({ message: 'Internal server error: Curriculum data store corrupted.' }, { status: 500 });
  }
  return NextResponse.json(global.__API_CURRICULUM_STORE__);
}

export async function POST(request: NextRequest) {
  try {
    const curriculumData = await request.json() as Omit<Curriculum, 'id' | 'createdAt' | 'updatedAt'>;

    if (!curriculumData.programId || !curriculumData.version?.trim() || !curriculumData.effectiveDate) {
      return NextResponse.json({ message: 'Program ID, Version, and Effective Date are required.' }, { status: 400 });
    }
    if (!isValid(parseISO(curriculumData.effectiveDate))) {
        return NextResponse.json({ message: 'Invalid Effective Date format. Use YYYY-MM-DD.' }, { status: 400 });
    }
    if (!curriculumData.courses || curriculumData.courses.length === 0) {
        return NextResponse.json({ message: 'Curriculum must contain at least one course.' }, { status: 400 });
    }
    if (curriculumStore.some(c => c.programId === curriculumData.programId && c.version.toLowerCase() === curriculumData.version.trim().toLowerCase())) {
        return NextResponse.json({ message: `Curriculum version '${curriculumData.version.trim()}' already exists for this program.` }, { status: 409 });
    }


    const currentTimestamp = new Date().toISOString();
    const newCurriculum: Curriculum = {
      id: generateId(),
      programId: curriculumData.programId,
      version: curriculumData.version.trim(),
      effectiveDate: curriculumData.effectiveDate, // Already YYYY-MM-DD from client
      courses: curriculumData.courses,
      status: curriculumData.status || 'draft',
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    curriculumStore.push(newCurriculum);
    global.__API_CURRICULUM_STORE__ = curriculumStore;
    return NextResponse.json(newCurriculum, { status: 201 });
  } catch (error) {
    console.error('Error creating curriculum:', error);
    return NextResponse.json({ message: 'Error creating curriculum', error: (error as Error).message }, { status: 500 });
  }
}