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