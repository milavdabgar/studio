import { NextResponse, type NextRequest } from 'next/server';
import type { Result, ResultFilterParams, ResultSubject } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

declare global {
  var __API_RESULTS_STORE__: Result[] | undefined;
}

const now = new Date().toISOString();

if (!global.__API_RESULTS_STORE__) {
  global.__API_RESULTS_STORE__ = [
    {
        _id: "res_gpp_22001_s1",
        st_id: "220010107001",
        enrollmentNo: "220010107001",
        name: "DOE JOHN MICHAEL",
        branchName: "Computer Engineering",
        semester: 1,
        exam: "Winter 2023 Regular",
        subjects: [
            { code: "CS101", name: "Intro to C", credits: 4, grade: "AA", isBacklog: false, theoryEseGrade: "AA" },
            { code: "MA101", name: "Maths 1", credits: 3, grade: "AB", isBacklog: false, theoryEseGrade: "AB" },
        ],
        spi: 9.5,
        cpi: 9.5,
        result: "PASS",
        uploadBatch: "batch_initial_data_gpp",
        createdAt: now,
        updatedAt: now,
        totalCredits: 7,
        earnedCredits: 7,
    },
  ];
}
let resultsStore: Result[] = global.__API_RESULTS_STORE__;

export async function GET(request: NextRequest) {
  if (!Array.isArray(global.__API_RESULTS_STORE__)) {
    global.__API_RESULTS_STORE__ = [];
    return NextResponse.json({ message: 'Internal server error: Result data store corrupted.' }, { status: 500 });
  }
  
  const { searchParams } = new URL(request.url);
  const filters: ResultFilterParams = {};
  searchParams.forEach((value, key) => {
    if (key === 'page' || key === 'limit' || key === 'semester' || key === 'examid' ) {
        filters[key] = parseInt(value, 10);
    } else if (key === 'uploadBatch' || key === 'branchName' || key === 'academicYear') {
        filters[key] = value;
    }
  });

  let filteredResults = [...resultsStore];
  if (filters.branchName) filteredResults = filteredResults.filter(r => r.branchName === filters.branchName);
  if (filters.semester) filteredResults = filteredResults.filter(r => r.semester === filters.semester);
  if (filters.academicYear) filteredResults = filteredResults.filter(r => r.academicYear === filters.academicYear);
  if (filters.examid) filteredResults = filteredResults.filter(r => r.examid === filters.examid);
  if (filters.uploadBatch) filteredResults = filteredResults.filter(r => r.uploadBatch === filters.uploadBatch);
  
  const page = filters.page || 1;
  const limit = filters.limit || 100; // Default limit if not specified for GET all
  const total = filteredResults.length;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  return NextResponse.json({
    status: 'success',
    data: {
      results: paginatedResults,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }
    }
  });
}

// Standard CSV Import (adapted from reference/result.controller.ts processGtuResultCsv)
const processStandardResultCsv = (rows: any[]): { processedResults: Omit<Result, '_id' | 'createdAt' | 'updatedAt'>[], errors: any[] } => {
  const processedResults: Omit<Result, '_id' | 'createdAt' | 'updatedAt'>[] = [];
  const processingErrors: any[] = [];

  rows.forEach((row, index) => {
    try {
      const enrollmentNo = row.enrollmentnumber?.toString().trim();
      if (!enrollmentNo) {
        processingErrors.push({ row: index + 2, message: `Missing EnrollmentNumber.`, data: row });
        return;
      }

      const subjects: ResultSubject[] = [];
      // Assuming subjects are like SubjectCode1_Marks, SubjectCode1_Grade, etc.
      let i = 1;
      while (row[`subjectcode${i}_marks`] || row[`subjectcode${i}_grade`]) {
        const marksStr = row[`subjectcode${i}_marks`]?.toString().trim();
        const grade = row[`subjectcode${i}_grade`]?.toString().trim().toUpperCase();
        const code = row[`subjectcode${i}`]?.toString().trim() || `SUB${i}`; // Fallback if no explicit code
        const name = row[`subjectname${i}`]?.toString().trim() || `Subject ${i}`; // Fallback
        const credits = parseFloat(row[`subjectcredits${i}`]?.toString()) || 0; // Assume credits column

        if (!grade && !marksStr) { i++; continue; } // Skip if no grade or marks for this subject

        const isBacklog = grade === 'FF';
        
        subjects.push({
          code, name, credits, grade, isBacklog,
          // Assuming marks are provided if grades are not the primary source
          // Add more specific grade components if your standard CSV includes them.
        });
        i++;
      }
      
      const resultEntry: Omit<Result, '_id' | 'createdAt' | 'updatedAt'> = {
        st_id: enrollmentNo, // Use enrollmentNo as st_id if st_id not provided
        enrollmentNo,
        exam: row.examname?.toString().trim() || 'Standard Exam', // Example
        semester: parseInt(row.semester?.toString(), 10) || 0,
        name: row.studentname?.toString().trim() || 'Unknown Student',
        branchName: row.branchname?.toString().trim() || 'Unknown Branch',
        subjects,
        totalCredits: subjects.reduce((sum, sub) => sum + sub.credits, 0),
        earnedCredits: subjects.reduce((sum, sub) => sum + (sub.isBacklog ? 0 : sub.credits), 0),
        spi: parseFloat(row.spi?.toString()) || 0,
        cpi: parseFloat(row.cpi?.toString()) || 0,
        result: row.overallresult?.toString().trim().toUpperCase() || 'PENDING',
        uploadBatch: uuidv4(), 
        academicYear: row.academicyear?.toString().trim(),
      };
      processedResults.push(resultEntry);
    } catch (e) {
        processingErrors.push({row: index + 2, message: `Error processing row: ${(e as Error).message}`, data: row});
    }
  });
  return { processedResults, errors: processingErrors };
};


export async function POST(request: NextRequest) { // Standard Import
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.', error: 'No file uploaded.' }, { status: 400 });
    }

    const fileText = await file.text();
    const { data: parsedCsvData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, ''),
    });

    if (parseErrors.length > 0) {
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row + 2}: ${e.message}`).slice(0,5);
      return NextResponse.json({ message: 'Error parsing Standard Results CSV file.', errors: errorMessages, error: `Error parsing CSV. First error: ${errorMessages[0]}` }, { status: 400 });
    }
     if (parsedCsvData.length === 0) {
      return NextResponse.json({ message: 'CSV file is empty or has no data rows.', error: 'CSV file is empty.' }, { status: 400 });
    }

    const { processedResults, errors: processingErrors } = processStandardResultCsv(parsedCsvData);
    
    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = processingErrors.length;
    const now = new Date().toISOString();

    for (const resultData of processedResults) {
      const existingResultIndex = resultsStore.findIndex(
        (r) => r.enrollmentNo === resultData.enrollmentNo && r.exam === resultData.exam && r.semester === resultData.semester
      );

      if (existingResultIndex !== -1) {
        resultsStore[existingResultIndex] = { ...resultsStore[existingResultIndex], ...resultData, updatedAt: now };
        updatedCount++;
      } else {
        const newResultWithId: Result = {
          _id: `std_res_${uuidv4()}`, // Use _id convention
          ...resultData,
          uploadBatch: resultData.uploadBatch || uuidv4(),
          createdAt: now,
          updatedAt: now,
        };
        resultsStore.push(newResultWithId);
        newCount++;
      }
    }

    (global as any).__API_RESULTS_STORE__ = resultsStore;

    if (processingErrors.length > 0) {
        const finalMessage = `Standard Results import partially completed. New: ${newCount}, Updated: ${updatedCount}, Skipped (processing issues): ${skippedCount}.`;
        return NextResponse.json({ 
            message: finalMessage, 
            batchId: newCount > 0 || updatedCount > 0 ? processedResults[0]?.uploadBatch : null, // Return a batchId if anything was processed
            importedCount: newCount + updatedCount,
            totalRows: parsedCsvData.length,
            error: `Processing errors occurred. First error: ${processingErrors[0]?.message || 'Unknown processing error'}`,
            errors: processingErrors.slice(0,10)
        }, { status: 207 }); // Multi-Status
    }

    return NextResponse.json({
      status: 'success',
      data: {
        batchId: processedResults[0]?.uploadBatch, // Return batchId of the first processed result
        importedCount: newCount + updatedCount,
        totalRows: parsedCsvData.length
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Critical error during standard result import:', error);
    return NextResponse.json({ message: 'Critical error during standard result import. Please check server logs.', error: (error as Error).message }, { status: 500 });
  }
}
