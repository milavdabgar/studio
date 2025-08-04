'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Target, 
  Settings, 
  Calendar, 
  BookOpen, 
  Clock,
  Building,
  UserCheck,
  PlusCircle,
  FileText,
  BarChart3,
  Shield,
  Database,
  Award,
  Home,
  GraduationCap,
  TrendingUp,
  UserCog
} from 'lucide-react';
import { getUserCookie, getUserAccessContext, type UserRole } from '@/lib/auth/role-access';

interface NavigationItem {
  href: string;
  label: string;
  icon: any;
  requiredPermission?: keyof ReturnType<typeof getUserAccessContext>['navigationPermissions'] | keyof ReturnType<typeof getUserAccessContext>['featurePermissions'];
  requiredRoles?: string[];
  description?: string;
}

interface NavigationSection {
  section: string;
  items: NavigationItem[];
  requiredRoles?: string[];
}

const getNavigationItems = (): NavigationSection[] => [
  {
    section: 'Dashboard',
    items: [
      { href: '/admin', label: 'Main Dashboard', icon: Home, requiredRoles: ['admin', 'super_admin', 'hod', 'principal'] },
      { href: '/admin/institute-dashboard', label: 'Institute Dashboard', icon: TrendingUp, requiredRoles: ['admin', 'super_admin', 'principal'] },
    ]
  },
  {
    section: 'User Management',
    requiredRoles: ['admin', 'super_admin', 'hod', 'principal'],
    items: [
      { href: '/admin/faculty', label: 'Faculty', icon: GraduationCap, requiredPermission: 'canAccessFaculty' },
      { href: '/admin/students', label: 'Students', icon: Users, requiredPermission: 'canAccessStudents' },
      { href: '/admin/users', label: 'System Users', icon: UserCog, requiredRoles: ['admin', 'super_admin'] },
      { href: '/admin/roles', label: 'Roles', icon: Shield, requiredRoles: ['admin', 'super_admin'] },
      { href: '/admin/role-assignments', label: 'Role Assignments', icon: UserCheck, requiredRoles: ['admin', 'super_admin'] },
    ]
  },
  {
    section: 'Academic Management',
    requiredRoles: ['admin', 'super_admin', 'hod', 'principal'],
    items: [
      { href: '/admin/academic-terms', label: 'Academic Terms', icon: Calendar, requiredPermission: 'canAccessSettings' },
      { href: '/admin/programs', label: 'Programs', icon: FileText, requiredPermission: 'canAccessPrograms' },
      { href: '/admin/courses', label: 'Courses', icon: BookOpen, requiredPermission: 'canAccessCourses' },
      { href: '/admin/curriculum', label: 'Curriculum', icon: BookOpen, requiredPermission: 'canAccessCourses' },
      { href: '/admin/batches', label: 'Batches', icon: Users, requiredPermission: 'canAccessBatches' },
      { href: '/admin/assessments', label: 'Assessments', icon: Award, requiredPermission: 'canAccessCourses' },
      { href: '/admin/results', label: 'Results', icon: BarChart3, requiredRoles: ['admin', 'super_admin', 'hod', 'principal'] },
      { href: '/admin/enrollments', label: 'Enrollments', icon: UserCheck, requiredRoles: ['admin', 'super_admin', 'hod', 'principal'] },
    ]
  },
  {
    section: 'Timetable Management',
    requiredRoles: ['admin', 'super_admin', 'hod', 'principal'],
    items: [
      { href: '/admin/preference-campaigns', label: 'Preference Campaigns', icon: Target, requiredPermission: 'canAccessTimetables' },
      { href: '/admin/faculty-preferences', label: 'Faculty Preferences', icon: Users, requiredPermission: 'canAccessTimetables' },
      { href: '/admin/course-allocation', label: 'Course Allocation', icon: BarChart3, requiredPermission: 'canAccessTimetables' },
      { href: '/admin/timetables/auto-generate', label: 'Auto Generate', icon: Settings, requiredPermission: 'canAccessTimetables' },
      { href: '/admin/timetables', label: 'View Timetables', icon: Clock, requiredPermission: 'canAccessTimetables' },
      { href: '/admin/course-offerings', label: 'Course Offerings', icon: BookOpen, requiredPermission: 'canAccessCourses' },
    ]
  },
  {
    section: 'Infrastructure',
    requiredRoles: ['admin', 'super_admin', 'hod', 'principal'],
    items: [
      { href: '/admin/institutes', label: 'Institutes', icon: Building, requiredPermission: 'canAccessInstitutes' },
      { href: '/admin/departments', label: 'Departments', icon: Building, requiredRoles: ['admin', 'super_admin', 'hod', 'principal'] },
      { href: '/admin/buildings', label: 'Buildings', icon: Building, requiredPermission: 'canAccessSettings' },
      { href: '/admin/rooms', label: 'Rooms', icon: Building, requiredPermission: 'canAccessRooms' },
      { href: '/admin/rooms/utilization', label: 'Room Utilization', icon: BarChart3, requiredPermission: 'canAccessAnalytics' },
    ]
  },
  {
    section: 'System Administration',
    requiredRoles: ['admin', 'super_admin'],
    items: [
      { href: '/admin/settings', label: 'System Settings', icon: Settings, requiredPermission: 'canAccessSettings' },
      { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText, requiredRoles: ['admin', 'super_admin'] },
      { href: '/admin/monitoring/performance', label: 'Performance Monitor', icon: TrendingUp, requiredRoles: ['admin', 'super_admin'] },
    ]
  },
  {
    section: 'Committees',
    requiredRoles: ['admin', 'super_admin', 'hod', 'principal', 'tpo_convener', 'ssip_convener', 'library_convener', 'it_convener'],
    items: [
      { href: '/admin/committees', label: 'All Committees', icon: UserCheck, requiredPermission: 'canAccessCommittees' },
      { href: '/admin/committees/tpo', label: 'TPO Committee', icon: Target, requiredPermission: 'canAccessCommittees' },
      { href: '/admin/committees/ssip', label: 'SSIP Committee', icon: Target, requiredPermission: 'canAccessCommittees' },
      { href: '/admin/committees/library', label: 'Library Committee', icon: BookOpen, requiredPermission: 'canAccessCommittees' },
      { href: '/admin/committees/it-cwan', label: 'IT/CWAN Committee', icon: Settings, requiredPermission: 'canAccessCommittees' },
    ]
  },
  {
    section: 'Project Fair',
    requiredRoles: ['admin', 'super_admin', 'hod', 'principal', 'faculty'],
    items: [
      { href: '/admin/project-fair/events', label: 'Project Events', icon: Award, requiredRoles: ['admin', 'super_admin', 'hod', 'principal'] },
    ]
  },
  {
    section: 'Reports & Analytics',
    requiredRoles: ['admin', 'super_admin', 'hod', 'principal'],
    items: [
      { href: '/admin/reporting-analytics', label: 'Advanced Reports', icon: BarChart3, requiredPermission: 'canAccessAnalytics' },
      { href: '/admin/timetable/analytics', label: 'Timetable Analytics', icon: Clock, requiredPermission: 'canAccessAnalytics' },
      { href: '/admin/feedback-analysis', label: 'Feedback Analysis', icon: TrendingUp, requiredPermission: 'canAccessReports' },
    ]
  }
];

export default function AdminNavigation() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUserCookie();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  if (isLoading || !user) {
    return (
      <Card className="sticky top-4">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const validUser = user as UserRole;
  const accessContext = getUserAccessContext(validUser);
  const navigationItems = getNavigationItems();

  // Helper function to check if user has access to an item
  const hasAccess = (item: NavigationItem): boolean => {
    // Check role-based access
    if (item.requiredRoles && !item.requiredRoles.includes(validUser.activeRole)) {
      return false;
    }

    // Check permission-based access
    if (item.requiredPermission) {
      const permission = item.requiredPermission;
      if (permission in accessContext.navigationPermissions) {
        return accessContext.navigationPermissions[permission as keyof typeof accessContext.navigationPermissions];
      }
      if (permission in accessContext.featurePermissions) {
        return accessContext.featurePermissions[permission as keyof typeof accessContext.featurePermissions];
      }
      return false;
    }

    return true;
  };

  // Helper function to check if user has access to a section
  const hasSectionAccess = (section: NavigationSection): boolean => {
    if (section.requiredRoles && !section.requiredRoles.includes(validUser.activeRole)) {
      return false;
    }
    return section.items.some(item => hasAccess(item));
  };

  // Filter navigation sections and items based on permissions
  const filteredSections = navigationItems
    .filter(section => hasSectionAccess(section))
    .map(section => ({
      ...section,
      items: section.items.filter(item => hasAccess(item))
    }))
    .filter(section => section.items.length > 0);

  return (
    <Card className="sticky top-4">
      <CardContent className="p-4">
        <div className="space-y-6">
          {filteredSections.map((section) => (
            <div key={section.section}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                {section.section}
                {section.items.length > 0 && (
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">
                    {section.items.length}
                  </span>
                )}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className="w-full justify-start h-9 text-sm"
                        title={item.description}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          
          {filteredSections.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">No accessible admin functions</p>
              <p className="text-xs">Contact administrator for access</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}