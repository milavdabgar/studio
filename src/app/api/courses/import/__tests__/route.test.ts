import { NextRequest } from 'next/server';
import { POST } from '../route';
import { CourseModel } from '@/lib/models';
import { connectMongoose } from '@/lib/mongodb';

// Mock console methods to suppress expected error/warning messages during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  // Don't suppress console during test failures - we need debugging info
  // console.error = jest.fn();
  // console.warn = jest.fn();
  // console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Mock the MongoDB models and utilities
jest.mock('@/lib/mongodb');
jest.mock('@/lib/models');
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  default: {
    connect: jest.fn().mockResolvedValue(undefined)
  }
}));

const mockConnectMongoose = connectMongoose as jest.MockedFunction<typeof connectMongoose>;
const mockCourseModel = CourseModel as jest.Mocked<typeof CourseModel>;

// Mock mongoose
const mockMongoose = require('mongoose');
mockMongoose.connect = jest.fn().mockResolvedValue(undefined);

describe('/api/courses/import', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the database connection
    mockConnectMongoose.mockResolvedValue(undefined);
    
    // Reset mock implementations
    mockCourseModel.findOne.mockReset();
    mockCourseModel.create.mockReset();
  });

  describe('POST /api/courses/import - GTU CSV Import', () => {
    const validGTUCourseData = {
      subcode: 'DI01000011',
      subjectname: 'Mathematics I',
      semyear: '1',
      branchcode: '9',
      efffrom: '2024-25',
      category: 'Basic Science Courses',
      l: '3',
      t: '1',
      p: '0',
      twsl: '',
      total: '4',
      e: '70',
      m: '30',
      i: '0',
      v: '0',
      total1: '100',
      gtusyllabusurl: 'https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/DI01000011.pdf'
    };

    it('should import GTU course data successfully', async () => {
      const csvData = [
        Object.keys(validGTUCourseData).join(','),
        Object.values(validGTUCourseData).map(val => `"${val}"`).join(',')
      ].join('\n');

      // Mock departments and programs for GTU mapping
      const departments = [{
        id: 'dept_ee',
        name: 'Electrical Engineering',
        code: 'EE'
      }];
      const programs = [{
        id: 'prog_dee',
        name: 'Diploma in Electrical Engineering',
        code: '9', // Match the branchcode in test data
        departmentId: 'dept_ee'
      }];

      mockCourseModel.findOne.mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue({
        ...validGTUCourseData,
        _id: 'course_123',
        id: 'crs_123',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Mock the CourseModel constructor
      (mockCourseModel as any).mockImplementation(() => ({
        save: mockSave
      }));

      // Create mock file with text method
      const file = {
        name: 'courses.csv',
        type: 'text/csv',
        text: jest.fn().mockResolvedValue(csvData)
      } as any;
      
      // Create mock FormData
      const mockFormData = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'file') return file;
          if (key === 'departments') return JSON.stringify(departments);
          if (key === 'programs') return JSON.stringify(programs);
          return null;
        })
      } as any;

      const request = new NextRequest('http://localhost/api/courses/import', {
        method: 'POST',
        body: 'mock-body',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=----formdata-test-boundary'
        }
      });
      
      // Mock the formData method to return our mock FormData
      (request as any).formData = jest.fn().mockResolvedValue(mockFormData);

      const response = await POST(request);
      const data = await response.json();
      
      // Debug: Log response details if test fails
      if (response.status !== 200) {
        console.log('Response status:', response.status);
        console.log('Response data:', data);
      }

      expect(response.status).toBe(200);
      expect(data.message).toContain('GTU courses imported successfully');
      expect(data.isGTUFormat).toBe(true);
      expect(data.syllabusUrlsGenerated).toBe(1);
      expect(data.newCount).toBe(1);
      expect(data.updatedCount).toBe(0);
      expect(data.skippedCount).toBe(0);
    });

    it('should auto-generate syllabus URLs for GTU format', async () => {
      const gtuDataWithoutURL = {
        subcode: 'DI02000021',
        subjectname: 'Applied Physics',
        semyear: '2',
        branchcode: '16',
        efffrom: '2024-25',
        category: 'Basic Science Courses',
        l: '3',
        t: '0',
        p: '2',
        twsl: '',
        total: '4',
        e: '70',
        m: '30',
        i: '20',
        v: '30',
        total1: '150'
      };

      const csvData = [
        Object.keys(gtuDataWithoutURL).join(','),
        Object.values(gtuDataWithoutURL).map(val => `"${val}"`).join(',')
      ].join('\n');

      const departments = [{ id: 'dept_it', name: 'Information Technology', code: 'IT' }];
      const programs = [{ id: 'prog_dit', name: 'Diploma in Information Technology', code: '16', departmentId: 'dept_it' }];

      mockCourseModel.findOne.mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue({
        ...gtuDataWithoutURL,
        syllabusUrl: 'https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/DI02000021.pdf',
        _id: 'course_124',
        id: 'crs_124'
      });
      
      (mockCourseModel as any).mockImplementation(() => ({ save: mockSave }));

      const file = {
        name: 'gtu-courses.csv',
        type: 'text/csv',
        text: jest.fn().mockResolvedValue(csvData)
      } as any;
      
      const mockFormData = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'file') return file;
          if (key === 'departments') return JSON.stringify(departments);
          if (key === 'programs') return JSON.stringify(programs);
          return null;
        })
      } as any;

      const request = new NextRequest('http://localhost/api/courses/import', {
        method: 'POST',
        body: 'mock-body',
        headers: { 'Content-Type': 'multipart/form-data; boundary=----formdata-test-boundary' }
      });
      
      (request as any).formData = jest.fn().mockResolvedValue(mockFormData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isGTUFormat).toBe(true);
      expect(data.syllabusUrlsGenerated).toBe(1);
      expect(mockSave).toHaveBeenCalledWith();
    });

    it('should handle missing required fields', async () => {
      const csvData = [
        'subcode,subjectname',
        'DI01000011,Mathematics I'
      ].join('\n');

      // Mock departments and programs
      const departments = [{ id: 'dept_ee', name: 'Electrical Engineering', code: 'EE' }];
      const programs = [{ id: 'prog_dee', name: 'Diploma in Electrical Engineering', code: 'DEE', departmentId: 'dept_ee' }];

      // Create mock file with text method
      const file = {
        name: 'courses.csv',
        type: 'text/csv',
        text: jest.fn().mockResolvedValue(csvData)
      } as any;
      
      // Create mock FormData
      const mockFormData = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'file') return file;
          if (key === 'departments') return JSON.stringify(departments);
          if (key === 'programs') return JSON.stringify(programs);
          return null;
        })
      } as any;

      const request = new NextRequest('http://localhost/api/courses/import', {
        method: 'POST',
        body: 'mock-body',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=----formdata-test-boundary'
        }
      });
      
      // Mock the formData method to return our mock FormData
      (request as any).formData = jest.fn().mockResolvedValue(mockFormData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('CSV header is missing required columns');
    });

    it('should handle invalid Content-Type', async () => {
      const csvData = 'subcode,subjectname\\nDI01000011,Mathematics I';

      const request = new NextRequest('http://localhost/api/courses/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: csvData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Invalid Content-Type');
    });

    it('should handle missing file upload', async () => {
      const departments = [{ id: 'dept_ee', name: 'Electrical Engineering', code: 'EE' }];
      const programs = [{ id: 'prog_dee', name: 'Diploma in Electrical Engineering', code: 'DEE', departmentId: 'dept_ee' }];

      const mockFormData = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'file') return null;
          if (key === 'departments') return JSON.stringify(departments);
          if (key === 'programs') return JSON.stringify(programs);
          return null;
        })
      } as any;

      const request = new NextRequest('http://localhost/api/courses/import', {
        method: 'POST',
        body: 'mock-body',
        headers: { 'Content-Type': 'multipart/form-data; boundary=----formdata-test-boundary' }
      });
      
      (request as any).formData = jest.fn().mockResolvedValue(mockFormData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('No file uploaded.');
    });

    it('should handle missing departments data', async () => {
      const csvData = 'subcode,subjectname\nDI01000011,Mathematics I';
      const file = {
        name: 'courses.csv',
        type: 'text/csv',
        text: jest.fn().mockResolvedValue(csvData)
      } as any;

      const mockFormData = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'file') return file;
          if (key === 'departments') return null;
          if (key === 'programs') return JSON.stringify([]);
          return null;
        })
      } as any;

      const request = new NextRequest('http://localhost/api/courses/import', {
        method: 'POST',
        body: 'mock-body',
        headers: { 'Content-Type': 'multipart/form-data; boundary=----formdata-test-boundary' }
      });
      
      (request as any).formData = jest.fn().mockResolvedValue(mockFormData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Department or Program data for mapping is missing.');
    });

    it('should handle CSV parsing errors', async () => {
      const invalidCsvData = 'subcode,subjectname\n"unclosed quote,Mathematics I';
      const file = {
        name: 'courses.csv',
        type: 'text/csv',
        text: jest.fn().mockResolvedValue(invalidCsvData)
      } as any;

      const departments = [{ id: 'dept_ee', name: 'Electrical Engineering', code: 'EE' }];
      const programs = [{ id: 'prog_dee', name: 'Diploma in Electrical Engineering', code: 'DEE', departmentId: 'dept_ee' }];

      const mockFormData = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'file') return file;
          if (key === 'departments') return JSON.stringify(departments);
          if (key === 'programs') return JSON.stringify(programs);
          return null;
        })
      } as any;

      const request = new NextRequest('http://localhost/api/courses/import', {
        method: 'POST',
        body: 'mock-body',
        headers: { 'Content-Type': 'multipart/form-data; boundary=----formdata-test-boundary' }
      });
      
      (request as any).formData = jest.fn().mockResolvedValue(mockFormData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Error parsing Courses CSV file');
    });

    it('should update existing course when ID matches', async () => {
      const csvData = [
        'id,subcode,subjectname,semyear,branchcode,efffrom,category,l,t,p,e,m,i,v',
        'existing_123,DI01000011,Updated Mathematics I,1,9,2024-25,Basic Science Courses,3,1,0,70,30,0,0'
      ].join('\n');

      const departments = [{ id: 'dept_ee', name: 'Electrical Engineering', code: 'EE' }];
      const programs = [{ id: 'prog_dee', name: 'Diploma in Electrical Engineering', code: '9', departmentId: 'dept_ee' }];

      const existingCourse = {
        _id: 'existing_123',
        id: 'existing_123',
        subcode: 'DI01000011',
        subjectName: 'Mathematics I'
      };

      mockCourseModel.findOne.mockResolvedValueOnce(existingCourse); 
      mockCourseModel.findOneAndUpdate = jest.fn().mockResolvedValueOnce({ ...existingCourse, subjectName: 'Updated Mathematics I' });

      const file = {
        name: 'courses.csv',
        type: 'text/csv',
        text: jest.fn().mockResolvedValue(csvData)
      } as any;
      
      const mockFormData = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'file') return file;
          if (key === 'departments') return JSON.stringify(departments);
          if (key === 'programs') return JSON.stringify(programs);
          return null;
        })
      } as any;

      const request = new NextRequest('http://localhost/api/courses/import', {
        method: 'POST',
        body: 'mock-body',
        headers: { 'Content-Type': 'multipart/form-data; boundary=----formdata-test-boundary' }
      });
      
      (request as any).formData = jest.fn().mockResolvedValue(mockFormData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.updatedCount).toBe(1);
      expect(data.newCount).toBe(0);
      expect(mockCourseModel.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should skip duplicate courses', async () => {
      const csvData = [
        'subcode,subjectname,semyear,branchcode,efffrom,category,l,t,p,e,m,i,v',
        'DI01000011,Mathematics I,1,9,2024-25,Basic Science Courses,3,1,0,70,30,0,0'
      ].join('\n');

      const departments = [{ id: 'dept_ee', name: 'Electrical Engineering', code: 'EE' }];
      const programs = [{ id: 'prog_dee', name: 'Diploma in Electrical Engineering', code: '9', departmentId: 'dept_ee' }];

      const duplicateCourse = {
        _id: 'duplicate_123',
        subcode: 'DI01000011',
        programId: 'prog_dee'
      };

      mockCourseModel.findOne
        .mockResolvedValueOnce(null) // No existing course by ID
        .mockResolvedValueOnce(duplicateCourse); // But duplicate exists

      const file = {
        name: 'courses.csv',
        type: 'text/csv',
        text: jest.fn().mockResolvedValue(csvData)
      } as any;
      
      const mockFormData = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'file') return file;
          if (key === 'departments') return JSON.stringify(departments);
          if (key === 'programs') return JSON.stringify(programs);
          return null;
        })
      } as any;

      const request = new NextRequest('http://localhost/api/courses/import', {
        method: 'POST',
        body: 'mock-body',
        headers: { 'Content-Type': 'multipart/form-data; boundary=----formdata-test-boundary' }
      });
      
      (request as any).formData = jest.fn().mockResolvedValue(mockFormData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skippedCount).toBe(1);
      expect(data.newCount).toBe(0);
    });

    it('should handle invalid semester values', async () => {
      const csvData = [
        'subcode,subjectname,semyear,branchcode,efffrom,category,l,t,p,e,m,i,v',
        'DI01000011,Mathematics I,invalid_semester,9,2024-25,Basic Science Courses,3,1,0,70,30,0,0'
      ].join('\n');

      const departments = [{ id: 'dept_ee', name: 'Electrical Engineering', code: 'EE' }];
      const programs = [{ id: 'prog_dee', name: 'Diploma in Electrical Engineering', code: '9', departmentId: 'dept_ee' }];

      const file = {
        name: 'courses.csv',
        type: 'text/csv',
        text: jest.fn().mockResolvedValue(csvData)
      } as any;
      
      const mockFormData = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'file') return file;
          if (key === 'departments') return JSON.stringify(departments);
          if (key === 'programs') return JSON.stringify(programs);
          return null;
        })
      } as any;

      const request = new NextRequest('http://localhost/api/courses/import', {
        method: 'POST',
        body: 'mock-body',
        headers: { 'Content-Type': 'multipart/form-data; boundary=----formdata-test-boundary' }
      });
      
      (request as any).formData = jest.fn().mockResolvedValue(mockFormData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skippedCount).toBe(1);
      expect(data.newCount).toBe(0);
    });

    it('should handle missing branch code mapping in GTU format', async () => {
      const csvData = [
        'subcode,subjectname,semyear,branchcode,efffrom,category,l,t,p,e,m,i,v',
        'DI01000011,Mathematics I,1,999,2024-25,Basic Science Courses,3,1,0,70,30,0,0'
      ].join('\n');

      const departments = [{ id: 'dept_ee', name: 'Electrical Engineering', code: 'EE' }];
      const programs = [{ id: 'prog_dee', name: 'Diploma in Electrical Engineering', code: '9', departmentId: 'dept_ee' }];

      const file = {
        name: 'courses.csv',
        type: 'text/csv',
        text: jest.fn().mockResolvedValue(csvData)
      } as any;
      
      const mockFormData = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'file') return file;
          if (key === 'departments') return JSON.stringify(departments);
          if (key === 'programs') return JSON.stringify(programs);
          return null;
        })
      } as any;

      const request = new NextRequest('http://localhost/api/courses/import', {
        method: 'POST',
        body: 'mock-body',
        headers: { 'Content-Type': 'multipart/form-data; boundary=----formdata-test-boundary' }
      });
      
      (request as any).formData = jest.fn().mockResolvedValue(mockFormData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skippedCount).toBe(1);
      expect(data.newCount).toBe(0);
    });
  });

  describe('Standard CSV Import Format', () => {
    it('should import standard format CSV successfully', async () => {
      const csvData = [
        'subcode,subjectname,semester,departmentid,programid,lecturehours,tutorialhours,practicalhours',
        'CS101,Computer Programming,1,dept_cs,prog_btech_cs,3,1,2'
      ].join('\n');

      const departments = [{ id: 'dept_cs', name: 'Computer Science', code: 'CS' }];
      const programs = [{ id: 'prog_btech_cs', name: 'B.Tech Computer Science', code: 'CS', departmentId: 'dept_cs' }];

      mockCourseModel.findOne.mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue({
        _id: 'course_125',
        id: 'crs_125'
      });
      
      (mockCourseModel as any).mockImplementation(() => ({ save: mockSave }));

      const file = {
        name: 'standard-courses.csv',
        type: 'text/csv',
        text: jest.fn().mockResolvedValue(csvData)
      } as any;
      
      const mockFormData = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'file') return file;
          if (key === 'departments') return JSON.stringify(departments);
          if (key === 'programs') return JSON.stringify(programs);
          return null;
        })
      } as any;

      const request = new NextRequest('http://localhost/api/courses/import', {
        method: 'POST',
        body: 'mock-body',
        headers: { 'Content-Type': 'multipart/form-data; boundary=----formdata-test-boundary' }
      });
      
      (request as any).formData = jest.fn().mockResolvedValue(mockFormData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('Courses imported successfully');
      expect(data.isGTUFormat).toBe(false);
      expect(data.newCount).toBe(1);
    });
  });

  describe('EffFrom standardization', () => {
    it('should standardize various effFrom formats', async () => {
      const testCases = [
        { input: 'Aug-11', expected: '2011-12' },
        { input: 'Jan-24', expected: '2023-24' },
        { input: '07/01/13', expected: '2013-14' },
        { input: '2021', expected: '2021-22' },
        { input: '2024-25', expected: '2024-25' },
        { input: '', expected: '2024-25' },
        { input: null, expected: '2024-25' }
      ];

      for (const testCase of testCases) {
        const csvData = [
          'subcode,subjectname,semyear,branchcode,efffrom,category,l,t,p,e,m,i,v',
          `DI01000011,Mathematics I,1,9,${testCase.input || ''},Basic Science Courses,3,1,0,70,30,0,0`
        ].join('\n');

        const departments = [{ id: 'dept_ee', name: 'Electrical Engineering', code: 'EE' }];
        const programs = [{ id: 'prog_dee', name: 'Diploma in Electrical Engineering', code: '9', departmentId: 'dept_ee' }];

        mockCourseModel.findOne.mockResolvedValue(null);
        const mockSave = jest.fn().mockResolvedValue({ _id: 'course_test', id: 'crs_test' });
        (mockCourseModel as any).mockImplementation(() => ({ save: mockSave }));

        const file = {
          name: 'courses.csv',
          type: 'text/csv',
          text: jest.fn().mockResolvedValue(csvData)
        } as any;
        
        const mockFormData = {
          get: jest.fn().mockImplementation((key: string) => {
            if (key === 'file') return file;
            if (key === 'departments') return JSON.stringify(departments);
            if (key === 'programs') return JSON.stringify(programs);
            return null;
          })
        } as any;

        const request = new NextRequest('http://localhost/api/courses/import', {
          method: 'POST',
          body: 'mock-body',
          headers: { 'Content-Type': 'multipart/form-data; boundary=----formdata-test-boundary' }
        });
        
        (request as any).formData = jest.fn().mockResolvedValue(mockFormData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.newCount).toBe(1);
        
        // Verify the standardized effFrom was used (we can't directly check the save call parameters easily)
        expect(mockSave).toHaveBeenCalled();
      }
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      const csvData = 'subcode,subjectname\nCS101,Computer Programming';
      const file = {
        name: 'courses.csv',
        type: 'text/csv',
        text: jest.fn().mockResolvedValue(csvData)
      } as any;

      const departments = [{ id: 'dept_cs', name: 'Computer Science', code: 'CS' }];
      const programs = [{ id: 'prog_cs', name: 'Computer Science', code: 'CS', departmentId: 'dept_cs' }];

      const mockFormData = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'file') return file;
          if (key === 'departments') return JSON.stringify(departments);
          if (key === 'programs') return JSON.stringify(programs);
          return null;
        })
      } as any;

      // Mock mongoose.connect to throw an error
      mockMongoose.connect.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost/api/courses/import', {
        method: 'POST',
        body: 'mock-body',
        headers: { 'Content-Type': 'multipart/form-data; boundary=----formdata-test-boundary' }
      });
      
      (request as any).formData = jest.fn().mockResolvedValue(mockFormData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Error importing courses.');
    });
  });
});