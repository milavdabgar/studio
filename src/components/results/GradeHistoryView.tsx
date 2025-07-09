"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, User, BarChart3} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Result, Student, Program } from '@/types/entities';
import { resultService } from '@/lib/api/results';
import { studentService } from '@/lib/api/students';
import { programService } from '@/lib/api/programs';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '../ui/button';

interface GradeHistoryViewProps {
  studentEnrollmentNo: string;
}

export default function GradeHistoryView({ studentEnrollmentNo }: GradeHistoryViewProps) {
  const [results, setResults] = useState<Result[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!studentEnrollmentNo) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const studentResultsResponse = await resultService.getStudentResults(studentEnrollmentNo);
        setResults(studentResultsResponse.data.results || []);

        // Fetch student details if not already available
        const allStudents = await studentService.getAllStudents();
        const studentData = allStudents.find(s => s.enrollmentNumber === studentEnrollmentNo);
        setStudent(studentData || null);

        if (studentData?.programId) {
          const programData = await programService.getProgramById(studentData.programId);
          setProgram(programData);
        }

      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not load grade history." });
      }
      setIsLoading(false);
    };
    fetchHistory();
  }, [studentEnrollmentNo, toast]);

  const resultsBySemester = useMemo(() => {
    const grouped: Record<number, Result[]> = {};
    results.forEach(result => {
      if (!grouped[result.semester]) {
        grouped[result.semester] = [];
      }
      grouped[result.semester].push(result);
    });
    return Object.entries(grouped).sort(([semA], [semB]) => parseInt(semA) - parseInt(semB));
  }, [results]);

  const overallCpi = useMemo(() => {
    if (results.length === 0) return 0;
    // Find the result with the highest semester number as it usually contains the latest CPI
    const latestResult = results.reduce((latest, current) => (current.semester > latest.semester ? current : latest), results[0]);
    return latestResult.cpi || 0;
  }, [results]);

  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!student) {
    return <div className="text-center py-10 text-muted-foreground">Student profile not found for enrollment: {studentEnrollmentNo}.</div>;
  }

  return (
      <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                <User className="h-6 w-6" /> Grade History: {student.firstName} {student.lastName}
            </CardTitle>
            <CardDescription>
                Enrollment: {student.enrollmentNumber} | Program: {program?.name || 'N/A'} <br/>
                Overall CPI: <span className="font-semibold">{overallCpi.toFixed(2)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {resultsBySemester.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No results found for this student.</p>
            ) : (
                resultsBySemester.map(([semester, semesterResults]) => (
                    <Card key={semester} className="bg-card shadow">
                        <CardHeader>
                            <CardTitle className="text-lg text-secondary">Semester {semester}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Exam</TableHead>
                                        <TableHead className="text-center">SPI</TableHead>
                                        <TableHead className="text-center">Result</TableHead>
                                        <TableHead className="text-right">Declaration Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {semesterResults.sort((a,b) => new Date(b.declarationDate || 0).getTime() - new Date(a.declarationDate || 0).getTime()).map(result => (
                                        <TableRow key={result._id}>
                                            <TableCell className="font-medium">{result.exam || 'N/A'}</TableCell>
                                            <TableCell className="text-center">{result.spi.toFixed(2)}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${result.result === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {result.result}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">{result.declarationDate ? format(new Date(result.declarationDate), "PPP") : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/results/detailed/${result._id}`}>View Details</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))
            )}
             {results.length > 0 && (
                 <div className="mt-6 p-4 border rounded-lg bg-muted/30 dark:border-gray-700">
                    <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><BarChart3 className="text-primary"/>Performance Trend (Placeholder)</h3>
                    <div className="h-40 flex items-center justify-center text-muted-foreground bg-background rounded">
                        Graph/Chart visualizing CPI/SPI trend over semesters will be shown here.
                    </div>
                 </div>
             )}
          </CardContent>
      </Card>
  );
}
