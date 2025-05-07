
import { NextResponse, type NextRequest } from 'next/server';
import type { Room } from '@/types/entities';

declare global {
  var __API_ROOMS_STORE__: Room[] | undefined;
}
if (!global.__API_ROOMS_STORE__) {
  global.__API_ROOMS_STORE__ = [];
}
let roomsStore: Room[] = global.__API_ROOMS_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_ROOMS_STORE__)) {
    global.__API_ROOMS_STORE__ = [];
    return NextResponse.json({ message: 'Room data store corrupted.' }, { status: 500 });
  }
  const room = global.__API_ROOMS_STORE__.find(r => r.id === id);
  if (room) {
    return NextResponse.json(room);
  }
  return NextResponse.json({ message: 'Room not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_ROOMS_STORE__)) {
    global.__API_ROOMS_STORE__ = [];
    return NextResponse.json({ message: 'Room data store corrupted.' }, { status: 500 });
  }
  try {
    const roomData = await request.json() as Partial<Omit<Room, 'id'>>;
    const roomIndex = global.__API_ROOMS_STORE__.findIndex(r => r.id === id);

    if (roomIndex === -1) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }
    const existingRoom = global.__API_ROOMS_STORE__[roomIndex];

    if (roomData.roomNumber !== undefined && !roomData.roomNumber.trim()) {
        return NextResponse.json({ message: 'Room Number cannot be empty.' }, { status: 400 });
    }
    if (roomData.buildingId !== undefined && !roomData.buildingId) {
      return NextResponse.json({ message: 'Building ID is required.' }, { status: 400 });
    }
     if (roomData.roomNumber && roomData.roomNumber.trim().toUpperCase() !== existingRoom.roomNumber.toUpperCase() && global.__API_ROOMS_STORE__.some(r => r.id !== id && r.buildingId === (roomData.buildingId || existingRoom.buildingId) && r.roomNumber.toLowerCase() === roomData.roomNumber!.trim().toLowerCase())) {
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

    const updatedRoom = { ...existingRoom, ...roomData };
    if(roomData.roomNumber) updatedRoom.roomNumber = roomData.roomNumber.trim().toUpperCase();
    if(roomData.name !== undefined) updatedRoom.name = roomData.name.trim() || undefined;
    if(roomData.notes !== undefined) updatedRoom.notes = roomData.notes.trim() || undefined;
    if (roomData.floor !== undefined) updatedRoom.floor = roomData.floor === null ? undefined : Number(roomData.floor);
    if (roomData.capacity !== undefined) updatedRoom.capacity = roomData.capacity === null ? undefined : Number(roomData.capacity);
    if (roomData.areaSqFt !== undefined) updatedRoom.areaSqFt = roomData.areaSqFt === null ? undefined : Number(roomData.areaSqFt);


    global.__API_ROOMS_STORE__[roomIndex] = updatedRoom;
    roomsStore = global.__API_ROOMS_STORE__;
    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error(`Error updating room ${id}:`, error);
    return NextResponse.json({ message: `Error updating room ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_ROOMS_STORE__)) {
    global.__API_ROOMS_STORE__ = [];
    return NextResponse.json({ message: 'Room data store corrupted.' }, { status: 500 });
  }
  const initialLength = global.__API_ROOMS_STORE__.length;
  const newStore = global.__API_ROOMS_STORE__.filter(r => r.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Room not found' }, { status: 404 });
  }
  global.__API_ROOMS_STORE__ = newStore;
  roomsStore = global.__API_ROOMS_STORE__;
  return NextResponse.json({ message: 'Room deleted successfully' }, { status: 200 });
}
