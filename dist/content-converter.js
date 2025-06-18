"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentConverter = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const marked_1 = require("marked");
const gray_matter_1 = require("gray-matter");
const child_process_1 = require("child_process");
const util_1 = require("util");
const puppeteer_core_1 = require("puppeteer-core");
const chromium_min_1 = require("@sparticuz/chromium-min");
// Import KaTeX like in the working pdf-converter.js
let katex;
try {
    katex = require('katex');
}
catch (error) {
    console.log('KaTeX not available, math rendering will be limited');
}
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class ContentConverter {
    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
        this.tempDir = path_1.default.join(process.cwd(), 'tmp');
        this.ensureDirectoryExists(this.tempDir);
    }
    ensureDirectoryExists(dirPath) {
        if (!fs_1.default.existsSync(dirPath)) {
            fs_1.default.mkdirSync(dirPath, { recursive: true });
        }
    }
    async convert(markdownContent, format, options = {}) {
        const { data: frontmatter, content } = (0, gray_matter_1.default)(markdownContent);
        switch (format) {
            case 'md':
                return this.convertToMarkdown(markdownContent, options);
            case 'html':
                return this.convertToHtml(content, frontmatter, options);
            case 'pdf-puppeteer':
                return this.convertToPdfPuppeteer(content, frontmatter, options);
            case 'pdf-chrome':
                return this.convertToPdfChrome(content, frontmatter, options);
            case 'pdf-latex':
                return this.convertToPdfLatex(content, frontmatter, options);
            case 'latex':
                return this.convertToLatex(content, frontmatter, options);
            case 'docx':
                return this.convertToDocx(content, frontmatter, options);
            case 'epub':
                return this.convertToEpub(content, frontmatter, options);
            case 'rtf':
                return this.convertToRtf(content, frontmatter, options);
            case 'txt':
                return this.convertToPlainText(content, frontmatter, options);
            case 'mp3':
                return this.convertToMp3(content, frontmatter, options);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }
    convertToMarkdown(markdownContent, options) {
        // Return original markdown, potentially with modifications
        return markdownContent;
    }
    async convertToHtml(content, frontmatter, options) {
        // Pre-process content for math and diagrams
        const processedContent = await this.preprocessContent(content);
        // Configure marked with custom renderer
        const renderer = new marked_1.marked.Renderer();
        this.setupCustomRenderer(renderer);
        // Convert markdown to HTML
        const htmlContent = await (0, marked_1.marked)(processedContent, { renderer });
        // Post-process for any remaining issues
        const finalHtml = this.postProcessHtml(htmlContent);
        // Detect language
        const hasGujarati = /[\u0A80-\u0AFF]/.test(content);
        const lang = options.lang || (hasGujarati ? 'gu' : 'en');
        // Create complete HTML document
        return this.createStyledHtml(finalHtml, frontmatter, lang, 'html');
    }
    async convertToPdfPuppeteer(content, frontmatter, options) {
        const html = await this.convertToHtml(content, frontmatter, options);
        return this.generatePdfWithPuppeteer(html, options);
    }
    async convertToPdfChrome(content, frontmatter, options) {
        const html = await this.convertToHtml(content, frontmatter, options);
        return this.generatePdfWithChrome(html, options);
    }
    async convertToLatex(content, frontmatter, options) {
        // Convert markdown to LaTeX
        let latex = this.markdownToLatex(content);
        // Wrap in LaTeX document
        const title = frontmatter.title || 'Document';
        const author = frontmatter.author || '';
        const date = frontmatter.date ? new Date(frontmatter.date).toLocaleDateString() : '';
        const hasGujarati = /[\u0A80-\u0AFF]/.test(content);
        const lang = options.lang || (hasGujarati ? 'gu' : 'en');
        return `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
${lang === 'gu' ? '\\usepackage{fontspec}\n\\setmainfont{Noto Sans Gujarati}' : ''}
\\usepackage{geometry}
\\usepackage{amsmath}
\\usepackage{amsfonts}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{listings}
\\usepackage{xcolor}

\\geometry{margin=2.5cm}

\\title{${this.escapeLatex(title)}}
${author ? `\\author{${this.escapeLatex(author)}}` : ''}
${date ? `\\date{${this.escapeLatex(date)}}` : '\\date{}'}

\\begin{document}

\\maketitle

${latex}

\\end{document}`;
    }
    async convertToDocx(content, frontmatter, options) {
        // Use pandoc to convert markdown to docx
        const tempMdPath = path_1.default.join(this.tempDir, `temp-${Date.now()}.md`);
        const tempDocxPath = path_1.default.join(this.tempDir, `temp-${Date.now()}.docx`);
        try {
            // Write markdown to temp file
            const fullMarkdown = `---
title: ${frontmatter.title || 'Document'}
author: ${frontmatter.author || ''}
date: ${frontmatter.date || ''}
---

${content}`;
            fs_1.default.writeFileSync(tempMdPath, fullMarkdown);
            // Convert using pandoc
            await execAsync(`pandoc "${tempMdPath}" -o "${tempDocxPath}" --from markdown --to docx`);
            // Read the generated file
            const buffer = fs_1.default.readFileSync(tempDocxPath);
            // Cleanup
            fs_1.default.unlinkSync(tempMdPath);
            fs_1.default.unlinkSync(tempDocxPath);
            return buffer;
        }
        catch (error) {
            // Cleanup on error
            if (fs_1.default.existsSync(tempMdPath))
                fs_1.default.unlinkSync(tempMdPath);
            if (fs_1.default.existsSync(tempDocxPath))
                fs_1.default.unlinkSync(tempDocxPath);
            throw new Error(`DOCX conversion failed: ${error}`);
        }
    }
    async convertToEpub(content, frontmatter, options) {
        // Use pandoc to convert markdown to epub
        const tempMdPath = path_1.default.join(this.tempDir, `temp-${Date.now()}.md`);
        const tempEpubPath = path_1.default.join(this.tempDir, `temp-${Date.now()}.epub`);
        try {
            const fullMarkdown = `---
title: ${frontmatter.title || 'Document'}
author: ${frontmatter.author || ''}
date: ${frontmatter.date || ''}
---

${content}`;
            fs_1.default.writeFileSync(tempMdPath, fullMarkdown);
            // Convert using pandoc
            await execAsync(`pandoc "${tempMdPath}" -o "${tempEpubPath}" --from markdown --to epub`);
            const buffer = fs_1.default.readFileSync(tempEpubPath);
            // Cleanup
            fs_1.default.unlinkSync(tempMdPath);
            fs_1.default.unlinkSync(tempEpubPath);
            return buffer;
        }
        catch (error) {
            if (fs_1.default.existsSync(tempMdPath))
                fs_1.default.unlinkSync(tempMdPath);
            if (fs_1.default.existsSync(tempEpubPath))
                fs_1.default.unlinkSync(tempEpubPath);
            throw new Error(`EPUB conversion failed: ${error}`);
        }
    }
    async convertToRtf(content, frontmatter, options) {
        // Convert markdown to RTF (Rich Text Format)
        let rtf = this.markdownToRtf(content);
        const title = frontmatter.title || 'Document';
        const author = frontmatter.author || '';
        return `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
{\\info{\\title ${title}}{\\author ${author}}}
\\f0\\fs24
{\\b\\fs32 ${title}\\par}
{\\i ${author}\\par}
\\par
${rtf}
}`;
    }
    convertToPlainText(content, frontmatter, options) {
        // Strip markdown formatting and return plain text
        let text = content
            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to just text
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/`([^`]+)`/g, '$1') // Remove inline code
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/#{1,6}\s*/g, '') // Remove headers
            .replace(/^\s*[-*+]\s+/gm, '• ') // Convert lists
            .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists
            .replace(/^\s*>\s*/gm, '') // Remove blockquotes
            .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
            .trim();
        const title = frontmatter.title || 'Document';
        const author = frontmatter.author || '';
        const date = frontmatter.date ? new Date(frontmatter.date).toLocaleDateString() : '';
        let header = title;
        if (author)
            header += `\nBy: ${author}`;
        if (date)
            header += `\nDate: ${date}`;
        header += '\n' + '='.repeat(title.length) + '\n\n';
        return header + text;
    }
    // Helper methods from the existing PDF converter
    async preprocessContent(content) {
        let processed = content;
        // Handle Mermaid diagrams
        processed = await this.processMermaidDiagrams(processed);
        // Handle math expressions
        processed = this.processMathExpressions(processed);
        return processed;
    }
    async processMermaidDiagrams(content) {
        // Find mermaid code blocks - exact same as working pdf-converter.js
        const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
        let processed = content;
        let match;
        let diagramId = 0;
        while ((match = mermaidRegex.exec(content)) !== null) {
            const diagramCode = match[1].trim();
            diagramId++;
            // Create a placeholder div structure for Mermaid - exact same as working version
            const placeholder = `
<div class="mermaid-diagram" data-diagram-id="${diagramId}">
<pre class="mermaid-code">${diagramCode}</pre>
<div class="mermaid-render" id="mermaid-${diagramId}"></div>
</div>`;
            processed = processed.replace(match[0], placeholder);
        }
        return processed;
    }
    processMathExpressions(content) {
        if (!katex)
            return content;
        let processed = content;
        // Handle display math ($$...$$) - exact same as working pdf-converter.js
        const displayMathRegex = /\$\$([^$]+)\$\$/g;
        processed = processed.replace(displayMathRegex, (match, math) => {
            try {
                const rendered = katex.renderToString(math.trim(), { displayMode: true });
                return `<div class="math-display">${rendered}</div>`;
            }
            catch (error) {
                console.log(`Math rendering error: ${error}`);
                return match;
            }
        });
        // Handle inline math ($...$) - exact same as working pdf-converter.js
        const inlineMathRegex = /(?<!\$)\$([^$\n]+)\$(?!\$)/g;
        processed = processed.replace(inlineMathRegex, (match, math) => {
            try {
                const rendered = katex.renderToString(math.trim(), { displayMode: false });
                return `<span class="math-inline">${rendered}</span>`;
            }
            catch (error) {
                console.log(`Math rendering error: ${error}`);
                return match;
            }
        });
        return processed;
    }
    setupCustomRenderer(renderer) {
        renderer.code = (code, language) => {
            const lang = language || '';
            const escapedCode = code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/\n/g, '\n');
            return `<pre class="code-block"><code class="language-${lang}">${escapedCode}</code></pre>`;
        };
        renderer.table = (header, body) => {
            return `<div class="table-wrapper"><table class="data-table">${header}${body}</table></div>`;
        };
        renderer.image = (href, title, text) => {
            const titleAttr = title ? ` title="${title}"` : '';
            const altAttr = text ? ` alt="${text}"` : '';
            return `<div class="image-wrapper"><img src="${href}"${titleAttr}${altAttr} /></div>`;
        };
    }
    postProcessHtml(html) {
        return html
            .replace(/<br\s*\/?>/gi, '<br />')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    async generatePdfWithPuppeteer(html, options) {
        let browser;
        try {
            const executablePath = this.isProduction
                ? await chromium_min_1.default.executablePath('/opt/nodejs/node_modules/@sparticuz/chromium-min/bin')
                : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
            browser = await puppeteer_core_1.default.launch({
                args: this.isProduction ? chromium_min_1.default.args : [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--font-render-hinting=none'
                ],
                defaultViewport: chromium_min_1.default.defaultViewport,
                executablePath,
                headless: true,
            });
            const page = await browser.newPage();
            // Set content with proper wait conditions
            await page.setContent(html, {
                waitUntil: ['networkidle0', 'domcontentloaded'],
            });
            // Wait for fonts to load
            await page.evaluateHandle('document.fonts.ready');
            // Enhanced Mermaid initialization using the proven approach
            await page.addScriptTag({
                url: 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js'
            });
            // Wait for Mermaid to render all diagrams using the working approach
            await page.evaluate(() => {
                return new Promise((resolve) => {
                    if (typeof window.mermaid === 'undefined') {
                        resolve();
                        return;
                    }
                    // Use the exact configuration that works
                    window.mermaid.initialize({
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
                        },
                        securityLevel: 'loose'
                    });
                    const diagrams = document.querySelectorAll('.mermaid-diagram');
                    if (diagrams.length === 0) {
                        resolve();
                        return;
                    }
                    let renderedCount = 0;
                    diagrams.forEach((diagram, index) => {
                        const codeElement = diagram.querySelector('.mermaid-code');
                        const renderDiv = diagram.querySelector('.mermaid-render');
                        if (!codeElement || !renderDiv) {
                            renderedCount++;
                            if (renderedCount === diagrams.length) {
                                setTimeout(() => resolve(), 1000);
                            }
                            return;
                        }
                        const code = codeElement.textContent?.trim() || '';
                        const renderId = 'mermaid-svg-' + (index + 1);
                        try {
                            window.mermaid.render(renderId, code).then((result) => {
                                renderDiv.innerHTML = result.svg;
                                renderedCount++;
                                if (renderedCount === diagrams.length) {
                                    setTimeout(() => resolve(), 1000);
                                }
                            }).catch((error) => {
                                console.error('Mermaid rendering error:', error);
                                renderedCount++;
                                if (renderedCount === diagrams.length) {
                                    setTimeout(() => resolve(), 1000);
                                }
                            });
                        }
                        catch (error) {
                            console.error('Mermaid setup error:', error);
                            renderedCount++;
                            if (renderedCount === diagrams.length) {
                                setTimeout(() => resolve(), 1000);
                            }
                        }
                    });
                });
            });
            // Additional wait to ensure all content is properly rendered
            await new Promise(resolve => setTimeout(resolve, 3000));
            const pdfBuffer = await page.pdf({
                format: options.paperSize || 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm',
                },
                displayHeaderFooter: true,
                headerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; margin: 0 15mm;">
            <span style="color: #666;">${options.title || 'Document'}</span>
          </div>
        `,
                footerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; margin: 0 15mm;">
            <span style="color: #666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        `,
            });
            return pdfBuffer;
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
    }
    async generatePdfWithChrome(html, options) {
        const tempHtmlPath = path_1.default.join(this.tempDir, `temp-${Date.now()}.html`);
        const mermaidOptimizedPath = path_1.default.join(this.tempDir, `temp-${Date.now()}-mermaid.html`);
        const tempPdfPath = path_1.default.join(this.tempDir, `temp-${Date.now()}.pdf`);
        try {
            // Write HTML to temp file
            fs_1.default.writeFileSync(tempHtmlPath, html);
            // Create Mermaid-optimized version using proven approach
            await this.createMermaidOptimizedHtml(tempHtmlPath, mermaidOptimizedPath);
            const chromePaths = [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/usr/bin/google-chrome',
                '/usr/bin/chromium-browser'
            ];
            for (const chromePath of chromePaths) {
                try {
                    if (fs_1.default.existsSync(chromePath) || chromePath.includes('google-chrome') || chromePath.includes('chromium')) {
                        // Use exact working Chrome command with optimal flags
                        const cmd = `"${chromePath}" --headless --disable-gpu --virtual-time-budget=45000 --run-all-compositor-stages-before-draw --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --print-to-pdf="${tempPdfPath}" "file://${path_1.default.resolve(mermaidOptimizedPath)}"`;
                        await execAsync(cmd);
                        // Clean up optimized file immediately after Chrome execution
                        try {
                            fs_1.default.unlinkSync(mermaidOptimizedPath);
                        }
                        catch (e) { }
                        if (fs_1.default.existsSync(tempPdfPath)) {
                            const buffer = fs_1.default.readFileSync(tempPdfPath);
                            // Cleanup temp files
                            fs_1.default.unlinkSync(tempHtmlPath);
                            fs_1.default.unlinkSync(tempPdfPath);
                            return buffer;
                        }
                    }
                }
                catch (error) {
                    // Clean up optimized file on error
                    try {
                        fs_1.default.unlinkSync(mermaidOptimizedPath);
                    }
                    catch (e) { }
                    continue;
                }
            }
            throw new Error('Chrome not found or PDF generation failed');
        }
        catch (error) {
            // Cleanup on error
            if (fs_1.default.existsSync(tempHtmlPath))
                fs_1.default.unlinkSync(tempHtmlPath);
            if (fs_1.default.existsSync(mermaidOptimizedPath))
                fs_1.default.unlinkSync(mermaidOptimizedPath);
            if (fs_1.default.existsSync(tempPdfPath))
                fs_1.default.unlinkSync(tempPdfPath);
            throw error;
        }
    }
    async createMermaidOptimizedHtml(originalHtmlPath, optimizedHtmlPath) {
        const originalHtml = fs_1.default.readFileSync(originalHtmlPath, 'utf8');
        // Extract body content and title from original HTML
        const bodyMatch = originalHtml.match(/<body[^>]*>([\s\S]*)<\/body>/);
        const bodyContent = bodyMatch ? bodyMatch[1] : originalHtml;
        const titleMatch = originalHtml.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : 'Document';
        // Create optimized HTML using the proven working approach
        const optimizedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- KaTeX CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <!-- KaTeX JS -->
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
    <!-- Mermaid -->
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <!-- Font imports -->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        @page {
            size: A4;
            margin: 2cm;
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
        
        ul, ol {
            margin: 15px 0;
            padding-left: 30px;
        }
        
        li {
            margin-bottom: 8px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
            margin: 15px 0;
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
        
        @media print {
            body {
                font-size: 10pt;
            }
            
            h1 { font-size: 18pt; }
            h2 { font-size: 13pt; }
            h3 { font-size: 11pt; }
            
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
        }
    </style>
</head>
<body>
    <div class="container">
        ${bodyContent}
    </div>
    
    <script>
        // Initialize KaTeX and Mermaid for PDF generation
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded, starting KaTeX and Mermaid rendering...');
            
            // Render KaTeX math first
            document.querySelectorAll('.math-inline').forEach(function(element) {
                const mathText = decodeURIComponent(element.getAttribute('data-math') || element.textContent);
                try {
                    katex.render(mathText, element, {displayMode: false});
                    console.log('Rendered inline math:', mathText.substring(0, 20) + '...');
                } catch (error) {
                    console.error('KaTeX inline error:', error);
                }
            });
            
            document.querySelectorAll('.math-display').forEach(function(element) {
                const mathText = decodeURIComponent(element.getAttribute('data-math') || element.textContent);
                try {
                    katex.render(mathText, element, {displayMode: true});
                    console.log('Rendered display math:', mathText.substring(0, 20) + '...');
                } catch (error) {
                    console.error('KaTeX display error:', error);
                }
            });
            
            // Configure Mermaid with the exact settings that work
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
                },
                securityLevel: 'loose'
            });
            
            const diagrams = document.querySelectorAll('.mermaid-diagram');
            console.log('Found', diagrams.length, 'Mermaid diagrams');
            
            if (diagrams.length === 0) {
                document.body.classList.add('mermaid-ready');
                console.log('No Mermaid diagrams found, marking as ready');
                return;
            }
            
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
                        renderDiv.innerHTML = '<p style="color: #c53030; font-style: italic;">Diagram rendering failed: ' + error.message + '</p>';
                        codeElement.style.display = 'block';
                        renderedCount++;
                        
                        if (renderedCount === diagrams.length) {
                            document.body.classList.add('mermaid-ready');
                        }
                    });
                } catch (error) {
                    console.error('Mermaid setup error for diagram', index + 1, ':', error);
                    renderDiv.innerHTML = '<p style="color: #c53030; font-style: italic;">Diagram setup failed: ' + error.message + '</p>';
                    codeElement.style.display = 'block';
                    renderedCount++;
                    
                    if (renderedCount === diagrams.length) {
                        document.body.classList.add('mermaid-ready');
                    }
                }
            });
        });
    </script>
</body>
</html>`;
        fs_1.default.writeFileSync(optimizedHtmlPath, optimizedHtml);
    }
    markdownToLatex(markdown) {
        // Basic markdown to LaTeX conversion
        return markdown
            .replace(/^# (.*?)$/gm, '\\section{$1}')
            .replace(/^## (.*?)$/gm, '\\subsection{$1}')
            .replace(/^### (.*?)$/gm, '\\subsubsection{$1}')
            .replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}')
            .replace(/\*(.*?)\*/g, '\\textit{$1}')
            .replace(/`([^`]+)`/g, '\\texttt{$1}')
            .replace(/```([\s\S]*?)```/g, '\\begin{verbatim}\n$1\n\\end{verbatim}')
            .replace(/^\* (.*?)$/gm, '\\item $1');
    }
    markdownToRtf(markdown) {
        // Basic markdown to RTF conversion
        return markdown
            .replace(/^# (.*?)$/gm, '{\\b\\fs28 $1\\par}')
            .replace(/^## (.*?)$/gm, '{\\b\\fs24 $1\\par}')
            .replace(/^### (.*?)$/gm, '{\\b\\fs20 $1\\par}')
            .replace(/\*\*(.*?)\*\*/g, '{\\b $1}')
            .replace(/\*(.*?)\*/g, '{\\i $1}')
            .replace(/`([^`]+)`/g, '{\\f1 $1}')
            .replace(/```([\s\S]*?)```/g, '{\\f1 $1\\par}')
            .replace(/^\* (.*?)$/gm, '\\bullet $1\\par')
            .replace(/\n/g, '\\par\n');
    }
    escapeLatex(text) {
        return text
            .replace(/\\/g, '\\textbackslash{}')
            .replace(/[&%$#_{}]/g, '\\$&')
            .replace(/~/g, '\\textasciitilde{}')
            .replace(/\^/g, '\\textasciicircum{}');
    }
    createStyledHtml(content, frontmatter, lang = 'en', outputFormat = 'html') {
        const title = frontmatter.title || 'Document';
        const author = frontmatter.author || '';
        const date = frontmatter.date ? new Date(frontmatter.date).toLocaleDateString() : '';
        return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- KaTeX CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <!-- KaTeX JS -->
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
    <!-- KaTeX auto-render extension -->
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
    
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        ${lang === 'gu' ? `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@300;400;500;600;700&display=swap');` : ''}
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${lang === 'gu' ? "'Noto Sans Gujarati', " : ""}'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .article-header {
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .article-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: #1a202c;
        }
        
        .article-meta {
            font-size: 0.9rem;
            color: #718096;
            margin-bottom: 1rem;
        }
        
        .article-meta span {
            margin-right: 1rem;
        }
        
        .article-content {
            font-size: 1rem;
            line-height: 1.7;
        }
        
        h1, h2, h3, h4, h5, h6 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            font-weight: 600;
            color: #2d3748;
        }
        
        h1 { font-size: 1.8rem; }
        h2 { font-size: 1.6rem; }
        h3 { font-size: 1.4rem; }
        h4 { font-size: 1.2rem; }
        h5 { font-size: 1.1rem; }
        h6 { font-size: 1rem; }
        
        p {
            margin-bottom: 1rem;
        }
        
        ul, ol {
            margin-bottom: 1rem;
            padding-left: 2rem;
        }
        
        li {
            margin-bottom: 0.5rem;
        }
        
        blockquote {
            border-left: 4px solid #3182ce;
            padding-left: 1rem;
            margin: 1rem 0;
            color: #4a5568;
            font-style: italic;
        }
        
        .code-block {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            border-left: 4px solid #3182ce;
            padding: 15px;
            margin: 15px 0;
            overflow-x: auto;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 9pt;
            line-height: 1.4;
            white-space: pre-wrap;
            word-wrap: break-word;
            page-break-inside: avoid;
        }
        
        .code-block code {
            background: none;
            padding: 0;
            border: none;
            border-radius: 0;
            font-family: inherit;
            font-size: inherit;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        code {
            background: #edf2f7;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 9pt;
        }
        
        .table-wrapper {
            overflow-x: auto;
            margin: 1rem 0;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #e2e8f0;
        }
        
        .data-table th,
        .data-table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .data-table th {
            background: #f7fafc;
            font-weight: 600;
        }
        
        .image-wrapper {
            text-align: center;
            margin: 1.5rem 0;
        }
        
        .image-wrapper img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        /* Math styling */
        .math-display {
            text-align: center;
            margin: 1rem 0;
            padding: 1rem;
            background: #f0f8ff;
            border-radius: 6px;
            border-left: 4px solid #4299e1;
        }
        
        .math-inline {
            background: #f0f8ff;
            padding: 0.1rem 0.3rem;
            border-radius: 3px;
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
        
        a {
            color: #3182ce;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        strong {
            font-weight: 600;
        }
        
        em {
            font-style: italic;
        }
        
        hr {
            border: none;
            border-top: 1px solid #e2e8f0;
            margin: 2rem 0;
        }
        
        @media print {
            body {
                print-color-adjust: exact;
                font-size: 10pt;
            }
            
            .mermaid-code {
                display: none !important;
            }
            
            .mermaid-render {
                display: block !important;
                padding: 10px !important;
                page-break-inside: avoid;
            }
            
            .mermaid-render svg {
                max-width: 90% !important;
                max-height: 300px !important;
                height: auto !important;
                width: auto !important;
                display: block !important;
                margin: 0 auto !important;
            }
            
            .code-block {
                page-break-inside: avoid;
                font-size: 8pt !important;
                line-height: 1.3 !important;
            }
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
</head>
<body>
    <div class="article-header">
        <h1 class="article-title">${title}</h1>
        <div class="article-meta">
            ${author ? `<span><strong>Author:</strong> ${author}</span>` : ''}
            ${date ? `<span><strong>Date:</strong> ${date}</span>` : ''}
            ${frontmatter.tags && frontmatter.tags.length ? `<span><strong>Tags:</strong> ${frontmatter.tags.join(', ')}</span>` : ''}
        </div>
    </div>
    <div class="article-content">
        ${content}
    </div>
    
    <script>
        // Initialize KaTeX rendering
        document.addEventListener('DOMContentLoaded', function() {
            // Render inline math
            document.querySelectorAll('.math-inline').forEach(function(element) {
                const mathText = decodeURIComponent(element.getAttribute('data-math') || element.textContent);
                try {
                    katex.render(mathText, element, {displayMode: false});
                } catch (error) {
                    console.error('KaTeX inline error:', error);
                }
            });
            
            // Render display math
            document.querySelectorAll('.math-display').forEach(function(element) {
                const mathText = decodeURIComponent(element.getAttribute('data-math') || element.textContent);
                try {
                    katex.render(mathText, element, {displayMode: true});
                } catch (error) {
                    console.error('KaTeX display error:', error);
                }
            });
            
            // Initialize Mermaid
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
                },
                securityLevel: 'loose'
            });
            
            const diagrams = document.querySelectorAll('.mermaid-diagram .mermaid-code');
            
            let renderedCount = 0;
            diagrams.forEach((codeElement, index) => {
                const renderDiv = codeElement.parentNode.querySelector('.mermaid-render');
                const code = codeElement.textContent.trim();
                const renderId = 'mermaid-svg-' + (index + 1);
                
                try {
                    mermaid.render(renderId, code).then(result => {
                        renderDiv.innerHTML = result.svg;
                        renderedCount++;
                        
                        if (renderedCount === diagrams.length) {
                            document.body.classList.add('mermaid-ready');
                        }
                    }).catch(error => {
                        console.error('Mermaid rendering error:', error);
                        renderDiv.innerHTML = '<p style="color: #c53030;">Diagram rendering failed: ' + error.message + '</p>';
                        codeElement.style.display = 'block';
                        renderedCount++;
                        
                        if (renderedCount === diagrams.length) {
                            document.body.classList.add('mermaid-ready');
                        }
                    });
                } catch (error) {
                    console.error('Mermaid setup error:', error);
                    renderDiv.innerHTML = '<p style="color: #c53030;">Diagram setup failed: ' + error.message + '</p>';
                    codeElement.style.display = 'block';
                    renderedCount++;
                    
                    if (renderedCount === diagrams.length) {
                        document.body.classList.add('mermaid-ready');
                    }
                }
            });
            
            if (diagrams.length === 0) {
                document.body.classList.add('mermaid-ready');
            }
        });
    </script>
</body>
</html>`;
    }
    async convertToPdfLatex(content, frontmatter, options) {
        const latexContent = await this.convertToLatex(content, frontmatter, options);
        const tempTexPath = path_1.default.join(this.tempDir, `temp-${Date.now()}.tex`);
        const tempPdfPath = path_1.default.join(this.tempDir, `temp-${Date.now()}.pdf`);
        try {
            // Write LaTeX to temp file
            fs_1.default.writeFileSync(tempTexPath, latexContent);
            // Convert LaTeX to PDF using pdflatex
            const texDir = path_1.default.dirname(tempTexPath);
            const texFile = path_1.default.basename(tempTexPath);
            const pdfFile = texFile.replace('.tex', '.pdf');
            await execAsync(`cd "${texDir}" && pdflatex -interaction=nonstopmode "${texFile}"`);
            const finalPdfPath = path_1.default.join(texDir, pdfFile);
            if (fs_1.default.existsSync(finalPdfPath)) {
                const buffer = fs_1.default.readFileSync(finalPdfPath);
                // Cleanup temp files
                fs_1.default.unlinkSync(tempTexPath);
                fs_1.default.unlinkSync(finalPdfPath);
                // Clean up auxiliary LaTeX files
                const auxFiles = ['.aux', '.log', '.out'].map(ext => tempTexPath.replace('.tex', ext));
                auxFiles.forEach(file => {
                    if (fs_1.default.existsSync(file))
                        fs_1.default.unlinkSync(file);
                });
                return buffer;
            }
            else {
                throw new Error('PDF generation failed');
            }
        }
        catch (error) {
            // Cleanup on error
            if (fs_1.default.existsSync(tempTexPath))
                fs_1.default.unlinkSync(tempTexPath);
            if (fs_1.default.existsSync(tempPdfPath))
                fs_1.default.unlinkSync(tempPdfPath);
            throw new Error(`LaTeX to PDF conversion failed: ${error}`);
        }
    }
    async convertToMp3(content, frontmatter, options = {}) {
        // This is a placeholder for future MP3/audio podcast generation
        // Will integrate with text-to-speech services like Azure Speech Services, Amazon Polly, or Google Cloud Text-to-Speech
        throw new Error('MP3/Audio conversion is not yet implemented. This feature is coming soon and will include AI-generated podcast-style audio from your content.');
    }
}
exports.ContentConverter = ContentConverter;
