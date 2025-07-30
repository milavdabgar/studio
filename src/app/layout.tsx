
// src/app/layout.tsx
"use client"; 

import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster";
import { 
    Home, Settings, LogOut, UserCircle, BotMessageSquare, Briefcase, BookOpen, Award, CalendarCheck, Loader2, UserCog, BookUser, Building2, BookCopy, ClipboardList, Landmark, Plane, Building, DoorOpen, Users2 as CommitteeIcon, Users as UsersIconLucide, FileText as AssessmentIcon, BarChart3, CalendarRange, UserCheck as AttendanceIcon, Settings2 as ResourceIcon, Clock, ListChecks, BookOpenCheck, FilePieChart, Paperclip, UserPlus, BellRing, NotebookPen, BookOpenText, Newspaper} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { AppLogo } from '@/components/app-logo';
import React, { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { UserRole as UserRoleCode, Role } from '@/types/entities'; 
import { roleService } from '@/lib/api/roles'; 
import { useToast } from '@/hooks/use-toast';
import NotificationBell from '@/components/notifications/NotificationBell';
import PWAInstallPrompt from '@/components/pwa-install-prompt';
import MobileWelcomeBanner from '@/components/mobile-welcome-banner';


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
  { href: '/admin/users', icon: UsersIconLucide, label: 'User Management', id: 'admin-users-link' },
  { href: '/admin/roles', icon: UserCog, label: 'Role Management', id: 'admin-roles-link' },
  { href: '/admin/institutes', icon: Landmark, label: 'Institutes', id: 'admin-institutes-link'},
  { href: '/admin/buildings', icon: Building, label: 'Buildings', id: 'admin-buildings-link'},
  { href: '/admin/rooms', icon: DoorOpen, label: 'Rooms', id: 'admin-rooms-link'},
  { href: '/admin/committees', icon: CommitteeIcon, label: 'Committees', id: 'admin-committees-link'},
  { href: '/admin/students', icon: BookUser, label: 'Student Mgt.', id: 'admin-students-link' },
  { href: '/admin/faculty', icon: UserCog, label: 'Staff Mgt.', id: 'admin-faculty-link' }, 
  { href: '/admin/faculty-workload', icon: Briefcase, label: 'Faculty Workload', id: 'admin-faculty-workload-link'},
  { href: '/admin/departments', icon: Building2, label: 'Departments', id: 'admin-departments-link' },
  { href: '/admin/programs', icon: BookCopy, label: 'Programs', id: 'admin-programs-link' },
  { href: '/admin/batches', icon: CalendarRange, label: 'Batches', id: 'admin-batches-link' },
  { href: '/admin/courses', icon: ClipboardList, label: 'Course Mgt.', id: 'admin-courses-link' },
  { href: '/admin/curriculum', icon: BookOpenText, label: 'Curriculum Mgt.', id: 'admin-curriculum-link' },
  { href: '/admin/course-offerings', icon: BookOpenCheck, label: 'Course Offerings', id: 'admin-course-offerings-link' },
  { href: '/admin/assessments', icon: AssessmentIcon, label: 'Assessments', id: 'admin-assessments-link' },
  { href: '/admin/examinations', icon: Award, label: 'Examination Mgt.', id: 'admin-examinations-link'},
  { href: '/admin/enrollments', icon: UserPlus, label: 'Enrollment Mgt.', id: 'admin-enrollments-link'},
  { href: '/faculty/attendance/mark', icon: CalendarCheck, label: 'Mark Attendance', id: 'admin-mark-attendance-nav-link' }, 
  { href: '/admin/resource-allocation', icon: ResourceIcon, label: 'Resource Allocation', id: 'admin-resource-allocation-link' },
  { href: '/admin/timetables', icon: Clock, label: 'Timetables', id: 'admin-timetables-link'},
  { href: '/admin/feedback-analysis', icon: BotMessageSquare, label: 'Feedback Analysis', id: 'admin-feedback-link' },
  { href: '/admin/reporting-analytics', icon: BarChart3, label: 'Reports & Analytics', id: 'admin-reporting-link' },
  { href: '/admin/project-fair/events', icon: Briefcase, label: 'Project Fair Events', id: 'admin-project-event-nav-link'},
  { href: '/admin/results', icon: Award, label: 'Results Mgt.', id: 'admin-results-link'},
  { href: '/admin/settings', icon: Settings, label: 'System Settings', id: 'admin-settings-nav-link'},
  { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'admin-blog-link' },
];

const baseNavItems: Record<UserRoleCode, Array<{ href: string; icon: React.ElementType; label: string; id: string }>> = {
  admin: adminNavItems,
  student: [
    { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'student-dashboard-link' },
    { href: '/student/profile', icon: UserCircle, label: 'My Profile', id: 'student-profile-link' },
    { href: '/student/timetable', icon: Clock, label: 'My Timetable', id: 'student-timetable-link' },
    { href: '/student/attendance', icon: AttendanceIcon, label: 'My Attendance', id: 'student-attendance-link' },
    { href: '/student/courses', icon: BookOpen, label: 'My Courses', id: 'student-courses-link' },
    { href: '/student/courses/enroll', icon: BookOpenCheck, label: 'Enroll in Courses', id: 'student-enroll-courses-link' },
    { href: '/student/assignments', icon: NotebookPen, label: 'Assignments', id: 'student-assignments-link'},
    { href: '/student/results', icon: Award, label: 'My Results', id: 'student-results-link' },
    { href: '/student/materials', icon: Paperclip, label: 'Study Materials', id: 'student-materials-link' },
    { href: '/student/exam-timetable', icon: CalendarRange, label: 'Exam Schedule', id: 'student-exam-schedule-link'},
    { href: '/project-fair/student', icon: Briefcase, label: 'Project Fair', id: 'student-project-link' }, 
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'student-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'student-blog-link' },
  ],
  faculty: [
    { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'faculty-dashboard-link' },
    { href: '/faculty/profile', icon: UserCircle, label: 'My Profile', id: 'faculty-profile-link' },
    { href: '/faculty/timetable', icon: Clock, label: 'My Timetable', id: 'faculty-timetable-link' },
    { href: '/faculty/my-courses', icon: BookOpen, label: 'My Courses', id: 'faculty-courses-link' }, 
    { href: '/faculty/attendance/mark', icon: CalendarCheck, label: 'Mark Attendance', id: 'faculty-mark-attendance-link' },
    { href: '/faculty/attendance/reports', icon: BarChart3, label: 'Attendance Reports', id: 'faculty-attendance-reports-link' },
    { href: '/faculty/assessments/grade', icon: FilePieChart, label: 'Grade Assessments', id: 'faculty-grade-assessments-link' },
    { href: '/faculty/leaves', icon: Plane, label: 'My Leaves', id: 'faculty-leaves-link'},
    { href: '/faculty/exam-timetable', icon: CalendarRange, label: 'Exam Schedule', id: 'faculty-exam-schedule-link'},
    { href: '/project-fair/jury', icon: Briefcase, label: 'Evaluate Projects', id: 'faculty-evaluate-link' }, 
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'faculty-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'faculty-blog-link' },
  ],
  hod: [
    { href: '/dashboard/hod', icon: Home, label: 'HOD Dashboard', id: 'hod-dashboard-link' },
    { href: '/admin/departments', icon: Building2, label: 'My Department', id: 'hod-department-link' }, 
    { href: '/admin/programs', icon: BookCopy, label: 'Programs (Dept)', id: 'hod-programs-link' },
    { href: '/admin/courses', icon: ClipboardList, label: 'Courses (Dept)', id: 'hod-courses-link' },
    { href: '/admin/faculty', icon: UserCog, label: 'Faculty (Dept)', id: 'hod-faculty-link' },
    { href: '/admin/students', icon: BookUser, label: 'Students (Dept)', id: 'hod-students-link' },
    { href: '/admin/timetables', icon: Clock, label: 'Dept. Timetable', id: 'hod-timetables-link'},
    { href: '/admin/leaves', icon: Plane, label: 'Manage Leaves (Dept)', id: 'hod-manage-leaves-link' },
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'hod-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'hod-blog-link' },
  ],
  jury: [
    { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'jury-dashboard-link' },
    { href: '/project-fair/jury', icon: Briefcase, label: 'Evaluate Projects', id: 'jury-evaluate-link' }, 
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'jury-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'jury-blog-link' },
  ],
  committee_convener: [ 
    { href: '/dashboard/committee', icon: Home, label: 'Convener Dashboard', id: 'convener-dashboard-link' },
    { href: '/dashboard/committee', icon: CommitteeIcon, label: 'My Committee', id: 'convener-my-committee-link'},
    { href: '/committee/meetings', icon: CalendarCheck, label: 'Meetings', id: 'convener-meetings-link'}, 
    { href: '/admin/resource-allocation/rooms', icon: DoorOpen, label: 'Book Room', id: 'convener-book-room-link' },
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'committee_convener-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'committee_convener-blog-link' },
  ],
  committee_co_convener: [
    { href: '/dashboard/committee', icon: Home, label: 'Co-Convener Dashboard', id: 'co-convener-dashboard-link' },
    { href: '/dashboard/committee', icon: CommitteeIcon, label: 'My Committee', id: 'co-convener-my-committee-link'},
    { href: '/committee/meetings', icon: CalendarCheck, label: 'Meetings', id: 'co-convener-meetings-link'}, 
    { href: '/admin/resource-allocation/rooms', icon: DoorOpen, label: 'Book Room', id: 'co_convener-book-room-link' },
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'committee_co_convener-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'committee_co_convener-blog-link' },
  ],
  committee_member: [
    { href: '/dashboard/committee', icon: Home, label: 'Member Dashboard', id: 'member-dashboard-link' },
    { href: '/dashboard/committee', icon: CommitteeIcon, label: 'My Committee', id: 'member-my-committee-link'},
    { href: '/committee/tasks/my', icon: ListChecks, label: 'My Tasks', id: 'member-my-tasks-link'},
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'committee_member-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'committee_member-blog-link' },
  ],
  super_admin: [ 
    ...adminNavItems,
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'super_admin-notifications-link' },
  ], 
  institute_admin: [
    { href: '/dashboard', icon: Home, label: 'Institute Dashboard', id: 'institute-admin-dashboard-link' },
    ...adminNavItems.filter(item => ![
      '/admin/users', '/admin/roles', '/admin/institutes', '/dashboard'
    ].includes(item.href)), 
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'institute_admin-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'institute_admin-blog-link' },
  ],
  department_admin: [ 
    { href: '/dashboard/hod', icon: Home, label: 'Department Dashboard', id: 'department-admin-dashboard-link' }, // Using HOD dashboard for dept admin
    { href: '/admin/programs', icon: BookCopy, label: 'Programs (Dept)', id: 'department-admin-programs-link' },
    { href: '/admin/batches', icon: CalendarRange, label: 'Batches (Dept)', id: 'department-admin-batches-link' },
    { href: '/admin/courses', icon: ClipboardList, label: 'Courses (Dept)', id: 'department-admin-courses-link' },
    { href: '/admin/curriculum', icon: BookOpenText, label: 'Curriculum (Dept)', id: 'department-admin-curriculum-link' },
    { href: '/admin/assessments', icon: AssessmentIcon, label: 'Assessments (Dept)', id: 'department-admin-assessments-link' },
    { href: '/admin/enrollments', icon: UserPlus, label: 'Enrollment Mgt.', id: 'department-admin-enrollments-link'},
    { href: '/admin/faculty', icon: UserCog, label: 'Faculty (Dept)', id: 'department-admin-faculty-link' },
    { href: '/admin/students', icon: BookUser, label: 'Students (Dept)', id: 'department-admin-students-link' },
    { href: '/admin/resource-allocation', icon: ResourceIcon, label: 'Resource Allocation', id: 'department-admin-resource-allocation-link' },
    { href: '/admin/reporting-analytics', icon: BarChart3, label: 'Reports & Analytics', id: 'department-admin-reporting-link' },
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'department_admin-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'department_admin-blog-link' },
  ],
  committee_admin: [
    { href: '/dashboard', icon: Home, label: 'Committee Admin DB', id: 'committee-admin-dashboard-link' },
    { href: '/admin/committees', icon: CommitteeIcon, label: 'Manage Committees', id: 'committee-admin-committees-link' },
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'committee_admin-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'committee_admin-blog-link' },
  ],
  dte_admin: [
    { href: '/dte/dashboard', icon: Home, label: 'DTE Dashboard', id: 'dte-admin-dashboard-link' },
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'dte_admin-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'dte_admin-blog-link' },
  ], 
  gtu_admin: [
    { href: '/gtu/dashboard', icon: Home, label: 'GTU Dashboard', id: 'gtu-admin-dashboard-link' },
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'gtu_admin-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'gtu_admin-blog-link' },
  ], 
  lab_assistant: [
    { href: '/dashboard', icon: Home, label: 'Lab Assistant Dashboard', id: 'lab-assistant-dashboard-link' },
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'lab_assistant-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'lab_assistant-blog-link' },
  ], 
  clerical_staff: [
    { href: '/dashboard', icon: Home, label: 'Clerical Dashboard', id: 'clerical-dashboard-link' },
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'clerical_staff-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'clerical_staff-blog-link' },
  ], 
  unknown: [
    { href: '/notifications', icon: BellRing, label: 'Notifications', id: 'unknown-notifications-link' },
    { href: '/posts/en', icon: Newspaper, label: 'Blog', id: 'unknown-blog-link' },
  ], 
};


const getNavItemsForRoleCode = (roleCode: UserRoleCode): Array<{ href: string; icon: React.ElementType; label: string; id: string }> => {
  const items = baseNavItems[roleCode] || baseNavItems['unknown']; 
  const itemsArray = Array.isArray(items) ? items : [];
  
  const committeeSpecificRoles: UserRoleCode[] = ['committee_convener', 'committee_co_convener', 'committee_member'];

  if (committeeSpecificRoles.includes(roleCode)) {
    const specificItems = [...(baseNavItems[roleCode] || [])];
    if (!specificItems.find(item => item.href === '/dashboard/committee')) { 
        const dashboardIndex = specificItems.findIndex(item => item.href === '/dashboard');
        if (dashboardIndex !== -1) {
            specificItems[dashboardIndex].href = '/dashboard/committee'; 
        } else {
            specificItems.unshift({ href: '/dashboard/committee', icon: Home, label: 'Committee Dashboard', id: `${roleCode}-committee-dashboard-link` });
        }
    }
    const uniqueItems = Array.from(new Map(specificItems.map(item => [item.id, item])).values());
    // Sort alphabetically, but keep "Dashboard" first if it exists
    uniqueItems.sort((a, b) => {
        if (a.label.includes('Dashboard')) return -1;
        if (b.label.includes('Dashboard')) return 1;
        return a.label.localeCompare(b.label);
    });
    return uniqueItems;
  }

  // For other roles, use a Map to ensure uniqueness by ID and then sort.
  const sortedItems = [...new Map(itemsArray.map(item => [item.id, item])).values()]; 
  sortedItems.sort((a, b) => {
    if (a.label.includes('Dashboard')) return -1;
    if (b.label.includes('Dashboard')) return 1;
    return a.label.localeCompare(b.label);
  });
  return sortedItems;
};

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return undefined;
}

interface ParsedUserCookie {
  id?: string;
  email: string;
  name: string;
  availableRoles: UserRoleCode[]; 
  activeRole: UserRoleCode; 
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [allSystemRoles, setAllSystemRoles] = useState<Role[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const parseUserCookie = useCallback((): ParsedUserCookie | null => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        return JSON.parse(decodedCookie) as ParsedUserCookie;
      } catch (error) {
        console.error("Failed to parse auth_user cookie:", error);
        if (typeof document !== 'undefined') {
            document.cookie = 'auth_user=;path=/;max-age=0'; 
        }
        return null;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    setIsMounted(true); 
    const parsedUser = parseUserCookie();
    if (parsedUser) {
      setCurrentUser({
        id: parsedUser.id,
        name: parsedUser.name || parsedUser.email, 
        activeRole: parsedUser.activeRole || 'unknown',
        availableRoles: parsedUser.availableRoles && parsedUser.availableRoles.length > 0 ? parsedUser.availableRoles : ['unknown'],
        email: parsedUser.email,
        avatarUrl: `https://picsum.photos/seed/${parsedUser.email}/40/40`, 
        dataAiHint: 'user avatar',
      });
    } else {
      setCurrentUser(DEFAULT_USER);
       if (pathname && !['/login', '/signup', '/forgot-password', '/', '/about', '/departments', '/admissions', '/library', '/facilities', '/contact', '/ssip', '/establishment', '/student-section', '/tpo', '/students', '/faculty'].includes(pathname) && !pathname.startsWith('/posts') && !pathname.startsWith('/newsletters') && !pathname.startsWith('/departments/') && !pathname.startsWith('/students/') && !pathname.startsWith('/faculty/') && !pathname.startsWith('/tags') && !pathname.startsWith('/categories') && !pathname.startsWith('/search')) { // Allow /posts, /newsletters, /tags, /categories, /search, /students, /faculty and other public routes
         router.push('/login');
       }
    }
    
    const fetchRoles = async () => {
        try {
            const roles = await roleService.getAllRoles();
            setAllSystemRoles(roles);
        } catch (error) {
            console.error("Failed to load system roles in layout:", error);
            toast({ variant: "destructive", title: "Role System Error", description: "Could not load system roles. Some features might not work as expected." });
        }
    };
    fetchRoles();

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }

  }, [pathname, router, parseUserCookie, toast]); 


  const handleRoleChange = (newRoleCode: UserRoleCode) => {
    const parsedUser = parseUserCookie();
    if (parsedUser && parsedUser.availableRoles.includes(newRoleCode)) {
        const updatedUserPayload = { ...parsedUser, activeRole: newRoleCode }; 
        const encodedUserPayload = encodeURIComponent(JSON.stringify(updatedUserPayload));
        if (typeof document !== 'undefined') {
          document.cookie = `auth_user=${encodedUserPayload};path=/;max-age=${60 * 60 * 24 * 7}`; 
        }
        setCurrentUser(prev => ({...prev, activeRole: newRoleCode}));
        
        const roleToActivate = allSystemRoles.find(r => r.code === newRoleCode);
        
        if(roleToActivate?.isCommitteeRole && !['committee_admin', 'admin', 'super_admin', 'hod', 'institute_admin'].includes(newRoleCode) ){ 
            router.push('/dashboard/committee');
        } else if (newRoleCode === 'hod' || newRoleCode === 'department_admin') {
            router.push('/dashboard/hod');
        } else if (newRoleCode === 'dte_admin') {
            router.push('/dte/dashboard');
        } else if (newRoleCode === 'gtu_admin') {
            router.push('/gtu/dashboard');
        }
        else { 
            router.push('/dashboard'); 
        }
        router.refresh(); 
    } else {
        const roleDetails = allSystemRoles.find(r => r.code === newRoleCode);
        toast({ variant: "destructive", title: "Role Switch Failed", description: `Role '${roleDetails?.name || newRoleCode}' is not available for your account or is invalid.`})
    }
  };
  
  const activeRoleObject = allSystemRoles.find(r => r.code === currentUser.activeRole);
  const currentNavItems = getNavItemsForRoleCode(currentUser.activeRole);
  // Check if this is a public faculty profile page (like /faculty/staff-code)
  const isPublicFacultyProfile = pathname?.startsWith('/faculty/') && 
    !pathname.startsWith('/faculty/profile') && 
    !pathname.startsWith('/faculty/attendance') && 
    !pathname.startsWith('/faculty/timetable') && 
    !pathname.startsWith('/faculty/my-courses') && 
    !pathname.startsWith('/faculty/assessments') && 
    !pathname.startsWith('/faculty/leaves') && 
    !pathname.startsWith('/faculty/exam-timetable') && 
    !pathname.startsWith('/faculty/projects') &&
    pathname !== '/faculty';
  
  const hideSidebar = pathname && (['/login', '/signup', '/forgot-password', '/', '/about', '/departments', '/admissions', '/library', '/facilities', '/contact', '/ssip', '/establishment', '/student-section', '/tpo', '/students', '/faculty'].includes(pathname) || isPublicFacultyProfile || pathname.startsWith('/posts') || pathname.startsWith('/newsletters') || pathname.startsWith('/departments/') || pathname.startsWith('/students/') || pathname.startsWith('/tags') || pathname.startsWith('/categories') || pathname.startsWith('/search'));


  if (!isMounted) { 
    return (
       <html lang="en" suppressHydrationWarning>
         <head>
            <title>GP Palanpur - Loading...</title>
            <meta name="description" content="College Management System for Government Polytechnic Palanpur" />
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#1E40AF" />
            <meta name="mobile-web-app-capable" content="yes" />
            <link rel="apple-touch-icon" href="/icons/icon-192x192.png" /> 
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="GP Palanpur" />
            <link rel="alternate" type="application/rss+xml" title="Blog RSS Feed (English)" href="/feed.xml?lang=en" />
            <link rel="alternate" type="application/rss+xml" title="Blog RSS Feed (Gujarati)" href="/feed.xml?lang=gu" />
        </head>
        <body className={`${GeistSans.variable} antialiased`} suppressHydrationWarning={true}>
          <ThemeProvider>
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    )
  }

  if (hideSidebar) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
            <title>GP Palanpur</title>
            <meta name="description" content="College Management System for Government Polytechnic Palanpur" />
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#1E40AF" />
            <meta name="mobile-web-app-capable" content="yes" />
            <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="GP Palanpur" />
            <link rel="alternate" type="application/rss+xml" title="Blog RSS Feed (English)" href="/feed.xml?lang=en" />
            <link rel="alternate" type="application/rss+xml" title="Blog RSS Feed (Gujarati)" href="/feed.xml?lang=gu" />
        </head>
        <body className={`${GeistSans.variable} antialiased`} suppressHydrationWarning={true}>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    );
  }


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
           <title>GP Palanpur</title>
           <meta name="description" content="College Management System for Government Polytechnic Palanpur" />
           <link rel="manifest" href="/manifest.json" />
           <meta name="theme-color" content="#1E40AF" />
           <meta name="mobile-web-app-capable" content="yes" />
           <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
           <meta name="apple-mobile-web-app-capable" content="yes" />
           <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
           <meta name="apple-mobile-web-app-title" content="GP Palanpur" />
           <link rel="alternate" type="application/rss+xml" title="Blog RSS Feed (English)" href="/feed.xml?lang=en" />
           <link rel="alternate" type="application/rss+xml" title="Blog RSS Feed (Gujarati)" href="/feed.xml?lang=gu" />
       </head>
      <body className={`${GeistSans.variable} antialiased`} suppressHydrationWarning={true}>
        <ThemeProvider>
          <SidebarProvider>
            <Sidebar>
              <SidebarHeader className="p-4 border-b border-sidebar-border dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <AppLogo className="h-8 w-auto text-sidebar-primary" />
                  <h1 className="text-xl font-semibold text-sidebar-foreground">GP Palanpur</h1>
                </div>
              </SidebarHeader>
            <SidebarContent className="p-2">
              <SidebarMenu>
                {currentNavItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href || (pathname?.startsWith(item.href + '/') && item.href !== '/dashboard' && item.href !== '/dashboard/hod' && item.href !== '/dashboard/committee')} asChild>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
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
            </main>            </SidebarInset>
          </SidebarProvider>
          <MobileWelcomeBanner />
          <PWAInstallPrompt />
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
