// src/app/api/student-scores/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { StudentAssessmentScore, Assessment, Student } from '@/types/entities';
import { notificationService } from '@/lib/api/notifications'; // Import notification service

// Ensure global stores are initialized
declare global {
  // eslint-disable-next-line no-var
  var __API_STUDENT_SCORES_STORE__: StudentAssessmentScore[] | undefined;
  // eslint-disable-next-line no-var
  var __API_STUDENTS_STORE__: Student[] | undefined;
  // eslint-disable-next-line no-var
  var __API_ASSESSMENTS_STORE__: Assessment[] | undefined;
}

if (!global.__API_STUDENT_SCORES_STORE__) {
  global.__API_STUDENT_SCORES_STORE__ = [];
}
if (!global.__API_STUDENTS_STORE__) {
  global.__API_STUDENTS_STORE__ = [];
}
if (!global.__API_ASSESSMENTS_STORE__) {
  global.__API_ASSESSMENTS_STORE__ = [];
}

let studentScoresStore: StudentAssessmentScore[] = global.__API_STUDENT_SCORES_STORE__;
const studentsStore: Student[] = global.__API_STUDENTS_STORE__;
const assessmentsStore: Assessment[] = global.__API_ASSESSMENTS_STORE__;

const generateId = (): string => `sas_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assessmentId = searchParams.get('assessmentId');
  const studentId = searchParams.get('studentId');

  let filteredScores = [...studentScoresStore];

  if (assessmentId) {
    filteredScores = filteredScores.filter(s => s.assessmentId === assessmentId);
  }
  if (studentId) {
    filteredScores = filteredScores.filter(s => s.studentId === studentId);
  }

  if (assessmentId && studentId) {
    // If both are provided, expect at most one result
    return NextResponse.json(filteredScores[0] || null);
  }

  return NextResponse.json(filteredScores);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const studentId = formData.get('studentId') as string;
    const assessmentId = formData.get('assessmentId') as string;
    const comments = formData.get('comments') as string | undefined;
    // Handle file(s) - In a real app, this would involve uploading to a storage service
    // For now, we'll just store mock file metadata if a file is present.
    const filesArray: { name: string; type: string; size: number; url: string }[] = [];
    let fileIndex = 0;
    while (formData.has(`file${fileIndex}`)) {
        const file = formData.get(`file${fileIndex}`) as File | null;
        if (file) {
            filesArray.push({
                name: file.name,
                type: file.type,
                size: file.size,
                url: `/uploads/mock/${file.name}` // Mock path
            });
        }
        fileIndex++;
    }


    if (!studentId || !assessmentId) {
      return NextResponse.json({ message: 'studentId and assessmentId are required.' }, { status: 400 });
    }
    
    const assessment = assessmentsStore.find(a => a.id === assessmentId);
    if (!assessment) {
        return NextResponse.json({ message: 'Assessment not found.' }, { status: 404 });
    }
    const student = studentsStore.find(s => s.id === studentId);
    if (!student) {
        return NextResponse.json({ message: 'Student not found.' }, { status: 404 });
    }


    const currentTimestamp = new Date().toISOString();
    let existingScoreIndex = studentScoresStore.findIndex(
      s => s.studentId === studentId && s.assessmentId === assessmentId
    );

    let savedScore: StudentAssessmentScore;

    if (existingScoreIndex !== -1) {
      // Update existing submission
      studentScoresStore[existingScoreIndex] = {
        ...studentScoresStore[existingScoreIndex],
        submissionDate: currentTimestamp,
        files: filesArray.length > 0 ? filesArray : studentScoresStore[existingScoreIndex].files,
        comments: comments?.trim() || studentScoresStore[existingScoreIndex].comments,
        score: undefined, // Reset score and grade on re-submission
        grade: undefined,
        evaluatedBy: undefined,
        evaluatedAt: undefined,
        remarks: undefined,
        updatedAt: currentTimestamp,
      };
      savedScore = studentScoresStore[existingScoreIndex];
    } else {
      // Create new submission
      const newScoreRecord: StudentAssessmentScore = {
        id: generateId(),
        studentId,
        assessmentId,
        submissionDate: currentTimestamp,
        files: filesArray.length > 0 ? filesArray : undefined,
        comments: comments?.trim() || undefined,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      };
      studentScoresStore.push(newScoreRecord);
      savedScore = newScoreRecord;
    }
    global.__API_STUDENT_SCORES_STORE__ = studentScoresStore;

    // --- Notification Trigger for Faculty ---
    if (assessment.facultyId) { // Assuming Assessment has a primary facultyId
      try {
        await notificationService.createNotification({
          userId: assessment.facultyId, // Notify the faculty responsible for the assessment
          message: `New submission for '${assessment.name}' by ${student.firstName || student.enrollmentNumber}.`,
          type: 'assignment_new',
          link: `/faculty/assessments/grade?assessmentId=${assessmentId}&studentId=${studentId}`, // Link to grading page
        });
      } catch (notifError) {
        console.error("Failed to create submission notification for faculty:", notifError);
      }
    } else {
        // Fallback: could notify all faculty associated with the course offering if Assessment doesn't have a specific facultyId
        // This requires fetching CourseOffering based on assessment.courseId and then its facultyIds
        console.warn(`Assessment ${assessmentId} does not have a specific facultyId for notification.`);
    }
    // --- End Notification Trigger ---

    return NextResponse.json(savedScore, { status: 201 });
  } catch (error) {
    console.error('Error processing student submission:', error);
    return NextResponse.json({ message: 'Error processing student submission', error: (error as Error).message }, { status: 500 });
  }
}
