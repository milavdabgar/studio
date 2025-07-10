import { committeeService } from './committees';
import type { Committee, CommitteeStatus } from '@/types/entities';
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

describe('Committee API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCommittee', () => {
    it('should create a committee', async () => {
      const committeeData: Omit<Committee, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Test Committee',
        code: 'TEST-COMM',
        description: 'Test Description',
        purpose: 'Testing purposes',
        instituteId: '123',
        formationDate: '2023-01-01T00:00:00.000Z',
        status: 'active' as CommitteeStatus
      };

      const createdCommittee: Committee = {
        ...committeeData,
        id: 'new-committee-id',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        status: 201,
        json: async () => createdCommittee
      }));

      const result = await committeeService.createCommittee(committeeData);
      expect(result).toEqual(createdCommittee);
      expect(fetch).toHaveBeenCalledWith('/api/committees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(committeeData)
      });
    });

    it('should handle api error during creation', async () => {
      const committeeData: Omit<Committee, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Test Committee',
        code: 'TEST-COMM',
        description: 'Test Description',
        purpose: 'Testing purposes',
        instituteId: '123',
        formationDate: '2023-01-01T00:00:00.000Z',
        status: 'active' as CommitteeStatus
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Failed to create committee' })
      }));

      await expect(committeeService.createCommittee(committeeData)).rejects.toThrow('Failed to create committee');
    });
  });

  describe('getCommitteeById', () => {
    it('should get a committee by ID', async () => {
      const mockCommittee: Committee = {
        id: 'committee-id',
        name: 'Test Committee',
        code: 'TEST-COMM',
        description: 'Test Description',
        purpose: 'Testing purposes',
        instituteId: '123',
        formationDate: '2023-01-01T00:00:00.000Z',
        status: 'active' as CommitteeStatus,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockCommittee
      }));

      const result = await committeeService.getCommitteeById('committee-id');
      expect(result).toEqual(mockCommittee);
      expect(fetch).toHaveBeenCalledWith('/api/committees/committee-id');
    });

    it('should throw an error if committee is not found', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Failed to fetch committee with id committee-id' })
      }));

      await expect(committeeService.getCommitteeById('committee-id')).rejects.toThrow('Failed to fetch committee with id committee-id');
    });
  });

  describe('getAllCommittees', () => {
    it('should get all committees', async () => {
      const mockCommittees: Committee[] = [
        {
          id: 'committee-id-1',
          name: 'Test Committee 1',
          code: 'TEST-COMM-1',
          description: 'Test Description 1',
          purpose: 'Testing purposes 1',
          instituteId: '123',
          formationDate: '2023-01-01T00:00:00.000Z',
          status: 'active' as CommitteeStatus,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 'committee-id-2',
          name: 'Test Committee 2',
          code: 'TEST-COMM-2',
          description: 'Test Description 2',
          purpose: 'Testing purposes 2',
          instituteId: '123',
          formationDate: '2023-01-01T00:00:00.000Z',
          status: 'inactive' as CommitteeStatus,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
      ];

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockCommittees
      }));

      const result = await committeeService.getAllCommittees();
      expect(result).toEqual(mockCommittees);
      expect(fetch).toHaveBeenCalledWith('/api/committees');
    });

    it('should throw an error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Failed to fetch committees' })
      }));

      await expect(committeeService.getAllCommittees()).rejects.toThrow('Failed to fetch committees');
    });
  });

  describe('updateCommittee', () => {
    it('should update a committee', async () => {
      const updateData: Partial<Committee> = {
        name: 'Updated Committee',
        description: 'Updated Description',
        status: 'active' as CommitteeStatus
      };

      const updatedCommittee: Committee = {
        id: 'committee-id',
        name: 'Updated Committee',
        code: 'TEST-COMM',
        description: 'Updated Description',
        purpose: 'Testing purposes',
        instituteId: '123',
        formationDate: '2023-01-01T00:00:00.000Z',
        status: 'active' as CommitteeStatus,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => updatedCommittee
      }));

      const result = await committeeService.updateCommittee('committee-id', updateData);
      expect(result).toEqual(updatedCommittee);
      expect(fetch).toHaveBeenCalledWith('/api/committees/committee-id', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
    });

    it('should throw an error if update fails', async () => {
      const updateData: Partial<Committee> = {
        name: 'Updated Committee',
        description: 'Updated Description'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Failed to update committee' })
      }));

      await expect(committeeService.updateCommittee('committee-id', updateData)).rejects.toThrow('Failed to update committee');
    });
  });

  describe('deleteCommittee', () => {
    it('should delete a committee', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true
      }));

      await committeeService.deleteCommittee('committee-id');
      expect(fetch).toHaveBeenCalledWith('/api/committees/committee-id', {
        method: 'DELETE'
      });
    });

    it('should throw an error if deletion fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Failed to delete committee with id committee-id' })
      }));

      await expect(committeeService.deleteCommittee('committee-id')).rejects.toThrow('Failed to delete committee with id committee-id');
    });
  });

  describe('importCommittees', () => {
    it('should import committees from a file', async () => {
      const mockFile = new File(['test data'], 'committees.csv', { type: 'text/csv' });
      const mockInstitutes = [{ id: 'inst-1', name: 'Institute 1' }] as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      const mockFacultyUsers = [{ id: 'user-1', name: 'Faculty User 1' }] as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      const mockResponse = { newCount: 3, updatedCount: 1, skippedCount: 0 };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockResponse
      }));

      const result = await committeeService.importCommittees(mockFile, mockInstitutes, mockFacultyUsers);
      expect(result).toEqual(mockResponse);
      
      // Check that FormData was created correctly
      expect(fetch).toHaveBeenCalledWith('/api/committees/import', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });

    it('should throw an error if import fails', async () => {
      const mockFile = new File(['test data'], 'committees.csv', { type: 'text/csv' });
      const mockInstitutes = [{ id: 'inst-1', name: 'Institute 1' }] as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      const mockFacultyUsers = [{ id: 'user-1', name: 'Faculty User 1' }] as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ 
          message: 'Failed to import committees',
          errors: [
            { message: 'Invalid CSV format' },
            { message: 'Missing required fields' }
          ]
        })
      }));

      await expect(committeeService.importCommittees(mockFile, mockInstitutes, mockFacultyUsers)).rejects.toThrow(
        'Failed to import committees Specific issues: Invalid CSV format; Missing required fields'
      );
    });
  });
});
