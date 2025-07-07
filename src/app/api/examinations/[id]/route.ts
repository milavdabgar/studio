import { NextResponse, type NextRequest } from 'next/server';
import type { Examination } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { connectMongoose } from '@/lib/mongodb';
import { ExaminationModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

type ExaminationLean = Omit<Examination, 'id'> & { 
  _id: string; 
  id?: string; 
  __v?: number; 
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    const examination = await ExaminationModel.findOne({ id }).lean() as ExaminationLean | null;
    if (examination) {
      // Format examination to ensure proper id field
      const examinationWithId = {
        ...examination,
        id: examination.id || examination._id.toString()
      };
      return NextResponse.json(examinationWithId);
    }
    return NextResponse.json({ message: 'Examination not found' }, { status: 404 });
  } catch (error) {
    console.error(`Error fetching examination ${id}:`, error);
    return NextResponse.json({ message: 'Internal server error fetching examination.', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    const examinationDataToUpdate = await request.json() as Partial<Omit<Examination, 'id' | 'createdAt' | 'updatedAt'>>;
    
    const existingExamination = await ExaminationModel.findOne({ id }).lean() as ExaminationLean | null;
    if (!existingExamination) {
      return NextResponse.json({ message: 'Examination not found' }, { status: 404 });
    }

    // Validate date fields if provided
    if (examinationDataToUpdate.startDate && !isValid(parseISO(examinationDataToUpdate.startDate))) {
        return NextResponse.json({ message: 'Invalid startDate format. Use YYYY-MM-DD format.' }, { status: 400 });
    }
    if (examinationDataToUpdate.endDate && !isValid(parseISO(examinationDataToUpdate.endDate))) {
        return NextResponse.json({ message: 'Invalid endDate format. Use YYYY-MM-DD format.' }, { status: 400 });
    }
    
    // Check date order if both dates are being updated
    const finalStartDate = examinationDataToUpdate.startDate || existingExamination.startDate;
    const finalEndDate = examinationDataToUpdate.endDate || existingExamination.endDate;
    
    if (parseISO(finalStartDate) >= parseISO(finalEndDate)) {
        return NextResponse.json({ message: 'End date must be after start date.' }, { status: 400 });
    }

    // Check for duplicate examination if key fields are being changed
    if (examinationDataToUpdate.name || examinationDataToUpdate.academicYear || examinationDataToUpdate.examType) {
      const finalName = examinationDataToUpdate.name || existingExamination.name;
      const finalAcademicYear = examinationDataToUpdate.academicYear || existingExamination.academicYear;
      const finalExamType = examinationDataToUpdate.examType || existingExamination.examType;
      
      const duplicateExamination = await ExaminationModel.findOne({
        id: { $ne: id },
        name: finalName,
        academicYear: finalAcademicYear,
        examType: finalExamType
      });
      
      if (duplicateExamination) {
        return NextResponse.json({ message: 'Examination with this name, academic year, and exam type already exists.' }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {
      ...examinationDataToUpdate,
      updatedAt: new Date().toISOString()
    };

    const updatedExamination = await ExaminationModel.findOneAndUpdate(
      { id },
      updateData,
      { new: true, lean: true }
    ) as ExaminationLean | null;

    if (!updatedExamination) {
      return NextResponse.json({ message: 'Examination not found' }, { status: 404 });
    }

    // Format examination to ensure proper id field
    const examinationWithId = {
      ...updatedExamination,
      id: updatedExamination.id || updatedExamination._id.toString()
    };

    return NextResponse.json(examinationWithId);
  } catch (error) {
    console.error(`Error updating examination ${id}:`, error);
    return NextResponse.json({ message: `Error updating examination ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    const deletedExamination = await ExaminationModel.findOneAndDelete({ id });
    
    if (!deletedExamination) {
      return NextResponse.json({ message: 'Examination not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Examination deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting examination ${id}:`, error);
    return NextResponse.json({ message: `Error deleting examination ${id}`, error: (error as Error).message }, { status: 500 });
  }
}