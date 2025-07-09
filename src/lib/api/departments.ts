
import type { Department } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// In a real app, userService would also use API calls
// For now, it might still use localStorage or a mock if not yet converted.
// This service assumes userService.getAllUsers() is available for HOD selection on the frontend.

export const departmentService = {
  async getAllDepartments(): Promise<Department[]> {
    const response = await fetch(`${API_BASE_URL}/departments`);
    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }
    return response.json();
  },

  async getDepartmentById(id: string): Promise<Department> {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch department with id ${id}`);
    }
    return response.json();
  },

  async createDepartment(departmentData: Omit<Department, 'id'>): Promise<Department> {
    const response = await fetch(`${API_BASE_URL}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(departmentData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create department' }));
      throw new Error(errorData.message || 'Failed to create department');
    }
    return response.json();
  },

  async updateDepartment(id: string, departmentData: Partial<Omit<Department, 'id'>>): Promise<Department> {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(departmentData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update department' }));
      throw new Error(errorData.message || 'Failed to update department');
    }
    return response.json();
  },

  async deleteDepartment(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
       const errorData = await response.json().catch(() => ({ message: `Failed to delete department with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete department with id ${id}`);
    }
  },

  async importDepartments(file: File): Promise<{ newCount: number; updatedCount: number, skippedCount: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/departments/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to import departments' }));
      let detailedMessage = errorData.message || 'Failed to import departments';
      if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        detailedMessage += ` Specific issues: ${errorData.errors.slice(0, 3).join('; ')}${errorData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return response.json();
  }
};
