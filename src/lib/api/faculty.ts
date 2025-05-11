
import type { Faculty } from '@/types/entities';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const facultyService = {
  async getAllFaculty(): Promise<Faculty[]> {
    const response = await fetch(`${API_BASE_URL}/faculty`);
    if (!response.ok) {
      throw new Error('Failed to fetch faculty list');
    }
    return response.json();
  },

  async getFacultyById(id: string): Promise<Faculty> {
    const response = await fetch(`${API_BASE_URL}/faculty/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch faculty with id ${id}`);
    }
    return response.json();
  },

  async createFaculty(facultyData: Omit<Faculty, 'id' | 'userId'> & { instituteId?: string }): Promise<Faculty> {
    // instituteId is passed to backend to determine domain for instituteEmail for the User
    const response = await fetch(`${API_BASE_URL}/faculty`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(facultyData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create faculty' }));
      throw new Error(errorData.message || 'Failed to create faculty');
    }
    return response.json();
  },

  async updateFaculty(id: string, facultyData: Partial<Omit<Faculty, 'id'>> & { instituteId?: string }): Promise<Faculty> {
    const response = await fetch(`${API_BASE_URL}/faculty/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(facultyData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update faculty' }));
      throw new Error(errorData.message || 'Failed to update faculty');
    }
    return response.json();
  },

  async deleteFaculty(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/faculty/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete faculty with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete faculty with id ${id}`);
    }
  },

  async importFaculty(file: File, instituteId?: string): Promise<{ newCount: number; updatedCount: number; skippedCount: number; errors?: Array<{ message: string; data?: unknown; row?: number }> }> {
    const formData = new FormData();
    formData.append('file', file);
    if (instituteId) formData.append('instituteId', instituteId); // Pass institute context if available

    const response = await fetch(`${API_BASE_URL}/faculty/import`, {
      method: 'POST',
      body: formData,
    });
    const responseData = await response.json();
    if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import faculty (standard)';
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        detailedMessage += ` Specific issues: ${responseData.errors.slice(0,3).map((e: { message?: string; data?: unknown }) => { return e.message || JSON.stringify(e.data); }).join('; ')}${responseData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return responseData;
  },

  async importGtuFaculty(file: File, instituteId?: string): Promise<{ newCount: number; updatedCount: number; skippedCount: number; errors?: Array<{ message: string; data?: unknown; row?: number }> }> {
    const formData = new FormData();
    formData.append('file', file);
    if (instituteId) formData.append('instituteId', instituteId);

    const response = await fetch(`${API_BASE_URL}/faculty/import-gtu`, {
      method: 'POST',
      body: formData,
    });
    const responseData = await response.json();
    if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import GTU faculty data';
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
         detailedMessage += ` Specific issues: ${responseData.errors.slice(0,3).map((e: { message?: string; data?: unknown }) => { return e.message || JSON.stringify(e.data); }).join('; ')}${responseData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return responseData;
  }
};
