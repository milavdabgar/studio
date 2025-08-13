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
  BookOpen,
  Search,
  Filter,
  Download,
  UserCheck,
  Users,
  Clock,
  Calendar,
  Target,
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit,
  Eye,
  FileText,
  Award,
  TrendingUp,
  Loader2,
  RefreshCw,
  Settings,
  PlusCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CourseOffering {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  credits: number;
  semester: number;
  program: string;
  batch: string;
  academicYear: string;
  faculty: {
    primaryInstructor: {
      id: string;
      name: string;
      email: string;
    };
    coInstructors: {
      id: string;
      name: string;
      role: string;
    }[];
  };
  enrollment: {
    capacity: number;
    enrolled: number;
    waitlist: number;
  };
  schedule: {
    lectureHours: number;
    labHours: number;
    tutorialHours: number;
    totalHours: number;
  };
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  assessments: {
    totalAssessments: number;
    completedAssessments: number;
    pendingAssessments: number;
  };
  performance: {
    averageScore: number;
    passRate: number;
    attendanceRate: number;
  };
  resources: {
    syllabus: boolean;
    materials: number;
    assignments: number;
  };
  lastUpdated: Date;
}

interface CourseMetrics {
  totalCourses: number;
  activeCourses: number;
  completedCourses: number;
  totalEnrollments: number;
  averageEnrollment: number;
  facultyAssigned: number;
  unassignedCourses: number;
  avgPerformance: number;
  avgAttendance: number;
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

export default function HODCoursesPage() {
  const [courses, setCourses] = useState<CourseOffering[]>([]);
  const [metrics, setMetrics] = useState<CourseMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
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

  const fetchCourseData = async () => {
    if (!user?.department) return;
    
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockMetrics: CourseMetrics = {
        totalCourses: 18,
        activeCourses: 16,
        completedCourses: 2,
        totalEnrollments: 1450,
        averageEnrollment: 80.6,
        facultyAssigned: 22,
        unassignedCourses: 1,
        avgPerformance: 76.8,
        avgAttendance: 84.2
      };

      const mockCourses: CourseOffering[] = [
        {
          id: '1',
          courseId: 'CS101',
          courseName: 'Programming Fundamentals',
          courseCode: 'CS-101',
          credits: 4,
          semester: 1,
          program: 'B.Tech Computer Engineering',
          batch: 'CE-2024',
          academicYear: '2024-25',
          faculty: {
            primaryInstructor: {
              id: 'fac1',
              name: 'Dr. Rajesh Kumar',
              email: 'rajesh.kumar@college.edu'
            },
            coInstructors: [
              { id: 'fac2', name: 'Prof. Priya Sharma', role: 'Lab Instructor' }
            ]
          },
          enrollment: {
            capacity: 60,
            enrolled: 58,
            waitlist: 5
          },
          schedule: {
            lectureHours: 3,
            labHours: 2,
            tutorialHours: 1,
            totalHours: 6
          },
          status: 'active',
          assessments: {
            totalAssessments: 6,
            completedAssessments: 4,
            pendingAssessments: 2
          },
          performance: {
            averageScore: 78.5,
            passRate: 92,
            attendanceRate: 88
          },
          resources: {
            syllabus: true,
            materials: 12,
            assignments: 8
          },
          lastUpdated: new Date('2024-07-26')
        },
        {
          id: '2',
          courseId: 'CS201',
          courseName: 'Data Structures and Algorithms',
          courseCode: 'CS-201',
          credits: 4,
          semester: 3,
          program: 'B.Tech Computer Engineering',
          batch: 'CE-2023',
          academicYear: '2024-25',
          faculty: {
            primaryInstructor: {
              id: 'fac3',
              name: 'Dr. Amit Patel',
              email: 'amit.patel@college.edu'
            },
            coInstructors: []
          },
          enrollment: {
            capacity: 55,
            enrolled: 52,
            waitlist: 0
          },
          schedule: {
            lectureHours: 3,
            labHours: 2,
            tutorialHours: 1,
            totalHours: 6
          },
          status: 'active',
          assessments: {
            totalAssessments: 8,
            completedAssessments: 6,
            pendingAssessments: 2
          },
          performance: {
            averageScore: 82.1,
            passRate: 96,
            attendanceRate: 91
          },
          resources: {
            syllabus: true,
            materials: 15,
            assignments: 12
          },
          lastUpdated: new Date('2024-07-25')
        },
        {
          id: '3',
          courseId: 'CS301',
          courseName: 'Database Management Systems',
          courseCode: 'CS-301',
          credits: 3,
          semester: 5,
          program: 'B.Tech Computer Engineering',
          batch: 'CE-2022',
          academicYear: '2024-25',
          faculty: {
            primaryInstructor: {
              id: 'fac4',
              name: 'Prof. Sneha Joshi',
              email: 'sneha.joshi@college.edu'
            },
            coInstructors: [
              { id: 'fac5', name: 'Dr. Vivek Mehta', role: 'Project Guide' }
            ]
          },
          enrollment: {
            capacity: 50,
            enrolled: 48,
            waitlist: 2
          },
          schedule: {
            lectureHours: 3,
            labHours: 2,
            tutorialHours: 0,
            totalHours: 5
          },
          status: 'active',
          assessments: {
            totalAssessments: 5,
            completedAssessments: 3,
            pendingAssessments: 2
          },
          performance: {
            averageScore: 75.8,
            passRate: 89,
            attendanceRate: 82
          },
          resources: {
            syllabus: true,
            materials: 10,
            assignments: 6
          },
          lastUpdated: new Date('2024-07-24')
        },
        {
          id: '4',
          courseId: 'CS401',
          courseName: 'Machine Learning',
          courseCode: 'CS-401',
          credits: 4,
          semester: 7,
          program: 'B.Tech Computer Engineering',
          batch: 'CE-2021',
          academicYear: '2024-25',
          faculty: {
            primaryInstructor: {
              id: 'fac6',
              name: 'Dr. Neha Gupta',
              email: 'neha.gupta@college.edu'
            },
            coInstructors: []
          },
          enrollment: {
            capacity: 45,
            enrolled: 42,
            waitlist: 0
          },
          schedule: {
            lectureHours: 3,
            labHours: 3,
            tutorialHours: 1,
            totalHours: 7
          },
          status: 'active',
          assessments: {
            totalAssessments: 4,
            completedAssessments: 2,
            pendingAssessments: 2
          },
          performance: {
            averageScore: 81.2,
            passRate: 95,
            attendanceRate: 89
          },
          resources: {
            syllabus: true,
            materials: 18,
            assignments: 10
          },
          lastUpdated: new Date('2024-07-26')
        },
        {
          id: '5',
          courseId: 'CS151',
          courseName: 'Web Development',
          courseCode: 'CS-151',
          credits: 3,
          semester: 2,
          program: 'Diploma Computer Engineering',
          batch: 'DCE-2024',
          academicYear: '2024-25',
          faculty: {
            primaryInstructor: {
              id: 'fac7',
              name: 'Prof. Rahul Singh',
              email: 'rahul.singh@college.edu'
            },
            coInstructors: [
              { id: 'fac8', name: 'Ms. Kavya Patel', role: 'Lab Assistant' }
            ]
          },
          enrollment: {
            capacity: 40,
            enrolled: 38,
            waitlist: 0
          },
          schedule: {
            lectureHours: 2,
            labHours: 3,
            tutorialHours: 0,
            totalHours: 5
          },
          status: 'active',
          assessments: {
            totalAssessments: 6,
            completedAssessments: 5,
            pendingAssessments: 1
          },
          performance: {
            averageScore: 79.3,
            passRate: 94,
            attendanceRate: 86
          },
          resources: {
            syllabus: true,
            materials: 14,
            assignments: 9
          },
          lastUpdated: new Date('2024-07-25')
        }
      ];

      setMetrics(mockMetrics);
      setCourses(mockCourses);

    } catch (error) {
      console.error("Error fetching course data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load course data." });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCourseData();
  }, [user]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.faculty.primaryInstructor.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSemester = selectedSemester === 'all' || course.semester.toString() === selectedSemester;
    const matchesStatus = selectedStatus === 'all' || course.status === selectedStatus;
    const matchesProgram = selectedProgram === 'all' || course.program === selectedProgram;
    
    return matchesSearch && matchesSemester && matchesStatus && matchesProgram;
  });

  const getStatusColor = (status: CourseOffering['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getEnrollmentColor = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mx-auto mb-4" />
          <p>Loading Course Management...</p>
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
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8" />
            Course Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {user?.department} • Academic Year 2024-25
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchCourseData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 sm:gap-4">
          <MetricCard
            title="Total Courses"
            value={metrics.totalCourses}
            subtitle="Department catalog"
            icon={BookOpen}
            color="blue"
          />
          <MetricCard
            title="Active Courses"
            value={metrics.activeCourses}
            subtitle="Currently running"
            icon={CheckCircle}
            color="green"
          />
          <MetricCard
            title="Completed"
            value={metrics.completedCourses}
            subtitle="This semester"
            icon={Award}
            color="purple"
          />
          <MetricCard
            title="Total Enrollments"
            value={metrics.totalEnrollments}
            subtitle="All courses"
            icon={Users}
            color="indigo"
          />
          <MetricCard
            title="Avg Enrollment"
            value={metrics.averageEnrollment.toFixed(1)}
            subtitle="Per course"
            icon={Target}
            color="teal"
          />
          <MetricCard
            title="Faculty Assigned"
            value={metrics.facultyAssigned}
            subtitle="Teaching courses"
            icon={UserCheck}
            color="orange"
          />
          <MetricCard
            title="Unassigned"
            value={metrics.unassignedCourses}
            subtitle="Need faculty"
            icon={AlertTriangle}
            color="red"
            alert={metrics.unassignedCourses > 0}
          />
          <MetricCard
            title="Avg Performance"
            value={`${metrics.avgPerformance.toFixed(1)}%`}
            subtitle="Course scores"
            icon={TrendingUp}
            color="yellow"
            trend={{ value: 3, isPositive: true }}
          />
          <MetricCard
            title="Avg Attendance"
            value={`${metrics.avgAttendance.toFixed(1)}%`}
            subtitle="Course attendance"
            icon={Calendar}
            color="pink"
            alert={metrics.avgAttendance < 75}
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
                  placeholder="Search by course name, code, or instructor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="w-56">
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses List */}
      <Card>
        <CardHeader>
          <CardTitle>Course Offerings ({filteredCourses.length})</CardTitle>
          <CardDescription>Department course catalog and management</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCourses.length > 0 ? (
            <div className="space-y-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="border rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Course Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-semibold text-xl">{course.courseName}</h4>
                        <Badge className={getStatusColor(course.status)}>
                          {course.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {course.credits} Credits
                        </Badge>
                        {course.enrollment.waitlist > 0 && (
                          <Badge variant="secondary">
                            {course.enrollment.waitlist} Waitlisted
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-muted-foreground">Course Code:</span>
                          <div className="font-medium">{course.courseCode}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Semester:</span>
                          <div className="font-medium">Semester {course.semester}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Program:</span>
                          <div className="font-medium">{course.program}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Batch:</span>
                          <div className="font-medium">{course.batch}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Primary Instructor:</span>
                          <div className="font-medium">{course.faculty.primaryInstructor.name}</div>
                          <div className="text-xs text-muted-foreground">{course.faculty.primaryInstructor.email}</div>
                          {course.faculty.coInstructors.length > 0 && (
                            <div className="mt-1">
                              <span className="text-muted-foreground text-xs">Co-instructors:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {course.faculty.coInstructors.map((coInst) => (
                                  <Badge key={coInst.id} variant="outline" className="text-xs">
                                    {coInst.name} ({coInst.role})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Schedule:</span>
                          <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                            <div>Lecture: {course.schedule.lectureHours}h</div>
                            <div>Lab: {course.schedule.labHours}h</div>
                            <div>Tutorial: {course.schedule.tutorialHours}h</div>
                            <div className="font-medium">Total: {course.schedule.totalHours}h/week</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Course Metrics */}
                    <div className="lg:w-80">
                      <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                        {/* Enrollment */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Enrollment</span>
                            <span className={`font-bold ${getEnrollmentColor(course.enrollment.enrolled, course.enrollment.capacity)}`}>
                              {course.enrollment.enrolled}/{course.enrollment.capacity}
                            </span>
                          </div>
                          <Progress 
                            value={(course.enrollment.enrolled / course.enrollment.capacity) * 100} 
                            className="h-2 mb-2"
                          />
                          <div className="text-xs text-muted-foreground">
                            {((course.enrollment.enrolled / course.enrollment.capacity) * 100).toFixed(1)}% capacity
                          </div>
                        </div>

                        {/* Performance */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <div className="text-sm font-medium mb-2">Performance</div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Avg Score:</span>
                              <span className="font-medium">{course.performance.averageScore.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Pass Rate:</span>
                              <span className="font-medium">{course.performance.passRate}%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Attendance:</span>
                              <span className="font-medium">{course.performance.attendanceRate}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Details */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Assessments:</span>
                        <div className="mt-1">
                          <div className="text-xs">
                            Completed: {course.assessments.completedAssessments}/{course.assessments.totalAssessments}
                          </div>
                          {course.assessments.pendingAssessments > 0 && (
                            <div className="text-xs text-red-600">
                              Pending: {course.assessments.pendingAssessments}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Resources:</span>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <div className="flex items-center gap-1">
                            {course.resources.syllabus ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                            )}
                            Syllabus
                          </div>
                          <div>{course.resources.materials} Materials</div>
                          <div>{course.resources.assignments} Assignments</div>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Updated:</span>
                        <div className="text-xs mt-1">
                          {course.lastUpdated.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No courses found matching your criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}