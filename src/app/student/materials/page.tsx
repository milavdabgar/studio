// src/app/student/materials/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Download, Loader2, FileText, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Course, Student, CourseOffering, CourseMaterial } from '@/types/entities';
import { studentService } from '@/lib/api/students';
import { courseService } from '@/lib/api/courses';
import { courseOfferingService } from '@/lib/api/courseOfferings';
import { courseMaterialService } from '@/lib/api/courseMaterials';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string; 
}

interface EnrichedCourseMaterial extends CourseMaterial {
  courseName?: string;
  courseSubcode?: string;
  semester?: number;
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

export default function StudyMaterialsPage() {
  const [allMaterials, setAllMaterials] = useState<EnrichedCourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [studentCourseOfferings, setStudentCourseOfferings] = useState<CourseOffering[]>([]);
  
  const [selectedCourseOfferingFilter, setSelectedCourseOfferingFilter] = useState<string>("all");


  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch (_error) { 
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
       }
    } else {
        toast({ variant: "destructive", title: "Authentication Error", description: "User not logged in." });
    }
  }, [toast]);

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchStudentAndCourseData = async () => {
      setIsLoading(true);
      try {
        const allStudents = await studentService.getAllStudents();
        const studentProfile = allStudents.find(s => s.userId === user.id);
        setCurrentStudent(studentProfile || null);

        if (studentProfile && studentProfile.batchId) {
          const allCOs = await courseOfferingService.getAllCourseOfferings();
          // Filter course offerings for the student's current batch and possibly current semester
          // This logic might need refinement based on how enrollments are structured
          const studentCOs = allCOs.filter(co => 
            co.batchId === studentProfile.batchId && 
            (co.semester === studentProfile.currentSemester || co.status === 'ongoing' || co.status === 'completed') // Show current & past completed
          );
          setStudentCourseOfferings(studentCOs);
          
          if (studentCOs.length > 0) {
            const allCourses = await courseService.getAllCourses();
            const materialsPromises = studentCOs.map(async (co) => {
              const materialsForOffering = await courseMaterialService.getMaterialsByCourseOffering(co.id);
              const course = allCourses.find(c => c.id === co.courseId);
              return materialsForOffering.map(mat => ({
                ...mat,
                courseName: course?.subjectName || "Unknown Course",
                courseSubcode: course?.subcode || "N/A",
                semester: course?.semester,
              }));
            });
            const materialsArrays = await Promise.all(materialsPromises);
            setAllMaterials(materialsArrays.flat());
          } else {
            setAllMaterials([]);
          }
        } else {
          setAllMaterials([]);
          if(studentProfile && !studentProfile.batchId) {
            toast({ variant: "warning", title: "No Batch Info", description: "Your batch information is not set. Cannot fetch materials." });
          } else if (!studentProfile) {
            toast({ variant: "warning", title: "No Profile", description: "Student profile not found." });
          }
        }
      } catch (_error) {
        console.error("Error fetching study materials:", _error);
        toast({ variant: "destructive", title: "Error", description: "Could not load study materials." });
      }
      setIsLoading(false);
    };

    fetchStudentAndCourseData();
  }, [user, toast]);
  
  const uniqueCourseOfferingsForFilter = useMemo(() => {
    return studentCourseOfferings.map(co => {
      const course = allMaterials.find(m => m.courseOfferingId === co.id); // Find a material to get courseName
      return {
        id: co.id,
        name: course?.courseName ? `${course.courseName} (Sem ${course.semester || 'N/A'})` : `Offering ${co.id.slice(-4)}`
      };
    });
  }, [studentCourseOfferings, allMaterials]);

  const filteredMaterials = useMemo(() => {
    return allMaterials.filter(mat => {
        return selectedCourseOfferingFilter === "all" || mat.courseOfferingId === selectedCourseOfferingFilter;
    });
  }, [allMaterials, selectedCourseOfferingFilter]);
  
  const materialsGroupedByCourseOffering = useMemo(() => {
    return filteredMaterials.reduce((acc, material) => {
      const key = `${material.courseName || "Uncategorized"} (Sem ${material.semester || 'N/A'}) - Offering ID: ${material.courseOfferingId.slice(-6)}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(material);
      return acc;
    }, {} as Record<string, EnrichedCourseMaterial[]>);
  }, [filteredMaterials]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <FileText className="h-6 w-6" /> Study Materials
          </CardTitle>
          <CardDescription>Access study materials, notes, and resources for your courses.</CardDescription>
        </CardHeader>
        <CardContent>
          {allMaterials.length === 0 && !isLoading ? (
             <div className="text-center py-10">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                    No study materials available for your courses at the moment.
                </p>
            </div>
          ) : (
            <>
             <div className="mb-6 p-4 border rounded-lg dark:border-gray-700">
                <div>
                    <Label htmlFor="courseOfferingFilterMaterials" className="text-sm">Filter by Course Offering:</Label>
                    <Select value={selectedCourseOfferingFilter} onValueChange={setSelectedCourseOfferingFilter} disabled={uniqueCourseOfferingsForFilter.length === 0}>
                        <SelectTrigger id="courseOfferingFilterMaterials"><SelectValue placeholder="All Course Offerings" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Course Offerings</SelectItem>
                            {uniqueCourseOfferingsForFilter.map(co => (
                                <SelectItem key={co.id} value={co.id}>{co.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {Object.keys(materialsGroupedByCourseOffering).length === 0 ? (
                 <p className="text-center text-muted-foreground py-6">No materials match your current filters.</p>
            ) : (
                <Accordion type="multiple" className="w-full">
                {Object.entries(materialsGroupedByCourseOffering).map(([offeringDisplayKey, offeringMaterials]) => (
                    <AccordionItem value={offeringDisplayKey} key={offeringDisplayKey}>
                    <AccordionTrigger className="text-lg font-semibold text-secondary hover:text-primary dark:hover:text-primary">
                        {offeringDisplayKey}
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul className="space-y-3 pl-2">
                        {offeringMaterials.map(material => (
                            <li key={material.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                <p className="font-medium">{material.title}</p>
                                {material.description && <p className="text-xs text-muted-foreground">{material.description}</p>}
                                <p className="text-xs text-muted-foreground">Type: {material.fileType.toUpperCase()} | Uploaded: {format(new Date(material.uploadedAt), "PPP")}</p>
                                </div>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <a href={material.filePathOrUrl} target={material.fileType === 'link' ? '_blank' : '_self'} rel="noopener noreferrer" download={material.fileType !== 'link' ? material.fileName : undefined}>
                                {material.fileType === 'link' ? <ExternalLink className="mr-1.5 h-4 w-4" /> : <Download className="mr-1.5 h-4 w-4" />} 
                                {material.fileType === 'link' ? 'Open Link' : 'Download'}
                                </a>
                            </Button>
                            </li>
                        ))}
                        </ul>
                    </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
