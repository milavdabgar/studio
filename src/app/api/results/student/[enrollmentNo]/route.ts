import { NextResponse, type NextRequest } from 'next/server';
import type { Result } from '@/types/entities';

declare global {
  var __API_RESULTS_STORE__: Result[] | undefined;
}
if (!global.__API_RESULTS_STORE__) {
  global.__API_RESULTS_STORE__ = [];
}
const resultsStore: Result[] = global.__API_RESULTS_STORE__;

interface RouteParams {
  params: Promise<{
    enrollmentNo: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { enrollmentNo  } = await params;
  if (!Array.isArray(global.__API_RESULTS_STORE__)) {
    global.__API_RESULTS_STORE__ = [];
    return NextResponse.json({ message: 'Result data store corrupted.' }, { status: 500 });
  }
  
  const studentResults = global.__API_RESULTS_STORE__.filter(r => r.enrollmentNo === enrollmentNo)
    .sort((a, b) => (a.semester - b.semester) || ((a.examid || 0) - (b.examid || 0)));
  
  if (studentResults.length > 0) {
    return NextResponse.json({ status: 'success', data: { results: studentResults }});
  }
  return NextResponse.json({ status: 'success', data: { results: [] }, message: 'No results found for this student.' });
}
