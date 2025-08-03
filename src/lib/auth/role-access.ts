export interface UserRole {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string;
  department?: string;
  departmentId?: string;
}

export interface AccessContext {
  canViewAllDepartments: boolean;
  canEditAllDepartments: boolean;
  departmentFilter?: string;
  allowedDepartments: string[];
  featurePermissions: {
    canImportData: boolean;
    canExportData: boolean;
    canDeleteRecords: boolean;
    canManageRoles: boolean;
    canApproveRequests: boolean;
  };
  navigationPermissions: {
    canAccessFaculty: boolean;
    canAccessStudents: boolean;
    canAccessPrograms: boolean;
    canAccessCourses: boolean;
    canAccessTimetables: boolean;
    canAccessBatches: boolean;
    canAccessRooms: boolean;
    canAccessReports: boolean;
    canAccessSettings: boolean;
    canAccessInstitutes: boolean;
    canAccessAnalytics: boolean;
    canAccessApprovals: boolean;
    canAccessCommittees: boolean;
  };
}

export function getUserAccessContext(user: UserRole | null): AccessContext {
  if (!user) {
    return {
      canViewAllDepartments: false,
      canEditAllDepartments: false,
      allowedDepartments: [],
      featurePermissions: {
        canImportData: false,
        canExportData: false,
        canDeleteRecords: false,
        canManageRoles: false,
        canApproveRequests: false,
      },
      navigationPermissions: {
        canAccessFaculty: false,
        canAccessStudents: false,
        canAccessPrograms: false,
        canAccessCourses: false,
        canAccessTimetables: false,
        canAccessBatches: false,
        canAccessRooms: false,
        canAccessReports: false,
        canAccessSettings: false,
        canAccessInstitutes: false,
        canAccessAnalytics: false,
        canAccessApprovals: false,
        canAccessCommittees: false,
      }
    };
  }

  const isAdmin = user.availableRoles.includes('admin');
  const isHOD = user.availableRoles.includes('hod');
  const isPrincipal = user.availableRoles.includes('principal');
  const isFaculty = user.availableRoles.includes('faculty');
  const isStudent = user.availableRoles.includes('student');

  // Admin has full access
  if (isAdmin) {
    return {
      canViewAllDepartments: true,
      canEditAllDepartments: true,
      allowedDepartments: ['all'],
      featurePermissions: {
        canImportData: true,
        canExportData: true,
        canDeleteRecords: true,
        canManageRoles: true,
        canApproveRequests: true,
      },
      navigationPermissions: {
        canAccessFaculty: true,
        canAccessStudents: true,
        canAccessPrograms: true,
        canAccessCourses: true,
        canAccessTimetables: true,
        canAccessBatches: true,
        canAccessRooms: true,
        canAccessReports: true,
        canAccessSettings: true,
        canAccessInstitutes: true,
        canAccessAnalytics: true,
        canAccessApprovals: true,
        canAccessCommittees: true,
      }
    };
  }

  // Principal has view access to all departments but limited edit
  if (isPrincipal) {
    return {
      canViewAllDepartments: true,
      canEditAllDepartments: false,
      allowedDepartments: ['all'],
      departmentFilter: undefined,
      featurePermissions: {
        canImportData: true,
        canExportData: true,
        canDeleteRecords: false,
        canManageRoles: false,
        canApproveRequests: true,
      },
      navigationPermissions: {
        canAccessFaculty: true,
        canAccessStudents: true,
        canAccessPrograms: true,
        canAccessCourses: true,
        canAccessTimetables: true,
        canAccessBatches: true,
        canAccessRooms: true,
        canAccessReports: true,
        canAccessSettings: false,
        canAccessInstitutes: false,
        canAccessAnalytics: true,
        canAccessApprovals: true,
        canAccessCommittees: true,
      }
    };
  }

  // HOD has department-scoped access
  if (isHOD && user.departmentId) {
    return {
      canViewAllDepartments: false,
      canEditAllDepartments: false,
      allowedDepartments: [user.departmentId],
      departmentFilter: user.departmentId,
      featurePermissions: {
        canImportData: true,
        canExportData: true,
        canDeleteRecords: false,
        canManageRoles: false,
        canApproveRequests: true,
      },
      navigationPermissions: {
        canAccessFaculty: true,
        canAccessStudents: true,
        canAccessPrograms: true,
        canAccessCourses: true,
        canAccessTimetables: true,
        canAccessBatches: true,
        canAccessRooms: true,
        canAccessReports: true,
        canAccessSettings: false,
        canAccessInstitutes: false,
        canAccessAnalytics: true,
        canAccessApprovals: true,
        canAccessCommittees: true,
      }
    };
  }

  // Faculty has limited access
  if (isFaculty && user.departmentId) {
    return {
      canViewAllDepartments: false,
      canEditAllDepartments: false,
      allowedDepartments: [user.departmentId],
      departmentFilter: user.departmentId,
      featurePermissions: {
        canImportData: false,
        canExportData: true,
        canDeleteRecords: false,
        canManageRoles: false,
        canApproveRequests: false,
      },
      navigationPermissions: {
        canAccessFaculty: false,
        canAccessStudents: true,
        canAccessPrograms: false,
        canAccessCourses: true,
        canAccessTimetables: true,
        canAccessBatches: false,
        canAccessRooms: false,
        canAccessReports: false,
        canAccessSettings: false,
        canAccessInstitutes: false,
        canAccessAnalytics: false,
        canAccessApprovals: false,
        canAccessCommittees: false,
      }
    };
  }

  // Student or default: no access
  return {
    canViewAllDepartments: false,
    canEditAllDepartments: false,
    allowedDepartments: user.departmentId ? [user.departmentId] : [],
    departmentFilter: user.departmentId,
    featurePermissions: {
      canImportData: false,
      canExportData: false,
      canDeleteRecords: false,
      canManageRoles: false,
      canApproveRequests: false,
    },
    navigationPermissions: {
      canAccessFaculty: false,
      canAccessStudents: false,
      canAccessPrograms: false,
      canAccessCourses: false,
      canAccessTimetables: false,
      canAccessBatches: false,
      canAccessRooms: false,
      canAccessReports: false,
      canAccessSettings: false,
      canAccessInstitutes: false,
      canAccessAnalytics: false,
      canAccessApprovals: false,
      canAccessCommittees: false,
    }
  };
}

export function getDepartmentMapping(): Record<string, string> {
  return {
    'Computer Engineering': 'dept_cse',
    'Mechanical Engineering': 'dept_mech',
    'Electrical Engineering': 'dept_ee',
    'Civil Engineering': 'dept_civil',
    'Electronics & Communication Engineering': 'dept_ece',
    'Applied Mechanics': 'dept_am',
    'General Department': 'dept_general',
    'Administration': 'dept_admin',
  };
}

export function getDepartmentDisplayName(departmentId: string): string {
  const mapping = getDepartmentMapping();
  const entry = Object.entries(mapping).find(([_, id]) => id === departmentId);
  return entry ? entry[0] : departmentId;
}

export function getUserCookie(): UserRole | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; auth_user=`);
  if (parts.length === 2) {
    const cookiePart = parts.pop();
    if (cookiePart) {
      try {
        const decodedCookie = decodeURIComponent(cookiePart.split(';').shift() || '');
        const user = JSON.parse(decodedCookie) as UserRole;
        
        // Mock department assignment for HODs (in real app, this would come from user profile)
        if (user.availableRoles.includes('hod') && !user.departmentId) {
          user.department = 'Computer Engineering';
          user.departmentId = 'dept_cse';
        }
        
        return user;
      } catch {
        return null;
      }
    }
  }
  return null;
}