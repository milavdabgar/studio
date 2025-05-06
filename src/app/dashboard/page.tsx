

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Users as UsersIcon, Briefcase, CheckCircle, FileText, BookOpen, CalendarDays, Award, Users2, BotMessageSquare, CalendarCheck, Settings, UserCog, GitFork, BookUser, UsersRound, Building2 } from "lucide-react"; // Added UsersRound
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from 'react';

type UserRole = 'admin' | 'student' | 'faculty' | 'hod' | 'jury' | 'unknown';

interface User {
  name: string;
  activeRole: UserRole; 
  availableRoles: UserRole[];
  email?: string;
}

const DEFAULT_USER: User = {
  name: 'Guest User',
  activeRole: 'unknown',
  availableRoles: ['unknown'],
};

interface DashboardCardItem {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  href?: string;
  id: string; // Unique ID for deduplication
}

const baseDashboardData: Record<UserRole, DashboardCardItem[]> = {
  admin: [
    { id: "admin-total-users", title: "Total Users", value: "1,250", icon: UsersIcon, color: "text-primary", href: "/admin/users" },
    { id: "admin-total-students", title: "Total Students", value: "850", icon: BookUser, color: "text-green-500", href: "/admin/students"},
    { id: "admin-total-faculty", title: "Total Faculty", value: "75", icon: UsersRound, color: "text-indigo-500", href: "/admin/faculty"},
    { id: "admin-total-departments", title: "Total Departments", value: "7", icon: Building2, color: "text-orange-500", href: "/admin/departments"},
    { id: "admin-active-projects", title: "Active Projects", value: "78", icon: Briefcase, color: "text-accent", href: "/project-fair/admin" },
    { id: "admin-pending-approvals", title: "Pending Approvals", value: "12", icon: CheckCircle, color: "text-yellow-500", href: "/admin/approvals" },
    { id: "admin-feedback-reports", title: "Feedback Reports", value: "5", icon: BotMessageSquare, color: "text-green-500", href: "/admin/feedback-analysis" },
    { id: "admin-role-management", title: "Role Management", value: "Configure", icon: UserCog, color: "text-indigo-500", href: "/admin/roles" },
  ],
  student: [
    { id: "student-my-courses", title: "My Courses", value: "6", icon: BookOpen, color: "text-primary", href: "/courses" },
    { id: "student-upcoming-assignments", title: "Upcoming Assignments", value: "3", icon: CalendarCheck, color: "text-accent", href: "/assignments" },
    { id: "student-latest-grades", title: "Latest Grades", value: "A-", icon: Award, color: "text-green-500", href: "/results/history/me" },
    { id: "student-project-status", title: "Project Status", value: "Submitted", icon: FileText, color: "text-yellow-500", href: "/project-fair/student" },
  ],
  faculty: [
    { id: "faculty-assigned-courses", title: "Assigned Courses", value: "3", icon: BookOpen, color: "text-primary", href: "/faculty/courses" },
    { id: "faculty-students-enrolled", title: "Students Enrolled", value: "120", icon: UsersIcon, color: "text-accent", href: "/faculty/students" }, // This might link to a faculty specific student view
    { id: "faculty-pending-evaluations", title: "Pending Evaluations", value: "8", icon: CheckCircle, color: "text-yellow-500", href: "/project-fair/jury" }, 
    { id: "faculty-feedback-reports", title: "Feedback Reports", value: "View", icon: BotMessageSquare, color: "text-green-500", href: "/admin/feedback-analysis" },
  ],
  hod: [
    { id: "hod-department-staff", title: "Department Staff", value: "15", icon: UsersRound, color: "text-primary", href: "/admin/faculty" }, 
    { id: "hod-department-students", title: "Department Students", value: "250", icon: BookUser, color: "text-accent", href: "/admin/students" }, 
    { id: "hod-my-department", title: "My Department", value: "Manage", icon: Building2, color: "text-orange-500", href: "/admin/departments" },
    { id: "hod-department-projects", title: "Department Projects", value: "25", icon: Briefcase, color: "text-yellow-500", href: "/project-fair/admin" }, 
    { id: "hod-department-feedback", title: "Department Feedback", value: "View", icon: BotMessageSquare, color: "text-green-500", href: "/admin/feedback-analysis" }, 
  ],
  jury: [
    { id: "jury-projects-to-evaluate", title: "Projects to Evaluate", value: "10", icon: FileText, color: "text-primary", href: "/project-fair/jury" },
    { id: "jury-evaluation-criteria", title: "Evaluation Criteria", value: "View", icon: CheckCircle, color: "text-accent", href: "/project-fair/jury/criteria" },
    { id: "jury-submitted-evaluations", title: "Submitted Evaluations", value: "5", icon: GitFork, color: "text-green-500", href: "/project-fair/jury/submissions" },
    { id: "jury-evaluation-schedule", title: "Evaluation Schedule", value: "Today", icon: CalendarDays, color: "text-yellow-500", href: "/project-fair/jury/schedule" },
  ],
  unknown: [],
};


// This function will now return cards for the *active* role only.
const getDashboardDataForActiveRole = (activeRole: UserRole): DashboardCardItem[] => {
  return baseDashboardData[activeRole] || [];
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

interface ParsedUserCookie {
  email: string;
  name: string;
  availableRoles: UserRole[];
  activeRole: UserRole;
}


export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as ParsedUserCookie;
        
        setCurrentUser({
          name: parsedUser.name || parsedUser.email,
          activeRole: parsedUser.activeRole || 'unknown',
          availableRoles: parsedUser.availableRoles && parsedUser.availableRoles.length > 0 ? parsedUser.availableRoles : ['unknown'],
          email: parsedUser.email,
        });
      } catch (error) {
        console.error("Failed to parse auth_user cookie on dashboard:", error);
        setCurrentUser(DEFAULT_USER);
      }
    } else {
      setCurrentUser(DEFAULT_USER);
    }
  }, []);

  const dashboardCards = getDashboardDataForActiveRole(currentUser.activeRole);
  const displayActiveRole = currentUser.activeRole.charAt(0).toUpperCase() + currentUser.activeRole.slice(1);

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><UsersIcon className="h-10 w-10 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Welcome to your Dashboard, {currentUser.name}!</h1>
        <p className="text-muted-foreground">You are currently viewing as: <span className="font-semibold">{displayActiveRole}</span>. Here&apos;s a quick overview of your activities and key metrics.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => (
          <Card key={card.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.href && (
                <Link href={card.href} passHref>
                  <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">
                    View Details
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
         {dashboardCards.length === 0 && currentUser.activeRole === 'unknown' && (
            <Card className="md:col-span-2 lg:col-span-4 shadow-lg">
                <CardHeader>
                    <CardTitle>No Specific Role Active</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">You currently do not have a specific role active or assigned. Please contact an administrator or switch your role via the sidebar if you have multiple roles.</p>
                </CardContent>
            </Card>
        )}
        {dashboardCards.length === 0 && currentUser.activeRole !== 'unknown' && (
             <Card className="md:col-span-2 lg:col-span-4 shadow-lg">
                <CardHeader>
                    <CardTitle>No Dashboard Items for {displayActiveRole}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">There are no specific dashboard items configured for the {displayActiveRole} role at the moment.</p>
                </CardContent>
            </Card>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A log of recent important actions and notifications relevant to your active role.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                <Image src="https://picsum.photos/seed/activity1/40/40" alt="User avatar" data-ai-hint="user avatar" width={40} height={40} className="rounded-full"/>
                <div>
                  <p className="text-sm font-medium">New project "AI Chatbot" submitted.</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                <Image src="https://picsum.photos/seed/activity2/40/40" alt="User avatar" data-ai-hint="user avatar" width={40} height={40} className="rounded-full"/>
                <div>
                  <p className="text-sm font-medium">Feedback analysis report generated for CS Dept.</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                 <Image src="https://picsum.photos/seed/activity3/40/40" alt="User avatar" data-ai-hint="user avatar" width={40} height={40} className="rounded-full"/>
                <div>
                  <p className="text-sm font-medium">Semester 5 results published.</p>
                  <p className="text-xs text-muted-foreground">3 days ago</p>
                </div>
              </li>
            </ul>
            <div className="mt-4 text-center">
                <Button variant="outline" size="sm">View All Activities</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Visual representation of key performance indicators for {displayActiveRole}.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[250px] bg-muted/30 rounded-md">
            <div className="text-center text-muted-foreground">
              <BarChart className="h-16 w-16 mx-auto mb-2 text-primary" />
              <p>Chart data will be displayed here.</p>
              <p className="text-xs">(e.g., using ShadCN Charts)</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {currentUser.activeRole === 'admin' && ( 
        <section>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions (Admin)</CardTitle>
              <CardDescription>Access common administrative tasks quickly.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Link href="/admin/users" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto text-left">
                  <UsersIcon className="h-5 w-5" /> Manage Users
                </Button>
              </Link>
               <Link href="/admin/students" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto text-left">
                  <BookUser className="h-5 w-5" /> Manage Students
                </Button>
              </Link>
              <Link href="/admin/faculty" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto text-left">
                  <UsersRound className="h-5 w-5" /> Manage Faculty
                </Button>
              </Link>
              <Link href="/admin/departments" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto text-left">
                  <Building2 className="h-5 w-5" /> Manage Departments
                </Button>
              </Link>
              <Link href="/project-fair/admin/new-event" passHref>
                 <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto text-left">
                  <Briefcase className="h-5 w-5" /> Create Project Event
                </Button>
              </Link>
              <Link href="/admin/results/import" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto text-left">
                  <FileText className="h-5 w-5" /> Import Results
                </Button>
              </Link>
              <Link href="/admin/feedback-analysis" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto text-left">
                  <BotMessageSquare className="h-5 w-5" /> Analyze Feedback
                </Button>
              </Link>
                <Link href="/admin/roles" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto text-left">
                  <UserCog className="h-5 w-5" /> Manage Roles
                </Button>
              </Link>
                <Link href="/admin/settings" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto text-left">
                  <Settings className="h-5 w-5" /> System Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

