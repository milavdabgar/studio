import type { Committee } from '@/types/entities';
import { committeePermissions } from './roles';
import { permissionUtils } from '@/lib/utils/permissions';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export interface CommitteeCreateData extends Omit<Committee, 'id' | 'createdAt' | 'updatedAt'> {}
export interface CommitteeUpdateData extends Partial<Omit<Committee, 'id' | 'createdAt' | 'updatedAt'>> {}

export interface CommitteeMemberAssignment {
  userId: string;
  role: 'convener' | 'co_convener' | 'member' | 'secretary' | 'coordinator';
  permissions: string[];
  assignmentDate: string;
  endDate?: string;
}

export interface CommitteeWorkflow {
  id: string;
  name: string;
  description?: string;
  steps: CommitteeWorkflowStep[];
  isActive: boolean;
}

export interface CommitteeWorkflowStep {
  stepId: string;
  stepName: string;
  assignedRole: string;
  permissions: string[];
  isRequired: boolean;
  timeLimit?: number;
  nextSteps: string[];
}

export interface CommitteeResource {
  resourceId: string;
  resourceType: 'budget' | 'room' | 'equipment' | 'software' | 'personnel';
  resourceName: string;
  allocatedAmount?: number;
  utilizedAmount?: number;
  startDate?: string;
  endDate?: string;
  status: 'allocated' | 'in_use' | 'completed' | 'expired';
}

export interface CommitteeAnalytics {
  totalMeetings: number;
  totalDecisions: number;
  averageAttendance: number;
  lastMeetingDate?: string;
  nextMeetingDate?: string;
  performanceScore: number;
}

export const committeeService = {
  // Basic CRUD operations
  async getAllCommittees(): Promise<Committee[]> {
    const response = await fetch(`${API_BASE_URL}/committees`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch committees' }));
      throw new Error(errorData.message || 'Failed to fetch committees');
    }
    return response.json();
  },

  async getCommitteeById(id: string): Promise<Committee> {
    const response = await fetch(`${API_BASE_URL}/committees/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch committee with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch committee with id ${id}`);
    }
    return response.json();
  },

  async getCommitteesByType(type: string): Promise<Committee[]> {
    const response = await fetch(`${API_BASE_URL}/committees?type=${type}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch committees of type ${type}` }));
      throw new Error(errorData.message || `Failed to fetch committees of type ${type}`);
    }
    return response.json();
  },

  async createCommittee(committeeData: CommitteeCreateData): Promise<Committee> {
    // Validate committee type and permissions
    if (committeeData.committeeType && committeePermissions[committeeData.committeeType as keyof typeof committeePermissions]) {
      const allowedPermissions = committeePermissions[committeeData.committeeType as keyof typeof committeePermissions].permissions;
      
      // Ensure members have appropriate permissions
      committeeData.members?.forEach(member => {
        if (member.permissions) {
          const validation = permissionUtils.validateCommitteePermissions(committeeData.committeeType, member.permissions);
          if (!validation.valid) {
            throw new Error(`Invalid permissions for committee type ${committeeData.committeeType}: ${validation.invalidPermissions.join(', ')}`);
          }
        }
      });
    }

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

  async updateCommittee(id: string, committeeData: CommitteeUpdateData): Promise<Committee> {
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
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete committee' }));
      throw new Error(errorData.message || 'Failed to delete committee');
    }
  },

  // Member management
  async addCommitteeMember(committeeId: string, memberData: CommitteeMemberAssignment): Promise<Committee> {
    const response = await fetch(`${API_BASE_URL}/committees/${committeeId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memberData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to add committee member' }));
      throw new Error(errorData.message || 'Failed to add committee member');
    }
    return response.json();
  },

  async updateCommitteeMember(committeeId: string, userId: string, memberData: Partial<CommitteeMemberAssignment>): Promise<Committee> {
    const response = await fetch(`${API_BASE_URL}/committees/${committeeId}/members/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memberData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update committee member' }));
      throw new Error(errorData.message || 'Failed to update committee member');
    }
    return response.json();
  },

  async removeCommitteeMember(committeeId: string, userId: string): Promise<Committee> {
    const response = await fetch(`${API_BASE_URL}/committees/${committeeId}/members/${userId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to remove committee member' }));
      throw new Error(errorData.message || 'Failed to remove committee member');
    }
    return response.json();
  },

  // Analytics and reporting
  async getCommitteeAnalytics(committeeId: string): Promise<CommitteeAnalytics> {
    const response = await fetch(`${API_BASE_URL}/committees/${committeeId}/analytics`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch committee analytics' }));
      throw new Error(errorData.message || 'Failed to fetch committee analytics');
    }
    return response.json();
  },

  async getCommitteeDashboardData(committeeId: string): Promise<{
    committee: Committee;
    analytics: CommitteeAnalytics;
    recentActivities: any[];
    upcomingTasks: any[];
  }> {
    const response = await fetch(`${API_BASE_URL}/committees/${committeeId}/dashboard`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch committee dashboard data' }));
      throw new Error(errorData.message || 'Failed to fetch committee dashboard data');
    }
    return response.json();
  },

  // Permission helpers
  getUserCommitteePermissions(committeeType: string, userRole: string): string[] {
    const committee = committeePermissions[committeeType as keyof typeof committeePermissions];
    if (!committee) return [];

    // Return all committee permissions for convener, subset for other roles
    switch (userRole) {
      case 'convener':
        return committee.permissions;
      case 'co_convener':
        return committee.permissions.filter(p => !p.includes('approval')); // No approval permissions
      case 'member':
        return committee.permissions.filter(p => p.includes('view') || p.includes('tracking')); // Read-only permissions
      default:
        return [];
    }
  },

  validateCommitteeAccess(userRoles: string[], committeeType: string, requiredPermission: string): boolean {
    // Check if user has appropriate committee role and permission
    const committeeRole = userRoles.find(role => role.includes(`${committeeType}_`));
    if (!committeeRole) return false;

    const roleType = committeeRole.split('_').pop(); // Extract role type (convener, member, etc.)
    const userPermissions = this.getUserCommitteePermissions(committeeType, roleType || '');
    
    return userPermissions.includes(requiredPermission);
  }
};

export default committeeService;