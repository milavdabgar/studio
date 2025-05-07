
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
const institutesStore: Institute[] = global.__API_INSTITUTES_STORE__;

const generateClientId = (): string => `inst_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;


export async function GET() {
  if (!Array.isArray(global.__API_INSTITUTES_STORE__)) {
      console.error("/api/institutes GET: global.__API_INSTITUTES_STORE__ is not an array!", global.__API_INSTITUTES_STORE__);
      global.__API_INSTITUTES_STORE__ = []; 
      return NextResponse.json({ message: 'Internal server error: Institute data store corrupted.' }, { status: 500 });
  }
  return NextResponse.json(global.__API_INSTITUTES_STORE__);
}

export async function POST(request: NextRequest) {
  try {
    const instituteData = await request.json() as Omit<Institute, 'id'>;

    if (!instituteData.name || !instituteData.name.trim() || !instituteData.code || !instituteData.code.trim()) {
      return NextResponse.json({ message: 'Institute Name and Code are required.' }, { status: 400 });
    }
    if (instituteData.establishmentYear && (isNaN(instituteData.establishmentYear) || instituteData.establishmentYear < 1800 || instituteData.establishmentYear > new Date().getFullYear())) {
      return NextResponse.json({ message: 'Please enter a valid establishment year.' }, { status: 400 });
    }
    if (instituteData.contactEmail && !/\S+@\S+\.\S+/.test(instituteData.contactEmail)) {
        return NextResponse.json({ message: 'Please enter a valid contact email address.' }, { status: 400 });
    }
    if (global.__API_INSTITUTES_STORE__?.some(i => i.code.toLowerCase() === instituteData.code.trim().toLowerCase())) {
        return NextResponse.json({ message: `Institute with code '${instituteData.code.trim()}' already exists.` }, { status: 409 });
    }
    
    const newInstitute: Institute = {
      id: generateClientId(),
      name: instituteData.name.trim(),
      code: instituteData.code.trim().toUpperCase(),
      address: instituteData.address?.trim() || undefined,
      contactEmail: instituteData.contactEmail?.trim() || undefined,
      contactPhone: instituteData.contactPhone?.trim() || undefined,
      website: instituteData.website?.trim() || undefined,
      status: instituteData.status || 'active',
      establishmentYear: instituteData.establishmentYear ? Number(instituteData.establishmentYear) : undefined,
    };
    global.__API_INSTITUTES_STORE__?.push(newInstitute);
    return NextResponse.json(newInstitute, { status: 201 });
  } catch (error) {
    console.error('Error creating institute:', error);
    return NextResponse.json({ message: 'Error creating institute', error: (error as Error).message }, { status: 500 });
  }
}
