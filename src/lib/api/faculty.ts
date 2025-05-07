
import type { Faculty, SystemUser } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Helper to create a SystemUser from Faculty data
const createSystemUserFromFaculty = (faculty: Faculty): Omit<SystemUser, 'id' | 'password'> & { password?: string } => {
  const name = faculty.gtuName || `${faculty.title || ''} ${faculty.firstName || ''} ${faculty.middleName || ''} ${faculty.lastName || ''}`.replace(/\s+/g, ' ').trim();
  return {
    name: name || faculty.staffCode,
    email: faculty.instituteEmail, // Institute email for login
    roles: ['faculty'], // Default role, can be expanded
    status: faculty.status === 'active' ? 'active' : 'inactive',
    department: faculty.department,
    // Password for new user - can be staffCode or a generated one
    // This will be handled by the backend when creating a new user linked to faculty
  };
};


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

  async createFaculty(facultyData: Omit<Faculty, 'id'>): Promise<Faculty> {
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

  async updateFaculty(id: string, facultyData: Partial<Omit<Faculty, 'id'>>): Promise<Faculty> {
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

  async importFaculty(file: File): Promise<{ newCount: number; updatedCount: number; skippedCount: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/faculty/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to import faculty (standard)' }));
      throw new Error(errorData.message || 'Failed to import faculty (standard)');
    }
    return response.json();
  },

  async importGtuFaculty(file: File): Promise<{ newCount: number; updatedCount: number; skippedCount: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/faculty/import-gtu`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to import GTU faculty data' }));
      throw new Error(errorData.message || 'Failed to import GTU faculty data');
    }
    return response.json();
  }
};
