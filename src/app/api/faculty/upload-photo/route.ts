import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { connectMongoose } from '@/lib/mongodb';
import { FacultyModel } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const formData = await request.formData();
    const file = formData.get('photo') as File;
    const facultyId = formData.get('facultyId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 });
    }

    // Verify faculty exists - search by custom id field, not MongoDB ObjectId
    const faculty = await FacultyModel.findOne({ id: facultyId });
    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'faculty');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const fileName = `${facultyId}-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate public URL
    const photoURL = `/uploads/faculty/${fileName}`;

    // Update faculty record with new photo URL - use custom id field for query
    await FacultyModel.findOneAndUpdate(
      { id: facultyId },
      {
        photoURL,
        updatedAt: new Date().toISOString()
      }
    );

    console.log(`[Faculty Photo Upload] Successfully uploaded photo for faculty ${facultyId}: ${photoURL}`);

    return NextResponse.json({ 
      success: true, 
      photoURL,
      message: 'Photo uploaded successfully' 
    });

  } catch (error) {
    console.error('Error uploading faculty photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' }, 
      { status: 500 }
    );
  }
}