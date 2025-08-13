/**
 * Advanced RBAC for Timetable Management
 * Provides field-level permissions and granular access control for timetable operations
 */

import type { UserRole } from '@/types/entities';
import { auditLogger } from '@/lib/audit/audit-logger';

export interface TimetableRBACContext {
  userId: string;
  userRole: UserRole;
  userEmail: string;
  departmentId?: string;
  instituteId?: string;
}

export interface TimetablePermissions {
  // Core Permissions
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canArchive: boolean;
  
  // Advanced Permissions
  canAutoGenerate: boolean;
  canManageConstraints: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
  canImportData: boolean;
  canApproveChanges: boolean;
  canOverrideConflicts: boolean;
  canAccessAllDepartments: boolean;
  
  // Field-Level Permissions
  fields: {
    canEditBasicInfo: boolean;      // name, description, academicYear, semester
    canEditScheduling: boolean;     // programId, batchId, version, effectiveDate
    canEditEntries: boolean;        // timetable entries (add/edit/delete)
    canEditStatus: boolean;         // status changes (draft/published/archived)
    canEditSettings: boolean;       // advanced settings and constraints
    canViewSensitiveData: boolean;  // faculty assignments, room allocations
    canEditMetadata: boolean;       // createdBy, updatedBy, timestamps
  };
  
  // Scope Permissions
  scope: {
    departments: string[];          // Departments user can access
    programs: string[];             // Programs user can manage
    batches: string[];              // Batches user can access
    canAccessCrossDepartment: boolean;
    canAccessAllPrograms: boolean;
  };
}

export class TimetableRBACEngine {
  /**
   * Get comprehensive timetable permissions for a user
   */
  static getTimetablePermissions(context: TimetableRBACContext): TimetablePermissions {
    const { userRole, departmentId } = context;
    
    const basePermissions: TimetablePermissions = {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canPublish: false,
      canArchive: false,
      canAutoGenerate: false,
      canManageConstraints: false,
      canViewAnalytics: false,
      canExportData: false,
      canImportData: false,
      canApproveChanges: false,
      canOverrideConflicts: false,
      canAccessAllDepartments: false,
      fields: {
        canEditBasicInfo: false,
        canEditScheduling: false,
        canEditEntries: false,
        canEditStatus: false,
        canEditSettings: false,
        canViewSensitiveData: false,
        canEditMetadata: false,
      },
      scope: {
        departments: departmentId ? [departmentId] : [],
        programs: [],
        batches: [],
        canAccessCrossDepartment: false,
        canAccessAllPrograms: false,
      }
    };

    switch (userRole) {
      case 'super_admin':
      case 'admin':
        return {
          ...basePermissions,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canPublish: true,
          canArchive: true,
          canAutoGenerate: true,
          canManageConstraints: true,
          canViewAnalytics: true,
          canExportData: true,
          canImportData: true,
          canApproveChanges: true,
          canOverrideConflicts: true,
          canAccessAllDepartments: true,
          fields: {
            canEditBasicInfo: true,
            canEditScheduling: true,
            canEditEntries: true,
            canEditStatus: true,
            canEditSettings: true,
            canViewSensitiveData: true,
            canEditMetadata: true,
          },
          scope: {
            departments: [],
            programs: [],
            batches: [],
            canAccessCrossDepartment: true,
            canAccessAllPrograms: true,
          }
        };

      case 'hod':
      case 'department_admin':
        return {
          ...basePermissions,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: false, // HOD can't delete published timetables
          canPublish: true,
          canArchive: true,
          canAutoGenerate: true,
          canManageConstraints: true,
          canViewAnalytics: true,
          canExportData: true,
          canImportData: true,
          canApproveChanges: true,
          canOverrideConflicts: true,
          canAccessAllDepartments: false,
          fields: {
            canEditBasicInfo: true,
            canEditScheduling: true,
            canEditEntries: true,
            canEditStatus: true,
            canEditSettings: true,
            canViewSensitiveData: true,
            canEditMetadata: false, // Can't edit system metadata
          },
          scope: {
            departments: departmentId ? [departmentId] : [],
            programs: [],
            batches: [],
            canAccessCrossDepartment: false,
            canAccessAllPrograms: true, // Within their department
          }
        };

      case 'faculty':
        return {
          ...basePermissions,
          canView: true,
          canCreate: false, // Faculty can't create new timetables
          canEdit: false,   // Faculty can't edit timetables directly
          canDelete: false,
          canPublish: false,
          canArchive: false,
          canAutoGenerate: false,
          canManageConstraints: false,
          canViewAnalytics: true,
          canExportData: true,
          canImportData: false,
          canApproveChanges: false,
          canOverrideConflicts: false,
          canAccessAllDepartments: false,
          fields: {
            canEditBasicInfo: false,
            canEditScheduling: false,
            canEditEntries: false,
            canEditStatus: false,
            canEditSettings: false,
            canViewSensitiveData: true, // Can view their own assignments
            canEditMetadata: false,
          },
          scope: {
            departments: departmentId ? [departmentId] : [],
            programs: [],
            batches: [],
            canAccessCrossDepartment: false,
            canAccessAllPrograms: false,
          }
        };

      case 'student':
        return {
          ...basePermissions,
          canView: true, // Students can only view published timetables
          canViewAnalytics: false, // Limited analytics access
          canExportData: true, // Can export their own timetable
          fields: {
            canEditBasicInfo: false,
            canEditScheduling: false,
            canEditEntries: false,
            canEditStatus: false,
            canEditSettings: false,
            canViewSensitiveData: false, // Can't see faculty assignments details
            canEditMetadata: false,
          },
          scope: {
            departments: departmentId ? [departmentId] : [],
            programs: [],
            batches: [],
            canAccessCrossDepartment: false,
            canAccessAllPrograms: false,
          }
        };

      default:
        return basePermissions; // No permissions for unknown roles
    }
  }

  /**
   * Check if user can perform a specific timetable operation
   */
  static async canPerformOperation(
    context: TimetableRBACContext,
    operation: keyof Omit<TimetablePermissions, 'fields' | 'scope'>,
    resourceId?: string
  ): Promise<boolean> {
    const permissions = this.getTimetablePermissions(context);
    const canPerform = permissions[operation];

    // Log the permission check
    await auditLogger.logAction({
      userId: context.userId,
      userEmail: context.userEmail,
      userRole: context.userRole,
      action: 'PERMISSION_CHECK',
      resource: 'timetable',
      status: canPerform ? 'success' : 'denied',
      details: {
        operation,
        resourceId,
        departmentId: context.departmentId,
        result: canPerform
      }
    });

    return canPerform;
  }

  /**
   * Check field-level permissions
   */
  static async canEditField(
    context: TimetableRBACContext,
    field: keyof TimetablePermissions['fields'],
    resourceId?: string
  ): Promise<boolean> {
    const permissions = this.getTimetablePermissions(context);
    const canEdit = permissions.fields[field];

    // Log field-level permission check
    await auditLogger.logAction({
      userId: context.userId,
      userEmail: context.userEmail,
      userRole: context.userRole,
      action: 'FIELD_PERMISSION_CHECK',
      resource: 'timetable',
      status: canEdit ? 'success' : 'denied',
      details: {
        field,
        resourceId,
        departmentId: context.departmentId,
        result: canEdit
      }
    });

    return canEdit;
  }

  /**
   * Get filtered timetable data based on user permissions
   */
  static filterTimetableData(
    context: TimetableRBACContext,
    timetableData: any
  ): any {
    const permissions = this.getTimetablePermissions(context);
    
    // Create a copy to avoid mutating original data
    const filteredData = { ...timetableData };

    // Apply field-level filtering
    if (!permissions.fields.canViewSensitiveData) {
      // Remove sensitive faculty information
      if (filteredData.entries) {
        filteredData.entries = filteredData.entries.map((entry: any) => ({
          ...entry,
          facultyId: undefined, // Hide faculty assignments
          facultyDetails: undefined,
        }));
      }
    }

    if (!permissions.fields.canEditMetadata) {
      // Remove system metadata
      delete filteredData.createdBy;
      delete filteredData.updatedBy;
      delete filteredData.createdAt;
      delete filteredData.updatedAt;
    }

    return filteredData;
  }

  /**
   * Validate timetable operation with comprehensive checks
   */
  static async validateTimetableOperation(
    context: TimetableRBACContext,
    operation: string,
    data: any,
    resourceId?: string
  ): Promise<{ allowed: boolean; reason?: string; restrictions?: string[] }> {
    const permissions = this.getTimetablePermissions(context);
    const restrictions: string[] = [];

    // Check basic operation permission
    const operationKey = operation as keyof Omit<TimetablePermissions, 'fields' | 'scope'>;
    if (!permissions[operationKey]) {
      return {
        allowed: false,
        reason: `Operation '${operation}' not permitted for role '${context.userRole}'`,
        restrictions
      };
    }

    // Check department scope
    if (data.departmentId && permissions.scope.departments.length > 0) {
      if (!permissions.scope.departments.includes(data.departmentId)) {
        return {
          allowed: false,
          reason: 'Access denied for this department',
          restrictions: [`Department access limited to: ${permissions.scope.departments.join(', ')}`]
        };
      }
    }

    // Check field-level restrictions
    if (operation === 'canEdit' && data.fields) {
      for (const field of Object.keys(data.fields)) {
        const fieldKey = field as keyof TimetablePermissions['fields'];
        if (permissions.fields[fieldKey] === false) {
          restrictions.push(`Cannot edit field: ${field}`);
        }
      }
    }

    // Log validation result
    await auditLogger.logAction({
      userId: context.userId,
      userEmail: context.userEmail,
      userRole: context.userRole,
      action: 'TIMETABLE_OPERATION_VALIDATION',
      resource: 'timetable',
      status: 'success',
      details: {
        operation,
        resourceId,
        allowed: true,
        restrictions: restrictions.length > 0 ? restrictions : undefined
      }
    });

    return {
      allowed: true,
      restrictions: restrictions.length > 0 ? restrictions : undefined
    };
  }
}

/**
 * Middleware helper for timetable RBAC
 */
export const withTimetableRBAC = (
  operation: keyof Omit<TimetablePermissions, 'fields' | 'scope'>
) => {
  return async (handler: Function) => {
    return async (req: any, context: TimetableRBACContext) => {
      const canPerform = await TimetableRBACEngine.canPerformOperation(
        context,
        operation
      );

      if (!canPerform) {
        throw new Error(`Operation '${operation}' not permitted`);
      }

      return handler(req, context);
    };
  };
};

/**
 * React Hook for timetable permissions
 */
export const useTimetablePermissions = (context: TimetableRBACContext) => {
  return TimetableRBACEngine.getTimetablePermissions(context);
};