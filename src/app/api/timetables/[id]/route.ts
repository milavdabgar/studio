import { NextResponse, type NextRequest } from 'next/server';
import type { Timetable } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { TimetableModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const timetable = await TimetableModel.findOne({ id }).lean();
    
    if (!timetable) {
      return NextResponse.json({ message: 'Timetable not found' }, { status: 404 });
    }
    
    // Format timetable to ensure proper id field
    const timetableWithId = {
      ...timetable,
      id: (timetable as Record<string, unknown>).id || (timetable as Record<string, unknown>)._id?.toString()
    };
    
    return NextResponse.json(timetableWithId);
  } catch (error) {
    console.error(`Error fetching timetable ${(await params).id}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const timetableDataToUpdate = await request.json() as Partial<Omit<Timetable, 'id' | 'createdAt' | 'updatedAt'>>;
    
    const existingTimetable = await TimetableModel.findOne({ id }).lean();
    if (!existingTimetable) {
      return NextResponse.json({ message: 'Timetable not found' }, { status: 404 });
    }
    
    // Validation
    if (timetableDataToUpdate.name !== undefined && !timetableDataToUpdate.name.trim()) {
      return NextResponse.json({ message: 'Timetable name cannot be empty.' }, { status: 400 });
    }
    if (timetableDataToUpdate.academicYear !== undefined && !timetableDataToUpdate.academicYear.trim()) {
      return NextResponse.json({ message: 'Academic year cannot be empty.' }, { status: 400 });
    }
    if (timetableDataToUpdate.semester !== undefined && (timetableDataToUpdate.semester < 1 || timetableDataToUpdate.semester > 8)) {
      return NextResponse.json({ message: 'Semester must be between 1 and 8.' }, { status: 400 });
    }
    if (timetableDataToUpdate.version !== undefined && !timetableDataToUpdate.version.trim()) {
      return NextResponse.json({ message: 'Version cannot be empty.' }, { status: 400 });
    }
    
    const updatedTimetable = await TimetableModel.findOneAndUpdate(
      { id },
      {
        ...timetableDataToUpdate,
        updatedAt: new Date().toISOString()
      },
      { new: true, lean: true }
    );

    if (!updatedTimetable) {
      return NextResponse.json({ message: 'Timetable not found' }, { status: 404 });
    }

    // Format timetable to ensure proper id field
    const timetableWithId = {
      ...updatedTimetable,
      id: (updatedTimetable as Record<string, unknown>).id || (updatedTimetable as Record<string, unknown>)._id?.toString()
    };

    return NextResponse.json(timetableWithId);
  } catch (error) {
    console.error(`Error updating timetable ${(await params).id}:`, error);
    return NextResponse.json({ message: `Error updating timetable ${(await params).id}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const deletedTimetable = await TimetableModel.findOneAndDelete({ id });
    
    if (!deletedTimetable) {
      return NextResponse.json({ message: 'Timetable not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Timetable deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting timetable ${(await params).id}:`, error);
    return NextResponse.json({ message: `Error deleting timetable ${(await params).id}` }, { status: 500 });
  }
}