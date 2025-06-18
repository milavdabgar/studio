import { NextRequest, NextResponse } from 'next/server';
import { ContentConverterV2 } from '@/lib/content-converter-v2';
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

    // Construct the file path based on slug and language
    const contentPath = path.join(
      process.cwd(),
      'content',
      'blog',
      `${slug}.${lang}.md`
    );

    // Fallback to English if language-specific file doesn't exist
    const fallbackPath = path.join(
      process.cwd(),
      'content',
      'blog',
      `${slug}.md`
    );

    let filePath = contentPath;
    if (!fs.existsSync(contentPath) && fs.existsSync(fallbackPath)) {
      filePath = fallbackPath;
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Read the markdown content
    const markdownContent = fs.readFileSync(filePath, 'utf8');

    // Convert to PDF
    const converter = new ContentConverterV2();
    const pdfBuffer = await converter.convert(markdownContent, 'pdf', {
        title: slug
    });

    // Return the PDF as a downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${slug}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('PDF conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug');
  const lang = searchParams.get('lang') || 'en';

  if (!slug) {
    return NextResponse.json(
      { error: 'Blog post slug is required' },
      { status: 400 }
    );
  }

  try {
    // Same logic as POST but for GET requests
    const contentPath = path.join(
      process.cwd(),
      'content',
      'blog',
      `${slug}.${lang}.md`
    );

    const fallbackPath = path.join(
      process.cwd(),
      'content',
      'blog',
      `${slug}.md`
    );

    let filePath = contentPath;
    if (!fs.existsSync(contentPath) && fs.existsSync(fallbackPath)) {
      filePath = fallbackPath;
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    const markdownContent = fs.readFileSync(filePath, 'utf8');
    const converter = new ContentConverterV2();
    const pdfBuffer = await converter.convert(markdownContent, 'pdf', {
        title: slug
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${slug}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('PDF conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
