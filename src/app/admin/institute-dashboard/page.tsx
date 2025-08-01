"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Building2, 
  Users, 
  BookOpen, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock,
  MapPin,
  UserCheck,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Filter,
  Search,
  Info,
  Zap,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RealtimeStatus } from "@/components/RealtimeStatus";

// Institute-wide dashboard types
interface InstituteMetrics {
  totalDepartments: number;
  totalFaculty: number;
  totalStudents: number;
  totalRooms: number;
  activeTimetables: number;
  totalConflicts: number;
  overallUtilization: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface DepartmentOverview {
  id: string;
  name: string;
  facultyCount: number;
  studentCount: number;
  roomCount: number;
  timetableStatus: 'published' | 'draft' | 'pending';
  utilizationRate: number;
  conflictCount: number;
  lastUpdated: string;
}

interface ResourceUtilization {
  type: 'room' | 'faculty' | 'lab';
  name: string;
  id: string;
  utilizationRate: number;
  capacity: number;
  currentBookings: number;
  peakHours: string[];
  department: string;
  status: 'optimal' | 'overutilized' | 'underutilized';
}

interface SystemAlert {
  id: string;
  type: 'conflict' | 'overutilization' | 'system' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  department?: string;
  timestamp: string;
  resolved: boolean;
}

export default function InstituteDashboardPage() {
  const [metrics, setMetrics] = useState<InstituteMetrics | null>(null);
  const [departments, setDepartments] = useState<DepartmentOverview[]>([]);
  const [resources, setResources] = useState<ResourceUtilization[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');
  const [viewMode, setViewMode] = useState<'overview' | 'departments' | 'resources' | 'alerts'>('overview');

  const { toast } = useToast();

  // Mock data for demonstration - in real app, fetch from APIs
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setMetrics({
          totalDepartments: 8,
          totalFaculty: 156,
          totalStudents: 2340,
          totalRooms: 84,
          activeTimetables: 24,
          totalConflicts: 3,
          overallUtilization: 78,
          systemHealth: 'healthy'
        });

        setDepartments([
          {
            id: 'cse',
            name: 'Computer Science & Engineering',
            facultyCount: 28,
            studentCount: 420,
            roomCount: 12,
            timetableStatus: 'published',
            utilizationRate: 85,
            conflictCount: 1,
            lastUpdated: '2025-08-01T10:30:00Z'
          },
          {
            id: 'ece',
            name: 'Electronics & Communication',
            facultyCount: 24,
            studentCount: 380,
            roomCount: 10,
            timetableStatus: 'published',
            utilizationRate: 72,
            conflictCount: 0,
            lastUpdated: '2025-08-01T09:15:00Z'
          },
          {
            id: 'it',
            name: 'Information Technology',
            facultyCount: 22,
            studentCount: 360,
            roomCount: 8,
            timetableStatus: 'draft',
            utilizationRate: 68,
            conflictCount: 2,
            lastUpdated: '2025-08-01T08:45:00Z'
          }
        ]);

        setResources([
          {
            type: 'room',
            name: 'Lab 201',
            id: 'lab-201',
            utilizationRate: 92,
            capacity: 40,
            currentBookings: 37,
            peakHours: ['10:00-12:00', '14:00-16:00'],
            department: 'Computer Science',
            status: 'overutilized'
          },
          {
            type: 'faculty',
            name: 'Dr. Smith',
            id: 'fac-001',
            utilizationRate: 95,
            capacity: 18,
            currentBookings: 17,
            peakHours: ['09:00-11:00', '15:00-17:00'],
            department: 'Computer Science',
            status: 'overutilized'
          }
        ]);

        setAlerts([
          {
            id: 'alert-001',
            type: 'conflict',
            severity: 'medium',
            title: 'Room Double Booking',
            description: 'Room 301 has conflicting bookings on Monday 10:00 AM',
            department: 'Computer Science',
            timestamp: '2025-08-01T10:00:00Z',
            resolved: false
          },
          {
            id: 'alert-002',
            type: 'overutilization',
            severity: 'high',
            title: 'Faculty Overload',
            description: 'Dr. Smith assigned 19 hours (exceeds 18-hour limit)',
            department: 'Electronics',
            timestamp: '2025-08-01T09:30:00Z',
            resolved: false
          }
        ]);

      } catch (error) {
        toast({
          variant: "destructive", 
          title: "Error",
          description: "Failed to load dashboard data"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading Institute Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Institute Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive overview of institute-wide timetable operations
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <RealtimeStatus showLabel />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="semester">Semester</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* System Health Alert */}
      {metrics && metrics.systemHealth !== 'healthy' && (
        <Alert className={`border-l-4 ${metrics.systemHealth === 'critical' ? 'border-red-500' : 'border-yellow-500'}`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>System Status: {metrics.systemHealth.toUpperCase()}</AlertTitle>
          <AlertDescription>
            {metrics.systemHealth === 'critical' 
              ? 'Critical issues detected. Immediate attention required.'
              : 'Some issues require attention to maintain optimal performance.'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{metrics?.totalDepartments}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Faculty</p>
                <p className="text-2xl font-bold">{metrics?.totalFaculty}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Students</p>
                <p className="text-2xl font-bold">{metrics?.totalStudents}</p>
              </div>
              <UserCheck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rooms</p>
                <p className="text-2xl font-bold">{metrics?.totalRooms}</p>
              </div>
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Timetables</p>
                <p className="text-2xl font-bold">{metrics?.activeTimetables}</p>
              </div>
              <Calendar className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conflicts</p>
                <p className="text-2xl font-bold text-red-600">{metrics?.totalConflicts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilization</p>
                <p className="text-2xl font-bold">{metrics?.overallUtilization}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts 
            {alerts.filter(a => !a.resolved).length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {alerts.filter(a => !a.resolved).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Status */}
            <Card>
              <CardHeader>
                <CardTitle>Department Status</CardTitle>
                <CardDescription>Current status of all departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments.slice(0, 3).map(dept => (
                    <div key={dept.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{dept.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {dept.facultyCount} faculty • {dept.studentCount} students
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(dept.timetableStatus)}>
                          {dept.timetableStatus}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {dept.utilizationRate}% utilized
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Real-time system performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Overall Utilization</span>
                    <span className="font-medium">{metrics?.overallUtilization}%</span>
                  </div>
                  <Progress value={metrics?.overallUtilization} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span>Active Timetables</span>
                    <span className="font-medium">{metrics?.activeTimetables}/24</span>
                  </div>
                  <Progress value={(metrics?.activeTimetables || 0) / 24 * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span>System Status</span>
                    <Badge className={getHealthColor(metrics?.systemHealth || 'healthy')}>
                      {metrics?.systemHealth}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>Detailed view of all departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departments.map(dept => (
                  <div key={dept.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{dept.name}</h3>
                      <Badge className={getStatusColor(dept.timetableStatus)}>
                        {dept.timetableStatus}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Faculty</p>
                        <p className="font-medium">{dept.facultyCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Students</p>
                        <p className="font-medium">{dept.studentCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Utilization</p>
                        <p className="font-medium">{dept.utilizationRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conflicts</p>
                        <p className={`font-medium ${dept.conflictCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {dept.conflictCount}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Resource Utilization</span>
                        <span>{dept.utilizationRate}%</span>
                      </div>
                      <Progress value={dept.utilizationRate} className="h-1 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
              <CardDescription>Monitor room and faculty utilization across the institute</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resources.map(resource => (
                  <div key={resource.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {resource.type === 'room' ? (
                          <MapPin className="h-4 w-4" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                        <span className="font-medium">{resource.name}</span>
                        <Badge variant="outline">{resource.type}</Badge>
                      </div>
                      <Badge className={
                        resource.status === 'optimal' ? 'bg-green-100 text-green-800' :
                        resource.status === 'overutilized' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {resource.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{resource.department}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Utilization</p>
                        <p className="font-medium">{resource.utilizationRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Capacity</p>
                        <p className="font-medium">{resource.currentBookings}/{resource.capacity}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Peak Hours</p>
                        <p className="font-medium">{resource.peakHours.join(', ')}</p>
                      </div>
                    </div>
                    
                    <Progress value={resource.utilizationRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Monitor and resolve system-wide issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map(alert => (
                  <div key={alert.id} className={`border rounded-lg p-4 ${alert.resolved ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-4 w-4 ${
                          alert.severity === 'critical' ? 'text-red-600' :
                          alert.severity === 'high' ? 'text-orange-600' :
                          alert.severity === 'medium' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                        <span className="font-medium">{alert.title}</span>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      {alert.resolved ? (
                        <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                      ) : (
                        <Button size="sm" variant="outline">
                          Resolve
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{alert.department}</span>
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}