import { NextResponse, type NextRequest } from 'next/server';
import type { Assessment } from '@/types/entities';

declare global {
  var __API_ASSESSMENTS_STORE__: Assessment[] | undefined;
}

if (!global.__API_ASSESSMENTS_STORE__) {
  global.__API_ASSESSMENTS_STORE__ = [];
}
const assessmentsStore: Assessment[] = global.__API_ASSESSMENTS_STORE__;

const generateId = (): string => `asmnt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  if (!Array.isArray(global.__API_ASSESSMENTS_STORE__)) {
      global.__API_ASSESSMENTS_STORE__ = []; 
      return NextResponse.json({ message: 'Internal server error: Assessment data store corrupted.' }, { status: 500 });
  }
  return NextResponse.json(global.__API_ASSESSMENTS_STORE__);
}

export async function POST(request: NextRequest) {
  try {
    const assessmentData = await request.json() as Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>;

    if (!assessmentData.name || !assessmentData.name.trim()) {
      return NextResponse.json({ message: 'Assessment Name cannot be empty.' }, { status: 400 });
    }
    if (!assessmentData.courseId) {
      return NextResponse.json({ message: 'Course ID is required.' }, { status: 400 });
    }
    if (!assessmentData.programId) {
      return NextResponse.json({ message: 'Program ID is required.' }, { status: 400 });
    }
    if (!assessmentData.type) {
      return NextResponse.json({ message: 'Assessment Type is required.' }, { status: 400 });
    }
    if (assessmentData.maxMarks === undefined || isNaN(Number(assessmentData.maxMarks)) || Number(assessmentData.maxMarks) <= 0) {
        return NextResponse.json({ message: 'Max Marks must be a positive number.' }, { status: 400 });
    }
     if (assessmentData.passingMarks && (isNaN(Number(assessmentData.passingMarks)) || Number(assessmentData.passingMarks) < 0 || Number(assessmentData.passingMarks) > Number(assessmentData.maxMarks))) {
        return NextResponse.json({ message: 'Passing Marks must be a non-negative number and not exceed Max Marks.' }, { status: 400 });
    }
    if (assessmentData.weightage && (isNaN(Number(assessmentData.weightage)) || Number(assessmentData.weightage) < 0 || Number(assessmentData.weightage) > 1)) {
        return NextResponse.json({ message: 'Weightage must be between 0 and 1 (e.g., 0.2 for 20%).' }, { status: 400 });
    }

    // Simple check for duplicate assessment name within the same course (could be more robust)
    if (global.__API_ASSESSMENTS_STORE__?.some(a => 
        a.name.toLowerCase() === assessmentData.name.trim().toLowerCase() && 
        a.courseId === assessmentData.courseId &&
        a.programId === assessmentData.programId &&
        (a.batchId === assessmentData.batchId || (!a.batchId && !assessmentData.batchId))
    )) {
        return NextResponse.json({ message: `Assessment with name '${assessmentData.name.trim()}' already exists for this course/program/batch.` }, { status: 409 });
    }
    
    const now = new Date().toISOString();
    const newAssessment: Assessment = {
      id: generateId(),
      name: assessmentData.name.trim(),
      courseId: assessmentData.courseId,
      programId: assessmentData.programId,
      batchId: assessmentData.batchId || undefined,
      type: assessmentData.type,
      description: assessmentData.description?.trim() || undefined,
      maxMarks: Number(assessmentData.maxMarks),
      passingMarks: assessmentData.passingMarks ? Number(assessmentData.passingMarks) : undefined,
      weightage: assessmentData.weightage ? Number(assessmentData.weightage) : undefined,
      assessmentDate: assessmentData.assessmentDate || undefined,
      dueDate: assessmentData.dueDate || undefined,
      status: assessmentData.status || 'Draft',
      instructions: assessmentData.instructions?.trim() || undefined,
      facultyId: assessmentData.facultyId || undefined,
      createdAt: now,
      updatedAt: now,
    };
    global.__API_ASSESSMENTS_STORE__?.push(newAssessment);
    return NextResponse.json(newAssessment, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json({ message: 'Error creating assessment', error: (error as Error).message }, { status: 500 });
  }
}
