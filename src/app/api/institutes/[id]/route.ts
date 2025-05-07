
import { NextResponse, type NextRequest } from 'next/server';
import type { Institute } from '@/types/entities';

declare global {
  var __API_INSTITUTES_STORE__: Institute[] | undefined;
}
if (!global.__API_INSTITUTES_STORE__) {
  global.__API_INSTITUTES_STORE__ = [
    { id: "inst1", name: "Government Polytechnic Palanpur", code: "GPP", address: "Jagana, Palanpur, Gujarat 385011", contactEmail: "gp-palanpur-dte@gujarat.gov.in", contactPhone: "02742-280126", website: "http://www.gppalanpur.ac.in", status: "active", establishmentYear: 1964 },
  ];
}
let institutesStore: Institute[] = global.__API_INSTITUTES_STORE__;


interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_INSTITUTES_STORE__)) {
    global.__API_INSTITUTES_STORE__ = [];
    return NextResponse.json({ message: 'Institute data store corrupted.' }, { status: 500 });
  }
  const institute = global.__API_INSTITUTES_STORE__.find(i => i.id === id);
  if (institute) {
    return NextResponse.json(institute);
  }
  return NextResponse.json({ message: 'Institute not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_INSTITUTES_STORE__)) {
    global.__API_INSTITUTES_STORE__ = [];
    return NextResponse.json({ message: 'Institute data store corrupted.' }, { status: 500 });
  }
  try {
    const instituteData = await request.json() as Partial<Omit<Institute, 'id'>>;
    const instituteIndex = global.__API_INSTITUTES_STORE__.findIndex(i => i.id === id);

    if (instituteIndex === -1) {
      return NextResponse.json({ message: 'Institute not found' }, { status: 404 });
    }
    const existingInstitute = global.__API_INSTITUTES_STORE__[instituteIndex];

    if (instituteData.name !== undefined && !instituteData.name.trim()) {
        return NextResponse.json({ message: 'Institute Name cannot be empty.' }, { status: 400 });
    }
    if (instituteData.code !== undefined && !instituteData.code.trim()) {
        return NextResponse.json({ message: 'Institute Code cannot be empty.' }, { status: 400 });
    }
    if (instituteData.code && instituteData.code.trim().toUpperCase() !== existingInstitute.code.toUpperCase() && global.__API_INSTITUTES_STORE__.some(i => i.id !== id && i.code.toLowerCase() === instituteData.code!.trim().toLowerCase())) {
        return NextResponse.json({ message: `Institute with code '${instituteData.code.trim()}' already exists.` }, { status: 409 });
    }
    if (instituteData.establishmentYear && (isNaN(instituteData.establishmentYear) || instituteData.establishmentYear < 1800 || instituteData.establishmentYear > new Date().getFullYear())) {
      return NextResponse.json({ message: 'Please enter a valid establishment year.' }, { status: 400 });
    }
    if (instituteData.contactEmail && !/\S+@\S+\.\S+/.test(instituteData.contactEmail)) {
        return NextResponse.json({ message: 'Please enter a valid contact email address.' }, { status: 400 });
    }

    const updatedInstitute = { ...existingInstitute, ...instituteData };
    if (instituteData.code) updatedInstitute.code = instituteData.code.trim().toUpperCase();
    if (instituteData.name) updatedInstitute.name = instituteData.name.trim();
    if (instituteData.address !== undefined) updatedInstitute.address = instituteData.address.trim() || undefined;
    if (instituteData.contactEmail !== undefined) updatedInstitute.contactEmail = instituteData.contactEmail.trim() || undefined;
    if (instituteData.contactPhone !== undefined) updatedInstitute.contactPhone = instituteData.contactPhone.trim() || undefined;
    if (instituteData.website !== undefined) updatedInstitute.website = instituteData.website.trim() || undefined;


    global.__API_INSTITUTES_STORE__[instituteIndex] = updatedInstitute;
    institutesStore = global.__API_INSTITUTES_STORE__; 
    return NextResponse.json(updatedInstitute);
  } catch (error) {
    console.error(`Error updating institute ${id}:`, error);
    return NextResponse.json({ message: `Error updating institute ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_INSTITUTES_STORE__)) {
    global.__API_INSTITUTES_STORE__ = [];
    return NextResponse.json({ message: 'Institute data store corrupted.' }, { status: 500 });
  }
  const initialLength = global.__API_INSTITUTES_STORE__.length;
  const newStore = global.__API_INSTITUTES_STORE__.filter(i => i.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Institute not found' }, { status: 404 });
  }
  global.__API_INSTITUTES_STORE__ = newStore; 
  institutesStore = global.__API_INSTITUTES_STORE__;
  return NextResponse.json({ message: 'Institute deleted successfully' }, { status: 200 });
}
