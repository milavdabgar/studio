#!/usr/bin/env node

/**
 * Streamlined Markdown to PDF converter using Chrome headless
 * Supports Gujarati text, math rendering (KaTeX), and Mermaid diagrams
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Import required dependencies
let katex;
try {
    katex = require('katex');
} catch (error) {
    console.log('KaTeX not available, math rendering will be limited');
}

class MarkdownToPdfConverter {
    constructor() {
        this.studyMaterialsDir = path.resolve(__dirname, '../../content/resources/study-materials');
        this.outputDir = path.resolve(__dirname, '../../static/pdfs/study-materials');
        
        // Ensure output directory exists
        this.ensureDirectoryExists(this.outputDir);
    }

    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    async convertMarkdownToPdf(markdownFilePath, outputPdfPath) {
        try {
            console.log(`\n📄 Converting: ${path.basename(markdownFilePath)}`);
            
            // Step 1: Convert Markdown to HTML
            const htmlPath = outputPdfPath.replace('.pdf', '.html');
            await this.convertToHtml(markdownFilePath, htmlPath);
            
            // Step 2: Convert HTML to PDF using Chrome
            const success = await this.convertHtmlToPdf(htmlPath, outputPdfPath);
            
            if (success) {
                console.log(`✅ PDF created: ${outputPdfPath}`);
                return outputPdfPath;
            } else {
                console.log(`⚠️  PDF generation failed, HTML available: ${htmlPath}`);
                return htmlPath;
            }
            
        } catch (error) {
            console.error(`❌ Error converting ${markdownFilePath}: ${error.message}`);
            throw error;
        }
    }

    async convertToHtml(markdownPath, htmlPath) {
        const markdownContent = fs.readFileSync(markdownPath, 'utf8');
        const { data: frontmatter, content } = matter(markdownContent);
        
        // Pre-process content for math and diagrams
        const processedContent = await this.preprocessContent(content);
        
        // Configure marked with custom renderer
        const renderer = new marked.Renderer();
        this.setupCustomRenderer(renderer);
        
        // Convert markdown to HTML
        const htmlContent = marked(processedContent, { renderer });
        
        // Post-process for any remaining issues
        const finalHtml = this.postProcessHtml(htmlContent);
        
        // Detect if content contains Gujarati
        const hasGujarati = /[\u0A80-\u0AFF]/.test(content);
        const lang = hasGujarati ? 'gu' : 'en';
        
        // Create complete HTML document
        const fullHtml = this.createStyledHtml(finalHtml, frontmatter, lang);
        
        // Ensure output directory exists
        this.ensureDirectoryExists(path.dirname(htmlPath));
        
        fs.writeFileSync(htmlPath, fullHtml, 'utf8');
        console.log(`📝 HTML generated: ${htmlPath}`);
    }

    async preprocessContent(content) {
        let processed = content;
        
        // Handle Mermaid diagrams
        processed = await this.processMermaidDiagrams(processed);
        
        // Handle math expressions
        processed = this.processMathExpressions(processed);
        
        return processed;
    }

    async processMermaidDiagrams(content) {
        // Find mermaid code blocks
        const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
        let processed = content;
        let match;
        let diagramId = 0;

        while ((match = mermaidRegex.exec(content)) !== null) {
            const diagramCode = match[1].trim();
            diagramId++;
            
            // Create a placeholder div structure for Mermaid
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
        if (!katex) return content;
        
        let processed = content;
        
        // Handle display math ($$...$$)
        const displayMathRegex = /\$\$([^$]+)\$\$/g;
        processed = processed.replace(displayMathRegex, (match, math) => {
            try {
                const rendered = katex.renderToString(math.trim(), { displayMode: true });
                return `$${rendered}$`;
            } catch (error) {
                console.log(`Math rendering error: ${error.message}`);
                return match;
            }
        });
        
        // Handle inline math ($...$)
        const inlineMathRegex = /(?<!\$)\$([^$\n]+)\$(?!\$)/g;
        processed = processed.replace(inlineMathRegex, (match, math) => {
            try {
                const rendered = katex.renderToString(math.trim(), { displayMode: false });
                return rendered;
            } catch (error) {
                console.log(`Math rendering error: ${error.message}`);
                return match;
            }
        });
        
        return processed;
    }

    setupCustomRenderer(renderer) {
        // Custom code block renderer
        renderer.code = function(code, infostring, escaped) {
            const lang = (infostring || '').match(/\S*/)[0];
            
            if (lang === 'mermaid') {
                // This should already be handled by preprocessing, but just in case
                return `<pre class="mermaid-fallback"><code>${code}</code></pre>`;
            }
            
            const langClass = lang ? ` class="language-${lang}"` : '';
            return `<pre><code${langClass}>${escaped ? code : escapeHtml(code)}</code></pre>`;
        };

        function escapeHtml(html) {
            return html
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
    }

    postProcessHtml(html) {
        // Any additional post-processing can go here
        return html;
    }

    async convertHtmlToPdf(htmlPath, pdfPath) {
        console.log('🔄 Converting HTML to PDF using Chrome headless...');
        
        try {
            const success = await this.generatePdfWithChrome(htmlPath, pdfPath);
            return success;
        } catch (error) {
            console.log(`❌ Chrome PDF generation failed: ${error.message}`);
            return false;
        }
    }

    async generatePdfWithChrome(htmlPath, pdfPath) {
        // Create optimized HTML for Mermaid rendering
        const mermaidOptimizedPath = htmlPath.replace('.html', '-mermaid.html');
        await this.createMermaidOptimizedHtml(htmlPath, mermaidOptimizedPath);
        
        const chromePaths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser'
        ];
        
        for (const chromePath of chromePaths) {
            try {
                if (fs.existsSync(chromePath) || chromePath.includes('google-chrome') || chromePath.includes('chromium')) {
                    // Chrome command with optimal flags for PDF generation
                    const cmd = `"${chromePath}" --headless --disable-gpu --virtual-time-budget=45000 --run-all-compositor-stages-before-draw --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --print-to-pdf="${pdfPath}" "file://${path.resolve(mermaidOptimizedPath)}"`;
                    await execAsync(cmd);
                    
                    // Clean up optimized file
                    try {
                        fs.unlinkSync(mermaidOptimizedPath);
                    } catch (e) {}
                    
                    if (fs.existsSync(pdfPath)) {
                        console.log('✅ Chrome headless with Mermaid support success');
                        return true;
                    }
                }
            } catch (error) {
                // Clean up optimized file on error
                try {
                    fs.unlinkSync(mermaidOptimizedPath);
                } catch (e) {}
                continue;
            }
        }
        
        throw new Error('Chrome not found or PDF generation failed');
    }

    async createMermaidOptimizedHtml(originalHtmlPath, optimizedHtmlPath) {
        const originalHtml = fs.readFileSync(originalHtmlPath, 'utf8');
        
        // Inject enhanced Mermaid rendering script
        const optimizedHtml = originalHtml.replace(
            /<script>/,
            `<script>
        // Enhanced Mermaid rendering for PDF generation
        window.addEventListener('load', function() {
            console.log('Page loaded, initializing Mermaid...');
            setTimeout(initializeMermaid, 2000);
        });
        
        function initializeMermaid() {
            if (typeof mermaid === 'undefined') {
                console.log('Mermaid not loaded, retrying...');
                setTimeout(initializeMermaid, 1000);
                return;
            }
            
            // Configure Mermaid for PDF rendering
            mermaid.initialize({
                startOnLoad: false,
                theme: 'default',
                flowchart: { 
                    useMaxWidth: true, 
                    htmlLabels: true,
                    nodeSpacing: 30,
                    rankSpacing: 40
                },
                fontSize: 12,
                securityLevel: 'loose'
            });
            
            const diagrams = document.querySelectorAll('.mermaid-diagram .mermaid-code');
            console.log('Found ' + diagrams.length + ' diagrams to render');
            
            if (diagrams.length === 0) {
                return;
            }
            
            let completed = 0;
            diagrams.forEach(function(codeEl, index) {
                const renderDiv = codeEl.parentNode.querySelector('.mermaid-render');
                const code = codeEl.textContent;
                
                try {
                    mermaid.render('diagram-' + index, code, function(svgCode) {
                        renderDiv.innerHTML = svgCode;
                        completed++;
                        console.log('Rendered diagram ' + (index + 1) + '/' + diagrams.length);
                    });
                } catch (error) {
                    console.error('Mermaid rendering error:', error);
                    completed++;
                }
            });
        }
    </script>
    <script>`
        );
        
        fs.writeFileSync(optimizedHtmlPath, optimizedHtml);
    }

    createStyledHtml(content, frontmatter = {}, lang = 'en') {
        const title = frontmatter.title || 'Study Material';
        const date = new Date().toLocaleDateString('en-GB');
        
        return `<!DOCTYPE html>
<html lang="${lang}">
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
            size: A4;
            margin: 2cm;
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: ${lang === 'gu' ? "'Noto Sans Gujarati', " : ""}'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
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
            Generated on ${date} | Automated PDF Generation System
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

    async convertAllStudyMaterials() {
        console.log('🚀 Starting conversion of all study materials...');
        
        const markdownFiles = this.findAllMarkdownFiles(this.studyMaterialsDir);
        console.log(`📊 Found ${markdownFiles.length} markdown files to convert`);
        
        let successCount = 0;
        let failureCount = 0;
        
        for (const markdownFile of markdownFiles) {
            try {
                const relativePath = path.relative(this.studyMaterialsDir, markdownFile);
                const outputPath = path.join(this.outputDir, relativePath.replace(/\.md$/, '.pdf'));
                
                await this.convertMarkdownToPdf(markdownFile, outputPath);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to convert ${markdownFile}: ${error.message}`);
                failureCount++;
            }
        }
        
        console.log(`\n📈 Conversion Summary:`);
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${failureCount}`);
        console.log(`📊 Total: ${markdownFiles.length}`);
    }

    findAllMarkdownFiles(directory) {
        const markdownFiles = [];
        
        const scanDirectory = (dir) => {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (item.endsWith('.md')) {
                    markdownFiles.push(fullPath);
                }
            }
        };
        
        scanDirectory(directory);
        return markdownFiles;
    }
}

// Command-line interface
if (require.main === module) {
    const converter = new MarkdownToPdfConverter();
    
    if (process.argv.length >= 4) {
        // Convert specific file
        const [,, inputFile, outputFile] = process.argv;
        converter.convertMarkdownToPdf(inputFile, outputFile).catch(console.error);
    } else if (process.argv.length === 3 && process.argv[2] === '--help') {
        console.log(`
Usage:
  node pdf-converter.js                    # Convert all study materials
  node pdf-converter.js input.md output.pdf # Convert specific file
  node pdf-converter.js --help             # Show this help
        `);
    } else {
        // Convert all study materials
        converter.convertAllStudyMaterials().catch(console.error);
    }
}

module.exports = MarkdownToPdfConverter;
