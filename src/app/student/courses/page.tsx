"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, AlertTriangle, ExternalLink} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, CourseOffering, Course, Program, Batch, Enrollment } from '@/types/entities';
import { studentService } from '@/lib/api/students';
import { courseOfferingService } from '@/lib/api/courseOfferings';
import { courseService } from '@/lib/api/courses';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { enrollmentService } from '@/lib/api/enrollments';
import Link from 'next/link';

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string; 
}

interface EnrichedCourseInfo {
  enrollmentId: string;
  courseOfferingId: string;
  courseId: string;
  courseName: string;
  courseSubcode: string;
  semester: number;
  academicYear: string;
  programName: string;
  batchName: string;
  enrollmentStatus: Enrollment['status'];
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

export default function StudentMyCoursesPage() {
  const [currentUser, setCurrentUser] = useState<UserCookie | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [myEnrolledCourses, setMyEnrolledCourses] = useState<EnrichedCourseInfo[]>([]);
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
        if(currentUser) setIsLoading(false); // User processed but no ID
        return;
    }

    const fetchMyCourses = async () => {
      setIsLoading(true);
      try {
        const allStudents = await studentService.getAllStudents();
        const studentProfile = allStudents.find(s => s.userId === currentUser.id);
        setCurrentStudent(studentProfile || null);

        if (studentProfile) {
          const enrollments = await enrollmentService.getEnrollmentsByStudent(studentProfile.id);
          
          if (enrollments.length === 0) {
            setMyEnrolledCourses([]);
            setIsLoading(false);
            return;
          }

          const [allCOs, allCourses, allPrograms, allBatches] = await Promise.all([
            courseOfferingService.getAllCourseOfferings(),
            courseService.getAllCourses(),
            programService.getAllPrograms(),
            batchService.getAllBatches(),
          ]);

          const enrichedCourses = enrollments
            .map(enrollment => {
              const courseOffering = allCOs.find(co => co.id === enrollment.courseOfferingId);
              if (!courseOffering) return null;

              const course = allCourses.find(c => c.id === courseOffering.courseId);
              const batch = allBatches.find(b => b.id === courseOffering.batchId);
              const program = batch ? allPrograms.find(p => p.id === batch.programId) : undefined;

              return {
                enrollmentId: enrollment.id,
                courseOfferingId: courseOffering.id,
                courseId: course?.id || 'unknown-course',
                courseName: course?.subjectName || "Unknown Course",
                courseSubcode: course?.subcode || "N/A",
                semester: courseOffering.semester,
                academicYear: courseOffering.academicYear,
                programName: program?.name || "Unknown Program",
                batchName: batch?.name || "Unknown Batch",
                enrollmentStatus: enrollment.status,
              };
            })
            .filter(Boolean) as EnrichedCourseInfo[];
          
          setMyEnrolledCourses(enrichedCourses);

        } else {
          setMyEnrolledCourses([]);
          toast({ variant: "warning", title: "Profile Error", description: "Student profile not found." });
        }
      } catch (error) {
        console.error('Error loading enrolled courses:', error);
        toast({ variant: "destructive", title: "Error", description: "Could not load your enrolled courses." });
      }
      setIsLoading(false);
    };
    fetchMyCourses();
  }, [currentUser, toast]);

  if (isLoading && !currentUser) { // Initial loading state before user is confirmed
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  if (!currentUser) {
      return <div className="text-center py-10 text-muted-foreground">Please login to view your courses.</div>;
  }
  if (!currentStudent && !isLoading) { // User loaded, but no student profile
      return <div className="text-center py-10 text-muted-foreground">Student profile not found. Cannot display courses.</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> My Courses
          </CardTitle>
          <CardDescription>Overview of courses you are currently enrolled in or have requested enrollment for.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : myEnrolledCourses.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
              You are not currently enrolled in any courses. 
              <Link href="/student/courses/enroll" className="ml-1" >
                <Button variant="link" className="p-0 h-auto">Enroll in courses?</Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {myEnrolledCourses.map(courseInfo => (
                <Card key={courseInfo.enrollmentId} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{courseInfo.courseName} <span className="text-sm text-muted-foreground">({courseInfo.courseSubcode})</span></CardTitle>
                    <CardDescription>
                      {courseInfo.programName} - {courseInfo.batchName} <br />
                      Semester: {courseInfo.semester} | Academic Year: {courseInfo.academicYear}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Status: 
                        <span className={`ml-1 font-medium capitalize px-2 py-0.5 rounded-full text-xs
                            ${courseInfo.enrollmentStatus === 'enrolled' ? 'bg-green-100 text-green-700' : ''}
                            ${courseInfo.enrollmentStatus === 'requested' ? 'bg-yellow-100 text-yellow-700' : ''}
                            ${courseInfo.enrollmentStatus === 'withdrawn' ? 'bg-red-100 text-red-700' : ''}
                            ${courseInfo.enrollmentStatus === 'completed' ? 'bg-blue-100 text-blue-700' : ''}
                            ${courseInfo.enrollmentStatus === 'failed' ? 'bg-destructive text-destructive-foreground' : ''}
                        `}>
                            {courseInfo.enrollmentStatus}
                        </span>
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/student/courses/${courseInfo.courseId}`} >
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="mr-2 h-4 w-4" /> View Course Details
                      </Button>
                    </Link>
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
