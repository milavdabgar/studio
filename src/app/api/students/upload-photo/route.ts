import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { StudentModel } from '@/lib/models';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File;
    const studentId = formData.get('studentId') as string;

    if (!file || !studentId) {
      return NextResponse.json({ error: 'Missing file or student ID' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 });
    }

    // Connect to database
    await connectMongoose();

    // Check if student exists using custom id field
    let student = await StudentModel.findOne({ id: studentId });
    if (!student && studentId.match(/^[0-9a-fA-F]{24}$/)) {
      // Fallback to MongoDB _id if it's a valid ObjectId
      student = await StudentModel.findById(studentId);
    }
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Create unique filename
    const fileExtension = path.extname(file.name);
    const fileName = `${studentId}-${Date.now()}${fileExtension}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'photos');
    const filePath = path.join(uploadsDir, fileName);

    // Ensure upload directory exists
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate public URL
    const photoURL = `/uploads/photos/${fileName}`;

    // Update student record with photo URL
    await StudentModel.findOneAndUpdate({ id: studentId }, { photoURL });

    return NextResponse.json({ 
      message: 'Photo uploaded successfully',
      photoURL
    });

  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}