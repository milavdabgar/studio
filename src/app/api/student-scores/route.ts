// src/app/api/student-scores/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { StudentAssessmentScore } from '@/types/entities';
import type { IStudentAssessmentScore, IAssessment, IStudent } from '@/lib/models';
import type { Document, FlattenMaps } from 'mongoose';
import { notificationService } from '@/lib/api/notifications';
import { connectMongoose } from '@/lib/mongodb';
import { StudentAssessmentScoreModel, AssessmentModel, StudentModel } from '@/lib/models';

const generateId = (): string => `sas_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('assessmentId');
    const studentId = searchParams.get('studentId');

    // Build filter query
    const filter: Record<string, unknown> = {};
    if (assessmentId) filter.assessmentId = assessmentId;
    if (studentId) filter.studentId = studentId;

    const scores = await StudentAssessmentScoreModel.find(filter).lean() as unknown as FlattenMaps<IStudentAssessmentScore>[];

    // Format scores to ensure proper id field
    const scoresWithId = scores.map((score) => ({
      ...score,
      id: score.id || score._id.toString()
    }));

    if (assessmentId && studentId) {
      // If both are provided, expect at most one result
      return NextResponse.json(scoresWithId[0] || null);
    }

    return NextResponse.json(scoresWithId);
  } catch (error) {
    console.error('Error in GET /api/student-scores:', error);
    return NextResponse.json({ message: 'Internal server error processing student scores request.', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const contentType = request.headers.get('content-type');
    let studentId: string, assessmentId: string, comments: string | undefined, scoreStr: string | undefined, grade: string | undefined, remarks: string | undefined, evaluatedBy: string | undefined;
    const filesArray: { name: string; type: string; size: number; url: string }[] = [];

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (file uploads)
      const formData = await request.formData();
      studentId = formData.get('studentId') as string;
      assessmentId = formData.get('assessmentId') as string;
      comments = formData.get('comments') as string | undefined;
      scoreStr = formData.get('score') as string | undefined;
      grade = formData.get('grade') as string | undefined;
      remarks = formData.get('remarks') as string | undefined;
      evaluatedBy = formData.get('evaluatedBy') as string | undefined;

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
    } else {
      // Handle JSON data (grading without files)
      const jsonData = await request.json();
      studentId = jsonData.studentId;
      assessmentId = jsonData.assessmentId;
      comments = jsonData.comments;
      scoreStr = jsonData.score?.toString();
      grade = jsonData.grade;
      remarks = jsonData.remarks;
      evaluatedBy = jsonData.evaluatedBy;
    }

    if (!studentId || !assessmentId) {
      return NextResponse.json({ message: 'studentId and assessmentId are required.' }, { status: 400 });
    }
    
    const assessment = await AssessmentModel.findOne({ id: assessmentId }).lean() as FlattenMaps<IAssessment> | null;
    if (!assessment) {
        return NextResponse.json({ message: 'Assessment not found.' }, { status: 404 });
    }
    const student = await StudentModel.findOne({ id: studentId }).lean() as FlattenMaps<IStudent> | null;
    if (!student) {
        return NextResponse.json({ message: 'Student not found.' }, { status: 404 });
    }

    const score = scoreStr !== undefined ? parseFloat(scoreStr) : undefined;
    if (score !== undefined && (isNaN(score) || score < 0 || score > assessment.maxMarks)) {
        return NextResponse.json({ message: `Score must be a non-negative number and not exceed assessment max marks (${assessment.maxMarks}).` }, { status: 400 });
    }

    const currentTimestamp = new Date().toISOString();
    const existingRecord = await StudentAssessmentScoreModel.findOne({
      studentId,
      assessmentId
    }) as Document & IStudentAssessmentScore | null;

    let savedScoreRecord: (FlattenMaps<IStudentAssessmentScore> & { _id: unknown }) | null;

    if (existingRecord) {
      // Update existing submission/score record
      const updateData: Partial<IStudentAssessmentScore> & { updatedAt: string } = {
        updatedAt: currentTimestamp
      };
      
      if (filesArray.length > 0 || comments) {
        updateData.submissionDate = currentTimestamp;
      }
      if (filesArray.length > 0) {
        updateData.files = filesArray;
      }
      if (comments?.trim()) {
        updateData.comments = comments.trim();
      }
      if (score !== undefined) {
        updateData.score = score;
      }
      if (grade !== undefined) {
        updateData.grade = grade.trim().toUpperCase() || undefined;
      }
      if (remarks !== undefined) {
        updateData.remarks = remarks.trim() || undefined;
      }
      if (evaluatedBy) {
        updateData.evaluatedBy = evaluatedBy;
      }
      if (score !== undefined || grade !== undefined || remarks !== undefined) {
        updateData.evaluatedAt = currentTimestamp;
      }

      savedScoreRecord = await StudentAssessmentScoreModel.findByIdAndUpdate(
        existingRecord._id,
        updateData,
        { new: true, lean: true }
      ) as (FlattenMaps<IStudentAssessmentScore> & { _id: unknown }) | null;
    } else {
      // Create new submission/score record
      const newScoreData = {
        id: generateId(),
        studentId,
        assessmentId,
        submissionDate: (filesArray.length > 0 || comments) ? currentTimestamp : undefined,
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
      
      const newScore = new StudentAssessmentScoreModel(newScoreData);
      await newScore.save();
      const scoreDoc = newScore.toJSON();
      savedScoreRecord = {
        ...scoreDoc,
        _id: scoreDoc._id
      } as FlattenMaps<IStudentAssessmentScore> & { _id: unknown };
    }

    // Format score to ensure proper id field
    if (!savedScoreRecord) {
      throw new Error('Failed to save score record');
    }
    
    const scoreWithId = {
      ...savedScoreRecord,
      id: savedScoreRecord.id || savedScoreRecord._id?.toString()
    };

    // Notification Trigger
    if (evaluatedBy) { // This implies a faculty action (grading)
        try {
            await notificationService.createNotification({
              userId: studentId, 
              message: `Your submission for '${assessment.name}' has been graded. Score: ${scoreWithId.score !== undefined ? scoreWithId.score : 'N/A'}.`,
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
    
    return NextResponse.json(scoreWithId, { status: existingRecord ? 200 : 201 });
  } catch (error) {
    console.error('Error processing student submission/score:', error);
    return NextResponse.json({ message: 'Error processing student submission/score', error: (error as Error).message }, { status: 500 });
  }
}
