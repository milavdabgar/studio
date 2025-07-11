import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { BatchModel } from '@/lib/models';
import type { Batch } from '@/types/entities';
import { Types } from 'mongoose';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    // Try to find by MongoDB ObjectId first, then by custom id field
    let batch;
    if (Types.ObjectId.isValid(id)) {
      batch = await BatchModel.findById(id);
    } else {
      batch = await BatchModel.findOne({ id });
    }
    
    if (!batch) {
      return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
    }
    
    return NextResponse.json(batch);
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json({ message: 'Error fetching batch' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    const batchData = await request.json() as Partial<Omit<Batch, 'id'>>;
    
    // Validation
    if (batchData.name !== undefined && !batchData.name.trim()) {
      return NextResponse.json({ message: 'Batch name cannot be empty.' }, { status: 400 });
    }
    if (batchData.programId !== undefined && !batchData.programId) {
      return NextResponse.json({ message: 'Program ID is required.' }, { status: 400 });
    }
    if (batchData.startAcademicYear !== undefined && (isNaN(batchData.startAcademicYear) || batchData.startAcademicYear < 2000)) {
      return NextResponse.json({ message: 'Start Academic Year must be a valid year.' }, { status: 400 });
    }
    if (batchData.endAcademicYear !== undefined && (isNaN(batchData.endAcademicYear) || batchData.endAcademicYear < 2000)) {
      return NextResponse.json({ message: 'End Academic Year must be a valid year.' }, { status: 400 });
    }
    if (batchData.maxIntake !== undefined && (isNaN(batchData.maxIntake) || batchData.maxIntake <= 0)) {
      return NextResponse.json({ message: 'Max Intake must be a positive number.' }, { status: 400 });
    }
    
    // Check for duplicate batch name within the same program
    if (batchData.name && batchData.programId) {
      const existingBatch = await BatchModel.findOne({
        name: batchData.name.trim(),
        programId: batchData.programId,
        _id: { $ne: id }
      });
      
      if (existingBatch) {
        return NextResponse.json({ 
          message: `Batch with name '${batchData.name.trim()}' already exists for this program.` 
        }, { status: 409 });
      }
    }
    
    // Process data before update
    const updateData = { ...batchData };
    if (batchData.name) {
      updateData.name = batchData.name.trim();
    }
    
    // Update timestamp
    updateData.updatedAt = new Date().toISOString();
    
    const updatedBatch = await BatchModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedBatch) {
      return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedBatch);
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    // Try to find by MongoDB ObjectId first, then by custom id field
    let batchToDelete;
    if (Types.ObjectId.isValid(id)) {
      batchToDelete = await BatchModel.findById(id);
    } else {
      batchToDelete = await BatchModel.findOne({ id });
    }
    
    if (!batchToDelete) {
      return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
    }
    
    await BatchModel.findByIdAndDelete(batchToDelete._id);
    return NextResponse.json({ message: 'Batch deleted successfully' }, { status: 200 });
    
    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}