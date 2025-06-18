/**
 * Enhanced Content Converter v2 - Based on working pdf-converter.js
 * Supports multiple output formats with robust Mermaid and math rendering
 */

import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import matter from 'gray-matter';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Import KaTeX for math rendering
let katex: any;
try {
    katex = require('katex');
} catch (error) {
    console.log('KaTeX not available, math rendering will be limited');
}

interface ConversionOptions {
    title?: string;
    author?: string;
    language?: string;
    includeStyles?: boolean;
    pdfOptions?: {
        format?: 'A4' | 'Letter';
        margin?: {
            top?: string;
            right?: string;
            bottom?: string;
            left?: string;
        };
    };
}

export class ContentConverterV2 {
    private tempDir: string;

    constructor() {
        this.tempDir = path.resolve(process.cwd(), 'tmp');
        this.ensureDirectoryExists(this.tempDir);
    }

    private ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    async convert(markdownContent: string, format: string, options: ConversionOptions = {}): Promise<Buffer | string> {
        const { data: frontmatter, content } = matter(markdownContent);
        
        switch (format) {
            case 'md':
                return markdownContent;
            
            case 'html':
                return await this.convertToHtml(content, frontmatter, options);
            
            case 'pdf':
            case 'pdf-chrome':
                return await this.convertToPdf(content, frontmatter, options);
            
            case 'txt':
                return this.convertToPlainText(content, frontmatter, options);
            
            case 'rtf':
                return this.convertToRtf(content, frontmatter, options);
            
            case 'docx':
                return await this.convertToDocx(content, frontmatter, options);
            
            case 'epub':
                return await this.convertToEpub(content, frontmatter, options);
            
            case 'latex':
            case 'tex':
                return await this.convertToLatex(content, frontmatter, options);
            
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    private async convertToHtml(content: string, frontmatter: any, options: ConversionOptions): Promise<string> {
        // Process math expressions first (before markdown)
        let processedContent = this.processMathExpressions(content);
        
        // Convert markdown to HTML
        let htmlContent = await marked(processedContent);
        
        // Process Mermaid diagrams
        htmlContent = this.processMermaidDiagrams(htmlContent);
        
        // Generate the complete HTML
        const title = options.title || frontmatter.title || 'Document';
        const author = options.author || frontmatter.author || 'Unknown';
        
        return this.generateHtmlTemplate(htmlContent, title, author, options);
    }

    private async convertToPdf(content: string, frontmatter: any, options: ConversionOptions): Promise<Buffer> {
        // First convert to HTML
        const htmlContent = await this.convertToHtml(content, frontmatter, options);
        
        // Save HTML to temporary file
        const tempHtmlPath = path.join(this.tempDir, `temp-${Date.now()}.html`);
        fs.writeFileSync(tempHtmlPath, htmlContent);
        
        try {
            // Use Chrome headless to convert to PDF
            const outputPath = path.join(this.tempDir, `output-${Date.now()}.pdf`);
            
            const chromeArgs = [
                '--headless',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-images',
                '--run-all-compositor-stages-before-draw',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows',
                '--disable-features=TranslateUI,VizDisplayCompositor',
                `--print-to-pdf=${outputPath}`,
                '--print-to-pdf-no-header',
                '--virtual-time-budget=10000'
            ];
            
            const command = `/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome ${chromeArgs.join(' ')} "${tempHtmlPath}"`;
            
            await execAsync(command);
            
            // Wait a bit for file to be written
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (!fs.existsSync(outputPath)) {
                throw new Error('PDF generation failed - output file not created');
            }
            
            const pdfBuffer = fs.readFileSync(outputPath);
            
            // Clean up temporary files
            fs.unlinkSync(tempHtmlPath);
            fs.unlinkSync(outputPath);
            
            return pdfBuffer;
        } catch (error) {
            // Clean up temp HTML file
            if (fs.existsSync(tempHtmlPath)) {
                fs.unlinkSync(tempHtmlPath);
            }
            throw error;
        }
    }

    private convertToPlainText(content: string, frontmatter: any, options: ConversionOptions): string {
        // Strip markdown formatting and return plain text
        let text = content
            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to just text
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks first
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/`([^`]+)`/g, '$1') // Remove inline code
            .replace(/#{1,6}\s*/g, '') // Remove headers
            .replace(/^\s*[-*+]\s+/gm, '• ') // Convert bullet lists
            .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists
            .replace(/^\s*>\s*/gm, '') // Remove blockquotes
            .replace(/\$\$[\s\S]*?\$\$/g, '[Math Expression]') // Replace display math
            .replace(/\$([^$\n]+)\$/g, '[Math: $1]') // Replace inline math
            .replace(/\n{3,}/g, '\n\n') // Normalize newlines
            .trim();

        const title = options.title || frontmatter.title || 'Document';
        const author = options.author || frontmatter.author || '';
        const date = frontmatter.date ? new Date(frontmatter.date).toLocaleDateString() : '';
        
        let header = title;
        if (author) header += `\nBy: ${author}`;
        if (date) header += `\nDate: ${date}`;
        header += '\n' + '='.repeat(title.length) + '\n\n';
        
        return header + text;
    }

    private convertToRtf(content: string, frontmatter: any, options: ConversionOptions): string {
        // Convert markdown to RTF (Rich Text Format)
        let rtf = this.markdownToRtf(content);
        
        const title = options.title || frontmatter.title || 'Document';
        const author = options.author || frontmatter.author || '';
        
        return `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
{\\info{\\title ${title}}{\\author ${author}}}
\\f0\\fs24
{\\b\\fs32 ${title}\\par}
{\\i ${author}\\par}
\\par
${rtf}
}`;
    }

    private markdownToRtf(markdown: string): string {
        // Basic markdown to RTF conversion
        return markdown
            .replace(/^# (.*?)$/gm, '{\\b\\fs28 $1\\par}')
            .replace(/^## (.*?)$/gm, '{\\b\\fs24 $1\\par}')
            .replace(/^### (.*?)$/gm, '{\\b\\fs20 $1\\par}')
            .replace(/\*\*(.*?)\*\*/g, '{\\b $1}')
            .replace(/\*(.*?)\*/g, '{\\i $1}')
            .replace(/`([^`]+)`/g, '{\\f1 $1}')
            .replace(/```[\s\S]*?```/g, '{\\f1 $1\\par}')
            .replace(/^\* (.*?)$/gm, '\\bullet $1\\par')
            .replace(/\$\$[\s\S]*?\$\$/g, '[Math Expression]\\par')
            .replace(/\$([^$\n]+)\$/g, '[Math: $1]')
            .replace(/\n/g, '\\par\n');
    }

    private async convertToDocx(content: string, frontmatter: any, options: ConversionOptions): Promise<Buffer> {
        // Use pandoc to convert markdown to docx
        const tempMdPath = path.join(this.tempDir, `temp-${Date.now()}.md`);
        const tempDocxPath = path.join(this.tempDir, `temp-${Date.now()}.docx`);
        
        try {
            // Create frontmatter content
            const title = options.title || frontmatter.title || 'Document';
            const author = options.author || frontmatter.author || '';
            const date = frontmatter.date ? new Date(frontmatter.date).toLocaleDateString() : '';
            
            const markdownWithMeta = `---
title: "${title}"
author: "${author}"
date: "${date}"
---

${content}`;
            
            fs.writeFileSync(tempMdPath, markdownWithMeta);
            
            // Convert using pandoc
            const pandocCommand = `pandoc "${tempMdPath}" -o "${tempDocxPath}" --from markdown --to docx`;
            await execAsync(pandocCommand);
            
            if (!fs.existsSync(tempDocxPath)) {
                throw new Error('DOCX generation failed - output file not created');
            }
            
            const docxBuffer = fs.readFileSync(tempDocxPath);
            
            // Clean up temporary files
            fs.unlinkSync(tempMdPath);
            fs.unlinkSync(tempDocxPath);
            
            return docxBuffer;
        } catch (error) {
            // Clean up temp files
            if (fs.existsSync(tempMdPath)) {
                fs.unlinkSync(tempMdPath);
            }
            if (fs.existsSync(tempDocxPath)) {
                fs.unlinkSync(tempDocxPath);
            }
            throw new Error(`DOCX conversion failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async convertToEpub(content: string, frontmatter: any, options: ConversionOptions): Promise<Buffer> {
        // Generate temporary markdown file
        const tempMdPath = path.join(this.tempDir, `temp-${Date.now()}.md`);
        const tempEpubPath = path.join(this.tempDir, `output-${Date.now()}.epub`);
        
        // Create complete markdown with frontmatter
        const title = options.title || frontmatter.title || 'Document';
        const author = options.author || frontmatter.author || 'Unknown Author';
        const date = frontmatter.date || new Date().toISOString().split('T')[0];
        
        const fullMarkdown = `---
title: "${title}"
author: "${author}"
date: ${date}
lang: ${options.language || 'en'}
---

${content}`;
        
        try {
            fs.writeFileSync(tempMdPath, fullMarkdown);
            
            // Use pandoc to convert to EPUB with custom styling
            const pandocCommand = [
                'pandoc',
                `"${tempMdPath}"`,
                '-o', `"${tempEpubPath}"`,
                '--toc',
                '--toc-depth=3',
                '--epub-chapter-level=2'
            ].join(' ');
            
            await execAsync(pandocCommand);
            
            // Read the generated EPUB file
            const epubBuffer = fs.readFileSync(tempEpubPath);
            
            // Clean up temporary files
            fs.unlinkSync(tempMdPath);
            fs.unlinkSync(tempEpubPath);
            
            return epubBuffer;
        } catch (error) {
            // Clean up temporary files in case of error
            if (fs.existsSync(tempMdPath)) {
                fs.unlinkSync(tempMdPath);
            }
            if (fs.existsSync(tempEpubPath)) {
                fs.unlinkSync(tempEpubPath);
            }
            throw error;
        }
    }

    private async convertToLatex(content: string, frontmatter: any, options: ConversionOptions): Promise<string> {
        // Generate temporary markdown file
        const tempMdPath = path.join(this.tempDir, `temp-${Date.now()}.md`);
        const tempTexPath = path.join(this.tempDir, `output-${Date.now()}.tex`);
        
        // Create complete markdown with frontmatter
        const title = options.title || frontmatter.title || 'Document';
        const author = options.author || frontmatter.author || 'Unknown Author';
        const date = frontmatter.date || new Date().toISOString().split('T')[0];
        
        const fullMarkdown = `---
title: "${title}"
author: "${author}"
date: ${date}
---

${content}`;
        
        try {
            fs.writeFileSync(tempMdPath, fullMarkdown);
            
            // Use pandoc to convert to LaTeX
            const pandocCommand = [
                'pandoc',
                `"${tempMdPath}"`,
                '-o', `"${tempTexPath}"`,
                '--standalone',
                '--variable=geometry:margin=1in',
                '--variable=fontsize=11pt',
                '--variable=documentclass=article'
            ].join(' ');
            
            await execAsync(pandocCommand);
            
            // Read the generated LaTeX file
            const latexContent = fs.readFileSync(tempTexPath, 'utf8');
            
            // Clean up temporary files
            fs.unlinkSync(tempMdPath);
            fs.unlinkSync(tempTexPath);
            
            return latexContent;
        } catch (error) {
            // Clean up temporary files in case of error
            if (fs.existsSync(tempMdPath)) {
                fs.unlinkSync(tempMdPath);
            }
            if (fs.existsSync(tempTexPath)) {
                fs.unlinkSync(tempTexPath);
            }
            throw error;
        }
    }

    private processMathExpressions(content: string): string {
        if (!katex) return content;

        // Process display math ($$...$$)
        content = content.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
            try {
                const rendered = katex.renderToString(math.trim(), {
                    displayMode: true,
                    throwOnError: false,
                    strict: false
                });
                return `<div class="math-display">${rendered}</div>`;
            } catch (error) {
                console.warn('Math rendering error:', error);
                return `<div class="math-display">${math}</div>`;
            }
        });

        // Process inline math ($...$)
        content = content.replace(/\$([^$\n]+)\$/g, (match, math) => {
            try {
                const rendered = katex.renderToString(math.trim(), {
                    displayMode: false,
                    throwOnError: false,
                    strict: false
                });
                return `<span class="math-inline">${rendered}</span>`;
            } catch (error) {
                console.warn('Math rendering error:', error);
                return `<span class="math-inline">${math}</span>`;
            }
        });

        return content;
    }

    private processMermaidDiagrams(html: string): string {
        let diagramCounter = 0;
        
        // Process mermaid code blocks
        return html.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g, (match, code) => {
            diagramCounter++;
            const cleanCode = code.trim()
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"');
            
            return `<div class="mermaid-diagram" data-diagram-id="${diagramCounter}">
<pre class="mermaid-code">${cleanCode}</pre>
<div class="mermaid-render" id="mermaid-${diagramCounter}"></div>
</div>`;
        });
    }

    private generateHtmlTemplate(content: string, title: string, author: string, options: ConversionOptions): string {
        const currentDate = new Date().toLocaleDateString('en-GB');
        
        return `<!DOCTYPE html>
<html lang="${options.language || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- KaTeX CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <!-- Mermaid -->
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <!-- Font imports -->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Gujarati:wght@300;400;500;600;700&display=swap');
        
        @page {
            size: ${options.pdfOptions?.format || 'A4'};
            margin: ${options.pdfOptions?.margin?.top || '2cm'} ${options.pdfOptions?.margin?.right || '2cm'} ${options.pdfOptions?.margin?.bottom || '2cm'} ${options.pdfOptions?.margin?.left || '2cm'};
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #1a202c;
            font-size: 11pt;
            max-width: none;
            margin: 0;
            padding: 0;
            background: white;
        }
        
        .container {
            max-width: 100%;
            margin: 0 auto;
            padding: 20px;
        }
        
        h1 {
            color: #2d3748;
            border-bottom: 3px solid #3182ce;
            padding-bottom: 10px;
            font-size: 20pt;
            margin-top: 0;
            margin-bottom: 30px;
            page-break-after: avoid;
        }
        
        h2 {
            color: #2c5282;
            background: linear-gradient(to right, #e2e8f0, transparent);
            padding: 10px 15px;
            border-left: 4px solid #3182ce;
            margin-top: 30px;
            margin-bottom: 20px;
            font-size: 14pt;
            page-break-after: avoid;
        }
        
        h3 {
            color: #4a5568;
            font-size: 12pt;
            margin-top: 25px;
            margin-bottom: 15px;
            page-break-after: avoid;
        }
        
        h4, h5, h6 {
            color: #718096;
            margin-top: 20px;
            margin-bottom: 10px;
            page-break-after: avoid;
        }
        
        p {
            margin-bottom: 15px;
            text-align: justify;
            orphans: 3;
            widows: 3;
        }
        
        .table-wrapper {
            overflow-x: auto;
            margin: 20px 0;
            page-break-inside: avoid;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
        }
        
        th, td {
            border: 1px solid #cbd5e0;
            padding: 8px 12px;
            text-align: left;
            vertical-align: top;
        }
        
        th {
            background-color: #3182ce;
            color: white;
            font-weight: 600;
        }
        
        tr:nth-child(even) {
            background-color: #f7fafc;
        }
        
        pre {
            background-color: #f7fafc;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #3182ce;
            overflow-x: auto;
            font-size: 9pt;
            margin: 15px 0;
            page-break-inside: avoid;
        }
        
        code {
            background-color: #edf2f7;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 9pt;
        }
        
        pre code {
            background: none;
            padding: 0;
        }
        
        blockquote {
            border-left: 4px solid #3182ce;
            margin: 15px 0;
            padding: 10px 20px;
            background-color: #edf2f7;
            font-style: italic;
            page-break-inside: avoid;
        }
        
        strong, b {
            color: #2d3748;
            font-weight: 600;
        }
        
        ul, ol {
            margin: 15px 0;
            padding-left: 30px;
        }
        
        li {
            margin-bottom: 8px;
        }
        
        .header-info {
            text-align: center;
            color: #718096;
            font-size: 9pt;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        /* Math styling */
        .math-inline {
            font-family: 'Computer Modern', 'Times New Roman', serif;
            font-style: italic;
            background-color: #f0f8ff;
            padding: 2px 4px;
            border-radius: 3px;
        }
        
        .math-display {
            font-family: 'Computer Modern', 'Times New Roman', serif;
            font-style: italic;
            background-color: #f0f8ff;
            padding: 10px;
            margin: 15px 0;
            border-radius: 6px;
            text-align: center;
            border-left: 4px solid #4299e1;
        }
        
        .katex {
            font-size: 1.1em;
        }
        
        .katex-display {
            margin: 15px 0;
            text-align: center;
        }
        
        /* Mermaid diagram styling */
        .mermaid-diagram {
            margin: 20px 0;
            page-break-inside: avoid;
            text-align: center;
        }
        
        .mermaid-render {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            min-height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .mermaid-render svg {
            max-width: 100%;
            max-height: 400px;
            height: auto;
            width: auto;
        }
        
        .mermaid-code {
            display: none;
            background-color: #f7fafc;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 9pt;
            white-space: pre-wrap;
            margin-top: 10px;
        }
        
        .mermaid-fallback {
            background-color: #fff5f5;
            border: 1px solid #fed7d7;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .mermaid-fallback::before {
            content: "Mermaid Diagram:";
            font-weight: bold;
            color: #c53030;
            display: block;
            margin-bottom: 10px;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                font-size: 10pt;
            }
            
            h1 { font-size: 18pt; }
            h2 { font-size: 13pt; }
            h3 { font-size: 11pt; }
            
            .no-print {
                display: none;
            }
            
            /* Show rendered diagrams in print, hide code */
            .mermaid-code {
                display: none !important;
            }
            
            .mermaid-render {
                display: block !important;
                padding: 10px !important;
                page-break-inside: avoid;
            }
            
            /* Ensure SVG diagrams are visible and properly sized for print */
            .mermaid-render svg {
                max-width: 90% !important;
                max-height: 300px !important;
                height: auto !important;
                width: auto !important;
                display: block !important;
                margin: 0 auto !important;
            }
            
            /* Scale down oversized diagrams */
            .mermaid-diagram {
                margin: 10px 0 !important;
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-info">
            <strong>${title}</strong><br>
            By: ${author}<br>
            Generated on ${currentDate} | Content Converter System
        </div>
        
        <div class="content">
            ${content}
        </div>
    </div>
    
    <script>
        // Initialize Mermaid with better error handling
        mermaid.initialize({ 
            startOnLoad: false,
            theme: 'default',
            themeVariables: {
                primaryColor: '#3182ce',
                primaryTextColor: '#1a202c',
                primaryBorderColor: '#2c5282',
                lineColor: '#4a5568',
                secondaryColor: '#e2e8f0',
                tertiaryColor: '#f7fafc'
            },
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                nodeSpacing: 30,
                rankSpacing: 40
            },
            sequence: {
                useMaxWidth: true,
                width: 150
            },
            gantt: {
                useMaxWidth: true
            }
        });
        
        // Render Mermaid diagrams with better error handling
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded, starting Mermaid rendering...');
            
            const diagrams = document.querySelectorAll('.mermaid-diagram');
            console.log('Found', diagrams.length, 'Mermaid diagrams');
            
            let renderedCount = 0;
            
            diagrams.forEach((diagram, index) => {
                const codeElement = diagram.querySelector('.mermaid-code');
                const renderDiv = diagram.querySelector('.mermaid-render');
                
                if (!codeElement || !renderDiv) {
                    console.log('Missing elements for diagram', index);
                    return;
                }
                
                const code = codeElement.textContent.trim();
                const renderId = 'mermaid-svg-' + (index + 1);
                
                console.log('Rendering diagram', index + 1, 'with code:', code.substring(0, 50) + '...');
                
                try {
                    mermaid.render(renderId, code).then(result => {
                        console.log('Successfully rendered diagram', index + 1);
                        renderDiv.innerHTML = result.svg;
                        diagram.classList.add('rendered');
                        renderedCount++;
                        
                        if (renderedCount === diagrams.length) {
                            document.body.classList.add('mermaid-ready');
                            console.log('All Mermaid diagrams rendered');
                        }
                    }).catch(error => {
                        console.error('Mermaid rendering error for diagram', index + 1, ':', error);
                        renderDiv.innerHTML = '<p style="color: #c53030; font-style: italic;">Diagram rendering failed</p>';
                        codeElement.style.display = 'block';
                        renderedCount++;
                        
                        if (renderedCount === diagrams.length) {
                            document.body.classList.add('mermaid-ready');
                        }
                    });
                } catch (error) {
                    console.error('Mermaid setup error for diagram', index + 1, ':', error);
                    renderDiv.innerHTML = '<p style="color: #c53030; font-style: italic;">Diagram setup failed</p>';
                    codeElement.style.display = 'block';
                    renderedCount++;
                    
                    if (renderedCount === diagrams.length) {
                        document.body.classList.add('mermaid-ready');
                    }
                }
            });
            
            if (diagrams.length === 0) {
                document.body.classList.add('mermaid-ready');
                console.log('No Mermaid diagrams found, marking as ready');
            }
        });
    </script>
</body>
</html>`;
    }
}
