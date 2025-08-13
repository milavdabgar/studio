import { NextResponse, type NextRequest } from 'next/server';
import type { Batch } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { BatchModel, ProgramModel } from '@/lib/models';
import { withAPIRoleAccess, type APIAccessContext } from '@/lib/auth/api-middleware';


async function handleGetBatches(request: NextRequest, context: APIAccessContext) {
  try {
    await connectMongoose();
    
    let query = {};
    
    // Apply department-based filtering for non-admin users
    if (!context.canViewAllDepartments && context.departmentFilter) {
      // Get programs in the user's department
      const programs = await ProgramModel.find({ departmentId: context.departmentFilter }).lean();
      const programIds = programs.map(p => p.id || p._id?.toString());
      
      // Filter batches by programs in the user's department
      query = { programId: { $in: programIds } };
    }
    
    const batches = await BatchModel.find(query).lean();
    const batchesWithId = batches.map(batch => ({
      ...batch,
      id: batch.id || (batch as { _id: unknown })._id?.toString()
    }));
    
    return NextResponse.json(batchesWithId);
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json({ 
      message: 'Error fetching batches',
      error: error instanceof Error ? error.message : 'Database connection failed'
    }, { status: 500 });
  }
}

async function handleCreateBatch(request: NextRequest, context: APIAccessContext) {
  try {
    await connectMongoose();
    const batchData = await request.json() as Omit<Batch, 'id' | 'createdAt' | 'updatedAt'>;

    // Validate required fields
    if (!batchData.name || !batchData.name.trim()) {
      return NextResponse.json({ message: 'Batch name cannot be empty.' }, { status: 400 });
    }
    if (!batchData.programId) {
      return NextResponse.json({ message: 'Program ID is required.' }, { status: 400 });
    }
    
    // Check if user has access to the program's department
    if (!context.canEditAllDepartments && context.departmentFilter) {
      const program = await ProgramModel.findOne({ 
        $or: [{ id: batchData.programId }, { _id: batchData.programId }] 
      }).lean();
      
      if (!program || (program as any).departmentId !== context.departmentFilter) {
        return NextResponse.json({ 
          message: 'Access denied. You can only create batches for programs in your assigned department.' 
        }, { status: 403 });
      }
    }
    if (!batchData.startAcademicYear || !batchData.endAcademicYear) {
      return NextResponse.json({ message: 'Academic years are required.' }, { status: 400 });
    }
    if (batchData.startAcademicYear >= batchData.endAcademicYear) {
      return NextResponse.json({ message: 'End academic year must be greater than start academic year.' }, { status: 400 });
    }
    if (!batchData.maxIntake || batchData.maxIntake <= 0) {
      return NextResponse.json({ message: 'Valid max intake is required.' }, { status: 400 });
    }
    
    // Check for duplicate batch name within the program
    const existingBatch = await BatchModel.findOne({ 
      name: { $regex: new RegExp(`^${batchData.name.trim()}$`, 'i') },
      programId: batchData.programId 
    });
    
    if (existingBatch) {
      return NextResponse.json({ message: `Batch with name '${batchData.name.trim()}' already exists for this program.` }, { status: 409 });
    }
    
    const newBatch = new BatchModel({
      name: batchData.name.trim(),
      programId: batchData.programId,
      startAcademicYear: Number(batchData.startAcademicYear),
      endAcademicYear: Number(batchData.endAcademicYear),
      status: batchData.status || 'active',
      maxIntake: Number(batchData.maxIntake),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    const savedBatch = await newBatch.save();
    return NextResponse.json(savedBatch, { status: 201 });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json({ 
      message: 'Error creating batch',
      error: error instanceof Error ? error.message : 'Database save failed'
    }, { status: 500 });
  }
}

// Export wrapped functions for API routes
export const GET = withAPIRoleAccess(handleGetBatches, ['admin', 'super_admin', 'hod', 'principal', 'faculty']);
export const POST = withAPIRoleAccess(handleCreateBatch, ['admin', 'super_admin', 'hod', 'principal']);
