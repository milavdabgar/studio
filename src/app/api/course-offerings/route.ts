import { NextResponse, type NextRequest } from 'next/server';
import { isValid, parseISO } from 'date-fns';
import { connectMongoose } from '@/lib/mongodb';
import { CourseOfferingModel } from '@/lib/models';

// Initialize default course offerings if none exist
async function initializeDefaultCourseOfferings() {
  await connectMongoose();
  const courseOfferingCount = await CourseOfferingModel.countDocuments();
  
  if (courseOfferingCount === 0) {
    const now = new Date().toISOString();
    const defaultCourseOfferings = [
      { 
        id: "co_cs101_b2022_sem1_gpp", 
        courseId: "course_cs101_dce_gpp", 
        batchId: "batch_dce_2022_gpp", 
        academicYear: "2024-25", 
        semester: 1, 
        facultyIds: ["user_faculty_cs01_gpp", "fac_cs01_gpp"], 
        roomIds: ["room_a101_gpp"], 
        startDate: "2024-07-15T00:00:00.000Z",
        endDate: "2024-11-15T00:00:00.000Z",
        status: "scheduled", 
        createdAt: now, 
        updatedAt: now 
      },
      { 
        id: "co_me101_b2023_sem1_gpp", 
        courseId: "course_me101_dme_gpp", 
        batchId: "batch_dme_2023_gpp", 
        academicYear: "2024-25", 
        semester: 1, 
        facultyIds: ["user_faculty_me01_gpp", "fac_me01_gpp"], 
        roomIds: ["room_b202_gpp"], 
        startDate: "2024-07-15T00:00:00.000Z",
        endDate: "2024-11-15T00:00:00.000Z",
        status: "ongoing", 
        createdAt: now, 
        updatedAt: now 
      },
       { 
        id: "co_math1_b2022_sem1_gpp", 
        courseId: "course_math1_gen_gpp", 
        batchId: "batch_dce_2022_gpp", 
        academicYear: "2024-25", 
        semester: 1, 
        facultyIds: ["user_faculty_cs01_gpp", "fac_cs01_gpp"], 
        roomIds: ["room_b202_gpp"], 
        startDate: "2024-07-15T00:00:00.000Z",
        endDate: "2024-11-15T00:00:00.000Z",
        status: "scheduled", 
        createdAt: now, 
        updatedAt: now 
      },
    ];
    
    await CourseOfferingModel.insertMany(defaultCourseOfferings);
  }
}

const generateId = (): string => `co_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    await initializeDefaultCourseOfferings();
    
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const batchId = searchParams.get('batchId');
    const academicYear = searchParams.get('academicYear');
    const semester = searchParams.get('semester');
    const status = searchParams.get('status');

    // Build filter query
    const filter: Record<string, unknown> = {};
    if (courseId) filter.courseId = courseId;
    if (batchId) filter.batchId = batchId;
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = parseInt(semester, 10);
    if (status) filter.status = status;

    const courseOfferings = await CourseOfferingModel.find(filter).lean();
    
    // Format course offerings to ensure proper id field
    const courseOfferingsWithId = courseOfferings.map(courseOffering => ({
      ...courseOffering,
      id: courseOffering.id || (courseOffering as unknown as { _id: { toString(): string } })._id.toString()
    }));

    return NextResponse.json(courseOfferingsWithId);
  } catch (error) {
    console.error('Error in GET /api/course-offerings:', error);
    return NextResponse.json({ message: 'Internal server error processing course offerings request.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const offeringData = await request.json() as any;
    
    // Handle test data format compatibility: facultyId -> facultyIds
    if (offeringData.facultyId && !offeringData.facultyIds) {
      offeringData.facultyIds = [offeringData.facultyId];
      delete offeringData.facultyId;
    }
    
    // Convert dates to ISO format if needed for test compatibility
    if (offeringData.startDate && !offeringData.startDate.includes('T')) {
      offeringData.startDate = `${offeringData.startDate}T00:00:00.000Z`;
    }
    if (offeringData.endDate && !offeringData.endDate.includes('T')) {
      offeringData.endDate = `${offeringData.endDate}T23:59:59.999Z`;
    }

    if (!offeringData.courseId || !offeringData.batchId || !offeringData.academicYear || !offeringData.semester || !offeringData.facultyIds || offeringData.facultyIds.length === 0) {
      return NextResponse.json({ message: 'Missing required fields: courseId, batchId, academicYear, semester, facultyIds.' }, { status: 400 });
    }
    if (offeringData.startDate && !isValid(parseISO(offeringData.startDate))) {
      return NextResponse.json({ message: 'Invalid startDate format. Use ISO 8601.' }, { status: 400 });
    }
    if (offeringData.endDate && !isValid(parseISO(offeringData.endDate))) {
      return NextResponse.json({ message: 'Invalid startDate format. Use ISO 8601.' }, { status: 400 });
    }
    if (offeringData.startDate && offeringData.endDate && parseISO(offeringData.startDate) >= parseISO(offeringData.endDate)) {
      return NextResponse.json({ message: 'End date must be after start date.' }, { status: 400 });
    }

    // Check for duplicate course offering
    const existingOffering = await CourseOfferingModel.findOne({
      courseId: offeringData.courseId,
      batchId: offeringData.batchId,
      academicYear: offeringData.academicYear,
      semester: offeringData.semester
    });
    
    if (existingOffering) {
      return NextResponse.json({ message: 'Course offering already exists for this course, batch, academic year, and semester.' }, { status: 409 });
    }

    const currentTimestamp = new Date().toISOString();
    const newOfferingData = {
      id: generateId(),
      ...offeringData,
      status: offeringData.status || 'scheduled',
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newOffering = new CourseOfferingModel(newOfferingData);
    await newOffering.save();
    
    return NextResponse.json(newOffering.toJSON(), { status: 201 });
  } catch (error) {
    console.error('Error creating course offering:', error);
    
    // SECURITY FIX: Handle validation errors properly
    if (error instanceof Error && error.message.includes('validation failed')) {
      return NextResponse.json({ 
        message: 'Validation failed. Please check your input data.', 
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({ message: 'Error creating course offering' }, { status: 500 });
  }
}