/**
 * RBAC Migration 001: Initialize RBAC Schema Extensions
 * This migration extends existing User and Role collections with RBAC fields
 * and creates new RBAC-specific collections.
 */

const { MongoClient } = require('mongodb');

const migration = {
  version: '001',
  name: 'Initialize RBAC Schema Extensions',
  description: 'Add RBAC fields to existing collections and create new RBAC collections',
  
  async up(db) {
    console.log('Starting RBAC Migration 001: Initialize RBAC Schema Extensions');
    
    // ========================================
    // 1. Extend existing User collection
    // ========================================
    console.log('1. Extending User collection with RBAC fields...');
    
    // Add RBAC extension to all existing users
    await db.collection('users').updateMany(
      { rbac: { $exists: false } },
      {
        $set: {
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
        }
      }
    );
    
    // Create indexes for User collection RBAC fields
    await db.collection('users').createIndex({ 'rbac.riskProfile.score': 1 });
    await db.collection('users').createIndex({ 'rbac.riskProfile.level': 1 });
    await db.collection('users').createIndex({ 'rbac.accessPatterns.loginTimes.timestamp': -1 });
    await db.collection('users').createIndex({ 'rbac.securitySettings.mfa.enabled': 1 });
    await db.collection('users').createIndex({ 'rbac.rbacState.temporaryRoles.expiresAt': 1 });
    await db.collection('users').createIndex({ 'rbac.rbacState.permissionCache.expiresAt': 1 });
    await db.collection('users').createIndex({ 'rbac.compliance.complianceStatus': 1 });
    
    console.log('✓ User collection extended with RBAC fields');
    
    // ========================================
    // 2. Extend existing Role collection
    // ========================================
    console.log('2. Extending Role collection with RBAC fields...');
    
    await db.collection('roles').updateMany(
      { rbac: { $exists: false } },
      {
        $set: {
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
          }
        }
      }
    );
    
    // Update specific roles with enhanced security settings
    await db.collection('roles').updateMany(
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
    
    await db.collection('roles').updateOne(
      { code: 'super_admin' },
      {
        $set: {
          'rbac.properties.assignment.maxUsers': 5,
          'rbac.properties.riskProfile.riskLevel': 'critical'
        }
      }
    );
    
    // Create indexes for Role collection RBAC fields
    await db.collection('roles').createIndex({ 'rbac.properties.riskProfile.riskLevel': 1 });
    await db.collection('roles').createIndex({ 'rbac.properties.monitoring.enabled': 1 });
    await db.collection('roles').createIndex({ 'rbac.analytics.usage.totalUsers': -1 });
    
    console.log('✓ Role collection extended with RBAC fields');
    
    // ========================================
    // 3. Create Permission Nodes collection
    // ========================================
    console.log('3. Creating Permission Nodes collection...');
    
    await db.createCollection('permission_nodes', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['nodeId', 'type', 'name', 'permissions', 'isActive'],
          properties: {
            nodeId: {
              bsonType: 'string',
              description: 'Unique identifier for the permission node'
            },
            type: {
              bsonType: 'string',
              enum: ['role', 'user', 'resource', 'department'],
              description: 'Type of permission node'
            },
            name: {
              bsonType: 'string',
              description: 'Human readable name'
            },
            permissions: {
              bsonType: 'array',
              items: {
                bsonType: 'string'
              },
              description: 'List of permissions'
            },
            isActive: {
              bsonType: 'bool',
              description: 'Whether the node is active'
            }
          }
        }
      }
    });
    
    await db.collection('permission_nodes').createIndex({ nodeId: 1 }, { unique: true });
    await db.collection('permission_nodes').createIndex({ type: 1 });
    await db.collection('permission_nodes').createIndex({ isActive: 1 });
    await db.collection('permission_nodes').createIndex({ permissions: 1 });
    
    console.log('✓ Permission Nodes collection created');
    
    // ========================================
    // 4. Create Permission Inheritance collection
    // ========================================
    console.log('4. Creating Permission Inheritance collection...');
    
    await db.createCollection('permission_inheritance', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['parentId', 'childId', 'relationshipType', 'inheritedPermissions', 'isActive'],
          properties: {
            parentId: {
              bsonType: 'string',
              description: 'Parent node ID'
            },
            childId: {
              bsonType: 'string',
              description: 'Child node ID'
            },
            relationshipType: {
              bsonType: 'string',
              enum: ['role_hierarchy', 'department_hierarchy', 'delegation', 'temporary'],
              description: 'Type of inheritance relationship'
            },
            inheritedPermissions: {
              bsonType: 'array',
              items: {
                bsonType: 'string'
              },
              description: 'Permissions inherited from parent'
            },
            isActive: {
              bsonType: 'bool',
              description: 'Whether the inheritance is active'
            }
          }
        }
      }
    });
    
    await db.collection('permission_inheritance').createIndex({ parentId: 1, childId: 1 }, { unique: true });
    await db.collection('permission_inheritance').createIndex({ parentId: 1 });
    await db.collection('permission_inheritance').createIndex({ childId: 1 });
    await db.collection('permission_inheritance').createIndex({ relationshipType: 1 });
    await db.collection('permission_inheritance').createIndex({ isActive: 1 });
    
    console.log('✓ Permission Inheritance collection created');
    
    // ========================================
    // 5. Create Dynamic Role Assignments collection
    // ========================================
    console.log('5. Creating Dynamic Role Assignments collection...');
    
    await db.createCollection('dynamic_role_assignments', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['assignmentId', 'userId', 'roleId', 'assignmentType', 'status', 'grantedBy', 'grantedAt'],
          properties: {
            assignmentId: {
              bsonType: 'string',
              description: 'Unique assignment identifier'
            },
            userId: {
              bsonType: 'string',
              description: 'User receiving the role'
            },
            roleId: {
              bsonType: 'string',
              description: 'Role being assigned'
            },
            assignmentType: {
              bsonType: 'string',
              enum: ['permanent', 'temporary', 'conditional', 'emergency'],
              description: 'Type of assignment'
            },
            status: {
              bsonType: 'string',
              enum: ['pending', 'active', 'expired', 'revoked', 'suspended'],
              description: 'Current status'
            },
            grantedBy: {
              bsonType: 'string',
              description: 'User who granted the role'
            },
            grantedAt: {
              bsonType: 'date',
              description: 'When the role was granted'
            }
          }
        }
      }
    });
    
    await db.collection('dynamic_role_assignments').createIndex({ assignmentId: 1 }, { unique: true });
    await db.collection('dynamic_role_assignments').createIndex({ userId: 1 });
    await db.collection('dynamic_role_assignments').createIndex({ roleId: 1 });
    await db.collection('dynamic_role_assignments').createIndex({ status: 1 });
    await db.collection('dynamic_role_assignments').createIndex({ grantedAt: -1 });
    await db.collection('dynamic_role_assignments').createIndex({ expiresAt: 1 });
    
    console.log('✓ Dynamic Role Assignments collection created');
    
    // ========================================
    // 6. Create Resource Ownership collection
    // ========================================
    console.log('6. Creating Resource Ownership collection...');
    
    await db.createCollection('resource_ownership', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['ownershipId', 'resourceType', 'resourceId', 'ownerId', 'ownershipType', 'isActive'],
          properties: {
            ownershipId: {
              bsonType: 'string',
              description: 'Unique ownership identifier'
            },
            resourceType: {
              bsonType: 'string',
              description: 'Type of resource'
            },
            resourceId: {
              bsonType: 'string',
              description: 'Resource identifier'
            },
            ownerId: {
              bsonType: 'string',
              description: 'Owner user ID'
            },
            ownershipType: {
              bsonType: 'string',
              enum: ['primary', 'delegated', 'temporary', 'shared'],
              description: 'Type of ownership'
            },
            isActive: {
              bsonType: 'bool',
              description: 'Whether ownership is active'
            }
          }
        }
      }
    });
    
    await db.collection('resource_ownership').createIndex({ ownershipId: 1 }, { unique: true });
    await db.collection('resource_ownership').createIndex({ resourceType: 1, resourceId: 1 });
    await db.collection('resource_ownership').createIndex({ ownerId: 1 });
    await db.collection('resource_ownership').createIndex({ ownershipType: 1 });
    await db.collection('resource_ownership').createIndex({ isActive: 1 });
    
    console.log('✓ Resource Ownership collection created');
    
    // ========================================
    // 7. Create Time Based Access collection
    // ========================================
    console.log('7. Creating Time Based Access collection...');
    
    await db.createCollection('time_based_access', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['ruleId', 'entityType', 'entityId', 'ruleType', 'isActive'],
          properties: {
            ruleId: {
              bsonType: 'string',
              description: 'Unique rule identifier'
            },
            entityType: {
              bsonType: 'string',
              enum: ['user', 'role', 'resource'],
              description: 'Type of entity the rule applies to'
            },
            entityId: {
              bsonType: 'string',
              description: 'Entity identifier'
            },
            ruleType: {
              bsonType: 'string',
              enum: ['business_hours', 'maintenance_window', 'emergency_access', 'custom'],
              description: 'Type of time-based rule'
            },
            isActive: {
              bsonType: 'bool',
              description: 'Whether the rule is active'
            }
          }
        }
      }
    });
    
    await db.collection('time_based_access').createIndex({ ruleId: 1 }, { unique: true });
    await db.collection('time_based_access').createIndex({ entityType: 1, entityId: 1 });
    await db.collection('time_based_access').createIndex({ ruleType: 1 });
    await db.collection('time_based_access').createIndex({ isActive: 1 });
    
    console.log('✓ Time Based Access collection created');
    
    // ========================================
    // 8. Create IP Based Access collection
    // ========================================
    console.log('8. Creating IP Based Access collection...');
    
    await db.createCollection('ip_based_access', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['ruleId', 'entityType', 'entityId', 'ruleType', 'isActive'],
          properties: {
            ruleId: {
              bsonType: 'string',
              description: 'Unique rule identifier'
            },
            entityType: {
              bsonType: 'string',
              enum: ['user', 'role', 'resource'],
              description: 'Type of entity the rule applies to'
            },
            entityId: {
              bsonType: 'string',
              description: 'Entity identifier'
            },
            ruleType: {
              bsonType: 'string',
              enum: ['whitelist', 'blacklist', 'geographic', 'threat_intel'],
              description: 'Type of IP-based rule'
            },
            isActive: {
              bsonType: 'bool',
              description: 'Whether the rule is active'
            }
          }
        }
      }
    });
    
    await db.collection('ip_based_access').createIndex({ ruleId: 1 }, { unique: true });
    await db.collection('ip_based_access').createIndex({ entityType: 1, entityId: 1 });
    await db.collection('ip_based_access').createIndex({ ruleType: 1 });
    await db.collection('ip_based_access').createIndex({ isActive: 1 });
    
    console.log('✓ IP Based Access collection created');
    
    // ========================================
    // 9. Create Permission Analytics collection
    // ========================================
    console.log('9. Creating Permission Analytics collection...');
    
    await db.createCollection('permission_analytics', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['reportId', 'reportType', 'generatedAt', 'data'],
          properties: {
            reportId: {
              bsonType: 'string',
              description: 'Unique report identifier'
            },
            reportType: {
              bsonType: 'string',
              enum: ['usage', 'compliance', 'risk', 'trend', 'violation'],
              description: 'Type of analytics report'
            },
            generatedAt: {
              bsonType: 'date',
              description: 'When the report was generated'
            },
            data: {
              bsonType: 'object',
              description: 'Report data'
            }
          }
        }
      }
    });
    
    await db.collection('permission_analytics').createIndex({ reportId: 1 }, { unique: true });
    await db.collection('permission_analytics').createIndex({ reportType: 1 });
    await db.collection('permission_analytics').createIndex({ generatedAt: -1 });
    
    console.log('✓ Permission Analytics collection created');
    
    // ========================================
    // 10. Create Security Events collection
    // ========================================
    console.log('10. Creating Security Events collection...');
    
    await db.createCollection('security_events', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['eventId', 'eventType', 'severity', 'timestamp', 'userId'],
          properties: {
            eventId: {
              bsonType: 'string',
              description: 'Unique event identifier'
            },
            eventType: {
              bsonType: 'string',
              enum: ['login_attempt', 'permission_denied', 'privilege_escalation', 'suspicious_activity', 'policy_violation', 'emergency_access'],
              description: 'Type of security event'
            },
            severity: {
              bsonType: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Event severity level'
            },
            timestamp: {
              bsonType: 'date',
              description: 'When the event occurred'
            },
            userId: {
              bsonType: 'string',
              description: 'User associated with the event'
            }
          }
        }
      }
    });
    
    await db.collection('security_events').createIndex({ eventId: 1 }, { unique: true });
    await db.collection('security_events').createIndex({ eventType: 1 });
    await db.collection('security_events').createIndex({ severity: 1 });
    await db.collection('security_events').createIndex({ timestamp: -1 });
    await db.collection('security_events').createIndex({ userId: 1 });
    
    console.log('✓ Security Events collection created');
    
    // ========================================
    // 11. Create RBAC Audit Log collection
    // ========================================
    console.log('11. Creating RBAC Audit Log collection...');
    
    await db.createCollection('rbac_audit_log', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['auditId', 'action', 'userId', 'timestamp', 'status'],
          properties: {
            auditId: {
              bsonType: 'string',
              description: 'Unique audit identifier'
            },
            action: {
              bsonType: 'string',
              description: 'Action that was performed'
            },
            userId: {
              bsonType: 'string',
              description: 'User who performed the action'
            },
            timestamp: {
              bsonType: 'date',
              description: 'When the action occurred'
            },
            status: {
              bsonType: 'string',
              enum: ['success', 'failed', 'partial'],
              description: 'Status of the action'
            }
          }
        }
      }
    });
    
    await db.collection('rbac_audit_log').createIndex({ auditId: 1 }, { unique: true });
    await db.collection('rbac_audit_log').createIndex({ action: 1 });
    await db.collection('rbac_audit_log').createIndex({ userId: 1 });
    await db.collection('rbac_audit_log').createIndex({ timestamp: -1 });
    await db.collection('rbac_audit_log').createIndex({ status: 1 });
    
    console.log('✓ RBAC Audit Log collection created');
    
    // ========================================
    // 12. Insert initial RBAC configuration
    // ========================================
    console.log('12. Inserting initial RBAC configuration...');
    
    // Insert initial permission nodes for existing roles
    const roles = await db.collection('roles').find({}).toArray();
    for (const role of roles) {
      await db.collection('permission_nodes').insertOne({
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
        }
      });
    }
    
    console.log(`✓ Created ${roles.length} permission nodes for existing roles`);
    
    // ========================================
    // 13. Create TTL indexes for cleanup
    // ========================================
    console.log('13. Creating TTL indexes for automatic cleanup...');
    
    // Expire temporary role assignments after 30 days
    await db.collection('dynamic_role_assignments').createIndex(
      { updatedAt: 1 },
      { 
        expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
        partialFilterExpression: { status: { $in: ['expired', 'revoked'] } }
      }
    );
    
    // Expire old security events after 2 years
    await db.collection('security_events').createIndex(
      { timestamp: 1 },
      { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 } // 2 years
    );
    
    // Expire old analytics reports after 1 year
    await db.collection('permission_analytics').createIndex(
      { generatedAt: 1 },
      { expireAfterSeconds: 365 * 24 * 60 * 60 } // 1 year
    );
    
    console.log('✓ TTL indexes created for automatic cleanup');
    
    console.log('✅ RBAC Migration 001 completed successfully!');
  },
  
  async down(db) {
    console.log('Reverting RBAC Migration 001...');
    
    // Remove RBAC fields from existing collections
    await db.collection('users').updateMany({}, { $unset: { rbac: 1 } });
    await db.collection('roles').updateMany({}, { $unset: { rbac: 1 } });
    
    // Drop RBAC collections
    const rbacCollections = [
      'permission_nodes',
      'permission_inheritance', 
      'dynamic_role_assignments',
      'resource_ownership',
      'time_based_access',
      'ip_based_access',
      'permission_analytics',
      'security_events',
      'rbac_audit_log'
    ];
    
    for (const collection of rbacCollections) {
      try {
        await db.collection(collection).drop();
        console.log(`✓ Dropped collection: ${collection}`);
      } catch (error) {
        console.log(`! Collection ${collection} might not exist: ${error.message}`);
      }
    }
    
    console.log('✅ RBAC Migration 001 reverted successfully!');
  }
};

module.exports = migration;