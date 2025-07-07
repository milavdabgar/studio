import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const newslettersPath = path.join(process.cwd(), 'content', 'newsletters');
    
    if (!fs.existsSync(newslettersPath)) {
      // Create directory if it doesn't exist
      fs.mkdirSync(newslettersPath, { recursive: true });
      return NextResponse.json({ 
        message: 'Newsletters directory created',
        newsletters: [] 
      });
    }

    const files = fs.readdirSync(newslettersPath);
    const newsletters = files
      .filter(file => file.endsWith('.md'))
      .map(file => {
        const slug = file.replace(/\.(en|hi|gu)\.md$/, '').replace(/\.md$/, '');
        const filePath = path.join(newslettersPath, file);
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Extract basic metadata from frontmatter
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          const metadata: Record<string, unknown> = { slug, filename: file };
          
          if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const yamlLines = frontmatter.split('\n');
            yamlLines.forEach(line => {
              const [key, ...valueParts] = line.split(':');
              if (key && valueParts.length > 0) {
                const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
                metadata[key.trim()] = value;
              }
            });
          }

          return metadata;
        } catch (error) {
          console.error('Error reading newsletter file:', file, error);
          return { slug, filename: file, error: 'Failed to read file' };
        }
      });

    return NextResponse.json({ newsletters });

  } catch (error: unknown) {
    console.error('Error listing newsletters:', error);
    return NextResponse.json(
      { error: 'Failed to list newsletters', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
