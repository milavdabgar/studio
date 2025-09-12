import { NextRequest, NextResponse } from 'next/server';
import { ContentConverterV2 } from '@/lib/content-converter-v2';
import fs from 'fs';
import path from 'path';

// Import Puppeteer for direct HTML to PDF conversion
let puppeteer: typeof import('puppeteer') | undefined;
try {
  puppeteer = require('puppeteer');
} catch {
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
interface PdfOptions {
  format?: string;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  title?: string;
}

async function generatePdfFromHtml(htmlContent: string, options: PdfOptions): Promise<Buffer> {
  if (!puppeteer) {
    throw new Error('Puppeteer is not available for PDF generation');
  }

  let browser;
  try {
    // Try with full configuration first
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
        ],
        timeout: 60000
      });
    } catch (launchError) {
      console.log('Full launch config failed, trying minimal config:', launchError);
      // Fallback to minimal configuration
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 30000
      });
    }

    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 1
    });

    // Set the HTML content with better options
    await page.setContent(htmlContent, { 
      waitUntil: ['load', 'domcontentloaded'],
      timeout: 60000
    });

    // Wait for fonts and images to load (with fallback)
    try {
      await page.evaluateHandle('document.fonts.ready');
    } catch (fontsError) {
      console.log('Fonts ready check failed, continuing:', fontsError);
    }
    
    // Alternative to waitForTimeout - use a promise-based delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate PDF with improved settings
    const pdfBuffer = await page.pdf({
      format: (options.format as 'A4' | 'Letter' | undefined) || 'A4',
      printBackground: true,
      margin: options.margin || {
        top: '20mm',
        right: '20mm', 
        bottom: '20mm',
        left: '20mm'
      },
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      timeout: 60000,
    });

    return Buffer.from(pdfBuffer);

  } catch (error: unknown) {
    console.error('PDF generation error:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
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
          try {
            console.log('[HTML Export] Generating PDF...');
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
            console.log('[HTML Export] PDF generation successful');
          } catch (pdfError) {
            console.error('[HTML Export] PDF generation failed:', pdfError);
            throw new Error(`PDF generation failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'}. Try exporting as HTML or DOCX instead.`);
          }
          break;

        case 'html':
          console.log('[HTML Export] Generating HTML...');
          result = htmlContent;
          contentType = 'text/html';
          fileExtension = 'html';
          break;

        case 'docx':
          try {
            console.log('[HTML Export] Generating DOCX...');
            // For DOCX, convert to a simple markdown and use existing converter
            const simpleMarkdown = htmlToSimpleMarkdown(htmlContent);
            result = await converter.convert(simpleMarkdown, 'docx', { title });
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            fileExtension = 'docx';
            console.log('[HTML Export] DOCX generation successful');
          } catch (docxError) {
            console.error('[HTML Export] DOCX generation failed:', docxError);
            throw new Error(`DOCX generation failed: ${docxError instanceof Error ? docxError.message : 'Unknown DOCX error'}. Try exporting as HTML instead.`);
          }
          break;

        case 'rtf':
          try {
            console.log('[HTML Export] Generating RTF...');
            const simpleMarkdownRtf = htmlToSimpleMarkdown(htmlContent);
            result = await converter.convert(simpleMarkdownRtf, 'rtf', { title });
            contentType = 'application/rtf';
            fileExtension = 'rtf';
            console.log('[HTML Export] RTF generation successful');
          } catch (rtfError) {
            console.error('[HTML Export] RTF generation failed:', rtfError);
            throw new Error(`RTF generation failed: ${rtfError instanceof Error ? rtfError.message : 'Unknown RTF error'}. Try exporting as HTML instead.`);
          }
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
        return new NextResponse(result as BodyInit, { 
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

  } catch (error: unknown) {
    console.error('[HTML Export] General error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to export HTML content',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        suggestion: error instanceof Error && error.message.includes('PDF') 
          ? 'Try exporting as HTML or DOCX format instead.'
          : 'Please try again or contact support if the issue persists.'
      },
      { status: 500 }
    );
  }
}
