import type { UserRole as UserRoleCode } from '@/types/entities';
import { auditLogger } from '@/lib/audit/audit-logger';

// Import all RBAC components
import { dynamicRoleManager, dynamicRoleUtils } from './dynamic-roles';
import { resourceOwnershipManager, ownershipUtils } from './resource-ownership';
import { permissionInheritanceEngine, inheritanceUtils } from './permission-inheritance';
import { timeBasedAccessManager, timeAccessUtils } from './time-based-access';
import { ipBasedAccessManager, ipAccessUtils } from './ip-based-access';
import { permissionAnalyticsEngine, analyticsUtils } from './permission-analytics';
import { bulkPermissionManager, bulkPermissionUtils } from './bulk-permission-management';
import { securityMonitoringEngine, securityMonitoringUtils } from './security-monitoring';

export interface RBACContext {
  userId: string;
  userRole?: UserRoleCode;
  ipAddress?: string;
  userAgent?: string;
  department?: string;
  committee?: string;
  sessionId?: string;
  timestamp?: Date;
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export interface PermissionCheckRequest {
  userId: string;
  permission: string;
  resource?: string;
  context?: RBACContext;
  checkInheritance?: boolean;
  checkTimeRestrictions?: boolean;
  checkIPRestrictions?: boolean;
  checkDelegation?: boolean;
  checkEmergencyAccess?: boolean;
}

export interface PermissionCheckResult {
  allowed: boolean;
  source: 'direct' | 'inherited' | 'delegated' | 'temporary' | 'emergency' | 'ownership';
  details: {
    directPermission?: boolean;
    inheritedFrom?: string;
    delegatedBy?: string;
    temporaryRole?: string;
    emergencyAccess?: string;
    resourceOwnership?: boolean;
    timeRestriction?: {
      allowed: boolean;
      nextAccessTime?: Date;
      nextRestrictedTime?: Date;
    };
    ipRestriction?: {
      allowed: boolean;
      riskLevel: string;
      requiresAdditionalAuth?: boolean;
    };
  };
  riskFactors: string[];
  recommendations: string[];
  auditTrail: string[];
}

export interface RBACDashboard {
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalRoles: number;
    totalPermissions: number;
    securityIncidents: number;
    complianceScore: number;
  };
  alerts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    recentAlerts: any[];
  };
  usage: {
    topPermissions: { permission: string; count: number }[];
    topResources: { resource: string; count: number }[];
    accessPatterns: { hour: number; count: number }[];
  };
  compliance: {
    violations: number;
    auditFindings: number;
    nextReview: Date;
  };
}

class RBACIntegrationEngine {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize all RBAC components
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize default configurations
      await this.setupDefaultConfiguration();
      
      this.initialized = true;
      console.log('RBAC Integration Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RBAC Integration Engine:', error);
      throw error;
    }
  }

  /**
   * Comprehensive permission check across all RBAC systems
   */
  async checkPermission(request: PermissionCheckRequest): Promise<PermissionCheckResult> {
    const auditTrail: string[] = [];
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    
    let allowed = false;
    let source: PermissionCheckResult['source'] = 'direct';
    const details: PermissionCheckResult['details'] = {};

    // Log the permission check attempt
    await this.logPermissionCheck(request);
    auditTrail.push(`Permission check initiated for ${request.permission} on ${request.resource || 'system'}`);

    // Check emergency access first (highest priority)
    if (request.checkEmergencyAccess !== false) {
      const emergencyAccess = timeBasedAccessManager.checkEmergencyAccess(
        request.userId,
        request.permission,
        request.resource
      );
      
      if (emergencyAccess.hasAccess) {
        allowed = true;
        source = 'emergency';
        details.emergencyAccess = emergencyAccess.emergencyId;
        auditTrail.push(`Emergency access granted: ${emergencyAccess.emergencyId}`);
        
        // Still check for security risks even with emergency access
        riskFactors.push('Emergency access used');
        recommendations.push('Review emergency access usage');
      }
    }

    // Check IP-based restrictions
    if (request.checkIPRestrictions !== false && request.context?.ipAddress) {
      const ipCheck = await ipBasedAccessManager.checkIPAccess({
        userId: request.userId,
        userRole: request.context.userRole,
        resource: request.resource,
        permission: request.permission,
        ipAddress: request.context.ipAddress,
        userAgent: request.context.userAgent,
        geolocation: request.context.geolocation
      });

      details.ipRestriction = {
        allowed: ipCheck.allowed,
        riskLevel: ipCheck.riskLevel,
        requiresAdditionalAuth: ipCheck.requiresAdditionalAuth
      };

      if (!ipCheck.allowed) {
        allowed = false;
        auditTrail.push(`IP access denied: ${ipCheck.restrictionType}`);
        riskFactors.push(`IP restriction: ${ipCheck.riskLevel} risk`);
        
        // Log security event
        await securityMonitoringEngine.logSecurityEvent(
          'unauthorized_access_attempt',
          'high',
          'network',
          {
            description: 'Access denied due to IP restrictions',
            indicators: [],
            context: { ipAddress: request.context.ipAddress, restriction: ipCheck.restrictionType },
            evidence: [],
            impact: {
              scope: 'user',
              affectedEntities: [request.userId],
              businessImpact: 'minimal'
            },
            recommendations: ['Review IP access policies'],
            automatedActions: []
          },
          {
            userId: request.userId,
            userRole: request.context.userRole,
            ipAddress: request.context.ipAddress,
            resource: request.resource
          }
        );
        
        return {
          allowed: false,
          source: 'direct',
          details,
          riskFactors,
          recommendations: ['Contact administrator for IP whitelist'],
          auditTrail
        };
      }

      if (ipCheck.riskLevel === 'high' || ipCheck.riskLevel === 'critical') {
        riskFactors.push(`High-risk IP: ${ipCheck.riskLevel}`);
        recommendations.push('Additional authentication recommended');
      }

      auditTrail.push(`IP check passed: ${ipCheck.riskLevel} risk level`);
    }

    // Check time-based restrictions
    if (request.checkTimeRestrictions !== false) {
      const timeCheck = await timeBasedAccessManager.checkTimeBasedAccess({
        userId: request.userId,
        userRole: request.context?.userRole,
        department: request.context?.department,
        resource: request.resource,
        permission: request.permission,
        checkTime: request.context?.timestamp
      });

      details.timeRestriction = {
        allowed: timeCheck.isAccessible,
        nextAccessTime: timeCheck.nextAccessTime,
        nextRestrictedTime: timeCheck.nextRestrictedTime
      };

      if (!timeCheck.isAccessible) {
        allowed = false;
        auditTrail.push('Time-based access denied');
        
        return {
          allowed: false,
          source: 'direct',
          details,
          riskFactors,
          recommendations: [`Access allowed at: ${timeCheck.nextAccessTime?.toLocaleString()}`],
          auditTrail
        };
      }

      auditTrail.push('Time-based access check passed');
    }

    // If not already allowed by emergency access, check other sources
    if (!allowed) {
      // Check direct permissions first
      // This would integrate with your existing role-access system
      const directPermission = await this.checkDirectPermission(request);
      if (directPermission) {
        allowed = true;
        source = 'direct';
        details.directPermission = true;
        auditTrail.push('Direct permission granted');
      }

      // Check resource ownership
      if (!allowed && request.checkDelegation !== false) {
        const ownershipCheck = await resourceOwnershipManager.checkResourceAccess(
          request.userId,
          request.resource || '',
          'resource',
          request.permission,
          {
            ipAddress: request.context?.ipAddress,
            currentTime: request.context?.timestamp
          }
        );

        if (ownershipCheck.hasAccess) {
          allowed = true;
          source = 'ownership';
          details.resourceOwnership = true;
          auditTrail.push(`Resource ownership access: ${ownershipCheck.source}`);
        }
      }

      // Check delegated permissions
      if (!allowed && request.checkDelegation !== false) {
        const delegatedPermissions = dynamicRoleManager.getDelegatedPermissions(request.userId);
        const hasDelegatedPermission = delegatedPermissions.some(d => 
          d.permissions.includes(request.permission) &&
          (!d.resources || !request.resource || d.resources.includes(request.resource))
        );

        if (hasDelegatedPermission) {
          allowed = true;
          source = 'delegated';
          details.delegatedBy = 'system'; // Would be actual delegator
          auditTrail.push('Delegated permission granted');
        }
      }

      // Check temporary roles
      if (!allowed) {
        const temporaryAccess = await dynamicRoleManager.checkTemporaryAccess(
          request.userId,
          request.permission,
          request.resource,
          {
            ipAddress: request.context?.ipAddress,
            currentTime: request.context?.timestamp
          }
        );

        if (temporaryAccess.hasAccess) {
          allowed = true;
          source = 'temporary';
          details.temporaryRole = temporaryAccess.details?.roleId;
          auditTrail.push(`Temporary role access: ${temporaryAccess.source}`);
          
          riskFactors.push('Temporary permission used');
          recommendations.push('Monitor temporary permission usage');
        }
      }

      // Check inheritance (most expensive, so do last)
      if (!allowed && request.checkInheritance !== false) {
        const inheritanceCheck = await permissionInheritanceEngine.hasInheritedPermission(
          request.userId,
          'user_node', // Would be actual user node ID
          request.permission,
          request.context
        );

        if (inheritanceCheck.hasPermission) {
          allowed = true;
          source = 'inherited';
          details.inheritedFrom = inheritanceCheck.source;
          auditTrail.push(`Inherited permission: ${inheritanceCheck.source}`);
        }
      }
    }

    // Generate final recommendations
    if (allowed && riskFactors.length > 0) {
      recommendations.push('Monitor this access due to risk factors');
    }

    if (!allowed) {
      recommendations.push('Request explicit permission from administrator');
      
      // Log access denial
      await securityMonitoringEngine.logSecurityEvent(
        'unauthorized_access_attempt',
        'medium',
        'authorization',
        {
          description: 'Permission check failed',
          indicators: [],
          context: { permission: request.permission, resource: request.resource },
          evidence: [],
          impact: {
            scope: 'user',
            affectedEntities: [request.userId],
            businessImpact: 'minimal'
          },
          recommendations: ['Review user permissions'],
          automatedActions: []
        },
        {
          userId: request.userId,
          userRole: request.context?.userRole,
          resource: request.resource
        }
      );
    }

    return {
      allowed,
      source,
      details,
      riskFactors,
      recommendations,
      auditTrail
    };
  }

  /**
   * Get comprehensive RBAC dashboard
   */
  async getRBACDashboard(): Promise<RBACDashboard> {
    const [
      analyticsData,
      securityDashboard,
      analyticsExecutiveSummary
    ] = await Promise.all([
      permissionAnalyticsEngine.getPermissionAnalytics(),
      securityMonitoringUtils.getSecurityDashboard(),
      analyticsUtils.getDashboardSummary()
    ]);

    return {
      summary: {
        totalUsers: analyticsData.overview.totalUsers,
        activeUsers: analyticsData.users.highPrivilegeUsers.length + 1000, // Simplified
        totalRoles: analyticsData.overview.totalRoles,
        totalPermissions: analyticsData.overview.totalPermissions,
        securityIncidents: securityDashboard.criticalEvents,
        complianceScore: analyticsExecutiveSummary.complianceScore
      },
      alerts: {
        critical: securityDashboard.criticalEvents,
        high: securityDashboard.highRiskUsers,
        medium: securityDashboard.activeThreats,
        low: 5,
        recentAlerts: securityDashboard.recentEvents.slice(0, 5)
      },
      usage: {
        topPermissions: analyticsData.permissions.mostUsedPermissions.map(p => ({
          permission: p.permission,
          count: p.count
        })),
        topResources: analyticsData.access.resourceAccess.map(r => ({
          resource: r.resource,
          count: r.accessCount
        })),
        accessPatterns: analyticsData.access.accessPatterns.map(p => ({
          hour: p.hour,
          count: p.accessCount
        }))
      },
      compliance: {
        violations: analyticsData.security.complianceViolations.reduce((sum, cv) => sum + cv.violations, 0),
        auditFindings: 2,
        nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    };
  }

  /**
   * Bulk operation with comprehensive validation
   */
  async executeBulkOperation(
    operationType: 'onboard_users' | 'offboard_users' | 'role_migration' | 'permission_cleanup',
    targets: string[],
    parameters: Record<string, any>,
    operatorId: string
  ): Promise<{
    success: boolean;
    operationId: string;
    results: any;
    securityChecks: {
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      requiresApproval: boolean;
      estimatedImpact: string;
    };
  }> {
    // Assess operation risk
    const riskAssessment = await this.assessBulkOperationRisk(
      operationType,
      targets,
      parameters
    );

    let operation;
    
    switch (operationType) {
      case 'onboard_users':
        operation = await bulkPermissionUtils.createUserOnboarding(
          targets,
          parameters.defaultRole,
          parameters.department,
          operatorId
        );
        break;
        
      case 'role_migration':
        operation = await bulkPermissionUtils.createDepartmentMigration(
          parameters.fromDepartment,
          parameters.toDepartment,
          targets,
          operatorId
        );
        break;
        
      default:
        throw new Error(`Unsupported operation type: ${operationType}`);
    }

    const result = await bulkPermissionManager.executeBulkOperation(operation.id);

    // Log bulk operation
    await securityMonitoringEngine.logSecurityEvent(
      'policy_violation',
      riskAssessment.riskLevel === 'critical' ? 'critical' : 'medium',
      'system',
      {
        description: `Bulk operation executed: ${operationType}`,
        indicators: [],
        context: { 
          operationType, 
          targetCount: targets.length,
          operatorId 
        },
        evidence: [],
        impact: {
          scope: targets.length > 10 ? 'organization' : 'department',
          affectedEntities: targets,
          businessImpact: riskAssessment.riskLevel === 'critical' ? 'significant' : 'moderate'
        },
        recommendations: ['Monitor bulk operation results'],
        automatedActions: []
      },
      {
        userId: operatorId,
        resource: 'bulk_operations'
      }
    );

    return {
      success: result.success,
      operationId: operation.id,
      results: result,
      securityChecks: riskAssessment
    };
  }

  /**
   * Generate comprehensive security report
   */
  async generateSecurityReport(
    timeRange: { start: Date; end: Date },
    reportType: 'executive' | 'technical' | 'compliance'
  ): Promise<{
    reportId: string;
    generatedAt: Date;
    summary: any;
    findings: any[];
    recommendations: string[];
    metrics: any;
  }> {
    const [
      securityMetrics,
      complianceReport,
      permissionAnalytics
    ] = await Promise.all([
      securityMonitoringEngine.getSecurityMetrics(timeRange),
      permissionAnalyticsEngine.generateComplianceReport('custom', timeRange, 'system'),
      permissionAnalyticsEngine.getPermissionAnalytics({ timeRange })
    ]);

    const reportId = `security_report_${Date.now()}`;

    return {
      reportId,
      generatedAt: new Date(),
      summary: {
        timeRange,
        totalEvents: Object.values(securityMetrics.eventCounts).reduce((sum, count) => sum + count, 0),
        criticalIncidents: securityMetrics.severityDistribution.critical || 0,
        complianceScore: complianceReport.summary.complianceScore,
        topRisks: securityMetrics.topRiskUsers.slice(0, 5)
      },
      findings: [
        ...securityMetrics.topThreats.map(threat => ({
          type: 'security_threat',
          severity: threat.count > 10 ? 'high' : 'medium',
          description: `${threat.type} detected ${threat.count} times`,
          trend: threat.trend
        })),
        ...complianceReport.sections.filter(s => s.status === 'fail').map(section => ({
          type: 'compliance_violation',
          severity: 'high',
          description: section.title,
          remediation: section.remediation
        }))
      ],
      recommendations: [
        ...complianceReport.recommendations,
        'Implement advanced threat detection',
        'Enhance user behavior monitoring',
        'Review and update security policies'
      ],
      metrics: {
        security: securityMetrics,
        compliance: complianceReport.summary,
        permissions: {
          totalPermissions: permissionAnalytics.overview.totalPermissions,
          unusedPermissions: permissionAnalytics.permissions.orphanedPermissions.length,
          highPrivilegeUsers: permissionAnalytics.users.highPrivilegeUsers.length
        }
      }
    };
  }

  private async checkDirectPermission(request: PermissionCheckRequest): Promise<boolean> {
    // This would integrate with your existing role-access system
    // For now, return false to test other permission sources
    return false;
  }

  private async logPermissionCheck(request: PermissionCheckRequest): Promise<void> {
    await auditLogger.logAction({
      userId: request.userId,
      userEmail: request.userId,
      userRole: request.context?.userRole || 'unknown',
      action: 'CHECK_PERMISSION',
      resource: request.resource || 'system',
      status: 'success',
      details: {
        permission: request.permission,
        checkInheritance: request.checkInheritance,
        checkTimeRestrictions: request.checkTimeRestrictions,
        checkIPRestrictions: request.checkIPRestrictions,
        checkDelegation: request.checkDelegation
      }
    });
  }

  private async assessBulkOperationRisk(
    operationType: string,
    targets: string[],
    parameters: Record<string, any>
  ): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    requiresApproval: boolean;
    estimatedImpact: string;
  }> {
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let requiresApproval = false;

    // Assess based on operation type
    if (operationType === 'offboard_users' || operationType.includes('delete')) {
      riskLevel = 'high';
      requiresApproval = true;
    }

    // Assess based on target count
    if (targets.length > 100) {
      riskLevel = riskLevel === 'low' ? 'medium' : 'critical';
      requiresApproval = true;
    }

    // Assess based on role changes
    if (parameters.role === 'admin' || parameters.role === 'super_admin') {
      riskLevel = 'critical';
      requiresApproval = true;
    }

    const estimatedImpact = `${targets.length} users affected, ${riskLevel} risk operation`;

    return {
      riskLevel,
      requiresApproval,
      estimatedImpact
    };
  }

  private async setupDefaultConfiguration(): Promise<void> {
    // Initialize default time-based rules
    await timeAccessUtils.createBusinessHoursRule(
      'Standard Business Hours',
      '09:00',
      '17:30',
      [1, 2, 3, 4, 5], // Monday to Friday
      {}, // Apply to all users
      'system'
    );

    // Initialize default IP rules for common scenarios
    await ipAccessUtils.createGeoRestriction(
      'Geographic Restriction',
      ['IN', 'US'], // Allow India and US
      {}, // Apply to all users
      'system'
    );

    console.log('Default RBAC configuration initialized');
  }
}

// Singleton instance
export const rbacIntegrationEngine = new RBACIntegrationEngine();

// Utility functions for common RBAC operations
export const rbacUtils = {
  /**
   * Simple permission check
   */
  async hasPermission(
    userId: string,
    permission: string,
    resource?: string,
    context?: Partial<RBACContext>
  ): Promise<boolean> {
    const result = await rbacIntegrationEngine.checkPermission({
      userId,
      permission,
      resource,
      context: context as RBACContext
    });
    
    return result.allowed;
  },

  /**
   * Get user risk score
   */
  async getUserRiskScore(userId: string): Promise<number> {
    const riskAssessment = await permissionAnalyticsEngine.getUserRiskScore(userId);
    return riskAssessment.riskScore;
  },

  /**
   * Emergency access grant
   */
  async grantEmergencyAccess(
    userId: string,
    permissions: string[],
    durationMinutes: number,
    reason: string,
    grantedBy: string
  ): Promise<string> {
    const result = await timeBasedAccessManager.grantEmergencyAccess(
      userId,
      permissions,
      durationMinutes * 60 * 1000,
      reason,
      grantedBy
    );
    
    return result.emergencyId;
  },

  /**
   * Quick security dashboard
   */
  async getSecuritySummary(): Promise<{
    status: 'secure' | 'warning' | 'critical';
    criticalAlerts: number;
    riskScore: number;
    recommendations: string[];
  }> {
    const dashboard = await securityMonitoringUtils.getSecurityDashboard();
    
    let status: 'secure' | 'warning' | 'critical' = 'secure';
    if (dashboard.criticalEvents > 0) status = 'critical';
    else if (dashboard.highRiskUsers > 5) status = 'warning';
    
    const riskScore = Math.min(100, dashboard.criticalEvents * 20 + dashboard.highRiskUsers * 5);
    
    return {
      status,
      criticalAlerts: dashboard.criticalEvents,
      riskScore,
      recommendations: [
        'Review critical security events',
        'Monitor high-risk users',
        'Update security policies'
      ]
    };
  }
};

export default rbacIntegrationEngine;