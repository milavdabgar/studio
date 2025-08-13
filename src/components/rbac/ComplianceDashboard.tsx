'use client';

/**
 * Compliance Dashboard Component - RBAC compliance monitoring and reporting
 * Provides comprehensive compliance tracking, reporting, and audit capabilities
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Shield, 
  Download,
  RefreshCw,
  Calendar,
  FileText,
  Target,
  Award,
  Clock,
  TrendingUp,
  Users,
  Key
} from 'lucide-react';

// Types
import type { UserRole } from '@/types/entities';

interface ComplianceDashboardProps {
  currentUser: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
  };
}

interface ComplianceData {
  overall: {
    score: number;
    status: 'compliant' | 'partial' | 'non_compliant';
    lastAudit: Date;
    nextAudit: Date;
  };
  frameworks: Array<{
    name: string;
    status: 'compliant' | 'partial' | 'non_compliant';
    score: number;
    requirements: number;
    violations: number;
    lastAssessment: Date;
  }>;
  violations: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedUsers: number;
    detectedAt: Date;
    status: 'open' | 'acknowledged' | 'resolved';
    dueDate?: Date;
  }>;
  audits: Array<{
    id: string;
    date: Date;
    auditor: string;
    scope: string;
    score: number;
    status: 'completed' | 'in_progress' | 'scheduled';
    findings: number;
  }>;
  controls: Array<{
    id: string;
    name: string;
    framework: string;
    status: 'effective' | 'partially_effective' | 'ineffective';
    lastTested: Date;
    effectiveness: number;
  }>;
}

export function ComplianceDashboard({ currentUser }: ComplianceDashboardProps) {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Load compliance data
  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      
      const response = await fetch('/api/rbac/compliance');
      if (!response.ok) throw new Error('Failed to load compliance data');
      
      const complianceData = await response.json();
      setData(complianceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance data');
      console.error('Compliance data loading error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Permission checks
  const canViewCompliance = currentUser.permissions.includes('rbac.compliance.view') || 
                           currentUser.role === 'super_admin';
  const canManageCompliance = currentUser.permissions.includes('rbac.compliance.manage') || 
                             currentUser.role === 'super_admin';

  const getStatusBadge = (status: string) => {
    const variants = {
      compliant: 'default',
      partial: 'secondary',
      non_compliant: 'destructive',
      effective: 'default',
      partially_effective: 'secondary',
      ineffective: 'destructive'
    } as const;

    const icons = {
      compliant: CheckCircle,
      partial: AlertTriangle,
      non_compliant: XCircle,
      effective: CheckCircle,
      partially_effective: AlertTriangle,
      ineffective: XCircle
    };

    const Icon = icons[status as keyof typeof icons] || CheckCircle;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive',
      critical: 'destructive'
    } as const;

    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'default'}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  if (!canViewCompliance) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to view compliance data.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading && !data) {
    return <ComplianceDashboardSkeleton />;
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No compliance data available. {error}
        </AlertDescription>
      </Alert>
    );
  }

  const filteredFrameworks = selectedFramework === 'all' 
    ? data.frameworks 
    : data.frameworks.filter(f => f.name === selectedFramework);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Compliance Dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor compliance status, violations, and audit requirements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedFramework} onValueChange={setSelectedFramework}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frameworks</SelectItem>
              {data.frameworks.map((framework) => (
                <SelectItem key={framework.name} value={framework.name}>
                  {framework.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => loadComplianceData(true)} disabled={refreshing}>
            {refreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>

          {canManageCompliance && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Overall Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{data.overall.score}%</div>
              <div className="mb-2">{getStatusBadge(data.overall.status)}</div>
              <Progress value={data.overall.score} className="w-full" />
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Last Audit</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(data.overall.lastAudit).toLocaleDateString()}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Next Audit</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {new Date(data.overall.nextAudit).toLocaleDateString()}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Active Violations</div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">
                  {data.violations.filter(v => v.status === 'open').length}
                </Badge>
                <span className="text-sm text-muted-foreground">require attention</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Framework Status */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Frameworks</CardTitle>
          <CardDescription>
            Status across different compliance standards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFrameworks.map((framework) => (
              <Card key={framework.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{framework.name}</CardTitle>
                    {getStatusBadge(framework.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Score</span>
                        <span className="text-sm font-medium">{framework.score}%</span>
                      </div>
                      <Progress value={framework.score} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Requirements</div>
                        <div className="font-medium">{framework.requirements}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Violations</div>
                        <div className={`font-medium ${framework.violations > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {framework.violations}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Last assessed: {new Date(framework.lastAssessment).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Violations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Violations
          </CardTitle>
          <CardDescription>
            Compliance violations requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.violations.filter(v => v.status === 'open').length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <div className="text-lg font-semibold">No Active Violations</div>
              <p className="text-muted-foreground">All compliance requirements are currently met.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Violation</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Affected Users</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.violations
                    .filter(v => v.status === 'open')
                    .map((violation) => (
                      <TableRow key={violation.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{violation.type}</div>
                            <div className="text-sm text-muted-foreground max-w-xs truncate">
                              {violation.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getSeverityBadge(violation.severity)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {violation.affectedUsers}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {new Date(violation.detectedAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {violation.dueDate ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {new Date(violation.dueDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={violation.status === 'open' ? 'destructive' : 'secondary'}>
                            {violation.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle>Control Effectiveness</CardTitle>
          <CardDescription>
            Status of security controls across frameworks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.controls.map((control) => (
              <div key={control.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{control.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Framework: {control.framework}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{control.effectiveness}%</div>
                    <div className="text-xs text-muted-foreground">
                      Tested: {new Date(control.lastTested).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="w-20">
                    <Progress value={control.effectiveness} />
                  </div>
                  
                  {getStatusBadge(control.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit History
          </CardTitle>
          <CardDescription>
            Recent and upcoming compliance audits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Auditor</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Findings</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(audit.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{audit.auditor}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{audit.scope}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{audit.score}%</span>
                        <Progress value={audit.score} className="w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={audit.findings > 0 ? 'destructive' : 'default'}>
                        {audit.findings} findings
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        audit.status === 'completed' ? 'default' :
                        audit.status === 'in_progress' ? 'secondary' : 'outline'
                      }>
                        {audit.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading Skeleton
function ComplianceDashboardSkeleton() {
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
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center space-y-2">
              <Skeleton className="h-12 w-16 mx-auto" />
              <Skeleton className="h-6 w-20 mx-auto" />
              <Skeleton className="h-2 w-full" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-16" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-2 w-full" />
                    <div className="grid grid-cols-2 gap-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                    <Skeleton className="h-3 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ComplianceDashboard;