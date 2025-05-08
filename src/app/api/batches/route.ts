import { NextResponse, type NextRequest } from 'next/server';
import type { Batch } from '@/types/entities';

declare global {
  var __API_BATCHES_STORE__: Batch[] | undefined;
}

if (!global.__API_BATCHES_STORE__) {
  global.__API_BATCHES_STORE__ = [];
}
const batchesStore: Batch[] = global.__API_BATCHES_STORE__;

const generateId = (): string => `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  if (!Array.isArray(global.__API_BATCHES_STORE__)) {
      console.error("/api/batches GET: global.__API_BATCHES_STORE__ is not an array!", global.__API_BATCHES_STORE__);
      global.__API_BATCHES_STORE__ = []; 
      return NextResponse.json({ message: 'Internal server error: Batch data store corrupted.' }, { status: 500 });
  }
  return NextResponse.json(global.__API_BATCHES_STORE__);
}

export async function POST(request: NextRequest) {
  try {
    const batchData = await request.json() as Omit<Batch, 'id' | 'createdAt' | 'updatedAt'>;

    if (!batchData.name || !batchData.name.trim()) {
      return NextResponse.json({ message: 'Batch Name cannot be empty.' }, { status: 400 });
    }
    if (!batchData.programId) {
      return NextResponse.json({ message: 'Program ID is required.' }, { status: 400 });
    }
    if (isNaN(batchData.startAcademicYear) || batchData.startAcademicYear < 1900 || batchData.startAcademicYear > new Date().getFullYear() + 10) {
        return NextResponse.json({ message: 'Valid Start Academic Year is required.' }, { status: 400 });
    }
    if (batchData.endAcademicYear && (isNaN(batchData.endAcademicYear) || batchData.endAcademicYear < batchData.startAcademicYear || batchData.endAcademicYear > batchData.startAcademicYear + 10)) {
        return NextResponse.json({ message: 'Valid End Academic Year is required and must be after Start Academic Year.' }, { status: 400 });
    }
     if (global.__API_BATCHES_STORE__?.some(b => b.name.toLowerCase() === batchData.name.trim().toLowerCase() && b.programId === batchData.programId)) {
        return NextResponse.json({ message: `Batch with name '${batchData.name.trim()}' already exists for this program.` }, { status: 409 });
    }
    
    const now = new Date().toISOString();
    const newBatch: Batch = {
      id: generateId(),
      name: batchData.name.trim(),
      programId: batchData.programId,
      startAcademicYear: Number(batchData.startAcademicYear),
      endAcademicYear: batchData.endAcademicYear ? Number(batchData.endAcademicYear) : undefined,
      status: batchData.status || 'upcoming',
      maxIntake: batchData.maxIntake ? Number(batchData.maxIntake) : undefined,
      createdAt: now,
      updatedAt: now,
    };
    global.__API_BATCHES_STORE__?.push(newBatch);
    return NextResponse.json(newBatch, { status: 201 });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json({ message: 'Error creating batch', error: (error as Error).message }, { status: 500 });
  }
}