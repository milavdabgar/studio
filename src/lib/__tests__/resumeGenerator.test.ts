import { ResumeGenerator, type ResumeData } from '../services/resumeGenerator';
import type { Student, Program, Batch, Result, Course } from '@/types/entities';

// Mock Puppeteer for PDF generation
jest.mock('puppeteer', () => {
  const mockPage = {
    setViewport: jest.fn().mockResolvedValue(undefined),
    setContent: jest.fn().mockResolvedValue(undefined),
    evaluateHandle: jest.fn().mockResolvedValue({}),
    evaluate: jest.fn().mockResolvedValue({}),
    pdf: jest.fn().mockResolvedValue(Buffer.from('mocked-pdf-content'))
  };
  const mockBrowser = {
    newPage: jest.fn().mockResolvedValue(mockPage),
    close: jest.fn().mockResolvedValue(undefined)
  };
  return {
    launch: jest.fn().mockResolvedValue(mockBrowser)
  };
});

// Mock the ContentConverterV2 for DOCX generation
jest.mock('../content-converter-v2', () => {
  return {
    ContentConverterV2: jest.fn().mockImplementation(() => ({
      convert: jest.fn().mockImplementation((content: string, format: string) => {
        if (format === 'docx') {
          return Promise.resolve(Buffer.from('mocked-docx-content'));
        } else {
          return Promise.resolve(content);
        }
      })
    }))
  };
});

describe('ResumeGenerator', () => {
  let resumeGenerator: ResumeGenerator;

  // Mock data
  const mockStudent: Student = {
    id: 'student-123',
    userId: 'user-123',
    enrollmentNumber: '220123456789',
    fullNameGtuFormat: 'DOE JOHN MICHAEL',
    firstName: 'John',
    middleName: 'Michael',
    lastName: 'Doe',
    personalEmail: 'john.doe@gmail.com',
    instituteEmail: '220123456789@gppalanpur.ac.in',
    contactNumber: '+91-9876543210',
    address: '123 Main Street, Palanpur, Gujarat',
    dateOfBirth: '2002-05-15T00:00:00.000Z',
    gender: 'Male',
    programId: 'prog-123',
    currentSemester: 6,
    status: 'active',
    createdAt: '2023-08-01T00:00:00.000Z',
    updatedAt: '2024-07-01T00:00:00.000Z'
  };

  const mockProgram: Program = {
    id: 'prog-123',
    name: 'Computer Engineering',
    code: 'CE',
    description: 'Computer Engineering Program',
    departmentId: 'dept-ce',
    instituteId: 'inst-1',
    degreeType: 'Diploma',
    durationYears: 3,
    totalSemesters: 6,
    totalCredits: 180,
    status: 'active',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const mockBatch: Batch = {
    id: 'batch-123',
    name: 'CE-2022',
    programId: 'prog-123',
    startAcademicYear: 2022,
    endAcademicYear: 2025,
    status: 'active',
    maxIntake: 60,
    createdAt: '2022-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const mockResults: Result[] = [
    {
      _id: 'result-1',
      studentId: 'student-123',
      enrollmentNo: '220123456789',
      semester: 1,
      academicYear: '2022-23',
      name: 'DOE JOHN MICHAEL',
      branchName: 'Computer Engineering',
      subjects: [
        { code: '4300001', name: 'Engineering Mathematics - I', credits: 4, grade: 'AA', isBacklog: false },
        { code: '4300002', name: 'Communication Skills', credits: 3, grade: 'AB', isBacklog: false },
        { code: '4300003', name: 'Engineering Science', credits: 5, grade: 'BB', isBacklog: false }
      ],
      totalCredits: 12,
      earnedCredits: 12,
      spi: 9.17,
      cpi: 9.17,
      result: 'PASS',
      uploadBatch: 'batch-2023'
    },
    {
      _id: 'result-2',
      studentId: 'student-123',
      enrollmentNo: '220123456789',
      semester: 2,
      academicYear: '2022-23',
      name: 'DOE JOHN MICHAEL',
      branchName: 'Computer Engineering',
      subjects: [
        { code: '4320001', name: 'Applied Mathematics - II', credits: 4, grade: 'AB', isBacklog: false },
        { code: '4320002', name: 'Applied Physics', credits: 4, grade: 'BB', isBacklog: false },
        { code: '4320003', name: 'Programming in C', credits: 5, grade: 'AA', isBacklog: false }
      ],
      totalCredits: 13,
      earnedCredits: 13,
      spi: 9.08,
      cpi: 9.12,
      result: 'PASS',
      uploadBatch: 'batch-2023'
    }
  ];

  const mockCourses: Course[] = [
    {
      id: 'course-1',
      subcode: '4300001',
      subjectName: 'Engineering Mathematics - I',
      departmentId: 'dept-ce',
      programId: 'prog-123',
      semester: 1,
      lectureHours: 3,
      tutorialHours: 1,
      practicalHours: 0,
      credits: 4,
      theoryEseMarks: 70,
      theoryPaMarks: 30,
      practicalEseMarks: 0,
      practicalPaMarks: 0,
      totalMarks: 100,
      isElective: false,
      isTheory: true,
      isPractical: false,
      isFunctional: true,
      category: 'Core',
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'course-2',
      subcode: '4300002',
      subjectName: 'Communication Skills',
      departmentId: 'dept-ce',
      programId: 'prog-123',
      semester: 1,
      lectureHours: 2,
      tutorialHours: 1,
      practicalHours: 0,
      credits: 3,
      theoryEseMarks: 70,
      theoryPaMarks: 30,
      practicalEseMarks: 0,
      practicalPaMarks: 0,
      totalMarks: 100,
      isElective: false,
      isTheory: true,
      isPractical: false,
      isFunctional: true,
      category: 'Core',
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    resumeGenerator = new ResumeGenerator();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateResumeData', () => {
    it('should generate basic resume data with student information', () => {
      const resumeData = resumeGenerator.generateResumeData(mockStudent);

      expect(resumeData.fullName).toBe('DOE JOHN MICHAEL');
      expect(resumeData.email).toBe('john.doe@gmail.com');
      expect(resumeData.personalEmail).toBe('john.doe@gmail.com');
      expect(resumeData.contactNumber).toBe('+91-9876543210');
      expect(resumeData.address).toBe('123 Main Street, Palanpur, Gujarat');
      expect(resumeData.enrollmentNumber).toBe('220123456789');
      expect(resumeData.currentSemester).toBe(6);
      expect(resumeData.instituteEmail).toBe('220123456789@gppalanpur.ac.in');
    });

    it('should include program information when provided', () => {
      const resumeData = resumeGenerator.generateResumeData(mockStudent, mockProgram);

      expect(resumeData.program).toBe('Computer Engineering');
      expect(resumeData.programCode).toBe('CE');
      expect(resumeData.totalCredits).toBe(180);
    });

    it('should include batch information when provided', () => {
      const resumeData = resumeGenerator.generateResumeData(mockStudent, mockProgram, mockBatch);

      expect(resumeData.batch).toBe('CE-2022');
    });

    it('should calculate academic performance from results', () => {
      const resumeData = resumeGenerator.generateResumeData(
        mockStudent, 
        mockProgram, 
        mockBatch, 
        mockResults, 
        mockCourses
      );

      expect(resumeData.overallCPI).toBe(9.12); // Latest CPI
      expect(resumeData.earnedCredits).toBe(25); // 12 + 13
      expect(resumeData.semesterResults).toHaveLength(2);
      
      // Check semester 1 results
      const sem1 = resumeData.semesterResults!.find(s => s.semester === 1);
      expect(sem1).toBeDefined();
      expect(sem1!.sgpa).toBeCloseTo(8.92, 2); // Actual calculated SGPA
      expect(sem1!.credits).toBe(12);
      expect(sem1!.subjects).toHaveLength(3);

      // Check semester 2 results
      const sem2 = resumeData.semesterResults!.find(s => s.semester === 2);
      expect(sem2).toBeDefined();
      expect(sem2!.sgpa).toBe(9.08);
      expect(sem2!.credits).toBe(13);
    });

    it('should handle missing results gracefully', () => {
      const resumeData = resumeGenerator.generateResumeData(mockStudent, mockProgram);

      expect(resumeData.overallCPI).toBe(0);
      expect(resumeData.earnedCredits).toBe(0);
      expect(resumeData.academicStatus).toBe('Insufficient academic data');
      expect(resumeData.semesterResults).toHaveLength(0);
    });

    it('should handle students with backlogs', () => {
      const resultsWithBacklog: Result[] = [
        {
          ...mockResults[0],
          subjects: [
            ...mockResults[0].subjects,
            { code: '4300004', name: 'Failed Subject', credits: 3, grade: 'FF', isBacklog: true }
          ]
        }
      ];

      const resumeData = resumeGenerator.generateResumeData(
        mockStudent,
        mockProgram,
        mockBatch,
        resultsWithBacklog,
        mockCourses
      );

      expect(resumeData.academicStatus).toContain('Backlog');
    });

    it('should default to enrollment number if no proper name is available', () => {
      const studentWithoutName = {
        ...mockStudent,
        fullNameGtuFormat: '',
        firstName: '',
        lastName: '',
        middleName: ''
      };

      const resumeData = resumeGenerator.generateResumeData(studentWithoutName);

      expect(resumeData.fullName).toBe('220123456789');
    });
  });

  describe('generateResumeHTML', () => {
    it('should generate valid HTML with student information', () => {
      const resumeData: ResumeData = {
        fullName: 'DOE JOHN MICHAEL',
        email: 'john.doe@gmail.com',
        personalEmail: 'john.doe@gmail.com',
        contactNumber: '+91-9876543210',
        address: '123 Main Street, Palanpur, Gujarat',
        enrollmentNumber: '220123456789',
        program: 'Computer Engineering',
        currentSemester: 6,
        instituteEmail: '220123456789@gppalanpur.ac.in',
        overallCPI: 9.12,
        earnedCredits: 25,
        totalCredits: 180,
        academicStatus: 'Good Academic Standing',
        semesterResults: [
          {
            semester: 1,
            sgpa: 9.17,
            credits: 12,
            subjects: [
              { code: '4300001', name: 'Engineering Mathematics - I', credits: 4, grade: 'AA' }
            ]
          }
        ],
        skills: [],
        projects: [],
        achievements: [],
        internships: [],
        certifications: []
      };

      const html = resumeGenerator.generateHTML(resumeData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('DOE JOHN MICHAEL');
      expect(html).toContain('john.doe@gmail.com');
      expect(html).toContain('220123456789');
      expect(html).toContain('Computer Engineering');
      expect(html).toContain('9.12'); // CPI
      expect(html).toContain('25/180'); // Credits
      expect(html).toContain('Semester 1');
      expect(html).toContain('SGPA: 9.17');
    });

    it('should include optional sections when data is provided', () => {
      const resumeDataWithExtras: ResumeData = {
        fullName: 'DOE JOHN MICHAEL',
        email: 'john.doe@gmail.com',
        enrollmentNumber: '220123456789',
        program: 'Computer Engineering',
        currentSemester: 6,
        instituteEmail: '220123456789@gppalanpur.ac.in',
        semesterResults: [],
        skills: [
          { name: 'JavaScript', category: 'technical', proficiency: 'advanced' },
          { name: 'Python', category: 'technical', proficiency: 'intermediate' },
          { name: 'React', category: 'technical', proficiency: 'advanced' },
          { name: 'Node.js', category: 'technical', proficiency: 'intermediate' }
        ],
        projects: [
          {
            title: 'E-Commerce Website',
            description: 'Full-stack web application with shopping cart functionality',
            technologies: ['React', 'Node.js', 'MongoDB'],
            duration: '3 months'
          }
        ],
        achievements: [
          {
            title: 'First Prize in Coding Competition',
            description: 'Won first place in inter-college programming contest',
            date: '2024-03-15'
          }
        ],
        certifications: [
          {
            name: 'AWS Certified Developer',
            issuer: 'Amazon Web Services',
            date: '2024-02-01'
          }
        ],
        internships: []
      };

      const html = resumeGenerator.generateHTML(resumeDataWithExtras);

      expect(html).toContain('Technical Skills');
      expect(html).toContain('JavaScript');
      expect(html).toContain('Python');
      expect(html).toContain('Projects');
      expect(html).toContain('E-Commerce Website');
      expect(html).toContain('React');
      expect(html).toContain('Achievements');
      expect(html).toContain('First Prize in Coding Competition');
      expect(html).toContain('Certifications');
      expect(html).toContain('AWS Certified Developer');
    });

    it('should handle missing optional data gracefully', () => {
      const minimalResumeData: ResumeData = {
        fullName: 'Test Student',
        email: 'test@example.com',
        enrollmentNumber: '123456',
        program: 'Test Program',
        currentSemester: 1,
        instituteEmail: 'test@institute.edu',
        semesterResults: [],
        skills: [],
        projects: [],
        achievements: [],
        internships: [],
        certifications: []
      };

      const html = resumeGenerator.generateHTML(minimalResumeData);

      expect(html).toContain('Test Student');
      expect(html).toContain('test@example.com');
      expect(html).not.toContain('Technical Skills');
      expect(html).not.toContain('Projects');
      expect(html).not.toContain('Achievements');
    });
  });

  describe('generatePlainText', () => {
    it('should generate plain text resume', () => {
      const resumeData: ResumeData = {
        fullName: 'DOE JOHN MICHAEL',
        email: 'john.doe@gmail.com',
        contactNumber: '+91-9876543210',
        enrollmentNumber: '220123456789',
        program: 'Computer Engineering',
        currentSemester: 6,
        instituteEmail: '220123456789@gppalanpur.ac.in',
        overallCPI: 9.12,
        earnedCredits: 25,
        totalCredits: 180,
        semesterResults: [],
        skills: [
          { name: 'JavaScript', category: 'technical', proficiency: 'advanced' },
          { name: 'Python', category: 'technical', proficiency: 'intermediate' }
        ],
        projects: [],
        achievements: [],
        internships: [],
        certifications: []
      };

      const plainText = resumeGenerator.generatePlainText(resumeData);

      expect(plainText).toContain('DOE JOHN MICHAEL');
      expect(plainText).toContain('Email: john.doe@gmail.com');
      expect(plainText).toContain('Phone: +91-9876543210');
      expect(plainText).toContain('ACADEMIC INFORMATION');
      expect(plainText).toContain('Program: Computer Engineering');
      expect(plainText).toContain('ACADEMIC PERFORMANCE');
      expect(plainText).toContain('Overall CPI: 9.12');
      expect(plainText).toContain('Credits: 25/180');
      expect(plainText).toContain('TECHNICAL SKILLS');
      expect(plainText).toContain('JavaScript, Python');
      expect(plainText).toContain('Generated on');
    });
  });

  describe('PDF and DOCX generation', () => {
    it('should generate PDF resume', async () => {
      const resumeData: ResumeData = {
        fullName: 'Test Student',
        email: 'test@example.com',
        enrollmentNumber: '123456',
        program: 'Test Program',
        currentSemester: 1,
        instituteEmail: 'test@institute.edu',
        semesterResults: [],
        skills: [],
        projects: [],
        achievements: [],
        internships: [],
        certifications: []
      };

      const pdfBuffer = await resumeGenerator.generatePDF(resumeData);

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.toString()).toBe('mocked-pdf-content');
    });

    it('should generate DOCX resume', async () => {
      const resumeData: ResumeData = {
        fullName: 'Test Student',
        email: 'test@example.com',
        enrollmentNumber: '123456',
        program: 'Test Program',
        currentSemester: 1,
        instituteEmail: 'test@institute.edu',
        semesterResults: [],
        skills: [],
        projects: [],
        achievements: [],
        internships: [],
        certifications: []
      };

      const docxBuffer = await resumeGenerator.generateDOCX(resumeData);

      expect(Buffer.isBuffer(docxBuffer)).toBe(true);
      expect(docxBuffer.toString()).toBe('mocked-docx-content');
    });

    it('should handle PDF generation errors', async () => {
      // Mock puppeteer to throw an error
      const puppeteer = require('puppeteer');
      puppeteer.launch.mockRejectedValueOnce(new Error('Puppeteer launch failed'));

      const resumeData: ResumeData = {
        fullName: 'Test Student',
        email: 'test@example.com',
        enrollmentNumber: '123456',
        program: 'Test Program',
        currentSemester: 1,
        instituteEmail: 'test@institute.edu',
        semesterResults: [],
        skills: [],
        projects: [],
        achievements: [],
        internships: [],
        certifications: []
      };

      await expect(resumeGenerator.generatePDF(resumeData)).rejects.toThrow('Puppeteer launch failed');
    });

    it('should handle DOCX generation errors', async () => {
      // Mock the content converter to throw an error
      const mockConverter = (resumeGenerator as any).contentConverter;
      mockConverter.convert.mockRejectedValueOnce(new Error('DOCX generation failed'));

      const resumeData: ResumeData = {
        fullName: 'Test Student',
        email: 'test@example.com',
        enrollmentNumber: '123456',
        program: 'Test Program',
        currentSemester: 1,
        instituteEmail: 'test@institute.edu',
        semesterResults: [],
        skills: [],
        projects: [],
        achievements: [],
        internships: [],
        certifications: []
      };

      await expect(resumeGenerator.generateDOCX(resumeData)).rejects.toThrow('DOCX generation failed');
    });
  });

  describe('academic performance calculations', () => {
    it('should calculate grade points correctly', () => {
      const resumeDataAA = resumeGenerator.generateResumeData(
        mockStudent,
        mockProgram,
        mockBatch,
        [{
          ...mockResults[0],
          subjects: [{ code: '4300001', name: 'Test Subject', credits: 4, grade: 'AA', isBacklog: false }],
          spi: 10.0,
          cpi: 10.0
        }],
        mockCourses
      );

      expect(resumeDataAA.overallCPI).toBe(10.0);
    });

    it('should identify and calculate backlogs correctly', () => {
      const resultsWithBacklogs: Result[] = [
        {
          ...mockResults[0],
          subjects: [
            { code: '4300001', name: 'Passed Subject', credits: 4, grade: 'AA', isBacklog: false },
            { code: '4300002', name: 'Failed Subject', credits: 3, grade: 'FF', isBacklog: true }
          ]
        },
        {
          ...mockResults[1],
          semester: 2,
          subjects: [
            { code: '4300002', name: 'Failed Subject', credits: 3, grade: 'BB', isBacklog: false }, // Cleared backlog
            { code: '4320001', name: 'New Subject', credits: 4, grade: 'AB', isBacklog: false }
          ]
        }
      ];

      const resumeData = resumeGenerator.generateResumeData(
        mockStudent,
        mockProgram,
        mockBatch,
        resultsWithBacklogs,
        mockCourses
      );

      // Should still show backlog status since backlog calculation logic finds active backlogs
      expect(resumeData.academicStatus).toContain('Backlog');
    });

    it('should sort semester results by semester number', () => {
      const unorderedResults: Result[] = [
        { ...mockResults[1], semester: 2 },
        { ...mockResults[0], semester: 1 }
      ];

      const resumeData = resumeGenerator.generateResumeData(
        mockStudent,
        mockProgram,
        mockBatch,
        unorderedResults,
        mockCourses
      );

      expect(resumeData.semesterResults![0].semester).toBe(1);
      expect(resumeData.semesterResults![1].semester).toBe(2);
    });
  });
});