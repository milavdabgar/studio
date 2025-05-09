"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, Loader2, Filter, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, StudentAssessmentScore, Assessment, Course, Program } from '@/types/entities';
import { studentService } from '@/lib/api/students';
import { assessmentService } from '@/lib/api/assessments';
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

interface EnrichedScore extends StudentAssessmentScore {
  assessmentName?: string;
  courseName?: string;
  courseSubcode?: string;
  maxMarks?: number;
  semester?: number;
  assessmentType?: string;
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

export default function StudentResultsPage() {
  const [scores, setScores] = useState<EnrichedScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>("all");
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>("all");


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

    const fetchResultsData = async () => {
      setIsLoading(true);
      try {
        const allStudents = await studentService.getAllStudents();
        const studentProfile = allStudents.find(s => s.userId === user.id);
        setCurrentStudent(studentProfile || null);

        if (studentProfile) {
          // This part is a placeholder. Actual StudentAssessmentScore fetching would be needed.
          // For now, let's assume scores are fetched by studentId.
          // const studentScores = await studentAssessmentScoreService.getScoresByStudentId(studentProfile.id); 
          // MOCKING SCORES for now as StudentAssessmentScore service/API is not ready
          
          const allAssessments = await assessmentService.getAllAssessments();
          const allCourses = await courseService.getAllCourses();
          const allPrograms = await programService.getAllPrograms();
          setPrograms(allPrograms);

          // Mock scores based on existing assessments, assign some to current student
          const mockScores: EnrichedScore[] = allAssessments
            .filter(asmnt => asmnt.programId === studentProfile.programId) // Filter assessments by student's program
            .map((asmnt, index) => {
                const course = allCourses.find(c => c.id === asmnt.courseId);
                return {
                    id: `score_${studentProfile.id}_${asmnt.id}`,
                    studentId: studentProfile.id,
                    assessmentId: asmnt.id,
                    score: Math.floor(Math.random() * (asmnt.maxMarks - (asmnt.passingMarks || asmnt.maxMarks * 0.4))) + (asmnt.passingMarks || Math.floor(asmnt.maxMarks * 0.4)), // Random score above passing
                    grade: ['A', 'B+', 'B', 'C+'][index % 4], // Mock grade
                    assessmentName: asmnt.name,
                    courseName: course?.subjectName || "Unknown Course",
                    courseSubcode: course?.subcode || "N/A",
                    maxMarks: asmnt.maxMarks,
                    semester: course?.semester,
                    assessmentType: asmnt.type
                };
            });

          setScores(mockScores);
        } else {
          setScores([]);
          toast({ variant: "warning", title: "No Profile", description: "Student profile not found." });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load results data." });
      }
      setIsLoading(false);
    };

    fetchResultsData();
  }, [user, toast]);

  const uniqueSemesters = useMemo(() => {
    const semesters = new Set(scores.map(s => s.semester).filter(Boolean).map(String));
    return Array.from(semesters).sort((a,b) => parseInt(a) - parseInt(b));
  }, [scores]);
  
  const studentProgram = useMemo(() => {
    if (!currentStudent || !currentStudent.programId) return null;
    return programs.find(p => p.id === currentStudent.programId);
  }, [currentStudent, programs]);


  const filteredScores = useMemo(() => {
    let filtered = [...scores];
    if (selectedProgramFilter !== "all" && studentProgram && studentProgram.id !== selectedProgramFilter) {
        // This case should not happen if program filter only shows current student's program
        return []; 
    }
    if (selectedSemesterFilter !== "all") {
      filtered = filtered.filter(score => score.semester?.toString() === selectedSemesterFilter);
    }
    return filtered;
  }, [scores, selectedProgramFilter, selectedSemesterFilter, studentProgram]);

  const groupedScores = useMemo(() => {
    return filteredScores.reduce((acc, score) => {
      const semester = score.semester || 0; // Group by semester
      if (!acc[semester]) {
        acc[semester] = [];
      }
      acc[semester].push(score);
      return acc;
    }, {} as Record<number, EnrichedScore[]>);
  }, [filteredScores]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Award className="h-6 w-6" /> My Academic Results
          </CardTitle>
          <CardDescription>View your assessment scores and grades.</CardDescription>
        </CardHeader>
        <CardContent>
          {scores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No results found.</p>
          ) : (
            <>
             <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                    <Label htmlFor="programFilter">Program</Label>
                    <Select value={studentProgram?.id || "all"} disabled>
                        <SelectTrigger id="programFilter">
                            <SelectValue placeholder="Program (Auto-selected)" />
                        </SelectTrigger>
                        <SelectContent>
                            {studentProgram ? <SelectItem value={studentProgram.id}>{studentProgram.name} ({studentProgram.code})</SelectItem> : <SelectItem value="all" disabled>No Program Assigned</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="semesterFilter">Filter by Semester</Label>
                    <Select value={selectedSemesterFilter} onValueChange={setSelectedSemesterFilter} disabled={uniqueSemesters.length === 0}>
                        <SelectTrigger id="semesterFilter"><SelectValue placeholder="All Semesters" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Semesters</SelectItem>
                            {uniqueSemesters.map(sem => (
                                <SelectItem key={sem} value={sem}>Semester {sem}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {Object.keys(groupedScores).sort((a,b) => parseInt(a) - parseInt(b)).map(semesterKey => {
                const semester = parseInt(semesterKey);
                const semesterScores = groupedScores[semester];
                if (!semesterScores || semesterScores.length === 0) return null;

                // Calculate SGPA for the semester (mock calculation)
                let totalCredits = 0;
                let weightedGradePoints = 0;
                semesterScores.forEach(score => {
                    // This is a very simplified SGPA. Real calculation is more complex.
                    // Assuming grade points: A=10, B+=9, B=8, C+=7. Credits mock = 4 for each course
                    const gradePoints = {'A': 10, 'B+': 9, 'B': 8, 'C+': 7}[score.grade || ''] || 0;
                    const credits = 4; // MOCK
                    totalCredits += credits;
                    weightedGradePoints += gradePoints * credits;
                });
                const sgpa = totalCredits > 0 ? (weightedGradePoints / totalCredits).toFixed(2) : "N/A";

                return (
                    <Card key={semester} className="mb-6 bg-card shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl text-secondary flex items-center justify-between">
                                <span>Semester {semester} Results</span>
                                <span className="text-lg font-medium">SGPA: {sgpa}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Assessment</TableHead>
                                    <TableHead className="text-center">Type</TableHead>
                                    <TableHead className="text-right">Score</TableHead>
                                    <TableHead className="text-center">Grade</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {semesterScores.map(score => (
                                    <TableRow key={score.id}>
                                    <TableCell>
                                        <div className="font-medium">{score.courseName}</div>
                                        <div className="text-xs text-muted-foreground">{score.courseSubcode}</div>
                                    </TableCell>
                                    <TableCell>{score.assessmentName}</TableCell>
                                    <TableCell className="text-center">{score.assessmentType}</TableCell>
                                    <TableCell className="text-right">{score.score !== undefined ? `${score.score} / ${score.maxMarks}` : "N/A"}</TableCell>
                                    <TableCell className="text-center font-semibold">{score.grade || "N/A"}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                );
            })}
            {Object.keys(groupedScores).length === 0 && (
                 <p className="text-center text-muted-foreground py-6">No results match your current filter.</p>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
