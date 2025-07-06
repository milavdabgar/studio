
import { NextResponse, type NextRequest } from 'next/server';
import type { Course } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_COURSES_STORE__: Course[] | undefined;
}

const now = new Date().toISOString();

if (!global.__API_COURSES_STORE__ || global.__API_COURSES_STORE__.length === 0) {
  global.__API_COURSES_STORE__ = [
    { 
      id: "course_cs101_dce_gpp", 
      subcode: "CS101", 
      subjectName: "Introduction to Programming", 
      departmentId: "dept_ce_gpp", 
      programId: "prog_dce_gpp", 
      semester: 1, 
      lectureHours: 3, tutorialHours: 1, practicalHours: 2, credits: 6,
      theoryEseMarks: 70, theoryPaMarks: 30, practicalEseMarks: 25, practicalPaMarks: 25, totalMarks: 150,
      isElective: false, isTheory: true, theoryExamDuration: "2.5 Hrs", isPractical: true, practicalExamDuration: "2 Hrs", isFunctional: true,
      createdAt: now, updatedAt: now, category: "Program Core"
    },
    { 
      id: "course_me101_dme_gpp", 
      subcode: "ME101", 
      subjectName: "Basic Mechanical Engineering", 
      departmentId: "dept_me_gpp", 
      programId: "prog_dme_gpp", 
      semester: 1, 
      lectureHours: 4, tutorialHours: 0, practicalHours: 0, credits: 4,
      theoryEseMarks: 100, theoryPaMarks: 0, practicalEseMarks: 0, practicalPaMarks: 0, totalMarks: 100,
      isElective: false, isTheory: true, theoryExamDuration: "3 Hrs", isPractical: false, isFunctional: true,
      createdAt: now, updatedAt: now, category: "Program Core"
    },
    { 
      id: "course_math1_gen_gpp", 
      subcode: "MA101", 
      subjectName: "Mathematics-I", 
      departmentId: "dept_gen_gpp", 
      programId: "prog_dce_gpp", // Example: common for DCE
      semester: 1, 
      lectureHours: 3, tutorialHours: 1, practicalHours: 0, credits: 4,
      theoryEseMarks: 70, theoryPaMarks: 30, practicalEseMarks: 0, practicalPaMarks: 0, totalMarks: 100,
      isElective: false, isTheory: true, theoryExamDuration: "2.5 Hrs", isPractical: false, isFunctional: true,
      createdAt: now, updatedAt: now, category: "Basic Science"
    },
    { 
      id: "course_eng_gen_gpp", 
      subcode: "HU101", 
      subjectName: "Communication Skills in English", 
      departmentId: "dept_gen_gpp", 
      programId: "prog_dme_gpp", // Example: common for DME
      semester: 1, 
      lectureHours: 2, tutorialHours: 0, practicalHours: 2, credits: 4,
      theoryEseMarks: 50, theoryPaMarks: 25, practicalEseMarks: 25, practicalPaMarks: 0, totalMarks: 100,
      isElective: false, isTheory: true, isPractical: true, isFunctional: true,
      createdAt: now, updatedAt: now, category: "Humanities"
    },
  ];
}

const generateId = (): string => `crs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  if (!Array.isArray(global.__API_COURSES_STORE__)) {
      console.error("/api/courses GET: global.__API_COURSES_STORE__ is not an array!", global.__API_COURSES_STORE__);
      global.__API_COURSES_STORE__ = []; 
      return NextResponse.json({ message: 'Internal server error: Course data store corrupted.' }, { status: 500 });
  }
  return NextResponse.json(global.__API_COURSES_STORE__);
}

export async function POST(request: NextRequest) {
  try {
    const courseData = await request.json() as Omit<Course, 'id' | 'createdAt' | 'updatedAt'>;

    if (!courseData.subcode || !courseData.subcode.trim()) {
      return NextResponse.json({ message: 'Subject Code cannot be empty.' }, { status: 400 });
    }
    if (!courseData.subjectName || !courseData.subjectName.trim()) {
      return NextResponse.json({ message: 'Subject Name cannot be empty.' }, { status: 400 });
    }
    if (!courseData.departmentId) {
      return NextResponse.json({ message: 'Department ID is required.' }, { status: 400 });
    }
    if (!courseData.programId) {
      return NextResponse.json({ message: 'Program ID is required.' }, { status: 400 });
    }
    if (courseData.semester === undefined || courseData.semester <= 0) {
        return NextResponse.json({ message: 'Semester must be a positive number.' }, { status: 400 });
    }
    if (global.__API_COURSES_STORE__?.some(c => c.subcode.toLowerCase() === courseData.subcode.trim().toLowerCase() && c.programId === courseData.programId)) {
        return NextResponse.json({ message: `Course with subcode '${courseData.subcode.trim()}' already exists for this program.` }, { status: 409 });
    }

    const currentTimestamp = new Date().toISOString();
    const newCourse: Course = {
      id: generateId(),
      subcode: courseData.subcode.trim().toUpperCase(),
      branchCode: courseData.branchCode?.trim() || undefined,
      effFrom: courseData.effFrom?.trim() || undefined,
      subjectName: courseData.subjectName.trim(),
      category: courseData.category?.trim() || undefined,
      semester: Number(courseData.semester),
      lectureHours: Number(courseData.lectureHours) || 0,
      tutorialHours: Number(courseData.tutorialHours) || 0,
      practicalHours: Number(courseData.practicalHours) || 0,
      credits: (Number(courseData.lectureHours) || 0) + (Number(courseData.tutorialHours) || 0) + (Number(courseData.practicalHours) || 0),
      theoryEseMarks: Number(courseData.theoryEseMarks) || 0,
      theoryPaMarks: Number(courseData.theoryPaMarks) || 0,
      practicalEseMarks: Number(courseData.practicalEseMarks) || 0,
      practicalPaMarks: Number(courseData.practicalPaMarks) || 0,
      totalMarks: (Number(courseData.theoryEseMarks) || 0) + (Number(courseData.theoryPaMarks) || 0) + (Number(courseData.practicalEseMarks) || 0) + (Number(courseData.practicalPaMarks) || 0),
      isElective: courseData.isElective || false,
      isTheory: courseData.isTheory === undefined ? true : courseData.isTheory,
      theoryExamDuration: courseData.theoryExamDuration?.trim() || undefined,
      isPractical: courseData.isPractical || false,
      practicalExamDuration: courseData.practicalExamDuration?.trim() || undefined,
      isFunctional: courseData.isFunctional === undefined ? true : courseData.isFunctional,
      isSemiPractical: courseData.isSemiPractical || false,
      remarks: courseData.remarks?.trim() || undefined,
      departmentId: courseData.departmentId,
      programId: courseData.programId,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    global.__API_COURSES_STORE__?.push(newCourse);
    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ message: 'Error creating course', error: (error as Error).message }, { status: 500 });
  }
}
