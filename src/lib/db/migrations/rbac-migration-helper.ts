/**
 * RBAC Migration Helper - TypeScript Integration
 * Provides TypeScript support for RBAC migrations and database utilities
 */

import { MongoClient, Db, Collection } from 'mongodb';
import type { UserWithRBAC, RoleWithRBAC } from '../../auth/rbac-extensions';
import type { 
  IPermissionNode, 
  IPermissionInheritance, 
  IDynamicRoleAssignment,
  IResourceOwnership,
  ITimeBasedAccess,
  IIPBasedAccess,
  IPermissionAnalytics,
  ISecurityEvent,
  IBulkOperation
} from '../../auth/rbac-models';

// ========================================
// Migration Types
// ========================================

export interface MigrationContext {
  db: Db;
  client: MongoClient;
  collections: {
    users: Collection<UserWithRBAC>;
    roles: Collection<RoleWithRBAC>;
    permissionNodes: Collection<IPermissionNode>;
    permissionInheritance: Collection<IPermissionInheritance>;
    dynamicRoleAssignments: Collection<IDynamicRoleAssignment>;
    resourceOwnership: Collection<IResourceOwnership>;
    timeBasedAccess: Collection<ITimeBasedAccess>;
    ipBasedAccess: Collection<IIPBasedAccess>;
    permissionAnalytics: Collection<IPermissionAnalytics>;
    securityEvents: Collection<ISecurityEvent>;
    bulkOperations: Collection<IBulkOperation>;
    rbacAuditLog: Collection<IRBACAuditLog>;
  };
}

export interface IRBACAuditLog {
  auditId: string;
  action: string;
  userId: string;
  userEmail: string;
  userRole: string;
  resource: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'partial';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface MigrationStats {
  usersUpdated: number;
  rolesUpdated: number;
  collectionsCreated: number;
  indexesCreated: number;
  permissionNodesCreated: number;
  executionTime: number;
  errors: string[];
}

// ========================================
// Migration Helper Class
// ========================================

export class RBACMigrationHelper {
  private db: Db;
  private stats: MigrationStats;

  constructor(db: Db) {
    this.db = db;
    this.stats = {
      usersUpdated: 0,
      rolesUpdated: 0,
      collectionsCreated: 0,
      indexesCreated: 0,
      permissionNodesCreated: 0,
      executionTime: 0,
      errors: []
    };
  }

  /**
   * Get typed collections for RBAC operations
   */
  getCollections(): MigrationContext['collections'] {
    return {
      users: this.db.collection<UserWithRBAC>('users'),
      roles: this.db.collection<RoleWithRBAC>('roles'),
      permissionNodes: this.db.collection<IPermissionNode>('permission_nodes'),
      permissionInheritance: this.db.collection<IPermissionInheritance>('permission_inheritance'),
      dynamicRoleAssignments: this.db.collection<IDynamicRoleAssignment>('dynamic_role_assignments'),
      resourceOwnership: this.db.collection<IResourceOwnership>('resource_ownership'),
      timeBasedAccess: this.db.collection<ITimeBasedAccess>('time_based_access'),
      ipBasedAccess: this.db.collection<IIPBasedAccess>('ip_based_access'),
      permissionAnalytics: this.db.collection<IPermissionAnalytics>('permission_analytics'),
      securityEvents: this.db.collection<ISecurityEvent>('security_events'),
      bulkOperations: this.db.collection<IBulkOperation>('bulk_operations'),
      rbacAuditLog: this.db.collection<IRBACAuditLog>('rbac_audit_log')
    };
  }

  /**
   * Safely extend users with RBAC capabilities
   */
  async extendUsersWithRBAC(): Promise<number> {
    const collections = this.getCollections();
    const startTime = Date.now();

    try {
      const result = await collections.users.updateMany(
        { rbac: { $exists: false } },
        {
          $set: {
            rbac: this.getDefaultUserRBACExtension()
          }
        }
      );

      this.stats.usersUpdated = result.modifiedCount;
      console.log(`✓ Extended ${result.modifiedCount} users with RBAC capabilities`);
      
      return result.modifiedCount;
    } catch (error) {
      const errorMsg = `Failed to extend users with RBAC: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.stats.errors.push(errorMsg);
      throw new Error(errorMsg);
    } finally {
      this.stats.executionTime += Date.now() - startTime;
    }
  }

  /**
   * Safely extend roles with RBAC capabilities
   */
  async extendRolesWithRBAC(): Promise<number> {
    const collections = this.getCollections();
    const startTime = Date.now();

    try {
      const result = await collections.roles.updateMany(
        { rbac: { $exists: false } },
        {
          $set: {
            rbac: this.getDefaultRoleRBACExtension()
          }
        }
      );

      // Update admin roles with enhanced security
      await collections.roles.updateMany(
        { code: { $in: ['admin', 'super_admin'] } },
        {
          $set: {
            'rbac.properties.assignment.requiresApproval': true,
            'rbac.properties.riskProfile.riskLevel': 'high',
            'rbac.properties.monitoring.enabled': true,
            'rbac.properties.monitoring.alertOnAssignment': true,
            'rbac.properties.monitoring.alertOnUsage': true,
            'rbac.properties.monitoring.auditLevel': 'comprehensive'
          }
        }
      );

      // Set super admin limits
      await collections.roles.updateOne(
        { code: 'super_admin' },
        {
          $set: {
            'rbac.properties.assignment.maxUsers': 5,
            'rbac.properties.riskProfile.riskLevel': 'critical'
          }
        }
      );

      this.stats.rolesUpdated = result.modifiedCount;
      console.log(`✓ Extended ${result.modifiedCount} roles with RBAC capabilities`);
      
      return result.modifiedCount;
    } catch (error) {
      const errorMsg = `Failed to extend roles with RBAC: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.stats.errors.push(errorMsg);
      throw new Error(errorMsg);
    } finally {
      this.stats.executionTime += Date.now() - startTime;
    }
  }

  /**
   * Create permission nodes for existing roles
   */
  async createPermissionNodesForRoles(): Promise<number> {
    const collections = this.getCollections();
    const startTime = Date.now();

    try {
      const roles = await collections.roles.find({}).toArray();
      let createdCount = 0;

      for (const role of roles) {
        const permissionNode: IPermissionNode = {
          nodeId: `role_${role._id}`,
          type: 'role',
          name: role.name,
          description: role.description || `Permission node for ${role.name} role`,
          permissions: role.permissions || [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            roleCode: role.code,
            riskLevel: role.rbac?.properties?.riskProfile?.riskLevel || 'low',
            requiresApproval: role.rbac?.properties?.assignment?.requiresApproval || false
          },
          tags: [`role:${role.code}`, `risk:${role.rbac?.properties?.riskProfile?.riskLevel || 'low'}`],
          version: 1,
          inheritanceRules: {
            canInherit: role.rbac?.properties?.inheritance?.canInherit || true,
            canDelegate: role.rbac?.properties?.inheritance?.canDelegate || false,
            inheritanceLevel: role.rbac?.properties?.inheritance?.inheritanceLevel || 0,
            excludedPermissions: role.rbac?.properties?.inheritance?.exclusions || []
          }
        };

        await collections.permissionNodes.insertOne(permissionNode);
        createdCount++;
      }

      this.stats.permissionNodesCreated = createdCount;
      console.log(`✓ Created ${createdCount} permission nodes for existing roles`);
      
      return createdCount;
    } catch (error) {
      const errorMsg = `Failed to create permission nodes: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.stats.errors.push(errorMsg);
      throw new Error(errorMsg);
    } finally {
      this.stats.executionTime += Date.now() - startTime;
    }
  }

  /**
   * Create comprehensive indexes for RBAC collections
   */
  async createRBACIndexes(): Promise<number> {
    const collections = this.getCollections();
    const startTime = Date.now();
    let indexCount = 0;

    try {
      // User collection indexes
      const userIndexes = [
        { key: { 'rbac.riskProfile.score': 1 }, name: 'rbac_risk_score' },
        { key: { 'rbac.riskProfile.level': 1 }, name: 'rbac_risk_level' },
        { key: { 'rbac.accessPatterns.loginTimes.timestamp': -1 }, name: 'rbac_login_times' },
        { key: { 'rbac.securitySettings.mfa.enabled': 1 }, name: 'rbac_mfa_enabled' },
        { key: { 'rbac.rbacState.temporaryRoles.expiresAt': 1 }, name: 'rbac_temp_roles_expiry' },
        { key: { 'rbac.rbacState.permissionCache.expiresAt': 1 }, name: 'rbac_permission_cache_expiry' },
        { key: { 'rbac.compliance.complianceStatus': 1 }, name: 'rbac_compliance_status' }
      ];

      for (const index of userIndexes) {
        await collections.users.createIndex(index.key as any, { name: index.name });
        indexCount++;
      }

      // Role collection indexes
      const roleIndexes = [
        { key: { 'rbac.properties.riskProfile.riskLevel': 1 }, name: 'rbac_role_risk_level' },
        { key: { 'rbac.properties.monitoring.enabled': 1 }, name: 'rbac_role_monitoring' },
        { key: { 'rbac.analytics.usage.totalUsers': -1 }, name: 'rbac_role_usage' }
      ];

      for (const index of roleIndexes) {
        await collections.roles.createIndex(index.key as any, { name: index.name });
        indexCount++;
      }

      // Permission nodes indexes
      const permissionNodeIndexes = [
        { key: { nodeId: 1 }, options: { unique: true, name: 'unique_node_id' } },
        { key: { type: 1 }, name: 'node_type' },
        { key: { isActive: 1 }, name: 'node_active' },
        { key: { permissions: 1 }, name: 'node_permissions' },
        { key: { tags: 1 }, name: 'node_tags' }
      ];

      for (const index of permissionNodeIndexes) {
        if (index.options) {
          await collections.permissionNodes.createIndex(index.key as any, index.options);
        } else {
          await collections.permissionNodes.createIndex(index.key as any, { name: index.name });
        }
        indexCount++;
      }

      // Security events indexes
      const securityEventIndexes = [
        { key: { eventId: 1 }, options: { unique: true, name: 'unique_event_id' } },
        { key: { eventType: 1 }, name: 'event_type' },
        { key: { severity: 1 }, name: 'event_severity' },
        { key: { timestamp: -1 }, name: 'event_timestamp' },
        { key: { userId: 1 }, name: 'event_user' },
        { key: { 'metadata.ipAddress': 1 }, name: 'event_ip' }
      ];

      for (const index of securityEventIndexes) {
        if (index.options) {
          await collections.securityEvents.createIndex(index.key as any, index.options);
        } else {
          await collections.securityEvents.createIndex(index.key as any, { name: index.name });
        }
        indexCount++;
      }

      // TTL indexes for cleanup
      await collections.securityEvents.createIndex(
        { timestamp: 1 },
        { 
          expireAfterSeconds: 2 * 365 * 24 * 60 * 60, // 2 years
          name: 'ttl_security_events'
        }
      );
      indexCount++;

      await collections.permissionAnalytics.createIndex(
        { generatedAt: 1 },
        { 
          expireAfterSeconds: 365 * 24 * 60 * 60, // 1 year
          name: 'ttl_analytics'
        }
      );
      indexCount++;

      this.stats.indexesCreated = indexCount;
      console.log(`✓ Created ${indexCount} RBAC indexes`);
      
      return indexCount;
    } catch (error) {
      const errorMsg = `Failed to create RBAC indexes: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.stats.errors.push(errorMsg);
      throw new Error(errorMsg);
    } finally {
      this.stats.executionTime += Date.now() - startTime;
    }
  }

  /**
   * Validate RBAC migration integrity
   */
  async validateMigration(): Promise<boolean> {
    const collections = this.getCollections();

    try {
      // Check if all users have RBAC extensions
      const usersWithoutRBAC = await collections.users.countDocuments({ rbac: { $exists: false } });
      if (usersWithoutRBAC > 0) {
        throw new Error(`${usersWithoutRBAC} users are missing RBAC extensions`);
      }

      // Check if all roles have RBAC extensions
      const rolesWithoutRBAC = await collections.roles.countDocuments({ rbac: { $exists: false } });
      if (rolesWithoutRBAC > 0) {
        throw new Error(`${rolesWithoutRBAC} roles are missing RBAC extensions`);
      }

      // Check if permission nodes exist for all roles
      const roleCount = await collections.roles.countDocuments({});
      const permissionNodeCount = await collections.permissionNodes.countDocuments({ type: 'role' });
      if (roleCount !== permissionNodeCount) {
        console.warn(`Warning: Role count (${roleCount}) doesn't match permission node count (${permissionNodeCount})`);
      }

      // Check critical indexes exist
      const userIndexes = await collections.users.listIndexes().toArray();
      const requiredUserIndexes = ['rbac_risk_score', 'rbac_mfa_enabled'];
      
      for (const indexName of requiredUserIndexes) {
        if (!userIndexes.some(idx => idx.name === indexName)) {
          throw new Error(`Required user index missing: ${indexName}`);
        }
      }

      console.log('✓ RBAC migration validation passed');
      return true;
    } catch (error) {
      const errorMsg = `Migration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
      return false;
    }
  }

  /**
   * Get migration statistics
   */
  getStats(): MigrationStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      usersUpdated: 0,
      rolesUpdated: 0,
      collectionsCreated: 0,
      indexesCreated: 0,
      permissionNodesCreated: 0,
      executionTime: 0,
      errors: []
    };
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private getDefaultUserRBACExtension(): UserWithRBAC['rbac'] {
    return {
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
    };
  }

  private getDefaultRoleRBACExtension(): RoleWithRBAC['rbac'] {
    return {
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
          requiresApproval: false,
          approvers: [],
          maxUsers: -1, // unlimited
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
          riskLevel: 'low',
          factors: [],
          mitigationControls: []
        },
        monitoring: {
          enabled: false,
          alertOnAssignment: false,
          alertOnUsage: false,
          alertOnViolations: true,
          alertThresholds: {
            unusualActivity: 5,
            privilegeEscalation: true,
            suspiciousAccess: true
          },
          auditLevel: 'basic'
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
          conflictingRoles: [],
          conflictingPermissions: []
        }
      }
    };
  }
}

export default RBACMigrationHelper;