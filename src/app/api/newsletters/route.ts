import { NextRequest, NextResponse } from 'next/server';
import { NewsletterConverter } from '@/lib/newsletter-converter';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { 
      slug, 
      format = 'pdf',
      lang = 'en',
      options = {} 
    } = await request.json();

    if (!slug) {
      return NextResponse.json(
        { error: 'Newsletter slug is required' },
        { status: 400 }
      );
    }

    // Construct the file path for newsletter content
    const contentPath = path.join(
      process.cwd(),
      'content',
      'newsletters',
      `${slug}.${lang}.md`
    );

    // Fallback to English if language-specific file doesn't exist
    const fallbackPath = path.join(
      process.cwd(),
      'content',
      'newsletters',
      `${slug}.md`
    );

    let filePath = contentPath;
    if (!fs.existsSync(contentPath) && fs.existsSync(fallbackPath)) {
      filePath = fallbackPath;
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Newsletter not found' },
        { status: 404 }
      );
    }

    // Read the newsletter markdown content
    const markdownContent = fs.readFileSync(filePath, 'utf8');

    // Extract frontmatter for newsletter-specific options
    const frontmatterMatch = markdownContent.match(/^---\n([\s\S]*?)\n---/);
    const newsletterOptions = { ...options };
    
    if (frontmatterMatch) {
      try {
        const frontmatter = frontmatterMatch[1];
        const yamlLines = frontmatter.split('\n');
        yamlLines.forEach(line => {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
            if (key.trim() === 'title') newsletterOptions.title = value;
            if (key.trim() === 'author') newsletterOptions.author = value;
            if (key.trim() === 'edition') newsletterOptions.edition = value;
            if (key.trim() === 'academic_year') newsletterOptions.academicYear = value;
            if (key.trim() === 'department') newsletterOptions.department = value;
          }
        });
      } catch (error) {
        console.warn('Error parsing frontmatter:', error);
      }
    }

    // Default contact information for Government Polytechnic Palanpur
    newsletterOptions.contactInfo = {
      address: 'Government Polytechnic, Palanpur, Banaskantha, Gujarat - 385001',
      phone: '+91-2742-251793',
      email: 'principal.gpp@gujaratpoly.in',
      website: 'https://www.gpp.edu.in',
      ...newsletterOptions.contactInfo
    };

    // Convert newsletter content
    const converter = new NewsletterConverter();
    const result = await converter.convertNewsletter(
      markdownContent, 
      format, 
      newsletterOptions
    );

    // Determine content type and filename based on format
    let contentType: string;
    let fileExtension: string;
    let filename: string;

    switch (format.toLowerCase()) {
      case 'pdf':
        contentType = 'application/pdf';
        fileExtension = 'pdf';
        break;
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileExtension = 'docx';
        break;
      case 'rtf':
        contentType = 'application/rtf';
        fileExtension = 'rtf';
        break;
      case 'html':
        contentType = 'text/html';
        fileExtension = 'html';
        break;
      case 'md':
      case 'markdown':
        contentType = 'text/markdown';
        fileExtension = 'md';
        break;
      case 'txt':
        contentType = 'text/plain';
        fileExtension = 'txt';
        break;
      default:
        contentType = 'application/octet-stream';
        fileExtension = format;
    }

    // Generate filename with timestamp for uniqueness
    const timestamp = new Date().toISOString().split('T')[0];
    const editionStr = newsletterOptions.edition ? `-${newsletterOptions.edition.replace(/\s+/g, '-')}` : '';
    filename = `Spectrum-Newsletter${editionStr}-${timestamp}.${fileExtension}`;

    // Return the converted content
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (typeof result === 'string') {
      // For text-based formats (HTML, MD, TXT, RTF)
      return new NextResponse(result, { 
        status: 200,
        headers
      });
    } else {
      // For binary formats (PDF, DOCX)
      return new NextResponse(result, { 
        status: 200,
        headers
      });
    }

  } catch (error: any) {
    console.error('Newsletter conversion error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to convert newsletter',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for listing available newsletters
export async function GET(request: NextRequest) {
  try {
    const newslettersPath = path.join(process.cwd(), 'content', 'newsletters');
    
    if (!fs.existsSync(newslettersPath)) {
      return NextResponse.json({ newsletters: [] });
    }

    const files = fs.readdirSync(newslettersPath);
    const newsletters = files
      .filter(file => file.endsWith('.md'))
      .map(file => {
        const slug = file.replace(/\.(en|hi|gu)\.md$/, '').replace(/\.md$/, '');
        const filePath = path.join(newslettersPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extract basic metadata from frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        const metadata: any = { slug, filename: file };
        
        if (frontmatterMatch) {
          try {
            const frontmatter = frontmatterMatch[1];
            const yamlLines = frontmatter.split('\n');
            yamlLines.forEach(line => {
              const [key, ...valueParts] = line.split(':');
              if (key && valueParts.length > 0) {
                const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
                metadata[key.trim()] = value;
              }
            });
          } catch (error) {
            console.warn('Error parsing frontmatter for', file, ':', error);
          }
        }

        return metadata;
      });

    return NextResponse.json({ newsletters });

  } catch (error: any) {
    console.error('Error listing newsletters:', error);
    return NextResponse.json(
      { error: 'Failed to list newsletters' },
      { status: 500 }
    );
  }
}
