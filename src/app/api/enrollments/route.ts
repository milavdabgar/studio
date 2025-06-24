import { NextResponse, type NextRequest } from 'next/server';
import type { Enrollment, EnrollmentStatus, Student, CourseOffering, Program, Department, Institute, User } from '@/types/entities';
import { notificationService } from '@/lib/api/notifications';
import { courseOfferingService } from '@/lib/api/courseOfferings';
import { courseService } from '@/lib/api/courses';
import { programService } from '@/lib/api/programs';
import { departmentService } from '@/lib/api/departments';
import { instituteService } from '@/lib/api/institutes';
import { studentService } from '@/lib/api/students';
import { userService } from '@/lib/api/users';


// Ensure the global store is initialized
declare global {
  // eslint-disable-next-line no-var
  var __API_ENROLLMENTS_STORE__: Enrollment[] | undefined;
  // eslint-disable-next-line no-var
  var __API_STUDENTS_STORE__: Student[] | undefined; 
  // eslint-disable-next-line no-var
  var __API_COURSE_OFFERINGS_STORE__: CourseOffering[] | undefined; 
  // eslint-disable-next-line no-var
  var __API_USERS_STORE__: User[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROGRAMS_STORE__: Program[] | undefined;
  // eslint-disable-next-line no-var
  var __API_DEPARTMENTS_STORE__: Department[] | undefined;
  // eslint-disable-next-line no-var
  var __API_INSTITUTES_STORE__: Institute[] | undefined;
  // eslint-disable-next-line no-var
  var __API_COURSES_STORE__: Course[] | undefined;
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
if (!global.__API_USERS_STORE__) {
  global.__API_USERS_STORE__ = [];
}
if (!global.__API_PROGRAMS_STORE__) {
  global.__API_PROGRAMS_STORE__ = [];
}
if (!global.__API_DEPARTMENTS_STORE__) {
  global.__API_DEPARTMENTS_STORE__ = [];
}
if (!global.__API_INSTITUTES_STORE__) {
  global.__API_INSTITUTES_STORE__ = [];
}
if (!global.__API_COURSES_STORE__) {
  global.__API_COURSES_STORE__ = [];
}


const enrollmentsStore: Enrollment[] = global.__API_ENROLLMENTS_STORE__;
const studentsStore: Student[] = global.__API_STUDENTS_STORE__;
const courseOfferingsStore: CourseOffering[] = global.__API_COURSE_OFFERINGS_STORE__;
const usersStore: User[] = global.__API_USERS_STORE__;
const programsStore: Program[] = global.__API_PROGRAMS_STORE__;
const departmentsStore: Department[] = global.__API_DEPARTMENTS_STORE__;
const institutesStore: Institute[] = global.__API_INSTITUTES_STORE__;
const coursesStore: Course[] = global.__API_COURSES_STORE__;


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

    const student = studentsStore.find(s => s.id === enrollmentData.studentId);
    const courseOffering = courseOfferingsStore.find(co => co.id === enrollmentData.courseOfferingId);

    if (!student) {
        return NextResponse.json({ message: `Student with ID ${enrollmentData.studentId} not found.`}, { status: 404});
    }
    if (!courseOffering) {
        return NextResponse.json({ message: `Course Offering with ID ${enrollmentData.courseOfferingId} not found.`}, { status: 404});
    }

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

    enrollmentsStore.push(newEnrollment);
    global.__API_ENROLLMENTS_STORE__ = enrollmentsStore;

    // --- Notification Trigger for Admin/HOD ---
    if (newEnrollment.status === 'requested') {
        const course = coursesStore.find(c => c.id === courseOffering.courseId);
        const program = programsStore.find(p => p.id === courseOffering.programId); // Assuming CO has programId
        const department = program ? departmentsStore.find(d => d.id === program.departmentId) : null;
        const institute = department ? institutesStore.find(i => i.id === department.instituteId) : null;

        const studentName = student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : student.enrollmentNumber;
        const courseNameText = course ? `${course.subjectName} (${course.subcode})` : `Course Offering ID: ${courseOffering.id}`;

        const adminUserIds: string[] = [];
        usersStore.forEach(user => {
            if (user.roles.includes('super_admin')) {
                adminUserIds.push(user.id);
            } else if (user.roles.includes('admin') && (!user.instituteId || user.instituteId === institute?.id)) {
                adminUserIds.push(user.id);
            } else if (user.roles.includes('hod') && department && user.departmentId === department.id) { // Assuming HOD has departmentId on User model
                adminUserIds.push(user.id);
            }
        });
        
        const uniqueAdminUserIds = [...new Set(adminUserIds)];

        for (const adminUserId of uniqueAdminUserIds) {
            try {
                await notificationService.createNotification({
                    userId: adminUserId,
                    message: `New enrollment request from ${studentName} for ${courseNameText}.`,
                    type: 'enrollment_request',
                    link: `/admin/enrollments?courseOfferingId=${courseOffering.id}&status=requested`,
                });
            } catch (notifError) {
                console.error("Failed to create enrollment request notification:", notifError);
            }
        }
    }
    // --- End Notification Trigger ---

    return NextResponse.json(newEnrollment, { status: 201 });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json({ message: 'Error creating enrollment', error: (error as Error).message }, { status: 500 });
  }
}