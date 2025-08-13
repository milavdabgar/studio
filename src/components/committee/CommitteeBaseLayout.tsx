"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Users,
  Calendar,
  FileText,
  Bell,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
  Activity,
  RefreshCw,
  Download,
  Plus
} from "lucide-react";

interface CommitteeMetrics {
  totalMembers: number;
  activeTasks: number;
  completedTasks: number;
  pendingApprovals: number;
  upcomingMeetings: number;
  monthlyProgress: number;
  budget?: {
    allocated: number;
    utilized: number;
    remaining: number;
  };
}

interface CommitteeTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assignedTo: string;
  dueDate: Date;
  completionDate?: Date;
}

interface CommitteeMember {
  id: string;
  name: string;
  role: 'convener' | 'co_convener' | 'member' | 'secretary';
  email: string;
  department: string;
  joinDate: Date;
  status: 'active' | 'inactive';
}

interface CommitteeBaseLayoutProps {
  committeeName: string;
  committeeType: 'tpo' | 'ssip' | 'library' | 'it_cwan' | 'academic' | 'administrative';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  metrics: CommitteeMetrics;
  recentTasks: CommitteeTask[];
  members: CommitteeMember[];
  children?: React.ReactNode;
  quickActions: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    action: () => void;
    urgent?: boolean;
  }[];
}

const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = "blue", alert }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  trend?: { value: number; isPositive: boolean };
  color?: string;
  alert?: boolean;
}) => (
  <Card className={`hover:shadow-lg transition-shadow ${alert ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10' : ''}`}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <Badge variant={trend.isPositive ? "default" : "destructive"} className="text-xs">
                {trend.isPositive ? "+" : ""}{trend.value}%
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          <Icon className={`h-6 w-6 text-${color}-500 ${alert ? 'animate-pulse' : ''}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function CommitteeBaseLayout({
  committeeName,
  committeeType,
  description,
  icon: CommitteeIcon,
  color,
  metrics,
  recentTasks,
  members,
  children,
  quickActions
}: CommitteeBaseLayoutProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getStatusColor = (status: CommitteeTask['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: CommitteeTask['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getRoleColor = (role: CommitteeMember['role']) => {
    switch (role) {
      case 'convener': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'co_convener': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'secretary': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'member': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const overdueTasksCount = recentTasks.filter(task => task.status === 'overdue').length;
  const activeMembers = members.filter(member => member.status === 'active').length;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <CommitteeIcon className={`h-6 w-6 sm:h-8 sm:w-8 text-${color}-500`} />
            {committeeName}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {description} • Academic Year 2024-25
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Urgent Alerts */}
      {(overdueTasksCount > 0 || metrics.pendingApprovals > 0) && (
        <div className="space-y-2">
          {overdueTasksCount > 0 && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-red-800 dark:text-red-200">
                    Action Required: {overdueTasksCount} overdue tasks need immediate attention
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          {metrics.pendingApprovals > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="font-medium text-orange-800 dark:text-orange-200">
                    {metrics.pendingApprovals} items pending approval
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-center gap-2 ${
                    action.urgent ? 'border-red-200 bg-red-50 hover:bg-red-100' : ''
                  }`}
                  onClick={action.action}
                >
                  <ActionIcon className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-medium text-xs">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          title="Active Members"
          value={activeMembers}
          subtitle="Committee strength"
          icon={Users}
          color={color}
        />
        <MetricCard
          title="Active Tasks"
          value={metrics.activeTasks}
          subtitle="In progress"
          icon={Activity}
          color="blue"
        />
        <MetricCard
          title="Completed Tasks"
          value={metrics.completedTasks}
          subtitle="This month"
          icon={CheckCircle}
          color="green"
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Pending Approvals"
          value={metrics.pendingApprovals}
          subtitle="Need action"
          icon={Clock}
          color="orange"
          alert={metrics.pendingApprovals > 3}
        />
        <MetricCard
          title="Upcoming Meetings"
          value={metrics.upcomingMeetings}
          subtitle="This week"
          icon={Calendar}
          color="purple"
        />
        <MetricCard
          title="Monthly Progress"
          value={`${metrics.monthlyProgress}%`}
          subtitle="Goal completion"
          icon={TrendingUp}
          color="teal"
        />
      </div>

      {/* Budget Overview (if applicable) */}
      {metrics.budget && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>Financial allocation and utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="font-bold text-2xl text-blue-600">
                  ₹{(metrics.budget.allocated / 100000).toFixed(1)}L
                </div>
                <div className="text-sm text-muted-foreground">Allocated</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-green-600">
                  ₹{(metrics.budget.utilized / 100000).toFixed(1)}L
                </div>
                <div className="text-sm text-muted-foreground">Utilized</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-orange-600">
                  ₹{(metrics.budget.remaining / 100000).toFixed(1)}L
                </div>
                <div className="text-sm text-muted-foreground">Remaining</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Budget Utilization</span>
                <span>{((metrics.budget.utilized / metrics.budget.allocated) * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={(metrics.budget.utilized / metrics.budget.allocated) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Tasks
            </CardTitle>
            <CardDescription>Latest committee activities and assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {task.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : task.status === 'overdue' ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{task.title}</h4>
                      <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Assigned to: {task.assignedTo}</span>
                      <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Due: {task.dueDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Committee Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Committee Members
            </CardTitle>
            <CardDescription>Active committee composition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.filter(member => member.status === 'active').slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{member.name}</h4>
                      <Badge className={`text-xs ${getRoleColor(member.role)}`}>
                        {member.role.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                    <p className="text-xs text-muted-foreground">{member.department}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Joined: {member.joinDate.toLocaleDateString()}
                  </div>
                </div>
              ))}
              {members.filter(member => member.status === 'active').length > 5 && (
                <div className="text-center">
                  <Button variant="outline" size="sm">
                    View All Members ({members.filter(member => member.status === 'active').length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Committee-specific content */}
      {children}
    </div>
  );
}