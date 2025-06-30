// src/app/api/course-materials/[materialId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { CourseMaterial } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { CourseMaterialModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    materialId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { materialId } = await params;
    
    const material = await CourseMaterialModel.findOne({ id: materialId }).lean();
    if (material) {
      // Format material to ensure proper id field
      const materialWithId = {
        ...material,
        id: material.id || (material as any)._id.toString()
      };
      return NextResponse.json(materialWithId);
    }
    return NextResponse.json({ message: 'Course material not found' }, { status: 404 });
  } catch (error) {
    console.error(`Error fetching course material ${materialId}:`, error);
    return NextResponse.json({ message: `Error fetching course material ${materialId}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { materialId } = await params;
    
    const dataToUpdate = await request.json() as Partial<Omit<CourseMaterial, 'id' | 'courseOfferingId' | 'uploadedBy' | 'uploadedAt' | 'filePathOrUrl' | 'fileName' | 'fileSize'>>;
    
    if (dataToUpdate.title !== undefined && !dataToUpdate.title.trim()) {
        return NextResponse.json({ message: 'Title cannot be empty if provided.' }, { status: 400 });
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };
    
    if (dataToUpdate.title !== undefined) {
      updateData.title = dataToUpdate.title.trim();
    }
    if (dataToUpdate.description !== undefined) {
      updateData.description = dataToUpdate.description.trim() || undefined;
    }
    if (dataToUpdate.fileType !== undefined) {
      updateData.fileType = dataToUpdate.fileType;
    }

    const updatedMaterial = await CourseMaterialModel.findOneAndUpdate(
      { id: materialId },
      updateData,
      { new: true, lean: true }
    );

    if (!updatedMaterial) {
      return NextResponse.json({ message: 'Course material not found' }, { status: 404 });
    }

    // Format material to ensure proper id field
    const materialWithId = {
      ...updatedMaterial,
      id: updatedMaterial.id || (updatedMaterial as any)._id.toString()
    };

    return NextResponse.json(materialWithId);
  } catch (error) {
    console.error(`Error updating course material ${materialId}:`, error);
    return NextResponse.json({ message: `Error updating course material ${materialId}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { materialId } = await params;
    
    const deletedMaterial = await CourseMaterialModel.findOneAndDelete({ id: materialId });
    
    if (!deletedMaterial) {
      return NextResponse.json({ message: 'Course material not found' }, { status: 404 });
    }
    
    // In a real app, also delete the associated file from storage here.
    return NextResponse.json({ message: 'Course material deleted successfully' });
  } catch (error) {
    console.error(`Error deleting course material ${materialId}:`, error);
    return NextResponse.json({ message: `Error deleting course material ${materialId}`, error: (error as Error).message }, { status: 500 });
  }
}
