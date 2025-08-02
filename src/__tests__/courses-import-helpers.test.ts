// Test helper functions from the courses import API
describe('Courses Import Helper Functions', () => {
  describe('generateGTUSyllabusURL', () => {
    it('should generate correct GTU syllabus URL', () => {
      const generateGTUSyllabusURL = (subcode: string): string => {
        return `https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/${subcode}.pdf`;
      };

      expect(generateGTUSyllabusURL('1234567')).toBe(
        'https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/1234567.pdf'
      );
      expect(generateGTUSyllabusURL('CS101')).toBe(
        'https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/CS101.pdf'
      );
    });
  });

  describe('standardizeEffFrom', () => {
    const standardizeEffFrom = (effFrom: string | null | undefined): string => {
      if (!effFrom || effFrom.trim() === '') {
        return '2024-25';
      }

      const value = effFrom.toString().trim();
      
      // Already in correct format (YYYY-YY)
      if (/^\d{4}-\d{2}$/.test(value)) {
        return value;
      }
      
      // Month-Year format (Aug-11, Sep-12, Jul-23, Jan-24, etc.)
      const monthYearMatch = value.match(/^([A-Za-z]{3})-(\d{2})$/);
      if (monthYearMatch) {
        const month = monthYearMatch[1];
        const yearSuffix = monthYearMatch[2];
        const year = parseInt(yearSuffix);
        const fullYear = year <= 30 ? 2000 + year : 1900 + year;
        
        const monthsBeforeJuly = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        let academicStartYear;
        
        if (monthsBeforeJuly.includes(month)) {
          academicStartYear = fullYear - 1;
        } else {
          academicStartYear = fullYear;
        }
        
        const academicEndYear = ((academicStartYear + 1) % 100).toString().padStart(2, '0');
        return `${academicStartYear}-${academicEndYear}`;
      }
      
      // Date formats (07/01/13, 07/01/24, etc.)
      const dateMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{2})/);
      if (dateMatch) {
        const yearSuffix = dateMatch[3];
        const year = parseInt(yearSuffix);
        const fullYear = year <= 30 ? 2000 + year : 1900 + year;
        const nextYear = ((fullYear + 1) % 100).toString().padStart(2, '0');
        return `${fullYear}-${nextYear}`;
      }
      
      // Single year (2021, 2011, etc.)
      const singleYearMatch = value.match(/^(\d{4})$/);
      if (singleYearMatch) {
        const year = parseInt(singleYearMatch[1]);
        const nextYear = ((year + 1) % 100).toString().padStart(2, '0');
        return `${year}-${nextYear}`;
      }
      
      // Academic year with different separator (2011-12, 2013-14)
      const academicYearMatch = value.match(/^(\d{4})-(\d{2})$/);
      if (academicYearMatch) {
        return value;
      }
      
      return '2024-25';
    };

    it('should return default for null or empty input', () => {
      expect(standardizeEffFrom(null)).toBe('2024-25');
      expect(standardizeEffFrom(undefined)).toBe('2024-25');
      expect(standardizeEffFrom('')).toBe('2024-25');
      expect(standardizeEffFrom('   ')).toBe('2024-25');
    });

    it('should pass through already correct format', () => {
      expect(standardizeEffFrom('2021-22')).toBe('2021-22');
      expect(standardizeEffFrom('2023-24')).toBe('2023-24');
    });

    it('should convert month-year format correctly', () => {
      expect(standardizeEffFrom('Jan-24')).toBe('2023-24'); // Jan 2024 is in 2023-24 academic year
      expect(standardizeEffFrom('Aug-11')).toBe('2011-12'); // Aug 2011 is in 2011-12 academic year
      expect(standardizeEffFrom('Jul-23')).toBe('2023-24'); // Jul 2023 is in 2023-24 academic year
      expect(standardizeEffFrom('Jun-21')).toBe('2020-21'); // Jun 2021 is in 2020-21 academic year
    });

    it('should convert date format correctly', () => {
      expect(standardizeEffFrom('07/01/13')).toBe('2013-14');
      expect(standardizeEffFrom('01/01/24')).toBe('2024-25');
    });

    it('should convert single year format correctly', () => {
      expect(standardizeEffFrom('2021')).toBe('2021-22');
      expect(standardizeEffFrom('2023')).toBe('2023-24');
    });

    it('should handle unknown formats by returning default', () => {
      expect(standardizeEffFrom('invalid-format')).toBe('2024-25');
      expect(standardizeEffFrom('XYZ')).toBe('2024-25');
    });
  });

  describe('isGTUCSVFormat', () => {
    const isGTUCSVFormat = (headers: string[]): boolean => {
      const gtuHeaders = ['subcode', 'branchcode', 'efffrom', 'subjectname', 'category', 'semyear'];
      return gtuHeaders.every(header => headers.includes(header));
    };

    it('should return true for GTU format headers', () => {
      const gtuHeaders = ['subcode', 'branchcode', 'efffrom', 'subjectname', 'category', 'semyear', 'l', 't', 'p'];
      expect(isGTUCSVFormat(gtuHeaders)).toBe(true);
    });

    it('should return false for standard format headers', () => {
      const standardHeaders = ['subcode', 'subjectname', 'semester', 'departmentid', 'programid'];
      expect(isGTUCSVFormat(standardHeaders)).toBe(false);
    });

    it('should return false for missing required headers', () => {
      const incompleteHeaders = ['subcode', 'subjectname', 'category'];
      expect(isGTUCSVFormat(incompleteHeaders)).toBe(false);
    });

    it('should return true when all required headers are present with extras', () => {
      const headersWithExtras = ['subcode', 'branchcode', 'efffrom', 'subjectname', 'category', 'semyear', 'extra1', 'extra2'];
      expect(isGTUCSVFormat(headersWithExtras)).toBe(true);
    });
  });

  describe('generateIdForImport', () => {
    const generateIdForImport = (): string => `crs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    it('should generate IDs with correct prefix', () => {
      const id = generateIdForImport();
      expect(id).toMatch(/^crs_\d+_[a-z0-9]{7}$/);
    });

    it('should generate unique IDs', () => {
      const id1 = generateIdForImport();
      const id2 = generateIdForImport();
      expect(id1).not.toBe(id2);
    });
  });
});