import { NextResponse, type NextRequest } from 'next/server';
import type { Enrollment, EnrollmentStatus } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { EnrollmentModel, StudentModel, CourseOfferingModel } from '@/lib/models';
import { notificationService } from '@/lib/api/notifications';


const generateId = (): string => `enrl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// GET enrollments (can filter by studentId or courseOfferingId)
export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const courseOfferingId = searchParams.get('courseOfferingId');
    const status = searchParams.get('status');

    // Build filter query
    const filter: any = {};
    if (studentId) filter.studentId = studentId;
    if (courseOfferingId) filter.courseOfferingId = courseOfferingId;
    if (status) filter.status = status;

    const enrollments = await EnrollmentModel.find(filter).lean();
    
    // Get course offerings to map courseOfferingId to courseId
    const courseOfferingIds = [...new Set(enrollments.map(e => e.courseOfferingId).filter(Boolean))];
    const courseOfferings = await CourseOfferingModel.find({ 
      id: { $in: courseOfferingIds } 
    }).lean();
    
    const offeringToCourseMap = new Map();
    courseOfferings.forEach(offering => {
      if (offering.id && offering.courseId) {
        offeringToCourseMap.set(offering.id, offering.courseId);
      }
    });
    
    // Format enrollments to ensure proper id field and add courseId
    const enrollmentsWithId = enrollments.map(enrollment => ({
      ...enrollment,
      id: enrollment.id || (enrollment as any)._id.toString(),
      courseId: offeringToCourseMap.get(enrollment.courseOfferingId) || enrollment.courseOfferingId
    }));

    return NextResponse.json(enrollmentsWithId);
  } catch (error) {
    console.error('Error in GET /api/enrollments:', error);
    return NextResponse.json({ message: 'Internal server error processing enrollments request.', error: (error as Error).message }, { status: 500 });
  }
}

// POST to create a new enrollment (student enrolls or requests enrollment)
export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const enrollmentData = await request.json() as Omit<Enrollment, 'id' | 'createdAt' | 'updatedAt' | 'enrolledAt'>;

    if (!enrollmentData.studentId || !enrollmentData.courseOfferingId) {
      return NextResponse.json({ message: 'studentId and courseOfferingId are required.' }, { status: 400 });
    }

    // Check if student exists in MongoDB
    const student = await StudentModel.findOne({ id: enrollmentData.studentId });
    if (!student) {
        return NextResponse.json({ message: `Student with ID ${enrollmentData.studentId} not found.`}, { status: 404});
    }

    // Check if course offering exists in MongoDB
    const courseOffering = await CourseOfferingModel.findOne({ id: enrollmentData.courseOfferingId });
    if (!courseOffering) {
        return NextResponse.json({ message: `Course Offering with ID ${enrollmentData.courseOfferingId} not found.`}, { status: 404});
    }

    // Check for existing enrollment
    const existingEnrollment = await EnrollmentModel.findOne({
      studentId: enrollmentData.studentId,
      courseOfferingId: enrollmentData.courseOfferingId
    });
    
    if (existingEnrollment) {
      return NextResponse.json({ message: 'Student is already enrolled or has requested enrollment for this course offering.' }, { status: 409 });
    }
    
    const currentTimestamp = new Date().toISOString();
    const newEnrollmentData = {
      id: generateId(),
      studentId: enrollmentData.studentId,
      courseOfferingId: enrollmentData.courseOfferingId,
      status: enrollmentData.status || 'requested', 
      enrolledAt: enrollmentData.status === 'enrolled' ? currentTimestamp : undefined,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      internalMarks: enrollmentData.internalMarks,
      externalMarks: enrollmentData.externalMarks,
      grade: enrollmentData.grade,
      attendancePercentage: enrollmentData.attendancePercentage,
      completedAt: enrollmentData.completedAt,
    };
    
    const newEnrollment = new EnrollmentModel(newEnrollmentData);
    await newEnrollment.save();

    // Simple notification for enrollment requests
    if (newEnrollment.status === 'requested') {
        const studentName = student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : student.enrollmentNumber;
        
        try {
            // Notify a default admin (simplified for migration)
            await notificationService.createNotification({
                userId: 'user_admin_gpp', // Default admin user
                message: `New enrollment request from ${studentName} for course ${enrollmentData.courseOfferingId}.`,
                type: 'enrollment_request',
                link: `/admin/enrollments?status=requested`,
            });
        } catch (notifError) {
            console.error("Failed to create enrollment request notification:", notifError);
        }
    }

    return NextResponse.json(newEnrollment.toJSON(), { status: 201 });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json({ message: 'Error creating enrollment', error: (error as Error).message }, { status: 500 });
  }
}