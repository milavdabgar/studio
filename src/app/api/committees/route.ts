
import { NextResponse, type NextRequest } from 'next/server';
import type { Committee } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';

declare global {
  var __API_COMMITTEES_STORE__: Committee[] | undefined;
}

if (!global.__API_COMMITTEES_STORE__) {
  global.__API_COMMITTEES_STORE__ = [];
}
const committeesStore: Committee[] = global.__API_COMMITTEES_STORE__;

const generateId = (): string => `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  if (!Array.isArray(global.__API_COMMITTEES_STORE__)) {
    console.error("/api/committees GET: global.__API_COMMITTEES_STORE__ is not an array!");
    global.__API_COMMITTEES_STORE__ = [];
    return NextResponse.json({ message: 'Internal server error: Committee data store corrupted.' }, { status: 500 });
  }
  return NextResponse.json(global.__API_COMMITTEES_STORE__);
}

export async function POST(request: NextRequest) {
  try {
    const committeeData = await request.json() as Omit<Committee, 'id' | 'createdAt' | 'updatedAt'>;

    if (!committeeData.name || !committeeData.name.trim()) {
      return NextResponse.json({ message: 'Committee Name is required.' }, { status: 400 });
    }
    if (!committeeData.purpose || !committeeData.purpose.trim()) {
      return NextResponse.json({ message: 'Committee Purpose is required.' }, { status: 400 });
    }
    if (!committeeData.instituteId) {
      return NextResponse.json({ message: 'Institute ID is required.' }, { status: 400 });
    }
    if (!committeeData.formationDate || !isValid(parseISO(committeeData.formationDate))) {
        return NextResponse.json({ message: 'Valid Formation Date is required (YYYY-MM-DD).' }, { status: 400 });
    }
    if (committeeData.dissolutionDate && !isValid(parseISO(committeeData.dissolutionDate))) {
        return NextResponse.json({ message: 'Valid Dissolution Date is required (YYYY-MM-DD) if provided.' }, { status: 400 });
    }
    if (committeesStore.some(c => c.name.toLowerCase() === committeeData.name.trim().toLowerCase() && c.instituteId === committeeData.instituteId)) {
      return NextResponse.json({ message: `Committee with name '${committeeData.name.trim()}' already exists for this institute.` }, { status: 409 });
    }

    const now = new Date().toISOString();
    const newCommittee: Committee = {
      id: generateId(),
      name: committeeData.name.trim(),
      description: committeeData.description?.trim() || undefined,
      purpose: committeeData.purpose.trim(),
      instituteId: committeeData.instituteId,
      formationDate: committeeData.formationDate, // Already validated as ISO string
      dissolutionDate: committeeData.dissolutionDate || undefined,
      status: committeeData.status || 'active',
      createdAt: now,
      updatedAt: now,
    };
    committeesStore.push(newCommittee);
    global.__API_COMMITTEES_STORE__ = committeesStore;
    return NextResponse.json(newCommittee, { status: 201 });
  } catch (error) {
    console.error('Error creating committee:', error);
    return NextResponse.json({ message: 'Error creating committee', error: (error as Error).message }, { status: 500 });
  }
}
