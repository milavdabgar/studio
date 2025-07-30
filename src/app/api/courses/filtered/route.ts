import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { CourseModel, BatchModel, CurriculumModel, ProgramModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const semester = searchParams.get('semester');
    const academicYear = searchParams.get('academicYear');

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    // Get batch details to determine program
    // Try both custom id field and MongoDB ObjectId
    let batch = await BatchModel.findOne({ id: batchId });
    if (!batch) {
      // If not found by custom id, try MongoDB ObjectId
      batch = await BatchModel.findById(batchId);
    }
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Simple curriculum-based logic:
    // Semesters 1,2,3 use 5G curriculum
    // Semesters 4,5,6 use 4G curriculum
    const semesterNum = semester ? parseInt(semester) : 1;
    const curriculumVersion = semesterNum <= 3 ? '5G' : '4G';

    // Find the appropriate curriculum for this program and version
    const curriculum = await CurriculumModel.findOne({
      programId: batch.programId,
      version: curriculumVersion
    });

    if (!curriculum) {
      return NextResponse.json({
        success: true,
        data: {
          courses: [],
          groupedCourses: {},
          batchInfo: {
            id: batch.id,
            name: batch.name,
            programId: batch.programId,
            startAcademicYear: batch.startAcademicYear,
            endAcademicYear: batch.endAcademicYear
          }
        }
      });
    }

    // Get course IDs from curriculum for the specific semester
    let eligibleCourseIds = curriculum.courses
      .filter((c: any) => c.isActive && c.semester === semesterNum)
      .map((c: any) => c.courseId);


    // Get the actual course details
    let courses = await CourseModel.find({
      id: { $in: eligibleCourseIds }
    }).sort({ semester: 1, subjectName: 1 });

    // Group courses by type and semester for better UX
    const groupedCourses = courses.reduce((acc, course) => {
      const semester = course.semester;
      const type = course.isElective ? 'elective' : 'core';
      
      if (!acc[semester]) {
        acc[semester] = { core: [], elective: [] };
      }
      
      acc[semester][type].push({
        id: course.id,
        subjectName: course.subjectName,
        subcode: course.subcode,
        credits: course.credits,
        semester: course.semester,
        isElective: course.isElective,
        departmentId: course.departmentId
      });
      
      return acc;
    }, {} as Record<number, { core: any[], elective: any[] }>);

    return NextResponse.json({
      success: true,
      data: {
        courses,
        groupedCourses,
        batchInfo: {
          id: batch.id,
          name: batch.name,
          programId: batch.programId,
          startAcademicYear: batch.startAcademicYear,
          endAcademicYear: batch.endAcademicYear
        }
      }
    });
  } catch (error) {
    console.error('Error fetching filtered courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filtered courses' },
      { status: 500 }
    );
  }
}