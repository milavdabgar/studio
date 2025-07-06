
import { NextResponse, type NextRequest } from 'next/server';
import type { Program } from '@/types/entities'; 

declare global {
  var __API_PROGRAMS_STORE__: Program[] | undefined;
}

const now = new Date().toISOString();

if (!global.__API_PROGRAMS_STORE__ || global.__API_PROGRAMS_STORE__.length === 0) {
  global.__API_PROGRAMS_STORE__ = [
    { 
      id: "prog_dce_gpp", 
      name: "Diploma in Computer Engineering", 
      code: "DCE", 
      departmentId: "dept_ce_gpp", 
      instituteId: "inst1",
      degreeType: "Diploma", 
      durationYears: 3, 
      totalSemesters: 6, 
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    { 
      id: "prog_dme_gpp", 
      name: "Diploma in Mechanical Engineering", 
      code: "DME", 
      departmentId: "dept_me_gpp", 
      instituteId: "inst1",
      degreeType: "Diploma", 
      durationYears: 3, 
      totalSemesters: 6, 
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    { 
      id: "prog_dee_gpp", 
      name: "Diploma in Electrical Engineering", 
      code: "DEE", 
      departmentId: "dept_ee_gpp", 
      instituteId: "inst1",
      degreeType: "Diploma", 
      durationYears: 3, 
      totalSemesters: 6, 
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

const generateId = (): string => `prog_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  if (!Array.isArray(global.__API_PROGRAMS_STORE__)) {
      console.error("/api/programs GET: global.__API_PROGRAMS_STORE__ is not an array!", global.__API_PROGRAMS_STORE__);
      global.__API_PROGRAMS_STORE__ = []; 
      return NextResponse.json({ message: 'Internal server error: Program data store corrupted.' }, { status: 500 });
  }
  return NextResponse.json(global.__API_PROGRAMS_STORE__);
}

export async function POST(request: NextRequest) {
  try {
    const programData = await request.json() as Omit<Program, 'id' | 'createdAt' | 'updatedAt'>;

    if (!programData.name || !programData.name.trim()) {
      return NextResponse.json({ message: 'Program Name cannot be empty.' }, { status: 400 });
    }
    if (!programData.code || !programData.code.trim()) {
      return NextResponse.json({ message: 'Program Code cannot be empty.' }, { status: 400 });
    }
    if (!programData.departmentId) {
      return NextResponse.json({ message: 'Department ID is required.' }, { status: 400 });
    }
    if (!programData.instituteId) { // Added check for instituteId
      return NextResponse.json({ message: 'Institute ID is required.' }, { status: 400 });
    }
     if (global.__API_PROGRAMS_STORE__?.some(p => p.code.toLowerCase() === programData.code.trim().toLowerCase() && p.departmentId === programData.departmentId && p.instituteId === programData.instituteId)) {
        return NextResponse.json({ message: `Program with code '${programData.code.trim()}' already exists for this department and institute.` }, { status: 409 });
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
      instituteId: programData.instituteId,
      degreeType: programData.degreeType || 'Diploma',
      durationYears: programData.durationYears ? Number(programData.durationYears) : undefined,
      totalSemesters: programData.totalSemesters ? Number(programData.totalSemesters) : undefined,
      totalCredits: programData.totalCredits ? Number(programData.totalCredits) : undefined,
      curriculumVersion: programData.curriculumVersion || undefined,
      status: programData.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    global.__API_PROGRAMS_STORE__?.push(newProgram); 
    return NextResponse.json(newProgram, { status: 201 });
  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json({ message: 'Error creating program', error: (error as Error).message }, { status: 500 });
  }
}
