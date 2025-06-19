import { NextRequest, NextResponse } from 'next/server';
import { ContentConverterV2 } from '@/lib/content-converter-v2';
import fs from 'fs';
import path from 'path';

// Import Puppeteer for direct HTML to PDF conversion
let puppeteer: any;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.log('Puppeteer not available, PDF generation will be limited');
}

// Simple HTML to Markdown conversion for basic export
function htmlToSimpleMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
    .trim();
}

// Direct HTML to PDF conversion using Puppeteer
async function generatePdfFromHtml(htmlContent: string, options: any): Promise<Buffer> {
  if (!puppeteer) {
    throw new Error('Puppeteer is not available for PDF generation');
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
      ]
    });

    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 1
    });

    // Set the HTML content
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      printBackground: true,
      margin: options.margin || {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      preferCSSPageSize: true
    });

    return Buffer.from(pdfBuffer);

  } catch (error: any) {
    console.error('PDF generation error:', error);
    throw new Error(`PDF generation failed: ${error.message || error}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      htmlContent, 
      format = 'pdf',
      title = 'Newsletter',
      filename = 'newsletter'
    } = await request.json();

    if (!htmlContent) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    // Create a temporary HTML file
    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempHtmlPath = path.join(tempDir, `${filename}-${Date.now()}.html`);
    fs.writeFileSync(tempHtmlPath, htmlContent);

    try {
      let result: Buffer | string;
      let contentType: string;
      let fileExtension: string;

      const converter = new ContentConverterV2();

      switch (format.toLowerCase()) {
        case 'pdf':
          // For PDF, we'll use the existing PDF generation but with HTML content
          result = await generatePdfFromHtml(htmlContent, {
            title,
            format: 'A4',
            margin: {
              top: '10mm',
              right: '10mm',
              bottom: '10mm',
              left: '10mm'
            }
          });
          contentType = 'application/pdf';
          fileExtension = 'pdf';
          break;

        case 'html':
          result = htmlContent;
          contentType = 'text/html';
          fileExtension = 'html';
          break;

        case 'docx':
          // For DOCX, convert to a simple markdown and use existing converter
          const simpleMarkdown = htmlToSimpleMarkdown(htmlContent);
          result = await converter.convert(simpleMarkdown, 'docx', { title });
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          fileExtension = 'docx';
          break;

        case 'rtf':
          const simpleMarkdownRtf = htmlToSimpleMarkdown(htmlContent);
          result = await converter.convert(simpleMarkdownRtf, 'rtf', { title });
          contentType = 'application/rtf';
          fileExtension = 'rtf';
          break;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const outputFilename = `${filename}-${timestamp}.${fileExtension}`;

      // Return the converted content
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Disposition', `attachment; filename="${outputFilename}"`);
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

      if (typeof result === 'string') {
        return new NextResponse(result, { 
          status: 200,
          headers
        });
      } else {
        return new NextResponse(result, { 
          status: 200,
          headers
        });
      }

    } finally {
      // Clean up temporary file
      if (fs.existsSync(tempHtmlPath)) {
        fs.unlinkSync(tempHtmlPath);
      }
    }

  } catch (error: any) {
    console.error('HTML export error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to export HTML content',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
