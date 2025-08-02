// Test validation functions extracted from courses import API
describe('Courses Import Validation Functions', () => {
  describe('Course Data Validation', () => {
    const validateCourseData = (courseData: any): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      if (!courseData.subcode?.toString().trim()) {
        errors.push('Subcode is required');
      }
      
      if (!courseData.subjectName?.toString().trim()) {
        errors.push('Subject name is required');
      }
      
      const semester = parseInt(courseData.semester?.toString() || '0');
      if (isNaN(semester) || semester <= 0) {
        errors.push('Valid semester is required');
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    };

    it('should validate complete course data', () => {
      const validCourse = {
        subcode: 'CS101',
        subjectName: 'Programming Fundamentals',
        semester: '3'
      };
      
      const result = validateCourseData(validCourse);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject course with missing subcode', () => {
      const invalidCourse = {
        subcode: '',
        subjectName: 'Programming Fundamentals',
        semester: '3'
      };
      
      const result = validateCourseData(invalidCourse);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Subcode is required');
    });

    it('should reject course with missing subject name', () => {
      const invalidCourse = {
        subcode: 'CS101',
        subjectName: '',
        semester: '3'
      };
      
      const result = validateCourseData(invalidCourse);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Subject name is required');
    });

    it('should reject course with invalid semester', () => {
      const invalidCourse = {
        subcode: 'CS101',
        subjectName: 'Programming Fundamentals',
        semester: 'invalid'
      };
      
      const result = validateCourseData(invalidCourse);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid semester is required');
    });

    it('should reject course with multiple validation errors', () => {
      const invalidCourse = {
        subcode: '',
        subjectName: '',
        semester: 'invalid'
      };
      
      const result = validateCourseData(invalidCourse);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Subcode is required');
      expect(result.errors).toContain('Subject name is required');
      expect(result.errors).toContain('Valid semester is required');
    });
  });

  describe('Credits Calculation', () => {
    const calculateCredits = (lectureHours: number, tutorialHours: number, practicalHours: number): number => {
      return lectureHours + tutorialHours + (practicalHours * 0.5);
    };

    it('should calculate credits correctly for theory course', () => {
      const credits = calculateCredits(4, 0, 0);
      expect(credits).toBe(4);
    });

    it('should calculate credits correctly for practical course', () => {
      const credits = calculateCredits(0, 0, 4);
      expect(credits).toBe(2);
    });

    it('should calculate credits correctly for mixed course', () => {
      const credits = calculateCredits(3, 1, 2);
      expect(credits).toBe(5); // 3 + 1 + (2 * 0.5)
    });

    it('should handle zero hours correctly', () => {
      const credits = calculateCredits(0, 0, 0);
      expect(credits).toBe(0);
    });
  });

  describe('Total Marks Calculation', () => {
    const calculateTotalMarks = (theoryEse: number, theoryPa: number, practicalEse: number, practicalPa: number): number => {
      return theoryEse + theoryPa + practicalEse + practicalPa;
    };

    it('should calculate total marks correctly', () => {
      const total = calculateTotalMarks(70, 30, 50, 25);
      expect(total).toBe(175);
    });

    it('should handle zero marks correctly', () => {
      const total = calculateTotalMarks(0, 0, 0, 0);
      expect(total).toBe(0);
    });

    it('should calculate theory-only marks', () => {
      const total = calculateTotalMarks(100, 25, 0, 0);
      expect(total).toBe(125);
    });

    it('should calculate practical-only marks', () => {
      const total = calculateTotalMarks(0, 0, 75, 25);
      expect(total).toBe(100);
    });
  });

  describe('Course Type Detection', () => {
    const detectCourseTypes = (lectureHours: number, practicalHours: number, category: string) => {
      return {
        isTheory: lectureHours > 0,
        isPractical: practicalHours > 0,
        isElective: category?.toLowerCase().includes('elective') || false,
        isFunctional: !category?.toLowerCase().includes('non-functional')
      };
    };

    it('should detect theory course correctly', () => {
      const types = detectCourseTypes(4, 0, 'Core');
      
      expect(types.isTheory).toBe(true);
      expect(types.isPractical).toBe(false);
      expect(types.isElective).toBe(false);
      expect(types.isFunctional).toBe(true);
    });

    it('should detect practical course correctly', () => {
      const types = detectCourseTypes(0, 4, 'Core');
      
      expect(types.isTheory).toBe(false);
      expect(types.isPractical).toBe(true);
      expect(types.isElective).toBe(false);
      expect(types.isFunctional).toBe(true);
    });

    it('should detect elective course correctly', () => {
      const types = detectCourseTypes(3, 0, 'Professional Elective');
      
      expect(types.isTheory).toBe(true);
      expect(types.isPractical).toBe(false);
      expect(types.isElective).toBe(true);
      expect(types.isFunctional).toBe(true);
    });

    it('should detect mixed theory-practical course', () => {
      const types = detectCourseTypes(2, 2, 'Core');
      
      expect(types.isTheory).toBe(true);
      expect(types.isPractical).toBe(true);
      expect(types.isElective).toBe(false);
      expect(types.isFunctional).toBe(true);
    });
  });

  describe('Department and Program Mapping', () => {
    const mockDepartments = [
      { id: 'dept_1', name: 'Computer Engineering', code: 'CE' },
      { id: 'dept_2', name: 'Mechanical Engineering', code: 'ME' }
    ];

    const mockPrograms = [
      { id: 'prog_1', name: 'Computer Engineering', code: '6', departmentId: 'dept_1' },
      { id: 'prog_2', name: 'Mechanical Engineering', code: '9', departmentId: 'dept_2' }
    ];

    const findDepartmentByCode = (code: string) => {
      return mockDepartments.find(d => d.code.toUpperCase() === code.toUpperCase());
    };

    const findProgramByCode = (code: string, departmentId?: string) => {
      return mockPrograms.find(p => 
        p.code === code && (!departmentId || p.departmentId === departmentId)
      );
    };

    it('should find department by code', () => {
      const dept = findDepartmentByCode('CE');
      
      expect(dept).toBeDefined();
      expect(dept?.name).toBe('Computer Engineering');
      expect(dept?.id).toBe('dept_1');
    });

    it('should find department by code case-insensitive', () => {
      const dept = findDepartmentByCode('ce');
      
      expect(dept).toBeDefined();
      expect(dept?.name).toBe('Computer Engineering');
    });

    it('should return undefined for non-existent department code', () => {
      const dept = findDepartmentByCode('XX');
      
      expect(dept).toBeUndefined();
    });

    it('should find program by code', () => {
      const program = findProgramByCode('6');
      
      expect(program).toBeDefined();
      expect(program?.name).toBe('Computer Engineering');
      expect(program?.departmentId).toBe('dept_1');
    });

    it('should find program by code with department filter', () => {
      const program = findProgramByCode('6', 'dept_1');
      
      expect(program).toBeDefined();
      expect(program?.name).toBe('Computer Engineering');
    });

    it('should return undefined for program with wrong department', () => {
      const program = findProgramByCode('6', 'dept_2');
      
      expect(program).toBeUndefined();
    });
  });

  describe('Branch Code Normalization', () => {
    const normalizeBranchCode = (code: string): string => {
      // Handle both zero-padded (06, 09) and non-padded (6, 9) codes
      const normalizedCode = code.padStart(2, '0');
      return normalizedCode;
    };

    const compareBranchCodes = (code1: string, code2: string): boolean => {
      const normalized1 = normalizeBranchCode(code1);
      const normalized2 = normalizeBranchCode(code2);
      
      // Also try numeric comparison
      const num1 = parseInt(code1);
      const num2 = parseInt(code2);
      
      return normalized1 === normalized2 || 
             (!isNaN(num1) && !isNaN(num2) && num1 === num2);
    };

    it('should normalize single digit codes', () => {
      expect(normalizeBranchCode('6')).toBe('06');
      expect(normalizeBranchCode('9')).toBe('09');
    });

    it('should keep double digit codes unchanged', () => {
      expect(normalizeBranchCode('06')).toBe('06');
      expect(normalizeBranchCode('10')).toBe('10');
    });

    it('should compare codes correctly', () => {
      expect(compareBranchCodes('6', '06')).toBe(true);
      expect(compareBranchCodes('9', '09')).toBe(true);
      expect(compareBranchCodes('06', '6')).toBe(true);
      expect(compareBranchCodes('6', '9')).toBe(false);
    });
  });
});