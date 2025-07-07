// src/app/api/course-materials/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { CourseMaterial, CourseMaterialFileType } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { CourseMaterialModel } from '@/lib/models';

const generateId = (): string => `cmat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const courseOfferingId = searchParams.get('courseOfferingId');

    if (!courseOfferingId) {
      return NextResponse.json({ message: 'courseOfferingId is required to fetch materials.' }, { status: 400 });
    }

    const materials = await CourseMaterialModel.find({ courseOfferingId }).lean();
    
    // Format materials to ensure proper id field
    const materialsWithId = materials.map(material => ({
      ...material,
      id: material.id || (material as unknown as { _id: { toString(): string } })._id.toString()
    }));

    return NextResponse.json(materialsWithId);
  } catch (error) {
    console.error('Error in GET /api/course-materials:', error);
    return NextResponse.json({ message: 'Internal server error processing course materials request.', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const courseOfferingId = formData.get('courseOfferingId') as string;
    const description = formData.get('description') as string | undefined;
    const fileType = formData.get('fileType') as CourseMaterialFileType;
    const file = formData.get('file') as File | null;
    const linkUrl = formData.get('linkUrl') as string | undefined; // For 'link' type

    if (!title || !courseOfferingId || !fileType) {
      return NextResponse.json({ message: 'Title, courseOfferingId, and fileType are required.' }, { status: 400 });
    }

    let filePathOrUrl: string;
    let fileName: string | undefined;
    let fileSize: number | undefined;

    if (fileType === 'link') {
      if (!linkUrl || !/^https?:\/\//.test(linkUrl)) {
        return NextResponse.json({ message: 'A valid URL is required for link type materials.' }, { status: 400 });
      }
      filePathOrUrl = linkUrl;
    } else {
      if (!file) {
        return NextResponse.json({ message: 'A file is required for non-link type materials.' }, { status: 400 });
      }
      // In a real app, upload file to storage (e.g., Firebase Storage, S3) and get URL/path
      // For this mock, we'll just use the file name as a placeholder for the path.
      filePathOrUrl = `uploads/course_materials/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      fileName = file.name;
      fileSize = file.size;
      console.log(`Mock uploading file: ${fileName} to ${filePathOrUrl}`);
    }
    
    const currentTimestamp = new Date().toISOString();
    const newMaterialData: Partial<CourseMaterial> = {
      id: generateId(),
      courseOfferingId,
      title: title.trim(),
      description: description?.trim() || undefined,
      fileType,
      filePathOrUrl,
      fileName,
      fileSize,
      uploadedBy: "faculty_user_placeholder", // TODO: Get actual logged-in faculty ID
      uploadedAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };

    const newMaterial = new CourseMaterialModel(newMaterialData);
    await newMaterial.save();

    return NextResponse.json(newMaterial.toJSON(), { status: 201 });
  } catch (error) {
    console.error('Error creating course material:', error);
    return NextResponse.json({ message: 'Error creating course material', error: (error as Error).message }, { status: 500 });
  }
}
