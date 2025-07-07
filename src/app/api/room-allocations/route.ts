import { NextResponse, type NextRequest } from 'next/server';
import type { RoomAllocation } from '@/types/entities';
import type { IRoomAllocation } from '@/lib/models';
import type { Document, FlattenMaps } from 'mongoose';
import { isValid, parseISO } from 'date-fns';
import { connectMongoose } from '@/lib/mongodb';
import { RoomAllocationModel } from '@/lib/models';

// Initialize default room allocations if none exist
async function initializeDefaultRoomAllocations() {
  await connectMongoose();
  const allocationCount = await RoomAllocationModel.countDocuments();
  
  if (allocationCount === 0) {
    const now = new Date().toISOString();
    const defaultRoomAllocations = [
      {
        id: "ra_1_gpp",
        roomId: "room_a101_gpp",
        purpose: "lecture",
        courseOfferingId: "co_cs101_b2022_sem1_gpp",
        facultyId: "user_faculty_cs01_gpp",
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
        committeeId: "cmt_arc_gpp",
        title: "Anti-Ragging Committee Meeting",
        startTime: "2024-07-30T15:00:00.000Z",
        endTime: "2024-07-30T16:30:00.000Z",
        status: "scheduled",
        createdAt: now,
        updatedAt: now,
      }
    ];
    
    await RoomAllocationModel.insertMany(defaultRoomAllocations);
  }
}

const generateId = (): string => `ra_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    await initializeDefaultRoomAllocations();
    
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const courseOfferingId = searchParams.get('courseOfferingId');
    const facultyId = searchParams.get('facultyId');
    const date = searchParams.get('date');

    // Build filter query
    const filter: Record<string, unknown> = {};
    if (roomId) filter.roomId = roomId;
    if (courseOfferingId) filter.courseOfferingId = courseOfferingId;
    if (facultyId) filter.facultyId = facultyId;
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ message: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 });
      }
      filter.startTime = { $regex: `^${date}` };
    }

    const roomAllocations = await RoomAllocationModel.find(filter).lean() as unknown as FlattenMaps<IRoomAllocation>[];
    
    // Format room allocations to ensure proper id field
    const roomAllocationsWithId = roomAllocations.map((allocation) => ({
      ...allocation,
      id: allocation.id || allocation._id.toString()
    }));

    return NextResponse.json(roomAllocationsWithId);
  } catch (error) {
    console.error('Error in GET /api/room-allocations:', error);
    return NextResponse.json({ message: 'Internal server error processing room allocations request.', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const allocationData = await request.json() as Omit<RoomAllocation, 'id' | 'createdAt' | 'updatedAt'>;

    if (!allocationData.roomId || !allocationData.purpose || !allocationData.startTime || !allocationData.endTime || !allocationData.status) {
      return NextResponse.json({ message: 'Missing required fields: roomId, purpose, startTime, endTime, status.' }, { status: 400 });
    }

    if (!isValid(parseISO(allocationData.startTime)) || !isValid(parseISO(allocationData.endTime))) {
        return NextResponse.json({ message: 'Invalid startTime or endTime format. Use ISO 8601 format.' }, { status: 400 });
    }
    if (parseISO(allocationData.startTime) >= parseISO(allocationData.endTime)) {
        return NextResponse.json({ message: 'End time must be after start time.' }, { status: 400 });
    }
    
    const newStartTime = parseISO(allocationData.startTime);
    const newEndTime = parseISO(allocationData.endTime);

    // Check for time slot conflicts
    const conflict = await RoomAllocationModel.findOne({
      roomId: allocationData.roomId,
      status: { $ne: 'cancelled' },
      $or: [
        {
          startTime: { $lt: allocationData.endTime },
          endTime: { $gt: allocationData.startTime }
        }
      ]
    });

    if (conflict) {
        return NextResponse.json({ 
          message: `Time slot conflict for room ${allocationData.roomId}. Room already booked from ${conflict.startTime} to ${conflict.endTime}.` 
        }, { status: 409 });
    }

    const currentTimestamp = new Date().toISOString();
    const newAllocationData = {
      id: generateId(),
      ...allocationData,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newAllocation = new RoomAllocationModel(newAllocationData);
    await newAllocation.save();
    
    return NextResponse.json(newAllocation.toJSON(), { status: 201 });
  } catch (error) {
    console.error('Error creating room allocation:', error);
    return NextResponse.json({ message: 'Error creating room allocation', error: (error as Error).message }, { status: 500 });
  }
}