
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Users, BookOpen, Activity, Loader2, University, Library, UsersRound, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';
import { reportService } from '@/lib/api/reports';
import type { StudentStrengthReport, Institute, CourseEnrollmentData, Program, Batch } from '@/types/entities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { instituteService } from '@/lib/api/institutes';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


export default function ReportingAnalyticsPage() {
  const { toast } = useToast();
  const [studentStrengthData, setStudentStrengthData] = useState<StudentStrengthReport | null>(null);
  const [courseEnrollmentData, setCourseEnrollmentData] = useState<CourseEnrollmentData[]>([]);
  const [isLoadingStrength, setIsLoadingStrength] = useState(false);
  const [isLoadingEnrollment, setIsLoadingEnrollment] = useState(false);
  
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [strengthFilterInstitute, setStrengthFilterInstitute] = useState<string>('all');
  const [enrollmentFilterProgram, setEnrollmentFilterProgram] = useState<string>('all');
  const [enrollmentFilterBatch, setEnrollmentFilterBatch] = useState<string>('all');
  const [enrollmentFilterAcademicYear, setEnrollmentFilterAcademicYear] = useState<string>(`${new Date().getFullYear()}-${new Date().getFullYear() % 100 + 1}`);
  const [enrollmentFilterSemester, setEnrollmentFilterSemester] = useState<string>('all');

  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const [instData, progData, batchData] = await Promise.all([
          instituteService.getAllInstitutes(),
          programService.getAllPrograms(),
          batchService.getAllBatches(),
        ]);
        setInstitutes(instData);
        setPrograms(progData);
        setBatches(batchData);
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load filter options." });
      }
    };
    fetchFiltersData();
  }, [toast]);

  const fetchStudentStrength = async () => {
    setIsLoadingStrength(true);
    try {
      const filters: { instituteId?: string } = {};
      if (strengthFilterInstitute !== 'all') filters.instituteId = strengthFilterInstitute;
      const data = await reportService.getStudentStrengthReport(filters);
      setStudentStrengthData(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not load student strength report." });
    }
    setIsLoadingStrength(false);
  };

  const fetchCourseEnrollments = async () => {
    setIsLoadingEnrollment(true);
    try {
        const filters: { programId?: string; batchId?: string; academicYear?: string; semester?: number; } = {};
        if(enrollmentFilterProgram !== 'all') filters.programId = enrollmentFilterProgram;
        if(enrollmentFilterBatch !== 'all') filters.batchId = enrollmentFilterBatch;
        if(enrollmentFilterAcademicYear) filters.academicYear = enrollmentFilterAcademicYear;
        if(enrollmentFilterSemester !== 'all') filters.semester = parseInt(enrollmentFilterSemester);

      const data = await reportService.getCourseEnrollmentReport(filters);
      setCourseEnrollmentData(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not load course enrollment report." });
    }
    setIsLoadingEnrollment(false);
  };
  
  useEffect(() => {
    fetchStudentStrength();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strengthFilterInstitute]);

  useEffect(() => {
    fetchCourseEnrollments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentFilterProgram, enrollmentFilterBatch, enrollmentFilterAcademicYear, enrollmentFilterSemester]);


  const filteredBatchesForEnrollment = useMemo(() => {
    if (enrollmentFilterProgram === 'all') return batches;
    return batches.filter(b => b.programId === enrollmentFilterProgram);
  }, [enrollmentFilterProgram, batches]);

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Reporting & Analytics
          </CardTitle>
          <CardDescription>
            Access various reports and analytical insights across the institution.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Student Strength Report Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Users className="text-primary"/>Student Strength Report</CardTitle>
          <CardDescription>View student counts by institute, program, batch, and semester.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4 items-end">
            <div>
              <Label htmlFor="strengthInstituteFilter">Filter by Institute</Label>
              <Select value={strengthFilterInstitute} onValueChange={setStrengthFilterInstitute}>
                <SelectTrigger id="strengthInstituteFilter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutes</SelectItem>
                  {institutes.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name} ({inst.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchStudentStrength} disabled={isLoadingStrength}>
              {isLoadingStrength && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Refresh Strength
            </Button>
          </div>
          {isLoadingStrength ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : studentStrengthData ? (
            <Accordion type="multiple" className="w-full">
              <div className="mb-4 p-3 bg-muted/50 rounded-md">Overall Total Students: <span className="font-bold text-lg">{studentStrengthData.overallTotal}</span></div>
              {studentStrengthData.byInstitute.map((instData, instIndex) => (
                <AccordionItem value={`institute-${instIndex}`} key={instData.instituteId}>
                  <AccordionTrigger className="text-lg hover:no-underline">
                    {instData.instituteName} ({instData.instituteCode}) - Total: {instData.totalStudents}
                  </AccordionTrigger>
                  <AccordionContent className="pl-4 space-y-2">
                    {instData.programs.length === 0 ? <p className="text-sm text-muted-foreground">No programs with students.</p> :
                    instData.programs.map((progData, progIndex) => (
                      <AccordionItem value={`institute-${instIndex}-program-${progIndex}`} key={progData.programId} className="border-l pl-4">
                        <AccordionTrigger className="text-md hover:no-underline">
                          {progData.programName} ({progData.programCode}) - Total: {progData.totalStudents}
                        </AccordionTrigger>
                        <AccordionContent className="pl-4 space-y-1">
                          {progData.batches.length === 0 ? <p className="text-sm text-muted-foreground">No batches with students.</p> :
                          progData.batches.map((batchData, batchIndex) => (
                             <AccordionItem value={`institute-${instIndex}-program-${progIndex}-batch-${batchIndex}`} key={batchData.batchId} className="border-l pl-4">
                                <AccordionTrigger className="text-sm hover:no-underline">
                                    {batchData.batchName} - Total: {batchData.totalStudents}
                                </AccordionTrigger>
                                <AccordionContent className="pl-4">
                                    {batchData.semesters.length === 0 ? <p className="text-xs text-muted-foreground">No students in semesters.</p> :
                                    <ul className="list-disc list-inside text-xs">
                                        {batchData.semesters.map(semData => (
                                            <li key={semData.semester}>Semester {semData.semester}: {semData.totalStudents}</li>
                                        ))}
                                    </ul>}
                                </AccordionContent>
                             </AccordionItem>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-muted-foreground py-8">No student strength data available. Try different filters or refresh.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Course Enrollment Report Section */}
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Library className="text-primary"/>Course Enrollment Report</CardTitle>
            <CardDescription>View student enrollment counts for course offerings.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div>
                    <Label htmlFor="enrollmentAcademicYearFilter">Academic Year</Label>
                    <Input id="enrollmentAcademicYearFilter" value={enrollmentFilterAcademicYear} onChange={e=>setEnrollmentFilterAcademicYear(e.target.value)} placeholder="e.g., 2024-25" />
                </div>
                <div>
                    <Label htmlFor="enrollmentProgramFilter">Program</Label>
                    <Select value={enrollmentFilterProgram} onValueChange={val => {setEnrollmentFilterProgram(val); setEnrollmentFilterBatch('all');}}>
                        <SelectTrigger id="enrollmentProgramFilter"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Programs</SelectItem>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="enrollmentBatchFilter">Batch</Label>
                    <Select value={enrollmentFilterBatch} onValueChange={setEnrollmentFilterBatch} disabled={filteredBatchesForEnrollment.length === 0}>
                        <SelectTrigger id="enrollmentBatchFilter"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Batches</SelectItem>{filteredBatchesForEnrollment.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="enrollmentSemesterFilter">Semester</Label>
                    <Select value={enrollmentFilterSemester} onValueChange={setEnrollmentFilterSemester}>
                        <SelectTrigger id="enrollmentSemesterFilter"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Semesters</SelectItem>{[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>
            {isLoadingEnrollment ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : courseEnrollmentData.length > 0 ? (
                <Table>
                    <TableHeader><TableRow>
                        <TableHead>Course</TableHead><TableHead>Program</TableHead><TableHead>Batch</TableHead><TableHead>AY</TableHead><TableHead>Sem</TableHead><TableHead className="text-center">Enrolled</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                        {courseEnrollmentData.map(item => (
                            <TableRow key={item.courseOfferingId}>
                                <TableCell className="font-medium">{item.courseName} ({item.courseCode})</TableCell>
                                <TableCell>{item.programName}</TableCell>
                                <TableCell>{item.batchName}</TableCell>
                                <TableCell>{item.academicYear}</TableCell>
                                <TableCell className="text-center">{item.semester}</TableCell>
                                <TableCell className="text-center font-semibold">{item.enrolledStudents}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                 <p className="text-center text-muted-foreground py-8">No course enrollment data for the current filters.</p>
            )}
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Activity className="text-primary"/>Custom Report Generator (Placeholder)</CardTitle>
            <CardDescription>Tool for generating custom reports based on selected parameters (Future Implementation).</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">This feature will allow administrators to build and export custom reports to meet specific analytical needs.</p>
        </CardContent>
      </Card>
    </div>
  );
}
