
import type { Role } from '@/types/entities';
// Removed papaparse import as it's not directly used in this service file

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Define all possible permissions in the system. This could also be fetched from an API.
export const allPermissions = [
  "manage_users", "manage_roles", "manage_settings", "view_courses", 
  "submit_assignments", "manage_courses", "grade_assignments", 
  "manage_faculty", "view_department_reports", "evaluate_projects",
  "view_feedback", "generate_reports", "manage_institutes", "manage_buildings",
  "manage_rooms", "manage_departments", "manage_programs"
];


export const roleService = {
  async getAllRoles(): Promise<Role[]> {
    const response = await fetch(`${API_BASE_URL}/roles`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch roles' }));
      throw new Error(errorData.message || 'Failed to fetch roles');
    }
    return response.json();
  },

  async getRoleById(id: string): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch role with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch role with id ${id}`);
    }
    return response.json();
  },

  async createRole(roleData: Omit<Role, 'id'>): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create role' }));
      throw new Error(errorData.message || 'Failed to create role');
    }
    return response.json();
  },

  async updateRole(id: string, roleData: Partial<Omit<Role, 'id'>>): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update role' }));
      throw new Error(errorData.message || 'Failed to update role');
    }
    return response.json();
  },

  async deleteRole(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete role' }));
      throw new Error(errorData.message || 'Failed to delete role');
    }
  },

  async importRoles(file: File): Promise<{ newCount: number; updatedCount: number; skippedCount: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/roles/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to import roles' }));
      let detailedMessage = errorData.message || 'Failed to import roles';
      if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        detailedMessage += ` Specific issues: ${errorData.errors.slice(0, 3).join('; ')}${errorData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return response.json();
  }
};

export default roleService;
