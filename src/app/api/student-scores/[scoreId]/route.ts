// src/app/api/student-scores/[scoreId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { StudentAssessmentScore } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_STUDENT_SCORES_STORE__: StudentAssessmentScore[] | undefined;
}

if (!global.__API_STUDENT_SCORES_STORE__) {
  global.__API_STUDENT_SCORES_STORE__ = [];
}
let studentScoresStore: StudentAssessmentScore[] = global.__API_STUDENT_SCORES_STORE__;

interface RouteParams {
  params: {
    scoreId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { scoreId } = params;
  const scoreRecord = studentScoresStore.find(s => s.id === scoreId);
  if (scoreRecord) {
    return NextResponse.json(scoreRecord);
  }
  return NextResponse.json({ message: 'Student score record not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { scoreId } = params;
  try {
    const dataToUpdate = await request.json() as Partial<Omit<StudentAssessmentScore, 'id' | 'studentId' | 'assessmentId' | 'createdAt' | 'submissionDate'>>;
    const scoreIndex = studentScoresStore.findIndex(s => s.id === scoreId);

    if (scoreIndex === -1) {
      return NextResponse.json({ message: 'Student score record not found' }, { status: 404 });
    }

    const existingRecord = studentScoresStore[scoreIndex];

    if (dataToUpdate.score !== undefined && (isNaN(dataToUpdate.score) || dataToUpdate.score < 0)) { // Assuming assessment maxMarks check happens on frontend or with assessment details
        return NextResponse.json({ message: 'Score must be a non-negative number.' }, { status: 400 });
    }
    
    // TODO: Add validation against assessment.maxMarks if assessment details are fetched here.

    const updatedRecord: StudentAssessmentScore = {
      ...existingRecord,
      ...dataToUpdate,
      evaluatedBy: dataToUpdate.evaluatedBy || existingRecord.evaluatedBy || "faculty_placeholder_eval", // Ensure evaluatedBy is set
      evaluatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (dataToUpdate.remarks !== undefined) updatedRecord.remarks = dataToUpdate.remarks.trim() || undefined;
    if (dataToUpdate.grade !== undefined) updatedRecord.grade = dataToUpdate.grade.trim().toUpperCase() || undefined;


    studentScoresStore[scoreIndex] = updatedRecord;
    global.__API_STUDENT_SCORES_STORE__ = studentScoresStore;

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error(`Error updating student score record ${scoreId}:`, error);
    return NextResponse.json({ message: `Error updating student score record ${scoreId}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { scoreId } = params;
  const initialLength = studentScoresStore.length;
  studentScoresStore = studentScoresStore.filter(s => s.id !== scoreId);

  if (studentScoresStore.length === initialLength) {
    return NextResponse.json({ message: 'Student score record not found' }, { status: 404 });
  }
  global.__API_STUDENT_SCORES_STORE__ = studentScoresStore;
  // In a real app, also delete associated files from storage if any.
  return NextResponse.json({ message: 'Student score record deleted successfully' });
}
