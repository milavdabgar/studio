import { NextResponse, type NextRequest } from 'next/server';
import type { Result, ResultFilterParams, ResultSubject } from '@/types/entities';
import { Parser } from 'json2csv';
import { ResultModel } from '@/lib/models';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ message: 'Database connection failed.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const filters: ResultFilterParams = {};
  searchParams.forEach((value, key) => {
    if (key === 'semester' || key === 'examid') { // Assuming these are numeric
        filters[key] = parseInt(value, 10);
    } else if (key === 'branchName' || key === 'academicYear' || key === 'uploadBatch') {
        filters[key] = value;
    }
  });

  try {
    // Build MongoDB query from filters
    const query: any = {};
    if (filters.branchName) query.branchName = filters.branchName;
    if (filters.semester) query.semester = filters.semester;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.examid) query.examid = filters.examid;
    if (filters.uploadBatch) query.uploadBatch = filters.uploadBatch;

    const filteredResults = await ResultModel.find(query).lean();

    if (filteredResults.length === 0) {
      return NextResponse.json({ message: 'No results to export for the given filters.' }, { status: 404 });
    }

    const csvData = filteredResults.map(result => {
      const flatResult: any = {
        st_id: result.st_id,
        enrollmentNo: result.enrollmentNo,
        extype: result.extype,
        examid: result.examid,
        exam: result.exam,
        declarationDate: result.declarationDate ? new Date(result.declarationDate).toISOString().split('T')[0] : '',
        academicYear: result.academicYear,
        semester: result.semester,
        name: result.name,
        instcode: result.instcode,
        instName: result.instName,
        branchName: result.branchName,
        branchCode: result.branchCode,
        spi: result.spi,
        cpi: result.cpi,
        cgpa: result.cgpa,
        result: result.result,
        trials: result.trials,
        remark: result.remark,
        currentBacklog: result.currentBacklog,
        totalBacklog: result.totalBacklog,
        uploadBatch: result.uploadBatch,
      };

      result.subjects.forEach((subject: ResultSubject, index: number) => {
        const i = index + 1;
        flatResult[`SUB${i}`] = subject.code;
        flatResult[`SUB${i}NA`] = subject.name;
        flatResult[`SUB${i}CR`] = subject.credits;
        flatResult[`SUB${i}GR`] = subject.grade;
        flatResult[`SUB${i}GRE`] = subject.theoryEseGrade || '';
        flatResult[`SUB${i}GRM`] = subject.theoryPaGrade || '';
        flatResult[`SUB${i}GRTH`] = subject.theoryTotalGrade || '';
        flatResult[`SUB${i}GRI`] = subject.practicalPaGrade || '';
        flatResult[`SUB${i}GRV`] = subject.practicalVivaGrade || '';
        flatResult[`SUB${i}GRPR`] = subject.practicalTotalGrade || '';
        flatResult[`BCK${i}`] = subject.isBacklog ? 1 : 0; // Represent boolean as 0/1 for CSV if needed
      });
      return flatResult;
    });
    
    // Determine fields dynamically from the first processed result, or a predefined set if complex
    const fields = csvData.length > 0 ? Object.keys(csvData[0]) : [];
    
    try {
      const parser = new Parser({ fields });
      const csv = parser.parse(csvData);
      
      const headers = new Headers();
      headers.append('Content-Type', 'text/csv');
      headers.append('Content-Disposition', `attachment; filename="results_export_${new Date().toISOString().split('T')[0]}.csv"`);
      
      return new NextResponse(csv, { headers });
    } catch (err) {
      console.error('Error generating CSV:', err);
      return NextResponse.json({ message: 'Error generating CSV export.', error: (err as Error).message }, { status: 500 });
    }
  } catch (error) {
    console.error('Error exporting results:', error);
    return NextResponse.json({ message: 'Error exporting results.', error: (error as Error).message }, { status: 500 });
  }
}
