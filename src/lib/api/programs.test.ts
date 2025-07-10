import { programService } from './programs';
import type { Program } from '@/types/entities';
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

describe('Program API Functions', () => {
  const mockProgram: Program = {
    id: 'test-program-id',
    name: 'Test Program',
    instituteId: 'test-institute-id',
    code: 'TP',
    status: 'active',
    description: 'Test program description',
    departmentId: 'test-department-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPrograms', () => {
    it('should fetch all programs', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => [mockProgram]
      }));

      const result = await programService.getAllPrograms();
      expect(result).toEqual([mockProgram]);
      expect(fetch).toHaveBeenCalledWith('/api/programs');
    });

    it('should throw an error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      }));

      await expect(programService.getAllPrograms()).rejects.toThrow('Failed to fetch programs');
    });
  });

  describe('getProgramById', () => {
    it('should fetch a program by id', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockProgram
      }));

      const result = await programService.getProgramById('test-program-id');
      expect(result).toEqual(mockProgram);
      expect(fetch).toHaveBeenCalledWith('/api/programs/test-program-id');
    });

    it('should throw an error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }));

      await expect(programService.getProgramById('test-program-id')).rejects.toThrow('Failed to fetch program with id test-program-id');
    });
  });

  describe('createProgram', () => {
    it('should create a new program', async () => {
      const newProgramData = {
        name: 'New Test Program',
        code: 'NTP',
        instituteId: 'test-institute-id',
        departmentId: 'test-department-id',
        status: 'active' as Program['status'],
        description: 'New test program description'
      };
      
      const createdProgram = {
        id: 'new-test-program-id',
        ...newProgramData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        status: 201,
        json: async () => createdProgram
      }));

      const result = await programService.createProgram(newProgramData);
      expect(result).toEqual(createdProgram);
      expect(fetch).toHaveBeenCalledWith('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProgramData)
      });
    });

    it('should throw an error if creation fails', async () => {
      const newProgramData = {
        name: 'New Test Program',
        code: 'NTP',
        instituteId: 'test-institute-id',
        departmentId: 'test-department-id',
        status: 'active' as Program['status'],
        description: 'New test program description'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Failed to create program' })
      }));

      await expect(programService.createProgram(newProgramData)).rejects.toThrow('Failed to create program');
    });
  });

  describe('updateProgram', () => {
    it('should update a program', async () => {
      const updateData = { 
        name: 'Updated Test Program',
        description: 'Updated description' 
      };
      
      const updatedProgram = {
        ...mockProgram,
        name: 'Updated Test Program',
        description: 'Updated description',
        updatedAt: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => updatedProgram
      }));

      const result = await programService.updateProgram('test-program-id', updateData);
      expect(result).toEqual(updatedProgram);
      expect(fetch).toHaveBeenCalledWith('/api/programs/test-program-id', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
    });

    it('should throw an error if update fails', async () => {
      const updateData = { name: 'Updated Test Program' };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Failed to update program' })
      }));

      await expect(programService.updateProgram('test-program-id', updateData)).rejects.toThrow('Failed to update program');
    });
  });

  describe('deleteProgram', () => {
    it('should delete a program', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true
      }));

      await programService.deleteProgram('test-program-id');
      expect(fetch).toHaveBeenCalledWith('/api/programs/test-program-id', {
        method: 'DELETE'
      });
    });

    it('should throw an error if deletion fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Failed to delete program with id test-program-id' })
      }));

      await expect(programService.deleteProgram('test-program-id')).rejects.toThrow('Failed to delete program with id test-program-id');
    });
  });

  describe('importPrograms', () => {
    it('should import programs from a file', async () => {
      const mockFile = new File(['test data'], 'programs.csv', { type: 'text/csv' });
      const mockDepartments = [{ id: 'dept-1', name: 'Department 1' }] as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      const mockResponse = { newCount: 5, updatedCount: 2, skippedCount: 1 };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockResponse
      }));

      const result = await programService.importPrograms(mockFile, mockDepartments);
      expect(result).toEqual(mockResponse);
      
      // Check that FormData was created correctly
      expect(fetch).toHaveBeenCalledWith('/api/programs/import', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });

    it('should throw an error if import fails', async () => {
      const mockFile = new File(['test data'], 'programs.csv', { type: 'text/csv' });
      const mockDepartments = [{ id: 'dept-1', name: 'Department 1' }] as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ 
          message: 'Failed to import programs',
          errors: ['Invalid CSV format', 'Missing required fields']
        })
      }));

      await expect(programService.importPrograms(mockFile, mockDepartments)).rejects.toThrow(
        'Failed to import programs Specific issues: Invalid CSV format; Missing required fields'
      );
    });
  });
});