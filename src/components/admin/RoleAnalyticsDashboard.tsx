"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  Eye,
  UserCog,
  Activity,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RoleAnalyticsData {
  roleDistribution: Array<{
    role: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  departmentRoles: Array<{
    department: string;
    adminCount: number;
    facultyCount: number;
    hodCount: number;
    totalCount: number;
  }>;
  permissionUtilization: Array<{
    permission: string;
    usageCount: number;
    totalRoles: number;
    utilizationRate: number;
  }>;
  roleEffectiveness: Array<{
    role: string;
    activeUsers: number;
    totalUsers: number;
    lastActivity: string;
    effectivenessScore: number;
  }>;
  securityMetrics: {
    overPrivilegedRoles: number;
    unusedRoles: number;
    duplicatePermissions: number;
    complianceScore: number;
  };
  activityTrends: Array<{
    date: string;
    roleAssignments: number;
    permissionChanges: number;
    userActivity: number;
  }>;
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', 
  '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
];

interface RoleAnalyticsDashboardProps {
  className?: string;
}

export default function RoleAnalyticsDashboard({ className = '' }: RoleAnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<RoleAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'distribution' | 'departments' | 'permissions' | 'effectiveness'>('distribution');
  const { toast } = useToast();

  // Mock data for demonstration - in real app, this would come from API
  const mockAnalyticsData: RoleAnalyticsData = {
    roleDistribution: [
      { role: 'Faculty', count: 45, percentage: 35.2, color: '#8884d8' },
      { role: 'Student', count: 38, percentage: 29.7, color: '#82ca9d' },
      { role: 'Admin', count: 18, percentage: 14.1, color: '#ffc658' },
      { role: 'HOD', count: 12, percentage: 9.4, color: '#ff7300' },
      { role: 'Committee', count: 8, percentage: 6.3, color: '#00ff00' },
      { role: 'Other', count: 7, percentage: 5.5, color: '#ff00ff' }
    ],
    departmentRoles: [
      { department: 'Computer Engineering', adminCount: 3, facultyCount: 12, hodCount: 1, totalCount: 16 },
      { department: 'Mechanical Engineering', adminCount: 2, facultyCount: 10, hodCount: 1, totalCount: 13 },
      { department: 'Electrical Engineering', adminCount: 2, facultyCount: 8, hodCount: 1, totalCount: 11 },
      { department: 'Civil Engineering', adminCount: 2, facultyCount: 7, hodCount: 1, totalCount: 10 },
      { department: 'Electronics & Communication', adminCount: 1, facultyCount: 8, hodCount: 1, totalCount: 10 },
      { department: 'Administration', adminCount: 8, facultyCount: 0, hodCount: 0, totalCount: 8 }
    ],
    permissionUtilization: [
      { permission: 'canViewAllDepartments', usageCount: 15, totalRoles: 25, utilizationRate: 60 },
      { permission: 'canDeleteRecords', usageCount: 8, totalRoles: 25, utilizationRate: 32 },
      { permission: 'canManageRoles', usageCount: 5, totalRoles: 25, utilizationRate: 20 },
      { permission: 'canImportData', usageCount: 12, totalRoles: 25, utilizationRate: 48 },
      { permission: 'canExportData', usageCount: 18, totalRoles: 25, utilizationRate: 72 },
      { permission: 'canApproveRequests', usageCount: 7, totalRoles: 25, utilizationRate: 28 }
    ],
    roleEffectiveness: [
      { role: 'Admin', activeUsers: 15, totalUsers: 18, lastActivity: '2 hours ago', effectivenessScore: 83 },
      { role: 'Faculty', activeUsers: 38, totalUsers: 45, lastActivity: '30 minutes ago', effectivenessScore: 84 },
      { role: 'HOD', activeUsers: 11, totalUsers: 12, lastActivity: '1 hour ago', effectivenessScore: 92 },
      { role: 'Student', activeUsers: 32, totalUsers: 38, lastActivity: '15 minutes ago', effectivenessScore: 84 },
      { role: 'Committee', activeUsers: 6, totalUsers: 8, lastActivity: '4 hours ago', effectivenessScore: 75 }
    ],
    securityMetrics: {
      overPrivilegedRoles: 3,
      unusedRoles: 2,
      duplicatePermissions: 5,
      complianceScore: 87
    },
    activityTrends: [
      { date: '2024-01-01', roleAssignments: 12, permissionChanges: 5, userActivity: 156 },
      { date: '2024-01-02', roleAssignments: 8, permissionChanges: 3, userActivity: 189 },
      { date: '2024-01-03', roleAssignments: 15, permissionChanges: 7, userActivity: 203 },
      { date: '2024-01-04', roleAssignments: 11, permissionChanges: 4, userActivity: 167 },
      { date: '2024-01-05', roleAssignments: 19, permissionChanges: 9, userActivity: 234 },
      { date: '2024-01-06', roleAssignments: 14, permissionChanges: 6, userActivity: 198 },
      { date: '2024-01-07', roleAssignments: 16, permissionChanges: 8, userActivity: 221 }
    ]
  };

  useEffect(() => {
    // Simulate API call
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        // In real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAnalyticsData(mockAnalyticsData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load role analytics data."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [toast]);

  const summaryCards = useMemo(() => {
    if (!analyticsData) return [];

    const totalUsers = analyticsData.roleDistribution.reduce((sum, role) => sum + role.count, 0);
    const activeRoles = analyticsData.roleEffectiveness.filter(role => role.effectivenessScore > 75).length;
    const avgEffectiveness = Math.round(
      analyticsData.roleEffectiveness.reduce((sum, role) => sum + role.effectivenessScore, 0) / 
      analyticsData.roleEffectiveness.length
    );

    return [
      {
        title: "Total Users",
        value: totalUsers.toString(),
        description: "Across all roles",
        icon: Users,
        trend: "+12% from last month"
      },
      {
        title: "Active Roles",
        value: `${activeRoles}/${analyticsData.roleEffectiveness.length}`,
        description: "Roles with >75% effectiveness",
        icon: CheckCircle,
        trend: "2 new roles this month"
      },
      {
        title: "Avg Effectiveness",
        value: `${avgEffectiveness}%`,
        description: "Role utilization rate",
        icon: TrendingUp,
        trend: "+5% improvement"
      },
      {
        title: "Compliance Score",
        value: `${analyticsData.securityMetrics.complianceScore}%`,
        description: "Security compliance",
        icon: Shield,
        trend: analyticsData.securityMetrics.complianceScore > 85 ? "Excellent" : "Needs attention"
      }
    ];
  }, [analyticsData]);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">No Analytics Data</h3>
        <p className="text-muted-foreground">Unable to load role analytics data.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
                <div className="text-xs text-green-600 mt-1">{card.trend}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Security Alerts */}
      {analyticsData.securityMetrics.overPrivilegedRoles > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5" />
              Security Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analyticsData.securityMetrics.overPrivilegedRoles > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Over-privileged roles detected</span>
                <Badge variant="destructive">{analyticsData.securityMetrics.overPrivilegedRoles}</Badge>
              </div>
            )}
            {analyticsData.securityMetrics.unusedRoles > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Unused roles found</span>
                <Badge variant="secondary">{analyticsData.securityMetrics.unusedRoles}</Badge>
              </div>
            )}
            {analyticsData.securityMetrics.duplicatePermissions > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Duplicate permissions</span>
                <Badge variant="outline">{analyticsData.securityMetrics.duplicatePermissions}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Analytics */}
      <Tabs value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="distribution">Role Distribution</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="effectiveness">Effectiveness</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
                <CardDescription>Overview of all role assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.roleDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ role, percentage }) => `${role} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Counts</CardTitle>
                <CardDescription>Detailed breakdown by role type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.roleDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Role Distribution</CardTitle>
              <CardDescription>Role assignments across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.departmentRoles}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="adminCount" stackId="a" fill="#8884d8" name="Admin" />
                  <Bar dataKey="facultyCount" stackId="a" fill="#82ca9d" name="Faculty" />
                  <Bar dataKey="hodCount" stackId="a" fill="#ffc658" name="HOD" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Utilization</CardTitle>
              <CardDescription>How frequently permissions are used across roles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyticsData.permissionUtilization.map((perm, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{perm.permission}</span>
                    <span className="text-sm text-muted-foreground">
                      {perm.usageCount}/{perm.totalRoles} roles
                    </span>
                  </div>
                  <Progress value={perm.utilizationRate} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {perm.utilizationRate}% utilization rate
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effectiveness" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Role Effectiveness</CardTitle>
                <CardDescription>Active users vs total assigned users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.roleEffectiveness.map((role, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{role.role}</span>
                      <Badge variant={role.effectivenessScore > 85 ? "default" : role.effectivenessScore > 75 ? "secondary" : "destructive"}>
                        {role.effectivenessScore}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{role.activeUsers}/{role.totalUsers} active</span>
                      <span>Last activity: {role.lastActivity}</span>
                    </div>
                    <Progress value={role.effectivenessScore} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Trends</CardTitle>
                <CardDescription>Role assignments and user activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.activityTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="roleAssignments" stroke="#8884d8" name="Role Assignments" />
                    <Line type="monotone" dataKey="userActivity" stroke="#82ca9d" name="User Activity" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { RoleAnalyticsDashboard };