"use client";

import React, { useEffect, useState, ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, UploadCloud, Loader2, ArrowLeft, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Assessment, Student, StudentAssessmentScore, Course } from '@/types/entities';
import { assessmentService } from '@/lib/api/assessments';
import { courseService } from '@/lib/api/courses';
// import { studentSubmissionService } from '@/lib/api/studentSubmissions'; // To be created
import { format, isPast } from 'date-fns';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string; 
}

// Mock service for student submissions
const mockStudentSubmissionService = {
  getStudentSubmissionForAssessment: async (studentId: string, assessmentId: string): Promise<Partial<StudentAssessmentScore> | null> => {
    if (assessmentId === "asmnt_quiz1_cs101_gpp" && studentId === "std_ce_001_gpp") { // Example
        return {
            studentId,
            assessmentId,
            score: 18,
            grade: 'A',
            submissionDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
            // files: [{ name: "submission.pdf", url: "/path/to/submission.pdf" }] // Example file structure
            remarks: "Well done!", // Faculty feedback
        };
    }
    return null;
  },
  submitAssignment: async (submissionData: { studentId: string, assessmentId: string, files: File[] /* or just file metadata */, comments?: string }): Promise<StudentAssessmentScore> => {
    console.log("Submitting assignment (mock):", submissionData);
    // Simulate file upload and record creation
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
        id: `submission_${Date.now()}`,
        studentId: submissionData.studentId,
        assessmentId: submissionData.assessmentId,
        submissionDate: new Date().toISOString(),
        // Mock score/grade if auto-grading, otherwise leave for faculty
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
  }
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

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<Assessment | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [submission, setSubmission] = useState<Partial<StudentAssessmentScore> | null>(null);
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
      } catch (error) { /* Handled by global layout or redirect */ }
    }
  }, []);

  useEffect(() => {
    if (!user || !user.id) return;
     const fetchStudentProfile = async () => {
        // This logic is simplified. In a real app, you'd fetch student by user.id
        // or have studentId directly available in the user cookie/context.
        try {
            const students = await studentService.getAllStudents(); // Inefficient, but for demo
            const profile = students.find(s => s.userId === user.id);
            if (profile) {
                setCurrentStudent(profile);
            } else {
                 toast({ variant: "destructive", title: "Profile Error", description: "Student profile not found." });
            }
        } catch (e) {
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
            const subData = await mockStudentSubmissionService.getStudentSubmissionForAssessment(currentStudent.id, assignmentId);
            setSubmission(subData);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load assignment details." });
      }
      setIsLoading(false);
    };
    fetchAssignmentDetails();
  }, [assignmentId, currentStudent, toast]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmitAssignment = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !currentStudent || !assignment) {
      toast({ variant: "destructive", title: "Submission Error", description: "Please select a file to submit." });
      return;
    }
    setIsSubmitting(true);
    try {
      // In a real app, you'd upload the file to a storage service (e.g., Firebase Storage, S3)
      // and then send the file URL(s) along with other submission data.
      const submissionData = {
        studentId: currentStudent.id,
        assessmentId: assignment.id,
        files: [selectedFile], // Mocking direct file pass, real app needs upload
        comments: submissionComments,
      };
      const result = await mockStudentSubmissionService.submitAssignment(submissionData);
      setSubmission(result); // Update UI with new submission status
      toast({ title: "Submission Successful", description: "Your assignment has been submitted." });
      setSelectedFile(null); // Clear file input
      setSubmissionComments("");
    } catch (error) {
      toast({ variant: "destructive", title: "Submission Failed", description: (error as Error).message || "Could not submit assignment." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!assignment) {
    return <div className="text-center py-10">Assignment not found.</div>;
  }

  const isPastDueDate = assignment.dueDate && isPast(new Date(assignment.dueDate));
  const canSubmit = !submission?.submissionDate || (submission.score === undefined && submission.grade === undefined) ; // Can resubmit if not graded

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
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
            Due Date: {assignment.dueDate ? format(new Date(assignment.dueDate), "PPP, p") : "N/A"}
            {isPastDueDate && !submission?.submissionDate && <span className="text-destructive font-semibold ml-2">(Past Due)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignment.description && (
            <div>
              <h3 className="font-semibold mb-1">Description:</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{assignment.description}</p>
            </div>
          )}
          {assignment.instructions && (
            <div>
              <h3 className="font-semibold mb-1">Instructions:</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{assignment.instructions}</p>
            </div>
          )}
          {/* Placeholder for faculty attachments */}
        </CardContent>
      </Card>

      {submission && (
        <Card className="shadow-md bg-muted/30">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    {submission.score !== undefined || submission.grade ? <CheckCircle className="text-success h-5 w-5" /> : <Info className="text-primary h-5 w-5" />}
                     Submission Status
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <p><strong>Submitted on:</strong> {submission.submissionDate ? format(new Date(submission.submissionDate), "PPP, p") : "Not Submitted"}</p>
                { (assignment.dueDate && isPast(new Date(assignment.dueDate)) && submission.submissionDate && new Date(submission.submissionDate) > new Date(assignment.dueDate)) &&
                    <p className="text-destructive font-semibold flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Submitted Late</p>
                }
                {submission.score !== undefined && <p><strong>Score:</strong> {submission.score} / {assignment.maxMarks}</p>}
                {submission.grade && <p><strong>Grade:</strong> {submission.grade}</p>}
                {submission.remarks && <p><strong>Faculty Feedback:</strong> <span className="italic text-muted-foreground">{submission.remarks}</span></p>}
                {/* Placeholder for submitted files list */}
            </CardContent>
        </Card>
      )}

      {canSubmit && (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Submit Your Work</CardTitle>
            {submission?.submissionDate && <CardDescription className="text-orange-600">You are about to re-submit. This will replace your previous submission.</CardDescription>}
          </CardHeader>
          <form onSubmit={handleSubmitAssignment}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="submissionFile">Upload File</Label>
                <Input id="submissionFile" type="file" onChange={handleFileChange} disabled={isSubmitting} className="mt-1" />
                {selectedFile && <p className="text-xs text-muted-foreground mt-1">Selected: {selectedFile.name}</p>}
              </div>
              <div>
                <Label htmlFor="submissionComments">Comments (Optional)</Label>
                <Textarea 
                    id="submissionComments" 
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
              <Button type="submit" disabled={isSubmitting || !selectedFile || (isPastDueDate && !submission?.submissionDate) /* Prevent new submission if past due and not already submitted */}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                {submission?.submissionDate ? 'Re-submit Assignment' : 'Submit Assignment'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
      {!canSubmit && submission?.submissionDate && (
          <div className="text-center p-4 border rounded-md bg-green-50 border-green-200 text-green-700">
              <CheckCircle className="inline-block mr-2 h-5 w-5" />
              Assignment submitted and graded. No further submissions allowed.
          </div>
      )}
    </div>
  );
}
