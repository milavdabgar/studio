"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  FileText,
  Users,
  GraduationCap,
  Target,
  Loader2,
  ChevronRight,
  Award,
  BookmarkIcon,
  Podcast,
  Headphones,
  Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, parseISO, isWithinInterval, addDays, startOfDay, endOfDay } from 'date-fns';
import Link from 'next/link';

// Import services
import { studentService } from '@/lib/api/students';
import { assessmentService } from '@/lib/api/assessments';
import { courseService } from '@/lib/api/courses';
import { studentAssessmentScoreService } from '@/lib/api/studentAssessmentScores';
import { courseMaterialService } from '@/lib/api/courseMaterials';

import type { Assessment, Student, Course, StudentAssessmentScore, CourseMaterial } from '@/types/entities';
import RealTimeAssessmentNotifications from '@/components/notifications/RealTimeAssessmentNotifications';

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string;
}

interface DashboardStats {
  totalCourses: number;
  completedAssessments: number;
  pendingAssessments: number;
  averageGrade: number;
  attendancePercentage: number;
  creditsCompleted: number;
  totalCredits: number;
  currentCPI: number;
}

interface UpcomingDeadline {
  id: string;
  title: string;
  type: string;
  courseName: string;
  dueDate: string;
  daysLeft: number;
  isOverdue: boolean;
}

interface RecentMaterial {
  id: string;
  title: string;
  courseName: string;
  type: string;
  uploadDate: string;
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  variant: 'default' | 'secondary' | 'outline';
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

export default function StudentDashboard() {
  const [user, setUser] = useState<UserCookie | null>(null);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    completedAssessments: 0,
    pendingAssessments: 0,
    averageGrade: 0,
    attendancePercentage: 0,
    creditsCompleted: 0,
    totalCredits: 0,
    currentCPI: 0
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [recentMaterials, setRecentMaterials] = useState<RecentMaterial[]>([]);

  const { toast } = useToast();

  const quickActions: QuickAction[] = [
    {
      title: "View My Courses",
      description: "Check enrolled courses and progress",
      href: "/student/courses",
      icon: <BookOpen className="h-5 w-5" />,
      variant: 'default'
    },
    {
      title: "My Assessments",
      description: "View and submit assignments",
      href: "/student/assessments",
      icon: <FileText className="h-5 w-5" />,
      variant: 'secondary'
    },
    {
      title: "Analytics Dashboard",
      description: "View performance insights",
      href: "/student/analytics",
      icon: <TrendingUp className="h-5 w-5" />,
      variant: 'outline'
    },
    {
      title: "Resources",
      description: "Access study materials and links",
      href: "/student/resources",
      icon: <BookmarkIcon className="h-5 w-5" />,
      variant: 'outline'
    }
  ];

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing auth cookie:', error);
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    } else {
        toast({ variant: "destructive", title: "Authentication Error", description: "User not logged in." });
    }
  }, [toast]);

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Get student profile
        const allStudents = await studentService.getAllStudents();
        const profile = allStudents.find(s => s.userId === user.id);
        
        if (!profile) {
          toast({ variant: "warning", title: "No Profile", description: "Student profile not found." });
          return;
        }

        setStudentProfile(profile);

        // Fetch related data
        const [allAssessments, allCourses, allMaterials] = await Promise.all([
          assessmentService.getAllAssessments(),
          courseService.getAllCourses(),
          courseMaterialService.getAllCourseMaterials()
        ]);

        // Filter data for the student
        const studentCourses = allCourses.filter(course => 
          course.programId === profile.programId
        );

        const relevantAssessments = allAssessments.filter(assessment => 
          assessment.programId === profile.programId &&
          (assessment.batchId === profile.batchId || !assessment.batchId) &&
          assessment.status === 'Published'
        );

        const relevantMaterials = allMaterials.filter(material =>
          studentCourses.some(course => course.id === material.courseOfferingId) &&
          material.isVisible
        );

        // Calculate stats
        const assessmentPromises = relevantAssessments.map(async (assessment) => {
          try {
            const submission = await studentAssessmentScoreService.getStudentScoreForAssessment(assessment.id, profile.id);
            return { assessment, submission };
          } catch {
            return { assessment, submission: null };
          }
        });

        const assessmentResults = await Promise.all(assessmentPromises);
        
        const completedAssessments = assessmentResults.filter(ar => ar.submission).length;
        const gradedAssessments = assessmentResults.filter(ar => ar.submission?.score !== undefined);
        const averageScore = gradedAssessments.length > 0 
          ? gradedAssessments.reduce((sum, ar) => {
              const score = ar.submission?.score || 0;
              const maxMarks = ar.assessment.maxMarks || 100;
              return sum + (score / maxMarks) * 100;
            }, 0) / gradedAssessments.length
          : 0;

        // Calculate upcoming deadlines
        const now = new Date();
        const nextWeek = addDays(now, 7);
        
        const deadlines = relevantAssessments
          .filter(assessment => {
            if (!assessment.dueDate) return false;
            const dueDate = parseISO(assessment.dueDate);
            return dueDate >= now;
          })
          .map(assessment => {
            const dueDate = parseISO(assessment.dueDate!);
            const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const course = studentCourses.find(c => c.id === assessment.courseId);
            
            return {
              id: assessment.id,
              title: assessment.name,
              type: assessment.type,
              courseName: course?.subjectName || 'Unknown Course',
              dueDate: assessment.dueDate!,
              daysLeft,
              isOverdue: isPast(dueDate)
            };
          })
          .sort((a, b) => a.daysLeft - b.daysLeft)
          .slice(0, 5);

        // Get recent materials
        const recent = relevantMaterials
          .filter(material => material.uploadDate)
          .sort((a, b) => new Date(b.uploadDate!).getTime() - new Date(a.uploadDate!).getTime())
          .slice(0, 5)
          .map(material => {
            const course = studentCourses.find(c => c.id === material.courseOfferingId);
            return {
              id: material.id,
              title: material.title,
              courseName: course?.subjectName || 'Unknown Course',
              type: material.type || 'unknown',
              uploadDate: material.uploadDate!
            };
          });

        setStats({
          totalCourses: studentCourses.length,
          completedAssessments,
          pendingAssessments: relevantAssessments.length - completedAssessments,
          averageGrade: averageScore,
          attendancePercentage: 85, // This would come from attendance data
          creditsCompleted: profile.creditsEarned || 0,
          totalCredits: profile.totalCredits || 240,
          currentCPI: profile.cpi || 0
        });

        setUpcomingDeadlines(deadlines);
        setRecentMaterials(recent);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({ variant: "destructive", title: "Error", description: "Could not load dashboard data." });
      }
      setIsLoading(false);
    };

    fetchDashboardData();
  }, [user, toast]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Welcome Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sm:p-6 rounded-lg">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 leading-tight">
          Welcome back, {studentProfile?.firstName || user?.name}! 👋
        </h1>
        <div className="text-blue-100 text-sm sm:text-base">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
            {studentProfile?.studentId && (
              <span className="block sm:inline">Student ID: {studentProfile.studentId}</span>
            )}
            {studentProfile?.programName && (
              <span className="block sm:inline">
                {studentProfile?.studentId && <span className="hidden sm:inline"> • </span>}
                {studentProfile.programName}
              </span>
            )}
            {studentProfile?.batchName && (
              <span className="block sm:inline">
                {(studentProfile?.studentId || studentProfile?.programName) && <span className="hidden sm:inline"> • </span>}
                Batch: {studentProfile.batchName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Current CPI</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.currentCPI.toFixed(2)}</p>
              </div>
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Courses</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.totalCourses}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Enrolled</p>
              </div>
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Assessments</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.completedAssessments}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stats.pendingAssessments} pending</p>
              </div>
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Avg Score</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.averageGrade.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Mobile Optimized */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Target className="h-4 w-4 sm:h-5 sm:w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((action, index) => (
              <Button key={index} variant={action.variant} className="h-auto p-3 sm:p-4 min-h-[80px] sm:min-h-[100px]" asChild>
                <Link href={action.href} className="flex flex-col items-center text-center space-y-1 sm:space-y-2">
                  <div className="flex-shrink-0">
                    {React.cloneElement(action.icon as React.ReactElement, { 
                      className: "h-5 w-5 sm:h-6 sm:w-6" 
                    })}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="font-medium text-xs sm:text-sm leading-tight">{action.title}</div>
                    <div className="text-[10px] sm:text-xs opacity-70 mt-1 leading-tight">{action.description}</div>
                  </div>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Real-Time Assessment Notifications */}
        {user?.id && (
          <RealTimeAssessmentNotifications 
            studentId={user.id} 
            refreshInterval={30000}
          />
        )}

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>
              Assignments and assessments due soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm sm:text-base">No upcoming deadlines!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map(deadline => (
                  <div key={deadline.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{deadline.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{deadline.courseName}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(deadline.dueDate), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <div className="flex flex-row sm:flex-col items-start sm:items-end sm:text-right gap-2 sm:gap-1">
                      <Badge variant={deadline.daysLeft <= 1 ? "destructive" : deadline.daysLeft <= 3 ? "outline" : "secondary"} className="text-xs">
                        {deadline.daysLeft === 0 ? "Due Today" : 
                         deadline.daysLeft === 1 ? "1 day left" : 
                         `${deadline.daysLeft} days left`}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{deadline.type}</p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm" asChild>
                  <Link href="/student/assessments">
                    View All Assessments <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Podcasts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Podcast className="h-5 w-5 text-pink-600" />
              Course Podcasts
            </CardTitle>
            <CardDescription>
              Educational podcasts related to your courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">Machine Learning Fundamentals</p>
                  <p className="text-xs text-muted-foreground truncate">AI Research Insights • 45:30</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">Your Course</Badge>
                    <Badge variant="outline" className="text-xs">New</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Headphones className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">Research Methodology in CS</p>
                  <p className="text-xs text-muted-foreground truncate">Academic Discussions • 38:15</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">Related</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Headphones className="w-4 h-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm" asChild>
                <Link href="/student/podcasts">
                  Explore All Podcasts <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Materials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookmarkIcon className="h-5 w-5" />
              Recent Materials
            </CardTitle>
            <CardDescription>
              Newly uploaded course materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentMaterials.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm sm:text-base">No recent materials</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMaterials.map(material => (
                  <div key={material.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{material.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{material.courseName}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {format(parseISO(material.uploadDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {material.type}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm" asChild>
                  <Link href="/student/resources">
                    View All Resources <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Academic Progress - Mobile Optimized */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Award className="h-4 w-4 sm:h-5 sm:w-5" />
            Academic Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="truncate">Credits Completed</span>
                <span className="flex-shrink-0 ml-2">{stats.creditsCompleted}/{stats.totalCredits}</span>
              </div>
              <Progress value={(stats.creditsCompleted / stats.totalCredits) * 100} className="h-2" />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {((stats.creditsCompleted / stats.totalCredits) * 100).toFixed(1)}% towards graduation
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="truncate">Assessment Completion</span>
                <span className="flex-shrink-0 ml-2">{stats.completedAssessments}/{stats.completedAssessments + stats.pendingAssessments}</span>
              </div>
              <Progress value={(stats.completedAssessments / Math.max(stats.completedAssessments + stats.pendingAssessments, 1)) * 100} className="h-2" />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {((stats.completedAssessments / Math.max(stats.completedAssessments + stats.pendingAssessments, 1)) * 100).toFixed(1)}% assessments completed
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="truncate">Attendance</span>
                <span className="flex-shrink-0 ml-2">{stats.attendancePercentage}%</span>
              </div>
              <Progress value={stats.attendancePercentage} className="h-2" />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {stats.attendancePercentage >= 75 ? "Meeting requirements" : "Below minimum requirement"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}