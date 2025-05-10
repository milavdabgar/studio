"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarCheck, Loader2, Filter, UploadCloud, Download, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Assessment, Student, Course, Program, Batch, StudentAssessmentScore } from '@/types/entities';
import { assessmentService } from '@/lib/api/assessments';
import { courseService } from '@/lib/api/courses';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { studentService } from '@/lib/api/students';
// Mock student submission service for now
// import { studentSubmissionService } from '@/lib/api/studentSubmissions';
import { format, isPast } from 'date-fns';
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
  submissionStatus?: 'Pending' | 'Submitted' | 'Late' | 'Graded';
  submittedDate?: string; // ISO string
  grade?: string;
}

// Mock service for student submissions
const mockStudentSubmissionService = {
  getStudentSubmissionsForAssessment: async (studentId: string, assessmentId: string): Promise<Partial<StudentAssessmentScore> | null> => {
    // Simulate fetching submission. In a real app, this would be an API call.
    // For demo, let's assume some assignments are submitted/graded.
    if (assessmentId.includes("cs101")) { // Example: Quiz 1 for CS101 submitted & graded
        if(studentId === "std_ce_001_gpp") { // Specific student
            return {
                studentId,
                assessmentId,
                score: 18,
                grade: 'A',
                submissionDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), // Submitted 5 days ago
            };
        }
    }
    if (assessmentId.includes("midterm_me101") && Math.random() > 0.5) { // Some other random submissions
         return {
            studentId,
            assessmentId,
            submissionDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
        };
    }
    return null;
  },
};


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
          const allPrograms = await programService.getAllPrograms();
          const allBatches = await batchService.getAllBatches();

          const studentProgram = allPrograms.find(p => p.id === studentProfile.programId);
          const studentBatch = allBatches.find(b => b.id === studentProfile.batchId);

          // Filter assessments relevant to the student's program and batch
          const relevantAssessments = allAssessments.filter(asmnt => 
            asmnt.programId === studentProfile.programId &&
            (asmnt.batchId === studentProfile.batchId || !asmnt.batchId) && // Include program-wide and batch-specific
            (asmnt.type === 'Assignment' || asmnt.type === 'Project' || asmnt.type === 'Quiz') // Filter for assignment-like types
          );
          
          const enrichedAssignmentsPromises = relevantAssessments.map(async (asmnt) => {
            const course = allCourses.find(c => c.id === asmnt.courseId);
            const submission = await mockStudentSubmissionService.getStudentSubmissionsForAssessment(studentProfile.id, asmnt.id);
            
            let submissionStatus: EnrichedAssignment['submissionStatus'] = 'Pending';
            if (submission?.score !== undefined || submission?.grade) {
                submissionStatus = 'Graded';
            } else if (submission?.submissionDate) {
                submissionStatus = (asmnt.dueDate && isPast(new Date(asmnt.dueDate)) && new Date(submission.submissionDate) > new Date(asmnt.dueDate)) ? 'Late' : 'Submitted';
            } else if (asmnt.dueDate && isPast(new Date(asmnt.dueDate))) {
                submissionStatus = 'Late'; // If due date passed and no submission
            }

            return {
              ...asmnt,
              courseName: course?.subjectName || "Unknown Course",
              programName: studentProgram?.name || "Unknown Program",
              batchName: studentBatch?.name || "Unknown Batch",
              submissionStatus,
              submittedDate: submission?.submissionDate,
              grade: submission?.grade,
            };
          });

          const enriched = await Promise.all(enrichedAssignmentsPromises);
          setAssignments(enriched);

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
            <p className="text-center text-muted-foreground py-8">No assignments found for your current courses.</p>
          ) : (
            <>
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                    <Label htmlFor="courseFilter" className="text-sm">Filter by Course:</Label>
                    <Select value={filterCourse} onValueChange={setFilterCourse}>
                        <SelectTrigger id="courseFilter"><SelectValue placeholder="All Courses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            {uniqueCoursesForFilter.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label htmlFor="statusFilter" className="text-sm">Filter by Status:</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger id="statusFilter"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {(['Pending', 'Submitted', 'Late', 'Graded'] as EnrichedAssignment['submissionStatus'][]).map(status => (
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
                      {assignment.dueDate ? format(new Date(assignment.dueDate), "PPP, p") : "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium
                        ${assignment.submissionStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${assignment.submissionStatus === 'Submitted' ? 'bg-blue-100 text-blue-700' : ''}
                        ${assignment.submissionStatus === 'Late' ? 'bg-red-100 text-red-700' : ''}
                        ${assignment.submissionStatus === 'Graded' ? 'bg-green-100 text-green-700' : ''}
                      `}>
                        {assignment.submissionStatus}
                        {assignment.submissionStatus === 'Graded' && assignment.grade && ` (${assignment.grade})`}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/student/assignments/${assignment.id}`} passHref>
                        <Button variant="outline" size="sm">
                          {assignment.submissionStatus === 'Graded' || assignment.submissionStatus === 'Submitted' ? 'View' : 'Submit'}
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
