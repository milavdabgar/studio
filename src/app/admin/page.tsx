'use client';

import React from 'react';
import Link from 'next/link';
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
  PlusCircle
} from 'lucide-react';

const DashboardPage = () => {
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
      title: 'Timetable Management',
      description: 'Complete timetable automation system',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      items: [
        { label: 'Preference Campaigns', href: '/admin/preference-campaigns', icon: Target, badge: stats.activeCampaigns },
        { label: 'Faculty Preferences', href: '/admin/faculty-preferences', icon: Users },
        { label: 'Course Allocation', href: '/admin/course-allocation', icon: BarChart3, badge: stats.pendingAllocations },
        { label: 'Auto Generate', href: '/admin/timetables/auto-generate', icon: Settings },
        { label: 'View Timetables', href: '/admin/timetables', icon: Clock },
        { label: 'Course Offerings', href: '/admin/course-offerings', icon: BookOpen }
      ]
    },
    {
      title: 'Academic Management',
      description: 'Core academic data and curriculum',
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      items: [
        { label: 'Academic Terms', href: '/admin/academic-terms', icon: Calendar },
        { label: 'Courses', href: '/admin/courses', icon: BookOpen, badge: stats.totalCourses },
        { label: 'Programs', href: '/admin/programs', icon: FileText },
        { label: 'Curriculum', href: '/admin/curriculum', icon: FileText },
        { label: 'Batches', href: '/admin/batches', icon: Users }
      ]
    },
    {
      title: 'User Management',
      description: 'Faculty, students, and user accounts',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      items: [
        { label: 'Faculty', href: '/admin/faculty', icon: UserCheck, badge: stats.totalFaculty },
        { label: 'Students', href: '/admin/students', icon: Users, badge: stats.totalStudents },
        { label: 'Users', href: '/admin/users', icon: Users }
      ]
    },
    {
      title: 'Infrastructure',
      description: 'Buildings, rooms, and facilities',
      icon: Building,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      items: [
        { label: 'Buildings', href: '/admin/buildings', icon: Building },
        { label: 'Rooms', href: '/admin/rooms', icon: Building },
        { label: 'Room Utilization', href: '/admin/rooms/utilization', icon: BarChart3 }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your institution's timetable automation and academic data
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <ItemIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          </div>
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

export default DashboardPage;
