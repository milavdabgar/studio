import { NextResponse, type NextRequest } from 'next/server';
import type { Course } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { CourseModel } from '@/lib/models';

const generateId = (): string => `course_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  try {
    await connectMongoose();
    const courses = await CourseModel.find();
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ message: 'Error fetching courses', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    const courseData = await request.json() as Omit<Course, 'id' | 'createdAt' | 'updatedAt'>;

    // Validate required fields
    if (!courseData.subcode || !courseData.subcode.trim()) {
      return NextResponse.json({ message: 'Subject code cannot be empty.' }, { status: 400 });
    }
    if (!courseData.subjectName || !courseData.subjectName.trim()) {
      return NextResponse.json({ message: 'Subject name cannot be empty.' }, { status: 400 });
    }
    if (!courseData.departmentId) {
      return NextResponse.json({ message: 'Department ID is required.' }, { status: 400 });
    }
    if (!courseData.programId) {
      return NextResponse.json({ message: 'Program ID is required.' }, { status: 400 });
    }
    if (!courseData.semester || courseData.semester < 1) {
      return NextResponse.json({ message: 'Valid semester is required.' }, { status: 400 });
    }
    if (!courseData.category || !courseData.category.trim()) {
      return NextResponse.json({ message: 'Course category is required.' }, { status: 400 });
    }
    
    // Check for duplicate course code within the program
    const existingCourse = await CourseModel.findOne({ 
      subcode: { $regex: new RegExp(`^${courseData.subcode.trim()}$`, 'i') },
      programId: courseData.programId 
    });
    
    if (existingCourse) {
      return NextResponse.json({ message: `Course with code '${courseData.subcode.trim()}' already exists for this program.` }, { status: 409 });
    }
    
    // Validate numeric fields
    if (courseData.lectureHours < 0 || courseData.tutorialHours < 0 || courseData.practicalHours < 0) {
      return NextResponse.json({ message: 'Hours cannot be negative.' }, { status: 400 });
    }
    if (courseData.credits <= 0) {
      return NextResponse.json({ message: 'Credits must be greater than 0.' }, { status: 400 });
    }
    
    const newCourse = new CourseModel({
      subcode: courseData.subcode.trim().toUpperCase(),
      subjectName: courseData.subjectName.trim(),
      departmentId: courseData.departmentId,
      programId: courseData.programId,
      semester: Number(courseData.semester),
      lectureHours: Number(courseData.lectureHours || 0),
      tutorialHours: Number(courseData.tutorialHours || 0),
      practicalHours: Number(courseData.practicalHours || 0),
      credits: Number(courseData.credits),
      theoryEseMarks: Number(courseData.theoryEseMarks || 0),
      theoryPaMarks: Number(courseData.theoryPaMarks || 0),
      practicalEseMarks: Number(courseData.practicalEseMarks || 0),
      practicalPaMarks: Number(courseData.practicalPaMarks || 0),
      totalMarks: Number(courseData.totalMarks || 0),
      isElective: Boolean(courseData.isElective),
      isTheory: Boolean(courseData.isTheory ?? true),
      theoryExamDuration: courseData.theoryExamDuration?.trim() || undefined,
      isPractical: Boolean(courseData.isPractical),
      practicalExamDuration: courseData.practicalExamDuration?.trim() || undefined,
      isFunctional: Boolean(courseData.isFunctional ?? true),
      category: courseData.category.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    const savedCourse = await newCourse.save();
    return NextResponse.json(savedCourse, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ message: 'Error creating course', error: (error as Error).message }, { status: 500 });
  }
}
