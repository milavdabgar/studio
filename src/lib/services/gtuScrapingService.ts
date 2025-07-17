/**
 * GTU Scraping Service
 * Handles GTU website scraping, data validation, and processing
 */

export interface GTUPDFLink {
  url?: string;
  text?: string;
  filename?: string;
}

export interface GTUSubject {
  subcode?: string;
  subjectName?: string;
  category?: string;
  semester?: string;
  [key: string]: any;
}

export interface GTUEntry {
  program: string;
  branch_code: string;
  branch_name: string;
  semester: string;
  academic_year: string;
  scraped_at: string;
  subjects: GTUSubject[];
  pdf_links: GTUPDFLink[];
  total_subjects?: number;
}

export class GTUScrapingService {
  public branchMappings: Record<string, { name: string; code: string }> = {
    '06': { name: 'Civil Engineering', code: 'CE' },
    '09': { name: 'Electrical Engineering', code: 'EE' },
    '11': { name: 'Electronics & Communication', code: 'EC' },
    '16': { name: 'Information Technology', code: 'IT' },
    '19': { name: 'Mechanical Engineering', code: 'ME' },
    '32': { name: 'Computer Engineering', code: 'CE-COMP' }
  };

  private readonly validSemesters = [1, 2, 3, 4, 5, 6];
  private readonly academicYearPattern = /^\d{4}-\d{2}$/;
  private readonly gtuSubjectCodePattern = /^[A-Z]{2}\d{8}$/;

  constructor() {}

  /**
   * Validate GTU branch code
   */
  validateBranchCode(branchCode: string): boolean {
    return branchCode in this.branchMappings;
  }

  /**
   * Validate semester number
   */
  validateSemester(semester: number): boolean {
    return this.validSemesters.includes(semester);
  }

  /**
   * Validate academic year format
   */
  validateAcademicYear(academicYear: string): boolean {
    return this.academicYearPattern.test(academicYear);
  }

  /**
   * Extract GTU subject code from PDF link data
   */
  extractSubjectCodeFromPDF(pdfData: GTUPDFLink): string | null {
    // Try to extract from text field
    if (pdfData.text && this.gtuSubjectCodePattern.test(pdfData.text.trim())) {
      return pdfData.text.trim();
    }

    // Try to extract from filename
    if (pdfData.filename) {
      const match = pdfData.filename.match(/([A-Z]{2}\d{8})/);
      if (match) {
        return match[1];
      }
    }

    // Try to extract from URL
    if (pdfData.url) {
      const match = pdfData.url.match(/\/([A-Z]{2}\d{8})\.pdf/);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Determine subject category based on subject code patterns
   */
  determineSubjectCategory(subjectCode: string, branchCode: string): string {
    if (!subjectCode) return 'Unknown';

    // GTU Diploma subject code patterns - check specific patterns first
    if (subjectCode.includes('C') && subjectCode.match(/DI\d{2}C\d{5}/)) {
      return 'Common/Elective';
    } else if (subjectCode.substring(2, 4) === '90') {
      return 'MOOC/Online Course';
    } else if (subjectCode.startsWith('DI01')) {
      return 'First Year Core';
    } else if (subjectCode.startsWith('DI02')) {
      return 'Second Year Core';
    } else if (subjectCode.startsWith('DI03')) {
      return 'Third Year Core';
    } else if (subjectCode.substring(2, 4) === '00') {
      return 'Foundation Course';
    } else {
      return 'Specialized Course';
    }
  }

  /**
   * Clean and normalize text data
   */
  cleanText(text: any): string {
    if (!text) return '';
    
    // Remove extra whitespace, newlines, carriage returns
    const cleaned = String(text).replace(/\s+/g, ' ').trim();
    // Remove special characters that might cause CSV issues
    return cleaned.replace(/[\r\n\t]/g, ' ');
  }

  /**
   * Calculate data quality score based on available information
   */
  calculateDataQualityScore(entryData: GTUEntry, pdfData: GTUPDFLink): number {
    let score = 0;
    
    // Basic entry data (30 points)
    if (entryData.program) score += 5;
    if (entryData.branch_code) score += 5;
    if (entryData.branch_name) score += 5;
    if (entryData.semester) score += 5;
    if (entryData.academic_year) score += 5;
    if (entryData.scraped_at) score += 5;
    
    // PDF data (40 points)
    if (pdfData.url) score += 15;
    if (pdfData.text) score += 10;
    if (pdfData.filename) score += 10;
    if (this.extractSubjectCodeFromPDF(pdfData)) score += 5;
    
    // Structured subject data (30 points)
    if (entryData.subjects && entryData.subjects.length > 0) score += 30;
    
    return Math.min(score, 100);
  }

  /**
   * Validate complete GTU entry data
   */
  validateGTUEntry(entry: GTUEntry): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!entry.program) errors.push('Program is required');
    if (!entry.branch_code) errors.push('Branch code is required');
    if (!this.validateBranchCode(entry.branch_code)) errors.push('Invalid branch code');
    if (!entry.semester) errors.push('Semester is required');
    if (!this.validateSemester(parseInt(entry.semester))) errors.push('Invalid semester');
    if (!entry.academic_year) errors.push('Academic year is required');
    if (!this.validateAcademicYear(entry.academic_year)) errors.push('Invalid academic year format');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get branch information by code
   */
  getBranchInfo(branchCode: string): { name: string; code: string; department: string } {
    const branch = this.branchMappings[branchCode];
    if (!branch) {
      return {
        name: 'Unknown Branch',
        code: 'UNK',
        department: 'Unknown Department'
      };
    }

    return {
      name: branch.name,
      code: branch.code,
      department: branch.name // Department name same as branch name for diploma
    };
  }

  /**
   * Process and validate scraped GTU data
   */
  processScrapedData(rawData: any[]): {
    processedEntries: GTUEntry[];
    validationErrors: Array<{ index: number; errors: string[] }>;
    statistics: {
      totalEntries: number;
      validEntries: number;
      totalPDFLinks: number;
      uniqueSubjectCodes: number;
      branchesProcessed: string[];
      semestersProcessed: string[];
    };
  } {
    const processedEntries: GTUEntry[] = [];
    const validationErrors: Array<{ index: number; errors: string[] }> = [];
    const uniqueSubjectCodes = new Set<string>();
    const branchesProcessed = new Set<string>();
    const semestersProcessed = new Set<string>();
    let totalPDFLinks = 0;

    rawData.forEach((entry, index) => {
      const validation = this.validateGTUEntry(entry);
      
      if (!validation.isValid) {
        validationErrors.push({ index, errors: validation.errors });
        return;
      }

      // Process PDF links to extract subject codes
      if (entry.pdf_links) {
        entry.pdf_links.forEach((pdfLink: GTUPDFLink) => {
          const subjectCode = this.extractSubjectCodeFromPDF(pdfLink);
          if (subjectCode) {
            uniqueSubjectCodes.add(subjectCode);
          }
        });
        totalPDFLinks += entry.pdf_links.length;
      }

      branchesProcessed.add(entry.branch_code);
      semestersProcessed.add(entry.semester);
      processedEntries.push(entry);
    });

    return {
      processedEntries,
      validationErrors,
      statistics: {
        totalEntries: rawData.length,
        validEntries: processedEntries.length,
        totalPDFLinks,
        uniqueSubjectCodes: uniqueSubjectCodes.size,
        branchesProcessed: Array.from(branchesProcessed),
        semestersProcessed: Array.from(semestersProcessed)
      }
    };
  }
}
