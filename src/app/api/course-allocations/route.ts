import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { 
  CourseAllocationModel, 
  FacultyModel, 
  CourseOfferingModel, 
  CourseModel,
  AllocationSessionModel 
} from '@/lib/models';
import type { CourseAllocation } from '@/types/entities';

const generateId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const facultyId = searchParams.get('facultyId');
    const status = searchParams.get('status');
    const includeDetails = searchParams.get('includeDetails') === 'true';

    // Build filter query
    const filter: Record<string, unknown> = {};
    if (sessionId) filter.sessionId = sessionId;
    if (facultyId) filter.facultyId = facultyId;
    if (status && status !== 'all') filter.status = status;

    const allocations = await CourseAllocationModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    
    if (!includeDetails) {
      const formattedAllocations = allocations.map(allocation => ({
        ...allocation,
        id: (allocation as any).id || (allocation as unknown as { _id: { toString(): string } })._id.toString()
      }));

      return NextResponse.json({
        success: true,
        data: formattedAllocations
      });
    }

    // Enrich with details if requested
    const enrichedAllocations = await Promise.all(
      allocations.map(async (allocation) => {
        const [faculty, courseOffering, course, session] = await Promise.all([
          FacultyModel.findOne({ id: allocation.facultyId }).lean(),
          CourseOfferingModel.findOne({ id: allocation.courseOfferingId }).lean(),
          CourseOfferingModel.findOne({ id: allocation.courseOfferingId }).lean()
            .then(async (offering) => {
              if ((offering as any)?.courseId) {
                return CourseModel.findOne({ id: (offering as any).courseId }).lean();
              }
              return null;
            }),
          AllocationSessionModel.findOne({ id: allocation.sessionId }).lean()
        ]);
        
        return {
          ...allocation,
          id: (allocation as any).id || (allocation as unknown as { _id: { toString(): string } })._id.toString(),
          facultyName: (faculty as any)?.displayName || (faculty as any)?.fullName || (faculty as any)?.firstName || 'Unknown Faculty',
          facultyDepartment: (faculty as any)?.department || 'Unknown Department',
          courseName: (course as any)?.subjectName || 'Unknown Course',
          courseCode: (course as any)?.subcode || 'N/A',
          sessionName: (session as any)?.name || 'Unknown Session',
          semesterLabel: (courseOffering as any)?.semester ? `Semester ${(courseOffering as any).semester}` : 'Unknown Semester'
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedAllocations
    });
  } catch (error) {
    console.error('Error fetching course allocations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course allocations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const allocationData = await request.json() as Omit<CourseAllocation, 'id' | 'createdAt' | 'updatedAt'>;

    // Validation
    if (!allocationData.sessionId || !allocationData.courseOfferingId || !allocationData.facultyId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sessionId, courseOfferingId, facultyId.' },
        { status: 400 }
      );
    }

    // Check if allocation already exists
    const existingAllocation = await CourseAllocationModel.findOne({
      sessionId: allocationData.sessionId,
      courseOfferingId: allocationData.courseOfferingId
    });
    
    if (existingAllocation) {
      return NextResponse.json(
        { success: false, error: 'Course allocation already exists for this course offering in this session.' },
        { status: 409 }
      );
    }

    // Verify session exists and is not completed
    const session = await AllocationSessionModel.findOne({ id: allocationData.sessionId });
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Allocation session not found.' },
        { status: 404 }
      );
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify allocations in a completed session.' },
        { status: 400 }
      );
    }

    const currentTimestamp = new Date().toISOString();
    const newAllocationData = {
      id: generateId('ca'),
      ...allocationData,
      assignmentType: allocationData.assignmentType || 'theory',
      hoursPerWeek: allocationData.hoursPerWeek || 4,
      allocationScore: allocationData.allocationScore || 0,
      preferenceMatch: allocationData.preferenceMatch || 'none',
      expertiseLevel: allocationData.expertiseLevel || 5,
      conflictLevel: allocationData.conflictLevel || 'none',
      isManualAssignment: allocationData.isManualAssignment || true, // Manual since it's via API
      status: allocationData.status || 'pending',
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newAllocation = new CourseAllocationModel(newAllocationData);
    await newAllocation.save();
    
    return NextResponse.json({
      success: true,
      data: newAllocation.toJSON()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating course allocation:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('validation failed')) {
      return NextResponse.json({ 
        success: false,
        error: 'Validation failed. Please check your input data.', 
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { success: false, error: 'Error creating course allocation' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectMongoose();
    
    const body: Partial<CourseAllocation> & { id: string } = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Allocation ID is required' },
        { status: 400 }
      );
    }

    // Check if session is still modifiable
    const allocation = await CourseAllocationModel.findOne({ id: body.id });
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
      { id: body.id },
      { 
        ...body,
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