"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, CalendarCheck, Edit3, Loader2, AlertTriangle, Paperclip, FileText as AssessmentIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CourseOffering, Course, Batch, Program, Faculty } from '@/types/entities';
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
      } catch {
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
          batchService.getAllBatches(),
          programService.getAllPrograms(),
        ]);

        const assignedOfferings = offeringsData.filter((offering: CourseOffering) => 
          offering.facultyIds && offering.facultyIds.includes(facultyProfile.id)
        );
        
        const enriched = assignedOfferings.map((offering: CourseOffering) => {
          const course = coursesData.find((c: Course) => c.id === offering.courseId);
          const batch = batchesData.find((b: Batch) => b.id === offering.batchId);
          const program = batch ? programsData.find((p: Program) => p.id === batch.programId) : undefined;
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
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" /></div>;
  }

  if (!currentUser) {
    return <div className="text-center py-8 px-4 text-sm sm:text-base">Please login to view your courses.</div>;
  }
  
  if (!currentFaculty && !isLoading) {
     return <div className="text-center py-8 px-4 text-sm sm:text-base">Faculty profile not found for your user account. Please contact admin.</div>;
  }


  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" /> My Courses
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Overview of courses and offerings assigned to you, {currentFaculty?.firstName || currentUser.name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {myCourseOfferings.length === 0 ? (
            <div className="text-center py-8 sm:py-10 text-muted-foreground px-4">
              <AlertTriangle className="mx-auto h-8 w-8 sm:h-12 sm:w-12 mb-4" />
              <p className="text-sm sm:text-base">You are not currently assigned to any course offerings.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myCourseOfferings.map(offering => (
                <Card key={offering.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                  <CardHeader className="p-3 sm:p-4 lg:p-6">
                    <CardTitle className="text-base sm:text-lg leading-tight">
                      {offering.courseName} 
                      <span className="block sm:inline text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-0 sm:ml-1">
                        ({offering.courseSubcode})
                      </span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      <div className="space-y-1">
                        <div>{offering.programName} - {offering.batchName}</div>
                        <div>Semester: {offering.semester} | AY: {offering.academicYear}</div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow p-3 sm:p-4 lg:p-6 pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Status: <span className="font-medium capitalize">{offering.status}</span></p>
                  </CardContent>
                  <CardFooter className="flex flex-col items-stretch gap-2 p-3 sm:p-4 lg:p-6 pt-3 sm:pt-4 border-t dark:border-gray-700">
                    <Link href={`/faculty/course-offerings/${offering.id}/students`}>
                      <Button variant="outline" className="w-full justify-start min-h-[44px] text-xs sm:text-sm">
                        <Users className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"/>
                        <span className="truncate">Enrolled Students</span>
                      </Button>
                    </Link>
                    <Link href={`/faculty/attendance/mark?offeringId=${offering.id}`}>
                      <Button variant="outline" className="w-full justify-start min-h-[44px] text-xs sm:text-sm">
                        <CalendarCheck className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"/>
                        <span className="truncate">Mark Attendance</span>
                      </Button>
                    </Link>
                    <Link href={`/faculty/course-offerings/${offering.id}/assessments`}>
                      <Button variant="outline" className="w-full justify-start min-h-[44px] text-xs sm:text-sm">
                        <AssessmentIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"/>
                        <span className="truncate">Manage Assessments</span>
                      </Button>
                    </Link>
                    <Link href={`/faculty/assessments/grade?offeringId=${offering.id}`}>
                      <Button variant="outline" className="w-full justify-start min-h-[44px] text-xs sm:text-sm">
                        <Edit3 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"/>
                        <span className="truncate">Grade Assessments</span>
                      </Button>
                    </Link>
                    <Link href={`/faculty/course-offerings/${offering.id}/materials`}>
                      <Button variant="outline" className="w-full justify-start min-h-[44px] text-xs sm:text-sm">
                        <Paperclip className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"/>
                        <span className="truncate">Manage Materials</span>
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
