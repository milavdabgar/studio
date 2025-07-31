import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { AcademicTermModel, CurriculumModel, CourseModel, BatchModel, ProgramModel } from '@/lib/models';

// GET /api/courses/by-term?termId=xxx - Get courses filtered by academic term
export async function GET(request: NextRequest) {
  try {
    await connectMongoose();

    const { searchParams } = new URL(request.url);
    const termId = searchParams.get('termId');

    if (!termId) {
      return NextResponse.json({ error: 'termId parameter is required' }, { status: 400 });
    }

    // Get the academic term (try both custom id and _id)
    let academicTerm = await AcademicTermModel.findOne({ id: termId });
    if (!academicTerm) {
      academicTerm = await AcademicTermModel.findById(termId);
    }
    if (!academicTerm) {
      return NextResponse.json({ error: 'Academic term not found' }, { status: 404 });
    }

    console.log('Academic Term found:', {
      id: academicTerm.id,
      name: academicTerm.name,
      programId: academicTerm.programId,
      semesters: academicTerm.semesters
    });

    // Get the program (try both custom id and _id)
    let program = await ProgramModel.findOne({ id: academicTerm.programId });
    if (!program) {
      program = await ProgramModel.findById(academicTerm.programId);
    }
    if (!program) {
      return NextResponse.json({ error: 'Program not found for this term' }, { status: 404 });
    }

    console.log('Program found:', {
      id: program.id,
      name: program.name,
      code: program.code
    });

    // Determine curriculum version based on term semesters
    // Semesters 1,2,3 use 5G curriculum, semesters 4,5,6 use 4G curriculum
    const hasSemester123 = academicTerm.semesters.some((sem: number) => [1, 2, 3].includes(sem));
    const hasSemester456 = academicTerm.semesters.some((sem: number) => [4, 5, 6].includes(sem));
    
    let courses: any[] = [];
    let termInfo = {
      name: academicTerm.name,
      term: academicTerm.term,
      semesters: academicTerm.semesters,
      academicYear: academicTerm.academicYear,
      program: {
        id: program.id,
        name: program.name,
        code: program.code
      }
    };

    // If term has semesters 1-3, get 5G curriculum courses
    if (hasSemester123) {
      const curriculum5G = await CurriculumModel.findOne({
        programId: academicTerm.programId,
        version: '5G'
      });

      if (curriculum5G) {
        console.log('Found 5G curriculum:', curriculum5G.name);
        for (const semester of academicTerm.semesters.filter((s: number) => [1, 2, 3].includes(s))) {
          const eligibleCourseIds = curriculum5G.courses
            .filter((c: any) => c.isActive && c.semester === semester)
            .map((c: any) => c.courseId);

          console.log(`Semester ${semester} eligible course IDs:`, eligibleCourseIds);

          const semesterCourses = await CourseModel.find({
            id: { $in: eligibleCourseIds }
          }).sort({ semester: 1, subjectName: 1 });

          console.log(`Found ${semesterCourses.length} courses for semester ${semester}`);
          courses.push(...semesterCourses);
        }
      } else {
        console.log('No 5G curriculum found for program:', academicTerm.programId);
      }
    }

    // If term has semesters 4-6, get 4G curriculum courses
    if (hasSemester456) {
      const curriculum4G = await CurriculumModel.findOne({
        programId: academicTerm.programId,
        version: '4G'
      });

      if (curriculum4G) {
        console.log('Found 4G curriculum:', curriculum4G.name);
        for (const semester of academicTerm.semesters.filter((s: number) => [4, 5, 6].includes(s))) {
          const eligibleCourseIds = curriculum4G.courses
            .filter((c: any) => c.isActive && c.semester === semester)
            .map((c: any) => c.courseId);

          console.log(`Semester ${semester} eligible course IDs:`, eligibleCourseIds);

          const semesterCourses = await CourseModel.find({
            id: { $in: eligibleCourseIds }
          }).sort({ semester: 1, subjectName: 1 });

          console.log(`Found ${semesterCourses.length} courses for semester ${semester}`);
          courses.push(...semesterCourses);
        }
      } else {
        console.log('No 4G curriculum found for program:', academicTerm.programId);
      }
    }

    // Remove duplicates and group by semester and elective status
    const uniqueCourses = courses.filter((course, index, self) => 
      self.findIndex(c => c.id === course.id) === index
    );

    const groupedCourses: any = {};
    uniqueCourses.forEach(course => {
      if (!groupedCourses[course.semester]) {
        groupedCourses[course.semester] = { core: [], elective: [] };
      }
      
      const courseInfo = {
        id: course.id,
        subjectName: course.subjectName,
        subcode: course.subcode,
        credits: course.credits,
        semester: course.semester,
        isElective: course.isElective,
        departmentId: course.departmentId
      };

      if (course.isElective) {
        groupedCourses[course.semester].elective.push(courseInfo);
      } else {
        groupedCourses[course.semester].core.push(courseInfo);
      }
    });

    console.log(`Final result: ${uniqueCourses.length} unique courses found`);

    return NextResponse.json({
      success: true,
      data: {
        courses: uniqueCourses,
        groupedCourses,
        termInfo
      }
    });

  } catch (error) {
    console.error('Error fetching courses by term:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses for this term' },
      { status: 500 }
    );
  }
}