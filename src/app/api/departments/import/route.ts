
import { NextResponse, type NextRequest } from 'next/server';
import { parse, type ParseError } from 'papaparse';
import { DepartmentModel } from '@/lib/models';
import mongoose from 'mongoose';

const generateIdForImport = (): string => `dept_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function POST(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
    
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
      dynamicTyping: false,
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors (Department Import):', JSON.stringify(parseErrors, null, 2));
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${(e.row || 0) + 2}: ${e.message} (Code: ${e.code})`);
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
    const importErrors: { row: number; message: string; data: unknown }[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i] as any;
      const rowIndex = i + 2;

      const name = row.name?.toString().trim();
      const code = row.code?.toString().trim().toUpperCase();
      const status = row.status?.toString().trim().toLowerCase() as 'active' | 'inactive';

      if (!name || !code || !['active', 'inactive'].includes(status)) {
        importErrors.push({ row: rowIndex, message: 'Missing or invalid required data (name, code, status)', data: row });
        skippedCount++;
        continue;
      }
      
      const establishmentYear = row.establishmentyear !== undefined && row.establishmentyear !== null && !isNaN(Number(row.establishmentyear)) ? Number(row.establishmentyear) : undefined;
      if (establishmentYear && (establishmentYear < 1900 || establishmentYear > new Date().getFullYear())) {
        importErrors.push({ row: rowIndex, message: `Invalid establishment year ${establishmentYear}`, data: row });
        skippedCount++;
        continue;
      }

      const departmentData = {
        name,
        code,
        status,
        description: row.description?.toString().trim() || undefined,
        hodId: row.hodid?.toString().trim() || undefined, 
        establishmentYear,
        instituteId: row.instituteid?.toString().trim() || 'inst1', // Default institute ID
      };

      const idFromCsv = row.id?.toString().trim();
      let existingDepartment = null;

      if (idFromCsv) {
        existingDepartment = await DepartmentModel.findOne({ 
          $or: [{ id: idFromCsv }, { _id: idFromCsv }] 
        });
        
        if (existingDepartment && code !== existingDepartment.code) {
          const codeConflict = await DepartmentModel.findOne({ 
            code: code,
            _id: { $ne: existingDepartment._id }
          });
          
          if (codeConflict) {
            importErrors.push({ row: rowIndex, message: `Code ${code} conflicts with another existing department`, data: row });
            skippedCount++;
            continue;
          }
        }
      } else { 
        existingDepartment = await DepartmentModel.findOne({ code: code });
      }

      if (existingDepartment) {
        await DepartmentModel.findOneAndUpdate(
          { _id: existingDepartment._id },
          { ...departmentData, updatedAt: now }
        );
        updatedCount++;
      } else {
        const duplicate = await DepartmentModel.findOne({ code: code });
        if (duplicate) {
          importErrors.push({ row: rowIndex, message: `Department code ${code} already exists`, data: row });
          skippedCount++;
          continue;
        }
        
        const newDepartment = new DepartmentModel({
          id: idFromCsv || generateIdForImport(),
          ...departmentData,
          createdAt: now,
          updatedAt: now,
        });
        
        await newDepartment.save();
        newCount++;
      }
    }

    if (importErrors.length > 0) {
      return NextResponse.json({ 
        message: `Departments import partially completed with ${importErrors.length} issues.`, 
        newCount, 
        updatedCount, 
        skippedCount,
        errors: importErrors 
      }, { status: 207 }); 
    }

    return NextResponse.json({ message: 'Departments imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing departments:', error);
    return NextResponse.json({ message: 'Error importing departments.', error: (error as Error).message }, { status: 500 });
  }
}
