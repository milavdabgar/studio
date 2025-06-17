"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, CalendarCheck, Edit3, Loader2, AlertTriangle, Paperclip, FileText as AssessmentIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CourseOffering, Course, Batch, Program, Faculty, User as SystemUser } from '@/types/entities';
import { courseOfferingService } from '@/lib/api/courseOfferings';
import { courseService } from '@/lib/api/courses';
import { batchService } from '@/lib/api/batches';
import { programService } from '@/lib/api/programs';
import { facultyService } from '@/lib/api/faculty';
import Link from 'next/link';

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
  batchName?: string;
  programName?: string;
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

export default function MyCoursesPage() {
  const [currentUser, setCurrentUser] = useState<UserCookie | null>(null);
  const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
  const [myCourseOfferings, setMyCourseOfferings] = useState<EnrichedCourseOffering[]>([]);
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
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    } else {
        toast({ variant: "destructive", title: "Authentication Required", description: "Please login to view your courses." });
    }
  }, [toast]);

  useEffect(() => {
    if (!currentUser?.id) {
      if(currentUser) setIsLoading(false); 
      return;
    }

    const fetchFacultyAndCourses = async () => {
      setIsLoading(true);
      try {
        const allFaculty = await facultyService.getAllFaculty();
        const facultyProfile = allFaculty.find(f => f.userId === currentUser.id);
        
        if (!facultyProfile) {
          toast({ variant: "warning", title: "Profile Not Found", description: "Faculty profile not found for your user account." });
          setMyCourseOfferings([]);
          setIsLoading(false);
          return;
        }
        setCurrentFaculty(facultyProfile);

        const [offeringsData, coursesData, batchesData, programsData] = await Promise.all([
          courseOfferingService.getAllCourseOfferings(),
          courseService.getAllCourses(),
          batchService.getAllCourses(),
          programService.getAllPrograms(),
        ]);

        const assignedOfferings = offeringsData.filter(offering => 
          offering.facultyIds && offering.facultyIds.includes(facultyProfile.id)
        );
        
        const enriched = assignedOfferings.map(offering => {
          const course = coursesData.find(c => c.id === offering.courseId);
          const batch = batchesData.find(b => b.id === offering.batchId);
          const program = batch ? programsData.find(p => p.id === batch.programId) : undefined;
          return {
            ...offering,
            courseName: course?.subjectName || 'Unknown Course',
            courseSubcode: course?.subcode || 'N/A',
            batchName: batch?.name || 'Unknown Batch',
            programName: program?.name || 'Unknown Program',
          };
        });

        setMyCourseOfferings(enriched);
        if (enriched.length === 0) {
          toast({ title: "No Courses", description: "You are not currently assigned to any active course offerings.", duration: 5000 });
        }
      } catch (error) {
        console.error("Failed to load faculty courses:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load your assigned courses." });
        setMyCourseOfferings([]);
      }
      setIsLoading(false);
    };

    fetchFacultyAndCourses();
  }, [currentUser, toast]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!currentUser) {
    return <div className="text-center py-10">Please login to view your courses.</div>;
  }
  
  if (!currentFaculty && !isLoading) {
     return <div className="text-center py-10">Faculty profile not found for your user account. Please contact admin.</div>;
  }


  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> My Courses
          </CardTitle>
          <CardDescription>
            Overview of courses and offerings assigned to you, {currentFaculty?.firstName || currentUser.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myCourseOfferings.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
              You are not currently assigned to any course offerings.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myCourseOfferings.map(offering => (
                <Card key={offering.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{offering.courseName} <span className="text-sm text-muted-foreground">({offering.courseSubcode})</span></CardTitle>
                    <CardDescription>
                      {offering.programName} - {offering.batchName} <br />
                      Semester: {offering.semester} | Academic Year: {offering.academicYear}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">Status: <span className="font-medium capitalize">{offering.status}</span></p>
                  </CardContent>
                  <CardFooter className="flex flex-col items-stretch gap-2 pt-4 border-t">
                    <Link
                      href={`/faculty/course-offerings/${offering.id}/students`}
                      >
                        <Button variant="outline" className="w-full justify-start"><Users className="mr-2 h-4 w-4"/>Enrolled Students</Button>
                    </Link>
                    <Link
                      href={`/faculty/attendance/mark?offeringId=${offering.id}`}
                      >
                       <Button variant="outline" className="w-full justify-start"><CalendarCheck className="mr-2 h-4 w-4"/>Mark Attendance</Button>
                    </Link>
                    <Link
                      href={`/faculty/course-offerings/${offering.id}/assessments`}
                      >
                       <Button variant="outline" className="w-full justify-start"><AssessmentIcon className="mr-2 h-4 w-4"/>Manage Assessments</Button>
                    </Link>
                    <Link
                      href={`/faculty/assessments/grade?offeringId=${offering.id}`}
                      >
                       <Button variant="outline" className="w-full justify-start"><Edit3 className="mr-2 h-4 w-4"/>Grade Assessments</Button>
                    </Link>
                    <Link
                      href={`/faculty/course-offerings/${offering.id}/materials`}
                      >
                       <Button variant="outline" className="w-full justify-start"><Paperclip className="mr-2 h-4 w-4"/>Manage Materials</Button>
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
