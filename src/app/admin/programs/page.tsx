
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
import { PlusCircle, Edit, Trash2, BookCopy, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import type { Program, Department } from '@/types/entities';
import { programService } from '@/lib/api/programs';
import { departmentService } from '@/lib/api/departments';

type SortField = keyof Program | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

export default function ProgramManagementPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<Partial<Program> | null>(null);

  // Form state
  const [formProgramName, setFormProgramName] = useState('');
  const [formProgramCode, setFormProgramCode] = useState('');
  const [formProgramDescription, setFormProgramDescription] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState<string>('');
  const [formDurationYears, setFormDurationYears] = useState<number | undefined>(undefined);
  const [formTotalSemesters, setFormTotalSemesters] = useState<number | undefined>(undefined);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  const fetchProgramsAndDepartments = async () => {
    setIsLoading(true);
    try {
      const [progData, deptData] = await Promise.all([
        programService.getAllPrograms(),
        departmentService.getAllDepartments()
      ]);
      setPrograms(progData);
      setDepartments(deptData);
      if (deptData.length > 0 && !formDepartmentId) {
        setFormDepartmentId(deptData[0].id);
      }
    } catch (error) {
      console.error("Failed to load data", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load programs or departments data." });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProgramsAndDepartments();
  }, []);

  const resetForm = () => {
    setFormProgramName('');
    setFormProgramCode('');
    setFormProgramDescription('');
    setFormDepartmentId(departments.length > 0 ? departments[0].id : '');
    setFormDurationYears(undefined);
    setFormTotalSemesters(undefined);
    setFormStatus('active');
    setCurrentProgram(null);
  };

  const handleEdit = (program: Program) => {
    setCurrentProgram(program);
    setFormProgramName(program.name);
    setFormProgramCode(program.code);
    setFormProgramDescription(program.description || '');
    setFormDepartmentId(program.departmentId);
    setFormDurationYears(program.durationYears || undefined);
    setFormTotalSemesters(program.totalSemesters || undefined);
    setFormStatus(program.status);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    if (departments.length === 0) {
      toast({ variant: "destructive", title: "Cannot Add Program", description: "No departments available. Please create a department first." });
      return;
    }
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (programId: string) => {
    setIsSubmitting(true);
    try {
      await programService.deleteProgram(programId);
      await fetchProgramsAndDepartments();
      setSelectedProgramIds(prev => prev.filter(id => id !== programId));
      toast({ title: "Program Deleted", description: "The program has been successfully deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete program." });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formProgramName.trim() || !formProgramCode.trim() || !formDepartmentId) {
      toast({ variant: "destructive", title: "Validation Error", description: "Program Name, Code, and Department are required."});
      return;
    }
    if ((formDurationYears && (isNaN(formDurationYears) || formDurationYears <= 0 || formDurationYears > 10)) ||
        (formTotalSemesters && (isNaN(formTotalSemesters) || formTotalSemesters <= 0 || formTotalSemesters > 20))) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please enter valid duration and semester numbers." });
      return;
    }

    setIsSubmitting(true);
    
    const programData: Omit<Program, 'id'> = { 
      name: formProgramName.trim(), 
      code: formProgramCode.trim().toUpperCase(), 
      description: formProgramDescription.trim() || undefined, 
      departmentId: formDepartmentId,
      durationYears: formDurationYears ? Number(formDurationYears) : undefined,
      totalSemesters: formTotalSemesters ? Number(formTotalSemesters) : undefined,
      status: formStatus,
    };

    try {
      if (currentProgram && currentProgram.id) {
        await programService.updateProgram(currentProgram.id, programData);
        toast({ title: "Program Updated", description: "The program has been successfully updated." });
      } else {
        await programService.createProgram(programData);
        toast({ title: "Program Created", description: "The new program has been successfully created." });
      }
      await fetchProgramsAndDepartments();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message || "Could not save program." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleImportPrograms = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
     if (departments.length === 0) {
      toast({ variant: "destructive", title: "Import Error", description: "No departments loaded. Cannot map department IDs." });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await programService.importPrograms(selectedFile, departments); // Pass departments for mapping
      await fetchProgramsAndDepartments();
      toast({ title: "Import Successful", description: `${result.newCount} programs added, ${result.updatedCount} programs updated. Skipped: ${result.skippedCount}` });
    } catch (error: any) {
      console.error("Error processing CSV file:", error);
      toast({ variant: "destructive", title: "Import Failed", description: error.message || "Could not process the CSV file." });
    } finally {
      setIsSubmitting(false);
      setSelectedFile(null); 
      const fileInput = document.getElementById('csvImportProgram') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleExportPrograms = () => {
    if (filteredPrograms.length === 0) {
      toast({ title: "Export Canceled", description: "No programs to export (check filters)." });
      return;
    }
    const header = ["id", "name", "code", "description", "departmentId", "departmentName", "departmentCode", "durationYears", "totalSemesters", "status"];
    const csvRows = [
      header.join(','),
      ...filteredPrograms.map(prog => {
        const dept = departments.find(d => d.id === prog.departmentId);
        return [
          prog.id,
          `"${prog.name.replace(/"/g, '""')}"`,
          `"${prog.code.replace(/"/g, '""')}"`,
          `"${(prog.description || "").replace(/"/g, '""')}"`,
          prog.departmentId,
          `"${(dept?.name || "").replace(/"/g, '""')}"`,
          `"${(dept?.code || "").replace(/"/g, '""')}"`,
          prog.durationYears || "",
          prog.totalSemesters || "",
          prog.status
        ].join(',')
      })
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "programs_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Programs exported to programs_export.csv" });
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,name,code,description,departmentId,departmentName,departmentCode,durationYears,totalSemesters,status
prog_sample_1,Diploma in Information Technology,DIT,"Focuses on IT skills",dept1,"Computer Engineering","CE",3,6,active
,Bachelor of Science in Physics,BSPHYS,"Physics major",dept_gen,"General Department","GEN",4,8,inactive
`; 
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_programs_import.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_programs_import.csv downloaded." });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); 
  };
  
  const filteredPrograms = useMemo(() => {
    let result = [...programs];

    if (searchTerm) {
      result = result.filter(prog => 
        prog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prog.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prog.description && prog.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterStatus !== 'all') {
      result = result.filter(prog => prog.status === filterStatus);
    }
    if (filterDepartment !== 'all') {
      result = result.filter(prog => prog.departmentId === filterDepartment);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: any = a[sortField as keyof Program];
        let valB: any = b[sortField as keyof Program];

        if (sortField === 'durationYears' || sortField === 'totalSemesters') {
            valA = Number(valA) || 0;
            valB = Number(valB) || 0;
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
  }, [programs, searchTerm, filterStatus, filterDepartment, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  const paginatedPrograms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPrograms.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPrograms, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterStatus, filterDepartment, itemsPerPage]);


  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedProgramIds(paginatedPrograms.map(prog => prog.id));
    } else {
      setSelectedProgramIds([]);
    }
  };

  const handleSelectProgram = (programId: string, checked: boolean) => {
    if (checked) {
      setSelectedProgramIds(prev => [...prev, programId]);
    } else {
      setSelectedProgramIds(prev => prev.filter(id => id !== programId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedProgramIds.length === 0) {
      toast({ variant: "destructive", title: "No Programs Selected", description: "Please select programs to delete." });
      return;
    }
    setIsSubmitting(true);
    try {
      for (const id of selectedProgramIds) {
        await programService.deleteProgram(id);
      }
      await fetchProgramsAndDepartments();
      toast({ title: "Programs Deleted", description: `${selectedProgramIds.length} program(s) have been successfully deleted.` });
      setSelectedProgramIds([]);
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete selected programs." });
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedPrograms.length > 0 && paginatedPrograms.every(prog => selectedProgramIds.includes(prog.id));
  const isSomeSelectedOnPage = paginatedPrograms.some(prog => selectedProgramIds.includes(prog.id)) && !isAllSelectedOnPage;


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
              <BookCopy className="h-6 w-6" />
              Program Management
            </CardTitle>
            <CardDescription>
              Manage academic programs, their codes, durations, and associated departments.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto" disabled={departments.length === 0}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Program
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>{currentProgram?.id ? "Edit Program" : "Add New Program"}</DialogTitle>
                  <DialogDescription>
                    {currentProgram?.id ? "Modify the details of this program." : "Create a new program record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="progName">Program Name *</Label>
                    <Input id="progName" value={formProgramName} onChange={(e) => setFormProgramName(e.target.value)} placeholder="e.g., Diploma in Electrical Engineering" disabled={isSubmitting} required />
                  </div>
                  <div>
                    <Label htmlFor="progCode">Program Code *</Label>
                    <Input id="progCode" value={formProgramCode} onChange={(e) => setFormProgramCode(e.target.value.toUpperCase())} placeholder="e.g., DEE" disabled={isSubmitting} required />
                  </div>
                  <div>
                    <Label htmlFor="progDescription">Description</Label>
                    <Textarea id="progDescription" value={formProgramDescription} onChange={(e) => setFormProgramDescription(e.target.value)} placeholder="Brief description of the program" disabled={isSubmitting} rows={3} />
                  </div>
                  <div>
                    <Label htmlFor="progDepartment">Department *</Label>
                    <Select value={formDepartmentId} onValueChange={setFormDepartmentId} disabled={isSubmitting || departments.length === 0} required>
                      <SelectTrigger id="progDepartment"><SelectValue placeholder="Select Department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name} ({dept.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="progDurationYears">Duration (Years)</Label>
                      <Input id="progDurationYears" type="number" value={formDurationYears || ''} onChange={(e) => setFormDurationYears(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 3" disabled={isSubmitting} />
                    </div>
                    <div>
                      <Label htmlFor="progTotalSemesters">Total Semesters</Label>
                      <Input id="progTotalSemesters" type="number" value={formTotalSemesters || ''} onChange={(e) => setFormTotalSemesters(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 6" disabled={isSubmitting} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="progStatus">Status *</Label>
                    <Select value={formStatus} onValueChange={(value) => setFormStatus(value as 'active' | 'inactive')} disabled={isSubmitting} required>
                      <SelectTrigger id="progStatus"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {currentProgram?.id ? "Save Changes" : "Create Program"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportPrograms} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Programs from CSV</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportProgram" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportPrograms} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                Import
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
                </Button>
                <p className="text-xs text-muted-foreground">
                  CSV format: id (optional), name, code, description, departmentId OR (departmentName and departmentCode), durationYears, totalSemesters, status.
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="searchProgram">Search Programs</Label>
              <div className="relative">
                 <Input 
                    id="searchProgram" 
                    placeholder="Search by name, code..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-8"
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterProgStatus">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'active' | 'inactive' | 'all')}>
                <SelectTrigger id="filterProgStatus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterProgDepartment">Filter by Department</Label>
              <Select value={filterDepartment} onValueChange={(value) => setFilterDepartment(value as string)} disabled={departments.length === 0}>
                <SelectTrigger id="filterProgDepartment"><SelectValue placeholder="All Departments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name} ({dept.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedProgramIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedProgramIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedProgramIds.length} program(s) selected.
                </span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[50px]">
                    <Checkbox 
                        checked={isAllSelectedOnPage || (paginatedPrograms.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)}
                        onCheckedChange={(checkedState) => handleSelectAll(!!checkedState)}
                        aria-label="Select all programs on this page"
                    />
                </TableHead>
                <SortableTableHeader field="name" label="Program Name" />
                <SortableTableHeader field="code" label="Code" />
                <TableHead>Department</TableHead>
                <SortableTableHeader field="durationYears" label="Duration (Yrs)" />
                <SortableTableHeader field="totalSemesters" label="Semesters" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPrograms.map((prog) => (
                <TableRow key={prog.id} data-state={selectedProgramIds.includes(prog.id) ? "selected" : undefined}>
                  <TableCell>
                      <Checkbox
                        checked={selectedProgramIds.includes(prog.id)}
                        onCheckedChange={(checked) => handleSelectProgram(prog.id, !!checked)}
                        aria-labelledby={`prog-name-${prog.id}`}
                       />
                  </TableCell>
                  <TableCell id={`prog-name-${prog.id}`} className="font-medium">{prog.name}</TableCell>
                  <TableCell>{prog.code}</TableCell>
                  <TableCell>{departments.find(d => d.id === prog.departmentId)?.name || 'N/A'}</TableCell>
                  <TableCell>{prog.durationYears || '-'}</TableCell>
                  <TableCell>{prog.totalSemesters || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${prog.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                      {prog.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(prog)} disabled={isSubmitting}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Program</span>
                    </Button>
                    <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => handleDelete(prog.id)} 
                        disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Program</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedPrograms.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No programs found. Try adjusting your search or filters, or add a new program.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage -1) * itemsPerPage + 1, filteredPrograms.length)} to {Math.min(currentPage * itemsPerPage, filteredPrograms.length)} of {filteredPrograms.length} programs.
            </div>
            <div className="flex items-center gap-2">
                 <Select
                    value={String(itemsPerPage)}
                    onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                    }}
                    >
                    <SelectTrigger className="w-[70px] h-8 text-xs">
                        <SelectValue placeholder={String(itemsPerPage)} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {ITEMS_PER_PAGE_OPTIONS.map((pageSize) => (
                        <SelectItem key={pageSize} value={String(pageSize)} className="text-xs">
                            {pageSize}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages > 0 ? totalPages : 1}
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        >
                        <ChevronsLeft className="h-4 w-4" />
                        <span className="sr-only">First page</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous page</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next page</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        >
                        <ChevronsRight className="h-4 w-4" />
                        <span className="sr-only">Last page</span>
                    </Button>
                </div>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

