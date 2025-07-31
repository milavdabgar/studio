import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { AcademicTermModel, CurriculumModel, CourseModel, BatchModel, ProgramModel } from '@/lib/models';

// GET /api/courses/by-term?termId=xxx&programId=xxx&semester=xxx - Get courses filtered by academic term, program, and semester
export async function GET(request: NextRequest) {
  try {
    await connectMongoose();

    const { searchParams } = new URL(request.url);
    const termId = searchParams.get('termId');
    const programId = searchParams.get('programId');
    const semester = searchParams.get('semester');

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
      semesters: academicTerm.semesters,
      dateEntries: academicTerm.dateEntries
    });

    // Handle both new dateEntries format and legacy format
    let allProgramIds: string[] = [];
    let allSemesters: number[] = [];
    let programs: any[] = [];

    if (academicTerm.dateEntries && academicTerm.dateEntries.length > 0) {
      // New format: use dateEntries
      console.log('Using new dateEntries format');
      for (const entry of academicTerm.dateEntries) {
        allProgramIds.push(...entry.programs);
        allSemesters.push(...entry.semesters);
      }
      // Remove duplicates
      allProgramIds = [...new Set(allProgramIds)];
      allSemesters = [...new Set(allSemesters)];
    } else if (academicTerm.programId && academicTerm.semesters && academicTerm.semesters.length > 0) {
      // Legacy format: use programId and semesters
      console.log('Using legacy format');
      allProgramIds = [academicTerm.programId];
      allSemesters = academicTerm.semesters;
    } else {
      return NextResponse.json({ error: 'Academic term has no program assignments' }, { status: 400 });
    }

    console.log('All program IDs:', allProgramIds);
    console.log('All semesters:', allSemesters);

    // If specific program and semester are requested, filter to only those
    if (programId && semester) {
      const semesterNum = parseInt(semester);
      if (!allProgramIds.includes(programId)) {
        return NextResponse.json({ error: 'Requested program is not available in this academic term' }, { status: 400 });
      }
      if (!allSemesters.includes(semesterNum)) {
        return NextResponse.json({ error: 'Requested semester is not available in this academic term' }, { status: 400 });
      }
      // Filter to only the requested program and semester
      allProgramIds = [programId];
      allSemesters = [semesterNum];
    }

    // Get all programs
    for (const targetProgramId of allProgramIds) {
      let program = await ProgramModel.findOne({ id: targetProgramId });
      if (!program) {
        program = await ProgramModel.findById(targetProgramId);
      }
      if (program) {
        programs.push(program);
      }
    }

    if (programs.length === 0) {
      return NextResponse.json({ error: 'No programs found for this term' }, { status: 404 });
    }

    console.log('Programs found:', programs.map(p => ({ id: p.id, name: p.name, code: p.code })));

    // Determine curriculum version based on term semesters
    // Semesters 1,2,3 use 5G curriculum, semesters 4,5,6 use 4G curriculum
    const hasSemester123 = allSemesters.some((sem: number) => [1, 2, 3].includes(sem));
    const hasSemester456 = allSemesters.some((sem: number) => [4, 5, 6].includes(sem));
    
    let courses: any[] = [];
    let termInfo = {
      name: academicTerm.name,
      term: academicTerm.term,
      semesters: allSemesters,
      academicYear: academicTerm.academicYear,
      programs: programs.map(p => ({
        id: p.id || p._id?.toString() || p.code, // Use id, _id, or fallback to code
        name: p.name,
        code: p.code
      }))
    };

    // Process each program for courses
    for (const program of programs) {
      const programId = program.id || program._id.toString();

      // If term has semesters 1-3, get 5G curriculum courses
      if (hasSemester123) {
        const curriculum5G = await CurriculumModel.findOne({
          programId: programId,
          version: '5G'
        });

        if (curriculum5G) {
          console.log(`Found 5G curriculum for program ${program.name}:`, curriculum5G.name);
          for (const semester of allSemesters.filter((s: number) => [1, 2, 3].includes(s))) {
            const eligibleCourseIds = curriculum5G.courses
              .filter((c: any) => c.isActive && c.semester === semester)
              .map((c: any) => c.courseId);

            console.log(`Program ${program.name} - Semester ${semester} eligible course IDs:`, eligibleCourseIds);

            const semesterCourses = await CourseModel.find({
              id: { $in: eligibleCourseIds }
            }).sort({ semester: 1, subjectName: 1 });

            console.log(`Program ${program.name} - Found ${semesterCourses.length} courses for semester ${semester}`);
            courses.push(...semesterCourses);
          }
        } else {
          console.log(`No 5G curriculum found for program: ${program.name} (${programId})`);
        }
      }

      // If term has semesters 4-6, get 4G curriculum courses
      if (hasSemester456) {
        const curriculum4G = await CurriculumModel.findOne({
          programId: programId,
          version: '4G'
        });

        if (curriculum4G) {
          console.log(`Found 4G curriculum for program ${program.name}:`, curriculum4G.name);
          for (const semester of allSemesters.filter((s: number) => [4, 5, 6].includes(s))) {
            const eligibleCourseIds = curriculum4G.courses
              .filter((c: any) => c.isActive && c.semester === semester)
              .map((c: any) => c.courseId);

            console.log(`Program ${program.name} - Semester ${semester} eligible course IDs:`, eligibleCourseIds);

            const semesterCourses = await CourseModel.find({
              id: { $in: eligibleCourseIds }
            }).sort({ semester: 1, subjectName: 1 });

            console.log(`Program ${program.name} - Found ${semesterCourses.length} courses for semester ${semester}`);
            courses.push(...semesterCourses);
          }
        } else {
          console.log(`No 4G curriculum found for program: ${program.name} (${programId})`);
        }
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