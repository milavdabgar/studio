
import { NextResponse, type NextRequest } from 'next/server';
import type { CourseOffering, Course, Program, Batch, Enrollment, Faculty } from '@/types/entities';
import { CourseOfferingModel, CourseModel, ProgramModel, BatchModel, EnrollmentModel, FacultyModel } from '@/lib/models';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
    
    // Fetch data from MongoDB
    const courseOfferingsStore = await CourseOfferingModel.find({}).lean() as unknown as CourseOffering[];
    const coursesStore = await CourseModel.find({}).lean() as unknown as Course[];
    const programsStore = await ProgramModel.find({}).lean() as unknown as Program[];
    const batchesStore = await BatchModel.find({}).lean() as unknown as Batch[];
    const enrollmentsStore = await EnrollmentModel.find({}).lean() as unknown as Enrollment[];
    const facultyStore = await FacultyModel.find({}).lean() as unknown as Faculty[];


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
      const facultyNames = (co.facultyIds || []).map(fid => {
        const faculty = facultyStore.find(f => f.id === fid);
        return faculty ? (faculty as Faculty & { name?: string; displayName?: string }).name || (faculty as Faculty & { name?: string; displayName?: string }).displayName || 'Unknown Faculty' : 'Unknown Faculty';
      }).filter(Boolean);

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
    return NextResponse.json({ message: "Error generating course enrollment report" }, { status: 500 });
  }
}
