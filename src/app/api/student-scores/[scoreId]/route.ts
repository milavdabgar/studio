// src/app/api/student-scores/[scoreId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { StudentAssessmentScore } from '@/types/entities';
import type { IStudentAssessmentScore, IAssessment } from '@/lib/models';
import type { FlattenMaps } from 'mongoose';
import { notificationService } from '@/lib/api/notifications';
import { connectMongoose } from '@/lib/mongodb';
import { StudentAssessmentScoreModel, AssessmentModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    scoreId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { scoreId } = await params;
  
  try {
    await connectMongoose();
    
    const scoreRecord = await StudentAssessmentScoreModel.findOne({ id: scoreId }).lean() as FlattenMaps<IStudentAssessmentScore> | null;
    if (scoreRecord) {
      // Format score to ensure proper id field
      const scoreWithId = {
        ...scoreRecord,
        id: scoreRecord.id || scoreRecord._id.toString()
      };
      return NextResponse.json(scoreWithId);
    }
    return NextResponse.json({ message: 'Student score record not found' }, { status: 404 });
  } catch (error) {
    console.error(`Error fetching student score ${scoreId}:`, error);
    return NextResponse.json({ message: `Error fetching student score ${scoreId}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { scoreId } = await params;
  
  try {
    await connectMongoose();
    
    const dataToUpdate = await request.json() as Partial<Omit<StudentAssessmentScore, 'id' | 'studentId' | 'assessmentId' | 'createdAt' | 'submissionDate'>>;
    
    const existingRecord = await StudentAssessmentScoreModel.findOne({ id: scoreId }).lean() as FlattenMaps<IStudentAssessmentScore> | null;
    if (!existingRecord) {
      return NextResponse.json({ message: 'Student score record not found' }, { status: 404 });
    }

    const assessment = await AssessmentModel.findOne({ id: existingRecord.assessmentId }).lean() as FlattenMaps<IAssessment> | null;

    if (dataToUpdate.score !== undefined && (isNaN(dataToUpdate.score) || dataToUpdate.score < 0 || (assessment && dataToUpdate.score > assessment.maxMarks))) {
        return NextResponse.json({ message: `Score must be a non-negative number and not exceed assessment max marks (${assessment?.maxMarks || 'N/A'}).` }, { status: 400 });
    }
    
    const updateData: Partial<IStudentAssessmentScore> & { evaluatedAt: string; updatedAt: string } = {
      ...dataToUpdate,
      evaluatedBy: dataToUpdate.evaluatedBy || existingRecord.evaluatedBy || "faculty_placeholder_eval",
      evaluatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (dataToUpdate.remarks !== undefined) {
      updateData.remarks = dataToUpdate.remarks.trim() || undefined;
    }
    if (dataToUpdate.grade !== undefined) {
      updateData.grade = dataToUpdate.grade.trim().toUpperCase() || undefined;
    }

    const updatedRecord = await StudentAssessmentScoreModel.findOneAndUpdate(
      { id: scoreId },
      updateData,
      { new: true, lean: true }
    ) as FlattenMaps<IStudentAssessmentScore> | null;

    if (!updatedRecord) {
      return NextResponse.json({ message: 'Student score record not found' }, { status: 404 });
    }

    // Format score to ensure proper id field
    const scoreWithId = {
      ...updatedRecord,
      id: updatedRecord.id || updatedRecord._id.toString()
    };

    // --- Notification Trigger for Student ---
    if (assessment) {
      try {
        await notificationService.createNotification({
          userId: existingRecord.studentId, // Notify the student whose submission was graded
          message: `Your submission for '${assessment.name}' has been graded. Score: ${scoreWithId.score !== undefined ? scoreWithId.score : 'N/A'}.`,
          type: 'assignment_graded',
          link: `/student/assignments/${existingRecord.assessmentId}`, // Link to the assignment detail page
        });
      } catch (notifError) {
        console.error("Failed to create grading notification for student:", notifError);
      }
    }
    // --- End Notification Trigger ---

    return NextResponse.json(scoreWithId);
  } catch (error) {
    console.error(`Error updating student score record ${scoreId}:`, error);
    return NextResponse.json({ message: `Error updating student score record ${scoreId}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { scoreId } = await params;
  
  try {
    await connectMongoose();
    
    const deletedRecord = await StudentAssessmentScoreModel.findOneAndDelete({ id: scoreId });
    
    if (!deletedRecord) {
      return NextResponse.json({ message: 'Student score record not found' }, { status: 404 });
    }
    
    // In a real app, also delete associated files from storage if any.
    return NextResponse.json({ message: 'Student score record deleted successfully' });
  } catch (error) {
    console.error(`Error deleting student score record ${scoreId}:`, error);
    return NextResponse.json({ message: `Error deleting student score record ${scoreId}`, error: (error as Error).message }, { status: 500 });
  }
}
