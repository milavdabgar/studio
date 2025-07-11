import { NextResponse, type NextRequest } from 'next/server';
import type { Program, BatchStatus } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { BatchModel } from '@/lib/models';
import mongoose from 'mongoose';

const generateIdForImport = (): string => `batch_imp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const BATCH_STATUS_OPTIONS: BatchStatus[] = ['upcoming', 'active', 'completed', 'inactive'];

export async function POST(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const programsJson = formData.get('programs') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }
    if (!programsJson) {
      return NextResponse.json({ message: 'Program data for mapping is missing.' }, { status: 400 });
    }
    const clientPrograms: Program[] = JSON.parse(programsJson);

    const fileText = await file.text();
    const { data: parsedData, errors: parseErrors } = parse<Record<string, unknown>>(fileText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, ''),
      dynamicTyping: false, 
    });

    if (parseErrors.length > 0) {
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${(e.row || 0) + 2}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Batches CSV file.', errors: errorMessages }, { status: 400 });
    }

    const header = Object.keys(parsedData[0] || {}).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
    const requiredHeaders = ['name', 'startacademicyear', 'status'];
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
      const row = parsedData[i];
      const rowIndex = i + 2; 

      const name = row.name?.toString().trim();
      const startAcademicYearStr = row.startacademicyear?.toString().trim();
      const statusRaw = row.status?.toString().trim().toLowerCase();
      const status = BATCH_STATUS_OPTIONS.includes(statusRaw as BatchStatus) ? statusRaw as BatchStatus : undefined;

      if (!name || !startAcademicYearStr || !status) {
        importErrors.push({ row: rowIndex, message: "Missing required fields: name, startAcademicYear, or status.", data: row });
        skippedCount++; continue;
      }
      const startAcademicYear = parseInt(startAcademicYearStr, 10);
      if (isNaN(startAcademicYear) || startAcademicYear < 1900 || startAcademicYear > new Date().getFullYear() + 10) {
          importErrors.push({ row: rowIndex, message: `Invalid Start Academic Year: ${startAcademicYearStr}.`, data: row });
          skippedCount++; continue;
      }
      
      let programId = row.programid?.toString().trim();
      if (!programId) {
        const programName = row.programname?.toString().trim();
        const programCode = row.programcode?.toString().trim().toUpperCase();
        const foundProgram = clientPrograms.find(p => 
            (programName && p.name.toLowerCase() === programName.toLowerCase()) || 
            (programCode && p.code.toUpperCase() === programCode)
        );
        if (foundProgram) {
          programId = foundProgram.id;
        } else {
          importErrors.push({ row: rowIndex, message: `Program not found by name '${programName}' or code '${programCode}'.`, data: row });
          skippedCount++; continue;
        }
      } else if (!clientPrograms.some(p => p.id === programId)) {
        importErrors.push({ row: rowIndex, message: `Provided programId '${programId}' does not exist.`, data: row });
        skippedCount++; continue;
      }

      const endAcademicYearStr = row.endacademicyear?.toString().trim();
      const endAcademicYear = endAcademicYearStr && !isNaN(parseInt(endAcademicYearStr, 10)) ? parseInt(endAcademicYearStr, 10) : undefined;
      if (endAcademicYear && (endAcademicYear < startAcademicYear || endAcademicYear > startAcademicYear + 10)) {
          importErrors.push({ row: rowIndex, message: `Invalid End Academic Year: ${endAcademicYearStr}. Must be after Start Year.`, data: row });
          skippedCount++; continue;
      }

      const batchDataFromCsv = {
        name, programId, startAcademicYear, status,
        endAcademicYear,
        maxIntake: row.maxintake && !isNaN(parseInt(row.maxintake.toString(),10)) ? parseInt(row.maxintake.toString(),10) : undefined,
      };

      const idFromCsv = row.id?.toString().trim();
      let existingBatch = null;

      if (idFromCsv) {
        existingBatch = await BatchModel.findOne({ 
          id: idFromCsv 
        });
      } else {
        existingBatch = await BatchModel.findOne({ 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          programId: programId
        });
      }

      if (existingBatch) {
        await BatchModel.findOneAndUpdate(
          { _id: existingBatch._id },
          { ...batchDataFromCsv, updatedAt: now }
        );
        updatedCount++;
      } else {
        const duplicate = await BatchModel.findOne({ 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          programId: programId
        });
        
        if (duplicate) {
          importErrors.push({ row: rowIndex, message: `Batch with name '${name}' already exists for this program.`, data: row });
          skippedCount++; continue;
        }
        
        const newBatch = new BatchModel({
          id: idFromCsv || generateIdForImport(),
          ...batchDataFromCsv,
          createdAt: now,
          updatedAt: now,
        });
        
        await newBatch.save();
        newCount++;
      }
    }

    if (importErrors.length > 0) {
        return NextResponse.json({ 
            message: `Batches import partially completed with ${importErrors.length} issues.`, 
            newCount, 
            updatedCount, 
            skippedCount,
            errors: importErrors 
        }, { status: 207 }); 
    }
    return NextResponse.json({ message: 'Batches imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Critical error during batch import process:', error);
    return NextResponse.json({ message: 'Critical error during batch import process. Please check server logs.' }, { status: 500 });
  }
}