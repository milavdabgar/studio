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
  });
});