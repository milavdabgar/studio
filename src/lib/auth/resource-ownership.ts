import type { UserRole as UserRoleCode } from '@/types/entities';
import { auditLogger } from '@/lib/audit/audit-logger';

export interface ResourceOwnership {
  id: string;
  resourceType: string;
  resourceId: string;
  ownerId: string;
  ownerType: 'user' | 'role' | 'department' | 'committee';
  permissions: ResourcePermission[];
  inheritanceRules: InheritanceRule[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ResourcePermission {
  permission: string;
  granted: boolean;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
  conditions?: AccessCondition[];
}

export interface InheritanceRule {
  id: string;
  parentResource?: string;
  parentRole?: UserRoleCode;
  parentDepartment?: string;
  permissions: string[];
  inherit: boolean;
  override?: boolean;
}

export interface AccessCondition {
  type: 'time_window' | 'ip_range' | 'location' | 'device' | 'concurrent_sessions';
  value: string | number | object;
  operator?: 'equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'between';
}

export interface ResourceDelegate {
  id: string;
  resourceId: string;
  resourceType: string;
  delegatorId: string;
  delegateeId: string;
  permissions: string[];
  startDate: Date;
  endDate: Date;
  conditions?: AccessCondition[];
  canRedelegate: boolean;
  isActive: boolean;
  usageStats: {
    accessCount: number;
    lastAccessed?: Date;
  };
}

export interface OwnershipTransfer {
  id: string;
  resourceId: string;
  resourceType: string;
  fromOwnerId: string;
  toOwnerId: string;
  reason: string;
  transferredBy: string;
  transferredAt: Date;
  permissions: string[];
  approvalRequired: boolean;
  approved?: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

class ResourceOwnershipManager {
  private ownerships: Map<string, ResourceOwnership> = new Map();
  private delegates: Map<string, ResourceDelegate> = new Map();
  private transfers: Map<string, OwnershipTransfer> = new Map();

  constructor() {
    // Clean up expired permissions and delegates every hour
    setInterval(() => this.cleanupExpired(), 60 * 60 * 1000);
  }

  /**
   * Create resource ownership
   */
  async createOwnership(
    resourceType: string,
    resourceId: string,
    ownerId: string,
    ownerType: ResourceOwnership['ownerType'],
    initialPermissions: string[] = [],
    createdBy: string
  ): Promise<ResourceOwnership> {
    const ownershipId = this.generateId('ownership');
    
    const ownership: ResourceOwnership = {
      id: ownershipId,
      resourceType,
      resourceId,
      ownerId,
      ownerType,
      permissions: initialPermissions.map(permission => ({
        permission,
        granted: true,
        grantedAt: new Date(),
        grantedBy: createdBy
      })),
      inheritanceRules: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.ownerships.set(ownershipId, ownership);

    // Audit log
    await auditLogger.logAction({
      userId: createdBy,
      userEmail: createdBy,
      userRole: 'admin',
      action: 'CREATE_RESOURCE_OWNERSHIP',
      resource: resourceType,
      resourceId,
      status: 'success',
      details: {
        ownershipId,
        ownerId,
        ownerType,
        initialPermissions
      }
    });

    return ownership;
  }

  /**
   * Transfer ownership of a resource
   */
  async transferOwnership(
    resourceId: string,
    resourceType: string,
    fromOwnerId: string,
    toOwnerId: string,
    reason: string,
    transferredBy: string,
    permissions: string[] = ['all']
  ): Promise<{ success: boolean; transferId: string; requiresApproval?: boolean }> {
    const transferId = this.generateId('transfer');
    const requiresApproval = this.doesTransferRequireApproval(resourceType, permissions);

    const transfer: OwnershipTransfer = {
      id: transferId,
      resourceId,
      resourceType,
      fromOwnerId,
      toOwnerId,
      reason,
      transferredBy,
      transferredAt: new Date(),
      permissions,
      approvalRequired: requiresApproval,
      approved: !requiresApproval
    };

    this.transfers.set(transferId, transfer);

    if (!requiresApproval) {
      await this.executeTransfer(transferId);
    }

    // Audit log
    await auditLogger.logAction({
      userId: transferredBy,
      userEmail: transferredBy,
      userRole: 'admin',
      action: 'INITIATE_OWNERSHIP_TRANSFER',
      resource: resourceType,
      resourceId,
      status: 'success',
      details: {
        transferId,
        fromOwnerId,
        toOwnerId,
        requiresApproval,
        reason
      }
    });

    return { success: true, transferId, requiresApproval };
  }

  /**
   * Delegate resource access
   */
  async delegateAccess(
    resourceId: string,
    resourceType: string,
    delegatorId: string,
    delegateeId: string,
    permissions: string[],
    duration: number, // in milliseconds
    conditions?: AccessCondition[],
    canRedelegate: boolean = false
  ): Promise<{ success: boolean; delegateId: string }> {
    const delegateId = this.generateId('delegate');
    
    const delegate: ResourceDelegate = {
      id: delegateId,
      resourceId,
      resourceType,
      delegatorId,
      delegateeId,
      permissions,
      startDate: new Date(),
      endDate: new Date(Date.now() + duration),
      conditions,
      canRedelegate,
      isActive: true,
      usageStats: {
        accessCount: 0
      }
    };

    this.delegates.set(delegateId, delegate);

    // Audit log
    await auditLogger.logAction({
      userId: delegatorId,
      userEmail: delegatorId,
      userRole: 'admin',
      action: 'DELEGATE_RESOURCE_ACCESS',
      resource: resourceType,
      resourceId,
      status: 'success',
      details: {
        delegateId,
        delegateeId,
        permissions,
        duration,
        canRedelegate
      }
    });

    return { success: true, delegateId };
  }

  /**
   * Check if user has access to a resource
   */
  async checkResourceAccess(
    userId: string,
    resourceId: string,
    resourceType: string,
    permission: string,
    context?: {
      ipAddress?: string;
      userAgent?: string;
      currentTime?: Date;
    }
  ): Promise<{
    hasAccess: boolean;
    source?: 'ownership' | 'delegation' | 'inheritance';
    details?: any;
  }> {
    const currentTime = context?.currentTime || new Date();

    // Check direct ownership
    const ownership = this.getResourceOwnership(resourceId, resourceType);
    if (ownership && ownership.ownerId === userId) {
      const hasPermission = ownership.permissions.some(p => 
        p.permission === permission && 
        p.granted && 
        (!p.expiresAt || p.expiresAt > currentTime)
      );
      
      if (hasPermission) {
        return { hasAccess: true, source: 'ownership', details: { ownershipId: ownership.id } };
      }
    }

    // Check delegated access
    const delegations = this.getActiveDelegations(userId, resourceId, resourceType);
    for (const delegation of delegations) {
      if (delegation.permissions.includes(permission) || delegation.permissions.includes('all')) {
        const conditionsMet = await this.checkAccessConditions(delegation.conditions, context);
        if (conditionsMet) {
          // Update usage stats
          delegation.usageStats.accessCount++;
          delegation.usageStats.lastAccessed = currentTime;
          
          return { hasAccess: true, source: 'delegation', details: { delegationId: delegation.id } };
        }
      }
    }

    // Check inheritance
    const inheritedAccess = await this.checkInheritedAccess(userId, resourceId, resourceType, permission, context);
    if (inheritedAccess.hasAccess) {
      return inheritedAccess;
    }

    return { hasAccess: false };
  }

  /**
   * Get resource ownership information
   */
  getResourceOwnership(resourceId: string, resourceType: string): ResourceOwnership | null {
    for (const ownership of this.ownerships.values()) {
      if (ownership.resourceId === resourceId && ownership.resourceType === resourceType) {
        return ownership;
      }
    }
    return null;
  }

  /**
   * Get resources owned by a user
   */
  getOwnedResources(ownerId: string, resourceType?: string): ResourceOwnership[] {
    return Array.from(this.ownerships.values()).filter(ownership => 
      ownership.ownerId === ownerId && 
      (!resourceType || ownership.resourceType === resourceType)
    );
  }

  /**
   * Get active delegations for a user
   */
  getActiveDelegations(userId: string, resourceId?: string, resourceType?: string): ResourceDelegate[] {
    const currentTime = new Date();
    
    return Array.from(this.delegates.values()).filter(delegate => 
      delegate.delegateeId === userId &&
      delegate.isActive &&
      delegate.startDate <= currentTime &&
      delegate.endDate > currentTime &&
      (!resourceId || delegate.resourceId === resourceId) &&
      (!resourceType || delegate.resourceType === resourceType)
    );
  }

  /**
   * Revoke delegation
   */
  async revokeDelegation(delegationId: string, revokedBy: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const delegation = this.delegates.get(delegationId);
    
    if (!delegation) {
      return { success: false, message: 'Delegation not found' };
    }

    delegation.isActive = false;

    // Audit log
    await auditLogger.logAction({
      userId: revokedBy,
      userEmail: revokedBy,
      userRole: 'admin',
      action: 'REVOKE_RESOURCE_DELEGATION',
      resource: delegation.resourceType,
      resourceId: delegation.resourceId,
      status: 'success',
      details: {
        delegationId,
        delegatorId: delegation.delegatorId,
        delegateeId: delegation.delegateeId,
        reason
      }
    });

    return { success: true, message: 'Delegation revoked successfully' };
  }

  /**
   * Add inheritance rule
   */
  async addInheritanceRule(
    ownershipId: string,
    rule: Omit<InheritanceRule, 'id'>,
    addedBy: string
  ): Promise<{ success: boolean; ruleId: string }> {
    const ownership = this.ownerships.get(ownershipId);
    
    if (!ownership) {
      return { success: false, ruleId: '' };
    }

    const ruleId = this.generateId('rule');
    const inheritanceRule: InheritanceRule = {
      id: ruleId,
      ...rule
    };

    ownership.inheritanceRules.push(inheritanceRule);
    ownership.updatedAt = new Date();

    // Audit log
    await auditLogger.logAction({
      userId: addedBy,
      userEmail: addedBy,
      userRole: 'admin',
      action: 'ADD_INHERITANCE_RULE',
      resource: ownership.resourceType,
      resourceId: ownership.resourceId,
      status: 'success',
      details: {
        ownershipId,
        ruleId,
        rule: inheritanceRule
      }
    });

    return { success: true, ruleId };
  }

  /**
   * Get ownership analytics
   */
  getOwnershipAnalytics(ownerId?: string): {
    totalOwnerships: number;
    totalDelegations: number;
    activeTransfers: number;
    resourceBreakdown: Record<string, number>;
    delegationUsage: {
      totalAccess: number;
      activeCount: number;
      expiredCount: number;
    };
  } {
    const ownerships = ownerId 
      ? this.getOwnedResources(ownerId)
      : Array.from(this.ownerships.values());

    const delegations = ownerId
      ? Array.from(this.delegates.values()).filter(d => d.delegatorId === ownerId)
      : Array.from(this.delegates.values());

    const activeTransfers = Array.from(this.transfers.values())
      .filter(t => t.approvalRequired && !t.approved).length;

    const resourceBreakdown: Record<string, number> = {};
    ownerships.forEach(ownership => {
      resourceBreakdown[ownership.resourceType] = (resourceBreakdown[ownership.resourceType] || 0) + 1;
    });

    const currentTime = new Date();
    const activeDelegations = delegations.filter(d => d.isActive && d.endDate > currentTime);
    const expiredDelegations = delegations.filter(d => !d.isActive || d.endDate <= currentTime);
    const totalAccess = delegations.reduce((sum, d) => sum + d.usageStats.accessCount, 0);

    return {
      totalOwnerships: ownerships.length,
      totalDelegations: delegations.length,
      activeTransfers,
      resourceBreakdown,
      delegationUsage: {
        totalAccess,
        activeCount: activeDelegations.length,
        expiredCount: expiredDelegations.length
      }
    };
  }

  private async executeTransfer(transferId: string): Promise<void> {
    const transfer = this.transfers.get(transferId);
    if (!transfer || !transfer.approved) return;

    // Find and update ownership
    const ownership = this.getResourceOwnership(transfer.resourceId, transfer.resourceType);
    if (ownership) {
      ownership.ownerId = transfer.toOwnerId;
      ownership.updatedAt = new Date();
      
      // Transfer specific permissions or all
      if (transfer.permissions.includes('all')) {
        // Keep all existing permissions
      } else {
        // Filter to only transferred permissions
        ownership.permissions = ownership.permissions.filter(p => 
          transfer.permissions.includes(p.permission)
        );
      }
    }
  }

  private doesTransferRequireApproval(resourceType: string, permissions: string[]): boolean {
    // Critical resources always require approval
    const criticalResources = ['user_roles', 'system_settings', 'security_policies'];
    if (criticalResources.includes(resourceType)) {
      return true;
    }

    // High-privilege permissions require approval
    const highPrivilegePermissions = ['admin', 'delete', 'manage_roles', 'system_config'];
    const hasHighPrivilege = permissions.some(p => 
      highPrivilegePermissions.includes(p) || p === 'all'
    );
    
    return hasHighPrivilege;
  }

  private async checkInheritedAccess(
    userId: string,
    resourceId: string,
    resourceType: string,
    permission: string,
    context?: any
  ): Promise<{ hasAccess: boolean; source?: 'inheritance'; details?: any }> {
    // Implementation would check inheritance rules
    // This is a simplified version
    return { hasAccess: false };
  }

  private async checkAccessConditions(conditions?: AccessCondition[], context?: any): Promise<boolean> {
    if (!conditions || conditions.length === 0) return true;

    for (const condition of conditions) {
      const conditionMet = await this.evaluateCondition(condition, context);
      if (!conditionMet) return false;
    }

    return true;
  }

  private async evaluateCondition(condition: AccessCondition, context?: any): Promise<boolean> {
    switch (condition.type) {
      case 'time_window':
        return this.checkTimeWindow(condition.value as any, context?.currentTime);
      case 'ip_range':
        return this.checkIPRange(condition.value as string, context?.ipAddress);
      default:
        return true;
    }
  }

  private checkTimeWindow(timeWindow: any, currentTime?: Date): boolean {
    // Implementation would check if current time is within the specified window
    return true;
  }

  private checkIPRange(ipRange: string, clientIP?: string): boolean {
    // Implementation would check if client IP is within the specified range
    return true;
  }

  private cleanupExpired(): void {
    const currentTime = new Date();

    // Remove expired delegations
    for (const [id, delegate] of this.delegates.entries()) {
      if (delegate.endDate <= currentTime) {
        delegate.isActive = false;
      }
    }

    // Remove expired permissions
    for (const ownership of this.ownerships.values()) {
      ownership.permissions = ownership.permissions.filter(p => 
        !p.expiresAt || p.expiresAt > currentTime
      );
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Singleton instance
export const resourceOwnershipManager = new ResourceOwnershipManager();

// Utility functions for integration
export const ownershipUtils = {
  /**
   * Check if user owns a resource
   */
  isResourceOwner(userId: string, resourceId: string, resourceType: string): boolean {
    const ownership = resourceOwnershipManager.getResourceOwnership(resourceId, resourceType);
    return ownership?.ownerId === userId;
  },

  /**
   * Get effective permissions for a resource
   */
  async getEffectivePermissions(
    userId: string,
    resourceId: string,
    resourceType: string,
    context?: any
  ): Promise<string[]> {
    const permissions: Set<string> = new Set();

    // Check ownership permissions
    const ownership = resourceOwnershipManager.getResourceOwnership(resourceId, resourceType);
    if (ownership?.ownerId === userId) {
      ownership.permissions.forEach(p => {
        if (p.granted && (!p.expiresAt || p.expiresAt > new Date())) {
          permissions.add(p.permission);
        }
      });
    }

    // Check delegated permissions
    const delegations = resourceOwnershipManager.getActiveDelegations(userId, resourceId, resourceType);
    for (const delegation of delegations) {
      delegation.permissions.forEach(p => permissions.add(p));
    }

    return Array.from(permissions);
  },

  /**
   * Create default ownership for new resources
   */
  async createDefaultOwnership(
    resourceType: string,
    resourceId: string,
    creatorId: string,
    defaultPermissions: string[] = ['read', 'write', 'delete']
  ): Promise<ResourceOwnership> {
    return resourceOwnershipManager.createOwnership(
      resourceType,
      resourceId,
      creatorId,
      'user',
      defaultPermissions,
      creatorId
    );
  }
};

export default resourceOwnershipManager;