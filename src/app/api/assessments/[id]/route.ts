import { NextResponse, type NextRequest } from 'next/server';
import type { Assessment } from '@/types/entities';

declare global {
  var __API_ASSESSMENTS_STORE__: Assessment[] | undefined;
}
if (!global.__API_ASSESSMENTS_STORE__) {
  global.__API_ASSESSMENTS_STORE__ = [];
}
let assessmentsStore: Assessment[] = global.__API_ASSESSMENTS_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_ASSESSMENTS_STORE__)) {
    global.__API_ASSESSMENTS_STORE__ = [];
    return NextResponse.json({ message: 'Assessment data store corrupted.' }, { status: 500 });
  }
  const assessment = global.__API_ASSESSMENTS_STORE__.find(a => a.id === id);
  if (assessment) {
    return NextResponse.json(assessment);
  }
  return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_ASSESSMENTS_STORE__)) {
    global.__API_ASSESSMENTS_STORE__ = [];
    return NextResponse.json({ message: 'Assessment data store corrupted.' }, { status: 500 });
  }
  try {
    const assessmentDataToUpdate = await request.json() as Partial<Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>>;
    const assessmentIndex = global.__API_ASSESSMENTS_STORE__.findIndex(a => a.id === id);

    if (assessmentIndex === -1) {
      return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
    }

    const existingAssessment = global.__API_ASSESSMENTS_STORE__[assessmentIndex];

    if (assessmentDataToUpdate.name !== undefined && !assessmentDataToUpdate.name.trim()) {
        return NextResponse.json({ message: 'Assessment Name cannot be empty.' }, { status: 400 });
    }
     if (assessmentDataToUpdate.maxMarks !== undefined && (isNaN(Number(assessmentDataToUpdate.maxMarks)) || Number(assessmentDataToUpdate.maxMarks) <= 0)) {
        return NextResponse.json({ message: 'Max Marks must be a positive number.' }, { status: 400 });
    }
    const maxMarks = assessmentDataToUpdate.maxMarks !== undefined ? Number(assessmentDataToUpdate.maxMarks) : existingAssessment.maxMarks;
     if (assessmentDataToUpdate.passingMarks !== undefined && assessmentDataToUpdate.passingMarks !== null && (isNaN(Number(assessmentDataToUpdate.passingMarks)) || Number(assessmentDataToUpdate.passingMarks) < 0 || Number(assessmentDataToUpdate.passingMarks) > maxMarks )) {
        return NextResponse.json({ message: 'Passing Marks must be a non-negative number and not exceed Max Marks.' }, { status: 400 });
    }
    if (assessmentDataToUpdate.weightage !== undefined && assessmentDataToUpdate.weightage !== null && (isNaN(Number(assessmentDataToUpdate.weightage)) || Number(assessmentDataToUpdate.weightage) < 0 || Number(assessmentDataToUpdate.weightage) > 1)) {
        return NextResponse.json({ message: 'Weightage must be between 0 and 1 (e.g., 0.2 for 20%).' }, { status: 400 });
    }

    // Check for duplicate assessment name within the same course/program/batch upon update
    if (assessmentDataToUpdate.name && assessmentDataToUpdate.name.trim().toLowerCase() !== existingAssessment.name.toLowerCase()) {
        const courseId = assessmentDataToUpdate.courseId || existingAssessment.courseId;
        const programId = assessmentDataToUpdate.programId || existingAssessment.programId;
        const batchId = assessmentDataToUpdate.batchId === undefined ? existingAssessment.batchId : assessmentDataToUpdate.batchId;

        if (global.__API_ASSESSMENTS_STORE__.some(a => 
            a.id !== id &&
            a.name.toLowerCase() === assessmentDataToUpdate.name!.trim().toLowerCase() && 
            a.courseId === courseId &&
            a.programId === programId &&
            (a.batchId === batchId || (!a.batchId && !batchId))
        )) {
            return NextResponse.json({ message: `Assessment with name '${assessmentDataToUpdate.name.trim()}' already exists for this course/program/batch.` }, { status: 409 });
        }
    }
    
    const updatedAssessment: Assessment = { 
        ...existingAssessment, 
        ...assessmentDataToUpdate,
        updatedAt: new Date().toISOString(),
    };

    if(assessmentDataToUpdate.name) updatedAssessment.name = assessmentDataToUpdate.name.trim();
    if(assessmentDataToUpdate.description !== undefined) updatedAssessment.description = assessmentDataToUpdate.description?.trim() || undefined;
    if(assessmentDataToUpdate.instructions !== undefined) updatedAssessment.instructions = assessmentDataToUpdate.instructions?.trim() || undefined;
    if (assessmentDataToUpdate.maxMarks !== undefined) updatedAssessment.maxMarks = Number(assessmentDataToUpdate.maxMarks);
    if (assessmentDataToUpdate.passingMarks !== undefined) updatedAssessment.passingMarks = assessmentDataToUpdate.passingMarks === null ? undefined : Number(assessmentDataToUpdate.passingMarks);
    if (assessmentDataToUpdate.weightage !== undefined) updatedAssessment.weightage = assessmentDataToUpdate.weightage === null ? undefined : Number(assessmentDataToUpdate.weightage);


    global.__API_ASSESSMENTS_STORE__[assessmentIndex] = updatedAssessment;
    assessmentsStore = global.__API_ASSESSMENTS_STORE__;
    return NextResponse.json(updatedAssessment);
  } catch (error) {
    console.error(`Error updating assessment ${id}:`, error);
    return NextResponse.json({ message: `Error updating assessment ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_ASSESSMENTS_STORE__)) {
    global.__API_ASSESSMENTS_STORE__ = [];
    return NextResponse.json({ message: 'Assessment data store corrupted.' }, { status: 500 });
  }
  const initialLength = global.__API_ASSESSMENTS_STORE__.length;
  const newStore = global.__API_ASSESSMENTS_STORE__.filter(a => a.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
  }
  
  global.__API_ASSESSMENTS_STORE__ = newStore;
  assessmentsStore = global.__API_ASSESSMENTS_STORE__;
  return NextResponse.json({ message: 'Assessment deleted successfully' }, { status: 200 });
}
