
import { NextResponse, type NextRequest } from 'next/server';
import type { Assessment } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { AssessmentModel } from '@/lib/models';

// Initialize default assessments if none exist
async function initializeDefaultAssessments() {
  await connectMongoose();
  const assessmentCount = await AssessmentModel.countDocuments();
  
  if (assessmentCount === 0) {
    const now = new Date().toISOString();
    const defaultAssessments = [
      {
        id: "asmnt_quiz1_cs101_gpp",
        name: "Quiz 1: Basics of C",
        courseId: "course_cs101_dce_gpp",
        programId: "prog_dce_gpp",
        batchId: "batch_dce_2022_gpp",
        type: "Quiz",
        maxMarks: 20,
        status: "Completed",
        assessmentDate: "2023-09-15T10:00:00.000Z",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "asmnt_midterm_me101_gpp",
        name: "Midterm Exam - Mechanics",
        courseId: "course_me101_dme_gpp",
        programId: "prog_dme_gpp",
        batchId: "batch_dme_2023_gpp",
        type: "Midterm",
        maxMarks: 50,
        passingMarks: 17,
        status: "Published",
        assessmentDate: "2023-10-20T14:00:00.000Z",
        createdAt: now,
        updatedAt: now,
      }
    ];
    
    await AssessmentModel.insertMany(defaultAssessments);
  }
}

const generateId = (): string => `asmnt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  try {
    await connectMongoose();
    await initializeDefaultAssessments();
    
    const assessments = await AssessmentModel.find({}).lean();
    
    // Format assessments to ensure proper id field
    const assessmentsWithId = assessments.map(assessment => ({
      ...assessment,
      id: assessment.id || (assessment as unknown as { _id: { toString(): string } })._id.toString()
    }));
    
    return NextResponse.json(assessmentsWithId);
  } catch (error) {
    console.error('Error in GET /api/assessments:', error);
    return NextResponse.json({ message: 'Internal server error processing assessments request.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
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

    // Check for duplicate assessment name within the same course
    const existingAssessment = await AssessmentModel.findOne({
      name: { $regex: `^${assessmentData.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      courseId: assessmentData.courseId,
      programId: assessmentData.programId,
      ...(assessmentData.batchId ? { batchId: assessmentData.batchId } : {})
    });
    
    if (existingAssessment) {
        return NextResponse.json({ message: `Assessment with name '${assessmentData.name.trim()}' already exists for this course/program/batch.` }, { status: 409 });
    }
    
    const currentTimestamp = new Date().toISOString();
    const newAssessmentData = {
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
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newAssessment = new AssessmentModel(newAssessmentData);
    await newAssessment.save();
    
    return NextResponse.json(newAssessment.toJSON(), { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json({ message: 'Error creating assessment' }, { status: 500 });
  }
}
