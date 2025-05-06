
import { NextResponse, type NextRequest } from 'next/server';
import type { Institute } from '@/types/entities';
import { parse } from 'papaparse';

// This assumes the in-memory 'institutes' array and 'generateClientId' are accessible here.
// In a real app, you'd import them or use a shared DB module.
// For simplicity, we'll redefine them here for this isolated API route example.
let institutesStore: Institute[] = (global as any).institutes || [
  { id: "inst1", name: "Government Polytechnic Palanpur", code: "GPP", address: "Jagana, Palanpur, Gujarat 385011", contactEmail: "gp-palanpur-dte@gujarat.gov.in", contactPhone: "02742-280126", website: "http://www.gppalanpur.ac.in", status: "active", establishmentYear: 1964 },
];
(global as any).institutes = institutesStore;

const generateClientIdForImport = (): string => `inst_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }

    const fileText = await file.text();

    const { data: parsedData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors:', parseErrors);
      return NextResponse.json({ message: 'Error parsing CSV file.', errors: parseErrors }, { status: 400 });
    }
    
    const header = Object.keys(parsedData[0] || {}).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
    const expectedHeaders = ['id', 'name', 'code', 'address', 'contactemail', 'contactphone', 'website', 'status', 'establishmentyear'];
    const requiredHeaders = ['name', 'code', 'status'];

    if (!requiredHeaders.every(rh => header.includes(rh))) {
        const missing = requiredHeaders.filter(rh => !header.includes(rh));
        return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;

    parsedData.forEach((row: any) => {
      const name = row.name?.trim();
      const code = row.code?.trim().toUpperCase();
      const status = row.status?.trim() as 'active' | 'inactive';

      if (!name || !code || !['active', 'inactive'].includes(status)) {
        console.warn(`Skipping row: Missing or invalid required data (name, code, status). Row: ${JSON.stringify(row)}`);
        return;
      }
      
      const estYearStr = row.establishmentYear?.trim();
      const establishmentYear = estYearStr && !isNaN(parseInt(estYearStr)) ? parseInt(estYearStr) : undefined;

      const instituteData: Omit<Institute, 'id'> = {
        name,
        code,
        status,
        address: row.address?.trim() || undefined,
        contactEmail: row.contactEmail?.trim() || undefined,
        contactPhone: row.contactPhone?.trim() || undefined,
        website: row.website?.trim() || undefined,
        establishmentYear,
      };

      const idFromCsv = row.id?.trim();
      let existingInstitute = null;
      if(idFromCsv) {
        existingInstitute = institutesStore.find(i => i.id === idFromCsv);
      } else { // if no id in csv, try to find by code
        existingInstitute = institutesStore.find(i => i.code === code);
      }


      if (existingInstitute) {
        Object.assign(existingInstitute, instituteData);
        updatedCount++;
      } else {
        const newInstitute: Institute = {
          id: idFromCsv || generateClientIdForImport(),
          ...instituteData,
        };
        institutesStore.push(newInstitute);
        newCount++;
      }
    });

    (global as any).institutes = institutesStore; // Update global store

    return NextResponse.json({ message: 'Institutes imported successfully.', newCount, updatedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing institutes:', error);
    return NextResponse.json({ message: 'Error importing institutes.', error: (error as Error).message }, { status: 500 });
  }
}
