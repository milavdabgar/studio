import { committeePermissions } from '@/lib/api/roles';

export interface Permission {
  code: string;
  name: string;
  description: string;
  category: string;
}

export interface PermissionCategory {
  name: string;
  description: string;
  permissions: Permission[];
}

// Enhanced permission definitions with descriptions and categories
export const permissionDefinitions: Record<string, Permission> = {
  // Core System Permissions
  manage_users: {
    code: 'manage_users',
    name: 'Manage Users',
    description: 'Create, update, and delete user accounts',
    category: 'system'
  },
  manage_roles: {
    code: 'manage_roles',
    name: 'Manage Roles',
    description: 'Create and modify user roles and permissions',
    category: 'system'
  },
  manage_settings: {
    code: 'manage_settings',
    name: 'Manage Settings',
    description: 'Configure system-wide settings',
    category: 'system'
  },
  view_courses: {
    code: 'view_courses',
    name: 'View Courses',
    description: 'Access course information and listings',
    category: 'academic'
  },
  submit_assignments: {
    code: 'submit_assignments',
    name: 'Submit Assignments',
    description: 'Submit assignments and coursework',
    category: 'academic'
  },
  manage_courses: {
    code: 'manage_courses',
    name: 'Manage Courses',
    description: 'Create, update, and manage course content',
    category: 'academic'
  },
  grade_assignments: {
    code: 'grade_assignments',
    name: 'Grade Assignments',
    description: 'Evaluate and grade student submissions',
    category: 'academic'
  },
  manage_faculty: {
    code: 'manage_faculty',
    name: 'Manage Faculty',
    description: 'Manage faculty profiles and assignments',
    category: 'academic'
  },
  view_department_reports: {
    code: 'view_department_reports',
    name: 'View Department Reports',
    description: 'Access departmental analytics and reports',
    category: 'reporting'
  },
  evaluate_projects: {
    code: 'evaluate_projects',
    name: 'Evaluate Projects',
    description: 'Review and evaluate student projects',
    category: 'academic'
  },
  view_feedback: {
    code: 'view_feedback',
    name: 'View Feedback',
    description: 'Access feedback and evaluation data',
    category: 'reporting'
  },
  generate_reports: {
    code: 'generate_reports',
    name: 'Generate Reports',
    description: 'Create and export system reports',
    category: 'reporting'
  },
  manage_institutes: {
    code: 'manage_institutes',
    name: 'Manage Institutes',
    description: 'Manage institute-wide configurations',
    category: 'administration'
  },
  manage_buildings: {
    code: 'manage_buildings',
    name: 'Manage Buildings',
    description: 'Manage building and facility information',
    category: 'administration'
  },
  manage_rooms: {
    code: 'manage_rooms',
    name: 'Manage Rooms',
    description: 'Manage room allocations and bookings',
    category: 'administration'
  },
  manage_departments: {
    code: 'manage_departments',
    name: 'Manage Departments',
    description: 'Configure department settings and structure',
    category: 'administration'
  },
  manage_programs: {
    code: 'manage_programs',
    name: 'Manage Programs',
    description: 'Manage academic programs and curricula',
    category: 'academic'
  },

  // TPO Committee Permissions
  placement_management: {
    code: 'placement_management',
    name: 'Placement Management',
    description: 'Oversee placement activities and processes',
    category: 'tpo'
  },
  company_coordination: {
    code: 'company_coordination',
    name: 'Company Coordination',
    description: 'Manage relationships with recruiting companies',
    category: 'tpo'
  },
  placement_analytics: {
    code: 'placement_analytics',
    name: 'Placement Analytics',
    description: 'Access placement statistics and analytics',
    category: 'tpo'
  },
  job_posting_management: {
    code: 'job_posting_management',
    name: 'Job Posting Management',
    description: 'Create and manage job postings',
    category: 'tpo'
  },
  student_placement_tracking: {
    code: 'student_placement_tracking',
    name: 'Student Placement Tracking',
    description: 'Track student placement status and outcomes',
    category: 'tpo'
  },
  career_guidance: {
    code: 'career_guidance',
    name: 'Career Guidance',
    description: 'Provide career counseling and guidance',
    category: 'tpo'
  },
  industry_partnerships: {
    code: 'industry_partnerships',
    name: 'Industry Partnerships',
    description: 'Manage industry collaboration and partnerships',
    category: 'tpo'
  },
  placement_drive_organization: {
    code: 'placement_drive_organization',
    name: 'Placement Drive Organization',
    description: 'Organize and coordinate placement drives',
    category: 'tpo'
  },
  interview_scheduling: {
    code: 'interview_scheduling',
    name: 'Interview Scheduling',
    description: 'Schedule and manage interview processes',
    category: 'tpo'
  },

  // SSIP Committee Permissions
  innovation_management: {
    code: 'innovation_management',
    name: 'Innovation Management',
    description: 'Oversee innovation projects and initiatives',
    category: 'ssip'
  },
  funding_approval: {
    code: 'funding_approval',
    name: 'Funding Approval',
    description: 'Approve funding for innovation projects',
    category: 'ssip'
  },
  startup_incubation: {
    code: 'startup_incubation',
    name: 'Startup Incubation',
    description: 'Support startup development and incubation',
    category: 'ssip'
  },
  patent_management: {
    code: 'patent_management',
    name: 'Patent Management',
    description: 'Manage intellectual property and patents',
    category: 'ssip'
  },
  mentorship_coordination: {
    code: 'mentorship_coordination',
    name: 'Mentorship Coordination',
    description: 'Coordinate mentorship programs',
    category: 'ssip'
  },
  competition_management: {
    code: 'competition_management',
    name: 'Competition Management',
    description: 'Organize innovation competitions and events',
    category: 'ssip'
  },
  innovation_analytics: {
    code: 'innovation_analytics',
    name: 'Innovation Analytics',
    description: 'Access innovation metrics and analytics',
    category: 'ssip'
  },
  funding_tracking: {
    code: 'funding_tracking',
    name: 'Funding Tracking',
    description: 'Track funding allocation and utilization',
    category: 'ssip'
  },
  entrepreneur_guidance: {
    code: 'entrepreneur_guidance',
    name: 'Entrepreneur Guidance',
    description: 'Provide entrepreneurship guidance and support',
    category: 'ssip'
  },

  // Library Committee Permissions
  library_management: {
    code: 'library_management',
    name: 'Library Management',
    description: 'Oversee library operations and policies',
    category: 'library'
  },
  resource_allocation: {
    code: 'resource_allocation',
    name: 'Resource Allocation',
    description: 'Manage library resource allocation',
    category: 'library'
  },
  catalog_management: {
    code: 'catalog_management',
    name: 'Catalog Management',
    description: 'Manage library catalog and metadata',
    category: 'library'
  },
  digital_assets: {
    code: 'digital_assets',
    name: 'Digital Assets',
    description: 'Manage digital resources and e-books',
    category: 'library'
  },
  circulation_control: {
    code: 'circulation_control',
    name: 'Circulation Control',
    description: 'Manage book lending and returns',
    category: 'library'
  },
  user_access_management: {
    code: 'user_access_management',
    name: 'User Access Management',
    description: 'Manage library user accounts and access',
    category: 'library'
  },
  budget_planning: {
    code: 'budget_planning',
    name: 'Budget Planning',
    description: 'Plan and manage library budget',
    category: 'library'
  },
  acquisition_management: {
    code: 'acquisition_management',
    name: 'Acquisition Management',
    description: 'Manage acquisition of new resources',
    category: 'library'
  },
  usage_analytics: {
    code: 'usage_analytics',
    name: 'Usage Analytics',
    description: 'Access library usage statistics',
    category: 'library'
  },

  // IT/CWAN Committee Permissions
  infrastructure_management: {
    code: 'infrastructure_management',
    name: 'Infrastructure Management',
    description: 'Manage IT infrastructure and networks',
    category: 'it_cwan'
  },
  security_oversight: {
    code: 'security_oversight',
    name: 'Security Oversight',
    description: 'Oversee cybersecurity and data protection',
    category: 'it_cwan'
  },
  network_administration: {
    code: 'network_administration',
    name: 'Network Administration',
    description: 'Administer campus network systems',
    category: 'it_cwan'
  },
  system_monitoring: {
    code: 'system_monitoring',
    name: 'System Monitoring',
    description: 'Monitor system performance and health',
    category: 'it_cwan'
  },
  hardware_management: {
    code: 'hardware_management',
    name: 'Hardware Management',
    description: 'Manage hardware inventory and maintenance',
    category: 'it_cwan'
  },
  software_licensing: {
    code: 'software_licensing',
    name: 'Software Licensing',
    description: 'Manage software licenses and compliance',
    category: 'it_cwan'
  },
  backup_management: {
    code: 'backup_management',
    name: 'Backup Management',
    description: 'Manage data backup and recovery',
    category: 'it_cwan'
  },
  technical_support: {
    code: 'technical_support',
    name: 'Technical Support',
    description: 'Provide technical support and assistance',
    category: 'it_cwan'
  }
};

// Permission categories for organized display
export const permissionCategories: Record<string, PermissionCategory> = {
  system: {
    name: 'System Administration',
    description: 'Core system management permissions',
    permissions: Object.values(permissionDefinitions).filter(p => p.category === 'system')
  },
  academic: {
    name: 'Academic Management',
    description: 'Academic and educational permissions',
    permissions: Object.values(permissionDefinitions).filter(p => p.category === 'academic')
  },
  administration: {
    name: 'Administration',
    description: 'General administrative permissions',
    permissions: Object.values(permissionDefinitions).filter(p => p.category === 'administration')
  },
  reporting: {
    name: 'Reporting & Analytics',
    description: 'Data access and reporting permissions',
    permissions: Object.values(permissionDefinitions).filter(p => p.category === 'reporting')
  },
  tpo: {
    name: 'Training & Placement Office',
    description: 'TPO committee-specific permissions',
    permissions: Object.values(permissionDefinitions).filter(p => p.category === 'tpo')
  },
  ssip: {
    name: 'Student Startup & Innovation Policy',
    description: 'SSIP committee-specific permissions',
    permissions: Object.values(permissionDefinitions).filter(p => p.category === 'ssip')
  },
  library: {
    name: 'Library Committee',
    description: 'Library management permissions',
    permissions: Object.values(permissionDefinitions).filter(p => p.category === 'library')
  },
  it_cwan: {
    name: 'IT & Computer Network Administration',
    description: 'IT infrastructure management permissions',
    permissions: Object.values(permissionDefinitions).filter(p => p.category === 'it_cwan')
  }
};

// Utility functions for permission validation
export const permissionUtils = {
  /**
   * Check if a user has a specific permission
   */
  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.includes(requiredPermission);
  },

  /**
   * Check if a user has any of the specified permissions
   */
  hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  },

  /**
   * Check if a user has all of the specified permissions
   */
  hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  },

  /**
   * Get permissions for a specific committee
   */
  getCommitteePermissions(committeeCode: string): string[] {
    const committee = committeePermissions[committeeCode as keyof typeof committeePermissions];
    return committee ? committee.permissions : [];
  },

  /**
   * Validate if permissions are appropriate for a committee role
   */
  validateCommitteePermissions(committeeCode: string, permissions: string[]): {
    valid: boolean;
    validPermissions: string[];
    invalidPermissions: string[];
  } {
    const allowedPermissions = this.getCommitteePermissions(committeeCode);
    const validPermissions = permissions.filter(p => allowedPermissions.includes(p));
    const invalidPermissions = permissions.filter(p => !allowedPermissions.includes(p));

    return {
      valid: invalidPermissions.length === 0,
      validPermissions,
      invalidPermissions
    };
  },

  /**
   * Get permission details by code
   */
  getPermissionDetails(permissionCode: string): Permission | null {
    return permissionDefinitions[permissionCode] || null;
  },

  /**
   * Get permissions grouped by category
   */
  getPermissionsByCategory(categoryCode: string): Permission[] {
    return permissionCategories[categoryCode]?.permissions || [];
  },

  /**
   * Get all available permission codes
   */
  getAllPermissionCodes(): string[] {
    return Object.keys(permissionDefinitions);
  },

  /**
   * Format permission name for display
   */
  formatPermissionName(permissionCode: string): string {
    const permission = this.getPermissionDetails(permissionCode);
    return permission ? permission.name : permissionCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

export default permissionUtils;