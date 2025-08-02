"use client";

import { GeistSans } from 'geist/font/sans';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster";
import { 
    Home, Settings, LogOut, UserCircle, Briefcase, BookOpen, Award, CalendarCheck, UserCog, BookUser, Building2, BookCopy, ClipboardList, Landmark, Building, DoorOpen, Users2 as CommitteeIcon, Users as UsersIconLucide, FileText as AssessmentIcon, CalendarRange, UserCheck as AttendanceIcon, Settings2 as ResourceIcon, Clock, UserPlus, BellRing, BookOpenText, Newspaper, Target, BarChart3, Zap} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { AppLogo } from '@/components/app-logo';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { UserRole as UserRoleCode, Role } from '@/types/entities'; 
import { roleService } from '@/lib/api/roles'; 
import NotificationBell from '@/components/notifications/NotificationBell';

interface User {
  id?: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  dataAiHint?: string;
  activeRole: UserRoleCode; 
  availableRoles: UserRoleCode[]; 
}

const DEFAULT_USER: User = {
  name: 'Guest User',
  activeRole: 'unknown',
  availableRoles: ['unknown'],
  avatarUrl: 'https://picsum.photos/seed/guest/40/40',
  dataAiHint: 'user avatar'
};

const adminNavItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'admin-dashboard-link' },
  
  // Timetable Automation (Workflow Order)
  { href: '/admin/preference-campaigns', icon: Target, label: 'Preference Campaigns', id: 'admin-preference-campaigns-link' },
  { href: '/admin/faculty-preferences', icon: UsersIconLucide, label: 'Faculty Preferences', id: 'admin-faculty-preferences-link' },
  { href: '/admin/course-allocation', icon: BarChart3, label: 'Course Allocation', id: 'admin-course-allocation-link' },
  { href: '/admin/timetables/auto-generate', icon: Zap, label: 'Auto Generate', id: 'admin-auto-generate-link' },
  { href: '/admin/timetables', icon: Clock, label: 'View Timetables', id: 'admin-timetables-link' },
  
  // Academic Management
  { href: '/admin/courses', icon: ClipboardList, label: 'Course Mgt.', id: 'admin-courses-link' },
  { href: '/admin/course-offerings', icon: BookOpen, label: 'Course Offerings', id: 'admin-course-offerings-link' },
  { href: '/admin/curriculum', icon: BookOpenText, label: 'Curriculum Mgt.', id: 'admin-curriculum-link' },
  { href: '/admin/programs', icon: BookCopy, label: 'Programs', id: 'admin-programs-link' },
  { href: '/admin/batches', icon: CalendarRange, label: 'Batches', id: 'admin-batches-link' },
  { href: '/admin/academic-terms', icon: CalendarRange, label: 'Academic Terms', id: 'admin-academic-terms-link' },
  
  // User Management
  { href: '/admin/users', icon: UsersIconLucide, label: 'User Management', id: 'admin-users-link' },
  { href: '/admin/roles', icon: UserCog, label: 'Role Management', id: 'admin-roles-link' },
  { href: '/admin/students', icon: BookUser, label: 'Student Mgt.', id: 'admin-students-link' },
  { href: '/admin/faculty', icon: UserCog, label: 'Staff Mgt.', id: 'admin-faculty-link' }, 
  { href: '/admin/faculty-workload', icon: Briefcase, label: 'Faculty Workload', id: 'admin-faculty-workload-link'},
  
  // Infrastructure
  { href: '/admin/institutes', icon: Landmark, label: 'Institutes', id: 'admin-institutes-link'},
  { href: '/admin/buildings', icon: Building, label: 'Buildings', id: 'admin-buildings-link'},
  { href: '/admin/rooms', icon: DoorOpen, label: 'Rooms', id: 'admin-rooms-link'},
  { href: '/admin/departments', icon: Building2, label: 'Departments', id: 'admin-departments-link' },
  
  // Assessment & Examinations
  { href: '/admin/assessments', icon: AssessmentIcon, label: 'Assessments', id: 'admin-assessments-link' },
  { href: '/admin/examinations', icon: Award, label: 'Examination Mgt.', id: 'admin-examinations-link'},
  { href: '/admin/enrollments', icon: UserPlus, label: 'Enrollment Mgt.', id: 'admin-enrollments-link'},
  
  // System Management
  { href: '/admin/committees', icon: CommitteeIcon, label: 'Committees', id: 'admin-committees-link'},
  { href: '/faculty/attendance/mark', icon: CalendarCheck, label: 'Mark Attendance', id: 'admin-mark-attendance-nav-link' }, 
  { href: '/admin/resource-allocation', icon: ResourceIcon, label: 'Resource Allocation', id: 'admin-resource-allocation-link' },
  { href: '/admin/settings', icon: Settings, label: 'System Settings', id: 'admin-settings-nav-link'},
  { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'admin-blog-link' },
];

const baseNavItems: Record<UserRoleCode, Array<{ href: string; icon: React.ElementType; label: string; id: string }>> = {
  admin: adminNavItems,
  student: [
    { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'student-dashboard-link' },
    { href: '/student/profile', icon: UserCircle, label: 'My Profile', id: 'student-profile-link' },
    { href: '/student/timetable', icon: Clock, label: 'My Timetable', id: 'student-timetable-link' },
    { href: '/student/courses', icon: BookOpen, label: 'My Courses', id: 'student-courses-link' },
    { href: '/student/assessments', icon: AssessmentIcon, label: 'My Assessments', id: 'student-assessments-link' },
    { href: '/student/attendance', icon: AttendanceIcon, label: 'My Attendance', id: 'student-attendance-link' },
    { href: '/student/resources', icon: ResourceIcon, label: 'Resources', id: 'student-resources-link' },
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'student-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'student-blog-link' },
  ],
  faculty: [
    { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'faculty-dashboard-link' },
    { href: '/faculty/profile', icon: UserCircle, label: 'My Profile', id: 'faculty-profile-link' },
    { href: '/faculty/timetable', icon: Clock, label: 'My Timetable', id: 'faculty-timetable-link' },
    { href: '/faculty/courses', icon: BookOpen, label: 'My Courses', id: 'faculty-courses-link' },
    { href: '/faculty/assessments', icon: AssessmentIcon, label: 'My Assessments', id: 'faculty-assessments-link' },
    { href: '/faculty/attendance/mark', icon: AttendanceIcon, label: 'Mark Attendance', id: 'faculty-mark-attendance-link' },
    { href: '/faculty/resources', icon: ResourceIcon, label: 'Resources', id: 'faculty-resources-link' },
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'faculty-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'faculty-blog-link' },
  ],
  // Add other role navItems here...
  unknown: [
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'unknown-blog-link' },
  ],
};

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [allSystemRoles, setAllSystemRoles] = useState<Role[]>([]);
  const router = useRouter();

  const fetchRoles = useCallback(async () => {
    try {
      const roles = await roleService.getAllRoles();
      setAllSystemRoles(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const activeRoleObject = allSystemRoles.find(role => role.code === currentUser.activeRole);

  const handleRoleChange = async (newRole: string) => {
    setCurrentUser(prev => ({
      ...prev,
      activeRole: newRole as UserRoleCode
    }));
    router.refresh();
  };

  return (
    <html lang="en" className={GeistSans.className}>
      <body>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <AppLogo />
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {baseNavItems[currentUser.activeRole]?.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <Link href={item.href} >
                      <SidebarMenuButton>
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-sidebar-border dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                {currentUser.avatarUrl ? (
                  <Image 
                    src={currentUser.avatarUrl} 
                    alt={currentUser.name} 
                    data-ai-hint={currentUser.dataAiHint} 
                    className="h-10 w-10 rounded-full" 
                    width={40}
                    height={40}
                    unoptimized
                  />
                ) : (
                  <UserCircle className="h-10 w-10 rounded-full text-sidebar-foreground" />
                )}
                <div>
                  <p className="font-semibold text-sm text-sidebar-foreground">{currentUser.name}</p>
                  <p className="text-xs text-sidebar-foreground/70 capitalize">
                    Active: {activeRoleObject?.name || currentUser.activeRole}
                  </p>
                </div>
              </div>
              {currentUser.availableRoles.length > 1 && allSystemRoles.length > 0 && (
                <div className="mb-4">
                  <Label htmlFor="role-switcher" className="text-xs text-sidebar-foreground/70 mb-1 block">Switch Role:</Label>
                  <Select value={currentUser.activeRole} onValueChange={handleRoleChange}>
                    <SelectTrigger id="role-switcher" className="w-full bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border focus:ring-sidebar-ring text-xs h-9 dark:border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-sidebar text-sidebar-foreground border-sidebar-border dark:border-gray-700">
                      {currentUser.availableRoles.map(roleCode => { 
                        const roleObj = allSystemRoles.find(sysR => sysR.code === roleCode);
                        return roleObj ? (
                          <SelectItem key={roleObj.id} value={roleObj.code} className="text-xs focus:bg-sidebar-primary focus:text-sidebar-primary-foreground">
                            {roleObj.name}
                          </SelectItem>
                        ) : null;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent" asChild>
              <Link href="/admin/settings">
                <Settings />
              </Link>
            </Button>
                <ThemeToggle />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={() => {
                    if (typeof document !== 'undefined') {
                      document.cookie = 'auth_user=;path=/;max-age=0'; 
                    }
                    setCurrentUser(DEFAULT_USER); 
                    router.push('/login');
                  }}
                >
                  <LogOut />
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm dark:border-gray-700">
              <SidebarTrigger />
              <div className="flex items-center gap-4">
                <NotificationBell />
                <span className="font-semibold text-sm md:text-base">Welcome, {currentUser.name}! (Role: {activeRoleObject?.name || currentUser.activeRole})</span>
              </div>
            </header>
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
