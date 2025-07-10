import { curriculumService } from './curriculum';
import type { Curriculum, Program, Course } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

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

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('Curriculum API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCurriculum: Curriculum = {
    id: 'curr1',
    programId: 'prog1',
    version: '1.0',
    effectiveDate: '2024-01-01',
    courses: [{ courseId: 'course1', semester: 1, isElective: false }],
    status: 'active',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockCurricula: Curriculum[] = [mockCurriculum];

  describe('getAllCurricula', () => {
    it('should fetch all curricula', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockCurricula }));
      const result = await curriculumService.getAllCurricula();
      expect(fetch).toHaveBeenCalledWith('/api/curriculum');
      expect(result).toEqual(mockCurricula);
    });

    it('should handle errors when fetching all curricula', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => ({ message: 'Server Error' }) }));
      await expect(curriculumService.getAllCurricula()).rejects.toThrow('Server Error');
    });
  });

  describe('getCurriculumById', () => {
    it('should fetch a curriculum by ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockCurriculum }));
      const result = await curriculumService.getCurriculumById('curr1');
      expect(fetch).toHaveBeenCalledWith('/api/curriculum/curr1');
      expect(result).toEqual(mockCurriculum);
    });

    it('should handle errors if curriculum not found', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 404, json: async () => ({ message: 'Not Found' }) }));
      await expect(curriculumService.getCurriculumById('curr_unknown')).rejects.toThrow('Not Found');
    });
  });

  describe('createCurriculum', () => {
    const newCurriculumData: Omit<Curriculum, 'id' | 'createdAt' | 'updatedAt'> = {
      programId: 'prog2',
      version: '2.0',
      effectiveDate: '2025-01-01',
      courses: [{ courseId: 'course2', semester: 1, isElective: true }],
      status: 'draft',
    };
    const createdCurriculum = { ...newCurriculumData, id: 'curr2', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' };

    it('should create a curriculum', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => createdCurriculum }));
      const result = await curriculumService.createCurriculum(newCurriculumData);
      expect(fetch).toHaveBeenCalledWith('/api/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCurriculumData),
      });
      expect(result).toEqual(createdCurriculum);
    });

    it('should handle creation errors', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 400, json: async () => ({ message: 'Bad Request' }) }));
      await expect(curriculumService.createCurriculum(newCurriculumData)).rejects.toThrow('Bad Request');
    });
  });

  describe('updateCurriculum', () => {
    const updateData: Partial<Omit<Curriculum, 'id' | 'createdAt' | 'updatedAt'>> = { version: '1.1', status: 'active' };
    const updatedCurriculum = { ...mockCurriculum, ...updateData, updatedAt: '2024-01-02T00:00:00.000Z' };

    it('should update a curriculum', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => updatedCurriculum }));
      const result = await curriculumService.updateCurriculum('curr1', updateData);
      expect(fetch).toHaveBeenCalledWith('/api/curriculum/curr1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      expect(result).toEqual(updatedCurriculum);
    });

    it('should handle update errors', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 404, json: async () => ({ message: 'Not Found' }) }));
      await expect(curriculumService.updateCurriculum('curr_unknown', updateData)).rejects.toThrow('Not Found');
    });
  });

  describe('deleteCurriculum', () => {
    it('should delete a curriculum', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));
      await curriculumService.deleteCurriculum('curr1');
      expect(fetch).toHaveBeenCalledWith('/api/curriculum/curr1', { method: 'DELETE' });
    });

    it('should handle deletion errors', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 404, json: async () => ({ message: 'Not Found' }) }));
      await expect(curriculumService.deleteCurriculum('curr_unknown')).rejects.toThrow('Not Found');
    });
  });

  describe('importCurricula', () => {
    const mockFile = new File(['test data'], 'curricula.csv', { type: 'text/csv' });
    const mockPrograms: Program[] = [{ id: 'prog1', name: 'Program 1', code: 'P1', departmentId: 'dept1', instituteId: 'inst1', status: 'active' }];
    const mockCourses: Course[] = [{ id: 'course1', subcode: 'C1', subjectName: 'Course 1', departmentId: 'dept1', programId: 'prog1', semester: 1, lectureHours: 3, tutorialHours: 1, practicalHours: 0, credits: 4, theoryEseMarks: 70, theoryPaMarks: 30, practicalEseMarks: 0, practicalPaMarks: 0, totalMarks: 100, isElective: false, isTheory: true, isPractical: false, isFunctional: true }];
    const mockResponse = { newCount: 1, updatedCount: 0, skippedCount: 0 };

    it('should import curricula from a file', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockResponse }));
      const result = await curriculumService.importCurricula(mockFile, mockPrograms, mockCourses);
      expect(fetch).toHaveBeenCalledWith('/api/curriculum/import', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
      expect(result).toEqual(mockResponse);
    });

    it('should handle import errors', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 400, json: async () => ({ message: 'Import failed', errors: [{ message: 'Bad format'}] }) }));
      await expect(curriculumService.importCurricula(mockFile, mockPrograms, mockCourses)).rejects.toThrow('Import failed Specific issues: Bad format');
    });

    it('should handle critical server error during import', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => ({}) })); // No specific message or errors array
        await expect(curriculumService.importCurricula(mockFile, mockPrograms, mockCourses))
          .rejects.toThrow('Critical error during curriculum import process. Please check server logs.');
      });
  });
});