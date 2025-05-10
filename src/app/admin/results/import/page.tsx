"use client";

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText as AssessmentIcon, UploadCloud, Loader2, Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Placeholder for actual data and services
// import { assessmentService } from '@/lib/api/assessments';
// import { studentService } from '@/lib/api/students';
// import { resultImportService } from '@/lib/api/results'; // To be created

export default function ImportResultsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [examType, setExamType] = useState<string>(""); // e.g., Midterm, Final, GTU-External
  const [academicYear, setAcademicYear] = useState<string>(""); // e.g., "2023-24"

  // In a real app, useEffect would fetch options for Exam Types, Academic Years, etc.
  // For example:
  // const [examTypeOptions, setExamTypeOptions] = useState<string[]>([]);
  // useEffect(() => { fetchExamTypes().then(setExamTypeOptions); }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !examType || !academicYear) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please select a file, exam type, and academic year." });
      return;
    }
    setIsSubmitting(true);
    try {
      // const formData = new FormData();
      // formData.append('file', selectedFile);
      // formData.append('examType', examType);
      // formData.append('academicYear', academicYear);
      // await resultImportService.importResults(formData); // Replace with actual service call
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      toast({ title: "Import Initiated", description: `Results import for ${examType} (${academicYear}) started. You'll be notified upon completion.` });
      setSelectedFile(null);
      // Optionally reset examType and academicYear or keep them for next import
    } catch (error) {
      toast({ variant: "destructive", title: "Import Failed", description: (error as Error).message || "Could not start results import." });
    }
    setIsSubmitting(false);
  };
  
  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `EnrollmentNumber,SubjectCode1_Marks,SubjectCode1_Grade,SubjectCode2_Marks,SubjectCode2_Grade,...\n220010107001,CS101,65,AB,MA101,72,AA\n220010108002,CS101,55,BC,MA101,60,BB\n`;
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_results_import.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_results_import.csv downloaded." });
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <AssessmentIcon className="h-6 w-6" />
            Import Student Results
          </CardTitle>
          <CardDescription>
            Upload CSV files containing student results for various examinations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
            <div>
              <Label htmlFor="examType">Examination Type *</Label>
              <Select value={examType} onValueChange={setExamType} disabled={isSubmitting}>
                <SelectTrigger id="examType">
                  <SelectValue placeholder="Select Exam Type" />
                </SelectTrigger>
                <SelectContent>
                  {/* Populate these from a service or const array */}
                  <SelectItem value="mid_sem_1">Mid Semester 1</SelectItem>
                  <SelectItem value="mid_sem_2">Mid Semester 2</SelectItem>
                  <SelectItem value="internal_final">Internal Final Assessment</SelectItem>
                  <SelectItem value="gtu_external_theory">GTU External Theory</SelectItem>
                  <SelectItem value="gtu_external_practical">GTU External Practical/Viva</SelectItem>
                  <SelectItem value="remedial_internal">Remedial Internal</SelectItem>
                  <SelectItem value="remedial_gtu">Remedial GTU</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="academicYear">Academic Year *</Label>
              {/* This could be a select dropdown populated with academic years */}
              <Input 
                id="academicYear"
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g., 2023-24"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <Label htmlFor="resultsFile">Results CSV File *</Label>
              <Input 
                id="resultsFile" 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
                disabled={isSubmitting}
                className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
               {selectedFile && <p className="text-xs text-muted-foreground mt-1">Selected: {selectedFile.name}</p>}
            </div>

            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" type="button" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
                </Button>
                <p className="text-xs text-muted-foreground">
                  CSV format: EnrollmentNumber, SubjectCode1_Marks, SubjectCode1_Grade, ...
                </p>
            </div>


            <CardFooter className="px-0 pt-4">
              <Button type="submit" disabled={isSubmitting || !selectedFile || !examType || !academicYear}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Import Results
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}