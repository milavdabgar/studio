
import { NextResponse, type NextRequest } from 'next/server';
import type { AttendanceRecord, AttendanceStatus } from '@/types/entities'; 
import { isValid, parseISO } from 'date-fns';
import { connectMongoose } from '@/lib/mongodb';
import { AttendanceRecordModel } from '@/lib/models';

// Initialize default attendance records if none exist
async function initializeDefaultAttendanceRecords() {
  await connectMongoose();
  const attendanceCount = await AttendanceRecordModel.countDocuments();
  
  if (attendanceCount === 0) {
    const now = new Date().toISOString();
    const defaultAttendanceRecords = [
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
    
    await AttendanceRecordModel.insertMany(defaultAttendanceRecords);
  }
}

const generateId = (): string => `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    await initializeDefaultAttendanceRecords();
    
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const courseOfferingId = searchParams.get('courseOfferingId');
    const date = searchParams.get('date'); 

    // Build filter query
    const filter: any = {};
    if (studentId) filter.studentId = studentId;
    if (courseOfferingId) filter.courseOfferingId = courseOfferingId;
    if (date) {
      try {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date format for filter');
        // Filter by date prefix (YYYY-MM-DD)
        filter.date = { $regex: `^${date}` };
      } catch (e) {
        console.warn("Invalid date format provided for attendance filter:", date, e);
      }
    }

    const attendanceRecords = await AttendanceRecordModel.find(filter).lean();
    
    // Format records to ensure proper id field
    const recordsWithId = attendanceRecords.map(record => ({
      ...record,
      id: record.id || (record as any)._id.toString()
    }));

    return NextResponse.json(recordsWithId);
  } catch (error) {
    console.error('Error in GET /api/attendance:', error);
    return NextResponse.json({ message: 'Internal server error processing attendance request.', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const body = await request.json();
    const recordsToCreate = Array.isArray(body) ? body : [body];
    const createdRecords: any[] = [];
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
      const newRecordData = {
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
      
      try {
        const newRecord = new AttendanceRecordModel(newRecordData);
        await newRecord.save();
        
        // Format record to ensure proper id field
        const recordWithId = {
          ...newRecord.toJSON(),
          id: newRecord.id || newRecord._id.toString()
        };
        
        createdRecords.push(recordWithId);
      } catch (dbError) {
        errors.push(`Failed to save record for ${studentId}: ${(dbError as Error).message}`);
      }
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
