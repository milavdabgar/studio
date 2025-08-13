/**
 * Field-Level Permissions System
 * Provides granular control over what fields users can view, edit, or hide
 */

import type { UserRole } from '@/types/entities';
import { ComprehensiveAuditLogger, type AuditContext } from '@/lib/audit/comprehensive-audit';

export interface FieldPermission {
  canView: boolean;
  canEdit: boolean;
  canCreate: boolean;
  isRequired?: boolean;
  isSensitive?: boolean;
  validateAccess?: (context: FieldPermissionContext) => boolean;
  masking?: {
    enabled: boolean;
    pattern: string; // e.g., "***-**-####" for partial masking
  };
}

export interface FieldPermissionContext {
  userId: string;
  userRole: UserRole;
  userEmail: string;
  departmentId?: string;
  resource: string;
  resourceId?: string;
  operation: 'view' | 'edit' | 'create';
}

export interface ResourceFieldPermissions {
  [fieldName: string]: {
    [role in UserRole]?: FieldPermission;
  } & {
    default?: FieldPermission;
  };
}

export class FieldLevelPermissions {
  private static permissions: Map<string, ResourceFieldPermissions> = new Map();

  /**
   * Register field permissions for a resource
   */
  static registerResourcePermissions(
    resourceType: string,
    permissions: ResourceFieldPermissions
  ): void {
    this.permissions.set(resourceType, permissions);
  }

  /**
   * Get field permission for a specific user and field
   */
  static getFieldPermission(
    context: FieldPermissionContext,
    fieldName: string
  ): FieldPermission {
    const resourcePermissions = this.permissions.get(context.resource);
    
    if (!resourcePermissions || !resourcePermissions[fieldName]) {
      // Default deny-all permission
      return {
        canView: false,
        canEdit: false,
        canCreate: false,
        isSensitive: true
      };
    }

    const fieldConfig = resourcePermissions[fieldName];
    
    // Get role-specific permission or fall back to default
    const permission = fieldConfig[context.userRole] || fieldConfig.default || {
      canView: false,
      canEdit: false,
      canCreate: false
    };

    // Apply custom validation if provided
    if (permission.validateAccess) {
      const customResult = permission.validateAccess(context);
      if (!customResult) {
        return {
          ...permission,
          canView: false,
          canEdit: false,
          canCreate: false
        };
      }
    }

    return permission;
  }

  /**
   * Check if user can perform operation on field
   */
  static async canAccessField(
    context: FieldPermissionContext,
    fieldName: string
  ): Promise<boolean> {
    const permission = this.getFieldPermission(context, fieldName);
    let hasAccess = false;

    switch (context.operation) {
      case 'view':
        hasAccess = permission.canView;
        break;
      case 'edit':
        hasAccess = permission.canEdit;
        break;
      case 'create':
        hasAccess = permission.canCreate;
        break;
    }

    // Log field access attempt
    await ComprehensiveAuditLogger.logPermissionCheck(
      {
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        departmentId: context.departmentId
      },
      `${context.resource}.${fieldName}`,
      context.operation,
      hasAccess ? 'granted' : 'denied',
      hasAccess ? undefined : `Field ${fieldName} access denied for role ${context.userRole}`
    );

    return hasAccess;
  }

  /**
   * Filter object data based on field permissions
   */
  static async filterObjectData(
    context: Omit<FieldPermissionContext, 'operation'>,
    data: Record<string, any>,
    operation: 'view' | 'edit' | 'create' = 'view'
  ): Promise<Record<string, any>> {
    const filteredData: Record<string, any> = {};
    const auditContext = {
      userId: context.userId,
      userEmail: context.userEmail,
      userRole: context.userRole,
      departmentId: context.departmentId
    };

    for (const [fieldName, value] of Object.entries(data)) {
      const hasAccess = await this.canAccessField(
        { ...context, operation },
        fieldName
      );

      if (hasAccess) {
        const permission = this.getFieldPermission({ ...context, operation }, fieldName);
        
        // Apply masking if configured
        if (permission.masking?.enabled && operation === 'view') {
          filteredData[fieldName] = this.applyMasking(value, permission.masking.pattern);
        } else {
          filteredData[fieldName] = value;
        }
      }
    }

    // Log data filtering
    await ComprehensiveAuditLogger.logDataAccess(
      auditContext,
      context.resource,
      context.resourceId || 'unknown',
      operation === 'view' ? 'view' : 'export',
      {
        originalFields: Object.keys(data).length,
        filteredFields: Object.keys(filteredData).length,
        operation
      }
    );

    return filteredData;
  }

  /**
   * Validate field data for create/update operations
   */
  static async validateFieldData(
    context: Omit<FieldPermissionContext, 'operation'>,
    data: Record<string, any>,
    operation: 'create' | 'edit'
  ): Promise<{
    isValid: boolean;
    allowedFields: Record<string, any>;
    deniedFields: string[];
    requiredMissing: string[];
  }> {
    const allowedFields: Record<string, any> = {};
    const deniedFields: string[] = [];
    const requiredMissing: string[] = [];

    // Check each field in the input data
    for (const [fieldName, value] of Object.entries(data)) {
      const hasAccess = await this.canAccessField(
        { ...context, operation },
        fieldName
      );

      if (hasAccess) {
        allowedFields[fieldName] = value;
      } else {
        deniedFields.push(fieldName);
      }
    }

    // Check for required fields
    const resourcePermissions = this.permissions.get(context.resource);
    if (resourcePermissions) {
      for (const [fieldName, fieldConfig] of Object.entries(resourcePermissions)) {
        const permission = fieldConfig[context.userRole] || fieldConfig.default;
        
        if (permission?.isRequired && operation === 'create' && !(fieldName in data)) {
          requiredMissing.push(fieldName);
        }
      }
    }

    const isValid = deniedFields.length === 0 && requiredMissing.length === 0;

    return {
      isValid,
      allowedFields,
      deniedFields,
      requiredMissing
    };
  }

  /**
   * Get field metadata for UI rendering
   */
  static getFieldMetadata(
    context: Omit<FieldPermissionContext, 'operation'>,
    fieldName: string
  ): {
    canView: boolean;
    canEdit: boolean;
    canCreate: boolean;
    isSensitive: boolean;
    isRequired: boolean;
    hasMasking: boolean;
  } {
    const viewPermission = this.getFieldPermission({ ...context, operation: 'view' }, fieldName);
    const editPermission = this.getFieldPermission({ ...context, operation: 'edit' }, fieldName);
    const createPermission = this.getFieldPermission({ ...context, operation: 'create' }, fieldName);

    return {
      canView: viewPermission.canView,
      canEdit: editPermission.canEdit,
      canCreate: createPermission.canCreate,
      isSensitive: viewPermission.isSensitive || false,
      isRequired: createPermission.isRequired || false,
      hasMasking: viewPermission.masking?.enabled || false
    };
  }

  /**
   * Apply masking to sensitive data
   */
  private static applyMasking(value: any, pattern: string): any {
    if (typeof value !== 'string') return value;
    
    // Simple masking implementation
    if (pattern === 'email') {
      const [username, domain] = value.split('@');
      return `${username.substring(0, 2)}***@${domain}`;
    }
    
    if (pattern === 'phone') {
      return value.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
    }
    
    if (pattern === 'partial') {
      const len = value.length;
      if (len <= 4) return '****';
      return value.substring(0, 2) + '*'.repeat(len - 4) + value.substring(len - 2);
    }
    
    return value;
  }
}

// Default field permissions for common resources
export const registerDefaultPermissions = () => {
  // User resource permissions
  FieldLevelPermissions.registerResourcePermissions('user', {
    id: {
      default: { canView: true, canEdit: false, canCreate: false }
    },
    email: {
      super_admin: { canView: true, canEdit: true, canCreate: true },
      admin: { canView: true, canEdit: true, canCreate: true },
      hod: { canView: true, canEdit: false, canCreate: false },
      faculty: { canView: false, canEdit: false, canCreate: false },
      student: { canView: false, canEdit: false, canCreate: false },
      default: { canView: false, canEdit: false, canCreate: false }
    },
    password: {
      default: { 
        canView: false, 
        canEdit: false, 
        canCreate: false, 
        isSensitive: true 
      }
    },
    displayName: {
      super_admin: { canView: true, canEdit: true, canCreate: true },
      admin: { canView: true, canEdit: true, canCreate: true },
      hod: { canView: true, canEdit: false, canCreate: false },
      faculty: { canView: true, canEdit: false, canCreate: false },
      student: { canView: true, canEdit: false, canCreate: false },
      default: { canView: true, canEdit: false, canCreate: false }
    },
    roles: {
      super_admin: { canView: true, canEdit: true, canCreate: true },
      admin: { canView: true, canEdit: true, canCreate: true },
      default: { canView: false, canEdit: false, canCreate: false, isSensitive: true }
    },
    phoneNumber: {
      super_admin: { canView: true, canEdit: true, canCreate: true },
      admin: { canView: true, canEdit: true, canCreate: true },
      hod: { 
        canView: true, 
        canEdit: false, 
        canCreate: false,
        masking: { enabled: true, pattern: 'phone' }
      },
      default: { 
        canView: false, 
        canEdit: false, 
        canCreate: false, 
        isSensitive: true 
      }
    }
  });

  // Timetable resource permissions
  FieldLevelPermissions.registerResourcePermissions('timetable', {
    name: {
      super_admin: { canView: true, canEdit: true, canCreate: true },
      admin: { canView: true, canEdit: true, canCreate: true },
      hod: { canView: true, canEdit: true, canCreate: true },
      faculty: { canView: true, canEdit: false, canCreate: false },
      student: { canView: true, canEdit: false, canCreate: false },
      default: { canView: true, canEdit: false, canCreate: false }
    },
    programId: {
      super_admin: { canView: true, canEdit: true, canCreate: true },
      admin: { canView: true, canEdit: true, canCreate: true },
      hod: { canView: true, canEdit: true, canCreate: true },
      faculty: { canView: true, canEdit: false, canCreate: false },
      default: { canView: false, canEdit: false, canCreate: false }
    },
    status: {
      super_admin: { canView: true, canEdit: true, canCreate: true },
      admin: { canView: true, canEdit: true, canCreate: true },
      hod: { canView: true, canEdit: true, canCreate: true },
      default: { canView: true, canEdit: false, canCreate: false }
    },
    createdBy: {
      super_admin: { canView: true, canEdit: false, canCreate: false },
      admin: { canView: true, canEdit: false, canCreate: false },
      default: { canView: false, canEdit: false, canCreate: false, isSensitive: true }
    },
    entries: {
      super_admin: { canView: true, canEdit: true, canCreate: true },
      admin: { canView: true, canEdit: true, canCreate: true },
      hod: { canView: true, canEdit: true, canCreate: true },
      faculty: { canView: true, canEdit: false, canCreate: false },
      student: { canView: true, canEdit: false, canCreate: false },
      default: { canView: false, canEdit: false, canCreate: false }
    }
  });

  // Student resource permissions
  FieldLevelPermissions.registerResourcePermissions('student', {
    enrollmentNo: {
      default: { canView: true, canEdit: false, canCreate: true, isRequired: true }
    },
    personalEmail: {
      super_admin: { canView: true, canEdit: true, canCreate: true },
      admin: { canView: true, canEdit: true, canCreate: true },
      hod: { 
        canView: true, 
        canEdit: false, 
        canCreate: false,
        masking: { enabled: true, pattern: 'email' }
      },
      faculty: { 
        canView: true, 
        canEdit: false, 
        canCreate: false,
        masking: { enabled: true, pattern: 'email' }
      },
      student: { 
        canView: false, 
        canEdit: false, 
        canCreate: false, 
        isSensitive: true 
      },
      default: { 
        canView: false, 
        canEdit: false, 
        canCreate: false, 
        isSensitive: true 
      }
    },
    phoneNumber: {
      super_admin: { canView: true, canEdit: true, canCreate: true },
      admin: { canView: true, canEdit: true, canCreate: true },
      hod: { 
        canView: true, 
        canEdit: false, 
        canCreate: false,
        masking: { enabled: true, pattern: 'phone' }
      },
      default: { 
        canView: false, 
        canEdit: false, 
        canCreate: false, 
        isSensitive: true 
      }
    },
    guardianDetails: {
      super_admin: { canView: true, canEdit: true, canCreate: true },
      admin: { canView: true, canEdit: true, canCreate: true },
      default: { 
        canView: false, 
        canEdit: false, 
        canCreate: false, 
        isSensitive: true 
      }
    }
  });
};

// Initialize default permissions
registerDefaultPermissions();