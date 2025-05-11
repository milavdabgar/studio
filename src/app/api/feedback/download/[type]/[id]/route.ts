// src/app/api/feedback/download/[type]/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { AnalysisResult, SubjectScore } from '@/types/feedback';
import { parse } from 'papaparse'; // For converting JSON to CSV

declare global {
  // eslint-disable-next-line no-var
  var __API_FEEDBACK_ANALYSIS_RESULTS_STORE__: Map<string, AnalysisResult> | undefined;
}

if (!global.__API_FEEDBACK_ANALYSIS_RESULTS_STORE__) {
  global.__API_FEEDBACK_ANALYSIS_RESULTS_STORE__ = new Map<string, AnalysisResult>();
}
const analysisResultsStore: Map<string, AnalysisResult> = global.__API_FEEDBACK_ANALYSIS_RESULTS_STORE__;

interface RouteParams {
  params: {
    type: string;
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { type, id } = params;
  const analysisResult = analysisResultsStore.get(id);

  if (!analysisResult) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  let filename: string;
  let contentType: string;
  let content: string;

  try {
    if (type === 'markdown' || type === 'pdf') { // Simplified PDF to return markdown
      filename = `feedback_report_${id}.md`;
      contentType = 'text/markdown; charset=utf-8';
      content = analysisResult.markdownReport;
    } else if (type === 'excel') { // Simplified Excel to return CSV of subject scores
      filename = `feedback_subject_scores_${id}.csv`;
      contentType = 'text/csv; charset=utf-8';
      if (analysisResult.subject_scores && analysisResult.subject_scores.length > 0) {
        // Convert subject_scores to CSV
        const dataToConvert = analysisResult.subject_scores.map(score => ({
          Subject_Code: score.Subject_Code,
          Subject_FullName: score.Subject_FullName,
          Faculty_Name: score.Faculty_Name,
          Faculty_Initial: score.Faculty_Initial,
          Subject_ShortForm: score.Subject_ShortForm,
          Q1: score.Q1.toFixed(2),
          Q2: score.Q2.toFixed(2),
          Q3: score.Q3.toFixed(2),
          Q4: score.Q4.toFixed(2),
          Q5: score.Q5.toFixed(2),
          Q6: score.Q6.toFixed(2),
          Q7: score.Q7.toFixed(2),
          Q8: score.Q8.toFixed(2),
          Q9: score.Q9.toFixed(2),
          Q10: score.Q10.toFixed(2),
          Q11: score.Q11.toFixed(2),
          Q12: score.Q12.toFixed(2),
          Overall_Score: score.Score.toFixed(2),
        }));
        content = parse(dataToConvert, { header: true });
      } else {
        content = "No subject scores available to export.";
      }
    } else {
      return NextResponse.json({ error: 'Invalid download type requested' }, { status: 400 });
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error(`Error generating ${type} report for ${id}:`, error);
    return NextResponse.json({ error: `Failed to generate ${type} report`, details: (error as Error).message }, { status: 500 });
  }
}