
import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { RoomModel } from '@/lib/models';
import type { Room } from '@/types/entities';

function generateId(): string {
  return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function GET() {
  try {
    await connectMongoose();
    const rooms = await RoomModel.find({});
    
    // Convert to plain objects and ensure custom id is used
    const response = rooms.map(room => {
      const roomObject = room.toObject();
      return {
        ...roomObject,
        id: roomObject.id || roomObject._id.toString()
      };
    }).map(room => {
      delete room._id;
      delete room.__v;
      return room;
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    const roomData = await request.json() as Omit<Room, 'id' | 'createdAt' | 'updatedAt'>;

    // Validation
    if (!roomData.roomNumber || !roomData.roomNumber.trim()) {
      return NextResponse.json({ message: 'Room Number cannot be empty.' }, { status: 400 });
    }
    if (!roomData.buildingId) {
      return NextResponse.json({ message: 'Building ID is required.' }, { status: 400 });
    }

    // Check for duplicate room number in the same building
    const existingRoom = await RoomModel.findOne({
      buildingId: roomData.buildingId,
      roomNumber: { $regex: new RegExp(`^${roomData.roomNumber.trim()}$`, 'i') }
    });

    if (existingRoom) {
      return NextResponse.json({ 
        message: `Room with number '${roomData.roomNumber.trim()}' already exists in this building.` 
      }, { status: 409 });
    }
    
    // Validate numeric fields
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
    const newRoomData = {
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

    const newRoom = new RoomModel(newRoomData);
    await newRoom.save();

    // Return the room with custom id
    const roomObject = newRoom.toObject();
    const response = {
      ...roomObject,
      id: roomObject.id || roomObject._id.toString()
    };
    delete response._id;
    delete response.__v;

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ message: 'Error creating room', error: (error as Error).message }, { status: 500 });
  }
}
