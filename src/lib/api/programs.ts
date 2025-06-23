
import type { Program, Department } from '@/types/entities';

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

export const programService = {
  async getAllPrograms(): Promise<Program[]> {
    const response = await fetch(`${API_BASE_URL}/programs`);
    if (!response.ok) {
      throw new Error('Failed to fetch programs');
    }
    return response.json();
  },

  async getProgramById(id: string): Promise<Program> {
    const response = await fetch(`${API_BASE_URL}/programs/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch program with id ${id}`);
    }
    return response.json();
  },

  async createProgram(programData: Omit<Program, 'id'>): Promise<Program> {
    const response = await fetch(`${API_BASE_URL}/programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(programData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create program' }));
      throw new Error(errorData.message || 'Failed to create program');
    }
    return response.json();
  },

  async updateProgram(id: string, programData: Partial<Omit<Program, 'id'>>): Promise<Program> {
    const response = await fetch(`${API_BASE_URL}/programs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(programData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update program' }));
      throw new Error(errorData.message || 'Failed to update program');
    }
    return response.json();
  },

  async deleteProgram(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/programs/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete program with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete program with id ${id}`);
    }
  },

  async importPrograms(file: File, departments: Department[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('departments', JSON.stringify(departments));


    const response = await fetch(`${API_BASE_URL}/programs/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to import programs' }));
      let detailedMessage = errorData.message || 'Failed to import programs';
      if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        detailedMessage += ` Specific issues: ${errorData.errors.slice(0, 3).join('; ')}${errorData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return response.json();
  }
};
