import { NextResponse, type NextRequest } from 'next/server';
import type { CourseOffering } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';

declare global {
  var __API_COURSE_OFFERINGS_STORE__: CourseOffering[] | undefined;
}

const now = new Date().toISOString();

if (!global.__API_COURSE_OFFERINGS_STORE__ || global.__API_COURSE_OFFERINGS_STORE__.length === 0) {
  global.__API_COURSE_OFFERINGS_STORE__ = [
    { 
      id: "co_cs101_b2022_sem1_gpp", 
      courseId: "course_cs101_dce_gpp", 
      batchId: "batch_dce_2022_gpp", 
      academicYear: "2024-25", 
      semester: 1, 
      facultyIds: ["user_faculty_cs01_gpp", "fac_cs01_gpp"], 
      roomIds: ["room_a101_gpp"], 
      startDate: "2024-07-15T00:00:00.000Z",
      endDate: "2024-11-15T00:00:00.000Z",
      status: "scheduled", 
      createdAt: now, 
      updatedAt: now 
    },
    { 
      id: "co_me101_b2023_sem1_gpp", 
      courseId: "course_me101_dme_gpp", 
      batchId: "batch_dme_2023_gpp", 
      academicYear: "2024-25", 
      semester: 1, 
      facultyIds: ["user_faculty_me01_gpp", "fac_me01_gpp"], 
      roomIds: ["room_b202_gpp"], 
      startDate: "2024-07-15T00:00:00.000Z",
      endDate: "2024-11-15T00:00:00.000Z",
      status: "ongoing", 
      createdAt: now, 
      updatedAt: now 
    },
     { 
      id: "co_math1_b2022_sem1_gpp", 
      courseId: "course_math1_gen_gpp", 
      batchId: "batch_dce_2022_gpp", 
      academicYear: "2024-25", 
      semester: 1, 
      facultyIds: ["user_faculty_cs01_gpp", "fac_cs01_gpp"], 
      roomIds: ["room_b202_gpp"], 
      startDate: "2024-07-15T00:00:00.000Z",
      endDate: "2024-11-15T00:00:00.000Z",
      status: "scheduled", 
      createdAt: now, 
      updatedAt: now 
    },
  ];
}
const courseOfferingsStore: CourseOffering[] = global.__API_COURSE_OFFERINGS_STORE__;

const generateId = (): string => `co_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  if (!Array.isArray(global.__API_COURSE_OFFERINGS_STORE__)) {
    global.__API_COURSE_OFFERINGS_STORE__ = [];
    return NextResponse.json({ message: 'Internal server error: Course Offering data store corrupted.' }, { status: 500 });
  }
  return NextResponse.json(global.__API_COURSE_OFFERINGS_STORE__);
}

export async function POST(request: NextRequest) {
  try {
    const offeringData = await request.json() as Omit<CourseOffering, 'id' | 'createdAt' | 'updatedAt'>;

    if (!offeringData.courseId || !offeringData.batchId || !offeringData.academicYear || !offeringData.semester || !offeringData.facultyIds || offeringData.facultyIds.length === 0) {
      return NextResponse.json({ message: 'Missing required fields: courseId, batchId, academicYear, semester, facultyIds.' }, { status: 400 });
    }
    if (offeringData.startDate && !isValid(parseISO(offeringData.startDate))) {
      return NextResponse.json({ message: 'Invalid startDate format. Use ISO 8601.' }, { status: 400 });
    }
    if (offeringData.endDate && !isValid(parseISO(offeringData.endDate))) {
      return NextResponse.json({ message: 'Invalid endDate format. Use ISO 8601.' }, { status: 400 });
    }
    if (offeringData.startDate && offeringData.endDate && parseISO(offeringData.startDate) >= parseISO(offeringData.endDate)) {
      return NextResponse.json({ message: 'End date must be after start date.' }, { status: 400 });
    }

    const currentTimestamp = new Date().toISOString();
    const newOffering: CourseOffering = {
      id: generateId(),
      ...offeringData,
      status: offeringData.status || 'scheduled',
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    global.__API_COURSE_OFFERINGS_STORE__?.push(newOffering);
    return NextResponse.json(newOffering, { status: 201 });
  } catch (error) {
    console.error('Error creating course offering:', error);
    return NextResponse.json({ message: 'Error creating course offering', error: (error as Error).message }, { status: 500 });
  }
}