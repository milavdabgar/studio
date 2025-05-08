
import { NextResponse, type NextRequest } from 'next/server';
import type { Timetable, TimetableEntry } from '@/types/entities'; // Assuming Timetable types exist

declare global {
  var __API_TIMETABLES_STORE__: Timetable[] | undefined;
}

const now = new Date().toISOString();

if (!global.__API_TIMETABLES_STORE__ || global.__API_TIMETABLES_STORE__.length === 0) {
  global.__API_TIMETABLES_STORE__ = [
    {
      id: "tt_dce_sem1_gpp_2024",
      name: "DCE Semester 1 Timetable (2024-25)",
      academicYear: "2024-25",
      semester: 1,
      programId: "prog_dce_gpp",
      batchId: "batch_dce_2022_gpp", // Assuming a batch for this timetable
      version: "1.0",
      status: "published",
      effectiveDate: "2024-07-15T00:00:00.000Z",
      entries: [
        { 
          dayOfWeek: "Monday", 
          startTime: "09:00", 
          endTime: "10:00", 
          courseId: "course_cs101_dce_gpp", 
          facultyId: "user_faculty_cs01_gpp", 
          roomId: "room_a101_gpp",
          entryType: "lecture"
        },
        { 
          dayOfWeek: "Monday", 
          startTime: "10:00", 
          endTime: "11:00", 
          courseId: "course_math1_gen_gpp", 
          facultyId: "user_faculty_cs01_gpp", // Example, assign different faculty if needed
          roomId: "room_b202_gpp",
          entryType: "lecture"
        },
        // Add more entries for other days/times
      ],
      createdAt: now,
      updatedAt: now,
    }
  ];
}
const timetablesStore: Timetable[] = global.__API_TIMETABLES_STORE__;

const generateId = (): string => `tt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  if (!Array.isArray(global.__API_TIMETABLES_STORE__)) {
    global.__API_TIMETABLES_STORE__ = [];
    return NextResponse.json({ message: 'Internal server error: Timetable data store corrupted.' }, { status: 500 });
  }
  // TODO: Implement filtering if needed via searchParams
  return NextResponse.json(global.__API_TIMETABLES_STORE__);
}

export async function POST(request: NextRequest) {
  try {
    const timetableData = await request.json() as Omit<Timetable, 'id' | 'createdAt' | 'updatedAt'>;

    // Basic validation
    if (!timetableData.name || !timetableData.programId || !timetableData.academicYear || !timetableData.semester) {
      return NextResponse.json({ message: 'Missing required fields for timetable.' }, { status: 400 });
    }

    const currentTimestamp = new Date().toISOString();
    const newTimetable: Timetable = {
      id: generateId(),
      ...timetableData,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    global.__API_TIMETABLES_STORE__?.push(newTimetable);
    return NextResponse.json(newTimetable, { status: 201 });
  } catch (error) {
    console.error('Error creating timetable:', error);
    return NextResponse.json({ message: 'Error creating timetable', error: (error as Error).message }, { status: 500 });
  }
}
