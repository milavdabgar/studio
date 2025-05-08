
"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Edit, Trash2, FileText, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import type { Assessment, AssessmentStatus, AssessmentType, Course, Program, Batch, User as FacultyUser } from '@/types/entities';
import { assessmentService } from '@/lib/api/assessments';
import { courseService } from '@/lib/api/courses';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { userService } from '@/lib/api/users'; // For faculty selection

const ASSESSMENT_TYPE_OPTIONS: AssessmentType[] = ['Quiz', 'Midterm', 'Final Exam', 'Assignment', 'Project', 'Lab Work', 'Presentation', 'Other'];
const ASSESSMENT_STATUS_OPTIONS: { value: AssessmentStatus, label: string }[] = [
  { value: "Draft", label: "Draft" },
  { value: "Published", label: "Published" },
  { value: "Ongoing", label: "Ongoing" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

type SortField = keyof Assessment | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const ALL_BATCHES_SENTINEL_VALUE = "__ALL_BATCHES_IN_PROGRAM__";

export default function AssessmentManagementPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyUser[]>([]); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<Partial<Assessment> | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formProgramId, setFormProgramId] = useState<string>('');
  const [formBatchId, setFormBatchId] = useState<string>(ALL_BATCHES_SENTINEL_VALUE);
  const [formType, setFormType] = useState<AssessmentType>('Quiz');
  const [formDescription, setFormDescription] = useState('');
  const [formMaxMarks, setFormMaxMarks] = useState<number>(100);
  const [formPassingMarks, setFormPassingMarks] = useState<number | undefined>(undefined);
  const [formWeightage, setFormWeightage] = useState<number | undefined>(undefined);
  const [formAssessmentDate, setFormAssessmentDate] = useState<Date | undefined>(undefined);
  const [formDueDate, setFormDueDate] = useState<Date | undefined>(undefined);
  const [formStatus, setFormStatus] = useState<AssessmentStatus>('Draft');
  const [formInstructions, setFormInstructions] = useState('');
  const [formFacultyId, setFormFacultyId] = useState<string>('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTypeVal, setFilterTypeVal] = useState<AssessmentType | 'all'>('all');
  const [filterStatusVal, setFilterStatusVal] = useState<AssessmentStatus | 'all'>('all');
  const [filterProgramVal, setFilterProgramVal] = useState<string>('all');
  const [filterCourseVal, setFilterCourseVal] = useState<string>('all');
  
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc' | 'desc'>('asc'));
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [assessmentData, courseData, programData, batchData, facultyData] = await Promise.all([
        assessmentService.getAllAssessments(),
        courseService.getAllCourses(),
        programService.getAllPrograms(),
        batchService.getAllBatches(),
        userService.getAllUsers().then(users => users.filter(u => u.roles.includes('faculty') || u.roles.includes('hod')))
      ]);
      setAssessments(assessmentData);
      setCourses(courseData);
      setPrograms(programData);
      setBatches(batchData);
      setFacultyList(facultyData);

      if (courseData.length > 0 && !formCourseId) {
        setFormCourseId(courseData[0].id);
        setFormProgramId(courseData[0].programId); 
      }
    } catch (error) {
      console.error("Failed to load data", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load initial assessment data." });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormCourseId(courses.length > 0 ? courses[0].id : '');
    setFormProgramId(courses.length > 0 ? courses[0].programId : (programs.length > 0 ? programs[0].id : ''));
    setFormBatchId(ALL_BATCHES_SENTINEL_VALUE);
    setFormType('Quiz');
    setFormDescription('');
    setFormMaxMarks(100);
    setFormPassingMarks(undefined);
    setFormWeightage(undefined);
    setFormAssessmentDate(undefined);
    setFormDueDate(undefined);
    setFormStatus('Draft');
    setFormInstructions('');
    setFormFacultyId('');
    setCurrentAssessment(null);
  };

  const handleEdit = (assessment: Assessment) => {
    setCurrentAssessment(assessment);
    setFormName(assessment.name);
    setFormCourseId(assessment.courseId);
    setFormProgramId(assessment.programId);
    setFormBatchId(assessment.batchId || ALL_BATCHES_SENTINEL_VALUE);
    setFormType(assessment.type);
    setFormDescription(assessment.description || '');
    setFormMaxMarks(assessment.maxMarks);
    setFormPassingMarks(assessment.passingMarks);
    setFormWeightage(assessment.weightage);
    setFormAssessmentDate(assessment.assessmentDate && isValid(parseISO(assessment.assessmentDate)) ? parseISO(assessment.assessmentDate) : undefined);
    setFormDueDate(assessment.dueDate && isValid(parseISO(assessment.dueDate)) ? parseISO(assessment.dueDate) : undefined);
    setFormStatus(assessment.status);
    setFormInstructions(assessment.instructions || '');
    setFormFacultyId(assessment.facultyId || '');
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    if (courses.length === 0 || programs.length === 0) {
      toast({ variant: "destructive", title: "Cannot Add Assessment", description: "Courses or Programs not available. Please create them first." });
      return;
    }
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (assessmentId: string) => {
    setIsSubmitting(true);
    try {
      await assessmentService.deleteAssessment(assessmentId);
      await fetchInitialData();
      setSelectedAssessmentIds(prev => prev.filter(id => id !== assessmentId));
      toast({ title: "Assessment Deleted", description: "The assessment has been successfully deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete assessment." });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formName.trim() || !formCourseId || !formProgramId || !formType || formMaxMarks <= 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name, Course, Program, Type, and valid Max Marks are required."});
      return;
    }
     if (formPassingMarks !== undefined && (isNaN(formPassingMarks) || formPassingMarks < 0 || formPassingMarks > formMaxMarks)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Passing Marks must be a non-negative number and not exceed Max Marks." });
        return;
    }
    if (formWeightage !== undefined && (isNaN(formWeightage) || formWeightage < 0 || formWeightage > 1)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Weightage must be between 0 and 1 (e.g., 0.2 for 20%)." });
        return;
    }

    setIsSubmitting(true);
    
    const assessmentData: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = { 
      name: formName.trim(),
      courseId: formCourseId,
      programId: formProgramId,
      batchId: formBatchId === ALL_BATCHES_SENTINEL_VALUE ? undefined : formBatchId,
      type: formType,
      description: formDescription.trim() || undefined,
      maxMarks: Number(formMaxMarks),
      passingMarks: formPassingMarks !== undefined ? Number(formPassingMarks) : undefined,
      weightage: formWeightage !== undefined ? Number(formWeightage) : undefined,
      assessmentDate: formAssessmentDate ? format(formAssessmentDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : undefined,
      dueDate: formDueDate ? format(formDueDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : undefined,
      status: formStatus,
      instructions: formInstructions.trim() || undefined,
      facultyId: formFacultyId || undefined,
    };
    
    try {
      if (currentAssessment && currentAssessment.id) {
        await assessmentService.updateAssessment(currentAssessment.id, assessmentData);
        toast({ title: "Assessment Updated", description: "The assessment has been successfully updated." });
      } else {
        await assessmentService.createAssessment(assessmentData);
        toast({ title: "Assessment Created", description: "The new assessment has been successfully created." });
      }
      await fetchInitialData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message || "Could not save assessment." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    if (formCourseId && courses.length > 0) {
      const selectedCourse = courses.find(c => c.id === formCourseId);
      if (selectedCourse) {
        setFormProgramId(selectedCourse.programId);
      }
    }
  }, [formCourseId, courses]);

  const filteredBatches = useMemo(() => {
    if (!formProgramId) return [];
    return batches.filter(b => b.programId === formProgramId);
  }, [formProgramId, batches]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
  };

  const handleImportAssessments = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
    if (courses.length === 0 || programs.length === 0) {
        toast({ variant: "destructive", title: "Import Error", description: "No courses or programs loaded. Cannot map IDs." });
        return;
    }

    setIsSubmitting(true);
    try {
      const result = await assessmentService.importAssessments(selectedFile, courses, programs, batches);
      await fetchInitialData();
      toast({ title: "Import Successful", description: `${result.newCount} assessments added, ${result.updatedCount} assessments updated. Skipped: ${result.skippedCount}` });
      if (result.errors && result.errors.length > 0) {
          result.errors.slice(0, 3).forEach((err: any) => {
            toast({ variant: "destructive", title: `Import Warning (Row ${err.row})`, description: err.message });
          });
        }
    } catch (error: any) {
      console.error("Error processing CSV file:", error);
      toast({ variant: "destructive", title: "Import Failed", description: error.message || "Could not process the CSV file." });
    } finally {
      setIsSubmitting(false); setSelectedFile(null); 
      const fileInput = document.getElementById('csvImportAssessment') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleExportAssessments = () => {
    if (filteredAndSortedAssessments.length === 0) {
      toast({ title: "Export Canceled", description: "No assessments to export (check filters)." });
      return;
    }
    const header = ['id', 'name', 'courseId', 'courseSubcode', 'programId', 'programCode', 'batchId', 'batchName', 'type', 'description', 'maxMarks', 'passingMarks', 'weightage', 'assessmentDate', 'dueDate', 'status', 'instructions', 'facultyId', 'facultyName'];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedAssessments.map(a => {
        const course = courses.find(c => c.id === a.courseId);
        const program = programs.find(p => p.id === a.programId);
        const batch = batches.find(b => b.id === a.batchId);
        const faculty = facultyList.find(f => f.id === a.facultyId);
        return [
          a.id, `"${a.name.replace(/"/g, '""')}"`, a.courseId, course?.subcode || '', a.programId, program?.code || '', a.batchId || '', batch?.name || '',
          a.type, `"${(a.description || "").replace(/"/g, '""')}"`, a.maxMarks, a.passingMarks || '', a.weightage || '',
          a.assessmentDate || '', a.dueDate || '', a.status, `"${(a.instructions || "").replace(/"/g, '""')}"`, a.facultyId || '', faculty?.displayName || ''
        ].join(',')
      })
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "assessments_export.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Assessments exported to assessments_export.csv" });
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,name,courseId,courseSubcode,programId,programCode,batchId,batchName,type,description,maxMarks,passingMarks,weightage,assessmentDate,dueDate,status,instructions,facultyId
asm_s1,Midterm 1,crs1,CS101,prog1,DCE,batch1,2024-2027,Midterm,"Covers first 3 units",50,20,0.25,2024-10-15T10:00:00.000Z,,Published,"Refer textbook chapters 1-3",fac1
,Final Project,crs2,ME202,prog2,DME,,Project,"Final year project submission",100,40,0.50,,2025-04-30T23:59:59.000Z,Completed,"Submit report and demo video",fac2
`; 
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_assessments_import.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_assessments_import.csv downloaded." });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field); setSortDirection('asc');
    }
    setCurrentPage(1); 
  };
  
  const filteredAndSortedAssessments = useMemo(() => {
    let result = [...assessments];

    if (searchTerm) {
      result = result.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterTypeVal !== 'all') {
      result = result.filter(a => a.type === filterTypeVal);
    }
    if (filterStatusVal !== 'all') {
      result = result.filter(a => a.status === filterStatusVal);
    }
    if (filterProgramVal !== 'all') {
        result = result.filter(a => a.programId === filterProgramVal);
    }
    if (filterCourseVal !== 'all') {
        result = result.filter(a => a.courseId === filterCourseVal);
    }


    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: any = a[sortField as keyof Assessment];
        let valB: any = b[sortField as keyof Assessment];
        
        const numericFields: (keyof Assessment)[] = ['maxMarks', 'passingMarks', 'weightage'];
        if (numericFields.includes(sortField as keyof Assessment)) {
            valA = Number(valA) || 0; valB = Number(valB) || 0;
        }
        if (sortField === 'assessmentDate' || sortField === 'dueDate') {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
        }
        
        if (valA === undefined || valA === null) return sortDirection === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null) return sortDirection === 'asc' ? -1 : 1;
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
    }
    return result;
  }, [assessments, searchTerm, filterTypeVal, filterStatusVal, filterProgramVal, filterCourseVal, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedAssessments.length / itemsPerPage);
  const paginatedAssessments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedAssessments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedAssessments, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterTypeVal, filterStatusVal, filterProgramVal, filterCourseVal, itemsPerPage]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedAssessmentIds(checked === true ? paginatedAssessments.map(a => a.id) : []);
  };

  const handleSelectAssessment = (assessmentId: string, checked: boolean) => {
    setSelectedAssessmentIds(prev => checked ? [...prev, assessmentId] : prev.filter(id => id !== assessmentId));
  };

  const handleDeleteSelected = async () => {
    if (selectedAssessmentIds.length === 0) {
      toast({ variant: "destructive", title: "No Assessments Selected", description: "Please select assessments to delete." });
      return;
    }
    setIsSubmitting(true);
    try {
        for(const id of selectedAssessmentIds) {
            await assessmentService.deleteAssessment(id);
        }
        await fetchInitialData();
        toast({ title: "Assessments Deleted", description: `${selectedAssessmentIds.length} assessment(s) have been successfully deleted.` });
        setSelectedAssessmentIds([]);
    } catch (error) {
        toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete selected assessments."});
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedAssessments.length > 0 && paginatedAssessments.every(a => selectedAssessmentIds.includes(a.id));
  const isSomeSelectedOnPage = paginatedAssessments.some(a => selectedAssessmentIds.includes(a.id)) && !isAllSelectedOnPage;
  
  const programsForFilter = useMemo(() => {
     return programs;
  }, [programs]);

  const coursesForFilter = useMemo(() => {
    if(filterProgramVal === 'all') return courses;
    return courses.filter(c => c.programId === filterProgramVal);
  }, [filterProgramVal, courses]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => handleSort(field)} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">
        {label}
        {sortField === field && (sortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" /> : <ArrowUpDown className="h-4 w-4 opacity-50" />)}
        {sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Assessment Management
            </CardTitle>
            <CardDescription>
              Manage academic assessments, types, marks, and status.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto" disabled={courses.length === 0 || programs.length === 0}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Assessment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{currentAssessment?.id ? "Edit Assessment" : "Add New Assessment"}</DialogTitle>
                  <DialogDescription>
                    {currentAssessment?.id ? "Modify assessment details." : "Create a new assessment record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="md:col-span-2"><Label htmlFor="name">Assessment Name *</Label><Input id="name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., Midterm Exam - Unit 1-3" disabled={isSubmitting} required /></div>
                  
                  <div>
                    <Label htmlFor="courseId">Course *</Label>
                    <Select value={formCourseId} onValueChange={setFormCourseId} disabled={isSubmitting || courses.length === 0} required>
                      <SelectTrigger id="courseId"><SelectValue placeholder="Select Course" /></SelectTrigger>
                      <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.subjectName} ({c.subcode})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                   <div>
                    <Label htmlFor="programId">Program *</Label>
                    <Select value={formProgramId} onValueChange={setFormProgramId} disabled={isSubmitting || programs.length === 0 || !formCourseId} required>
                      <SelectTrigger id="programId"><SelectValue placeholder="Select Program (auto from course)" /></SelectTrigger>
                      <SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                   <div>
                    <Label htmlFor="batchId">Batch (Optional)</Label>
                    <Select value={formBatchId} onValueChange={setFormBatchId} disabled={isSubmitting || filteredBatches.length === 0 || !formProgramId}>
                      <SelectTrigger id="batchId"><SelectValue placeholder="Select Batch (Optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_BATCHES_SENTINEL_VALUE}>All Batches in Program</SelectItem>
                        {filteredBatches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select value={formType} onValueChange={(value) => setFormType(value as AssessmentType)} disabled={isSubmitting} required>
                      <SelectTrigger id="type"><SelectValue placeholder="Select Type"/></SelectTrigger>
                      <SelectContent>{ASSESSMENT_TYPE_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                   <div className="md:col-span-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Brief description or scope" disabled={isSubmitting} rows={2}/></div>
                   
                  <div className="grid grid-cols-3 gap-4 md:col-span-2">
                    <div><Label htmlFor="maxMarks">Max Marks *</Label><Input id="maxMarks" type="number" value={formMaxMarks} onChange={e => setFormMaxMarks(parseInt(e.target.value) || 0)} placeholder="e.g., 100" disabled={isSubmitting} required /></div>
                    <div><Label htmlFor="passingMarks">Passing Marks</Label><Input id="passingMarks" type="number" value={formPassingMarks || ''} onChange={e => setFormPassingMarks(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 40" disabled={isSubmitting} /></div>
                    <div><Label htmlFor="weightage">Weightage</Label><Input id="weightage" type="number" step="0.01" value={formWeightage || ''} onChange={e => setFormWeightage(e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="e.g., 0.25 (for 25%)" disabled={isSubmitting} /></div>
                  </div>

                  <div>
                    <Label htmlFor="assessmentDate">Assessment Date (Optional)</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formAssessmentDate && "text-muted-foreground")} disabled={isSubmitting} >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formAssessmentDate ? format(formAssessmentDate, "PPP HH:mm") : <span>Pick a date & time</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={formAssessmentDate} onSelect={setFormAssessmentDate} initialFocus />
                            
                            <Input type="time" className="mt-2" defaultValue={formAssessmentDate ? format(formAssessmentDate, "HH:mm") : "00:00"} onChange={(e) => {
                                const time = e.target.value.split(':');
                                setFormAssessmentDate(current => {
                                    const d = current ? new Date(current) : new Date();
                                    d.setHours(parseInt(time[0]), parseInt(time[1]));
                                    return d;
                                })
                            }} />
                        </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date (Optional)</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formDueDate && "text-muted-foreground")} disabled={isSubmitting} >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formDueDate ? format(formDueDate, "PPP HH:mm") : <span>Pick a date & time</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={formDueDate} onSelect={setFormDueDate} initialFocus />
                             <Input type="time" className="mt-2" defaultValue={formDueDate ? format(formDueDate, "HH:mm") : "23:59"} onChange={(e) => {
                                const time = e.target.value.split(':');
                                setFormDueDate(current => {
                                    const d = current ? new Date(current) : new Date();
                                    d.setHours(parseInt(time[0]), parseInt(time[1]));
                                    return d;
                                })
                            }} />
                        </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formStatus} onValueChange={(value) => setFormStatus(value as AssessmentStatus)} disabled={isSubmitting} required>
                      <SelectTrigger id="status"><SelectValue placeholder="Select Status"/></SelectTrigger>
                      <SelectContent>{ASSESSMENT_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                   <div>
                    <Label htmlFor="facultyId">Assigned Faculty (Optional)</Label>
                    <Select value={formFacultyId} onValueChange={setFormFacultyId} disabled={isSubmitting || facultyList.length === 0}>
                      <SelectTrigger id="facultyId"><SelectValue placeholder="Select Faculty" /></SelectTrigger>
                      <SelectContent>{facultyList.map(f => <SelectItem key={f.id} value={f.id}>{f.displayName} ({f.email})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2"><Label htmlFor="instructions">Instructions</Label><Textarea id="instructions" value={formInstructions} onChange={e => setFormInstructions(e.target.value)} placeholder="Detailed instructions for the assessment" disabled={isSubmitting} rows={3}/></div>
                  
                  <DialogFooter className="md:col-span-2 mt-4">
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{currentAssessment?.id ? "Save Changes" : "Create Assessment"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportAssessments} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Assessments from CSV</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportAssessment" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportAssessments} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>} Import
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
                </Button>
                <p className="text-xs text-muted-foreground">
                  CSV fields: id (opt), name, courseId/courseSubcode, programId/programCode, batchId/batchName, type, maxMarks, status, etc.
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="searchAssessment">Search Assessments</Label>
              <div className="relative">
                 <Input id="searchAssessment" placeholder="Name, description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-8"/>
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterProgramAssessment">Filter by Program</Label>
              <Select value={filterProgramVal} onValueChange={val => { setFilterProgramVal(val); setFilterCourseVal('all'); }} disabled={programsForFilter.length === 0}>
                <SelectTrigger id="filterProgramAssessment"><SelectValue placeholder="All Programs"/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programsForFilter.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterCourseAssessment">Filter by Course</Label>
              <Select value={filterCourseVal} onValueChange={setFilterCourseVal} disabled={coursesForFilter.length === 0}>
                <SelectTrigger id="filterCourseAssessment"><SelectValue placeholder="All Courses"/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {coursesForFilter.map(c => <SelectItem key={c.id} value={c.id}>{c.subjectName} ({c.subcode})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterTypeAssessment">Filter by Type</Label>
              <Select value={filterTypeVal} onValueChange={(value) => setFilterTypeVal(value as AssessmentType | 'all')}>
                <SelectTrigger id="filterTypeAssessment"><SelectValue placeholder="All Types"/></SelectTrigger>
                <SelectContent>{[{value: 'all', label: 'All Types'} as {value: AssessmentType | 'all', label: string}, ...ASSESSMENT_TYPE_OPTIONS.map(t => ({value: t, label: t}))].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStatusAssessment">Filter by Status</Label>
              <Select value={filterStatusVal} onValueChange={(value) => setFilterStatusVal(value as AssessmentStatus | 'all')}>
                <SelectTrigger id="filterStatusAssessment"><SelectValue placeholder="All Statuses"/></SelectTrigger>
                <SelectContent>{[{value: 'all', label: 'All Statuses'} as {value: AssessmentStatus | 'all', label: string}, ...ASSESSMENT_STATUS_OPTIONS].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {selectedAssessmentIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedAssessmentIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedAssessmentIds.length} assessment(s) selected.
                </span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[50px]"><Checkbox checked={isAllSelectedOnPage || (paginatedAssessments.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)} onCheckedChange={(checkedState) => handleSelectAll(!!checkedState)} aria-label="Select all assessments on this page"/></TableHead>
                <SortableTableHeader field="name" label="Assessment Name" />
                <TableHead>Course</TableHead>
                <TableHead>Program</TableHead>
                <SortableTableHeader field="type" label="Type" />
                <SortableTableHeader field="maxMarks" label="Max Marks" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAssessments.map((assessment) => (
                <TableRow key={assessment.id} data-state={selectedAssessmentIds.includes(assessment.id) ? "selected" : undefined}>
                  <TableCell><Checkbox checked={selectedAssessmentIds.includes(assessment.id)} onCheckedChange={(checked) => handleSelectAssessment(assessment.id, !!checked)} aria-labelledby={`assessment-name-${assessment.id}`}/></TableCell>
                  <TableCell id={`assessment-name-${assessment.id}`} className="font-medium">{assessment.name}</TableCell>
                  <TableCell>{courses.find(c => c.id === assessment.courseId)?.subjectName || 'N/A'}</TableCell>
                  <TableCell>{programs.find(p => p.id === assessment.programId)?.code || 'N/A'}</TableCell>
                  <TableCell>{assessment.type}</TableCell>
                  <TableCell>{assessment.maxMarks}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        assessment.status === 'Published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : assessment.status === 'Ongoing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : assessment.status === 'Completed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                        : assessment.status === 'Draft' ? 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' /* Cancelled */
                    }`}>
                      {ASSESSMENT_STATUS_OPTIONS.find(s => s.value === assessment.status)?.label || assessment.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(assessment)} disabled={isSubmitting}><Edit className="h-4 w-4" /><span className="sr-only">Edit Assessment</span></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(assessment.id)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /><span className="sr-only">Delete Assessment</span></Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedAssessments.length === 0 && (
                 <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No assessments found. Adjust filters or add a new assessment.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedAssessments.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedAssessments.length): 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedAssessments.length)} of {filteredAndSortedAssessments.length} assessments.
            </div>
            <div className="flex items-center gap-2">
                 <Select value={String(itemsPerPage)} onValueChange={(value) => {setItemsPerPage(Number(value)); setCurrentPage(1);}}>
                    <SelectTrigger className="w-[70px] h-8 text-xs"><SelectValue placeholder={String(itemsPerPage)} /></SelectTrigger>
                    <SelectContent side="top">{ITEMS_PER_PAGE_OPTIONS.map(sz => <SelectItem key={sz} value={String(sz)} className="text-xs">{sz}</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /><span className="sr-only">First</span></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /><span className="sr-only">Prev</span></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /><span className="sr-only">Next</span></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}><ChevronsRight className="h-4 w-4" /><span className="sr-only">Last</span></Button>
                </div>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
