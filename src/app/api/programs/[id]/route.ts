import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { ProgramModel } from '@/lib/models';
import type { Program } from '@/types/entities';
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
    
    // Try to find by custom id field first, then by MongoDB ObjectId
    let program = await ProgramModel.findOne({ id });
    if (!program && Types.ObjectId.isValid(id)) {
      program = await ProgramModel.findById(id);
    }
    
    if (!program) {
      return NextResponse.json({ message: 'Program not found' }, { status: 404 });
    }
    
    return NextResponse.json(program);
  } catch (error) {
    console.error('Error fetching program:', error);
    return NextResponse.json({ message: 'Error fetching program' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    const programData = await request.json() as Partial<Omit<Program, 'id'>>;
    
    // Validation
    if (programData.name !== undefined && !programData.name.trim()) {
      return NextResponse.json({ message: 'Program name cannot be empty.' }, { status: 400 });
    }
    if (programData.code !== undefined && !programData.code.trim()) {
      return NextResponse.json({ message: 'Program code cannot be empty.' }, { status: 400 });
    }
    if (programData.departmentId !== undefined && !programData.departmentId) {
      return NextResponse.json({ message: 'Department ID is required.' }, { status: 400 });
    }
    if (programData.instituteId !== undefined && !programData.instituteId) {
      return NextResponse.json({ message: 'Institute ID is required.' }, { status: 400 });
    }
    if (programData.durationYears !== undefined && (isNaN(programData.durationYears) || programData.durationYears <= 0)) {
      return NextResponse.json({ message: 'Duration Years must be a positive number.' }, { status: 400 });
    }
    if (programData.totalSemesters !== undefined && (isNaN(programData.totalSemesters) || programData.totalSemesters <= 0)) {
      return NextResponse.json({ message: 'Total Semesters must be a positive number.' }, { status: 400 });
    }
    
    // Check for duplicate program code within the same institute
    if (programData.code && programData.instituteId) {
      const existingProgram = await ProgramModel.findOne({
        code: programData.code.trim().toUpperCase(),
        instituteId: programData.instituteId,
        _id: { $ne: id }
      });
      
      if (existingProgram) {
        return NextResponse.json({ 
          message: `Program with code '${programData.code.trim()}' already exists for this institute.` 
        }, { status: 409 });
      }
    }
    
    // Process data before update
    const updateData = { ...programData };
    if (programData.name) {
      updateData.name = programData.name.trim();
    }
    if (programData.code) {
      updateData.code = programData.code.trim().toUpperCase();
    }
    if (programData.description) {
      updateData.description = programData.description.trim();
    }
    
    // Update timestamp
    updateData.updatedAt = new Date().toISOString();
    
    // Find the program first to get the correct MongoDB _id
    let program = await ProgramModel.findOne({ id });
    if (!program && Types.ObjectId.isValid(id)) {
      program = await ProgramModel.findById(id);
    }
    
    if (!program) {
      return NextResponse.json({ message: 'Program not found' }, { status: 404 });
    }
    
    const updatedProgram = await ProgramModel.findByIdAndUpdate(
      program._id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedProgram) {
      return NextResponse.json({ message: 'Program not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedProgram);
  } catch (error) {
    console.error('Error updating program:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    // Try to find by custom id field first, then by MongoDB ObjectId
    let programToDelete = await ProgramModel.findOne({ id });
    if (!programToDelete && Types.ObjectId.isValid(id)) {
      programToDelete = await ProgramModel.findById(id);
    }
    
    if (!programToDelete) {
      return NextResponse.json({ message: 'Program not found' }, { status: 404 });
    }
    
    await ProgramModel.findByIdAndDelete(programToDelete._id);
    return NextResponse.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Error deleting program:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

