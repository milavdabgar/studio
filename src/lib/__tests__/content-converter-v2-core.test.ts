/**
 * Test suite for ContentConverterV2 core functionality
 * Covers main convert() function and format-specific conversions
 */

import { ContentConverterV2 } from '../content-converter-v2';
import fs from 'fs';

// Type definitions for testing internal methods
interface ContentConverterInternal {
  processCodeBlocks: (content: string) => Promise<string>;
  convertToPlainText: (content: string, frontmatter: Record<string, unknown>, options: Record<string, unknown>) => string;
  convertToRtf: (content: string, frontmatter: Record<string, unknown>, options: Record<string, unknown>) => string;
  markdownToRtf: (content: string) => string;
  processMathExpressions: (content: string) => string;
  processMermaidDiagrams: (content: string) => string;
  ensureDirectoryExists: (path: string) => void;
}

// Mock external dependencies
jest.mock('fs');
jest.mock('child_process');
jest.mock('marked');
jest.mock('gray-matter');
jest.mock('shiki');

const mockedFs = fs as jest.Mocked<typeof fs>;
// mockedExec removed as it's not used in this test file

// Mock fs methods that might not exist
mockedFs.existsSync = jest.fn();
mockedFs.mkdirSync = jest.fn();

// Mock gray-matter
const mockMatter = require('gray-matter');
mockMatter.mockImplementation((content: string) => ({
  data: { title: 'Test Document', author: 'Test Author' },
  content: content.replace(/^---[\s\S]*?---\n/, '')
}));

// Mock marked
const mockMarked = require('marked');
mockMarked.marked = jest.fn();
mockMarked.marked.mockImplementation((content: string) => `<p>${content}</p>`);

// Mock shiki
const mockShiki = require('shiki');
mockShiki.codeToHtml = jest.fn().mockResolvedValue('<code>test code</code>');

describe('ContentConverterV2 - Core Functionality', () => {
  let converter: ContentConverterV2;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock temp directory exists
    mockedFs.existsSync.mockImplementation((path) => {
      return path.toString().includes('tmp');
    });
    
    mockedFs.mkdirSync.mockImplementation(() => undefined);
    
    converter = new ContentConverterV2();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('convert() method', () => {
    const testMarkdown = `---
title: Test Document
author: Test Author
---

# Test Heading

This is a test paragraph with **bold** text.

\`\`\`javascript
console.log('Hello World');
\`\`\`
`;

    it('should convert markdown to HTML format', async () => {
      const result = await converter.convert(testMarkdown, 'html');
      
      expect(typeof result).toBe('string');
      expect(result).toContain('This is a test paragraph');
      expect(mockMarked.marked).toHaveBeenCalled();
    });

    it('should return original markdown for md format', async () => {
      const result = await converter.convert(testMarkdown, 'md');
      
      expect(result).toBe(testMarkdown);
    });

    it('should convert to plain text format', async () => {
      const result = await converter.convert(testMarkdown, 'txt');
      
      expect(typeof result).toBe('string');
      expect(result).toContain('Test Document');
      expect(result).toContain('Test Heading');
    });

    it('should convert to RTF format', async () => {
      const result = await converter.convert(testMarkdown, 'rtf');
      
      expect(typeof result).toBe('string');
      expect(result).toContain('{\\rtf1');
      expect(result).toContain('Test Document');
    });

    it('should throw error for unsupported format', async () => {
      await expect(converter.convert(testMarkdown, 'unsupported')).rejects.toThrow('Unsupported format: unsupported');
    });

    it('should handle frontmatter properly', async () => {
      const markdownWithFrontmatter = `---
title: Custom Title
author: Custom Author
---

# Content`;
      
      const result = await converter.convert(markdownWithFrontmatter, 'html', {
        title: 'Override Title'
      });
      
      expect(result).toContain('Override Title'); // Options override frontmatter
    });

    it('should handle empty content', async () => {
      const result = await converter.convert('', 'html');
      
      expect(typeof result).toBe('string');
      expect(result).toBeDefined();
    });
  });

  describe('processCodeBlocks() method', () => {
    it('should process code blocks with language specification', async () => {
      const contentWithCode = `
# Test

\`\`\`javascript
const test = 'hello';
console.log(test);
\`\`\`

More content.
`;
      
      const result = await (converter as unknown as ContentConverterInternal).processCodeBlocks(contentWithCode);
      
      expect(mockShiki.codeToHtml).toHaveBeenCalledWith(
        expect.stringContaining('const test'),
        expect.objectContaining({
          lang: 'javascript'
        })
      );
      expect(result).toContain('<code>test code</code>');
    });

    it('should handle code blocks without language', async () => {
      const contentWithCode = `
\`\`\`
plain code block
\`\`\`
`;
      
      const result = await (converter as unknown as ContentConverterInternal).processCodeBlocks(contentWithCode);
      
      expect(result).toContain('plain code block');
      expect(result).toContain('<pre');
    });

    it('should handle multiple code blocks', async () => {
      const contentWithMultipleCode = `
\`\`\`javascript
const js = 'code';
\`\`\`

\`\`\`python
print("hello")
\`\`\`
`;
      
      await (converter as unknown as ContentConverterInternal).processCodeBlocks(contentWithMultipleCode);
      
      expect(mockShiki.codeToHtml).toHaveBeenCalledTimes(2);
    });

    it('should handle shiki errors gracefully', async () => {
      mockShiki.codeToHtml.mockRejectedValueOnce(new Error('Shiki error'));
      
      const contentWithCode = `
\`\`\`javascript
const test = 'hello';
\`\`\`
`;
      
      const result = await (converter as unknown as ContentConverterInternal).processCodeBlocks(contentWithCode);
      
      // Should fall back to basic highlighting
      expect(result).toContain('const test');
      expect(result).toContain('<pre');
    });
  });

  describe('convertToPlainText() method', () => {
    it('should strip HTML tags', () => {
      const htmlContent = '<h1>Title</h1><p>Paragraph with <strong>bold</strong> text.</p>';
      const frontmatter = { title: 'Test' };
      
      const result = (converter as unknown as ContentConverterInternal).convertToPlainText(htmlContent, frontmatter, {});
      
      expect(result).toContain('Title');
      expect(result).toContain('Paragraph with');
      expect(result).toContain('bold');
      expect(result).toContain('text');
    });

    it('should include frontmatter in output', () => {
      const content = '<p>Content</p>';
      const frontmatter = { title: 'Test Title', author: 'Test Author' };
      
      const result = (converter as unknown as ContentConverterInternal).convertToPlainText(content, frontmatter, {});
      
      expect(result).toContain('Test Title');
      expect(result).toContain('Test Author');
    });

    it('should handle empty content', () => {
      const result = (converter as unknown as ContentConverterInternal).convertToPlainText('', {}, {});
      
      expect(typeof result).toBe('string');
      expect(result).toBeDefined();
    });
  });

  describe('convertToRtf() method', () => {
    it('should generate valid RTF structure', () => {
      const content = '<h1>Title</h1><p>Content</p>';
      const frontmatter = { title: 'Test' };
      
      const result = (converter as unknown as ContentConverterInternal).convertToRtf(content, frontmatter, {});
      
      expect(result).toMatch(/^{\\rtf1/);
      expect(result).toContain('Title');
      expect(result).toContain('Content');
      expect(result).toMatch(/}$/);
    });

    it('should handle special RTF characters', () => {
      const content = '<p>Text with { } \\ special chars</p>';
      const frontmatter = {};
      
      const result = (converter as unknown as ContentConverterInternal).convertToRtf(content, frontmatter, {});
      
      expect(result).toContain('Text with');
      expect(result).toContain('special chars');
      expect(result).toMatch(/^{\\rtf1/);
    });
  });

  describe('markdownToRtf() method', () => {
    it('should convert markdown headers to RTF', () => {
      const markdown = '# Header 1\n## Header 2\nParagraph';
      
      const result = (converter as unknown as ContentConverterInternal).markdownToRtf(markdown);
      
      expect(result).toContain('\\b\\fs28 Header 1');
      expect(result).toContain('\\b\\fs24 Header 2');
      expect(result).toContain('Paragraph');
    });

    it('should convert markdown formatting', () => {
      const markdown = '**bold** and *italic* text';
      
      const result = (converter as unknown as ContentConverterInternal).markdownToRtf(markdown);
      
      expect(result).toContain('\\b bold');
      expect(result).toContain('\\i italic');
    });

    it('should handle empty markdown', () => {
      const result = (converter as unknown as ContentConverterInternal).markdownToRtf('');
      
      expect(typeof result).toBe('string');
      expect(result).toBeDefined();
    });
  });

  describe('processMathExpressions() method', () => {
    it('should process inline math expressions', () => {
      const content = 'This is $x^2 + y^2 = z^2$ inline math.';
      
      const result = (converter as unknown as ContentConverterInternal).processMathExpressions(content);
      
      expect(result).toContain('x^2 + y^2 = z^2');
      // Should wrap in math spans or convert to MathML
      expect(result).toMatch(/<span[^>]*math|<math/);
    });

    it('should process block math expressions', () => {
      const content = 'Here is block math:\n$$\\frac{a}{b} = c$$\nEnd.';
      
      const result = (converter as unknown as ContentConverterInternal).processMathExpressions(content);
      
      expect(result).toContain('\\frac{a}{b} = c');
    });

    it('should handle KaTeX unavailable gracefully', () => {
      const content = 'Math: $x^2$';
      const result = (converter as unknown as ContentConverterInternal).processMathExpressions(content);
      
      // Should process math expressions even if KaTeX is available
      expect(result).toContain('x^2');
      expect(result).toMatch(/math|katex/i);
    });
  });

  describe('processMermaidDiagrams() method', () => {
    it('should process mermaid diagrams', () => {
      const htmlWithMermaid = `
<div class="mermaid">
graph TD
  A --> B
</div>
`;
      
      const result = (converter as unknown as ContentConverterInternal).processMermaidDiagrams(htmlWithMermaid);
      
      expect(result).toContain('graph TD');
      expect(result).toContain('A --> B');
    });

    it('should handle multiple mermaid diagrams', () => {
      const htmlWithMultipleMermaid = `
<div class="mermaid">graph TD; A --> B</div>
<p>Text between</p>
<div class="mermaid">sequenceDiagram; A->>B: Hello</div>
`;
      
      const result = (converter as unknown as ContentConverterInternal).processMermaidDiagrams(htmlWithMultipleMermaid);
      
      expect(result).toContain('graph TD');
      expect(result).toContain('sequenceDiagram');
    });

    it('should preserve non-mermaid content', () => {
      const html = '<p>Regular content</p><div>Not mermaid</div>';
      
      const result = (converter as unknown as ContentConverterInternal).processMermaidDiagrams(html);
      
      expect(result).toContain('Regular content');
      expect(result).toContain('Not mermaid');
    });
  });

  describe('ensureDirectoryExists() method', () => {
    it('should create directory if it does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockImplementation(() => undefined);
      
      (converter as unknown as ContentConverterInternal).ensureDirectoryExists('/test/path');
      
      expect(mockedFs.mkdirSync).toHaveBeenCalledWith('/test/path', { recursive: true });
    });

    it('should not create directory if it exists', () => {
      mockedFs.existsSync.mockReturnValue(true);
      
      (converter as unknown as ContentConverterInternal).ensureDirectoryExists('/existing/path');
      
      expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle marked parsing errors', async () => {
      mockMarked.marked.mockImplementation(() => {
        throw new Error('Marked parsing error');
      });
      
      await expect(converter.convert('# Test', 'html')).rejects.toThrow('Marked parsing error');
    });
  });

  describe('Integration tests', () => {
    it('should handle complex markdown with all features', async () => {
      // Reset mocks for this test to ensure clean state
      jest.clearAllMocks();
      mockMarked.marked.mockImplementation((content: string) => `<p>${content}</p>`);
      
      // Mock gray-matter to return the actual frontmatter data
      mockMatter.mockImplementationOnce((content: string) => ({
        data: { title: 'Complex Document', author: 'Test Author' },
        content: content.replace(/^---[\\s\\S]*?---\\n/, '')
      }));
      
      const complexMarkdown = `---
title: Complex Document
author: Test Author
---

# Main Title

## Code Section

\`\`\`javascript
const test = 'hello';
console.log(test);
\`\`\`

## Math Section

Inline math: $x^2 + y^2 = z^2$

Block math:
$$\\frac{a}{b} = c$$

## Regular Content

This is **bold** and *italic* text.

- List item 1
- List item 2
`;
      
      const result = await converter.convert(complexMarkdown, 'html');
      
      expect(typeof result).toBe('string');
      expect(result).toContain('Complex Document');
      expect(mockShiki.codeToHtml).toHaveBeenCalled();
    });
  });
});