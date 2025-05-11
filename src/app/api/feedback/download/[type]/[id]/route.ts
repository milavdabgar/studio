// src/app/api/feedback/download/[type]/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { AnalysisResult } from '@/types/feedback';
import { parse as csvToObjects } from 'papaparse';
import ExcelJS from 'exceljs';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { marked } from 'marked';
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

    if (analysisResult.rawFeedbackData) {
        const originalSheet = workbook.addWorksheet('Original Feedback Data');
        const parsedCsv = csvToObjects(analysisResult.rawFeedbackData, { header: true, skipEmptyLines: true });
        if (parsedCsv.data.length > 0) {
            originalSheet.columns = Object.keys(parsedCsv.data[0] as object).map(key => ({ header: key, key: key, width: 15 }));
            originalSheet.addRows(parsedCsv.data);
        }
    }
    
    const addSheetFromData = (sheetName: string, data: any[]) => {
        if (data && data.length > 0) {
            const sheet = workbook.addWorksheet(sheetName);
            const headers = Object.keys(data[0] || {});
            sheet.columns = headers.map(key => ({ header: key, key: key, width: key.toLowerCase().includes('name') || key.toLowerCase().includes('fullname') ? 30 : (key.toLowerCase().includes('code') ? 15 : 12) }));
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
    
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}


async function generatePuppeteerPDFBuffer(markdownContent: string): Promise<Buffer> {
    let browser = null;
    try {
        const executablePath = await chromium.executablePath(
          `https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`
        );

        browser = await puppeteer.launch({
            args: [...chromium.args, '--disable-web-security', '--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: chromium.defaultViewport,
            executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        
        const cssPath = path.join(process.cwd(), 'public', 'css', 'github.css');
        let cssContent = '';
        try {
            cssContent = fs.readFileSync(cssPath, 'utf-8');
        } catch (err) {
            console.warn("Could not read github.css for PDF styling, PDF will be unstyled. Error:", err);
        }
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>${cssContent}</style>
            </head>
            <body class="markdown-body" style="padding: 2cm; font-family: sans-serif;">
                ${await marked(markdownContent)}
            </body>
            </html>
        `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
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

  if (!analysisResult || !analysisResult.markdownReport) {
    return NextResponse.json({ error: 'Report not found or is incomplete' }, { status: 404 });
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
      // Provide markdown and instruct user to convert locally due to server-side complexity
      filename = `feedback_report_for_${type}_conversion_${id}.md`;
      contentType = 'text/markdown; charset=utf-8';
      bufferContent = `## Instructions for PDF Generation via ${type.toUpperCase()}

This Markdown file contains your feedback report. To generate a PDF using ${type.toUpperCase()}, please use Pandoc or a similar tool on your local machine.

**Example Pandoc command (for wkhtmltopdf):**
\`\`\`bash
pandoc -s ${filename} -o feedback_report_${id}.pdf --pdf-engine=wkhtmltopdf --css=path/to/your/github.css --toc -N --shift-heading-level-by=-1
\`\`\`

**Example Pandoc command (for LaTeX/XeLaTeX):**
\`\`\`bash
pandoc -s ${filename} -o feedback_report_${id}.pdf --pdf-engine=xelatex -N --shift-heading-level-by=-1
\`\`\`
(Ensure you have a LaTeX distribution like MiKTeX, TeX Live, or MacTeX installed for LaTeX conversion.)

---

${analysisResult.markdownReport}`;
    } else {
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
    // Log the full error for server-side debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "No stack available";
    console.error(`Full error: ${errorMessage}\nStack: ${errorStack}`);
    
    return NextResponse.json({ error: `Failed to generate ${type} report. Server error: ${errorMessage}` }, { status: 500 });
  }
}

