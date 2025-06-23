
import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { CourseModel } from '@/lib/models';
import type { Course } from '@/types/entities';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const course = await CourseModel.findById(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }
    
    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    const courseData = await request.json() as Partial<Omit<Course, 'id'>>;
    
    // Validation
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
    
    // Check for duplicate subcode within the same program
    if (courseData.subcode && courseData.programId) {
      const existingCourse = await CourseModel.findOne({
        subcode: courseData.subcode.trim().toUpperCase(),
        programId: courseData.programId,
        _id: { $ne: id }
      });
      
      if (existingCourse) {
        return NextResponse.json({ 
          message: `Course with subcode '${courseData.subcode.trim()}' already exists for this program.` 
        }, { status: 409 });
      }
    }
    
    // Process data before update
    const updateData = { ...courseData };
    if (courseData.subcode) {
      updateData.subcode = courseData.subcode.trim().toUpperCase();
    }
    if (courseData.subjectName) {
      updateData.subjectName = courseData.subjectName.trim();
    }
    
    // Calculate credits and total marks if relevant fields are provided
    const existingCourse = await CourseModel.findById(id);
    if (existingCourse) {
      const l = courseData.lectureHours !== undefined ? Number(courseData.lectureHours) : existingCourse.lectureHours;
      const t = courseData.tutorialHours !== undefined ? Number(courseData.tutorialHours) : existingCourse.tutorialHours;
      const p = courseData.practicalHours !== undefined ? Number(courseData.practicalHours) : existingCourse.practicalHours;
      updateData.credits = l + t + p;

      const te = courseData.theoryEseMarks !== undefined ? Number(courseData.theoryEseMarks) : existingCourse.theoryEseMarks;
      const tm = courseData.theoryPaMarks !== undefined ? Number(courseData.theoryPaMarks) : existingCourse.theoryPaMarks;
      const pe = courseData.practicalEseMarks !== undefined ? Number(courseData.practicalEseMarks) : existingCourse.practicalEseMarks;
      const pm = courseData.practicalPaMarks !== undefined ? Number(courseData.practicalPaMarks) : existingCourse.practicalPaMarks;
      updateData.totalMarks = te + tm + pe + pm;
    }
    
    // Update timestamp
    updateData.updatedAt = new Date().toISOString();
    
    const updatedCourse = await CourseModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedCourse) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const deletedCourse = await CourseModel.findByIdAndDelete(id);
    if (!deletedCourse) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
