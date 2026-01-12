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
import { ContentConverterV2 } from '@/lib/content-converter-v2';
import { generateNativeLatex } from '@/lib/services/latexGenerator';

interface RouteParams {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

async function generateExcelReportBuffer(analysisResult: AnalysisResult): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GP Palanpur Feedback Analyzer';
  workbook.lastModifiedBy = 'GP Palanpur Feedback Analyzer';
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

  const addSheetFromData = (sheetName: string, data: unknown[]) => {
    if (data && data.length > 0) {
      const sheet = workbook.addWorksheet(sheetName);
      // Ensure headers are derived correctly even if some objects miss keys by checking all objects
      const allKeys = new Set<string>();
      data.forEach(row => Object.keys(row as Record<string, unknown>).forEach(key => allKeys.add(key)));
      const headers = Array.from(allKeys);

      sheet.columns = headers.map(key => ({ header: key, key: key, width: key.toLowerCase().includes('name') || key.toLowerCase().includes('fullname') ? 30 : (key.toLowerCase().includes('code') || key.toLowerCase().includes('initial') ? 15 : 12) }));

      sheet.addRows(data.map(row => {
        const newRow: Record<string, unknown> = {};
        const rowData = row as Record<string, unknown>;
        for (const key of headers) { // Iterate over consistent headers
          if (rowData[key] !== undefined && rowData[key] !== null) {
            if (typeof rowData[key] === 'number') newRow[key] = parseFloat((rowData[key] as number).toFixed(2));
            else newRow[key] = rowData[key];
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
    let executablePath: string | undefined;
    if (process.env.NODE_ENV === 'development') {
      const localPaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
      ];
      for (const p of localPaths) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }
    }

    if (!executablePath) {
      executablePath = await chromium.executablePath();
    }

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
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');

    const { type, id } = await params;
    let analysisResult = await FeedbackAnalysisModel.findOne({ id });

    if (!analysisResult && mongoose.isValidObjectId(id)) {
      analysisResult = await FeedbackAnalysisModel.findById(id);
    }

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
    } else if (type === 'latex') {
      filename = `feedback_report_${id}.pdf`;
      contentType = 'application/pdf';
      try {
        const converter = new ContentConverterV2();
        const pdfBuffer = await converter.convert(analysisResult.markdownReport, 'pdf-pandoc', {
          title: `Feedback Analysis Report - ${id}`,
          author: 'GP Palanpur Feedback System'
        });
        bufferContent = pdfBuffer as Buffer;
      } catch (err) {
        console.error('LaTeX conversion failed:', err);
        // Fallback to markdown instructions if conversion fails
        filename = `feedback_report_latex_conversion_instructions_${id}.md`;
        contentType = 'text/markdown; charset=utf-8';
        bufferContent = `## Instructions for PDF Generation via LaTeX\n\n(Server-side conversion failed: ${err instanceof Error ? err.message : String(err)})\n\nThis Markdown file contains your feedback report. To generate a PDF using LaTeX, please use Pandoc on your local machine.\n\n\`\`\`bash\npandoc -s feedback_report_${id}.md -o feedback_report_${id}.pdf --pdf-engine=xelatex\n\`\`\`\n\n---\n\n${analysisResult.markdownReport}`;
      }
    } else if (type === 'latex-native') {
      filename = `feedback_report_${id}.tex`;
      contentType = 'application/x-latex; charset=utf-8';
      bufferContent = await generateNativeLatex(analysisResult);
    } else if (type === 'latex-native-pdf') {
      filename = `feedback_report_${id}.pdf`;
      contentType = 'application/pdf';
      try {
        const latexSource = await generateNativeLatex(analysisResult);
        const converter = new ContentConverterV2();
        bufferContent = await converter.compileLatex(latexSource);
      } catch (err) {
        console.error('Native LaTeX compilation failed:', err);
        filename = `error_log_${id}.txt`;
        contentType = 'text/plain';
        bufferContent = `Failed to generate PDF from native LaTeX.\nError: ${err instanceof Error ? err.message : String(err)}`;
      }
    } else if (type === 'wkhtml') {
      filename = `feedback_report_for_${type}_conversion_${id}.md`;
      contentType = 'text/markdown; charset=utf-8';
      bufferContent = `## Instructions for PDF Generation via ${type.toUpperCase()}
 
 This Markdown file contains your feedback report. To generate a PDF using ${type.toUpperCase()}, please use Pandoc or a similar tool on your local machine.
 
 **Example Pandoc command (for wkhtmltopdf):**
 \`\`\`bash
 pandoc -s ${filename} -o feedback_report_${id}.pdf --pdf-engine=wkhtmltopdf --css=path/to/your/github.css --toc -N --shift-heading-level-by=-1
 \`\`\`
 
 ---
 
 ${analysisResult.markdownReport}`;
    } else {
      return NextResponse.json({ error: 'Invalid download type requested' }, { status: 400 });
    }

    return new NextResponse(bufferContent as BodyInit, {
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
