import type { UserRole as UserRoleCode } from '@/types/entities';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: UserRoleCode;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: AuditCategory;
  tags: string[];
  metadata?: {
    departmentId?: string;
    instituteId?: string;
    committeeId?: string;
    relatedEntities?: { type: string; id: string }[];
  };
}

export type AuditAction = 
  // Authentication actions
  | 'user_login' | 'user_logout' | 'user_login_failed' | 'password_change' | 'password_reset'
  // Role management actions
  | 'role_assigned' | 'role_revoked' | 'role_modified' | 'role_switched' | 'temporary_role_created' | 'temporary_role_expired'
  // Permission actions
  | 'permission_granted' | 'permission_revoked' | 'permission_denied'
  // Data actions
  | 'data_created' | 'data_updated' | 'data_deleted' | 'data_viewed' | 'data_exported' | 'data_imported'
  // System actions
  | 'system_config_changed' | 'system_maintenance' | 'system_backup' | 'system_restore'
  // Committee actions
  | 'committee_created' | 'committee_modified' | 'committee_dissolved' | 'member_added' | 'member_removed'
  // Administrative actions
  | 'admin_action' | 'bulk_operation' | 'approval_granted' | 'approval_denied'
  // Security actions
  | 'security_violation' | 'suspicious_activity' | 'access_denied' | 'policy_violation';

export type AuditCategory = 
  | 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system_administration'
  | 'user_management' | 'role_management' | 'committee_management' | 'security' | 'compliance';

export interface AuditLogFilter {
  userId?: string;
  userRole?: UserRoleCode;
  action?: AuditAction;
  resource?: string;
  category?: AuditCategory;
  severity?: AuditLogEntry['severity'];
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  tags?: string[];
  searchQuery?: string;
}

export interface AuditLogStats {
  totalEntries: number;
  entriesLast24Hours: number;
  entriesLastWeek: number;
  entriesLastMonth: number;
  byCategory: Record<AuditCategory, number>;
  bySeverity: Record<AuditLogEntry['severity'], number>;
  byAction: Record<string, number>;
  topUsers: { userId: string; userName: string; count: number }[];
  topResources: { resource: string; count: number }[];
  securityEvents: number;
  failureRate: number;
}

export interface AuditLogExportOptions {
  format: 'csv' | 'json' | 'pdf';
  filters?: AuditLogFilter;
  includeMetadata?: boolean;
  dateRange?: { start: Date; end: Date };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const auditLogService = {
  // Create audit log entry
  async logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const response = await fetch(`${API_BASE_URL}/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...entry,
        timestamp: new Date().toISOString()
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create audit log entry' }));
      throw new Error(errorData.message || 'Failed to create audit log entry');
    }
    
    return response.json();
  },

  // Get audit logs with filtering
  async getAuditLogs(filters?: AuditLogFilter, page = 1, limit = 50): Promise<{
    entries: AuditLogEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, String(v)));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/audit-logs?${queryParams}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch audit logs' }));
      throw new Error(errorData.message || 'Failed to fetch audit logs');
    }
    
    return response.json();
  },

  // Get audit log by ID
  async getAuditLogById(id: string): Promise<AuditLogEntry> {
    const response = await fetch(`${API_BASE_URL}/audit-logs/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch audit log ${id}` }));
      throw new Error(errorData.message || `Failed to fetch audit log ${id}`);
    }
    
    return response.json();
  },

  // Get audit log statistics
  async getAuditLogStats(dateRange?: { start: Date; end: Date }): Promise<AuditLogStats> {
    const queryParams = new URLSearchParams();
    
    if (dateRange) {
      queryParams.append('startDate', dateRange.start.toISOString());
      queryParams.append('endDate', dateRange.end.toISOString());
    }
    
    const response = await fetch(`${API_BASE_URL}/audit-logs/stats?${queryParams}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch audit log statistics' }));
      throw new Error(errorData.message || 'Failed to fetch audit log statistics');
    }
    
    return response.json();
  },

  // Export audit logs
  async exportAuditLogs(options: AuditLogExportOptions): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/audit-logs/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to export audit logs' }));
      throw new Error(errorData.message || 'Failed to export audit logs');
    }
    
    return response.blob();
  },

  // Get user activity timeline
  async getUserActivityTimeline(userId: string, days = 30): Promise<AuditLogEntry[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const response = await fetch(`${API_BASE_URL}/audit-logs/user/${userId}/timeline?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user activity timeline' }));
      throw new Error(errorData.message || 'Failed to fetch user activity timeline');
    }
    
    return response.json();
  },

  // Get security events
  async getSecurityEvents(hours = 24): Promise<AuditLogEntry[]> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);
    
    const filters: AuditLogFilter = {
      category: 'security',
      startDate,
      severity: 'high'
    };
    
    const result = await this.getAuditLogs(filters, 1, 100);
    return result.entries;
  },

  // Get recent failures
  async getRecentFailures(hours = 24): Promise<AuditLogEntry[]> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);
    
    const filters: AuditLogFilter = {
      success: false,
      startDate
    };
    
    const result = await this.getAuditLogs(filters, 1, 100);
    return result.entries;
  },

  // Search audit logs
  async searchAuditLogs(query: string, filters?: Partial<AuditLogFilter>): Promise<AuditLogEntry[]> {
    const searchFilters: AuditLogFilter = {
      ...filters,
      searchQuery: query
    };
    
    const result = await this.getAuditLogs(searchFilters, 1, 100);
    return result.entries;
  },

  // Helper functions for common logging scenarios
  helpers: {
    // Log user authentication
    async logAuthentication(
      userId: string,
      userName: string,
      action: 'user_login' | 'user_logout' | 'user_login_failed',
      success: boolean,
      details: Record<string, any> = {},
      ipAddress?: string,
      userAgent?: string
    ): Promise<AuditLogEntry> {
      return auditLogService.logAction({
        userId,
        userName,
        userRole: 'unknown',
        action,
        resource: 'authentication',
        details,
        ipAddress,
        userAgent,
        success,
        severity: success ? 'low' : 'medium',
        category: 'authentication',
        tags: ['auth', action]
      });
    },

    // Log role changes
    async logRoleChange(
      userId: string,
      userName: string,
      currentRole: UserRoleCode,
      action: 'role_assigned' | 'role_revoked' | 'role_switched',
      targetRole: UserRoleCode,
      assignedBy?: string,
      details: Record<string, any> = {}
    ): Promise<AuditLogEntry> {
      return auditLogService.logAction({
        userId,
        userName,
        userRole: currentRole,
        action,
        resource: 'user_roles',
        resourceId: userId,
        details: {
          targetRole,
          assignedBy,
          ...details
        },
        success: true,
        severity: 'medium',
        category: 'role_management',
        tags: ['role', action, targetRole]
      });
    },

    // Log data access
    async logDataAccess(
      userId: string,
      userName: string,
      userRole: UserRoleCode,
      action: 'data_viewed' | 'data_exported' | 'data_imported',
      resource: string,
      resourceId?: string,
      details: Record<string, any> = {}
    ): Promise<AuditLogEntry> {
      return auditLogService.logAction({
        userId,
        userName,
        userRole,
        action,
        resource,
        resourceId,
        details,
        success: true,
        severity: action === 'data_exported' ? 'medium' : 'low',
        category: 'data_access',
        tags: ['data', action, resource]
      });
    },

    // Log data modifications
    async logDataModification(
      userId: string,
      userName: string,
      userRole: UserRoleCode,
      action: 'data_created' | 'data_updated' | 'data_deleted',
      resource: string,
      resourceId?: string,
      oldData?: Record<string, any>,
      newData?: Record<string, any>
    ): Promise<AuditLogEntry> {
      return auditLogService.logAction({
        userId,
        userName,
        userRole,
        action,
        resource,
        resourceId,
        details: {
          oldData,
          newData,
          changes: oldData && newData ? auditLogService.utils.getChanges(oldData, newData) : undefined
        },
        success: true,
        severity: action === 'data_deleted' ? 'high' : 'medium',
        category: 'data_modification',
        tags: ['data', action, resource]
      });
    },

    // Log security events
    async logSecurityEvent(
      userId: string,
      userName: string,
      userRole: UserRoleCode,
      action: 'security_violation' | 'suspicious_activity' | 'access_denied' | 'policy_violation',
      resource: string,
      details: Record<string, any> = {},
      ipAddress?: string
    ): Promise<AuditLogEntry> {
      return auditLogService.logAction({
        userId,
        userName,
        userRole,
        action,
        resource,
        details,
        ipAddress,
        success: false,
        severity: 'critical',
        category: 'security',
        tags: ['security', action, 'alert']
      });
    },

    // Log committee activities
    async logCommitteeActivity(
      userId: string,
      userName: string,
      userRole: UserRoleCode,
      action: 'committee_created' | 'committee_modified' | 'committee_dissolved' | 'member_added' | 'member_removed',
      committeeId: string,
      details: Record<string, any> = {}
    ): Promise<AuditLogEntry> {
      return auditLogService.logAction({
        userId,
        userName,
        userRole,
        action,
        resource: 'committee',
        resourceId: committeeId,
        details,
        success: true,
        severity: 'medium',
        category: 'committee_management',
        tags: ['committee', action],
        metadata: {
          committeeId
        }
      });
    },

    // Log administrative actions
    async logAdminAction(
      userId: string,
      userName: string,
      userRole: UserRoleCode,
      action: 'admin_action' | 'bulk_operation' | 'system_config_changed',
      resource: string,
      details: Record<string, any> = {}
    ): Promise<AuditLogEntry> {
      return auditLogService.logAction({
        userId,
        userName,
        userRole,
        action,
        resource,
        details,
        success: true,
        severity: 'high',
        category: 'system_administration',
        tags: ['admin', action, resource]
      });
    }
  },

  // Utility functions
  utils: {
    // Get changes between old and new data
    getChanges(oldData: Record<string, any>, newData: Record<string, any>): Record<string, { old: any; new: any }> {
      const changes: Record<string, { old: any; new: any }> = {};
      
      // Check for modified and new fields
      Object.keys(newData).forEach(key => {
        if (oldData[key] !== newData[key]) {
          changes[key] = { old: oldData[key], new: newData[key] };
        }
      });
      
      // Check for deleted fields
      Object.keys(oldData).forEach(key => {
        if (!(key in newData)) {
          changes[key] = { old: oldData[key], new: undefined };
        }
      });
      
      return changes;
    },

    // Format audit log entry for display
    formatLogEntry(entry: AuditLogEntry): string {
      const timestamp = new Date(entry.timestamp).toLocaleString();
      const action = entry.action.replace(/_/g, ' ').toUpperCase();
      const success = entry.success ? 'SUCCESS' : 'FAILED';
      
      return `[${timestamp}] ${entry.userName} (${entry.userRole}) ${action} on ${entry.resource} - ${success}`;
    },

    // Get severity color
    getSeverityColor(severity: AuditLogEntry['severity']): string {
      switch (severity) {
        case 'low': return 'text-green-600';
        case 'medium': return 'text-yellow-600';
        case 'high': return 'text-orange-600';
        case 'critical': return 'text-red-600';
        default: return 'text-gray-600';
      }
    },

    // Get category icon
    getCategoryIcon(category: AuditCategory): string {
      switch (category) {
        case 'authentication': return '🔑';
        case 'authorization': return '🛡️';
        case 'data_access': return '👁️';
        case 'data_modification': return '✏️';
        case 'system_administration': return '⚙️';
        case 'user_management': return '👥';
        case 'role_management': return '🎭';
        case 'committee_management': return '🏛️';
        case 'security': return '🚨';
        case 'compliance': return '📋';
        default: return '📝';
      }
    },

    // Check if entry is a security concern
    isSecurityConcern(entry: AuditLogEntry): boolean {
      return entry.category === 'security' || 
             entry.severity === 'critical' || 
             !entry.success && ['user_login_failed', 'access_denied', 'permission_denied'].includes(entry.action);
    },

    // Generate audit report summary
    generateReportSummary(entries: AuditLogEntry[]): {
      totalEntries: number;
      successRate: number;
      securityEvents: number;
      topActions: { action: string; count: number }[];
      topUsers: { userId: string; userName: string; count: number }[];
    } {
      const totalEntries = entries.length;
      const successfulEntries = entries.filter(e => e.success).length;
      const successRate = totalEntries > 0 ? (successfulEntries / totalEntries) * 100 : 0;
      const securityEvents = entries.filter(e => this.isSecurityConcern(e)).length;
      
      // Count actions
      const actionCounts: Record<string, number> = {};
      entries.forEach(entry => {
        actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
      });
      
      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Count users
      const userCounts: Record<string, { userName: string; count: number }> = {};
      entries.forEach(entry => {
        if (!userCounts[entry.userId]) {
          userCounts[entry.userId] = { userName: entry.userName, count: 0 };
        }
        userCounts[entry.userId].count++;
      });
      
      const topUsers = Object.entries(userCounts)
        .map(([userId, data]) => ({ userId, userName: data.userName, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      return {
        totalEntries,
        successRate,
        securityEvents,
        topActions,
        topUsers
      };
    }
  }
};

export default auditLogService;