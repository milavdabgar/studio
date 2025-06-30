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
import mongoose from 'mongoose';
import { FeedbackAnalysisModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    type: string;
    id: string;
  }>;
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
            // Ensure headers are derived correctly even if some objects miss keys by checking all objects
            const allKeys = new Set<string>();
            data.forEach(row => Object.keys(row).forEach(key => allKeys.add(key)));
            const headers = Array.from(allKeys);
            
            sheet.columns = headers.map(key => ({ header: key, key: key, width: key.toLowerCase().includes('name') || key.toLowerCase().includes('fullname') ? 30 : (key.toLowerCase().includes('code') || key.toLowerCase().includes('initial') ? 15 : 12) }));
            
            sheet.addRows(data.map(row => {
                const newRow: any = {};
                for (const key of headers) { // Iterate over consistent headers
                    if (row[key] !== undefined && row[key] !== null) {
                       if (typeof row[key] === 'number') newRow[key] = parseFloat(row[key].toFixed(2));
                       else newRow[key] = row[key];
                    } else {
                        newRow[key] = ''; // Or null, depending on preference for empty cells
                    }
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
          // If running locally, you may need to provide a path to a local Chromium installation
          // For Firebase/Google Cloud, this attempts to use the one provided by @sparticuz/chromium-min
          // process.env.NODE_ENV === 'development' 
          //  ? "/opt/google/chrome/chrome" // Example local path, adjust as needed
          //  : 
          // Removing specific URL for @sparticuz/chromium-min to use its default discovery/download mechanism.
        );

        const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
            args: [
              ...chromium.args,
              '--disable-web-security',
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage', // Often needed in constrained environments
              '--disable-gpu',           // Can help in environments without a GPU
              '--single-process',        // May reduce resource usage
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath,
            headless: chromium.headless, // Should be 'new' or true for new headless mode
            ignoreHTTPSErrors: true,
        };
        
        console.log("Puppeteer launch options:", JSON.stringify(launchOptions, null, 2));
        browser = await puppeteer.launch(launchOptions);

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
        console.error('Error launching Puppeteer or generating PDF:', error);
        let errorMessage = 'Failed to generate PDF using Puppeteer.';
        if (error instanceof Error) {
            errorMessage += ` Server error: ${error.message}`;
            if (error.message.toLowerCase().includes('libnss3.so') || error.message.toLowerCase().includes('shared librar')) {
                errorMessage += ' This often indicates missing system libraries (like libnss3) in the server environment. Please check your hosting environment dependencies for Puppeteer/Chromium.';
            }
        }
        throw new Error(errorMessage);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
}


export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');

    const { type, id  } = await params;
    const analysisResult = await FeedbackAnalysisModel.findOne({ id });

    if (!analysisResult || !analysisResult.markdownReport) {
      return NextResponse.json({ error: 'Report not found or is incomplete' }, { status: 404 });
    }

    let filename: string;
    let contentType: string;
    let bufferContent: Buffer | string;

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
    console.error('Error generating report:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to generate report. Server error: ' + errorMessage }, { status: 500 });
  }
}
