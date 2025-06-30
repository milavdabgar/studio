import { NextResponse, type NextRequest } from 'next/server';
import type { Examination } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { connectMongoose } from '@/lib/mongodb';
import { ExaminationModel } from '@/lib/models';

// Initialize default examinations if none exist
async function initializeDefaultExaminations() {
  await connectMongoose();
  const examinationCount = await ExaminationModel.countDocuments();
  
  if (examinationCount === 0) {
    const now = new Date().toISOString();
    const defaultExaminations = [
      {
        id: "exam_midsem_2024_fall_gpp",
        name: "Mid Semester Examination - Fall 2024",
        gtuExamCode: "GTU_MIDSEM_2024_FALL",
        academicYear: "2024-25",
        examType: "Mid Semester",
        startDate: "2024-10-15",
        endDate: "2024-10-25",
        programIds: ["prog_dce_gpp", "prog_dme_gpp"],
        status: "scheduled",
        examinationTimeTable: [
          {
            id: "ette_1",
            examinationId: "exam_midsem_2024_fall_gpp",
            courseId: "course_cs101_dce_gpp",
            courseName: "Data Structures",
            date: "2024-10-16",
            startTime: "09:00",
            endTime: "12:00",
            roomIds: ["room_a101_gpp", "room_a102_gpp"],
            invigilatorIds: ["user_faculty_cs01_gpp"],
            notes: "Bring calculator and ID card"
          }
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "exam_endsem_2024_fall_gpp",
        name: "End Semester Theory Examination - Fall 2024",
        gtuExamCode: "GTU_ENDSEM_2024_FALL",
        academicYear: "2024-25",
        examType: "End Semester Theory",
        startDate: "2024-12-01",
        endDate: "2024-12-15",
        programIds: ["prog_dce_gpp"],
        status: "scheduled",
        createdAt: now,
        updatedAt: now,
      }
    ];
    
    await ExaminationModel.insertMany(defaultExaminations);
  }
}

const generateId = (): string => `exam_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    await initializeDefaultExaminations();
    
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const examType = searchParams.get('examType');
    const status = searchParams.get('status');
    const programId = searchParams.get('programId');

    // Build filter query
    let filter: any = {};
    if (academicYear) filter.academicYear = academicYear;
    if (examType) filter.examType = examType;
    if (status) filter.status = status;
    if (programId) filter.programIds = { $in: [programId] };

    const examinations = await ExaminationModel.find(filter).lean();
    
    // Format examinations to ensure proper id field
    const examinationsWithId = examinations.map(examination => ({
      ...examination,
      id: examination.id || (examination as any)._id.toString()
    }));

    return NextResponse.json(examinationsWithId);
  } catch (error) {
    console.error('Error in GET /api/examinations:', error);
    return NextResponse.json({ message: 'Internal server error processing examinations request.', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const examinationData = await request.json() as Omit<Examination, 'id' | 'createdAt' | 'updatedAt'>;

    if (!examinationData.name || !examinationData.academicYear || !examinationData.examType || !examinationData.startDate || !examinationData.endDate || !examinationData.programIds || examinationData.programIds.length === 0) {
      return NextResponse.json({ message: 'Missing required fields: name, academicYear, examType, startDate, endDate, programIds.' }, { status: 400 });
    }

    if (!isValid(parseISO(examinationData.startDate)) || !isValid(parseISO(examinationData.endDate))) {
        return NextResponse.json({ message: 'Invalid startDate or endDate format. Use YYYY-MM-DD format.' }, { status: 400 });
    }
    if (parseISO(examinationData.startDate) >= parseISO(examinationData.endDate)) {
        return NextResponse.json({ message: 'End date must be after start date.' }, { status: 400 });
    }

    // Check for duplicate examination
    const existingExamination = await ExaminationModel.findOne({
      name: examinationData.name,
      academicYear: examinationData.academicYear,
      examType: examinationData.examType
    });
    
    if (existingExamination) {
      return NextResponse.json({ message: 'Examination with this name, academic year, and exam type already exists.' }, { status: 409 });
    }

    const currentTimestamp = new Date().toISOString();
    const newExaminationData = {
      id: generateId(),
      ...examinationData,
      status: examinationData.status || 'scheduled',
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newExamination = new ExaminationModel(newExaminationData);
    await newExamination.save();
    
    return NextResponse.json(newExamination.toJSON(), { status: 201 });
  } catch (error) {
    console.error('Error creating examination:', error);
    return NextResponse.json({ message: 'Error creating examination', error: (error as Error).message }, { status: 500 });
  }
}