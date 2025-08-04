'use client';

/**
 * Analytics Dashboard Component - RBAC analytics and insights
 * Provides comprehensive analytics, reporting, and insights for the RBAC system
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Key, 
  Shield, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Calendar,
  Target,
  PieChart
} from 'lucide-react';

// Types
import type { UserRole } from '@/types/entities';

interface AnalyticsDashboardProps {
  currentUser: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
  };
}

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalRoles: number;
    activeRoles: number;
    totalPermissions: number;
    securityEvents: number;
    complianceScore: number;
    riskScore: number;
  };
  trends: {
    userGrowth: number;
    roleUsage: number;
    securityIncidents: number;
    complianceImprovement: number;
  };
  usage: {
    topRoles: Array<{ name: string; users: number; percentage: number }>;
    topPermissions: Array<{ name: string; usage: number; percentage: number }>;
    deviceTypes: Array<{ type: string; count: number; percentage: number }>;
    loginPatterns: Array<{ hour: number; count: number }>;
  };
  security: {
    riskDistribution: Array<{ level: string; count: number; percentage: number }>;
    threatsByType: Array<{ type: string; count: number; resolved: number }>;
    mfaAdoption: { enabled: number; total: number; percentage: number };
    accessPatterns: Array<{ pattern: string; frequency: number; risk: string }>;
  };
  compliance: {
    frameworks: Array<{ name: string; status: string; score: number }>;
    violations: Array<{ type: string; count: number; severity: string }>;
    audits: Array<{ date: string; score: number; status: string }>;
  };
}

export function AnalyticsDashboard({ currentUser }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/rbac/analytics?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to load analytics data');
      
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      console.error('Analytics data loading error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Permission checks
  const canViewAnalytics = currentUser.permissions.includes('rbac.analytics.view') || 
                          currentUser.role === 'super_admin';

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (!canViewAnalytics) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to view analytics data.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading && !data) {
    return <AnalyticsDashboardSkeleton />;
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No analytics data available. {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            RBAC system analytics, insights, and performance metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => loadAnalyticsData(true)} disabled={refreshing}>
            {refreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.totalUsers}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getTrendIcon(data.trends.userGrowth)}
                  <span className={getTrendColor(data.trends.userGrowth)}>
                    {data.trends.userGrowth > 0 ? '+' : ''}{data.trends.userGrowth}%
                  </span>
                  <span>from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.activeRoles}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getTrendIcon(data.trends.roleUsage)}
                  <span className={getTrendColor(data.trends.roleUsage)}>
                    {data.trends.roleUsage > 0 ? '+' : ''}{data.trends.roleUsage}%
                  </span>
                  <span>usage change</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.riskScore}/100</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getTrendIcon(data.trends.securityIncidents * -1)}
                  <span className={getTrendColor(data.trends.securityIncidents * -1)}>
                    {data.trends.securityIncidents > 0 ? '+' : ''}{data.trends.securityIncidents}
                  </span>
                  <span>incidents</span>
                </div>
                <Progress value={data.overview.riskScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.complianceScore}%</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getTrendIcon(data.trends.complianceImprovement)}
                  <span className={getTrendColor(data.trends.complianceImprovement)}>
                    {data.trends.complianceImprovement > 0 ? '+' : ''}{data.trends.complianceImprovement}%
                  </span>
                  <span>improvement</span>
                </div>
                <Progress value={data.overview.complianceScore} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Additional Overview Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Overall RBAC system status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Users</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{data.overview.activeUsers}</span>
                      <Badge variant="default">
                        {Math.round((data.overview.activeUsers / data.overview.totalUsers) * 100)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security Events</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{data.overview.securityEvents}</span>
                      <Badge variant={data.overview.securityEvents > 100 ? 'destructive' : 'default'}>
                        {data.overview.securityEvents > 100 ? 'High' : 'Normal'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Permissions</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{data.overview.totalPermissions}</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Insights</CardTitle>
                <CardDescription>Key findings and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.trends.userGrowth > 10 && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium">High user growth</span>
                        <p className="text-muted-foreground">Consider scaling role management processes</p>
                      </div>
                    </div>
                  )}
                  
                  {data.overview.riskScore > 70 && (
                    <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium">Elevated risk score</span>
                        <p className="text-muted-foreground">Review security policies and access controls</p>
                      </div>
                    </div>
                  )}
                  
                  {data.overview.complianceScore < 80 && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                      <Shield className="h-4 w-4 text-red-600 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium">Compliance gap</span>
                        <p className="text-muted-foreground">Address compliance violations to improve score</p>
                      </div>
                    </div>
                  )}
                  
                  {data.trends.userGrowth <= 10 && data.overview.riskScore <= 70 && data.overview.complianceScore >= 80 && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium">System healthy</span>
                        <p className="text-muted-foreground">All metrics within acceptable ranges</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Roles by Users</CardTitle>
                <CardDescription>Most assigned roles in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.usage.topRoles.map((role, index) => (
                    <div key={role.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium">{role.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{role.users}</span>
                        <Badge variant="outline">{role.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Permissions</CardTitle>
                <CardDescription>Most frequently used permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.usage.topPermissions.map((permission, index) => (
                    <div key={permission.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium">{permission.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{permission.usage}</span>
                        <Badge variant="outline">{permission.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Distribution</CardTitle>
                <CardDescription>User access by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.usage.deviceTypes.map((device, index) => (
                    <div key={device.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="text-sm font-medium capitalize">{device.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{device.count}</span>
                        <Badge variant="outline">{device.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Login Patterns</CardTitle>
                <CardDescription>Peak usage hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.usage.loginPatterns
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8)
                    .map((pattern) => (
                      <div key={pattern.hour} className="flex items-center justify-between">
                        <span className="text-sm">
                          {pattern.hour}:00 - {pattern.hour + 1}:00
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(pattern.count / Math.max(...data.usage.loginPatterns.map(p => p.count))) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">{pattern.count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Users by risk level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.security.riskDistribution.map((risk) => (
                    <div key={risk.level} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          risk.level === 'critical' ? 'bg-red-500' :
                          risk.level === 'high' ? 'bg-orange-500' :
                          risk.level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className="text-sm font-medium capitalize">{risk.level}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{risk.count}</span>
                        <Badge variant={risk.level === 'critical' || risk.level === 'high' ? 'destructive' : 'default'}>
                          {risk.percentage}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threat Types</CardTitle>
                <CardDescription>Security events by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.security.threatsByType.map((threat) => (
                    <div key={threat.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {threat.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <Badge variant="outline">{threat.count} total</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{threat.resolved} resolved</span>
                        <span>•</span>
                        <span>{threat.count - threat.resolved} pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>MFA Adoption</CardTitle>
                <CardDescription>Multi-factor authentication usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{data.security.mfaAdoption.percentage}%</div>
                    <p className="text-sm text-muted-foreground">
                      {data.security.mfaAdoption.enabled} of {data.security.mfaAdoption.total} users
                    </p>
                  </div>
                  <Progress value={data.security.mfaAdoption.percentage} className="w-full" />
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-green-600">{data.security.mfaAdoption.enabled}</div>
                      <p className="text-xs text-muted-foreground">Enabled</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-600">
                        {data.security.mfaAdoption.total - data.security.mfaAdoption.enabled}
                      </div>
                      <p className="text-xs text-muted-foreground">Disabled</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Access Patterns</CardTitle>
                <CardDescription>Unusual access behavior detected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.security.accessPatterns.map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="text-sm font-medium">{pattern.pattern}</div>
                        <div className="text-xs text-muted-foreground">
                          Frequency: {pattern.frequency}
                        </div>
                      </div>
                      <Badge variant={
                        pattern.risk === 'high' ? 'destructive' :
                        pattern.risk === 'medium' ? 'secondary' : 'default'
                      }>
                        {pattern.risk} risk
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Frameworks</CardTitle>
                <CardDescription>Status across different compliance standards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {data.compliance.frameworks.map((framework) => (
                    <div key={framework.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{framework.name}</span>
                        <Badge variant={
                          framework.status === 'compliant' ? 'default' :
                          framework.status === 'partial' ? 'secondary' : 'destructive'
                        }>
                          {framework.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Progress value={framework.score} />
                        <div className="text-sm text-muted-foreground">
                          Score: {framework.score}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Violations</CardTitle>
                  <CardDescription>Current violations by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.compliance.violations.map((violation) => (
                      <div key={violation.type} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{violation.type}</div>
                          <div className="text-xs text-muted-foreground">
                            Severity: {violation.severity}
                          </div>
                        </div>
                        <Badge variant={
                          violation.severity === 'critical' ? 'destructive' :
                          violation.severity === 'high' ? 'destructive' :
                          violation.severity === 'medium' ? 'secondary' : 'default'
                        }>
                          {violation.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audit History</CardTitle>
                  <CardDescription>Recent compliance audits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.compliance.audits.map((audit, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">
                            {new Date(audit.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Status: {audit.status}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{audit.score}%</div>
                          <Badge variant={audit.score >= 80 ? 'default' : 'destructive'}>
                            {audit.score >= 80 ? 'Pass' : 'Fail'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Loading Skeleton
function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-8 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AnalyticsDashboard;