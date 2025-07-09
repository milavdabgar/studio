"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpenCheck, AlertTriangle, PlusCircle, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, CourseOffering } from '@/types/entities';
import { studentService } from '@/lib/api/students';
import { courseOfferingService } from '@/lib/api/courseOfferings';
import { courseService } from '@/lib/api/courses';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { enrollmentService } from '@/lib/api/enrollments';
interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string; 
}

interface EnrichedCourseOffering extends CourseOffering {
  courseName?: string;
  courseSubcode?: string;
  programName?: string;
  batchName?: string;
  facultyNames?: string[]; // Placeholder for faculty names
  enrollmentStatus?: 'enrolled' | 'requested' | 'available';
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

export default function EnrollCoursesPage() {
  const [currentUser, setCurrentUser] = useState<UserCookie | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [availableOfferings, setAvailableOfferings] = useState<EnrichedCourseOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing auth cookie:', error);
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    } else {
        toast({ variant: "destructive", title: "Authentication Error", description: "User not logged in." });
    }
  }, [toast]);

  useEffect(() => {
    if (!currentUser || !currentUser.id) {
        if (currentUser) setIsLoading(false); // User processed but no ID
        return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const allStudents = await studentService.getAllStudents();
        const studentProfile = allStudents.find(s => s.userId === currentUser.id);
        setCurrentStudent(studentProfile || null);

        if (studentProfile) {
          const [allCOs, allCourses, allPrograms, allBatches, studentEnrollments] = await Promise.all([
            courseOfferingService.getAllCourseOfferings(),
            courseService.getAllCourses(),
            programService.getAllPrograms(),
            batchService.getAllBatches(),
            enrollmentService.getEnrollmentsByStudent(studentProfile.id),
          ]);

          const relevantOfferings = allCOs
            .filter(co => 
              co.programId === studentProfile.programId &&
              (co.batchId === studentProfile.batchId || !co.batchId) && // Program-wide or specific batch
              co.semester === studentProfile.currentSemester && // Match current semester
              (co.status === 'scheduled' || co.status === 'ongoing') // Only show enrollable offerings
            )
            .map(co => {
              const course = allCourses.find(c => c.id === co.courseId);
              const program = allPrograms.find(p => p.id === co.programId);
              const batch = co.batchId ? allBatches.find(b => b.id === co.batchId) : undefined;
              
              const enrollment = studentEnrollments.find(e => e.courseOfferingId === co.id);
              let enrollmentStatus: EnrichedCourseOffering['enrollmentStatus'] = 'available';
              if (enrollment) {
                if (enrollment.status === 'enrolled') enrollmentStatus = 'enrolled';
                else if (enrollment.status === 'requested') enrollmentStatus = 'requested';
              }

              return {
                ...co,
                courseName: course?.subjectName || "Unknown Course",
                courseSubcode: course?.subcode || "N/A",
                programName: program?.name || "Unknown Program",
                batchName: batch?.name || "Program Wide",
                enrollmentStatus,
              };
            });
          setAvailableOfferings(relevantOfferings);

        } else {
          setAvailableOfferings([]);
          toast({ variant: "warning", title: "Profile Error", description: "Student profile not found." });
        }
      } catch (error) {
        console.error('Error loading course enrollment data:', error);
        toast({ variant: "destructive", title: "Error", description: "Could not load course enrollment data." });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [currentUser, toast]);

  const handleEnroll = async (courseOfferingId: string) => {
    if (!currentStudent) {
      toast({ variant: "destructive", title: "Error", description: "Student profile not loaded." });
      return;
    }
    setIsLoading(true); // Use setIsLoading to disable enroll buttons during process
    try {
      await enrollmentService.createEnrollment({
        studentId: currentStudent.id,
        courseOfferingId: courseOfferingId,
        status: 'requested', // Or 'enrolled' if direct enrollment is allowed
      });
      toast({ title: "Enrollment Requested", description: "Your request has been submitted for approval." });
      // Re-fetch enrollments and update offering status
      await enrollmentService.getEnrollmentsByStudent(currentStudent.id);
      setAvailableOfferings(prev => prev.map(co => 
        co.id === courseOfferingId ? { ...co, enrollmentStatus: 'requested' } : co
      ));
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('already enrolled')) {
        toast({ variant: "default", title: "Already Enrolled/Requested", description: err.message });
      } else {
        toast({ variant: "destructive", title: "Enrollment Failed", description: err.message });
      }
    }
    setIsLoading(false);
  };


  if (isLoading && !currentUser) { // Initial loading state before user is confirmed
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  if (!currentUser) {
      return <div className="text-center py-10 text-muted-foreground">Please login to enroll in courses.</div>;
  }
  if (!currentStudent && !isLoading) { // User loaded, but no student profile
      return <div className="text-center py-10 text-muted-foreground">Student profile not found. Cannot display courses for enrollment.</div>;
  }


  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpenCheck className="h-6 w-6" /> Enroll in Courses
          </CardTitle>
          <CardDescription>Browse available courses for your program and semester, and request enrollment.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : availableOfferings.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
              No courses currently available for enrollment for your program and semester.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {availableOfferings.map(offering => (
                <Card key={offering.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{offering.courseName} <span className="text-sm text-muted-foreground">({offering.courseSubcode})</span></CardTitle>
                    <CardDescription>
                      {offering.programName} - {offering.batchName || "All Batches"} <br />
                      Semester: {offering.semester} | Academic Year: {offering.academicYear}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* More details like faculty, credits, etc. could be added here */}
                    <p className="text-xs text-muted-foreground">Status: <span className="font-medium capitalize">{offering.status}</span></p>
                  </CardContent>
                  <CardFooter>
                    {offering.enrollmentStatus === 'enrolled' ? (
                        <Button disabled variant="ghost" className="w-full text-success">
                            <CheckCircle className="mr-2 h-4 w-4"/> Enrolled
                        </Button>
                    ) : offering.enrollmentStatus === 'requested' ? (
                        <Button disabled variant="ghost" className="w-full text-blue-600">
                            <Clock className="mr-2 h-4 w-4"/> Requested
                        </Button>
                    ) : (
                        <Button className="w-full" onClick={() => handleEnroll(offering.id)} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                            Request Enrollment
                        </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
