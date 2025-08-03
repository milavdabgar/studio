"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  RefreshCw,
  Loader2,
  Target,
  Award,
  Building,
  Clock,
  PieChart,
  LineChart,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DepartmentAnalytics {
  overview: {
    totalStudents: number;
    totalFaculty: number;
    totalCourses: number;
    averagePerformance: number;
    trends: {
      studentsGrowth: number;
      performanceChange: number;
      facultyUtilization: number;
    };
  };
  studentAnalytics: {
    performanceDistribution: {
      excellent: number; // 8.5+
      good: number; // 7-8.5
      average: number; // 6-7
      poor: number; // <6
    };
    attendanceStats: {
      above90: number;
      above75: number;
      below75: number;
    };
    semesterWisePerformance: {
      semester: number;
      avgCGPA: number;
      passRate: number;
      enrollmentCount: number;
    }[];
    atRiskStudents: {
      academic: number;
      attendance: number;
      both: number;
    };
  };
  facultyAnalytics: {
    workloadDistribution: {
      overloaded: number; // >100%
      optimal: number; // 75-100%
      underloaded: number; // <75%
    };
    performanceMetrics: {
      avgRating: number;
      avgFeedback: number;
      avgPunctuality: number;
    };
    experienceDistribution: {
      range: string;
      count: number;
    }[];
    researchOutput: {
      publications: number;
      patents: number;
      conferences: number;
    };
  };
  resourceAnalytics: {
    classroomUtilization: {
      rooms: number;
      avgUtilization: number;
      peakHours: string[];
    };
    labUtilization: {
      labs: number;
      avgUtilization: number;
      maintenanceRequired: number;
    };
    equipmentStatus: {
      total: number;
      working: number;
      maintenance: number;
      replacement: number;
    };
  };
  academicAnalytics: {
    courseCompletion: {
      onTime: number;
      delayed: number;
      pending: number;
    };
    assessmentStats: {
      conducted: number;
      pending: number;
      avgScore: number;
    };
    placementStats: {
      placed: number;
      unplaced: number;
      higherStudies: number;
      placementRate: number;
    };
  };
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

export default function HODAnalyticsPage() {
  const [analytics, setAnalytics] = useState<DepartmentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [timeRange, setTimeRange] = useState('semester');
  const [activeTab, setActiveTab] = useState('overview');

  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        parsedUser.department = 'Computer Science & Engineering';
        setUser(parsedUser);
      } catch {
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    }
  }, [toast]);

  const fetchAnalyticsData = async () => {
    if (!user?.department) return;
    
    setIsLoading(true);
    try {
      // Mock analytics data - replace with actual API calls
      const mockAnalytics: DepartmentAnalytics = {
        overview: {
          totalStudents: 480,
          totalFaculty: 24,
          totalCourses: 18,
          averagePerformance: 7.8,
          trends: {
            studentsGrowth: 8,
            performanceChange: 5,
            facultyUtilization: -2
          }
        },
        studentAnalytics: {
          performanceDistribution: {
            excellent: 95, // 8.5+
            good: 180, // 7-8.5
            average: 165, // 6-7
            poor: 40 // <6
          },
          attendanceStats: {
            above90: 220,
            above75: 180,
            below75: 80
          },
          semesterWisePerformance: [
            { semester: 1, avgCGPA: 7.2, passRate: 92, enrollmentCount: 120 },
            { semester: 2, avgCGPA: 7.5, passRate: 89, enrollmentCount: 115 },
            { semester: 3, avgCGPA: 7.8, passRate: 91, enrollmentCount: 110 },
            { semester: 4, avgCGPA: 8.0, passRate: 94, enrollmentCount: 108 },
            { semester: 5, avgCGPA: 8.2, passRate: 96, enrollmentCount: 105 },
            { semester: 6, avgCGPA: 8.1, passRate: 93, enrollmentCount: 102 }
          ],
          atRiskStudents: {
            academic: 28,
            attendance: 15,
            both: 12
          }
        },
        facultyAnalytics: {
          workloadDistribution: {
            overloaded: 3,
            optimal: 16,
            underloaded: 5
          },
          performanceMetrics: {
            avgRating: 4.2,
            avgFeedback: 88,
            avgPunctuality: 94
          },
          experienceDistribution: [
            { range: "0-5 years", count: 6 },
            { range: "5-10 years", count: 8 },
            { range: "10-15 years", count: 7 },
            { range: "15+ years", count: 3 }
          ],
          researchOutput: {
            publications: 45,
            patents: 8,
            conferences: 23
          }
        },
        resourceAnalytics: {
          classroomUtilization: {
            rooms: 12,
            avgUtilization: 78,
            peakHours: ["10:00-11:00", "14:00-15:00", "15:00-16:00"]
          },
          labUtilization: {
            labs: 6,
            avgUtilization: 85,
            maintenanceRequired: 2
          },
          equipmentStatus: {
            total: 450,
            working: 380,
            maintenance: 45,
            replacement: 25
          }
        },
        academicAnalytics: {
          courseCompletion: {
            onTime: 16,
            delayed: 2,
            pending: 0
          },
          assessmentStats: {
            conducted: 156,
            pending: 12,
            avgScore: 76.5
          },
          placementStats: {
            placed: 85,
            unplaced: 25,
            higherStudies: 8,
            placementRate: 77.3
          }
        }
      };

      setAnalytics(mockAnalytics);

    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load analytics data." });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [user, timeRange]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mx-auto mb-4" />
          <p>Loading Department Analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            Unable to load analytics data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8" />
            Department Analytics
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {user?.department} • Academic Year 2024-25
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="semester">This Semester</SelectItem>
              <SelectItem value="year">Academic Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Students"
          value={analytics.overview.totalStudents}
          subtitle="Department enrollment"
          icon={Users}
          trend={{ value: analytics.overview.trends.studentsGrowth, isPositive: true }}
          color="blue"
        />
        <MetricCard
          title="Faculty Members"
          value={analytics.overview.totalFaculty}
          subtitle="Teaching staff"
          icon={Award}
          color="green"
        />
        <MetricCard
          title="Active Courses"
          value={analytics.overview.totalCourses}
          subtitle="This semester"
          icon={BookOpen}
          color="purple"
        />
        <MetricCard
          title="Avg Performance"
          value={analytics.overview.averagePerformance.toFixed(1)}
          subtitle="Department CGPA"
          icon={TrendingUp}
          trend={{ value: analytics.overview.trends.performanceChange, isPositive: true }}
          color="orange"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Department Health Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Student Performance</span>
                      <span className="font-medium">{((analytics.studentAnalytics.performanceDistribution.excellent + analytics.studentAnalytics.performanceDistribution.good) / analytics.overview.totalStudents * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={((analytics.studentAnalytics.performanceDistribution.excellent + analytics.studentAnalytics.performanceDistribution.good) / analytics.overview.totalStudents * 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Faculty Utilization</span>
                      <span className="font-medium">{((analytics.facultyAnalytics.workloadDistribution.optimal + analytics.facultyAnalytics.workloadDistribution.overloaded) / analytics.overview.totalFaculty * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={((analytics.facultyAnalytics.workloadDistribution.optimal + analytics.facultyAnalytics.workloadDistribution.overloaded) / analytics.overview.totalFaculty * 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Resource Utilization</span>
                      <span className="font-medium">{analytics.resourceAnalytics.classroomUtilization.avgUtilization}%</span>
                    </div>
                    <Progress value={analytics.resourceAnalytics.classroomUtilization.avgUtilization} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Placement Rate</span>
                      <span className="font-medium">{analytics.academicAnalytics.placementStats.placementRate}%</span>
                    </div>
                    <Progress value={analytics.academicAnalytics.placementStats.placementRate} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Key Insights & Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Good Performance:</strong> 57.3% students have CGPA above 7.0
                    </AlertDescription>
                  </Alert>
                  
                  <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Attention Needed:</strong> {analytics.studentAnalytics.atRiskStudents.academic + analytics.studentAnalytics.atRiskStudents.both} students at academic risk
                    </AlertDescription>
                  </Alert>
                  
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Critical:</strong> {analytics.facultyAnalytics.workloadDistribution.overloaded} faculty members are overloaded
                    </AlertDescription>
                  </Alert>
                  
                  <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Achievement:</strong> {analytics.facultyAnalytics.researchOutput.publications} research publications this year
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Semester Performance Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Semester-wise Performance Trend</CardTitle>
              <CardDescription>CGPA and pass rate trends across semesters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {analytics.studentAnalytics.semesterWisePerformance.map((sem) => (
                  <div key={sem.semester} className="text-center p-4 border rounded-lg">
                    <div className="font-semibold text-lg">Sem {sem.semester}</div>
                    <div className="text-sm text-muted-foreground mb-2">{sem.enrollmentCount} students</div>
                    <div className="space-y-1">
                      <div className="font-medium text-blue-600">{sem.avgCGPA.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">Avg CGPA</div>
                      <div className="font-medium text-green-600">{sem.passRate}%</div>
                      <div className="text-xs text-muted-foreground">Pass Rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Performance Distribution</CardTitle>
                <CardDescription>Distribution of students by CGPA ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Excellent (8.5+)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(analytics.studentAnalytics.performanceDistribution.excellent / analytics.overview.totalStudents) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-12">{analytics.studentAnalytics.performanceDistribution.excellent}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Good (7.0-8.5)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(analytics.studentAnalytics.performanceDistribution.good / analytics.overview.totalStudents) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-12">{analytics.studentAnalytics.performanceDistribution.good}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average (6.0-7.0)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${(analytics.studentAnalytics.performanceDistribution.average / analytics.overview.totalStudents) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-12">{analytics.studentAnalytics.performanceDistribution.average}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Below Average (&lt;6.0)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${(analytics.studentAnalytics.performanceDistribution.poor / analytics.overview.totalStudents) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-12">{analytics.studentAnalytics.performanceDistribution.poor}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Statistics</CardTitle>
                <CardDescription>Student attendance distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="font-bold text-2xl text-green-600">{analytics.studentAnalytics.attendanceStats.above90}</div>
                      <div className="text-sm text-muted-foreground">Above 90%</div>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="font-bold text-2xl text-yellow-600">{analytics.studentAnalytics.attendanceStats.above75}</div>
                      <div className="text-sm text-muted-foreground">75-90%</div>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="font-bold text-2xl text-red-600">{analytics.studentAnalytics.attendanceStats.below75}</div>
                      <div className="text-sm text-muted-foreground">Below 75%</div>
                    </div>
                  </div>
                  
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Action Required:</strong> {analytics.studentAnalytics.attendanceStats.below75} students have attendance below 75% minimum requirement
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* At Risk Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Students at Risk
              </CardTitle>
              <CardDescription>Students requiring immediate attention and intervention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div className="font-bold text-xl text-red-600">{analytics.studentAnalytics.atRiskStudents.academic}</div>
                  <div className="text-sm font-medium">Academic Risk</div>
                  <div className="text-xs text-muted-foreground mt-1">Poor academic performance</div>
                </div>
                <div className="p-4 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <div className="font-bold text-xl text-orange-600">{analytics.studentAnalytics.atRiskStudents.attendance}</div>
                  <div className="text-sm font-medium">Attendance Risk</div>
                  <div className="text-xs text-muted-foreground mt-1">Poor attendance record</div>
                </div>
                <div className="p-4 border border-purple-200 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <div className="font-bold text-xl text-purple-600">{analytics.studentAnalytics.atRiskStudents.both}</div>
                  <div className="text-sm font-medium">Critical Risk</div>
                  <div className="text-xs text-muted-foreground mt-1">Both academic and attendance issues</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faculty" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workload Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Faculty Workload Distribution</CardTitle>
                <CardDescription>Distribution of teaching workload across faculty</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="font-bold text-2xl text-red-600">{analytics.facultyAnalytics.workloadDistribution.overloaded}</div>
                      <div className="text-sm text-muted-foreground">Overloaded</div>
                      <div className="text-xs text-muted-foreground">&gt;100%</div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="font-bold text-2xl text-green-600">{analytics.facultyAnalytics.workloadDistribution.optimal}</div>
                      <div className="text-sm text-muted-foreground">Optimal</div>
                      <div className="text-xs text-muted-foreground">75-100%</div>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="font-bold text-2xl text-blue-600">{analytics.facultyAnalytics.workloadDistribution.underloaded}</div>
                      <div className="text-sm text-muted-foreground">Underloaded</div>
                      <div className="text-xs text-muted-foreground">&lt;75%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Faculty Performance Metrics</CardTitle>
                <CardDescription>Average performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Teaching Rating</span>
                      <span className="font-medium">{analytics.facultyAnalytics.performanceMetrics.avgRating.toFixed(1)}/5.0</span>
                    </div>
                    <Progress value={(analytics.facultyAnalytics.performanceMetrics.avgRating / 5) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Student Feedback</span>
                      <span className="font-medium">{analytics.facultyAnalytics.performanceMetrics.avgFeedback}%</span>
                    </div>
                    <Progress value={analytics.facultyAnalytics.performanceMetrics.avgFeedback} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Punctuality</span>
                      <span className="font-medium">{analytics.facultyAnalytics.performanceMetrics.avgPunctuality}%</span>
                    </div>
                    <Progress value={analytics.facultyAnalytics.performanceMetrics.avgPunctuality} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Research Output */}
          <Card>
            <CardHeader>
              <CardTitle>Research & Academic Output</CardTitle>
              <CardDescription>Department research contributions this academic year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="font-bold text-3xl text-blue-600">{analytics.facultyAnalytics.researchOutput.publications}</div>
                  <div className="text-sm text-muted-foreground">Research Publications</div>
                  <div className="text-xs text-muted-foreground mt-1">Journals & Conferences</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-3xl text-green-600">{analytics.facultyAnalytics.researchOutput.patents}</div>
                  <div className="text-sm text-muted-foreground">Patents Filed</div>
                  <div className="text-xs text-muted-foreground mt-1">Intellectual Property</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-3xl text-purple-600">{analytics.facultyAnalytics.researchOutput.conferences}</div>
                  <div className="text-sm text-muted-foreground">Conference Presentations</div>
                  <div className="text-xs text-muted-foreground mt-1">National & International</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classroom Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Classroom Utilization</CardTitle>
                <CardDescription>{analytics.resourceAnalytics.classroomUtilization.rooms} classrooms across department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="font-bold text-3xl text-blue-600">{analytics.resourceAnalytics.classroomUtilization.avgUtilization}%</div>
                    <div className="text-sm text-muted-foreground">Average Utilization</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Peak Hours:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {analytics.resourceAnalytics.classroomUtilization.peakHours.map((hour) => (
                        <Badge key={hour} variant="secondary">{hour}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lab Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Laboratory Utilization</CardTitle>
                <CardDescription>{analytics.resourceAnalytics.labUtilization.labs} specialized labs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="font-bold text-3xl text-green-600">{analytics.resourceAnalytics.labUtilization.avgUtilization}%</div>
                    <div className="text-sm text-muted-foreground">Average Utilization</div>
                  </div>
                  {analytics.resourceAnalytics.labUtilization.maintenanceRequired > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {analytics.resourceAnalytics.labUtilization.maintenanceRequired} labs require maintenance
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Equipment Status */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Status Overview</CardTitle>
              <CardDescription>Status of department equipment and infrastructure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="font-bold text-2xl text-green-600">{analytics.resourceAnalytics.equipmentStatus.working}</div>
                  <div className="text-sm text-muted-foreground">Working</div>
                  <div className="text-xs text-muted-foreground mt-1">{((analytics.resourceAnalytics.equipmentStatus.working / analytics.resourceAnalytics.equipmentStatus.total) * 100).toFixed(1)}%</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="font-bold text-2xl text-yellow-600">{analytics.resourceAnalytics.equipmentStatus.maintenance}</div>
                  <div className="text-sm text-muted-foreground">Under Maintenance</div>
                  <div className="text-xs text-muted-foreground mt-1">{((analytics.resourceAnalytics.equipmentStatus.maintenance / analytics.resourceAnalytics.equipmentStatus.total) * 100).toFixed(1)}%</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="font-bold text-2xl text-red-600">{analytics.resourceAnalytics.equipmentStatus.replacement}</div>
                  <div className="text-sm text-muted-foreground">Need Replacement</div>
                  <div className="text-xs text-muted-foreground mt-1">{((analytics.resourceAnalytics.equipmentStatus.replacement / analytics.resourceAnalytics.equipmentStatus.total) * 100).toFixed(1)}%</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="font-bold text-2xl text-blue-600">{analytics.resourceAnalytics.equipmentStatus.total}</div>
                  <div className="text-sm text-muted-foreground">Total Equipment</div>
                  <div className="text-xs text-muted-foreground mt-1">Department Assets</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Placement Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Placement & Career Outcomes</CardTitle>
              <CardDescription>Final year student placement statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="font-bold text-3xl text-green-600">{analytics.academicAnalytics.placementStats.placed}</div>
                  <div className="text-sm text-muted-foreground">Students Placed</div>
                  <div className="text-xs text-muted-foreground mt-1">{analytics.academicAnalytics.placementStats.placementRate.toFixed(1)}% placement rate</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-3xl text-blue-600">{analytics.academicAnalytics.placementStats.higherStudies}</div>
                  <div className="text-sm text-muted-foreground">Higher Studies</div>
                  <div className="text-xs text-muted-foreground mt-1">Pursuing further education</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-3xl text-orange-600">{analytics.academicAnalytics.placementStats.unplaced}</div>
                  <div className="text-sm text-muted-foreground">Yet to be Placed</div>
                  <div className="text-xs text-muted-foreground mt-1">Seeking opportunities</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}