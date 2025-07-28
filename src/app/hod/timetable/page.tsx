"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
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
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Timetable, TimetableEntry, Faculty } from '@/types/entities';

interface DepartmentMetrics {
  totalFaculty: number;
  totalSubjects: number;
  totalTimetables: number;
  avgWorkload: number;
  conflictsCount: number;
  utilizationRate: number;
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

const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = "blue" }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}) => (
  <Card className="hover:shadow-lg transition-shadow">
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
          <Icon className={`h-6 w-6 sm:h-8 sm:w-8 text-${color}-500`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function HODTimetablePage() {
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetrics | null>(null);
  const [facultyWorkloads, setFacultyWorkloads] = useState<FacultyWorkload[]>([]);
  const [timetableOverviews, setTimetableOverviews] = useState<TimetableOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        // Mock department assignment - in real app, this would come from user profile
        parsedUser.department = 'Computer Science';
        setUser(parsedUser);
      } catch {
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    }
  }, [toast]);

  useEffect(() => {
    const fetchDepartmentData = async () => {
      if (!user?.department) return;
      
      setIsLoading(true);
      try {
        // Mock data - replace with actual API calls
        const mockMetrics: DepartmentMetrics = {
          totalFaculty: 15,
          totalSubjects: 12,
          totalTimetables: 8,
          avgWorkload: 78,
          conflictsCount: 3,
          utilizationRate: 85
        };

        const mockFacultyWorkloads: FacultyWorkload[] = [
          {
            id: '1',
            name: 'Dr. John Smith',
            email: 'john.smith@university.edu',
            totalHours: 18,
            maxHours: 20,
            workloadPercentage: 90,
            subjects: ['Data Structures', 'Algorithms', 'Database Systems'],
            conflicts: 1,
            timetables: ['CS Sem 3', 'CS Sem 5']
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
            timetables: ['CS Sem 4', 'CS Sem 6']
          },
          {
            id: '3',
            name: 'Dr. Michael Brown',
            email: 'michael.brown@university.edu',
            totalHours: 14,
            maxHours: 20,
            workloadPercentage: 70,
            subjects: ['Machine Learning', 'AI Fundamentals'],
            conflicts: 2,
            timetables: ['CS Sem 7', 'CS Sem 8']
          },
          {
            id: '4',
            name: 'Prof. Emily Davis',
            email: 'emily.davis@university.edu',
            totalHours: 19,
            maxHours: 20,
            workloadPercentage: 95,
            subjects: ['Computer Networks', 'Cybersecurity', 'System Administration'],
            conflicts: 0,
            timetables: ['CS Sem 5', 'CS Sem 7']
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
            conflicts: 0
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
            conflicts: 2
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
            conflicts: 1
          }
        ];

        setDepartmentMetrics(mockMetrics);
        setFacultyWorkloads(mockFacultyWorkloads);
        setTimetableOverviews(mockTimetableOverviews);

      } catch (error) {
        console.error("Error fetching department data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load department data." });
      }
      setIsLoading(false);
    };

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
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <Card className="shadow-xl">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-primary flex items-center gap-2">
                <Users className="h-5 w-5 sm:h-6 sm:w-6" /> 
                Department Timetable Management
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {user?.department} Department • Academic Year 2024-25
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export </span>Reports
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      {departmentMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
          <MetricCard
            title="Faculty"
            value={departmentMetrics.totalFaculty}
            subtitle="Active members"
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Subjects"
            value={departmentMetrics.totalSubjects}
            subtitle="Being taught"
            icon={BookOpen}
            color="green"
          />
          <MetricCard
            title="Timetables"
            value={departmentMetrics.totalTimetables}
            subtitle="Total managed"
            icon={Calendar}
            color="purple"
          />
          <MetricCard
            title="Avg Workload"
            value={`${departmentMetrics.avgWorkload}%`}
            subtitle="Faculty capacity"
            icon={TrendingUp}
            trend={{ value: 5, isPositive: true }}
            color="orange"
          />
          <MetricCard
            title="Utilization"
            value={`${departmentMetrics.utilizationRate}%`}
            subtitle="Resource usage"
            icon={Building}
            color="cyan"
          />
          <MetricCard
            title="Conflicts"
            value={departmentMetrics.conflictsCount}
            subtitle="Need attention"
            icon={AlertTriangle}
            color={departmentMetrics.conflictsCount > 0 ? "red" : "green"}
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="faculty" className="text-xs sm:text-sm">Faculty</TabsTrigger>
            <TabsTrigger value="timetables" className="text-xs sm:text-sm">Timetables</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Faculty Workload Distribution */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base sm:text-lg">Faculty Workload Distribution</CardTitle>
                <CardDescription className="text-sm">Current teaching load across department</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 sm:space-y-4">
                  {facultyWorkloads.slice(0, 4).map((faculty) => (
                    <div key={faculty.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate flex-1 mr-2">{faculty.name}</span>
                        <span className={`font-bold ${getWorkloadColor(faculty.workloadPercentage)}`}>
                          {faculty.workloadPercentage}%
                        </span>
                      </div>
                      <Progress value={faculty.workloadPercentage} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{faculty.totalHours}/{faculty.maxHours} hours</span>
                        <span>{faculty.subjects.length} subjects</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Timetable Activities */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base sm:text-lg">Recent Activities</CardTitle>
                <CardDescription className="text-sm">Latest timetable updates and changes</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 sm:space-y-4">
                  {timetableOverviews.slice(0, 3).map((tt) => (
                    <div key={tt.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {tt.status === 'published' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : tt.conflicts > 0 ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{tt.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tt.lastModified.toLocaleDateString()} • v{tt.version}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${getStatusColor(tt.status)} text-xs`}>
                            {tt.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {tt.conflicts > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {tt.conflicts} conflicts
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faculty" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base sm:text-lg">Faculty Workload Management</CardTitle>
              <CardDescription className="text-sm">Monitor and balance teaching assignments</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4 sm:space-y-6">
                {facultyWorkloads.map((faculty) => (
                  <div key={faculty.id} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm sm:text-base">{faculty.name}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">{faculty.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`text-xs ${
                            faculty.workloadPercentage >= 90 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
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
                    
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Teaching Hours</span>
                        <span>{faculty.totalHours}/{faculty.maxHours} hours/week</span>
                      </div>
                      <Progress value={faculty.workloadPercentage} className="h-2" />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs sm:text-sm">
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
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetables" className="space-y-4 sm:space-y-6">
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredTimetables.map((timetable) => (
              <Card key={timetable.id} className="border hover:shadow-lg transition-shadow">
                <CardHeader className="p-3 sm:p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm sm:text-base font-semibold truncate flex-1">
                        {timetable.name}
                      </CardTitle>
                      <Badge className={`${getStatusColor(timetable.status)} text-xs shrink-0`}>
                        {timetable.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs sm:text-sm">
                      {timetable.programName} • {timetable.batchName}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div>
                        <span className="text-muted-foreground">Version:</span>
                        <div className="font-medium">{timetable.version}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Modified:</span>
                        <div className="font-medium">
                          {timetable.lastModified.toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Faculty:</span>
                        <div className="font-medium">{timetable.facultyCount}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Subjects:</span>
                        <div className="font-medium">{timetable.subjectCount}</div>
                      </div>
                    </div>

                    {timetable.conflicts > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-700">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-xs sm:text-sm text-red-700 dark:text-red-300">
                          {timetable.conflicts} conflicts detected
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm">
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm">
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTimetables.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm sm:text-base">
                No timetables found for the selected filter.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}