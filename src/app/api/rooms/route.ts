
import { NextResponse, type NextRequest } from 'next/server';
import type { Room } from '@/types/entities';

declare global {
  var __API_ROOMS_STORE__: Room[] | undefined;
}
if (!global.__API_ROOMS_STORE__) {
  global.__API_ROOMS_STORE__ = [];
}
const roomsStore: Room[] = global.__API_ROOMS_STORE__;

const generateId = (): string => `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  if (!Array.isArray(global.__API_ROOMS_STORE__)) {
      console.error("/api/rooms GET: global.__API_ROOMS_STORE__ is not an array!", global.__API_ROOMS_STORE__);
      global.__API_ROOMS_STORE__ = []; 
      return NextResponse.json({ message: 'Internal server error: Room data store corrupted.' }, { status: 500 });
  }
  return NextResponse.json(global.__API_ROOMS_STORE__);
}

export async function POST(request: NextRequest) {
  try {
    const roomData = await request.json() as Omit<Room, 'id'>;

    if (!roomData.roomNumber || !roomData.roomNumber.trim()) {
      return NextResponse.json({ message: 'Room Number cannot be empty.' }, { status: 400 });
    }
    if (!roomData.buildingId) {
      return NextResponse.json({ message: 'Building ID is required.' }, { status: 400 });
    }
     if (global.__API_ROOMS_STORE__?.some(r => r.buildingId === roomData.buildingId && r.roomNumber.toLowerCase() === roomData.roomNumber.trim().toLowerCase())) {
        return NextResponse.json({ message: `Room with number '${roomData.roomNumber.trim()}' already exists in this building.` }, { status: 409 });
    }
    
    const numericFields: (keyof Pick<Room, 'floor' | 'capacity' | 'areaSqFt'>)[] = ['floor', 'capacity', 'areaSqFt'];
    for (const field of numericFields) {
        if (roomData[field] !== undefined && roomData[field] !== null && isNaN(Number(roomData[field]))) {
            return NextResponse.json({ message: `${field} must be a valid number if provided.` }, { status: 400 });
        }
        if (field !== 'floor' && roomData[field] !== undefined && roomData[field] !== null && Number(roomData[field]) < 0) {
             return NextResponse.json({ message: `${field} must be a non-negative number.` }, { status: 400 });
        }
    }


    const newRoom: Room = {
      id: generateId(),
      roomNumber: roomData.roomNumber.trim().toUpperCase(),
      name: roomData.name?.trim() || undefined,
      buildingId: roomData.buildingId,
      floor: roomData.floor !== undefined && roomData.floor !== null ? Number(roomData.floor) : undefined,
      type: roomData.type || 'Lecture Hall',
      capacity: roomData.capacity !== undefined && roomData.capacity !== null ? Number(roomData.capacity) : undefined,
      areaSqFt: roomData.areaSqFt !== undefined && roomData.areaSqFt !== null ? Number(roomData.areaSqFt) : undefined,
      status: roomData.status || 'available',
      notes: roomData.notes?.trim() || undefined,
    };
    global.__API_ROOMS_STORE__?.push(newRoom);
    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ message: 'Error creating room', error: (error as Error).message }, { status: 500 });
  }
}
