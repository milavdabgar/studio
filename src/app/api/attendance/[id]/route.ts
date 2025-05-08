import { NextResponse, type NextRequest } from 'next/server';
import type { AttendanceRecord, AttendanceStatus } from '@/types/entities';

// Ensure the global store is initialized
if (!global.__API_ATTENDANCE_STORE__) {
  global.__API_ATTENDANCE_STORE__ = [];
}
let attendanceStore: AttendanceRecord[] = global.__API_ATTENDANCE_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_ATTENDANCE_STORE__)) {
    global.__API_ATTENDANCE_STORE__ = [];
    return NextResponse.json({ message: 'Attendance data store corrupted.' }, { status: 500 });
  }
  try {
    const recordDataToUpdate = await request.json() as Partial<Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>>;
    const recordIndex = global.__API_ATTENDANCE_STORE__.findIndex(r => r.id === id);

    if (recordIndex === -1) {
      return NextResponse.json({ message: 'Attendance record not found' }, { status: 404 });
    }

    const existingRecord = global.__API_ATTENDANCE_STORE__[recordIndex];

    if (recordDataToUpdate.status) {
        const validStatuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
        if (!validStatuses.includes(recordDataToUpdate.status)) {
            return NextResponse.json({ message: `Invalid status: ${recordDataToUpdate.status}. Must be one of ${validStatuses.join(', ')}.`}, { status: 400});
        }
    }
    
    const updatedRecord: AttendanceRecord = { 
        ...existingRecord, 
        ...recordDataToUpdate,
        updatedAt: new Date().toISOString(),
    };

    global.__API_ATTENDANCE_STORE__[recordIndex] = updatedRecord;
    attendanceStore = global.__API_ATTENDANCE_STORE__; // Keep local reference in sync
    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error(`Error updating attendance record ${id}:`, error);
    return NextResponse.json({ message: `Error updating attendance record ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_ATTENDANCE_STORE__)) {
    global.__API_ATTENDANCE_STORE__ = [];
    return NextResponse.json({ message: 'Attendance data store corrupted.' }, { status: 500 });
  }
  const initialLength = global.__API_ATTENDANCE_STORE__.length;
  const newStore = global.__API_ATTENDANCE_STORE__.filter(r => r.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Attendance record not found' }, { status: 404 });
  }
  
  global.__API_ATTENDANCE_STORE__ = newStore;
  attendanceStore = global.__API_ATTENDANCE_STORE__; // Keep local reference in sync
  return NextResponse.json({ message: 'Attendance record deleted successfully' }, { status: 200 });
}
    