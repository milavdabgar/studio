import mongoose, { Schema, Document } from 'mongoose';
import type { UserRole as UserRoleCode } from '@/types/entities';

// ========================================
// RBAC Core Models
// ========================================

// Dynamic Roles & Temporary Permissions
export interface ITemporaryRole extends Document {
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
    timeWindows?: Array<{
      startTime: string;
      endTime: string;
      daysOfWeek: number[];
      timezone?: string;
    }>;
    maxSessions?: number;
    departmentScope?: string[];
  };
  metadata?: Record<string, unknown>;
}

const TemporaryRoleSchema = new Schema<ITemporaryRole>({
  userId: { type: String, required: true, index: true },
  roleCode: { type: String, required: true },
  grantedBy: { type: String, required: true },
  grantedAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
  reason: { type: String, required: true },
  isActive: { type: Boolean, required: true, default: true },
  permissions: [{ type: String }],
  restrictions: {
    ipWhitelist: [{ type: String }],
    timeWindows: [{
      startTime: { type: String },
      endTime: { type: String },
      daysOfWeek: [{ type: Number }],
      timezone: { type: String }
    }],
    maxSessions: { type: Number },
    departmentScope: [{ type: String }]
  },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'temporary_roles'
});

// Compound indexes for performance
TemporaryRoleSchema.index({ userId: 1, isActive: 1, expiresAt: 1 });
TemporaryRoleSchema.index({ roleCode: 1, isActive: 1 });

export const TemporaryRoleModel = mongoose.models.TemporaryRole || 
  mongoose.model<ITemporaryRole>('TemporaryRole', TemporaryRoleSchema);

// Resource Ownership
export interface IResourceOwnership extends Document {
  resourceType: string;
  resourceId: string;
  ownerId: string;
  ownerType: 'user' | 'role' | 'department' | 'committee';
  permissions: Array<{
    permission: string;
    granted: boolean;
    grantedAt: Date;
    grantedBy: string;
    expiresAt?: Date;
    conditions?: Array<{
      type: string;
      value: any;
      operator?: string;
    }>;
  }>;
  inheritanceRules: Array<{
    id: string;
    parentResource?: string;
    parentRole?: UserRoleCode;
    parentDepartment?: string;
    permissions: string[];
    inherit: boolean;
    override?: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

const ResourceOwnershipSchema = new Schema<IResourceOwnership>({
  resourceType: { type: String, required: true, index: true },
  resourceId: { type: String, required: true, index: true },
  ownerId: { type: String, required: true, index: true },
  ownerType: { type: String, required: true, enum: ['user', 'role', 'department', 'committee'] },
  permissions: [{
    permission: { type: String, required: true },
    granted: { type: Boolean, required: true },
    grantedAt: { type: Date, required: true },
    grantedBy: { type: String, required: true },
    expiresAt: { type: Date },
    conditions: [{
      type: { type: String, required: true },
      value: { type: Schema.Types.Mixed, required: true },
      operator: { type: String }
    }]
  }],
  inheritanceRules: [{
    id: { type: String, required: true },
    parentResource: { type: String },
    parentRole: { type: String },
    parentDepartment: { type: String },
    permissions: [{ type: String }],
    inherit: { type: Boolean, required: true },
    override: { type: Boolean }
  }],
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'resource_ownership'
});

// Compound indexes
ResourceOwnershipSchema.index({ resourceType: 1, resourceId: 1 }, { unique: true });
ResourceOwnershipSchema.index({ ownerId: 1, ownerType: 1 });

export const ResourceOwnershipModel = mongoose.models.ResourceOwnership || 
  mongoose.model<IResourceOwnership>('ResourceOwnership', ResourceOwnershipSchema);

// Permission Inheritance Nodes
export interface IPermissionNode extends Document {
  name: string;
  type: 'role' | 'department' | 'committee' | 'resource' | 'group';
  parentId?: string;
  children: string[];
  permissions: Array<{
    permission: string;
    source: 'direct' | 'inherited' | 'computed';
    sourceId: string;
    priority: number;
    conditions?: Array<{
      type: string;
      field: string;
      operator: string;
      value: any;
      negated?: boolean;
    }>;
    expiresAt?: Date;
    overrides?: Array<{
      nodeId: string;
      permission: string;
      action: 'allow' | 'deny' | 'modify';
      reason: string;
      createdBy: string;
      createdAt: Date;
      expiresAt?: Date;
    }>;
  }>;
  inheritanceRules: Array<{
    id: string;
    type: 'allow' | 'deny' | 'conditional';
    permissions: string[];
    conditions?: Array<{
      type: string;
      field: string;
      operator: string;
      value: any;
      negated?: boolean;
    }>;
    priority: number;
    cascadeDown: boolean;
    cascadeUp: boolean;
    stopPropagation: boolean;
  }>;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

const PermissionNodeSchema = new Schema<IPermissionNode>({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['role', 'department', 'committee', 'resource', 'group'] },
  parentId: { type: String, index: true },
  children: [{ type: String }],
  permissions: [{
    permission: { type: String, required: true },
    source: { type: String, required: true, enum: ['direct', 'inherited', 'computed'] },
    sourceId: { type: String, required: true },
    priority: { type: Number, required: true },
    conditions: [{
      type: { type: String, required: true },
      field: { type: String, required: true },
      operator: { type: String, required: true },
      value: { type: Schema.Types.Mixed, required: true },
      negated: { type: Boolean }
    }],
    expiresAt: { type: Date },
    overrides: [{
      nodeId: { type: String, required: true },
      permission: { type: String, required: true },
      action: { type: String, required: true, enum: ['allow', 'deny', 'modify'] },
      reason: { type: String, required: true },
      createdBy: { type: String, required: true },
      createdAt: { type: Date, required: true },
      expiresAt: { type: Date }
    }]
  }],
  inheritanceRules: [{
    id: { type: String, required: true },
    type: { type: String, required: true, enum: ['allow', 'deny', 'conditional'] },
    permissions: [{ type: String }],
    conditions: [{
      type: { type: String, required: true },
      field: { type: String, required: true },
      operator: { type: String, required: true },
      value: { type: Schema.Types.Mixed, required: true },
      negated: { type: Boolean }
    }],
    priority: { type: Number, required: true },
    cascadeDown: { type: Boolean, required: true },
    cascadeUp: { type: Boolean, required: true },
    stopPropagation: { type: Boolean, required: true }
  }],
  isActive: { type: Boolean, required: true, default: true },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'permission_nodes'
});

PermissionNodeSchema.index({ type: 1, isActive: 1 });
PermissionNodeSchema.index({ parentId: 1 });

export const PermissionNodeModel = mongoose.models.PermissionNode || 
  mongoose.model<IPermissionNode>('PermissionNode', PermissionNodeSchema);

// Time-Based Access Rules
export interface ITimeBasedRule extends Document {
  name: string;
  description?: string;
  ruleType: 'allow' | 'deny' | 'restrict';
  target: {
    userIds?: string[];
    roles?: UserRoleCode[];
    departments?: string[];
    committees?: string[];
    resources?: string[];
    permissions?: string[];
  };
  timeConstraints: Array<{
    type: 'daily' | 'weekly' | 'monthly' | 'date_range' | 'custom';
    schedule: {
      startTime?: string;
      endTime?: string;
      daysOfWeek?: number[];
      daysOfMonth?: number[];
      months?: number[];
      startDate?: Date;
      endDate?: Date;
      cronExpression?: string;
    };
    timezone?: string;
    recurrence?: {
      enabled: boolean;
      pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
      interval: number;
      endDate?: Date;
      maxOccurrences?: number;
    };
  }>;
  exceptions?: Array<{
    id: string;
    name: string;
    type: 'grant' | 'revoke' | 'extend' | 'emergency';
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
    timeRange?: {
      startTime: string;
      endTime: string;
    };
    reason: string;
    approvedBy?: string;
    approvedAt?: Date;
    isActive: boolean;
  }>;
  priority: number;
  isActive: boolean;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

const TimeBasedRuleSchema = new Schema<ITimeBasedRule>({
  name: { type: String, required: true },
  description: { type: String },
  ruleType: { type: String, required: true, enum: ['allow', 'deny', 'restrict'] },
  target: {
    userIds: [{ type: String }],
    roles: [{ type: String }],
    departments: [{ type: String }],
    committees: [{ type: String }],
    resources: [{ type: String }],
    permissions: [{ type: String }]
  },
  timeConstraints: [{
    type: { type: String, required: true, enum: ['daily', 'weekly', 'monthly', 'date_range', 'custom'] },
    schedule: {
      startTime: { type: String },
      endTime: { type: String },
      daysOfWeek: [{ type: Number }],
      daysOfMonth: [{ type: Number }],
      months: [{ type: Number }],
      startDate: { type: Date },
      endDate: { type: Date },
      cronExpression: { type: String }
    },
    timezone: { type: String },
    recurrence: {
      enabled: { type: Boolean },
      pattern: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
      interval: { type: Number },
      endDate: { type: Date },
      maxOccurrences: { type: Number }
    }
  }],
  exceptions: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['grant', 'revoke', 'extend', 'emergency'] },
    dateRange: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    },
    timeRange: {
      startTime: { type: String },
      endTime: { type: String }
    },
    reason: { type: String, required: true },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    isActive: { type: Boolean, required: true }
  }],
  priority: { type: Number, required: true },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'time_based_rules'
});

TimeBasedRuleSchema.index({ isActive: 1, priority: -1 });
TimeBasedRuleSchema.index({ 'target.userIds': 1 });
TimeBasedRuleSchema.index({ 'target.roles': 1 });

export const TimeBasedRuleModel = mongoose.models.TimeBasedRule || 
  mongoose.model<ITimeBasedRule>('TimeBasedRule', TimeBasedRuleSchema);

// IP-Based Access Rules
export interface IIPAccessRule extends Document {
  name: string;
  description?: string;
  ruleType: 'allow' | 'deny' | 'restrict' | 'monitor';
  target: {
    userIds?: string[];
    roles?: UserRoleCode[];
    departments?: string[];
    committees?: string[];
    resources?: string[];
    permissions?: string[];
  };
  ipRestrictions: Array<{
    type: 'single' | 'range' | 'cidr' | 'whitelist' | 'blacklist';
    value: string | string[];
    description?: string;
  }>;
  geoRestrictions?: Array<{
    type: 'country' | 'region' | 'city' | 'continent';
    allowed: string[];
    denied: string[];
    description?: string;
  }>;
  schedule?: {
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[];
    timezone?: string;
  };
  exceptions?: Array<{
    id: string;
    name: string;
    ipAddresses: string[];
    reason: string;
    startDate: Date;
    endDate: Date;
    approvedBy: string;
    approvedAt: Date;
    isActive: boolean;
  }>;
  priority: number;
  isActive: boolean;
  bypassMethods?: Array<{
    type: 'vpn_detection' | 'trusted_proxy' | 'emergency_code' | 'admin_override';
    config: Record<string, any>;
    enabled: boolean;
  }>;
  alertingEnabled: boolean;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

const IPAccessRuleSchema = new Schema<IIPAccessRule>({
  name: { type: String, required: true },
  description: { type: String },
  ruleType: { type: String, required: true, enum: ['allow', 'deny', 'restrict', 'monitor'] },
  target: {
    userIds: [{ type: String }],
    roles: [{ type: String }],
    departments: [{ type: String }],
    committees: [{ type: String }],
    resources: [{ type: String }],
    permissions: [{ type: String }]
  },
  ipRestrictions: [{
    type: { type: String, required: true, enum: ['single', 'range', 'cidr', 'whitelist', 'blacklist'] },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String }
  }],
  geoRestrictions: [{
    type: { type: String, required: true, enum: ['country', 'region', 'city', 'continent'] },
    allowed: [{ type: String }],
    denied: [{ type: String }],
    description: { type: String }
  }],
  schedule: {
    startTime: { type: String },
    endTime: { type: String },
    daysOfWeek: [{ type: Number }],
    timezone: { type: String }
  },
  exceptions: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    ipAddresses: [{ type: String }],
    reason: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    approvedBy: { type: String, required: true },
    approvedAt: { type: Date, required: true },
    isActive: { type: Boolean, required: true }
  }],
  priority: { type: Number, required: true },
  isActive: { type: Boolean, required: true, default: true },
  bypassMethods: [{
    type: { type: String, required: true, enum: ['vpn_detection', 'trusted_proxy', 'emergency_code', 'admin_override'] },
    config: { type: Schema.Types.Mixed, required: true },
    enabled: { type: Boolean, required: true }
  }],
  alertingEnabled: { type: Boolean, required: true, default: false },
  createdBy: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'ip_access_rules'
});

IPAccessRuleSchema.index({ isActive: 1, priority: -1 });
IPAccessRuleSchema.index({ ruleType: 1, isActive: 1 });

export const IPAccessRuleModel = mongoose.models.IPAccessRule || 
  mongoose.model<IIPAccessRule>('IPAccessRule', IPAccessRuleSchema);

// Security Events
export interface ISecurityEvent extends Document {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: 'authentication' | 'authorization' | 'data_access' | 'system' | 'network' | 'user_behavior';
  userId?: string;
  userRole?: UserRoleCode;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  details: {
    description: string;
    indicators: Array<{
      type: string;
      value: any;
      threshold: any;
      confidence: number;
      description: string;
    }>;
    context: Record<string, any>;
    evidence: Array<{
      type: string;
      source: string;
      timestamp: Date;
      data: any;
      integrity: 'verified' | 'unverified' | 'tampered';
    }>;
    impact: {
      scope: 'user' | 'department' | 'system' | 'organization';
      affectedEntities: string[];
      dataAtRisk?: string[];
      businessImpact: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
    };
    recommendations: string[];
    automatedActions: Array<{
      action: string;
      executed: boolean;
      executedAt?: Date;
      result?: string;
      error?: string;
    }>;
  };
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolvedAt?: Date;
  tags: string[];
  relatedEvents: string[];
  riskScore: number;
  metadata?: Record<string, unknown>;
}

const SecurityEventSchema = new Schema<ISecurityEvent>({
  eventType: { type: String, required: true, index: true },
  severity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'], index: true },
  source: { type: String, required: true, enum: ['authentication', 'authorization', 'data_access', 'system', 'network', 'user_behavior'] },
  userId: { type: String, index: true },
  userRole: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  resource: { type: String },
  action: { type: String },
  details: {
    description: { type: String, required: true },
    indicators: [{
      type: { type: String, required: true },
      value: { type: Schema.Types.Mixed, required: true },
      threshold: { type: Schema.Types.Mixed, required: true },
      confidence: { type: Number, required: true },
      description: { type: String, required: true }
    }],
    context: { type: Schema.Types.Mixed, required: true },
    evidence: [{
      type: { type: String, required: true },
      source: { type: String, required: true },
      timestamp: { type: Date, required: true },
      data: { type: Schema.Types.Mixed, required: true },
      integrity: { type: String, required: true, enum: ['verified', 'unverified', 'tampered'] }
    }],
    impact: {
      scope: { type: String, required: true, enum: ['user', 'department', 'system', 'organization'] },
      affectedEntities: [{ type: String }],
      dataAtRisk: [{ type: String }],
      businessImpact: { type: String, required: true, enum: ['none', 'minimal', 'moderate', 'significant', 'severe'] }
    },
    recommendations: [{ type: String }],
    automatedActions: [{
      action: { type: String, required: true },
      executed: { type: Boolean, required: true },
      executedAt: { type: Date },
      result: { type: String },
      error: { type: String }
    }]
  },
  status: { type: String, required: true, enum: ['new', 'investigating', 'resolved', 'false_positive'], default: 'new' },
  assignedTo: { type: String },
  resolvedAt: { type: Date },
  tags: [{ type: String }],
  relatedEvents: [{ type: String }],
  riskScore: { type: Number, required: true, min: 0, max: 100 },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'security_events'
});

// Compound indexes for security event queries
SecurityEventSchema.index({ status: 1, severity: 1, createdAt: -1 });
SecurityEventSchema.index({ userId: 1, createdAt: -1 });
SecurityEventSchema.index({ eventType: 1, createdAt: -1 });
SecurityEventSchema.index({ riskScore: -1, createdAt: -1 });

export const SecurityEventModel = mongoose.models.SecurityEvent || 
  mongoose.model<ISecurityEvent>('SecurityEvent', SecurityEventSchema);

// Bulk Operations
export interface IBulkOperation extends Document {
  name: string;
  description?: string;
  operationType: 'assign' | 'revoke' | 'modify' | 'transfer' | 'cleanup' | 'sync';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  target: {
    userIds?: string[];
    roles?: UserRoleCode[];
    departments?: string[];
    committees?: string[];
    resources?: string[];
    permissions?: string[];
    filters?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
  operations: Array<{
    type: string;
    targetId: string;
    targetType: 'user' | 'role' | 'resource' | 'department';
    permission?: string;
    role?: UserRoleCode;
    resource?: string;
    value?: any;
    conditions?: Array<{
      type: string;
      field: string;
      operator: string;
      value: any;
    }>;
  }>;
  schedule?: {
    executeAt?: Date;
    recurring?: {
      pattern: 'daily' | 'weekly' | 'monthly';
      interval: number;
      endDate?: Date;
    };
  };
  approvalRequired: boolean;
  approvals: Array<{
    approverId: string;
    approved: boolean;
    reason?: string;
    approvedAt: Date;
    conditions?: string[];
  }>;
  executedAt?: Date;
  completedAt?: Date;
  progress: {
    total: number;
    completed: number;
    failed: number;
    errors: Array<{
      targetId: string;
      operation: any;
      error: string;
      timestamp: Date;
      recoverable: boolean;
    }>;
  };
  rollbackData?: any[];
  dryRun: boolean;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

const BulkOperationSchema = new Schema<IBulkOperation>({
  name: { type: String, required: true },
  description: { type: String },
  operationType: { type: String, required: true, enum: ['assign', 'revoke', 'modify', 'transfer', 'cleanup', 'sync'] },
  status: { type: String, required: true, enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'], default: 'pending' },
  target: {
    userIds: [{ type: String }],
    roles: [{ type: String }],
    departments: [{ type: String }],
    committees: [{ type: String }],
    resources: [{ type: String }],
    permissions: [{ type: String }],
    filters: [{
      field: { type: String, required: true },
      operator: { type: String, required: true },
      value: { type: Schema.Types.Mixed, required: true }
    }]
  },
  operations: [{
    type: { type: String, required: true },
    targetId: { type: String, required: true },
    targetType: { type: String, required: true, enum: ['user', 'role', 'resource', 'department'] },
    permission: { type: String },
    role: { type: String },
    resource: { type: String },
    value: { type: Schema.Types.Mixed },
    conditions: [{
      type: { type: String, required: true },
      field: { type: String, required: true },
      operator: { type: String, required: true },
      value: { type: Schema.Types.Mixed, required: true }
    }]
  }],
  schedule: {
    executeAt: { type: Date },
    recurring: {
      pattern: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      interval: { type: Number },
      endDate: { type: Date }
    }
  },
  approvalRequired: { type: Boolean, required: true },
  approvals: [{
    approverId: { type: String, required: true },
    approved: { type: Boolean, required: true },
    reason: { type: String },
    approvedAt: { type: Date, required: true },
    conditions: [{ type: String }]
  }],
  executedAt: { type: Date },
  completedAt: { type: Date },
  progress: {
    total: { type: Number, required: true, default: 0 },
    completed: { type: Number, required: true, default: 0 },
    failed: { type: Number, required: true, default: 0 },
    errors: [{
      targetId: { type: String, required: true },
      operation: { type: Schema.Types.Mixed, required: true },
      error: { type: String, required: true },
      timestamp: { type: Date, required: true },
      recoverable: { type: Boolean, required: true }
    }]
  },
  rollbackData: [{ type: Schema.Types.Mixed }],
  dryRun: { type: Boolean, required: true },
  createdBy: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'bulk_operations'
});

BulkOperationSchema.index({ status: 1, createdAt: -1 });
BulkOperationSchema.index({ createdBy: 1, createdAt: -1 });
BulkOperationSchema.index({ operationType: 1, status: 1 });

export const BulkOperationModel = mongoose.models.BulkOperation || 
  mongoose.model<IBulkOperation>('BulkOperation', BulkOperationSchema);

// ========================================
// Extended User Model for RBAC
// ========================================

export interface IUserRBACExtension {
  temporaryRoles: string[]; // References to TemporaryRole documents
  delegatedPermissions: string[]; // References to delegation documents
  permissionNode?: string; // Reference to permission node
  riskScore: {
    score: number;
    lastCalculated: Date;
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
  };
  accessPatterns: {
    loginTimes: Date[];
    locations: Array<{
      ipAddress: string;
      country?: string;
      city?: string;
      count: number;
      firstSeen: Date;
      lastSeen: Date;
    }>;
    devices: Array<{
      userAgent: string;
      fingerprint?: string;
      count: number;
      firstSeen: Date;
      lastSeen: Date;
    }>;
  };
  securitySettings: {
    mfaEnabled: boolean;
    trustedDevices: Array<{
      deviceId: string;
      name: string;
      addedAt: Date;
      lastUsed: Date;
    }>;
    ipWhitelist: string[];
    timeRestrictions?: {
      enabled: boolean;
      allowedHours: Array<{
        startTime: string;
        endTime: string;
        daysOfWeek: number[];
      }>;
    };
  };
}

// This would extend your existing User model
// You can add these fields to your existing User schema

// ========================================
// RBAC Configuration & Metadata
// ========================================

export interface IRBACConfiguration extends Document {
  version: string;
  defaultSettings: {
    sessionTimeout: number;
    maxConcurrentSessions: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      maxAge: number; // days
    };
    mfaSettings: {
      required: boolean;
      methods: string[];
      gracePeriod: number; // hours
    };
    auditSettings: {
      retentionPeriod: number; // days
      sensitiveOperations: string[];
      complianceMode: boolean;
    };
  };
  emergencySettings: {
    enabled: boolean;
    approvers: string[];
    maxDuration: number; // minutes
    permissions: string[];
  };
  complianceFrameworks: Array<{
    name: string;
    enabled: boolean;
    requirements: Array<{
      id: string;
      description: string;
      automated: boolean;
      frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    }>;
  }>;
  lastUpdated: Date;
  updatedBy: string;
}

const RBACConfigurationSchema = new Schema<IRBACConfiguration>({
  version: { type: String, required: true },
  defaultSettings: {
    sessionTimeout: { type: Number, required: true },
    maxConcurrentSessions: { type: Number, required: true },
    passwordPolicy: {
      minLength: { type: Number, required: true },
      requireUppercase: { type: Boolean, required: true },
      requireLowercase: { type: Boolean, required: true },
      requireNumbers: { type: Boolean, required: true },
      requireSpecialChars: { type: Boolean, required: true },
      maxAge: { type: Number, required: true }
    },
    mfaSettings: {
      required: { type: Boolean, required: true },
      methods: [{ type: String }],
      gracePeriod: { type: Number, required: true }
    },
    auditSettings: {
      retentionPeriod: { type: Number, required: true },
      sensitiveOperations: [{ type: String }],
      complianceMode: { type: Boolean, required: true }
    }
  },
  emergencySettings: {
    enabled: { type: Boolean, required: true },
    approvers: [{ type: String }],
    maxDuration: { type: Number, required: true },
    permissions: [{ type: String }]
  },
  complianceFrameworks: [{
    name: { type: String, required: true },
    enabled: { type: Boolean, required: true },
    requirements: [{
      id: { type: String, required: true },
      description: { type: String, required: true },
      automated: { type: Boolean, required: true },
      frequency: { type: String, required: true, enum: ['daily', 'weekly', 'monthly', 'quarterly'] }
    }]
  }],
  lastUpdated: { type: Date, required: true, default: Date.now },
  updatedBy: { type: String, required: true }
}, {
  timestamps: true,
  collection: 'rbac_configuration'
});

export const RBACConfigurationModel = mongoose.models.RBACConfiguration || 
  mongoose.model<IRBACConfiguration>('RBACConfiguration', RBACConfigurationSchema);

// ========================================
// Export all models
// ========================================

export const RBACModels = {
  TemporaryRoleModel,
  ResourceOwnershipModel,
  PermissionNodeModel,
  TimeBasedRuleModel,
  IPAccessRuleModel,
  SecurityEventModel,
  BulkOperationModel,
  RBACConfigurationModel
};

export default RBACModels;