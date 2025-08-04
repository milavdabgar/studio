/**
 * RBAC Authentication Middleware Integration
 * Integrates the advanced RBAC system with Next.js API routes and authentication
 */

import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthUser } from './api-middleware';
import type { UserRole } from '@/types/entities';
import { rbacIntegrationEngine, type PermissionCheckRequest, type PermissionCheckResult, type RBACContext } from './rbac-integration';
import { auditLogger } from '@/lib/audit/audit-logger';
import { securityMonitoringEngine } from './security-monitoring';
import type { RBACRequestContext } from './rbac-extensions';

// ========================================
// Middleware Configuration Types
// ========================================

export interface RBACMiddlewareConfig {
  // Permission requirements
  requiredPermissions?: string[];
  requiredRoles?: UserRole[];
  requireAllPermissions?: boolean; // true = AND logic, false = OR logic (default)
  
  // Resource context
  resourceType?: string;
  resourceIdParam?: string; // URL parameter name for resource ID
  resourceIdHeader?: string; // Header name for resource ID
  
  // Security settings
  requireMFA?: boolean;
  allowEmergencyAccess?: boolean;
  checkIPRestrictions?: boolean;
  checkTimeRestrictions?: boolean;
  checkBehavioralPatterns?: boolean;
  
  // Audit settings
  auditLevel?: 'none' | 'basic' | 'detailed' | 'comprehensive';
  logFailures?: boolean;
  logSuccesses?: boolean;
  
  // Performance settings
  enableCaching?: boolean;
  cacheTimeout?: number; // minutes
  skipUserLookup?: boolean;
  
  // Error handling
  customErrorMessages?: {
    insufficientPermissions?: string;
    ipRestricted?: string;
    timeRestricted?: string;
    mfaRequired?: string;
    userSuspended?: string;
    systemMaintenance?: string;
  };
  
  // Bypass settings (for emergency situations)
  bypassUsers?: string[];
  bypassRoles?: UserRole[];
  emergencyBypassCode?: string;
}

export interface RBACMiddlewareContext {
  user: {
    id: string;
    email: string;
    role: UserRole;
    allRoles: UserRole[];
    department?: string;
    committee?: string;
    isActive: boolean;
    lastLogin?: Date;
  };
  session: {
    id: string;
    createdAt: Date;
    ipAddress: string;
    userAgent: string;
    isSecure: boolean;
  };
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
    query: Record<string, string>;
    params: Record<string, string>;
  };
  resource?: {
    type: string;
    id: string;
    owner?: string;
  };
  permissionCheck: PermissionCheckResult;
  rbacContext: RBACRequestContext;
}

export type RBACMiddlewareHandler = (
  context: RBACMiddlewareContext
) => Promise<NextResponse | void>;

// ========================================
// Main RBAC Middleware Function
// ========================================

export function withRBAC(
  config: RBACMiddlewareConfig,
  handler?: RBACMiddlewareHandler
) {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    const startTime = Date.now();
    
    try {
      // Extract request information
      const ipAddress = extractClientIP(request);
      const userAgent = request.headers.get('user-agent') || '';
      const method = request.method;
      const url = request.url;
      
      // Get authentication information
      const authUser = extractAuthUser(request);
      if (!authUser) {
        return createErrorResponse(
          'UNAUTHORIZED',
          'Authentication required',
          401,
          config
        );
      }

      // Create RBAC context
      const rbacContext = createRBACContext(
        authUser.email, // Using email as user ID
        `session_${Date.now()}`,
        ipAddress,
        userAgent,
        request,
        context?.params
      );

      // Get resource information if specified
      let resourceId: string | undefined;
      if (config.resourceIdParam && context?.params) {
        resourceId = context.params[config.resourceIdParam];
      } else if (config.resourceIdHeader) {
        resourceId = request.headers.get(config.resourceIdHeader) || undefined;
      }

      // Check emergency bypass first
      const bypassResult = await checkEmergencyBypass(config, authUser, request);
      if (bypassResult.bypassed) {
        await logBypassUsage(bypassResult, rbacContext);
        
        // Still create context for the handler
        const middlewareContext: RBACMiddlewareContext = {
          user: {
            id: authUser.email,
            email: authUser.email,
            role: authUser.activeRole,
            allRoles: authUser.availableRoles,
            department: authUser.departmentId,
            isActive: true
          },
          session: {
            id: `session_${Date.now()}`,
            createdAt: new Date(),
            ipAddress,
            userAgent,
            isSecure: url.startsWith('https')
          },
          request: {
            method,
            url,
            headers: Object.fromEntries(request.headers.entries()),
            query: Object.fromEntries(new URL(url).searchParams.entries()),
            params: context?.params || {}
          },
          resource: config.resourceType && resourceId ? {
            type: config.resourceType,
            id: resourceId
          } : undefined,
          permissionCheck: {
            allowed: true,
            source: 'emergency',
            details: { emergencyAccess: bypassResult.reason },
            riskFactors: ['Emergency bypass used'],
            recommendations: [],
            auditTrail: [`Emergency bypass: ${bypassResult.reason}`]
          },
          rbacContext
        };

        if (handler) {
          const handlerResult = await handler(middlewareContext);
          if (handlerResult) return handlerResult;
        }

        return NextResponse.next();
      }

      // Perform comprehensive permission check  
      const rbacContextForCheck: RBACContext = {
        userId: authUser.email,
        userRole: authUser.activeRole,
        ipAddress,
        userAgent,
        department: authUser.departmentId,
        sessionId: `session_${Date.now()}`,
        timestamp: new Date()
      };
      
      const permissionRequest: PermissionCheckRequest = {
        userId: authUser.email,
        permission: config.requiredPermissions?.[0] || '',
        resource: resourceId,
        context: rbacContextForCheck,
        checkInheritance: true,
        checkTimeRestrictions: config.checkTimeRestrictions !== false,
        checkIPRestrictions: config.checkIPRestrictions !== false,
        checkDelegation: true,
        checkEmergencyAccess: config.allowEmergencyAccess !== false
      };

      // Handle multiple permissions
      let permissionResults: PermissionCheckResult[] = [];
      
      if (config.requiredPermissions && config.requiredPermissions.length > 0) {
        for (const permission of config.requiredPermissions) {
          const result = await rbacIntegrationEngine.checkPermission({
            ...permissionRequest,
            permission
          });
          permissionResults.push(result);
        }
      } else if (config.requiredRoles) {
        // If only roles are specified, check basic access
        const result = await rbacIntegrationEngine.checkPermission({
          ...permissionRequest,
          permission: 'basic.access'
        });
        permissionResults.push(result);
      } else {
        // Default permission check
        const result = await rbacIntegrationEngine.checkPermission({
          ...permissionRequest,
          permission: 'system.access'
        });
        permissionResults.push(result);
      }

      // Evaluate permission results
      const finalResult = evaluatePermissionResults(
        permissionResults,
        config.requireAllPermissions || false
      );

      // Check role requirements
      if (config.requiredRoles && config.requiredRoles.length > 0) {
        const userRoles = authUser.availableRoles || [authUser.activeRole];
        const hasRequiredRole = config.requiredRoles.some(role => userRoles.includes(role));
        
        if (!hasRequiredRole) {
          finalResult.allowed = false;
          finalResult.riskFactors.push('Insufficient role privileges');
          finalResult.recommendations.push('Contact administrator for role assignment');
        }
      }

      // Additional security checks
      if (finalResult.allowed) {
        // MFA check
        if (config.requireMFA) {
          const mfaResult = await checkMFARequirement(authUser.email, rbacContext);
          if (!mfaResult.satisfied) {
            return createErrorResponse(
              'MFA_REQUIRED',
              config.customErrorMessages?.mfaRequired || 'Multi-factor authentication required',
              403,
              config,
              { mfaChallenge: mfaResult.challenge }
            );
          }
        }

        // Behavioral pattern analysis
        if (config.checkBehavioralPatterns) {
          const behavioralResult = await checkBehavioralPatterns(authUser.email, rbacContext);
          if (behavioralResult.suspicious) {
            finalResult.riskFactors.push(...behavioralResult.riskFactors);
            
            if (behavioralResult.blockAccess) {
              return createErrorResponse(
                'SUSPICIOUS_BEHAVIOR',
                'Access denied due to suspicious activity',
                403,
                config
              );
            }
          }
        }
      }

      // Handle access denial
      if (!finalResult.allowed) {
        await logAccessDenial(finalResult, rbacContext, config);
        
        // Determine specific error type
        const errorType = determineErrorType(finalResult);
        const errorMessage = getErrorMessage(errorType, config);
        const statusCode = getStatusCode(errorType);
        
        return createErrorResponse(errorType, errorMessage, statusCode, config, {
          details: finalResult.details,
          recommendations: finalResult.recommendations
        });
      }

      // Log successful access
      if (config.logSuccesses !== false) {
        await logSuccessfulAccess(finalResult, rbacContext, config);
      }

      // Create middleware context for handler
      const middlewareContext: RBACMiddlewareContext = {
        user: {
          id: authUser.email,
          email: authUser.email,
          role: authUser.activeRole,
          allRoles: authUser.availableRoles,
          department: authUser.departmentId,
          isActive: true,
          lastLogin: undefined
        },
        session: {
          id: `session_${Date.now()}`,
          createdAt: new Date(),
          ipAddress,
          userAgent,
          isSecure: url.startsWith('https')
        },
        request: {
          method,
          url,
          headers: Object.fromEntries(request.headers.entries()),
          query: Object.fromEntries(new URL(url).searchParams.entries()),
          params: context?.params || {}
        },
        resource: config.resourceType && resourceId ? {
          type: config.resourceType,
          id: resourceId
        } : undefined,
        permissionCheck: finalResult,
        rbacContext
      };

      // Execute custom handler if provided
      if (handler) {
        const handlerResult = await handler(middlewareContext);
        if (handlerResult) return handlerResult;
      }

      // Add security headers
      const response = NextResponse.next();
      addSecurityHeaders(response, finalResult, config);

      // Log performance metrics
      const executionTime = Date.now() - startTime;
      if (executionTime > 1000) { // Log slow requests
        await auditLogger.logAction({
          userId: authUser.email,
          userEmail: authUser.email,
          userRole: authUser.activeRole,
          action: 'SLOW_RBAC_CHECK',
          resource: 'performance',
          status: 'success',
          details: {
            executionTime,
            url,
            method,
            permissionCount: config.requiredPermissions?.length || 0
          }
        });
      }

      return response;

    } catch (error) {
      // Log error
      const authUser = extractAuthUser(request);
      await auditLogger.logAction({
        userId: authUser?.email || 'unknown',
        userEmail: authUser?.email || 'unknown',
        userRole: authUser?.activeRole || 'unknown',
        action: 'RBAC_MIDDLEWARE_ERROR',
        resource: 'middleware',
        status: 'failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          url: request.url,
          method: request.method
        }
      });

      return createErrorResponse(
        'SYSTEM_ERROR',
        'Internal server error',
        500,
        config
      );
    }
  };
}

// ========================================
// Utility Functions
// ========================================

function extractClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const cloudflare = request.headers.get('cf-connecting-ip');
  
  if (cloudflare) return cloudflare;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (real) return real;
  
  return '127.0.0.1'; // NextRequest.ip not available
}

function createRBACContext(
  userId: string,
  sessionId: string,
  ipAddress: string,
  userAgent: string,
  request: NextRequest,
  params?: Record<string, string>
): RBACRequestContext {
  return {
    request: {
      userId,
      sessionId,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      ipAddress,
      userAgent
    },
    user: {
      id: userId,
      email: '',
      currentRole: 'unknown',
      allRoles: [],
      riskScore: 0,
      sessionCount: 1,
      isFirstLogin: false
    },
    security: {
      threatLevel: 'low',
      indicators: [],
      anomalies: [],
      activeRestrictions: []
    },
    audit: {
      requiresAudit: true,
      auditLevel: 'basic',
      complianceFrameworks: [],
      retentionPeriod: 2555, // 7 years
      sensitiveOperation: false
    }
  };
}

async function checkEmergencyBypass(
  config: RBACMiddlewareConfig,
  user: any,
  request: NextRequest
): Promise<{ bypassed: boolean; reason?: string }> {
  // Check bypass users
  if (config.bypassUsers?.includes(user.email)) {
    return { bypassed: true, reason: 'Bypass user' };
  }

  // Check bypass roles
  if (config.bypassRoles?.some(role => user.availableRoles?.includes(role))) {
    return { bypassed: true, reason: 'Bypass role' };
  }

  // Check emergency bypass code
  if (config.emergencyBypassCode) {
    const bypassCode = request.headers.get('x-emergency-bypass');
    if (bypassCode === config.emergencyBypassCode) {
      return { bypassed: true, reason: 'Emergency bypass code' };
    }
  }

  return { bypassed: false };
}

function evaluatePermissionResults(
  results: PermissionCheckResult[],
  requireAll: boolean
): PermissionCheckResult {
  if (requireAll) {
    // AND logic - all permissions must be allowed
    const allowed = results.every(r => r.allowed);
    const combinedResult: PermissionCheckResult = {
      allowed,
      source: results[0]?.source || 'direct',
      details: results.reduce((acc, r) => ({ ...acc, ...r.details }), {}),
      riskFactors: results.flatMap(r => r.riskFactors),
      recommendations: results.flatMap(r => r.recommendations),
      auditTrail: results.flatMap(r => r.auditTrail)
    };
    return combinedResult;
  } else {
    // OR logic - at least one permission must be allowed
    const allowedResults = results.filter(r => r.allowed);
    if (allowedResults.length > 0) {
      return allowedResults[0]; // Return the first allowed result
    } else {
      return results[0]; // Return the first result (which will be denied)
    }
  }
}

async function checkMFARequirement(
  userId: string,
  context: RBACRequestContext
): Promise<{ satisfied: boolean; challenge?: any }> {
  // This would integrate with your MFA system
  // For now, assume MFA is satisfied
  return { satisfied: true };
}

async function checkBehavioralPatterns(
  userId: string,
  context: RBACRequestContext
): Promise<{ suspicious: boolean; blockAccess: boolean; riskFactors: string[] }> {
  // This would integrate with behavioral analysis
  // For now, return safe defaults
  return {
    suspicious: false,
    blockAccess: false,
    riskFactors: []
  };
}

function determineErrorType(result: PermissionCheckResult): string {
  if (result.details.ipRestriction && !result.details.ipRestriction.allowed) {
    return 'IP_RESTRICTED';
  }
  if (result.details.timeRestriction && !result.details.timeRestriction.allowed) {
    return 'TIME_RESTRICTED';
  }
  if (result.riskFactors.includes('High-risk IP')) {
    return 'HIGH_RISK_ACCESS';
  }
  return 'INSUFFICIENT_PERMISSIONS';
}

function getErrorMessage(errorType: string, config: RBACMiddlewareConfig): string {
  const messages = config.customErrorMessages || {};
  
  switch (errorType) {
    case 'IP_RESTRICTED':
      return messages.ipRestricted || 'Access denied from this IP address';
    case 'TIME_RESTRICTED':
      return messages.timeRestricted || 'Access denied outside allowed hours';
    case 'HIGH_RISK_ACCESS':
      return 'Access denied due to security concerns';
    case 'INSUFFICIENT_PERMISSIONS':
      return messages.insufficientPermissions || 'Insufficient permissions';
    default:
      return 'Access denied';
  }
}

function getStatusCode(errorType: string): number {
  switch (errorType) {
    case 'IP_RESTRICTED':
    case 'TIME_RESTRICTED':
    case 'HIGH_RISK_ACCESS':
      return 403;
    case 'INSUFFICIENT_PERMISSIONS':
      return 403;
    default:
      return 403;
  }
}

function createErrorResponse(
  errorType: string,
  message: string,
  statusCode: number,
  config: RBACMiddlewareConfig,
  additionalData?: any
): NextResponse {
  const errorResponse = {
    error: errorType,
    message,
    timestamp: new Date().toISOString(),
    ...additionalData
  };

  return NextResponse.json(errorResponse, { status: statusCode });
}

function addSecurityHeaders(
  response: NextResponse,
  result: PermissionCheckResult,
  config: RBACMiddlewareConfig
): void {
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Add RBAC-specific headers
  response.headers.set('X-RBAC-Permission-Source', result.source);
  if (result.riskFactors.length > 0) {
    response.headers.set('X-RBAC-Risk-Level', 'elevated');
  }
}

async function logBypassUsage(
  bypassResult: { reason?: string },
  context: RBACRequestContext
): Promise<void> {
  await auditLogger.logAction({
    userId: context.user.id,
    userEmail: context.user.id,
    userRole: context.user.currentRole,
    action: 'EMERGENCY_BYPASS_USED',
    resource: 'security',
    status: 'success',
    details: {
      reason: bypassResult.reason,
      ipAddress: context.request.ipAddress,
      userAgent: context.request.userAgent
    }
  });

  // Also log as security event
  await securityMonitoringEngine.logSecurityEvent(
    'emergency_access' as any,
    'high',
    'authorization',
    {
      description: `Emergency bypass used: ${bypassResult.reason}`,
      indicators: [],
      context: { bypassReason: bypassResult.reason },
      evidence: [],
      impact: {
        scope: 'user',
        affectedEntities: [context.user.id],
        businessImpact: 'moderate'
      },
      recommendations: ['Review emergency bypass usage'],
      automatedActions: []
    },
    {
      userId: context.user.id,
      userRole: context.user.currentRole,
      ipAddress: context.request.ipAddress
    }
  );
}

async function logAccessDenial(
  result: PermissionCheckResult,
  context: RBACRequestContext,
  config: RBACMiddlewareConfig
): Promise<void> {
  if (config.logFailures === false) return;

  await auditLogger.logAction({
    userId: context.user.id,
    userEmail: context.user.id,
    userRole: context.user.currentRole,
    action: 'ACCESS_DENIED',
    resource: 'authorization',
    status: 'failed',
    details: {
      reason: result.riskFactors.join(', '),
      requiredPermissions: config.requiredPermissions,
      requiredRoles: config.requiredRoles,
      ipAddress: context.request.ipAddress,
      userAgent: context.request.userAgent
    }
  });
}

async function logSuccessfulAccess(
  result: PermissionCheckResult,
  context: RBACRequestContext,
  config: RBACMiddlewareConfig
): Promise<void> {
  await auditLogger.logAction({
    userId: context.user.id,
    userEmail: context.user.id,
    userRole: context.user.currentRole,
    action: 'ACCESS_GRANTED',
    resource: 'authorization',
    status: 'success',
    details: {
      source: result.source,
      permissions: config.requiredPermissions,
      roles: config.requiredRoles,
      riskFactors: result.riskFactors,
      ipAddress: context.request.ipAddress
    }
  });
}

// ========================================
// Convenience Functions for Common Use Cases
// ========================================

export const requirePermission = (permission: string, options?: Partial<RBACMiddlewareConfig>) =>
  withRBAC({ requiredPermissions: [permission], ...options });

export const requireRole = (role: UserRole, options?: Partial<RBACMiddlewareConfig>) =>
  withRBAC({ requiredRoles: [role], ...options });

export const requireAnyPermission = (permissions: string[], options?: Partial<RBACMiddlewareConfig>) =>
  withRBAC({ requiredPermissions: permissions, requireAllPermissions: false, ...options });

export const requireAllPermissions = (permissions: string[], options?: Partial<RBACMiddlewareConfig>) =>
  withRBAC({ requiredPermissions: permissions, requireAllPermissions: true, ...options });

export const requireAdminAccess = (options?: Partial<RBACMiddlewareConfig>) =>
  withRBAC({ 
    requiredRoles: ['admin', 'super_admin'], 
    requireMFA: true,
    checkIPRestrictions: true,
    auditLevel: 'comprehensive',
    ...options 
  });

export const requireSecureAccess = (options?: Partial<RBACMiddlewareConfig>) =>
  withRBAC({
    requireMFA: true,
    checkIPRestrictions: true,
    checkTimeRestrictions: true,
    checkBehavioralPatterns: true,
    auditLevel: 'detailed',
    ...options
  });

// ========================================
// Higher-Order Component for Page Protection
// ========================================

export function withPageRBAC<P extends object>(
  config: RBACMiddlewareConfig,
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<P> {
  return function RBACProtectedComponent(props: P) {
    // This would be implemented on the client side
    // For now, just return the wrapped component
    return React.createElement(WrappedComponent, props);
  };
}

export default withRBAC;