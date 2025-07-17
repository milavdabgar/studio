/**
 * GTU Comprehensive CSV Generator Service
 * Converts GTU scraped data into comprehensive and import-ready CSV formats
 */

import { GTUEntry, GTUPDFLink, GTUScrapingService } from './gtuScrapingService';
import fs from 'fs';
import path from 'path';

export interface ComprehensiveRow {
  program: string;
  branch_code: string;
  branch_name: string;
  department_name: string;
  department_code: string;
  semester: string;
  academic_year: string;
  scraped_at: string;
  subject_code: string;
  pdf_url: string;
  pdf_filename: string;
  subject_name: string;
  category: string;
  credits: number;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  theory_marks: number;
  practical_marks: number;
  total_marks: number;
  exam_duration: string;
  is_elective: boolean;
  is_theory: boolean;
  is_practical: boolean;
  is_functional: boolean;
  raw_subject_data: string;
  entry_index: number;
  pdf_index: number;
  source_system: string;
  import_timestamp: string;
  data_quality_score: number;
}

export interface ImportReadyRow {
  subcode: string;
  subjectname: string;
  semester: string;
  departmentcode: string;
  departmentname: string;
  programcode: string;
  programname: string;
  branchcode: string;
  efffrom: string;
  category: string;
  lecturehours: string;
  tutorialhours: string;
  practicalhours: string;
  credits: string;
  theoryesemarks: string;
  theorypamarks: string;
  practicalesemarks: string;
  practicalpamarks: string;
  totalmarks: string;
  iselective: string;
  istheory: string;
  ispractical: string;
  isfunctional: string;
  issemipractical: string;
  theoryexamduration: string;
  practicalexamduration: string;
  remarks: string;
}

export class GTUComprehensiveCSVGenerator {
  private gtuService: GTUScrapingService;
  
  public branch_mappings: Record<string, { name: string; code: string; department: string }> = {
    '06': { name: 'Civil Engineering', code: 'CE', department: 'Civil Engineering' },
    '09': { name: 'Electrical Engineering', code: 'EE', department: 'Electrical Engineering' },
    '11': { name: 'Electronics & Communication', code: 'EC', department: 'Electronics & Communication' },
    '16': { name: 'Information Technology', code: 'IT', department: 'Information Technology' },
    '19': { name: 'Mechanical Engineering', code: 'ME', department: 'Mechanical Engineering' },
    '32': { name: 'Computer Engineering', code: 'CE-COMP', department: 'Computer Engineering' }
  };

  public comprehensive_fields: string[] = [
    'program', 'branch_code', 'branch_name', 'department_name', 'department_code',
    'semester', 'academic_year', 'scraped_at', 'subject_code', 'pdf_url', 'pdf_filename',
    'subject_name', 'category', 'credits', 'lecture_hours', 'tutorial_hours', 'practical_hours',
    'theory_marks', 'practical_marks', 'total_marks', 'exam_duration',
    'is_elective', 'is_theory', 'is_practical', 'is_functional',
    'raw_subject_data', 'entry_index', 'pdf_index',
    'source_system', 'import_timestamp', 'data_quality_score'
  ];

  constructor() {
    this.gtuService = new GTUScrapingService();
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
   * Extract GTU subject code from PDF link
   */
  extractSubjectCodeFromPdf(pdfLink: GTUPDFLink): string | null {
    return this.gtuService.extractSubjectCodeFromPDF(pdfLink);
  }

  /**
   * Determine subject category based on subject code patterns
   */
  determineSubjectCategory(subjectCode: string, branchCode: string): string {
    return this.gtuService.determineSubjectCategory(subjectCode, branchCode);
  }

  /**
   * Calculate data quality score
   */
  calculateDataQualityScore(entryData: GTUEntry, pdfData: GTUPDFLink): number {
    return this.gtuService.calculateDataQualityScore(entryData, pdfData);
  }

  /**
   * Extract basic subject information from messy subjects data
   */
  private extractBasicSubjectInfo(subjectsData: any[]): {
    subject_name: string;
    category: string;
    lecture_hours: number;
    tutorial_hours: number;
    practical_hours: number;
    is_elective: boolean;
    is_theory: boolean;
    is_practical: boolean;
  } {
    const subjectInfo = {
      subject_name: '',
      category: '',
      lecture_hours: 0,
      tutorial_hours: 0,
      practical_hours: 0,
      is_elective: false,
      is_theory: true,
      is_practical: false
    };

    // Try to extract meaningful data from the scrambled subject data
    if (Array.isArray(subjectsData)) {
      subjectsData.forEach((subject) => {
        if (typeof subject === 'object' && subject !== null) {
          Object.entries(subject).forEach(([key, value]) => {
            const keyLower = key.toLowerCase();
            const valueStr = String(value).toLowerCase();
            
            if (keyLower.includes('category') && value) {
              subjectInfo.category = this.cleanText(String(value));
            } else if (valueStr.includes('elective')) {
              subjectInfo.is_elective = valueStr.includes('yes');
            } else if (valueStr.includes('practical')) {
              subjectInfo.is_practical = valueStr.includes('yes');
            } else if (valueStr.includes('theory')) {
              subjectInfo.is_theory = valueStr.includes('yes');
            }
          });
        }
      });
    }

    return subjectInfo;
  }

  /**
   * Generate a comprehensive CSV row with all available GTU data
   */
  generateComprehensiveRow(
    entryData: GTUEntry,
    pdfData: GTUPDFLink,
    entryIndex: number,
    pdfIndex: number
  ): ComprehensiveRow {
    // Extract subject code
    const subjectCode = this.extractSubjectCodeFromPdf(pdfData);
    
    // Get branch mapping
    const branchCode = entryData.branch_code || '';
    const branchInfo = this.branch_mappings[branchCode] || {
      name: 'Unknown Branch',
      code: 'UNK',
      department: 'Unknown Department'
    };
    
    // Extract basic subject info from subjects data
    const subjectInfo = this.extractBasicSubjectInfo(entryData.subjects || []);
    
    // Determine category
    const category = subjectInfo.category || this.determineSubjectCategory(subjectCode || '', branchCode);
    
    // Calculate quality score
    const qualityScore = this.calculateDataQualityScore(entryData, pdfData);
    
    // Create comprehensive row
    const row: ComprehensiveRow = {
      program: entryData.program || 'Diploma',
      branch_code: branchCode,
      branch_name: entryData.branch_name || branchInfo.name,
      department_name: branchInfo.department,
      department_code: branchInfo.code,
      semester: entryData.semester || '',
      academic_year: entryData.academic_year || '2024-25',
      scraped_at: entryData.scraped_at || '',
      
      subject_code: subjectCode || '',
      pdf_url: pdfData.url || '',
      pdf_filename: pdfData.filename || '',
      
      subject_name: subjectInfo.subject_name || '',
      category: category,
      credits: 0,
      lecture_hours: subjectInfo.lecture_hours || 0,
      tutorial_hours: subjectInfo.tutorial_hours || 0,
      practical_hours: subjectInfo.practical_hours || 0,
      theory_marks: 0,
      practical_marks: 0,
      total_marks: 0,
      exam_duration: '',
      is_elective: subjectInfo.is_elective || false,
      is_theory: subjectInfo.is_theory || true,
      is_practical: subjectInfo.is_practical || false,
      is_functional: true,
      
      raw_subject_data: this.cleanText(JSON.stringify(entryData.subjects || [])),
      entry_index: entryIndex,
      pdf_index: pdfIndex,
      
      source_system: 'GTU_Diploma_Scraper_Advanced',
      import_timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
      data_quality_score: qualityScore
    };
    
    return row;
  }

  /**
   * Generate comprehensive CSV from GTU JSON data
   */
  async generateComprehensiveCSV(
    jsonFilePath: string,
    outputCsvPath: string
  ): Promise<{
    total_entries?: number;
    total_pdf_links?: number;
    total_rows_generated?: number;
    unique_subject_codes_count?: number;
    branches_processed?: string[];
    semesters_processed?: string[];
    average_quality_score?: number;
    min_quality_score?: number;
    max_quality_score?: number;
    error?: string;
  }> {
    try {
      // Read GTU data
      const gtuDataJson = fs.readFileSync(jsonFilePath, 'utf-8');
      const gtuData: GTUEntry[] = JSON.parse(gtuDataJson);
      
      const comprehensiveRows: ComprehensiveRow[] = [];
      const uniqueSubjectCodes = new Set<string>();
      const branchesProcessed = new Set<string>();
      const semestersProcessed = new Set<string>();
      const qualityScores: number[] = [];
      let totalPDFLinks = 0;
      
      // Process each entry
      gtuData.forEach((entry, entryIndex) => {
        branchesProcessed.add(entry.branch_code);
        semestersProcessed.add(entry.semester);
        
        const pdfLinks = entry.pdf_links || [];
        totalPDFLinks += pdfLinks.length;
        
        if (pdfLinks.length > 0) {
          pdfLinks.forEach((pdfLink, pdfIndex) => {
            const row = this.generateComprehensiveRow(entry, pdfLink, entryIndex, pdfIndex);
            comprehensiveRows.push(row);
            
            if (row.subject_code) {
              uniqueSubjectCodes.add(row.subject_code);
            }
            
            qualityScores.push(row.data_quality_score);
          });
        } else {
          // Create entry even without PDF links
          const row = this.generateComprehensiveRow(entry, {}, entryIndex, 0);
          comprehensiveRows.push(row);
          qualityScores.push(row.data_quality_score);
        }
      });
      
      // Write comprehensive CSV
      const csvHeader = this.comprehensive_fields.join(',');
      const csvRows = comprehensiveRows.map(row => 
        this.comprehensive_fields.map(field => {
          const value = (row as any)[field];
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      );
      
      const csvContent = [csvHeader, ...csvRows].join('\n');
      fs.writeFileSync(outputCsvPath, csvContent, 'utf-8');
      
      // Calculate statistics
      const avgQualityScore = qualityScores.length > 0 ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0;
      const minQualityScore = qualityScores.length > 0 ? Math.min(...qualityScores) : 0;
      const maxQualityScore = qualityScores.length > 0 ? Math.max(...qualityScores) : 0;
      
      return {
        total_entries: gtuData.length,
        total_pdf_links: totalPDFLinks,
        total_rows_generated: comprehensiveRows.length,
        unique_subject_codes_count: uniqueSubjectCodes.size,
        branches_processed: Array.from(branchesProcessed),
        semesters_processed: Array.from(semestersProcessed),
        average_quality_score: avgQualityScore,
        min_quality_score: minQualityScore,
        max_quality_score: maxQualityScore
      };
      
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return { error: 'File not found' };
      }
      if (error instanceof SyntaxError) {
        return { error: 'Invalid JSON' };
      }
      return { error: error.message };
    }
  }

  /**
   * Create import-ready CSV for admin.courses from comprehensive CSV
   */
  async createImportReadyCSV(
    comprehensiveCsvPath: string,
    importCsvPath: string
  ): Promise<{
    import_ready_rows: number;
    output_file: string;
    error?: string;
  }> {
    try {
      // Read comprehensive CSV
      const csvContent = fs.readFileSync(comprehensiveCsvPath, 'utf-8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      const dataLines = lines.slice(1);
      
      const importRows: ImportReadyRow[] = [];
      
      dataLines.forEach(line => {
        if (line.trim()) {
          const values = line.split(',');
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          // Only include rows with valid subject codes
          if (row.subject_code && row.subject_code.trim()) {
            const importRow: ImportReadyRow = {
              subcode: row.subject_code.trim().toUpperCase(),
              subjectname: row.subject_name || `Subject ${row.subject_code}`,
              semester: row.semester || '1',
              
              departmentcode: row.department_code || '',
              departmentname: row.department_name || '',
              programcode: `D${row.department_code}`,
              programname: `Diploma in ${row.department_name}`,
              
              branchcode: row.branch_code || '',
              efffrom: row.academic_year || '',
              category: row.category || '',
              
              lecturehours: String(row.lecture_hours || '0'),
              tutorialhours: String(row.tutorial_hours || '0'),
              practicalhours: String(row.practical_hours || '0'),
              credits: String(parseInt(row.lecture_hours || '0') + parseInt(row.tutorial_hours || '0') + parseInt(row.practical_hours || '0')) || '3',
              
              theoryesemarks: row.is_theory === 'true' ? '70' : '0',
              theorypamarks: row.is_theory === 'true' ? '30' : '0',
              practicalesemarks: row.is_practical === 'true' ? '50' : '0',
              practicalpamarks: row.is_practical === 'true' ? '50' : '0',
              totalmarks: '100',
              
              iselective: String(row.is_elective).toLowerCase(),
              istheory: String(row.is_theory).toLowerCase(),
              ispractical: String(row.is_practical).toLowerCase(),
              isfunctional: String(row.is_functional).toLowerCase(),
              issemipractical: 'false',
              
              theoryexamduration: row.is_theory === 'true' ? '3 Hours' : '',
              practicalexamduration: row.is_practical === 'true' ? '3 Hours' : '',
              
              remarks: `GTU PDF: ${row.pdf_url}, Quality: ${row.data_quality_score}`
            };
            
            importRows.push(importRow);
          }
        }
      });
      
      // Write import-ready CSV
      if (importRows.length > 0) {
        const importFieldnames = Object.keys(importRows[0]);
        const importCsvHeader = importFieldnames.join(',');
        const importCsvRows = importRows.map(row => 
          importFieldnames.map(field => {
            const value = (row as any)[field];
            // Escape values that contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        );
        
        const importCsvContent = [importCsvHeader, ...importCsvRows].join('\n');
        fs.writeFileSync(importCsvPath, importCsvContent, 'utf-8');
      }
      
      return {
        import_ready_rows: importRows.length,
        output_file: importCsvPath
      };
      
    } catch (error: any) {
      return {
        import_ready_rows: 0,
        output_file: importCsvPath,
        error: error.message
      };
    }
  }
}
