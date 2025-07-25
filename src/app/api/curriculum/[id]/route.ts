import { NextResponse, type NextRequest } from 'next/server';
import type { Curriculum } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { connectMongoose } from '@/lib/mongodb';
import { CurriculumModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

type CurriculumLean = Omit<Curriculum, 'id'> & { 
  _id: string; 
  id?: string; 
  __v?: number; 
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    const curriculum = await CurriculumModel.findOne({ id }).lean() as CurriculumLean | null;
    if (curriculum) {
      // Format curriculum to ensure proper id field
      const curriculumWithId = {
        ...curriculum,
        id: curriculum.id || curriculum._id.toString()
      };
      return NextResponse.json(curriculumWithId);
    }
    return NextResponse.json({ message: 'Curriculum not found' }, { status: 404 });
  } catch (error) {
    console.error(`Error fetching curriculum ${id}:`, error);
    return NextResponse.json({ message: 'Internal server error fetching curriculum.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    const curriculumDataToUpdate = await request.json() as Partial<Omit<Curriculum, 'id' | 'createdAt' | 'updatedAt'>>;
    
    const existingCurriculum = await CurriculumModel.findOne({ id }).lean() as CurriculumLean | null;
    if (!existingCurriculum) {
      return NextResponse.json({ message: 'Curriculum not found' }, { status: 404 });
    }

    if (curriculumDataToUpdate.version !== undefined && !curriculumDataToUpdate.version.trim()) {
        return NextResponse.json({ message: 'Version cannot be empty.' }, { status: 400 });
    }
    if (curriculumDataToUpdate.effectiveDate && !isValid(parseISO(curriculumDataToUpdate.effectiveDate))) {
        return NextResponse.json({ message: 'Invalid Effective Date format. Use YYYY-MM-DD.' }, { status: 400 });
    }
     if (curriculumDataToUpdate.courses && curriculumDataToUpdate.courses.length === 0) {
        return NextResponse.json({ message: 'Curriculum must contain at least one course.' }, { status: 400 });
    }
    
    // Check for duplicate version
    if (curriculumDataToUpdate.version && curriculumDataToUpdate.version.trim().toLowerCase() !== existingCurriculum.version?.toLowerCase()) {
        const duplicateCurriculum = await CurriculumModel.findOne({
          id: { $ne: id },
          programId: curriculumDataToUpdate.programId || existingCurriculum.programId,
          version: { $regex: new RegExp(`^${curriculumDataToUpdate.version.trim()}$`, 'i') }
        });
        
        if (duplicateCurriculum) {
          return NextResponse.json({ message: `Curriculum version '${curriculumDataToUpdate.version.trim()}' already exists for this program.` }, { status: 409 });
        }
    }

    const updateData: Record<string, unknown> = {
      ...curriculumDataToUpdate,
      updatedAt: new Date().toISOString()
    };
    
    if (curriculumDataToUpdate.version) {
      updateData.version = curriculumDataToUpdate.version.trim();
    }

    const updatedCurriculum = await CurriculumModel.findOneAndUpdate(
      { id },
      updateData,
      { new: true, lean: true }
    ) as CurriculumLean | null;

    if (!updatedCurriculum) {
      return NextResponse.json({ message: 'Curriculum not found' }, { status: 404 });
    }

    // Format curriculum to ensure proper id field
    const curriculumWithId = {
      ...updatedCurriculum,
      id: updatedCurriculum.id || updatedCurriculum._id.toString()
    };

    return NextResponse.json(curriculumWithId);
  } catch (error) {
    console.error(`Error updating curriculum ${id}:`, error);
    return NextResponse.json({ message: `Error updating curriculum ${id}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    const deletedCurriculum = await CurriculumModel.findOneAndDelete({ id });
    
    if (!deletedCurriculum) {
      return NextResponse.json({ message: 'Curriculum not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Curriculum deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting curriculum ${id}:`, error);
    return NextResponse.json({ message: `Error deleting curriculum ${id}` }, { status: 500 });
  }
}