"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building,
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  GraduationCap,
  Award,
  Target,
  Briefcase,
  MessageSquare,
  Bell,
  ChevronRight,
  ChevronDown,
  Home
} from "lucide-react";

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  subItems?: {
    title: string;
    href: string;
    description?: string;
  }[];
}

interface HODNavigationProps {
  className?: string;
  compact?: boolean;
}

export function HODNavigation({ className = "", compact = false }: HODNavigationProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(['main']);

  const navigationItems: NavigationItem[] = [
    {
      title: "Dashboard",
      href: "/hod/dashboard",
      icon: Home,
      description: "Department overview and key metrics"
    },
    {
      title: "Students",
      href: "/hod/students",
      icon: Users,
      description: "Manage department students",
      badge: { text: "480", variant: "secondary" },
      subItems: [
        { title: "Student List", href: "/hod/students", description: "View all department students" },
        { title: "Admissions", href: "/hod/students/admissions", description: "Manage new admissions" },
        { title: "Academic Progress", href: "/hod/students/progress", description: "Track student performance" },
        { title: "At Risk Students", href: "/hod/students/at-risk", description: "Students needing attention" }
      ]
    },
    {
      title: "Faculty",
      href: "/hod/faculty",
      icon: UserCheck,
      description: "Manage department faculty",
      badge: { text: "24", variant: "secondary" },
      subItems: [
        { title: "Faculty List", href: "/hod/faculty", description: "View all department faculty" },
        { title: "Workload Management", href: "/hod/faculty/workload", description: "Balance teaching assignments" },
        { title: "Performance Review", href: "/hod/faculty/performance", description: "Faculty evaluation and feedback" },
        { title: "Leave Management", href: "/hod/faculty/leaves", description: "Approve and track leaves" }
      ]
    },
    {
      title: "Courses",
      href: "/hod/courses",
      icon: BookOpen,
      description: "Manage course offerings",
      badge: { text: "18", variant: "secondary" },
      subItems: [
        { title: "Course Offerings", href: "/hod/courses", description: "Department course catalog" },
        { title: "Curriculum Planning", href: "/hod/courses/curriculum", description: "Plan academic curriculum" },
        { title: "Course Assignments", href: "/hod/courses/assignments", description: "Assign courses to faculty" },
        { title: "Course Materials", href: "/hod/courses/materials", description: "Manage learning resources" }
      ]
    },
    {
      title: "Timetables",
      href: "/hod/timetables",
      icon: Calendar,
      description: "Manage department schedules",
      badge: { text: "3", variant: "destructive" },
      subItems: [
        { title: "Current Timetables", href: "/hod/timetables", description: "View active schedules" },
        { title: "Timetable Approval", href: "/hod/timetables/approval", description: "Approve pending timetables" },
        { title: "Conflict Resolution", href: "/hod/timetables/conflicts", description: "Resolve scheduling conflicts" },
        { title: "Room Allocation", href: "/hod/timetables/rooms", description: "Manage room assignments" }
      ]
    },
    {
      title: "Committees",
      href: "/hod/committees",
      icon: Target,
      description: "Oversee department committees",
      badge: { text: "5", variant: "secondary" },
      subItems: [
        { title: "Committee Overview", href: "/hod/committees", description: "All department committees" },
        { title: "Committee Meetings", href: "/hod/committees/meetings", description: "Schedule and track meetings" },
        { title: "Committee Reports", href: "/hod/committees/reports", description: "Review committee activities" },
        { title: "Member Management", href: "/hod/committees/members", description: "Manage committee memberships" }
      ]
    },
    {
      title: "Analytics",
      href: "/hod/analytics",
      icon: BarChart3,
      description: "Department insights and reports",
      subItems: [
        { title: "Student Analytics", href: "/hod/analytics/students", description: "Student performance insights" },
        { title: "Faculty Analytics", href: "/hod/analytics/faculty", description: "Faculty workload and performance" },
        { title: "Resource Utilization", href: "/hod/analytics/resources", description: "Room and lab usage statistics" },
        { title: "Department Reports", href: "/hod/analytics/reports", description: "Comprehensive department reports" }
      ]
    },
    {
      title: "Assessments",
      href: "/hod/assessments",
      icon: GraduationCap,
      description: "Oversee department assessments",
      badge: { text: "12", variant: "outline" },
      subItems: [
        { title: "Assessment Overview", href: "/hod/assessments", description: "All department assessments" },
        { title: "Exam Scheduling", href: "/hod/assessments/scheduling", description: "Plan examination schedules" },
        { title: "Results Review", href: "/hod/assessments/results", description: "Review assessment outcomes" },
        { title: "Grade Analysis", href: "/hod/assessments/analysis", description: "Analyze grading patterns" }
      ]
    },
    {
      title: "Resources",
      href: "/hod/resources",
      icon: Briefcase,
      description: "Manage department resources",
      subItems: [
        { title: "Resource Allocation", href: "/hod/resources/allocation", description: "Allocate department resources" },
        { title: "Budget Planning", href: "/hod/resources/budget", description: "Department budget management" },
        { title: "Equipment Management", href: "/hod/resources/equipment", description: "Lab and equipment tracking" },
        { title: "Procurement Requests", href: "/hod/resources/procurement", description: "Submit and track requests" }
      ]
    }
  ];

  const quickActions = [
    {
      title: "Approve Timetable",
      href: "/hod/timetables/approval",
      icon: CheckCircle,
      urgency: "high"
    },
    {
      title: "Review At-Risk Students",
      href: "/hod/students/at-risk",
      icon: AlertTriangle,
      urgency: "medium"
    },
    {
      title: "Faculty Performance",
      href: "/hod/faculty/performance",
      icon: TrendingUp,
      urgency: "low"
    },
    {
      title: "Committee Reports",
      href: "/hod/committees/reports",
      icon: FileText,
      urgency: "low"
    }
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isActive = (href: string) => {
    if (href === "/hod/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const hasActiveSubItem = (item: NavigationItem) => {
    return item.subItems?.some(subItem => pathname.startsWith(subItem.href)) || false;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-red-200 bg-red-50 hover:bg-red-100';
      case 'medium': return 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100';
      default: return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
    }
  };

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        {navigationItems.slice(0, 6).map((item) => {
          const ItemIcon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive(item.href) ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
              >
                <ItemIcon className="h-4 w-4 mr-2" />
                {item.title}
                {item.badge && (
                  <Badge variant={item.badge.variant} className="ml-auto text-xs">
                    {item.badge.text}
                  </Badge>
                )}
              </Button>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Quick Actions</h3>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <div className={`p-3 rounded-lg border transition-colors cursor-pointer ${getUrgencyColor(action.urgency)}`}>
                    <div className="flex items-center gap-2">
                      <ActionIcon className="h-4 w-4" />
                      <span className="text-xs font-medium">{action.title}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-5 w-5" />
            <h3 className="font-semibold">Department Management</h3>
          </div>
          
          <nav className="space-y-1">
            {navigationItems.map((item, index) => {
              const ItemIcon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedSections.includes(item.title.toLowerCase());
              const isItemActive = isActive(item.href) || hasActiveSubItem(item);

              return (
                <div key={item.href}>
                  <div className="flex items-center">
                    {hasSubItems ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 justify-start ${isItemActive ? 'bg-primary/10 text-primary' : ''}`}
                        onClick={() => toggleSection(item.title.toLowerCase())}
                      >
                        <ItemIcon className="h-4 w-4 mr-3" />
                        <span className="flex-1 text-left">{item.title}</span>
                        {item.badge && (
                          <Badge variant={item.badge.variant} className="mx-2 text-xs">
                            {item.badge.text}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <Link href={item.href} className="flex-1">
                        <Button
                          variant={isItemActive ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full justify-start"
                        >
                          <ItemIcon className="h-4 w-4 mr-3" />
                          <span className="flex-1 text-left">{item.title}</span>
                          {item.badge && (
                            <Badge variant={item.badge.variant} className="text-xs">
                              {item.badge.text}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Sub Items */}
                  {hasSubItems && isExpanded && (
                    <div className="ml-7 mt-1 space-y-1">
                      {item.subItems!.map((subItem) => (
                        <Link key={subItem.href} href={subItem.href}>
                          <Button
                            variant={isActive(subItem.href) ? "secondary" : "ghost"}
                            size="sm"
                            className="w-full justify-start text-sm"
                          >
                            <span className="flex-1 text-left">{subItem.title}</span>
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}

                  {index < navigationItems.length - 1 && 
                   [2, 4, 6].includes(index) && (
                    <Separator className="my-2" />
                  )}
                </div>
              );
            })}
          </nav>
        </CardContent>
      </Card>

      {/* Department Info */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <Building className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <h4 className="font-semibold text-sm">Computer Science & Engineering</h4>
            <p className="text-xs text-muted-foreground">Government Polytechnic Palanpur</p>
            <div className="flex justify-center gap-4 mt-3 text-xs">
              <div className="text-center">
                <div className="font-semibold">480</div>
                <div className="text-muted-foreground">Students</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">24</div>
                <div className="text-muted-foreground">Faculty</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">18</div>
                <div className="text-muted-foreground">Courses</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HODNavigation;