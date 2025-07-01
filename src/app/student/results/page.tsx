"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, Loader2, CheckCircle, XCircle, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Result, Student, Program, Course, ResultSubject } from '@/types/entities';
import { resultService } from '@/lib/api/results';
import { studentService } from '@/lib/api/students';
import { programService } from '@/lib/api/programs';
import { courseService } from '@/lib/api/courses';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

// Helper for grade points (can be moved to a utils file)
const getGradePoint = (grade?: string): number => {
    if (!grade) return 0;
    switch (grade.toUpperCase()) {
        case 'AA': return 10;
        case 'AB': return 9;
        case 'BB': return 8;
        case 'BC': return 7;
        case 'CC': return 6;
        case 'CD': return 5;
        case 'DD': return 4;
        case 'FF': return 0;
        default: return 0;
    }
};

export default function StudentResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [coursesDetails, setCoursesDetails] = useState<Record<string, Course>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);

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

    const fetchStudentData = async () => {
      setIsLoading(true);
      try {
        const allStudents = await studentService.getAllStudents();
        const studentProfile = allStudents.find(s => s.userId === user.id);
        setStudent(studentProfile || null);

        if (studentProfile) {
          const studentResultsResponse = await resultService.getStudentResults(studentProfile.enrollmentNumber);
          setResults(studentResultsResponse.data.results || []);

          if (studentProfile.programId) {
            const programData = await programService.getProgramById(studentProfile.programId);
            setProgram(programData);
          }
          
          // Fetch all courses to map subject codes to names/credits if needed
          const allCourses = await courseService.getAllCourses();
          const courseMap: Record<string, Course> = {};
          allCourses.forEach(c => { courseMap[c.subcode] = c }); // Assuming subcode is unique enough for this context
          setCoursesDetails(courseMap);

        } else {
          setResults([]);
          toast({ variant: "warning", title: "No Profile", description: "Student profile not found." });
        }
      } catch (error) {
        console.error("Error fetching student results data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load results data." });
      }
      setIsLoading(false);
    };

    fetchStudentData();
  }, [user, toast]);

  const resultsBySemester = useMemo(() => {
    const grouped: Record<number, Result[]> = {};
    results.forEach(result => {
      const semesterKey = result.semester || 0; // Group results with no semester under 0 or handle differently
      if (!grouped[semesterKey]) {
        grouped[semesterKey] = [];
      }
      grouped[semesterKey].push(result);
    });
    // Sort by semester number
    return Object.entries(grouped).sort(([semA], [semB]) => parseInt(semA) - parseInt(semB));
  }, [results]);

  const overallCpi = useMemo(() => {
    if (results.length === 0) return 0;
    const latestResult = results.reduce((latest, current) => 
      (current.semester > latest.semester) || (current.semester === latest.semester && new Date(current.declarationDate || 0) > new Date(latest.declarationDate || 0)) 
      ? current : latest
    , results[0]);
    return latestResult.cpi || 0;
  }, [results]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!student) {
    return <div className="text-center py-10">Student profile not loaded. Cannot display results.</div>;
  }
  
  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-3">
            <Award className="h-8 w-8" /> My Academic Results
          </CardTitle>
          <CardDescription>
            Enrollment: {student.enrollmentNumber} | Program: {program?.name || 'N/A'} <br/>
            Overall CPI: <span className="font-semibold">{overallCpi.toFixed(2)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {resultsBySemester.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Award className="mx-auto h-12 w-12 mb-4" />
              <p>No results found for your program yet. Please check back later.</p>
            </div>
          ) : (
            resultsBySemester.map(([semester, semesterResults]) => {
                const semesterKey = parseInt(semester);
                if (semesterResults.length === 0) return null;
                
                // For SGPA, we ideally want the latest result for that semester
                const latestSemesterResult = semesterResults.sort((a,b) => new Date(b.declarationDate || 0).getTime() - new Date(a.declarationDate || 0).getTime())[0];
                const sgpa = latestSemesterResult?.spi?.toFixed(2) || "N/A";

                return (
                    <Card key={semesterKey} className="bg-card shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl text-secondary flex items-center justify-between">
                                <span>Semester {semesterKey} Results</span>
                                <span className="text-lg font-medium">SGPA: <span className="text-primary">{sgpa}</span></span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                             {semesterResults.sort((a,b) => new Date(b.declarationDate || 0).getTime() - new Date(a.declarationDate || 0).getTime()).map(result => (
                                <div key={result._id} className="mb-4 p-3 border rounded-md bg-background dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-semibold">{result.exam || 'Exam Result'}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${result.result === 'PASS' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                                            {result.result}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">Declared: {result.declarationDate ? format(parseISO(result.declarationDate), "PPP") : 'N/A'}</p>
                                    <Table>
                                        <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-1/4">Subject Code</TableHead>
                                            <TableHead className="w-2/4">Subject Name</TableHead>
                                            <TableHead className="text-center w-1/12">Credits</TableHead>
                                            <TableHead className="text-center w-1/12">Grade</TableHead>
                                        </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {result.subjects.map((subject, index) => (
                                            <TableRow key={`${result._id}-sub-${index}`} className={subject.isBacklog ? "bg-red-50 dark:bg-red-900/20" : ""}>
                                                <TableCell>{subject.code}</TableCell>
                                                <TableCell className="font-medium">{subject.name || coursesDetails[subject.code]?.subjectName || 'N/A'}</TableCell>
                                                <TableCell className="text-center">{subject.credits || coursesDetails[subject.code]?.credits || 'N/A'}</TableCell>
                                                <TableCell className="text-center font-semibold">{subject.grade}</TableCell>
                                            </TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                     <div className="mt-3 text-right">
                                        <Link href={`/admin/results/detailed/${result._id}`} passHref>
                                            <Button variant="link" size="sm" className="text-xs">View Full Marksheet</Button>
                                        </Link>
                                    </div>
                                </div>
                             ))}
                        </CardContent>
                    </Card>
                );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
