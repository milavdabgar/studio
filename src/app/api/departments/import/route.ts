
import { NextResponse, type NextRequest } from 'next/server';
import type { Department } from '@/types/entities';
import { parse, type ParseError } from 'papaparse'; 

// In-memory store for departments
const departmentsStore: Department[] = (global as any).__API_DEPARTMENTS_STORE__ || [];
if (!(global as any).__API_DEPARTMENTS_STORE__) {
  (global as any).__API_DEPARTMENTS_STORE__ = departmentsStore;
}

const generateIdForImport = (): string => `dept_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
      console.error('CSV Parse Errors (Department Import):', JSON.stringify(parseErrors, null, 2));
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Departments CSV file. Please check the file format and content.', errors: errorMessages }, { status: 400 });
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
        console.warn(`Skipping department row: Missing or invalid required data (name, code, status). Row: ${JSON.stringify(row)}`);
        skippedCount++;
        return;
      }
      
      const establishmentYear = row.establishmentyear !== undefined && row.establishmentyear !== null && !isNaN(Number(row.establishmentyear)) ? Number(row.establishmentyear) : undefined;
      if (establishmentYear && (establishmentYear < 1900 || establishmentYear > new Date().getFullYear())) {
        console.warn(`Skipping row for department ${name}: Invalid establishment year ${establishmentYear}.`);
        skippedCount++;
        return;
      }

      const departmentData: Omit<Department, 'id'> = {
        name,
        code,
        status,
        description: row.description?.toString().trim() || undefined,
        hodId: row.hodid?.toString().trim() || undefined, 
        establishmentYear,
      };

      const idFromCsv = row.id?.toString().trim();
      let existingDepartmentIndex = -1;

      if (idFromCsv) {
        existingDepartmentIndex = departmentsStore.findIndex(d => d.id === idFromCsv);
        if (existingDepartmentIndex !== -1 && code !== departmentsStore[existingDepartmentIndex].code && departmentsStore.some(d => d.id !== idFromCsv && d.code === code)) {
          console.warn(`Skipping update for department ID ${idFromCsv} (Department: ${departmentsStore[existingDepartmentIndex].name}): Code ${code} from CSV conflicts with another existing department.`);
          skippedCount++;
          return; 
        }
      } else { 
        existingDepartmentIndex = departmentsStore.findIndex(d => d.code === code);
      }


      if (existingDepartmentIndex !== -1) {
        departmentsStore[existingDepartmentIndex] = { ...departmentsStore[existingDepartmentIndex], ...departmentData };
        updatedCount++;
      } else {
        if (departmentsStore.some(d => d.code === code)) {
             console.warn(`Skipping new department: Code ${code} (for ${name}) already exists.`);
             skippedCount++;
             return;
        }
        const newDepartment: Department = {
          id: idFromCsv || generateIdForImport(), 
          ...departmentData,
        };
        departmentsStore.push(newDepartment);
        newCount++;
      }
    });
    (global as any).__API_DEPARTMENTS_STORE__ = departmentsStore;
    return NextResponse.json({ message: 'Departments imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing departments:', error);
    return NextResponse.json({ message: 'Error importing departments.', error: (error as Error).message }, { status: 500 });
  }
}
