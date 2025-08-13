import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { getUserAccessContext, updateUserCookie, getDepartmentDisplayName } from '@/lib/auth/role-access';
import { withAPIRoleAccess, extractAuthUser, hasAPIAccess, type APIAccessContext } from '@/lib/auth/api-middleware';
import type { UserRole as AuthUser } from '@/lib/auth/role-access';
import type { NextRequest } from 'next/server';

// Mock Next.js request/response
const mockRequest = (cookies: Record<string, string> = {}) => ({
  cookies: {
    get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined
  },
  url: 'http://localhost:3000/test'
}) as any;

const mockResponse = () => ({
  json: jest.fn(),
  status: 200
}) as any;

describe('Role-Based Access Control System', () => {
  // Mock user data for different roles
  const mockUsers: Record<string, AuthUser> = {
    admin: {
      email: 'admin@test.com',
      name: 'Test Admin',
      activeRole: 'admin',
      availableRoles: ['admin'],
      departmentId: 'dept_cse',
      id: 'user_admin_1'
    },
    hod: {
      email: 'hod@test.com',
      name: 'Test HOD',
      activeRole: 'hod',
      availableRoles: ['hod', 'faculty'],
      departmentId: 'dept_cse',
      id: 'user_hod_1'
    },
    faculty: {
      email: 'faculty@test.com',
      name: 'Test Faculty',
      activeRole: 'faculty',
      availableRoles: ['faculty'],
      departmentId: 'dept_cse',
      id: 'user_faculty_1'
    },
    student: {
      email: 'student@test.com',
      name: 'Test Student',
      activeRole: 'student',
      availableRoles: ['student'],
      departmentId: 'dept_cse',
      id: 'user_student_1'
    },
    committee_convener: {
      email: 'convener@test.com',
      name: 'Test Convener',
      activeRole: 'committee_convener',
      availableRoles: ['committee_convener', 'faculty'],
      departmentId: 'dept_cse',
      id: 'user_convener_1'
    }
  };

  beforeEach(() => {
    // Clear any existing cookies
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: ''
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Access Context Generation', () => {
    it('should generate correct access context for admin users', () => {
      const context = getUserAccessContext(mockUsers.admin);
      
      expect(context.canViewAllDepartments).toBe(true);
      expect(context.canEditAllDepartments).toBe(true);
      expect(context.departmentFilter).toBeUndefined();
      expect(context.featurePermissions.canDeleteRecords).toBe(true);
      expect(context.featurePermissions.canManageRoles).toBe(true);
      expect(context.featurePermissions.canImportData).toBe(true);
      expect(context.featurePermissions.canExportData).toBe(true);
      expect(context.featurePermissions.canApproveRequests).toBe(true);
    });

    it('should generate correct access context for HOD users', () => {
      const context = getUserAccessContext(mockUsers.hod);
      
      expect(context.canViewAllDepartments).toBe(false);
      expect(context.canEditAllDepartments).toBe(false);
      expect(context.departmentFilter).toBe('dept_cse');
      expect(context.allowedDepartments).toEqual(['dept_cse']);
      expect(context.featurePermissions.canDeleteRecords).toBe(false);
      expect(context.featurePermissions.canManageRoles).toBe(false);
      expect(context.featurePermissions.canImportData).toBe(true);
      expect(context.featurePermissions.canExportData).toBe(true);
    });

    it('should generate correct access context for faculty users', () => {
      const context = getUserAccessContext(mockUsers.faculty);
      
      expect(context.canViewAllDepartments).toBe(false);
      expect(context.canEditAllDepartments).toBe(false);
      expect(context.departmentFilter).toBe('dept_cse');
      expect(context.featurePermissions.canDeleteRecords).toBe(false);
      expect(context.featurePermissions.canManageRoles).toBe(false);
      expect(context.featurePermissions.canImportData).toBe(false);
      expect(context.featurePermissions.canExportData).toBe(true);
    });

    it('should generate correct access context for student users', () => {
      const context = getUserAccessContext(mockUsers.student);
      
      expect(context.canViewAllDepartments).toBe(false);
      expect(context.canEditAllDepartments).toBe(false);
      expect(context.departmentFilter).toBe('dept_cse');
      expect(context.featurePermissions.canDeleteRecords).toBe(false);
      expect(context.featurePermissions.canManageRoles).toBe(false);
      expect(context.featurePermissions.canImportData).toBe(false);
      expect(context.featurePermissions.canExportData).toBe(false);
    });

    it('should handle users without department assignment', () => {
      const userWithoutDept = { ...mockUsers.faculty, departmentId: undefined };
      const context = getUserAccessContext(userWithoutDept);
      
      expect(context.departmentFilter).toBeUndefined();
      expect(context.allowedDepartments).toEqual([]);
    });
  });

  describe('API Authentication and Authorization', () => {
    it('should extract user from valid auth cookie', () => {
      const authCookie = encodeURIComponent(JSON.stringify(mockUsers.admin));
      const request = mockRequest({ auth_user: authCookie });
      
      const extractedUser = extractAuthUser(request);
      
      expect(extractedUser).toEqual({
        email: mockUsers.admin.email,
        name: mockUsers.admin.name,
        activeRole: mockUsers.admin.activeRole,
        availableRoles: mockUsers.admin.availableRoles,
        departmentId: mockUsers.admin.departmentId,
        instituteId: undefined
      });
    });

    it('should return null for missing auth cookie', () => {
      const request = mockRequest({});
      
      const extractedUser = extractAuthUser(request);
      
      expect(extractedUser).toBeNull();
    });

    it('should return null for invalid auth cookie', () => {
      const request = mockRequest({ auth_user: 'invalid-json' });
      
      const extractedUser = extractAuthUser(request);
      
      expect(extractedUser).toBeNull();
    });

    it('should validate API access for authorized roles', () => {
      expect(hasAPIAccess(mockUsers.admin, ['admin', 'hod'])).toBe(true);
      expect(hasAPIAccess(mockUsers.hod, ['admin', 'hod'])).toBe(true);
      expect(hasAPIAccess(mockUsers.faculty, ['admin', 'hod'])).toBe(false);
      expect(hasAPIAccess(mockUsers.student, ['faculty', 'student'])).toBe(true);
    });
  });

  describe('API Middleware Integration', () => {
    it('should allow access for authorized users', async () => {
      const authCookie = encodeURIComponent(JSON.stringify(mockUsers.admin));
      const request = mockRequest({ auth_user: authCookie });
      
      const mockHandler = jest.fn<(request: NextRequest, context: APIAccessContext) => Promise<Response>>().mockResolvedValue(
        new Response(JSON.stringify({ success: true }))
      );
      
      const wrappedHandler = withAPIRoleAccess(mockHandler, ['admin']);
      const response = await wrappedHandler(request);
      
      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = mockRequest({});
      
      const mockHandler = jest.fn<(request: NextRequest, context: APIAccessContext) => Promise<Response>>();
      const wrappedHandler = withAPIRoleAccess(mockHandler, ['admin']);
      const response = await wrappedHandler(request);
      
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      
      const responseData = await response.json();
      expect(responseData.message).toBe('Authentication required');
    });

    it('should return 403 for unauthorized users', async () => {
      const authCookie = encodeURIComponent(JSON.stringify(mockUsers.student));
      const request = mockRequest({ auth_user: authCookie });
      
      const mockHandler = jest.fn<(request: NextRequest, context: APIAccessContext) => Promise<Response>>();
      const wrappedHandler = withAPIRoleAccess(mockHandler, ['admin', 'hod']);
      const response = await wrappedHandler(request);
      
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
      
      const responseData = await response.json();
      expect(responseData.message).toContain('Access denied');
    });

    it('should pass correct context to handler for authorized users', async () => {
      const authCookie = encodeURIComponent(JSON.stringify(mockUsers.hod));
      const request = mockRequest({ auth_user: authCookie });
      
      const mockHandler = jest.fn<(request: NextRequest, context: APIAccessContext) => Promise<Response>>().mockResolvedValue(
        new Response(JSON.stringify({ success: true }))
      );
      
      const wrappedHandler = withAPIRoleAccess(mockHandler, ['hod']);
      await wrappedHandler(request);
      
      expect(mockHandler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          user: expect.objectContaining({
            activeRole: 'hod',
            email: mockUsers.hod.email,
            departmentId: 'dept_cse'
          }),
          canViewAllDepartments: false,
          canEditAllDepartments: false,
          departmentFilter: 'dept_cse',
          featurePermissions: expect.objectContaining({
            canDeleteRecords: false,
            canImportData: true,
            canExportData: true
          })
        })
      );
    });
  });

  describe('Role-Specific Feature Access', () => {
    const testFeatureAccess = (user: AuthUser, expectedFeatures: Record<string, boolean>) => {
      const context = getUserAccessContext(user);
      
      Object.entries(expectedFeatures).forEach(([feature, expected]) => {
        expect(context.featurePermissions[feature as keyof typeof context.featurePermissions])
          .toBe(expected);
      });
    };

    it('should grant appropriate features to admin users', () => {
      testFeatureAccess(mockUsers.admin, {
        canDeleteRecords: true,
        canImportData: true,
        canExportData: true,
        canManageRoles: true,
        canApproveRequests: true
      });
    });

    it('should grant appropriate features to HOD users', () => {
      testFeatureAccess(mockUsers.hod, {
        canDeleteRecords: false,
        canImportData: true,
        canExportData: true,
        canManageRoles: false,
        canApproveRequests: true
      });
    });

    it('should grant appropriate features to faculty users', () => {
      testFeatureAccess(mockUsers.faculty, {
        canDeleteRecords: false,
        canImportData: false,
        canExportData: true,
        canManageRoles: false,
        canApproveRequests: false
      });
    });

    it('should grant appropriate features to student users', () => {
      testFeatureAccess(mockUsers.student, {
        canDeleteRecords: false,
        canImportData: false,
        canExportData: false,
        canManageRoles: false,
        canApproveRequests: false
      });
    });
  });

  describe('Navigation Permissions', () => {
    const testNavigationAccess = (user: AuthUser, expectedAccess: Record<string, boolean>) => {
      const context = getUserAccessContext(user);
      
      Object.entries(expectedAccess).forEach(([navItem, expected]) => {
        expect(context.navigationPermissions[navItem as keyof typeof context.navigationPermissions])
          .toBe(expected);
      });
    };

    it('should grant full navigation access to admin users', () => {
      testNavigationAccess(mockUsers.admin, {
        canAccessFaculty: true,
        canAccessStudents: true,
        canAccessPrograms: true,
        canAccessCourses: true,
        canAccessTimetables: true,
        canAccessBatches: true,
        canAccessRooms: true,
        canAccessReports: true,
        canAccessSettings: true,
        canAccessAnalytics: true
      });
    });

    it('should grant department-scoped navigation to HOD users', () => {
      testNavigationAccess(mockUsers.hod, {
        canAccessFaculty: true,
        canAccessStudents: true,
        canAccessPrograms: true,
        canAccessCourses: true,
        canAccessTimetables: true,
        canAccessBatches: true,
        canAccessRooms: true,
        canAccessReports: true,
        canAccessSettings: false,
        canAccessAnalytics: true
      });
    });

    it('should grant limited navigation to faculty users', () => {
      testNavigationAccess(mockUsers.faculty, {
        canAccessFaculty: false,
        canAccessStudents: true,
        canAccessPrograms: false,
        canAccessCourses: true,
        canAccessTimetables: true,
        canAccessBatches: false,
        canAccessRooms: false,
        canAccessReports: false,
        canAccessSettings: false,
        canAccessAnalytics: false
      });
    });

    it('should deny most navigation to student users', () => {
      testNavigationAccess(mockUsers.student, {
        canAccessFaculty: false,
        canAccessStudents: false,
        canAccessPrograms: false,
        canAccessCourses: false,
        canAccessTimetables: false,
        canAccessBatches: false,
        canAccessRooms: false,
        canAccessReports: false,
        canAccessSettings: false,
        canAccessAnalytics: false
      });
    });
  });

  describe('Department Scoping', () => {
    it('should filter data based on user department for HOD', () => {
      const context = getUserAccessContext(mockUsers.hod);
      
      expect(context.canViewAllDepartments).toBe(false);
      expect(context.departmentFilter).toBe('dept_cse');
      expect(context.allowedDepartments).toEqual(['dept_cse']);
    });

    it('should filter data based on user department for faculty', () => {
      const context = getUserAccessContext(mockUsers.faculty);
      
      expect(context.canViewAllDepartments).toBe(false);
      expect(context.departmentFilter).toBe('dept_cse');
      expect(context.allowedDepartments).toEqual(['dept_cse']);
    });

    it('should allow access to all departments for admin', () => {
      const context = getUserAccessContext(mockUsers.admin);
      
      expect(context.canViewAllDepartments).toBe(true);
      expect(context.canEditAllDepartments).toBe(true);
      expect(context.departmentFilter).toBeUndefined();
      expect(context.allowedDepartments).toEqual(['all']);
    });
  });

  describe('Multi-Role Users', () => {
    it('should use active role for access determination', () => {
      const multiRoleUser: AuthUser = {
        ...mockUsers.hod,
        availableRoles: ['hod', 'faculty', 'committee_convener']
      };
      
      const context = getUserAccessContext(multiRoleUser);
      
      // Should use HOD permissions since activeRole is 'hod'
      expect(context.featurePermissions.canDeleteRecords).toBe(false);
      expect(context.featurePermissions.canManageRoles).toBe(false);
    });

    it('should handle role switching correctly', () => {
      const multiRoleUser: AuthUser = {
        ...mockUsers.hod,
        activeRole: 'faculty',
        availableRoles: ['hod', 'faculty']
      };
      
      const context = getUserAccessContext(multiRoleUser);
      
      // Should use faculty permissions since activeRole is 'faculty'
      expect(context.featurePermissions.canDeleteRecords).toBe(false);
      expect(context.featurePermissions.canImportData).toBe(false);
    });
  });

  describe('Committee Role Access', () => {
    it('should grant appropriate access to committee conveners', () => {
      const context = getUserAccessContext(mockUsers.committee_convener);
      
      expect(context.canViewAllDepartments).toBe(false);
      // Committee roles fall back to default permissions since they're not specifically implemented
      expect(context.featurePermissions.canApproveRequests).toBe(false);
      expect(context.navigationPermissions.canAccessCommittees).toBe(false);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle missing role gracefully', () => {
      const userWithoutRole: AuthUser = {
        ...mockUsers.faculty,
        activeRole: 'unknown' as any,
        availableRoles: []
      };
      
      const context = getUserAccessContext(userWithoutRole);
      
      // Should default to most restrictive permissions
      expect(context.featurePermissions.canDeleteRecords).toBe(false);
      expect(context.featurePermissions.canManageRoles).toBe(false);
      expect(context.canViewAllDepartments).toBe(false);
    });

    it('should handle malformed user data', () => {
      const malformedUser = {
        email: 'test@test.com',
        name: 'Test User'
        // Missing required fields
      } as any;
      
      expect(() => getUserAccessContext(malformedUser)).not.toThrow();
    });

    it('should validate cookie updates', () => {
      const originalCookie = document.cookie;
      
      updateUserCookie(mockUsers.admin);
      
      expect(document.cookie).toContain('auth_user=');
      expect(document.cookie).toContain('path=/');
      expect(document.cookie).toContain('max-age=');
    });
  });

  describe('Department Display Names', () => {
    it('should return correct display names for department IDs', () => {
      expect(getDepartmentDisplayName('dept_cse')).toBe('Computer Engineering');
      expect(getDepartmentDisplayName('dept_mech')).toBe('Mechanical Engineering');
      expect(getDepartmentDisplayName('dept_ee')).toBe('Electrical Engineering');
      expect(getDepartmentDisplayName('invalid_dept')).toBe('invalid_dept');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete user session workflow', async () => {
      // 1. User authenticates
      const authCookie = encodeURIComponent(JSON.stringify(mockUsers.hod));
      const request = mockRequest({ auth_user: authCookie });
      
      // 2. Access API endpoint
      const mockHandler = jest.fn<(request: NextRequest, context: APIAccessContext) => Promise<Response>>().mockImplementation((req: NextRequest, context: APIAccessContext) => {
        // 3. Handler receives correct context
        expect(context.user.activeRole).toBe('hod');
        expect(context.departmentFilter).toBe('dept_cse');
        expect(context.featurePermissions.canDeleteRecords).toBe(false);
        
        return Promise.resolve(new Response(JSON.stringify({ 
          success: true,
          department: context.departmentFilter 
        })));
      });
      
      const wrappedHandler = withAPIRoleAccess(mockHandler, ['hod']);
      const response = await wrappedHandler(request);
      
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should enforce department isolation between users', () => {
      const cseDeptUser = { ...mockUsers.hod, departmentId: 'dept_cse' };
      const mechDeptUser = { ...mockUsers.hod, departmentId: 'dept_mech' };
      
      const cseContext = getUserAccessContext(cseDeptUser);
      const mechContext = getUserAccessContext(mechDeptUser);
      
      expect(cseContext.departmentFilter).toBe('dept_cse');
      expect(mechContext.departmentFilter).toBe('dept_mech');
      expect(cseContext.allowedDepartments).not.toEqual(mechContext.allowedDepartments);
    });
  });
});

export {};