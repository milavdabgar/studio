/**
 * Test suite for SVG image processing in ContentConverterV2
 * Covers PDF generation with SVG image embedding
 */

import { ContentConverterV2 } from '../content-converter-v2';
import fs from 'fs';

// Mock file system for testing
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('ContentConverterV2 - SVG Image Processing', () => {
  let converter: ContentConverterV2;
  
  beforeEach(() => {
    converter = new ContentConverterV2();
    jest.clearAllMocks();
    
    // Mock the temp directory exists
    mockedFs.existsSync.mockImplementation((path: fs.PathLike) => {
      const pathStr = path.toString();
      return pathStr.includes('tmp') || pathStr.endsWith('.svg');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('processSvgImages', () => {
    const mockSvgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="blue" />
  <text x="50" y="55" text-anchor="middle" fill="white">Test</text>
</svg>`;

    beforeEach(() => {
      // Mock file reading for SVG content
      mockedFs.readFileSync.mockImplementation((path: fs.PathOrFileDescriptor) => {
        if (path.toString().endsWith('.svg')) {
          return mockSvgContent;
        }
        return '';
      });
    });

    it('should convert SVG image sources to base64 data URLs', async () => {
      const htmlWithSvg = `
        <div>
          <h1>Test Document</h1>
          <img src="diagrams/test-diagram.svg" alt="Test Diagram" />
          <p>Some content after the image.</p>
        </div>
      `;

      const result = await (converter as any).processSvgImages(htmlWithSvg); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      // Check that the SVG was converted to base64
      expect(result).toContain('src="data:image/svg+xml;base64,');
      expect(result).not.toContain('src="diagrams/test-diagram.svg"');
      
      // Verify the base64 content is correct
      const base64Match = result.match(/src="data:image\/svg\+xml;base64,([^"]+)"/);
      expect(base64Match).toBeTruthy();
      
      if (base64Match) {
        const decodedContent = Buffer.from(base64Match[1], 'base64').toString('utf8');
        expect(decodedContent).toBe(mockSvgContent);
      }
    });

    it('should handle multiple SVG images in the same HTML', async () => {
      const htmlWithMultipleSvgs = `
        <div>
          <img src="diagram1.svg" alt="Diagram 1" />
          <img src="path/to/diagram2.svg" alt="Diagram 2" />
          <img src="another/diagram3.svg" alt="Diagram 3" class="custom-class" />
        </div>
      `;

      const result = await (converter as any).processSvgImages(htmlWithMultipleSvgs); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      // All three SVGs should be converted
      const base64Matches = result.match(/data:image\/svg\+xml;base64,/g);
      expect(base64Matches).toHaveLength(3);
      
      // No original SVG sources should remain
      expect(result).not.toContain('src="diagram1.svg"');
      expect(result).not.toContain('src="path/to/diagram2.svg"');
      expect(result).not.toContain('src="another/diagram3.svg"');
      
      // Attributes should be preserved
      expect(result).toContain('alt="Diagram 1"');
      expect(result).toContain('alt="Diagram 2"');
      expect(result).toContain('class="custom-class"');
    });

    it('should handle SVG images with additional attributes', async () => {
      const htmlWithAttributes = `
        <img 
          id="main-diagram" 
          class="diagram responsive" 
          src="complex-diagram.svg" 
          alt="Complex Diagram" 
          width="500" 
          height="300"
          style="border: 1px solid #ccc;"
        />
      `;

      const result = await (converter as any).processSvgImages(htmlWithAttributes); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      // SVG should be converted
      expect(result).toContain('src="data:image/svg+xml;base64,');
      expect(result).not.toContain('src="complex-diagram.svg"');
      
      // All attributes should be preserved
      expect(result).toContain('id="main-diagram"');
      expect(result).toContain('class="diagram responsive"');
      expect(result).toContain('alt="Complex Diagram"');
      expect(result).toContain('width="500"');
      expect(result).toContain('height="300"');
      expect(result).toContain('style="border: 1px solid #ccc;"');
    });

    it('should skip non-SVG images', async () => {
      const htmlWithMixedImages = `
        <div>
          <img src="photo.jpg" alt="Photo" />
          <img src="diagram.svg" alt="Diagram" />
          <img src="icon.png" alt="Icon" />
        </div>
      `;

      const result = await (converter as any).processSvgImages(htmlWithMixedImages); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      // Only SVG should be converted
      expect(result).toContain('src="photo.jpg"');
      expect(result).toContain('src="icon.png"');
      expect(result).toContain('src="data:image/svg+xml;base64,');
      expect(result).not.toContain('src="diagram.svg"');
    });

    it('should handle missing SVG files gracefully', async () => {
      // Mock file not found
      mockedFs.existsSync.mockReturnValue(false);

      const htmlWithMissingSvg = `
        <img src="missing-diagram.svg" alt="Missing Diagram" />
      `;

      const result = await (converter as any).processSvgImages(htmlWithMissingSvg); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      // Should contain error handling
      expect(result).toContain('[SVG Image Not Found: missing-diagram.svg]');
      expect(result).toContain('onerror="this.style.display=\'none\'');
    });

    it('should handle SVG processing errors gracefully', async () => {
      // Mock file read error
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const htmlWithErrorSvg = `
        <img src="error-diagram.svg" alt="Error Diagram" />
      `;

      const result = await (converter as any).processSvgImages(htmlWithErrorSvg); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      // Should contain error handling
      expect(result).toContain('[SVG Processing Error: error-diagram.svg]');
      expect(result).toContain('onerror="this.style.display=\'none\'');
    });
  });

  describe('resolveSvgPath', () => {
    beforeEach(() => {
      // Mock different path scenarios
      mockedFs.existsSync.mockImplementation((path: fs.PathLike) => {
        const pathStr = path.toString();
        return pathStr.includes('content/resources') || pathStr.includes('existing-file.svg');
      });
    });

    it('should resolve absolute paths correctly', () => {
      const absolutePath = '/absolute/path/to/diagram.svg';
      const result = (converter as any).resolveSvgPath(absolutePath); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      expect(result).toBe(absolutePath);
    });

    it('should resolve relative paths in content directory', () => {
      const relativePath = 'diagrams/test.svg';
      const result = (converter as any).resolveSvgPath(relativePath); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      // Should try multiple locations and find the content/resources path
      expect(result).toContain('content');
    });

    it('should handle non-existent files', () => {
      mockedFs.existsSync.mockReturnValue(false);
      
      const nonExistentPath = 'non-existent.svg';
      const result = (converter as any).resolveSvgPath(nonExistentPath); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      // Should return a default path even if file doesn't exist
      expect(result).toContain('non-existent.svg');
    });
  });

  describe('PDF Generation with SVG', () => {
    it('should process SVGs before PDF generation', async () => {
      const markdownWithSvg = `
# Test Document

Here is a diagram:

![Test Diagram](diagrams/test.svg)

More content here.
      `;

      // Mock the SVG file
      const testSvgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="blue" />
  <text x="50" y="55" text-anchor="middle" fill="white">Test</text>
</svg>`;
      mockedFs.readFileSync.mockImplementation((path: fs.PathOrFileDescriptor) => {
        if (path.toString().endsWith('.svg')) {
          return testSvgContent;
        }
        return '';
      });

      // Spy on processSvgImages to ensure it's called
      const processSvgImagesSpy = jest.spyOn(converter as any, 'processSvgImages'); // eslint-disable-line @typescript-eslint/no-explicit-any

      try {
        // This will fail due to missing Puppeteer in test environment,
        // but we can verify SVG processing is called
        await converter.convert(markdownWithSvg, 'html');
      } catch {
        // Expected to fail in test environment
      }

      expect(processSvgImagesSpy).toHaveBeenCalled();
    });
  });

  describe('Integration with Content Processing', () => {
    it('should integrate SVG processing into HTML conversion flow', async () => {
      const markdownContent = `![Diagram](test.svg)`;
      const testSvgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="blue" />
  <text x="50" y="55" text-anchor="middle" fill="white">Test</text>
</svg>`;

      // Mock file existence for the SVG file
      mockedFs.existsSync.mockImplementation((path: fs.PathLike) => {
        const pathStr = path.toString();
        return pathStr.includes('test.svg') || pathStr.includes('tmp');
      });

      mockedFs.readFileSync.mockImplementation((path: fs.PathOrFileDescriptor) => {
        if (path.toString().includes('test.svg')) {
          return testSvgContent;
        }
        return '';
      });

      const htmlResult = await converter.convert(markdownContent, 'html') as string;
      
      // Should contain base64 encoded SVG
      expect(htmlResult).toContain('data:image/svg+xml;base64,');
      expect(htmlResult).not.toContain('src="test.svg"');
    });
    
    it('should handle HTML content with SVG images directly', async () => {
      const htmlContent = `
<h1>Document with SVG</h1>
<img src="test.svg" alt="Test Diagram">
<p>Some content.</p>
      `;
      const testSvgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="blue" />
  <text x="50" y="55" text-anchor="middle" fill="white">Test</text>
</svg>`;

      // Mock file existence for the SVG file
      mockedFs.existsSync.mockImplementation((path: fs.PathLike) => {
        const pathStr = path.toString();
        return pathStr.includes('test.svg') || pathStr.includes('tmp');
      });

      mockedFs.readFileSync.mockImplementation((path: fs.PathOrFileDescriptor) => {
        if (path.toString().includes('test.svg')) {
          return testSvgContent;
        }
        return '';
      });

      const htmlResult = await converter.convert(htmlContent, 'html') as string;
      
      // Should contain base64 encoded SVG
      expect(htmlResult).toContain('data:image/svg+xml;base64,');
      expect(htmlResult).not.toContain('src="test.svg"');
    });
  });
});

describe('SVG Processing Performance', () => {
  let converter: ContentConverterV2;

  beforeEach(() => {
    converter = new ContentConverterV2();
    
    // Mock successful file operations
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('test svg content');
  });

  it('should handle large numbers of SVG images efficiently', async () => {
    // Create HTML with many SVG images
    let htmlWithManySvgs = '<div>';
    for (let i = 0; i < 100; i++) {
      htmlWithManySvgs += `<img src="diagram${i}.svg" alt="Diagram ${i}" />`;
    }
    htmlWithManySvgs += '</div>';

    const startTime = Date.now();
    const result = await (converter as any).processSvgImages(htmlWithManySvgs); // eslint-disable-line @typescript-eslint/no-explicit-any
    const endTime = Date.now();

    // Should complete in reasonable time (less than 1 second for 100 images)
    expect(endTime - startTime).toBeLessThan(1000);
    
    // All images should be processed
    const base64Matches = result.match(/data:image\/svg\+xml;base64,/g);
    expect(base64Matches).toHaveLength(100);
  });
});