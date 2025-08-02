'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Target, 
  Settings, 
  Calendar, 
  BookOpen, 
  Clock,
  Building,
  UserCheck,
  BarChart3,
  FileText,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Brain,
  ArrowRight,
  PlusCircle,
  UserCog,
  Award,
  Building2,
  BookOpenText,
  CalendarRange,
  UserPlus,
  CalendarCheck,
  Landmark,
  DoorOpen,
  Users2 as CommitteeIcon,
  Settings2 as ResourceIcon,
  BotMessageSquare,
  Briefcase,
  Newspaper,
  FileText as AssessmentIcon,
  Home,
  Loader2
} from 'lucide-react';
import type { UserRole as UserRoleCode } from '@/types/entities';
import PasswordChangeForm from "@/components/password-change-form";

interface User {
  name: string;
  activeRole: UserRoleCode;
  availableRoles: UserRoleCode[];
  email?: string;
}

const DEFAULT_USER: User = {
  name: 'Guest User',
  activeRole: 'unknown',
  availableRoles: ['unknown'],
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
  availableRoles: UserRoleCode[];
  activeRole: UserRoleCode;
}

const DashboardPage = () => {
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

  if (!isMounted) { 
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  // Role-aware dashboard content
  if (currentUser.activeRole === 'admin' || currentUser.activeRole === 'super_admin') {
    return <AdminDashboard />;
  } else if (currentUser.activeRole === 'faculty') {
    return <FacultyDashboard currentUser={currentUser} />;
  } else if (currentUser.activeRole === 'student') {
    return <StudentDashboard currentUser={currentUser} />;
  } else if (currentUser.activeRole === 'hod') {
    return <HODDashboard currentUser={currentUser} />;
  } else {
    return <DefaultDashboard currentUser={currentUser} />;
  }
};

// Admin Dashboard Component
const AdminDashboard = () => {
  // Mock stats - in production, these would come from APIs
  const stats = {
    activeCampaigns: 3,
    totalFaculty: 45,
    pendingAllocations: 12,
    generatedTimetables: 8,
    totalStudents: 1245,
    totalCourses: 156
  };

  const quickActions = [
    {
      title: 'Start Preference Campaign',
      description: 'Launch new faculty preference collection',
      icon: Target,
      href: '/admin/preference-campaigns',
      color: 'bg-blue-500 hover:bg-blue-600',
      action: 'Create Campaign'
    },
    {
      title: 'Generate Timetables',
      description: 'Auto-generate optimized schedules',
      icon: Zap,
      href: '/admin/timetables/auto-generate',
      color: 'bg-green-500 hover:bg-green-600',
      action: 'Auto Generate'
    },
    {
      title: 'Course Allocation',
      description: 'Manage faculty course assignments',
      icon: BarChart3,
      href: '/admin/course-allocation',
      color: 'bg-purple-500 hover:bg-purple-600',
      action: 'View Allocations'
    },
    {
      title: 'Faculty Management',
      description: 'Manage faculty and preferences',
      icon: UserCheck,
      href: '/admin/faculty',
      color: 'bg-orange-500 hover:bg-orange-600',
      action: 'Manage Faculty'
    }
  ];

  const managementSections = [
    {
      title: 'Timetable Automation',
      description: 'Complete automated timetable generation system',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      items: [
        { label: 'Preference Campaigns', href: '/admin/preference-campaigns', icon: Target, badge: stats.activeCampaigns, description: 'Collect faculty preferences' },
        { label: 'Faculty Preferences', href: '/admin/faculty-preferences', icon: Users, description: 'View & manage preferences' },
        { label: 'Course Allocation', href: '/admin/course-allocation', icon: BarChart3, badge: stats.pendingAllocations, description: 'Semi-automatic allocation' },
        { label: 'Auto Generate', href: '/admin/timetables/auto-generate', icon: Zap, description: 'Generate optimized timetables' },
        { label: 'View Timetables', href: '/admin/timetables', icon: Clock, description: 'Multi-stakeholder views' },
        { label: 'Course Offerings', href: '/admin/course-offerings', icon: BookOpen, description: 'Manage course offerings' }
      ]
    },
    {
      title: 'User Management',
      description: 'Faculty, students, and user accounts',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      items: [
        { label: 'Faculty Management', href: '/admin/faculty', icon: UserCheck, badge: stats.totalFaculty, description: 'Staff & workload' },
        { label: 'Student Management', href: '/admin/students', icon: Users, badge: stats.totalStudents, description: 'Student records' },
        { label: 'User Accounts', href: '/admin/users', icon: Users, description: 'System users' },
        { label: 'Role Management', href: '/admin/roles', icon: UserCog, description: 'Permissions & roles' },
        { label: 'Faculty Workload', href: '/admin/faculty-workload', icon: Briefcase, description: 'Workload analysis' }
      ]
    },
    {
      title: 'Academic Management',
      description: 'Curriculum, courses, and academic structure',
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      items: [
        { label: 'Academic Terms', href: '/admin/academic-terms', icon: Calendar, description: 'Semesters & terms' },
        { label: 'Programs', href: '/admin/programs', icon: FileText, description: 'Degree programs' },
        { label: 'Departments', href: '/admin/departments', icon: Building2, description: 'Academic departments' },
        { label: 'Courses', href: '/admin/courses', icon: BookOpen, badge: stats.totalCourses, description: 'Course catalog' },
        { label: 'Curriculum', href: '/admin/curriculum', icon: BookOpenText, description: 'Curriculum structure' },
        { label: 'Batches', href: '/admin/batches', icon: CalendarRange, description: 'Student batches' }
      ]
    },
    {
      title: 'Assessment & Evaluation',
      description: 'Examinations, assessments, and results',
      icon: Award,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950',
      items: [
        { label: 'Assessments', href: '/admin/assessments', icon: AssessmentIcon, description: 'Internal assessments' },
        { label: 'Examinations', href: '/admin/examinations', icon: Award, description: 'Exam management' },
        { label: 'Results Management', href: '/admin/results', icon: TrendingUp, description: 'Student results' },
        { label: 'Enrollments', href: '/admin/enrollments', icon: UserPlus, description: 'Course enrollments' },
        { label: 'Mark Attendance', href: '/faculty/attendance/mark', icon: CalendarCheck, description: 'Quick attendance' }
      ]
    },
    {
      title: 'Infrastructure & Resources',
      description: 'Buildings, rooms, and resource allocation',
      icon: Building,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      items: [
        { label: 'Institutes', href: '/admin/institutes', icon: Landmark, description: 'Institute management' },
        { label: 'Buildings', href: '/admin/buildings', icon: Building, description: 'Building management' },
        { label: 'Rooms', href: '/admin/rooms', icon: DoorOpen, description: 'Room management' },
        { label: 'Committees', href: '/admin/committees', icon: CommitteeIcon, description: 'Committee structure' },
        { label: 'Resource Allocation', href: '/admin/resource-allocation', icon: ResourceIcon, description: 'Resource booking' }
      ]
    },
    {
      title: 'Analytics & Operations',
      description: 'Reports, analytics, and system operations',
      icon: BarChart3,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      items: [
        { label: 'Reports & Analytics', href: '/admin/reporting-analytics', icon: BarChart3, description: 'Data insights' },
        { label: 'Feedback Analysis', href: '/admin/feedback-analysis', icon: BotMessageSquare, description: 'AI feedback analysis' },
        { label: 'Project Fair Events', href: '/admin/project-fair/events', icon: Briefcase, description: 'Project management' },
        { label: 'System Settings', href: '/admin/settings', icon: Settings, description: 'System configuration' },
        { label: 'Blog Management', href: '/posts/en', icon: Newspaper, description: 'Content management' }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Hub</h1>
          <p className="text-muted-foreground mt-1">
            Complete administration center - access all system features and management tools
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600">
            <Activity className="w-3 h-3 mr-1" />
            System Online
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Preference collection in progress
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFaculty}</div>
            <p className="text-xs text-muted-foreground">
              Registered faculty members
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated Timetables</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.generatedTimetables}</div>
            <p className="text-xs text-muted-foreground">
              This academic year
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common tasks and workflows for timetable management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} href={action.href}>
                  <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{action.title}</h3>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {managementSections.map((section, index) => {
          const SectionIcon = section.icon;
          return (
            <Card key={index} className="group hover:shadow-lg transition-shadow">
              <CardHeader className={`${section.bgColor} rounded-t-lg`}>
                <CardTitle className="flex items-center gap-2">
                  <SectionIcon className={`h-5 w-5 ${section.color}`} />
                  {section.title}
                </CardTitle>
                <CardDescription className="dark:text-gray-300">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const ItemIcon = item.icon;
                    return (
                      <Link key={itemIndex} href={item.href}>
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                          <div className="flex items-center gap-3 flex-1">
                            <ItemIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{item.label}</span>
                                {item.badge && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Timetable Engine</p>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                <Brain className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">AI Optimization</p>
                <p className="text-xs text-muted-foreground">Ready</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Analytics</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Faculty Dashboard Component
const FacultyDashboard = ({ currentUser }: { currentUser: User }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {currentUser.name}!</h1>
          <p className="text-muted-foreground mt-1">
            Faculty Dashboard - Manage your courses, timetable, and academic activities
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600">
          <Activity className="w-3 h-3 mr-1" />
          Faculty Portal
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">Active this semester</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Students</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Timetable</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">Hours this week</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Attendance & grading</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/faculty/timetable">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Clock className="h-4 w-4" />
                View My Timetable
              </Button>
            </Link>
            <Link href="/faculty/attendance/mark">
              <Button variant="outline" className="w-full justify-start gap-2">
                <CalendarCheck className="h-4 w-4" />
                Mark Attendance
              </Button>
            </Link>
            <Link href="/faculty/my-courses">
              <Button variant="outline" className="w-full justify-start gap-2">
                <BookOpen className="h-4 w-4" />
                My Courses
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Attendance marked for CSE-301</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">New timetable generated</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentUser.email && (
        <PasswordChangeForm 
          userEmail={currentUser.email} 
          variant="dialog"
          trigger={
            <Button variant="outline" className="w-full sm:w-auto">
              <Settings className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          }
        />
      )}
    </div>
  );
};

// Student Dashboard Component
const StudentDashboard = ({ currentUser }: { currentUser: User }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {currentUser.name}!</h1>
          <p className="text-muted-foreground mt-1">
            Student Dashboard - Access your courses, timetable, and academic information
          </p>
        </div>
        <Badge variant="outline" className="text-green-600">
          <Activity className="w-3 h-3 mr-1" />
          Student Portal
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Enrolled this semester</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <CalendarCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Overall attendance</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Pending submissions</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grades</CardTitle>
            <Award className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">A-</div>
            <p className="text-xs text-muted-foreground">Current GPA</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/student/timetable">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Clock className="h-4 w-4" />
                View My Timetable
              </Button>
            </Link>
            <Link href="/student/courses">
              <Button variant="outline" className="w-full justify-start gap-2">
                <BookOpen className="h-4 w-4" />
                My Courses
              </Button>
            </Link>
            <Link href="/student/assignments">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                Assignments
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                <Calendar className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Database Systems Exam</p>
                  <p className="text-xs text-muted-foreground">Tomorrow, 10:00 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                <FileText className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Web Development Assignment Due</p>
                  <p className="text-xs text-muted-foreground">In 3 days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentUser.email && (
        <PasswordChangeForm 
          userEmail={currentUser.email} 
          variant="dialog"
          trigger={
            <Button variant="outline" className="w-full sm:w-auto">
              <Settings className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          }
        />
      )}
    </div>
  );
};

// HOD Dashboard Component
const HODDashboard = ({ currentUser }: { currentUser: User }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {currentUser.name}!</h1>
          <p className="text-muted-foreground mt-1">
            Head of Department Dashboard - Manage your department and academic activities
          </p>
        </div>
        <Badge variant="outline" className="text-purple-600">
          <Activity className="w-3 h-3 mr-1" />
          HOD Portal
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Department Faculty</CardTitle>
            <UserCog className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Active faculty members</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Department Students</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">456</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Department Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/hod/timetable">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Clock className="h-4 w-4" />
                Department Timetable
              </Button>
            </Link>
            <Link href="/admin/faculty">
              <Button variant="outline" className="w-full justify-start gap-2">
                <UserCog className="h-4 w-4" />
                Faculty Management
              </Button>
            </Link>
            <Link href="/admin/students">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                Student Management
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                <Target className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Timetable generation completed</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                <Users className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">New faculty member joined</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentUser.email && (
        <PasswordChangeForm 
          userEmail={currentUser.email} 
          variant="dialog"
          trigger={
            <Button variant="outline" className="w-full sm:w-auto">
              <Settings className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          }
        />
      )}
    </div>
  );
};

// Default Dashboard Component
const DefaultDashboard = ({ currentUser }: { currentUser: User }) => {
  const displayActiveRole = currentUser.activeRole.charAt(0).toUpperCase() + currentUser.activeRole.slice(1).replace(/_/g, ' ');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {currentUser.name}!</h1>
          <p className="text-muted-foreground mt-1">
            Your dashboard for {displayActiveRole} role
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Welcome to the system. Your current role is {displayActiveRole}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Contact your administrator if you need access to additional features or have questions about your account.
          </p>
        </CardContent>
      </Card>

      {currentUser.email && (
        <PasswordChangeForm 
          userEmail={currentUser.email} 
          variant="dialog"
          trigger={
            <Button variant="outline" className="w-full sm:w-auto">
              <Settings className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          }
        />
      )}
    </div>
  );
};

export default DashboardPage;