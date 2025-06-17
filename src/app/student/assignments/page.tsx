
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarCheck, Loader2, Filter, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Assessment, Student, Course, Program, Batch, StudentAssessmentScore, CourseOffering } from '@/types/entities';
import { assessmentService } from '@/lib/api/assessments';
import { courseService } from '@/lib/api/courses';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { studentService } from '@/lib/api/students';
import { studentAssessmentScoreService } from '@/lib/api/studentAssessmentScores';
import { courseOfferingService } from '@/lib/api/courseOfferings';
import { format, isPast, isValid, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string;
}

interface EnrichedAssignment extends Assessment {
  courseName?: string;
  programName?: string;
  batchName?: string;
  submissionStatus?: 'Pending' | 'Submitted' | 'Late Submission' | 'Graded';
  submittedDate?: string; // ISO string
  grade?: string;
  score?: number;
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

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<EnrichedAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  
  const [filterCourse, setFilterCourse] = useState<string>("all");
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
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    } else {
        toast({ variant: "destructive", title: "Authentication Error", description: "User not logged in." });
    }
  }, [toast]);

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchAssignmentsData = async () => {
      setIsLoading(true);
      try {
        const allStudents = await studentService.getAllStudents();
        const studentProfile = allStudents.find(s => s.userId === user.id);
        setCurrentStudent(studentProfile || null);

        if (studentProfile) {
          const allAssessments = await assessmentService.getAllAssessments();
          const allCourses = await courseService.getAllCourses();
          // No need to fetch programs and batches here as assessment already has programId and batchId

          // Filter assessments relevant to the student's program and batch
          // Also ensure assessment types are relevant (Assignment, Project, Quiz)
          const relevantAssessments = allAssessments.filter(asmnt => 
            asmnt.programId === studentProfile.programId &&
            (asmnt.batchId === studentProfile.batchId || !asmnt.batchId) && // Include program-wide and batch-specific
            ['Assignment', 'Project', 'Quiz', 'Midterm', 'Final Exam', 'Lab Work', 'Presentation'].includes(asmnt.type) &&
            asmnt.status === 'Published' // Only show published assignments
          );
          
          const enrichedAssignmentsPromises = relevantAssessments.map(async (asmnt) => {
            const course = allCourses.find(c => c.id === asmnt.courseId);
            let submission: Partial<StudentAssessmentScore> | null = null;
            try {
              submission = await studentAssessmentScoreService.getStudentScoreForAssessment(asmnt.id, studentProfile.id);
            } catch (e) {
              // If 404, it means no submission, which is fine. Other errors will be caught by main try-catch
              if (!(e instanceof Error && e.message.includes('404'))) {
                 console.warn(`Could not fetch submission for assessment ${asmnt.id}:`, e)
              }
            }
            
            let submissionStatus: EnrichedAssignment['submissionStatus'] = 'Pending';
            const dueDate = asmnt.dueDate && isValid(parseISO(asmnt.dueDate)) ? parseISO(asmnt.dueDate) : null;

            if (submission?.score !== undefined || submission?.grade) {
                submissionStatus = 'Graded';
            } else if (submission?.submissionDate) {
                submissionStatus = (dueDate && isPast(dueDate) && parseISO(submission.submissionDate) > dueDate) ? 'Late Submission' : 'Submitted';
            } else if (dueDate && isPast(dueDate)) {
                submissionStatus = 'Pending'; // Still pending if due date passed and no submission. Could be "Missed" too.
            }

            return {
              ...asmnt,
              courseName: course?.subjectName || "Unknown Course",
              submissionStatus,
              submittedDate: submission?.submissionDate,
              grade: submission?.grade,
              score: submission?.score,
            };
          });

          const enriched = await Promise.all(enrichedAssignmentsPromises);
          setAssignments(enriched.sort((a, b) => {
            const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
            const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
            if(dateA === 0 && dateB === 0) return a.name.localeCompare(b.name); // Sort by name if no due dates
            if(dateA === 0) return 1; // No due date comes last
            if(dateB === 0) return -1; // No due date comes last
            return dateA - dateB; // Sort by due date ascending
          }));

        } else {
          setAssignments([]);
          toast({ variant: "warning", title: "No Profile", description: "Student profile not found." });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load assignments data." });
      }
      setIsLoading(false);
    };

    fetchAssignmentsData();
  }, [user, toast]);

  const uniqueCoursesForFilter = useMemo(() => {
    const courseNames = new Set(assignments.map(a => a.courseName).filter(Boolean));
    return Array.from(courseNames) as string[];
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const courseMatch = filterCourse === "all" || a.courseName === filterCourse;
      const statusMatch = filterStatus === "all" || a.submissionStatus === filterStatus;
      return courseMatch && statusMatch;
    });
  }, [assignments, filterCourse, filterStatus]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <CalendarCheck className="h-6 w-6" /> My Assignments
          </CardTitle>
          <CardDescription>View your assignments, due dates, submission status, and grades.</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 && !isLoading ? (
             <div className="text-center py-10">
                <CalendarCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                    No assignments found for your current courses.
                </p>
            </div>
          ) : (
            <>
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                    <Label htmlFor="courseFilterStudentAssignments" className="text-sm">Filter by Course:</Label>
                    <Select value={filterCourse} onValueChange={setFilterCourse}>
                        <SelectTrigger id="courseFilterStudentAssignments"><SelectValue placeholder="All Courses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            {uniqueCoursesForFilter.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label htmlFor="statusFilterStudentAssignments" className="text-sm">Filter by Status:</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger id="statusFilterStudentAssignments"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {(['Pending', 'Submitted', 'Late Submission', 'Graded'] as EnrichedAssignment['submissionStatus'][]).map(status => (
                                <SelectItem key={status} value={status!}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">Due Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map(assignment => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.courseName}</TableCell>
                    <TableCell className="font-medium">{assignment.name}</TableCell>
                    <TableCell className="text-center">{assignment.type}</TableCell>
                    <TableCell className="text-center">
                      {assignment.dueDate ? format(parseISO(assignment.dueDate), "PPP, p") : "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium
                        ${assignment.submissionStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300' : ''}
                        ${assignment.submissionStatus === 'Submitted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300' : ''}
                        ${assignment.submissionStatus === 'Late Submission' ? 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300' : ''}
                        ${assignment.submissionStatus === 'Graded' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' : ''}
                      `}>
                        {assignment.submissionStatus}
                        {assignment.submissionStatus === 'Graded' && (assignment.grade || typeof assignment.score === 'number') && 
                            ` (${assignment.grade || assignment.score + '/' + assignment.maxMarks})`}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/student/assignments/${assignment.id}`} >
                        <Button variant="outline" size="sm">
                          {assignment.submissionStatus === 'Graded' || assignment.submissionStatus === 'Submitted' || assignment.submissionStatus === 'Late Submission' ? 'View Details' : 'Submit/View'}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAssignments.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                            No assignments match your current filters.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

