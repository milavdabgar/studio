
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Edit, Trash2, Users2 as CommitteeIcon, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import type { Committee, CommitteeStatus, Institute, SystemUser as User } from '@/types/entities';
import { committeeService } from '@/lib/api/committees';
import { instituteService } from '@/lib/api/institutes';
import { userService } from '@/lib/api/users';

const COMMITTEE_STATUS_OPTIONS: { value: CommitteeStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "dissolved", label: "Dissolved" },
];

type SortField = keyof Committee | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];
const NO_CONVENER_VALUE = "__NO_CONVENER__";

export default function CommitteeManagementPage() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [facultyUsers, setFacultyUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCommittee, setCurrentCommittee] = useState<Partial<Committee> | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formInstituteId, setFormInstituteId] = useState<string>('');
  const [formFormationDate, setFormFormationDate] = useState<Date | undefined>(undefined);
  const [formDissolutionDate, setFormDissolutionDate] = useState<Date | undefined>(undefined);
  const [formStatus, setFormStatus] = useState<CommitteeStatus>('active');
  const [formConvenerId, setFormConvenerId] = useState<string>(NO_CONVENER_VALUE);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatusVal, setFilterStatusVal] = useState<CommitteeStatus | 'all'>('all');
  const [filterInstituteVal, setFilterInstituteVal] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedCommitteeIds, setSelectedCommitteeIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [committeeData, instituteData, usersData] = await Promise.all([
        committeeService.getAllCommittees(),
        instituteService.getAllInstitutes(),
        userService.getAllUsers()
      ]);
      setCommittees(committeeData);
      setInstitutes(instituteData);
      setFacultyUsers(usersData.filter(u => u.roles.includes('faculty') || u.roles.includes('hod') || u.roles.includes('admin') || u.roles.includes('committee_convener')));
      if (instituteData.length > 0 && !formInstituteId) {
        setFormInstituteId(instituteData[0].id);
      }
    } catch (error) {
      console.error("Failed to load data", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load initial data." });
    }
    setIsLoading(false);
  }, [toast, formInstituteId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const resetForm = () => {
    setFormName(''); 
    setFormCode(''); 
    setFormDescription(''); 
    setFormPurpose('');
    setFormInstituteId(institutes.length > 0 ? institutes[0].id : ''); 
    setFormFormationDate(undefined); 
    setFormDissolutionDate(undefined);
    setFormStatus('active');
    setFormConvenerId(NO_CONVENER_VALUE);
    setCurrentCommittee(null);
  };

  const handleEdit = (committee: Committee) => {
    setCurrentCommittee(committee);
    setFormName(committee.name || '');
    setFormCode(committee.code || '');
    setFormDescription(committee.description || '');
    setFormPurpose(committee.purpose || '');
    setFormInstituteId(committee.instituteId || '');
    setFormFormationDate(committee.formationDate && isValid(parseISO(committee.formationDate)) ? parseISO(committee.formationDate) : undefined);
    setFormDissolutionDate(committee.dissolutionDate && isValid(parseISO(committee.dissolutionDate)) ? parseISO(committee.dissolutionDate) : undefined);
    setFormStatus(committee.status);
    setFormConvenerId(committee.convenerId || NO_CONVENER_VALUE);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    if (institutes.length === 0) {
      toast({ variant: "destructive", title: "Cannot Add Committee", description: "No institutes available. Please create an institute first." });
      return;
    }
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (committeeId: string) => {
    setIsSubmitting(true);
    try {
      await committeeService.deleteCommittee(committeeId);
      await fetchInitialData();
      setSelectedCommitteeIds(prev => prev.filter(id => id !== committeeId));
      toast({ title: "Committee Deleted", description: "The committee has been successfully deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete committee." });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formName.trim() || !formCode.trim() || !formPurpose.trim() || !formInstituteId || !formFormationDate) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name, Code, Purpose, Institute, and Formation Date are required."});
      return;
    }

    setIsSubmitting(true);
    
    const committeeData: Omit<Committee, 'id' | 'createdAt' | 'updatedAt'> = { 
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      description: formDescription.trim() || undefined,
      purpose: formPurpose.trim(),
      instituteId: formInstituteId,
      formationDate: format(formFormationDate, "yyyy-MM-dd"),
      dissolutionDate: formDissolutionDate ? format(formDissolutionDate, "yyyy-MM-dd") : undefined,
      status: formStatus,
      convenerId: formConvenerId === NO_CONVENER_VALUE ? undefined : formConvenerId,
    };

    try {
      if (currentCommittee && currentCommittee.id) {
        await committeeService.updateCommittee(currentCommittee.id, committeeData);
        toast({ title: "Committee Updated", description: "The committee has been successfully updated." });
      } else {
        await committeeService.createCommittee(committeeData);
        toast({ title: "Committee Created", description: "The new committee has been successfully created." });
      }
      await fetchInitialData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message || "Could not save committee." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
  };

  const handleImportCommittees = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
     if (institutes.length === 0) {
      toast({ variant: "destructive", title: "Import Error", description: "No institutes loaded. Cannot map institute IDs." });
      return;
    }
    if (facultyUsers.length === 0) {
      toast({ variant: "warning", title: "Import Note", description: "No faculty users loaded. Convener IDs might not be mapped correctly." });
    }

    setIsSubmitting(true);
    try {
        const result = await committeeService.importCommittees(selectedFile, institutes, facultyUsers);
        await fetchInitialData();
        toast({ title: "Import Successful", description: `${result.newCount} committees added, ${result.updatedCount} updated. Skipped: ${result.skippedCount}`});
        if (result.errors && result.errors.length > 0) {
          result.errors.slice(0, 3).forEach((err: unknown) => {
            toast({ variant: "destructive", title: `Import Warning (Row ${err.row})`, description: err.message });
          });
        }
    } catch (error: unknown) {
        console.error("Error processing CSV file:", error);
        toast({ variant: "destructive", title: "Import Failed", description: error.message || "Could not process the CSV file." });
    } finally {
        setIsSubmitting(false); setSelectedFile(null); 
        const fileInput = document.getElementById('csvImportCommittee') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }
  };

  const handleExportCommittees = () => {
    if (filteredAndSortedCommittees.length === 0) {
      toast({ title: "Export Canceled", description: "No committees to export (check filters)." });
      return;
    }
    const header = ['id', 'name', 'code', 'description', 'purpose', 'instituteId', 'instituteName', 'instituteCode', 'formationDate', 'dissolutionDate', 'status', 'convenerId', 'convenerName'];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedCommittees.map(c => {
        const inst = institutes.find(i => i.id === c.instituteId);
        const convener = facultyUsers.find(u => u.id === c.convenerId);
        return [
          c.id, `"${c.name.replace(/"/g, '""')}"`, `"${c.code.replace(/"/g, '""')}"`,
          `"${(c.description || "").replace(/"/g, '""')}"`,
          `"${c.purpose.replace(/"/g, '""')}"`,
          c.instituteId, 
          `"${(inst?.name || "").replace(/"/g, '""')}"`,
          `"${(inst?.code || "").replace(/"/g, '""')}"`,
          c.formationDate, c.dissolutionDate || "", c.status,
          c.convenerId || "", `"${(convener?.displayName || "").replace(/"/g, '""')}"`
        ].join(',');
      })
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "committees_export.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Committees exported to committees_export.csv" });
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,name,code,description,purpose,instituteId,instituteName,instituteCode,formationDate,dissolutionDate,status,convenerId,convenerEmail
cmt_sample_1,Academic Committee,ACCOM,"Oversees academic policies","To ensure academic standards and curriculum development",inst1,"Government Polytechnic Palanpur","GPP",2023-01-15,,active,user_faculty_1,faculty1@example.com
,Anti-Ragging Committee,ARC,"Prevents ragging incidents","To create a ragging-free campus environment",inst1,"Government Polytechnic Palanpur","GPP",2022-08-01,2023-07-31,dissolved,,
`; 
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_committees_import.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_committees_import.csv downloaded." });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field); setSortDirection('asc');
    }
    setCurrentPage(1); 
  };
  
  const filteredAndSortedCommittees = useMemo(() => {
    let result = [...committees];

    if (searchTerm) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.purpose && c.purpose.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterStatusVal !== 'all') {
      result = result.filter(c => c.status === filterStatusVal);
    }
    if (filterInstituteVal !== 'all') {
      result = result.filter(c => c.instituteId === filterInstituteVal);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: unknown = a[sortField as keyof Committee];
        let valB: unknown = b[sortField as keyof Committee];
        
        if (sortField === 'formationDate' || sortField === 'dissolutionDate') {
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
  }, [committees, searchTerm, filterStatusVal, filterInstituteVal, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedCommittees.length / itemsPerPage);
  const paginatedCommittees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCommittees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCommittees, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterStatusVal, filterInstituteVal, itemsPerPage]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedCommitteeIds(checked === true ? paginatedCommittees.map(c => c.id) : []);
  };

  const handleSelectCommittee = (committeeId: string, checked: boolean) => {
    setSelectedCommitteeIds(prev => checked ? [...prev, committeeId] : prev.filter(id => id !== committeeId));
  };

  const handleDeleteSelected = async () => {
    if (selectedCommitteeIds.length === 0) {
      toast({ variant: "destructive", title: "No Committees Selected", description: "Please select committees to delete." });
      return;
    }
    setIsSubmitting(true);
    try {
        for(const id of selectedCommitteeIds) {
            await committeeService.deleteCommittee(id);
        }
        await fetchInitialData();
        toast({ title: "Committees Deleted", description: `${selectedCommitteeIds.length} committee(s) have been successfully deleted.` });
        setSelectedCommitteeIds([]);
    } catch (error) {
        toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete selected committees."});
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedCommittees.length > 0 && paginatedCommittees.every(c => selectedCommitteeIds.includes(c.id));
  const isSomeSelectedOnPage = paginatedCommittees.some(c => selectedCommitteeIds.includes(c.id)) && !isAllSelectedOnPage;

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
              <CommitteeIcon className="h-6 w-6" />
              Committee Management
            </CardTitle>
            <CardDescription>
              Manage institute committees, their purpose, members, and status.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto" disabled={institutes.length === 0}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Committee
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{currentCommittee?.id ? "Edit Committee" : "Add New Committee"}</DialogTitle>
                  <DialogDescription>
                    {currentCommittee?.id ? "Modify committee details." : "Create a new committee record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="md:col-span-1"><Label htmlFor="name">Committee Name *</Label><Input id="name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., Academic Council" disabled={isSubmitting} required /></div>
                  <div className="md:col-span-1"><Label htmlFor="code">Committee Code *</Label><Input id="code" value={formCode} onChange={e => setFormCode(e.target.value.toUpperCase())} placeholder="e.g., AC" disabled={isSubmitting} required /></div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="instituteId">Institute *</Label>
                    <Select value={formInstituteId} onValueChange={setFormInstituteId} disabled={isSubmitting || institutes.length === 0} required>
                      <SelectTrigger id="instituteId"><SelectValue placeholder="Select Institute" /></SelectTrigger>
                      <SelectContent>{institutes.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.code})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2"><Label htmlFor="purpose">Purpose *</Label><Textarea id="purpose" value={formPurpose} onChange={e => setFormPurpose(e.target.value)} placeholder="Brief purpose of the committee" disabled={isSubmitting} rows={2} required/></div>
                  <div className="md:col-span-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Detailed description (optional)" disabled={isSubmitting} rows={3}/></div>
                  
                  <div className="md:col-span-1">
                    <Label htmlFor="convenerId">Convener</Label>
                    <Select 
                      value={formConvenerId} 
                      onValueChange={(value) => setFormConvenerId(value)} 
                      disabled={isSubmitting || facultyUsers.length === 0}
                    >
                      <SelectTrigger id="convenerId"><SelectValue placeholder="Select Convener (Optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_CONVENER_VALUE}>None</SelectItem>
                        {facultyUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.displayName} ({user.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-1">
                    <Label htmlFor="formationDate">Formation Date *</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !formFormationDate && "text-muted-foreground")}
                                disabled={isSubmitting}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formFormationDate ? format(formFormationDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={formFormationDate} onSelect={setFormFormationDate} initialFocus captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} />
                        </PopoverContent>
                    </Popover>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="dissolutionDate">Dissolution Date (Optional)</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !formDissolutionDate && "text-muted-foreground")}
                                disabled={isSubmitting}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formDissolutionDate ? format(formDissolutionDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={formDissolutionDate} onSelect={setFormDissolutionDate} initialFocus captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear() + 10} />
                        </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="md:col-span-1">
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formStatus} onValueChange={(value) => setFormStatus(value as CommitteeStatus)} disabled={isSubmitting} required>
                      <SelectTrigger id="status"><SelectValue placeholder="Select Status"/></SelectTrigger>
                      <SelectContent>{COMMITTEE_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  
                  <DialogFooter className="md:col-span-2 mt-4">
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{currentCommittee?.id ? "Save Changes" : "Create Committee"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportCommittees} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Committees from CSV</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportCommittee" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportCommittees} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>} Import
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
                </Button>
                <p className="text-xs text-muted-foreground">
                  CSV fields: id (opt), name, code, purpose, instituteId/Name/Code, formationDate, status, convenerId/Email.
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="searchCommittee">Search Committees</Label>
              <div className="relative">
                 <Input id="searchCommittee" placeholder="Name, code, purpose..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-8"/>
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterInstitute">Filter by Institute</Label>
              <Select value={filterInstituteVal} onValueChange={setFilterInstituteVal} disabled={institutes.length === 0}>
                <SelectTrigger id="filterInstitute"><SelectValue placeholder="All Institutes"/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Institutes</SelectItem>
                    {institutes.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStatusCommittee">Filter by Status</Label>
              <Select value={filterStatusVal} onValueChange={(value) => setFilterStatusVal(value as CommitteeStatus | 'all')}>
                <SelectTrigger id="filterStatusCommittee"><SelectValue placeholder="All Statuses"/></SelectTrigger>
                <SelectContent>{[{value: 'all', label: 'All Statuses'} as {value: CommitteeStatus | 'all', label: string}, ...COMMITTEE_STATUS_OPTIONS].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {selectedCommitteeIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedCommitteeIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedCommitteeIds.length} committee(s) selected.
                </span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[50px]"><Checkbox checked={isAllSelectedOnPage || (paginatedCommittees.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)} onCheckedChange={(checkedState) => handleSelectAll(!!checkedState)} aria-label="Select all committees on this page"/></TableHead>
                <SortableTableHeader field="name" label="Committee Name" />
                <SortableTableHeader field="code" label="Code" />
                <TableHead>Institute</TableHead>
                <TableHead>Convener</TableHead>
                <SortableTableHeader field="formationDate" label="Formed On" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCommittees.map((committee) => (
                <TableRow key={committee.id} data-state={selectedCommitteeIds.includes(committee.id) ? "selected" : undefined}>
                  <TableCell><Checkbox checked={selectedCommitteeIds.includes(committee.id)} onCheckedChange={(checked) => handleSelectCommittee(committee.id, !!checked)} aria-labelledby={`committee-name-${committee.id}`}/></TableCell>
                  <TableCell id={`committee-name-${committee.id}`} className="font-medium">{committee.name}</TableCell>
                  <TableCell>{committee.code}</TableCell>
                  <TableCell>{institutes.find(i => i.id === committee.instituteId)?.name || 'N/A'}</TableCell>
                  <TableCell>{facultyUsers.find(u => u.id === committee.convenerId)?.displayName || '-'}</TableCell>
                  <TableCell>{committee.formationDate && isValid(parseISO(committee.formationDate)) ? format(parseISO(committee.formationDate), 'dd MMM yyyy') : '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        committee.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : committee.status === 'inactive' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' /* dissolved */
                    }`}>
                      {COMMITTEE_STATUS_OPTIONS.find(s => s.value === committee.status)?.label || committee.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(committee)} disabled={isSubmitting}><Edit className="h-4 w-4" /><span className="sr-only">Edit Committee</span></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(committee.id)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /><span className="sr-only">Delete Committee</span></Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedCommittees.length === 0 && (
                 <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No committees found. Adjust filters or add a new committee.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedCommittees.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedCommittees.length): 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedCommittees.length)} of {filteredAndSortedCommittees.length} committees.
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
