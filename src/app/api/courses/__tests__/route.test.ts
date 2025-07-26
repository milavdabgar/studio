import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { CourseModel } from '@/lib/models';
import { connectMongoose } from '@/lib/mongodb';

// Mock console methods to suppress expected error/warning messages during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock the MongoDB models and utilities
jest.mock('@/lib/mongodb');
jest.mock('@/lib/models');

const mockConnectMongoose = connectMongoose as jest.MockedFunction<typeof connectMongoose>;
const mockCourseModel = CourseModel as jest.Mocked<typeof CourseModel>;

describe('/api/courses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the database connection
    mockConnectMongoose.mockResolvedValue(undefined);
    
    // Reset mock implementations
    mockCourseModel.find.mockReset();
    mockCourseModel.findOne.mockReset();
    mockCourseModel.create.mockReset();
  });

  describe('GET /api/courses', () => {
    it('should return an array of courses', async () => {
      const mockCourse = {
        _id: 'course_1',
        subcode: 'MATH101',
        subjectName: 'Mathematics',
        departmentId: 'dept_1',
        programId: 'prog_1',
        semester: 1,
        credits: 4,
        isElective: false,
        isTheory: true,
        isPractical: true,
        isFunctional: true,
        category: 'Core',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Mock the find method to return the courses directly
      mockCourseModel.find.mockResolvedValue([mockCourse]);
      
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(mockCourseModel.find).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors', async () => {
      const errorMessage = 'Database connection failed';
      mockCourseModel.find.mockRejectedValue(new Error(errorMessage));
      
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.message).toBe('Error fetching courses');
      expect(data.error).toBe(errorMessage);
    });
  });

  describe('POST /api/courses', () => {
    const validCourseData = {
      subcode: 'MATH101',
      subjectName: 'Mathematics',
      departmentId: 'dept_1',
      programId: 'prog_1',
      semester: 1,
      lectureHours: 3,
      tutorialHours: 1,
      practicalHours: 2,
      credits: 4,
      theoryEseMarks: 70,
      theoryPaMarks: 30,
      practicalEseMarks: 50,
      practicalPaMarks: 50,
      totalMarks: 200,
      isElective: false,
      isTheory: true,
      isPractical: true,
      isFunctional: true,
      category: 'Core',
      theoryExamDuration: '3 hours',
      practicalExamDuration: '2 hours'
    };

    it('should create a new course with valid data', async () => {
      const savedCourse = {
        ...validCourseData,
        _id: 'course_new_123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockCourseModel.findOne.mockResolvedValue(null);
      
      // Mock the instance that will be created
      const mockSave = jest.fn().mockResolvedValue(savedCourse);
      (mockCourseModel as unknown as jest.MockedFunction<(data: unknown) => unknown>).mockImplementation((data: unknown) => ({
        ...(data as Record<string, unknown>),
        _id: 'course_new_123',
        save: mockSave
      }));
      
      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(validCourseData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.subcode).toBe(validCourseData.subcode);
      expect(data.subjectName).toBe(validCourseData.subjectName);
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('should return 400 when subject code is empty', async () => {
      const { subcode, ...invalidData } = validCourseData;
      void subcode; // Mark as used
      
      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Subject code cannot be empty.');
    });

    it('should return 400 when subject name is empty', async () => {
      const { subjectName, ...invalidData } = validCourseData;
      void subjectName; // Mark as used
      
      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Subject name cannot be empty.');
    });

    it('should return 400 when department ID is missing', async () => {
      const { departmentId, ...invalidData } = validCourseData;
      void departmentId; // Mark as used
      
      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Department ID is required.');
    });

    it('should return 400 when program ID is missing', async () => {
      const { programId, ...invalidData } = validCourseData;
      void programId; // Mark as used
      
      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Program ID is required.');
    });

    it('should return 400 when semester is invalid', async () => {
      const invalidData = { ...validCourseData, semester: 0 };
      
      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Valid semester is required.');
    });

    it('should return 400 when category is empty', async () => {
      const { category, ...invalidData } = validCourseData;
      void category; // Mark as used
      
      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Course category is required.');
    });

    it('should return 400 when hours are negative', async () => {
      const invalidData = { ...validCourseData, lectureHours: -1 };
      
      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Hours cannot be negative.');
    });

    it('should return 400 when credits are negative', async () => {
      const invalidData = { ...validCourseData, credits: -1 };
      
      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Credits cannot be negative.');
    });

    it('should allow creating course with zero credits', async () => {
      const validDataWithZeroCredits = { ...validCourseData, credits: 0 };
      
      const mockSavedCourse = {
        ...validDataWithZeroCredits,
        _id: 'course_zero_credits_123',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      
      mockCourseModel.findOne.mockResolvedValue(null);
      
      // Mock the instance that will be created
      const mockSave = jest.fn().mockResolvedValue(mockSavedCourse);
      (mockCourseModel as unknown as jest.MockedFunction<(data: unknown) => unknown>).mockImplementation((data: unknown) => ({
        ...(data as Record<string, unknown>),
        _id: 'course_zero_credits_123',
        save: mockSave
      }));
      
      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(validDataWithZeroCredits),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.credits).toBe(0);
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('should return 409 when course with same code exists in program', async () => {
      const existingCourse = {
        ...validCourseData,
        _id: 'course_existing_123',
        toObject: jest.fn().mockReturnThis()
      };
      
      mockCourseModel.findOne.mockResolvedValue(existingCourse);
      
      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(validCourseData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(409);
      expect(data.message).toContain("already exists for this program");
    });

    it('should handle database errors during course creation', async () => {
      const errorMessage = 'Database save failed';
      mockCourseModel.findOne.mockResolvedValue(null);
      
      // Mock the instance that will be created to throw an error on save
      const mockSave = jest.fn().mockRejectedValue(new Error(errorMessage));
      (mockCourseModel as unknown as jest.MockedFunction<(data: unknown) => unknown>).mockImplementation((data: unknown) => ({
        ...(data as Record<string, unknown>),
        _id: 'course_new_123',
        save: mockSave
      }));
      
      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(validCourseData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.message).toBe('Error creating course');
      expect(data.error).toBe(errorMessage);
    });
  });
});
