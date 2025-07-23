import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const contentDirectory = path.join(process.cwd(), 'content');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParts } = await params;
    
    if (!pathParts || pathParts.length === 0) {
      return new NextResponse('Path required', { status: 400 });
    }

    // Construct the file path - don't add .pdf if it already ends with .pdf
    const pathString = path.join(contentDirectory, ...pathParts);
    const pdfPath = pathString.endsWith('.pdf') ? pathString : pathString + '.pdf';
    
    console.log(`[PDF API] Attempting to serve PDF: ${pdfPath}`);
    
    // Security check: ensure the path is within the content directory
    const resolvedPath = path.resolve(pdfPath);
    const resolvedContentDir = path.resolve(contentDirectory);
    
    if (!resolvedPath.startsWith(resolvedContentDir)) {
      console.warn(`[PDF API] Security violation: attempted path traversal to ${resolvedPath}`);
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      console.warn(`[PDF API] PDF file not found: ${pdfPath}`);
      return new NextResponse('PDF not found', { status: 404 });
    }

    // Check if it's actually a file
    const stats = fs.statSync(pdfPath);
    if (!stats.isFile()) {
      console.warn(`[PDF API] Path is not a file: ${pdfPath}`);
      return new NextResponse('Not a file', { status: 400 });
    }

    // Read the PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    // Return the PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Disposition': 'inline', // Display in browser instead of downloading
      },
    });

  } catch (error) {
    console.error('[PDF API] Error serving PDF:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}