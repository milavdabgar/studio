"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpenCheck, Download, Loader2, FileText, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Course, Student, Program } from '@/types/entities';
import { studentService } from '@/lib/api/students';
import { courseService } from '@/lib/api/courses';
import { programService } from '@/lib/api/programs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string; 
}

interface CourseMaterial {
  id: string;
  courseId: string;
  courseName?: string; // Denormalized for display
  materialName: string;
  description?: string;
  fileType: 'pdf' | 'doc' | 'ppt' | 'zip' | 'link' | 'video';
  url: string; // Download URL or link URL
  uploadedAt: string; // ISO string
  semester?: number; // Denormalized for filtering
}

// MOCK DATA - Replace with API calls
const MOCK_COURSE_MATERIALS: CourseMaterial[] = [
  { id: "mat1", courseId: "course_cs101_dce_gpp", materialName: "Lecture 1 - Intro to C.pdf", fileType: "pdf", url: "#", uploadedAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(), semester: 1 },
  { id: "mat2", courseId: "course_cs101_dce_gpp", materialName: "Lab 1 - Setup Dev Env.docx", fileType: "doc", url: "#", uploadedAt: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString(), semester: 1 },
  { id: "mat3", courseId: "course_me101_dme_gpp", materialName: "Unit 1 - Thermodynamics Basics.ppt", fileType: "ppt", url: "#", uploadedAt: new Date(new Date().setDate(new Date().getDate() - 12)).toISOString(), semester: 1 },
  { id: "mat4", courseId: "course_math1_gen_gpp", materialName: "Calculus Video Series - Playlist", fileType: "link", url: "https://www.youtube.com/playlist?list=PLexample", uploadedAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), semester: 1 },
  { id: "mat5", courseId: "course_cs101_dce_gpp", materialName: "Semester 2 - Pointers.pdf", fileType: "pdf", url: "#", uploadedAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), semester: 2 }, // Example for another semester
];

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
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>("all");


  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch (error) { /* Handled by global layout */ }
    }
  }, []);

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchStudentDataAndMaterials = async () => {
      setIsLoading(true);
      try {
        const allStudents = await studentService.getAllStudents();
        const studentProfile = allStudents.find(s => s.userId === user.id);
        setCurrentStudent(studentProfile || null);

        if (studentProfile && studentProfile.programId) {
          const allCourses = await courseService.getAllCourses();
          // Filter courses based on student's program and current/past semesters.
          // For simplicity, we'll just take courses for their current program.
          // A more robust solution would consider CourseOfferings the student is enrolled in.
          const coursesInProgram = allCourses.filter(c => c.programId === studentProfile.programId);
          setEnrolledCourses(coursesInProgram);
          
          // MOCK: Filter MOCK_COURSE_MATERIALS based on coursesInProgram
          // In a real app, this would be an API call: `materialService.getMaterialsByCourseIds([...])`
          const studentMaterials = MOCK_COURSE_MATERIALS
            .filter(mat => coursesInProgram.some(c => c.id === mat.courseId))
            .map(mat => {
                const course = coursesInProgram.find(c => c.id === mat.courseId);
                return {...mat, courseName: course?.subjectName || "Unknown Course", semester: course?.semester };
            });
          setMaterials(studentMaterials);

        } else {
          setMaterials([]);
          toast({ variant: "warning", title: "Profile/Program Error", description: "Student profile or program information not found." });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load study materials." });
      }
      setIsLoading(false);
    };

    fetchStudentDataAndMaterials();
  }, [user, toast]);
  
  const uniqueSemestersForFilter = useMemo(() => {
    const semesters = new Set(enrolledCourses.map(c => c.semester).filter(Boolean).map(String));
    return Array.from(semesters).sort((a,b) => parseInt(a) - parseInt(b));
  }, [enrolledCourses]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(mat => {
        const courseMatch = selectedCourseFilter === "all" || mat.courseId === selectedCourseFilter;
        const semesterMatch = selectedSemesterFilter === "all" || mat.semester?.toString() === selectedSemesterFilter;
        return courseMatch && semesterMatch;
    });
  }, [materials, selectedCourseFilter, selectedSemesterFilter]);
  
  const materialsGroupedByCourse = useMemo(() => {
    return filteredMaterials.reduce((acc, material) => {
      const courseKey = material.courseName || "Uncategorized";
      if (!acc[courseKey]) {
        acc[courseKey] = [];
      }
      acc[courseKey].push(material);
      return acc;
    }, {} as Record<string, CourseMaterial[]>);
  }, [filteredMaterials]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpenCheck className="h-6 w-6" /> Study Materials
          </CardTitle>
          <CardDescription>Access study materials, notes, and resources for your courses.</CardDescription>
        </CardHeader>
        <CardContent>
          {materials.length === 0 && !isLoading ? (
             <div className="text-center py-10">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                    No study materials available for your courses at the moment.
                </p>
            </div>
          ) : (
            <>
             <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                    <Label htmlFor="semesterFilterMaterials" className="text-sm">Filter by Semester:</Label>
                    <Select value={selectedSemesterFilter} onValueChange={setSelectedSemesterFilter} disabled={uniqueSemestersForFilter.length === 0}>
                        <SelectTrigger id="semesterFilterMaterials"><SelectValue placeholder="All Semesters" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Semesters</SelectItem>
                            {uniqueSemestersForFilter.map(sem => (
                                <SelectItem key={sem} value={sem}>Semester {sem}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="courseFilterMaterials" className="text-sm">Filter by Course:</Label>
                    <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter} disabled={enrolledCourses.length === 0}>
                        <SelectTrigger id="courseFilterMaterials"><SelectValue placeholder="All Courses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            {enrolledCourses
                                .filter(course => selectedSemesterFilter === "all" || course.semester.toString() === selectedSemesterFilter)
                                .map(course => (
                                <SelectItem key={course.id} value={course.id}>{course.subjectName} ({course.subcode})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {Object.keys(materialsGroupedByCourse).length === 0 ? (
                 <p className="text-center text-muted-foreground py-6">No materials match your current filters.</p>
            ) : (
                <Accordion type="multiple" className="w-full">
                {Object.entries(materialsGroupedByCourse).map(([courseName, courseMaterials]) => (
                    <AccordionItem value={courseName} key={courseName}>
                    <AccordionTrigger className="text-lg font-semibold text-secondary hover:text-primary">
                        {courseName} ({courseMaterials[0]?.semester ? `Sem ${courseMaterials[0].semester}` : ''})
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul className="space-y-3 pl-2">
                        {courseMaterials.map(material => (
                            <li key={material.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                <p className="font-medium">{material.materialName}</p>
                                {material.description && <p className="text-xs text-muted-foreground">{material.description}</p>}
                                <p className="text-xs text-muted-foreground">Type: {material.fileType.toUpperCase()} | Uploaded: {new Date(material.uploadedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <a href={material.url} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-1.5 h-4 w-4" /> Download
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

