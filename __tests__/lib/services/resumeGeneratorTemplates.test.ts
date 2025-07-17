/**
 * Tests for HTML template generation and formatting
 * These tests verify the structure and content of generated HTML templates
 */

import { ResumeGenerator, type ResumeData } from '@/lib/services/resumeGenerator';
import { mockResumeData, mockEmptyResumeData } from '../../../src/__tests__/mocks/resumeTestData.mock';

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn().mockReturnValue('January 15, 2024'),
  parseISO: jest.fn().mockReturnValue(new Date('2024-01-15')),
  isValid: jest.fn().mockReturnValue(true)
}));

describe('Resume Generator Templates', () => {
  let resumeGenerator: ResumeGenerator;

  beforeEach(() => {
    resumeGenerator = new ResumeGenerator();
    jest.clearAllMocks();
  });

  describe('Resume HTML Template', () => {
    it('should generate modern responsive HTML structure', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      // Check for modern HTML5 structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('<meta name="viewport"');

      // Check for responsive container
      expect(html).toContain('class="resume-container"');
      expect(html).toContain('max-width: 850px');
    });

    it('should include modern CSS styling', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      // Check for gradient backgrounds
      expect(html).toContain('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
      expect(html).toContain('box-shadow:');
      expect(html).toContain('border-radius:');
      expect(html).toContain('transition:');
    });

    it('should have proper responsive breakpoints', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      expect(html).toContain('@media (max-width: 768px)');
      expect(html).toContain('grid-template-columns: 1fr');
    });

    it('should include print-optimized styles', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      expect(html).toContain('@media print');
      expect(html).toContain('background: white');
      expect(html).toContain('-webkit-print-color-adjust: exact');
    });

    it('should properly structure header section', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      expect(html).toContain('class="header"');
      expect(html).toContain(mockResumeData.fullName);
      expect(html).toContain('class="contact-grid"');
      expect(html).toContain('📧');
      expect(html).toContain('📞');
      expect(html).toContain('🆔');
    });

    it('should display academic information in cards', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      expect(html).toContain('Academic Information');
      expect(html).toContain('class="info-grid"');
      expect(html).toContain('class="info-card"');
      expect(html).toContain(mockResumeData.program);
      expect(html).toContain(mockResumeData.enrollmentNumber);
    });

    it('should include performance statistics section', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      expect(html).toContain('class="performance-stats"');
      expect(html).toContain('Overall CPI');
      expect(html).toContain(mockResumeData.overallCPI!.toFixed(2));
      expect(html).toContain('Credits Earned');
    });

    it('should display semester results in cards', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      expect(html).toContain('Academic Performance');
      expect(html).toContain('class="semester-grid"');
      expect(html).toContain('class="semester-card"');
      expect(html).toContain('SGPA:');
    });

    it('should organize skills by category with tags', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      expect(html).toContain('Technical Skills');
      expect(html).toContain('class="skills-container"');
      expect(html).toContain('class="skill-category"');
      expect(html).toContain('class="skill-tags"');
      expect(html).toContain('Programming Languages');
      expect(html).toContain('JavaScript');
    });

    it('should display projects in detailed cards', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      expect(html).toContain('Projects');
      expect(html).toContain('class="project-grid"');
      expect(html).toContain('class="project-card"');
      expect(html).toContain('E-commerce Website');
      expect(html).toContain('Technologies:');
    });

    it('should include achievements section', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      expect(html).toContain('Achievements');
      expect(html).toContain('class="achievement-list"');
      expect(html).toContain('class="achievement-item"');
      expect(html).toContain('First Prize in Coding Competition');
    });
  });

  describe('Biodata HTML Template', () => {
    it('should generate formal biodata structure', () => {
      const html = resumeGenerator.generateBiodataHTML(mockResumeData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('BIODATA');
      expect(html).toContain('Times New Roman');
    });

    it('should include professional table layout', () => {
      const html = resumeGenerator.generateBiodataHTML(mockResumeData);

      expect(html).toContain('class="biodata-table"');
      expect(html).toContain('class="section-header"');
      expect(html).toContain('Personal Information');
      expect(html).toContain('Academic Information');
    });

    it('should have proper table styling', () => {
      const html = resumeGenerator.generateBiodataHTML(mockResumeData);

      expect(html).toContain('border-collapse: collapse');
      expect(html).toContain('box-shadow:');
      expect(html).toContain('border-radius:');
      expect(html).toContain('nth-child(even)');
    });

    it('should include declaration section', () => {
      const html = resumeGenerator.generateBiodataHTML(mockResumeData);

      expect(html).toContain('class="declaration"');
      expect(html).toContain('Declaration');
      expect(html).toContain('I hereby declare');
      expect(html).toContain('class="signature-section"');
    });

    it('should display skills with modern tags', () => {
      const html = resumeGenerator.generateBiodataHTML(mockResumeData);

      expect(html).toContain('class="skills-section"');
      expect(html).toContain('class="skill-category"');
      expect(html).toContain('class="skill-tags"');
      expect(html).toContain('class="skill-tag"');
    });

    it('should handle empty fields gracefully', () => {
      const html = resumeGenerator.generateBiodataHTML(mockEmptyResumeData);

      expect(html).toContain('Not Provided');
      expect(html).not.toContain('Family Information');
      expect(html).not.toContain('Technical Skills');
    });
  });

  describe('CV HTML Template', () => {
    it('should generate academic CV structure', () => {
      const html = resumeGenerator.generateCVHTML(mockResumeData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('CURRICULUM VITAE');
      expect(html).toContain('Georgia');
    });

    it('should include professional header design', () => {
      const html = resumeGenerator.generateCVHTML(mockResumeData);

      expect(html).toContain('class="header"');
      expect(html).toContain('linear-gradient(135deg, #2c3e50 0%, #3498db 100%)');
      expect(html).toContain('radial-gradient');
      expect(html).toContain('text-shadow:');
    });

    it('should have timeline-based layout', () => {
      const html = resumeGenerator.generateCVHTML(mockResumeData);

      expect(html).toContain('class="timeline"');
      expect(html).toContain('class="timeline-item"');
      expect(html).toContain('class="timeline-title"');
      expect(html).toContain('::before');
    });

    it('should include academic performance visualization', () => {
      const html = resumeGenerator.generateCVHTML(mockResumeData);

      expect(html).toContain('class="academic-stats"');
      expect(html).toContain('class="stats-grid"');
      expect(html).toContain('class="stat-item"');
      expect(html).toContain('Overall CPI');
    });

    it('should display semester performance cards', () => {
      const html = resumeGenerator.generateCVHTML(mockResumeData);

      expect(html).toContain('Academic Performance');
      expect(html).toContain('class="semester-grid"');
      expect(html).toContain('class="semester-card"');
      expect(html).toContain('hover');
    });

    it('should organize skills in grid layout', () => {
      const html = resumeGenerator.generateCVHTML(mockResumeData);

      expect(html).toContain('Technical Expertise');
      expect(html).toContain('class="skills-container"');
      expect(html).toContain('class="skill-item"');
      expect(html).toContain('flex-wrap: wrap');
    });
  });

  describe('Template Responsiveness', () => {
    it('should include mobile-responsive meta tags', () => {
      const templates = [
        resumeGenerator.generateResumeHTML(mockResumeData),
        resumeGenerator.generateBiodataHTML(mockResumeData),
        resumeGenerator.generateCVHTML(mockResumeData)
      ];

      templates.forEach(html => {
        expect(html).toContain('name="viewport"');
        expect(html).toContain('width=device-width, initial-scale=1.0');
      });
    });

    it('should have responsive grid layouts', () => {
      const templates = [
        resumeGenerator.generateResumeHTML(mockResumeData),
        resumeGenerator.generateBiodataHTML(mockResumeData),
        resumeGenerator.generateCVHTML(mockResumeData)
      ];

      templates.forEach(html => {
        expect(html).toContain('grid-template-columns:');
        expect(html).toContain('repeat(auto-fit');
        expect(html).toContain('@media (max-width: 768px)');
      });
    });
  });

  describe('Template Accessibility', () => {
    it('should include proper semantic HTML', () => {
      const html = resumeGenerator.generateResumeHTML(mockResumeData);

      expect(html).toContain('<h1>');
      expect(html).toContain('<h2');
      expect(html).toContain('lang="en"');
      expect(html).toContain('<div');
    });

    it('should have proper color contrast', () => {
      const templates = [
        resumeGenerator.generateResumeHTML(mockResumeData),
        resumeGenerator.generateBiodataHTML(mockResumeData),
        resumeGenerator.generateCVHTML(mockResumeData)
      ];

      templates.forEach(html => {
        // Check for dark text on light backgrounds - different templates use different color schemes
        expect(html).toMatch(/color: #(2d3748|333|424242|2c3e50)/);
        expect(html).toContain('background');
      });
    });
  });

  describe('Template Data Binding', () => {
    it('should handle missing optional data', () => {
      const incompleteData: ResumeData = {
        ...mockEmptyResumeData,
        profileSummary: undefined,
        overallCPI: undefined,
        guardianName: undefined,
      };

      const html = resumeGenerator.generateResumeHTML(incompleteData);

      expect(html).toContain('Test Student');
      expect(html).toContain('TEST123');
    });

    it('should escape HTML in user data', () => {
      const dataWithHtml: ResumeData = {
        ...mockResumeData,
        fullName: 'John <script>alert("xss")</script> Doe',
        profileSummary: 'Summary with <b>HTML</b> & "quotes"',
      };

      const html = resumeGenerator.generateResumeHTML(dataWithHtml);

      // Should contain the user's name but not raw script tags
      expect(html).toContain('John');
      expect(html).toContain('Doe');
    });

    it('should handle arrays with different lengths', () => {
      const dataWithArrays: ResumeData = {
        ...mockResumeData,
        skills: [], // Empty array
        projects: [mockResumeData.projects![0]], // Single item
        semesterResults: mockResumeData.semesterResults, // Multiple items
      };

      const html = resumeGenerator.generateResumeHTML(dataWithArrays);

      expect(html).not.toContain('Technical Skills');
      expect(html).toContain('Projects');
      expect(html).toContain('Academic Performance');
    });
  });

  describe('Template Performance', () => {
    it('should generate HTML efficiently for large datasets', () => {
      const largeData: ResumeData = {
        ...mockResumeData,
        skills: Array(50).fill(null).map((_, i) => ({
          name: `Skill ${i}`,
          category: `Category ${i % 5}`,
          proficiency: 'Intermediate'
        })),
        projects: Array(20).fill(null).map((_, i) => ({
          title: `Project ${i}`,
          description: `Description for project ${i}`,
          technologies: [`Tech${i}A`, `Tech${i}B`],
          duration: '2023-01-01 - 2023-06-01',
          role: 'Developer'
        })),
      };

      const startTime = Date.now();
      const html = resumeGenerator.generateResumeHTML(largeData);
      const endTime = Date.now();

      expect(html).toContain('Skill 49');
      expect(html).toContain('Project 19');
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle extremely long text content', () => {
      const longTextData: ResumeData = {
        ...mockResumeData,
        profileSummary: 'A'.repeat(5000), // Very long summary
        projects: [{
          title: 'Project with long description',
          description: 'B'.repeat(10000), // Very long description
          technologies: Array(100).fill('Technology').map((t, i) => `${t}${i}`),
          duration: '2023-01-01 - Present',
          role: 'Lead Developer'
        }]
      };

      const html = resumeGenerator.generateResumeHTML(longTextData);

      expect(html).toContain('A'.repeat(100)); // Should contain part of the long text
      expect(html).toContain('B'.repeat(100)); // Should contain part of the long description
      expect(html.length).toBeGreaterThan(15000); // Should be a substantial HTML document
    });
  });
});