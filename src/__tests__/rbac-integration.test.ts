/**
 * Comprehensive RBAC Integration Tests
 * Tests the complete RBAC system including authentication, authorization, field-level permissions, and audit logging
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { TimetableRBACEngine, type TimetableRBACContext } from '@/lib/auth/timetable-rbac';
import { FieldLevelPermissions, type FieldPermissionContext } from '@/lib/auth/field-level-permissions';
import { ComprehensiveAuditLogger, type AuditContext } from '@/lib/audit/comprehensive-audit';
import { AuthService } from '@/lib/services/authService';
import type { UserRole } from '@/types/entities';

// Mock the audit logger
jest.mock('@/lib/audit/audit-logger', () => ({
  auditLogger: {
    logAction: jest.fn()
  }
}));

// Mock MongoDB connection
jest.mock('@/lib/mongodb', () => ({
  connectMongoose: jest.fn()
}));

// Mock UserModel
jest.mock('@/lib/models', () => ({
  UserModel: {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn()
  }
}));

describe('RBAC Integration Tests', () => {
  let mockUser: any;
  let timetableContext: TimetableRBACContext;
  let fieldContext: FieldPermissionContext;
  let auditContext: AuditContext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = {
      id: 'user123',
      email: 'test@example.com',
      displayName: 'Test User',
      currentRole: 'faculty' as UserRole,
      roles: ['faculty'],
      isActive: true
    };

    timetableContext = {
      userId: 'user123',
      userRole: 'faculty' as UserRole,
      userEmail: 'test@example.com',
      departmentId: 'dept_cs'
    };

    fieldContext = {
      userId: 'user123',
      userRole: 'faculty' as UserRole,
      userEmail: 'test@example.com',
      resource: 'timetable',
      operation: 'view'
    };

    auditContext = {
      userId: 'user123',
      userEmail: 'test@example.com',
      userRole: 'faculty' as UserRole,
      departmentId: 'dept_cs'
    };
  });

  describe('Timetable RBAC Engine', () => {
    test('should grant correct permissions for faculty role', () => {
      const permissions = TimetableRBACEngine.getTimetablePermissions(timetableContext);

      expect(permissions.canView).toBe(true);
      expect(permissions.canCreate).toBe(false);
      expect(permissions.canEdit).toBe(false);
      expect(permissions.canDelete).toBe(false);
      expect(permissions.canPublish).toBe(false);
      expect(permissions.canViewAnalytics).toBe(true);
      expect(permissions.canExportData).toBe(true);
      expect(permissions.fields.canViewSensitiveData).toBe(true);
      expect(permissions.fields.canEditEntries).toBe(false);
    });

    test('should grant admin permissions for admin role', () => {
      const adminContext = { ...timetableContext, userRole: 'admin' as UserRole };
      const permissions = TimetableRBACEngine.getTimetablePermissions(adminContext);

      expect(permissions.canView).toBe(true);
      expect(permissions.canCreate).toBe(true);
      expect(permissions.canEdit).toBe(true);
      expect(permissions.canDelete).toBe(true);
      expect(permissions.canPublish).toBe(true);
      expect(permissions.canAutoGenerate).toBe(true);
      expect(permissions.canAccessAllDepartments).toBe(true);
      expect(permissions.fields.canEditSettings).toBe(true);
      expect(permissions.fields.canEditMetadata).toBe(true);
    });

    test('should grant HOD permissions with department restrictions', () => {
      const hodContext = { ...timetableContext, userRole: 'hod' as UserRole };
      const permissions = TimetableRBACEngine.getTimetablePermissions(hodContext);

      expect(permissions.canView).toBe(true);
      expect(permissions.canCreate).toBe(true);
      expect(permissions.canEdit).toBe(true);
      expect(permissions.canDelete).toBe(false); // HOD can't delete published timetables
      expect(permissions.canPublish).toBe(true);
      expect(permissions.canAccessAllDepartments).toBe(false);
      expect(permissions.scope.departments).toContain('dept_cs');
      expect(permissions.fields.canEditMetadata).toBe(false); // Can't edit system metadata
    });

    test('should grant limited student permissions', () => {
      const studentContext = { ...timetableContext, userRole: 'student' as UserRole };
      const permissions = TimetableRBACEngine.getTimetablePermissions(studentContext);

      expect(permissions.canView).toBe(true);
      expect(permissions.canCreate).toBe(false);
      expect(permissions.canEdit).toBe(false);
      expect(permissions.canViewAnalytics).toBe(false);
      expect(permissions.canExportData).toBe(true);
      expect(permissions.fields.canViewSensitiveData).toBe(false);
    });

    test('should properly validate timetable operations', async () => {
      const result = await TimetableRBACEngine.validateTimetableOperation(
        timetableContext,
        'canView',
        { departmentId: 'dept_cs' },
        'timetable123'
      );

      expect(result.allowed).toBe(true);
      expect(result.restrictions).toBeUndefined();
    });

    test('should deny operations for insufficient permissions', async () => {
      const result = await TimetableRBACEngine.validateTimetableOperation(
        timetableContext,
        'canDelete', // Faculty can't delete
        { departmentId: 'dept_cs' },
        'timetable123'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not permitted');
    });

    test('should filter sensitive timetable data appropriately', () => {
      const timetableData = {
        id: 'timetable123',
        name: 'CS Semester 5',
        entries: [
          {
            id: 'entry1',
            facultyId: 'faculty123',
            facultyDetails: { name: 'Dr. Smith', email: 'smith@example.com' },
            courseId: 'course123'
          }
        ],
        createdBy: 'admin123',
        updatedBy: 'admin456',
        createdAt: '2024-01-01T00:00:00Z'
      };

      const filteredData = TimetableRBACEngine.filterTimetableData(timetableContext, timetableData);

      expect(filteredData.id).toBe('timetable123');
      expect(filteredData.name).toBe('CS Semester 5');
      expect(filteredData.entries[0].facultyId).toBeDefined(); // Faculty can see faculty assignments
      expect(filteredData.createdBy).toBeUndefined(); // Faculty can't see metadata
    });
  });

  describe('Field-Level Permissions', () => {
    test('should check field access permissions correctly', async () => {
      const canViewEmail = await FieldLevelPermissions.canAccessField(
        { ...fieldContext, operation: 'view' },
        'email'
      );

      const canEditEmail = await FieldLevelPermissions.canAccessField(
        { ...fieldContext, operation: 'edit' },
        'email'
      );

      // Faculty should not be able to view or edit user emails
      expect(canViewEmail).toBe(false);
      expect(canEditEmail).toBe(false);
    });

    test('should properly filter object data based on permissions', async () => {
      const userData = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        phoneNumber: '1234567890',
        password: 'secret123'
      };

      const filteredData = await FieldLevelPermissions.filterObjectData(
        { ...fieldContext, resource: 'user' },
        userData,
        'view'
      );

      expect(filteredData.id).toBeDefined(); // ID should be visible
      expect(filteredData.displayName).toBeDefined(); // Display name should be visible
      expect(filteredData.email).toBeUndefined(); // Email should be filtered out for faculty
      expect(filteredData.password).toBeUndefined(); // Password should never be visible
    });

    test('should validate field data for create operations', async () => {
      const createData = {
        displayName: 'New User',
        email: 'new@example.com',
        roles: ['admin'] // Faculty shouldn't be able to set roles
      };

      const validation = await FieldLevelPermissions.validateFieldData(
        { ...fieldContext, resource: 'user' },
        createData,
        'create'
      );

      expect(validation.isValid).toBe(false);
      expect(validation.deniedFields).toContain('email');
      expect(validation.deniedFields).toContain('roles');
      expect(validation.deniedFields).toContain('displayName'); // Faculty can't create displayName
      expect(validation.allowedFields).toEqual({}); // No fields allowed for faculty to create
    });

    test('should apply masking to sensitive fields', async () => {
      const hodContext = { ...fieldContext, userRole: 'hod' as UserRole, resource: 'student' };
      const studentData = {
        enrollmentNo: '2021001',
        personalEmail: 'student@gmail.com',
        phoneNumber: '9876543210'
      };

      const filteredData = await FieldLevelPermissions.filterObjectData(
        hodContext,
        studentData,
        'view'
      );

      // HOD should see masked personal data
      expect(filteredData.personalEmail).toBe('st***@gmail.com');
      expect(filteredData.phoneNumber).toBe('987****210');
    });

    test('should get correct field metadata', () => {
      const metadata = FieldLevelPermissions.getFieldMetadata(
        { ...fieldContext, resource: 'user' },
        'displayName'
      );

      expect(metadata.canView).toBe(true);
      expect(metadata.canEdit).toBe(false); // Faculty can't edit user display names
      expect(metadata.isSensitive).toBe(false);
    });
  });

  describe('Comprehensive Audit Logging', () => {
    test('should log admin actions with change tracking', async () => {
      const oldData = { name: 'Old Timetable', status: 'draft' };
      const newData = { name: 'New Timetable', status: 'published' };
      
      await ComprehensiveAuditLogger.logAdminAction(auditContext, {
        action: 'UPDATE_TIMETABLE',
        resource: 'timetable',
        resourceId: 'timetable123',
        oldData,
        newData,
        changes: {
          name: { from: 'Old Timetable', to: 'New Timetable' },
          status: { from: 'draft', to: 'published' }
        },
        reason: 'Semester schedule finalized'
      });

      // Verify audit logging was called
      const { auditLogger } = require('@/lib/audit/audit-logger');
      expect(auditLogger.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          action: 'UPDATE_TIMETABLE',
          resource: 'timetable',
          status: 'success'
        })
      );
    });

    test('should log failed admin actions', async () => {
      await ComprehensiveAuditLogger.logFailedAdminAction(auditContext, {
        action: 'DELETE_TIMETABLE',
        resource: 'timetable',
        resourceId: 'timetable123',
        error: 'Permission denied: Cannot delete published timetable'
      });

      const { auditLogger } = require('@/lib/audit/audit-logger');
      expect(auditLogger.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE_TIMETABLE_FAILED',
          status: 'failed',
          details: expect.objectContaining({
            error: 'Permission denied: Cannot delete published timetable'
          })
        })
      );
    });

    test('should log data access events', async () => {
      await ComprehensiveAuditLogger.logDataAccess(
        auditContext,
        'student',
        'student123',
        'export',
        { department: 'CS', semester: 5 }
      );

      const { auditLogger } = require('@/lib/audit/audit-logger');
      expect(auditLogger.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DATA_EXPORT',
          resource: 'student',
          details: expect.objectContaining({
            accessType: 'export',
            filters: { department: 'CS', semester: 5 }
          })
        })
      );
    });

    test('should log permission checks', async () => {
      await ComprehensiveAuditLogger.logPermissionCheck(
        auditContext,
        'timetable',
        'delete',
        'denied',
        'Insufficient role privileges'
      );

      const { auditLogger } = require('@/lib/audit/audit-logger');
      expect(auditLogger.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PERMISSION_DENIED',
          status: 'failed',
          details: expect.objectContaining({
            operation: 'delete',
            reason: 'Insufficient role privileges'
          })
        })
      );
    });

    test('should log bulk operations', async () => {
      await ComprehensiveAuditLogger.logBulkOperation(
        auditContext,
        'import',
        'student',
        100,
        95,
        5,
        ['Invalid enrollment number', 'Duplicate email']
      );

      const { auditLogger } = require('@/lib/audit/audit-logger');
      expect(auditLogger.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'BULK_IMPORT',
          status: 'partial_failure',
          details: expect.objectContaining({
            itemCount: 100,
            successCount: 95,
            failureCount: 5
          })
        })
      );
    });

    test('should log system configuration changes', async () => {
      await ComprehensiveAuditLogger.logSystemConfigChange(
        auditContext,
        'max_login_attempts',
        5,
        3,
        'Increased security requirements'
      );

      const { auditLogger } = require('@/lib/audit/audit-logger');
      expect(auditLogger.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SYSTEM_CONFIG_CHANGE',
          resource: 'system_config',
          details: expect.objectContaining({
            configKey: 'max_login_attempts',
            oldValue: 5,
            newValue: 3,
            riskLevel: 'high'
          })
        })
      );
    });
  });

  describe('Authentication Service Integration', () => {
    beforeEach(() => {
      jest.clearAllMocks(); // Clear all mocks before each test
      const { UserModel } = require('@/lib/models');
      
      // Mock user creation
      UserModel.create.mockResolvedValue({
        _id: 'user123',
        id: 'user123',
        toJSON: () => ({
          id: 'user123',
          email: 'newuser@example.com',
          displayName: 'New User',
          currentRole: 'student',
          roles: ['student'],
          isActive: true
        })
      });

      // Mock user lookup - default to null for new registrations
      UserModel.findOne.mockImplementation(() => {
        // For registration tests, return null initially (no existing user)
        // For login tests, return user with select method
        return {
          select: (jest.fn() as any).mockResolvedValue({
            _id: 'user123',
            id: 'user123',
            email: 'test@example.com',
            password: '$2b$10$hashedpassword',
            isActive: true,
            currentRole: 'student',
            toJSON: () => ({
              id: 'user123',
              email: 'test@example.com',
              displayName: 'Test User',
              currentRole: 'student',
              roles: ['student'],
              isActive: true
            })
          })
        };
      }) as jest.Mock;
      
      // By default, return null for findOne (no existing user for registration)
      UserModel.findOne.mockResolvedValue(null);

      UserModel.findById.mockResolvedValue({
        _id: 'user123',
        id: 'user123',
        email: 'test@example.com',
        isActive: true,
        currentRole: 'student',
        toJSON: () => ({
          id: 'user123',
          email: 'test@example.com',
          displayName: 'Test User',
          currentRole: 'student',
          roles: ['student'],
          isActive: true
        })
      });

      UserModel.findByIdAndUpdate.mockResolvedValue(undefined);
    });

    test('should register new user with proper RBAC setup', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User',
        roles: ['student'],
        currentRole: 'student'
      };

      const user = await AuthService.register(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe('newuser@example.com');
      expect(user.currentRole).toBe('student');
      expect(user.roles).toContain('student');
    });

    test('should handle user registration with validation', async () => {
      const { UserModel } = require('@/lib/models');
      // Override the mock to return existing user for this specific test
      UserModel.findOne.mockImplementationOnce(() => Promise.resolve(mockUser));

      await expect(AuthService.register({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      })).rejects.toThrow('Email already registered');
    });

    test('should authenticate user and generate JWT token', async () => {
      const { UserModel } = require('@/lib/models');
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      // Mock for login - need to return an object with select method  
      (UserModel.findOne as jest.Mock).mockImplementation(() => ({
        select: (jest.fn() as any).mockResolvedValue({
          _id: 'user123',
          id: 'user123',
          email: 'test@example.com',
          password: '$2b$10$hashedpassword',
          isActive: true,
          currentRole: 'student',
          toJSON: () => ({
            id: 'user123',
            email: 'test@example.com',
            displayName: 'Test User',
            currentRole: 'student',
            roles: ['student'],
            isActive: true
          })
        })
      }));

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    test('should verify JWT token and return user', async () => {
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue({
        userId: 'user123',
        email: 'test@example.com',
        role: 'student'
      });

      const user = await AuthService.verifyToken('valid.jwt.token');

      expect(user.id).toBe('user123');
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('End-to-End RBAC Scenarios', () => {
    test('should handle complete timetable management workflow', async () => {
      // 1. Student tries to create timetable (should fail)
      const studentContext = { ...timetableContext, userRole: 'student' as UserRole };
      const studentPermissions = TimetableRBACEngine.getTimetablePermissions(studentContext);
      expect(studentPermissions.canCreate).toBe(false);

      // 2. HOD creates timetable (should succeed)
      const hodContext = { ...timetableContext, userRole: 'hod' as UserRole };
      const hodPermissions = TimetableRBACEngine.getTimetablePermissions(hodContext);
      expect(hodPermissions.canCreate).toBe(true);

      // 3. Faculty views timetable with filtered data
      const timetableData = {
        id: 'timetable123',
        name: 'CS Semester 5',
        entries: [{ facultyId: 'faculty123', courseId: 'course123' }],
        createdBy: 'hod456'
      };
      
      const facultyFiltered = TimetableRBACEngine.filterTimetableData(timetableContext, timetableData);
      expect(facultyFiltered.entries[0].facultyId).toBeDefined(); // Faculty can see assignments
      expect(facultyFiltered.createdBy).toBeUndefined(); // But not metadata

      // 4. Student views timetable with more restrictive filtering
      const studentFiltered = TimetableRBACEngine.filterTimetableData(studentContext, timetableData);
      expect(studentFiltered.createdBy).toBeUndefined(); // Student can't see metadata
    });

    test('should handle field-level permissions across multiple resources', async () => {
      // Test user management with different roles
      const userData = {
        id: 'user123',
        email: 'user@example.com',
        displayName: 'User Name',
        roles: ['student'],
        phoneNumber: '1234567890'
      };

      // Admin can see everything
      const adminContext = { ...fieldContext, userRole: 'admin' as UserRole, resource: 'user' };
      const adminFiltered = await FieldLevelPermissions.filterObjectData(adminContext, userData);
      expect(Object.keys(adminFiltered)).toHaveLength(5); // All fields visible

      // Faculty has limited access
      const facultyFiltered = await FieldLevelPermissions.filterObjectData(
        { ...fieldContext, resource: 'user' },
        userData
      );
      expect(facultyFiltered.email).toBeUndefined(); // Sensitive field filtered
      expect(facultyFiltered.roles).toBeUndefined(); // Sensitive field filtered
      expect(facultyFiltered.displayName).toBeDefined(); // Public field visible
    });

    test('should maintain audit trail throughout RBAC operations', async () => {
      const { auditLogger } = require('@/lib/audit/audit-logger');

      // 1. Check permissions (logs permission check)
      await TimetableRBACEngine.canPerformOperation(timetableContext, 'canEdit');
      expect(auditLogger.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PERMISSION_CHECK' })
      );

      // 2. Check field permissions (logs field access)
      await FieldLevelPermissions.canAccessField(fieldContext, 'name');
      expect(auditLogger.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PERMISSION_GRANTED' })
      );

      // 3. Perform admin action (logs action with changes)
      await ComprehensiveAuditLogger.logAdminAction(auditContext, {
        action: 'UPDATE_TIMETABLE',
        resource: 'timetable',
        resourceId: 'timetable123'
      });
      expect(auditLogger.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE_TIMETABLE' })
      );

      // Verify multiple audit calls were made
      // Note: There might be additional audit calls from the internal field permission checks
      expect(auditLogger.logAction).toHaveBeenCalledTimes(4);
    });
  });
});