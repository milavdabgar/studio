
"use client"; // This needs to be a client component to access cookies

import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster";
import { Home, BarChart3, Users, FileText, Settings, LogOut, UserCircle, BotMessageSquare, Briefcase, BookOpen, Award, CalendarCheck, Loader2, UserCog } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { AppLogo } from '@/components/app-logo';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// export const metadata: Metadata = { // Metadata should be defined in a server component or static export
//   title: 'PolyManager',
//   description: 'College Management System for Government Polytechnic Palanpur',
// };


type UserRole = 'admin' | 'student' | 'faculty' | 'hod' | 'jury' | 'unknown';

interface User {
  name: string;
  role: UserRole;
  email?: string;
  avatarUrl?: string;
  dataAiHint?: string;
}

const DEFAULT_USER: User = {
  name: 'Guest User',
  role: 'unknown',
  avatarUrl: 'https://picsum.photos/seed/guest/40/40',
  dataAiHint: 'user avatar'
};


const navItemsConfig: Record<UserRole, Array<{ href: string; icon: React.ElementType; label: string }>> = {
  admin: [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'User Management' },
    { href: '/admin/roles', icon: UserCog, label: 'Role Management' },
    { href: '/admin/departments', icon: Briefcase, label: 'Departments' },
    { href: '/admin/faculty', icon: Users, label: 'Faculty Mgt.' },
    { href: '/admin/students', icon: Users, label: 'Student Mgt.' },
    { href: '/admin/results', icon: Award, label: 'Results Admin' },
    { href: '/admin/feedback-analysis', icon: BotMessageSquare, label: 'Feedback Analysis' },
    { href: '/project-fair/admin', icon: FileText, label: 'Project Fair Admin' },
  ],
  student: [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/courses', icon: BookOpen, label: 'My Courses' },
    { href: '/assignments', icon: CalendarCheck, label: 'Assignments'},
    { href: '/results/history/me', icon: Award, label: 'My Results' },
    { href: '/project-fair/student', icon: FileText, label: 'My Project' },
  ],
  faculty: [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/faculty/courses', icon: BookOpen, label: 'My Courses' },
    { href: '/faculty/students', icon: Users, label: 'My Students'},
    { href: '/project-fair/jury', icon: FileText, label: 'Evaluate Projects' },
    { href: '/admin/feedback-analysis', icon: BotMessageSquare, label: 'Feedback Analysis' },
  ],
  hod: [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/departments', icon: Briefcase, label: 'My Department' }, // Assuming HOD manages their department
    { href: '/admin/faculty', icon: Users, label: 'Faculty (Dept)' },
    { href: '/admin/students', icon: Users, label: 'Students (Dept)' },
    { href: '/admin/feedback-analysis', icon: BotMessageSquare, label: 'Feedback Analysis' },
    { href: '/project-fair/admin', icon: FileText, label: 'Project Fair Admin' },
  ],
  jury: [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/project-fair/jury', icon: FileText, label: 'Evaluate Projects' },
  ],
  unknown: [], // No items for unknown role
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
        const parsedUser = JSON.parse(decodedCookie) as { email: string; role: UserRole };
        setCurrentUser({
          name: parsedUser.email || 'User', // Use email as name or a default
          role: parsedUser.role || 'unknown',
          email: parsedUser.email,
          avatarUrl: `https://picsum.photos/seed/${parsedUser.email}/40/40`, // Generate avatar based on email
          dataAiHint: 'user avatar'
        });
      } catch (error) {
        console.error("Failed to parse auth_user cookie:", error);
        // Fallback to default user or clear cookie if invalid
        if (typeof document !== 'undefined') {
            document.cookie = 'auth_user=;path=/;max-age=0'; // Clear invalid cookie
        }
        setCurrentUser(DEFAULT_USER);
      }
    } else {
      setCurrentUser(DEFAULT_USER);
    }
  }, [pathname]); // Rerun on pathname change to ensure user is updated after login/logout

  const currentNavItems = navItemsConfig[currentUser.role] || [];

  // Hide sidebar for login, signup, and landing pages OR before client has mounted
  const hideSidebar = ['/login', '/signup', '/'].includes(pathname);


  if (hideSidebar) {
    return (
      <html lang="en" suppressHydrationWarning={true}>
        <body className={`${GeistSans.variable} antialiased`} suppressHydrationWarning={true}>
          {children}
          <Toaster />
        </body>
      </html>
    );
  }

  if (!isMounted) { // Show loader if not yet mounted and not on a public no-sidebar page
    return (
       <html lang="en" suppressHydrationWarning={true}>
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
                  <SidebarMenuItem key={item.href}>
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
                  <p className="text-xs text-sidebar-foreground/70 capitalize">{currentUser.role}</p>
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
                        document.cookie = 'auth_user=;path=/;max-age=0'; // Clear auth cookie on logout
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

