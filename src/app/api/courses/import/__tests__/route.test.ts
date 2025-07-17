import { NextRequest } from 'next/server';
import { POST } from '../route';
import { CourseModel } from '@/lib/models';
import { connectMongoose } from '@/lib/mongodb';

// Mock console methods to suppress expected error/warning messages during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Mock the MongoDB models and utilities
jest.mock('@/lib/mongodb');
jest.mock('@/lib/models');
jest.mock('mongoose');

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
      semester: '1',
      departmentcode: 'EE',
      departmentname: 'Electrical Engineering',
      programcode: 'DEE',
      programname: 'Diploma in Electrical Engineering',
      branchcode: '09',
      efffrom: '2024-25',
      category: 'First Year Core',
      lecturehours: '3',
      tutorialhours: '1',
      practicalhours: '2',
      credits: '4',
      theoryesemarks: '70',
      theorypamarks: '30',
      practicalesemarks: '0',
      practicalpamarks: '0',
      totalmarks: '100',
      iselective: 'false',
      istheory: 'true',
      ispractical: 'false',
      isfunctional: 'true',
      issemipractical: 'false',
      theoryexamduration: '3 Hours',
      practicalexamduration: '',
      remarks: 'GTU PDF: https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/DI01000011.pdf, Quality: 100'
    };

    it('should import GTU course data successfully', async () => {
      const csvData = [
        Object.keys(validGTUCourseData).join(','),
        Object.values(validGTUCourseData).join(',')
      ].join('\\n');

      // Mock departments and programs for mapping
      const departments = [{
        id: 'dept_ee',
        name: 'Electrical Engineering',
        code: 'EE'
      }];
      const programs = [{
        id: 'prog_dee',
        name: 'Diploma in Electrical Engineering',
        code: 'DEE',
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

      // Create FormData
      const formData = new FormData();
      formData.append('file', new Blob([csvData], { type: 'text/csv' }), 'courses.csv');
      formData.append('departments', JSON.stringify(departments));
      formData.append('programs', JSON.stringify(programs));

      const request = new NextRequest('http://localhost/api/courses/import', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('successfully imported');
      expect(data.newCount).toBe(1);
      expect(data.updatedCount).toBe(0);
      expect(data.skippedCount).toBe(0);
    });

    it('should handle missing required fields', async () => {
      const csvData = [
        'subcode,subjectname',
        'DI01000011,Mathematics I'
      ].join('\\n');

      // Mock departments and programs
      const departments = [{ id: 'dept_ee', name: 'Electrical Engineering', code: 'EE' }];
      const programs = [{ id: 'prog_dee', name: 'Diploma in Electrical Engineering', code: 'DEE', departmentId: 'dept_ee' }];

      // Create FormData
      const formData = new FormData();
      formData.append('file', new Blob([csvData], { type: 'text/csv' }), 'courses.csv');
      formData.append('departments', JSON.stringify(departments));
      formData.append('programs', JSON.stringify(programs));

      const request = new NextRequest('http://localhost/api/courses/import', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('missing required columns');
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