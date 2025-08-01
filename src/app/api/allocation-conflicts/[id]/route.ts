import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { 
  AllocationConflictModel,
  FacultyModel, 
  CourseOfferingModel, 
  CourseModel,
  AllocationSessionModel 
} from '@/lib/models';
import type { AllocationConflict } from '@/types/entities';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const conflict = await AllocationConflictModel.findOne({ id: params.id }).lean();
    
    if (!conflict) {
      return NextResponse.json(
        { success: false, error: 'Allocation conflict not found' },
        { status: 404 }
      );
    }

    // Get additional details
    const [faculty, session] = await Promise.all([
      (conflict as any).facultyId ? FacultyModel.findOne({ id: (conflict as any).facultyId }).lean() : null,
      AllocationSessionModel.findOne({ id: (conflict as any).sessionId }).lean()
    ]);

    // Get course names for course offering IDs
    const courseNames = await Promise.all(
      (conflict as any).courseOfferingIds.map(async (offeringId: string) => {
        const offering = await CourseOfferingModel.findOne({ id: offeringId }).lean();
        if ((offering as any)?.courseId) {
          const course = await CourseModel.findOne({ id: (offering as any).courseId }).lean();
          return (course as any)?.subjectName || `Course ${offeringId}`;
        }
        return `Course ${offeringId}`;
      })
    );

    // Format conflict with details
    const conflictWithDetails = {
      ...conflict,
      id: (conflict as any).id || (conflict as unknown as { _id: { toString(): string } })._id.toString(),
      facultyName: (faculty as any)?.displayName || (faculty as any)?.fullName || (faculty as any)?.firstName,
      sessionName: (session as any)?.name || 'Unknown Session',
      courseNames
    };

    return NextResponse.json({
      success: true,
      data: conflictWithDetails
    });
  } catch (error) {
    console.error('Error fetching allocation conflict:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch allocation conflict' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const body: Partial<AllocationConflict> = await request.json();
    
    const updatedConflict = await AllocationConflictModel.findOneAndUpdate(
      { id: params.id },
      { 
        ...body,
        id: params.id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString()
      },
      { new: true, lean: true }
    );

    if (!updatedConflict) {
      return NextResponse.json(
        { success: false, error: 'Allocation conflict not found' },
        { status: 404 }
      );
    }

    // Format conflict to ensure proper id field
    const conflictWithId = {
      ...updatedConflict,
      id: (updatedConflict as any).id || (updatedConflict as unknown as { _id: { toString(): string } })._id.toString()
    };

    return NextResponse.json({
      success: true,
      data: conflictWithId
    });
  } catch (error) {
    console.error('Error updating allocation conflict:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update allocation conflict' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const deletedConflict = await AllocationConflictModel.findOneAndDelete({ id: params.id });

    if (!deletedConflict) {
      return NextResponse.json(
        { success: false, error: 'Allocation conflict not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Allocation conflict deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting allocation conflict:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete allocation conflict' },
      { status: 500 }
    );
  }
}