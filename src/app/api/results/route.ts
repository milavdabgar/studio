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
        studentId: "std_ce_001_gpp", // Added studentId
        enrollmentNo: "220010107001",
        name: "DOE JOHN MICHAEL",
        branchName: "Computer Engineering",
        semester: 1,
        exam: "Winter 2023 Regular",
        examid: 12345, // Example examid
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
    } else if (key === 'uploadBatch' || key === 'branchName' || key === 'academicYear' || key === 'examId' || key === 'studentId') { 
        filters[key] = value;
    }
  });

  let filteredResults = [...resultsStore];
  if (filters.branchName) filteredResults = filteredResults.filter(r => r.branchName === filters.branchName);
  if (filters.semester) filteredResults = filteredResults.filter(r => r.semester === filters.semester);
  if (filters.academicYear) filteredResults = filteredResults.filter(r => r.academicYear === filters.academicYear);
  if (filters.examid) filteredResults = filteredResults.filter(r => r.examid === filters.examid); 
  if (filters.examId) filteredResults = filteredResults.filter(r => r.examid === parseInt(filters.examId!)); 
  if (filters.studentId) filteredResults = filteredResults.filter(r => r.studentId === filters.studentId);
  if (filters.uploadBatch) filteredResults = filteredResults.filter(r => r.uploadBatch === filters.uploadBatch);
  
  const page = filters.page || 1;
  const limit = filters.limit || 100; 
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
        pages: Math.ceil(total / limit) || 1,
      }
    }
  });
}

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
      let i = 1;
      while (row[`subjectcode${i}`] || row[`subjectname${i}`]) { 
        const code = row[`subjectcode${i}`]?.toString().trim();
        const name = row[`subjectname${i}`]?.toString().trim();
        const creditsStr = row[`subjectcredits${i}`]?.toString().trim();
        const grade = row[`subjectgrade${i}`]?.toString().trim().toUpperCase();

        if (!code || !name) { 
            if(code || name || creditsStr || grade) { 
                 processingErrors.push({ row: index + 2, message: `Incomplete data for Subject ${i}. Code and Name are required.`, data: row });
            }
            i++; 
            continue; 
        }
        
        const credits = creditsStr && !isNaN(parseFloat(creditsStr)) ? parseFloat(creditsStr) : 0;
        const isBacklog = grade === 'FF';
        
        subjects.push({
          code, name, credits, grade, isBacklog,
        });
        i++;
      }
      
      const resultEntry: Omit<Result, '_id' | 'createdAt' | 'updatedAt'> = {
        st_id: enrollmentNo, 
        enrollmentNo,
        exam: row.examname?.toString().trim() || 'Standard Exam', 
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
        examid: row.examid ? parseInt(row.examid.toString(), 10) : undefined, 
        programId: row.programid?.toString().trim() || undefined, 
        studentId: row.studentid?.toString().trim() || `std_${enrollmentNo}`, // Generate a studentId if not provided
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
    const resultDataToCreate = await request.json() as Omit<Result, '_id' | 'createdAt' | 'updatedAt'>;

    if (!resultDataToCreate.studentId || !resultDataToCreate.enrollmentNo || !resultDataToCreate.examid || !resultDataToCreate.subjects || resultDataToCreate.subjects.length === 0) {
        return NextResponse.json({ message: 'Student ID, Enrollment No, Examination ID, and at least one subject result are required.' }, { status: 400 });
    }

    const existingResultIndex = resultsStore.findIndex(
      r => r.studentId === resultDataToCreate.studentId && r.examid === resultDataToCreate.examid
    );

    const currentTimestamp = new Date().toISOString();

    if (existingResultIndex !== -1) {
      const existingResult = resultsStore[existingResultIndex];
      const updatedSubjects = [...existingResult.subjects];

      resultDataToCreate.subjects.forEach(newSub => {
          const subIndex = updatedSubjects.findIndex(s => s.code === newSub.code);
          if (subIndex !== -1) {
              updatedSubjects[subIndex] = { ...updatedSubjects[subIndex], ...newSub };
          } else {
              updatedSubjects.push(newSub);
          }
      });
      
      const totalCredits = updatedSubjects.reduce((sum, sub) => sum + (sub.credits || 0), 0);
      const earnedCredits = updatedSubjects.reduce((sum, sub) => sum + (!sub.isBacklog && sub.credits ? sub.credits : 0), 0);
      const updatedSPI = resultDataToCreate.spi !== undefined ? resultDataToCreate.spi : existingResult.spi;
      const updatedCPI = resultDataToCreate.cpi !== undefined ? resultDataToCreate.cpi : existingResult.cpi;


      resultsStore[existingResultIndex] = {
        ...existingResult,
        ...resultDataToCreate, 
        subjects: updatedSubjects,
        totalCredits,
        earnedCredits,
        spi: updatedSPI,
        cpi: updatedCPI,
        updatedAt: currentTimestamp,
      };
      global.__API_RESULTS_STORE__ = resultsStore;
      return NextResponse.json(resultsStore[existingResultIndex], { status: 200 });

    } else {
      // Create new Result document
      const newResult: Result = {
        _id: `res_${uuidv4()}`,
        ...resultDataToCreate,
        st_id: resultDataToCreate.st_id || resultDataToCreate.enrollmentNo, // Default st_id if not provided
        uploadBatch: resultDataToCreate.uploadBatch || uuidv4(),
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      };
      resultsStore.push(newResult);
      global.__API_RESULTS_STORE__ = resultsStore;
      return NextResponse.json(newResult, { status: 201 });
    }

  } catch (error) {
    console.error('Critical error during result entry or update:', error);
    return NextResponse.json({ message: 'Critical error processing result data. Please check server logs.', error: (error as Error).message }, { status: 500 });
  }
}
