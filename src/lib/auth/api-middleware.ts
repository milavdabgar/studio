import type { NextRequest } from 'next/server';
import type { UserRole as UserRoleCode } from '@/types/entities';
import { getUserAccessContext } from './role-access';

interface AuthUser {
  email: string;
  name: string;
  activeRole: UserRoleCode;
  availableRoles: UserRoleCode[];
  departmentId?: string;
  instituteId?: string;
}

export interface APIAccessContext {
  user: AuthUser;
  canViewAllDepartments: boolean;
  canEditAllDepartments: boolean;
  departmentFilter?: string;
  allowedDepartments: string[];
  featurePermissions: {
    canDeleteRecords: boolean;
    canImportData: boolean;
    canExportData: boolean;
    canManageRoles: boolean;
    canApproveRequests: boolean;
    canCreateRecords: boolean;
    canEditRecords: boolean;
    canViewSensitiveData: boolean;
    canAccessAdvancedFeatures: boolean;
    canPublishTimetables: boolean;
    canAutoGenerateTimetables: boolean;
    canManageTimetableConstraints: boolean;
    canAccessTimetableAnalytics: boolean;
  };
}

/**
 * Extract and validate user from request cookies
 */
export function extractAuthUser(request: NextRequest): AuthUser | null {
  const authUserCookie = request.cookies.get('auth_user')?.value;
  if (!authUserCookie) {
    return null;
  }

  try {
    const decodedCookie = decodeURIComponent(authUserCookie);
    const parsedUser = JSON.parse(decodedCookie) as AuthUser;
    
    if (parsedUser && parsedUser.email && parsedUser.activeRole) {
      const validActiveRole = typeof parsedUser.activeRole === 'string' ? parsedUser.activeRole : 'unknown';
      const validAvailableRoles = Array.isArray(parsedUser.availableRoles) && parsedUser.availableRoles.every(r => typeof r === 'string') 
          ? parsedUser.availableRoles 
          : [validActiveRole];

      return { 
        email: parsedUser.email, 
        name: parsedUser.name || parsedUser.email,
        activeRole: validActiveRole,
        availableRoles: validAvailableRoles.length > 0 ? validAvailableRoles : [validActiveRole],
        departmentId: parsedUser.departmentId,
        instituteId: parsedUser.instituteId
      };
    }
  } catch (error) {
    console.error("Error parsing auth_user cookie in API middleware:", error);
    return null;
  }

  return null;
}

/**
 * Get API access context for a user
 */
export function getAPIAccessContext(user: AuthUser): APIAccessContext {
  const accessContext = getUserAccessContext(user);
  
  return {
    user,
    canViewAllDepartments: accessContext.canViewAllDepartments,
    canEditAllDepartments: accessContext.canEditAllDepartments,
    departmentFilter: accessContext.departmentFilter,
    allowedDepartments: accessContext.allowedDepartments,
    featurePermissions: accessContext.featurePermissions
  };
}

/**
 * Check if user has permission to access a specific API endpoint
 */
export function hasAPIAccess(user: AuthUser, requiredRoles: UserRoleCode[]): boolean {
  return requiredRoles.includes(user.activeRole);
}

/**
 * API route access control definitions
 */
export const API_ACCESS_CONTROL: Record<string, UserRoleCode[]> = {
  // Admin only endpoints
  '/api/users': ['admin', 'super_admin'],
  '/api/roles': ['admin', 'super_admin'],
  '/api/institutes': ['admin', 'super_admin'],
  '/api/results': ['admin', 'super_admin', 'hod', 'principal'],
  '/api/assessments': ['admin', 'super_admin', 'hod', 'principal', 'faculty'],
  '/api/buildings': ['admin', 'super_admin', 'hod', 'principal'],
  '/api/academic-terms': ['admin', 'super_admin', 'hod', 'principal'],
  '/api/enrollments': ['admin', 'super_admin', 'hod', 'principal'],
  '/api/curriculum': ['admin', 'super_admin', 'hod', 'principal', 'faculty'],
  '/api/role-assignments': ['admin', 'super_admin'],
  
  // Department-scoped endpoints - admins and HODs
  '/api/students': ['admin', 'super_admin', 'hod', 'principal', 'faculty'],
  '/api/faculty': ['admin', 'super_admin', 'hod', 'principal'],
  '/api/programs': ['admin', 'super_admin', 'hod', 'principal'],
  '/api/courses': ['admin', 'super_admin', 'hod', 'principal', 'faculty'],
  '/api/batches': ['admin', 'super_admin', 'hod', 'principal'],
  '/api/departments': ['admin', 'super_admin', 'hod', 'principal'],
  '/api/rooms': ['admin', 'super_admin', 'hod', 'principal'],
  '/api/timetables': ['admin', 'super_admin', 'hod', 'principal', 'faculty'],
  
  // Committee endpoints
  '/api/committees': ['admin', 'super_admin', 'committee_admin', 'committee_convener'],
  
  // Project Fair endpoints
  '/api/projects': ['admin', 'super_admin', 'hod', 'principal', 'faculty'],
  '/api/project-fair': ['admin', 'super_admin', 'hod', 'principal'],
  
  // Read-only endpoints for broader access
  '/api/course-offerings': ['admin', 'super_admin', 'hod', 'principal', 'faculty'],
};

/**
 * High-level API middleware function
 */
/**
 * Permission-based middleware for specific operations
 */
export function requirePermission(permission: keyof APIAccessContext['featurePermissions']) {
  return function<T extends any[]>(
    handler: (request: NextRequest, context: APIAccessContext, ...args: T) => Promise<Response>
  ) {
    return async (request: NextRequest, ...args: T): Promise<Response> => {
      const user = extractAuthUser(request);
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }), 
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const context = getAPIAccessContext(user);
      
      if (!context.featurePermissions[permission]) {
        return new Response(
          JSON.stringify({ 
            error: 'Forbidden', 
            message: `Access denied. Missing required permission: ${permission}` 
          }), 
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return handler(request, context, ...args);
    };
  };
}

/**
 * HTTP method specific middleware
 */
export function withMethodPermissions<T extends any[]>(
  handlers: {
    GET?: (request: NextRequest, context: APIAccessContext, ...args: T) => Promise<Response>;
    POST?: (request: NextRequest, context: APIAccessContext, ...args: T) => Promise<Response>;
    PUT?: (request: NextRequest, context: APIAccessContext, ...args: T) => Promise<Response>;
    DELETE?: (request: NextRequest, context: APIAccessContext, ...args: T) => Promise<Response>;
  },
  permissions: {
    GET?: keyof APIAccessContext['featurePermissions'] | UserRoleCode[];
    POST?: keyof APIAccessContext['featurePermissions'] | UserRoleCode[];
    PUT?: keyof APIAccessContext['featurePermissions'] | UserRoleCode[];
    DELETE?: keyof APIAccessContext['featurePermissions'] | UserRoleCode[];
  }
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const method = request.method as keyof typeof handlers;
    const handler = handlers[method];
    const requiredPermission = permissions[method];

    if (!handler) {
      return new Response(
        JSON.stringify({ error: 'Method Not Allowed' }), 
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = extractAuthUser(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const context = getAPIAccessContext(user);

    // Check permission requirements
    if (requiredPermission) {
      if (Array.isArray(requiredPermission)) {
        // Role-based check
        if (!hasAPIAccess(user, requiredPermission)) {
          return new Response(
            JSON.stringify({ 
              error: 'Forbidden', 
              message: `Access denied. Required roles: ${requiredPermission.join(', ')}. Your role: ${user.activeRole}` 
            }), 
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else {
        // Permission-based check
        if (!context.featurePermissions[requiredPermission]) {
          return new Response(
            JSON.stringify({ 
              error: 'Forbidden', 
              message: `Access denied. Missing required permission: ${requiredPermission}` 
            }), 
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    return handler(request, context, ...args);
  };
}

export function withAPIRoleAccess<T extends any[]>(
  handler: (request: NextRequest, context: APIAccessContext, ...args: T) => Promise<Response>,
  requiredRoles: UserRoleCode[]
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const user = extractAuthUser(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!hasAPIAccess(user, requiredRoles)) {
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden', 
          message: `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${user.activeRole}` 
        }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const context = getAPIAccessContext(user);
    return handler(request, context, ...args);
  };
}

/**
 * Department scoping middleware - filters data based on user's department access
 */
export function applyDepartmentFilter<T extends { departmentId?: string }>(
  data: T[], 
  context: APIAccessContext
): T[] {
  if (context.canViewAllDepartments) {
    return data;
  }
  
  if (!context.departmentFilter) {
    return [];
  }
  
  return data.filter(item => item.departmentId === context.departmentFilter);
}

/**
 * Audit logging for API operations
 */
export async function logAPIOperation(
  context: APIAccessContext,
  operation: string,
  resource: string,
  resourceId?: string,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  const { auditLogger, AUDIT_RESOURCES } = await import('@/lib/audit/audit-logger');
  
  const auditAction = success ? 'logAction' : 'logFailure';
  
  await auditLogger[auditAction]({
    userId: context.user.email, // Using email as fallback ID
    userEmail: context.user.email,
    userRole: context.user.activeRole,
    action: operation,
    resource,
    resourceId,
    departmentId: context.user.departmentId,
    status: success ? 'success' : 'failed',
    details: {
      apiEndpoint: true,
      operation,
      ...(errorMessage && { error: errorMessage })
    }
  });
}