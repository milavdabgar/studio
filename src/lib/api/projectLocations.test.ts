import { projectLocationService } from './projectLocations';
import type { ProjectLocation, Department } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Helper to create mock responses
const createMockResponse = (options: { ok: boolean; status?: number; json?: () => Promise<unknown>; statusText?: string; text?: () => Promise<string> }): Response => {
  return {
    ok: options.ok,
    status: options.status || (options.ok ? 200 : 500),
    statusText: options.statusText || (options.ok ? 'OK' : 'Error'),
    json: options.json || (async () => ({})),
    text: options.text || (async () => JSON.stringify(await (options.json ? options.json() : {}))),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(options),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    bodyUsed: false,
  } as Response;
};

// Mock fetch globally for all tests in this file
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('ProjectLocationService API Tests', () => {
  const now = new Date().toISOString();
  const mockLocation: ProjectLocation = {
    id: "loc1",
    locationId: "A-01",
    section: "A",
    position: 1,
    department: "dept1",
    eventId: "event1",
    isAssigned: false,
    createdBy: "user1",
    updatedBy: "user1",
    createdAt: now,
    updatedAt: now,
  };
  const mockLocationsResponse = { locations: [mockLocation], pagination: { total: 1, page: 1, limit: 10, pages: 1 } };
  const mockDepartments: Department[] = [{ id: 'dept1', name: 'CS', code: 'CS', instituteId: 'inst1', status: 'active'}];


  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getAllLocations', () => {
    it('should fetch all locations successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ data: mockLocationsResponse }) }));
      const result = await projectLocationService.getAllLocations();
      expect(fetch).toHaveBeenCalledWith('/api/project-locations?');
      expect(result).toEqual(mockLocationsResponse);
    });
    
    it('should fetch locations with filters successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ data: mockLocationsResponse }) }));
      const filters = { eventId: 'event1', isAssigned: false };
      await projectLocationService.getAllLocations(filters);
      expect(fetch).toHaveBeenCalledWith('/api/project-locations?eventId=event1&isAssigned=false');
    });

    it('should handle all filter parameters', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ data: mockLocationsResponse }) }));
      const filters = { eventId: 'event1', department: 'CS', section: 'A', isAssigned: true, page: 2, limit: 20 };
      await projectLocationService.getAllLocations(filters);
      expect(fetch).toHaveBeenCalledWith('/api/project-locations?eventId=event1&department=CS&section=A&isAssigned=true&page=2&limit=20');
    });

    it('should handle direct response structure', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockLocationsResponse }));
      const result = await projectLocationService.getAllLocations();
      expect(result).toEqual(mockLocationsResponse);
    });

    it('should return default pagination for unexpected response structure', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ someOtherData: 'value' }) }));
      const result = await projectLocationService.getAllLocations();
      expect(result).toEqual({ someOtherData: 'value' });
    });

    it('should handle errors when fetching locations', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Server error' }) }));
      await expect(projectLocationService.getAllLocations()).rejects.toThrow('Server error');
    });

    it('should handle errors without message when fetching locations', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectLocationService.getAllLocations()).rejects.toThrow('Failed to fetch project locations');
    });

    it('should handle error response without message property', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectLocationService.getAllLocations()).rejects.toThrow('Failed to fetch project locations');
    });
  });

  describe('getLocationById', () => {
    it('should fetch a location by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ data: {location: mockLocation }}) }));
      const result = await projectLocationService.getLocationById('loc1');
      expect(fetch).toHaveBeenCalledWith('/api/project-locations/loc1');
      expect(result).toEqual(mockLocation);
    });

    it('should handle direct location object response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockLocation }));
      const result = await projectLocationService.getLocationById('loc1');
      expect(result).toEqual(mockLocation);
    });

    it('should handle errors when fetching location by ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Location not found' }) }));
      await expect(projectLocationService.getLocationById('loc999')).rejects.toThrow('Location not found');
    });

    it('should handle errors without message when fetching location by ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectLocationService.getLocationById('loc1')).rejects.toThrow('Failed to fetch project location with id loc1');
    });

    it('should handle error response without message property when fetching location by ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectLocationService.getLocationById('loc1')).rejects.toThrow('Failed to fetch project location with id loc1');
    });
  });

  describe('createLocation', () => {
    const newLocationData: Omit<ProjectLocation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
      locationId: "B-02", section: "B", position: 2, department: "dept2", eventId: "event1", isAssigned: false,
    };
    const createdLocation: ProjectLocation = { ...newLocationData, id: 'loc2', createdBy: 'user1', updatedBy: 'user1', createdAt: now, updatedAt: now };

    it('should create a location successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => ({ data: { location: createdLocation }}) }));
      const result = await projectLocationService.createLocation(newLocationData);
      expect(fetch).toHaveBeenCalledWith('/api/project-locations', expect.objectContaining({ method: 'POST', body: JSON.stringify(newLocationData) }));
      expect(result).toEqual(createdLocation);
    });

    it('should handle direct location object response when creating', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => createdLocation }));
      const result = await projectLocationService.createLocation(newLocationData);
      expect(result).toEqual(createdLocation);
    });

    it('should handle errors when creating location', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Validation failed' }) }));
      await expect(projectLocationService.createLocation(newLocationData)).rejects.toThrow('Validation failed');
    });

    it('should handle errors without message when creating location', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectLocationService.createLocation(newLocationData)).rejects.toThrow('Failed to create project location');
    });

    it('should handle error response without message property when creating location', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectLocationService.createLocation(newLocationData)).rejects.toThrow('Failed to create project location');
    });
  });
  
  describe('createLocationBatch', () => {
    const batchData: Array<Omit<ProjectLocation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>> = [
        { locationId: "C-01", section: "C", position: 1, department: "dept1", eventId: "event1", isAssigned: false },
        { locationId: "C-02", section: "C", position: 2, department: "dept1", eventId: "event1", isAssigned: false },
    ];
    const createdBatchResponse = { count: 2, locations: batchData.map((d,i) => ({...d, id: `loc_batch_${i}`, createdBy: 'user1', updatedBy: 'user1', createdAt: now, updatedAt: now})) };
    
    it('should create a batch of locations successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => ({ data: createdBatchResponse }) }));
      const result = await projectLocationService.createLocationBatch(batchData);
      expect(fetch).toHaveBeenCalledWith('/api/project-locations/batch', expect.objectContaining({ method: 'POST', body: JSON.stringify({ locations: batchData }) }));
      expect(result).toEqual(createdBatchResponse);
    });

    it('should handle direct batch response when creating', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => createdBatchResponse }));
      const result = await projectLocationService.createLocationBatch(batchData);
      expect(result).toEqual(createdBatchResponse);
    });

    it('should handle errors when creating location batch', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Batch creation failed' }) }));
      await expect(projectLocationService.createLocationBatch(batchData)).rejects.toThrow('Batch creation failed');
    });

    it('should handle errors without message when creating location batch', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectLocationService.createLocationBatch(batchData)).rejects.toThrow('Failed to create location batch');
    });

    it('should handle error response without message property when creating location batch', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectLocationService.createLocationBatch(batchData)).rejects.toThrow('Failed to create location batch');
    });
  });

  describe('updateLocation', () => {
    const updateData: Partial<Omit<ProjectLocation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>> = { section: "AA" };
    const updatedLocation: ProjectLocation = { ...mockLocation, section: "AA", updatedAt: new Date().toISOString() };

    it('should update a location successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ data: { location: updatedLocation }}) }));
      const result = await projectLocationService.updateLocation('loc1', updateData);
      expect(fetch).toHaveBeenCalledWith('/api/project-locations/loc1', expect.objectContaining({ method: 'PUT', body: JSON.stringify(updateData) }));
      expect(result).toEqual(updatedLocation);
    });

    it('should handle direct location object response when updating', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => updatedLocation }));
      const result = await projectLocationService.updateLocation('loc1', updateData);
      expect(result).toEqual(updatedLocation);
    });

    it('should handle errors when updating location', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Update failed' }) }));
      await expect(projectLocationService.updateLocation('loc1', updateData)).rejects.toThrow('Update failed');
    });

    it('should handle errors without message when updating location', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectLocationService.updateLocation('loc1', updateData)).rejects.toThrow('Failed to update project location');
    });

    it('should handle error response without message property when updating location', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectLocationService.updateLocation('loc1', updateData)).rejects.toThrow('Failed to update project location');
    });
  });

  describe('deleteLocation', () => {
    it('should delete a location successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));
      await projectLocationService.deleteLocation('loc1');
      expect(fetch).toHaveBeenCalledWith('/api/project-locations/loc1', expect.objectContaining({ method: 'DELETE' }));
    });

    it('should handle errors when deleting location', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Delete failed' }) }));
      await expect(projectLocationService.deleteLocation('loc1')).rejects.toThrow('Delete failed');
    });

    it('should handle errors without message when deleting location', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectLocationService.deleteLocation('loc1')).rejects.toThrow('Failed to delete project location with id loc1');
    });

    it('should handle error response without message property when deleting location', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectLocationService.deleteLocation('loc1')).rejects.toThrow('Failed to delete project location with id loc1');
    });
  });

  describe('assignProjectToLocation', () => {
    const assignedLocation: ProjectLocation = {...mockLocation, projectId: 'proj1', isAssigned: true};
    it('should assign a project to location successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, json: async() => ({ data: { location: assignedLocation }})}));
        const result = await projectLocationService.assignProjectToLocation('A-01', 'proj1');
        expect(fetch).toHaveBeenCalledWith('/api/project-locations/A-01/assign', expect.objectContaining({method: 'PATCH', body: JSON.stringify({projectId: 'proj1'})}));
        expect(result).toEqual(assignedLocation);
    });

    it('should handle direct location object response when assigning', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => assignedLocation }));
        const result = await projectLocationService.assignProjectToLocation('A-01', 'proj1');
        expect(result).toEqual(assignedLocation);
    });

    it('should handle errors when assigning project to location', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Assignment failed' }) }));
        await expect(projectLocationService.assignProjectToLocation('A-01', 'proj1')).rejects.toThrow('Assignment failed');
    });

    it('should handle errors without message when assigning project to location', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
        await expect(projectLocationService.assignProjectToLocation('A-01', 'proj1')).rejects.toThrow('Failed to assign project to location');
    });

    it('should handle error response without message property when assigning project to location', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
        await expect(projectLocationService.assignProjectToLocation('A-01', 'proj1')).rejects.toThrow('Failed to assign project to location');
    });
  });
  
  describe('unassignProjectFromLocation', () => {
    const unassignedLocation: ProjectLocation = {...mockLocation, projectId: undefined, isAssigned: false};
    it('should unassign a project from location successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, json: async() => ({ data: { location: unassignedLocation }})}));
        const result = await projectLocationService.unassignProjectFromLocation('A-01');
        expect(fetch).toHaveBeenCalledWith('/api/project-locations/A-01/unassign', expect.objectContaining({method: 'PATCH'}));
        expect(result).toEqual(unassignedLocation);
    });

    it('should handle direct location object response when unassigning', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => unassignedLocation }));
        const result = await projectLocationService.unassignProjectFromLocation('A-01');
        expect(result).toEqual(unassignedLocation);
    });

    it('should handle errors when unassigning project from location', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Unassignment failed' }) }));
        await expect(projectLocationService.unassignProjectFromLocation('A-01')).rejects.toThrow('Unassignment failed');
    });

    it('should handle errors without message when unassigning project from location', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
        await expect(projectLocationService.unassignProjectFromLocation('A-01')).rejects.toThrow('Failed to unassign project from location');
    });

    it('should handle error response without message property when unassigning project from location', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
        await expect(projectLocationService.unassignProjectFromLocation('A-01')).rejects.toThrow('Failed to unassign project from location');
    });
  });
  
  describe('importLocations', () => {
    const mockFile = new File(['test data'], 'locations.csv', { type: 'text/csv' });
    const mockResponse = { newCount: 1, updatedCount: 0, skippedCount: 0 };

    it('should import locations successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockResponse }));
      const result = await projectLocationService.importLocations(mockFile, 'event1', mockDepartments);
      expect(fetch).toHaveBeenCalledWith('/api/project-locations/import', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
      expect(result).toEqual(mockResponse);
    });

    it('should handle import errors with detailed error messages', async () => {
      const errorResponse = {
        message: 'Import failed',
        errors: [
          { message: 'Row 1: Invalid location ID', data: { row: 1 } },
          { message: 'Row 2: Missing section', data: { row: 2 } },
          { message: 'Row 3: Invalid department', data: { row: 3 } },
          { message: 'Row 4: Duplicate location', data: { row: 4 } }
        ]
      };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      try {
        await projectLocationService.importLocations(mockFile, 'event1', mockDepartments);
        fail('Should have thrown an error');
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(error.message).toBe('Import failed Specific issues: Row 1: Invalid location ID; Row 2: Missing section; Row 3: Invalid department...');
      }
    });

    it('should handle import errors with few error messages', async () => {
      const errorResponse = {
        message: 'Import failed',
        errors: [
          { message: 'Row 1: Invalid location ID', data: { row: 1 } },
          { message: 'Row 2: Missing section', data: { row: 2 } }
        ]
      };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      try {
        await projectLocationService.importLocations(mockFile, 'event1', mockDepartments);
        fail('Should have thrown an error');
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(error.message).toBe('Import failed Specific issues: Row 1: Invalid location ID; Row 2: Missing section');
      }
    });

    it('should handle import errors with errors missing message property', async () => {
      const errorResponse = {
        message: 'Import failed',
        errors: [
          { data: { row: 1, issue: 'missing field' } },
          { message: 'Row 2: Valid error', data: { row: 2 } }
        ]
      };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      try {
        await projectLocationService.importLocations(mockFile, 'event1', mockDepartments);
        fail('Should have thrown an error');
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(error.message).toBe('Import failed Specific issues: {"row":1,"issue":"missing field"}; Row 2: Valid error');
      }
    });

    it('should handle import errors without detailed errors array', async () => {
      const errorResponse = { message: 'Simple import failed' };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      await expect(projectLocationService.importLocations(mockFile, 'event1', mockDepartments))
        .rejects.toThrow('Simple import failed');
    });
  });
  
  describe('exportLocations', () => {
     it('should export locations as CSV text', async () => {
        const csvText = "id,locationId,section\nloc1,A-01,A";
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, text: async() => csvText, json: async() => csvText }));
        const result = await projectLocationService.exportLocations({eventId: 'event1'});
        expect(fetch).toHaveBeenCalledWith('/api/project-locations/export?eventId=event1');
        expect(result).toEqual(csvText);
     });

     it('should export locations without filters', async () => {
        const csvText = "id,locationId,section\nloc1,A-01,A";
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, text: async () => csvText }));
        const result = await projectLocationService.exportLocations();
        expect(fetch).toHaveBeenCalledWith('/api/project-locations/export?');
        expect(result).toEqual(csvText);
     });

     it('should handle export errors', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false }));
        await expect(projectLocationService.exportLocations()).rejects.toThrow('Failed to export project locations to CSV');
     });
  });
  
  describe('autoAssignLocations', () => {
      const mockAutoAssignResponse = { assignments: [{projectId: 'proj1', locationId: 'A-01'}], assignedCount: 1, totalProjectsToAssign:1, totalAvailableLocations: 1};
      it('should auto-assign locations successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, json: async () => ({ data: mockAutoAssignResponse })}));
        const result = await projectLocationService.autoAssignLocations('event1', true);
        expect(fetch).toHaveBeenCalledWith('/api/project-locations/auto-assign', expect.objectContaining({ method: 'POST', body: JSON.stringify({eventId: 'event1', departmentWise: true})}));
        expect(result).toEqual(mockAutoAssignResponse);
      });

      it('should handle default departmentWise parameter', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ data: mockAutoAssignResponse }) }));
        const result = await projectLocationService.autoAssignLocations('event1');
        expect(fetch).toHaveBeenCalledWith('/api/project-locations/auto-assign', expect.objectContaining({ method: 'POST', body: JSON.stringify({ eventId: 'event1', departmentWise: true }) }));
        expect(result).toEqual(mockAutoAssignResponse);
      });

      it('should handle direct auto-assign response', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockAutoAssignResponse }));
        const result = await projectLocationService.autoAssignLocations('event1', false);
        expect(result).toEqual(mockAutoAssignResponse);
      });

      it('should handle errors when auto-assigning locations', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Auto-assign failed' }) }));
        await expect(projectLocationService.autoAssignLocations('event1')).rejects.toThrow('Auto-assign failed');
      });

      it('should handle errors without message when auto-assigning locations', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
        await expect(projectLocationService.autoAssignLocations('event1')).rejects.toThrow('Failed to auto-assign locations');
      });

      it('should handle error response without message property when auto-assigning locations', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
        await expect(projectLocationService.autoAssignLocations('event1')).rejects.toThrow('Failed to auto-assign locations');
      });
  });

});
