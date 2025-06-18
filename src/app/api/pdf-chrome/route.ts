import { NextRequest, NextResponse } from 'next/server';
import { ChromePdfConverter } from '@/lib/chrome-pdf-converter';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { slug, lang = 'en' } = await request.json();

    if (!slug) {
      return NextResponse.json(
        { error: 'Blog post slug is required' },
        { status: 400 }
      );
    }

    // Determine content path based on slug
    let contentPath;
    const isBlogPost = slug.startsWith('blog/') || (!slug.includes('/') && !slug.startsWith('resources/'));
    
    if (isBlogPost) {
      // For blog posts, construct the path
      contentPath = path.join(
        process.cwd(),
        'content',
        'blog',
        `${slug}.${lang}.md`
      );
      
      // Fallback to English if language-specific file doesn't exist
      if (!fs.existsSync(contentPath)) {
        contentPath = path.join(
          process.cwd(),
          'content',
          'blog',
          `${slug}.md`
        );
      }
    } else {
      // For other content (study materials, etc.)
      contentPath = path.join(
        process.cwd(),
        'content',
        `${slug}.md`
      );
    }

    if (!fs.existsSync(contentPath)) {
      return NextResponse.json(
        { error: 'Content file not found' },
        { status: 404 }
      );
    }

    // Convert to PDF using Chrome headless (exact copy of Hugo method)
    const converter = new ChromePdfConverter();
    const pdfBuffer = await converter.convertMarkdownToPdf(contentPath, slug);

    // Return PDF
    const response = new NextResponse(pdfBuffer);
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="${slug.split('/').pop()}.pdf"`);
    
    return response;

  } catch (error) {
    console.error('Chrome PDF generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF with Chrome', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
