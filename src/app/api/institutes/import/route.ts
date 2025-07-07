
import { NextResponse, type NextRequest } from 'next/server';
import type { Institute } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { connectMongoose } from '@/lib/mongodb';
import { InstituteModel } from '@/lib/models';

interface InstituteCSVRow {
  id?: string;
  name?: string;
  code?: string;
  status?: string;
  address?: string;
  contactemail?: string;
  contactphone?: string;
  website?: string;
  domain?: string;
  establishmentyear?: string | number;
  administrators?: string;
  [key: string]: unknown;
}

const generateInstituteIdForImport = (): string => `inst_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }

    const fileText = await file.text();

    const { data: parsedData, errors: parseErrors } = parse<InstituteCSVRow>(fileText, {
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
    const requiredHeaders = ['name', 'code', 'status'];

    if (!requiredHeaders.every(rh => header.includes(rh))) {
        const missing = requiredHeaders.filter(rh => !header.includes(rh));
        return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of parsedData) {
      const name = row.name?.toString().trim();
      const code = row.code?.toString().trim().toUpperCase();
      const status = row.status?.toString().trim().toLowerCase() as 'active' | 'inactive';

      if (!name || !code || !['active', 'inactive'].includes(status)) {
        console.warn(`Skipping institute row: Missing or invalid required data (name, code, status). Row: ${JSON.stringify(row)}`);
        skippedCount++;
        continue;
      }
      
      const establishmentYear = row.establishmentyear !== undefined && row.establishmentyear !== null && !isNaN(Number(row.establishmentyear)) ? Number(row.establishmentyear) : undefined;
      if (establishmentYear && (establishmentYear < 1800 || establishmentYear > new Date().getFullYear())) {
        console.warn(`Skipping institute row for ${name}: Invalid establishment year ${establishmentYear}.`);
        skippedCount++;
        continue;
      }

      const instituteData = {
        name,
        code,
        status,
        address: row.address?.toString().trim() || undefined,
        contactEmail: row.contactemail?.toString().trim() || undefined,
        contactPhone: row.contactphone?.toString().trim() || undefined,
        website: row.website?.toString().trim() || undefined,
        domain: row.domain?.toString().trim() || `${code.toLowerCase()}.ac.in`,
        establishmentYear,
        administrators: row.administrators ? JSON.parse(row.administrators) : [],
      };

      const idFromCsv = row.id?.toString().trim();
      let existingInstitute;

      if (idFromCsv) {
        existingInstitute = await InstituteModel.findOne({ id: idFromCsv });
      } else {
        existingInstitute = await InstituteModel.findOne({ code: code });
      }

      if (existingInstitute) {
        // If code is changing, ensure new code doesn't conflict
        if (code !== existingInstitute.code) {
          const conflictingInstitute = await InstituteModel.findOne({ 
            code: code, 
            _id: { $ne: existingInstitute._id } 
          });
          if (conflictingInstitute) {
            console.warn(`Skipping update for institute ${existingInstitute.name}: New code ${code} from CSV conflicts with another existing institute.`);
            skippedCount++;
            continue;
          }
        }
        
        await InstituteModel.findByIdAndUpdate(existingInstitute._id, {
          ...instituteData,
          updatedAt: new Date().toISOString()
        });
        updatedCount++;
      } else {
        // For new institutes, ensure code is unique
        const codeExists = await InstituteModel.findOne({ code: code });
        if (codeExists) {
          console.warn(`Skipping new institute ${name}: Code ${code} already exists.`);
          skippedCount++;
          continue;
        }
        
        const newInstitute = new InstituteModel({
          id: idFromCsv || generateInstituteIdForImport(),
          ...instituteData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await newInstitute.save();
        newCount++;
      }
    }

    return NextResponse.json({ message: 'Institutes imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing institutes:', error);
    return NextResponse.json({ message: 'Error importing institutes.', error: (error as Error).message }, { status: 500 });
  }
}
