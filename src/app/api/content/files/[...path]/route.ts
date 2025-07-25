import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { detectContentType, getMimeType, requiresDownload } from '@/lib/content-types';

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

    // Construct the file path
    const filePath = path.join(contentDirectory, ...pathParts);
    
    console.log(`[Files API] Attempting to serve file: ${filePath}`);
    
    // Security check: ensure the path is within the content directory
    const resolvedPath = path.resolve(filePath);
    const resolvedContentDir = path.resolve(contentDirectory);
    
    if (!resolvedPath.startsWith(resolvedContentDir)) {
      console.warn(`[Files API] Security violation: attempted path traversal to ${resolvedPath}`);
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`[Files API] File not found: ${filePath}`);
      return new NextResponse('File not found', { status: 404 });
    }

    // Check if it's actually a file
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      console.warn(`[Files API] Path is not a file: ${filePath}`);
      return new NextResponse('Not a file', { status: 400 });
    }

    // Detect content type and get appropriate MIME type
    const contentType = detectContentType(filePath);
    const extension = path.extname(filePath);
    const mimeType = getMimeType(contentType, extension);
    const filename = path.basename(filePath);

    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine if file should be downloaded or displayed inline
    const shouldDownload = requiresDownload(contentType);
    const disposition = shouldDownload ? 'attachment' : 'inline';
    
    console.log(`[Files API] Serving file: ${filename}, type: ${contentType}, mime: ${mimeType}, disposition: ${disposition}`);
    
    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Disposition': `${disposition}; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('[Files API] Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}