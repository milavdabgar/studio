
import type { Building, Institute } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const buildingService = {
  async getAllBuildings(): Promise<Building[]> {
    const response = await fetch(`${API_BASE_URL}/buildings`);
    if (!response.ok) {
      throw new Error('Failed to fetch buildings');
    }
    return response.json();
  },

  async getBuildingById(id: string): Promise<Building> {
    const response = await fetch(`${API_BASE_URL}/buildings/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch building with id ${id}`);
    }
    return response.json();
  },

  async createBuilding(buildingData: Omit<Building, 'id'>): Promise<Building> {
    const response = await fetch(`${API_BASE_URL}/buildings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildingData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create building' }));
      throw new Error(errorData.message || 'Failed to create building');
    }
    return response.json();
  },

  async updateBuilding(id: string, buildingData: Partial<Omit<Building, 'id'>>): Promise<Building> {
    const response = await fetch(`${API_BASE_URL}/buildings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildingData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update building' }));
      throw new Error(errorData.message || 'Failed to update building');
    }
    return response.json();
  },

  async deleteBuilding(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/buildings/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete building with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete building with id ${id}`);
    }
  },

  async importBuildings(file: File, institutes: Institute[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('institutes', JSON.stringify(institutes));


    const response = await fetch(`${API_BASE_URL}/buildings/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to import buildings' }));
      let detailedMessage = errorData.message || 'Failed to import buildings';
      if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        detailedMessage += ` Specific issues: ${errorData.errors.slice(0, 3).join('; ')}${errorData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return response.json();
  }
};
