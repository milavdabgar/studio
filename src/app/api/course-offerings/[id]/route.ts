
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
        id: (offering as any).id || (offering as any)._id.toString()
      };
      return NextResponse.json(offeringWithId);
    }
    return NextResponse.json({ message: 'Course offering not found' }, { status: 404 });
  } catch (error) {
    console.error('Error in GET /api/course-offerings/[id]:', error);
    return NextResponse.json({ message: 'Internal server error fetching course offering.', error: (error as Error).message }, { status: 500 });
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
    } else if (offeringDataToUpdate.startDate && (existingOffering as any).endDate) {
      const newStartDate = parseISO(offeringDataToUpdate.startDate);
      const existingEndDate = parseISO((existingOffering as any).endDate);
      
      if (newStartDate >= existingEndDate) {
        return NextResponse.json({ message: 'Start date must be before existing end date.' }, { status: 400 });
      }
    } else if (offeringDataToUpdate.endDate && (existingOffering as any).startDate) {
      const existingStartDate = parseISO((existingOffering as any).startDate);
      const newEndDate = parseISO(offeringDataToUpdate.endDate);
      
      if (existingStartDate >= newEndDate) {
        return NextResponse.json({ message: 'End date must be after existing start date.' }, { status: 400 });
      }
    }

    const updatedOffering = await CourseOfferingModel.findOneAndUpdate(
      { id },
      { 
        ...offeringDataToUpdate,
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
      id: (updatedOffering as any).id || (updatedOffering as any)._id.toString()
    };

    return NextResponse.json(offeringWithId);
  } catch (error) {
    console.error(`Error updating course offering ${id}:`, error);
    return NextResponse.json({ message: `Error updating course offering ${id}`, error: (error as Error).message }, { status: 500 });
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
    return NextResponse.json({ message: `Error deleting course offering ${id}`, error: (error as Error).message }, { status: 500 });
  }
}
