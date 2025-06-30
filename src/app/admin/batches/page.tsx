"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Edit, Trash2, CalendarRange, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Batch, Program, BatchStatus } from '@/types/entities';
import { batchService } from '@/lib/api/batches';
import { programService } from '@/lib/api/programs';

type SortField = keyof Batch | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];
const BATCH_STATUS_OPTIONS: { value: BatchStatus, label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "inactive", label: "Inactive" },
];

export default function BatchManagementPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<Partial<Batch> | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formProgramId, setFormProgramId] = useState<string>('');
  const [formStartAcademicYear, setFormStartAcademicYear] = useState<number | undefined>(new Date().getFullYear());
  const [formEndAcademicYear, setFormEndAcademicYear] = useState<number | undefined>(undefined);
  const [formMaxIntake, setFormMaxIntake] = useState<number | undefined>(undefined);
  const [formStatus, setFormStatus] = useState<BatchStatus>('upcoming');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatusVal, setFilterStatusVal] = useState<BatchStatus | 'all'>('all');
  const [filterProgramVal, setFilterProgramVal] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [batchData, programData] = await Promise.all([
        batchService.getAllBatches(),
        programService.getAllPrograms()
      ]);
      setBatches(batchData);
      setPrograms(programData);
      if (programData.length > 0 && !formProgramId) {
        setFormProgramId(programData[0].id);
      }
    } catch (error) {
      console.error("Failed to load data", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load batches or programs data." });
    }
    setIsLoading(false);
  }, [toast, formProgramId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const resetForm = () => {
    setFormName(''); 
    setFormProgramId(programs.length > 0 ? programs[0].id : ''); 
    setFormStartAcademicYear(new Date().getFullYear());
    setFormEndAcademicYear(undefined);
    setFormMaxIntake(undefined);
    setFormStatus('upcoming');
    setCurrentBatch(null);
  };

  const handleEdit = (batch: Batch) => {
    setCurrentBatch(batch);
    setFormName(batch.name);
    setFormProgramId(batch.programId);
    setFormStartAcademicYear(batch.startAcademicYear);
    setFormEndAcademicYear(batch.endAcademicYear);
    setFormMaxIntake(batch.maxIntake);
    setFormStatus(batch.status);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    if (programs.length === 0) {
      toast({ variant: "destructive", title: "Cannot Add Batch", description: "No programs available. Please create a program first." });
      return;
    }
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (batchId: string) => {
    setIsSubmitting(true);
    try {
      await batchService.deleteBatch(batchId);
      await fetchInitialData();
      setSelectedBatchIds(prev => prev.filter(id => id !== batchId));
      toast({ title: "Batch Deleted", description: "The batch has been successfully deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete batch." });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formName.trim() || !formProgramId || !formStartAcademicYear) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name, Program, and Start Academic Year are required."});
      return;
    }
    if (formStartAcademicYear < 1900 || formStartAcademicYear > new Date().getFullYear() + 10) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid Start Academic Year." });
        return;
    }
    if (formEndAcademicYear && (formEndAcademicYear < formStartAcademicYear || formEndAcademicYear > formStartAcademicYear + 10)) {
        toast({ variant: "destructive", title: "Validation Error", description: "End Academic Year must be after Start Year and within a reasonable range." });
        return;
    }
    if (formMaxIntake !== undefined && (isNaN(formMaxIntake) || formMaxIntake < 0)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Max Intake must be a non-negative number." });
        return;
    }

    setIsSubmitting(true);
    
    const batchData: Omit<Batch, 'id' | 'createdAt' | 'updatedAt'> = { 
      name: formName.trim(),
      programId: formProgramId,
      startAcademicYear: Number(formStartAcademicYear),
      endAcademicYear: formEndAcademicYear ? Number(formEndAcademicYear) : undefined,
      maxIntake: formMaxIntake ? Number(formMaxIntake) : undefined,
      status: formStatus,
    };

    try {
      if (currentBatch && currentBatch.id) {
        await batchService.updateBatch(currentBatch.id, batchData);
        toast({ title: "Batch Updated", description: "The batch has been successfully updated." });
      } else {
        await batchService.createBatch(batchData);
        toast({ title: "Batch Created", description: "The new batch has been successfully created." });
      }
      await fetchInitialData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message || "Could not save batch." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
  };

  const handleImportBatches = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
     if (programs.length === 0) {
      toast({ variant: "destructive", title: "Import Error", description: "No programs loaded. Cannot map program IDs." });
      return;
    }

    setIsSubmitting(true);
    try {
        const result = await batchService.importBatches(selectedFile, programs);
        await fetchInitialData();
        toast({ title: "Import Successful", description: `${result.newCount} batches added, ${result.updatedCount} updated. Skipped: ${result.skippedCount}`});
        if (result.errors && result.errors.length > 0) {
          result.errors.slice(0, 3).forEach((err: any) => {
            toast({ variant: "destructive", title: `Import Warning (Row ${err.row})`, description: err.message });
          });
        }
    } catch (error: unknown) {
        console.error("Error processing CSV file:", error);
        const errorMessage = error instanceof Error ? error.message : "Could not process the CSV file.";
        toast({ variant: "destructive", title: "Import Failed", description: errorMessage });
    } finally {
        setIsSubmitting(false); setSelectedFile(null); 
        const fileInput = document.getElementById('csvImportBatch') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }
  };

  const handleExportBatches = () => {
    if (filteredAndSortedBatches.length === 0) {
      toast({ title: "Export Canceled", description: "No batches to export (check filters)." });
      return;
    }
    const header = ['id', 'name', 'programId', 'programName', 'programCode', 'startAcademicYear', 'endAcademicYear', 'maxIntake', 'status'];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedBatches.map(b => {
        const prog = programs.find(p => p.id === b.programId);
        return [
          b.id, `"${b.name.replace(/"/g, '""')}"`,
          b.programId, 
          `"${(prog?.name || "").replace(/"/g, '""')}"`,
          `"${(prog?.code || "").replace(/"/g, '""')}"`,
          b.startAcademicYear, b.endAcademicYear || "", b.maxIntake || "", b.status
        ].join(',');
      })
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "batches_export.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Batches exported to batches_export.csv" });
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,name,programId,programName,programCode,startAcademicYear,endAcademicYear,maxIntake,status
batch_s1,2024-2027,prog1,"Diploma in Computer Engg","DCE",2024,2027,60,upcoming
,2023-2026,prog1,"Diploma in Computer Engg","DCE",2023,2026,60,active
`; 
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_batches_import.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_batches_import.csv downloaded." });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field); setSortDirection('asc');
    }
    setCurrentPage(1); 
  };
  
  const filteredAndSortedBatches = useMemo(() => {
    let result = [...batches];

    if (searchTerm) {
      result = result.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.startAcademicYear.toString().includes(searchTerm) ||
        (b.endAcademicYear && b.endAcademicYear.toString().includes(searchTerm))
      );
    }
    if (filterStatusVal !== 'all') {
      result = result.filter(b => b.status === filterStatusVal);
    }
    if (filterProgramVal !== 'all') {
      result = result.filter(b => b.programId === filterProgramVal);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: unknown = a[sortField as keyof Batch];
        let valB: unknown = b[sortField as keyof Batch];
        
        const numericFields: (keyof Batch)[] = ['startAcademicYear', 'endAcademicYear', 'maxIntake'];
        if (numericFields.includes(sortField as keyof Batch)) {
            valA = Number(valA) || 0; valB = Number(valB) || 0;
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
  }, [batches, searchTerm, filterStatusVal, filterProgramVal, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedBatches.length / itemsPerPage);
  const paginatedBatches = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedBatches.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedBatches, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterStatusVal, filterProgramVal, itemsPerPage]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedBatchIds(checked === true ? paginatedBatches.map(c => c.id) : []);
  };

  const handleSelectBatch = (batchId: string, checked: boolean) => {
    setSelectedBatchIds(prev => checked ? [...prev, batchId] : prev.filter(id => id !== batchId));
  };

  const handleDeleteSelected = async () => {
    if (selectedBatchIds.length === 0) {
      toast({ variant: "destructive", title: "No Batches Selected", description: "Please select batches to delete." });
      return;
    }
    setIsSubmitting(true);
    try {
        for(const id of selectedBatchIds) {
            await batchService.deleteBatch(id);
        }
        await fetchInitialData();
        toast({ title: "Batches Deleted", description: `${selectedBatchIds.length} batch(es) have been successfully deleted.` });
        setSelectedBatchIds([]);
    } catch (error) {
        toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete selected batches."});
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedBatches.length > 0 && paginatedBatches.every(c => selectedBatchIds.includes(c.id));
  const isSomeSelectedOnPage = paginatedBatches.some(c => selectedBatchIds.includes(c.id)) && !isAllSelectedOnPage;

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
              <CalendarRange className="h-6 w-6" />
              Batch Management
            </CardTitle>
            <CardDescription>
              Manage academic batches, their academic years, associated programs, and status.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto" disabled={programs.length === 0}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Batch
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{currentBatch?.id ? "Edit Batch" : "Add New Batch"}</DialogTitle>
                  <DialogDescription>
                    {currentBatch?.id ? "Modify batch details." : "Create a new batch record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div><Label htmlFor="name">Batch Name *</Label><Input id="name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., 2024-2027" disabled={isSubmitting} required /></div>
                  
                  <div>
                    <Label htmlFor="programId">Program *</Label>
                    <Select value={formProgramId} onValueChange={setFormProgramId} disabled={isSubmitting || programs.length === 0} required>
                      <SelectTrigger id="programId"><SelectValue placeholder="Select Program" /></SelectTrigger>
                      <SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="startAcademicYear">Start Academic Year *</Label><Input id="startAcademicYear" type="number" value={formStartAcademicYear || ''} onChange={e => setFormStartAcademicYear(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 2024" disabled={isSubmitting} required /></div>
                    <div><Label htmlFor="endAcademicYear">End Academic Year</Label><Input id="endAcademicYear" type="number" value={formEndAcademicYear || ''} onChange={e => setFormEndAcademicYear(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 2027" disabled={isSubmitting} /></div>
                  </div>

                  <div><Label htmlFor="maxIntake">Max Intake</Label><Input id="maxIntake" type="number" value={formMaxIntake || ''} onChange={e => setFormMaxIntake(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 60" disabled={isSubmitting} /></div>
                  
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formStatus} onValueChange={(value) => setFormStatus(value as BatchStatus)} disabled={isSubmitting} required>
                      <SelectTrigger id="status"><SelectValue placeholder="Select Status"/></SelectTrigger>
                      <SelectContent>{BATCH_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  
                  <DialogFooter className="mt-4">
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{currentBatch?.id ? "Save Changes" : "Create Batch"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportBatches} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Batches from CSV</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportBatch" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportBatches} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>} Import
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
                </Button>
                <p className="text-xs text-muted-foreground">
                  CSV fields: id (opt), name, programId OR (programName & programCode), startAcademicYear, endAcademicYear, maxIntake, status.
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="searchBatch">Search Batches</Label>
              <div className="relative">
                 <Input id="searchBatch" placeholder="Name, year..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-8"/>
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterProgram">Filter by Program</Label>
              <Select value={filterProgramVal} onValueChange={setFilterProgramVal} disabled={programs.length === 0}>
                <SelectTrigger id="filterProgram"><SelectValue placeholder="All Programs"/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStatusBatch">Filter by Status</Label>
              <Select value={filterStatusVal} onValueChange={(value) => setFilterStatusVal(value as BatchStatus | 'all')}>
                <SelectTrigger id="filterStatusBatch"><SelectValue placeholder="All Statuses"/></SelectTrigger>
                <SelectContent>{[{value: 'all', label: 'All Statuses'} as {value: BatchStatus | 'all', label: string}, ...BATCH_STATUS_OPTIONS].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {selectedBatchIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedBatchIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedBatchIds.length} batch(es) selected.
                </span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[50px]"><Checkbox checked={isAllSelectedOnPage || (paginatedBatches.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)} onCheckedChange={(checkedState) => handleSelectAll(!!checkedState)} aria-label="Select all batches on this page"/></TableHead>
                <SortableTableHeader field="name" label="Batch Name" />
                <SortableTableHeader field="programId" label="Program" />
                <SortableTableHeader field="startAcademicYear" label="Start Year" />
                <SortableTableHeader field="endAcademicYear" label="End Year" />
                <SortableTableHeader field="maxIntake" label="Max Intake" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBatches.map((batch) => (
                <TableRow key={batch.id} data-state={selectedBatchIds.includes(batch.id) ? "selected" : undefined}>
                  <TableCell><Checkbox checked={selectedBatchIds.includes(batch.id)} onCheckedChange={(checked) => handleSelectBatch(batch.id, !!checked)} aria-labelledby={`batch-name-${batch.id}`}/></TableCell>
                  <TableCell id={`batch-name-${batch.id}`} className="font-medium">{batch.name}</TableCell>
                  <TableCell>{programs.find(p => p.id === batch.programId)?.name || 'N/A'}</TableCell>
                  <TableCell>{batch.startAcademicYear}</TableCell>
                  <TableCell>{batch.endAcademicYear || '-'}</TableCell>
                  <TableCell>{batch.maxIntake || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        batch.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : batch.status === 'upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : batch.status === 'completed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' /* inactive */
                    }`}>
                      {BATCH_STATUS_OPTIONS.find(s => s.value === batch.status)?.label || batch.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(batch)} disabled={isSubmitting}><Edit className="h-4 w-4" /><span className="sr-only">Edit Batch</span></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(batch.id)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /><span className="sr-only">Delete Batch</span></Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedBatches.length === 0 && (
                 <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No batches found. Adjust filters or add a new batch.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedBatches.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedBatches.length): 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedBatches.length)} of {filteredAndSortedBatches.length} batches.
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