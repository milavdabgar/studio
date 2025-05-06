import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster";
import { Home, BarChart3, Users, FileText, Settings, LogOut, UserCircle, BotMessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { AppLogo } from '@/components/app-logo';

export const metadata: Metadata = {
  title: 'PolyManager',
  description: 'College Management System for Government Polytechnic Palanpur',
};

// Mock user data - replace with actual authentication logic
const MOCK_USER = {
  name: 'Admin User',
  role: 'admin', // Possible roles: 'student', 'faculty', 'hod', 'admin', 'jury'
  avatarUrl: 'https://picsum.photos/seed/admin/40/40',
  dataAiHint: 'user avatar'
};

const navItems = {
  admin: [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'User Management' },
    { href: '/admin/departments', icon: BarChart3, label: 'Departments' }, // Using BarChart3 as placeholder for department icon
    { href: '/admin/faculty', icon: Users, label: 'Faculty' }, // Using Users as placeholder for faculty icon
    { href: '/admin/students', icon: Users, label: 'Students' }, // Using Users as placeholder for student icon
    { href: '/admin/results', icon: FileText, label: 'Results' },
    { href: '/admin/feedback-analysis', icon: BotMessageSquare, label: 'Feedback Analysis' },
    { href: '/project-fair/admin', icon: FileText, label: 'Project Fair Admin' }, // Using FileText as placeholder
  ],
  student: [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/project-fair/student', icon: FileText, label: 'Project Fair' },
    { href: '/results/history/me', icon: FileText, label: 'My Results' },
  ],
  faculty: [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/project-fair/jury', icon: FileText, label: 'Project Fair Jury' },
    { href: '/admin/feedback-analysis', icon: BotMessageSquare, label: 'Feedback Analysis' },
  ],
  hod: [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/departments', icon: BarChart3, label: 'My Department' },
    { href: '/admin/faculty', icon: Users, label: 'Faculty (Dept)' },
    { href: '/admin/students', icon: Users, label: 'Students (Dept)' },
    { href: '/admin/feedback-analysis', icon: BotMessageSquare, label: 'Feedback Analysis' },
    { href: '/project-fair/admin', icon: FileText, label: 'Project Fair Admin' },
  ],
  jury: [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/project-fair/jury', icon: FileText, label: 'Evaluate Projects' },
  ],
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userRole = MOCK_USER.role as keyof typeof navItems;
  const currentNavItems = navItems[userRole] || [];

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} antialiased`}>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader className="p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <AppLogo className="h-8 w-auto text-primary" />
                <h1 className="text-xl font-semibold text-sidebar-foreground">PolyManager</h1>
              </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
              <SidebarMenu>
                {currentNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref legacyBehavior>
                      <SidebarMenuButton tooltip={item.label}>
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
                <UserCircle className="h-10 w-10 rounded-full text-sidebar-foreground" />
                <div>
                  <p className="font-semibold text-sm text-sidebar-foreground">{MOCK_USER.name}</p>
                  <p className="text-xs text-sidebar-foreground/70 capitalize">{MOCK_USER.role}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
                  <Settings />
                </Button>
                <ThemeToggle />
                <Link href="/login" passHref legacyBehavior>
                  <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
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
                <span className="font-semibold">Welcome, {MOCK_USER.name}!</span>
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
