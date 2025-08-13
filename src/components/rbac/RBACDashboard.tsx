'use client';

/**
 * RBAC Dashboard - Main dashboard component for RBAC management
 * Provides comprehensive view of users, roles, permissions, and security analytics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  Users, 
  Key, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Lock,
  UserCheck,
  Settings,
  BarChart3
} from 'lucide-react';

// RBAC Component imports
import { UserManagement } from './UserManagement';
import { RoleManagement } from './RoleManagement';
import { PermissionManagement } from './PermissionManagement';
import { SecurityMonitor } from './SecurityMonitor';
import { ComplianceDashboard } from './ComplianceDashboard';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { RBACSettings } from './RBACSettings';

// Types
import type { UserRole } from '@/types/entities';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    highRisk: number;
    mfaEnabled: number;
  };
  roles: {
    total: number;
    active: number;
    temporary: number;
    requiresApproval: number;
  };
  permissions: {
    total: number;
    inherited: number;
    delegated: number;
    expired: number;
  };
  security: {
    events: number;
    violations: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    lastIncident?: Date;
  };
}

interface RBACDashboardProps {
  currentUser: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
  };
  className?: string;
}

export function RBACDashboard({ currentUser, className = '' }: RBACDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard statistics
  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/rbac/dashboard/stats');
      if (!response.ok) throw new Error('Failed to load dashboard stats');
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const canAccess = (permission: string): boolean => {
    return currentUser.permissions.includes(permission) || 
           currentUser.role === 'super_admin';
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Alert className="max-w-2xl mx-auto mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load RBAC dashboard: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            RBAC Management
          </h1>
          <p className="text-muted-foreground">
            Role-Based Access Control dashboard for system security management
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={stats?.security.riskLevel === 'low' ? 'default' : 'destructive'}>
            Risk: {stats?.security.riskLevel || 'Unknown'}
          </Badge>
          {canAccess('rbac.settings.manage') && (
            <RBACSettings currentUser={currentUser} />
          )}
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          
          {canAccess('rbac.users.view') && (
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          )}
          
          {canAccess('rbac.roles.view') && (
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Roles
            </TabsTrigger>
          )}
          
          {canAccess('rbac.permissions.view') && (
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Permissions
            </TabsTrigger>
          )}
          
          {canAccess('rbac.security.view') && (
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
          )}
          
          {canAccess('rbac.compliance.view') && (
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Compliance
            </TabsTrigger>
          )}
          
          {canAccess('rbac.analytics.view') && (
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <DashboardOverview stats={stats} currentUser={currentUser} />
        </TabsContent>

        {/* Users Tab */}
        {canAccess('rbac.users.view') && (
          <TabsContent value="users" className="space-y-4">
            <UserManagement currentUser={currentUser} />
          </TabsContent>
        )}

        {/* Roles Tab */}
        {canAccess('rbac.roles.view') && (
          <TabsContent value="roles" className="space-y-4">
            <RoleManagement currentUser={currentUser} />
          </TabsContent>
        )}

        {/* Permissions Tab */}
        {canAccess('rbac.permissions.view') && (
          <TabsContent value="permissions" className="space-y-4">
            <PermissionManagement currentUser={currentUser} />
          </TabsContent>
        )}

        {/* Security Tab */}
        {canAccess('rbac.security.view') && (
          <TabsContent value="security" className="space-y-4">
            <SecurityMonitor currentUser={currentUser} />
          </TabsContent>
        )}

        {/* Compliance Tab */}
        {canAccess('rbac.compliance.view') && (
          <TabsContent value="compliance" className="space-y-4">
            <ComplianceDashboard currentUser={currentUser} />
          </TabsContent>
        )}

        {/* Analytics Tab */}
        {canAccess('rbac.analytics.view') && (
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard currentUser={currentUser} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Dashboard Overview Component
function DashboardOverview({ 
  stats, 
  currentUser 
}: { 
  stats: DashboardStats | null; 
  currentUser: RBACDashboardProps['currentUser'];
}) {
  if (!stats) return null;

  const riskLevelColor = {
    low: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    critical: 'text-red-600 bg-red-50 border-red-200'
  };

  return (
    <div className="grid gap-6">
      {/* Stats Cards Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.users.active} active, {stats.users.highRisk} high-risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.roles.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.roles.total} total, {stats.roles.temporary} temporary
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.permissions.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.permissions.inherited} inherited, {stats.permissions.delegated} delegated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold capitalize ${riskLevelColor[stats.security.riskLevel]?.split(' ')[0]}`}>
              {stats.security.riskLevel}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.security.violations} violations, {stats.security.events} events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards Row 2 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MFA Adoption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.users.mfaEnabled}</div>
                <p className="text-sm text-muted-foreground">
                  of {stats.users.total} users
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">
                  {Math.round((stats.users.mfaEnabled / stats.users.total) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.roles.requiresApproval}</div>
                <p className="text-sm text-muted-foreground">
                  roles require approval
                </p>
              </div>
              <Badge variant="outline">
                {Math.round((stats.roles.requiresApproval / stats.roles.total) * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permission Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Active</span>
                <span className="text-sm font-medium">
                  {stats.permissions.total - stats.permissions.expired}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Expired</span>
                <Badge variant={stats.permissions.expired > 0 ? 'destructive' : 'default'}>
                  {stats.permissions.expired}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      {stats.security.lastIncident && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Recent Security Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Last security incident: {stats.security.lastIncident.toLocaleDateString()}
            </p>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline">{stats.security.events} events today</Badge>
              <Badge variant={stats.security.violations > 0 ? 'destructive' : 'default'}>
                {stats.security.violations} violations
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default RBACDashboard;