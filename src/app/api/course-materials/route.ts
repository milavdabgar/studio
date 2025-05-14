// src/app/api/course-materials/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { CourseMaterial, CourseMaterialFileType } from '@/types/entities';
import { parseISO, isValid } from 'date-fns'; // For date validation if needed for uploadedAt

declare global {
  // eslint-disable-next-line no-var
  var __API_COURSE_MATERIALS_STORE__: CourseMaterial[] | undefined;
}

if (!global.__API_COURSE_MATERIALS_STORE__) {
  global.__API_COURSE_MATERIALS_STORE__ = [];
}
const courseMaterialsStore: CourseMaterial[] = global.__API_COURSE_MATERIALS_STORE__;

const generateId = (): string => `cmat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courseOfferingId = searchParams.get('courseOfferingId');

  if (!courseOfferingId) {
    return NextResponse.json({ message: 'courseOfferingId is required to fetch materials.' }, { status: 400 });
  }

  const materials = courseMaterialsStore.filter(m => m.courseOfferingId === courseOfferingId);
  return NextResponse.json(materials);
}

export async function POST(request: NextRequest) {
  try {
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
    const newMaterial: CourseMaterial = {
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

    courseMaterialsStore.push(newMaterial);
    global.__API_COURSE_MATERIALS_STORE__ = courseMaterialsStore;

    return NextResponse.json(newMaterial, { status: 201 });
  } catch (error) {
    console.error('Error creating course material:', error);
    return NextResponse.json({ message: 'Error creating course material', error: (error as Error).message }, { status: 500 });
  }
}
