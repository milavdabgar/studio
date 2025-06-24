"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Edit, Trash2, BookOpenText, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ListPlus, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from '@/components/ui/switch';
import type { Curriculum, Program, Course } from '@/types/entities';
import { curriculumService } from '@/lib/api/curriculum';
import { programService } from '@/lib/api/programs';
import { courseService } from '@/lib/api/courses';
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";

type CurriculumStatus = 'draft' | 'active' | 'archived';
const CURRICULUM_STATUS_OPTIONS: { value: CurriculumStatus, label: string }[] = [
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
];

type SortField = keyof Curriculum | 'programName' | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

export default function CurriculumManagementPage() {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCurriculum, setCurrentCurriculum] = useState<Partial<Curriculum> | null>(null);

  // Form state for Curriculum
  const [formProgramId, setFormProgramId] = useState<string>('');
  const [formVersion, setFormVersion] = useState('');
  const [formEffectiveDate, setFormEffectiveDate] = useState<Date | undefined>(new Date());
  const [formStatus, setFormStatus] = useState<CurriculumStatus>('draft');
  const [formCourses, setFormCourses] = useState<Curriculum['courses']>([]);

  // Form state for adding a course to the curriculum
  const [tempCourseId, setTempCourseId] = useState<string>('');
  const [tempSemester, setTempSemester] = useState<number>(1);
  const [tempIsElective, setTempIsElective] = useState<boolean>(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // Search by version or program name
  const [filterProgramVal, setFilterProgramVal] = useState<string>('all');
  const [filterStatusVal, setFilterStatusVal] = useState<CurriculumStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('effectiveDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedCurriculumIds, setSelectedCurriculumIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [curriculaData, programsData, coursesData] = await Promise.all([
        curriculumService.getAllCurricula(),
        programService.getAllPrograms(),
        courseService.getAllCourses(),
      ]);
      setCurricula(curriculaData);
      setPrograms(programsData);
      setAllCourses(coursesData);

      if (programsData.length > 0 && !formProgramId) {
        setFormProgramId(programsData[0].id);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load initial data." });
    }
    setIsLoading(false);
  }, [toast, formProgramId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const resetForm = () => {
    setFormProgramId(programs.length > 0 ? programs[0].id : '');
    setFormVersion('');
    setFormEffectiveDate(new Date());
    setFormStatus('draft');
    setFormCourses([]);
    setCurrentCurriculum(null);
    // Reset temporary course add form
    setTempCourseId('');
    setTempSemester(1);
    setTempIsElective(false);
  };

  const handleEdit = (curriculum: Curriculum) => {
    setCurrentCurriculum(curriculum);
    setFormProgramId(curriculum.programId);
    setFormVersion(curriculum.version);
    setFormEffectiveDate(curriculum.effectiveDate ? parseISO(curriculum.effectiveDate) : undefined);
    setFormStatus(curriculum.status);
    setFormCourses([...curriculum.courses]);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    if (programs.length === 0) {
      toast({ variant: "destructive", title: "Cannot Add", description: "No programs available. Please create programs first." });
      return;
    }
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (curriculumId: string) => {
    setIsSubmitting(true);
    try {
      await curriculumService.deleteCurriculum(curriculumId);
      await fetchInitialData();
      setSelectedCurriculumIds(prev => prev.filter(id => id !== curriculumId));
      toast({ title: "Curriculum Deleted", description: "Successfully deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message });
    }
    setIsSubmitting(false);
  };
  
  const handleAddCourseToForm = () => {
    if (!tempCourseId) {
        toast({variant: "destructive", title: "Validation Error", description: "Please select a course."});
        return;
    }
    if (tempSemester < 1 || tempSemester > 12) { // Adjust max semester if needed
        toast({variant: "destructive", title: "Validation Error", description: "Please enter a valid semester (1-12)."});
        return;
    }
    if (formCourses.find(fc => fc.courseId === tempCourseId && fc.semester === tempSemester)) {
        toast({variant: "default", title: "Duplicate Course", description: "This course is already added for this semester in the curriculum."});
        return;
    }

    setFormCourses(prev => [...prev, { courseId: tempCourseId, semester: tempSemester, isElective: tempIsElective }]);
    // Reset temp form fields
    setTempCourseId('');
    setTempSemester(1);
    setTempIsElective(false);
  };

  const handleRemoveCourseFromForm = (courseIdToRemove: string, semesterToRemove: number) => {
    setFormCourses(prev => prev.filter(fc => !(fc.courseId === courseIdToRemove && fc.semester === semesterToRemove)));
  };


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formProgramId || !formVersion.trim() || !formEffectiveDate) {
      toast({ variant: "destructive", title: "Validation Error", description: "Program, Version, and Effective Date are required."});
      return;
    }
    if (formCourses.length === 0) {
        toast({ variant: "destructive", title: "Validation Error", description: "A curriculum must have at least one course."});
        return;
    }

    setIsSubmitting(true);
    const curriculumData: Omit<Curriculum, 'id' | 'createdAt' | 'updatedAt'> = {
      programId: formProgramId,
      version: formVersion.trim(),
      effectiveDate: format(formEffectiveDate, "yyyy-MM-dd"), // Store as YYYY-MM-DD string
      status: formStatus,
      courses: formCourses,
    };

    try {
      if (currentCurriculum && currentCurriculum.id) {
        await curriculumService.updateCurriculum(currentCurriculum.id, curriculumData);
        toast({ title: "Curriculum Updated", description: "Successfully updated." });
      } else {
        await curriculumService.createCurriculum(curriculumData);
        toast({ title: "Curriculum Created", description: "Successfully created." });
      }
      await fetchInitialData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => setSelectedFile(event.target.files?.[0] || null);
  
  const handleImportCurricula = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file." });
      return;
    }
    if (programs.length === 0 || allCourses.length === 0) {
      toast({ variant: "destructive", title: "Import Error", description: "Programs or Courses data not loaded. Cannot map IDs." });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await curriculumService.importCurricula(selectedFile, programs, allCourses);
      await fetchInitialData();
      toast({ title: "Import Successful", description: `${result.newCount} curricula added, ${result.updatedCount} updated. Skipped: ${result.skippedCount}` });
      if(result.errors && result.errors.length > 0){
          result.errors.slice(0,3).forEach((err:any) => {
            toast({variant: "default", title: `Import Warning (Row ${err.row})`, description: err.message, duration: 7000});
          });
      }
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Import Failed", description: error.message || "Could not process CSV." });
    } finally {
      setIsSubmitting(false); setSelectedFile(null);
      const fileInput = document.getElementById('csvImportCurriculum') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleExportCurricula = () => {
    if (filteredAndSortedCurricula.length === 0) {
      toast({ title: "No Data", description: "No curricula to export." });
      return;
    }
    const header = ['id', 'programId', 'programCode', 'programName', 'version', 'effectiveDate', 'status', 'courseId', 'courseSubcode', 'courseName', 'semester', 'isElective'];
    const csvRows: string[] = [header.join(',')];
    filteredAndSortedCurricula.forEach(curr => {
        const prog = programs.find(p => p.id === curr.programId);
        curr.courses.forEach(cc => {
            const course = allCourses.find(c => c.id === cc.courseId);
            csvRows.push([
                curr.id, curr.programId, `"${prog?.code || ''}"`, `"${prog?.name || ''}"`,
                curr.version, curr.effectiveDate, curr.status,
                cc.courseId, `"${course?.subcode || ''}"`, `"${course?.subjectName || ''}"`,
                cc.semester, cc.isElective
            ].join(','));
        });
    });
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "curricula_export.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Curricula exported." });
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,programId,programCode,version,effectiveDate,status,courseId,courseSubcode,semester,isElective
curr_1,prog_dce_gpp,DCE,1.0,2024-07-01,active,course_cs101_dce_gpp,CS101,1,false
curr_1,prog_dce_gpp,DCE,1.0,2024-07-01,active,course_math1_gen_gpp,MA101,1,false
curr_2,prog_dme_gpp,DME,2.1,2025-01-01,draft,course_me101_dme_gpp,ME101,1,false
`;
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_curricula_import.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded" });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
    setCurrentPage(1);
  };

  const filteredAndSortedCurricula = useMemo(() => {
    let result = [...curricula];
    if (searchTerm) {
        result = result.filter(c => 
            c.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
            programs.find(p => p.id === c.programId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            programs.find(p => p.id === c.programId)?.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    if (filterProgramVal !== 'all') result = result.filter(c => c.programId === filterProgramVal);
    if (filterStatusVal !== 'all') result = result.filter(c => c.status === filterStatusVal);

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: unknown = a[sortField as keyof Curriculum];
        let valB: unknown = b[sortField as keyof Curriculum];
        if(sortField === 'programName'){
            valA = programs.find(p => p.id === a.programId)?.name || '';
            valB = programs.find(p => p.id === b.programId)?.name || '';
        }
        if (valA === undefined || valA === null) return sortDirection === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null) return sortDirection === 'asc' ? -1 : 1;
        if (typeof valA === 'string' && typeof valB === 'string') return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        if (typeof valA === 'number' && typeof valB === 'number') return sortDirection === 'asc' ? valA - valB : valB - valA;
        if (sortField === 'effectiveDate') return sortDirection === 'asc' ? new Date(valA).getTime() - new Date(valB).getTime() : new Date(valB).getTime() - new Date(valA).getTime();
        return 0;
      });
    }
    return result;
  }, [curricula, searchTerm, filterProgramVal, filterStatusVal, sortField, sortDirection, programs]);

  const totalPages = Math.ceil(filteredAndSortedCurricula.length / itemsPerPage);
  const paginatedCurricula = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCurricula.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCurricula, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterProgramVal, filterStatusVal, itemsPerPage]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => setSelectedCurriculumIds(checked === true ? paginatedCurricula.map(c => c.id) : []);
  const handleSelectCurriculum = (id: string, checked: boolean) => setSelectedCurriculumIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  
  const handleDeleteSelected = async () => {
    if(selectedCurriculumIds.length === 0) {
      toast({variant: "destructive", title: "No Selection", description: "Please select curricula to delete."});
      return;
    }
    setIsSubmitting(true);
    try {
      for(const id of selectedCurriculumIds) await curriculumService.deleteCurriculum(id);
      await fetchInitialData();
      toast({title: "Deleted", description: `${selectedCurriculumIds.length} curricula deleted.`});
      setSelectedCurriculumIds([]);
    } catch (error) {
      toast({variant: "destructive", title: "Delete Failed", description: (error as Error).message});
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedCurricula.length > 0 && paginatedCurricula.every(c => selectedCurriculumIds.includes(c.id));
  const isSomeSelectedOnPage = paginatedCurricula.some(c => selectedCurriculumIds.includes(c.id)) && !isAllSelectedOnPage;

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => handleSort(field)} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">{label}{sortField === field && (sortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" /> : <ArrowUpDown className="h-4 w-4 opacity-50" />)}{sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}</div>
    </TableHead>
  );

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2"><BookOpenText className="h-6 w-6" />Curriculum Management</CardTitle>
            <CardDescription>Manage academic curricula, versions, and associated courses.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={handleAddNew} className="w-full sm:w-auto" disabled={programs.length === 0}><PlusCircle className="mr-2 h-5 w-5" /> New Curriculum</Button>
            <Button onClick={handleExportCurricula} variant="outline" className="w-full sm:w-auto"><Download className="mr-2 h-5 w-5" /> Export CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Curricula from CSV</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportCurriculum" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportCurricula} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">{isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>} Import</Button>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary"><FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV</Button>
                <p className="text-xs text-muted-foreground">CSV fields: id, programId/Code, version, effectiveDate, status, courseId/Subcode, semester, isElective.</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border rounded-lg">
            <div><Label htmlFor="searchCurriculum">Search Version/Program</Label><div className="relative"><Input id="searchCurriculum" placeholder="Version, Prog. Name/Code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-8"/><Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /></div></div>
            <div><Label htmlFor="filterProgCurriculum">Filter by Program</Label><Select value={filterProgramVal} onValueChange={setFilterProgramVal} disabled={programs.length === 0}><SelectTrigger><SelectValue placeholder="All Programs"/></SelectTrigger><SelectContent><SelectItem value="all">All Programs</SelectItem>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="filterStatusCurriculum">Filter by Status</Label><Select value={filterStatusVal} onValueChange={(value) => setFilterStatusVal(value as CurriculumStatus | 'all')}><SelectTrigger><SelectValue placeholder="All Statuses"/></SelectTrigger><SelectContent>{[{value: 'all', label: 'All Statuses'} as {value: CurriculumStatus | 'all', label: string}, ...CURRICULUM_STATUS_OPTIONS].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select></div>
          </div>

          {selectedCurriculumIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}><Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedCurriculumIds.length})</Button>
                <span className="text-sm text-muted-foreground">{selectedCurriculumIds.length} curriculum/a selected.</span>
            </div>
          )}

          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-[50px]"><Checkbox checked={isAllSelectedOnPage || (paginatedCurricula.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)} onCheckedChange={(val) => handleSelectAll(val as boolean | 'indeterminate')}/></TableHead>
              <SortableTableHeader field="programName" label="Program" />
              <SortableTableHeader field="version" label="Version" />
              <SortableTableHeader field="effectiveDate" label="Effective Date" />
              <TableHead>Courses</TableHead>
              <SortableTableHeader field="status" label="Status" />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {paginatedCurricula.map((curr) => (
                <TableRow key={curr.id} data-state={selectedCurriculumIds.includes(curr.id) ? "selected" : undefined}>
                  <TableCell><Checkbox checked={selectedCurriculumIds.includes(curr.id)} onCheckedChange={(checked) => handleSelectCurriculum(curr.id, !!checked)}/></TableCell>
                  <TableCell>{programs.find(p=>p.id === curr.programId)?.name || 'N/A'}</TableCell>
                  <TableCell>{curr.version}</TableCell>
                  <TableCell>{format(parseISO(curr.effectiveDate), "dd MMM yyyy")}</TableCell>
                  <TableCell>{curr.courses.length}</TableCell>
                  <TableCell><span className={`px-2 py-1 text-xs font-semibold rounded-full ${curr.status === 'active' ? 'bg-green-100 text-green-800' : curr.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{CURRICULUM_STATUS_OPTIONS.find(s=>s.value === curr.status)?.label || curr.status}</span></TableCell>
                  <TableCell className="text-right space-x-2"><Button variant="outline" size="icon" onClick={() => handleEdit(curr)} disabled={isSubmitting}><Edit className="h-4 w-4" /></Button><Button variant="destructive" size="icon" onClick={() => handleDelete(curr.id)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
              {paginatedCurricula.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No curricula found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">Showing {paginatedCurricula.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedCurricula.length): 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedCurricula.length)} of {filteredAndSortedCurricula.length} curricula.</div>
            <div className="flex items-center gap-2">
                <Select value={String(itemsPerPage)} onValueChange={(value) => {setItemsPerPage(Number(value)); setCurrentPage(1);}}><SelectTrigger className="w-[70px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent side="top">{ITEMS_PER_PAGE_OPTIONS.map(sz => <SelectItem key={sz} value={String(sz)} className="text-xs">{sz}</SelectItem>)}</SelectContent></Select>
                <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}><ChevronsRight className="h-4 w-4" /></Button>
                </div>
            </div>
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>{currentCurriculum?.id ? "Edit Curriculum" : "New Curriculum"}</DialogTitle><DialogDescription>Define curriculum details and assign courses.</DialogDescription></DialogHeader>
          <form id="curriculumForm" onSubmit={handleSubmit} className="space-y-4 py-2 overflow-y-auto flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="currProgramId">Program *</Label><Select value={formProgramId} onValueChange={setFormProgramId} required disabled={isSubmitting || programs.length === 0}><SelectTrigger><SelectValue placeholder="Select Program"/></SelectTrigger><SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}</SelectContent></Select></div>
                <div><Label htmlFor="currVersion">Version *</Label><Input id="currVersion" value={formVersion} onChange={e => setFormVersion(e.target.value)} placeholder="e.g., 1.0, 2024-A" required disabled={isSubmitting}/></div>
                <div><Label htmlFor="currEffectiveDate">Effective Date *</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !formEffectiveDate && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{formEffectiveDate ? format(formEffectiveDate, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formEffectiveDate} onSelect={setFormEffectiveDate} initialFocus captionLayout="dropdown-buttons" fromYear={2020} toYear={new Date().getFullYear() + 5}/></PopoverContent></Popover></div>
                <div><Label htmlFor="currStatus">Status *</Label><Select value={formStatus} onValueChange={val => setFormStatus(val as CurriculumStatus)} required disabled={isSubmitting}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRICULUM_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
            </div>

            <div className="pt-4 border-t mt-4">
                <h4 className="text-md font-semibold mb-2">Manage Courses in Curriculum</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 border rounded-md bg-muted/30">
                    <div><Label htmlFor="tempCourse">Course *</Label><Select value={tempCourseId} onValueChange={setTempCourseId} disabled={allCourses.length === 0}><SelectTrigger><SelectValue placeholder="Select Course"/></SelectTrigger><SelectContent>{allCourses.filter(c => c.programId === formProgramId).map(c => <SelectItem key={c.id} value={c.id}>{c.subjectName} ({c.subcode})</SelectItem>)}</SelectContent></Select></div>
                    <div><Label htmlFor="tempSemester">Semester *</Label><Input id="tempSemester" type="number" value={tempSemester} onChange={e=>setTempSemester(Number(e.target.value))} min="1" max="12"/></div>
                    <div className="flex items-center pt-6 space-x-2"><Switch id="tempIsElective" checked={tempIsElective} onCheckedChange={setTempIsElective}/><Label htmlFor="tempIsElective">Is Elective</Label></div>
                    <Button type="button" onClick={handleAddCourseToForm} size="sm" className="self-end"><ListPlus className="mr-2 h-4 w-4"/>Add Course</Button>
                </div>
                
                <div className="mt-3 max-h-48 overflow-y-auto">
                    {formCourses.length === 0 ? <p className="text-sm text-center text-muted-foreground py-2">No courses added to this curriculum yet.</p> :
                    <Table className="text-xs">
                        <TableHeader><TableRow><TableHead>Course</TableHead><TableHead>Sem</TableHead><TableHead>Elective</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                        <TableBody>{formCourses.map((fc, idx) => {
                            const courseInfo = allCourses.find(c => c.id === fc.courseId);
                            return (
                                <TableRow key={`${fc.courseId}-${fc.semester}-${idx}`}>
                                    <TableCell className="py-1">{courseInfo?.subjectName || fc.courseId} ({courseInfo?.subcode})</TableCell>
                                    <TableCell className="py-1">{fc.semester}</TableCell>
                                    <TableCell className="py-1">{fc.isElective ? 'Yes' : 'No'}</TableCell>
                                    <TableCell className="text-right py-1"><Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={()=>handleRemoveCourseFromForm(fc.courseId, fc.semester)}><XCircle className="h-4 w-4 text-destructive"/></Button></TableCell>
                                </TableRow>
                            );
                        })}</TableBody>
                    </Table>}
                </div>
            </div>
          </form>
          <DialogFooter className="pt-4 border-t mt-auto">
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
            <Button type="submit" form="curriculumForm" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{currentCurriculum?.id ? "Save Changes" : "Create Curriculum"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
