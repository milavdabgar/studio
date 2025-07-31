
import { NextResponse, type NextRequest } from 'next/server';
import type { CourseOffering } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { connectMongoose } from '@/lib/mongodb';
import { CourseOfferingModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    const offering = await CourseOfferingModel.findOne({ id }).lean();
    if (offering) {
      // Format offering to ensure proper id field
      const offeringWithId = {
        ...offering,
        id: (offering as unknown as { id?: string; _id: { toString(): string } }).id || (offering as unknown as { id?: string; _id: { toString(): string } })._id.toString()
      };
      return NextResponse.json(offeringWithId);
    }
    return NextResponse.json({ message: 'Course offering not found' }, { status: 404 });
  } catch (error) {
    console.error('Error in GET /api/course-offerings/[id]:', error);
    return NextResponse.json({ message: 'Internal server error fetching course offering.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    const offeringDataToUpdate = await request.json() as Partial<Omit<CourseOffering, 'id' | 'createdAt' | 'updatedAt'>>;
    
    const existingOffering = await CourseOfferingModel.findOne({ id }).lean();
    if (!existingOffering) {
      return NextResponse.json({ message: 'Course offering not found' }, { status: 404 });
    }

    // Get additional data for legacy field population (similar to POST logic)
    let academicYear = '';
    let semester = 0;
    let programId = '';

    // If programId and semester are provided in the request, use them
    if (offeringDataToUpdate.programId && offeringDataToUpdate.semester) {
      programId = offeringDataToUpdate.programId;
      semester = parseInt(offeringDataToUpdate.semester.toString());
    }

    // Get academic year from academic term
    if (offeringDataToUpdate.academicTermId) {
      try {
        const { AcademicTermModel } = await import('@/lib/models');
        let academicTerm = await AcademicTermModel.findOne({ id: offeringDataToUpdate.academicTermId });
        if (!academicTerm) {
          academicTerm = await AcademicTermModel.findById(offeringDataToUpdate.academicTermId);
        }
        if (academicTerm) {
          academicYear = academicTerm.academicYear || '';
          // If semester not provided, try to get from term (legacy format)
          if (!semester && academicTerm.semesters && academicTerm.semesters.length > 0) {
            semester = academicTerm.semesters[0]; // Use first semester as default
          }
          // If programId not provided, try to get from term (legacy format)
          if (!programId && academicTerm.programId) {
            programId = academicTerm.programId;
          }
        }
      } catch (error) {
        console.error('Error fetching academic term:', error);
      }
    }

    if (offeringDataToUpdate.startDate && !isValid(parseISO(offeringDataToUpdate.startDate))) {
      return NextResponse.json({ message: 'Invalid startDate format for update. Use ISO 8601.' }, { status: 400 });
    }
    if (offeringDataToUpdate.endDate && !isValid(parseISO(offeringDataToUpdate.endDate))) {
      return NextResponse.json({ message: 'Invalid endDate format for update. Use ISO 8601.' }, { status: 400 });
    }
    
    // Only validate date order if both dates exist
    if (offeringDataToUpdate.startDate && offeringDataToUpdate.endDate) {
      const newStartDate = parseISO(offeringDataToUpdate.startDate);
      const newEndDate = parseISO(offeringDataToUpdate.endDate);
      
      if (newStartDate >= newEndDate) {
        return NextResponse.json({ message: 'End date must be after start date for update.' }, { status: 400 });
      }
    } else if (offeringDataToUpdate.startDate && (existingOffering as unknown as { endDate?: string }).endDate) {
      const newStartDate = parseISO(offeringDataToUpdate.startDate);
      const existingEndDate = parseISO((existingOffering as unknown as { endDate: string }).endDate);
      
      if (newStartDate >= existingEndDate) {
        return NextResponse.json({ message: 'Start date must be before existing end date.' }, { status: 400 });
      }
    } else if (offeringDataToUpdate.endDate && (existingOffering as unknown as { startDate?: string }).startDate) {
      const existingStartDate = parseISO((existingOffering as unknown as { startDate: string }).startDate);
      const newEndDate = parseISO(offeringDataToUpdate.endDate);
      
      if (existingStartDate >= newEndDate) {
        return NextResponse.json({ message: 'End date must be after existing start date.' }, { status: 400 });
      }
    }

    const updatedOffering = await CourseOfferingModel.findOneAndUpdate(
      { id },
      { 
        ...offeringDataToUpdate,
        // Add legacy fields for backward compatibility and table display
        ...(academicYear && { academicYear }),
        ...(semester && { semester }),
        ...(programId && { programId }),
        updatedAt: new Date().toISOString()
      },
      { new: true, lean: true }
    );

    if (!updatedOffering) {
      return NextResponse.json({ message: 'Course offering not found' }, { status: 404 });
    }

    // Format offering to ensure proper id field
    const offeringWithId = {
      ...updatedOffering,
      id: (updatedOffering as unknown as { id?: string; _id: { toString(): string } }).id || (updatedOffering as unknown as { id?: string; _id: { toString(): string } })._id.toString()
    };

    return NextResponse.json(offeringWithId);
  } catch (error) {
    console.error(`Error updating course offering ${id}:`, error);
    return NextResponse.json({ message: `Error updating course offering ${id}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    const deletedOffering = await CourseOfferingModel.findOneAndDelete({ id });
    
    if (!deletedOffering) {
      return NextResponse.json({ message: 'Course offering not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Course offering deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting course offering ${id}:`, error);
    return NextResponse.json({ message: `Error deleting course offering ${id}` }, { status: 500 });
  }
}
