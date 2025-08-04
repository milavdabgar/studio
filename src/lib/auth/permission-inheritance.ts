import type { UserRole as UserRoleCode } from '@/types/entities';
import { auditLogger } from '@/lib/audit/audit-logger';

export interface PermissionNode {
  id: string;
  name: string;
  type: 'role' | 'department' | 'committee' | 'resource' | 'group';
  parentId?: string;
  children: string[];
  permissions: InheritedPermission[];
  inheritanceRules: InheritancePolicy[];
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface InheritedPermission {
  permission: string;
  source: 'direct' | 'inherited' | 'computed';
  sourceId: string;
  priority: number;
  conditions?: PermissionCondition[];
  expiresAt?: Date;
  overrides?: PermissionOverride[];
}

export interface InheritancePolicy {
  id: string;
  type: 'allow' | 'deny' | 'conditional';
  permissions: string[];
  conditions?: PermissionCondition[];
  priority: number;
  cascadeDown: boolean;
  cascadeUp: boolean;
  stopPropagation: boolean;
}

export interface PermissionCondition {
  type: 'time' | 'location' | 'resource_state' | 'user_attribute' | 'context';
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'nin' | 'exists' | 'regex';
  value: any;
  negated?: boolean;
}

export interface PermissionOverride {
  nodeId: string;
  permission: string;
  action: 'allow' | 'deny' | 'modify';
  reason: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface PermissionPath {
  nodeIds: string[];
  permissions: string[];
  conflicts: PermissionConflict[];
  effectivePermissions: string[];
}

export interface PermissionConflict {
  permission: string;
  conflictingNodes: string[];
  resolution: 'allow' | 'deny' | 'explicit_required';
  reason: string;
}

export interface InheritanceQuery {
  nodeId: string;
  userId?: string;
  permissions?: string[];
  includeInherited?: boolean;
  includeConditional?: boolean;
  context?: Record<string, any>;
}

class PermissionInheritanceEngine {
  private nodes: Map<string, PermissionNode> = new Map();
  private inheritanceCache: Map<string, PermissionPath> = new Map();
  private cacheExpiry: Map<string, number> = new Map();

  constructor() {
    // Cache cleanup every 30 minutes
    setInterval(() => this.cleanupCache(), 30 * 60 * 1000);
  }

  /**
   * Create a permission node in the hierarchy
   */
  async createNode(
    node: Omit<PermissionNode, 'id' | 'children'>,
    createdBy: string
  ): Promise<PermissionNode> {
    const nodeId = this.generateId('node');
    
    const permissionNode: PermissionNode = {
      id: nodeId,
      children: [],
      ...node,
      isActive: true
    };

    // Add to parent's children if parent exists
    if (node.parentId) {
      const parent = this.nodes.get(node.parentId);
      if (parent) {
        parent.children.push(nodeId);
      }
    }

    this.nodes.set(nodeId, permissionNode);
    this.invalidateCache(); // Clear cache when hierarchy changes

    // Audit log
    await auditLogger.logAction({
      userId: createdBy,
      userEmail: createdBy,
      userRole: 'admin',
      action: 'CREATE_PERMISSION_NODE',
      resource: 'permission_hierarchy',
      resourceId: nodeId,
      status: 'success',
      details: {
        nodeType: node.type,
        parentId: node.parentId,
        permissions: node.permissions.length
      }
    });

    return permissionNode;
  }

  /**
   * Add permission to a node
   */
  async addPermission(
    nodeId: string,
    permission: Omit<InheritedPermission, 'source'>,
    addedBy: string
  ): Promise<{ success: boolean; message: string }> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return { success: false, message: 'Node not found' };
    }

    const inheritedPermission: InheritedPermission = {
      source: 'direct',
      ...permission
    };

    node.permissions.push(inheritedPermission);
    this.invalidateCache();

    // Audit log
    await auditLogger.logAction({
      userId: addedBy,
      userEmail: addedBy,
      userRole: 'admin',
      action: 'ADD_NODE_PERMISSION',
      resource: 'permission_hierarchy',
      resourceId: nodeId,
      status: 'success',
      details: {
        permission: permission.permission,
        priority: permission.priority
      }
    });

    return { success: true, message: 'Permission added successfully' };
  }

  /**
   * Add inheritance policy to a node
   */
  async addInheritancePolicy(
    nodeId: string,
    policy: Omit<InheritancePolicy, 'id'>,
    addedBy: string
  ): Promise<{ success: boolean; policyId: string }> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return { success: false, policyId: '' };
    }

    const policyId = this.generateId('policy');
    const inheritancePolicy: InheritancePolicy = {
      id: policyId,
      ...policy
    };

    node.inheritanceRules.push(inheritancePolicy);
    this.invalidateCache();

    // Audit log
    await auditLogger.logAction({
      userId: addedBy,
      userEmail: addedBy,
      userRole: 'admin',
      action: 'ADD_INHERITANCE_POLICY',
      resource: 'permission_hierarchy',
      resourceId: nodeId,
      status: 'success',
      details: {
        policyId,
        policyType: policy.type,
        permissions: policy.permissions,
        cascadeDown: policy.cascadeDown
      }
    });

    return { success: true, policyId };
  }

  /**
   * Compute effective permissions for a node
   */
  async computeEffectivePermissions(query: InheritanceQuery): Promise<PermissionPath> {
    const cacheKey = this.getCacheKey(query);
    const cached = this.inheritanceCache.get(cacheKey);
    const cacheExpiry = this.cacheExpiry.get(cacheKey) || 0;

    // Return cached result if valid
    if (cached && Date.now() < cacheExpiry) {
      return cached;
    }

    const result = await this.computePermissions(query);
    
    // Cache result for 15 minutes
    this.inheritanceCache.set(cacheKey, result);
    this.cacheExpiry.set(cacheKey, Date.now() + 15 * 60 * 1000);

    return result;
  }

  /**
   * Get permission path from root to node
   */
  getPermissionPath(nodeId: string): string[] {
    const path: string[] = [];
    let currentId: string | undefined = nodeId;

    while (currentId) {
      path.unshift(currentId);
      const node = this.nodes.get(currentId);
      currentId = node?.parentId;
    }

    return path;
  }

  /**
   * Check if user has permission through inheritance
   */
  async hasInheritedPermission(
    userId: string,
    nodeId: string,
    permission: string,
    context?: Record<string, any>
  ): Promise<{
    hasPermission: boolean;
    source?: string;
    path?: string[];
    conflicts?: PermissionConflict[];
  }> {
    const query: InheritanceQuery = {
      nodeId,
      userId,
      permissions: [permission],
      includeInherited: true,
      includeConditional: true,
      context
    };

    const permissionPath = await this.computeEffectivePermissions(query);
    const hasPermission = permissionPath.effectivePermissions.includes(permission);

    if (hasPermission) {
      return {
        hasPermission: true,
        source: nodeId,
        path: permissionPath.nodeIds,
        conflicts: permissionPath.conflicts
      };
    }

    return { hasPermission: false };
  }

  /**
   * Get all descendant nodes
   */
  getDescendants(nodeId: string): string[] {
    const descendants: string[] = [];
    const queue: string[] = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const node = this.nodes.get(currentId);
      
      if (node) {
        node.children.forEach(childId => {
          descendants.push(childId);
          queue.push(childId);
        });
      }
    }

    return descendants;
  }

  /**
   * Get all ancestor nodes
   */
  getAncestors(nodeId: string): string[] {
    const ancestors: string[] = [];
    let currentId: string | undefined = nodeId;

    while (currentId) {
      const node = this.nodes.get(currentId);
      if (node?.parentId) {
        ancestors.push(node.parentId);
        currentId = node.parentId;
      } else {
        break;
      }
    }

    return ancestors;
  }

  /**
   * Create permission override
   */
  async createOverride(
    nodeId: string,
    override: Omit<PermissionOverride, 'createdAt'>,
    createdBy: string
  ): Promise<{ success: boolean; message: string }> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return { success: false, message: 'Node not found' };
    }

    const targetPermission = node.permissions.find(p => p.permission === override.permission);
    if (!targetPermission) {
      return { success: false, message: 'Permission not found in node' };
    }

    const permissionOverride: PermissionOverride = {
      ...override,
      createdAt: new Date()
    };

    if (!targetPermission.overrides) {
      targetPermission.overrides = [];
    }
    targetPermission.overrides.push(permissionOverride);

    this.invalidateCache();

    // Audit log
    await auditLogger.logAction({
      userId: createdBy,
      userEmail: createdBy,
      userRole: 'admin',
      action: 'CREATE_PERMISSION_OVERRIDE',
      resource: 'permission_hierarchy',
      resourceId: nodeId,
      status: 'success',
      details: {
        permission: override.permission,
        action: override.action,
        targetNode: override.nodeId,
        reason: override.reason
      }
    });

    return { success: true, message: 'Override created successfully' };
  }

  /**
   * Validate hierarchy consistency
   */
  validateHierarchy(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for circular references
    for (const [nodeId, node] of this.nodes.entries()) {
      if (this.hasCircularReference(nodeId)) {
        errors.push(`Circular reference detected in node ${nodeId}`);
      }
    }

    // Check for orphaned nodes
    for (const [nodeId, node] of this.nodes.entries()) {
      if (node.parentId && !this.nodes.has(node.parentId)) {
        errors.push(`Node ${nodeId} references non-existent parent ${node.parentId}`);
      }
    }

    // Check for permission conflicts
    for (const [nodeId, node] of this.nodes.entries()) {
      const conflicts = this.detectPermissionConflicts(node);
      if (conflicts.length > 0) {
        warnings.push(`Node ${nodeId} has ${conflicts.length} permission conflicts`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get inheritance statistics
   */
  getInheritanceStats(): {
    totalNodes: number;
    nodesByType: Record<string, number>;
    averageDepth: number;
    maxDepth: number;
    totalPermissions: number;
    totalPolicies: number;
    conflictCount: number;
  } {
    const nodesByType: Record<string, number> = {};
    let totalPermissions = 0;
    let totalPolicies = 0;
    let conflictCount = 0;
    let totalDepth = 0;
    let maxDepth = 0;

    for (const [nodeId, node] of this.nodes.entries()) {
      // Count by type
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
      
      // Count permissions and policies
      totalPermissions += node.permissions.length;
      totalPolicies += node.inheritanceRules.length;
      
      // Count conflicts
      conflictCount += this.detectPermissionConflicts(node).length;
      
      // Calculate depth
      const depth = this.getPermissionPath(nodeId).length;
      totalDepth += depth;
      maxDepth = Math.max(maxDepth, depth);
    }

    return {
      totalNodes: this.nodes.size,
      nodesByType,
      averageDepth: this.nodes.size > 0 ? totalDepth / this.nodes.size : 0,
      maxDepth,
      totalPermissions,
      totalPolicies,
      conflictCount
    };
  }

  private async computePermissions(query: InheritanceQuery): Promise<PermissionPath> {
    const path = this.getPermissionPath(query.nodeId);
    const permissions: Set<string> = new Set();
    const conflicts: PermissionConflict[] = [];

    // Process each node in the path
    for (const nodeId of path) {
      const node = this.nodes.get(nodeId);
      if (!node || !node.isActive) continue;

      // Process direct permissions
      for (const permission of node.permissions) {
        if (this.shouldIncludePermission(permission, query)) {
          if (await this.evaluateConditions(permission.conditions, query.context)) {
            permissions.add(permission.permission);
          }
        }
      }

      // Process inheritance policies
      for (const policy of node.inheritanceRules) {
        if (await this.evaluateConditions(policy.conditions, query.context)) {
          this.applyInheritancePolicy(policy, permissions, conflicts, query);
        }
      }
    }

    return {
      nodeIds: path,
      permissions: Array.from(permissions),
      conflicts,
      effectivePermissions: this.resolveConflicts(Array.from(permissions), conflicts)
    };
  }

  private shouldIncludePermission(permission: InheritedPermission, query: InheritanceQuery): boolean {
    // Check if permission is in query filter
    if (query.permissions && !query.permissions.includes(permission.permission)) {
      return false;
    }

    // Check expiration
    if (permission.expiresAt && permission.expiresAt <= new Date()) {
      return false;
    }

    // Check source inclusion
    if (!query.includeInherited && permission.source === 'inherited') {
      return false;
    }

    return true;
  }

  private async evaluateConditions(
    conditions?: PermissionCondition[],
    context?: Record<string, any>
  ): Promise<boolean> {
    if (!conditions || conditions.length === 0) return true;
    if (!context) return false;

    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, context);
      if (!result) return false;
    }

    return true;
  }

  private async evaluateCondition(
    condition: PermissionCondition,
    context: Record<string, any>
  ): Promise<boolean> {
    const fieldValue = this.getNestedValue(context, condition.field);
    let result = false;

    switch (condition.operator) {
      case 'eq':
        result = fieldValue === condition.value;
        break;
      case 'ne':
        result = fieldValue !== condition.value;
        break;
      case 'gt':
        result = fieldValue > condition.value;
        break;
      case 'lt':
        result = fieldValue < condition.value;
        break;
      case 'in':
        result = Array.isArray(condition.value) && condition.value.includes(fieldValue);
        break;
      case 'nin':
        result = Array.isArray(condition.value) && !condition.value.includes(fieldValue);
        break;
      case 'exists':
        result = fieldValue !== undefined;
        break;
      case 'regex':
        result = new RegExp(condition.value).test(String(fieldValue));
        break;
    }

    return condition.negated ? !result : result;
  }

  private applyInheritancePolicy(
    policy: InheritancePolicy,
    permissions: Set<string>,
    conflicts: PermissionConflict[],
    query: InheritanceQuery
  ): void {
    for (const permission of policy.permissions) {
      if (query.permissions && !query.permissions.includes(permission)) continue;

      switch (policy.type) {
        case 'allow':
          permissions.add(permission);
          break;
        case 'deny':
          permissions.delete(permission);
          break;
        case 'conditional':
          // Already evaluated in the calling function
          permissions.add(permission);
          break;
      }
    }
  }

  private resolveConflicts(permissions: string[], conflicts: PermissionConflict[]): string[] {
    const resolved = new Set(permissions);

    for (const conflict of conflicts) {
      switch (conflict.resolution) {
        case 'deny':
          resolved.delete(conflict.permission);
          break;
        case 'allow':
          resolved.add(conflict.permission);
          break;
        case 'explicit_required':
          // Remove permission - requires explicit grant
          resolved.delete(conflict.permission);
          break;
      }
    }

    return Array.from(resolved);
  }

  private detectPermissionConflicts(node: PermissionNode): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];
    const permissionMap: Map<string, InheritedPermission[]> = new Map();

    // Group permissions by name
    for (const permission of node.permissions) {
      if (!permissionMap.has(permission.permission)) {
        permissionMap.set(permission.permission, []);
      }
      permissionMap.get(permission.permission)!.push(permission);
    }

    // Check for conflicts
    for (const [permissionName, permissionList] of permissionMap.entries()) {
      if (permissionList.length > 1) {
        // Check for priority conflicts or source conflicts
        const sources = permissionList.map(p => p.source);
        const uniqueSources = [...new Set(sources)];
        
        if (uniqueSources.length > 1) {
          conflicts.push({
            permission: permissionName,
            conflictingNodes: [node.id],
            resolution: 'explicit_required',
            reason: 'Multiple sources for same permission'
          });
        }
      }
    }

    return conflicts;
  }

  private hasCircularReference(nodeId: string, visited: Set<string> = new Set()): boolean {
    if (visited.has(nodeId)) return true;
    
    visited.add(nodeId);
    const node = this.nodes.get(nodeId);
    
    if (node?.parentId && this.hasCircularReference(node.parentId, new Set(visited))) {
      return true;
    }
    
    return false;
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private getCacheKey(query: InheritanceQuery): string {
    return JSON.stringify({
      nodeId: query.nodeId,
      userId: query.userId,
      permissions: query.permissions?.sort(),
      includeInherited: query.includeInherited,
      includeConditional: query.includeConditional,
      contextHash: query.context ? this.hashObject(query.context) : null
    });
  }

  private hashObject(obj: Record<string, any>): string {
    return JSON.stringify(obj, Object.keys(obj).sort());
  }

  private invalidateCache(): void {
    this.inheritanceCache.clear();
    this.cacheExpiry.clear();
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (expiry <= now) {
        this.inheritanceCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Singleton instance
export const permissionInheritanceEngine = new PermissionInheritanceEngine();

// Utility functions
export const inheritanceUtils = {
  /**
   * Create a department hierarchy
   */
  async createDepartmentHierarchy(
    departments: { id: string; name: string; parentId?: string }[],
    createdBy: string
  ): Promise<string[]> {
    const nodeIds: string[] = [];

    for (const dept of departments) {
      const node = await permissionInheritanceEngine.createNode({
        name: dept.name,
        type: 'department',
        parentId: dept.parentId,
        permissions: [],
        inheritanceRules: [{
          id: `default_${dept.id}`,
          type: 'allow',
          permissions: ['view_department_data'],
          priority: 1,
          cascadeDown: true,
          cascadeUp: false,
          stopPropagation: false
        }],
        isActive: true
      }, createdBy);
      
      nodeIds.push(node.id);
    }

    return nodeIds;
  },

  /**
   * Create a role hierarchy
   */
  async createRoleHierarchy(
    roles: { code: UserRoleCode; name: string; permissions: string[] }[],
    createdBy: string
  ): Promise<string[]> {
    const nodeIds: string[] = [];

    for (const role of roles) {
      const node = await permissionInheritanceEngine.createNode({
        name: role.name,
        type: 'role',
        permissions: role.permissions.map(permission => ({
          permission,
          source: 'direct' as const,
          sourceId: role.code,
          priority: 1
        })),
        inheritanceRules: [],
        isActive: true
      }, createdBy);
      
      nodeIds.push(node.id);
    }

    return nodeIds;
  }
};

export default permissionInheritanceEngine;