"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet, UploadCloud, Loader2, Download, BookCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resultService } from '@/lib/api/results';
import type { Program } from '@/types/entities';
import { programService } from '@/lib/api/programs';


export default function ImportResultsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false); // General loading for page data
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submissions
  
  const [standardFile, setStandardFile] = useState<File | null>(null);
  const [gtuFile, setGtuFile] = useState<File | null>(null);
  
  // For standard import, if needed for context (not currently used for API call directly)
  const [examType, setExamType] = useState<string>(""); 
  const [academicYear, setAcademicYear] = useState<string>(""); 

  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    const fetchPrograms = async () => {
      setIsLoading(true);
      try {
        const progData = await programService.getAllPrograms();
        setPrograms(progData);
      } catch (error) {
        toast({ variant: "destructive", title: "Error Loading Programs", description: "Could not load programs for mapping. GTU import might not work correctly." });
      }
      setIsLoading(false);
    };
    fetchPrograms();
  }, [toast]);


  const handleStandardFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setStandardFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
  };
  
  const handleGtuFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setGtuFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
  };

  const handleStandardSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!standardFile) { // Removed examType and academicYear from this check as they are not passed to API
      toast({ variant: "destructive", title: "Missing File", description: "Please select a file for standard import." });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await resultService.importResults(standardFile); 
      toast({ title: "Import Successful", description: `${result.data.importedCount} results imported from standard CSV. Batch ID: ${result.data.batchId}` });
      setStandardFile(null);
      const fileInput = document.getElementById('standardResultsFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      toast({ variant: "destructive", title: "Import Failed", description: error.message || "Could not import standard results." });
    }
    setIsSubmitting(false);
  };
  
  const handleGtuSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!gtuFile) {
      toast({ variant: "destructive", title: "Missing File", description: "Please select a GTU CSV file." });
      return;
    }
     if (programs.length === 0) {
      toast({ variant: "destructive", title: "Prerequisite Missing", description: "Program data is not loaded. Cannot process GTU import." });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await resultService.importGtuResults(gtuFile, programs);
      toast({ title: "GTU Import Successful", description: `${result.newCount} results processed. New: ${result.newCount}, Updated: ${result.updatedCount}, Skipped: ${result.skippedCount}.` });
      setGtuFile(null);
      const fileInput = document.getElementById('gtuResultsFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      toast({ variant: "destructive", title: "GTU Import Failed", description: error.message || "Could not import GTU results." });
    }
    setIsSubmitting(false);
  };
  
  const handleDownloadStandardSampleCsv = () => {
    const sampleCsvContent = `EnrollmentNumber,StudentName,ExamName,Semester,BranchName,AcademicYear,SPI,CPI,OverallResult,SubjectCode1,SubjectName1,SubjectCredits1,SubjectGrade1,SubjectCode2,SubjectName2,SubjectCredits2,SubjectGrade2\n220010107001,John Doe,Mid Sem 1,1,Computer Engineering,2023-24,8.5,8.5,PASS,CS101,Programming,4,AA,CS102,Data Structures,3,AB\n`;
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_standard_results_import.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_standard_results_import.csv downloaded." });
  };
  
  const handleDownloadGtuSampleCsv = () => {
    let sampleProgramCode = "DCE"; 
    let sampleProgramName = "Diploma in Computer Engineering";
    let sampleBranchName = "Computer Engineering";
    const sampleCourseName = "Computer Course";
    const sampleSubjectCode1 = "3310701"; 
    const sampleSubjectCode2 = "3300001";
    const sampleStudentName = "SURNAME FIRST MIDDLE";
    const sampleEnrollment = "220010107001"; 

    if (programs.length > 0) {
      const firstProgram = programs[0];
      sampleProgramCode = firstProgram.code;
      sampleProgramName = firstProgram.name;
      sampleBranchName = firstProgram.name.split(" in ")[1] || firstProgram.name; // Attempt to get branch part
    } else if (!isLoading) { // Only show toast if programs are confirmed empty and not still loading
      toast({
        variant: "warning",
        title: "No Programs Loaded",
        description: "Generating sample CSV with default program codes. Please ensure programs exist in the system."
      });
    }


    const sampleCsvContent = `St_Id,MAP_NUMBER,extype,examid,exam,DECLARATIONDATE,AcademicYear,sem,UNIT_NO,EXAMNUMBER,name,instcode,instName,CourseName,BR_CODE,BR_NAME,SUB1,SUB1NA,SUB1CR,SUB1GR,SUB1GRE,SUB1GRM,SUB1GRTH,SUB1GRI,SUB1GRV,SUB1GRPR,SUB2,SUB2NA,SUB2CR,SUB2GR,SUB2GRE,SUB2GRM,SUB2GRTH,SUB2GRI,SUB2GRV,SUB2GRPR,SPI,CPI,CGPA,RESULT,TRIAL,REMARK,CURBACKL,TOTBACKL
${sampleEnrollment},${sampleEnrollment},REGULAR,12345,WINTER 2023,2024-01-15,2023-24,1,1,1,${sampleStudentName},001,GPP,${sampleProgramName},${sampleProgramCode},${sampleBranchName},${sampleSubjectCode1},${sampleCourseName},4,AA,AA,AA,AA,AA,AA,AA,${sampleSubjectCode2},Basic Maths,3,AB,AB,AB,AB,AB,AB,AB,9.5,9.5,9.5,PASS,1,,0,0
`;
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_gtu_results_import.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_gtu_results_import.csv downloaded." });
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookCheck className="h-6 w-6" />
            Import Student Results
          </CardTitle>
          <CardDescription>
            Upload CSV files containing student results for standard or GTU format examinations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Standard Results Import Section */}
          <form onSubmit={handleStandardSubmit} className="space-y-6 mb-8 p-6 border rounded-lg shadow-sm dark:border-gray-700">
            <h3 className="text-xl font-semibold text-secondary">Standard Result Import</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <Label htmlFor="examType">Examination Type *</Label>
                <Select value={examType} onValueChange={setExamType} disabled={isSubmitting}>
                    <SelectTrigger id="examType"><SelectValue placeholder="Select Exam Type" /></SelectTrigger>
                    <SelectContent>
                    <SelectItem value="mid_sem_1">Mid Semester 1</SelectItem>
                    <SelectItem value="mid_sem_2">Mid Semester 2</SelectItem>
                    <SelectItem value="internal_final">Internal Final Assessment</SelectItem>
                    {/* Add more types as needed */}
                    </SelectContent>
                </Select>
                </div>
                <div>
                <Label htmlFor="academicYear">Academic Year *</Label>
                <Input id="academicYear" type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="e.g., 2023-24" disabled={isSubmitting} />
                </div>
            </div>
            
            <div>
              <Label htmlFor="standardResultsFile">Standard Results CSV File *</Label>
              <Input id="standardResultsFile" type="file" accept=".csv" onChange={handleStandardFileChange} disabled={isSubmitting} className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:border-gray-700 dark:bg-primary/20" />
              {standardFile && <p className="text-xs text-muted-foreground mt-1">Selected: {standardFile.name}</p>}
            </div>

            <div className="flex items-center justify-between">
                <Button onClick={handleDownloadStandardSampleCsv} variant="link" size="sm" type="button" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Standard Sample
                </Button>
                <Button type="submit" disabled={isSubmitting || !standardFile || !examType || !academicYear}>
                    {isSubmitting && standardFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    Import Standard Results
                </Button>
            </div>
          </form>

          {/* GTU Results Import Section */}
          <form onSubmit={handleGtuSubmit} className="space-y-6 p-6 border rounded-lg shadow-sm bg-muted/20 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-accent-foreground">GTU Result Import</h3>
             <div>
              <Label htmlFor="gtuResultsFile">GTU Results CSV File *</Label>
              <Input id="gtuResultsFile" type="file" accept=".csv" onChange={handleGtuFileChange} disabled={isSubmitting} className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 dark:border-gray-700" />
               {gtuFile && <p className="text-xs text-muted-foreground mt-1">Selected: {gtuFile.name}</p>}
            </div>

            <div className="flex items-center justify-between">
                 <Button onClick={handleDownloadGtuSampleCsv} variant="link" size="sm" type="button" className="px-0 text-accent-foreground/80 hover:text-accent-foreground">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download GTU Sample
                </Button>
                <Button type="submit" disabled={isSubmitting || !gtuFile || programs.length === 0} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    {isSubmitting && gtuFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    Import GTU Results
                </Button>
            </div>
             <p className="text-xs text-muted-foreground mt-1">
                Ensure programs with matching Branch Codes (BR_CODE from CSV) exist in the system before importing GTU results. The sample uses program codes like 'DCE'.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}