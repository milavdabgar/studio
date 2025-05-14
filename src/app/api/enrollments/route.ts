import { NextResponse, type NextRequest } from 'next/server';
import type { Enrollment, EnrollmentStatus } from '@/types/entities';

// Ensure the global store is initialized
declare global {
  // eslint-disable-next-line no-var
  var __API_ENROLLMENTS_STORE__: Enrollment[] | undefined;
  // eslint-disable-next-line no-var
  var __API_STUDENTS_STORE__: any[] | undefined; // Assuming student store exists
  // eslint-disable-next-line no-var
  var __API_COURSE_OFFERINGS_STORE__: any[] | undefined; // Assuming course offering store exists
}
if (!global.__API_ENROLLMENTS_STORE__) {
  global.__API_ENROLLMENTS_STORE__ = [];
}
if (!global.__API_STUDENTS_STORE__) {
  global.__API_STUDENTS_STORE__ = [];
}
if (!global.__API_COURSE_OFFERINGS_STORE__) {
  global.__API_COURSE_OFFERINGS_STORE__ = [];
}

let enrollmentsStore: Enrollment[] = global.__API_ENROLLMENTS_STORE__;
const studentsStore: any[] = global.__API_STUDENTS_STORE__;
const courseOfferingsStore: any[] = global.__API_COURSE_OFFERINGS_STORE__;

const generateId = (): string => `enrl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// GET enrollments (can filter by studentId or courseOfferingId)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const courseOfferingId = searchParams.get('courseOfferingId');

  let filteredEnrollments = [...enrollmentsStore];

  if (studentId) {
    filteredEnrollments = filteredEnrollments.filter(e => e.studentId === studentId);
  }
  if (courseOfferingId) {
    filteredEnrollments = filteredEnrollments.filter(e => e.courseOfferingId === courseOfferingId);
  }
  // Add more filters as needed (e.g., status)

  return NextResponse.json(filteredEnrollments);
}

// POST to create a new enrollment (student enrolls or requests enrollment)
export async function POST(request: NextRequest) {
  try {
    const enrollmentData = await request.json() as Omit<Enrollment, 'id' | 'createdAt' | 'updatedAt' | 'enrolledAt'>;

    if (!enrollmentData.studentId || !enrollmentData.courseOfferingId) {
      return NextResponse.json({ message: 'studentId and courseOfferingId are required.' }, { status: 400 });
    }

    // Validate studentId and courseOfferingId exist (simplified check)
    if (!studentsStore.some(s => s.id === enrollmentData.studentId)) {
        return NextResponse.json({ message: `Student with ID ${enrollmentData.studentId} not found.`}, { status: 404});
    }
    if (!courseOfferingsStore.some(co => co.id === enrollmentData.courseOfferingId)) {
        return NextResponse.json({ message: `Course Offering with ID ${enrollmentData.courseOfferingId} not found.`}, { status: 404});
    }

    // Prevent duplicate enrollments for the same student in the same course offering
    const existingEnrollment = enrollmentsStore.find(
      e => e.studentId === enrollmentData.studentId && e.courseOfferingId === enrollmentData.courseOfferingId
    );
    if (existingEnrollment) {
      return NextResponse.json({ message: 'Student is already enrolled or has requested enrollment for this course offering.' }, { status: 409 });
    }
    
    const currentTimestamp = new Date().toISOString();
    const newEnrollment: Enrollment = {
      id: generateId(),
      studentId: enrollmentData.studentId,
      courseOfferingId: enrollmentData.courseOfferingId,
      status: enrollmentData.status || 'requested', // Default to 'requested' or 'enrolled' based on system logic
      enrolledAt: enrollmentData.status === 'enrolled' ? currentTimestamp : undefined,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      // Optional fields based on what's sent from client initially
      internalMarks: enrollmentData.internalMarks,
      externalMarks: enrollmentData.externalMarks,
      grade: enrollmentData.grade,
      attendancePercentage: enrollmentData.attendancePercentage,
      completedAt: enrollmentData.completedAt,
    };

    enrollmentsStore.push(newEnrollment);
    global.__API_ENROLLMENTS_STORE__ = enrollmentsStore;

    return NextResponse.json(newEnrollment, { status: 201 });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json({ message: 'Error creating enrollment', error: (error as Error).message }, { status: 500 });
  }
}
