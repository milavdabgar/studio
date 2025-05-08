
import { NextResponse, type NextRequest } from 'next/server';
import type { Room } from '@/types/entities';

declare global {
  var __API_ROOMS_STORE__: Room[] | undefined;
}

const now = new Date().toISOString();

if (!global.__API_ROOMS_STORE__ || global.__API_ROOMS_STORE__.length === 0) {
  global.__API_ROOMS_STORE__ = [
    { 
      id: "room_a101_gpp", 
      roomNumber: "A-101", 
      name: "Computer Lab 1", 
      buildingId: "bldg_main_gpp", 
      floor: 1, 
      type: "Laboratory", 
      capacity: 30, 
      status: "available",
      createdAt: now,
      updatedAt: now,
    },
    { 
      id: "room_b202_gpp", 
      roomNumber: "B-202", 
      name: "Lecture Hall B2", 
      buildingId: "bldg_main_gpp", 
      floor: 2, 
      type: "Lecture Hall", 
      capacity: 60, 
      status: "available",
      createdAt: now,
      updatedAt: now,
    },
    { 
      id: "room_w1_gpp", 
      roomNumber: "WKSP-01", 
      name: "Mechanical Workshop", 
      buildingId: "bldg_workshop_gpp", 
      floor: 0, 
      type: "Workshop", 
      capacity: 40, 
      status: "under_maintenance",
      createdAt: now,
      updatedAt: now,
    },
  ];
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
    const roomData = await request.json() as Omit<Room, 'id' | 'createdAt' | 'updatedAt'>;

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

    const currentTimestamp = new Date().toISOString();
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
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    global.__API_ROOMS_STORE__?.push(newRoom);
    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ message: 'Error creating room', error: (error as Error).message }, { status: 500 });
  }
}
