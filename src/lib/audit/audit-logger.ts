export interface AuditLog {
  id?: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failed' | 'unauthorized' | 'denied' | 'partial_failure';
  departmentId?: string;
  sessionId?: string;
}

export interface AuditLogEntry {
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  status?: 'success' | 'failed' | 'unauthorized' | 'denied' | 'partial_failure';
  departmentId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditLog[] = [];

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log a role-based action
   */
  public async logAction(entry: AuditLogEntry): Promise<void> {
    const auditLog: AuditLog = {
      id: this.generateId(),
      ...entry,
      timestamp: new Date(),
      status: entry.status || 'success',
      sessionId: this.generateSessionId()
    };

    // Store in memory (in production, this would go to database)
    this.logs.push(auditLog);

    // In production, you would save to database here
    // await this.saveToDatabase(auditLog);

    // Also log to console for development
    console.log(`[AUDIT] ${auditLog.userRole}:${auditLog.userEmail} ${auditLog.action} ${auditLog.resource}${auditLog.resourceId ? `:${auditLog.resourceId}` : ''} - ${auditLog.status}`);
  }

  /**
   * Log successful access to a resource
   */
  public async logAccess(entry: Omit<AuditLogEntry, 'action' | 'status'>): Promise<void> {
    await this.logAction({
      ...entry,
      action: 'ACCESS',
      status: 'success'
    });
  }

  /**
   * Log creation of a resource
   */
  public async logCreate(entry: Omit<AuditLogEntry, 'action' | 'status'>): Promise<void> {
    await this.logAction({
      ...entry,
      action: 'CREATE',
      status: 'success'
    });
  }

  /**
   * Log update of a resource
   */
  public async logUpdate(entry: Omit<AuditLogEntry, 'action' | 'status'>): Promise<void> {
    await this.logAction({
      ...entry,
      action: 'UPDATE',
      status: 'success'
    });
  }

  /**
   * Log deletion of a resource
   */
  public async logDelete(entry: Omit<AuditLogEntry, 'action' | 'status'>): Promise<void> {
    await this.logAction({
      ...entry,
      action: 'DELETE',
      status: 'success'
    });
  }

  /**
   * Log unauthorized access attempt
   */
  public async logUnauthorized(entry: Omit<AuditLogEntry, 'status'>): Promise<void> {
    await this.logAction({
      ...entry,
      status: 'unauthorized'
    });
  }

  /**
   * Log failed action
   */
  public async logFailure(entry: Omit<AuditLogEntry, 'status'>, error?: Error): Promise<void> {
    await this.logAction({
      ...entry,
      status: 'failed',
      details: {
        ...entry.details,
        error: error?.message
      }
    });
  }

  /**
   * Get audit logs with filtering
   */
  public async getLogs(filters?: {
    userId?: string;
    userRole?: string;
    action?: string;
    resource?: string;
    status?: string;
    departmentId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    let filteredLogs = this.logs;

    if (filters) {
      filteredLogs = this.logs.filter(log => {
        if (filters.userId && log.userId !== filters.userId) return false;
        if (filters.userRole && log.userRole !== filters.userRole) return false;
        if (filters.action && log.action !== filters.action) return false;
        if (filters.resource && log.resource !== filters.resource) return false;
        if (filters.status && log.status !== filters.status) return false;
        if (filters.departmentId && log.departmentId !== filters.departmentId) return false;
        if (filters.startDate && log.timestamp < filters.startDate) return false;
        if (filters.endDate && log.timestamp > filters.endDate) return false;
        return true;
      });
    }

    // Sort by timestamp descending (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit if specified
    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }

    return filteredLogs;
  }

  /**
   * Get audit summary statistics
   */
  public async getAuditSummary(departmentId?: string): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    unauthorizedAttempts: number;
    actionsByRole: Record<string, number>;
    actionsByResource: Record<string, number>;
    recentActivity: AuditLog[];
  }> {
    const logs = departmentId 
      ? this.logs.filter(log => log.departmentId === departmentId || !log.departmentId)
      : this.logs;

    const actionsByRole: Record<string, number> = {};
    const actionsByResource: Record<string, number> = {};

    logs.forEach(log => {
      actionsByRole[log.userRole] = (actionsByRole[log.userRole] || 0) + 1;
      actionsByResource[log.resource] = (actionsByResource[log.resource] || 0) + 1;
    });

    return {
      totalActions: logs.length,
      successfulActions: logs.filter(log => log.status === 'success').length,
      failedActions: logs.filter(log => log.status === 'failed').length,
      unauthorizedAttempts: logs.filter(log => log.status === 'unauthorized').length,
      actionsByRole,
      actionsByResource,
      recentActivity: logs
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10)
    };
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  // In production, this would save to database
  // private async saveToDatabase(auditLog: AuditLog): Promise<void> {
  //   await AuditLogModel.create(auditLog);
  // }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Audit action constants
export const AUDIT_ACTIONS = {
  ACCESS: 'ACCESS',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  IMPORT: 'IMPORT',
  EXPORT: 'EXPORT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT'
} as const;

// Audit resource constants
export const AUDIT_RESOURCES = {
  STUDENTS: 'students',
  FACULTY: 'faculty',
  COURSES: 'courses',
  PROGRAMS: 'programs',
  TIMETABLES: 'timetables',
  BATCHES: 'batches',
  ROOMS: 'rooms',
  DEPARTMENTS: 'departments',
  ROLES: 'roles',
  USERS: 'users',
  REPORTS: 'reports',
  SETTINGS: 'settings'
} as const;