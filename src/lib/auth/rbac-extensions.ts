/**
 * RBAC Extensions for existing User and Role models
 * This file extends the existing entities with RBAC capabilities
 */

import type { User, Role, UserRole } from '@/types/entities';
import type { IUserRBACExtension } from './rbac-models';

// ========================================
// Extended User Interface with RBAC
// ========================================

export interface UserWithRBAC extends User {
  // RBAC-specific extensions
  rbac?: {
    // Permission Node Reference
    permissionNodeId?: string;
    
    // Risk Assessment
    riskProfile: {
      score: number; // 0-100
      level: 'low' | 'medium' | 'high' | 'critical';
      lastCalculated: Date;
      factors: Array<{
        factor: string;
        impact: number;
        description: string;
        category: 'behavioral' | 'access_pattern' | 'privilege' | 'temporal' | 'geographic';
      }>;
      recommendations: string[];
    };
    
    // Access Patterns for Behavioral Analysis
    accessPatterns: {
      loginTimes: Array<{
        timestamp: Date;
        ipAddress: string;
        userAgent: string;
        location?: {
          country?: string;
          region?: string;
          city?: string;
        };
        sessionDuration?: number;
        successful: boolean;
      }>;
      
      frequentLocations: Array<{
        ipAddress: string;
        country?: string;
        region?: string;
        city?: string;
        count: number;
        firstSeen: Date;
        lastSeen: Date;
        riskLevel: 'trusted' | 'normal' | 'suspicious' | 'blocked';
      }>;
      
      deviceFingerprints: Array<{
        fingerprint: string;
        userAgent: string;
        deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
        os: string;
        browser: string;
        count: number;
        firstSeen: Date;
        lastSeen: Date;
        isTrusted: boolean;
      }>;
      
      usageStatistics: {
        totalSessions: number;
        averageSessionDuration: number;
        mostActiveHours: number[];
        mostActiveDaysOfWeek: number[];
        resourceAccessFrequency: Record<string, number>;
        permissionUsageFrequency: Record<string, number>;
      };
    };
    
    // Security Settings
    securitySettings: {
      // Multi-Factor Authentication
      mfa: {
        enabled: boolean;
        methods: Array<{
          type: 'totp' | 'sms' | 'email' | 'push';
          identifier: string; // phone number, email, etc.
          isVerified: boolean;
          addedAt: Date;
          lastUsed?: Date;
        }>;
        backupCodes?: Array<{
          code: string; // encrypted
          isUsed: boolean;
          usedAt?: Date;
        }>;
        gracePeriodEnd?: Date;
      };
      
      // Trusted Devices
      trustedDevices: Array<{
        deviceId: string;
        deviceName: string;
        fingerprint: string;
        userAgent: string;
        ipAddress: string;
        location?: string;
        addedAt: Date;
        lastUsed: Date;
        isActive: boolean;
        trustLevel: 'full' | 'partial' | 'revoked';
      }>;
      
      // IP Restrictions
      ipSettings: {
        whitelistedIPs: Array<{
          ip: string;
          description: string;
          addedBy: string;
          addedAt: Date;
          expiresAt?: Date;
        }>;
        blockedIPs: Array<{
          ip: string;
          reason: string;
          blockedBy: string;
          blockedAt: Date;
          expiresAt?: Date;
        }>;
        requireWhitelisting: boolean;
        allowVPN: boolean;
        allowTor: boolean;
      };
      
      // Time-based Restrictions
      timeRestrictions: {
        enabled: boolean;
        allowedHours: Array<{
          dayOfWeek: number; // 0-6, Sunday = 0
          startTime: string; // HH:MM
          endTime: string; // HH:MM
          timezone: string;
        }>;
        emergencyBypass: {
          enabled: boolean;
          maxDuration: number; // minutes
          requiresApproval: boolean;
          approvers: string[]; // user IDs
        };
      };
      
      // Session Management
      sessionSettings: {
        maxConcurrentSessions: number;
        sessionTimeout: number; // minutes
        idleTimeout: number; // minutes
        requireReauthenticationFor: string[]; // sensitive operations
        logoutOnInactivity: boolean;
      };
    };
    
    // RBAC State
    rbacState: {
      // Temporary Roles
      temporaryRoles: Array<{
        roleId: string;
        roleName: string;
        grantedBy: string;
        grantedAt: Date;
        expiresAt: Date;
        reason: string;
        isActive: boolean;
        permissions: string[];
        usageLog: Array<{
          timestamp: Date;
          action: string;
          resource: string;
          ipAddress: string;
        }>;
      }>;
      
      // Delegated Permissions
      delegatedPermissions: Array<{
        permissionId: string;
        permission: string;
        delegatedBy: string;
        delegatedAt: Date;
        expiresAt?: Date;
        conditions?: Array<{
          type: string;
          field: string;
          operator: string;
          value: any;
        }>;
        resources?: string[];
        isActive: boolean;
      }>;
      
      // Resource Ownership
      ownedResources: Array<{
        resourceType: string;
        resourceId: string;
        ownershipType: 'primary' | 'delegated' | 'temporary';
        grantedAt: Date;
        expiresAt?: Date;
        permissions: string[];
        canDelegate: boolean;
        isDelegated?: boolean;
        delegatedBy?: string;
      }>;
      
      // Permission Cache
      permissionCache: {
        effectivePermissions: string[];
        computedAt: Date;
        expiresAt: Date;
        source: 'direct' | 'inherited' | 'computed';
        invalidationTriggers: string[];
      };
    };
    
    // Compliance and Audit
    compliance: {
      lastAuditDate?: Date;
      nextAuditDue?: Date;
      complianceStatus: 'compliant' | 'non_compliant' | 'pending_review' | 'unknown';
      violations: Array<{
        type: string;
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        detectedAt: Date;
        resolvedAt?: Date;
        resolution?: string;
      }>;
      certifications: Array<{
        framework: 'SOX' | 'GDPR' | 'HIPAA' | 'PCI_DSS' | 'custom';
        status: 'active' | 'expired' | 'pending' | 'revoked';
        issuedAt: Date;
        expiresAt?: Date;
        certifiedBy: string;
      }>;
    };
  };
}

// ========================================
// Extended Role Interface with RBAC
// ========================================

export interface RoleWithRBAC extends Role {
  // RBAC-specific extensions
  rbac?: {
    // Permission Node Reference
    permissionNodeId?: string;
    
    // Advanced Role Properties
    properties: {
      // Inheritance Settings
      inheritance: {
        canInherit: boolean;
        canDelegate: boolean;
        inheritanceLevel: number; // depth in hierarchy
        parentRoles: string[]; // role IDs this role inherits from
        childRoles: string[]; // role IDs that inherit from this role
        exclusions: string[]; // permissions explicitly excluded from inheritance
      };
      
      // Assignment Rules
      assignment: {
        requiresApproval: boolean;
        approvers: Array<{
          userId: string;
          userRole: UserRole;
          isRequired: boolean;
          order: number; // approval order
        }>;
        maxUsers: number; // maximum users that can have this role
        autoExpiry: {
          enabled: boolean;
          defaultDuration: number; // days
          maxDuration: number; // days
          renewalAllowed: boolean;
        };
        conditions: Array<{
          type: 'department' | 'seniority' | 'certification' | 'custom';
          field: string;
          operator: string;
          value: any;
          description: string;
        }>;
      };
      
      // Access Restrictions
      restrictions: {
        timeBasedAccess: {
          enabled: boolean;
          allowedHours: Array<{
            dayOfWeek: number;
            startTime: string;
            endTime: string;
          }>;
          timezone: string;
          exceptions: Array<{
            reason: string;
            startDate: Date;
            endDate: Date;
            approvedBy: string;
          }>;
        };
        
        ipBasedAccess: {
          enabled: boolean;
          allowedIPs: string[];
          blockedIPs: string[];
          requireWhitelist: boolean;
          geoRestrictions: {
            allowedCountries: string[];
            blockedCountries: string[];
          };
        };
        
        resourceAccess: {
          scopeRestrictions: Array<{
            resourceType: string;
            allowedResources: string[];
            conditions: Array<{
              field: string;
              operator: string;
              value: any;
            }>;
          }>;
        };
      };
      
      // Risk Assessment
      riskProfile: {
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
        factors: Array<{
          factor: string;
          weight: number;
          description: string;
        }>;
        mitigationControls: Array<{
          control: string;
          type: 'preventive' | 'detective' | 'corrective';
          effectiveness: number; // 0-100
        }>;
      };
      
      // Monitoring and Alerting
      monitoring: {
        enabled: boolean;
        alertOnAssignment: boolean;
        alertOnUsage: boolean;
        alertOnViolations: boolean;
        alertThresholds: {
          unusualActivity: number;
          privilegeEscalation: boolean;
          suspiciousAccess: boolean;
        };
        auditLevel: 'basic' | 'detailed' | 'comprehensive';
      };
    };
    
    // Role Analytics
    analytics: {
      usage: {
        totalUsers: number;
        activeUsers: number;
        averageSessionDuration: number;
        mostUsedPermissions: Array<{
          permission: string;
          usageCount: number;
          uniqueUsers: number;
        }>;
        leastUsedPermissions: Array<{
          permission: string;
          usageCount: number;
          uniqueUsers: number;
        }>;
      };
      
      security: {
        violationCount: number;
        lastViolation?: Date;
        commonViolations: Array<{
          type: string;
          count: number;
          severity: string;
        }>;
        riskEvents: Array<{
          event: string;
          timestamp: Date;
          severity: string;
          resolved: boolean;
        }>;
      };
      
      performance: {
        assignmentTime: number; // average time to assign role
        approvalTime: number; // average time for approval
        utilizationRate: number; // percentage of permissions actually used
        satisfactionScore: number; // user satisfaction with role capabilities
      };
    };
    
    // Compliance Mappings
    compliance: {
      frameworks: Array<{
        name: 'SOX' | 'GDPR' | 'HIPAA' | 'PCI_DSS' | 'ISO27001' | 'NIST' | 'custom';
        requirements: Array<{
          requirementId: string;
          description: string;
          status: 'compliant' | 'non_compliant' | 'not_applicable';
          lastAudit: Date;
          evidence: string[];
        }>;
        controlMappings: Array<{
          controlId: string;
          controlDescription: string;
          permissions: string[];
          effectiveness: number;
        }>;
      }>;
      
      segregationOfDuties: {
        enabled: boolean;
        conflictingRoles: string[]; // roles that cannot be held simultaneously
        conflictingPermissions: Array<{
          permission1: string;
          permission2: string;
          reason: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
        }>;
      };
    };
  };
}

// ========================================
// RBAC Context for Request Processing
// ========================================

export interface RBACRequestContext {
  // Request Information
  request: {
    userId: string;
    sessionId: string;
    requestId: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    geolocation?: {
      country?: string;
      region?: string;
      city?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
  };
  
  // User Context
  user: {
    id: string;
    email: string;
    currentRole: UserRole;
    allRoles: UserRole[];
    department?: string;
    committee?: string;
    riskScore: number;
    lastLogin?: Date;
    sessionCount: number;
    isFirstLogin: boolean;
  };
  
  // Resource Context
  resource?: {
    type: string;
    id: string;
    owner?: string;
    sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
    classification?: string;
    department?: string;
    accessHistory?: Array<{
      userId: string;
      timestamp: Date;
      action: string;
    }>;
  };
  
  // Security Context
  security: {
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    indicators: Array<{
      type: string;
      value: any;
      confidence: number;
      description: string;
    }>;
    anomalies: Array<{
      type: string;
      severity: string;
      description: string;
      timestamp: Date;
    }>;
    activeRestrictions: Array<{
      type: 'time' | 'ip' | 'geo' | 'device' | 'mfa';
      status: 'active' | 'bypassed' | 'violated';
      reason?: string;
    }>;
  };
  
  // Audit Context
  audit: {
    requiresAudit: boolean;
    auditLevel: 'basic' | 'detailed' | 'comprehensive';
    complianceFrameworks: string[];
    retentionPeriod: number; // days
    sensitiveOperation: boolean;
  };
}

// ========================================
// RBAC Integration Utilities
// ========================================

export interface RBACIntegrationConfig {
  // Feature Flags
  features: {
    dynamicRoles: boolean;
    resourceOwnership: boolean;
    permissionInheritance: boolean;
    timeBasedAccess: boolean;
    ipBasedAccess: boolean;
    behavioralAnalytics: boolean;
    bulkOperations: boolean;
    securityMonitoring: boolean;
  };
  
  // Performance Settings
  performance: {
    cacheTimeout: number; // minutes
    maxConcurrentChecks: number;
    batchSize: number;
    asyncProcessing: boolean;
  };
  
  // Security Settings
  security: {
    defaultRiskThreshold: number;
    encryptSensitiveData: boolean;
    enableAuditLogging: boolean;
    requireMFAForAdmin: boolean;
    sessionTimeout: number; // minutes
  };
  
  // Compliance Settings
  compliance: {
    enabledFrameworks: string[];
    defaultRetentionPeriod: number; // days
    automaticReporting: boolean;
    alertOnViolations: boolean;
  };
  
  // Integration Settings
  integration: {
    existingUserModel: string; // model name
    existingRoleModel: string; // model name
    migrationMode: 'gradual' | 'complete' | 'hybrid';
    backwardCompatibility: boolean;
  };
}

// ========================================
// Migration and Compatibility Types
// ========================================

export interface RBACMigrationPlan {
  phase: 'preparation' | 'migration' | 'validation' | 'cleanup';
  steps: Array<{
    id: string;
    name: string;
    description: string;
    type: 'data' | 'schema' | 'code' | 'validation';
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
    dependencies: string[];
    estimatedDuration: number; // minutes
    backupRequired: boolean;
    rollbackPlan?: string;
  }>;
  
  validation: {
    dataIntegrityChecks: string[];
    performanceTests: string[];
    securityValidation: string[];
    complianceVerification: string[];
  };
  
  rollback: {
    enabled: boolean;
    triggers: string[];
    steps: string[];
    dataRetention: number; // days
  };
}

// ========================================
// Export Types for External Use
// ========================================

export type {
  UserWithRBAC as ExtendedUser,
  RoleWithRBAC as ExtendedRole
};

// ========================================
// Utility Functions for Integration
// ========================================

export const RBACIntegrationUtils = {
  /**
   * Convert existing User to RBAC-enabled User
   */
  enhanceUser: (user: User): UserWithRBAC => {
    return {
      ...user,
      rbac: {
        riskProfile: {
          score: 0,
          level: 'low',
          lastCalculated: new Date(),
          factors: [],
          recommendations: []
        },
        accessPatterns: {
          loginTimes: [],
          frequentLocations: [],
          deviceFingerprints: [],
          usageStatistics: {
            totalSessions: 0,
            averageSessionDuration: 0,
            mostActiveHours: [],
            mostActiveDaysOfWeek: [],
            resourceAccessFrequency: {},
            permissionUsageFrequency: {}
          }
        },
        securitySettings: {
          mfa: {
            enabled: false,
            methods: []
          },
          trustedDevices: [],
          ipSettings: {
            whitelistedIPs: [],
            blockedIPs: [],
            requireWhitelisting: false,
            allowVPN: true,
            allowTor: false
          },
          timeRestrictions: {
            enabled: false,
            allowedHours: [],
            emergencyBypass: {
              enabled: false,
              maxDuration: 60,
              requiresApproval: true,
              approvers: []
            }
          },
          sessionSettings: {
            maxConcurrentSessions: 3,
            sessionTimeout: 480, // 8 hours
            idleTimeout: 30,
            requireReauthenticationFor: ['admin.*', 'sensitive.*'],
            logoutOnInactivity: true
          }
        },
        rbacState: {
          temporaryRoles: [],
          delegatedPermissions: [],
          ownedResources: [],
          permissionCache: {
            effectivePermissions: [],
            computedAt: new Date(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            source: 'direct',
            invalidationTriggers: []
          }
        },
        compliance: {
          complianceStatus: 'unknown',
          violations: [],
          certifications: []
        }
      }
    };
  },

  /**
   * Convert existing Role to RBAC-enabled Role
   */
  enhanceRole: (role: Role): RoleWithRBAC => {
    return {
      ...role,
      rbac: {
        properties: {
          inheritance: {
            canInherit: true,
            canDelegate: false,
            inheritanceLevel: 0,
            parentRoles: [],
            childRoles: [],
            exclusions: []
          },
          assignment: {
            requiresApproval: role.code === 'admin' || role.code === 'super_admin',
            approvers: [],
            maxUsers: role.code === 'super_admin' ? 5 : -1, // unlimited for others
            autoExpiry: {
              enabled: false,
              defaultDuration: 365,
              maxDuration: 1095, // 3 years
              renewalAllowed: true
            },
            conditions: []
          },
          restrictions: {
            timeBasedAccess: {
              enabled: false,
              allowedHours: [],
              timezone: 'Asia/Kolkata',
              exceptions: []
            },
            ipBasedAccess: {
              enabled: false,
              allowedIPs: [],
              blockedIPs: [],
              requireWhitelist: false,
              geoRestrictions: {
                allowedCountries: ['IN'],
                blockedCountries: []
              }
            },
            resourceAccess: {
              scopeRestrictions: []
            }
          },
          riskProfile: {
            riskLevel: role.code === 'super_admin' ? 'critical' : 
                      role.code === 'admin' ? 'high' :
                      role.code === 'faculty' ? 'medium' : 'low',
            factors: [],
            mitigationControls: []
          },
          monitoring: {
            enabled: role.code === 'admin' || role.code === 'super_admin',
            alertOnAssignment: role.code === 'admin' || role.code === 'super_admin',
            alertOnUsage: role.code === 'super_admin',
            alertOnViolations: true,
            alertThresholds: {
              unusualActivity: 5,
              privilegeEscalation: true,
              suspiciousAccess: true
            },
            auditLevel: role.code === 'super_admin' ? 'comprehensive' : 
                       role.code === 'admin' ? 'detailed' : 'basic'
          }
        },
        analytics: {
          usage: {
            totalUsers: 0,
            activeUsers: 0,
            averageSessionDuration: 0,
            mostUsedPermissions: [],
            leastUsedPermissions: []
          },
          security: {
            violationCount: 0,
            commonViolations: [],
            riskEvents: []
          },
          performance: {
            assignmentTime: 0,
            approvalTime: 0,
            utilizationRate: 0,
            satisfactionScore: 0
          }
        },
        compliance: {
          frameworks: [],
          segregationOfDuties: {
            enabled: true,
            conflictingRoles: role.code === 'admin' ? ['student'] : [],
            conflictingPermissions: []
          }
        }
      }
    };
  },

  /**
   * Create RBAC request context
   */
  createRequestContext: (
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    additional?: Partial<RBACRequestContext>
  ): RBACRequestContext => {
    return {
      request: {
        userId,
        sessionId,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date(),
        ipAddress,
        userAgent,
        ...additional?.request
      },
      user: {
        id: userId,
        email: '',
        currentRole: 'unknown',
        allRoles: [],
        riskScore: 0,
        sessionCount: 1,
        isFirstLogin: false,
        ...additional?.user
      },
      security: {
        threatLevel: 'low',
        indicators: [],
        anomalies: [],
        activeRestrictions: [],
        ...additional?.security
      },
      audit: {
        requiresAudit: true,
        auditLevel: 'basic',
        complianceFrameworks: [],
        retentionPeriod: 2555, // 7 years
        sensitiveOperation: false,
        ...additional?.audit
      },
      ...additional
    };
  }
};

export default RBACIntegrationUtils;