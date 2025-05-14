// src/app/api/student-scores/[scoreId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { StudentAssessmentScore, Assessment } from '@/types/entities';
import { notificationService } from '@/lib/api/notifications'; // Import notification service

declare global {
  // eslint-disable-next-line no-var
  var __API_STUDENT_SCORES_STORE__: StudentAssessmentScore[] | undefined;
  // eslint-disable-next-line no-var
  var __API_ASSESSMENTS_STORE__: Assessment[] | undefined; // For fetching assessment name
}

if (!global.__API_STUDENT_SCORES_STORE__) {
  global.__API_STUDENT_SCORES_STORE__ = [];
}
if (!global.__API_ASSESSMENTS_STORE__) {
  global.__API_ASSESSMENTS_STORE__ = [];
}
let studentScoresStore: StudentAssessmentScore[] = global.__API_STUDENT_SCORES_STORE__;
const assessmentsStore: Assessment[] = global.__API_ASSESSMENTS_STORE__;

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
    const assessment = assessmentsStore.find(a => a.id === existingRecord.assessmentId);

    if (dataToUpdate.score !== undefined && (isNaN(dataToUpdate.score) || dataToUpdate.score < 0 || (assessment && dataToUpdate.score > assessment.maxMarks))) {
        return NextResponse.json({ message: `Score must be a non-negative number and not exceed assessment max marks (${assessment?.maxMarks || 'N/A'}).` }, { status: 400 });
    }
    
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

    // --- Notification Trigger for Student ---
    if (assessment) {
      try {
        await notificationService.createNotification({
          userId: existingRecord.studentId, // Notify the student whose submission was graded
          message: `Your submission for '${assessment.name}' has been graded. Score: ${updatedRecord.score !== undefined ? updatedRecord.score : 'N/A'}.`,
          type: 'assignment_graded',
          link: `/student/assignments/${existingRecord.assessmentId}`, // Link to the assignment detail page
        });
      } catch (notifError) {
        console.error("Failed to create grading notification for student:", notifError);
      }
    }
    // --- End Notification Trigger ---

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
