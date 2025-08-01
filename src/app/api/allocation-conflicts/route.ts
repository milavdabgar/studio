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

const generateId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const includeDetails = searchParams.get('includeDetails') === 'true';

    // Build filter query
    const filter: Record<string, unknown> = {};
    if (sessionId) filter.sessionId = sessionId;
    if (status && status !== 'all') filter.status = status;
    if (severity && severity !== 'all') filter.severity = severity;

    const conflicts = await AllocationConflictModel.find(filter)
      .sort({ severity: -1, createdAt: -1 }) // Critical first, then by date
      .lean();
    
    if (!includeDetails) {
      const formattedConflicts = conflicts.map(conflict => ({
        ...conflict,
        id: (conflict as any).id || (conflict as unknown as { _id: { toString(): string } })._id.toString()
      }));

      return NextResponse.json({
        success: true,
        data: formattedConflicts
      });
    }

    // Enrich with details if requested
    const enrichedConflicts = await Promise.all(
      conflicts.map(async (conflict) => {
        const [faculty, session] = await Promise.all([
          conflict.facultyId ? FacultyModel.findOne({ id: conflict.facultyId }).lean() : null,
          AllocationSessionModel.findOne({ id: conflict.sessionId }).lean()
        ]);

        // Get course names for course offering IDs
        const courseNames = await Promise.all(
          conflict.courseOfferingIds.map(async (offeringId: string) => {
            const offering = await CourseOfferingModel.findOne({ id: offeringId }).lean();
            if ((offering as any)?.courseId) {
              const course = await CourseModel.findOne({ id: (offering as any).courseId }).lean();
              return (course as any)?.subjectName || `Course ${offeringId}`;
            }
            return `Course ${offeringId}`;
          })
        );
        
        return {
          ...conflict,
          id: (conflict as any).id || (conflict as unknown as { _id: { toString(): string } })._id.toString(),
          facultyName: (faculty as any)?.displayName || (faculty as any)?.fullName || (faculty as any)?.firstName,
          sessionName: (session as any)?.name || 'Unknown Session',
          courseNames
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedConflicts
    });
  } catch (error) {
    console.error('Error fetching allocation conflicts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch allocation conflicts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const conflictData = await request.json() as Omit<AllocationConflict, 'id' | 'createdAt' | 'updatedAt'>;

    // Validation
    if (!conflictData.sessionId || !conflictData.conflictType || !conflictData.courseOfferingIds?.length) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sessionId, conflictType, courseOfferingIds.' },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = await AllocationSessionModel.findOne({ id: conflictData.sessionId });
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Allocation session not found.' },
        { status: 404 }
      );
    }

    const currentTimestamp = new Date().toISOString();
    const newConflictData = {
      id: generateId('ac'),
      ...conflictData,
      severity: conflictData.severity || 'medium',
      status: conflictData.status || 'unresolved',
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newConflict = new AllocationConflictModel(newConflictData);
    await newConflict.save();
    
    return NextResponse.json({
      success: true,
      data: newConflict.toJSON()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating allocation conflict:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('validation failed')) {
      return NextResponse.json({ 
        success: false,
        error: 'Validation failed. Please check your input data.', 
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { success: false, error: 'Error creating allocation conflict' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectMongoose();
    
    const body: Partial<AllocationConflict> & { id: string } = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Conflict ID is required' },
        { status: 400 }
      );
    }

    const updatedConflict = await AllocationConflictModel.findOneAndUpdate(
      { id: body.id },
      { 
        ...body,
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