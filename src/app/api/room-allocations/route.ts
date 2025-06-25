
import { NextResponse, type NextRequest } from 'next/server';
import type { RoomAllocation } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';

declare global {
  var __API_ROOM_ALLOCATIONS_STORE__: RoomAllocation[] | undefined;
}

const now = new Date().toISOString();

if (!global.__API_ROOM_ALLOCATIONS_STORE__ || global.__API_ROOM_ALLOCATIONS_STORE__.length === 0) {
  global.__API_ROOM_ALLOCATIONS_STORE__ = [
    {
      id: "ra_1_gpp",
      roomId: "room_a101_gpp",
      purpose: "lecture",
      courseOfferingId: "co_cs101_b2022_sem1_gpp", // Example
      facultyId: "user_faculty_cs01_gpp", // Example
      title: "CS101 Lecture",
      startTime: "2024-07-29T09:00:00.000Z",
      endTime: "2024-07-29T10:00:00.000Z",
      dayOfWeek: "Monday",
      isRecurring: true,
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "ra_2_gpp",
      roomId: "room_b202_gpp",
      purpose: "meeting",
      committeeId: "cmt_arc_gpp", // Example
      title: "Anti-Ragging Committee Meeting",
      startTime: "2024-07-30T15:00:00.000Z",
      endTime: "2024-07-30T16:30:00.000Z",
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    }
  ];
}
const roomAllocationsStore: RoomAllocation[] = global.__API_ROOM_ALLOCATIONS_STORE__;

const generateId = (): string => `ra_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  if (!Array.isArray(global.__API_ROOM_ALLOCATIONS_STORE__)) {
    global.__API_ROOM_ALLOCATIONS_STORE__ = [];
    return NextResponse.json({ message: 'Internal server error: Room Allocation data store corrupted.' }, { status: 500 });
  }
  
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  const courseOfferingId = searchParams.get('courseOfferingId');
  const facultyId = searchParams.get('facultyId');
  const date = searchParams.get('date'); 

  let filteredAllocations = [...global.__API_ROOM_ALLOCATIONS_STORE__];

  if (roomId) {
    filteredAllocations = filteredAllocations.filter(ra => ra.roomId === roomId);
  }
  if (courseOfferingId) {
    filteredAllocations = filteredAllocations.filter(ra => ra.courseOfferingId === courseOfferingId);
  }
  if (facultyId) {
    filteredAllocations = filteredAllocations.filter(ra => ra.facultyId === facultyId);
  }
  if (date) {
    try {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date format for filter');
        
        filteredAllocations = filteredAllocations.filter(ra => {
            return ra.startTime.startsWith(date);
        });
    } catch (e) {
        console.warn("Invalid date format provided for room allocation filter:", date, e);
    }
  }


  return NextResponse.json(filteredAllocations);
}

export async function POST(request: NextRequest) {
  try {
    const allocationData = await request.json() as Omit<RoomAllocation, 'id' | 'createdAt' | 'updatedAt'>;

    if (!allocationData.roomId || !allocationData.purpose || !allocationData.startTime || !allocationData.endTime || !allocationData.status) {
      return NextResponse.json({ message: 'Missing required fields: roomId, purpose, startTime, endTime, status.' }, { status: 400 });
    }

    try {
        if (!isValid(parseISO(allocationData.startTime)) || !isValid(parseISO(allocationData.endTime))) {
            return NextResponse.json({ message: 'Invalid startTime or endTime format. Use ISO 8601 format.' }, { status: 400 });
        }
        if (parseISO(allocationData.startTime) >= parseISO(allocationData.endTime)) {
            return NextResponse.json({ message: 'End time must be after start time.' }, { status: 400 });
        }
    } catch (e) {
        return NextResponse.json({ message: 'Invalid date format for startTime or endTime. Use ISO 8601 format.' }, { status: 400 });
    }
    
    const newStartTime = parseISO(allocationData.startTime);
    const newEndTime = parseISO(allocationData.endTime);

    const conflict = global.__API_ROOM_ALLOCATIONS_STORE__?.find(existing => 
        existing.roomId === allocationData.roomId &&
        existing.status !== 'cancelled' &&
        newStartTime < parseISO(existing.endTime) &&
        newEndTime > parseISO(existing.startTime)
    );

    if (conflict) {
        return NextResponse.json({ message: `Time slot conflict for room ${allocationData.roomId}. Room already booked from ${conflict.startTime} to ${conflict.endTime}.` }, { status: 409 });
    }


    const currentTimestamp = new Date().toISOString();
    const newAllocation: RoomAllocation = {
      id: generateId(),
      ...allocationData,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    global.__API_ROOM_ALLOCATIONS_STORE__?.push(newAllocation);
    return NextResponse.json(newAllocation, { status: 201 });
  } catch (error) {
    console.error('Error creating room allocation:', error);
    return NextResponse.json({ message: 'Error creating room allocation', error: (error as Error).message }, { status: 500 });
  }
}
