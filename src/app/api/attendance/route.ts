
import { NextResponse, type NextRequest } from 'next/server';
import type { AttendanceRecord, AttendanceStatus } from '@/types/entities'; 
import { isValid, parseISO } from 'date-fns';

declare global {
  var __API_ATTENDANCE_STORE__: AttendanceRecord[] | undefined;
}

const now = new Date().toISOString();

// Ensure __API_COURSE_OFFERINGS_STORE__ is initialized, or create it if not present
if (!(global as any).__API_COURSE_OFFERINGS_STORE__) {
  (global as any).__API_COURSE_OFFERINGS_STORE__ = [
    { id: "co_cs101_b2022_sem1_gpp", courseId: "course_cs101_dce_gpp", batchId: "batch_dce_2022_gpp", academicYear: "2023-24", semester: 1, facultyIds: ["user_faculty_cs01_gpp"], status: "ongoing", createdAt: now, updatedAt: now },
    { id: "co_me101_b2023_sem1_gpp", courseId: "course_me101_dme_gpp", batchId: "batch_dme_2023_gpp", academicYear: "2023-24", semester: 1, facultyIds: ["user_faculty_me01_gpp"], status: "ongoing", createdAt: now, updatedAt: now },
  ];
}


if (!global.__API_ATTENDANCE_STORE__ || global.__API_ATTENDANCE_STORE__.length === 0) {
  global.__API_ATTENDANCE_STORE__ = [
    {
      id: "att_1_stdCE001_cs101_20231001",
      studentId: "std_ce_001_gpp", 
      courseOfferingId: "co_cs101_b2022_sem1_gpp", 
      date: "2023-10-01T09:30:00.000Z",
      status: "present",
      markedBy: "user_faculty_cs01_gpp", 
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "att_2_stdCE001_cs101_20231002",
      studentId: "std_ce_001_gpp",
      courseOfferingId: "co_cs101_b2022_sem1_gpp",
      date: "2023-10-02T09:30:00.000Z",
      status: "absent",
      markedBy: "user_faculty_cs01_gpp",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "att_3_stdME002_me101_20231001",
      studentId: "std_me_002_gpp", 
      courseOfferingId: "co_me101_b2023_sem1_gpp", 
      date: "2023-10-01T10:30:00.000Z",
      status: "late",
      markedBy: "user_faculty_me01_gpp", 
      createdAt: now,
      updatedAt: now,
    },
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
        
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date format for filter');
        
        filteredAttendance = filteredAttendance.filter(att => {
            
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
