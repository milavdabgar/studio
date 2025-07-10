import { courseService } from './courses';
import type { Course, Department, Program } from '@/types/entities';
import { describe, it, expect, jest } from '@jest/globals';

// Create a proper mock for the Response object
const createMockResponse = (options: { ok: boolean; status?: number; statusText?: string; json?: () => Promise<unknown> }): Response => {
  const { ok, status = 200, statusText = '', json = async () => ({}) } = options;
  return {
    ok,
    status,
    statusText,
    json,
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(options),
    text: async () => '',
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    bodyUsed: false,
  } as Response;
};

// Mock fetch with proper return type
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('Course API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCourse', () => {
    it('should create a course successfully', async () => {
      const newCourse: Omit<Course, 'id'> = {
        subcode: 'TC101',
        subjectName: 'Test Course',
        departmentId: 'dep1',
        programId: 'prog1',
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
        isFunctional: true
      };
      const createdCourse = { id: '1', ...newCourse };
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => createdCourse
      }));

      const result = await courseService.createCourse(newCourse);
      
      expect(result).toEqual(createdCourse);
      expect(fetch).toHaveBeenCalledWith('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCourse)
      });
    });
    
    it('should throw an error if creation fails', async () => {
      const newCourse: Omit<Course, 'id'> = {
        subcode: 'TC101',
        subjectName: 'Test Course',
        departmentId: 'dep1',
        programId: 'prog1',
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
        isFunctional: true
      };
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      }));

      await expect(courseService.createCourse(newCourse))
        .rejects.toThrow('Failed to create course');
    });
  });

  describe('getAllCourses', () => {
    it('should fetch and return a list of courses', async () => {
      const mockCourses: Course[] = [
        { 
          id: '1', 
          subcode: 'TC101',
          subjectName: 'Test Course 1',
          departmentId: 'dep1',
          programId: 'prog1',
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
          isFunctional: true
        },
        { 
          id: '2', 
          subcode: 'TC102',
          subjectName: 'Test Course 2',
          departmentId: 'dep1',
          programId: 'prog1',
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
          isFunctional: true
        }
      ];
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockCourses
      }));

      const result = await courseService.getAllCourses();
      
      expect(result).toEqual(mockCourses);
      expect(fetch).toHaveBeenCalledWith('/api/courses');
    });
    
    it('should throw an error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        statusText: 'Server Error'
      }));

      await expect(courseService.getAllCourses()).rejects.toThrow('Failed to fetch courses');
    });
  });
  
  describe('getCourseById', () => {
    it('should fetch a course by ID', async () => {
      const mockCourse: Course = { 
        id: '1', 
        subcode: 'TC101',
        subjectName: 'Test Course',
        departmentId: 'dep1',
        programId: 'prog1',
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
        isFunctional: true
      };
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockCourse
      }));

      const result = await courseService.getCourseById('1');
      
      expect(result).toEqual(mockCourse);
      expect(fetch).toHaveBeenCalledWith('/api/courses/1');
    });
    
    it('should throw an error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }));

      await expect(courseService.getCourseById('999')).rejects.toThrow('Failed to fetch course with id 999');
    });
  });
  
  describe('updateCourse', () => {
    it('should update a course', async () => {
      const updatedCourse: Partial<Omit<Course, 'id'>> = {
        subcode: 'UC101',
        subjectName: 'Updated Course',
        departmentId: 'dep1',
        programId: 'prog1',
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
        isFunctional: true
      };
      const mockResponse: Course = { 
        id: '1', 
        subcode: 'UC101',
        subjectName: 'Updated Course',
        departmentId: 'dep1',
        programId: 'prog1',
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
        isFunctional: true
      };
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockResponse
      }));

      const result = await courseService.updateCourse('1', updatedCourse);
      
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('/api/courses/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCourse)
      });
    });
    
    it('should throw an error if update fails', async () => {
      const updatedCourse: Partial<Omit<Course, 'id'>> = {
        subcode: 'UC101',
        subjectName: 'Updated Course',
        departmentId: 'dep1',
        programId: 'prog1',
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
        isFunctional: true
      };
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      }));

      await expect(courseService.updateCourse('1', updatedCourse)).rejects.toThrow('Failed to update course');
    });
  });

  describe('deleteCourse', () => {
    it('should delete a course', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true
      }));

      await courseService.deleteCourse('1');
      
      expect(fetch).toHaveBeenCalledWith('/api/courses/1', {
        method: 'DELETE'
      });
    });
    
    it('should throw an error if deletion fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }));

      await expect(courseService.deleteCourse('999')).rejects.toThrow('Failed to delete course with id 999');
    });
  });
  
  describe('importCourses', () => {
    it('should import courses successfully', async () => {
      const mockFile = new File(['test'], 'test.csv');
      const mockDepartments: Department[] = [{
        id: 'dep1',
        name: 'Department 1',
        code: 'DEP1',
        status: 'active',
        instituteId: 'inst1'
      }];
      const mockPrograms: Program[] = [{
        id: 'prog1',
        name: 'Program 1',
        code: 'PROG1',
        departmentId: 'dep1',
        instituteId: 'inst1',
        status: 'active'
      }];
      const mockResult = { newCount: 2, updatedCount: 1, skippedCount: 0 };
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockResult
      }));

      const result = await courseService.importCourses(mockFile, mockDepartments, mockPrograms);
      
      expect(result).toEqual(mockResult);
      expect(fetch).toHaveBeenCalledWith('/api/courses/import', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });
    
    it('should throw an error if import fails', async () => {
      const mockFile = new File(['test'], 'test.csv');
      const mockDepartments: Department[] = [{
        id: 'dep1',
        name: 'Department 1',
        code: 'DEP1',
        status: 'active',
        instituteId: 'inst1'
      }];
      const mockPrograms: Program[] = [{
        id: 'prog1',
        name: 'Program 1',
        code: 'PROG1',
        departmentId: 'dep1',
        instituteId: 'inst1',
        status: 'active'
      }];
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      }));

      await expect(courseService.importCourses(mockFile, mockDepartments, mockPrograms))
        .rejects.toThrow('Failed to import courses');
    });
  });
});
