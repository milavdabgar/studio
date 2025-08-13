"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { UserRole as UserRoleCode, Role } from '@/types/entities';
import { permissionUtils } from '@/lib/utils/permissions';

interface NavigationItem {
  href: string;
  icon: React.ElementType;
  label: string;
  id: string;
  permissions?: string[];
  subItems?: NavigationItem[];
  badge?: string;
  isNew?: boolean;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

interface NavigationContextType {
  currentNavigation: NavigationGroup[];
  breadcrumbs: { label: string; href?: string }[];
  activeRole: UserRoleCode;
  availableRoles: UserRoleCode[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canAccessRoute: (route: string) => boolean;
  getNavigationForRole: (role: UserRoleCode) => NavigationGroup[];
  updateNavigationBadge: (itemId: string, badge?: string) => void;
  markNavigationItemAsNew: (itemId: string, isNew?: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
  currentUser: {
    activeRole: UserRoleCode;
    availableRoles: UserRoleCode[];
    permissions?: string[];
  };
  allSystemRoles: Role[];
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  currentUser,
  allSystemRoles
}) => {
  const [navigationBadges, setNavigationBadges] = useState<Record<string, string>>({});
  const [newNavigationItems, setNewNavigationItems] = useState<Record<string, boolean>>({});
  const [breadcrumbs, setBreadcrumbs] = useState<{ label: string; href?: string }[]>([]);
  
  const router = useRouter();
  const pathname = usePathname();

  // Get current role permissions
  const activeRoleObject = allSystemRoles.find(r => r.code === currentUser.activeRole);
  const userPermissions = activeRoleObject?.permissions || [];

  // Permission checking functions
  const hasPermission = useCallback((permission: string): boolean => {
    return permissionUtils.hasPermission(userPermissions, permission);
  }, [userPermissions]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissionUtils.hasAnyPermission(userPermissions, permissions);
  }, [userPermissions]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissionUtils.hasAllPermissions(userPermissions, permissions);
  }, [userPermissions]);

  // Route access control
  const canAccessRoute = useCallback((route: string): boolean => {
    // Define route permission mappings
    const routePermissions: Record<string, string[]> = {
      '/admin/users': ['manage_users'],
      '/admin/roles': ['manage_roles'],
      '/admin/settings': ['manage_settings'],
      '/admin/institutes': ['manage_institutes'],
      '/admin/departments': ['manage_departments'],
      '/admin/programs': ['manage_programs'],
      '/admin/courses': ['manage_courses'],
      '/admin/faculty': ['manage_faculty'],
      '/admin/students': ['manage_users'],
      '/admin/assessments': ['grade_assignments'],
      '/admin/results': ['view_feedback', 'generate_reports'],
      '/admin/committees': ['manage_roles'],
      '/admin/buildings': ['manage_buildings'],
      '/admin/rooms': ['manage_rooms'],
      '/admin/reporting-analytics': ['generate_reports'],
      '/admin/feedback-analysis': ['view_feedback'],
      
      // Committee-specific routes
      '/committees/tpo': ['placement_management'],
      '/committees/ssip': ['innovation_management'],
      '/committees/library': ['library_management'],
      '/committees/it-cwan': ['infrastructure_management'],
      
      // Faculty routes
      '/faculty/attendance/mark': ['grade_assignments'],
      '/faculty/assessments/grade': ['grade_assignments'],
      
      // Student routes (usually open to students)
      '/student': ['submit_assignments'],
    };

    const requiredPermissions = routePermissions[route];
    if (!requiredPermissions) {
      return true; // No specific permissions required
    }

    return hasAnyPermission(requiredPermissions);
  }, [hasAnyPermission]);

  // Dynamic navigation based on role and permissions
  const getNavigationForRole = useCallback((role: UserRoleCode): NavigationGroup[] => {
    const roleObject = allSystemRoles.find(r => r.code === role);
    const rolePermissions = roleObject?.permissions || [];

    // Base navigation items based on role
    const navigationGroups: NavigationGroup[] = [];

    // Admin navigation
    if (['admin', 'super_admin'].includes(role)) {
      navigationGroups.push(
        {
          title: 'Dashboard',
          items: [
            { href: '/dashboard', icon: require('lucide-react').Home, label: 'Dashboard', id: 'dashboard' }
          ]
        },
        {
          title: 'User Management',
          collapsible: true,
          defaultOpen: true,
          items: [
            { href: '/admin/users', icon: require('lucide-react').Users, label: 'User Accounts', id: 'users', permissions: ['manage_users'] },
            { href: '/admin/roles', icon: require('lucide-react').UserCog, label: 'Role Management', id: 'roles', permissions: ['manage_roles'] },
            { href: '/admin/role-assignments', icon: require('lucide-react').Shield, label: 'Role Assignments', id: 'role-assignments', permissions: ['manage_roles'], isNew: true },
            { href: '/admin/faculty', icon: require('lucide-react').UserCog, label: 'Faculty Management', id: 'faculty', permissions: ['manage_faculty'] },
            { href: '/admin/students', icon: require('lucide-react').BookUser, label: 'Student Management', id: 'students', permissions: ['manage_users'] }
          ].filter(item => !item.permissions || hasAnyPermission(item.permissions))
        },
        {
          title: 'Academic Structure',
          collapsible: true,
          items: [
            { href: '/admin/institutes', icon: require('lucide-react').Landmark, label: 'Institutes', id: 'institutes', permissions: ['manage_institutes'] },
            { href: '/admin/departments', icon: require('lucide-react').Building2, label: 'Departments', id: 'departments', permissions: ['manage_departments'] },
            { href: '/admin/programs', icon: require('lucide-react').BookCopy, label: 'Programs', id: 'programs', permissions: ['manage_programs'] },
            { href: '/admin/courses', icon: require('lucide-react').ClipboardList, label: 'Course Management', id: 'courses', permissions: ['manage_courses'] }
          ].filter(item => !item.permissions || hasAnyPermission(item.permissions))
        },
        {
          title: 'Committee Management',
          collapsible: true,
          items: [
            { href: '/admin/committees', icon: require('lucide-react').Users2, label: 'Committees', id: 'committees', permissions: ['manage_roles'] }
          ].filter(item => !item.permissions || hasAnyPermission(item.permissions))
        }
      );
    }

    // Committee-specific navigation
    if (roleObject?.isCommitteeRole) {
      const committeeType = roleObject.committeeCode?.toLowerCase();
      
      navigationGroups.push(
        {
          title: 'Committee Dashboard',
          items: [
            { href: '/committees/dashboard', icon: require('lucide-react').Home, label: 'Committee Dashboard', id: 'committee-dashboard' }
          ]
        }
      );

      // Add committee-specific navigation
      if (committeeType) {
        const committeeSpecificItems: NavigationItem[] = [];

        switch (committeeType) {
          case 'tpo':
            committeeSpecificItems.push(
              { href: '/committees/tpo', icon: require('lucide-react').Briefcase, label: 'TPO Dashboard', id: 'tpo-dashboard' },
              { href: '/committees/tpo/placements', icon: require('lucide-react').Building, label: 'Placement Drives', id: 'placements', permissions: ['placement_management'] },
              { href: '/committees/tpo/companies', icon: require('lucide-react').Building2, label: 'Company Management', id: 'companies', permissions: ['company_coordination'] },
              { href: '/committees/tpo/students', icon: require('lucide-react').Users, label: 'Student Placement', id: 'student-placement', permissions: ['student_placement_tracking'] },
              { href: '/committees/tpo/analytics', icon: require('lucide-react').BarChart3, label: 'Placement Analytics', id: 'placement-analytics', permissions: ['placement_analytics'] }
            );
            break;

          case 'ssip':
            committeeSpecificItems.push(
              { href: '/committees/ssip', icon: require('lucide-react').Lightbulb, label: 'SSIP Dashboard', id: 'ssip-dashboard' },
              { href: '/committees/ssip/projects', icon: require('lucide-react').Rocket, label: 'Innovation Projects', id: 'innovation-projects', permissions: ['innovation_management'] },
              { href: '/committees/ssip/funding', icon: require('lucide-react').DollarSign, label: 'Funding Management', id: 'funding', permissions: ['funding_approval'] },
              { href: '/committees/ssip/startups', icon: require('lucide-react').TrendingUp, label: 'Startup Incubation', id: 'startups', permissions: ['startup_incubation'] },
              { href: '/committees/ssip/competitions', icon: require('lucide-react').Trophy, label: 'Competitions', id: 'competitions', permissions: ['competition_management'] }
            );
            break;

          case 'library':
            committeeSpecificItems.push(
              { href: '/committees/library', icon: require('lucide-react').Book, label: 'Library Dashboard', id: 'library-dashboard' },
              { href: '/committees/library/catalog', icon: require('lucide-react').Database, label: 'Catalog Management', id: 'catalog', permissions: ['catalog_management'] },
              { href: '/committees/library/resources', icon: require('lucide-react').FileText, label: 'Resource Allocation', id: 'library-resources', permissions: ['resource_allocation'] },
              { href: '/committees/library/circulation', icon: require('lucide-react').RefreshCw, label: 'Circulation Control', id: 'circulation', permissions: ['circulation_control'] },
              { href: '/committees/library/analytics', icon: require('lucide-react').BarChart3, label: 'Usage Analytics', id: 'library-analytics', permissions: ['usage_analytics'] }
            );
            break;

          case 'it_cwan':
            committeeSpecificItems.push(
              { href: '/committees/it-cwan', icon: require('lucide-react').Server, label: 'IT/CWAN Dashboard', id: 'it-cwan-dashboard' },
              { href: '/committees/it-cwan/infrastructure', icon: require('lucide-react').HardDrive, label: 'Infrastructure', id: 'infrastructure', permissions: ['infrastructure_management'] },
              { href: '/committees/it-cwan/security', icon: require('lucide-react').Shield, label: 'Security Oversight', id: 'security', permissions: ['security_oversight'] },
              { href: '/committees/it-cwan/network', icon: require('lucide-react').Wifi, label: 'Network Admin', id: 'network', permissions: ['network_administration'] },
              { href: '/committees/it-cwan/support', icon: require('lucide-react').HelpCircle, label: 'Technical Support', id: 'support', permissions: ['technical_support'] }
            );
            break;
        }

        if (committeeSpecificItems.length > 0) {
          navigationGroups.push({
            title: `${roleObject.name} Management`,
            collapsible: true,
            defaultOpen: true,
            items: committeeSpecificItems.filter(item => !item.permissions || hasAnyPermission(item.permissions))
          });
        }
      }
    }

    // Faculty navigation
    if (role === 'faculty') {
      navigationGroups.push(
        {
          title: 'Faculty Dashboard',
          items: [
            { href: '/dashboard', icon: require('lucide-react').Home, label: 'Dashboard', id: 'faculty-dashboard' }
          ]
        },
        {
          title: 'Teaching',
          collapsible: true,
          defaultOpen: true,
          items: [
            { href: '/faculty/my-courses', icon: require('lucide-react').BookOpen, label: 'My Courses', id: 'my-courses' },
            { href: '/faculty/timetable', icon: require('lucide-react').Clock, label: 'My Timetable', id: 'my-timetable' },
            { href: '/faculty/attendance/mark', icon: require('lucide-react').CalendarCheck, label: 'Mark Attendance', id: 'mark-attendance', permissions: ['grade_assignments'] },
            { href: '/faculty/assessments/grade', icon: require('lucide-react').FileText, label: 'Grade Assessments', id: 'grade-assessments', permissions: ['grade_assignments'] }
          ].filter(item => !item.permissions || hasAnyPermission(item.permissions))
        }
      );
    }

    // Student navigation
    if (role === 'student') {
      navigationGroups.push(
        {
          title: 'Student Dashboard',
          items: [
            { href: '/dashboard', icon: require('lucide-react').Home, label: 'Dashboard', id: 'student-dashboard' }
          ]
        },
        {
          title: 'Academics',
          collapsible: true,
          defaultOpen: true,
          items: [
            { href: '/student/courses', icon: require('lucide-react').BookOpen, label: 'My Courses', id: 'student-courses' },
            { href: '/student/timetable', icon: require('lucide-react').Clock, label: 'My Timetable', id: 'student-timetable' },
            { href: '/student/attendance', icon: require('lucide-react').Calendar, label: 'My Attendance', id: 'student-attendance' },
            { href: '/student/assignments', icon: require('lucide-react').FileText, label: 'Assignments', id: 'assignments' },
            { href: '/student/results', icon: require('lucide-react').Award, label: 'My Results', id: 'student-results' }
          ]
        }
      );
    }

    // Filter out empty groups
    return navigationGroups.filter(group => group.items.length > 0);
  }, [allSystemRoles, hasAnyPermission]);

  // Update breadcrumbs based on current path
  useEffect(() => {
    const pathSegments = pathname?.split('/').filter(Boolean) || [];
    const newBreadcrumbs: { label: string; href?: string }[] = [
      { label: 'Home', href: '/dashboard' }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Convert segment to readable label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      newBreadcrumbs.push({
        label,
        href: index === pathSegments.length - 1 ? undefined : currentPath
      });
    });

    setBreadcrumbs(newBreadcrumbs);
  }, [pathname]);

  // Navigation state management functions
  const updateNavigationBadge = useCallback((itemId: string, badge?: string) => {
    setNavigationBadges(prev => {
      if (badge) {
        return { ...prev, [itemId]: badge };
      } else {
        const { [itemId]: removed, ...rest } = prev;
        return rest;
      }
    });
  }, []);

  const markNavigationItemAsNew = useCallback((itemId: string, isNew = true) => {
    setNewNavigationItems(prev => {
      if (isNew) {
        return { ...prev, [itemId]: true };
      } else {
        const { [itemId]: removed, ...rest } = prev;
        return rest;
      }
    });
  }, []);

  // Get current navigation based on active role
  const currentNavigation = getNavigationForRole(currentUser.activeRole);

  // Apply badges and new markers to navigation items
  const enhancedNavigation = currentNavigation.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      badge: navigationBadges[item.id] || item.badge,
      isNew: newNavigationItems[item.id] || item.isNew
    }))
  }));

  const contextValue: NavigationContextType = {
    currentNavigation: enhancedNavigation,
    breadcrumbs,
    activeRole: currentUser.activeRole,
    availableRoles: currentUser.availableRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    getNavigationForRole,
    updateNavigationBadge,
    markNavigationItemAsNew
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

export default NavigationProvider;