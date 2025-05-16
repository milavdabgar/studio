
import { NextResponse, type NextRequest } from 'next/server';
import type { CourseOffering, Course, Program, Batch, Enrollment, Faculty } from '@/types/entities';

// Assume these global stores are populated as in other API routes
declare global {
  // eslint-disable-next-line no-var
  var __API_COURSE_OFFERINGS_STORE__: CourseOffering[] | undefined;
  // eslint-disable-next-line no-var
  var __API_COURSES_STORE__: Course[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROGRAMS_STORE__: Program[] | undefined;
  // eslint-disable-next-line no-var
  var __API_BATCHES_STORE__: Batch[] | undefined;
  // eslint-disable-next-line no-var
  var __API_ENROLLMENTS_STORE__: Enrollment[] | undefined;
  // eslint-disable-next-line no-var
  var __API_FACULTY_STORE__: Faculty[] | undefined;

}

const ensureStore = (storeName: string, defaultData: any[] = []) => {
  if (!global[storeName as keyof typeof global] || !Array.isArray(global[storeName as keyof typeof global])) {
    console.warn(`${storeName} API Store was not an array or undefined. Initializing.`);
    global[storeName as keyof typeof global] = [...defaultData] as any;
  }
};

ensureStore('__API_COURSE_OFFERINGS_STORE__');
ensureStore('__API_COURSES_STORE__');
ensureStore('__API_PROGRAMS_STORE__');
ensureStore('__API_BATCHES_STORE__');
ensureStore('__API_ENROLLMENTS_STORE__');
ensureStore('__API_FACULTY_STORE__');


export async function GET(request: NextRequest) {
  try {
    const courseOfferingsStore: CourseOffering[] = global.__API_COURSE_OFFERINGS_STORE__!;
    const coursesStore: Course[] = global.__API_COURSES_STORE__!;
    const programsStore: Program[] = global.__API_PROGRAMS_STORE__!;
    const batchesStore: Batch[] = global.__API_BATCHES_STORE__!;
    const enrollmentsStore: Enrollment[] = global.__API_ENROLLMENTS_STORE__!;
    const facultyStore: Faculty[] = global.__API_FACULTY_STORE__!;


    const { searchParams } = new URL(request.url);
    const filterProgramId = searchParams.get('programId');
    const filterBatchId = searchParams.get('batchId');
    const filterAcademicYear = searchParams.get('academicYear');
    const filterSemesterStr = searchParams.get('semester');
    const filterSemester = filterSemesterStr ? parseInt(filterSemesterStr) : undefined;

    let filteredCourseOfferings = [...courseOfferingsStore];

    if (filterProgramId && filterProgramId !== 'all') {
        filteredCourseOfferings = filteredCourseOfferings.filter(co => co.programId === filterProgramId);
    }
    if (filterBatchId && filterBatchId !== 'all') {
        filteredCourseOfferings = filteredCourseOfferings.filter(co => co.batchId === filterBatchId);
    }
    if (filterAcademicYear) {
        filteredCourseOfferings = filteredCourseOfferings.filter(co => co.academicYear === filterAcademicYear);
    }
    if (filterSemester !== undefined) {
        filteredCourseOfferings = filteredCourseOfferings.filter(co => co.semester === filterSemester);
    }


    const reportData = filteredCourseOfferings.map(co => {
      const course = coursesStore.find(c => c.id === co.courseId);
      const batch = batchesStore.find(b => b.id === co.batchId);
      const program = programsStore.find(p => p.id === (batch?.programId || co.programId)); // Fallback to co.programId
      const enrolledStudents = enrollmentsStore.filter(e => e.courseOfferingId === co.id && e.status === 'enrolled').length;
      const facultyNames = co.facultyIds.map(fid => facultyStore.find(f => f.id === fid)?.displayName || 'Unknown Faculty').filter(Boolean);

      return {
        courseOfferingId: co.id,
        courseName: course?.subjectName || 'Unknown Course',
        courseCode: course?.subcode || 'N/A',
        programName: program?.name || 'Unknown Program',
        batchName: batch?.name || 'N/A',
        semester: co.semester,
        academicYear: co.academicYear,
        facultyNames,
        enrolledStudents,
        maxIntake: batch?.maxIntake,
      };
    });

    return NextResponse.json({ data: reportData });
  } catch (error) {
    console.error("Error generating course enrollment report:", error);
    return NextResponse.json({ message: "Error generating course enrollment report", error: (error as Error).message }, { status: 500 });
  }
}
