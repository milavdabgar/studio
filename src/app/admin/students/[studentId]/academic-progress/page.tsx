
"use client";

import React, { useEffect, useState, useMemo, FormEvent, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, UserCircle, BookOpen, AlertCircle, Save} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, Program, Batch, Result, Course, ResultSubject, StudentStatus } from '@/types/entities';
import { studentService } from '@/lib/api/students';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { resultService } from '@/lib/api/results';
import { courseService } from '@/lib/api/courses';
import { format, parseISO, isValid } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


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

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "graduated", label: "Graduated" },
  { value: "dropped", label: "Dropped Out" },
];


export default function AdminStudentAcademicProgressPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [studentResults, setStudentResults] = useState<Result[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [formStatus, setFormStatus] = useState<StudentStatus>('active');
  const [formCurrentSemester, setFormCurrentSemester] = useState<number | undefined>(undefined);
  const [formAcademicRemarks, setFormAcademicRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudentAcademicData = useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const studentData = await studentService.getStudentById(studentId);
      setStudent(studentData);
      setFormStatus(studentData.status);
      setFormCurrentSemester(studentData.currentSemester);
      setFormAcademicRemarks(studentData.academicRemarks || '');

      const [progData, batchData, resultsData, coursesData] = await Promise.all([
        studentData.programId ? programService.getProgramById(studentData.programId) : Promise.resolve(null),
        studentData.batchId ? batchService.getBatchById(studentData.batchId) : Promise.resolve(null),
        resultService.getStudentResults(studentData.enrollmentNumber).then(res => res.data.results || []),
        courseService.getAllCourses()
      ]);
      setProgram(progData);
      setBatch(batchData);
      setStudentResults(resultsData);
      setAllCourses(coursesData);

    } catch (error) {
      console.error("Error fetching student academic data:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load student academic data." });
    }
    setIsLoading(false);
  }, [studentId, toast]);

  useEffect(() => {
    fetchStudentAcademicData();
  }, [fetchStudentAcademicData]);

  const academicProgress = useMemo(() => {
    if (!student || !program || studentResults.length === 0 || allCourses.length === 0) {
      return {
        earnedCredits: 0,
        totalProgramCredits: program?.totalCredits || 0,
        latestCpi: 0,
        backlogs: [] as { name: string; code: string; semester: number }[],
        progressPercentage: 0,
        statusMessage: "Data insufficient for progress calculation.",
        semesterSgpa: {} as Record<number, { totalCreditPoints: number, totalCreditsAttempted: number, sgpa: number }>,
      };
    }

    let earnedCredits = 0;
    const backlogs: { name: string; code: string; semester: number }[] = [];
    const semesterSgpa: Record<number, { totalCreditPoints: number, totalCreditsAttempted: number, sgpa: number }> = {};

    studentResults.forEach(res => {
        let currentSemTotalCredits = 0;
        let currentSemEarnedCredits = 0;
        let currentSemCreditPoints = 0;

        res.subjects.forEach(sub => {
            const courseDetail = allCourses.find(c => c.subcode === sub.code && c.programId === student.programId && c.semester === res.semester);
            const credits = courseDetail?.credits || sub.credits || 0;
            currentSemTotalCredits += credits;

            if (sub.grade && sub.grade.toUpperCase() !== 'FF' && !sub.isBacklog) {
                earnedCredits += credits;
                currentSemEarnedCredits += credits;
                currentSemCreditPoints += getGradePoint(sub.grade) * credits;
            } else {
                if (!backlogs.some(b => b.code === sub.code)) {
                    backlogs.push({ name: sub.name, code: sub.code, semester: res.semester });
                }
            }
        });
        if (currentSemTotalCredits > 0) {
             semesterSgpa[res.semester] = {
                totalCreditPoints: currentSemCreditPoints,
                totalCreditsAttempted: currentSemTotalCredits,
                sgpa: parseFloat((currentSemCreditPoints / currentSemTotalCredits).toFixed(2)) || 0,
            };
        }
    });
    
    const finalBacklogs = backlogs.filter(backlogSub => {
        return !studentResults.some(res => 
            res.semester > backlogSub.semester && 
            res.subjects.some(sub => sub.code === backlogSub.code && sub.grade !== 'FF' && !sub.isBacklog)
        );
    });

    const latestResult = [...studentResults].sort((a, b) => (b.semester - a.semester) || (new Date(b.declarationDate || 0).getTime() - new Date(a.declarationDate || 0).getTime()))[0];
    const latestCpi = latestResult?.cpi || 0;
    const totalProgramCredits = program.totalCredits || 150; 
    const progressPercentage = totalProgramCredits > 0 ? (earnedCredits / totalProgramCredits) * 100 : 0;

    let statusMessage = "On Track";
    if (finalBacklogs.length > 0) statusMessage = `Attention Needed: ${finalBacklogs.length} Backlog(s)`;
    else if (progressPercentage >= 100 && (student.isPassAll || Object.values(student.semesterStatuses || {}).every(s => s === 'Passed'))) statusMessage = "Eligible for Graduation / Graduated";
    else if (progressPercentage >= 100) statusMessage = "Credits Complete, Awaiting Final Status";

    return { earnedCredits, totalProgramCredits, latestCpi, backlogs: finalBacklogs, progressPercentage, statusMessage, semesterSgpa };
  }, [student, program, studentResults, allCourses]);

  const resultsBySemester = useMemo(() => {
    const grouped = studentResults.reduce((acc, result) => {
      const sem = result.semester;
      if (!acc[sem]) acc[sem] = [];
      acc[sem].push(result);
      return acc;
    }, {} as Record<number, Result[]>);
    return Object.entries(grouped).sort(([semA], [semB]) => parseInt(semA) - parseInt(semB));
  }, [studentResults]);

  const handleUpdateAcademicStatus = async (event: FormEvent) => {
    event.preventDefault();
    if (!student || !formCurrentSemester) {
        toast({ variant: "destructive", title: "Error", description: "Student data or current semester is missing." });
        return;
    }
    setIsSubmitting(true);
    try {
      const updateData: Partial<Student> = {
        status: formStatus,
        currentSemester: formCurrentSemester,
        academicRemarks: formAcademicRemarks.trim() || undefined,
      };
      await studentService.updateStudent(student.id, updateData);
      toast({ title: "Success", description: "Student academic status updated." });
      fetchStudentAcademicData(); // Refresh data
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: (error as Error).message });
    }
    setIsSubmitting(false);
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!student) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground mb-4">Student not found.</p>
        <Button onClick={() => router.push('/admin/students')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Student List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.push('/admin/students')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Student List
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-3">
            <UserCircle className="h-7 w-7" /> {student.firstName} {student.lastName} ({student.enrollmentNumber})
          </CardTitle>
          <CardDescription>
            Program: {program?.name || 'N/A'} | Batch: {batch?.name || 'N/A'} | Current Semester: {student.currentSemester}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Card className="mb-6">
                <CardHeader><CardTitle className="text-xl">Academic Progress Overview</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 rounded-md bg-muted/50 border dark:border-gray-700"><Label className="text-xs text-muted-foreground">Overall CPI</Label><p className="text-2xl font-semibold">{academicProgress.latestCpi.toFixed(2)}</p></div>
                        <div className="p-3 rounded-md bg-muted/50 border dark:border-gray-700"><Label className="text-xs text-muted-foreground">Credits Earned</Label><p className="text-2xl font-semibold">{academicProgress.earnedCredits} / {academicProgress.totalProgramCredits}</p></div>
                        <div className="p-3 rounded-md bg-muted/50 border dark:border-gray-700"><Label className="text-xs text-muted-foreground">Status</Label><p className={`text-lg font-semibold ${academicProgress.backlogs.length > 0 ? 'text-destructive' : 'text-success'}`}>{academicProgress.statusMessage}</p></div>
                    </div>
                    <div><Label className="text-sm font-medium">Credit Completion</Label><Progress value={academicProgress.progressPercentage} className="w-full mt-1 h-3" /><p className="text-xs text-muted-foreground text-right">{academicProgress.progressPercentage.toFixed(1)}% Complete</p></div>
                    {academicProgress.semesterSgpa && Object.keys(academicProgress.semesterSgpa).length > 0 && (
                        <div><h4 className="text-md font-semibold mb-1">Semester Performance (SGPA)</h4><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">{Object.entries(academicProgress.semesterSgpa).sort(([semA], [semB]) => parseInt(semA) - parseInt(semB)).map(([semester, data]) => (<div key={semester} className="p-2 border rounded-md text-xs bg-background dark:border-gray-700"><span className="font-medium">Sem {semester}:</span> {data.sgpa.toFixed(2)}</div>))}</div></div>
                    )}
                    {academicProgress.backlogs.length > 0 && (<div><h4 className="text-md font-semibold mb-1 text-destructive flex items-center gap-1"><AlertCircle className="h-4 w-4"/> Current Backlogs</h4><ul className="list-disc list-inside pl-4 text-sm text-muted-foreground">{academicProgress.backlogs.map((backlog, index) => (<li key={index}>{backlog.name} ({backlog.code}) - Sem {backlog.semester}</li>))}</ul></div>)}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-xl">Administrative Actions</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateAcademicStatus} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><Label htmlFor="formStatusAdmin">Overall Status</Label><Select value={formStatus} onValueChange={(val) => setFormStatus(val as StudentStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label htmlFor="formCurrentSemesterAdmin">Current Semester</Label><Input type="number" id="formCurrentSemesterAdmin" value={formCurrentSemester || ''} onChange={e => setFormCurrentSemester(e.target.value ? parseInt(e.target.value) : undefined)} min="1" max="8" /></div>
                        </div>
                        <div><Label htmlFor="formAcademicRemarksAdmin">Academic Remarks / Notes</Label><Textarea id="formAcademicRemarksAdmin" value={formAcademicRemarks} onChange={e => setFormAcademicRemarks(e.target.value)} rows={3} placeholder="e.g., Detained due to low attendance, Promoted with warning, etc."/></div>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save Academic Status</Button>
                    </form>
                </CardContent>
            </Card>
            
            <Card className="mt-6">
                <CardHeader><CardTitle className="text-xl">Detailed Results History</CardTitle></CardHeader>
                <CardContent>
                     {resultsBySemester.length === 0 ? <p className="text-muted-foreground">No detailed results found.</p> :
                        resultsBySemester.map(([semester, semesterResults]) => (
                            <div key={semester} className="mb-4">
                                <h3 className="text-lg font-semibold mb-1">Semester {semester}</h3>
                                {semesterResults.sort((a,b) => new Date(b.declarationDate || 0).getTime() - new Date(a.declarationDate || 0).getTime()).map(res => (
                                    <div key={res._id} className="p-2 border rounded-md mb-2 bg-background dark:border-gray-700">
                                        <div className="flex justify-between items-baseline"><h4 className="font-medium">{res.exam}</h4><span className="text-xs text-muted-foreground">Declared: {res.declarationDate ? format(parseISO(res.declarationDate), "PPP") : "N/A"}</span></div>
                                        <p className="text-sm">SPI: <span className="font-semibold">{res.spi.toFixed(2)}</span> | CPI: <span className="font-semibold">{res.cpi.toFixed(2)}</span> | Result: <span className={`font-semibold ${res.result === 'PASS' ? 'text-success' : 'text-destructive'}`}>{res.result}</span></p>
                                        <Link href={`/admin/results/detailed/${res._id}`} ><Button variant="link" size="sm" className="p-0 h-auto text-xs">View Full Marksheet</Button></Link>
                                    </div>
                                ))}
                            </div>
                        ))
                     }
                </CardContent>
            </Card>
        </CardContent>
      </Card>
    </div>
  );
}

