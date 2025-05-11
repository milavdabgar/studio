import { NextResponse, type NextRequest } from 'next/server';
import type { Result, BranchAnalysis } from '@/types/entities';

declare global {
  var __API_RESULTS_STORE__: Result[] | undefined;
}
if (!global.__API_RESULTS_STORE__) {
  global.__API_RESULTS_STORE__ = [];
}
const resultsStore: Result[] = global.__API_RESULTS_STORE__;

export async function GET(request: NextRequest) {
  if (!Array.isArray(global.__API_RESULTS_STORE__)) {
    global.__API_RESULTS_STORE__ = [];
    return NextResponse.json({ message: 'Result data store corrupted.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const academicYearFilter = searchParams.get('academicYear');
  const examidFilter = searchParams.get('examid');

  let filteredResults = [...resultsStore];
  if (academicYearFilter) {
    filteredResults = filteredResults.filter(r => r.academicYear === academicYearFilter);
  }
  if (examidFilter && !isNaN(parseInt(examidFilter))) {
    filteredResults = filteredResults.filter(r => r.examid === parseInt(examidFilter));
  }

  const analysisMap: Map<string, BranchAnalysis & { spiSum: number, cpiSum: number, spiCount: number, cpiCount: number }> = new Map();

  filteredResults.forEach(result => {
    const key = `${result.branchName}-${result.semester}`;
    if (!analysisMap.has(key)) {
      analysisMap.set(key, {
        _id: { branchName: result.branchName, semester: result.semester },
        totalStudents: 0,
        passCount: 0,
        distinctionCount: 0,
        firstClassCount: 0,
        secondClassCount: 0,
        passPercentage: 0,
        avgSpi: 0,
        avgCpi: 0,
        spiSum: 0,
        cpiSum: 0,
        spiCount: 0,
        cpiCount: 0,
      });
    }
    const entry = analysisMap.get(key)!;
    entry.totalStudents++;
    if (result.result?.toUpperCase() === 'PASS') entry.passCount++;
    if (result.spi >= 8.5) entry.distinctionCount++;
    else if (result.spi >= 7.0) entry.firstClassCount++;
    else if (result.spi >= 6.0) entry.secondClassCount++;
    
    if (result.spi !== undefined && result.spi !== null) {
        entry.spiSum += result.spi;
        entry.spiCount++;
    }
    if (result.cpi !== undefined && result.cpi !== null) {
        entry.cpiSum += result.cpi;
        entry.cpiCount++;
    }
  });

  const analysis: BranchAnalysis[] = Array.from(analysisMap.values()).map(entry => {
    const { spiSum, cpiSum, spiCount, cpiCount, ...rest } = entry; // Exclude sum and count fields
    return {
      ...rest,
      passPercentage: entry.totalStudents > 0 ? (entry.passCount / entry.totalStudents) * 100 : 0,
      avgSpi: spiCount > 0 ? spiSum / spiCount : 0,
      avgCpi: cpiCount > 0 ? cpiSum / cpiCount : 0,
    };
  }).sort((a,b) => {
      if (a._id.branchName < b._id.branchName) return -1;
      if (a._id.branchName > b._id.branchName) return 1;
      return a._id.semester - b._id.semester;
  });

  return NextResponse.json({ status: 'success', data: { analysis } });
}
