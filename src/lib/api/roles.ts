
import type { Role } from '@/types/entities';
// Removed papaparse import as it's not directly used in this service file

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Define all possible permissions in the system
export const allPermissions = [
  // Core System Permissions
  "manage_users", "manage_roles", "manage_settings", "view_courses", 
  "submit_assignments", "manage_courses", "grade_assignments", 
  "manage_faculty", "view_department_reports", "evaluate_projects",
  "view_feedback", "generate_reports", "manage_institutes", "manage_buildings",
  "manage_rooms", "manage_departments", "manage_programs",
  
  // TPO Committee Permissions
  "placement_management", "company_coordination", "placement_analytics",
  "job_posting_management", "student_placement_tracking", "career_guidance",
  "industry_partnerships", "placement_drive_organization", "interview_scheduling",
  
  // SSIP Committee Permissions
  "innovation_management", "funding_approval", "startup_incubation",
  "patent_management", "mentorship_coordination", "competition_management",
  "innovation_analytics", "funding_tracking", "entrepreneur_guidance",
  
  // Library Committee Permissions
  "library_management", "resource_allocation", "catalog_management",
  "digital_assets", "circulation_control", "user_access_management",
  "budget_planning", "acquisition_management", "usage_analytics",
  
  // IT/CWAN Committee Permissions
  "infrastructure_management", "security_oversight", "network_administration",
  "system_monitoring", "hardware_management", "software_licensing",
  "user_account_management", "backup_management", "technical_support"
];

// Committee-specific permission sets
export const committeePermissions = {
  tpo: {
    name: "Training & Placement Office",
    permissions: [
      "placement_management", "company_coordination", "placement_analytics",
      "job_posting_management", "student_placement_tracking", "career_guidance",
      "industry_partnerships", "placement_drive_organization", "interview_scheduling"
    ]
  },
  ssip: {
    name: "Student Startup & Innovation Policy",
    permissions: [
      "innovation_management", "funding_approval", "startup_incubation",
      "patent_management", "mentorship_coordination", "competition_management",
      "innovation_analytics", "funding_tracking", "entrepreneur_guidance"
    ]
  },
  library: {
    name: "Library Committee",
    permissions: [
      "library_management", "resource_allocation", "catalog_management",
      "digital_assets", "circulation_control", "user_access_management",
      "budget_planning", "acquisition_management", "usage_analytics"
    ]
  },
  it_cwan: {
    name: "IT & Computer Network Administration",
    permissions: [
      "infrastructure_management", "security_oversight", "network_administration",
      "system_monitoring", "hardware_management", "software_licensing",
      "user_account_management", "backup_management", "technical_support"
    ]
  }
};


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
