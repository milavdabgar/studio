import { FacultyResumeGenerator, type FacultyResumeData } from '../services/facultyResumeGenerator';
import type { FacultyProfile, Qualification } from '@/types/entities';

// Mock the ContentConverterV2
jest.mock('../content-converter-v2', () => {
  return {
    ContentConverterV2: jest.fn().mockImplementation(() => ({
      convert: jest.fn().mockImplementation((content: string, format: string) => {
        if (format === 'pdf') {
          return Promise.resolve(Buffer.from('mocked-pdf-content'));
        } else if (format === 'docx') {
          return Promise.resolve(Buffer.from('mocked-docx-content'));
        } else {
          return Promise.resolve(content);
        }
      })
    }))
  };
});

describe('FacultyResumeGenerator', () => {
  let resumeGenerator: FacultyResumeGenerator;

  // Mock data
  const mockFaculty: FacultyProfile = {
    id: 'faculty-123',
    userId: 'user-123',
    staffCode: 'FAC001',
    employeeId: 'EMP001',
    gtuFacultyId: 'GTU123',
    title: 'Dr.',
    firstName: 'John',
    middleName: 'Michael',
    lastName: 'Doe',
    fullName: 'John Michael Doe',
    displayName: 'Dr. John Doe',
    gtuName: 'DOE JOHN MICHAEL',
    email: 'john.doe@gppalanpur.ac.in',
    personalEmail: 'john.doe@gmail.com',
    instituteEmail: 'john.doe@gppalanpur.ac.in',
    contactNumber: '+91-9876543210',
    address: '123 Faculty Colony, Palanpur, Gujarat',
    department: 'Computer Engineering',
    departmentId: 'dept-ce',
    designation: 'Assistant Professor',
    jobType: 'Regular' as const,
    staffCategory: 'Academic',
    category: 'Academic',
    instType: 'Government',
    specializations: ['Machine Learning', 'Data Science', 'Web Development'],
    specialization: 'Machine Learning',
    qualifications: [
      {
        degree: 'Ph.D.',
        field: 'Computer Science',
        institution: 'IIT Bombay',
        year: 2020,
        grade: 'First Class'
      },
      {
        degree: 'M.Tech',
        field: 'Computer Engineering',
        institution: 'NIT Surat',
        year: 2015,
        grade: 'First Class with Distinction'
      }
    ],
    dateOfBirth: '1990-05-15T00:00:00.000Z',
    gender: 'Male',
    maritalStatus: 'Married',
    joiningDate: '2021-07-01T00:00:00.000Z',
    aadharNumber: '123456789012',
    panCardNumber: 'ABCDE1234F',
    gpfNpsNumber: 'GPF123456',
    status: 'active' as const,
    createdAt: '2021-07-01T00:00:00.000Z',
    updatedAt: '2024-07-01T00:00:00.000Z'
  };

  beforeEach(() => {
    resumeGenerator = new FacultyResumeGenerator();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateResumeData', () => {
    it('should generate basic faculty resume data', () => {
      const resumeData = resumeGenerator.generateResumeData(mockFaculty);

      expect(resumeData.fullName).toBe('Dr. John Michael Doe');
      expect(resumeData.title).toBe('Dr.');
      expect(resumeData.email).toBe('john.doe@gppalanpur.ac.in');
      expect(resumeData.personalEmail).toBe('john.doe@gmail.com');
      expect(resumeData.contactNumber).toBe('+91-9876543210');
      expect(resumeData.address).toBe('123 Faculty Colony, Palanpur, Gujarat');
      expect(resumeData.staffCode).toBe('FAC001');
      expect(resumeData.employeeId).toBe('EMP001');
      expect(resumeData.department).toBe('Computer Engineering');
      expect(resumeData.designation).toBe('Assistant Professor');
      expect(resumeData.jobType).toBe('Regular');
      expect(resumeData.staffCategory).toBe('Academic');
      expect(resumeData.instituteEmail).toBe('john.doe@gppalanpur.ac.in');
    });

    it('should include specializations from array', () => {
      const resumeData = resumeGenerator.generateResumeData(mockFaculty);

      expect(resumeData.specializations).toEqual(['Machine Learning', 'Data Science', 'Web Development']);
    });

    it('should include qualifications', () => {
      const resumeData = resumeGenerator.generateResumeData(mockFaculty);

      expect(resumeData.qualifications).toHaveLength(2);
      expect(resumeData.qualifications?.[0].degree).toBe('Ph.D.');
      expect(resumeData.qualifications?.[0].institution).toBe('IIT Bombay');
      expect(resumeData.qualifications?.[1].degree).toBe('M.Tech');
      expect(resumeData.qualifications?.[1].institution).toBe('NIT Surat');
    });

    it('should handle faculty without full name', () => {
      const facultyWithoutFullName = {
        ...mockFaculty,
        fullName: undefined,
        firstName: 'Jane',
        lastName: 'Smith',
        middleName: undefined
      };

      const resumeData = resumeGenerator.generateResumeData(facultyWithoutFullName);

      expect(resumeData.fullName).toBe('Dr. DOE JOHN MICHAEL'); // Uses gtuName when fullName is missing
    });

    it('should handle faculty with GTU name fallback', () => {
      const facultyWithGtuName = {
        ...mockFaculty,
        fullName: undefined,
        firstName: undefined,
        lastName: undefined,
        middleName: undefined,
        gtuName: 'SMITH JANE MARY'
      };

      const resumeData = resumeGenerator.generateResumeData(facultyWithGtuName);

      expect(resumeData.fullName).toBe('Dr. SMITH JANE MARY');
    });

    it('should use staff code as fallback name', () => {
      const facultyWithStaffCode = {
        ...mockFaculty,
        fullName: undefined,
        firstName: undefined,
        lastName: undefined,
        middleName: undefined,
        gtuName: undefined,
        title: undefined
      };

      const resumeData = resumeGenerator.generateResumeData(facultyWithStaffCode);

      expect(resumeData.fullName).toBe('FAC001');
    });

    it('should handle single specialization field', () => {
      const facultyWithSingleSpec = {
        ...mockFaculty,
        specializations: undefined,
        specialization: 'Artificial Intelligence'
      };

      const resumeData = resumeGenerator.generateResumeData(facultyWithSingleSpec);

      expect(resumeData.specializations).toEqual(['Artificial Intelligence']);
    });

    it('should handle faculty without specializations', () => {
      const facultyWithoutSpec = {
        ...mockFaculty,
        specializations: undefined,
        specialization: undefined
      };

      const resumeData = resumeGenerator.generateResumeData(facultyWithoutSpec);

      expect(resumeData.specializations).toEqual([]);
    });

    it('should use staffCategory over category', () => {
      const facultyWithCategories = {
        ...mockFaculty,
        staffCategory: 'Senior Academic',
        category: 'Academic'
      };

      const resumeData = resumeGenerator.generateResumeData(facultyWithCategories);

      expect(resumeData.staffCategory).toBe('Senior Academic');
    });

    it('should fallback to category if staffCategory not available', () => {
      const facultyWithCategory = {
        ...mockFaculty,
        staffCategory: undefined,
        category: 'Administrative'
      };

      const resumeData = resumeGenerator.generateResumeData(facultyWithCategory);

      expect(resumeData.staffCategory).toBe('Administrative');
    });

    it('should initialize empty arrays for additional fields', () => {
      const resumeData = resumeGenerator.generateResumeData(mockFaculty);

      expect(resumeData.experience).toEqual([]);
      expect(resumeData.publications).toEqual([]);
      expect(resumeData.research).toEqual([]);
      expect(resumeData.achievements).toEqual([]);
      expect(resumeData.courses).toEqual([]);
      expect(resumeData.certifications).toEqual([]);
    });

    it('should prefer email over personalEmail over instituteEmail', () => {
      const facultyWithMultipleEmails = {
        ...mockFaculty,
        email: 'primary@example.com',
        personalEmail: 'personal@example.com',
        instituteEmail: 'institute@example.com'
      };

      const resumeData = resumeGenerator.generateResumeData(facultyWithMultipleEmails);

      expect(resumeData.email).toBe('primary@example.com');
    });

    it('should use personalEmail if email not available', () => {
      const facultyWithPersonalEmail = {
        ...mockFaculty,
        email: undefined,
        personalEmail: 'personal@example.com',
        instituteEmail: 'institute@example.com'
      };

      const resumeData = resumeGenerator.generateResumeData(facultyWithPersonalEmail);

      expect(resumeData.email).toBe('personal@example.com');
    });

    it('should use instituteEmail as last fallback', () => {
      const facultyWithInstituteEmail = {
        ...mockFaculty,
        email: undefined,
        personalEmail: undefined,
        instituteEmail: 'institute@example.com'
      };

      const resumeData = resumeGenerator.generateResumeData(facultyWithInstituteEmail);

      expect(resumeData.email).toBe('institute@example.com');
    });
  });

  describe('generateResumeHTML', () => {
    it('should generate valid HTML with faculty information', () => {
      const resumeData: FacultyResumeData = {
        fullName: 'Dr. John Michael Doe',
        title: 'Dr.',
        email: 'john.doe@gppalanpur.ac.in',
        personalEmail: 'john.doe@gmail.com',
        contactNumber: '+91-9876543210',
        address: '123 Faculty Colony, Palanpur, Gujarat',
        staffCode: 'FAC001',
        employeeId: 'EMP001',
        department: 'Computer Engineering',
        designation: 'Assistant Professor',
        jobType: 'Regular' as const,
        staffCategory: 'Academic',
        instituteEmail: 'john.doe@gppalanpur.ac.in',
        specializations: ['Machine Learning', 'Data Science'],
        qualifications: [
          {
            degree: 'Ph.D.',
            field: 'Computer Science',
            institution: 'IIT Bombay',
                year: 2020,
            grade: 'First Class'
          }
        ],
        experience: [],
        publications: [],
        research: [],
        achievements: [],
        courses: [],
        certifications: []
      };

      const html = resumeGenerator.generateHTML(resumeData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Dr. John Michael Doe');
      expect(html).toContain('Assistant Professor');
      expect(html).toContain('john.doe@gppalanpur.ac.in');
      expect(html).toContain('FAC001');
      expect(html).toContain('Computer Engineering');
      expect(html).toContain('Machine Learning');
      expect(html).toContain('Data Science');
      expect(html).toContain('Ph.D.');
      expect(html).toContain('IIT Bombay');
    });

    it('should include optional sections when data is provided', () => {
      const resumeDataWithExtras: FacultyResumeData = {
        fullName: 'Dr. John Doe',
        email: 'john.doe@gppalanpur.ac.in',
        staffCode: 'FAC001',
        department: 'Computer Engineering',
        designation: 'Assistant Professor',
        instituteEmail: 'john.doe@gppalanpur.ac.in',
        specializations: [],
        qualifications: [],
        experience: [
          {
            position: 'Software Engineer',
            organization: 'Tech Corp',
            duration: '2018-2021',
            description: 'Developed web applications'
          }
        ],
        publications: [
          {
            title: 'Machine Learning in Education',
            journal: 'IEEE Transactions',
            year: '2023',
            type: 'journal',
            authors: ['John Doe', 'Jane Smith']
          }
        ],
        research: [
          {
            title: 'AI in Healthcare',
            description: 'Research on AI applications in medical diagnosis',
            status: 'ongoing',
            duration: '2022-2024'
          }
        ],
        achievements: [
          {
            title: 'Best Paper Award',
            description: 'Received for outstanding research paper',
            date: '2023-06-15',
            category: 'award'
          }
        ],
        courses: [],
        certifications: [
          {
            name: 'AWS Certified Developer',
            issuer: 'Amazon Web Services',
            date: '2023-01-15'
          }
        ]
      };

      const html = resumeGenerator.generateHTML(resumeDataWithExtras);

      expect(html).toContain('Professional Experience');
      expect(html).toContain('Software Engineer');
      expect(html).toContain('Tech Corp');
      expect(html).toContain('Publications');
      expect(html).toContain('Machine Learning in Education');
      expect(html).toContain('IEEE Transactions');
      expect(html).toContain('Research Projects');
      expect(html).toContain('AI in Healthcare');
      expect(html).toContain('Achievements & Awards');
      expect(html).toContain('Best Paper Award');
      expect(html).toContain('Certifications');
      expect(html).toContain('AWS Certified Developer');
    });

    it('should handle missing optional data gracefully', () => {
      const minimalResumeData: FacultyResumeData = {
        fullName: 'Test Faculty',
        email: 'test@example.com',
        staffCode: 'TEST001',
        department: 'Test Department',
        instituteEmail: 'test@institute.edu',
        specializations: [],
        qualifications: [],
        experience: [],
        publications: [],
        research: [],
        achievements: [],
        courses: [],
        certifications: []
      };

      const html = resumeGenerator.generateHTML(minimalResumeData);

      expect(html).toContain('Test Faculty');
      expect(html).toContain('test@example.com');
      expect(html).not.toContain('Professional Experience');
      expect(html).not.toContain('Publications');
      expect(html).not.toContain('Research Projects');
      expect(html).not.toContain('Achievements & Awards');
    });
  });

  describe('generatePlainText', () => {
    it('should generate plain text resume', () => {
      const resumeData: FacultyResumeData = {
        fullName: 'Dr. John Michael Doe',
        title: 'Dr.',
        email: 'john.doe@gppalanpur.ac.in',
        contactNumber: '+91-9876543210',
        staffCode: 'FAC001',
        department: 'Computer Engineering',
        designation: 'Assistant Professor',
        instituteEmail: 'john.doe@gppalanpur.ac.in',
        specializations: ['Machine Learning', 'Data Science'],
        qualifications: [
          {
            degree: 'Ph.D.',
            field: 'Computer Science',
            institution: 'IIT Bombay',
            year: 2020
          }
        ],
        experience: [],
        publications: [],
        research: [],
        achievements: [],
        courses: [],
        certifications: []
      };

      const plainText = resumeGenerator.generatePlainText(resumeData);

      expect(plainText).toContain('Dr. John Michael Doe');
      expect(plainText).toContain('Assistant Professor');
      expect(plainText).toContain('Email: john.doe@gppalanpur.ac.in');
      expect(plainText).toContain('Phone: +91-9876543210');
      expect(plainText).toContain('PROFESSIONAL INFORMATION');
      expect(plainText).toContain('Staff Code: FAC001');
      expect(plainText).toContain('SPECIALIZATIONS');
      expect(plainText).toContain('Machine Learning, Data Science');
      expect(plainText).toContain('EDUCATIONAL QUALIFICATIONS');
      expect(plainText).toContain('Ph.D.');
      expect(plainText).toContain('IIT Bombay');
      expect(plainText).toContain('Generated on');
    });
  });

  describe('PDF and DOCX generation', () => {
    it('should generate PDF resume', async () => {
      const resumeData: FacultyResumeData = {
        fullName: 'Test Faculty',
        email: 'test@example.com',
        staffCode: 'TEST001',
        department: 'Test Department',
        instituteEmail: 'test@institute.edu',
        specializations: [],
        qualifications: [],
        experience: [],
        publications: [],
        research: [],
        achievements: [],
        courses: [],
        certifications: []
      };

      const pdfBuffer = await resumeGenerator.generatePDF(resumeData);

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.toString()).toBe('mocked-pdf-content');
    });

    it('should generate DOCX resume', async () => {
      const resumeData: FacultyResumeData = {
        fullName: 'Test Faculty',
        email: 'test@example.com',
        staffCode: 'TEST001',
        department: 'Test Department',
        instituteEmail: 'test@institute.edu',
        specializations: [],
        qualifications: [],
        experience: [],
        publications: [],
        research: [],
        achievements: [],
        courses: [],
        certifications: []
      };

      const docxBuffer = await resumeGenerator.generateDOCX(resumeData);

      expect(Buffer.isBuffer(docxBuffer)).toBe(true);
      expect(docxBuffer.toString()).toBe('mocked-docx-content');
    });

    it('should handle PDF generation errors', async () => {
      // Mock the content converter to throw an error
      const mockConverter = (resumeGenerator as any).contentConverter;
      mockConverter.convert.mockRejectedValueOnce(new Error('PDF generation failed'));

      const resumeData: FacultyResumeData = {
        fullName: 'Test Faculty',
        email: 'test@example.com',
        staffCode: 'TEST001',
        department: 'Test Department',
        instituteEmail: 'test@institute.edu',
        specializations: [],
        qualifications: [],
        experience: [],
        publications: [],
        research: [],
        achievements: [],
        courses: [],
        certifications: []
      };

      await expect(resumeGenerator.generatePDF(resumeData)).rejects.toThrow('Failed to generate PDF resume');
    });

    it('should handle DOCX generation errors', async () => {
      // Mock the content converter to throw an error
      const mockConverter = (resumeGenerator as any).contentConverter;
      mockConverter.convert.mockRejectedValueOnce(new Error('DOCX generation failed'));

      const resumeData: FacultyResumeData = {
        fullName: 'Test Faculty',
        email: 'test@example.com',
        staffCode: 'TEST001',
        department: 'Test Department',
        instituteEmail: 'test@institute.edu',
        specializations: [],
        qualifications: [],
        experience: [],
        publications: [],
        research: [],
        achievements: [],
        courses: [],
        certifications: []
      };

      await expect(resumeGenerator.generateDOCX(resumeData)).rejects.toThrow('Failed to generate DOCX resume');
    });
  });

  describe('name formatting', () => {
    it('should format name with title when available', () => {
      const faculty = {
        ...mockFaculty,
        title: 'Prof.',
        fullName: 'Jane Smith'
      };

      const resumeData = resumeGenerator.generateResumeData(faculty);

      expect(resumeData.fullName).toBe('Prof. Jane Smith');
    });

    it('should format name without title when not available', () => {
      const faculty = {
        ...mockFaculty,
        title: undefined,
        fullName: 'Jane Smith'
      };

      const resumeData = resumeGenerator.generateResumeData(faculty);

      expect(resumeData.fullName).toBe('Jane Smith');
    });

    it('should construct name from parts when fullName not available', () => {
      const faculty = {
        ...mockFaculty,
        title: 'Dr.',
        fullName: undefined,
        gtuName: undefined, // Remove gtuName so it constructs from parts
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Doe'
      };

      const resumeData = resumeGenerator.generateResumeData(faculty);

      expect(resumeData.fullName).toBe('Dr. John Michael Doe');
    });

    it('should handle missing middle name', () => {
      const faculty = {
        ...mockFaculty,
        title: 'Dr.',
        fullName: undefined,
        gtuName: undefined, // Remove gtuName so it constructs from parts
        firstName: 'John',
        middleName: undefined,
        lastName: 'Doe'
      };

      const resumeData = resumeGenerator.generateResumeData(faculty);

      expect(resumeData.fullName).toBe('Dr. John Doe');
    });
  });
});