
import { NextResponse, type NextRequest } from 'next/server';
import type { Course } from '@/types/entities';

declare global {
  var __API_COURSES_STORE__: Course[] | undefined;
}
if (!global.__API_COURSES_STORE__) {
  global.__API_COURSES_STORE__ = [];
}
let coursesStore: Course[] = global.__API_COURSES_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_COURSES_STORE__)) {
    global.__API_COURSES_STORE__ = [];
    return NextResponse.json({ message: 'Course data store corrupted.' }, { status: 500 });
  }
  const course = global.__API_COURSES_STORE__.find(c => c.id === id);
  if (course) {
    return NextResponse.json(course);
  }
  return NextResponse.json({ message: 'Course not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_COURSES_STORE__)) {
    global.__API_COURSES_STORE__ = [];
    return NextResponse.json({ message: 'Course data store corrupted.' }, { status: 500 });
  }
  try {
    const courseData = await request.json() as Partial<Omit<Course, 'id'>>;
    const courseIndex = global.__API_COURSES_STORE__.findIndex(c => c.id === id);

    if (courseIndex === -1) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }
    const existingCourse = global.__API_COURSES_STORE__[courseIndex];

    if (courseData.subcode !== undefined && !courseData.subcode.trim()) {
        return NextResponse.json({ message: 'Subject Code cannot be empty.' }, { status: 400 });
    }
    if (courseData.subjectName !== undefined && !courseData.subjectName.trim()) {
        return NextResponse.json({ message: 'Subject Name cannot be empty.' }, { status: 400 });
    }
    if (courseData.departmentId !== undefined && !courseData.departmentId) {
      return NextResponse.json({ message: 'Department ID is required.' }, { status: 400 });
    }
     if (courseData.programId !== undefined && !courseData.programId) {
      return NextResponse.json({ message: 'Program ID is required.' }, { status: 400 });
    }
    if (courseData.semester !== undefined && (isNaN(courseData.semester) || courseData.semester <= 0)) {
        return NextResponse.json({ message: 'Semester must be a positive number.' }, { status: 400 });
    }
    if (courseData.subcode && courseData.subcode.trim().toUpperCase() !== existingCourse.subcode.toUpperCase() && global.__API_COURSES_STORE__.some(c => c.id !== id && c.programId === (courseData.programId || existingCourse.programId) && c.subcode.toLowerCase() === courseData.subcode!.trim().toLowerCase())) {
        return NextResponse.json({ message: `Course with subcode '${courseData.subcode.trim()}' already exists for this program.` }, { status: 409 });
    }

    const updatedCourse = { ...existingCourse, ...courseData };
    if(courseData.subcode) updatedCourse.subcode = courseData.subcode.trim().toUpperCase();
    if(courseData.subjectName) updatedCourse.subjectName = courseData.subjectName.trim();
    
    const l = courseData.lectureHours !== undefined ? Number(courseData.lectureHours) : existingCourse.lectureHours;
    const t = courseData.tutorialHours !== undefined ? Number(courseData.tutorialHours) : existingCourse.tutorialHours;
    const p = courseData.practicalHours !== undefined ? Number(courseData.practicalHours) : existingCourse.practicalHours;
    updatedCourse.credits = l + t + p;

    const te = courseData.theoryEseMarks !== undefined ? Number(courseData.theoryEseMarks) : existingCourse.theoryEseMarks;
    const tm = courseData.theoryPaMarks !== undefined ? Number(courseData.theoryPaMarks) : existingCourse.theoryPaMarks;
    const pe = courseData.practicalEseMarks !== undefined ? Number(courseData.practicalEseMarks) : existingCourse.practicalEseMarks;
    const pm = courseData.practicalPaMarks !== undefined ? Number(courseData.practicalPaMarks) : existingCourse.practicalPaMarks;
    updatedCourse.totalMarks = te + tm + pe + pm;


    global.__API_COURSES_STORE__[courseIndex] = updatedCourse;
    coursesStore = global.__API_COURSES_STORE__;
    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error(`Error updating course ${id}:`, error);
    return NextResponse.json({ message: `Error updating course ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_COURSES_STORE__)) {
    global.__API_COURSES_STORE__ = [];
    return NextResponse.json({ message: 'Course data store corrupted.' }, { status: 500 });
  }
  const initialLength = global.__API_COURSES_STORE__.length;
  const newStore = global.__API_COURSES_STORE__.filter(c => c.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Course not found' }, { status: 404 });
  }
  global.__API_COURSES_STORE__ = newStore;
  coursesStore = global.__API_COURSES_STORE__;
  return NextResponse.json({ message: 'Course deleted successfully' }, { status: 200 });
}
