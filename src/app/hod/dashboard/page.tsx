"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Users, 
  BookOpen, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  TrendingUp,
  UserCheck,
  Building,
  FileText,
  Eye,
  Download,
  Filter,
  Loader2,
  BarChart3,
  Settings,
  Bell,
  MapPin,
  RefreshCw,
  PlusCircle,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RealtimeStatus } from "@/components/RealtimeStatus";
import { useHODRealtimeTimetable } from "@/hooks/useRealtimeTimetable";
import type { Timetable, TimetableEntry, Faculty } from '@/types/entities';

// Enhanced Phase 4 interfaces
interface DepartmentMetrics {
  totalFaculty: number;
  totalStudents: number;
  totalSubjects: number;
  totalTimetables: number;
  avgWorkload: number;
  conflictsCount: number;
  utilizationRate: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  activeBatches: number;
  resourceUtilization: number;
}

interface FacultyWorkload {
  id: string;
  name: string;
  email: string;
  totalHours: number;
  maxHours: number;
  workloadPercentage: number;
  subjects: string[];
  conflicts: number;
  timetables: string[];
  preferences: {
    maxHours: number;
    preferredDays: string[];
    preferredSlots: string[];
  };
  alerts: {
    type: 'overload' | 'underload' | 'conflict';
    severity: 'low' | 'medium' | 'high';
    message: string;
  }[];
}

interface TimetableOverview {
  id: string;
  name: string;
  programName: string;
  batchName: string;
  status: 'draft' | 'published' | 'pending_approval';
  version: string;
  lastModified: Date;
  facultyCount: number;
  subjectCount: number;
  conflicts: number;
  qualityScore: number;
  resourceUtilization: number;
  studentCount: number;
}

interface DepartmentAlert {
  id: string;
  type: 'faculty_overload' | 'room_conflict' | 'timetable_approval' | 'system_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  facultyId?: string;
  timetableId?: string;
  timestamp: string;
  resolved: boolean;
  actionRequired: boolean;
}

interface ResourceOverview {
  type: 'room' | 'lab' | 'auditorium';
  id: string;
  name: string;
  capacity: number;
  utilization: number;
  bookings: number;
  conflicts: number;
  maintenance: boolean;
}

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string;
  department?: string;
}

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
    <CardContent className="p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl sm:text-3xl font-bold">{value}</p>
            {trend && (
              <Badge variant={trend.isPositive ? "default" : "destructive"} className="text-xs">
                {trend.isPositive ? "+" : ""}{trend.value}%
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          <Icon className={`h-6 w-6 sm:h-8 sm:w-8 text-${color}-500 ${alert ? 'animate-pulse' : ''}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function HODDashboardPage() {
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetrics | null>(null);
  const [facultyWorkloads, setFacultyWorkloads] = useState<FacultyWorkload[]>([]);
  const [timetableOverviews, setTimetableOverviews] = useState<TimetableOverview[]>([]);
  const [departmentAlerts, setDepartmentAlerts] = useState<DepartmentAlert[]>([]);
  const [resources, setResources] = useState<ResourceOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('week');

  const { toast } = useToast();

  // Real-time updates for HOD dashboard
  const { isConnected, reconnect } = useHODRealtimeTimetable(
    user?.id || '',
    [], // Will be populated with batch IDs from department
    (event) => {
      console.log('HOD Dashboard update:', event);
      toast({
        title: "Department Update",
        description: `Timetable changes detected in your department`,
        duration: 5000
      });
      // Refresh department data
      fetchDepartmentData();
    }
  );

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        // Mock department assignment - in real app, this would come from user profile
        parsedUser.department = 'Computer Science & Engineering';
        setUser(parsedUser);
      } catch {
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    }
  }, [toast]);

  const fetchDepartmentData = async () => {
    if (!user?.department) return;
    
    setIsLoading(true);
    try {
      // Mock data with enhanced Phase 4 features
      const mockMetrics: DepartmentMetrics = {
        totalFaculty: 24,
        totalStudents: 480,
        totalSubjects: 18,
        totalTimetables: 12,
        avgWorkload: 82,
        conflictsCount: 5,
        utilizationRate: 87,
        systemHealth: 'warning',
        activeBatches: 8,
        resourceUtilization: 78
      };

      const mockFacultyWorkloads: FacultyWorkload[] = [
        {
          id: '1',
          name: 'Dr. John Smith',
          email: 'john.smith@university.edu',
          totalHours: 19,
          maxHours: 18,
          workloadPercentage: 106,
          subjects: ['Data Structures', 'Algorithms', 'Database Systems'],
          conflicts: 2,
          timetables: ['CS Sem 3', 'CS Sem 5'],
          preferences: {
            maxHours: 18,
            preferredDays: ['Monday', 'Wednesday', 'Friday'],
            preferredSlots: ['09:00-10:00', '10:00-11:00']
          },
          alerts: [
            {
              type: 'overload',
              severity: 'high',
              message: 'Exceeding maximum teaching hours by 1 hour'
            }
          ]
        },
        {
          id: '2',
          name: 'Prof. Sarah Johnson',
          email: 'sarah.johnson@university.edu',
          totalHours: 16,
          maxHours: 20,
          workloadPercentage: 80,
          subjects: ['Software Engineering', 'Web Development'],
          conflicts: 0,
          timetables: ['CS Sem 4', 'CS Sem 6'],
          preferences: {
            maxHours: 20,
            preferredDays: ['Tuesday', 'Thursday'],
            preferredSlots: ['14:00-15:00', '15:00-16:00']
          },
          alerts: []
        },
        {
          id: '3',
          name: 'Dr. Michael Brown',
          email: 'michael.brown@university.edu',
          totalHours: 14,
          maxHours: 20,
          workloadPercentage: 70,
          subjects: ['Machine Learning', 'AI Fundamentals'],
          conflicts: 1,
          timetables: ['CS Sem 7', 'CS Sem 8'],
          preferences: {
            maxHours: 20,
            preferredDays: ['Monday', 'Tuesday', 'Wednesday'],
            preferredSlots: ['11:00-12:00', '12:00-13:00']
          },
          alerts: [
            {
              type: 'underload',
              severity: 'medium',
              message: 'Available for additional 6 teaching hours'
            }
          ]
        }
      ];

      const mockTimetableOverviews: TimetableOverview[] = [
        {
          id: '1',
          name: 'CS Semester 3 Regular',
          programName: 'B.Tech Computer Science',
          batchName: 'CS-A',
          status: 'published',
          version: '2.1',
          lastModified: new Date('2024-07-25'),
          facultyCount: 8,
          subjectCount: 6,
          conflicts: 0,
          qualityScore: 95,
          resourceUtilization: 85,
          studentCount: 60
        },
        {
          id: '2',
          name: 'CS Semester 5 Regular',
          programName: 'B.Tech Computer Science',
          batchName: 'CS-B',
          status: 'pending_approval',
          version: '1.3',
          lastModified: new Date('2024-07-26'),
          facultyCount: 10,
          subjectCount: 7,
          conflicts: 3,
          qualityScore: 78,
          resourceUtilization: 92,
          studentCount: 58
        },
        {
          id: '3',
          name: 'CS Semester 7 Electives',
          programName: 'B.Tech Computer Science',
          batchName: 'CS-C',
          status: 'draft',
          version: '0.9',
          lastModified: new Date('2024-07-24'),
          facultyCount: 6,
          subjectCount: 4,
          conflicts: 2,
          qualityScore: 82,
          resourceUtilization: 68,
          studentCount: 45
        }
      ];

      const mockAlerts: DepartmentAlert[] = [
        {
          id: '1',
          type: 'faculty_overload',
          severity: 'high',
          title: 'Faculty Overload Alert',
          description: 'Dr. John Smith is assigned 19 hours (exceeds 18-hour limit)',
          facultyId: '1',
          timestamp: new Date().toISOString(),
          resolved: false,
          actionRequired: true
        },
        {
          id: '2',
          type: 'timetable_approval',
          severity: 'medium',
          title: 'Timetable Pending Approval',
          description: 'CS Semester 5 Regular requires approval with 3 conflicts',
          timetableId: '2',
          timestamp: new Date().toISOString(),
          resolved: false,
          actionRequired: true
        },
        {
          id: '3',
          type: 'room_conflict',
          severity: 'medium',
          title: 'Room Double Booking',
          description: 'Lab 201 has conflicting bookings on Tuesday 10:00 AM',
          timestamp: new Date().toISOString(),
          resolved: false,
          actionRequired: true
        }
      ];

      const mockResources: ResourceOverview[] = [
        {
          type: 'lab',
          id: 'lab-201',
          name: 'Computer Lab 201',
          capacity: 40,
          utilization: 95,
          bookings: 38,
          conflicts: 1,
          maintenance: false
        },
        {
          type: 'room',
          id: 'room-305',
          name: 'Classroom 305',
          capacity: 60,
          utilization: 75,
          bookings: 45,
          conflicts: 0,
          maintenance: false
        },
        {
          type: 'lab',
          id: 'lab-301',
          name: 'Software Lab 301',
          capacity: 30,
          utilization: 87,
          bookings: 26,
          conflicts: 2,
          maintenance: true
        }
      ];

      setDepartmentMetrics(mockMetrics);
      setFacultyWorkloads(mockFacultyWorkloads);
      setTimetableOverviews(mockTimetableOverviews);
      setDepartmentAlerts(mockAlerts);
      setResources(mockResources);

    } catch (error) {
      console.error("Error fetching department data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load department data." });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDepartmentData();
  }, [user, toast]);

  const getStatusColor = (status: TimetableOverview['status']) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 90) return 'text-orange-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const filteredTimetables = useMemo(() => {
    return timetableOverviews.filter(tt => {
      switch (selectedFilter) {
        case 'published': return tt.status === 'published';
        case 'pending': return tt.status === 'pending_approval';
        case 'draft': return tt.status === 'draft';
        case 'conflicts': return tt.conflicts > 0;
        default: return true;
      }
    });
  }, [timetableOverviews, selectedFilter]);

  const pendingApprovals = timetableOverviews.filter(tt => tt.status === 'pending_approval').length;
  const totalConflicts = timetableOverviews.reduce((sum, tt) => sum + tt.conflicts, 0);
  const overloadedFaculty = facultyWorkloads.filter(f => f.workloadPercentage > 100).length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mx-auto mb-4" />
          <p>Loading Department Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Building className="h-6 w-6 sm:h-8 sm:w-8" />
            Department Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {user?.department} • Academic Year 2024-25
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <RealtimeStatus showLabel onReconnect={reconnect} />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="semester">Semester</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchDepartmentData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* System Health Alert */}
      {departmentMetrics && departmentMetrics.systemHealth !== 'healthy' && (
        <Alert className={`border-l-4 ${departmentMetrics.systemHealth === 'critical' ? 'border-red-500' : 'border-yellow-500'}`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Department Status: {departmentMetrics.systemHealth.toUpperCase()}</AlertTitle>
          <AlertDescription>
            {overloadedFaculty > 0 && `${overloadedFaculty} faculty members are overloaded. `}
            {totalConflicts > 0 && `${totalConflicts} timetable conflicts require attention. `}
            {pendingApprovals > 0 && `${pendingApprovals} timetables awaiting approval.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      {departmentMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          <MetricCard
            title="Faculty"
            value={departmentMetrics.totalFaculty}
            subtitle="Active members"
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Students"
            value={departmentMetrics.totalStudents}
            subtitle="Enrolled"
            icon={UserCheck}
            color="green"
          />
          <MetricCard
            title="Subjects"
            value={departmentMetrics.totalSubjects}
            subtitle="Being taught"
            icon={BookOpen}
            color="purple"
          />
          <MetricCard
            title="Timetables"
            value={departmentMetrics.totalTimetables}
            subtitle="Managed"
            icon={Calendar}
            color="indigo"
          />
          <MetricCard
            title="Avg Workload"
            value={`${departmentMetrics.avgWorkload}%`}
            subtitle="Faculty capacity"
            icon={TrendingUp}
            trend={{ value: 5, isPositive: true }}
            color="orange"
            alert={departmentMetrics.avgWorkload > 90}
          />
          <MetricCard
            title="Utilization"
            value={`${departmentMetrics.utilizationRate}%`}
            subtitle="Resource usage"
            icon={Activity}
            color="teal"
          />
          <MetricCard
            title="Conflicts"
            value={departmentMetrics.conflictsCount}
            subtitle="Need attention"
            icon={AlertTriangle}
            color={departmentMetrics.conflictsCount > 0 ? "red" : "green"}
            alert={departmentMetrics.conflictsCount > 0}
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="faculty">
            Faculty
            {overloadedFaculty > 0 && (
              <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 text-xs">
                {overloadedFaculty}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="timetables">
            Timetables
            {pendingApprovals > 0 && (
              <Badge variant="secondary" className="ml-2 h-4 w-4 p-0 text-xs">
                {pendingApprovals}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {departmentAlerts.filter(a => !a.resolved).length > 0 && (
              <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 text-xs">
                {departmentAlerts.filter(a => !a.resolved).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Faculty Workload Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Faculty Workload Distribution
                </CardTitle>
                <CardDescription>Current teaching load across department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {facultyWorkloads.slice(0, 4).map((faculty) => (
                    <div key={faculty.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate flex-1 mr-2">{faculty.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${getWorkloadColor(faculty.workloadPercentage)}`}>
                            {faculty.workloadPercentage}%
                          </span>
                          {faculty.alerts.length > 0 && (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      </div>
                      <Progress value={Math.min(faculty.workloadPercentage, 100)} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{faculty.totalHours}/{faculty.maxHours} hours</span>
                        <span>{faculty.subjects.length} subjects</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resource Utilization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Resource Utilization
                </CardTitle>
                <CardDescription>Department room and lab usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resources.slice(0, 4).map((resource) => (
                    <div key={resource.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{resource.name}</span>
                          {resource.maintenance && (
                            <Badge variant="outline" className="text-xs">Maintenance</Badge>
                          )}
                        </div>
                        <span className={`font-bold ${resource.utilization > 90 ? 'text-red-600' : resource.utilization > 75 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {resource.utilization}%
                        </span>
                      </div>
                      <Progress value={resource.utilization} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{resource.bookings}/{resource.capacity} capacity</span>
                        {resource.conflicts > 0 && (
                          <span className="text-red-600">{resource.conflicts} conflicts</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timetable Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timetable Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {timetableOverviews.slice(0, 6).map((tt) => (
                  <div key={tt.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm truncate flex-1">{tt.name}</h4>
                      <Badge className={`${getStatusColor(tt.status)} text-xs`}>
                        {tt.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{tt.batchName}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span>Quality: {tt.qualityScore}%</span>
                      {tt.conflicts > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {tt.conflicts} conflicts
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faculty" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Faculty Workload Management
              </CardTitle>
              <CardDescription>Monitor and balance teaching assignments across department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {facultyWorkloads.map((faculty) => (
                  <div key={faculty.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">{faculty.name}</h4>
                        <p className="text-sm text-muted-foreground">{faculty.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          className={`text-xs ${
                            faculty.workloadPercentage >= 100 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : faculty.workloadPercentage >= 90
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              : faculty.workloadPercentage >= 75
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}
                        >
                          {faculty.workloadPercentage}% load
                        </Badge>
                        {faculty.conflicts > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {faculty.conflicts} conflicts
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Teaching Hours</span>
                        <span className={getWorkloadColor(faculty.workloadPercentage)}>
                          {faculty.totalHours}/{faculty.maxHours} hours/week
                        </span>
                      </div>
                      <Progress value={Math.min(faculty.workloadPercentage, 100)} className="h-2" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Subjects:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {faculty.subjects.map((subject) => (
                              <Badge key={subject} variant="outline" className="text-xs">
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Timetables:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {faculty.timetables.map((tt) => (
                              <Badge key={tt} variant="secondary" className="text-xs">
                                {tt}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {faculty.alerts.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {faculty.alerts.map((alert, index) => (
                            <Alert key={index} className={`${getSeverityColor(alert.severity)} border-l-4`}>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="text-sm">
                                {alert.message}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetables" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter timetables" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Timetables</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="conflicts">With Conflicts</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Timetable
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTimetables.map((timetable) => (
              <Card key={timetable.id} className="border hover:shadow-lg transition-shadow">
                <CardHeader className="p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold truncate flex-1">
                        {timetable.name}
                      </CardTitle>
                      <Badge className={`${getStatusColor(timetable.status)} text-xs shrink-0`}>
                        {timetable.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {timetable.programName} • {timetable.batchName}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Students:</span>
                        <div className="font-medium">{timetable.studentCount}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Faculty:</span>
                        <div className="font-medium">{timetable.facultyCount}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quality:</span>
                        <div className="font-medium">{timetable.qualityScore}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Version:</span>
                        <div className="font-medium">{timetable.version}</div>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Resource Utilization</span>
                      <span>{timetable.resourceUtilization}%</span>
                    </div>
                    <Progress value={timetable.resourceUtilization} className="h-1" />

                    {timetable.conflicts > 0 && (
                      <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {timetable.conflicts} conflicts detected
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      {timetable.status === 'pending_approval' && (
                        <Button size="sm" className="flex-1">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTimetables.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No timetables found for the selected filter.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Department Alerts & Notifications
              </CardTitle>
              <CardDescription>Monitor critical issues requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {departmentAlerts.length > 0 ? (
                <div className="space-y-4">
                  {departmentAlerts.map((alert) => (
                    <Alert key={alert.id} className={`border-l-4 ${getSeverityColor(alert.severity)}`}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{alert.title}</span>
                        <div className="flex items-center gap-2">
                          {alert.actionRequired && (
                            <Badge variant="destructive" className="text-xs">Action Required</Badge>
                          )}
                          {!alert.resolved && (
                            <Button variant="outline" size="sm">
                              Resolve
                            </Button>
                          )}
                        </div>
                      </AlertTitle>
                      <AlertDescription>
                        <p>{alert.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                  <p className="text-muted-foreground">
                    No pending alerts or issues in your department.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}