import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { AllocationSessionModel, CourseAllocationModel, AllocationConflictModel } from '@/lib/models';
import type { AllocationSession } from '@/types/entities';

const generateId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const academicYear = searchParams.get('academicYear');
    const createdBy = searchParams.get('createdBy');

    // Build filter query
    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') filter.status = status;
    if (academicYear) filter.academicYear = academicYear;
    if (createdBy) filter.createdBy = createdBy;

    const sessions = await AllocationSessionModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    
    // Enrich with allocation counts
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const allocationCount = await CourseAllocationModel.countDocuments({ sessionId: session.id });
        const conflictCount = await AllocationConflictModel.countDocuments({ 
          sessionId: session.id, 
          status: 'unresolved' 
        });
        
        return {
          ...session,
          id: session.id || (session as unknown as { _id: { toString(): string } })._id.toString(),
          totalAllocations: allocationCount,
          unresolvedConflicts: conflictCount
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedSessions
    });
  } catch (error) {
    console.error('Error fetching allocation sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch allocation sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const sessionData = await request.json() as Omit<AllocationSession, 'id' | 'createdAt' | 'updatedAt' | 'statistics'>;

    // Validation
    if (!sessionData.name || !sessionData.academicYear || !sessionData.semesters?.length) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, academicYear, semesters.' },
        { status: 400 }
      );
    }

    if (!sessionData.createdBy) {
      return NextResponse.json(
        { success: false, error: 'createdBy field is required.' },
        { status: 400 }
      );
    }

    // Check for duplicate session name
    const existingSession = await AllocationSessionModel.findOne({
      name: sessionData.name,
      academicYear: sessionData.academicYear
    });
    
    if (existingSession) {
      return NextResponse.json(
        { success: false, error: 'Allocation session with this name already exists for the academic year.' },
        { status: 409 }
      );
    }

    const currentTimestamp = new Date().toISOString();
    const defaultAlgorithmSettings = {
      prioritizeSeniority: true,
      expertiseWeightage: 0.4,
      preferencePriorityWeightage: 0.3,
      workloadBalanceWeightage: 0.2,
      minimizeConflicts: true
    };

    const newSessionData = {
      id: generateId('as'),
      ...sessionData,
      status: sessionData.status || 'draft',
      allocationMethod: sessionData.allocationMethod || 'preference_based',
      algorithmSettings: {
        ...defaultAlgorithmSettings,
        ...(sessionData.algorithmSettings || {})
      },
      statistics: {
        totalCourses: 0,
        totalFaculty: 0,
        allocatedCourses: 0,
        unallocatedCourses: 0,
        facultyWithFullLoad: 0,
        conflictsDetected: 0,
        averageSatisfactionScore: 0
      },
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newSession = new AllocationSessionModel(newSessionData);
    await newSession.save();
    
    return NextResponse.json({
      success: true,
      data: newSession.toJSON()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating allocation session:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('validation failed')) {
      return NextResponse.json({ 
        success: false,
        error: 'Validation failed. Please check your input data.', 
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { success: false, error: 'Error creating allocation session' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectMongoose();
    
    const body: Partial<AllocationSession> & { id: string } = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const updatedSession = await AllocationSessionModel.findOneAndUpdate(
      { id: body.id },
      { 
        ...body,
        updatedAt: new Date().toISOString()
      },
      { new: true, lean: true }
    );

    if (!updatedSession) {
      return NextResponse.json(
        { success: false, error: 'Allocation session not found' },
        { status: 404 }
      );
    }

    // Format session to ensure proper id field
    const sessionWithId = {
      ...updatedSession,
      id: (updatedSession as any).id || (updatedSession as unknown as { _id: { toString(): string } })._id.toString()
    };

    return NextResponse.json({
      success: true,
      data: sessionWithId
    });
  } catch (error) {
    console.error('Error updating allocation session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update allocation session' },
      { status: 500 }
    );
  }
}