"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ClipboardCheck, Calculator, Trophy, CalendarCheck, Loader2, BookOpen, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Assessment, StudentAssessmentScore } from '@/types/entities';
import { assessmentService } from '@/lib/api/assessments';
import { courseService } from '@/lib/api/courses';
import { studentService } from '@/lib/api/students';
import { studentAssessmentScoreService } from '@/lib/api/studentAssessmentScores';
import { format, isPast, isValid, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string;
}

interface EnrichedAssessment extends Assessment {
  courseName?: string;
  programName?: string;
  batchName?: string;
  submissionStatus?: 'Pending' | 'Submitted' | 'Late Submission' | 'Graded' | 'Not Attempted';
  submittedDate?: string;
  grade?: string;
  score?: number;
  percentage?: number;
}

interface AssessmentStats {
  totalAssessments: number;
  completedAssessments: number;
  averageScore: number;
  gradedAssessments: number;
  pendingAssessments: number;
  upcomingDeadlines: number;
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

export default function StudentAssessmentsPage() {
  const [assessments, setAssessments] = useState<EnrichedAssessment[]>([]);
  const [stats, setStats] = useState<AssessmentStats>({
    totalAssessments: 0,
    completedAssessments: 0,
    averageScore: 0,
    gradedAssessments: 0,
    pendingAssessments: 0,
    upcomingDeadlines: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { toast } = useToast();

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

    const fetchAssessmentsData = async () => {
      setIsLoading(true);
      try {
        const allStudents = await studentService.getAllStudents();
        const studentProfile = allStudents.find(s => s.userId === user.id);

        if (studentProfile) {
          const allAssessments = await assessmentService.getAllAssessments();
          const allCourses = await courseService.getAllCourses();

          // Filter assessments relevant to the student's program and batch
          const relevantAssessments = allAssessments.filter(assessment => 
            assessment.programId === studentProfile.programId &&
            (assessment.batchId === studentProfile.batchId || !assessment.batchId) &&
            assessment.status === 'Published'
          );
          
          const enrichedAssessmentsPromises = relevantAssessments.map(async (assessment) => {
            const course = allCourses.find(c => c.id === assessment.courseId);
            let submission: Partial<StudentAssessmentScore> | null = null;
            try {
              submission = await studentAssessmentScoreService.getStudentScoreForAssessment(assessment.id, studentProfile.id);
            } catch (e: unknown) {
              if (!(e instanceof Error && e.message.includes('404'))) {
                 console.warn(`Could not fetch submission for assessment ${assessment.id}:`, e);
              }
            }
            
            let submissionStatus: EnrichedAssessment['submissionStatus'] = 'Pending';
            let percentage: number | undefined;
            const dueDate = assessment.dueDate && isValid(parseISO(assessment.dueDate)) ? parseISO(assessment.dueDate) : null;

            if (submission?.score !== undefined || submission?.grade) {
                submissionStatus = 'Graded';
                if (submission.score !== undefined && assessment.maxMarks) {
                  percentage = (submission.score / assessment.maxMarks) * 100;
                }
            } else if (submission?.submissionDate) {
                submissionStatus = (dueDate && isPast(dueDate) && parseISO(submission.submissionDate) > dueDate) ? 'Late Submission' : 'Submitted';
            } else if (dueDate && isPast(dueDate)) {
                submissionStatus = 'Not Attempted';
            }

            return {
              ...assessment,
              courseName: course?.subjectName || "Unknown Course",
              submissionStatus,
              submittedDate: submission?.submissionDate,
              grade: submission?.grade,
              score: submission?.score,
              percentage,
            };
          });

          const enriched = await Promise.all(enrichedAssessmentsPromises);
          
          // Sort by due date and then by name
          const sorted = enriched.sort((a, b) => {
            const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
            const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
            if(dateA === 0 && dateB === 0) return a.name.localeCompare(b.name);
            if(dateA === 0) return 1;
            if(dateB === 0) return -1;
            return dateA - dateB;
          });

          setAssessments(sorted);

          // Calculate statistics
          const gradedAssessments = sorted.filter(a => a.submissionStatus === 'Graded');
          const completedAssessments = sorted.filter(a => ['Graded', 'Submitted', 'Late Submission'].includes(a.submissionStatus || ''));
          const pendingAssessments = sorted.filter(a => a.submissionStatus === 'Pending');
          const upcomingDeadlines = sorted.filter(a => {
            if (!a.dueDate) return false;
            const dueDate = parseISO(a.dueDate);
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
            return dueDate > new Date() && dueDate <= threeDaysFromNow && a.submissionStatus === 'Pending';
          });

          const averageScore = gradedAssessments.length > 0 
            ? gradedAssessments.reduce((sum, a) => sum + (a.percentage || 0), 0) / gradedAssessments.length 
            : 0;

          setStats({
            totalAssessments: sorted.length,
            completedAssessments: completedAssessments.length,
            averageScore,
            gradedAssessments: gradedAssessments.length,
            pendingAssessments: pendingAssessments.length,
            upcomingDeadlines: upcomingDeadlines.length
          });

        } else {
          setAssessments([]);
          toast({ variant: "warning", title: "No Profile", description: "Student profile not found." });
        }
      } catch (error) {
        console.error('Error loading assessments:', error);
        toast({ variant: "destructive", title: "Error", description: "Could not load assessments data." });
      }
      setIsLoading(false);
    };

    fetchAssessmentsData();
  }, [user, toast]);

  const uniqueCoursesForFilter = Array.from(new Set(assessments.map(a => a.courseName).filter(Boolean))) as string[];
  const uniqueTypesForFilter = Array.from(new Set(assessments.map(a => a.type).filter(Boolean))) as string[];

  const filteredAssessments = assessments.filter(a => {
    const courseMatch = filterCourse === "all" || a.courseName === filterCourse;
    const typeMatch = filterType === "all" || a.type === filterType;
    const statusMatch = filterStatus === "all" || a.submissionStatus === filterStatus;
    return courseMatch && typeMatch && statusMatch;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Graded': return 'default';
      case 'Submitted': return 'secondary';
      case 'Late Submission': return 'destructive';
      case 'Not Attempted': return 'destructive';
      case 'Pending': return 'outline';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'assignment': return <ClipboardCheck className="h-4 w-4" />;
      case 'quiz': return <BookOpen className="h-4 w-4" />;
      case 'exam': case 'midterm': case 'final exam': return <Calculator className="h-4 w-4" />;
      case 'project': return <Trophy className="h-4 w-4" />;
      default: return <CalendarCheck className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarCheck className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Assessments</p>
                <p className="text-2xl font-bold">{stats.totalAssessments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completedAssessments}</p>
                <Progress value={(stats.completedAssessments / Math.max(stats.totalAssessments, 1)) * 100} className="h-1 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ClipboardCheck className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Deadlines</p>
                <p className="text-2xl font-bold">{stats.upcomingDeadlines}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Assessments Table */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" /> My Assessments
          </CardTitle>
          <CardDescription>
            Comprehensive view of all your assessments including assignments, quizzes, exams, and projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 && !isLoading ? (
             <div className="text-center py-10">
                <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                    No assessments found for your current courses.
                </p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Assessments</TabsTrigger>
                <TabsTrigger value="pending">Pending ({stats.pendingAssessments})</TabsTrigger>
                <TabsTrigger value="graded">Graded ({stats.gradedAssessments})</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming ({stats.upcomingDeadlines})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border rounded-lg dark:border-gray-700">
                  <div>
                      <Label htmlFor="courseFilterStudentAssessments" className="text-sm">Filter by Course:</Label>
                      <Select value={filterCourse} onValueChange={setFilterCourse}>
                          <SelectTrigger id="courseFilterStudentAssessments">
                            <SelectValue placeholder="All Courses" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Courses</SelectItem>
                              {uniqueCoursesForFilter.map(name => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <div>
                      <Label htmlFor="typeFilterStudentAssessments" className="text-sm">Filter by Type:</Label>
                      <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger id="typeFilterStudentAssessments">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              {uniqueTypesForFilter.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                   <div>
                      <Label htmlFor="statusFilterStudentAssessments" className="text-sm">Filter by Status:</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger id="statusFilterStudentAssessments">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              {(['Pending', 'Submitted', 'Late Submission', 'Graded', 'Not Attempted'] as const).map(status => (
                                  <SelectItem key={status} value={status}>{status}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                </div>

                {/* Assessments Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Assessment</TableHead>
                      <TableHead className="text-center">Type</TableHead>
                      <TableHead className="text-center">Due Date</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssessments.map(assessment => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.courseName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(assessment.type)}
                            <span>{assessment.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{assessment.type}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {assessment.dueDate ? format(parseISO(assessment.dueDate), "MMM dd, yyyy") : "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getStatusBadgeVariant(assessment.submissionStatus || '')}>
                            {assessment.submissionStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {assessment.submissionStatus === 'Graded' ? (
                            <div className="space-y-1">
                              <div className="font-medium">
                                {assessment.score !== undefined 
                                  ? `${assessment.score}/${assessment.maxMarks}` 
                                  : assessment.grade || 'N/A'}
                              </div>
                              {assessment.percentage !== undefined && (
                                <div className="text-xs text-muted-foreground">
                                  {assessment.percentage.toFixed(1)}%
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredAssessments.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                                No assessments match your current filters.
                            </TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Other tabs with filtered views */}
              <TabsContent value="pending">
                <div className="text-center py-6 text-muted-foreground">
                  {stats.pendingAssessments} pending assessments
                </div>
              </TabsContent>
              
              <TabsContent value="graded">
                <div className="text-center py-6 text-muted-foreground">
                  {stats.gradedAssessments} graded assessments
                </div>
              </TabsContent>
              
              <TabsContent value="upcoming">
                <div className="text-center py-6 text-muted-foreground">
                  {stats.upcomingDeadlines} upcoming deadlines in the next 3 days
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}