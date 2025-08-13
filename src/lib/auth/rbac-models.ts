/**
 * RBAC Models - Interface definitions for RBAC database models
 * This is a stub file to satisfy TypeScript imports
 */

export interface IPermissionNode {
  nodeId: string;
  type: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
  tags?: string[];
  version?: number;
  inheritanceRules?: {
    canInherit: boolean;
    canDelegate: boolean;
    inheritanceLevel: number;
    excludedPermissions: string[];
  };
}

export interface IPermissionInheritance {
  parentId: string;
  childId: string;
  relationshipType: string;
  inheritedPermissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDynamicRoleAssignment {
  assignmentId: string;
  userId: string;
  roleId: string;
  assignmentType: string;
  status: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface IResourceOwnership {
  ownershipId: string;
  resourceType: string;
  resourceId: string;
  ownerId: string;
  ownershipType: string;
  isActive: boolean;
}

export interface ITimeBasedAccess {
  ruleId: string;
  entityType: string;
  entityId: string;
  ruleType: string;
  isActive: boolean;
}

export interface IIPBasedAccess {
  ruleId: string;
  entityType: string;
  entityId: string;
  ruleType: string;
  isActive: boolean;
}

export interface IPermissionAnalytics {
  reportId: string;
  reportType: string;
  generatedAt: Date;
  data: Record<string, any>;
}

export interface ISecurityEvent {
  eventId: string;
  eventType: SecurityEventType;
  severity: string;
  category: string;
  timestamp: Date;
  userId: string;
  description?: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    details?: any;
  };
  tags?: string[];
  isResolved?: boolean;
  resolvedAt?: Date;
  impact?: {
    scope: string;
    affectedEntities: string[];
    businessImpact: string;
  };
  automatedActions?: string[];
}

export interface IBulkOperation {
  operationId: string;
  type: string;
  status: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface IUserRBACExtension {
  userId: string;
  riskProfile: {
    score: number;
    level: string;
    lastAssessment: Date;
  };
  accessPatterns: {
    loginTimes: Array<{ timestamp: Date; location: string }>;
    frequentResources: string[];
  };
  securitySettings: {
    mfa: { enabled: boolean; method?: string };
    ipRestrictions: string[];
  };
  rbacState: {
    temporaryRoles: Array<{ roleId: string; expiresAt: Date }>;
    permissionCache: { permissions: string[]; expiresAt: Date };
  };
  compliance: {
    frameworks: string[];
    lastReview: Date;
  };
}

export type SecurityEventType = 
  | 'login_attempt' 
  | 'permission_denied' 
  | 'privilege_escalation' 
  | 'suspicious_activity' 
  | 'policy_violation' 
  | 'emergency_access';