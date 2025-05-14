import { enrollmentService } from './enrollments';
import type { Enrollment, EnrollmentStatus } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Helper to create mock responses
const createMockResponse = (options: { ok: boolean; status?: number; json?: () => Promise<any>; statusText?: string }): Response => {
  return {
    ok: options.ok,
    status: options.status || (options.ok ? 200 : 500),
    statusText: options.statusText || (options.ok ? 'OK' : 'Error'),
    json: options.json || (async () => ({})),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(options), // Provide a basic clone implementation
    text: async () => JSON.stringify(await (options.json ? options.json() : {})),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    bodyUsed: false,
  } as Response;
};

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('EnrollmentService API Tests', () => {
  const now = new Date().toISOString();
  const mockEnrollment: Enrollment = {
    id: "enroll1",
    studentId: "student1",
    courseOfferingId: "co1",
    status: "enrolled",
    enrolledAt: now,
    createdAt: now,
    updatedAt: now,
  };
  const mockEnrollments: Enrollment[] = [mockEnrollment];

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getEnrollmentsByStudent', () => {
    it('should fetch enrollments for a student successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockEnrollments }));
      const result = await enrollmentService.getEnrollmentsByStudent('student1');
      expect(fetch).toHaveBeenCalledWith('/api/enrollments?studentId=student1');
      expect(result).toEqual(mockEnrollments);
    });

    it('should throw an error if fetching student enrollments fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Fetch error' }) }));
      await expect(enrollmentService.getEnrollmentsByStudent('student1')).rejects.toThrow('Fetch error');
    });
  });

  describe('getEnrollmentsByCourseOffering', () => {
    it('should fetch enrollments for a course offering successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockEnrollments }));
      const result = await enrollmentService.getEnrollmentsByCourseOffering('co1');
      expect(fetch).toHaveBeenCalledWith('/api/enrollments?courseOfferingId=co1');
      expect(result).toEqual(mockEnrollments);
    });
  });

  describe('getEnrollmentById', () => {
    it('should fetch a specific enrollment by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockEnrollment }));
      const result = await enrollmentService.getEnrollmentById('enroll1');
      expect(fetch).toHaveBeenCalledWith('/api/enrollments/enroll1');
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('createEnrollment', () => {
    const newEnrollmentData: Omit<Enrollment, 'id' | 'createdAt' | 'updatedAt' | 'enrolledAt'> & { status?: EnrollmentStatus } = {
      studentId: "student2",
      courseOfferingId: "co2",
      status: "requested",
    };
    const createdEnrollment: Enrollment = { ...newEnrollmentData, id: 'enroll2', enrolledAt: undefined, createdAt: now, updatedAt: now };

    it('should create an enrollment successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => createdEnrollment }));
      const result = await enrollmentService.createEnrollment(newEnrollmentData);
      expect(fetch).toHaveBeenCalledWith('/api/enrollments', expect.objectContaining({ method: 'POST', body: JSON.stringify(newEnrollmentData) }));
      expect(result).toEqual(createdEnrollment);
    });
  });

  describe('updateEnrollmentStatus', () => {
    const updatedEnrollment: Enrollment = { ...mockEnrollment, status: "completed", updatedAt: new Date().toISOString() };
    it('should update enrollment status successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => updatedEnrollment }));
      const result = await enrollmentService.updateEnrollmentStatus('enroll1', 'completed');
      expect(fetch).toHaveBeenCalledWith('/api/enrollments/enroll1', expect.objectContaining({ method: 'PUT', body: JSON.stringify({ status: 'completed' }) }));
      expect(result).toEqual(updatedEnrollment);
    });
  });

  describe('withdrawEnrollment', () => {
    it('should withdraw an enrollment successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));
      await enrollmentService.withdrawEnrollment('enroll1');
      expect(fetch).toHaveBeenCalledWith('/api/enrollments/enroll1', expect.objectContaining({ method: 'DELETE' }));
    });
  });
});
