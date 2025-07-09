// src/lib/api/projectLocations.ts
import type { ProjectLocation, Department } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const projectLocationService = {
  async getAllLocations(filters: { 
    eventId?: string, 
    department?: string, 
    section?: string, 
    isAssigned?: boolean, 
    page?: number, 
    limit?: number 
  } = {}): Promise<{ locations: ProjectLocation[], pagination: { total: number, page: number, limit: number, pages: number } }> {
    const queryParams = new URLSearchParams();
    if (filters.eventId) queryParams.append('eventId', filters.eventId);
    if (filters.department) queryParams.append('department', filters.department);
    if (filters.section) queryParams.append('section', filters.section);
    if (filters.isAssigned !== undefined) queryParams.append('isAssigned', String(filters.isAssigned));
    if (filters.page) queryParams.append('page', String(filters.page));
    if (filters.limit) queryParams.append('limit', String(filters.limit));
    
    const response = await fetch(`${API_BASE_URL}/project-locations?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch project locations' }));
      throw new Error(errorData.message || 'Failed to fetch project locations');
    }
    const data = await response.json();
    return data.data || data || { locations: [], pagination: { total: 0, page: 1, limit: 10, pages: 1 } };
  },

  async getLocationById(id: string): Promise<ProjectLocation> {
    const response = await fetch(`${API_BASE_URL}/project-locations/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch project location with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch project location with id ${id}`);
    }
    const responseData = await response.json();
    return responseData.data?.location || responseData;
  },

  async createLocation(locationData: Omit<ProjectLocation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<ProjectLocation> {
    const response = await fetch(`${API_BASE_URL}/project-locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locationData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create project location' }));
      throw new Error(errorData.message || 'Failed to create project location');
    }
    const responseData = await response.json();
    return responseData.data?.location || responseData;
  },
  
  async createLocationBatch(batchData: Array<Omit<ProjectLocation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>): Promise<{count: number, locations: ProjectLocation[], errors?: Record<string, unknown>[]}> {
    const response = await fetch(`${API_BASE_URL}/project-locations/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations: batchData }), 
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create location batch' }));
        throw new Error(errorData.message || 'Failed to create location batch');
    }
    const responseData = await response.json();
    return responseData.data || responseData;
  },

  async updateLocation(id: string, locationData: Partial<Omit<ProjectLocation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>): Promise<ProjectLocation> {
    const response = await fetch(`${API_BASE_URL}/project-locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locationData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update project location' }));
      throw new Error(errorData.message || 'Failed to update project location');
    }
    const responseData = await response.json();
    return responseData.data?.location || responseData;
  },

  async deleteLocation(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/project-locations/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete project location with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete project location with id ${id}`);
    }
  },

  async assignProjectToLocation(locationIdString: string, projectId: string): Promise<ProjectLocation> {
    const response = await fetch(`${API_BASE_URL}/project-locations/${locationIdString}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to assign project to location' }));
      throw new Error(errorData.message || 'Failed to assign project to location');
    }
    const responseData = await response.json();
    return responseData.data?.location || responseData;
  },

  async unassignProjectFromLocation(locationIdString: string): Promise<ProjectLocation> {
    const response = await fetch(`${API_BASE_URL}/project-locations/${locationIdString}/unassign`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to unassign project from location' }));
      throw new Error(errorData.message || 'Failed to unassign project from location');
    }
    const responseData = await response.json();
    return responseData.data?.location || responseData;
  },

  async importLocations(file: File, eventId: string, departments: Department[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number, errors?: Record<string, unknown>[] }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('eventId', eventId);
    formData.append('departments', JSON.stringify(departments));


    const response = await fetch(`${API_BASE_URL}/project-locations/import`, {
      method: 'POST',
      body: formData,
    });
    const responseData = await response.json();
    if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import project locations.';
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        detailedMessage += ` Specific issues: ${responseData.errors.slice(0,3).map((e: Record<string, unknown>) => e.message || JSON.stringify(e.data)).join('; ')}${responseData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return responseData;
  },

  async exportLocations(filters: { eventId?: string } = {}): Promise<string> { 
    const queryParams = new URLSearchParams();
    if (filters.eventId) queryParams.append('eventId', filters.eventId);
    const response = await fetch(`${API_BASE_URL}/project-locations/export?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to export project locations to CSV');
    }
    return response.text();
  },
  
  async autoAssignLocations(eventId: string, departmentWise: boolean = true): Promise<{ assignments: { projectId: string, locationId: string }[], assignedCount: number, totalProjectsToAssign: number, totalAvailableLocations: number }> {
     const response = await fetch(`${API_BASE_URL}/project-locations/auto-assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, departmentWise }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to auto-assign locations' }));
      throw new Error(errorData.message || 'Failed to auto-assign locations');
    }
    const responseData = await response.json();
    return responseData.data || responseData;
  }
};
