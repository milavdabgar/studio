import { NextResponse, type NextRequest } from 'next/server';
import type { RoomAllocation } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';

// Ensure the global store is initialized
if (!global.__API_ROOM_ALLOCATIONS_STORE__) {
  global.__API_ROOM_ALLOCATIONS_STORE__ = [];
}
let roomAllocationsStore: RoomAllocation[] = global.__API_ROOM_ALLOCATIONS_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_ROOM_ALLOCATIONS_STORE__)) {
    global.__API_ROOM_ALLOCATIONS_STORE__ = [];
    return NextResponse.json({ message: 'Room Allocation data store corrupted.' }, { status: 500 });
  }
  const allocation = global.__API_ROOM_ALLOCATIONS_STORE__.find(a => a.id === id);
  if (allocation) {
    return NextResponse.json(allocation);
  }
  return NextResponse.json({ message: 'Room allocation not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_ROOM_ALLOCATIONS_STORE__)) {
    global.__API_ROOM_ALLOCATIONS_STORE__ = [];
    return NextResponse.json({ message: 'Room Allocation data store corrupted.' }, { status: 500 });
  }
  try {
    const allocationDataToUpdate = await request.json() as Partial<Omit<RoomAllocation, 'id' | 'createdAt' | 'updatedAt'>>;
    const allocationIndex = global.__API_ROOM_ALLOCATIONS_STORE__.findIndex(a => a.id === id);

    if (allocationIndex === -1) {
      return NextResponse.json({ message: 'Room allocation not found' }, { status: 404 });
    }

    const existingAllocation = global.__API_ROOM_ALLOCATIONS_STORE__[allocationIndex];

    if (allocationDataToUpdate.startTime || allocationDataToUpdate.endTime) {
        const newStartTimeStr = allocationDataToUpdate.startTime || existingAllocation.startTime;
        const newEndTimeStr = allocationDataToUpdate.endTime || existingAllocation.endTime;
        try {
            if (!isValid(parseISO(newStartTimeStr)) || !isValid(parseISO(newEndTimeStr))) {
                return NextResponse.json({ message: 'Invalid startTime or endTime format for update. Use ISO 8601 format.' }, { status: 400 });
            }
            if (parseISO(newStartTimeStr) >= parseISO(newEndTimeStr)) {
                return NextResponse.json({ message: 'End time must be after start time for update.' }, { status: 400 });
            }

            // Basic conflict check for update
            const newStartTime = parseISO(newStartTimeStr);
            const newEndTime = parseISO(newEndTimeStr);
            const targetRoomId = allocationDataToUpdate.roomId || existingAllocation.roomId;

            const conflict = roomAllocationsStore.find(existing => 
                existing.id !== id && // Exclude the current record being updated
                existing.roomId === targetRoomId &&
                existing.status !== 'cancelled' &&
                newStartTime < parseISO(existing.endTime) &&
                newEndTime > parseISO(existing.startTime)
            );

            if (conflict) {
                return NextResponse.json({ message: `Time slot conflict for room ${targetRoomId}. Room already booked from ${conflict.startTime} to ${conflict.endTime}.` }, { status: 409 });
            }

        } catch (e) {
            return NextResponse.json({ message: 'Invalid date format for startTime or endTime during update. Use ISO 8601 format.' }, { status: 400 });
        }
    }
    
    const updatedAllocation: RoomAllocation = { 
        ...existingAllocation, 
        ...allocationDataToUpdate,
        updatedAt: new Date().toISOString(),
    };

    global.__API_ROOM_ALLOCATIONS_STORE__[allocationIndex] = updatedAllocation;
    roomAllocationsStore = global.__API_ROOM_ALLOCATIONS_STORE__; // Keep local reference in sync
    return NextResponse.json(updatedAllocation);
  } catch (error) {
    console.error(`Error updating room allocation ${id}:`, error);
    return NextResponse.json({ message: `Error updating room allocation ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_ROOM_ALLOCATIONS_STORE__)) {
    global.__API_ROOM_ALLOCATIONS_STORE__ = [];
    return NextResponse.json({ message: 'Room Allocation data store corrupted.' }, { status: 500 });
  }
  const initialLength = global.__API_ROOM_ALLOCATIONS_STORE__.length;
  const newStore = global.__API_ROOM_ALLOCATIONS_STORE__.filter(a => a.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Room allocation not found' }, { status: 404 });
  }
  
  global.__API_ROOM_ALLOCATIONS_STORE__ = newStore;
  roomAllocationsStore = global.__API_ROOM_ALLOCATIONS_STORE__; // Keep local reference in sync
  return NextResponse.json({ message: 'Room allocation deleted successfully' }, { status: 200 });
}
