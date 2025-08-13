import { NextRequest, NextResponse } from 'next/server';
import { auditLogger, AUDIT_ACTIONS, AUDIT_RESOURCES } from './audit-logger';
import { extractAuthUser } from '../auth/api-middleware';

export interface AuditMiddlewareConfig {
  resource: string;
  action?: string;
  extractResourceId?: (request: NextRequest) => string | undefined;
  skipLogging?: (request: NextRequest) => boolean;
}

/**
 * Middleware to automatically log API access with role-based audit trail
 */
export function withAuditLogging<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>,
  config: AuditMiddlewareConfig
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const startTime = Date.now();
    let response: Response;
    let status: 'success' | 'failed' | 'unauthorized' = 'success';

    try {
      // Skip logging if configured to do so
      if (config.skipLogging && config.skipLogging(request)) {
        return await handler(request, ...args);
      }

      // Extract user information
      const user = extractAuthUser(request);
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      // Determine action from HTTP method if not specified
      const action = config.action || getActionFromMethod(request.method);
      
      // Extract resource ID if configured
      const resourceId = config.extractResourceId ? config.extractResourceId(request) : undefined;

      // Execute the handler
      response = await handler(request, ...args);

      // Determine status from response
      if (response.status >= 400 && response.status < 500) {
        status = response.status === 401 || response.status === 403 ? 'unauthorized' : 'failed';
      } else if (response.status >= 500) {
        status = 'failed';
      }

      // Log the action
      if (user) {
        await auditLogger.logAction({
          userId: user.email,
          userEmail: user.email,
          userRole: user.activeRole,
          action,
          resource: config.resource,
          resourceId,
          status,
          departmentId: user.departmentId,
          ipAddress,
          userAgent,
          details: {
            method: request.method,
            url: request.url,
            responseStatus: response.status,
            processingTime: Date.now() - startTime
          }
        });
      } else {
        // Log anonymous access attempt
        await auditLogger.logAction({
          userId: 'anonymous',
          userEmail: 'anonymous',
          userRole: 'anonymous',
          action,
          resource: config.resource,
          resourceId,
          status: 'unauthorized',
          ipAddress,
          userAgent,
          details: {
            method: request.method,
            url: request.url,
            responseStatus: response.status,
            processingTime: Date.now() - startTime
          }
        });
      }

      return response;

    } catch (error) {
      status = 'failed';
      
      // Log the failed action
      const user = extractAuthUser(request);
      if (user) {
        await auditLogger.logFailure({
          userId: user.email,
          userEmail: user.email,
          userRole: user.activeRole,
          action: config.action || getActionFromMethod(request.method),
          resource: config.resource,
          resourceId: config.extractResourceId ? config.extractResourceId(request) : undefined,
          departmentId: user.departmentId,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          details: {
            method: request.method,
            url: request.url,
            processingTime: Date.now() - startTime
          }
        }, error as Error);
      }

      throw error;
    }
  };
}

/**
 * Map HTTP methods to audit actions
 */
function getActionFromMethod(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return AUDIT_ACTIONS.ACCESS;
    case 'POST':
      return AUDIT_ACTIONS.CREATE;
    case 'PUT':
    case 'PATCH':
      return AUDIT_ACTIONS.UPDATE;
    case 'DELETE':
      return AUDIT_ACTIONS.DELETE;
    default:
      return method.toUpperCase();
  }
}

/**
 * Extract resource ID from URL path
 */
export function extractIdFromPath(request: NextRequest): string | undefined {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  
  // Look for the last segment that looks like an ID
  for (let i = pathSegments.length - 1; i >= 0; i--) {
    const segment = pathSegments[i];
    // Check if it looks like an ID (contains letters and numbers, not just 'route' or 'api')
    if (segment && segment !== 'route' && segment !== 'api' && /^[a-zA-Z0-9_-]+$/.test(segment)) {
      return segment;
    }
  }
  
  return undefined;
}

/**
 * Create audit logging wrapper for specific resources
 */
export const createResourceAuditWrapper = (resource: string) => {
  return <T extends any[]>(
    handler: (request: NextRequest, ...args: T) => Promise<Response>,
    action?: string
  ) => withAuditLogging(handler, {
    resource,
    action,
    extractResourceId: extractIdFromPath
  });
};

// Pre-configured audit wrappers for common resources
export const withStudentsAudit = createResourceAuditWrapper(AUDIT_RESOURCES.STUDENTS);
export const withFacultyAudit = createResourceAuditWrapper(AUDIT_RESOURCES.FACULTY);
export const withCoursesAudit = createResourceAuditWrapper(AUDIT_RESOURCES.COURSES);
export const withProgramsAudit = createResourceAuditWrapper(AUDIT_RESOURCES.PROGRAMS);
export const withTimetablesAudit = createResourceAuditWrapper(AUDIT_RESOURCES.TIMETABLES);
export const withBatchesAudit = createResourceAuditWrapper(AUDIT_RESOURCES.BATCHES);
export const withRoomsAudit = createResourceAuditWrapper(AUDIT_RESOURCES.ROOMS);
export const withUsersAudit = createResourceAuditWrapper(AUDIT_RESOURCES.USERS);