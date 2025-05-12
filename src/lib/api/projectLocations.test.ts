import { projectLocationService } from './projectLocations';
import type { ProjectLocation, Department, ProjectEvent, Project } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Helper to create mock responses
const createMockResponse = (options: { ok: boolean; status?: number; json?: () => Promise<any>; statusText?: string; text?: () => Promise<string> }): Response => {
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
  });

  describe('getLocationById', () => {
    it('should fetch a location by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ data: {location: mockLocation }}) }));
      const result = await projectLocationService.getLocationById('loc1');
      expect(fetch).toHaveBeenCalledWith('/api/project-locations/loc1');
      expect(result).toEqual(mockLocation);
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
  });

  describe('deleteLocation', () => {
    it('should delete a location successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));
      await projectLocationService.deleteLocation('loc1');
      expect(fetch).toHaveBeenCalledWith('/api/project-locations/loc1', expect.objectContaining({ method: 'DELETE' }));
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
  });
  
  describe('unassignProjectFromLocation', () => {
    const unassignedLocation: ProjectLocation = {...mockLocation, projectId: undefined, isAssigned: false};
    it('should unassign a project from location successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, json: async() => ({ data: { location: unassignedLocation }})}));
        const result = await projectLocationService.unassignProjectFromLocation('A-01');
        expect(fetch).toHaveBeenCalledWith('/api/project-locations/A-01/unassign', expect.objectContaining({method: 'PATCH'}));
        expect(result).toEqual(unassignedLocation);
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
  });
  
  describe('exportLocations', () => {
     it('should export locations as CSV text', async () => {
        const csvText = "id,locationId,section\nloc1,A-01,A";
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, text: async() => csvText, json: async() => csvText }));
        const result = await projectLocationService.exportLocations({eventId: 'event1'});
        expect(fetch).toHaveBeenCalledWith('/api/project-locations/export?eventId=event1');
        expect(result).toEqual(csvText);
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
  });

});
