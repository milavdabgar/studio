import { NextResponse, type NextRequest } from 'next/server';
import type { Batch } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { BatchModel } from '@/lib/models';


export async function GET() {
  try {
    await connectMongoose();
    const batches = await BatchModel.find();
    return NextResponse.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json({ message: 'Error fetching batches', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ message: 'Error creating batch', error: (error as Error).message }, { status: 500 });
  }
}
