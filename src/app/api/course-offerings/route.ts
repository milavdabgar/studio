import { NextResponse, type NextRequest } from 'next/server';
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
    
    if (!offeringData.courseId || !offeringData.academicTermId || !offeringData.facultyIds || offeringData.facultyIds.length === 0) {
      return NextResponse.json({ message: 'Missing required fields: courseId, academicTermId, facultyIds.' }, { status: 400 });
    }

    // Get additional data for legacy field population
    let academicYear = '';
    let semester = 0;
    let programId = '';

    // If programId and semester are provided in the request, use them
    if (offeringData.programId && offeringData.semester) {
      programId = offeringData.programId;
      semester = parseInt(offeringData.semester);
    }

    // Get academic year from academic term
    if (offeringData.academicTermId) {
      try {
        const { AcademicTermModel } = await import('@/lib/models');
        let academicTerm = await AcademicTermModel.findOne({ id: offeringData.academicTermId });
        if (!academicTerm) {
          academicTerm = await AcademicTermModel.findById(offeringData.academicTermId);
        }
        if (academicTerm) {
          academicYear = academicTerm.academicYear || '';
          // If semester not provided, try to get from term (legacy format)
          if (!semester && academicTerm.semesters && academicTerm.semesters.length > 0) {
            semester = academicTerm.semesters[0]; // Use first semester as default
          }
          // If programId not provided, try to get from term (legacy format)
          if (!programId && academicTerm.programId) {
            programId = academicTerm.programId;
          }
        }
      } catch (error) {
        console.error('Error fetching academic term:', error);
      }
    }

    // Check for duplicate course offering
    const existingOffering = await CourseOfferingModel.findOne({
      courseId: offeringData.courseId,
      academicTermId: offeringData.academicTermId
    });
    
    if (existingOffering) {
      return NextResponse.json({ message: 'Course offering already exists for this course and academic term.' }, { status: 409 });
    }

    const currentTimestamp = new Date().toISOString();
    const newOfferingData = {
      id: generateId(),
      ...offeringData,
      // Add legacy fields for backward compatibility and table display
      academicYear,
      semester,
      programId,
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