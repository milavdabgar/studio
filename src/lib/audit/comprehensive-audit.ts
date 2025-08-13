/**
 * Comprehensive Audit Logging System
 * Provides detailed audit trails for all admin actions with RBAC integration
 */

import { auditLogger } from './audit-logger';
import type { UserRole } from '@/types/entities';

export interface AuditContext {
  userId: string;
  userEmail: string;
  userRole: UserRole;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  departmentId?: string;
  instituteId?: string;
}

export interface AdminActionAudit {
  action: string;
  resource: string;
  resourceId?: string;
  oldData?: any;
  newData?: any;
  changes?: Record<string, { from: any; to: any }>;
  reason?: string;
  approvalRequired?: boolean;
  approvedBy?: string;
  metadata?: Record<string, any>;
}

export class ComprehensiveAuditLogger {
  /**
   * Log admin actions with detailed change tracking
   */
  static async logAdminAction(
    context: AuditContext,
    audit: AdminActionAudit
  ): Promise<void> {
    try {
      // Determine risk level based on action and resource
      const riskLevel = this.assessActionRisk(audit.action, audit.resource);
      
      // Create detailed audit entry
      await auditLogger.logAction({
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        action: audit.action,
        resource: audit.resource,
        status: 'success',
        details: {
          resourceId: audit.resourceId,
          changes: audit.changes,
          oldData: this.sanitizeData(audit.oldData),
          newData: this.sanitizeData(audit.newData),
          reason: audit.reason,
          approvalRequired: audit.approvalRequired,
          approvedBy: audit.approvedBy,
          riskLevel,
          sessionId: context.sessionId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          departmentId: context.departmentId,
          instituteId: context.instituteId,
          timestamp: new Date().toISOString(),
          ...audit.metadata
        }
      });

      // If this is a high-risk action, create additional security log
      if (riskLevel === 'high' || riskLevel === 'critical') {
        await this.logSecurityEvent(context, audit, riskLevel);
      }

    } catch (error) {
      console.error('Failed to log admin action:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log failed admin actions
   */
  static async logFailedAdminAction(
    context: AuditContext,
    audit: AdminActionAudit & { error: string }
  ): Promise<void> {
    try {
      await auditLogger.logAction({
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        action: `${audit.action}_FAILED`,
        resource: audit.resource,
        status: 'failed',
        details: {
          resourceId: audit.resourceId,
          error: audit.error,
          attemptedChanges: audit.changes,
          reason: audit.reason,
          sessionId: context.sessionId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          departmentId: context.departmentId,
          instituteId: context.instituteId,
          timestamp: new Date().toISOString(),
          ...audit.metadata
        }
      });
    } catch (error) {
      console.error('Failed to log failed admin action:', error);
    }
  }

  /**
   * Log data access events
   */
  static async logDataAccess(
    context: AuditContext,
    resource: string,
    resourceId: string,
    accessType: 'view' | 'export' | 'search' | 'report',
    filters?: Record<string, any>
  ): Promise<void> {
    try {
      await auditLogger.logAction({
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        action: `DATA_${accessType.toUpperCase()}`,
        resource: resource,
        status: 'success',
        details: {
          resourceId,
          accessType,
          filters: this.sanitizeData(filters),
          sessionId: context.sessionId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          departmentId: context.departmentId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log data access:', error);
    }
  }

  /**
   * Log permission checks and denials
   */
  static async logPermissionCheck(
    context: AuditContext,
    resource: string,
    operation: string,
    result: 'granted' | 'denied',
    reason?: string
  ): Promise<void> {
    try {
      await auditLogger.logAction({
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        action: `PERMISSION_${result.toUpperCase()}`,
        resource: resource,
        status: result === 'granted' ? 'success' : 'failed',
        details: {
          operation,
          result,
          reason,
          sessionId: context.sessionId,
          ipAddress: context.ipAddress,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log permission check:', error);
    }
  }

  /**
   * Log bulk operations
   */
  static async logBulkOperation(
    context: AuditContext,
    operation: string,
    resource: string,
    itemCount: number,
    successCount: number,
    failureCount: number,
    errors?: string[]
  ): Promise<void> {
    try {
      await auditLogger.logAction({
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        action: `BULK_${operation.toUpperCase()}`,
        resource: resource,
        status: failureCount === 0 ? 'success' : 'partial_failure',
        details: {
          operation,
          itemCount,
          successCount,
          failureCount,
          errors: errors?.slice(0, 10), // Limit error list size
          sessionId: context.sessionId,
          ipAddress: context.ipAddress,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log bulk operation:', error);
    }
  }

  /**
   * Log system configuration changes
   */
  static async logSystemConfigChange(
    context: AuditContext,
    configKey: string,
    oldValue: any,
    newValue: any,
    reason?: string
  ): Promise<void> {
    try {
      await auditLogger.logAction({
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        action: 'SYSTEM_CONFIG_CHANGE',
        resource: 'system_config',
        status: 'success',
        details: {
          configKey,
          oldValue, // Don't sanitize config values as they're not user data
          newValue, // Don't sanitize config values as they're not user data
          reason,
          riskLevel: 'high',
          sessionId: context.sessionId,
          ipAddress: context.ipAddress,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log system config change:', error);
    }
  }

  /**
   * Generate audit reports
   */
  static async generateAuditReport(
    startDate: Date,
    endDate: Date,
    filters?: {
      userId?: string;
      userRole?: UserRole;
      resource?: string;
      action?: string;
      riskLevel?: string;
    }
  ): Promise<any[]> {
    try {
      // This would typically query the audit database
      // For now, return a placeholder structure
      return [{
        id: 'audit-report-placeholder',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        filters,
        generated: new Date().toISOString(),
        summary: {
          totalActions: 0,
          uniqueUsers: 0,
          riskDistribution: {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
          }
        }
      }];
    } catch (error) {
      console.error('Failed to generate audit report:', error);
      return [];
    }
  }

  /**
   * Private helper methods
   */
  private static assessActionRisk(action: string, resource: string): 'low' | 'medium' | 'high' | 'critical' {
    // Critical risk actions
    if (action.includes('DELETE') || action.includes('PURGE') || 
        action.includes('SYSTEM_CONFIG') || action.includes('BULK_DELETE')) {
      return 'critical';
    }

    // High risk actions
    if (action.includes('CREATE') || action.includes('UPDATE') || 
        action.includes('PUBLISH') || action.includes('APPROVE') ||
        resource === 'user' || resource === 'role' || resource === 'permission') {
      return 'high';
    }

    // Medium risk actions
    if (action.includes('EXPORT') || action.includes('IMPORT') || 
        action.includes('BULK_') || action.includes('ARCHIVE')) {
      return 'medium';
    }

    // Low risk actions (VIEW, SEARCH, etc.)
    return 'low';
  }

  private static async logSecurityEvent(
    context: AuditContext,
    audit: AdminActionAudit,
    riskLevel: string
  ): Promise<void> {
    try {
      await auditLogger.logAction({
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        action: 'SECURITY_EVENT',
        resource: 'security',
        status: 'success',
        details: {
          eventType: 'high_risk_admin_action',
          originalAction: audit.action,
          originalResource: audit.resource,
          riskLevel,
          requiresReview: riskLevel === 'critical',
          sessionId: context.sessionId,
          ipAddress: context.ipAddress,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private static sanitizeData(data: any): any {
    if (!data) return data;
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...data };
    
    for (const key in sanitized) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}

/**
 * Middleware for automatic audit logging
 */
export const withAuditLogging = (
  action: string,
  resource: string,
  options?: {
    capturePayload?: boolean;
    captureResponse?: boolean;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  }
) => {
  return (handler: Function) => {
    return async (req: any, context: AuditContext, ...args: any[]) => {
      const startTime = Date.now();
      
      try {
        // Execute the handler
        const result = await handler(req, context, ...args);
        
        // Log successful action
        await ComprehensiveAuditLogger.logAdminAction(context, {
          action,
          resource,
          resourceId: args[0]?.id,
          newData: options?.captureResponse ? result : undefined,
          metadata: {
            executionTime: Date.now() - startTime,
            payloadSize: options?.capturePayload ? JSON.stringify(req.body || {}).length : undefined
          }
        });
        
        return result;
      } catch (error) {
        // Log failed action
        await ComprehensiveAuditLogger.logFailedAdminAction(context, {
          action,
          resource,
          resourceId: args[0]?.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            executionTime: Date.now() - startTime
          }
        });
        
        throw error;
      }
    };
  };
};