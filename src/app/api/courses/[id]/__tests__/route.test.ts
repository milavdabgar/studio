import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import { CourseModel } from '@/lib/models';
import { connectMongoose } from '@/lib/mongodb';
import { Types } from 'mongoose';

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
      
      const params = Promise.resolve({ id: 'some_id' });
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
          credits: 5, // Should be recalculated
        }),
        { new: true, runValidators: true }
      );
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = { subjectName: '' }; // Empty subject name
      const params = Promise.resolve({ id: mockCourse._id });
      const request = new NextRequest('http://localhost/api/courses/123', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });
      
      const response = await PUT(request, { params });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('Subject Name cannot be empty');
    });

    it('should return 409 for duplicate course code', async () => {
      const duplicateData = { subcode: 'DUPLICATE' };
      mockCourseModel.findOne.mockResolvedValue({ _id: 'other_course_id' });
      
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
    it('should delete an existing course', async () => {
      mockCourseModel.findById.mockResolvedValue(mockCourse);
      mockCourseModel.findByIdAndDelete.mockResolvedValue(mockCourse);
      
      const params = Promise.resolve({ id: mockCourse._id });
      const response = await DELETE({} as NextRequest, { params });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Course deleted successfully');
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
