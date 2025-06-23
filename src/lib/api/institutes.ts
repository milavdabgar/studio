
import type { Institute } from '@/types/entities';

// Use absolute URL for server-side calls, relative for client-side
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client side - use relative URL
    return '/api';
  }
  // Server side - use absolute URL
  return process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? 
    `${process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}`}/api` : 
    'http://localhost:3000/api';
};

const API_BASE_URL = getBaseUrl();

export const instituteService = {
  async getAllInstitutes(): Promise<Institute[]> {
    const response = await fetch(`${API_BASE_URL}/institutes`);
    if (!response.ok) {
      throw new Error('Failed to fetch institutes');
    }
    return response.json();
  },

  async getInstituteById(id: string): Promise<Institute> {
    const response = await fetch(`${API_BASE_URL}/institutes/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch institute with id ${id}`);
    }
    return response.json();
  },

  async createInstitute(instituteData: Omit<Institute, 'id'>): Promise<Institute> {
    const response = await fetch(`${API_BASE_URL}/institutes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(instituteData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create institute' }));
      throw new Error(errorData.message || 'Failed to create institute');
    }
    return response.json();
  },

  async updateInstitute(id: string, instituteData: Partial<Omit<Institute, 'id'>>): Promise<Institute> {
    const response = await fetch(`${API_BASE_URL}/institutes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(instituteData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update institute' }));
      throw new Error(errorData.message || 'Failed to update institute');
    }
    return response.json();
  },

  async deleteInstitute(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/institutes/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete institute with id ${id}`);
    }
  },

  async importInstitutes(file: File): Promise<{ newCount: number; updatedCount: number, skippedCount: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/institutes/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to import institutes' }));
      let detailedMessage = errorData.message || 'Failed to import institutes';
      if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        detailedMessage += ` Specific issues: ${errorData.errors.slice(0, 3).join('; ')}${errorData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return response.json();
  }
};
