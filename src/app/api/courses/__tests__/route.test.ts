import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { CourseModel } from '@/lib/models';
import { connectMongoose } from '@/lib/mongodb';
import { Document } from 'mongoose';

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
    mockCourseModel.prototype.save.mockReset();
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
        updatedAt: new Date().toISOString(),
        toObject: jest.fn().mockReturnThis()
      };
      
      // Mock the Document methods
      const mockDocument = {
        ...mockCourse,
        save: jest.fn().mockResolvedValue(mockCourse),
      } as unknown as Document;
      
      mockCourseModel.find.mockReturnThis();
      mockCourseModel.find().exec = jest.fn().mockResolvedValue([mockDocument]);
      
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
        updatedAt: new Date().toISOString(),
        toObject: jest.fn().mockReturnThis()
      };
      
      mockCourseModel.findOne.mockResolvedValue(null);
      mockCourseModel.prototype.save.mockResolvedValue(savedCourse);
      
      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(validCourseData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.subcode).toBe(validCourseData.subcode);
      expect(data.subjectName).toBe(validCourseData.subjectName);
      expect(mockCourseModel.prototype.save).toHaveBeenCalledTimes(1);
    });

    it('should return 400 when required fields are missing', async () => {
      const { subcode, ...invalidData } = validCourseData;
      
      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Subject code cannot be empty.');
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
      mockCourseModel.prototype.save.mockRejectedValue(new Error(errorMessage));
      
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
