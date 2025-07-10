import { NextResponse, type NextRequest } from 'next/server';
import type { Curriculum } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { connectMongoose } from '@/lib/mongodb';
import { CurriculumModel } from '@/lib/models';

// Initialize default curriculum if none exist
async function initializeDefaultCurriculum() {
  await connectMongoose();
  const curriculumCount = await CurriculumModel.countDocuments();
  
  if (curriculumCount === 0) {
    const now = new Date().toISOString();
    const defaultCurriculum = [
      {
        id: "curr_dce_v1_gpp",
        programId: "prog_dce_gpp",
        version: "1.0",
        effectiveDate: "2024-07-01",
        courses: [
          { courseId: "course_cs101_dce_gpp", semester: 1, isElective: false },
          { courseId: "course_math1_gen_gpp", semester: 1, isElective: false },
        ],
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    ];
    
    await CurriculumModel.insertMany(defaultCurriculum);
  }
}

const generateId = (): string => `curr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  try {
    await connectMongoose();
    await initializeDefaultCurriculum();
    
    const curriculum = await CurriculumModel.find({}).lean();
    
    // Format curriculum to ensure proper id field
    const curriculumWithId = curriculum.map(curr => ({
      ...curr,
      id: curr.id || (curr as unknown as { _id: { toString(): string } })._id.toString()
    }));

    return NextResponse.json(curriculumWithId);
  } catch (error) {
    console.error('Error in GET /api/curriculum:', error);
    return NextResponse.json({ message: 'Internal server error processing curriculum request.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const curriculumData = await request.json() as Omit<Curriculum, 'id' | 'createdAt' | 'updatedAt'>;

    if (!curriculumData.programId || !curriculumData.version?.trim() || !curriculumData.effectiveDate) {
      return NextResponse.json({ message: 'Program ID, Version, and Effective Date are required.' }, { status: 400 });
    }
    if (!isValid(parseISO(curriculumData.effectiveDate))) {
        return NextResponse.json({ message: 'Invalid Effective Date format. Use YYYY-MM-DD.' }, { status: 400 });
    }
    if (!curriculumData.courses || curriculumData.courses.length === 0) {
        return NextResponse.json({ message: 'Curriculum must contain at least one course.' }, { status: 400 });
    }
    
    // Check for duplicate curriculum
    const existingCurriculum = await CurriculumModel.findOne({
      programId: curriculumData.programId,
      version: { $regex: new RegExp(`^${curriculumData.version.trim()}$`, 'i') }
    });
    
    if (existingCurriculum) {
        return NextResponse.json({ message: `Curriculum version '${curriculumData.version.trim()}' already exists for this program.` }, { status: 409 });
    }

    const currentTimestamp = new Date().toISOString();
    const newCurriculumData = {
      id: generateId(),
      programId: curriculumData.programId,
      version: curriculumData.version.trim(),
      effectiveDate: curriculumData.effectiveDate,
      courses: curriculumData.courses,
      status: curriculumData.status || 'draft',
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newCurriculum = new CurriculumModel(newCurriculumData);
    await newCurriculum.save();
    
    return NextResponse.json(newCurriculum.toJSON(), { status: 201 });
  } catch (error) {
    console.error('Error creating curriculum:', error);
    return NextResponse.json({ message: 'Error creating curriculum' }, { status: 500 });
  }
}