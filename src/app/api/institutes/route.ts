
import { NextResponse, type NextRequest } from 'next/server';
import type { Institute } from '@/types/entities';
import { parse } from 'papaparse';

// In-memory store for institutes (replace with actual DB interaction)
let institutes: Institute[] = [
  { id: "inst1", name: "Government Polytechnic Palanpur", code: "GPP", address: "Jagana, Palanpur, Gujarat 385011", contactEmail: "gp-palanpur-dte@gujarat.gov.in", contactPhone: "02742-280126", website: "http://www.gppalanpur.ac.in", status: "active", establishmentYear: 1964 },
];
const generateClientId = (): string => `inst_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;


export async function GET() {
  return NextResponse.json(institutes);
}

export async function POST(request: NextRequest) {
  try {
    const instituteData = await request.json() as Omit<Institute, 'id'>;

    if (!instituteData.name || !instituteData.code) {
      return NextResponse.json({ message: 'Institute Name and Code are required.' }, { status: 400 });
    }
    if (instituteData.establishmentYear && (isNaN(instituteData.establishmentYear) || instituteData.establishmentYear < 1800 || instituteData.establishmentYear > new Date().getFullYear())) {
      return NextResponse.json({ message: 'Please enter a valid establishment year.' }, { status: 400 });
    }
    if (instituteData.contactEmail && !/\S+@\S+\.\S+/.test(instituteData.contactEmail)) {
        return NextResponse.json({ message: 'Please enter a valid contact email address.' }, { status: 400 });
    }
    
    const newInstitute: Institute = {
      id: generateClientId(),
      ...instituteData,
    };
    institutes.push(newInstitute);
    return NextResponse.json(newInstitute, { status: 201 });
  } catch (error) {
    console.error('Error creating institute:', error);
    return NextResponse.json({ message: 'Error creating institute' }, { status: 500 });
  }
}
