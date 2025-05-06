
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, LineChartIcon, PieChartIcon, Users as UsersIcon, Briefcase, CheckCircle, FileText, BookOpen, CalendarDays, Award, Users2, Building, GitFork, BotMessageSquare, CalendarCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from 'react';

type UserRole = 'admin' | 'student' | 'faculty' | 'hod' | 'jury' | 'unknown';

interface User {
  name: string;
  role: UserRole;
  email?: string;
}

const DEFAULT_USER: User = {
  name: 'Guest User',
  role: 'unknown',
};

// Mock data for dashboard cards - replace with actual data fetching
const adminDashboardData = [
  { title: "Total Users", value: "1,250", icon: UsersIcon, color: "text-primary", href: "/admin/users" },
  { title: "Active Projects", value: "78", icon: Briefcase, color: "text-accent", href: "/project-fair/admin" },
  { title: "Pending Approvals", value: "12", icon: CheckCircle, color: "text-yellow-500", href: "/admin/approvals" },
  { title: "Feedback Reports", value: "5", icon: BotMessageSquare, color: "text-green-500", href: "/admin/feedback-analysis" },
];

const studentDashboardData = [
  { title: "My Courses", value: "6", icon: BookOpen, color: "text-primary", href: "/courses" },
  { title: "Upcoming Assignments", value: "3", icon: CalendarCheck, color: "text-accent", href: "/assignments" },
  { title: "Latest Grades", value: "A-", icon: Award, color: "text-green-500", href: "/results/history/me" },
  { title: "Project Status", value: "Submitted", icon: FileText, color: "text-yellow-500", href: "/project-fair/student" },
];

const facultyDashboardData = [
  { title: "Assigned Courses", value: "3", icon: BookOpen, color: "text-primary", href: "/faculty/courses" },
  { title: "Students Enrolled", value: "120", icon: UsersIcon, color: "text-accent", href: "/faculty/students" },
  { title: "Pending Evaluations", value: "8", icon: CheckCircle, color: "text-yellow-500", href: "/project-fair/jury" },
  { title: "Feedback Reports", value: "View", icon: BotMessageSquare, color: "text-green-500", href: "/admin/feedback-analysis" },
];

const hodDashboardData = [
  { title: "Department Staff", value: "15", icon: Users2, color: "text-primary", href: "/admin/faculty" }, 
  { title: "Department Students", value: "250", icon: UsersIcon, color: "text-accent", href: "/admin/students" }, 
  { title: "Department Projects", value: "25", icon: Briefcase, color: "text-yellow-500", href: "/project-fair/admin" }, 
  { title: "Department Feedback", value: "View", icon: BotMessageSquare, color: "text-green-500", href: "/admin/feedback-analysis" }, 
];

const juryDashboardData = [
  { title: "Projects to Evaluate", value: "10", icon: FileText, color: "text-primary", href: "/project-fair/jury" },
  { title: "Evaluation Criteria", value: "View", icon: CheckCircle, color: "text-accent", href: "/project-fair/jury/criteria" },
  { title: "Submitted Evaluations", value: "5", icon: GitFork, color: "text-green-500", href: "/project-fair/jury/submissions" },
  { title: "Evaluation Schedule", value: "Today", icon: CalendarDays, color: "text-yellow-500", href: "/project-fair/jury/schedule" },
];


const getDashboardData = (role: UserRole) => {
  switch (role) {
    case "admin": return adminDashboardData;
    case "student": return studentDashboardData;
    case "faculty": return facultyDashboardData;
    case "hod": return hodDashboardData;
    case "jury": return juryDashboardData;
    default: return [];
  }
};

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
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
        const parsedUser = JSON.parse(decodedCookie) as { email: string; role: UserRole };
        setCurrentUser({
          name: parsedUser.email || 'User',
          role: parsedUser.role || 'unknown',
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

  const dashboardCards = getDashboardData(currentUser.role);

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><UsersIcon className="h-10 w-10 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Welcome to your Dashboard, {currentUser.name}!</h1>
        <p className="text-muted-foreground">Here&apos;s a quick overview of your activities and key metrics. Your role: <span className="font-semibold capitalize">{currentUser.role}</span></p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => (
          <Card key={card.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
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
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A log of recent important actions and notifications.</CardDescription>
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
            <CardDescription>Visual representation of key performance indicators.</CardDescription>
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

      {currentUser.role === 'admin' && (
        <section>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Access common administrative tasks quickly.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Link href="/admin/users" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto text-left">
                  <UsersIcon className="h-5 w-5" /> Manage Users
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
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

    