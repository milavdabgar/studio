
import { NextResponse, type NextRequest } from 'next/server';
import type { Timetable } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { TimetableModel } from '@/lib/models';


// Initialize default timetables if none exist (disabled to prevent recreation of orphaned records)
async function initializeDefaultTimetables() {
  // Function disabled to prevent automatic recreation of timetables with non-existent course references
  // Admin can create timetables manually through the UI
  return;
}

const generateId = (): string => `tt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    await initializeDefaultTimetables();
    
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const batchId = searchParams.get('batchId');
    const academicYear = searchParams.get('academicYear');
    const semester = searchParams.get('semester');
    
    // Build filter query
    const filter: Record<string, unknown> = {};
    if (programId) filter.programId = programId;
    if (batchId) filter.batchId = batchId;
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = parseInt(semester);
    
    const timetables = await TimetableModel.find(filter).lean();
    
    // Format timetables to ensure proper id field
    const timetablesWithId = timetables.map(timetable => ({
      ...timetable,
      id: timetable.id || (timetable as Record<string, unknown>)._id?.toString()
    }));
    
    return NextResponse.json(timetablesWithId);
  } catch (error) {
    console.error('Error in GET /api/timetables:', error);
    return NextResponse.json({ message: 'Internal server error processing timetables request.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const timetableData = await request.json() as Omit<Timetable, 'id' | 'createdAt' | 'updatedAt'>;

    // Basic validation
    if (!timetableData.name || !timetableData.name.trim()) {
      return NextResponse.json({ message: 'Timetable name is required.' }, { status: 400 });
    }
    if (!timetableData.programId) {
      return NextResponse.json({ message: 'Program ID is required.' }, { status: 400 });
    }
    if (!timetableData.academicYear || !timetableData.academicYear.trim()) {
      return NextResponse.json({ message: 'Academic year is required.' }, { status: 400 });
    }
    if (!timetableData.semester || timetableData.semester < 1 || timetableData.semester > 8) {
      return NextResponse.json({ message: 'Valid semester (1-8) is required.' }, { status: 400 });
    }
    if (!timetableData.version || !timetableData.version.trim()) {
      return NextResponse.json({ message: 'Version is required.' }, { status: 400 });
    }
    if (!timetableData.effectiveDate) {
      return NextResponse.json({ message: 'Effective date is required.' }, { status: 400 });
    }

    const currentTimestamp = new Date().toISOString();
    const newTimetableData = {
      id: generateId(),
      name: timetableData.name.trim(),
      academicYear: timetableData.academicYear.trim(),
      semester: timetableData.semester,
      programId: timetableData.programId,
      batchId: timetableData.batchId || undefined,
      version: timetableData.version.trim(),
      status: timetableData.status || 'draft',
      effectiveDate: timetableData.effectiveDate,
      entries: timetableData.entries || [],
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newTimetable = new TimetableModel(newTimetableData);
    await newTimetable.save();
    
    return NextResponse.json(newTimetable.toJSON(), { status: 201 });
  } catch (error) {
    console.error('Error creating timetable:', error);
    return NextResponse.json({ message: 'Error creating timetable' }, { status: 500 });
  }
}
