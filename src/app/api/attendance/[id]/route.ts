import { NextResponse, type NextRequest } from 'next/server';
import type { AttendanceRecord, AttendanceStatus } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { AttendanceRecordModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const recordDataToUpdate = await request.json() as Partial<Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>>;
    
    const existingRecord = await AttendanceRecordModel.findOne({ id }).lean();
    if (!existingRecord) {
      return NextResponse.json({ message: 'Attendance record not found' }, { status: 404 });
    }

    if (recordDataToUpdate.status) {
        const validStatuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
        if (!validStatuses.includes(recordDataToUpdate.status)) {
            return NextResponse.json({ message: `Invalid status: ${recordDataToUpdate.status}. Must be one of ${validStatuses.join(', ')}.`}, { status: 400});
        }
    }
    
    const updatedRecord = await AttendanceRecordModel.findOneAndUpdate(
      { id },
      {
        ...recordDataToUpdate,
        updatedAt: new Date().toISOString()
      },
      { new: true, lean: true }
    );

    if (!updatedRecord) {
      return NextResponse.json({ message: 'Attendance record not found' }, { status: 404 });
    }

    // Format record to ensure proper id field
    const recordWithId = {
      ...updatedRecord,
      id: updatedRecord.id || (updatedRecord as any)._id.toString()
    };

    return NextResponse.json(recordWithId);
  } catch (error) {
    console.error(`Error updating attendance record ${id}:`, error);
    return NextResponse.json({ message: `Error updating attendance record ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const deletedRecord = await AttendanceRecordModel.findOneAndDelete({ id });
    
    if (!deletedRecord) {
      return NextResponse.json({ message: 'Attendance record not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Attendance record deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting attendance record ${id}:`, error);
    return NextResponse.json({ message: `Error deleting attendance record ${id}`, error: (error as Error).message }, { status: 500 });
  }
}
    