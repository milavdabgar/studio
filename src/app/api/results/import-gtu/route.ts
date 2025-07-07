import { NextResponse, type NextRequest } from 'next/server';
import type { Result, Student, Program, ResultSubject } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { ResultModel } from '@/lib/models';
import mongoose from 'mongoose';

// Helper functions adapted from reference/result.controller.ts
const extractEnrollmentNo = (row: Record<string, unknown>): string => {
  return row.mapnumber?.toString().trim() || row.stid?.toString().trim() || '';
};

const extractStId = (row: Record<string, unknown>): string => {
  return row.stid?.toString().trim() || row.mapnumber?.toString().trim() || '';
};

const _mapSemesterCodeToStatus = (code: string | undefined | null): Student['sem1Status'] => { // Using Student['sem1Status'] for type safety
    if (!code) return 'N/A';
    const codeStr = String(code).trim();
    if (codeStr === '2') return 'Passed';
    if (codeStr === '1') return 'Pending';
    if (codeStr === '') return 'Not Appeared';
    return 'N/A';
};


const processGtuResultCsvForApi = (rows: Record<string, unknown>[], clientPrograms: Program[]): { processedResults: Omit<Result, '_id' | 'createdAt' | 'updatedAt'>[], errors: Array<{ row: number; message: string; data: Record<string, unknown> }> } => {
  const processedResults: Omit<Result, '_id' | 'createdAt' | 'updatedAt'>[] = [];
  const processingErrors: Array<{ row: number; message: string; data: Record<string, unknown> }> = [];

  rows.forEach((row, index) => {
    try {
      const enrollmentNo = extractEnrollmentNo(row);
      const st_id = extractStId(row);
      const branchCodeCsv = row.brcode?.toString().trim().toUpperCase();

      if (!enrollmentNo || !st_id || !branchCodeCsv) {
        processingErrors.push({ row: index + 2, message: `Missing map_number/st_id or br_code. Data found: map_number='${row.mapnumber}', st_id='${row.stid}', br_code='${row.brcode}'`, data: row });
        return;
      }
      
      const programForBranch = clientPrograms.find(p => p.code.toUpperCase() === branchCodeCsv);
      if (!programForBranch) {
        processingErrors.push({ row: index + 2, message: `Program not found for branch code '${branchCodeCsv}'. CSV row: ${JSON.stringify(row)}. Available program codes: ${clientPrograms.map(p=>p.code).join(', ')}. Ensure this program and branch code exists in the system.`, data: row });
        return;
      }

      const subjects: ResultSubject[] = [];
      const subjectKeys = Object.keys(row).filter(key => /^sub\d+$/.test(key));
      const maxSubjects = Math.floor(subjectKeys.length / 6); // Approx count based on 6 grade fields per subject in sample


      for (let i = 1; i <= maxSubjects; i++) {
        const subCodeKey = `sub${i}`;
        const subNameKey = `sub${i}na`;
        const creditsKey = `sub${i}cr`;
        const gradeKey = `sub${i}gr`;
        const theoryEseGradeKey = `sub${i}gre`;
        const theoryPaGradeKey = `sub${i}grm`;
        const theoryTotalGradeKey = `sub${i}grth`;
        const practicalPaGradeKey = `sub${i}gri`;
        const practicalVivaGradeKey = `sub${i}grv`;
        const practicalTotalGradeKey = `sub${i}grpr`;

        const subCode = row[subCodeKey]?.toString().trim();
        const subName = row[subNameKey]?.toString().trim();
        
        if (!subCode || !subName) continue;
        
        const credits = parseFloat(row[creditsKey]?.toString() || '0') || 0;
        const grade = row[gradeKey]?.toString().trim().toUpperCase() || '';
        
        subjects.push({
          code: subCode,
          name: subName,
          credits,
          grade,
          isBacklog: grade === 'FF',
          theoryEseGrade: row[theoryEseGradeKey]?.toString().trim() || undefined,
          theoryPaGrade: row[theoryPaGradeKey]?.toString().trim() || undefined,
          theoryTotalGrade: row[theoryTotalGradeKey]?.toString().trim() || undefined,
          practicalPaGrade: row[practicalPaGradeKey]?.toString().trim() || undefined,
          practicalVivaGrade: row[practicalVivaGradeKey]?.toString().trim() || undefined,
          practicalTotalGrade: row[practicalTotalGradeKey]?.toString().trim() || undefined,
        });
      }

      const resultEntry: Omit<Result, '_id' | 'createdAt' | 'updatedAt'> = {
        st_id,
        enrollmentNo,
        extype: row.extype?.toString().trim(),
        examid: parseInt(row.examid?.toString() || '0', 10) || undefined,
        exam: row.exam?.toString().trim(),
        declarationDate: row.declarationdate ? new Date(row.declarationdate as string).toISOString() : undefined,
        academicYear: row.academicyear?.toString().trim(),
        semester: parseInt(row.sem?.toString() || '0', 10) || 0,
        unitNo: parseFloat(row.unitno?.toString() || '0') || undefined, 
        examNumber: parseFloat(row.examnumber?.toString() || '0') || undefined,
        name: row.name?.toString().trim() || 'Unknown Student',
        instcode: parseInt(row.instcode?.toString() || '0', 10) || undefined,
        instName: row.instname?.toString().trim(),
        courseName: row.coursename?.toString().trim(),
        branchCode: parseInt(branchCodeCsv, 10) || undefined, 
        branchName: row.brname?.toString().trim() || 'Unknown Branch', 
        subjects,
        totalCredits: subjects.reduce((sum, sub) => sum + sub.credits, 0),
        earnedCredits: subjects.reduce((sum, sub) => sum + (sub.isBacklog ? 0 : sub.credits), 0),
        spi: parseFloat(row.spi?.toString() || '0') || 0,
        cpi: parseFloat(row.cpi?.toString() || '0') || 0,
        cgpa: parseFloat(row.cgpa?.toString() || '0') || undefined,
        result: row.result?.toString().trim().toUpperCase() || 'PENDING',
        trials: parseInt(row.trial?.toString() || '1', 10) || 1,
        remark: row.remark?.toString().trim(),
        currentBacklog: parseInt(row.curbackl?.toString() || '0', 10) || 0,
        totalBacklog: parseInt(row.totbackl?.toString() || '0', 10) || 0,
        uploadBatch: uuidv4(), 
        programId: programForBranch.id, 
      };
      processedResults.push(resultEntry);
    } catch (e) {
        processingErrors.push({row: index + 2, message: `Error processing row: ${(e as Error).message}`, data: row});
    }
  });
  return { processedResults, errors: processingErrors };
};

export async function POST(request: NextRequest) {
  try {
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
    const { data: parsedCsvData, errors: parseErrors, meta } = parse<Record<string, unknown>>(fileText, {
      header: true,
      skipEmptyLines: 'greedy', 
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/gi, ''),
    });
    
    console.log("Parsed CSV Headers:", meta.fields);
    console.log("First Parsed Row (sample):", parsedCsvData.length > 0 ? parsedCsvData[0] : "No data");


    if (parseErrors.length > 0) {
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${(e.row || 0) + 2}: ${e.message} (Code: ${e.code})`).slice(0,5);
      console.error("CSV Parsing Errors:", errorMessages);
      return NextResponse.json({ message: 'Error parsing GTU Results CSV file.', errors: errorMessages, error: `Error parsing GTU Results CSV file. First error: ${errorMessages[0]}` }, { status: 400 });
    }
    if (parsedCsvData.length === 0) {
      return NextResponse.json({ message: 'CSV file is empty or has no data rows.' , error: 'CSV file is empty or has no data rows.'}, { status: 400 });
    }

    const { processedResults, errors: processingErrors } = processGtuResultCsvForApi(parsedCsvData, clientPrograms);
    
    let newCount = 0;
    let updatedCount = 0; 
    const skippedCountDueToProcessing = processingErrors.length; 
    const now = new Date().toISOString();
    const currentUploadBatchId = uuidv4(); // Single batch ID for this upload

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');

    for (const resultData of processedResults) {
      const existingResult = await ResultModel.findOne({
        enrollmentNo: resultData.enrollmentNo,
        examid: resultData.examid,
        semester: resultData.semester
      });

      if (existingResult) {
        await ResultModel.findOneAndUpdate(
          { _id: existingResult._id },
          { ...resultData, uploadBatch: currentUploadBatchId, updatedAt: now }
        );
        updatedCount++;
      } else {
        const newResult = new ResultModel({
          _id: `gtu_res_${uuidv4()}`,
          ...resultData,
          uploadBatch: currentUploadBatchId, 
          createdAt: now,
          updatedAt: now,
        });
        await newResult.save();
        newCount++;
      }
    }

    if (processingErrors.length > 0) {
        const finalMessage = `GTU Results import partially completed. New: ${newCount}, Updated: ${updatedCount}, Skipped (due to processing issues): ${skippedCountDueToProcessing}.`;
        console.error("GTU Import Processing Errors:", processingErrors.slice(0,10));
        return NextResponse.json({ 
            message: finalMessage, 
            newCount, 
            updatedCount, 
            skippedCount: skippedCountDueToProcessing, 
            errors: processingErrors.slice(0,10) 
        }, { status: 207 }); 
    }

    return NextResponse.json({ message: 'GTU Results imported successfully.', newCount, updatedCount, skippedCount: skippedCountDueToProcessing, batchId: currentUploadBatchId }, { status: 201 });

  } catch (error) {
    console.error('Critical error during GTU result import process:', error);
    return NextResponse.json({ message: 'Critical error during GTU result import process. Please check server logs.', error: (error as Error).message }, { status: 500 });
  }
}