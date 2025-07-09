"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label"; // Added Label import
import type { Result, Student, Program } from '@/types/entities';
import { resultService } from '@/lib/api/results';
import { studentService } from '@/lib/api/students';
import { programService } from '@/lib/api/programs';
import { format } from 'date-fns';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DetailedResultViewProps {
  resultId: string;
}

export default function DetailedResultView({ resultId }: DetailedResultViewProps) {
  const [result, setResult] = useState<Result | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!resultId) return;

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const resultDataResponse = await resultService.getResultById(resultId);
        const resultData = resultDataResponse.data.result;
        setResult(resultData);

        if (resultData.enrollmentNo) {
          // This is a simplification. In a real app, you might fetch student by ID from resultData.studentId.
          // For now, assuming enrollmentNo is unique and sufficient.
          const allStudents = await studentService.getAllStudents();
          const studentData = allStudents.find(s => s.enrollmentNumber === resultData.enrollmentNo);
          setStudent(studentData || null);

          if (studentData?.programId) {
            const programData = await programService.getProgramById(studentData.programId);
            setProgram(programData);
          }
        }

        // Course details are already available in resultData.subjects, no need to fetch separately

      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not load result details." });
      }
      setIsLoading(false);
    };
    fetchDetails();
  }, [resultId, toast]);

  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!result) {
    return <div className="text-center py-10 text-muted-foreground">Result not found.</div>;
  }

  const getGradePoint = (grade: string): number => {
    const gradePoints: Record<string, number> = {
      'AA': 10, 'AB': 9, 'BB': 8, 'BC': 7, 'CC': 6, 'CD': 5, 'DD': 4, 'FF': 0,
    };
    return gradePoints[grade.toUpperCase()] || 0;
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <FileText className="h-6 w-6" /> Detailed Marksheet
        </CardTitle>
        <CardDescription>
            Result for {result.exam || 'Unknown Exam'} - Semester {result.semester} ({result.academicYear || 'N/A'})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/30 dark:border-gray-700">
            <div>
                <Label className="text-sm text-muted-foreground">Student Name</Label>
                <p className="font-semibold">{student?.firstName} {student?.lastName || result.name}</p>
            </div>
             <div>
                <Label className="text-sm text-muted-foreground">Enrollment No.</Label>
                <p className="font-semibold">{result.enrollmentNo}</p>
            </div>
            <div>
                <Label className="text-sm text-muted-foreground">Program</Label>
                <p className="font-semibold">{program?.name || result.branchName}</p>
            </div>
            <div>
                <Label className="text-sm text-muted-foreground">Declaration Date</Label>
                <p className="font-semibold">{result.declarationDate ? format(new Date(result.declarationDate), "PPP") : 'N/A'}</p>
            </div>
        </div>

        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Sub. Code</TableHead>
                    <TableHead>Subject Name</TableHead>
                    <TableHead className="text-center">Credits</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Grade Point</TableHead>
                    {/* Add more headers for ESE/PA marks if available and desired */}
                </TableRow>
            </TableHeader>
            <TableBody>
                {result.subjects.map((subject, index) => {
                    return (
                        <TableRow key={subject.code + index} className={subject.isBacklog ? "bg-red-50 dark:bg-red-900/30" : ""}>
                            <TableCell>{subject.code}</TableCell>
                            <TableCell className="font-medium">{subject.name}</TableCell>
                            <TableCell className="text-center">{subject.credits}</TableCell>
                            <TableCell className="text-center font-semibold">{subject.grade}</TableCell>
                            <TableCell className="text-center">{getGradePoint(subject.grade)}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
        
        <div className="grid md:grid-cols-3 gap-4 pt-4 border-t dark:border-gray-700">
            <div className="p-3 rounded-md bg-primary/10 text-center dark:bg-primary/20">
                <Label className="text-sm text-primary/80">Semester Performance Index (SPI)</Label>
                <p className="text-2xl font-bold text-primary">{result.spi.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-md bg-secondary/10 text-center">
                <Label className="text-sm text-secondary/80">Cumulative Performance Index (CPI)</Label>
                <p className="text-2xl font-bold text-secondary">{result.cpi.toFixed(2)}</p>
            </div>
             <div className={`p-3 rounded-md text-center ${result.result === 'PASS' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <Label className={`text-sm ${result.result === 'PASS' ? 'text-success/80' : 'text-destructive/80'}`}>Overall Result</Label>
                <p className={`text-2xl font-bold ${result.result === 'PASS' ? 'text-success' : 'text-destructive'}`}>{result.result}</p>
            </div>
        </div>

        {result.remark && (
            <div className="p-3 rounded-md bg-muted/50">
                <Label className="text-sm text-muted-foreground">Remarks</Label>
                <p className="text-sm">{result.remark}</p>
            </div>
        )}
        {result.currentBacklog !== undefined && result.currentBacklog > 0 && (
             <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Current Backlogs: {result.currentBacklog}. Total Backlogs: {result.totalBacklog}.
                </AlertDescription>
            </Alert>
        )}
         {result.result === "PASS" && (result.currentBacklog === undefined || result.currentBacklog === 0) && (
            <Alert variant="default" className="mt-4 bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300 dark:border-gray-700">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                    Congratulations on passing this semester!
                </AlertDescription>
            </Alert>
        )}


      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          This marksheet is provisional and for informational purposes only. Please contact the examination cell for official documents.
        </p>
      </CardFooter>
    </Card>
  );
}
