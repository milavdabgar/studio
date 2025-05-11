// src/lib/api/projectLocations.ts
import type { ProjectLocation, Department, ProjectEvent, Project } from '@/types/entities';

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
    // Assuming API returns { data: { locations: [], pagination: {} } } or just { locations: [], pagination: {} }
    return data.data || data || { locations: [], pagination: { total: 0, page: 1, limit: 10, pages: 1 } };
  },

  async getLocationById(id: string): Promise<ProjectLocation> {
    const response = await fetch(`${API_BASE_URL}/project-locations/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch project location with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch project location with id ${id}`);
    }
    return response.json();
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
    return response.json();
  },
  
  async createLocationBatch(batchData: Array<Omit<ProjectLocation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>): Promise<{count: number, locations: ProjectLocation[]}> {
    const response = await fetch(`${API_BASE_URL}/project-locations/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations: batchData }), // Ensure payload matches API expectation if it's an object
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create location batch' }));
        throw new Error(errorData.message || 'Failed to create location batch');
    }
    return response.json();
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
    return response.json();
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

  async assignProjectToLocation(locationId: string, projectId: string): Promise<ProjectLocation> {
    const response = await fetch(`${API_BASE_URL}/project-locations/${locationId}/assign`, {
      method: 'PATCH', // Or POST, depending on API design
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to assign project to location' }));
      throw new Error(errorData.message || 'Failed to assign project to location');
    }
    return response.json();
  },

  async unassignProjectFromLocation(locationId: string): Promise<ProjectLocation> {
    const response = await fetch(`${API_BASE_URL}/project-locations/${locationId}/unassign`, {
      method: 'PATCH', // Or POST
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to unassign project from location' }));
      throw new Error(errorData.message || 'Failed to unassign project from location');
    }
    return response.json();
  },

  async importLocations(file: File, eventId: string, departments: Department[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number, errors?: any[] }> {
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
        detailedMessage += ` Specific issues: ${responseData.errors.slice(0,3).map((e: any) => e.message || JSON.stringify(e.data)).join('; ')}${responseData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return responseData;
  },

  async exportLocations(filters: { eventId?: string } = {}): Promise<string> { // Returns CSV string
    const queryParams = new URLSearchParams();
    if (filters.eventId) queryParams.append('eventId', filters.eventId);
    const response = await fetch(`${API_BASE_URL}/project-locations/export?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to export project locations to CSV');
    }
    return response.text();
  },
  
  async autoAssignLocations(eventId: string, departmentWise: boolean = true): Promise<any> {
     const response = await fetch(`${API_BASE_URL}/project-locations/auto-assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, departmentWise }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to auto-assign locations' }));
      throw new Error(errorData.message || 'Failed to auto-assign locations');
    }
    return response.json();
  }
};
