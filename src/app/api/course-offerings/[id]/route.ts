
import { NextResponse, type NextRequest } from 'next/server';
import type { CourseOffering } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';

declare global {
  var __API_COURSE_OFFERINGS_STORE__: CourseOffering[] | undefined;
}

if (!global.__API_COURSE_OFFERINGS_STORE__) {
  global.__API_COURSE_OFFERINGS_STORE__ = [];
}
let courseOfferingsStore: CourseOffering[] = global.__API_COURSE_OFFERINGS_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_COURSE_OFFERINGS_STORE__)) {
    global.__API_COURSE_OFFERINGS_STORE__ = [];
    return NextResponse.json({ message: 'Course Offering data store corrupted.' }, { status: 500 });
  }
  const offering = global.__API_COURSE_OFFERINGS_STORE__.find(co => co.id === id);
  if (offering) {
    return NextResponse.json(offering);
  }
  return NextResponse.json({ message: 'Course offering not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_COURSE_OFFERINGS_STORE__)) {
    global.__API_COURSE_OFFERINGS_STORE__ = [];
    return NextResponse.json({ message: 'Course Offering data store corrupted.' }, { status: 500 });
  }
  try {
    const offeringDataToUpdate = await request.json() as Partial<Omit<CourseOffering, 'id' | 'createdAt' | 'updatedAt'>>;
    const offeringIndex = global.__API_COURSE_OFFERINGS_STORE__.findIndex(co => co.id === id);

    if (offeringIndex === -1) {
      return NextResponse.json({ message: 'Course offering not found' }, { status: 404 });
    }
    
    const existingOffering = global.__API_COURSE_OFFERINGS_STORE__[offeringIndex];

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
    } else if (offeringDataToUpdate.startDate && existingOffering.endDate) {
      const newStartDate = parseISO(offeringDataToUpdate.startDate);
      const existingEndDate = parseISO(existingOffering.endDate);
      
      if (newStartDate >= existingEndDate) {
        return NextResponse.json({ message: 'Start date must be before existing end date.' }, { status: 400 });
      }
    } else if (offeringDataToUpdate.endDate && existingOffering.startDate) {
      const existingStartDate = parseISO(existingOffering.startDate);
      const newEndDate = parseISO(offeringDataToUpdate.endDate);
      
      if (existingStartDate >= newEndDate) {
        return NextResponse.json({ message: 'End date must be after existing start date.' }, { status: 400 });
      }
    }


    const updatedOffering: CourseOffering = {
      ...existingOffering,
      ...offeringDataToUpdate,
      updatedAt: new Date().toISOString(),
    };

    global.__API_COURSE_OFFERINGS_STORE__[offeringIndex] = updatedOffering;
    courseOfferingsStore = global.__API_COURSE_OFFERINGS_STORE__;
    return NextResponse.json(updatedOffering);
  } catch (error) {
    console.error(`Error updating course offering ${id}:`, error);
    return NextResponse.json({ message: `Error updating course offering ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_COURSE_OFFERINGS_STORE__)) {
    global.__API_COURSE_OFFERINGS_STORE__ = [];
    return NextResponse.json({ message: 'Course Offering data store corrupted.' }, { status: 500 });
  }
  const initialLength = global.__API_COURSE_OFFERINGS_STORE__.length;
  const newStore = global.__API_COURSE_OFFERINGS_STORE__.filter(co => co.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Course offering not found' }, { status: 404 });
  }

  global.__API_COURSE_OFFERINGS_STORE__ = newStore;
  courseOfferingsStore = global.__API_COURSE_OFFERINGS_STORE__;
  return NextResponse.json({ message: 'Course offering deleted successfully' }, { status: 200 });
}
