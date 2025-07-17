import { ResumeGenerator, type ResumeData } from '@/lib/services/resumeGenerator';
import { 
  mockStudent, 
  mockProgram, 
  mockBatch, 
  mockCourses, 
  mockResumeData, 
  mockEmptyResumeData 
} from '../../../src/__tests__/mocks/resumeTestData.mock';

// Mock Puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setViewport: jest.fn(),
      setContent: jest.fn(),
      evaluateHandle: jest.fn().mockResolvedValue({}),
      pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content'))
    }),
    close: jest.fn()
  })
}));

// Mock ContentConverterV2
jest.mock('@/lib/content-converter-v2', () => ({
  ContentConverterV2: jest.fn().mockImplementation(() => ({
    convert: jest.fn().mockResolvedValue(Buffer.from('mock-docx-content'))
  }))
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn().mockReturnValue('January 15, 2024'),
  parseISO: jest.fn().mockReturnValue(new Date('2024-01-15')),
  isValid: jest.fn().mockReturnValue(true)
}));

describe('ResumeGenerator', () => {
  let resumeGenerator: ResumeGenerator;

  beforeEach(() => {
    resumeGenerator = new ResumeGenerator();
    jest.clearAllMocks();
  });

  describe('generateResumeData', () => {
    it('should generate complete resume data from student profile', () => {
      const result = resumeGenerator.generateResumeData(
        mockStudent,
        mockProgram,
        mockBatch,
        [], // Empty results for this test
        mockCourses
      );

      expect(result).toMatchObject({
        fullName: mockStudent.fullNameGtuFormat,
        email: mockStudent.personalEmail,
        personalEmail: mockStudent.personalEmail,
        contactNumber: mockStudent.contactNumber,
        address: mockStudent.address,
        enrollmentNumber: mockStudent.enrollmentNumber,
        program: mockProgram.name,
        programCode: mockProgram.code,
        batch: mockBatch.name,
        currentSemester: mockStudent.currentSemester,
        instituteEmail: mockStudent.instituteEmail
      });
    });

    it('should handle missing optional data gracefully', () => {
      const minimalStudent = {
        ...mockStudent,
        personalEmail: undefined,
        contactNumber: undefined,
        address: undefined,
        skills: undefined,
        projects: undefined,
        achievements: undefined
      };

      const result = resumeGenerator.generateResumeData(
        minimalStudent,
        undefined,
        undefined,
        [],
        []
      );

      expect(result.email).toBe(mockStudent.instituteEmail);
      expect(result.personalEmail).toBeUndefined();
      expect(result.contactNumber).toBeUndefined();
      expect(result.address).toBeUndefined();
      expect(result.skills).toEqual([]);
      expect(result.projects).toEqual([]);
      expect(result.achievements).toEqual([]);
    });

    it('should map guardian details correctly', () => {
      const result = resumeGenerator.generateResumeData(
        mockStudent,
        mockProgram,
        mockBatch,
        [],
        mockCourses
      );

      expect(result.guardianName).toBe(mockStudent.guardianDetails?.name);
      expect(result.guardianRelation).toBe(mockStudent.guardianDetails?.relation);
      expect(result.guardianContact).toBe(mockStudent.guardianDetails?.contactNumber);
      expect(result.guardianOccupation).toBe(mockStudent.guardianDetails?.occupation);
      expect(result.guardianIncome).toBe(mockStudent.guardianDetails?.annualIncome);
    });

    it('should map skills correctly', () => {
      const result = resumeGenerator.generateResumeData(
        mockStudent,
        mockProgram,
        mockBatch,
        [],
        mockCourses
      );

      expect(result.skills).toHaveLength(mockStudent.skills!.length);
      expect(result.skills![0]).toMatchObject({
        name: 'JavaScript',
        category: 'technical',
        proficiency: 'advanced'
      });
    });

    it('should map projects with duration calculation', () => {
      const result = resumeGenerator.generateResumeData(
        mockStudent,
        mockProgram,
        mockBatch,
        [],
        mockCourses
      );

      expect(result.projects).toHaveLength(mockStudent.projects!.length);
      expect(result.projects![0]).toMatchObject({
        title: 'E-commerce Website',
        description: mockStudent.projects![0].description,
        technologies: mockStudent.projects![0].technologies,
        duration: '2023-01-01 - 2023-06-01',
        role: 'Full Stack Developer'
      });

      expect(result.projects![1].duration).toBe('2023-06-01 - Present');
    });
  });

  describe('generateResumeHTML', () => {
    it('should generate valid HTML for resume', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang=\"en\">');
      expect(html).toContain(mockResumeData.fullName);
      expect(html).toContain(mockResumeData.email);
      expect(html).toContain(mockResumeData.enrollmentNumber);
      expect(html).toContain(mockResumeData.program);
    });

    it('should include academic performance when available', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      expect(html).toContain(mockResumeData.overallCPI!.toFixed(2));
      expect(html).toContain(`${mockResumeData.earnedCredits}`);
      expect(html).toContain(`${mockResumeData.totalCredits}`);
    });

    it('should include skills section when available', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      expect(html).toContain('Technical Skills');
      expect(html).toContain('JavaScript');
      expect(html).toContain('technical');
    });

    it('should include projects section when available', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      expect(html).toContain('Projects');
      expect(html).toContain('E-commerce Website');
      expect(html).toContain('React, Node.js, MongoDB, Express.js');
    });

    it('should handle empty data gracefully', () => {
      const html = resumeGenerator.generateResumeHTML(mockEmptyResumeData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain(mockEmptyResumeData.fullName);
      expect(html).not.toContain('Technical Skills');
      expect(html).not.toContain('Projects');
    });
  });

  describe('generateBiodataHTML', () => {
    it('should generate valid HTML for biodata', () => {
      const html = resumeGenerator.generateBiodataHTML(mockResumeData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('BIODATA');
      expect(html).toContain(mockResumeData.fullName);
      expect(html).toContain('Personal Information');
      expect(html).toContain('Academic Information');
    });

    it('should include personal information table', () => {
      const html = resumeGenerator.generateBiodataHTML(mockResumeData);

      expect(html).toContain(mockResumeData.dateOfBirth!);
      expect(html).toContain(mockResumeData.gender!);
      expect(html).toContain(mockResumeData.bloodGroup!);
    });

    it('should include family information when available', () => {
      const html = resumeGenerator.generateBiodataHTML(mockResumeData);

      expect(html).toContain('Family Information');
      expect(html).toContain(mockResumeData.guardianName!);
      expect(html).toContain(mockResumeData.guardianRelation!);
    });

    it('should include declaration section', () => {
      const html = resumeGenerator.generateBiodataHTML(mockResumeData);

      expect(html).toContain('Declaration');
      expect(html).toContain('I hereby declare that the information furnished above is true and correct');
    });
  });

  describe('generateCVHTML', () => {
    it('should generate valid HTML for CV', () => {
      const html = resumeGenerator.generateCVHTML(mockResumeData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('CURRICULUM VITAE');
      expect(html).toContain(mockResumeData.fullName);
    });

    it('should include professional objective when available', () => {
      const html = resumeGenerator.generateCVHTML(mockResumeData);

      expect(html).toContain('Professional Objective');
      expect(html).toContain(mockResumeData.profileSummary!);
    });

    it('should include educational qualifications', () => {
      const html = resumeGenerator.generateCVHTML(mockResumeData);

      expect(html).toContain('Educational Qualifications');
      expect(html).toContain('Current Education');
      expect(html).toContain(mockResumeData.program);
    });

    it('should include academic performance when available', () => {
      const html = resumeGenerator.generateCVHTML(mockResumeData);

      expect(html).toContain(mockResumeData.overallCPI!.toFixed(2));
      expect(html).toContain('Overall CPI');
    });
  });

  describe('generatePlainText', () => {
    it('should generate properly formatted plain text', () => {
      const text = resumeGenerator.generatePlainText(mockResumeData);

      expect(text).toContain(mockResumeData.fullName);
      expect(text).toContain('ACADEMIC INFORMATION');
      expect(text).toContain(mockResumeData.email);
      expect(text).toContain(mockResumeData.enrollmentNumber);
    });

    it('should include emojis and formatting', () => {
      const text = resumeGenerator.generatePlainText(mockResumeData);

      expect(text).toContain('Email:');
      expect(text).toContain('Phone:');
      expect(text).toContain('Enrollment:');
      expect(text).toContain('==============');
    });

    it('should include academic performance with indicators', () => {
      const text = resumeGenerator.generatePlainText(mockResumeData);

      expect(text).toContain('ACADEMIC PERFORMANCE');
      expect(text).toContain('Overall CPI:');
      expect(text).toContain(mockResumeData.overallCPI!.toFixed(2));
    });

    it('should include skills grouped by category', () => {
      const text = resumeGenerator.generatePlainText(mockResumeData);

      expect(text).toContain('TECHNICAL SKILLS');
      expect(text).toContain('JavaScript');
    });

    it('should include projects with details', () => {
      const text = resumeGenerator.generatePlainText(mockResumeData);

      expect(text).toContain('PROJECTS');
      expect(text).toContain('E-commerce Website');
      expect(text).toContain('Technologies:');
    });
  });

  describe('generatePDF', () => {
    it('should generate PDF buffer', async () => {
      const result = await resumeGenerator.generatePDF(mockResumeData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock-pdf-content');
    });

    it('should handle PDF generation errors', async () => {
      const puppeteer = require('puppeteer');
      puppeteer.launch.mockRejectedValueOnce(new Error('PDF generation failed'));

      await expect(resumeGenerator.generatePDF(mockResumeData))
        .rejects.toThrow('Failed to generate PDF');
    });
  });

  describe('generateDOCX', () => {
    it('should generate DOCX buffer', async () => {
      const result = await resumeGenerator.generateDOCX(mockResumeData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock-docx-content');
    });
  });

  describe('generateHTML', () => {
    it('should return HTML string', () => {
      const result = resumeGenerator.generateHTML(mockResumeData);

      expect(typeof result).toBe('string');
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain(mockResumeData.fullName);
    });
  });

  describe('generateBiodataPDF', () => {
    it('should generate biodata PDF', async () => {
      const result = await resumeGenerator.generateBiodataPDF(mockResumeData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock-pdf-content');
    });
  });

  describe('generateResumePDF', () => {
    it('should generate resume PDF', async () => {
      const result = await resumeGenerator.generateResumePDF(mockResumeData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock-pdf-content');
    });
  });

  describe('generateCVPDF', () => {
    it('should generate CV PDF', async () => {
      const result = await resumeGenerator.generateCVPDF(mockResumeData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock-pdf-content');
    });
  });

  describe('generatePDFFromText', () => {
    it('should generate PDF from plain text', async () => {
      const testText = 'This is a test document with some content.';
      const result = await resumeGenerator.generatePDFFromText(testText);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock-pdf-content');
    });

    it('should escape HTML in text content', async () => {
      const textWithHtml = 'Test content with <html> tags & special characters';
      const result = await resumeGenerator.generatePDFFromText(textWithHtml);

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('utility functions', () => {
    describe('wrapText', () => {
      it('should wrap text at specified width', () => {
        const longText = 'This is a very long line of text that should be wrapped at the specified width';
        const wrapped = longText.length > 30 ? longText.slice(0, 27) + '...' : longText;

        expect(wrapped.length).toBeLessThanOrEqual(30);
      });

      it('should handle prefix correctly', () => {
        const text = 'Short text';
        const withPrefix = '   ' + text;

        expect(withPrefix).toContain('   Short text');
      });
    });

    describe('escapeHtml', () => {
      it('should escape HTML entities', () => {
        const generator = resumeGenerator as any;
        const htmlText = '<script>alert("test")</script> & "quotes"';
        const escaped = generator.escapeHtml(htmlText);

        expect(escaped).toContain('&lt;script&gt;');
        expect(escaped).toContain('&amp;');
        expect(escaped).toContain('&quot;');
      });
    });

    describe('formatDate', () => {
      it('should format valid ISO date strings', () => {
        const generator = resumeGenerator as any;
        const formatted = generator.formatDate('2023-06-15');

        expect(formatted).toBe('January 15, 2024'); // Mocked return value
      });

      it('should return "Present" for undefined dates', () => {
        const generator = resumeGenerator as any;
        const formatted = generator.formatDate(undefined);

        expect(formatted).toBe('Present');
      });

      it('should return original string for invalid dates', () => {
        const generator = resumeGenerator as any;
        const invalidDate = 'invalid-date';
        
        // Mock isValid to return false for invalid dates
        const { isValid } = require('date-fns');
        isValid.mockReturnValueOnce(false);
        
        const formatted = generator.formatDate(invalidDate);

        expect(formatted).toBe(invalidDate);
      });
    });

    describe('getSkillProficiencyIndicator', () => {
      it('should return correct indicators for skill levels', () => {
        const generator = resumeGenerator as any;

        expect(generator.getSkillProficiencyIndicator('expert')).toBe('⭐⭐⭐⭐⭐');
        expect(generator.getSkillProficiencyIndicator('advanced')).toBe('⭐⭐⭐⭐⭐');
        expect(generator.getSkillProficiencyIndicator('intermediate')).toBe('⭐⭐⭐⭐');
        expect(generator.getSkillProficiencyIndicator('beginner')).toBe('⭐⭐⭐');
        expect(generator.getSkillProficiencyIndicator('basic')).toBe('⭐⭐⭐');
        expect(generator.getSkillProficiencyIndicator('unknown')).toBe('⭐⭐⭐⭐');
      });
    });

    describe('truncateText', () => {
      it('should truncate long text with ellipsis', () => {
        const generator = resumeGenerator as any;
        const longText = 'This is a very long text that needs to be truncated';
        const truncated = generator.truncateText(longText, 20);

        expect(truncated.length).toBe(20);
        expect(truncated.endsWith('...')).toBe(true);
      });

      it('should not truncate short text', () => {
        const generator = resumeGenerator as any;
        const shortText = 'Short text';
        const result = generator.truncateText(shortText, 20);

        expect(result).toBe(shortText);
      });
    });

    describe('formatUrl', () => {
      it('should add https:// to URLs without protocol', () => {
        const generator = resumeGenerator as any;
        const url = 'example.com';
        const formatted = generator.formatUrl(url);

        expect(formatted).toBe('https://example.com');
      });

      it('should not modify URLs with protocol', () => {
        const generator = resumeGenerator as any;
        const url = 'https://example.com';
        const formatted = generator.formatUrl(url);

        expect(formatted).toBe(url);
      });

      it('should return empty string for undefined URLs', () => {
        const generator = resumeGenerator as any;
        const formatted = generator.formatUrl(undefined);

        expect(formatted).toBe('');
      });
    });
  });

  describe('academic performance calculations', () => {
    it('should calculate academic performance correctly', () => {
      const mockResults = [
        {
          semester: 1,
          subjects: [
            { code: 'CS101', name: 'Programming', grade: 'AA', credits: 4, isBacklog: false },
            { code: 'MA101', name: 'Mathematics', grade: 'AB', credits: 4, isBacklog: false }
          ],
          cpi: 8.5,
          declarationDate: '2023-01-15'
        }
      ];

      const result = resumeGenerator.generateResumeData(
        mockStudent,
        mockProgram,
        mockBatch,
        mockResults as any,
        mockCourses
      );

      expect(result.overallCPI).toBe(8.5);
      expect(result.semesterResults).toHaveLength(1);
      expect(result.semesterResults![0].semester).toBe(1);
      expect(result.semesterResults![0].subjects).toHaveLength(2);
    });

    it('should handle backlogs correctly', () => {
      const mockResultsWithBacklog = [
        {
          semester: 1,
          subjects: [
            { code: 'CS101', name: 'Programming', grade: 'FF', credits: 4, isBacklog: true },
            { code: 'MA101', name: 'Mathematics', grade: 'AB', credits: 4, isBacklog: false }
          ],
          cpi: 6.0,
          declarationDate: '2023-01-15'
        }
      ];

      const result = resumeGenerator.generateResumeData(
        mockStudent,
        mockProgram,
        mockBatch,
        mockResultsWithBacklog as any,
        mockCourses
      );

      expect(result.academicStatus).toContain('Backlog');
    });

    it('should handle empty results gracefully', () => {
      const result = resumeGenerator.generateResumeData(
        mockStudent,
        mockProgram,
        mockBatch,
        [],
        mockCourses
      );

      expect(result.overallCPI).toBe(0);
      expect(result.earnedCredits).toBe(0);
      expect(result.academicStatus).toBe('Insufficient academic data');
      expect(result.semesterResults).toEqual([]);
    });
  });
});