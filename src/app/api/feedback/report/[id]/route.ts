// src/app/api/feedback/report/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { AnalysisResult } from '@/types/feedback';

declare global {
  // eslint-disable-next-line no-var
  var __API_FEEDBACK_ANALYSIS_RESULTS_STORE__: Map<string, AnalysisResult> | undefined;
}

// Ensure the store is initialized
if (!global.__API_FEEDBACK_ANALYSIS_RESULTS_STORE__) {
  global.__API_FEEDBACK_ANALYSIS_RESULTS_STORE__ = new Map<string, AnalysisResult>();
}
const analysisResultsStore: Map<string, AnalysisResult> = global.__API_FEEDBACK_ANALYSIS_RESULTS_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const result = analysisResultsStore.get(id);

  if (!result) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }
  return NextResponse.json(result);
}