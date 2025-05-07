
import { NextResponse, type NextRequest } from 'next/server';
import type { Institute } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';

// This assumes the in-memory 'institutes' array and 'generateClientId' are accessible here.
// In a real app, you'd import them or use a shared DB module.
// For simplicity, we'll redefine them here for this isolated API route example.
let institutesStore: Institute[] = (global as any).__API_INSTITUTES_STORE__ || [
  { id: "inst1", name: "Government Polytechnic Palanpur", code: "GPP", address: "Jagana, Palanpur, Gujarat 385011", contactEmail: "gp-palanpur-dte@gujarat.gov.in", contactPhone: "02742-280126", website: "http://www.gppalanpur.ac.in", status: "active", establishmentYear: 1964 },
];
(global as any).__API_INSTITUTES_STORE__ = institutesStore;

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
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, ''),
      dynamicTyping: true,
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors (Institute Import):', JSON.stringify(parseErrors, null, 2));
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Institutes CSV file. Please check the file format and content.', errors: errorMessages }, { status: 400 });
    }
    
    const header = Object.keys(parsedData[0] || {}).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
    // const expectedHeaders = ['id', 'name', 'code', 'address', 'contactemail', 'contactphone', 'website', 'status', 'establishmentyear'];
    const requiredHeaders = ['name', 'code', 'status'];

    if (!requiredHeaders.every(rh => header.includes(rh))) {
        const missing = requiredHeaders.filter(rh => !header.includes(rh));
        return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    parsedData.forEach((row: any) => {
      const name = row.name?.toString().trim();
      const code = row.code?.toString().trim().toUpperCase();
      const status = row.status?.toString().trim().toLowerCase() as 'active' | 'inactive';

      if (!name || !code || !['active', 'inactive'].includes(status)) {
        console.warn(`Skipping institute row: Missing or invalid required data (name, code, status). Row: ${JSON.stringify(row)}`);
        skippedCount++;
        return;
      }
      
      const establishmentYear = row.establishmentyear !== undefined && row.establishmentyear !== null && !isNaN(Number(row.establishmentyear)) ? Number(row.establishmentyear) : undefined;
      if (establishmentYear && (establishmentYear < 1800 || establishmentYear > new Date().getFullYear())) {
        console.warn(`Skipping institute row for ${name}: Invalid establishment year ${establishmentYear}.`);
        skippedCount++;
        return;
      }

      const instituteData: Omit<Institute, 'id'> = {
        name,
        code,
        status,
        address: row.address?.toString().trim() || undefined,
        contactEmail: row.contactemail?.toString().trim() || undefined,
        contactPhone: row.contactphone?.toString().trim() || undefined,
        website: row.website?.toString().trim() || undefined,
        establishmentYear,
      };

      const idFromCsv = row.id?.toString().trim();
      let existingInstituteIndex = -1;

      if(idFromCsv) {
        existingInstituteIndex = institutesStore.findIndex(i => i.id === idFromCsv);
      } else { 
        existingInstituteIndex = institutesStore.findIndex(i => i.code === code);
      }


      if (existingInstituteIndex !== -1) {
        // If code is changing, ensure new code doesn't conflict
        if (code !== institutesStore[existingInstituteIndex].code && institutesStore.some(i => i.id !== institutesStore[existingInstituteIndex].id && i.code === code)) {
          console.warn(`Skipping update for institute ${institutesStore[existingInstituteIndex].name}: New code ${code} from CSV conflicts with another existing institute.`);
          skippedCount++;
          return;
        }
        institutesStore[existingInstituteIndex] = { ...institutesStore[existingInstituteIndex], ...instituteData };
        updatedCount++;
      } else {
        // For new institutes, ensure code is unique
        if (institutesStore.some(i => i.code === code)) {
          console.warn(`Skipping new institute ${name}: Code ${code} already exists.`);
          skippedCount++;
          return;
        }
        const newInstitute: Institute = {
          id: idFromCsv || generateClientIdForImport(),
          ...instituteData,
        };
        institutesStore.push(newInstitute);
        newCount++;
      }
    });

    (global as any).__API_INSTITUTES_STORE__ = institutesStore; // Update global store

    return NextResponse.json({ message: 'Institutes imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing institutes:', error);
    return NextResponse.json({ message: 'Error importing institutes.', error: (error as Error).message }, { status: 500 });
  }
}
