"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, Loader2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, StudentAssessmentScore, Assessment, Course, Program, Batch } from '@/types/entities';
import { studentService } from '@/lib/api/students';
import { assessmentService } from '@/lib/api/assessments';
import { courseService } from '@/lib/api/courses';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
// import { studentAssessmentScoreService } from '@/lib/api/studentAssessmentScores'; // To be created if backend supports it
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string; 
}

interface EnrichedScore extends Partial<StudentAssessmentScore> { // Made StudentAssessmentScore partial to allow for mocking
  assessmentName?: string;
  courseName?: string;
  courseSubcode?: string;
  maxMarks?: number;
  semester?: number;
  assessmentType?: string;
  courseCredits?: number; // Added for SGPA calculation
}

// Mock service for student submissions/scores
const mockStudentAssessmentScoreService = {
  getScoresByStudentId: async (studentId: string): Promise<Partial<StudentAssessmentScore>[]> => {
    // This is a placeholder. In a real app, this would fetch scores from the backend.
    // For now, we'll generate mock scores based on assessments the student *might* have taken.
    const allAssessments = await assessmentService.getAllAssessments();
    const student = await studentService.getStudentById(studentId); // Assume this service works or mock it
    
    if (!student || !student.programId) return [];

    const relevantAssessments = allAssessments.filter(
      asmnt => asmnt.programId === student.programId && 
               (asmnt.batchId === student.batchId || !asmnt.batchId)
    );

    return relevantAssessments.map((asmnt, index) => {
      const passingScore = asmnt.passingMarks || asmnt.maxMarks * 0.4;
      const score = Math.floor(Math.random() * (asmnt.maxMarks - passingScore) + passingScore);
      let grade = 'N/A';
      const percentage = (score / asmnt.maxMarks) * 100;
      if (percentage >= 90) grade = 'AA';
      else if (percentage >= 80) grade = 'AB';
      else if (percentage >= 70) grade = 'BB';
      else if (percentage >= 60) grade = 'BC';
      else if (percentage >= 50) grade = 'CC';
      else if (percentage >= 40) grade = 'CD';
      else if (percentage >= 35) grade = 'DD';
      else grade = 'FF';
      
      return {
        id: `score_${studentId}_${asmnt.id}`,
        studentId: studentId,
        assessmentId: asmnt.id,
        score: score,
        grade: grade, 
        evaluatedAt: new Date().toISOString(), // Mock evaluation date
      };
    });
  },
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

// Helper for grade points
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
  const [scores, setScores] = useState<EnrichedScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>("all"); // Will be set to student's program
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

        if (studentProfile && studentProfile.programId) {
          const [studentScores, allAssessments, allCourses, allProgramsData] = await Promise.all([
            mockStudentAssessmentScoreService.getScoresByStudentId(studentProfile.id),
            assessmentService.getAllAssessments(),
            courseService.getAllCourses(),
            programService.getAllPrograms()
          ]);
          setPrograms(allProgramsData);
          setSelectedProgramFilter(studentProfile.programId); // Set program filter to student's program

          const enrichedScores = studentScores.map(score => {
            const assessment = allAssessments.find(a => a.id === score.assessmentId);
            const course = assessment ? allCourses.find(c => c.id === assessment.courseId) : undefined;
            return {
              ...score,
              assessmentName: assessment?.name || "Unknown Assessment",
              courseName: course?.subjectName || "Unknown Course",
              courseSubcode: course?.subcode || "N/A",
              maxMarks: assessment?.maxMarks,
              semester: course?.semester,
              assessmentType: assessment?.type,
              courseCredits: course?.credits || 0, // Default to 0 if no credits
            };
          });
          setScores(enrichedScores);
        } else {
          setScores([]);
          if(studentProfile && !studentProfile.programId){
            toast({ variant: "warning", title: "No Program", description: "Student is not enrolled in a program." });
          } else if (!studentProfile) {
             toast({ variant: "warning", title: "No Profile", description: "Student profile not found." });
          }
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
  
  const studentProgramDetails = useMemo(() => {
    if (!currentStudent || !currentStudent.programId) return null;
    return programs.find(p => p.id === currentStudent.programId);
  }, [currentStudent, programs]);

  const filteredScores = useMemo(() => {
    let filtered = [...scores];
    // Program filter is implicitly handled by fetching scores for the student's program
    if (selectedSemesterFilter !== "all") {
      filtered = filtered.filter(score => score.semester?.toString() === selectedSemesterFilter);
    }
    return filtered;
  }, [scores, selectedSemesterFilter]);

  const groupedScoresBySemester = useMemo(() => {
    return filteredScores.reduce((acc, score) => {
      const semester = score.semester || 0;
      if (!acc[semester]) acc[semester] = { scores: [], totalCredits: 0, weightedGradePoints: 0 };
      
      acc[semester].scores.push(score);
      const gradePoint = getGradePoint(score.grade);
      const credits = score.courseCredits || 0; // Default to 0 credits if not defined
      if (credits > 0) { // Only include courses with credits in SGPA calculation
        acc[semester].totalCredits += credits;
        acc[semester].weightedGradePoints += gradePoint * credits;
      }
      return acc;
    }, {} as Record<number, { scores: EnrichedScore[]; totalCredits: number; weightedGradePoints: number }>);
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
          <CardDescription>View your assessment scores, grades, and SGPA for each semester.</CardDescription>
        </CardHeader>
        <CardContent>
          {!currentStudent ? (
             <p className="text-center text-muted-foreground py-8">Student profile not loaded. Cannot display results.</p>
          ) : scores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No results found for your program.</p>
          ) : (
            <>
             <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                    <Label htmlFor="programDisplay">Program</Label>
                    <Input id="programDisplay" value={studentProgramDetails ? `${studentProgramDetails.name} (${studentProgramDetails.code})` : "N/A"} disabled />
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

            {Object.keys(groupedScoresBySemester).length === 0 && selectedSemesterFilter !== "all" && (
                 <p className="text-center text-muted-foreground py-6">No results found for Semester {selectedSemesterFilter}.</p>
            )}

            {Object.keys(groupedScoresBySemester).sort((a,b) => parseInt(a) - parseInt(b)).map(semesterKey => {
                const semester = parseInt(semesterKey);
                const { scores: semesterScores, totalCredits, weightedGradePoints } = groupedScoresBySemester[semester];
                if (!semesterScores || semesterScores.length === 0) return null;

                const sgpa = totalCredits > 0 ? (weightedGradePoints / totalCredits).toFixed(2) : "N/A";

                return (
                    <Card key={semester} className="mb-6 bg-card shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl text-secondary flex items-center justify-between">
                                <span>Semester {semester} Results</span>
                                <span className="text-lg font-medium">SGPA: <span className="text-primary">{sgpa}</span></span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead className="w-2/5">Course</TableHead>
                                    <TableHead className="w-2/5">Assessment</TableHead>
                                    <TableHead className="text-center w-1/12">Type</TableHead>
                                    <TableHead className="text-right w-1/12">Score</TableHead>
                                    <TableHead className="text-center w-1/12">Grade</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {semesterScores.map(score => (
                                    <TableRow key={score.id}>
                                    <TableCell>
                                        <div className="font-medium">{score.courseName}</div>
                                        <div className="text-xs text-muted-foreground">{score.courseSubcode} (Credits: {score.courseCredits})</div>
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
            
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

