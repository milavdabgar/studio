import { NextResponse, type NextRequest } from 'next/server';
import { isValid, parseISO } from 'date-fns';
import { connectMongoose } from '@/lib/mongodb';
import { CourseOfferingModel } from '@/lib/models';

// Initialize default course offerings if none exist (disabled to prevent recreation of orphaned records)
async function initializeDefaultCourseOfferings() {
  // Function disabled to prevent automatic recreation of orphaned course offerings
  // Admin can create course offerings manually through the UI
  return;
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