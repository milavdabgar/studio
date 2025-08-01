import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { AllocationSessionModel, CourseAllocationModel, AllocationConflictModel } from '@/lib/models';
import type { AllocationSession } from '@/types/entities';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const session = await AllocationSessionModel.findOne({ id: params.id }).lean();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Allocation session not found' },
        { status: 404 }
      );
    }

    // Get detailed statistics
    const allocations = await CourseAllocationModel.find({ sessionId: params.id }).lean();
    const conflicts = await AllocationConflictModel.find({ sessionId: params.id }).lean();
    const unresolvedConflicts = conflicts.filter(c => c.status === 'unresolved');

    // Format session to ensure proper id field
    const sessionWithId = {
      ...session,
      id: (session as any).id || (session as unknown as { _id: { toString(): string } })._id.toString(),
      totalAllocations: allocations.length,
      totalConflicts: conflicts.length,
      unresolvedConflicts: unresolvedConflicts.length
    };

    return NextResponse.json({
      success: true,
      data: sessionWithId
    });
  } catch (error) {
    console.error('Error fetching allocation session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch allocation session' },
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
    const body: Partial<AllocationSession> = await request.json();
    
    const updatedSession = await AllocationSessionModel.findOneAndUpdate(
      { id: params.id },
      { 
        ...body,
        id: params.id, // Ensure ID doesn't change
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    
    // Check if session has allocations
    const allocationCount = await CourseAllocationModel.countDocuments({ sessionId: params.id });
    if (allocationCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete session with existing allocations. Please delete allocations first.' },
        { status: 400 }
      );
    }
    
    const deletedSession = await AllocationSessionModel.findOneAndDelete({ id: params.id });

    if (!deletedSession) {
      return NextResponse.json(
        { success: false, error: 'Allocation session not found' },
        { status: 404 }
      );
    }

    // Clean up any associated conflicts
    await AllocationConflictModel.deleteMany({ sessionId: params.id });

    return NextResponse.json({ 
      success: true, 
      message: 'Allocation session deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting allocation session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete allocation session' },
      { status: 500 }
    );
  }
}