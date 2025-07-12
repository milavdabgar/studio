
import { NextResponse, type NextRequest } from 'next/server';
import type { Program } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { ProgramModel, DepartmentModel } from '@/lib/models';
import mongoose from 'mongoose';


export async function POST(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
    
    // SECURITY FIX: Validate Content-Type for file uploads
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ 
        message: 'Invalid Content-Type. Expected multipart/form-data for file upload.' 
      }, { status: 400 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }

    const fileText = await file.text();
    const { data: parsedData, errors: parseErrors } = parse<Record<string, unknown>>(fileText, {
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

    for (const row of parsedData) {
      // Type the row object
      const csvRow = row as Record<string, unknown>;
      
      const name = csvRow.name?.toString().trim();
      const code = csvRow.code?.toString().trim().toUpperCase();
      const status = csvRow.status?.toString().trim().toLowerCase() as 'active' | 'inactive';

      if (!name || !code || !['active', 'inactive'].includes(status)) {
        console.warn(`Skipping program row: Missing or invalid required data (name, code, status). Row: ${JSON.stringify(row)}`);
        skippedCount++;
        continue;
      }

      let departmentId = csvRow.departmentid?.toString().trim();
      if (!departmentId) {
        const deptName = csvRow.departmentname?.toString().trim();
        const deptCode = csvRow.departmentcode?.toString().trim().toUpperCase();
        
        // Look up department in MongoDB
        const foundDept = await DepartmentModel.findOne({
          $or: [
            ...(deptName ? [{ name: { $regex: new RegExp(`^${deptName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }] : []),
            ...(deptCode ? [{ code: { $regex: new RegExp(`^${deptCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }] : [])
          ]
        });
        
        if (foundDept) departmentId = foundDept._id.toString();
        else { 
            console.warn(`Skipping program ${name}: Could not find department by name/code. Row: ${JSON.stringify(row)}`);
            skippedCount++; continue; 
        }
      } else {
        // Verify department exists in MongoDB
        const deptExists = await DepartmentModel.findById(departmentId);
        if (!deptExists) {
         console.warn(`Skipping program ${name}: Department ID ${departmentId} not found. Row: ${JSON.stringify(row)}`);
         skippedCount++; continue;
        }
      }

      const durationYears = csvRow.durationyears !== undefined && csvRow.durationyears !== null && !isNaN(Number(csvRow.durationyears)) && Number(csvRow.durationyears) > 0 && Number(csvRow.durationyears) <=10 ? Number(csvRow.durationyears) : undefined;
      const totalSemesters = csvRow.totalsemesters !== undefined && csvRow.totalsemesters !== null && !isNaN(Number(csvRow.totalsemesters)) && Number(csvRow.totalsemesters) > 0 && Number(csvRow.totalsemesters) <= 20 ? Number(csvRow.totalsemesters) : undefined;

      const programData: Partial<Program> = {
        name, code, status, departmentId,
        description: csvRow.description?.toString().trim() || undefined,
        durationYears, totalSemesters,
      };

      const idFromCsv = csvRow.id?.toString().trim();
      let existingProgram = null;

      if (idFromCsv && mongoose.Types.ObjectId.isValid(idFromCsv)) {
        existingProgram = await ProgramModel.findById(idFromCsv);
      } else {
        existingProgram = await ProgramModel.findOne({ code, departmentId });
      }

      if (existingProgram) {
        await ProgramModel.findByIdAndUpdate(existingProgram._id, programData);
        updatedCount++;
      } else {
        // Check for duplicate code in department
        const duplicateProgram = await ProgramModel.findOne({ code, departmentId });
        if (duplicateProgram) {
            console.warn(`Skipping new program ${name} (${code}) for department ${departmentId}: Already exists.`);
            skippedCount++; continue;
        }
        
        const newProgram = new ProgramModel(programData);
        await newProgram.save();
        newCount++;
      }
    }

    return NextResponse.json({ message: 'Programs imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing programs:', error);
    return NextResponse.json({ message: 'Error importing programs.' }, { status: 500 });
  }
}
