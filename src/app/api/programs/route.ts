import { NextResponse, type NextRequest } from 'next/server';
import type { Program } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { ProgramModel } from '@/lib/models';


export async function GET() {
  try {
    await connectMongoose();
    const programs = await ProgramModel.find();
    return NextResponse.json(programs);
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json({ message: 'Error fetching programs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    const programData = await request.json() as Omit<Program, 'id' | 'createdAt' | 'updatedAt'>;

    // Validate required fields
    if (!programData.name || !programData.name.trim()) {
      return NextResponse.json({ message: 'Program name cannot be empty.' }, { status: 400 });
    }
    if (!programData.code || !programData.code.trim()) {
      return NextResponse.json({ message: 'Program code cannot be empty.' }, { status: 400 });
    }
    if (!programData.departmentId) {
      return NextResponse.json({ message: 'Department ID is required.' }, { status: 400 });
    }
    if (!programData.instituteId) {
      return NextResponse.json({ message: 'Institute ID is required.' }, { status: 400 });
    }
    
    // Check for duplicate program code within the institute
    const existingProgram = await ProgramModel.findOne({ 
      code: { $regex: new RegExp(`^${programData.code.trim()}$`, 'i') },
      instituteId: programData.instituteId 
    });
    
    if (existingProgram) {
      return NextResponse.json({ message: `Program with code '${programData.code.trim()}' already exists for this institute.` }, { status: 409 });
    }
    
    // Validate numeric fields
    if (programData.durationYears && programData.durationYears <= 0) {
      return NextResponse.json({ message: 'Duration must be greater than 0.' }, { status: 400 });
    }
    if (programData.totalSemesters && programData.totalSemesters <= 0) {
      return NextResponse.json({ message: 'Total semesters must be greater than 0.' }, { status: 400 });
    }
    if (programData.totalCredits && programData.totalCredits <= 0) {
      return NextResponse.json({ message: 'Total credits must be greater than 0.' }, { status: 400 });
    }
    if (programData.admissionCapacity && programData.admissionCapacity <= 0) {
      return NextResponse.json({ message: 'Admission capacity must be greater than 0.' }, { status: 400 });
    }
    if (programData.currentIntakeCapacity && programData.currentIntakeCapacity <= 0) {
      return NextResponse.json({ message: 'Current intake capacity must be greater than 0.' }, { status: 400 });
    }
    
    const newProgram = new ProgramModel({
      name: programData.name.trim(),
      code: programData.code.trim().toUpperCase(),
      description: programData.description?.trim() || undefined,
      departmentId: programData.departmentId,
      instituteId: programData.instituteId,
      degreeType: programData.degreeType || undefined,
      durationYears: programData.durationYears ? Number(programData.durationYears) : undefined,
      totalSemesters: programData.totalSemesters ? Number(programData.totalSemesters) : undefined,
      totalCredits: programData.totalCredits ? Number(programData.totalCredits) : undefined,
      curriculumVersion: programData.curriculumVersion?.trim() || undefined,
      status: programData.status || 'active',
      admissionCapacity: programData.admissionCapacity ? Number(programData.admissionCapacity) : undefined,
      intakeCapacityRanges: programData.intakeCapacityRanges || undefined,
      currentIntakeCapacity: programData.currentIntakeCapacity ? Number(programData.currentIntakeCapacity) : undefined,
      yearlyIntakeCapacities: programData.yearlyIntakeCapacities || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    const savedProgram = await newProgram.save();
    return NextResponse.json(savedProgram, { status: 201 });
  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json({ message: 'Error creating program' }, { status: 500 });
  }
}
