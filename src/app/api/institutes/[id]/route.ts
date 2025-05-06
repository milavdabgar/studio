
import { NextResponse, type NextRequest } from 'next/server';
import type { Institute } from '@/types/entities';

// This assumes the in-memory 'institutes' array is accessible here.
// In a real app, you'd import it or use a shared DB module.
// For simplicity, we'll redefine it here for this isolated API route example.
let institutesStore: Institute[] = (global as any).institutes || [
 { id: "inst1", name: "Government Polytechnic Palanpur", code: "GPP", address: "Jagana, Palanpur, Gujarat 385011", contactEmail: "gp-palanpur-dte@gujarat.gov.in", contactPhone: "02742-280126", website: "http://www.gppalanpur.ac.in", status: "active", establishmentYear: 1964 },
];
(global as any).institutes = institutesStore;


interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const institute = institutesStore.find(i => i.id === id);
  if (institute) {
    return NextResponse.json(institute);
  }
  return NextResponse.json({ message: 'Institute not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const instituteData = await request.json() as Partial<Omit<Institute, 'id'>>;
    const instituteIndex = institutesStore.findIndex(i => i.id === id);

    if (instituteIndex === -1) {
      return NextResponse.json({ message: 'Institute not found' }, { status: 404 });
    }

    // Basic validation for partial update
    if (instituteData.name === '') {
        return NextResponse.json({ message: 'Institute Name cannot be empty.' }, { status: 400 });
    }
    if (instituteData.code === '') {
        return NextResponse.json({ message: 'Institute Code cannot be empty.' }, { status: 400 });
    }
    if (instituteData.establishmentYear && (isNaN(instituteData.establishmentYear) || instituteData.establishmentYear < 1800 || instituteData.establishmentYear > new Date().getFullYear())) {
      return NextResponse.json({ message: 'Please enter a valid establishment year.' }, { status: 400 });
    }
    if (instituteData.contactEmail && !/\S+@\S+\.\S+/.test(instituteData.contactEmail)) {
        return NextResponse.json({ message: 'Please enter a valid contact email address.' }, { status: 400 });
    }


    institutesStore[instituteIndex] = { ...institutesStore[instituteIndex], ...instituteData };
    (global as any).institutes = institutesStore; // Update global store
    return NextResponse.json(institutesStore[instituteIndex]);
  } catch (error) {
    console.error(`Error updating institute ${id}:`, error);
    return NextResponse.json({ message: `Error updating institute ${id}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const initialLength = institutesStore.length;
  institutesStore = institutesStore.filter(i => i.id !== id);

  if (institutesStore.length === initialLength) {
    return NextResponse.json({ message: 'Institute not found' }, { status: 404 });
  }
  (global as any).institutes = institutesStore; // Update global store
  return NextResponse.json({ message: 'Institute deleted successfully' }, { status: 200 });
}
