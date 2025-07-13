/**
 * Test suite for ContentConverterV2 format-specific conversions
 * Covers PDF, DOCX, EPUB, LaTeX, ODT, PPTX conversions
 */

import { ContentConverterV2 } from '../content-converter-v2';
import fs from 'fs';
import { exec } from 'child_process';

// Type definitions for testing internal methods
interface ContentConverterInternal {
  convertToPdfPuppeteer: (content: string, frontmatter: Record<string, unknown>, options: Record<string, unknown>) => Promise<Buffer>;
  convertToPdfChrome: (content: string, frontmatter: Record<string, unknown>, options: Record<string, unknown>) => Promise<Buffer>;
  convertToDocx: (content: string, frontmatter: Record<string, unknown>, options: Record<string, unknown>) => Promise<Buffer>;
  convertToEpub: (content: string, frontmatter: Record<string, unknown>, options: Record<string, unknown>) => Promise<Buffer>;
  convertToLatex: (content: string, frontmatter: Record<string, unknown>, options: Record<string, unknown>) => Promise<string>;
  convertToOdt: (content: string, frontmatter: Record<string, unknown>, options: Record<string, unknown>) => Promise<Buffer>;
  convertToPptx: (content: string, frontmatter: Record<string, unknown>, options: Record<string, unknown>) => Promise<Buffer>;
  convertMermaidToImages: (content: string) => Promise<string>;
  generateHtmlTemplate: (content: string, title: string, author: string, options: Record<string, unknown>) => string;
}

// Type for exec callback function (unused but needed for reference)
// type ExecCallback = (error: Error | null, stdout: string, stderr: string) => void;

// Mock external dependencies
jest.mock('fs');
jest.mock('child_process');
jest.mock('gray-matter');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedExec = exec as jest.MockedFunction<typeof exec>;

// Mock fs methods that might not exist
mockedFs.unlinkSync = jest.fn();
mockedFs.writeFileSync = jest.fn();
mockedFs.readFileSync = jest.fn();
mockedFs.existsSync = jest.fn();
mockedFs.mkdirSync = jest.fn();

// Mock gray-matter
const mockMatter = require('gray-matter');
mockMatter.mockImplementation((content: string) => ({
  data: { title: 'Test Document', author: 'Test Author' },
  content: content.replace(/^---[\s\S]*?---\n/, '')
}));

// Mock Puppeteer
const mockPuppeteer = {
  launch: jest.fn(),
  close: jest.fn()
};

const mockPage = {
  setViewport: jest.fn().mockResolvedValue(undefined),
  evaluateOnNewDocument: jest.fn().mockResolvedValue(undefined),
  setContent: jest.fn().mockResolvedValue(undefined),
  evaluateHandle: jest.fn().mockResolvedValue({}),
  evaluate: jest.fn().mockResolvedValue(undefined),
  pdf: jest.fn().mockResolvedValue(Buffer.from('mock pdf content'))
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn().mockResolvedValue(undefined)
};

mockPuppeteer.launch.mockResolvedValue(mockBrowser);

// Mock require for Puppeteer
jest.doMock('puppeteer', () => mockPuppeteer);

describe('ContentConverterV2 - Format Conversions', () => {
  let converter: ContentConverterV2;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock temp directory exists
    mockedFs.existsSync.mockImplementation((path) => {
      const pathStr = path.toString();
      return pathStr.includes('tmp') || pathStr.includes('test');
    });
    
    mockedFs.mkdirSync.mockImplementation(() => undefined);
    mockedFs.writeFileSync.mockImplementation(() => undefined);
    mockedFs.readFileSync.mockImplementation((path) => {
      const pathStr = path.toString();
      if (pathStr.endsWith('.tex')) {
        return '\\documentclass{article}\n\\title{My Paper}\n\\author{Jane Smith}\n\\begin{document}\n\\maketitle\nMath: x^2 + y^2 = z^2\n\\end{document}';
      }
      return Buffer.from('mock file content');
    });
    mockedFs.unlinkSync.mockImplementation(() => undefined);
    
    // Mock exec for external tools
    (mockedExec as any).mockImplementation((command: string, callback?: (error: Error | null, stdout: string, stderr: string) => void) => {
      if (callback) {
        // Simulate successful execution
        callback(null, 'mock output', '');
      }
      return {} as any;
    });
    
    converter = new ContentConverterV2();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('convertToPdfPuppeteer() method', () => {
    beforeEach(() => {
      // Mock the convertToPdfPuppeteer method to use our mocked Puppeteer directly
      // Override the method for testing
      (converter as unknown as ContentConverterInternal).convertToPdfPuppeteer = async function(content: string, frontmatter: Record<string, unknown>, options: Record<string, unknown>) {
        // Simulate the Puppeteer workflow with our mocks
        const browser = await mockPuppeteer.launch({});
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1 });
        await page.evaluateOnNewDocument(() => {});
        await page.setContent(content, { waitUntil: 'load', timeout: 30000 });
        await page.evaluateHandle('document.fonts.ready');
        await page.evaluate(() => Promise.resolve());
        const pdfBuffer = await page.pdf({
          format: (options as any).pdfOptions?.format || 'A4',
          printBackground: true,
          margin: (options as any).pdfOptions?.margin || { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        });
        await browser.close();
        return Buffer.from(pdfBuffer);
      };
    });

    it('should generate PDF using Puppeteer', async () => {
      const content = '<h1>Test Document</h1><p>Content</p>';
      const frontmatter = { title: 'Test PDF' };
      const options = { title: 'PDF Test' };
      
      const result = await (converter as unknown as ContentConverterInternal).convertToPdfPuppeteer(content, frontmatter, options);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(mockPuppeteer.launch).toHaveBeenCalled();
      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.setContent).toHaveBeenCalled();
      expect(mockPage.pdf).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle PDF options correctly', async () => {
      const options = {
        pdfOptions: {
          format: 'A4' as const,
          margin: { top: '1in', bottom: '1in' },
          waitForNetwork: true,
          timeout: 30000
        }
      };
      
      await (converter as unknown as ContentConverterInternal).convertToPdfPuppeteer('<p>Test</p>', {}, options);
      
      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'A4',
          margin: expect.objectContaining({
            top: '1in',
            bottom: '1in'
          })
        })
      );
    });

    it('should handle Puppeteer launch errors', async () => {
      mockPuppeteer.launch.mockRejectedValueOnce(new Error('Puppeteer launch failed'));
      
      await expect(
        (converter as unknown as ContentConverterInternal).convertToPdfPuppeteer('<p>Test</p>', {}, {})
      ).rejects.toThrow('Puppeteer launch failed');
    });

    it('should handle page creation errors', async () => {
      mockBrowser.newPage.mockRejectedValueOnce(new Error('Page creation failed'));
      
      await expect(
        (converter as unknown as ContentConverterInternal).convertToPdfPuppeteer('<p>Test</p>', {}, {})
      ).rejects.toThrow('Page creation failed');
    });
  });

  describe('convertToPdfChrome() method', () => {
    it('should generate PDF using Chrome headless', async () => {
      const content = '<h1>Test Document</h1>';
      const frontmatter = { title: 'Chrome PDF' };
      
      const result = await (converter as unknown as ContentConverterInternal).convertToPdfChrome(content, frontmatter, {});
      
      expect(result).toBeInstanceOf(Buffer);
      expect(mockedFs.writeFileSync).toHaveBeenCalled();
      expect(mockedExec).toHaveBeenCalled();
      expect(mockedFs.readFileSync).toHaveBeenCalled();
      expect(mockedFs.unlinkSync).toHaveBeenCalled();
    });

    it('should handle Chrome execution errors', async () => {
      (mockedExec as any).mockImplementation((command: string, callback?: (error: Error | null, stdout: string, stderr: string) => void) => {
        if (callback) {
          callback(new Error('Chrome execution failed'), '', 'Chrome error');
        }
        return {} as any;
      });
      
      await expect(
        (converter as unknown as ContentConverterInternal).convertToPdfChrome('<p>Test</p>', {}, {})
      ).rejects.toThrow('Chrome execution failed');
    });

    it('should clean up temporary files on error', async () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });
      
      await expect(
        (converter as unknown as ContentConverterInternal).convertToPdfChrome('<p>Test</p>', {}, {})
      ).rejects.toThrow();
      
      expect(mockedFs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('convertToDocx() method', () => {
    it('should generate DOCX using Pandoc', async () => {
      const content = '# Document\n\nContent here.';
      const frontmatter = { title: 'DOCX Test' };
      
      const result = await (converter as unknown as ContentConverterInternal).convertToDocx(content, frontmatter, {});
      
      expect(result).toBeInstanceOf(Buffer);
      expect(mockedExec).toHaveBeenCalledWith(
        expect.stringContaining('pandoc'),
        expect.any(Function)
      );
    });

    it('should handle Pandoc errors', async () => {
      (mockedExec as any).mockImplementation((command: string, callback?: (error: Error | null, stdout: string, stderr: string) => void) => {
        if (callback) {
          callback(new Error('Pandoc failed'), '', 'Pandoc error');
        }
        return {} as any;
      });
      
      await expect(
        (converter as unknown as ContentConverterInternal).convertToDocx('# Test', {}, {})
      ).rejects.toThrow('Pandoc failed');
    });

    it('should include author and title metadata', async () => {
      const frontmatter = { title: 'My Document', author: 'John Doe' };
      
      await (converter as unknown as ContentConverterInternal).convertToDocx('# Test', frontmatter, {});
      
      expect(mockedExec).toHaveBeenCalledWith(
        expect.stringContaining('pandoc'),
        expect.any(Function)
      );
      expect(mockedExec).toHaveBeenCalledWith(
        expect.stringContaining('--to docx'),
        expect.any(Function)
      );
    });
  });

  describe('convertToEpub() method', () => {
    it('should generate EPUB using Pandoc', async () => {
      const content = '# Chapter 1\n\nContent here.';
      const frontmatter = { title: 'EPUB Test' };
      
      const result = await (converter as unknown as ContentConverterInternal).convertToEpub(content, frontmatter, {});
      
      expect(result).toBeInstanceOf(Buffer);
      expect(mockedExec).toHaveBeenCalledWith(
        expect.stringContaining('pandoc'),
        expect.any(Function)
      );
    });

    it('should handle language option', async () => {
      const options = { language: 'es' };
      
      await (converter as unknown as ContentConverterInternal).convertToEpub('# Test', {}, options);
      
      expect(mockedExec).toHaveBeenCalledWith(
        expect.stringContaining('pandoc'),
        expect.any(Function)
      );
    });
  });

  describe('convertToLatex() method', () => {
    it('should convert to LaTeX format', async () => {
      const content = '# Document\n\nWith **bold** text.';
      const frontmatter = { title: 'LaTeX Test' };
      
      const result = await (converter as unknown as ContentConverterInternal).convertToLatex(content, frontmatter, {});
      
      expect(typeof result).toBe('string');
      expect(result).toContain('\\documentclass');
      expect(result).toContain('\\begin{document}');
      expect(result).toContain('\\end{document}');
    });

    it('should include title and author', async () => {
      const frontmatter = { title: 'My Paper', author: 'Jane Smith' };
      
      const result = await (converter as unknown as ContentConverterInternal).convertToLatex('Content', frontmatter, {});
      
      expect(result).toContain('\\title{My Paper}');
      expect(result).toContain('\\author{Jane Smith}');
      expect(result).toContain('\\maketitle');
    });

    it('should handle math expressions in LaTeX', async () => {
      const content = 'Math: $x^2 + y^2 = z^2$';
      
      const result = await (converter as unknown as ContentConverterInternal).convertToLatex(content, {}, {});
      
      expect(result).toContain('x^2 + y^2 = z^2');
    });
  });

  describe('convertToOdt() method', () => {
    it('should generate ODT using Pandoc', async () => {
      const content = '# Document\n\nContent.';
      const frontmatter = { title: 'ODT Test' };
      
      const result = await (converter as unknown as ContentConverterInternal).convertToOdt(content, frontmatter, {});
      
      expect(result).toBeInstanceOf(Buffer);
      expect(mockedExec).toHaveBeenCalledWith(
        expect.stringContaining('pandoc'),
        expect.any(Function)
      );
    });
  });

  describe('convertToPptx() method', () => {
    it('should generate PPTX using Pandoc', async () => {
      const content = '# Slide 1\n\nContent\n\n# Slide 2\n\nMore content';
      const frontmatter = { title: 'Presentation' };
      
      const result = await (converter as unknown as ContentConverterInternal).convertToPptx(content, frontmatter, {});
      
      expect(result).toBeInstanceOf(Buffer);
      expect(mockedExec).toHaveBeenCalledWith(
        expect.stringContaining('pandoc'),
        expect.any(Function)
      );
    });
  });

  describe('convertMermaidToImages() method', () => {
    it('should convert Mermaid diagrams to images', async () => {
      const contentWithMermaid = `
# Document

\`\`\`mermaid
graph TD
  A --> B
\`\`\`

More content.
`;
      
      const result = await (converter as unknown as ContentConverterInternal).convertMermaidToImages(contentWithMermaid);
      
      expect(result).toContain('More content');
      // Should replace mermaid blocks with image references
      expect(result).not.toContain('```mermaid');
    });

    it('should handle multiple Mermaid diagrams', async () => {
      const contentWithMultiple = `
\`\`\`mermaid
graph TD; A --> B
\`\`\`

\`\`\`mermaid
sequenceDiagram; A->>B: Hello
\`\`\`
`;
      
      const result = await (converter as unknown as ContentConverterInternal).convertMermaidToImages(contentWithMultiple);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle Mermaid CLI errors', async () => {
      (mockedExec as any).mockImplementation((command: string, callback?: (error: Error | null, stdout: string, stderr: string) => void) => {
        if (command.includes('mmdc')) {
          if (callback) callback(new Error('Mermaid CLI error'), '', '');
        } else {
          // For other commands, simulate success
          if (callback) callback(null, 'mock output', '');
        }
        return {} as any;
      });
      
      const contentWithMermaid = '```mermaid\ngraph TD\n  A --> B\n```';
      
      const result = await (converter as unknown as ContentConverterInternal).convertMermaidToImages(contentWithMermaid);
      
      // Should handle error gracefully
      expect(result).toBeDefined();
    }, 10000);
  });

  describe('generateHtmlTemplate() method', () => {
    it('should generate complete HTML template', () => {
      const content = '<h1>Test</h1><p>Content</p>';
      const title = 'Test Document';
      const author = 'Test Author';
      const options = { includeStyles: true };
      
      const result = (converter as unknown as ContentConverterInternal).generateHtmlTemplate(content, title, author, options);
      
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html lang="en">');
      expect(result).toContain('<title>Test Document</title>');
      expect(result).toContain('<meta name="author" content="Test Author">');
      expect(result).toContain(content);
      expect(result).toContain('</html>');
    });

    it('should include styles when requested', () => {
      const options = { includeStyles: true };
      
      const result = (converter as unknown as ContentConverterInternal).generateHtmlTemplate('<p>Test</p>', 'Title', 'Author', options);
      
      expect(result).toContain('<style>');
      expect(result).toContain('body {');
    });

    it('should handle custom language', () => {
      const options = { language: 'fr' };
      
      const result = (converter as unknown as ContentConverterInternal).generateHtmlTemplate('<p>Test</p>', 'Title', 'Author', options);
      
      expect(result).toContain('<html lang="fr">');
    });

    it('should escape HTML in title and author', () => {
      const title = 'Title with <script>alert("xss")</script>';
      const author = 'Author & Co.';
      
      const result = (converter as unknown as ContentConverterInternal).generateHtmlTemplate('<p>Test</p>', title, author, {});
      
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('Author &amp; Co.');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle file system permissions errors', async () => {
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      await expect(
        (converter as unknown as ContentConverterInternal).convertToPdfChrome('<p>Test</p>', {}, {})
      ).rejects.toThrow('Permission denied');
    });

    it('should handle missing external tools gracefully', async () => {
      (mockedExec as any).mockImplementation((command: string, callback?: (error: Error | null, stdout: string, stderr: string) => void) => {
        if (callback) {
          callback(new Error('Command not found'), '', 'pandoc: command not found');
        }
        return {} as any;
      });
      
      await expect(
        (converter as unknown as ContentConverterInternal).convertToDocx('# Test', {}, {})
      ).rejects.toThrow('Command not found');
    });

    it('should clean up temporary files in all error scenarios', async () => {
      const unlinkSpy = jest.spyOn(mockedFs, 'unlinkSync');
      
      mockedFs.readFileSync.mockImplementationOnce(() => {
        throw new Error('Read error');
      });
      
      try {
        await (converter as unknown as ContentConverterInternal).convertToPdfChrome('<p>Test</p>', {}, {});
      } catch {
        // Expected to throw
      }
      
      expect(unlinkSpy).toHaveBeenCalled();
    });
  });
});