
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
import { PlusCircle, Edit, Trash2, Landmark, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import type { Institute } from '@/types/entities';
import { instituteService } from '@/lib/api/institutes';


type SortField = keyof Institute | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

export default function InstituteManagementPage() {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentInstitute, setCurrentInstitute] = useState<Partial<Institute> | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formEstablishmentYear, setFormEstablishmentYear] = useState<number | undefined>(undefined);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatusVal, setFilterStatusVal] = useState<'active' | 'inactive' | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedInstituteIds, setSelectedInstituteIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  const fetchInstitutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await instituteService.getAllInstitutes();
      setInstitutes(data);
    } catch (error) {
      console.error("Failed to load institutes", error);
      toast({ variant: "destructive", title: "Error", description: (error as Error).message || "Could not load institutes." });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchInstitutes();
  }, [fetchInstitutes]);


  const resetForm = () => {
    setFormName(''); setFormCode(''); setFormAddress('');
    setFormContactEmail(''); setFormContactPhone(''); setFormWebsite('');
    setFormStatus('active'); setFormEstablishmentYear(undefined);
    setCurrentInstitute(null);
  };

  const handleEdit = (institute: Institute) => {
    setCurrentInstitute(institute);
    setFormName(institute.name);
    setFormCode(institute.code);
    setFormAddress(institute.address || '');
    setFormContactEmail(institute.contactEmail || '');
    setFormContactPhone(institute.contactPhone || '');
    setFormWebsite(institute.website || '');
    setFormStatus(institute.status);
    setFormEstablishmentYear(institute.establishmentYear || undefined);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (instituteId: string) => {
    setIsSubmitting(true);
    try {
      await instituteService.deleteInstitute(instituteId);
      await fetchInstitutes(); 
      setSelectedInstituteIds(prev => prev.filter(id => id !== instituteId));
      toast({ title: "Institute Deleted", description: "The institute has been successfully deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete institute."});
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Institute Name and Code are required."});
      return;
    }
    if (formEstablishmentYear && (isNaN(formEstablishmentYear) || formEstablishmentYear < 1800 || formEstablishmentYear > new Date().getFullYear())) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid establishment year." });
      return;
    }
    if (formContactEmail.trim() && !/\S+@\S+\.\S+/.test(formContactEmail)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid contact email address." });
        return;
    }

    setIsSubmitting(true);
    
    const instituteData: Omit<Institute, 'id'> = { 
      name: formName.trim(), code: formCode.trim().toUpperCase(),
      address: formAddress.trim() || undefined,
      contactEmail: formContactEmail.trim() || undefined,
      contactPhone: formContactPhone.trim() || undefined,
      website: formWebsite.trim() || undefined,
      status: formStatus,
      establishmentYear: formEstablishmentYear ? Number(formEstablishmentYear) : undefined,
    };

    try {
      if (currentInstitute && currentInstitute.id) {
        await instituteService.updateInstitute(currentInstitute.id, instituteData);
        toast({ title: "Institute Updated", description: "The institute has been successfully updated." });
      } else {
        await instituteService.createInstitute(instituteData);
        toast({ title: "Institute Created", description: "The new institute has been successfully created." });
      }
      await fetchInstitutes(); 
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
       toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message || "Could not save institute."});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
  };

  const handleImportInstitutes = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await instituteService.importInstitutes(selectedFile);
      await fetchInstitutes(); 
      toast({ title: "Import Successful", description: `${result.newCount} institutes added, ${result.updatedCount} institutes updated.` });
    } catch (error: unknown) {
      console.error("Error processing CSV file:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not process the CSV file.";
      toast({ variant: "destructive", title: "Import Failed", description: errorMessage });
    } finally {
      setIsSubmitting(false); 
      setSelectedFile(null); 
      const fileInput = document.getElementById('csvImportInstitute') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleExportInstitutes = () => {
    if (filteredAndSortedInstitutes.length === 0) {
      toast({ title: "Export Canceled", description: "No institutes to export (check filters)." });
      return;
    }
    const header = ['id', 'name', 'code', 'address', 'contactEmail', 'contactPhone', 'website', 'status', 'establishmentYear'];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedInstitutes.map(i => [
        i.id, `"${i.name.replace(/"/g, '""')}"`, i.code, 
        `"${(i.address || "").replace(/"/g, '""')}"`,
        i.contactEmail || "", i.contactPhone || "", i.website || "",
        i.status, i.establishmentYear || ""
      ].join(','))
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "institutes_export.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Institutes exported to institutes_export.csv" });
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,name,code,address,contactEmail,contactPhone,website,status,establishmentYear
inst_sample_1,Another Polytechnic,AP,123 Sample Street,contact@ap.edu,123-456-7890,http://ap.edu,active,2000
,Tech Institute,TI,456 Tech Avenue,info@ti.ac.in,987-654-3210,https://ti.ac.in,inactive,1995
`; 
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_institutes_import.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_institutes_import.csv downloaded." });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field); setSortDirection('asc');
    }
    setCurrentPage(1); 
  };
  
  const filteredAndSortedInstitutes = useMemo(() => {
    let result = [...institutes];

    if (searchTerm) {
      result = result.filter(i => 
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.address && i.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (i.contactEmail && i.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterStatusVal !== 'all') {
      result = result.filter(i => i.status === filterStatusVal);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: unknown = a[sortField as keyof Institute];
        let valB: unknown = b[sortField as keyof Institute];
        
        if (sortField === 'establishmentYear') {
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
  }, [institutes, searchTerm, filterStatusVal, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedInstitutes.length / itemsPerPage);
  const paginatedInstitutes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedInstitutes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedInstitutes, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterStatusVal, itemsPerPage]);


  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedInstituteIds(checked === true ? paginatedInstitutes.map(i => i.id) : []);
  };

  const handleSelectInstitute = (instituteId: string, checked: boolean) => {
    setSelectedInstituteIds(prev => checked ? [...prev, instituteId] : prev.filter(id => id !== instituteId));
  };

  const handleDeleteSelected = async () => {
    if (selectedInstituteIds.length === 0) {
      toast({ variant: "destructive", title: "No Institutes Selected", description: "Please select institutes to delete." });
      return;
    }
    setIsSubmitting(true);
    try {
      // This will make one API call per selected institute.
      // For better performance with many selections, a batch delete endpoint would be preferable.
      for (const id of selectedInstituteIds) {
        await instituteService.deleteInstitute(id);
      }
      await fetchInstitutes(); 
      toast({ title: "Institutes Deleted", description: `${selectedInstituteIds.length} institute(s) have been successfully deleted.` });
      setSelectedInstituteIds([]);
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete selected institutes."});
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedInstitutes.length > 0 && paginatedInstitutes.every(i => selectedInstituteIds.includes(i.id));
  const isSomeSelectedOnPage = paginatedInstitutes.some(i => selectedInstituteIds.includes(i.id)) && !isAllSelectedOnPage;

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
              <Landmark className="h-6 w-6" />
              Institute Management
            </CardTitle>
            <CardDescription>
              Manage educational institutes, their details, and status.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Institute
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{currentInstitute?.id ? "Edit Institute" : "Add New Institute"}</DialogTitle>
                  <DialogDescription>
                    {currentInstitute?.id ? "Modify institute details." : "Create a new institute record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="md:col-span-1"><Label htmlFor="name">Institute Name *</Label><Input id="name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., Government Polytechnic Palanpur" disabled={isSubmitting} required /></div>
                  <div className="md:col-span-1"><Label htmlFor="code">Institute Code *</Label><Input id="code" value={formCode} onChange={e => setFormCode(e.target.value.toUpperCase())} placeholder="e.g., GPP" disabled={isSubmitting} required /></div>
                  
                  <div className="md:col-span-2"><Label htmlFor="address">Address</Label><Textarea id="address" value={formAddress} onChange={e => setFormAddress(e.target.value)} placeholder="e.g., Jagana, Palanpur, Gujarat 385011" disabled={isSubmitting} rows={2}/></div>
                  
                  <div className="md:col-span-1"><Label htmlFor="contactEmail">Contact Email</Label><Input id="contactEmail" type="email" value={formContactEmail} onChange={e => setFormContactEmail(e.target.value)} placeholder="e.g., contact@example.com" disabled={isSubmitting} /></div>
                  <div className="md:col-span-1"><Label htmlFor="contactPhone">Contact Phone</Label><Input id="contactPhone" type="tel" value={formContactPhone} onChange={e => setFormContactPhone(e.target.value)} placeholder="e.g., 02742-280126" disabled={isSubmitting} /></div>
                  <div className="md:col-span-1"><Label htmlFor="website">Website URL</Label><Input id="website" type="url" value={formWebsite} onChange={e => setFormWebsite(e.target.value)} placeholder="e.g., http://www.example.ac.in" disabled={isSubmitting} /></div>
                  
                  <div className="md:col-span-1"><Label htmlFor="establishmentYear">Establishment Year</Label><Input id="establishmentYear" type="number" value={formEstablishmentYear || ''} onChange={e => setFormEstablishmentYear(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 1964" disabled={isSubmitting} /></div>

                  <div className="md:col-span-1">
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formStatus} onValueChange={(value) => setFormStatus(value as 'active' | 'inactive')} disabled={isSubmitting} required>
                      <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <DialogFooter className="md:col-span-2 mt-4">
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{currentInstitute?.id ? "Save Changes" : "Create Institute"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportInstitutes} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Institutes from CSV</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportInstitute" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportInstitutes} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>} Import
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
                </Button>
                <p className="text-xs text-muted-foreground">
                  CSV fields: id (optional), name, code, address, contactEmail, contactPhone, website, status, establishmentYear.
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="searchInstitute">Search Institutes</Label>
              <div className="relative">
                 <Input id="searchInstitute" placeholder="Name, code, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-8"/>
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
             <div>
              <Label htmlFor="filterStatus">Filter by Status</Label>
              <Select value={filterStatusVal} onValueChange={(value) => setFilterStatusVal(value as 'active' | 'inactive' | 'all')}>
                <SelectTrigger id="filterStatus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedInstituteIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedInstituteIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedInstituteIds.length} institute(s) selected.
                </span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[50px]"><Checkbox checked={isAllSelectedOnPage || (paginatedInstitutes.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)} onCheckedChange={handleSelectAll} aria-label="Select all institutes on this page"/></TableHead>
                <SortableTableHeader field="name" label="Institute Name" />
                <SortableTableHeader field="code" label="Code" />
                <SortableTableHeader field="contactEmail" label="Contact Email" />
                <SortableTableHeader field="website" label="Website" />
                <SortableTableHeader field="establishmentYear" label="Estd. Year" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInstitutes.map((institute) => (
                <TableRow key={institute.id} data-state={selectedInstituteIds.includes(institute.id) ? "selected" : undefined}>
                  <TableCell><Checkbox checked={selectedInstituteIds.includes(institute.id)} onCheckedChange={(checked) => handleSelectInstitute(institute.id, !!checked)} aria-labelledby={`institute-name-${institute.id}`}/></TableCell>
                  <TableCell id={`institute-name-${institute.id}`} className="font-medium">{institute.name}</TableCell>
                  <TableCell>{institute.code}</TableCell>
                  <TableCell>{institute.contactEmail || '-'}</TableCell>
                  <TableCell>{institute.website ? <a href={institute.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{institute.website}</a> : '-'}</TableCell>
                  <TableCell>{institute.establishmentYear || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${institute.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                      {institute.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(institute)} disabled={isSubmitting}><Edit className="h-4 w-4" /><span className="sr-only">Edit Institute</span></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(institute.id)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /><span className="sr-only">Delete Institute</span></Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedInstitutes.length === 0 && (
                 <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No institutes found. Adjust filters or add a new institute.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedInstitutes.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedInstitutes.length) : 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedInstitutes.length)} of {filteredAndSortedInstitutes.length} institutes.
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

