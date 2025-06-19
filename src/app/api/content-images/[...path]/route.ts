// app/api/content-images/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { lookup } from 'mime-types';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Join the path segments
    const imagePath = params.path.join('/');
    
    // Construct full path to content directory
    const contentDir = join(process.cwd(), 'content');
    const fullPath = join(contentDir, imagePath);
    
    // Security check: ensure the path is within content directory
    if (!fullPath.startsWith(contentDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // Check if file exists
    try {
      await stat(fullPath);
    } catch {
      return new NextResponse('Not Found', { status: 404 });
    }
    
    // Read the file
    const fileBuffer = await readFile(fullPath);
    
    // Get the correct MIME type
    const mimeType = lookup(fullPath) || 'application/octet-stream';
    
    // Return the image with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error serving content image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
