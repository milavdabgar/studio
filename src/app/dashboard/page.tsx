"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, Users as UsersIcon, Briefcase, CheckCircle, FileText as AssessmentIcon, 
  BookOpen, CalendarDays, Award, Users2 as CommitteeIcon, BotMessageSquare, 
  CalendarCheck, Settings, UserCog, GitFork, BookUser, UsersRound, 
  Building2, BookCopy, ClipboardList, Landmark, 
  Building, DoorOpen, Loader2, CalendarRange, Settings2 as ResourceIcon, Activity, Clock, Home, FileText, ListChecks
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from 'react';

type UserRole = 'admin' | 'student' | 'faculty' | 'hod' | 'jury' | 'unknown' | 'committee_convener' | 'committee_co_convener' | 'committee_member' | 'super_admin' | 'institute_admin' | 'department_admin' | 'committee_admin' | 'dte_admin' | 'gtu_admin' | 'lab_assistant' | 'clerical_staff';


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

// Define adminNavItems here before baseDashboardData uses it
const adminQuickLinks = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'admin-dashboard-link' }, // Changed id to avoid conflict
  { href: '/admin/users', icon: UsersIcon, label: 'User Management', id: 'admin-users-link' },
  { href: '/admin/roles', icon: UserCog, label: 'Role Management', id: 'admin-roles-link' },
  { href: '/admin/institutes', icon: Landmark, label: 'Institutes', id: 'admin-institutes-link'},
  { href: '/admin/buildings', icon: Building, label: 'Buildings', id: 'admin-buildings-link'},
  { href: '/admin/rooms', icon: DoorOpen, label: 'Rooms', id: 'admin-rooms-link'},
  { href: '/admin/committees', icon: CommitteeIcon, label: 'Committees', id: 'admin-committees-link'},
  { href: '/admin/students', icon: BookUser, label: 'Student Mgt.', id: 'admin-students-link' },
  { href: '/admin/faculty', icon: UsersRound, label: 'Faculty Mgt.', id: 'admin-faculty-link' }, 
  { href: '/admin/departments', icon: Building2, label: 'Departments', id: 'admin-departments-link' },
  { href: '/admin/programs', icon: BookCopy, label: 'Programs', id: 'admin-programs-link' },
  { href: '/admin/batches', icon: CalendarRange, label: 'Batches', id: 'admin-batches-link' },
  { href: '/admin/courses', icon: ClipboardList, label: 'Course Mgt.', id: 'admin-courses-link' },
  { href: '/admin/assessments', icon: AssessmentIcon, label: 'Assessments', id: 'admin-assessments-link' },
  { href: '/faculty/attendance/mark', icon: CalendarCheck, label: 'Mark Attendance', id: 'admin-mark-attendance-link' },
  { href: '/admin/resource-allocation', icon: ResourceIcon, label: 'Resource Allocation', id: 'admin-resource-allocation-link' },
  { href: '/admin/timetables', icon: Clock, label: 'Timetables', id: 'admin-timetables-link'},
  { href: '/admin/feedback-analysis', icon: BotMessageSquare, label: 'Feedback Analysis', id: 'admin-feedback-link' },
  { href: '/admin/reporting-analytics', icon: BarChart3, label: 'Reports & Analytics', id: 'admin-reporting-link' },
  { href: '/project-fair/admin/new-event', icon: Briefcase, label: 'Create Project Event', id: 'admin-project-event-link'},
  { href: '/admin/results/import', icon: AssessmentIcon, label: 'Import Results', id: 'admin-import-results-link'},
  { href: '/admin/settings', icon: Settings, label: 'System Settings', id: 'admin-settings-link'},
];


const baseDashboardData: Record<UserRole, DashboardCardItem[]> = {
  admin: [ 
    { id: "admin-total-users", title: "Total Users", value: "1,250", icon: UsersIcon, color: "text-primary", href: "/admin/users" },
    { id: "admin-total-students", title: "Total Students", value: "850", icon: BookUser, color: "text-green-500", href: "/admin/students"},
    { id: "admin-total-faculty", title: "Total Faculty", value: "75", icon: UsersRound, color: "text-indigo-500", href: "/admin/faculty"},
    { id: "admin-total-institutes", title: "Institutes", value: "Manage", icon: Landmark, color: "text-red-500", href: "/admin/institutes"},
    { id: "admin-total-buildings", title: "Buildings", value: "Manage", icon: Building, color: "text-blue-500", href: "/admin/buildings"},
    { id: "admin-total-rooms", title: "Rooms", value: "Manage", icon: DoorOpen, color: "text-cyan-500", href: "/admin/rooms"},
    { id: "admin-total-committees", title: "Committees", value: "Manage", icon: CommitteeIcon, color: "text-pink-500", href: "/admin/committees"},
    { id: "admin-total-departments", title: "Departments", value: "Manage", icon: Building2, color: "text-orange-500", href: "/admin/departments"},
    { id: "admin-total-programs", title: "Programs", value: "Manage", icon: BookCopy, color: "text-purple-500", href: "/admin/programs"},
    { id: "admin-total-batches", title: "Batches", value: "Manage", icon: CalendarRange, color: "text-yellow-600", href: "/admin/batches"},
    { id: "admin-total-courses", title: "Courses", value: "Manage", icon: ClipboardList, color: "text-teal-500", href: "/admin/courses"},
    { id: "admin-total-assessments", title: "Assessments", value: "Manage", icon: AssessmentIcon, color: "text-lime-500", href: "/admin/assessments"},
    { id: "admin-mark-attendance", title: "Mark Attendance", value: "Record", icon: CalendarCheck, color: "text-blue-400", href: "/faculty/attendance/mark"},
    { id: "admin-resource-allocation", title: "Resource Allocation", value: "Allocate", icon: ResourceIcon, color: "text-orange-400", href: "/admin/resource-allocation" },
    { id: "admin-timetable", title: "Timetables", value: "View/Edit", icon: Clock, color: "text-gray-500", href: "/admin/timetables" },
    { id: "admin-active-projects", title: "Active Projects", value: "View", icon: Briefcase, color: "text-accent", href: "/project-fair/admin" },
    { id: "admin-pending-approvals", title: "Pending Approvals", value: "12", icon: CheckCircle, color: "text-yellow-500", href: "/admin/approvals" },
    { id: "admin-feedback-reports", title: "Feedback Reports", value: "Analyze", icon: BotMessageSquare, color: "text-green-500", href: "/admin/feedback-analysis" },
    { id: "admin-reporting-analytics", title: "Reporting & Analytics", value: "Generate", icon: BarChart3, color: "text-sky-500", href: "/admin/reporting-analytics" },
    { id: "admin-role-management", title: "Role Management", value: "Configure", icon: UserCog, color: "text-indigo-500", href: "/admin/roles" },
  ],
  student: [
    { id: "student-my-courses", title: "My Courses", value: "6 Active", icon: BookOpen, color: "text-primary", href: "/courses" },
    { id: "student-upcoming-assignments", title: "Upcoming Assignments", value: "3 Due", icon: CalendarCheck, color: "text-accent", href: "/assignments" },
    { id: "student-latest-grades", title: "Latest Grades", value: "View", icon: Award, color: "text-green-500", href: "/results/history/me" },
    { id: "student-project-status", title: "Project Status", value: "Submitted", icon: AssessmentIcon, color: "text-yellow-500", href: "/project-fair/student" },
  ],
  faculty: [
    { id: "faculty-assigned-courses", title: "Assigned Courses", value: "3 Active", icon: BookOpen, color: "text-primary", href: "/faculty/courses" },
    { id: "faculty-students-enrolled", title: "Students Enrolled", value: "120 Total", icon: UsersIcon, color: "text-accent", href: "/faculty/students" }, 
    { id: "faculty-pending-evaluations", title: "Pending Evaluations", value: "8 Projects", icon: CheckCircle, color: "text-yellow-500", href: "/project-fair/jury" },
    { id: "faculty-feedback-reports", title: "Feedback Reports", value: "View", icon: BotMessageSquare, color: "text-green-500", href: "/admin/feedback-analysis" },
    { id: "faculty-mark-attendance", title: "Mark Attendance", value: "Record", icon: CalendarCheck, color: "text-blue-400", href: "/faculty/attendance/mark"},
    { id: "faculty-manage-timetable", title: "My Timetable", value: "View/Edit", icon: Clock, color: "text-gray-500", href: "/faculty/timetable"},
  ],
  hod: [
    { id: "hod-department-staff", title: "Department Staff", value: "15 Members", icon: UsersRound, color: "text-primary", href: "/admin/faculty" },
    { id: "hod-department-students", title: "Department Students", value: "250 Enrolled", icon: BookUser, color: "text-accent", href: "/admin/students" },
    { id: "hod-my-institute", title: "Institute Details", value: "View/Edit", icon: Landmark, color: "text-red-500", href: "/admin/institutes"},
    { id: "hod-my-buildings", title: "Buildings", value: "Manage", icon: Building, color: "text-blue-500", href: "/admin/buildings"},
    { id: "hod-my-rooms", title: "Rooms", value: "Manage", icon: DoorOpen, color: "text-cyan-500", href: "/admin/rooms"},
    { id: "hod-my-committees", title: "Committees", value: "Manage", icon: CommitteeIcon, color: "text-pink-500", href: "/admin/committees"},
    { id: "hod-my-department", title: "Department Info", value: "View/Edit", icon: Building2, color: "text-orange-500", href: "/admin/departments" },
    { id: "hod-my-programs", title: "Programs", value: "Manage", icon: BookCopy, color: "text-purple-500", href: "/admin/programs" },
    { id: "hod-my-batches", title: "Batches", value: "Manage", icon: CalendarRange, color: "text-yellow-600", href: "/admin/batches" },
    { id: "hod-my-courses", title: "Courses", value: "Manage", icon: ClipboardList, color: "text-teal-500", href: "/admin/courses" },
    { id: "hod-my-assessments", title: "Assessments", value: "Manage", icon: AssessmentIcon, color: "text-lime-500", href: "/admin/assessments" },
    { id: "hod-mark-attendance", title: "Mark Attendance", value: "Oversee", icon: CalendarCheck, color: "text-blue-400", href: "/faculty/attendance/mark"},
    { id: "hod-resource-allocation", title: "Resource Allocation", value: "Manage", icon: ResourceIcon, color: "text-orange-400", href: "/admin/resource-allocation" },
    { id: "hod-manage-timetable", title: "Department Timetable", value: "View/Edit", icon: Clock, color: "text-gray-500", href: "/admin/timetables"},
    { id: "hod-department-projects", title: "Department Projects", value: "25 Active", icon: Briefcase, color: "text-yellow-500", href: "/project-fair/admin" },
    { id: "hod-department-feedback", title: "Department Feedback", value: "Analyze", icon: BotMessageSquare, color: "text-green-500", href: "/admin/feedback-analysis" },
    { id: "hod-reporting-analytics", title: "Reporting & Analytics", value: "Generate", icon: BarChart3, color: "text-sky-500", href: "/admin/reporting-analytics" },
  ],
  jury: [
    { id: "jury-projects-to-evaluate", title: "Projects to Evaluate", value: "10 Pending", icon: AssessmentIcon, color: "text-primary", href: "/project-fair/jury" },
    { id: "jury-evaluation-criteria", title: "Evaluation Criteria", value: "View", icon: CheckCircle, color: "text-accent", href: "/project-fair/jury/criteria" },
    { id: "jury-submitted-evaluations", title: "Submitted Evaluations", value: "5 Done", icon: GitFork, color: "text-green-500", href: "/project-fair/jury/submissions" },
    { id: "jury-evaluation-schedule", title: "Evaluation Schedule", value: "View Today", icon: CalendarDays, color: "text-yellow-500", href: "/project-fair/jury/schedule" },
  ],
  committee_convener: [
    { id: "convener-committee-dashboard", title: "My Committee", value: "Manage", icon: CommitteeIcon, color: "text-pink-500", href: "/dashboard/committee"},
    { id: "convener-book-room", title: "Book Room", value: "Schedule", icon: DoorOpen, color: "text-cyan-500", href: "/admin/resource-allocation/rooms"},
    { id: "convener-meetings", title: "Meetings", value: "Schedule/View", icon: CalendarCheck, color: "text-blue-500", href: "/committee/meetings" },
    { id: "convener-tasks", title: "Committee Tasks", value: "Assign/Track", icon: ListChecks, color: "text-green-500", href: "/committee/tasks" },

  ],
  committee_co_convener: [
    { id: "co_convener-committee-dashboard", title: "My Committee", value: "View", icon: CommitteeIcon, color: "text-pink-500", href: "/dashboard/committee"},
    { id: "co_convener-book-room", title: "Book Room", value: "Request", icon: DoorOpen, color: "text-cyan-500", href: "/admin/resource-allocation/rooms"},
    { id: "co_convener-meetings", title: "Meetings", value: "View", icon: CalendarCheck, color: "text-blue-500", href: "/committee/meetings" },
  ],
  committee_member: [
    { id: "member-committee-dashboard", title: "My Committee", value: "View Info", icon: CommitteeIcon, color: "text-pink-500", href: "/dashboard/committee"},
    { id: "member-tasks", title: "Assigned Tasks", value: "View", icon: ListChecks, color: "text-green-500", href: "/committee/tasks/my" },
  ],
  super_admin: [ 
    { id: "sadmin-total-users", title: "Platform Users", value: "Manage All", icon: UsersIcon, color: "text-primary", href: "/admin/users" },
    { id: "sadmin-system-roles", title: "System Roles", value: "Configure", icon: UserCog, color: "text-indigo-500", href: "/admin/roles" },
    { id: "sadmin-all-institutes", title: "All Institutes", value: "Oversee", icon: Landmark, color: "text-red-500", href: "/admin/institutes"},
    { id: "sadmin-system-settings", title: "System Settings", value: "Global Config", icon: Settings, color: "text-teal-500", href: "/admin/settings" },
    { id: "sadmin-activity-log", title: "Activity Log", value: "Audit", icon: Activity, color: "text-orange-500", href: "/admin/logs" },
  ],
  institute_admin: [
    { id: "iadmin-institute-faculty", title: "Institute Faculty", value: "Manage", icon: UsersRound, color: "text-indigo-500", href: "/admin/faculty"},
    { id: "iadmin-institute-students", title: "Institute Students", value: "Manage", icon: BookUser, color: "text-green-500", href: "/admin/students"},
    { id: "iadmin-institute-depts", title: "Departments", value: "Manage", icon: Building2, color: "text-orange-500", href: "/admin/departments" },
    { id: "iadmin-institute-programs", title: "Programs", value: "Manage", icon: BookCopy, color: "text-purple-500", href: "/admin/programs" },
    { id: "iadmin-institute-buildings", title: "Buildings & Rooms", value: "Manage", icon: Building, color: "text-blue-500", href: "/admin/buildings"},
    { id: "iadmin-institute-committees", title: "Committees", value: "Manage", icon: CommitteeIcon, color: "text-pink-500", href: "/admin/committees"},
  ],
  department_admin: [ 
    { id: "dept-admin-programs", title: "Dept. Programs", value: "Manage", icon: BookCopy, color: "text-purple-500", href: "/admin/programs" },
    { id: "dept-admin-courses", title: "Dept. Courses", value: "Manage", icon: ClipboardList, color: "text-teal-500", href: "/admin/courses" },
    { id: "dept-admin-students", title: "Dept. Students", value: "View", icon: BookUser, color: "text-green-500", href: "/admin/students"},
    { id: "dept-admin-faculty", title: "Dept. Faculty", value: "View", icon: UsersRound, color: "text-indigo-500", href: "/admin/faculty"},
    { id: "dept-admin-timetable", title: "Dept. Timetable", value: "View", icon: Clock, color: "text-gray-500", href: "/admin/timetables"},
  ],
  committee_admin: [
    { id: "committee-admin-manage", title: "All Committees", value: "Oversee", icon: CommitteeIcon, color: "text-pink-500", href: "/admin/committees" },
  ],
  dte_admin: [{ id: "dte-overview", title: "DTE Overview", value: "View Stats", icon: BarChart3, color: "text-primary", href: "/dte/overview" }],
  gtu_admin: [{ id: "gtu-overview", title: "GTU Overview", value: "View Stats", icon: BarChart3, color: "text-primary", href: "/gtu/overview" }],
  lab_assistant: [{ id: "lab-inventory", title: "Lab Inventory", value: "Manage", icon: Settings, color: "text-primary", href: "/lab/inventory" }],
  clerical_staff: [{ id: "clerical-tasks", title: "Administrative Tasks", value: "View", icon: FileText, color: "text-primary", href: "/office/tasks" }],
  unknown: [],
};


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
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    // ... other stats
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

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
  
  useEffect(() => {
    // Simulate fetching stats
    const fetchStats = async () => {
        setIsLoadingStats(true);
        // In a real app, you would fetch these from your API based on currentUser.activeRole
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        setDashboardStats({
            totalUsers: 1250, // Placeholder
            totalStudents: 850, // Placeholder
            totalFaculty: 75,   // Placeholder
        });
        setIsLoadingStats(false);
    };
    if(currentUser.activeRole !== 'unknown'){
        fetchStats();
    } else {
        setIsLoadingStats(false);
    }
  }, [currentUser.activeRole]);


  const dashboardCards = getDashboardDataForActiveRole(currentUser.activeRole).map(card => {
      if (isLoadingStats) {
          return {...card, value: "Loading..."};
      }
      if (card.id === "admin-total-users") return { ...card, value: dashboardStats.totalUsers.toLocaleString() };
      if (card.id === "admin-total-students") return { ...card, value: dashboardStats.totalStudents.toLocaleString() };
      if (card.id === "admin-total-faculty") return { ...card, value: dashboardStats.totalFaculty.toLocaleString() };
      // ... map other dynamic stats
      return card;
  });
  const displayActiveRole = currentUser.activeRole.charAt(0).toUpperCase() + currentUser.activeRole.slice(1).replace(/_/g, ' ');


  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
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
              <BarChart3 className="h-16 w-16 mx-auto mb-2 text-primary" />
              <p>Chart data will be displayed here.</p>
              <p className="text-xs">(e.g., using ShadCN Charts)</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {(currentUser.activeRole === 'admin' || currentUser.activeRole === 'super_admin') && (
        <section>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Access common administrative tasks quickly.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {adminQuickLinks.map(item => (
                <Link href={item.href} passHref key={item.id}>
                  <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto text-left">
                    <item.icon className="h-5 w-5" /> {item.label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
