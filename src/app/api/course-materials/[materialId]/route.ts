// src/app/api/course-materials/[materialId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { CourseMaterial } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_COURSE_MATERIALS_STORE__: CourseMaterial[] | undefined;
}

if (!global.__API_COURSE_MATERIALS_STORE__) {
  global.__API_COURSE_MATERIALS_STORE__ = [];
}
let courseMaterialsStore: CourseMaterial[] = global.__API_COURSE_MATERIALS_STORE__;

interface RouteParams {
  params: {
    materialId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { materialId } = params;
  const material = courseMaterialsStore.find(m => m.id === materialId);
  if (material) {
    return NextResponse.json(material);
  }
  return NextResponse.json({ message: 'Course material not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { materialId } = params;
  try {
    const dataToUpdate = await request.json() as Partial<Omit<CourseMaterial, 'id' | 'courseOfferingId' | 'uploadedBy' | 'uploadedAt' | 'filePathOrUrl' | 'fileName' | 'fileSize'>>;
    const materialIndex = courseMaterialsStore.findIndex(m => m.id === materialId);

    if (materialIndex === -1) {
      return NextResponse.json({ message: 'Course material not found' }, { status: 404 });
    }
    
    const existingMaterial = courseMaterialsStore[materialIndex];

    if (dataToUpdate.title !== undefined && !dataToUpdate.title.trim()) {
        return NextResponse.json({ message: 'Title cannot be empty if provided.' }, { status: 400 });
    }

    const updatedMaterial: CourseMaterial = {
      ...existingMaterial,
      title: dataToUpdate.title?.trim() || existingMaterial.title,
      description: dataToUpdate.description !== undefined ? dataToUpdate.description.trim() || undefined : existingMaterial.description,
      fileType: dataToUpdate.fileType || existingMaterial.fileType, // Usually fileType might not be updatable post-creation
      updatedAt: new Date().toISOString(),
    };

    courseMaterialsStore[materialIndex] = updatedMaterial;
    global.__API_COURSE_MATERIALS_STORE__ = courseMaterialsStore;

    return NextResponse.json(updatedMaterial);
  } catch (error) {
    console.error(`Error updating course material ${materialId}:`, error);
    return NextResponse.json({ message: `Error updating course material ${materialId}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { materialId } = params;
  const initialLength = courseMaterialsStore.length;
  courseMaterialsStore = courseMaterialsStore.filter(m => m.id !== materialId);

  if (courseMaterialsStore.length === initialLength) {
    return NextResponse.json({ message: 'Course material not found' }, { status: 404 });
  }
  global.__API_COURSE_MATERIALS_STORE__ = courseMaterialsStore;
  // In a real app, also delete the associated file from storage here.
  return NextResponse.json({ message: 'Course material deleted successfully' });
}
