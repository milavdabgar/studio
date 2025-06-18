import { NextRequest, NextResponse } from 'next/server';
import { MarkdownToPdfConverter } from '@/lib/pdf-converter';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { contentPath, options = {} } = body;

        if (!contentPath) {
            return NextResponse.json(
                { error: 'Content path is required' },
                { status: 400 }
            );
        }

        const converter = new MarkdownToPdfConverter();
        
        // Read the markdown content from the file
        const fullPath = path.join(process.cwd(), 'content', contentPath);
        
        if (!fs.existsSync(fullPath)) {
            return NextResponse.json(
                { error: 'Content file not found' },
                { status: 404 }
            );
        }
        
        const markdownContent = fs.readFileSync(fullPath, 'utf8');
        
        // Convert the content to PDF
        const pdfBuffer = await converter.convertMarkdownToPdf(markdownContent, path.basename(contentPath, '.md'));
        
        // Create response with PDF buffer
        const fileName = `${path.basename(contentPath, '.md')}.pdf`;
        const response = new NextResponse(pdfBuffer);
        response.headers.set('Content-Type', 'application/pdf');
        response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
        
        return response;

    } catch (error) {
        console.error('PDF conversion error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to convert to PDF', 
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

        if (action === 'list-content') {
            // List available content files
            const contentDir = path.resolve(process.cwd(), 'content');
            const files = await findMarkdownFiles(contentDir);
            
            // Convert absolute paths to relative paths from content directory
            const relativePaths = files.map(file => path.relative(contentDir, file));
            
            return NextResponse.json({ files: relativePaths });
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

async function findMarkdownFiles(directory: string): Promise<string[]> {
    const markdownFiles: string[] = [];
    
    const scanDirectory = (dir: string) => {
        if (!fs.existsSync(dir)) return;
        
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !item.startsWith('.')) {
                scanDirectory(fullPath);
            } else if (item.endsWith('.md') && !item.startsWith('_')) {
                markdownFiles.push(fullPath);
            }
        }
    };
    
    scanDirectory(directory);
    return markdownFiles;
}
