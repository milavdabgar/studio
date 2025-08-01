import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { 
  CourseAllocationModel, 
  AllocationSessionModel,
  FacultyModel, 
  CourseOfferingModel, 
  CourseModel 
} from '@/lib/models';
import type { CourseAllocation } from '@/types/entities';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const allocation = await CourseAllocationModel.findOne({ id: params.id }).lean();
    
    if (!allocation) {
      return NextResponse.json(
        { success: false, error: 'Course allocation not found' },
        { status: 404 }
      );
    }

    // Get additional details
    const [faculty, courseOffering, course, session] = await Promise.all([
      FacultyModel.findOne({ id: (allocation as any).facultyId }).lean(),
      CourseOfferingModel.findOne({ id: (allocation as any).courseOfferingId }).lean(),
      CourseOfferingModel.findOne({ id: (allocation as any).courseOfferingId }).lean()
        .then(async (offering) => {
          if ((offering as any)?.courseId) {
            return CourseModel.findOne({ id: (offering as any).courseId }).lean();
          }
          return null;
        }),
      AllocationSessionModel.findOne({ id: (allocation as any).sessionId }).lean()
    ]);

    // Format allocation with details
    const allocationWithDetails = {
      ...allocation,
      id: (allocation as any).id || (allocation as unknown as { _id: { toString(): string } })._id.toString(),
      facultyName: (faculty as any)?.displayName || (faculty as any)?.fullName || (faculty as any)?.firstName || 'Unknown Faculty',
      facultyDepartment: (faculty as any)?.department || 'Unknown Department',
      courseName: (course as any)?.subjectName || 'Unknown Course',
      courseCode: (course as any)?.subcode || 'N/A',
      sessionName: (session as any)?.name || 'Unknown Session',
      semesterLabel: (courseOffering as any)?.semester ? `Semester ${(courseOffering as any).semester}` : 'Unknown Semester'
    };

    return NextResponse.json({
      success: true,
      data: allocationWithDetails
    });
  } catch (error) {
    console.error('Error fetching course allocation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course allocation' },
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
    const body: Partial<CourseAllocation> = await request.json();
    
    // Check if session is still modifiable
    const allocation = await CourseAllocationModel.findOne({ id: params.id });
    if (allocation) {
      const session = await AllocationSessionModel.findOne({ id: (allocation as any).sessionId });
      if (session?.status === 'completed') {
        return NextResponse.json(
          { success: false, error: 'Cannot modify allocations in a completed session.' },
          { status: 400 }
        );
      }
    }

    const updatedAllocation = await CourseAllocationModel.findOneAndUpdate(
      { id: params.id },
      { 
        ...body,
        id: params.id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString()
      },
      { new: true, lean: true }
    );

    if (!updatedAllocation) {
      return NextResponse.json(
        { success: false, error: 'Course allocation not found' },
        { status: 404 }
      );
    }

    // Format allocation to ensure proper id field
    const allocationWithId = {
      ...updatedAllocation,
      id: (updatedAllocation as any).id || (updatedAllocation as unknown as { _id: { toString(): string } })._id.toString()
    };

    return NextResponse.json({
      success: true,
      data: allocationWithId
    });
  } catch (error) {
    console.error('Error updating course allocation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update course allocation' },
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
    
    // Check if session is still modifiable
    const allocation = await CourseAllocationModel.findOne({ id: params.id });
    if (allocation) {
      const session = await AllocationSessionModel.findOne({ id: (allocation as any).sessionId });
      if (session?.status === 'completed') {
        return NextResponse.json(
          { success: false, error: 'Cannot modify allocations in a completed session.' },
          { status: 400 }
        );
      }
    }
    
    const deletedAllocation = await CourseAllocationModel.findOneAndDelete({ id: params.id });

    if (!deletedAllocation) {
      return NextResponse.json(
        { success: false, error: 'Course allocation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Course allocation deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting course allocation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete course allocation' },
      { status: 500 }
    );
  }
}