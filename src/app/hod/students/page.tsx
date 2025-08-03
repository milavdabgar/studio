"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Users, 
  Search,
  Filter,
  Download,
  UserCheck,
  BookOpen,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calendar,
  GraduationCap,
  UserPlus,
  FileText,
  Eye,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DepartmentStudent {
  id: string;
  enrollmentNumber: string;
  name: string;
  email: string;
  phone?: string;
  program: string;
  batch: string;
  semester: number;
  status: 'active' | 'inactive' | 'graduated' | 'dropped';
  cgpa: number;
  attendance: number;
  credits: {
    total: number;
    completed: number;
    remaining: number;
  };
  performance: {
    trend: 'improving' | 'declining' | 'stable';
    riskLevel: 'low' | 'medium' | 'high';
  };
  lastActivity: Date;
}

interface StudentMetrics {
  totalStudents: number;
  activeStudents: number;
  graduatedThisYear: number;
  droppedOut: number;
  averageCGPA: number;
  averageAttendance: number;
  studentsAtRisk: number;
  topper: {
    name: string;
    cgpa: number;
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

export default function HODStudentsPage() {
  const [students, setStudents] = useState<DepartmentStudent[]>([]);
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
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

  const fetchStudentData = async () => {
    if (!user?.department) return;
    
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockMetrics: StudentMetrics = {
        totalStudents: 480,
        activeStudents: 465,
        graduatedThisYear: 118,
        droppedOut: 12,
        averageCGPA: 7.8,
        averageAttendance: 82,
        studentsAtRisk: 23,
        topper: {
          name: 'Rajesh Patel',
          cgpa: 9.65
        }
      };

      const mockStudents: DepartmentStudent[] = [
        {
          id: '1',
          enrollmentNumber: '190360116001',
          name: 'Rajesh Patel',
          email: 'rajesh.patel@student.edu',
          phone: '+91 9876543210',
          program: 'B.Tech Computer Engineering',
          batch: 'CE-2019',
          semester: 8,
          status: 'active',
          cgpa: 9.65,
          attendance: 95,
          credits: { total: 160, completed: 145, remaining: 15 },
          performance: { trend: 'improving', riskLevel: 'low' },
          lastActivity: new Date('2024-07-26')
        },
        {
          id: '2',
          enrollmentNumber: '200360116045',
          name: 'Priya Sharma',
          email: 'priya.sharma@student.edu',
          phone: '+91 9876543211',
          program: 'B.Tech Computer Engineering',
          batch: 'CE-2020',
          semester: 6,
          status: 'active',
          cgpa: 8.9,
          attendance: 88,
          credits: { total: 120, completed: 98, remaining: 22 },
          performance: { trend: 'stable', riskLevel: 'low' },
          lastActivity: new Date('2024-07-25')
        },
        {
          id: '3',
          enrollmentNumber: '210360116078',
          name: 'Amit Kumar',
          email: 'amit.kumar@student.edu',
          phone: '+91 9876543212',
          program: 'B.Tech Computer Engineering',
          batch: 'CE-2021',
          semester: 4,
          status: 'active',
          cgpa: 6.2,
          attendance: 65,
          credits: { total: 80, completed: 58, remaining: 22 },
          performance: { trend: 'declining', riskLevel: 'high' },
          lastActivity: new Date('2024-07-24')
        },
        {
          id: '4',
          enrollmentNumber: '220360116092',
          name: 'Sneha Joshi',
          email: 'sneha.joshi@student.edu',
          phone: '+91 9876543213',
          program: 'B.Tech Computer Engineering',
          batch: 'CE-2022',
          semester: 2,
          status: 'active',
          cgpa: 8.1,
          attendance: 78,
          credits: { total: 40, completed: 32, remaining: 8 },
          performance: { trend: 'improving', riskLevel: 'medium' },
          lastActivity: new Date('2024-07-26')
        },
        {
          id: '5',
          enrollmentNumber: '190360116025',
          name: 'Vivek Mehta',
          email: 'vivek.mehta@student.edu',
          program: 'B.Tech Computer Engineering',
          batch: 'CE-2019',
          semester: 8,
          status: 'graduated',
          cgpa: 8.5,
          attendance: 90,
          credits: { total: 160, completed: 160, remaining: 0 },
          performance: { trend: 'stable', riskLevel: 'low' },
          lastActivity: new Date('2024-06-15')
        }
      ];

      setMetrics(mockMetrics);
      setStudents(mockStudents);

    } catch (error) {
      console.error("Error fetching student data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load student data." });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProgram = selectedProgram === 'all' || student.program === selectedProgram;
    const matchesSemester = selectedSemester === 'all' || student.semester.toString() === selectedSemester;
    const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
    
    return matchesSearch && matchesProgram && matchesSemester && matchesStatus;
  });

  const getStatusColor = (status: DepartmentStudent['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'graduated': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'dropped': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mx-auto mb-4" />
          <p>Loading Student Management...</p>
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
            <Users className="h-6 w-6 sm:h-8 sm:w-8" />
            Student Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {user?.department} • Academic Year 2024-25
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchStudentData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          <MetricCard
            title="Total Students"
            value={metrics.totalStudents}
            subtitle="All enrolled"
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Active"
            value={metrics.activeStudents}
            subtitle="Currently studying"
            icon={UserCheck}
            color="green"
          />
          <MetricCard
            title="Graduated"
            value={metrics.graduatedThisYear}
            subtitle="This year"
            icon={GraduationCap}
            color="purple"
            trend={{ value: 12, isPositive: true }}
          />
          <MetricCard
            title="Dropped Out"
            value={metrics.droppedOut}
            subtitle="This year"
            icon={AlertTriangle}
            color="red"
            alert={metrics.droppedOut > 10}
          />
          <MetricCard
            title="Avg CGPA"
            value={metrics.averageCGPA.toFixed(1)}
            subtitle="Department average"
            icon={BookOpen}
            color="indigo"
            trend={{ value: 3, isPositive: true }}
          />
          <MetricCard
            title="Attendance"
            value={`${metrics.averageAttendance}%`}
            subtitle="Average"
            icon={Calendar}
            color="teal"
            alert={metrics.averageAttendance < 75}
          />
          <MetricCard
            title="At Risk"
            value={metrics.studentsAtRisk}
            subtitle="Need attention"
            icon={AlertTriangle}
            color="orange"
            alert={metrics.studentsAtRisk > 20}
          />
          <MetricCard
            title="Department Topper"
            value={metrics.topper.cgpa}
            subtitle={metrics.topper.name}
            icon={TrendingUp}
            color="yellow"
          />
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, enrollment number, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  <SelectItem value="B.Tech Computer Engineering">B.Tech Computer Engineering</SelectItem>
                  <SelectItem value="Diploma Computer Engineering">Diploma Computer Engineering</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Students ({filteredStudents.length})</CardTitle>
          <CardDescription>Department students overview and management</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length > 0 ? (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div key={student.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg">{student.name}</h4>
                        <Badge className={getStatusColor(student.status)}>
                          {student.status.toUpperCase()}
                        </Badge>
                        {student.performance.riskLevel === 'high' && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            At Risk
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <span>Enrollment: {student.enrollmentNumber}</span>
                        <span>Batch: {student.batch}</span>
                        <span>Semester: {student.semester}</span>
                        <span>Email: {student.email}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-lg">{student.cgpa}</span>
                          {getTrendIcon(student.performance.trend)}
                        </div>
                        <span className="text-xs text-muted-foreground">CGPA</span>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold text-lg ${student.attendance < 75 ? 'text-red-600' : 'text-green-600'}`}>
                          {student.attendance}%
                        </div>
                        <span className="text-xs text-muted-foreground">Attendance</span>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">
                          {student.credits.completed}/{student.credits.total}
                        </div>
                        <span className="text-xs text-muted-foreground">Credits</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Credit Progress */}
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Credit Progress</span>
                      <span>{Math.round((student.credits.completed / student.credits.total) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(student.credits.completed / student.credits.total) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No students found matching your criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}