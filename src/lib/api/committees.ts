
import type { Committee, Institute, SystemUser as User } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const committeeService = {
  async getAllCommittees(): Promise<Committee[]> {
    const response = await fetch(`${API_BASE_URL}/committees`);
    if (!response.ok) {
      throw new Error('Failed to fetch committees');
    }
    return response.json();
  },

  async getCommitteeById(id: string): Promise<Committee> {
    const response = await fetch(`${API_BASE_URL}/committees/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch committee with id ${id}`);
    }
    return response.json();
  },

  async createCommittee(committeeData: Omit<Committee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Committee> {
    const response = await fetch(`${API_BASE_URL}/committees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(committeeData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create committee' }));
      throw new Error(errorData.message || 'Failed to create committee');
    }
    return response.json();
  },

  async updateCommittee(id: string, committeeData: Partial<Omit<Committee, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Committee> {
    const response = await fetch(`${API_BASE_URL}/committees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(committeeData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update committee' }));
      throw new Error(errorData.message || 'Failed to update committee');
    }
    return response.json();
  },

  async deleteCommittee(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/committees/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete committee with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete committee with id ${id}`);
    }
  },

  async importCommittees(file: File, institutes: Institute[], facultyUsers: User[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number; errors?: Array<{ message?: string; data?: unknown; row?: number }> }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('institutes', JSON.stringify(institutes));
    formData.append('facultyUsers', JSON.stringify(facultyUsers));


    const response = await fetch(`${API_BASE_URL}/committees/import`, {
      method: 'POST',
      body: formData,
    });

    const responseData = await response.json();
    if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import committees';
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        detailedMessage += ` Specific issues: ${responseData.errors.slice(0, 3).map((e: { message?: string; data?: unknown }) => { return e.message || JSON.stringify(e.data); }).join('; ')}${responseData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return responseData;
  }
};
