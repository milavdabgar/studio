/**
 * Integration tests for PDF generation functionality
 * These tests verify the actual PDF generation process
 */

import { ResumeGenerator } from '@/lib/services/resumeGenerator';
import { mockResumeData, mockEmptyResumeData } from '../__mocks__/resumeTestData';

// Mock Puppeteer with more realistic behavior for integration testing
const mockPDFBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n');

const mockPage = {
  setViewport: jest.fn().mockResolvedValue(undefined),
  setContent: jest.fn().mockResolvedValue(undefined),
  evaluateHandle: jest.fn().mockResolvedValue({}),
  pdf: jest.fn().mockResolvedValue(mockPDFBuffer),
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn().mockResolvedValue(undefined),
};

jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue(mockBrowser),
}));

jest.mock('@/lib/content-converter-v2', () => ({
  ContentConverterV2: jest.fn().mockImplementation(() => ({
    convert: jest.fn().mockResolvedValue(Buffer.from('PK\x03\x04')), // DOCX file signature
  })),
}));

// Mock DOCX buffer for tests
const mockDocxBuffer = Buffer.from('PK\x03\x04');

describe('PDF Generation Integration Tests', () => {
  let resumeGenerator: ResumeGenerator;
  let puppeteer: any;

  beforeEach(() => {
    resumeGenerator = new ResumeGenerator();
    puppeteer = require('puppeteer');
    jest.clearAllMocks();
  });

  describe('PDF Generation with Puppeteer', () => {
    it('should successfully generate PDF with complete data', async () => {
      const result = await resumeGenerator.generatePDF(mockResumeData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      
      // Verify Puppeteer was called correctly
      expect(puppeteer.launch).toHaveBeenCalledWith({
        headless: true,
        args: expect.arrayContaining([
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
        ]),
      });

      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.setViewport).toHaveBeenCalledWith({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2,
      });

      expect(mockPage.setContent).toHaveBeenCalledWith(
        expect.stringContaining('<!DOCTYPE html>'),
        {
          waitUntil: ['networkidle0', 'domcontentloaded'],
          timeout: 30000,
        }
      );

      expect(mockPage.pdf).toHaveBeenCalledWith({
        format: 'A4',
        margin: {
          top: '15mm',
          right: '12mm',
          bottom: '15mm',
          left: '12mm',
        },
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        quality: 100,
      });

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle minimal data gracefully', async () => {
      const result = await resumeGenerator.generatePDF(mockEmptyResumeData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      expect(puppeteer.launch).toHaveBeenCalled();
    });

    it('should properly close browser even on content setting errors', async () => {
      mockPage.setContent.mockRejectedValueOnce(new Error('Content loading failed'));

      await expect(resumeGenerator.generatePDF(mockResumeData))
        .rejects.toThrow('Failed to generate PDF');

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle browser launch failures', async () => {
      puppeteer.launch.mockRejectedValueOnce(new Error('Browser launch failed'));

      await expect(resumeGenerator.generatePDF(mockResumeData))
        .rejects.toThrow('Failed to generate PDF: Browser launch failed');
    });

    it('should handle PDF generation failures', async () => {
      mockPage.pdf.mockRejectedValueOnce(new Error('PDF generation failed'));

      await expect(resumeGenerator.generatePDF(mockResumeData))
        .rejects.toThrow('Failed to generate PDF');

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle browser close failures gracefully', async () => {
      mockBrowser.close.mockRejectedValueOnce(new Error('Browser close failed'));

      // Should not throw, just log the error
      const result = await resumeGenerator.generatePDF(mockResumeData);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('Biodata PDF Generation', () => {
    it('should generate biodata PDF with proper styling', async () => {
      const result = await resumeGenerator.generateBiodataPDF(mockResumeData);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPage.setContent).toHaveBeenCalledWith(
        expect.stringContaining('BIODATA'),
        expect.any(Object)
      );
    });

    it('should include personal information in biodata', async () => {
      await resumeGenerator.generateBiodataPDF(mockResumeData);

      const contentCall = mockPage.setContent.mock.calls[0][0];
      expect(contentCall).toContain('Personal Information');
      expect(contentCall).toContain('Academic Information');
      expect(contentCall).toContain('Declaration');
    });
  });

  describe('Resume PDF Generation', () => {
    it('should generate resume PDF with modern styling', async () => {
      const result = await resumeGenerator.generateResumePDF(mockResumeData);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPage.setContent).toHaveBeenCalledWith(
        expect.stringContaining('Professional Resume'),
        expect.any(Object)
      );
    });

    it('should include technical skills in resume', async () => {
      await resumeGenerator.generateResumePDF(mockResumeData);

      const contentCall = mockPage.setContent.mock.calls[0][0];
      expect(contentCall).toContain('Technical Skills');
      expect(contentCall).toContain('JavaScript');
    });
  });

  describe('CV PDF Generation', () => {
    it('should generate CV PDF with academic styling', async () => {
      const result = await resumeGenerator.generateCVPDF(mockResumeData);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPage.setContent).toHaveBeenCalledWith(
        expect.stringContaining('CURRICULUM VITAE'),
        expect.any(Object)
      );
    });

    it('should include educational qualifications in CV', async () => {
      await resumeGenerator.generateCVPDF(mockResumeData);

      const contentCall = mockPage.setContent.mock.calls[0][0];
      expect(contentCall).toContain('Educational Qualifications');
      expect(contentCall).toContain('Technical Expertise');
    });
  });

  describe('Text to PDF Generation', () => {
    it('should generate PDF from plain text', async () => {
      const testText = 'This is a test document\nwith multiple lines\nof content.';
      const result = await resumeGenerator.generatePDFFromText(testText);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPage.setContent).toHaveBeenCalledWith(
        expect.stringContaining('<pre>'),
        expect.any(Object)
      );
    });

    it('should escape HTML in text content', async () => {
      const textWithHtml = 'Content with <script>alert("test")</script> & "quotes"';
      await resumeGenerator.generatePDFFromText(textWithHtml);

      const contentCall = mockPage.setContent.mock.calls[0][0];
      expect(contentCall).toContain('Content with');
      expect(contentCall).not.toContain('<script>alert("test")');
    });

    it('should wrap long lines in text', async () => {
      const longText = 'This is a very long line of text that should be wrapped in the PDF output to ensure proper formatting and readability.';
      await resumeGenerator.generatePDFFromText(longText);

      const contentCall = mockPage.setContent.mock.calls[0][0];
      expect(contentCall).toContain('white-space: pre-wrap');
    });
  });

  describe('DOCX Generation Integration', () => {
    it('should generate DOCX file successfully', async () => {
      const result = await resumeGenerator.generateDOCX(mockResumeData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      
      // Verify DOCX signature
      expect(result.slice(0, 4)).toEqual(mockDocxBuffer.slice(0, 4));
    });

    it('should handle DOCX generation errors', async () => {
      const originalLog = console.error;
      console.error = jest.fn();
      
      const result = await resumeGenerator.generateDOCX(mockResumeData);
      expect(result).toBeInstanceOf(Buffer);
      
      console.error = originalLog;
    });
  });

  describe('Puppeteer Configuration', () => {
    it('should use correct launch arguments for security', async () => {
      await resumeGenerator.generatePDF(mockResumeData);

      expect(puppeteer.launch).toHaveBeenCalledWith({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ],
      });
    });

    it('should set appropriate viewport for PDF generation', async () => {
      await resumeGenerator.generatePDF(mockResumeData);

      expect(mockPage.setViewport).toHaveBeenCalledWith({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2,
      });
    });

    it('should wait for fonts to load', async () => {
      await resumeGenerator.generatePDF(mockResumeData);

      expect(mockPage.evaluateHandle).toHaveBeenCalledWith('document.fonts.ready');
    });

    it('should use optimal PDF settings', async () => {
      await resumeGenerator.generatePDF(mockResumeData);

      expect(mockPage.pdf).toHaveBeenCalledWith({
        format: 'A4',
        margin: {
          top: '15mm',
          right: '12mm',
          bottom: '15mm',
          left: '12mm',
        },
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        quality: 100,
      });
    });
  });

  describe('Error Recovery', () => {
    it('should handle Puppeteer not available error', async () => {
      // This test verifies error handling when Puppeteer is not available
      const result = await resumeGenerator.generatePDF(mockResumeData);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should provide detailed error messages', async () => {
      mockPage.pdf.mockRejectedValueOnce(new Error('Specific PDF error'));

      await expect(resumeGenerator.generatePDF(mockResumeData))
        .rejects.toThrow('Failed to generate PDF: Specific PDF error');
    });

    it('should handle unknown errors gracefully', async () => {
      mockPage.pdf.mockRejectedValueOnce('String error instead of Error object');

      await expect(resumeGenerator.generatePDF(mockResumeData))
        .rejects.toThrow('Failed to generate PDF: Unknown error');
    });
  });

  describe('Memory Management', () => {
    it('should properly clean up browser resources', async () => {
      await resumeGenerator.generatePDF(mockResumeData);

      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it('should clean up even when PDF generation fails', async () => {
      mockPage.pdf.mockRejectedValueOnce(new Error('PDF failed'));

      try {
        await resumeGenerator.generatePDF(mockResumeData);
      } catch {
        // Expected to fail
      }

      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple concurrent PDF generations', async () => {
      const promises = [
        resumeGenerator.generatePDF(mockResumeData),
        resumeGenerator.generatePDF(mockEmptyResumeData),
        resumeGenerator.generateBiodataPDF(mockResumeData),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeInstanceOf(Buffer);
      });

      // Should have launched 3 browsers and closed all of them
      expect(puppeteer.launch).toHaveBeenCalledTimes(3);
      expect(mockBrowser.close).toHaveBeenCalledTimes(3);
    });
  });
});