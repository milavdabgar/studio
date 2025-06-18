import { NextRequest, NextResponse } from 'next/server';
import { ContentConverterV2 } from '@/lib/content-converter-v2';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { contentPath, slug, format, options = {} } = await request.json();

    if (!contentPath && !slug) {
      return NextResponse.json(
        { error: 'Content path or slug is required' },
        { status: 400 }
      );
    }

    if (!format) {
      return NextResponse.json(
        { error: 'Format is required' },
        { status: 400 }
      );
    }

    const converter = new ContentConverterV2();
    
    let filePath: string;
    let markdownContent: string;

    // Determine content source
    if (slug) {
      // For blog posts
      const blogPath = path.join(process.cwd(), 'content', 'blog', `${slug}.md`);
      if (fs.existsSync(blogPath)) {
        filePath = blogPath;
        markdownContent = fs.readFileSync(blogPath, 'utf8');
      } else {
        return NextResponse.json(
          { error: 'Blog post not found' },
          { status: 404 }
        );
      }
    } else {
      // For other content
      filePath = path.join(process.cwd(), 'content', contentPath);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { error: 'Content file not found' },
          { status: 404 }
        );
      }
      markdownContent = fs.readFileSync(filePath, 'utf8');
    }

    // Convert content based on format
    const result = await converter.convert(markdownContent, format, options);
    
    // Get the appropriate filename and content type
    const baseFilename = slug || path.basename(contentPath, '.md');
    const { filename, contentType, isBuffer } = getFileDetails(baseFilename, format);
    
    // Create response
    const response = new NextResponse(result);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    return response;

  } catch (error) {
    console.error('Download conversion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to convert content', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'supported-formats') {
      return NextResponse.json({
        formats: [
          {
            id: 'md',
            name: 'Markdown',
            description: 'Original markdown format',
            extension: 'md',
            category: 'text'
          },
          {
            id: 'html',
            name: 'HTML',
            description: 'Web-ready HTML with Mermaid diagrams and math',
            extension: 'html',
            category: 'web'
          },
          {
            id: 'pdf',
            name: 'PDF (Puppeteer)',
            description: 'High-quality PDF with diagrams and math support using Puppeteer',
            extension: 'pdf',
            category: 'document'
          },
          {
            id: 'pdf-chrome',
            name: 'PDF (Chrome)',
            description: 'PDF generated using Chrome headless',
            extension: 'pdf',
            category: 'document'
          },
          {
            id: 'pdf-puppeteer',
            name: 'PDF (Puppeteer Enhanced)',
            description: 'Premium PDF with enhanced rendering and network waiting',
            extension: 'pdf',
            category: 'document'
          },
          {
            id: 'txt',
            name: 'Plain Text',
            description: 'Clean plain text format',
            extension: 'txt',
            category: 'text'
          },
          {
            id: 'rtf',
            name: 'Rich Text Format',
            description: 'RTF format for word processors',
            extension: 'rtf',
            category: 'document'
          },
          {
            id: 'docx',
            name: 'Word Document',
            description: 'Microsoft Word DOCX format',
            extension: 'docx',
            category: 'document'
          },
          {
            id: 'odt',
            name: 'OpenDocument Text',
            description: 'LibreOffice/OpenOffice text document format',
            extension: 'odt',
            category: 'document'
          },
          {
            id: 'epub',
            name: 'EPUB',
            description: 'Electronic book format for e-readers',
            extension: 'epub',
            category: 'ebook'
          },
          {
            id: 'pptx',
            name: 'PowerPoint Presentation',
            description: 'Microsoft PowerPoint presentation format',
            extension: 'pptx',
            category: 'presentation'
          },
          {
            id: 'latex',
            name: 'LaTeX',
            description: 'LaTeX typesetting format for academic documents',
            extension: 'tex',
            category: 'document'
          }
        ]
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'API request failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

function getFileDetails(baseFilename: string, format: string) {
  const formatMap: Record<string, { extension: string; contentType: string; isBuffer: boolean }> = {
    'md': { 
      extension: 'md', 
      contentType: 'text/markdown', 
      isBuffer: false 
    },
    'html': { 
      extension: 'html', 
      contentType: 'text/html', 
      isBuffer: false 
    },
    'pdf': { 
      extension: 'pdf', 
      contentType: 'application/pdf', 
      isBuffer: true 
    },
    'pdf-chrome': { 
      extension: 'pdf', 
      contentType: 'application/pdf', 
      isBuffer: true 
    },
    'txt': { 
      extension: 'txt', 
      contentType: 'text/plain', 
      isBuffer: false 
    },
    'rtf': { 
      extension: 'rtf', 
      contentType: 'application/rtf', 
      isBuffer: false 
    },
    'docx': { 
      extension: 'docx', 
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      isBuffer: true 
    },
    'odt': { 
      extension: 'odt', 
      contentType: 'application/vnd.oasis.opendocument.text', 
      isBuffer: true 
    },
    'epub': { 
      extension: 'epub', 
      contentType: 'application/epub+zip', 
      isBuffer: true 
    },
    'pptx': { 
      extension: 'pptx', 
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 
      isBuffer: true 
    },
    'latex': { 
      extension: 'tex', 
      contentType: 'application/x-latex', 
      isBuffer: false 
    }
  };

  const details = formatMap[format] || formatMap['html'];
  return {
    filename: `${baseFilename}.${details.extension}`,
    contentType: details.contentType,
    isBuffer: details.isBuffer
  };
}
