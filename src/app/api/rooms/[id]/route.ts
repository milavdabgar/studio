
import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { RoomModel } from '@/lib/models';
import type { Room } from '@/types/entities';
import { Types } from 'mongoose';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectMongoose();

    // Try to find by MongoDB ObjectId first, then by custom id field
    let room;
    if (Types.ObjectId.isValid(id)) {
      room = await RoomModel.findById(id);
    } else {
      room = await RoomModel.findOne({ id });
    }

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    // Convert to plain object and ensure custom id is used
    const roomObject = room.toObject();
    const response = {
      ...roomObject,
      id: roomObject.id || roomObject._id
    };
    delete response._id;
    delete response.__v;

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectMongoose();

    // Try to find by MongoDB ObjectId first, then by custom id field
    let room;
    if (Types.ObjectId.isValid(id)) {
      room = await RoomModel.findById(id);
    } else {
      room = await RoomModel.findOne({ id });
    }

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    const roomData = await request.json() as Partial<Omit<Room, 'id'>>;

    // Validation
    if (roomData.roomNumber !== undefined && !roomData.roomNumber.trim()) {
      return NextResponse.json({ message: 'Room Number cannot be empty.' }, { status: 400 });
    }
    if (roomData.buildingId !== undefined && !roomData.buildingId) {
      return NextResponse.json({ message: 'Building ID is required.' }, { status: 400 });
    }
    if (roomData.type && !['Lecture Hall', 'Laboratory', 'Office', 'Staff Room', 'Workshop', 'Library', 'Store Room', 'Seminar Hall', 'Auditorium', 'Other'].includes(roomData.type)) {
      return NextResponse.json({ message: 'Invalid room type.' }, { status: 400 });
    }
    if (roomData.status && !['available', 'occupied', 'under_maintenance', 'unavailable', 'reserved'].includes(roomData.status)) {
      return NextResponse.json({ message: 'Invalid room status.' }, { status: 400 });
    }

    // Numeric field validation
    const numericFields: (keyof Pick<Room, 'floor' | 'capacity' | 'areaSqFt'>)[] = ['floor', 'capacity', 'areaSqFt'];
    for (const field of numericFields) {
        if (roomData[field] !== undefined && roomData[field] !== null && isNaN(Number(roomData[field]))) {
            return NextResponse.json({ message: `${field} must be a valid number if provided.` }, { status: 400 });
        }
        if (field !== 'floor' && roomData[field] !== undefined && roomData[field] !== null && Number(roomData[field]) < 0) {
             return NextResponse.json({ message: `${field} must be a non-negative number.` }, { status: 400 });
        }
    }

    // Check for duplicate room number within the same building if room number or building is being updated
    if ((roomData.roomNumber && roomData.roomNumber.trim().toUpperCase() !== room.roomNumber.toUpperCase()) ||
        (roomData.buildingId && roomData.buildingId !== room.buildingId)) {
      const buildingId = roomData.buildingId || room.buildingId;
      const roomNumber = roomData.roomNumber?.trim().toUpperCase() || room.roomNumber;
      const existingRoom = await RoomModel.findOne({ 
        roomNumber: new RegExp(`^${roomNumber}$`, 'i'),
        buildingId,
        _id: { $ne: room._id }
      });
      if (existingRoom) {
        return NextResponse.json({ message: `Room with number '${roomNumber}' already exists in this building.` }, { status: 409 });
      }
    }

    // Prepare update data with proper transformations
    const updateData: Partial<Room> = { ...roomData };
    if (roomData.roomNumber) updateData.roomNumber = roomData.roomNumber.trim().toUpperCase();
    if (roomData.name !== undefined) updateData.name = roomData.name.trim() || undefined;
    if (roomData.notes !== undefined) updateData.notes = roomData.notes.trim() || undefined;
    if (roomData.floor !== undefined) updateData.floor = roomData.floor === null ? undefined : Number(roomData.floor);
    if (roomData.capacity !== undefined) updateData.capacity = roomData.capacity === null ? undefined : Number(roomData.capacity);
    if (roomData.areaSqFt !== undefined) updateData.areaSqFt = roomData.areaSqFt === null ? undefined : Number(roomData.areaSqFt);

    const updatedRoom = await RoomModel.findByIdAndUpdate(
      room._id,
      { ...updateData, updatedAt: new Date().toISOString() },
      { new: true }
    );

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ message: 'Error updating room' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectMongoose();

    // Try to find by MongoDB ObjectId first, then by custom id field
    let room;
    if (Types.ObjectId.isValid(id)) {
      room = await RoomModel.findById(id);
    } else {
      room = await RoomModel.findOne({ id });
    }

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    await RoomModel.findByIdAndDelete(room._id);
    return NextResponse.json({ message: 'Room deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
