
"use client";

import React, { useEffect, useState, FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, UploadCloud, Loader2, ArrowLeft, CheckCircle, AlertTriangle, Info, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Assessment, Student, Course, StudentAssessmentScore } from '@/types/entities';
import { assessmentService } from '@/lib/api/assessments';
import { courseService } from '@/lib/api/courses';
import { studentAssessmentScoreService } from '@/lib/api/studentAssessmentScores';
import { studentService } from '@/lib/api/students';
import { format, isPast, parseISO, isValid } from 'date-fns';
import { useRouter, useParams } from 'next/navigation';
interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string; 
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

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<Assessment | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [submission, setSubmission] = useState<StudentAssessmentScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionComments, setSubmissionComments] = useState("");
  const [user, setUser] = useState<UserCookie | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch { /* Handled by global layout or redirect */ }
    }
  }, []);

  useEffect(() => {
    if (!user || !user.id) return;
     const fetchStudentProfile = async () => {
        try {
            const allStudents = await studentService.getAllStudents(); 
            const profile = allStudents.find(s => s.userId === user.id);
            if (profile) {
                setCurrentStudent(profile);
            } else {
                 toast({ variant: "destructive", title: "Profile Error", description: "Student profile not found." });
            }
        } catch {
            toast({ variant: "destructive", title: "Profile Error", description: "Could not load student profile." });
        }
    };
    fetchStudentProfile();
  }, [user, toast]);


  useEffect(() => {
    if (!assignmentId) return;
    const fetchAssignmentDetails = async () => {
      setIsLoading(true);
      try {
        const asmntData = await assessmentService.getAssessmentById(assignmentId);
        setAssignment(asmntData);
        if (asmntData.courseId) {
          const courseData = await courseService.getCourseById(asmntData.courseId);
          setCourse(courseData);
        }
        if (currentStudent) {
            const subData = await studentAssessmentScoreService.getStudentScoreForAssessment(assignmentId, currentStudent.id);
            setSubmission(subData);
            if (subData?.comments) setSubmissionComments(subData.comments);
        }
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not load assignment details." });
      }
      setIsLoading(false);
    };
    fetchAssignmentDetails();
  }, [assignmentId, currentStudent, toast]);


  const handleSubmitAssignment = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile && !submission?.files?.length && !submissionComments.trim()) {
      toast({ variant: "destructive", title: "Submission Error", description: "Please select a file or add comments to submit." });
      return;
    }
    if (!currentStudent || !assignment) {
      toast({ variant: "destructive", title: "Submission Error", description: "Student or assignment data missing." });
      return;
    }
    setIsSubmitting(true);
    try {
      const submissionData = {
        studentId: currentStudent.id,
        assessmentId: assignment.id,
        files: selectedFile ? [selectedFile] : undefined,
        comments: submissionComments.trim() || undefined,
      };

      const result = await studentAssessmentScoreService.submitStudentAssignment(submissionData);
      setSubmission(result); 
      toast({ title: "Submission Successful", description: "Your assignment has been submitted." });
      setSelectedFile(null); 
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not submit assignment.";
      toast({ variant: "destructive", title: "Submission Failed", description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [editingWithNewFile, setEditingWithNewFile] = useState(false);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!assignment) {
    return <div className="text-center py-10">Assignment not found.</div>;
  }

  const dueDate = assignment.dueDate && isValid(parseISO(assignment.dueDate)) ? parseISO(assignment.dueDate) : null;
  const isPastDueDate = dueDate && isPast(dueDate);
  const submissionDate = submission?.submissionDate && isValid(parseISO(submission.submissionDate)) ? parseISO(submission.submissionDate) : null;
  const submittedLate = dueDate && submissionDate && submissionDate > dueDate;

  const canSubmit = !submission?.evaluatedAt && (!dueDate || !isPastDueDate || !!submission?.submissionDate); 
  // Can submit if not graded AND (no due date OR not past due OR already submitted once (allow re-submission before grading if past due))

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/student/assignments')} className="mb-4 print:hidden">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assignments
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <FileText className="h-6 w-6" /> {assignment.name}
          </CardTitle>
          <CardDescription>
            Course: {course?.subjectName || "N/A"} ({assignment.type}) <br />
            Max Marks: {assignment.maxMarks} {assignment.passingMarks ? `| Passing: ${assignment.passingMarks}` : ''} <br />
            Due Date: {dueDate ? format(dueDate, "PPP, p") : "N/A"}
            {isPastDueDate && !submission?.submissionDate && <span className="text-destructive font-semibold ml-2">(Past Due)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignment.description && (
            <div><h3 className="font-semibold mb-1">Description:</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap">{assignment.description}</p></div>
          )}
          {assignment.instructions && (
            <div><h3 className="font-semibold mb-1">Instructions:</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap">{assignment.instructions}</p></div>
          )}
        </CardContent>
      </Card>

      {submission && (
        <Card className="shadow-md bg-muted/30">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2">
                {submission.evaluatedAt ? <CheckCircle className="text-success h-5 w-5" /> : <Info className="text-primary h-5 w-5" />}
                 Submission Status
            </CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
                <p><strong>Submitted on:</strong> {submissionDate ? format(submissionDate, "PPP, p") : "Not Submitted Yet"}</p>
                { submittedLate && <p className="text-destructive font-semibold flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Submitted Late</p> }
                {submission.files && submission.files.length > 0 && (
                    <div><strong>Submitted Files:</strong>
                        <ul className="list-disc list-inside pl-4">
                            {submission.files.map((file, idx) => <li key={idx}><a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{file.name}</a> ({Math.round((file.size || 0) / 1024)} KB)</li>)}
                        </ul>
                    </div>
                )}
                {submission.comments && <p><strong>Your Comments:</strong> <span className="italic text-muted-foreground">{submission.comments}</span></p>}
                <hr/>
                {submission.evaluatedAt ? (
                    <>
                        <p><strong>Graded on:</strong> {format(parseISO(submission.evaluatedAt), "PPP, p")}</p>
                        {submission.score !== undefined && <p><strong>Score:</strong> {submission.score} / {assignment.maxMarks}</p>}
                        {submission.grade && <p><strong>Grade:</strong> {submission.grade}</p>}
                        {submission.remarks && <p><strong>Faculty Feedback:</strong> <span className="italic text-muted-foreground">{submission.remarks}</span></p>}
                    </>
                ) : (
                    <p className="text-blue-600 flex items-center gap-1"><Clock className="h-4 w-4"/> Awaiting Grading</p>
                )}
            </CardContent>
        </Card>
      )}

      {canSubmit && (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">{submission?.submissionDate ? "Re-submit Your Work" : "Submit Your Work"}</CardTitle>
            {submission?.submissionDate && <CardDescription className="text-orange-600">This will replace your previous submission.</CardDescription>}
            {isPastDueDate && !submission?.submissionDate && <CardDescription className="text-destructive font-bold">This assignment is past its due date. Submissions may be marked as late.</CardDescription>}
          </CardHeader>
          <form onSubmit={handleSubmitAssignment}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="submissionFileFaculty">Upload File {submission?.files?.length ? "(Optional: to replace existing)" : "*"}</Label>
                <Input id="submissionFileFaculty" type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} disabled={isSubmitting} className="mt-1" />
                {selectedFile && <p className="text-xs text-muted-foreground mt-1">Selected: {selectedFile.name}</p>}
              </div>
              <div>
                <Label htmlFor="submissionCommentsFaculty">Comments (Optional)</Label>
                <Textarea 
                    id="submissionCommentsFaculty" 
                    value={submissionComments} 
                    onChange={e => setSubmissionComments(e.target.value)} 
                    placeholder="Any notes for your instructor..."
                    rows={3}
                    disabled={isSubmitting}
                    className="mt-1"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting || (!selectedFile && !submissionComments.trim() && !submission?.files?.length)}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                {submission?.submissionDate ? 'Re-submit Assignment' : 'Submit Assignment'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
      {!canSubmit && submission?.submissionDate && (
          <div className="text-center p-4 border rounded-md bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:border-gray-700">
              <CheckCircle className="inline-block mr-2 h-5 w-5" />
              Assignment already graded. No further submissions allowed.
          </div>
      )}
       {!canSubmit && isPastDueDate && !submission?.submissionDate && (
          <div className="text-center p-4 border rounded-md bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:border-gray-700">
              <AlertTriangle className="inline-block mr-2 h-5 w-5" />
              The due date for this assignment has passed, and no submission was made.
          </div>
      )}
    </div>
  );
}

