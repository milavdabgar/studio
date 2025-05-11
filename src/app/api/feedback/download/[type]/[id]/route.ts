// src/app/api/feedback/download/[type]/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { AnalysisResult, SubjectScore, FacultyScore, SemesterScore, BranchScore, TermYearScore } from '@/types/feedback';
import { parse as csvToObjects } from 'papaparse'; // For reading CSV if needed, though we stored raw string
import ExcelJS from 'exceljs';
import puppeteer from 'puppeteer-core'; // Using puppeteer-core
import chromium from '@sparticuz/chromium-min';
import { marked }
from 'marked';
import fs from 'fs';
import path from 'path';

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

async function generateExcelReportBuffer(analysisResult: AnalysisResult): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PolyManager Feedback Analyzer';
    workbook.lastModifiedBy = 'PolyManager Feedback Analyzer';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add Original Data Sheet (if available)
    if (analysisResult.rawFeedbackData) {
        const originalSheet = workbook.addWorksheet('Original Feedback Data');
        const parsedCsv = csvToObjects(analysisResult.rawFeedbackData, { header: true, skipEmptyLines: true });
        if (parsedCsv.data.length > 0) {
            originalSheet.columns = Object.keys(parsedCsv.data[0] as object).map(key => ({ header: key, key: key, width: 15 }));
            originalSheet.addRows(parsedCsv.data);
        }
    }
    
    // Helper to add a sheet from an array of objects
    const addSheetFromData = (sheetName: string, data: any[]) => {
        if (data && data.length > 0) {
            const sheet = workbook.addWorksheet(sheetName);
            sheet.columns = Object.keys(data[0]).map(key => ({ header: key, key: key, width: key.toLowerCase().includes('name') ? 30 : 15 }));
            sheet.addRows(data.map(row => {
                const newRow: any = {};
                for (const key in row) {
                    if (typeof row[key] === 'number') newRow[key] = parseFloat(row[key].toFixed(2));
                    else newRow[key] = row[key];
                }
                return newRow;
            }));
        }
    };

    addSheetFromData('Subject Scores', analysisResult.subject_scores);
    addSheetFromData('Faculty Scores', analysisResult.faculty_scores);
    addSheetFromData('Semester Scores', analysisResult.semester_scores);
    addSheetFromData('Branch Scores', analysisResult.branch_scores);
    addSheetFromData('Term-Year Scores', analysisResult.term_year_scores);
    
    // TODO: Add Correlation Matrix if needed and available in analysisResult.correlation_matrix

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer); // Convert ArrayBuffer to Node.js Buffer
}


async function generatePuppeteerPDFBuffer(markdownContent: string): Promise<Buffer> {
    let browser = null;
    try {
        // Path to local Chromium for development, adjust if needed for deployment
        const executablePath = await chromium.executablePath(
          `https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`
        );

        browser = await puppeteer.launch({
            args: [...chromium.args, '--disable-web-security'], // Added '--disable-web-security'
            defaultViewport: chromium.defaultViewport,
            executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        
        // Read CSS content (assuming github.css is in public/css)
        // Note: In Vercel serverless functions, `process.cwd()` is the root of your project.
        const cssPath = path.join(process.cwd(), 'public', 'css', 'github.css');
        let cssContent = '';
        try {
            cssContent = fs.readFileSync(cssPath, 'utf-8');
        } catch (err) {
            console.warn("Could not read github.css for PDF styling, PDF will be unstyled. Error:", err);
        }
        
        const htmlContent = `
            <html>
            <head>
                <style>${cssContent}</style>
            </head>
            <body class="markdown-body" style="padding: 2cm;"> <!-- Added padding to body -->
                ${await marked(markdownContent)}
            </body>
            </html>
        `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { // Redundant if body padding is used, but good for consistency
                top: '2cm',
                right: '2cm',
                bottom: '2cm',
                left: '2cm'
            }
        });
        return pdfBuffer;
    } catch (error) {
        console.error('Error generating PDF with Puppeteer:', error);
        throw error;
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
}


export async function GET(request: NextRequest, { params }: RouteParams) {
  const { type, id } = params;
  const analysisResult = analysisResultsStore.get(id);

  if (!analysisResult) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  let filename: string;
  let contentType: string;
  let bufferContent: Buffer | string;

  try {
    if (type === 'markdown') {
      filename = `feedback_report_${id}.md`;
      contentType = 'text/markdown; charset=utf-8';
      bufferContent = analysisResult.markdownReport;
    } else if (type === 'excel') {
      filename = `feedback_report_${id}.xlsx`;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      bufferContent = await generateExcelReportBuffer(analysisResult);
    } else if (type === 'pdf' || type === 'puppeteer') {
      filename = `feedback_report_${id}.pdf`;
      contentType = 'application/pdf';
      bufferContent = await generatePuppeteerPDFBuffer(analysisResult.markdownReport);
    } else if (type === 'wkhtml' || type === 'latex') {
      // Fallback: provide markdown for user to convert with their tools
      filename = `feedback_report_for_${type}_${id}.md`;
      contentType = 'text/markdown; charset=utf-8';
      bufferContent = `Please use your local ${type} (via Pandoc) to convert this Markdown file to PDF.\n\n${analysisResult.markdownReport}`;
       return new NextResponse(bufferContent, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    }
    else {
      return NextResponse.json({ error: 'Invalid download type requested' }, { status: 400 });
    }

    return new NextResponse(bufferContent, {
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
