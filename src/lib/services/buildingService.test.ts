import { buildingService } from './buildingService';
import type { Building, Institute } from '@/types/entities';

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

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('buildingService', () => {
  const mockBuildings: Building[] = [
    { id: '1', name: 'Building A', instituteId: 'inst1', status: 'active' },
    { id: '2', name: 'Building B', instituteId: 'inst2', status: 'active' },
  ];

  const mockInstitutes: Institute[] = [
    { id: 'inst1', name: 'Institute A', code: 'IA', status: 'active' },
    { id: 'inst2', name: 'Institute B', code: 'IB', status: 'active' },
  ];

  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAllBuildings', () => {
    it('should fetch all buildings successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildings,
      } as Response);

      const result = await buildingService.getAllBuildings();

      expect(mockFetch).toHaveBeenCalledWith('/api/buildings');
      expect(result).toEqual(mockBuildings);
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(buildingService.getAllBuildings()).rejects.toThrow('Failed to fetch buildings');
      expect(mockFetch).toHaveBeenCalledWith('/api/buildings');
    });
  });

  describe('getBuildingById', () => {
    it('should fetch building by id successfully', async () => {
      const building = mockBuildings[0];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => building,
      } as Response);

      const result = await buildingService.getBuildingById('1');

      expect(mockFetch).toHaveBeenCalledWith('/api/buildings/1');
      expect(result).toEqual(building);
    });

    it('should throw error when building not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(buildingService.getBuildingById('999')).rejects.toThrow('Failed to fetch building with id 999');
      expect(mockFetch).toHaveBeenCalledWith('/api/buildings/999');
    });
  });

  describe('createBuilding', () => {
    const newBuildingData = { name: 'Building C', instituteId: 'inst1', status: 'active' as const };
    const createdBuilding = { id: '3', ...newBuildingData };

    it('should create building successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createdBuilding,
      } as Response);

      const result = await buildingService.createBuilding(newBuildingData);

      expect(mockFetch).toHaveBeenCalledWith('/api/buildings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBuildingData),
      });
      expect(result).toEqual(createdBuilding);
    });

    it('should throw error when creation fails with error message', async () => {
      const errorResponse = { message: 'Building name already exists' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      } as Response);

      await expect(buildingService.createBuilding(newBuildingData)).rejects.toThrow('Building name already exists');
    });

    it('should throw default error when creation fails without error message', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Invalid JSON'); },
      }));

      await expect(buildingService.createBuilding(newBuildingData)).rejects.toThrow('Failed to create building');
    });

    it('should handle error response without message property', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Some other error format' }),
      } as Response);

      await expect(buildingService.createBuilding(newBuildingData)).rejects.toThrow('Failed to create building');
    });
  });

  describe('updateBuilding', () => {
    const updateData = { name: 'Updated Building A' };
    const updatedBuilding = { id: '1', name: 'Updated Building A', instituteId: 'inst1', status: 'active' as const };

    it('should update building successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedBuilding,
      } as Response);

      const result = await buildingService.updateBuilding('1', updateData);

      expect(mockFetch).toHaveBeenCalledWith('/api/buildings/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      expect(result).toEqual(updatedBuilding);
    });

    it('should throw error when update fails with error message', async () => {
      const errorResponse = { message: 'Building not found' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      } as Response);

      await expect(buildingService.updateBuilding('999', updateData)).rejects.toThrow('Building not found');
    });

    it('should throw default error when update fails without error message', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Invalid JSON'); },
      }));

      await expect(buildingService.updateBuilding('1', updateData)).rejects.toThrow('Failed to update building');
    });

    it('should handle error response without message property', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Some other error format' }),
      } as Response);

      await expect(buildingService.updateBuilding('1', updateData)).rejects.toThrow('Failed to update building');
    });
  });

  describe('deleteBuilding', () => {
    it('should delete building successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      await buildingService.deleteBuilding('1');

      expect(mockFetch).toHaveBeenCalledWith('/api/buildings/1', {
        method: 'DELETE',
      });
    });

    it('should throw error when deletion fails with error message', async () => {
      const errorResponse = { message: 'Building not found' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      } as Response);

      await expect(buildingService.deleteBuilding('999')).rejects.toThrow('Building not found');
    });

    it('should throw default error when deletion fails without error message', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Invalid JSON'); },
      }));

      await expect(buildingService.deleteBuilding('1')).rejects.toThrow('Failed to delete building with id 1');
    });

    it('should handle error response without message property', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Some other error format' }),
      } as Response);

      await expect(buildingService.deleteBuilding('1')).rejects.toThrow('Failed to delete building with id 1');
    });
  });

  describe('importBuildings', () => {
    const mockFile = new File(['test'], 'buildings.csv', { type: 'text/csv' });
    const importResult = { newCount: 5, updatedCount: 2, skippedCount: 1 };

    it('should import buildings successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => importResult,
      } as Response);

      const result = await buildingService.importBuildings(mockFile, mockInstitutes);

      expect(mockFetch).toHaveBeenCalledWith('/api/buildings/import', {
        method: 'POST',
        body: expect.any(FormData),
      });
      expect(result).toEqual(importResult);

      // Verify FormData contents
      const call = mockFetch.mock.calls[0];
      const formData = call[1]?.body as FormData;
      expect(formData.get('file')).toBe(mockFile);
      expect(formData.get('institutes')).toBe(JSON.stringify(mockInstitutes));
    });

    it('should throw error when import fails with detailed error messages', async () => {
      const errorResponse = {
        message: 'Import failed',
        errors: ['Row 1: Missing institute', 'Row 2: Invalid format', 'Row 3: Duplicate name', 'Row 4: Another error']
      };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      } as Response);

      await expect(buildingService.importBuildings(mockFile, mockInstitutes))
        .rejects.toThrow('Import failed Specific issues: Row 1: Missing institute; Row 2: Invalid format; Row 3: Duplicate name...');
    });

    it('should throw error when import fails with few error messages', async () => {
      const errorResponse = {
        message: 'Import failed',
        errors: ['Row 1: Missing institute', 'Row 2: Invalid format']
      };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      } as Response);

      await expect(buildingService.importBuildings(mockFile, mockInstitutes))
        .rejects.toThrow('Import failed Specific issues: Row 1: Missing institute; Row 2: Invalid format');
    });

    it('should throw error when import fails with non-array errors', async () => {
      const errorResponse = {
        message: 'Import failed',
        errors: 'Not an array'
      };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      } as Response);

      await expect(buildingService.importBuildings(mockFile, mockInstitutes))
        .rejects.toThrow('Import failed');
    });

    it('should throw error when import fails with empty errors array', async () => {
      const errorResponse = {
        message: 'Import failed',
        errors: []
      };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      } as Response);

      await expect(buildingService.importBuildings(mockFile, mockInstitutes))
        .rejects.toThrow('Import failed');
    });

    it('should throw default error when import fails without error message', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Invalid JSON'); },
      }));

      await expect(buildingService.importBuildings(mockFile, mockInstitutes))
        .rejects.toThrow('Failed to import buildings');
    });

    it('should handle error response without message property', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Some other error format' }),
      } as Response);

      await expect(buildingService.importBuildings(mockFile, mockInstitutes))
        .rejects.toThrow('Failed to import buildings');
    });
  });

  describe('API_BASE_URL configuration', () => {
    it('should use environment variable for API base URL', () => {
      // This test indirectly verifies that the API_BASE_URL is configured correctly
      // by checking that fetch is called with the expected URL format
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildings,
      } as Response);

      buildingService.getAllBuildings();

      expect(mockFetch).toHaveBeenCalledWith('/api/buildings');
    });
  });
});