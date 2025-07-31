import { courseOfferingService } from './courseOfferings';
import type { CourseOffering } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Helper to create mock responses
const createMockResponse = (options: { ok: boolean; status?: number; json?: () => Promise<unknown>; statusText?: string }): Response => {
  return {
    ok: options.ok,
    status: options.status || (options.ok ? 200 : 500),
    statusText: options.statusText || (options.ok ? 'OK' : 'Error'),
    json: options.json || (async () => ({})),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(options),
    text: async () => JSON.stringify(await (options.json ? options.json() : {})),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    bodyUsed: false,
  } as Response;
};

// Mock fetch globally for all tests in this file
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('CourseOfferingService API Tests', () => {
  const now = new Date().toISOString();
  const mockCourseOffering: CourseOffering = {
    id: "co1",
    courseId: "course1",
    batchId: "batch1",
    academicYear: "2023-24",
    semester: 1,
    facultyIds: ["fac1"],
    status: "scheduled",
    academicTermId: "test_term_123",
    createdAt: now,
    updatedAt: now,
  };

  const mockCourseOfferings: CourseOffering[] = [
    mockCourseOffering,
    {
      id: "co2",
      courseId: "course2",
      batchId: "batch2",
      academicYear: "2023-24",
      semester: 2,
      facultyIds: ["fac2"],
      status: "ongoing",
      academicTermId: "test_term_123",
      createdAt: now,
      updatedAt: now,
    },
  ];

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getAllCourseOfferings', () => {
    it('should fetch all course offerings successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockCourseOfferings }));
      const result = await courseOfferingService.getAllCourseOfferings();
      expect(fetch).toHaveBeenCalledWith('/api/course-offerings');
      expect(result).toEqual(mockCourseOfferings);
    });

    it('should throw an error if fetching all course offerings fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Fetch error' }) }));
      await expect(courseOfferingService.getAllCourseOfferings()).rejects.toThrow('Fetch error');
    });
  });

  describe('getCourseOfferingById', () => {
    it('should fetch a course offering by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockCourseOffering }));
      const result = await courseOfferingService.getCourseOfferingById('co1');
      expect(fetch).toHaveBeenCalledWith('/api/course-offerings/co1');
      expect(result).toEqual(mockCourseOffering);
    });

    it('should throw an error if fetching a course offering by ID fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Not found' }) }));
      await expect(courseOfferingService.getCourseOfferingById('unknown')).rejects.toThrow('Not found');
    });
  });

  describe('createCourseOffering', () => {
    const newOfferingData: Omit<CourseOffering, 'id' | 'createdAt' | 'updatedAt'> = {
      courseId: "course3",
      batchId: "batch3",
      academicYear: "2024-25",
      semester: 1,
      facultyIds: ["fac3"],
      status: "scheduled",
      academicTermId: "test_term_123",
    };
    const createdOffering: CourseOffering = { ...newOfferingData, id: 'co3', createdAt: now, updatedAt: now };

    it('should create a course offering successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => createdOffering }));
      const result = await courseOfferingService.createCourseOffering(newOfferingData);
      expect(fetch).toHaveBeenCalledWith('/api/course-offerings', expect.objectContaining({ method: 'POST', body: JSON.stringify(newOfferingData) }));
      expect(result).toEqual(createdOffering);
    });

    it('should throw an error if creating a course offering fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 400, json: async () => ({ message: 'Creation failed' }) }));
      await expect(courseOfferingService.createCourseOffering(newOfferingData)).rejects.toThrow('Creation failed');
    });
  });

  describe('updateCourseOffering', () => {
    const updateData: Partial<Omit<CourseOffering, 'id' | 'createdAt' | 'updatedAt'>> = { status: 'completed' };
    const updatedOffering: CourseOffering = { ...mockCourseOffering, status: 'completed', updatedAt: new Date().toISOString() };

    it('should update a course offering successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => updatedOffering }));
      const result = await courseOfferingService.updateCourseOffering('co1', updateData);
      expect(fetch).toHaveBeenCalledWith('/api/course-offerings/co1', expect.objectContaining({ method: 'PUT', body: JSON.stringify(updateData) }));
      expect(result).toEqual(updatedOffering);
    });

    it('should throw an error if updating a course offering fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 400, json: async () => ({ message: 'Update failed' }) }));
      await expect(courseOfferingService.updateCourseOffering('co1', updateData)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteCourseOffering', () => {
    it('should delete a course offering successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));
      await courseOfferingService.deleteCourseOffering('co1');
      expect(fetch).toHaveBeenCalledWith('/api/course-offerings/co1', expect.objectContaining({ method: 'DELETE' }));
    });

    it('should throw an error if deleting a course offering fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 404, json: async () => ({ message: 'Delete failed' }) }));
      await expect(courseOfferingService.deleteCourseOffering('co1')).rejects.toThrow('Delete failed');
    });
  });
});
