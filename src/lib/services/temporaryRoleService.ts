import type { UserRole as UserRoleCode } from '@/types/entities';

export interface TemporaryRoleAssignment {
  id: string;
  userId: string;
  roleCode: UserRoleCode;
  assignedBy: string;
  assignedAt: Date;
  expiresAt: Date;
  reason: string;
  status: 'active' | 'expired' | 'revoked' | 'pending';
  approvedBy?: string;
  approvedAt?: Date;
  revokedBy?: string;
  revokedAt?: Date;
  metadata?: {
    committeeId?: string;
    departmentId?: string;
    instituteId?: string;
    projectId?: string;
    emergency?: boolean;
    autoRevoke?: boolean;
  };
}

export interface TemporaryRoleRequest {
  userId: string;
  roleCode: UserRoleCode;
  duration: number; // in hours
  reason: string;
  justification: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  metadata?: {
    committeeId?: string;
    departmentId?: string;
    instituteId?: string;
    projectId?: string;
  };
}

export interface TemporaryRoleStats {
  totalActive: number;
  totalExpired: number;
  totalRevoked: number;
  expiringIn24Hours: number;
  pendingApproval: number;
  emergencyAssignments: number;
  byRole: Record<string, number>;
  byDuration: {
    shortTerm: number; // < 24 hours
    mediumTerm: number; // 1-7 days
    longTerm: number; // > 7 days
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const temporaryRoleService = {
  // Create temporary role assignment
  async createTemporaryAssignment(request: TemporaryRoleRequest): Promise<TemporaryRoleAssignment> {
    const response = await fetch(`${API_BASE_URL}/temporary-roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create temporary role assignment' }));
      throw new Error(errorData.message || 'Failed to create temporary role assignment');
    }
    
    return response.json();
  },

  // Get all temporary role assignments
  async getAllTemporaryAssignments(filters?: {
    status?: TemporaryRoleAssignment['status'];
    roleCode?: UserRoleCode;
    userId?: string;
    expiringBefore?: Date;
    assignedAfter?: Date;
  }): Promise<TemporaryRoleAssignment[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/temporary-roles?${queryParams}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch temporary assignments' }));
      throw new Error(errorData.message || 'Failed to fetch temporary assignments');
    }
    
    return response.json();
  },

  // Get temporary assignment by ID
  async getTemporaryAssignmentById(id: string): Promise<TemporaryRoleAssignment> {
    const response = await fetch(`${API_BASE_URL}/temporary-roles/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch temporary assignment ${id}` }));
      throw new Error(errorData.message || `Failed to fetch temporary assignment ${id}`);
    }
    
    return response.json();
  },

  // Get user's temporary assignments
  async getUserTemporaryAssignments(userId: string): Promise<TemporaryRoleAssignment[]> {
    const response = await fetch(`${API_BASE_URL}/temporary-roles/user/${userId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user temporary assignments' }));
      throw new Error(errorData.message || 'Failed to fetch user temporary assignments');
    }
    
    return response.json();
  },

  // Approve temporary assignment
  async approveTemporaryAssignment(id: string, approvedBy: string): Promise<TemporaryRoleAssignment> {
    const response = await fetch(`${API_BASE_URL}/temporary-roles/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ approvedBy }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to approve temporary assignment' }));
      throw new Error(errorData.message || 'Failed to approve temporary assignment');
    }
    
    return response.json();
  },

  // Revoke temporary assignment
  async revokeTemporaryAssignment(id: string, revokedBy: string, reason?: string): Promise<TemporaryRoleAssignment> {
    const response = await fetch(`${API_BASE_URL}/temporary-roles/${id}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ revokedBy, reason }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to revoke temporary assignment' }));
      throw new Error(errorData.message || 'Failed to revoke temporary assignment');
    }
    
    return response.json();
  },

  // Extend temporary assignment
  async extendTemporaryAssignment(id: string, newExpiryDate: Date, reason: string): Promise<TemporaryRoleAssignment> {
    const response = await fetch(`${API_BASE_URL}/temporary-roles/${id}/extend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        expiresAt: newExpiryDate.toISOString(),
        reason 
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to extend temporary assignment' }));
      throw new Error(errorData.message || 'Failed to extend temporary assignment');
    }
    
    return response.json();
  },

  // Check and process expired assignments
  async processExpiredAssignments(): Promise<{ processed: number; errors: string[] }> {
    const response = await fetch(`${API_BASE_URL}/temporary-roles/process-expired`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to process expired assignments' }));
      throw new Error(errorData.message || 'Failed to process expired assignments');
    }
    
    return response.json();
  },

  // Get temporary role statistics
  async getTemporaryRoleStats(): Promise<TemporaryRoleStats> {
    const response = await fetch(`${API_BASE_URL}/temporary-roles/stats`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch temporary role statistics' }));
      throw new Error(errorData.message || 'Failed to fetch temporary role statistics');
    }
    
    return response.json();
  },

  // Utility functions
  utils: {
    // Check if assignment is expiring soon
    isExpiringSoon(assignment: TemporaryRoleAssignment, hoursThreshold = 24): boolean {
      const now = new Date();
      const expiryTime = new Date(assignment.expiresAt);
      const timeDiff = expiryTime.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      return hoursDiff <= hoursThreshold && hoursDiff > 0;
    },

    // Check if assignment is expired
    isExpired(assignment: TemporaryRoleAssignment): boolean {
      return new Date(assignment.expiresAt) < new Date();
    },

    // Get remaining time in human readable format
    getRemainingTime(assignment: TemporaryRoleAssignment): string {
      const now = new Date();
      const expiryTime = new Date(assignment.expiresAt);
      const timeDiff = expiryTime.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        return 'Expired';
      }
      
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        return `${days} day${days !== 1 ? 's' : ''} ${hours % 24}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    },

    // Calculate assignment duration category
    getDurationCategory(assignment: TemporaryRoleAssignment): 'short' | 'medium' | 'long' {
      const assignedTime = new Date(assignment.assignedAt);
      const expiryTime = new Date(assignment.expiresAt);
      const durationHours = (expiryTime.getTime() - assignedTime.getTime()) / (1000 * 60 * 60);
      
      if (durationHours < 24) return 'short';
      if (durationHours <= 168) return 'medium'; // 7 days
      return 'long';
    },

    // Generate assignment summary
    getAssignmentSummary(assignment: TemporaryRoleAssignment): string {
      const duration = this.getRemainingTime(assignment);
      const urgency = assignment.metadata?.emergency ? ' (Emergency)' : '';
      
      return `${assignment.roleCode} - ${duration}${urgency}`;
    },

    // Validate assignment request
    validateRequest(request: TemporaryRoleRequest): { valid: boolean; errors: string[] } {
      const errors: string[] = [];
      
      if (!request.userId?.trim()) {
        errors.push('User ID is required');
      }
      
      if (!request.roleCode?.trim()) {
        errors.push('Role code is required');
      }
      
      if (!request.reason?.trim()) {
        errors.push('Reason is required');
      }
      
      if (!request.justification?.trim()) {
        errors.push('Justification is required');
      }
      
      if (request.duration <= 0) {
        errors.push('Duration must be greater than 0');
      }
      
      if (request.duration > 8760) { // 1 year in hours
        errors.push('Duration cannot exceed 1 year');
      }
      
      if (request.urgency === 'emergency' && request.duration > 168) { // 7 days
        errors.push('Emergency assignments cannot exceed 7 days');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
  }
};

export default temporaryRoleService;