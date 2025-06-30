import { NextResponse, type NextRequest } from 'next/server';
import type { RoomAllocation } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { connectMongoose } from '@/lib/mongodb';
import { RoomAllocationModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const allocation = await RoomAllocationModel.findOne({ id }).lean();
    if (allocation) {
      // Format allocation to ensure proper id field
      const allocationWithId = {
        ...allocation,
        id: allocation.id || (allocation as any)._id.toString()
      };
      return NextResponse.json(allocationWithId);
    }
    return NextResponse.json({ message: 'Room allocation not found' }, { status: 404 });
  } catch (error) {
    console.error(`Error fetching room allocation ${id}:`, error);
    return NextResponse.json({ message: 'Internal server error fetching room allocation.', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const allocationDataToUpdate = await request.json() as Partial<Omit<RoomAllocation, 'id' | 'createdAt' | 'updatedAt'>>;
    
    const existingAllocation = await RoomAllocationModel.findOne({ id }).lean();
    if (!existingAllocation) {
      return NextResponse.json({ message: 'Room allocation not found' }, { status: 404 });
    }

    // Validate time fields if provided
    if (allocationDataToUpdate.startTime && !isValid(parseISO(allocationDataToUpdate.startTime))) {
        return NextResponse.json({ message: 'Invalid startTime format. Use ISO 8601 format.' }, { status: 400 });
    }
    if (allocationDataToUpdate.endTime && !isValid(parseISO(allocationDataToUpdate.endTime))) {
        return NextResponse.json({ message: 'Invalid endTime format. Use ISO 8601 format.' }, { status: 400 });
    }
    
    // Check time order if both times are being updated
    const finalStartTime = allocationDataToUpdate.startTime || existingAllocation.startTime;
    const finalEndTime = allocationDataToUpdate.endTime || existingAllocation.endTime;
    
    if (parseISO(finalStartTime) >= parseISO(finalEndTime)) {
        return NextResponse.json({ message: 'End time must be after start time.' }, { status: 400 });
    }

    // Check for time slot conflicts if times or room are being changed
    if (allocationDataToUpdate.startTime || allocationDataToUpdate.endTime || allocationDataToUpdate.roomId) {
      const finalRoomId = allocationDataToUpdate.roomId || existingAllocation.roomId;
      
      const conflict = await RoomAllocationModel.findOne({
        id: { $ne: id },
        roomId: finalRoomId,
        status: { $ne: 'cancelled' },
        $or: [
          {
            startTime: { $lt: finalEndTime },
            endTime: { $gt: finalStartTime }
          }
        ]
      });

      if (conflict) {
          return NextResponse.json({ 
            message: `Time slot conflict for room ${finalRoomId}. Room already booked from ${conflict.startTime} to ${conflict.endTime}.` 
          }, { status: 409 });
      }
    }

    const updateData: any = {
      ...allocationDataToUpdate,
      updatedAt: new Date().toISOString()
    };

    const updatedAllocation = await RoomAllocationModel.findOneAndUpdate(
      { id },
      updateData,
      { new: true, lean: true }
    );

    if (!updatedAllocation) {
      return NextResponse.json({ message: 'Room allocation not found' }, { status: 404 });
    }

    // Format allocation to ensure proper id field
    const allocationWithId = {
      ...updatedAllocation,
      id: updatedAllocation.id || (updatedAllocation as any)._id.toString()
    };

    return NextResponse.json(allocationWithId);
  } catch (error) {
    console.error(`Error updating room allocation ${id}:`, error);
    return NextResponse.json({ message: `Error updating room allocation ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const deletedAllocation = await RoomAllocationModel.findOneAndDelete({ id });
    
    if (!deletedAllocation) {
      return NextResponse.json({ message: 'Room allocation not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Room allocation deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting room allocation ${id}:`, error);
    return NextResponse.json({ message: `Error deleting room allocation ${id}`, error: (error as Error).message }, { status: 500 });
  }
}