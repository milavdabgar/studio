
import { NextResponse, type NextRequest } from 'next/server';
import type { Course } from '@/types/entities';

let coursesStore: Course[] = (global as any).coursesStore || [];
if (!(global as any).coursesStore) {
  (global as any).coursesStore = coursesStore;
}

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const course = coursesStore.find(c => c.id === id);
  if (course) {
    return NextResponse.json(course);
  }
  return NextResponse.json({ message: 'Course not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const courseData = await request.json() as Partial<Omit<Course, 'id'>>;
    const courseIndex = coursesStore.findIndex(c => c.id === id);

    if (courseIndex === -1) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }
    const existingCourse = coursesStore[courseIndex];

    // Basic validation for partial update
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
    if (courseData.subcode && courseData.subcode.trim().toUpperCase() !== existingCourse.subcode.toUpperCase() && coursesStore.some(c => c.id !== id && c.programId === (courseData.programId || existingCourse.programId) && c.subcode.toLowerCase() === courseData.subcode!.trim().toLowerCase())) {
        return NextResponse.json({ message: `Course with subcode '${courseData.subcode.trim()}' already exists for this program.` }, { status: 409 });
    }

    const updatedCourse = { ...existingCourse, ...courseData };
    if(courseData.subcode) updatedCourse.subcode = courseData.subcode.trim().toUpperCase();
    if(courseData.subjectName) updatedCourse.subjectName = courseData.subjectName.trim();
    
    // Recalculate credits and totalMarks if relevant fields are updated
    const l = courseData.lectureHours !== undefined ? Number(courseData.lectureHours) : existingCourse.lectureHours;
    const t = courseData.tutorialHours !== undefined ? Number(courseData.tutorialHours) : existingCourse.tutorialHours;
    const p = courseData.practicalHours !== undefined ? Number(courseData.practicalHours) : existingCourse.practicalHours;
    updatedCourse.credits = l + t + p;

    const te = courseData.theoryEseMarks !== undefined ? Number(courseData.theoryEseMarks) : existingCourse.theoryEseMarks;
    const tm = courseData.theoryPaMarks !== undefined ? Number(courseData.theoryPaMarks) : existingCourse.theoryPaMarks;
    const pe = courseData.practicalEseMarks !== undefined ? Number(courseData.practicalEseMarks) : existingCourse.practicalEseMarks;
    const pm = courseData.practicalPaMarks !== undefined ? Number(courseData.practicalPaMarks) : existingCourse.practicalPaMarks;
    updatedCourse.totalMarks = te + tm + pe + pm;


    coursesStore[courseIndex] = updatedCourse;
    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error(`Error updating course ${id}:`, error);
    return NextResponse.json({ message: `Error updating course ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const initialLength = coursesStore.length;
  coursesStore = coursesStore.filter(c => c.id !== id);

  if (coursesStore.length === initialLength) {
    return NextResponse.json({ message: 'Course not found' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Course deleted successfully' }, { status: 200 });
}
