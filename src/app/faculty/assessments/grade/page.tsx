"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { FilePieChart, Loader2, CheckSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Assessment, StudentAssessmentScore, CourseOffering, Student } from '@/types/entities';
import { assessmentService } from '@/lib/api/assessments';
import { courseService } from '@/lib/api/courses';
import { studentService } from '@/lib/api/students';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
// import { studentAssessmentScoreService } from '@/lib/api/studentAssessmentScores'; // To be created

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string; 
}

// MOCK DATA & SERVICES - Replace with actual API calls
const MOCK_COURSE_OFFERINGS: (CourseOffering & { courseName?: string, batchName?: string, programName?: string })[] = [
  { id: "co1", courseId: "course_cs101_dce_gpp", batchId: "batch_dce_2022_gpp", academicYear: "2023-24", semester: 1, facultyIds: ["user_faculty_cs01_gpp", "u3b"], status: "ongoing", courseName: "Intro to Programming", batchName: "CS Batch A" },
  { id: "co2", courseId: "course_me101_dme_gpp", batchId: "batch_dme_2023_gpp", academicYear: "2023-24", semester: 3, facultyIds: ["user_faculty_me01_gpp", "u3b"], status: "ongoing", courseName: "Data Structures", batchName: "CS Batch B" },
];

const mockStudentAssessmentScoreService = {
    getScoresByAssessment: async (assessmentId: string): Promise<StudentAssessmentScore[]> => {
        // Simulate fetching scores, ideally this would filter based on student's batch for the assessment
        const allStudents = await studentService.getAllStudents();
        const assessment = await assessmentService.getAssessmentById(assessmentId);
        if (!assessment || !assessment.batchId) return [];

        return allStudents
            .filter(s => s.batchId === assessment.batchId)
            .map(s => ({
                id: `score_${s.id}_${assessmentId}`,
                studentId: s.id,
                assessmentId: assessmentId,
                score: Math.floor(Math.random() * (assessment.maxMarks || 100)), // Mock score
            }));
    },
    saveScores: async (scores: Partial<StudentAssessmentScore>[]): Promise<StudentAssessmentScore[]> => {
        console.log("Saving scores (mock):", scores);
        // Mock saving and returning updated/created scores
        return scores.map((s, i) => ({ ...s, id: s.id || `new_score_${i}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })) as StudentAssessmentScore[];
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

export default function GradeAssessmentsPage() {
  const [, setUser] = useState<UserCookie | null>(null);
  const [facultyId, setFacultyId] = useState<string | null>(null); // Assuming faculty ID is derived from user ID

  const [courseOfferings, setCourseOfferings] = useState<(CourseOffering & { courseName?: string, batchName?: string, programName?: string })[]>([]);
  const [selectedCourseOfferingId, setSelectedCourseOfferingId] = useState<string>("");
  
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, { score?: number; grade?: string }>>({});
  
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
        // Assuming user.id from cookie is the SystemUser ID, which links to FacultyProfile.userId
        // This requires FacultyProfile to have userId field and API to filter faculty by userId
        setFacultyId(parsedUser.id || null); 
      } catch {
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    } else {
        toast({ variant: "destructive", title: "Authentication Error", description: "User not logged in." });
    }
  }, [toast]);


  useEffect(() => {
    if (!facultyId) return;
    const fetchFacultyCourseOfferings = async () => {
      setIsLoadingOfferings(true);
      try {
        const allCourses = await courseService.getAllCourses();
        const allBatches = await batchService.getAllBatches();
        const allPrograms = await programService.getAllPrograms();

        // Filter MOCK_COURSE_OFFERINGS for the current facultyId
        const facultyCOs = MOCK_COURSE_OFFERINGS
          .filter(co => co.facultyIds.includes(facultyId))
          .map(co => {
            const course = allCourses.find(c => c.id === co.courseId);
            const batch = allBatches.find(b => b.id === co.batchId);
            const program = batch ? allPrograms.find(p => p.id === batch.programId) : undefined;
            return {
              ...co,
              courseName: course?.subjectName || 'Unknown Course',
              batchName: batch?.name || 'Unknown Batch',
              programName: program?.name || 'Unknown Program',
            };
          });
        
        setCourseOfferings(facultyCOs);
        if (facultyCOs.length > 0) {
          setSelectedCourseOfferingId(facultyCOs[0].id);
        } else {
          toast({title: "No Courses", description: "You are not assigned to any active course offerings."});
        }
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to load your course offerings." });
      }
      setIsLoadingOfferings(false);
    };
    fetchFacultyCourseOfferings();
  }, [facultyId, toast]);


  useEffect(() => {
    if (!selectedCourseOfferingId) {
      setAssessments([]);
      setSelectedAssessmentId("");
      return;
    }
    const fetchAssessmentsForCourseOffering = async () => {
      setIsLoadingAssessments(true);
      try {
        const offering = courseOfferings.find(co => co.id === selectedCourseOfferingId);
        if (!offering) return;

        const allAssessments = await assessmentService.getAllAssessments();
        const courseAssessments = allAssessments.filter(asmnt => 
            asmnt.courseId === offering.courseId && 
            // This programId comparison logic might need adjustment based on how program info is stored on offering
            // Note: programId comparison removed as CourseOffering doesn't have programId
            // TODO: Implement proper program filtering through batch-to-program lookup
            (asmnt.batchId === offering.batchId || !asmnt.batchId) // Batch specific or program-wide for course
        );
        setAssessments(courseAssessments);
        if (courseAssessments.length > 0) {
          setSelectedAssessmentId(courseAssessments[0].id);
        } else {
            setSelectedAssessmentId("");
            setStudents([]);
            setScores({});
            toast({title: "No Assessments", description: "No assessments found for this course offering."});
        }
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to load assessments." });
      }
      setIsLoadingAssessments(false);
    };
    fetchAssessmentsForCourseOffering();
  }, [selectedCourseOfferingId, toast, courseOfferings]);

  useEffect(() => {
    if (!selectedAssessmentId) {
      setStudents([]);
      setScores({});
      return;
    }
    const loadStudentsAndScores = async () => {
      setIsLoadingStudents(true);
      try {
        const assessment = assessments.find(a => a.id === selectedAssessmentId);
        const offering = courseOfferings.find(co => co.id === selectedCourseOfferingId);
        if (!assessment || !offering || !offering.batchId) {
            setStudents([]); setScores({}); setIsLoadingStudents(false); return;
        }

        const allStudents = await studentService.getAllStudents();
        const batchStudents = allStudents.filter(s => s.batchId === offering.batchId && s.status === 'active');
        setStudents(batchStudents);
        
        const existingScores = await mockStudentAssessmentScoreService.getScoresByAssessment(selectedAssessmentId);
        const initialScores: Record<string, { score?: number; grade?: string }> = {};
        batchStudents.forEach(student => {
          const scoreRecord = existingScores.find(s => s.studentId === student.id);
          initialScores[student.id] = { score: scoreRecord?.score, grade: scoreRecord?.grade };
        });
        setScores(initialScores);

      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to load student data or scores." });
      }
      setIsLoadingStudents(false);
    };
    loadStudentsAndScores();
  }, [selectedAssessmentId, assessments, courseOfferings, selectedCourseOfferingId, toast]);

  const handleScoreChange = (studentId: string, value: string) => {
    const scoreNum = parseFloat(value);
    const assessment = assessments.find(a => a.id === selectedAssessmentId);
    if (assessment && !isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= assessment.maxMarks) {
      setScores(prev => ({ ...prev, [studentId]: { ...prev[studentId], score: scoreNum } }));
    } else if (value === "") {
       setScores(prev => ({ ...prev, [studentId]: { ...prev[studentId], score: undefined } }));
    } else {
        toast({variant: "destructive", title: "Invalid Score", description: `Score must be between 0 and ${assessment?.maxMarks || 'max'}.`});
    }
  };

  const handleGradeChange = (studentId: string, grade: string) => {
    setScores(prev => ({ ...prev, [studentId]: { ...prev[studentId], grade: grade.toUpperCase() } }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedAssessmentId || students.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please select an assessment and ensure students are loaded." });
      return;
    }
    setIsSubmitting(true);
    const scoresToSubmit: Partial<StudentAssessmentScore>[] = students
      .map(student => ({
        studentId: student.id,
        assessmentId: selectedAssessmentId,
        score: scores[student.id]?.score,
        grade: scores[student.id]?.grade,
        evaluatedBy: facultyId || "unknown_faculty", // Use actual faculty ID
      }))
      .filter(s => s.score !== undefined || s.grade !== undefined); // Only submit if there's data

    try {
      await mockStudentAssessmentScoreService.saveScores(scoresToSubmit);
      toast({ title: "Success", description: "Scores saved successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Submission Failed", description: (error as Error).message || "Could not save scores." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAssessment = assessments.find(a => a.id === selectedAssessmentId);

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <FilePieChart className="h-6 w-6" /> Grade Assessments
          </CardTitle>
          <CardDescription>Select a course offering and assessment to enter student scores and grades.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="courseOfferingSelect">Course Offering</Label>
                <Select value={selectedCourseOfferingId} onValueChange={setSelectedCourseOfferingId} disabled={isLoadingOfferings || courseOfferings.length === 0}>
                  <SelectTrigger id="courseOfferingSelect"><SelectValue placeholder="Select Course Offering" /></SelectTrigger>
                  <SelectContent>
                    {courseOfferings.map(co => (
                      <SelectItem key={co.id} value={co.id}>{co.courseName} ({co.batchName} - {co.programName})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assessmentSelect">Assessment</Label>
                <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId} disabled={isLoadingAssessments || assessments.length === 0 || !selectedCourseOfferingId}>
                  <SelectTrigger id="assessmentSelect"><SelectValue placeholder="Select Assessment" /></SelectTrigger>
                  <SelectContent>
                    {assessments.map(asmnt => (
                      <SelectItem key={asmnt.id} value={asmnt.id}>{asmnt.name} ({asmnt.type}) - Max: {asmnt.maxMarks}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(isLoadingOfferings || isLoadingAssessments || isLoadingStudents) && !isSubmitting && (
              <div className="flex justify-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading data...</span></div>
            )}

            {students.length > 0 && currentAssessment && !isLoadingStudents && (
              <>
                <div className="my-4 p-3 bg-muted/50 rounded-md">
                    <p className="text-sm">Grading for: <strong>{currentAssessment.name}</strong></p>
                    <p className="text-xs text-muted-foreground">Max Marks: {currentAssessment.maxMarks} {currentAssessment.passingMarks ? `| Passing: ${currentAssessment.passingMarks}` : ''}</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Enrollment No.</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead className="w-[120px]">Score</TableHead>
                      <TableHead className="w-[100px]">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(student => (
                      <TableRow key={student.id}>
                        <TableCell>{student.enrollmentNumber}</TableCell>
                        <TableCell>{student.firstName} {student.lastName}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={scores[student.id]?.score === undefined ? '' : scores[student.id]?.score}
                            onChange={(e) => handleScoreChange(student.id, e.target.value)}
                            max={currentAssessment.maxMarks}
                            min="0"
                            className="h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={scores[student.id]?.grade || ""}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            maxLength={3}
                            className="h-8 text-sm uppercase"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
            {students.length === 0 && selectedAssessmentId && !isLoadingStudents && (
                 <p className="text-center text-muted-foreground py-4">No active students found for the selected batch or assessment.</p>
            )}

            <CardFooter className="mt-6 px-0">
              <Button type="submit" disabled={isSubmitting || isLoadingStudents || students.length === 0 || !selectedAssessmentId}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckSquare className="mr-2 h-4 w-4" />}
                Save Grades
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}