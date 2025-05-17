import { NextResponse, type NextRequest } from 'next/server';
import type { Examination, ExaminationTimeTableEntry } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';

declare global {
  var __API_EXAMINATIONS_STORE__: Examination[] | undefined;
}
if (!global.__API_EXAMINATIONS_STORE__) {
  global.__API_EXAMINATIONS_STORE__ = [];
}
let examinationsStore: Examination[] = global.__API_EXAMINATIONS_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const examination = examinationsStore.find(e => e.id === id);
  if (examination) {
    return NextResponse.json(examination);
  }
  return NextResponse.json({ message: 'Examination not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const examDataToUpdate = await request.json() as Partial<Omit<Examination, 'id' | 'createdAt' | 'updatedAt'>>;
    const examIndex = examinationsStore.findIndex(e => e.id === id);

    if (examIndex === -1) {
      return NextResponse.json({ message: 'Examination not found' }, { status: 404 });
    }

    const existingExam = examinationsStore[examIndex];

    // Validations (can be more extensive)
    if (examDataToUpdate.name !== undefined && !examDataToUpdate.name.trim()) {
      return NextResponse.json({ message: 'Examination Name cannot be empty.' }, { status: 400 });
    }
    if (examDataToUpdate.startDate && (!isValid(parseISO(examDataToUpdate.startDate)) || (examDataToUpdate.endDate && parseISO(examDataToUpdate.startDate) >= parseISO(examDataToUpdate.endDate)))) {
      return NextResponse.json({ message: 'Invalid Start Date or Start Date is after End Date.' }, { status: 400 });
    }
    if (examDataToUpdate.endDate && !isValid(parseISO(examDataToUpdate.endDate))) {
      return NextResponse.json({ message: 'Invalid End Date format.' }, { status: 400 });
    }
    if (examDataToUpdate.examinationTimeTable) {
        for (const entry of examDataToUpdate.examinationTimeTable) {
            if (!entry.courseId || !entry.date || !entry.startTime || !entry.endTime || !entry.roomId) {
                 return NextResponse.json({ message: 'Each timetable entry must have course, date, start/end times, and room.' }, { status: 400 });
            }
            if (!isValid(parseISO(entry.date))) {
                 return NextResponse.json({ message: `Invalid date format in timetable entry: ${entry.date}` }, { status: 400 });
            }
             // Basic time validation (HH:MM)
            if (!/^\d{2}:\d{2}$/.test(entry.startTime) || !/^\d{2}:\d{2}$/.test(entry.endTime) || entry.startTime >= entry.endTime) {
                return NextResponse.json({ message: `Invalid start/end time format or logic in timetable entry for course ${entry.courseId}.` }, { status: 400 });
            }
        }
    }


    const updatedExam: Examination = {
      ...existingExam,
      ...examDataToUpdate,
      // Ensure array fields are properly merged or replaced
      programIds: examDataToUpdate.programIds || existingExam.programIds,
      examinationTimeTable: examDataToUpdate.examinationTimeTable || existingExam.examinationTimeTable || [],
      updatedAt: new Date().toISOString(),
    };
    if(examDataToUpdate.name) updatedExam.name = examDataToUpdate.name.trim();
    if(examDataToUpdate.gtuExamCode) updatedExam.gtuExamCode = examDataToUpdate.gtuExamCode.trim() || undefined;
    if(examDataToUpdate.academicYear) updatedExam.academicYear = examDataToUpdate.academicYear.trim();


    examinationsStore[examIndex] = updatedExam;
    global.__API_EXAMINATIONS_STORE__ = examinationsStore;
    return NextResponse.json(updatedExam);
  } catch (error) {
    console.error(`Error updating examination ${id}:`, error);
    return NextResponse.json({ message: `Error updating examination ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const initialLength = examinationsStore.length;
  const newStore = examinationsStore.filter(e => e.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Examination not found' }, { status: 404 });
  }
  global.__API_EXAMINATIONS_STORE__ = newStore;
  examinationsStore = global.__API_EXAMINATIONS_STORE__;
  return NextResponse.json({ message: 'Examination deleted successfully' }, { status: 200 });
}
