import { assessmentService } from './assessments';
import type { Assessment, Course, Program, Batch } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

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

describe('Assessment API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAssessment: Assessment = {
    id: '1',
    name: 'Test Assessment',
    description: 'This is a test assessment',
    courseId: '123',
    batchId: '456',
    programId: '789',
    type: 'Quiz' as Assessment['type'],
    maxMarks: 100,
    passingMarks: 40,
    status: 'Published' as Assessment['status'],
    instructions: 'Test instructions',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  };

  describe('getAllAssessments', () => {
    it('should get all assessments', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => [mockAssessment],
      }));

      const assessments = await assessmentService.getAllAssessments();
      expect(fetch).toHaveBeenCalledWith('/api/assessments');
      expect(assessments).toEqual([mockAssessment]);
    });

    it('should handle error when getting assessments', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Failed to fetch assessments' })
      }));

      await expect(assessmentService.getAllAssessments()).rejects.toThrow('Failed to fetch assessments');
      expect(fetch).toHaveBeenCalledWith('/api/assessments');
    });
  });

  describe('getAssessmentById', () => {
    it('should get an assessment by ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockAssessment,
      }));

      const assessment = await assessmentService.getAssessmentById('1');
      expect(fetch).toHaveBeenCalledWith('/api/assessments/1');
      expect(assessment).toEqual(mockAssessment);
    });

    it('should handle error when getting an assessment by ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Failed to fetch assessment with id 1' })
      }));

      await expect(assessmentService.getAssessmentById('1')).rejects.toThrow('Failed to fetch assessment with id 1');
      expect(fetch).toHaveBeenCalledWith('/api/assessments/1');
    });
  });

  describe('createAssessment', () => {
    it('should create an assessment', async () => {
      const newAssessmentData: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'New Assessment',
        description: 'This is a new assessment',
        courseId: '123',
        batchId: '456',
        programId: '789',
        type: 'Quiz',
        maxMarks: 100,
        passingMarks: 40,
        assessmentDate: '2023-01-01T00:00:00.000Z',
        status: 'Published',
        instructions: 'Test instructions'
      };

      const createdAssessment = {
        ...newAssessmentData,
        id: 'new-assessment-id',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        status: 201,
        json: async () => createdAssessment
      }));

      const result = await assessmentService.createAssessment(newAssessmentData);
      expect(result).toEqual(createdAssessment);
      expect(fetch).toHaveBeenCalledWith('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAssessmentData)
      });
    });

    it('should handle api error during creation', async () => {
      const newAssessmentData: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'New Assessment',
        description: 'This is a new assessment',
        courseId: '123',
        batchId: '456',
        programId: '789',
        type: 'Quiz',
        maxMarks: 100,
        passingMarks: 40,
        assessmentDate: '2023-01-01T00:00:00.000Z',
        status: 'Published',
        instructions: 'Test instructions'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Failed to create assessment' })
      }));

      await expect(assessmentService.createAssessment(newAssessmentData)).rejects.toThrow('Failed to create assessment');
    });
  });

  describe('updateAssessment', () => {
    it('should update an assessment', async () => {
      const updateData: Partial<Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>> = {
        name: 'Updated Assessment',
        description: 'This is an updated assessment',
        maxMarks: 120,
        passingMarks: 50
      };

      const updatedAssessment = {
        ...mockAssessment,
        ...updateData,
        updatedAt: '2023-01-02T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => updatedAssessment
      }));

      const result = await assessmentService.updateAssessment('1', updateData);
      expect(result).toEqual(updatedAssessment);
      expect(fetch).toHaveBeenCalledWith('/api/assessments/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
    });

    it('should handle error when updating an assessment', async () => {
      const updateData = {
        name: 'Updated Assessment'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Failed to update assessment' })
      }));

      await expect(assessmentService.updateAssessment('1', updateData)).rejects.toThrow('Failed to update assessment');
    });
  });

  describe('deleteAssessment', () => {
    it('should delete an assessment', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true
      }));

      await assessmentService.deleteAssessment('1');
      expect(fetch).toHaveBeenCalledWith('/api/assessments/1', {
        method: 'DELETE'
      });
    });

    it('should throw an error if deletion fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Failed to delete assessment with id 1' })
      }));

      await expect(assessmentService.deleteAssessment('1')).rejects.toThrow(
        'Failed to delete assessment with id 1'
      );
    });
  });

  describe('importAssessments', () => {
    it('should import assessments from a file', async () => {
      const mockFile = new File(['test data'], 'assessments.csv', { type: 'text/csv' });
      const mockCourses = [{ id: 'course-1', title: 'Course 1', code: 'C1' }] as any as Course[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      const mockPrograms = [{ id: 'program-1', name: 'Program 1', code: 'P1' }] as any as Program[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      const mockBatches = [{ id: 'batch-1', name: 'Batch 1' }] as any as Batch[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      const mockResponse = { newCount: 3, updatedCount: 1, skippedCount: 0 };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockResponse
      }));

      const result = await assessmentService.importAssessments(mockFile, mockCourses, mockPrograms, mockBatches);
      expect(result).toEqual(mockResponse);
      
      // Check that FormData was created correctly
      expect(fetch).toHaveBeenCalledWith('/api/assessments/import', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });

    it('should throw an error if import fails', async () => {
      const mockFile = new File(['test data'], 'assessments.csv', { type: 'text/csv' });
      const mockCourses = [{ id: 'course-1', title: 'Course 1', code: 'C1' }] as any as Course[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      const mockPrograms = [{ id: 'program-1', name: 'Program 1', code: 'P1' }] as any as Program[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      const mockBatches = [{ id: 'batch-1', name: 'Batch 1' }] as any as Batch[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ 
          message: 'Failed to import assessments.',
          errors: [
            { message: 'Invalid CSV format' },
            { message: 'Missing required fields' }
          ]
        })
      }));

      await expect(assessmentService.importAssessments(mockFile, mockCourses, mockPrograms, mockBatches)).rejects.toThrow(
        'Failed to import assessments. Specific issues: Invalid CSV format; Missing required fields'
      );
    });

    it('should handle server error during import', async () => {
      const mockFile = new File(['test data'], 'assessments.csv', { type: 'text/csv' });
      const mockCourses = [{ id: 'course-1', title: 'Course 1', code: 'C1' }] as any as Course[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      const mockPrograms = [{ id: 'program-1', name: 'Program 1', code: 'P1' }] as any as Program[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      const mockBatches = [{ id: 'batch-1', name: 'Batch 1' }] as any as Batch[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        json: async () => ({})
      }));

      await expect(assessmentService.importAssessments(mockFile, mockCourses, mockPrograms, mockBatches)).rejects.toThrow(
        'Critical error during assessment import process. Please check server logs.'
      );
    });
  });
});