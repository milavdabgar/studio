import type { UserRole as UserRoleCode } from '@/types/entities';
import { auditLogger } from '@/lib/audit/audit-logger';

export interface TemporaryRole {
  id: string;
  userId: string;
  roleCode: UserRoleCode;
  grantedBy: string;
  grantedAt: Date;
  expiresAt: Date;
  reason: string;
  isActive: boolean;
  permissions?: string[];
  restrictions?: {
    ipWhitelist?: string[];
    timeWindows?: TimeWindow[];
    maxSessions?: number;
    departmentScope?: string[];
  };
  metadata?: Record<string, unknown>;
}

export interface TimeWindow {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  daysOfWeek: number[]; // 0-6, Sunday = 0
  timezone?: string;
}

export interface RoleAssignmentRequest {
  userId: string;
  roleCode: UserRoleCode;
  duration: number; // in milliseconds
  reason: string;
  permissions?: string[];
  restrictions?: TemporaryRole['restrictions'];
  requiresApproval?: boolean;
  approvers?: string[];
}

export interface RoleAssignmentApproval {
  assignmentId: string;
  approverId: string;
  approved: boolean;
  reason?: string;
  approvedAt: Date;
}

export interface DelegatedPermission {
  id: string;
  delegatorUserId: string;
  delegateeUserId: string;
  permissions: string[];
  resources?: string[];
  expiresAt: Date;
  reason: string;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
}

class DynamicRoleManager {
  private temporaryRoles: Map<string, TemporaryRole> = new Map();
  private pendingAssignments: Map<string, RoleAssignmentRequest & { id: string; requestedAt: Date }> = new Map();
  private delegatedPermissions: Map<string, DelegatedPermission> = new Map();

  constructor() {
    // Clean up expired roles every hour
    setInterval(() => this.cleanupExpiredRoles(), 60 * 60 * 1000);
  }

  /**
   * Request a temporary role assignment
   */
  async requestTemporaryRole(
    request: RoleAssignmentRequest,
    requestedBy: string
  ): Promise<{ success: boolean; assignmentId?: string; requiresApproval?: boolean }> {
    const assignmentId = this.generateId('temp_role');
    
    // Check if immediate assignment is allowed
    const canAssignImmediately = await this.canAssignRoleImmediately(request, requestedBy);
    
    if (canAssignImmediately) {
      const temporaryRole: TemporaryRole = {
        id: assignmentId,
        userId: request.userId,
        roleCode: request.roleCode,
        grantedBy: requestedBy,
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + request.duration),
        reason: request.reason,
        isActive: true,
        permissions: request.permissions,
        restrictions: request.restrictions
      };

      this.temporaryRoles.set(assignmentId, temporaryRole);

      // Audit log
      await auditLogger.logAction({
        userId: requestedBy,
        userEmail: requestedBy,
        userRole: 'admin', // This would be determined from context
        action: 'ASSIGN_TEMPORARY_ROLE',
        resource: 'user_roles',
        resourceId: request.userId,
        status: 'success',
        details: {
          temporaryRoleId: assignmentId,
          roleCode: request.roleCode,
          duration: request.duration,
          reason: request.reason
        }
      });

      return { success: true, assignmentId };
    } else {
      // Requires approval
      const pendingAssignment = {
        ...request,
        id: assignmentId,
        requestedAt: new Date()
      };

      this.pendingAssignments.set(assignmentId, pendingAssignment);

      // Audit log
      await auditLogger.logAction({
        userId: requestedBy,
        userEmail: requestedBy,
        userRole: 'admin',
        action: 'REQUEST_TEMPORARY_ROLE',
        resource: 'user_roles',
        resourceId: request.userId,
        status: 'success',
        details: {
          assignmentId,
          roleCode: request.roleCode,
          requiresApproval: true
        }
      });

      return { success: true, assignmentId, requiresApproval: true };
    }
  }

  /**
   * Approve or reject a role assignment request
   */
  async approveRoleAssignment(
    assignmentId: string,
    approval: Omit<RoleAssignmentApproval, 'assignmentId' | 'approvedAt'>
  ): Promise<{ success: boolean; message: string }> {
    const pendingAssignment = this.pendingAssignments.get(assignmentId);
    
    if (!pendingAssignment) {
      return { success: false, message: 'Assignment request not found' };
    }

    const approvalRecord: RoleAssignmentApproval = {
      ...approval,
      assignmentId,
      approvedAt: new Date()
    };

    if (approval.approved) {
      // Create the temporary role
      const temporaryRole: TemporaryRole = {
        id: assignmentId,
        userId: pendingAssignment.userId,
        roleCode: pendingAssignment.roleCode,
        grantedBy: approval.approverId,
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + pendingAssignment.duration),
        reason: pendingAssignment.reason,
        isActive: true,
        permissions: pendingAssignment.permissions,
        restrictions: pendingAssignment.restrictions
      };

      this.temporaryRoles.set(assignmentId, temporaryRole);
    }

    this.pendingAssignments.delete(assignmentId);

    // Audit log
    await auditLogger.logAction({
      userId: approval.approverId,
      userEmail: approval.approverId,
      userRole: 'admin',
      action: approval.approved ? 'APPROVE_ROLE_ASSIGNMENT' : 'REJECT_ROLE_ASSIGNMENT',
      resource: 'user_roles',
      resourceId: pendingAssignment.userId,
      status: 'success',
      details: {
        assignmentId,
        originalRequester: pendingAssignment.userId,
        roleCode: pendingAssignment.roleCode,
        reason: approval.reason
      }
    });

    return { 
      success: true, 
      message: approval.approved ? 'Role assignment approved' : 'Role assignment rejected'
    };
  }

  /**
   * Delegate permissions to another user
   */
  async delegatePermissions(delegatorUserId: string, delegation: Omit<DelegatedPermission, 'id' | 'delegatorUserId' | 'usageCount' | 'isActive'>): Promise<{ success: boolean; delegationId: string }> {
    const delegationId = this.generateId('delegation');
    
    const delegatedPermission: DelegatedPermission = {
      id: delegationId,
      delegatorUserId,
      usageCount: 0,
      isActive: true,
      ...delegation
    };

    this.delegatedPermissions.set(delegationId, delegatedPermission);

    // Audit log
    await auditLogger.logAction({
      userId: delegatorUserId,
      userEmail: delegatorUserId,
      userRole: 'admin',
      action: 'DELEGATE_PERMISSIONS',
      resource: 'permissions',
      resourceId: delegation.delegateeUserId,
      status: 'success',
      details: {
        delegationId,
        permissions: delegation.permissions,
        resources: delegation.resources,
        expiresAt: delegation.expiresAt
      }
    });

    return { success: true, delegationId };
  }

  /**
   * Get active temporary roles for a user
   */
  getActiveTemporaryRoles(userId: string): TemporaryRole[] {
    return Array.from(this.temporaryRoles.values())
      .filter(role => role.userId === userId && role.isActive && role.expiresAt > new Date());
  }

  /**
   * Get delegated permissions for a user
   */
  getDelegatedPermissions(userId: string): DelegatedPermission[] {
    return Array.from(this.delegatedPermissions.values())
      .filter(delegation => 
        delegation.delegateeUserId === userId && 
        delegation.isActive && 
        delegation.expiresAt > new Date() &&
        (!delegation.maxUsage || delegation.usageCount < delegation.maxUsage)
      );
  }

  /**
   * Check if a user can access a resource based on temporary roles and delegations
   */
  async checkTemporaryAccess(
    userId: string, 
    permission: string, 
    resource?: string,
    context?: { ipAddress?: string; currentTime?: Date }
  ): Promise<{ hasAccess: boolean; source?: 'temporary_role' | 'delegation'; details?: any }> {
    const currentTime = context?.currentTime || new Date();
    
    // Check temporary roles
    const temporaryRoles = this.getActiveTemporaryRoles(userId);
    for (const role of temporaryRoles) {
      if (await this.isRoleAccessible(role, context)) {
        if (!role.permissions || role.permissions.includes(permission)) {
          return { hasAccess: true, source: 'temporary_role', details: { roleId: role.id } };
        }
      }
    }

    // Check delegated permissions
    const delegations = this.getDelegatedPermissions(userId);
    for (const delegation of delegations) {
      if (delegation.permissions.includes(permission)) {
        if (!delegation.resources || !resource || delegation.resources.includes(resource)) {
          // Increment usage count
          delegation.usageCount++;
          
          return { hasAccess: true, source: 'delegation', details: { delegationId: delegation.id } };
        }
      }
    }

    return { hasAccess: false };
  }

  /**
   * Revoke a temporary role
   */
  async revokeTemporaryRole(roleId: string, revokedBy: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const role = this.temporaryRoles.get(roleId);
    
    if (!role) {
      return { success: false, message: 'Temporary role not found' };
    }

    role.isActive = false;

    // Audit log
    await auditLogger.logAction({
      userId: revokedBy,
      userEmail: revokedBy,
      userRole: 'admin',
      action: 'REVOKE_TEMPORARY_ROLE',
      resource: 'user_roles',
      resourceId: role.userId,
      status: 'success',
      details: {
        roleId,
        originalGrantedBy: role.grantedBy,
        roleCode: role.roleCode,
        reason
      }
    });

    return { success: true, message: 'Temporary role revoked successfully' };
  }

  /**
   * Get pending role assignment requests
   */
  getPendingAssignments(): (RoleAssignmentRequest & { id: string; requestedAt: Date })[] {
    return Array.from(this.pendingAssignments.values());
  }

  /**
   * Get role assignment history
   */
  getRoleAssignmentHistory(userId?: string): TemporaryRole[] {
    return Array.from(this.temporaryRoles.values())
      .filter(role => !userId || role.userId === userId)
      .sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime());
  }

  private async canAssignRoleImmediately(request: RoleAssignmentRequest, requestedBy: string): Promise<boolean> {
    // High-privilege roles require approval
    const highPrivilegeRoles: UserRoleCode[] = ['admin', 'super_admin', 'principal'];
    if (highPrivilegeRoles.includes(request.roleCode)) {
      return false;
    }

    // Long duration assignments require approval (more than 7 days)
    if (request.duration > 7 * 24 * 60 * 60 * 1000) {
      return false;
    }

    // Custom approval requirements
    if (request.requiresApproval) {
      return false;
    }

    return true;
  }

  private async isRoleAccessible(role: TemporaryRole, context?: { ipAddress?: string; currentTime?: Date }): Promise<boolean> {
    const currentTime = context?.currentTime || new Date();
    
    // Check expiration
    if (role.expiresAt <= currentTime) {
      return false;
    }

    // Check if active
    if (!role.isActive) {
      return false;
    }

    // Check IP restrictions
    if (role.restrictions?.ipWhitelist && context?.ipAddress) {
      if (!role.restrictions.ipWhitelist.includes(context.ipAddress)) {
        return false;
      }
    }

    // Check time windows
    if (role.restrictions?.timeWindows) {
      const isInTimeWindow = role.restrictions.timeWindows.some(window => 
        this.isTimeInWindow(currentTime, window)
      );
      if (!isInTimeWindow) {
        return false;
      }
    }

    return true;
  }

  private isTimeInWindow(currentTime: Date, window: TimeWindow): boolean {
    const dayOfWeek = currentTime.getDay();
    if (!window.daysOfWeek.includes(dayOfWeek)) {
      return false;
    }

    const currentTimeStr = currentTime.toTimeString().substring(0, 5); // HH:MM
    return currentTimeStr >= window.startTime && currentTimeStr <= window.endTime;
  }

  private cleanupExpiredRoles(): void {
    const now = new Date();
    
    // Remove expired temporary roles
    for (const [id, role] of this.temporaryRoles.entries()) {
      if (role.expiresAt <= now) {
        this.temporaryRoles.delete(id);
      }
    }

    // Remove expired delegations
    for (const [id, delegation] of this.delegatedPermissions.entries()) {
      if (delegation.expiresAt <= now) {
        this.delegatedPermissions.delete(id);
      }
    }

    // Remove old pending assignments (older than 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    for (const [id, assignment] of this.pendingAssignments.entries()) {
      if (assignment.requestedAt <= sevenDaysAgo) {
        this.pendingAssignments.delete(id);
      }
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Singleton instance
export const dynamicRoleManager = new DynamicRoleManager();

// Utility functions for integration with existing RBAC system
export const dynamicRoleUtils = {
  /**
   * Get effective roles for a user (including temporary roles)
   */
  async getEffectiveRoles(userId: string, baseRoles: UserRoleCode[], context?: { ipAddress?: string }): Promise<UserRoleCode[]> {
    const temporaryRoles = dynamicRoleManager.getActiveTemporaryRoles(userId);
    const additionalRoles = temporaryRoles
      .filter(role => dynamicRoleManager['isRoleAccessible'](role, context))
      .map(role => role.roleCode);
    
    return [...new Set([...baseRoles, ...additionalRoles])];
  },

  /**
   * Check if user has permission (including delegated permissions)
   */
  async hasPermission(userId: string, permission: string, resource?: string, context?: { ipAddress?: string }): Promise<boolean> {
    const access = await dynamicRoleManager.checkTemporaryAccess(userId, permission, resource, context);
    return access.hasAccess;
  },

  /**
   * Get all active permissions for a user
   */
  async getActivePermissions(userId: string): Promise<{
    temporaryRoles: TemporaryRole[];
    delegatedPermissions: DelegatedPermission[];
  }> {
    return {
      temporaryRoles: dynamicRoleManager.getActiveTemporaryRoles(userId),
      delegatedPermissions: dynamicRoleManager.getDelegatedPermissions(userId)
    };
  }
};

export default dynamicRoleManager;