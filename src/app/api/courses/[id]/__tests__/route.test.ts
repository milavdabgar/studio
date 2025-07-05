import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import { CourseModel } from '@/lib/models';
import { connectMongoose } from '@/lib/mongodb';
import { Types } from 'mongoose';

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

describe('/api/courses/[id]', () => {
  const mockCourse = {
    _id: new Types.ObjectId().toString(),
    id: 'course_123',
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
    practicalExamDuration: '2 hours',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toObject: jest.fn().mockReturnThis()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectMongoose.mockResolvedValue(undefined);
    mockCourseModel.findById.mockReset();
    mockCourseModel.findOne.mockReset();
    mockCourseModel.findByIdAndUpdate.mockReset();
    mockCourseModel.findByIdAndDelete.mockReset();
  });

  describe('GET /api/courses/[id]', () => {
    it('should return course by MongoDB ID', async () => {
      mockCourseModel.findById.mockResolvedValue(mockCourse);
      
      const params = Promise.resolve({ id: mockCourse._id });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockCourseModel.findById).toHaveBeenCalledWith(mockCourse._id);
      expect(data.subcode).toBe(mockCourse.subcode);
    });

    it('should return course by custom ID', async () => {
      mockCourseModel.findById.mockResolvedValue(null);
      mockCourseModel.findOne.mockResolvedValue(mockCourse);
      
      const params = Promise.resolve({ id: 'custom_course_id' });
      const response = await GET({} as NextRequest, { params });
      
      expect(response.status).toBe(200);
      expect(mockCourseModel.findOne).toHaveBeenCalledWith({ id: 'custom_course_id' });
    });

    it('should return 404 when course not found', async () => {
      mockCourseModel.findById.mockResolvedValue(null);
      mockCourseModel.findOne.mockResolvedValue(null);
      
      const params = Promise.resolve({ id: 'non_existent_id' });
      const response = await GET({} as NextRequest, { params });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe('Course not found');
    });

    it('should handle database errors', async () => {
      const errorMessage = 'Database error';
      mockCourseModel.findById.mockRejectedValue(new Error(errorMessage));
      
      const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' }); // Valid ObjectId format
      const response = await GET({} as NextRequest, { params });
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe('Error fetching course');
      expect(data.error).toBe(errorMessage);
    });
  });

  describe('PUT /api/courses/[id]', () => {
    const updateData = {
      subjectName: 'Advanced Mathematics',
      credits: 5,
      lectureHours: 4
    };

    it('should update course with valid data', async () => {
      const updatedCourse = { ...mockCourse, ...updateData };
      mockCourseModel.findById.mockResolvedValue(mockCourse);
      mockCourseModel.findOne.mockResolvedValue(null);
      mockCourseModel.findByIdAndUpdate.mockResolvedValue(updatedCourse);
      
      const params = Promise.resolve({ id: mockCourse._id });
      const request = new NextRequest('http://localhost/api/courses/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      const response = await PUT(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.subjectName).toBe(updateData.subjectName);
      expect(mockCourseModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockCourse._id,
        expect.objectContaining({
          subjectName: updateData.subjectName,
          credits: 7, // 4 (new lecture) + 1 (tutorial) + 2 (practical) = 7
          lectureHours: updateData.lectureHours,
          updatedAt: expect.any(String)
        }),
        { new: true, runValidators: true }
      );
    });

    it('should return 400 for empty subject code', async () => {
      const invalidData = { subcode: '' };
      const params = Promise.resolve({ id: mockCourse._id });
      const request = new NextRequest('http://localhost/api/courses/123', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });
      
      const response = await PUT(request, { params });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Subject Code cannot be empty.');
    });

    it('should return 400 for empty subject name', async () => {
      const invalidData = { subjectName: '' };
      const params = Promise.resolve({ id: mockCourse._id });
      const request = new NextRequest('http://localhost/api/courses/123', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });
      
      const response = await PUT(request, { params });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Subject Name cannot be empty.');
    });

    it('should return 400 for missing department ID', async () => {
      const invalidData = { departmentId: '' };
      const params = Promise.resolve({ id: mockCourse._id });
      const request = new NextRequest('http://localhost/api/courses/123', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });
      
      const response = await PUT(request, { params });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Department ID is required.');
    });

    it('should return 400 for missing program ID', async () => {
      const invalidData = { programId: '' };
      const params = Promise.resolve({ id: mockCourse._id });
      const request = new NextRequest('http://localhost/api/courses/123', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });
      
      const response = await PUT(request, { params });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Program ID is required.');
    });

    it('should return 400 for invalid semester', async () => {
      const invalidData = { semester: 0 };
      const params = Promise.resolve({ id: mockCourse._id });
      const request = new NextRequest('http://localhost/api/courses/123', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });
      
      const response = await PUT(request, { params });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Semester must be a positive number.');
    });

    it('should return 404 if course not found after update', async () => {
      mockCourseModel.findById.mockResolvedValue(mockCourse);
      mockCourseModel.findOne.mockResolvedValue(null);
      mockCourseModel.findByIdAndUpdate.mockResolvedValue(null);
      
      const params = Promise.resolve({ id: mockCourse._id });
      const request = new NextRequest('http://localhost/api/courses/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      const response = await PUT(request, { params });
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe('Course not found');
    });

    it('should handle database errors during update', async () => {
      const errorMessage = 'Database update failed';
      mockCourseModel.findById.mockResolvedValue(mockCourse);
      mockCourseModel.findOne.mockResolvedValue(null);
      mockCourseModel.findByIdAndUpdate.mockRejectedValue(new Error(errorMessage));
      
      const params = Promise.resolve({ id: mockCourse._id });
      const request = new NextRequest('http://localhost/api/courses/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      const response = await PUT(request, { params });
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe('Internal server error');
    });

    it('should return 409 for duplicate course code', async () => {
      const duplicateData = { subcode: 'DUPLICATE', programId: 'prog_1' };
      mockCourseModel.findById.mockResolvedValue(mockCourse); // Existing course to update
      mockCourseModel.findOne.mockResolvedValue({ _id: 'other_course_id' }); // Duplicate course found
      
      const params = Promise.resolve({ id: mockCourse._id });
      const request = new NextRequest('http://localhost/api/courses/123', {
        method: 'PUT',
        body: JSON.stringify(duplicateData),
      });
      
      const response = await PUT(request, { params });
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toContain('already exists for this program');
    });
  });

  describe('DELETE /api/courses/[id]', () => {
    it('should delete an existing course by MongoDB ID', async () => {
      mockCourseModel.findById.mockResolvedValue(mockCourse);
      mockCourseModel.findByIdAndDelete.mockResolvedValue(mockCourse);
      
      const params = Promise.resolve({ id: mockCourse._id });
      const response = await DELETE({} as NextRequest, { params });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Course deleted successfully');
      expect(mockCourseModel.findByIdAndDelete).toHaveBeenCalledWith(mockCourse._id);
    });

    it('should delete an existing course by custom ID', async () => {
      mockCourseModel.findById.mockResolvedValue(null);
      mockCourseModel.findOne.mockResolvedValue(mockCourse);
      mockCourseModel.findByIdAndDelete.mockResolvedValue(mockCourse);
      
      const params = Promise.resolve({ id: 'custom_course_id' });
      const response = await DELETE({} as NextRequest, { params });
      
      expect(response.status).toBe(200);
      expect(mockCourseModel.findOne).toHaveBeenCalledWith({ id: 'custom_course_id' });
      expect(mockCourseModel.findByIdAndDelete).toHaveBeenCalledWith(mockCourse._id);
    });

    it('should return 404 when course not found', async () => {
      mockCourseModel.findById.mockResolvedValue(null);
      mockCourseModel.findOne.mockResolvedValue(null);
      
      const params = Promise.resolve({ id: 'non_existent_id' });
      const response = await DELETE({} as NextRequest, { params });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe('Course not found');
    });

    it('should handle database errors during deletion', async () => {
      const errorMessage = 'Database error';
      mockCourseModel.findById.mockResolvedValue(mockCourse);
      mockCourseModel.findByIdAndDelete.mockRejectedValue(new Error(errorMessage));
      
      const params = Promise.resolve({ id: mockCourse._id });
      const response = await DELETE({} as NextRequest, { params });
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe('Error deleting course');
      expect(data.error).toBe(errorMessage);
    });
  });
});
