'use client';

/**
 * Security Monitor Component - RBAC security monitoring and threat detection
 * Provides real-time security monitoring, threat detection, and incident response
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Shield, 
  Search, 
  AlertTriangle, 
  Activity,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  MapPin,
  Smartphone,
  Lock,
  Unlock,
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
  MoreHorizontal
} from 'lucide-react';

// Types
import type { UserRole } from '@/types/entities';
import type { ISecurityEvent } from '@/lib/auth/rbac-models';

interface SecurityMonitorProps {
  currentUser: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
  };
}

interface SecurityEventItem extends ISecurityEvent {
  _id: string;
  userName?: string;
  userEmail?: string;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  resolvedEvents: number;
  averageResponseTime: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  activeThreats: number;
  blockedAttempts: number;
  riskScore: number;
}

interface SecurityFilters {
  search: string;
  eventType: string;
  severity: string;
  status: string;
  timeRange: string;
}

export function SecurityMonitor({ currentUser }: SecurityMonitorProps) {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SecurityFilters>({
    search: '',
    eventType: 'all',
    severity: 'all',
    status: 'all',
    timeRange: '24h'
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load data on component mount and set up auto-refresh
  useEffect(() => {
    loadSecurityData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [eventsResponse, metricsResponse] = await Promise.all([
        fetch('/api/rbac/security/events'),
        fetch('/api/rbac/security/metrics')
      ]);

      if (!eventsResponse.ok || !metricsResponse.ok) {
        throw new Error('Failed to load security data');
      }
      
      const eventsData = await eventsResponse.json();
      const metricsData = await metricsResponse.json();
      
      setEvents(eventsData.events || []);
      setMetrics(metricsData.metrics || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security data');
      console.error('Security data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Permission checks
  const canViewSecurity = currentUser.permissions.includes('rbac.security.view') || 
                         currentUser.role === 'super_admin';
  const canManageSecurity = currentUser.permissions.includes('rbac.security.manage') || 
                           currentUser.role === 'super_admin';

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = filters.search === '' || 
        event.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.userName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.userEmail?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesType = filters.eventType === 'all' || event.eventType === filters.eventType;
      const matchesSeverity = filters.severity === 'all' || event.severity === filters.severity;
      const matchesStatus = filters.status === 'all' ||
        (filters.status === 'resolved' && event.isResolved) ||
        (filters.status === 'unresolved' && !event.isResolved);
      
      // Time range filter
      const now = new Date();
      const eventTime = new Date(event.timestamp);
      let timeMatch = true;
      
      switch (filters.timeRange) {
        case '1h':
          timeMatch = (now.getTime() - eventTime.getTime()) <= 60 * 60 * 1000;
          break;
        case '24h':
          timeMatch = (now.getTime() - eventTime.getTime()) <= 24 * 60 * 60 * 1000;
          break;
        case '7d':
          timeMatch = (now.getTime() - eventTime.getTime()) <= 7 * 24 * 60 * 60 * 1000;
          break;
        case '30d':
          timeMatch = (now.getTime() - eventTime.getTime()) <= 30 * 24 * 60 * 60 * 1000;
          break;
      }

      return matchesSearch && matchesType && matchesSeverity && matchesStatus && timeMatch;
    });
  }, [events, filters]);

  const handleEventAction = async (action: string, eventId: string) => {
    try {
      const response = await fetch(`/api/rbac/security/events/${eventId}/${action}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error(`Failed to ${action} event`);
      
      await loadSecurityData(); // Reload data after action
    } catch (err) {
      console.error(`Event ${action} error:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${action} event`);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive',
      critical: 'destructive'
    } as const;

    const icons = {
      low: CheckCircle,
      medium: AlertCircle,
      high: AlertTriangle,
      critical: XCircle
    };

    const Icon = icons[severity as keyof typeof icons] || CheckCircle;

    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'default'} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const getEventTypeBadge = (eventType: string) => {
    const colors = {
      login_attempt: 'bg-blue-50 text-blue-700 border-blue-200',
      permission_denied: 'bg-red-50 text-red-700 border-red-200',
      privilege_escalation: 'bg-orange-50 text-orange-700 border-orange-200',
      suspicious_activity: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      policy_violation: 'bg-purple-50 text-purple-700 border-purple-200',
      emergency_access: 'bg-pink-50 text-pink-700 border-pink-200'
    };

    return (
      <Badge variant="outline" className={colors[eventType as keyof typeof colors] || ''}>
        {eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getThreatLevelColor = (level: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[level as keyof typeof colors] || 'text-gray-600';
  };

  if (!canViewSecurity) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to view security monitoring data.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading && !metrics) {
    return <SecurityMonitorSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Monitor
          </h2>
          <p className="text-muted-foreground">
            Real-time security monitoring and threat detection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          
          {canManageSecurity && (
            <Button onClick={loadSecurityData} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
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

      {/* Security Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Threat Level</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold capitalize ${getThreatLevelColor(metrics.threatLevel)}`}>
                {metrics.threatLevel}
              </div>
              <p className="text-xs text-muted-foreground">
                Risk Score: {metrics.riskScore}/100
              </p>
              <Progress value={metrics.riskScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.criticalEvents} critical, {metrics.resolvedEvents} resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeThreats}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.blockedAttempts} blocked attempts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageResponseTime}m</div>
              <p className="text-xs text-muted-foreground">
                Average response time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Security Events
          </TabsTrigger>
          <TabsTrigger value="threats" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Active Threats
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search events..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select value={filters.eventType} onValueChange={(value) => setFilters(prev => ({ ...prev, eventType: value }))}>
                    <SelectTrigger id="eventType">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="login_attempt">Login Attempt</SelectItem>
                      <SelectItem value="permission_denied">Permission Denied</SelectItem>
                      <SelectItem value="privilege_escalation">Privilege Escalation</SelectItem>
                      <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                      <SelectItem value="policy_violation">Policy Violation</SelectItem>
                      <SelectItem value="emergency_access">Emergency Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger id="severity">
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All severities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="unresolved">Unresolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timeRange">Time Range</Label>
                  <Select value={filters.timeRange} onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value }))}>
                    <SelectTrigger id="timeRange">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last Hour</SelectItem>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Security Events ({filteredEvents.length})</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{filteredEvents.length} of {events.length}</Badge>
                  {canManageSecurity && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{event.description}</div>
                            {event.metadata?.details && (
                              <div className="text-sm text-muted-foreground max-w-xs truncate">
                                {typeof event.metadata.details === 'string' 
                                  ? event.metadata.details 
                                  : JSON.stringify(event.metadata.details)
                                }
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getEventTypeBadge(event.eventType)}
                        </TableCell>
                        <TableCell>
                          {getSeverityBadge(event.severity)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{event.userName || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">{event.userEmail}</div>
                            {event.metadata?.ipAddress && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {event.metadata.ipAddress}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={event.isResolved ? 'default' : 'destructive'}>
                              {event.isResolved ? 'Resolved' : 'Active'}
                            </Badge>
                            {event.automatedActions && event.automatedActions.length > 0 && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Auto
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              
                              {canManageSecurity && !event.isResolved && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => handleEventAction('resolve', event._id)}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark Resolved
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem 
                                    onClick={() => handleEventAction('escalate', event._id)}
                                  >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Escalate
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {filteredEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No security events found matching the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Threats Tab */}
        <TabsContent value="threats" className="space-y-4">
          <ActiveThreatsView events={filteredEvents.filter(e => !e.isResolved && ['high', 'critical'].includes(e.severity))} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <SecurityAnalyticsView events={events} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Active Threats View Component
function ActiveThreatsView({ events }: { events: SecurityEventItem[] }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Active High-Priority Threats
          </CardTitle>
          <CardDescription>
            Security events requiring immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <div className="text-lg font-semibold">No Active Threats</div>
              <p className="text-muted-foreground">All high-priority security events have been resolved.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${event.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'}`} />
                    <div>
                      <div className="font-medium">{event.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.userName} • {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(event.severity)}
                    <Button size="sm" variant="outline">
                      Investigate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Security Analytics View Component
function SecurityAnalyticsView({ events }: { events: SecurityEventItem[] }) {
  const analytics = useMemo(() => {
    const eventsByType = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsBySeverity = events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUsers = events.reduce((acc, event) => {
      const key = event.userName || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      eventsByType: Object.entries(eventsByType).sort(([,a], [,b]) => b - a),
      eventsBySeverity: Object.entries(eventsBySeverity).sort(([,a], [,b]) => b - a),
      topUsers: Object.entries(topUsers).sort(([,a], [,b]) => b - a).slice(0, 10)
    };
  }, [events]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Events by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.eventsByType.map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getEventTypeBadge(type)}
                </div>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events by Severity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.eventsBySeverity.map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(severity)}
                </div>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Top Users by Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {analytics.topUsers.map(([user, count]) => (
              <div key={user} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{user}</span>
                </div>
                <Badge variant="outline">{count} events</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions (moved outside component to avoid recreation)
function getSeverityBadge(severity: string) {
  const variants = {
    low: 'default',
    medium: 'secondary',
    high: 'destructive',
    critical: 'destructive'
  } as const;

  const icons = {
    low: CheckCircle,
    medium: AlertCircle,
    high: AlertTriangle,
    critical: XCircle
  };

  const Icon = icons[severity as keyof typeof icons] || CheckCircle;

  return (
    <Badge variant={variants[severity as keyof typeof variants] || 'default'} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}

function getEventTypeBadge(eventType: string) {
  const colors = {
    login_attempt: 'bg-blue-50 text-blue-700 border-blue-200',
    permission_denied: 'bg-red-50 text-red-700 border-red-200',
    privilege_escalation: 'bg-orange-50 text-orange-700 border-orange-200',
    suspicious_activity: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    policy_violation: 'bg-purple-50 text-purple-700 border-purple-200',
    emergency_access: 'bg-pink-50 text-pink-700 border-pink-200'
  };

  return (
    <Badge variant="outline" className={colors[eventType as keyof typeof colors] || ''}>
      {eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </Badge>
  );
}

// Loading Skeleton
function SecurityMonitorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
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
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SecurityMonitor;