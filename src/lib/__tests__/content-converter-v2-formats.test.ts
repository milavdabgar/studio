/**
 * Test suite for ContentConverterV2 format-specific conversions
 * Covers PDF, DOCX, EPUB, LaTeX, ODT, PPTX conversions
 */

import { ContentConverterV2 } from '../content-converter-v2';
import fs from 'fs';
import { exec } from 'child_process';

// Mock external dependencies
jest.mock('fs');
jest.mock('child_process');
jest.mock('gray-matter');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedExec = exec as jest.Mocked<typeof exec>;

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
const originalRequire = require;
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
    mockedFs.readFileSync.mockImplementation(() => Buffer.from('mock file content'));
    mockedFs.unlinkSync.mockImplementation(() => undefined);
    
    // Mock exec for external tools
    mockedExec.mockImplementation((command, callback) => {
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
    it('should generate PDF using Puppeteer', async () => {
      const content = '<h1>Test Document</h1><p>Content</p>';
      const frontmatter = { title: 'Test PDF' };
      const options = { title: 'PDF Test' };
      
      const result = await (converter as any).convertToPdfPuppeteer(content, frontmatter, options);
      
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
      
      await (converter as any).convertToPdfPuppeteer('<p>Test</p>', {}, options);
      
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
        (converter as any).convertToPdfPuppeteer('<p>Test</p>', {}, {})
      ).rejects.toThrow('Puppeteer launch failed');
    });

    it('should handle page creation errors', async () => {
      mockBrowser.newPage.mockRejectedValueOnce(new Error('Page creation failed'));
      
      await expect(
        (converter as any).convertToPdfPuppeteer('<p>Test</p>', {}, {})
      ).rejects.toThrow('Page creation failed');
    });
  });

  describe('convertToPdfChrome() method', () => {
    it('should generate PDF using Chrome headless', async () => {
      const content = '<h1>Test Document</h1>';
      const frontmatter = { title: 'Chrome PDF' };
      
      const result = await (converter as any).convertToPdfChrome(content, frontmatter, {});
      
      expect(result).toBeInstanceOf(Buffer);
      expect(mockedFs.writeFileSync).toHaveBeenCalled();
      expect(mockedExec).toHaveBeenCalled();
      expect(mockedFs.readFileSync).toHaveBeenCalled();
      expect(mockedFs.unlinkSync).toHaveBeenCalled();
    });

    it('should handle Chrome execution errors', async () => {
      mockedExec.mockImplementation((command, callback) => {
        if (callback) {
          callback(new Error('Chrome execution failed'), '', 'Chrome error');
        }
        return {} as any;
      });
      
      await expect(
        (converter as any).convertToPdfChrome('<p>Test</p>', {}, {})
      ).rejects.toThrow('Chrome execution failed');
    });

    it('should clean up temporary files on error', async () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });
      
      await expect(
        (converter as any).convertToPdfChrome('<p>Test</p>', {}, {})
      ).rejects.toThrow();
      
      expect(mockedFs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('convertToDocx() method', () => {
    it('should generate DOCX using Pandoc', async () => {
      const content = '# Document\n\nContent here.';
      const frontmatter = { title: 'DOCX Test' };
      
      const result = await (converter as any).convertToDocx(content, frontmatter, {});
      
      expect(result).toBeInstanceOf(Buffer);
      expect(mockedExec).toHaveBeenCalledWith(
        expect.stringContaining('pandoc'),
        expect.any(Function)
      );
    });

    it('should handle Pandoc errors', async () => {
      mockedExec.mockImplementation((command, callback) => {
        if (callback) {
          callback(new Error('Pandoc failed'), '', 'Pandoc error');
        }
        return {} as any;
      });
      
      await expect(
        (converter as any).convertToDocx('# Test', {}, {})
      ).rejects.toThrow('Pandoc failed');
    });

    it('should include author and title metadata', async () => {
      const frontmatter = { title: 'My Document', author: 'John Doe' };
      
      await (converter as any).convertToDocx('# Test', frontmatter, {});
      
      expect(mockedExec).toHaveBeenCalledWith(
        expect.stringContaining('--metadata title="My Document"'),
        expect.any(Function)
      );
      expect(mockedExec).toHaveBeenCalledWith(
        expect.stringContaining('--metadata author="John Doe"'),
        expect.any(Function)
      );
    });
  });

  describe('convertToEpub() method', () => {
    it('should generate EPUB using Pandoc', async () => {
      const content = '# Chapter 1\n\nContent here.';
      const frontmatter = { title: 'EPUB Test' };
      
      const result = await (converter as any).convertToEpub(content, frontmatter, {});
      
      expect(result).toBeInstanceOf(Buffer);
      expect(mockedExec).toHaveBeenCalledWith(
        expect.stringContaining('--to epub'),
        expect.any(Function)
      );
    });

    it('should handle language option', async () => {
      const options = { language: 'es' };
      
      await (converter as any).convertToEpub('# Test', {}, options);
      
      expect(mockedExec).toHaveBeenCalledWith(
        expect.stringContaining('--metadata lang="es"'),
        expect.any(Function)
      );
    });
  });

  describe('convertToLatex() method', () => {
    it('should convert to LaTeX format', async () => {
      const content = '# Document\n\nWith **bold** text.';
      const frontmatter = { title: 'LaTeX Test' };
      
      const result = await (converter as any).convertToLatex(content, frontmatter, {});
      
      expect(typeof result).toBe('string');
      expect(result).toContain('\\documentclass');
      expect(result).toContain('\\begin{document}');
      expect(result).toContain('\\end{document}');
    });

    it('should include title and author', async () => {
      const frontmatter = { title: 'My Paper', author: 'Jane Smith' };
      
      const result = await (converter as any).convertToLatex('Content', frontmatter, {});
      
      expect(result).toContain('\\title{My Paper}');
      expect(result).toContain('\\author{Jane Smith}');
      expect(result).toContain('\\maketitle');
    });

    it('should handle math expressions in LaTeX', async () => {
      const content = 'Math: $x^2 + y^2 = z^2$';
      
      const result = await (converter as any).convertToLatex(content, {}, {});
      
      expect(result).toContain('x^2 + y^2 = z^2');
    });
  });

  describe('convertToOdt() method', () => {
    it('should generate ODT using Pandoc', async () => {
      const content = '# Document\n\nContent.';
      const frontmatter = { title: 'ODT Test' };
      
      const result = await (converter as any).convertToOdt(content, frontmatter, {});
      
      expect(result).toBeInstanceOf(Buffer);
      expect(mockedExec).toHaveBeenCalledWith(
        expect.stringContaining('--to odt'),
        expect.any(Function)
      );
    });
  });

  describe('convertToPptx() method', () => {
    it('should generate PPTX using Pandoc', async () => {
      const content = '# Slide 1\n\nContent\n\n# Slide 2\n\nMore content';
      const frontmatter = { title: 'Presentation' };
      
      const result = await (converter as any).convertToPptx(content, frontmatter, {});
      
      expect(result).toBeInstanceOf(Buffer);
      expect(mockedExec).toHaveBeenCalledWith(
        expect.stringContaining('--to pptx'),
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
      
      const result = await (converter as any).convertMermaidToImages(contentWithMermaid);
      
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
      
      const result = await (converter as any).convertMermaidToImages(contentWithMultiple);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle Mermaid CLI errors', async () => {
      mockedExec.mockImplementation((command, callback) => {
        if (command.includes('mmdc')) {
          if (callback) callback(new Error('Mermaid CLI error'), '', '');
        }
        return {} as any;
      });
      
      const contentWithMermaid = '```mermaid\ngraph TD\n  A --> B\n```';
      
      const result = await (converter as any).convertMermaidToImages(contentWithMermaid);
      
      // Should handle error gracefully
      expect(result).toBeDefined();
    });
  });

  describe('generateHtmlTemplate() method', () => {
    it('should generate complete HTML template', () => {
      const content = '<h1>Test</h1><p>Content</p>';
      const title = 'Test Document';
      const author = 'Test Author';
      const options = { includeStyles: true };
      
      const result = (converter as any).generateHtmlTemplate(content, title, author, options);
      
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html lang="en">');
      expect(result).toContain('<title>Test Document</title>');
      expect(result).toContain('<meta name="author" content="Test Author">');
      expect(result).toContain(content);
      expect(result).toContain('</html>');
    });

    it('should include styles when requested', () => {
      const options = { includeStyles: true };
      
      const result = (converter as any).generateHtmlTemplate('<p>Test</p>', 'Title', 'Author', options);
      
      expect(result).toContain('<style>');
      expect(result).toContain('body {');
    });

    it('should handle custom language', () => {
      const options = { language: 'fr' };
      
      const result = (converter as any).generateHtmlTemplate('<p>Test</p>', 'Title', 'Author', options);
      
      expect(result).toContain('<html lang="fr">');
    });

    it('should escape HTML in title and author', () => {
      const title = 'Title with <script>alert("xss")</script>';
      const author = 'Author & Co.';
      
      const result = (converter as any).generateHtmlTemplate('<p>Test</p>', title, author, {});
      
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
        (converter as any).convertToPdfChrome('<p>Test</p>', {}, {})
      ).rejects.toThrow('Permission denied');
    });

    it('should handle missing external tools gracefully', async () => {
      mockedExec.mockImplementation((command, callback) => {
        if (callback) {
          callback(new Error('Command not found'), '', 'pandoc: command not found');
        }
        return {} as any;
      });
      
      await expect(
        (converter as any).convertToDocx('# Test', {}, {})
      ).rejects.toThrow('Command not found');
    });

    it('should clean up temporary files in all error scenarios', async () => {
      const unlinkSpy = jest.spyOn(mockedFs, 'unlinkSync');
      
      mockedFs.readFileSync.mockImplementationOnce(() => {
        throw new Error('Read error');
      });
      
      try {
        await (converter as any).convertToPdfChrome('<p>Test</p>', {}, {});
      } catch {
        // Expected to throw
      }
      
      expect(unlinkSpy).toHaveBeenCalled();
    });
  });
});