/**
 * Test suite for ContentConverterV2 path resolution and SVG utilities
 * Covers path resolution, API fetching, and edge cases
 */

import { ContentConverterV2 } from '../content-converter-v2';
import fs from 'fs';
import fetch from 'node-fetch';

// Mock external dependencies
jest.mock('fs');
jest.mock('node-fetch');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock fs methods that might not exist
mockedFs.existsSync = jest.fn();
mockedFs.readFileSync = jest.fn();
mockedFs.mkdirSync = jest.fn();

describe('ContentConverterV2 - Path Resolution and Utilities', () => {
  let converter: ContentConverterV2;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up fs mocks before instantiation
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.mkdirSync.mockImplementation(() => undefined);
    
    converter = new ContentConverterV2();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('resolveRelativeSvgPath() method', () => {
    beforeEach(() => {
      // Mock file existence checks
      mockedFs.existsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.includes('existing-file.svg') || 
               pathStr.includes('content/resources');
      });
    });

    it('should resolve SVG path relative to content directory', () => {
      const contentPath = '/project/content/docs/file.md';
      const svgPath = 'diagrams/test.svg';
      
      const result = (converter as any).resolveRelativeSvgPath(svgPath, contentPath);
      
      expect(result).toContain('diagrams/test.svg');
    });

    it('should try multiple resolution paths', () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.existsSync.mockReturnValueOnce(false) // First attempt
                       .mockReturnValueOnce(false) // Second attempt  
                       .mockReturnValueOnce(true);  // Third attempt succeeds
      
      const result = (converter as any).resolveRelativeSvgPath('test.svg', '/content/file.md');
      
      expect(mockedFs.existsSync).toHaveBeenCalledTimes(3);
      expect(result).toBeDefined();
    });

    it('should return null when file not found', () => {
      mockedFs.existsSync.mockReturnValue(false);
      
      const result = (converter as any).resolveRelativeSvgPath('nonexistent.svg', '/content/file.md');
      
      expect(result).toBeNull();
    });

    it('should handle missing contentPath', () => {
      const result = (converter as any).resolveRelativeSvgPath('test.svg');
      
      expect(result).toBeDefined(); // Should still attempt resolution
    });

    it('should handle absolute paths by returning early', () => {
      const absolutePath = '/absolute/path/to/file.svg';
      
      const result = (converter as any).resolveRelativeSvgPath(absolutePath, '/content/file.md');
      
      expect(result).toBe(absolutePath);
    });
  });

  describe('fetchSvgFromApi() method', () => {
    beforeEach(() => {
      // Mock successful fetch response
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue('<svg>test content</svg>')
      };
      mockedFetch.mockResolvedValue(mockResponse as any);
    });

    it('should fetch SVG content from API endpoint', async () => {
      const apiPath = '/api/diagrams/test.svg';
      
      const result = await (converter as any).fetchSvgFromApi(apiPath);
      
      expect(mockedFetch).toHaveBeenCalledWith(
        expect.stringContaining(apiPath),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'image/svg+xml,text/plain,*/*'
          })
        })
      );
      expect(result).toBe('<svg>test content</svg>');
    });

    it('should handle fetch errors gracefully', async () => {
      mockedFetch.mockRejectedValue(new Error('Network error'));
      
      const result = await (converter as any).fetchSvgFromApi('/api/test.svg');
      
      expect(result).toBeNull();
    });

    it('should handle non-ok responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      };
      mockedFetch.mockResolvedValue(mockResponse as any);
      
      const result = await (converter as any).fetchSvgFromApi('/api/test.svg');
      
      expect(result).toBeNull();
    });

    it('should handle invalid response content', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockRejectedValue(new Error('Invalid content'))
      };
      mockedFetch.mockResolvedValue(mockResponse as any);
      
      const result = await (converter as any).fetchSvgFromApi('/api/test.svg');
      
      expect(result).toBeNull();
    });

    it('should construct proper API URL', async () => {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      await (converter as any).fetchSvgFromApi('/api/diagrams/test.svg');
      
      expect(mockedFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/diagrams/test.svg`,
        expect.any(Object)
      );
    });
  });

  describe('resolveSvgPath() method', () => {
    beforeEach(() => {
      mockedFs.existsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.includes('existing-file.svg') || 
               pathStr.includes('public/') ||
               pathStr.includes('content/resources');
      });
    });

    it('should return absolute paths as-is', () => {
      const absolutePath = '/absolute/path/to/file.svg';
      
      const result = (converter as any).resolveSvgPath(absolutePath);
      
      expect(result).toBe(absolutePath);
    });

    it('should resolve relative paths in public directory', () => {
      const relativePath = 'images/diagram.svg';
      
      const result = (converter as any).resolveSvgPath(relativePath);
      
      expect(result).toContain('public');
      expect(result).toContain('images/diagram.svg');
    });

    it('should try content/resources directory', () => {
      mockedFs.existsSync.mockReturnValueOnce(false) // public attempt fails
                       .mockReturnValueOnce(true);  // content/resources succeeds
      
      const result = (converter as any).resolveSvgPath('test.svg');
      
      expect(result).toContain('content/resources');
    });

    it('should fallback to original path when not found', () => {
      mockedFs.existsSync.mockReturnValue(false);
      
      const result = (converter as any).resolveSvgPath('missing.svg');
      
      expect(result).toContain('missing.svg');
    });

    it('should handle current working directory correctly', () => {
      const originalCwd = process.cwd();
      
      const result = (converter as any).resolveSvgPath('test.svg');
      
      expect(result).toContain(originalCwd);
    });
  });

  describe('processSvgForPandoc() method', () => {
    beforeEach(() => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('<svg>test content</svg>');
    });

    it('should convert markdown image syntax to HTML for Pandoc', async () => {
      const markdownWithImages = `
# Document

![Diagram 1](diagram1.svg)

Some text.

![Diagram 2](path/to/diagram2.svg "Diagram Title")
`;
      
      const result = await (converter as any).processSvgForPandoc(markdownWithImages);
      
      expect(result).toContain('<div class="svg-container">');
      expect(result).toContain('<svg>test content</svg>');
      expect(result).not.toContain('![Diagram 1]');
      expect(result).not.toContain('![Diagram 2]');
    });

    it('should preserve image titles and alt text', async () => {
      const markdownWithTitle = '![Alt Text](test.svg "Image Title")';
      
      const result = await (converter as any).processSvgForPandoc(markdownWithTitle);
      
      expect(result).toContain('title="Image Title"');
      expect(result).toContain('Alt Text');
    });

    it('should handle missing SVG files', async () => {
      mockedFs.existsSync.mockReturnValue(false);
      
      const markdownWithMissing = '![Missing](missing.svg)';
      
      const result = await (converter as any).processSvgForPandoc(markdownWithMissing);
      
      expect(result).toContain('[SVG Not Found: missing.svg]');
    });

    it('should handle SVG read errors', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });
      
      const markdownWithError = '![Error](error.svg)';
      
      const result = await (converter as any).processSvgForPandoc(markdownWithError);
      
      expect(result).toContain('[SVG Error: error.svg]');
    });

    it('should try API fetching when file not found', async () => {
      mockedFs.existsSync.mockReturnValue(false);
      
      // Mock fetchSvgFromApi to return content
      const originalFetch = (converter as any).fetchSvgFromApi;
      (converter as any).fetchSvgFromApi = jest.fn().mockResolvedValue('<svg>api content</svg>');
      
      const result = await (converter as any).processSvgForPandoc('![Test](api/test.svg)');
      
      expect(result).toContain('<svg>api content</svg>');
      
      // Restore
      (converter as any).fetchSvgFromApi = originalFetch;
    });

    it('should handle multiple images in same document', async () => {
      const markdownWithMultiple = `
![Image 1](img1.svg)
![Image 2](img2.svg)
![Image 3](img3.svg)
`;
      
      const result = await (converter as any).processSvgForPandoc(markdownWithMultiple);
      
      const svgContainers = (result.match(/<div class="svg-container">/g) || []).length;
      expect(svgContainers).toBe(3);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty SVG paths', () => {
      const result = (converter as any).resolveSvgPath('');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle null/undefined paths gracefully', () => {
      expect(() => (converter as any).resolveSvgPath(null)).not.toThrow();
      expect(() => (converter as any).resolveSvgPath(undefined)).not.toThrow();
    });

    it('should handle file system permission errors', () => {
      mockedFs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      expect(() => (converter as any).resolveSvgPath('test.svg')).not.toThrow();
    });

    it('should handle malformed SVG content', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('not valid svg content');
      
      const result = await (converter as any).processSvgForPandoc('![Test](test.svg)');
      
      expect(result).toContain('not valid svg content');
    });

    it('should handle very long file paths', () => {
      const longPath = 'a'.repeat(1000) + '.svg';
      
      const result = (converter as any).resolveSvgPath(longPath);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle paths with special characters', () => {
      const specialPath = 'test with spaces & symbols (1).svg';
      
      const result = (converter as any).resolveSvgPath(specialPath);
      
      expect(result).toContain(specialPath);
    });
  });

  describe('Integration with main convert flow', () => {
    it('should be called during PDF conversion', async () => {
      const spy = jest.spyOn(converter as any, 'processSvgForPandoc');
      
      try {
        await converter.convert('![Test](test.svg)', 'pdf');
      } catch {
        // Expected to fail in test environment due to missing Pandoc
      }
      
      expect(spy).toHaveBeenCalled();
    });

    it('should handle contentPath option correctly', async () => {
      const options = { contentPath: '/project/content/docs/file.md' };
      const spy = jest.spyOn(converter as any, 'resolveRelativeSvgPath');
      
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('<svg>content</svg>');
      
      await (converter as any).processSvgForPandoc('![Test](test.svg)', options);
      
      expect(spy).toHaveBeenCalledWith('test.svg', '/project/content/docs/file.md');
    });
  });
});