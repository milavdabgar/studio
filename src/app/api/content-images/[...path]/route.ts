// app/api/content-images/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { lookup } from 'mime-types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Join the path segments
    const { path } = await params;
    const imagePath = path.join('/');
    
    // Construct full path to content directory
    const contentDir = join(process.cwd(), 'content');
    const fullPath = join(contentDir, imagePath);
    
    // Security check: ensure the path is within content directory
    if (!fullPath.startsWith(contentDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // Check if file exists and get stats
    let fileStats;
    try {
      fileStats = await stat(fullPath);
      
      // Only serve files, not directories
      if (!fileStats.isFile()) {
        return new NextResponse('Not Found', { status: 404 });
      }
    } catch {
      return new NextResponse('Not Found', { status: 404 });
    }
    
    // Get the correct MIME type
    const mimeType = lookup(fullPath) || 'application/octet-stream';
    
    // Only serve image and common media files for security
    const allowedTypes = [
      'image/', 'video/', 'audio/',
      'application/pdf',
      'text/plain',
      'application/json'
    ];
    
    const isAllowed = allowedTypes.some(type => mimeType.startsWith(type));
    if (!isAllowed) {
      return new NextResponse('File type not allowed', { status: 403 });
    }
    
    // Handle conditional requests (304 Not Modified)
    const ifModifiedSince = request.headers.get('if-modified-since');
    const lastModified = fileStats.mtime.toUTCString();
    
    if (ifModifiedSince && ifModifiedSince === lastModified) {
      return new NextResponse(null, { status: 304 });
    }
    
    // Read the file
    const fileBuffer = await readFile(fullPath);
    
    // Enhanced headers for better caching and performance
    const headers = new Headers({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', // 1 day cache, 1 week stale
      'Last-Modified': lastModified,
      'ETag': `"${fileStats.size}-${fileStats.mtime.getTime()}"`,
      'Content-Length': fileStats.size.toString(),
    });
    
    // Add compression hints for compatible file types
    if (mimeType.startsWith('image/svg') || mimeType.startsWith('text/')) {
      headers.set('Vary', 'Accept-Encoding');
    }
    
    return new NextResponse(fileBuffer, {
      headers,
    });
  } catch (error) {
    console.error('Error serving content image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
