
import { NextResponse, type NextRequest } from 'next/server';
import type { Program, Department } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';

const programsStore: Program[] = (global as any).__API_PROGRAMS_STORE__ || [];
if (!(global as any).__API_PROGRAMS_STORE__) {
  (global as any).__API_PROGRAMS_STORE__ = programsStore;
}
// let departmentsStore: Department[] = (global as any).departments || []; // Client sends this

const generateIdForImport = (): string => `prog_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const departmentsJson = formData.get('departments') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }
    if (!departmentsJson) {
      return NextResponse.json({ message: 'Department data for mapping is missing.' }, { status: 400 });
    }
    const clientDepartments: Department[] = JSON.parse(departmentsJson);

    const fileText = await file.text();
    const { data: parsedData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, ''),
      dynamicTyping: true,
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors (Program Import):', JSON.stringify(parseErrors, null, 2));
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Programs CSV file. Please check the file format and content.', errors: errorMessages }, { status: 400 });
    }
    
    const header = Object.keys(parsedData[0] || {});
    const requiredHeaders = ['name', 'code', 'status'];

    if (!requiredHeaders.every(rh => header.includes(rh))) {
        const missing = requiredHeaders.filter(rh => !header.includes(rh));
        return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    parsedData.forEach((row: unknown) => {
      const name = row.name?.toString().trim();
      const code = row.code?.toString().trim().toUpperCase();
      const status = row.status?.toString().trim().toLowerCase() as 'active' | 'inactive';

      if (!name || !code || !['active', 'inactive'].includes(status)) {
        console.warn(`Skipping program row: Missing or invalid required data (name, code, status). Row: ${JSON.stringify(row)}`);
        skippedCount++;
        return;
      }

      let departmentId = row.departmentid?.toString().trim();
      if (!departmentId) {
        const deptName = row.departmentname?.toString().trim();
        const deptCode = row.departmentcode?.toString().trim().toUpperCase();
        const foundDept = clientDepartments.find(d => (deptName && d.name.toLowerCase() === deptName.toLowerCase()) || (deptCode && d.code.toUpperCase() === deptCode));
        if (foundDept) departmentId = foundDept.id;
        else { 
            console.warn(`Skipping program ${name}: Could not find department by name/code. Row: ${JSON.stringify(row)}`);
            skippedCount++; return; 
        }
      } else if (!clientDepartments.some(d => d.id === departmentId)) {
         console.warn(`Skipping program ${name}: Department ID ${departmentId} not found. Row: ${JSON.stringify(row)}`);
         skippedCount++; return;
      }

      const durationYears = row.durationyears !== undefined && row.durationyears !== null && !isNaN(Number(row.durationyears)) && Number(row.durationyears) > 0 && Number(row.durationyears) <=10 ? Number(row.durationyears) : undefined;
      const totalSemesters = row.totalsemesters !== undefined && row.totalsemesters !== null && !isNaN(Number(row.totalsemesters)) && Number(row.totalsemesters) > 0 && Number(row.totalsemesters) <= 20 ? Number(row.totalsemesters) : undefined;


      const programData: Omit<Program, 'id'> = {
        name, code, status, departmentId,
        description: row.description?.toString().trim() || undefined,
        durationYears, totalSemesters,
      };

      const idFromCsv = row.id?.toString().trim();
      let existingProgramIndex = -1;

      if (idFromCsv) {
        existingProgramIndex = programsStore.findIndex(p => p.id === idFromCsv);
      } else {
        existingProgramIndex = programsStore.findIndex(p => p.code === code && p.departmentId === departmentId);
      }

      if (existingProgramIndex !== -1) {
        programsStore[existingProgramIndex] = { ...programsStore[existingProgramIndex], ...programData };
        updatedCount++;
      } else {
        if (programsStore.some(p => p.code === code && p.departmentId === departmentId)) {
            console.warn(`Skipping new program ${name} (${code}) for department ${departmentId}: Already exists.`);
            skippedCount++; return;
        }
        const newProgram: Program = { id: idFromCsv || generateIdForImport(), ...programData };
        programsStore.push(newProgram);
        newCount++;
      }
    });
    (global as any).__API_PROGRAMS_STORE__ = programsStore;
    return NextResponse.json({ message: 'Programs imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing programs:', error);
    return NextResponse.json({ message: 'Error importing programs.', error: (error as Error).message }, { status: 500 });
  }
}
