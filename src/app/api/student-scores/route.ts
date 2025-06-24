// src/app/api/student-scores/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { StudentAssessmentScore, Assessment, Student } from '@/types/entities';
import { notificationService } from '@/lib/api/notifications'; 

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

const studentScoresStore: StudentAssessmentScore[] = global.__API_STUDENT_SCORES_STORE__;
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
    const scoreStr = formData.get('score') as string | undefined;
    const grade = formData.get('grade') as string | undefined;
    const remarks = formData.get('remarks') as string | undefined;
    const evaluatedBy = formData.get('evaluatedBy') as string | undefined; // For faculty-initiated score entries

    const filesArray: { name: string; type: string; size: number; url: string }[] = [];
    let fileIndex = 0;
    while (formData.has(`file${fileIndex}`)) {
        const file = formData.get(`file${fileIndex}`) as File | null;
        if (file) {
            filesArray.push({
                name: file.name,
                type: file.type,
                size: file.size,
                url: `/uploads/mock/${Date.now()}_${file.name.replace(/\s+/g, '_')}` 
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

    const score = scoreStr !== undefined ? parseFloat(scoreStr) : undefined;
    if (score !== undefined && (isNaN(score) || score < 0 || score > assessment.maxMarks)) {
        return NextResponse.json({ message: `Score must be a non-negative number and not exceed assessment max marks (${assessment.maxMarks}).` }, { status: 400 });
    }


    const currentTimestamp = new Date().toISOString();
    const existingScoreIndex = studentScoresStore.findIndex(
      s => s.studentId === studentId && s.assessmentId === assessmentId
    );

    let savedScoreRecord: StudentAssessmentScore;

    if (existingScoreIndex !== -1) {
      // Update existing submission/score record
      const existingRecord = studentScoresStore[existingScoreIndex];
      studentScoresStore[existingScoreIndex] = {
        ...existingRecord,
        submissionDate: filesArray.length > 0 || comments ? currentTimestamp : existingRecord.submissionDate, // Update submissionDate if new files/comments
        files: filesArray.length > 0 ? filesArray : existingRecord.files,
        comments: comments?.trim() || existingRecord.comments,
        // Only update grading fields if provided by faculty
        score: score !== undefined ? score : existingRecord.score,
        grade: grade !== undefined ? grade.trim().toUpperCase() || undefined : existingRecord.grade,
        remarks: remarks !== undefined ? remarks.trim() || undefined : existingRecord.remarks,
        evaluatedBy: evaluatedBy || existingRecord.evaluatedBy,
        evaluatedAt: (score !== undefined || grade !== undefined || remarks !== undefined) ? currentTimestamp : existingRecord.evaluatedAt,
        updatedAt: currentTimestamp,
      };
      savedScoreRecord = studentScoresStore[existingScoreIndex];
    } else {
      // Create new submission/score record
      const newScoreRecord: StudentAssessmentScore = {
        id: generateId(),
        studentId,
        assessmentId,
        submissionDate: (filesArray.length > 0 || comments) ? currentTimestamp : undefined, // Only set submission date if actual submission content
        files: filesArray.length > 0 ? filesArray : undefined,
        comments: comments?.trim() || undefined,
        score: score !== undefined ? score : undefined,
        grade: grade?.trim().toUpperCase() || undefined,
        remarks: remarks?.trim() || undefined,
        evaluatedBy: evaluatedBy || undefined,
        evaluatedAt: (score !== undefined || grade !== undefined || remarks !== undefined) ? currentTimestamp : undefined,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      };
      studentScoresStore.push(newScoreRecord);
      savedScoreRecord = newScoreRecord;
    }
    global.__API_STUDENT_SCORES_STORE__ = studentScoresStore;

    // Notification Trigger
    if (evaluatedBy) { // This implies a faculty action (grading)
        try {
            await notificationService.createNotification({
              userId: studentId, 
              message: `Your submission for '${assessment.name}' has been graded. Score: ${savedScoreRecord.score !== undefined ? savedScoreRecord.score : 'N/A'}.`,
              type: 'assignment_graded',
              link: `/student/assignments/${assessmentId}`, 
            });
          } catch (notifError) {
            console.error("Failed to create grading notification for student:", notifError);
          }
    } else if (filesArray.length > 0 || comments) { // This implies a student submission
        if (assessment.facultyId) {
          try {
            await notificationService.createNotification({
              userId: assessment.facultyId, 
              message: `New submission for '${assessment.name}' by ${student.firstName || student.enrollmentNumber}.`,
              type: 'assignment_new',
              link: `/faculty/assessments/grade?assessmentId=${assessmentId}&studentId=${studentId}`, 
            });
          } catch (notifError) {
            console.error("Failed to create submission notification for faculty:", notifError);
          }
        }
    }
    
    return NextResponse.json(savedScoreRecord, { status: existingScoreIndex !== -1 ? 200 : 201 });
  } catch (error) {
    console.error('Error processing student submission/score:', error);
    return NextResponse.json({ message: 'Error processing student submission/score', error: (error as Error).message }, { status: 500 });
  }
}
