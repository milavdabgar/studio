
"use client"; 

import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster";
import { Home, BarChart3, Users as UsersIcon, FileText, Settings, LogOut, UserCircle, BotMessageSquare, Briefcase, BookOpen, Award, CalendarCheck, Loader2, UserCog } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { AppLogo } from '@/components/app-logo';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';


type UserRole = 'admin' | 'student' | 'faculty' | 'hod' | 'jury' | 'unknown';

interface User {
  name: string;
  roles: UserRole[]; // Changed from role: UserRole to roles: UserRole[]
  email?: string;
  avatarUrl?: string;
  dataAiHint?: string;
}

const DEFAULT_USER: User = {
  name: 'Guest User',
  roles: ['unknown'],
  avatarUrl: 'https://picsum.photos/seed/guest/40/40',
  dataAiHint: 'user avatar'
};


// Nav items can be a union of all items accessible by any of the user's roles
const baseNavItems: Record<UserRole, Array<{ href: string; icon: React.ElementType; label: string; id: string }>> = {
  admin: [
    { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'admin-dashboard' },
    { href: '/admin/users', icon: UsersIcon, label: 'User Management', id: 'admin-users' },
    { href: '/admin/roles', icon: UserCog, label: 'Role Management', id: 'admin-roles' },
    { href: '/admin/departments', icon: Briefcase, label: 'Departments', id: 'admin-departments' },
    { href: '/admin/faculty', icon: UsersIcon, label: 'Faculty Mgt.', id: 'admin-faculty' },
    { href: '/admin/students', icon: UsersIcon, label: 'Student Mgt.', id: 'admin-students' },
    { href: '/admin/results', icon: Award, label: 'Results Admin', id: 'admin-results' },
    { href: '/admin/feedback-analysis', icon: BotMessageSquare, label: 'Feedback Analysis', id: 'admin-feedback' },
    { href: '/project-fair/admin', icon: FileText, label: 'Project Fair Admin', id: 'admin-project-fair' },
  ],
  student: [
    { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'student-dashboard' },
    { href: '/courses', icon: BookOpen, label: 'My Courses', id: 'student-courses' },
    { href: '/assignments', icon: CalendarCheck, label: 'Assignments', id: 'student-assignments'},
    { href: '/results/history/me', icon: Award, label: 'My Results', id: 'student-results' },
    { href: '/project-fair/student', icon: FileText, label: 'My Project', id: 'student-project' },
  ],
  faculty: [
    { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'faculty-dashboard' },
    { href: '/faculty/courses', icon: BookOpen, label: 'My Courses', id: 'faculty-courses' },
    { href: '/faculty/students', icon: UsersIcon, label: 'My Students', id: 'faculty-students'},
    { href: '/project-fair/jury', icon: FileText, label: 'Evaluate Projects', id: 'faculty-evaluate' },
    { href: '/admin/feedback-analysis', icon: BotMessageSquare, label: 'Feedback Analysis', id: 'faculty-feedback' },
  ],
  hod: [
    { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'hod-dashboard' },
    { href: '/admin/departments', icon: Briefcase, label: 'My Department', id: 'hod-department' }, 
    { href: '/admin/faculty', icon: UsersIcon, label: 'Faculty (Dept)', id: 'hod-faculty' },
    { href: '/admin/students', icon: UsersIcon, label: 'Students (Dept)', id: 'hod-students' },
    { href: '/admin/feedback-analysis', icon: BotMessageSquare, label: 'Feedback Analysis', id: 'hod-feedback' },
    { href: '/project-fair/admin', icon: FileText, label: 'Project Fair Admin', id: 'hod-project-fair' },
  ],
  jury: [
    { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'jury-dashboard' },
    { href: '/project-fair/jury', icon: FileText, label: 'Evaluate Projects', id: 'jury-evaluate' },
  ],
  unknown: [], 
};

const getCombinedNavItems = (roles: UserRole[]): Array<{ href: string; icon: React.ElementType; label: string; id: string }> => {
  const combinedItems: Array<{ href: string; icon: React.ElementType; label: string; id: string }> = [];
  const addedItemIds = new Set<string>();

  roles.forEach(role => {
    const itemsForRole = baseNavItems[role] || [];
    itemsForRole.forEach(item => {
      if (!addedItemIds.has(item.id)) {
        combinedItems.push(item);
        addedItemIds.add(item.id);
      }
    });
  });
  // Ensure Dashboard is always first if present
  combinedItems.sort((a, b) => {
    if (a.label === 'Dashboard') return -1;
    if (b.label === 'Dashboard') return 1;
    return a.label.localeCompare(b.label);
  });
  return combinedItems;
};


function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookiePart = parts.pop();
    if (cookiePart) {
      return cookiePart.split(';').shift();
    }
  }
  return undefined;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as { email: string; roles: UserRole[] }; // Expect roles as array
        
        let userRoles = parsedUser.roles || ['unknown'];
        if (!Array.isArray(userRoles)) { // Backward compatibility for single role string
          userRoles = [userRoles as unknown as UserRole];
        }
        
        setCurrentUser({
          name: parsedUser.email || 'User', 
          roles: userRoles.length > 0 ? userRoles : ['unknown'],
          email: parsedUser.email,
          avatarUrl: `https://picsum.photos/seed/${parsedUser.email}/40/40`, 
          dataAiHint: 'user avatar'
        });
      } catch (error) {
        console.error("Failed to parse auth_user cookie:", error);
        if (typeof document !== 'undefined') {
            document.cookie = 'auth_user=;path=/;max-age=0'; 
        }
        setCurrentUser(DEFAULT_USER);
      }
    } else {
      setCurrentUser(DEFAULT_USER);
    }
  }, [pathname]); 

  const currentNavItems = getCombinedNavItems(currentUser.roles);
  const hideSidebar = ['/login', '/signup', '/'].includes(pathname);


  if (hideSidebar) {
    return (
      <html lang="en" suppressHydrationWarning={true}>
        <head>
            <title>PolyManager</title>
            <meta name="description" content="College Management System for Government Polytechnic Palanpur" />
        </head>
        <body className={`${GeistSans.variable} antialiased`} suppressHydrationWarning={true}>
          {children}
          <Toaster />
        </body>
      </html>
    );
  }

  if (!isMounted) { 
    return (
       <html lang="en" suppressHydrationWarning={true}>
         <head>
            <title>PolyManager - Loading...</title>
            <meta name="description" content="College Management System for Government Polytechnic Palanpur" />
        </head>
        <body className={`${GeistSans.variable} antialiased`} suppressHydrationWarning={true}>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <Toaster />
        </body>
      </html>
    )
  }


  return (
    <html lang="en" suppressHydrationWarning={true}>
       <head>
            <title>PolyManager</title>
            <meta name="description" content="College Management System for Government Polytechnic Palanpur" />
        </head>
      <body className={`${GeistSans.variable} antialiased`} suppressHydrationWarning={true}>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader className="p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <AppLogo className="h-8 w-auto text-sidebar-primary" />
                <h1 className="text-xl font-semibold text-sidebar-foreground">PolyManager</h1>
              </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
              <SidebarMenu>
                {currentNavItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <Link href={item.href} passHref legacyBehavior>
                      <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 mb-4">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint={currentUser.dataAiHint} className="h-10 w-10 rounded-full" />
                ) : (
                  <UserCircle className="h-10 w-10 rounded-full text-sidebar-foreground" />
                )}
                <div>
                  <p className="font-semibold text-sm text-sidebar-foreground">{currentUser.name}</p>
                  <p className="text-xs text-sidebar-foreground/70 capitalize">{currentUser.roles.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
                  <Settings />
                </Button>
                <ThemeToggle />
                <Link href="/login" passHref legacyBehavior>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-sidebar-foreground hover:bg-sidebar-accent"
                    onClick={() => {
                       if (typeof document !== 'undefined') {
                        document.cookie = 'auth_user=;path=/;max-age=0'; 
                       }
                    }}
                  >
                    <LogOut />
                  </Button>
                </Link>
              </div>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm">
              <SidebarTrigger />
              <div className="flex items-center gap-4">
                <span className="font-semibold">Welcome, {currentUser.name}!</span>
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
