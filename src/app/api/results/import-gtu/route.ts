import { NextResponse, type NextRequest } from 'next/server';
import type { Result, Student, Program, ResultSubject } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

// Ensure stores are initialized
if (!(global as any).__API_RESULTS_STORE__) {
  (global as any).__API_RESULTS_STORE__ = [];
}
let resultsStore: Result[] = (global as any).__API_RESULTS_STORE__;

// Helper functions adapted from reference/result.controller.ts
const extractEnrollmentNo = (row: any): string => {
  return row.map_number?.toString().trim() || row.st_id?.toString().trim() || '';
};

const extractStId = (row: any): string => {
  return row.st_id?.toString().trim() || row.map_number?.toString().trim() || '';
};

const mapSemesterCodeToStatus = (code: string | undefined | null): Student['sem1Status'] => { // Using Student['sem1Status'] for type safety
    if (!code) return 'N/A';
    const codeStr = String(code).trim();
    if (codeStr === '2') return 'Passed';
    if (codeStr === '1') return 'Pending';
    if (codeStr === '') return 'Not Appeared';
    return 'N/A';
};


const processGtuResultCsvForApi = (rows: any[], clientPrograms: Program[]): { processedResults: Omit<Result, '_id' | 'createdAt' | 'updatedAt'>[], errors: any[] } => {
  const processedResults: Omit<Result, '_id' | 'createdAt' | 'updatedAt'>[] = [];
  const processingErrors: any[] = [];

  rows.forEach((row, index) => {
    try {
      const enrollmentNo = extractEnrollmentNo(row);
      const st_id = extractStId(row);
      const branchCode = row.br_code?.toString().trim().toUpperCase();

      if (!enrollmentNo || !st_id || !branchCode) {
        processingErrors.push({ row: index + 2, message: `Missing map_number/st_id or br_code.`, data: row });
        return;
      }
      
      // Find programId and departmentId based on branchCode by looking up clientPrograms
      const programForBranch = clientPrograms.find(p => p.code.toUpperCase() === branchCode);
      if (!programForBranch) {
        processingErrors.push({ row: index + 2, message: `Program not found for branch code '${branchCode}'. Ensure this program and branch code exists in the system.`, data: row });
        return;
      }
      // const programId = programForBranch.id;
      // No departmentId directly on Result model, but program implies department

      const subjects: ResultSubject[] = [];
      const subjectColumns = Object.keys(row).filter(key => /^sub\d+$/.test(key.toLowerCase()));
      const maxSubjects = subjectColumns.length;

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
        
        const credits = parseFloat(row[creditsKey]?.toString()) || 0;
        const grade = row[gradeKey]?.toString().trim() || '';
        
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
        examid: parseInt(row.examid?.toString(), 10) || undefined,
        exam: row.exam?.toString().trim(),
        declarationDate: row.declarationdate ? new Date(row.declarationdate).toISOString() : undefined,
        academicYear: row.academicyear?.toString().trim(),
        semester: parseInt(row.sem?.toString(), 10) || 0,
        unitNo: parseFloat(row.unit_no?.toString()) || undefined,
        examNumber: parseFloat(row.examnumber?.toString()) || undefined,
        name: row.name?.toString().trim() || 'Unknown Student',
        instcode: parseInt(row.instcode?.toString(), 10) || undefined,
        instName: row.instname?.toString().trim(),
        courseName: row.coursename?.toString().trim(),
        branchCode: parseInt(branchCode, 10) || undefined, // Ensure branchCode is number
        branchName: row.br_name?.toString().trim() || 'Unknown Branch',
        subjects,
        totalCredits: subjects.reduce((sum, sub) => sum + sub.credits, 0),
        earnedCredits: subjects.reduce((sum, sub) => sum + (sub.isBacklog ? 0 : sub.credits), 0),
        spi: parseFloat(row.spi?.toString()) || 0,
        cpi: parseFloat(row.cpi?.toString()) || 0,
        cgpa: parseFloat(row.cgpa?.toString()) || undefined,
        result: row.result?.toString().trim() || 'PENDING',
        trials: parseInt(row.trial?.toString(), 10) || 1,
        remark: row.remark?.toString().trim(),
        currentBacklog: parseInt(row.curbackl?.toString(), 10) || 0,
        totalBacklog: parseInt(row.totbackl?.toString(), 10) || 0,
        uploadBatch: uuidv4(), // Generate a new batch ID for this import
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
    const { data: parsedCsvData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, ''),
    });

    if (parseErrors.length > 0) {
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row + 2}: ${e.message} (Code: ${e.code})`).slice(0,5);
      return NextResponse.json({ message: 'Error parsing GTU Results CSV file.', errors: errorMessages, error: `Error parsing GTU Results CSV file. First error: ${errorMessages[0]}` }, { status: 400 });
    }
    if (parsedCsvData.length === 0) {
      return NextResponse.json({ message: 'CSV file is empty or has no data rows.' , error: 'CSV file is empty or has no data rows.'}, { status: 400 });
    }

    const { processedResults, errors: processingErrors } = processGtuResultCsvForApi(parsedCsvData, clientPrograms);
    
    let newCount = 0;
    let updatedCount = 0; // GTU import likely always creates new for simplicity, or updates based on a combination of enrollmentNo & examid
    let skippedCount = processingErrors.length; // Initial skipped are processing errors
    const now = new Date().toISOString();

    for (const resultData of processedResults) {
      // For GTU import, we might decide to always create new records or update if an exact match (e.g., enrollmentNo + examid) exists.
      // Let's assume for now it creates new entries, or updates if enrollmentNo and examid match.
      const existingResultIndex = resultsStore.findIndex(
        (r) => r.enrollmentNo === resultData.enrollmentNo && r.examid === resultData.examid
      );

      if (existingResultIndex !== -1) {
        resultsStore[existingResultIndex] = { ...resultsStore[existingResultIndex], ...resultData, updatedAt: now };
        updatedCount++;
      } else {
        const newResultWithId: Result = {
          _id: `gtu_res_${uuidv4()}`, // Use _id convention
          ...resultData,
          uploadBatch: resultData.uploadBatch || uuidv4(), // Ensure uploadBatch is set
          createdAt: now,
          updatedAt: now,
        };
        resultsStore.push(newResultWithId);
        newCount++;
      }
    }

    (global as any).__API_RESULTS_STORE__ = resultsStore;

    if (processingErrors.length > 0) {
        const finalMessage = `GTU Results import partially completed. New: ${newCount}, Updated: ${updatedCount}, Skipped (due to processing issues): ${skippedCount}.`;
        return NextResponse.json({ 
            message: finalMessage, 
            newCount, 
            updatedCount, 
            skippedCount,
            errors: processingErrors.slice(0,10) // Show some errors
        }, { status: 207 }); // Multi-Status
    }

    return NextResponse.json({ message: 'GTU Results imported successfully.', newCount, updatedCount, skippedCount }, { status: 201 });

  } catch (error) {
    console.error('Critical error during GTU result import process:', error);
    return NextResponse.json({ message: 'Critical error during GTU result import process. Please check server logs.', error: (error as Error).message }, { status: 500 });
  }
}
