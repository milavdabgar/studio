import { NextResponse, type NextRequest } from 'next/server';
import type { Department } from '@/types/entities';
import { parse } from 'papaparse'; // Using papaparse for CSV parsing

// In-memory store for departments
let departmentsStore: Department[] = (global as any).departmentsStore || [];
if (!(global as any).departmentsStore) {
  (global as any).departmentsStore = departmentsStore;
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
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors:', parseErrors);
      return NextResponse.json({ message: 'Error parsing CSV file.', errors: parseErrors.map(e => e.message) }, { status: 400 });
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

    parsedData.forEach((row: any) => {
      const name = row.name?.trim();
      const code = row.code?.trim().toUpperCase();
      const status = row.status?.trim().toLowerCase() as 'active' | 'inactive';

      if (!name || !code || !['active', 'inactive'].includes(status)) {
        console.warn(`Skipping row: Missing or invalid required data (name, code, status). Row: ${JSON.stringify(row)}`);
        skippedCount++;
        return;
      }
      
      const estYearStr = row.establishmentyear?.trim();
      const establishmentYear = estYearStr && !isNaN(parseInt(estYearStr)) ? parseInt(estYearStr) : undefined;
      if (establishmentYear && (establishmentYear < 1900 || establishmentYear > new Date().getFullYear())) {
        console.warn(`Skipping row for department ${name}: Invalid establishment year ${establishmentYear}.`);
        skippedCount++;
        return;
      }

      const departmentData: Omit<Department, 'id'> = {
        name,
        code,
        status,
        description: row.description?.trim() || undefined,
        hodId: row.hodid?.trim() || undefined, // Assuming HOD ID might be in CSV
        establishmentYear,
      };

      const idFromCsv = row.id?.trim();
      let existingDepartmentIndex = -1;

      if (idFromCsv) {
        existingDepartmentIndex = departmentsStore.findIndex(d => d.id === idFromCsv);
        // If ID exists but code is different and that new code already exists for another department, it's a conflict.
        if (existingDepartmentIndex !== -1 && code !== departmentsStore[existingDepartmentIndex].code && departmentsStore.some(d => d.id !== idFromCsv && d.code === code)) {
          console.warn(`Skipping update for ID ${idFromCsv} (Department: ${departmentsStore[existingDepartmentIndex].name}): Code ${code} from CSV conflicts with another existing department.`);
          skippedCount++;
          return; // Skip this conflicting update
        }
      } else { // if no id in csv, try to find by code for potential update
        existingDepartmentIndex = departmentsStore.findIndex(d => d.code === code);
      }


      if (existingDepartmentIndex !== -1) {
        departmentsStore[existingDepartmentIndex] = { ...departmentsStore[existingDepartmentIndex], ...departmentData };
        updatedCount++;
      } else {
        // If trying to update by code and no ID was provided, but code already exists, this is a conflict unless it's the same department.
        // However, the previous check (existingDepartmentIndex based on code) would have found it for update.
        // So, if we are here, it's a new department.
        if (departmentsStore.some(d => d.code === code)) {
             console.warn(`Skipping new department: Code ${code} (for ${name}) already exists.`);
             skippedCount++;
             return;
        }
        const newDepartment: Department = {
          id: idFromCsv || generateIdForImport(), // Use CSV id if present and new, otherwise generate.
          ...departmentData,
        };
        departmentsStore.push(newDepartment);
        newCount++;
      }
    });

    return NextResponse.json({ message: 'Departments imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing departments:', error);
    return NextResponse.json({ message: 'Error importing departments.', error: (error as Error).message }, { status: 500 });
  }
}