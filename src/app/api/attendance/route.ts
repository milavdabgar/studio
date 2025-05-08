
import { NextResponse, type NextRequest } from 'next/server';
import type { AttendanceRecord, AttendanceStatus } from '@/types/entities'; // Corrected type import
import { isValid, parseISO } from 'date-fns';

declare global {
  var __API_ATTENDANCE_STORE__: AttendanceRecord[] | undefined;
}

const now = new Date().toISOString();

if (!global.__API_ATTENDANCE_STORE__ || global.__API_ATTENDANCE_STORE__.length === 0) {
  global.__API_ATTENDANCE_STORE__ = [
    {
      id: "att_1_stdCE001_cs101_20231001",
      studentId: "user_student_ce001_gpp", // Link to user ID
      courseOfferingId: "co_cs101_b2022_sem1_gpp", // Example course offering ID
      date: "2023-10-01T00:00:00.000Z",
      status: "present",
      markedBy: "user_faculty_cs01_gpp", // Example faculty user ID
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "att_2_stdCE001_cs101_20231002",
      studentId: "user_student_ce001_gpp",
      courseOfferingId: "co_cs101_b2022_sem1_gpp",
      date: "2023-10-02T00:00:00.000Z",
      status: "absent",
      markedBy: "user_faculty_cs01_gpp",
      createdAt: now,
      updatedAt: now,
    }
  ];
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
    try {
        // Assuming date comes as YYYY-MM-DD from client filter
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date format for filter');
        
        filteredAttendance = filteredAttendance.filter(att => {
            // Compare only the date part of the ISO string
            return att.date.startsWith(date);
        });
    } catch (e) {
        console.warn("Invalid date format provided for attendance filter:", date, e);
    }
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
      
      const validStatuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
      if (!validStatuses.includes(status)) {
        errors.push(`Invalid status: ${status}. Must be one of ${validStatuses.join(', ')}.`);
        continue;
      }
      try {
          if(!isValid(parseISO(date))) throw new Error('Invalid date format');
      } catch (e) {
          errors.push(`Invalid date format: ${date}. Must be ISO 8601.`);
          continue;
      }


      const currentTimestamp = new Date().toISOString();
      const newRecord: AttendanceRecord = {
        id: generateId(),
        studentId,
        courseOfferingId,
        date,
        status,
        markedBy,
        remarks: recordData.remarks || undefined,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
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
