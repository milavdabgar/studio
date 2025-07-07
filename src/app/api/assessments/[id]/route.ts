import { NextResponse, type NextRequest } from 'next/server';
import type { Assessment } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { AssessmentModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    // Try to find by custom id first, then by MongoDB _id if it's a valid ObjectId
    let assessment;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      assessment = await AssessmentModel.findById(id);
    } else {
      assessment = await AssessmentModel.findOne({ id });
    }
    
    if (!assessment) {
      return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
    }
    
    return NextResponse.json(assessment.toJSON());
  } catch (error) {
    console.error(`Error fetching assessment ${id}:`, error);
    return NextResponse.json({ message: `Error fetching assessment ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    const assessmentDataToUpdate = await request.json() as Partial<Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>>;
    
    // Try to find by custom id first, then by MongoDB _id if it's a valid ObjectId
    let existingAssessment;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      existingAssessment = await AssessmentModel.findById(id);
    } else {
      existingAssessment = await AssessmentModel.findOne({ id });
    }

    if (!existingAssessment) {
      return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
    }

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

        const duplicateAssessment = await AssessmentModel.findOne({
          _id: { $ne: existingAssessment._id },
          name: { $regex: `^${assessmentDataToUpdate.name!.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
          courseId,
          programId,
          ...(batchId ? { batchId } : {})
        });
        
        if (duplicateAssessment) {
            return NextResponse.json({ message: `Assessment with name '${assessmentDataToUpdate.name.trim()}' already exists for this course/program/batch.` }, { status: 409 });
        }
    }
    
    const updateData: Record<string, unknown> = {
        ...assessmentDataToUpdate,
        updatedAt: new Date().toISOString(),
    };

    if(assessmentDataToUpdate.name) updateData.name = assessmentDataToUpdate.name.trim();
    if(assessmentDataToUpdate.description !== undefined) updateData.description = assessmentDataToUpdate.description?.trim() || undefined;
    if(assessmentDataToUpdate.instructions !== undefined) updateData.instructions = assessmentDataToUpdate.instructions?.trim() || undefined;
    if (assessmentDataToUpdate.maxMarks !== undefined) updateData.maxMarks = Number(assessmentDataToUpdate.maxMarks);
    if (assessmentDataToUpdate.passingMarks !== undefined) updateData.passingMarks = assessmentDataToUpdate.passingMarks === null ? undefined : Number(assessmentDataToUpdate.passingMarks);
    if (assessmentDataToUpdate.weightage !== undefined) updateData.weightage = assessmentDataToUpdate.weightage === null ? undefined : Number(assessmentDataToUpdate.weightage);

    const updatedAssessment = await AssessmentModel.findByIdAndUpdate(
      existingAssessment._id,
      updateData,
      { new: true }
    );

    return NextResponse.json(updatedAssessment.toJSON());
  } catch (error) {
    console.error(`Error updating assessment ${id}:`, error);
    return NextResponse.json({ message: `Error updating assessment ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    // Try to find by custom id first, then by MongoDB _id if it's a valid ObjectId
    let assessment;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      assessment = await AssessmentModel.findById(id);
    } else {
      assessment = await AssessmentModel.findOne({ id });
    }

    if (!assessment) {
      return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
    }
    
    // Remove the assessment from the database
    await AssessmentModel.findByIdAndDelete(assessment._id);
    
    return NextResponse.json({ message: 'Assessment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting assessment ${id}:`, error);
    return NextResponse.json({ message: `Error deleting assessment ${id}`, error: (error as Error).message }, { status: 500 });
  }
}
