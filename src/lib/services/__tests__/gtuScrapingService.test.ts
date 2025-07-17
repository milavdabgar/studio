import { GTUScrapingService } from '../gtuScrapingService';
import { GTUComprehensiveCSVGenerator } from '../gtuComprehensiveCSVGenerator';
import fs from 'fs';
import path from 'path';

// Mock console methods to suppress expected log messages during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('GTUScrapingService', () => {
  let service: GTUScrapingService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = new GTUScrapingService();
  });

  describe('constructor', () => {
    it('should initialize with default branch mappings', () => {
      expect(service).toBeDefined();
      expect(service.branchMappings).toEqual({
        '06': { name: 'Civil Engineering', code: 'CE' },
        '09': { name: 'Electrical Engineering', code: 'EE' },
        '11': { name: 'Electronics & Communication', code: 'EC' },
        '16': { name: 'Information Technology', code: 'IT' },
        '19': { name: 'Mechanical Engineering', code: 'ME' },
        '32': { name: 'Computer Engineering', code: 'CE-COMP' }
      });
    });
  });

  describe('validateBranchCode', () => {
    it('should return true for valid branch codes', () => {
      expect(service.validateBranchCode('06')).toBe(true);
      expect(service.validateBranchCode('09')).toBe(true);
      expect(service.validateBranchCode('11')).toBe(true);
      expect(service.validateBranchCode('16')).toBe(true);
      expect(service.validateBranchCode('19')).toBe(true);
      expect(service.validateBranchCode('32')).toBe(true);
    });

    it('should return false for invalid branch codes', () => {
      expect(service.validateBranchCode('00')).toBe(false);
      expect(service.validateBranchCode('99')).toBe(false);
      expect(service.validateBranchCode('AB')).toBe(false);
      expect(service.validateBranchCode('')).toBe(false);
    });
  });

  describe('validateSemester', () => {
    it('should return true for valid semesters', () => {
      expect(service.validateSemester(1)).toBe(true);
      expect(service.validateSemester(2)).toBe(true);
      expect(service.validateSemester(3)).toBe(true);
      expect(service.validateSemester(4)).toBe(true);
      expect(service.validateSemester(5)).toBe(true);
      expect(service.validateSemester(6)).toBe(true);
    });

    it('should return false for invalid semesters', () => {
      expect(service.validateSemester(0)).toBe(false);
      expect(service.validateSemester(7)).toBe(false);
      expect(service.validateSemester(-1)).toBe(false);
      expect(service.validateSemester(10)).toBe(false);
    });
  });

  describe('validateAcademicYear', () => {
    it('should return true for valid academic years', () => {
      expect(service.validateAcademicYear('2024-25')).toBe(true);
      expect(service.validateAcademicYear('2023-24')).toBe(true);
      expect(service.validateAcademicYear('2025-26')).toBe(true);
    });

    it('should return false for invalid academic years', () => {
      expect(service.validateAcademicYear('2024')).toBe(false);
      expect(service.validateAcademicYear('24-25')).toBe(false);
      expect(service.validateAcademicYear('2024-2025')).toBe(false);
      expect(service.validateAcademicYear('')).toBe(false);
    });
  });

  describe('extractSubjectCodeFromPDF', () => {
    it('should extract subject code from PDF text', () => {
      const pdfData = { text: 'DI01000011', url: 'https://example.com/DI01000011.pdf' };
      expect(service.extractSubjectCodeFromPDF(pdfData)).toBe('DI01000011');
    });

    it('should extract subject code from PDF filename', () => {
      const pdfData = { filename: 'DI01000011.pdf', url: 'https://example.com/DI01000011.pdf' };
      expect(service.extractSubjectCodeFromPDF(pdfData)).toBe('DI01000011');
    });

    it('should extract subject code from PDF URL', () => {
      const pdfData = { url: 'https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/DI01000011.pdf' };
      expect(service.extractSubjectCodeFromPDF(pdfData)).toBe('DI01000011');
    });

    it('should return null for invalid PDF data', () => {
      expect(service.extractSubjectCodeFromPDF({})).toBeNull();
      expect(service.extractSubjectCodeFromPDF({ text: 'invalid' })).toBeNull();
      expect(service.extractSubjectCodeFromPDF({ url: 'https://example.com/invalid.pdf' })).toBeNull();
    });
  });

  describe('determineSubjectCategory', () => {
    it('should categorize first year subjects', () => {
      expect(service.determineSubjectCategory('DI01000011', '09')).toBe('First Year Core');
      expect(service.determineSubjectCategory('DI01000021', '06')).toBe('First Year Core');
    });

    it('should categorize second year subjects', () => {
      expect(service.determineSubjectCategory('DI02000011', '09')).toBe('Second Year Core');
      expect(service.determineSubjectCategory('DI02000021', '06')).toBe('Second Year Core');
    });

    it('should categorize third year subjects', () => {
      expect(service.determineSubjectCategory('DI03000011', '09')).toBe('Third Year Core');
      expect(service.determineSubjectCategory('DI03000021', '06')).toBe('Third Year Core');
    });

    it('should categorize common/elective subjects', () => {
      expect(service.determineSubjectCategory('DI01C00011', '09')).toBe('Common/Elective');
      expect(service.determineSubjectCategory('DI02C00021', '06')).toBe('Common/Elective');
    });

    it('should categorize foundation courses', () => {
      expect(service.determineSubjectCategory('DI01000011', '09')).toBe('First Year Core');
    });

    it('should categorize MOOC courses', () => {
      expect(service.determineSubjectCategory('DI90000011', '09')).toBe('MOOC/Online Course');
      expect(service.determineSubjectCategory('DI90000021', '06')).toBe('MOOC/Online Course');
    });

    it('should return unknown for invalid subject codes', () => {
      expect(service.determineSubjectCategory('', '09')).toBe('Unknown');
      expect(service.determineSubjectCategory('INVALID', '06')).toBe('Specialized Course');
    });
  });

  describe('cleanText', () => {
    it('should clean and normalize text', () => {
      expect(service.cleanText('  Hello   World  ')).toBe('Hello World');
      expect(service.cleanText('Line1\nLine2\r\nLine3')).toBe('Line1 Line2 Line3');
      expect(service.cleanText('Tab\tSeparated\tText')).toBe('Tab Separated Text');
    });

    it('should handle empty and null inputs', () => {
      expect(service.cleanText('')).toBe('');
      expect(service.cleanText(null)).toBe('');
      expect(service.cleanText(undefined)).toBe('');
    });
  });

  describe('calculateDataQualityScore', () => {
    it('should calculate score based on available data', () => {
      const entryData = {
        program: 'Diploma',
        branch_code: '09',
        branch_name: 'Electrical Engineering',
        semester: '1',
        academic_year: '2024-25',
        scraped_at: '2024-01-01',
        subjects: [{ subcode: 'DI01000011' }],
        pdf_links: [{ url: 'https://example.com/DI01000011.pdf', text: 'DI01000011', filename: 'DI01000011.pdf' }]
      };
      
      const pdfData = {
        url: 'https://example.com/DI01000011.pdf',
        text: 'DI01000011',
        filename: 'DI01000011.pdf'
      };
      
      const score = service.calculateDataQualityScore(entryData, pdfData);
      expect(score).toBe(100);
    });

    it('should handle missing data appropriately', () => {
      const entryData = {
        program: 'Diploma',
        branch_code: '09',
        branch_name: 'Test Branch',
        semester: '1',
        academic_year: '2024-25',
        scraped_at: '2024-01-01',
        subjects: [],
        pdf_links: []
      };
      
      const pdfData = {
        url: 'https://example.com/DI01000011.pdf'
      };
      
      const score = service.calculateDataQualityScore(entryData, pdfData);
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThan(0);
    });
  });
});

describe('GTUComprehensiveCSVGenerator', () => {
  let generator: GTUComprehensiveCSVGenerator;
  
  beforeEach(() => {
    jest.clearAllMocks();
    generator = new GTUComprehensiveCSVGenerator();
  });

  describe('constructor', () => {
    it('should initialize with branch mappings and comprehensive fields', () => {
      expect(generator).toBeDefined();
      expect(generator.branch_mappings).toBeDefined();
      expect(generator.comprehensive_fields).toBeDefined();
      expect(generator.comprehensive_fields.length).toBeGreaterThan(20);
    });
  });

  describe('cleanText', () => {
    it('should clean and normalize text properly', () => {
      expect(generator.cleanText('  Test   Text  ')).toBe('Test Text');
      expect(generator.cleanText('Line1\r\nLine2\n\nLine3')).toBe('Line1 Line2 Line3');
      expect(generator.cleanText('Tab\tSeparated')).toBe('Tab Separated');
    });

    it('should handle empty inputs', () => {
      expect(generator.cleanText('')).toBe('');
      expect(generator.cleanText(null)).toBe('');
      expect(generator.cleanText(undefined)).toBe('');
    });
  });

  describe('extractSubjectCodeFromPdf', () => {
    it('should extract valid GTU subject codes', () => {
      const pdfLink = { text: 'DI01000011', url: 'https://example.com/DI01000011.pdf' };
      expect(generator.extractSubjectCodeFromPdf(pdfLink)).toBe('DI01000011');
    });

    it('should extract from filename', () => {
      const pdfLink = { filename: 'DI01000011.pdf' };
      expect(generator.extractSubjectCodeFromPdf(pdfLink)).toBe('DI01000011');
    });

    it('should extract from URL', () => {
      const pdfLink = { url: 'https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/DI01000011.pdf' };
      expect(generator.extractSubjectCodeFromPdf(pdfLink)).toBe('DI01000011');
    });

    it('should return null for invalid codes', () => {
      const pdfLink = { text: 'INVALID123' };
      expect(generator.extractSubjectCodeFromPdf(pdfLink)).toBeNull();
    });
  });

  describe('determineSubjectCategory', () => {
    it('should categorize subjects correctly', () => {
      expect(generator.determineSubjectCategory('DI01000011', '09')).toBe('First Year Core');
      expect(generator.determineSubjectCategory('DI02000011', '09')).toBe('Second Year Core');
      expect(generator.determineSubjectCategory('DI03000011', '09')).toBe('Third Year Core');
      expect(generator.determineSubjectCategory('DI01C00011', '09')).toBe('Common/Elective');
      expect(generator.determineSubjectCategory('DI90000011', '09')).toBe('MOOC/Online Course');
    });
  });

  describe('calculateDataQualityScore', () => {
    it('should calculate quality score based on data completeness', () => {
      const entryData = {
        program: 'Diploma',
        branch_code: '09',
        branch_name: 'Electrical Engineering',
        semester: '1',
        academic_year: '2024-25',
        scraped_at: '2024-01-01',
        subjects: [{ subcode: 'DI01000011' }],
        pdf_links: [{ url: 'https://example.com/DI01000011.pdf', text: 'DI01000011', filename: 'DI01000011.pdf' }]
      };
      
      const pdfData = {
        url: 'https://example.com/DI01000011.pdf',
        text: 'DI01000011',
        filename: 'DI01000011.pdf'
      };
      
      const score = generator.calculateDataQualityScore(entryData, pdfData);
      expect(score).toBe(100);
    });
  });

  describe('generateComprehensiveRow', () => {
    it('should generate a complete row with all required fields', () => {
      const entryData = {
        program: 'Diploma',
        branch_code: '09',
        branch_name: 'Electrical Engineering',
        semester: '1',
        academic_year: '2024-25',
        scraped_at: '2024-01-01',
        subjects: [],
        pdf_links: [{ url: 'https://example.com/DI01000011.pdf', text: 'DI01000011', filename: 'DI01000011.pdf' }]
      };
      
      const pdfData = {
        url: 'https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/DI01000011.pdf',
        text: 'DI01000011',
        filename: 'DI01000011.pdf'
      };
      
      const row = generator.generateComprehensiveRow(entryData, pdfData, 0, 0);
      
      expect(row.program).toBe('Diploma');
      expect(row.branch_code).toBe('09');
      expect(row.branch_name).toBe('Electrical Engineering');
      expect(row.department_name).toBe('Electrical Engineering');
      expect(row.department_code).toBe('EE');
      expect(row.semester).toBe('1');
      expect(row.subject_code).toBe('DI01000011');
      expect(row.pdf_url).toBe('https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/DI01000011.pdf');
      expect(row.source_system).toBe('GTU_Diploma_Scraper_Advanced');
      expect(row.data_quality_score).toBeGreaterThan(0);
    });
  });

  describe('generateComprehensiveCSV', () => {
    const mockGTUData = [
      {
        program: 'Diploma',
        branch_code: '09',
        branch_name: 'Electrical Engineering',
        semester: '1',
        academic_year: '2024-25',
        scraped_at: '2024-01-01',
        subjects: [],
        pdf_links: [
          {
            url: 'https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/DI01000011.pdf',
            text: 'DI01000011',
            filename: 'DI01000011.pdf'
          }
        ]
      }
    ];

    beforeEach(() => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockGTUData));
      mockFs.writeFileSync.mockImplementation(() => {});
      mockPath.join.mockReturnValue('/mock/path');
    });

    it('should process GTU data and generate CSV successfully', async () => {
      const result = await generator.generateComprehensiveCSV('/mock/input.json', '/mock/output.csv');
      
      expect(result).toBeDefined();
      expect(result.total_entries).toBe(1);
      expect(result.total_pdf_links).toBe(1);
      expect(result.total_rows_generated).toBe(1);
      expect(result.unique_subject_codes_count).toBe(1);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle file not found error', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });
      
      const result = await generator.generateComprehensiveCSV('/nonexistent.json', '/mock/output.csv');
      
      expect(result.error).toBe('ENOENT: no such file or directory');
    });

    it('should handle invalid JSON error', async () => {
      mockFs.readFileSync.mockReturnValue('invalid json');
      
      const result = await generator.generateComprehensiveCSV('/mock/input.json', '/mock/output.csv');
      
      expect(result.error).toBe('Invalid JSON');
    });
  });

  describe('createImportReadyCSV', () => {
    const mockComprehensiveData = [
      {
        subject_code: 'DI01000011',
        subject_name: 'Mathematics',
        semester: '1',
        department_code: 'EE',
        department_name: 'Electrical Engineering',
        branch_code: '09',
        academic_year: '2024-25',
        category: 'First Year Core',
        lecture_hours: '3',
        tutorial_hours: '1',
        practical_hours: '2',
        is_theory: 'true',
        is_practical: 'true',
        is_elective: 'false',
        is_functional: 'true',
        pdf_url: 'https://example.com/DI01000011.pdf',
        data_quality_score: '100'
      }
    ];

    beforeEach(() => {
      // Mock CSV reading
      const csvContent = mockComprehensiveData.map(row => 
        Object.values(row).join(',')
      ).join('\n');
      
      mockFs.readFileSync.mockReturnValue(`subject_code,subject_name,semester,department_code,department_name,branch_code,academic_year,category,lecture_hours,tutorial_hours,practical_hours,is_theory,is_practical,is_elective,is_functional,pdf_url,data_quality_score\n${csvContent}`);
      mockFs.writeFileSync.mockImplementation(() => {});
    });

    it('should create import-ready CSV from comprehensive data', async () => {
      const result = await generator.createImportReadyCSV('/mock/comprehensive.csv', '/mock/import.csv');
      
      expect(result).toBeDefined();
      expect(result.import_ready_rows).toBeGreaterThan(0);
      expect(result.output_file).toBe('/mock/import.csv');
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should filter out rows without subject codes', async () => {
      const dataWithEmptyCode = [
        ...mockComprehensiveData,
        { ...mockComprehensiveData[0], subject_code: '' }
      ];
      
      const csvContent = dataWithEmptyCode.map(row => 
        Object.values(row).join(',')
      ).join('\n');
      
      mockFs.readFileSync.mockReturnValue(`subject_code,subject_name,semester,department_code,department_name,branch_code,academic_year,category,lecture_hours,tutorial_hours,practical_hours,is_theory,is_practical,is_elective,is_functional,pdf_url,data_quality_score\n${csvContent}`);
      
      const result = await generator.createImportReadyCSV('/mock/comprehensive.csv', '/mock/import.csv');
      
      expect(result.import_ready_rows).toBe(1); // Only the valid row
    });
  });
});

describe('GTU Integration Tests', () => {
  let service: GTUScrapingService;
  let generator: GTUComprehensiveCSVGenerator;
  
  beforeEach(() => {
    service = new GTUScrapingService();
    generator = new GTUComprehensiveCSVGenerator();
  });

  describe('End-to-End GTU Data Processing', () => {
    it('should process complete GTU workflow', async () => {
      const mockScrapedData = [
        {
          program: 'Diploma',
          branch_code: '09',
          branch_name: 'Electrical Engineering',
          semester: '1',
          academic_year: '2024-25',
          scraped_at: '2024-01-01T00:00:00Z',
          subjects: [],
          pdf_links: [
            {
              url: 'https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/DI01000011.pdf',
              text: 'DI01000011',
              filename: 'DI01000011.pdf'
            }
          ],
          total_subjects: 1
        }
      ];
      
      // Mock file operations
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockScrapedData));
      mockFs.writeFileSync.mockImplementation(() => {});
      
      // Test comprehensive CSV generation
      const comprehensiveResult = await generator.generateComprehensiveCSV(
        '/mock/scraped.json',
        '/mock/comprehensive.csv'
      );
      
      expect(comprehensiveResult.total_entries).toBe(1);
      expect(comprehensiveResult.total_pdf_links).toBe(1);
      expect(comprehensiveResult.unique_subject_codes_count).toBe(1);
      
      // Test import-ready CSV creation
      const importReadyResult = await generator.createImportReadyCSV(
        '/mock/comprehensive.csv',
        '/mock/import.csv'
      );
      
      expect(importReadyResult.import_ready_rows).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple branches and semesters', async () => {
      const mockMultiBranchData = [
        {
          program: 'Diploma',
          branch_code: '09',
          branch_name: 'Electrical Engineering',
          semester: '1',
          academic_year: '2024-25',
          scraped_at: '2024-01-01T00:00:00Z',
          subjects: [],
          pdf_links: [
            {
              url: 'https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/DI01000011.pdf',
              text: 'DI01000011',
              filename: 'DI01000011.pdf'
            }
          ]
        },
        {
          program: 'Diploma',
          branch_code: '06',
          branch_name: 'Civil Engineering',
          semester: '2',
          academic_year: '2024-25',
          scraped_at: '2024-01-01T00:00:00Z',
          subjects: [],
          pdf_links: [
            {
              url: 'https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/DI02000021.pdf',
              text: 'DI02000021',
              filename: 'DI02000021.pdf'
            }
          ]
        }
      ];
      
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockMultiBranchData));
      mockFs.writeFileSync.mockImplementation(() => {});
      
      const result = await generator.generateComprehensiveCSV(
        '/mock/multi-branch.json',
        '/mock/comprehensive.csv'
      );
      
      expect(result.total_entries).toBe(2);
      expect(result.branches_processed).toContain('09');
      expect(result.branches_processed).toContain('06');
      expect(result.semesters_processed).toContain('1');
      expect(result.semesters_processed).toContain('2');
    });

    it('should maintain data quality scoring across pipeline', async () => {
      const highQualityData = {
        program: 'Diploma',
        branch_code: '09',
        branch_name: 'Electrical Engineering',
        semester: '1',
        academic_year: '2024-25',
        scraped_at: '2024-01-01T00:00:00Z',
        subjects: [{ subcode: 'DI01000011' }],
        pdf_links: [
          {
            url: 'https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/DI01000011.pdf',
            text: 'DI01000011',
            filename: 'DI01000011.pdf'
          }
        ]
      };
      
      const pdfData = highQualityData.pdf_links[0];
      const qualityScore = generator.calculateDataQualityScore(highQualityData, pdfData);
      
      expect(qualityScore).toBe(100);
    });
  });
});
