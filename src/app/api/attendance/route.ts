import { NextResponse, type NextRequest } from 'next/server';
import type { AttendanceRecord } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_ATTENDANCE_STORE__: AttendanceRecord[] | undefined;
}

if (!global.__API_ATTENDANCE_STORE__) {
  global.__API_ATTENDANCE_STORE__ = [];
}
const attendanceStore: AttendanceRecord[] = global.__API_ATTENDANCE_STORE__;

const generateId = (): string => `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  if (!Array.isArray(global.__API_ATTENDANCE_STORE__)) {
    global.__API_ATTENDANCE_STORE__ = [];
    return NextResponse.json({ message: 'Internal server error: Attendance data store corrupted.' }, { status: 500 });
  }
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const courseOfferingId = searchParams.get('courseOfferingId');
  const date = searchParams.get('date');

  let filteredAttendance = [...global.__API_ATTENDANCE_STORE__];

  if (studentId) {
    filteredAttendance = filteredAttendance.filter(att => att.studentId === studentId);
  }
  if (courseOfferingId) {
    filteredAttendance = filteredAttendance.filter(att => att.courseOfferingId === courseOfferingId);
  }
  if (date) {
    // Basic date matching, assumes date is in 'YYYY-MM-DD' format from client
    filteredAttendance = filteredAttendance.filter(att => att.date.startsWith(date));
  }

  return NextResponse.json(filteredAttendance);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const recordsToCreate = Array.isArray(body) ? body : [body];
    const createdRecords: AttendanceRecord[] = [];
    const errors: string[] = [];

    for (const recordData of recordsToCreate) {
      const { studentId, courseOfferingId, date, status, markedBy } = recordData as Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>;

      if (!studentId || !courseOfferingId || !date || !status || !markedBy) {
        errors.push(`Missing required fields for one or more records. Required: studentId, courseOfferingId, date, status, markedBy.`);
        continue;
      }
      
      // Basic validation
      const validStatuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
      if (!validStatuses.includes(status)) {
        errors.push(`Invalid status: ${status}. Must be one of ${validStatuses.join(', ')}.`);
        continue;
      }

      const now = new Date().toISOString();
      const newRecord: AttendanceRecord = {
        id: generateId(),
        studentId,
        courseOfferingId,
        date,
        status,
        markedBy,
        remarks: recordData.remarks || undefined,
        createdAt: now,
        updatedAt: now,
      };
      global.__API_ATTENDANCE_STORE__?.push(newRecord);
      createdRecords.push(newRecord);
    }

    if (errors.length > 0 && createdRecords.length === 0) {
      return NextResponse.json({ message: 'Failed to create any attendance records.', errors }, { status: 400 });
    }
    if (errors.length > 0) {
      return NextResponse.json({ message: 'Some attendance records created, but some failed.', createdRecords, errors }, { status: 207 });
    }
    
    return NextResponse.json(createdRecords.length === 1 ? createdRecords[0] : createdRecords, { status: 201 });

  } catch (error) {
    console.error('Error creating attendance record(s):', error);
    return NextResponse.json({ message: 'Error creating attendance record(s)', error: (error as Error).message }, { status: 500 });
  }
}
    