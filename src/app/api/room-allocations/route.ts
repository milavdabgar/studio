import { NextResponse, type NextRequest } from 'next/server';
import type { RoomAllocation } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';

declare global {
  // eslint-disable-next-line no-var
  var __API_ROOM_ALLOCATIONS_STORE__: RoomAllocation[] | undefined;
}

if (!global.__API_ROOM_ALLOCATIONS_STORE__) {
  global.__API_ROOM_ALLOCATIONS_STORE__ = [];
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
  const date = searchParams.get('date'); // Expected format YYYY-MM-DD

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
        const targetDate = parseISO(date); // Parses "YYYY-MM-DD" to start of that day in UTC
        if (!isValid(targetDate)) throw new Error('Invalid date format');
        
        filteredAllocations = filteredAllocations.filter(ra => {
            const startTime = parseISO(ra.startTime);
            const endTime = parseISO(ra.endTime);
            // Check if the targetDate falls within the allocation's start and end (considering only date part for simplicity)
            // This is a basic check. For recurring events, more complex logic is needed.
            return startTime.toISOString().split('T')[0] <= date && endTime.toISOString().split('T')[0] >= date;
        });
    } catch (e) {
        // If date is invalid, return empty or error, for now, just don't filter by date.
        console.warn("Invalid date format provided for room allocation filter:", date);
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
    
    // Basic conflict check (can be more sophisticated for recurring events)
    // For simplicity, this checks for any overlap with existing non-cancelled allocations for the same room.
    const newStartTime = parseISO(allocationData.startTime);
    const newEndTime = parseISO(allocationData.endTime);

    const conflict = roomAllocationsStore.find(existing => 
        existing.roomId === allocationData.roomId &&
        existing.status !== 'cancelled' &&
        newStartTime < parseISO(existing.endTime) &&
        newEndTime > parseISO(existing.startTime)
    );

    if (conflict) {
        return NextResponse.json({ message: `Time slot conflict for room ${allocationData.roomId}. Room already booked from ${conflict.startTime} to ${conflict.endTime}.` }, { status: 409 });
    }


    const now = new Date().toISOString();
    const newAllocation: RoomAllocation = {
      id: generateId(),
      ...allocationData,
      createdAt: now,
      updatedAt: now,
    };
    global.__API_ROOM_ALLOCATIONS_STORE__?.push(newAllocation);
    return NextResponse.json(newAllocation, { status: 201 });
  } catch (error) {
    console.error('Error creating room allocation:', error);
    return NextResponse.json({ message: 'Error creating room allocation', error: (error as Error).message }, { status: 500 });
  }
}
