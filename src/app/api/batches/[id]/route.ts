import { NextResponse, type NextRequest } from 'next/server';
import type { Batch } from '@/types/entities';

declare global {
  var __API_BATCHES_STORE__: Batch[] | undefined;
}
if (!global.__API_BATCHES_STORE__) {
  global.__API_BATCHES_STORE__ = [];
}
let batchesStore: Batch[] = global.__API_BATCHES_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_BATCHES_STORE__)) {
    global.__API_BATCHES_STORE__ = [];
    return NextResponse.json({ message: 'Batch data store corrupted.' }, { status: 500 });
  }
  const batch = global.__API_BATCHES_STORE__.find(b => b.id === id);
  if (batch) {
    return NextResponse.json(batch);
  }
  return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_BATCHES_STORE__)) {
    global.__API_BATCHES_STORE__ = [];
    return NextResponse.json({ message: 'Batch data store corrupted.' }, { status: 500 });
  }
  try {
    const batchDataToUpdate = await request.json() as Partial<Omit<Batch, 'id' | 'createdAt' | 'updatedAt'>>;
    const batchIndex = global.__API_BATCHES_STORE__.findIndex(b => b.id === id);

    if (batchIndex === -1) {
      return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
    }

    const existingBatch = global.__API_BATCHES_STORE__[batchIndex];

    if (batchDataToUpdate.name !== undefined && !batchDataToUpdate.name.trim()) {
        return NextResponse.json({ message: 'Batch Name cannot be empty.' }, { status: 400 });
    }
    if (batchDataToUpdate.programId !== undefined && !batchDataToUpdate.programId) {
        return NextResponse.json({ message: 'Program ID cannot be empty if provided for update.' }, { status: 400 });
    }
    if (batchDataToUpdate.startAcademicYear && (isNaN(batchDataToUpdate.startAcademicYear) || batchDataToUpdate.startAcademicYear < 1900 || batchDataToUpdate.startAcademicYear > new Date().getFullYear() + 10)) {
        return NextResponse.json({ message: 'Valid Start Academic Year is required.' }, { status: 400 });
    }
    const startYear = batchDataToUpdate.startAcademicYear || existingBatch.startAcademicYear;
    if (batchDataToUpdate.endAcademicYear && (isNaN(batchDataToUpdate.endAcademicYear) || batchDataToUpdate.endAcademicYear < startYear || batchDataToUpdate.endAcademicYear > startYear + 10)) {
        return NextResponse.json({ message: 'Valid End Academic Year is required and must be after Start Academic Year.' }, { status: 400 });
    }

    if (batchDataToUpdate.name && batchDataToUpdate.name.trim().toLowerCase() !== existingBatch.name.toLowerCase() && 
        global.__API_BATCHES_STORE__.some(b => b.id !== id && b.name.toLowerCase() === batchDataToUpdate.name!.trim().toLowerCase() && b.programId === (batchDataToUpdate.programId || existingBatch.programId))) {
        return NextResponse.json({ message: `Batch with name '${batchDataToUpdate.name.trim()}' already exists for this program.` }, { status: 409 });
    }

    const updatedBatch: Batch = { 
        ...existingBatch, 
        ...batchDataToUpdate,
        updatedAt: new Date().toISOString(),
    };
    if(batchDataToUpdate.name) updatedBatch.name = batchDataToUpdate.name.trim();


    global.__API_BATCHES_STORE__[batchIndex] = updatedBatch;
    batchesStore = global.__API_BATCHES_STORE__;
    return NextResponse.json(updatedBatch);
  } catch (error) {
    console.error(`Error updating batch ${id}:`, error);
    return NextResponse.json({ message: `Error updating batch ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_BATCHES_STORE__)) {
    global.__API_BATCHES_STORE__ = [];
    return NextResponse.json({ message: 'Batch data store corrupted.' }, { status: 500 });
  }
  const initialLength = global.__API_BATCHES_STORE__.length;
  const newStore = global.__API_BATCHES_STORE__.filter(b => b.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
  }
  
  global.__API_BATCHES_STORE__ = newStore;
  batchesStore = global.__API_BATCHES_STORE__;
  return NextResponse.json({ message: 'Batch deleted successfully' }, { status: 200 });
}