import { marked } from 'marked';
import matter from 'gray-matter';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

interface PostData {
  title: string;
  author?: string;
  date?: string;
  tags?: string[];
  categories?: string[];
  description?: string;
  [key: string]: any;
}

export class MarkdownToPdfConverter {
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Convert markdown content to PDF
   */
  async convertMarkdownToPdf(
    markdownContent: string,
    filename: string = 'article'
  ): Promise<Buffer> {
    try {
      // Parse frontmatter and content
      const { data: frontmatter, content } = matter(markdownContent);
      
      // Pre-process content for math and diagrams
      const processedContent = await this.preprocessContent(content);
      
      // Configure marked with custom renderer
      const renderer = new marked.Renderer();
      this.setupCustomRenderer(renderer);
      
      // Convert markdown to HTML
      const htmlContent = await marked(processedContent, { renderer });
      
      // Post-process for any remaining issues
      const finalHtml = this.postProcessHtml(htmlContent);
      
      // Detect if content contains Gujarati
      const hasGujarati = /[\u0A80-\u0AFF]/.test(content);
      const lang = hasGujarati ? 'gu' : 'en';
      
      // Create complete HTML document
      const fullHtml = this.createStyledHtml(finalHtml, frontmatter as PostData, lang);
      
      // Generate PDF using Puppeteer
      const pdfBuffer = await this.generatePdfWithPuppeteer(fullHtml, filename);
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error converting markdown to PDF:', error);
      throw new Error('Failed to convert markdown to PDF');
    }
  }

  /**
   * Preprocess content for math expressions and Mermaid diagrams
   */
  private async preprocessContent(content: string): Promise<string> {
    let processed = content;
    
    // Process math expressions
    processed = this.processMathExpressions(processed);
    
    // Process Mermaid diagrams
    processed = await this.processMermaidDiagrams(processed);
    
    return processed;
  }

  /**
   * Process Mermaid diagrams
   */
  private async processMermaidDiagrams(content: string): Promise<string> {
    const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
    let processed = content;
    let match;
    let diagramId = 0;

    while ((match = mermaidRegex.exec(content)) !== null) {
      const diagramCode = match[1].trim();
      diagramId++;
      
      // Create a placeholder div structure for Mermaid (similar to Hugo version)
      const placeholder = `
<div class="mermaid-diagram" data-diagram-id="${diagramId}">
<pre class="mermaid-code">${diagramCode}</pre>
<div class="mermaid-render" id="mermaid-${diagramId}"></div>
</div>`;
      
      processed = processed.replace(match[0], placeholder);
    }

    return processed;
  }

  /**
   * Process math expressions for KaTeX
   */
  private processMathExpressions(content: string): string {
    // Handle block math
    content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
      return `<div class="math-block" data-math="${encodeURIComponent(math.trim())}">${math.trim()}</div>`;
    });

    // Handle inline math
    content = content.replace(/\$([^$\n]+?)\$/g, (match, math) => {
      return `<span class="math-inline" data-math="${encodeURIComponent(math.trim())}">${math.trim()}</span>`;
    });

    return content;
  }

  /**
   * Setup custom renderer for marked
   */
  private setupCustomRenderer(renderer: any) {
    // Custom code block renderer with proper line break handling
    renderer.code = (code: string, language?: string) => {
      const lang = language || '';
      
      // Preserve line breaks and properly escape HTML
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\n/g, '\n'); // Preserve actual newlines
      
      return `<pre class="code-block"><code class="language-${lang}">${escapedCode}</code></pre>`;
    };

    // Custom table renderer
    renderer.table = (header: string, body: string) => {
      return `<div class="table-wrapper"><table class="data-table">${header}${body}</table></div>`;
    };

    // Custom image renderer
    renderer.image = (href: string, title?: string, text?: string) => {
      const titleAttr = title ? ` title="${title}"` : '';
      const altAttr = text ? ` alt="${text}"` : '';
      return `<div class="image-wrapper"><img src="${href}"${titleAttr}${altAttr} /></div>`;
    };
  }

  /**
   * Post-process HTML for better PDF rendering
   */
  private postProcessHtml(html: string): string {
    // Fix common HTML issues for PDF
    return html
      .replace(/<br\s*\/?>/gi, '<br />')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate PDF using Puppeteer
   */
  private async generatePdfWithPuppeteer(html: string, filename: string): Promise<Buffer> {
    let browser;
    
    try {
      const executablePath = this.isProduction
        ? await chromium.executablePath('/opt/nodejs/node_modules/@sparticuz/chromium-min/bin')
        : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

      browser = await puppeteer.launch({
        args: this.isProduction ? chromium.args : [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--font-render-hinting=none'
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: true,
      });

      const page = await browser.newPage();
      
      // Set content with proper encoding and wait for resources
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
      });

      // Wait for fonts to load
      await page.evaluateHandle('document.fonts.ready');
      
      // Add Mermaid library and initialize diagrams (similar to Hugo version)
      await page.addScriptTag({
        url: 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js'
      });
      
      // Initialize and render Mermaid diagrams
      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          if (typeof (window as any).mermaid === 'undefined') {
            resolve();
            return;
          }

          // Configure Mermaid for PDF rendering (like in Hugo version)
          (window as any).mermaid.initialize({
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
            resolve();
            return;
          }
          
          let completed = 0;
          diagrams.forEach((codeEl: Element, index: number) => {
            const renderDiv = codeEl.parentNode?.querySelector('.mermaid-render') as HTMLElement;
            const code = codeEl.textContent || '';
            
            try {
              (window as any).mermaid.render('diagram-' + index, code, (svgCode: string) => {
                if (renderDiv) {
                  renderDiv.innerHTML = svgCode;
                }
                completed++;
                console.log('Rendered diagram ' + (index + 1) + '/' + diagrams.length);
                
                if (completed === diagrams.length) {
                  // Wait a bit more for rendering to complete
                  setTimeout(() => resolve(), 1000);
                }
              });
            } catch (error) {
              console.error('Mermaid rendering error:', error);
              completed++;
              if (completed === diagrams.length) {
                setTimeout(() => resolve(), 1000);
              }
            }
          });
        });
      });

      // Additional wait to ensure all rendering is complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Process math expressions
      await page.evaluate(() => {
        // Simple math processing for PDF (fallback when KaTeX is not available)
        const mathElements = document.querySelectorAll('.math-block, .math-inline');
        mathElements.forEach((element) => {
          const math = decodeURIComponent(element.getAttribute('data-math') || '');
          element.innerHTML = `<code class="math">${math}</code>`;
        });
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
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
            <span style="color: #666;">${filename}</span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; margin: 0 15mm;">
            <span style="color: #666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        `,
      });

      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF with Puppeteer:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Create styled HTML document
   */
  private createStyledHtml(content: string, frontmatter: PostData, lang: string = 'en'): string {
    const title = frontmatter.title || 'Article';
    const author = frontmatter.author || '';
    const date = frontmatter.date ? new Date(frontmatter.date).toLocaleDateString() : '';
    
    return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
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
        
        .math-block {
            text-align: center;
            margin: 1rem 0;
            padding: 1rem;
            background: #f7fafc;
            border-radius: 6px;
        }
        
        .math-inline {
            background: #edf2f7;
            padding: 0.1rem 0.3rem;
            border-radius: 3px;
        }
        
        /* Mermaid diagram styling (like Hugo version) */
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
            
            /* Code blocks for print */
            .code-block {
                page-break-inside: avoid;
                font-size: 8pt !important;
                line-height: 1.3 !important;
            }
        }
    </style>
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
</body>
</html>`;
  }
}

export default MarkdownToPdfConverter;
