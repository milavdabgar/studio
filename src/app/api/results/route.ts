import { NextResponse, type NextRequest } from 'next/server';
import type { Result, ResultFilterParams } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';
import { connectMongoose } from '@/lib/mongodb';
import { ResultModel } from '@/lib/models';

// Initialize default results if none exist
async function initializeDefaultResults() {
  await connectMongoose();
  const resultCount = await ResultModel.countDocuments();
  
  if (resultCount === 0) {
    const now = new Date().toISOString();
    const defaultResults = [
      {
          st_id: "220010107001",
          studentId: "std_ce_001_gpp",
          enrollmentNo: "220010107001",
          name: "DOE JOHN MICHAEL",
          branchName: "Computer Engineering",
          semester: 1,
          exam: "Winter 2023 Regular",
          examid: 12345,
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
    
    await ResultModel.insertMany(defaultResults);
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    await initializeDefaultResults();
    
    const { searchParams } = new URL(request.url);
    const filters: ResultFilterParams = {};
    searchParams.forEach((value, key) => {
      if (key === 'page' || key === 'limit' || key === 'semester' || key === 'examid' ) {
          filters[key] = parseInt(value, 10);
      } else if (key === 'uploadBatch' || key === 'branchName' || key === 'academicYear' || key === 'examId' || key === 'studentId') { 
          filters[key] = value;
      }
    });

    // Build MongoDB query
    const query: Record<string, unknown> = {};
    if (filters.branchName) query.branchName = filters.branchName;
    if (filters.semester) query.semester = filters.semester;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.examid) query.examid = filters.examid;
    if (filters.examId) query.examid = parseInt(filters.examId!);
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.uploadBatch) query.uploadBatch = filters.uploadBatch;
    
    const page = filters.page || 1;
    const limit = filters.limit || 100;
    const skip = (page - 1) * limit;
    
    const [results, total] = await Promise.all([
      ResultModel.find(query).skip(skip).limit(limit).lean(),
      ResultModel.countDocuments(query)
    ]);

    return NextResponse.json({
      status: 'success',
      data: {
        results,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1,
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/results:', error);
    return NextResponse.json({ message: 'Internal server error processing results request.' }, { status: 500 });
  }
}




export async function POST(request: NextRequest) { 
  try {
    await connectMongoose();
    
    const resultDataToCreate = await request.json() as Omit<Result, '_id' | 'createdAt' | 'updatedAt'>;

    if (!resultDataToCreate.studentId || !resultDataToCreate.enrollmentNo || !resultDataToCreate.examid || !resultDataToCreate.subjects || resultDataToCreate.subjects.length === 0) {
        return NextResponse.json({ message: 'Student ID, Enrollment No, Examination ID, and at least one subject result are required.' }, { status: 400 });
    }

    const existingResult = await ResultModel.findOne({
      studentId: resultDataToCreate.studentId,
      examid: resultDataToCreate.examid
    });

    const currentTimestamp = new Date().toISOString();

    if (existingResult) {
      // Update existing result
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

      const updatedResult = await ResultModel.findByIdAndUpdate(
        existingResult._id,
        {
          ...resultDataToCreate,
          subjects: updatedSubjects,
          totalCredits,
          earnedCredits,
          spi: updatedSPI,
          cpi: updatedCPI,
          updatedAt: currentTimestamp,
        },
        { new: true }
      );

      return NextResponse.json(updatedResult, { status: 200 });

    } else {
      // Create new Result document
      const newResultData = {
        ...resultDataToCreate,
        st_id: resultDataToCreate.st_id || resultDataToCreate.enrollmentNo,
        uploadBatch: resultDataToCreate.uploadBatch || uuidv4(),
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      };
      
      const newResult = new ResultModel(newResultData);
      await newResult.save();
      
      return NextResponse.json(newResult.toJSON(), { status: 201 });
    }

  } catch (error) {
    console.error('Critical error during result entry or update:', error);
    return NextResponse.json({ message: 'Critical error processing result data. Please check server logs.' }, { status: 500 });
  }
}
