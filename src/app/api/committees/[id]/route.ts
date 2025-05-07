
import { NextResponse, type NextRequest } from 'next/server';
import type { Committee } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';

declare global {
  var __API_COMMITTEES_STORE__: Committee[] | undefined;
}

if (!global.__API_COMMITTEES_STORE__) {
  global.__API_COMMITTEES_STORE__ = [];
}
let committeesStore: Committee[] = global.__API_COMMITTEES_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_COMMITTEES_STORE__)) {
    global.__API_COMMITTEES_STORE__ = [];
    return NextResponse.json({ message: 'Committee data store corrupted.' }, { status: 500 });
  }
  const committee = committeesStore.find(c => c.id === id);
  if (committee) {
    return NextResponse.json(committee);
  }
  return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_COMMITTEES_STORE__)) {
    global.__API_COMMITTEES_STORE__ = [];
    return NextResponse.json({ message: 'Committee data store corrupted.' }, { status: 500 });
  }
  try {
    const committeeData = await request.json() as Partial<Omit<Committee, 'id' | 'createdAt' | 'updatedAt'>>;
    const committeeIndex = committeesStore.findIndex(c => c.id === id);

    if (committeeIndex === -1) {
      return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
    }
    const existingCommittee = committeesStore[committeeIndex];

    if (committeeData.name !== undefined && !committeeData.name.trim()) {
      return NextResponse.json({ message: 'Committee Name cannot be empty.' }, { status: 400 });
    }
    if (committeeData.purpose !== undefined && !committeeData.purpose.trim()) {
      return NextResponse.json({ message: 'Committee Purpose cannot be empty.' }, { status: 400 });
    }
     if (committeeData.instituteId !== undefined && !committeeData.instituteId) {
      return NextResponse.json({ message: 'Institute ID cannot be empty if provided for update.' }, { status: 400 });
    }
    if (committeeData.formationDate && !isValid(parseISO(committeeData.formationDate))) {
        return NextResponse.json({ message: 'Valid Formation Date is required (YYYY-MM-DD).' }, { status: 400 });
    }
    if (committeeData.dissolutionDate && committeeData.dissolutionDate !== null && !isValid(parseISO(committeeData.dissolutionDate))) {
        return NextResponse.json({ message: 'Valid Dissolution Date is required (YYYY-MM-DD) if provided.' }, { status: 400 });
    }
    if (committeeData.name && committeeData.name.trim().toLowerCase() !== existingCommittee.name.toLowerCase() && 
        committeesStore.some(c => c.id !== id && c.name.toLowerCase() === committeeData.name!.trim().toLowerCase() && c.instituteId === (committeeData.instituteId || existingCommittee.instituteId))) {
      return NextResponse.json({ message: `Committee with name '${committeeData.name.trim()}' already exists for this institute.` }, { status: 409 });
    }

    const updatedCommittee = { 
      ...existingCommittee, 
      ...committeeData,
      name: committeeData.name ? committeeData.name.trim() : existingCommittee.name,
      description: committeeData.description !== undefined ? committeeData.description.trim() || undefined : existingCommittee.description,
      purpose: committeeData.purpose ? committeeData.purpose.trim() : existingCommittee.purpose,
      dissolutionDate: committeeData.dissolutionDate === null ? undefined : committeeData.dissolutionDate || existingCommittee.dissolutionDate, // Allow clearing dissolutionDate
      updatedAt: new Date().toISOString(),
    };

    committeesStore[committeeIndex] = updatedCommittee;
    global.__API_COMMITTEES_STORE__ = committeesStore;
    return NextResponse.json(updatedCommittee);
  } catch (error) {
    console.error(`Error updating committee ${id}:`, error);
    return NextResponse.json({ message: `Error updating committee ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_COMMITTEES_STORE__)) {
    global.__API_COMMITTEES_STORE__ = [];
    return NextResponse.json({ message: 'Committee data store corrupted.' }, { status: 500 });
  }
  const initialLength = committeesStore.length;
  const newStore = committeesStore.filter(c => c.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
  }
  global.__API_COMMITTEES_STORE__ = newStore;
  committeesStore = global.__API_COMMITTEES_STORE__;
  return NextResponse.json({ message: 'Committee deleted successfully' }, { status: 200 });
}
