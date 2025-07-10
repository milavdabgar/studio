import { instituteService } from './institutes';
import type { Institute } from '@/types/entities';
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

const mockInstitutes: Institute[] = [
  { id: '1', name: 'Institute 1', code: 'INS1', status: 'active' } as Institute,
  { id: '2', name: 'Institute 2', code: 'INS2', status: 'active' } as Institute,
];

describe('Institutes API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllInstitutes', () => {
    it('should fetch all institutes', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockInstitutes
      }));

      const institutes = await instituteService.getAllInstitutes();
      expect(institutes).toEqual(mockInstitutes);
      expect(fetch).toHaveBeenCalledWith('/api/institutes');
    });

    it('should throw an error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      }));

      await expect(instituteService.getAllInstitutes()).rejects.toThrow('Failed to fetch institutes');
    });
  });

  describe('getInstituteById', () => {
    it('should fetch a single institute by id', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockInstitutes[0]
      }));

      const institute = await instituteService.getInstituteById('1');
      expect(institute).toEqual(mockInstitutes[0]);
      expect(fetch).toHaveBeenCalledWith('/api/institutes/1');
    });

    it('should throw an error if institute not found', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }));

      await expect(instituteService.getInstituteById('3')).rejects.toThrow('Failed to fetch institute with id 3');
    });
  });

  describe('createInstitute', () => {
    it('should create a new institute', async () => {
      const newInstituteData = { name: 'New Institute', code: 'NEW', status: 'active' } as Omit<Institute, 'id'>;
      const createdInstitute = { id: '3', ...newInstituteData };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        status: 201,
        json: async () => createdInstitute
      }));

      const institute = await instituteService.createInstitute(newInstituteData);
      expect(institute).toEqual(createdInstitute);
      expect(fetch).toHaveBeenCalledWith('/api/institutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newInstituteData)
      });
    });

    it('should throw an error if creation fails', async () => {
      const newInstituteData = { name: 'New Institute', code: 'NEW', status: 'active' } as Omit<Institute, 'id'>;

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      }));

      await expect(instituteService.createInstitute(newInstituteData)).rejects.toThrow('Failed to create institute');
    });

    it('should handle JSON parsing errors during creation', async () => {
      const newInstituteData = { name: 'New Institute', code: 'NEW', status: 'active' } as Omit<Institute, 'id'>;

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Invalid JSON'); }
      }));

      await expect(instituteService.createInstitute(newInstituteData)).rejects.toThrow('Failed to create institute');
    });
  });

  describe('updateInstitute', () => {
    it('should update an existing institute', async () => {
      const updatedInstituteData = { name: 'Updated Institute', code: 'UPD' };
      const updatedInstitute = { id: '1', ...updatedInstituteData, status: 'active' } as Institute;

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => updatedInstitute
      }));

      const institute = await instituteService.updateInstitute('1', updatedInstituteData);
      expect(institute).toEqual(updatedInstitute);
      expect(fetch).toHaveBeenCalledWith('/api/institutes/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedInstituteData)
      });
    });

    it('should throw an error when updating non-existing institute', async () => {
      const updatedInstituteData = { name: 'Updated Institute', code: 'UPD' };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }));

      await expect(instituteService.updateInstitute('3', updatedInstituteData)).rejects.toThrow('Failed to update institute');
    });

    it('should handle JSON parsing errors during update', async () => {
      const updatedInstituteData = { name: 'Updated Institute', code: 'UPD' };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Invalid JSON'); }
      }));

      await expect(instituteService.updateInstitute('1', updatedInstituteData)).rejects.toThrow('Failed to update institute');
    });
  });

  describe('deleteInstitute', () => {
    it('should delete an institute', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true
      }));

      await instituteService.deleteInstitute('1');
      expect(fetch).toHaveBeenCalledWith('/api/institutes/1', {
        method: 'DELETE'
      });
    });

    it('should throw an error when deleting non-existing institute', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }));

      await expect(instituteService.deleteInstitute('3')).rejects.toThrow('Failed to delete institute with id 3');
    });
  });

  describe('importInstitutes', () => {
    it('should import institutes from file successfully', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      const mockResponse = { newCount: 3, updatedCount: 1, skippedCount: 0 };
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockResponse
      }));

      const result = await instituteService.importInstitutes(mockFile);
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('/api/institutes/import', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });

    it('should throw an error if import fails', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid file format' })
      }));

      await expect(instituteService.importInstitutes(mockFile)).rejects.toThrow('Invalid file format');
    });

    it('should handle JSON parsing errors during import', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Invalid JSON'); }
      }));

      await expect(instituteService.importInstitutes(mockFile)).rejects.toThrow('Failed to import institutes');
    });

    it('should handle detailed error messages with errors array', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ 
          message: 'Validation failed',
          errors: ['Row 1: Name is required', 'Row 2: Invalid code format', 'Row 3: Duplicate entry']
        })
      }));

      await expect(instituteService.importInstitutes(mockFile)).rejects.toThrow('Validation failed Specific issues: Row 1: Name is required; Row 2: Invalid code format; Row 3: Duplicate entry');
    });
  });

  describe('getBaseUrl server-side logic', () => {
    it('should use server-side URL when window is undefined', async () => {
      // Mock server-side environment
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      // Mock environment variables
      const originalEnv = process.env;
      process.env = { ...originalEnv, NEXTAUTH_URL: 'https://example.com' };
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockInstitutes
      }));

      // Re-import the module to trigger getBaseUrl evaluation
      jest.resetModules();
      const { instituteService: serverInstituteService } = await import('./institutes');
      
      await serverInstituteService.getAllInstitutes();
      expect(fetch).toHaveBeenCalledWith('https://example.com/api/institutes');
      
      // Restore original environment
      process.env = originalEnv;
      global.window = originalWindow;
    });
  });
});