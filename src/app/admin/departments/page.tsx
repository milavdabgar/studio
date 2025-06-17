
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
import { PlusCircle, Edit, Trash2, Building2, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import type { Department, User } from '@/types/entities'; 
import { departmentService } from '@/lib/api/departments';
import { userService } from '@/lib/api/users'; 

type SortField = keyof Department | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];
const NO_HOD_VALUE = "__NO_HOD__"; 

export default function DepartmentManagementPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [facultyUsers, setFacultyUsers] = useState<User[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState<Partial<Department> | null>(null);

  // Form state
  const [formDeptName, setFormDeptName] = useState('');
  const [formDeptCode, setFormDeptCode] = useState('');
  const [formDeptDescription, setFormDeptDescription] = useState('');
  const [formHodId, setFormHodId] = useState<string | undefined>(undefined);
  const [formEstablishmentYear, setFormEstablishmentYear] = useState<number | undefined>(undefined);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  const fetchDepartmentsAndFaculty = async () => {
    setIsLoading(true);
    try {
      const [deptData, usersData] = await Promise.all([
        departmentService.getAllDepartments(),
        userService.getAllUsers() 
      ]);
      setDepartments(deptData);
      // Filter users who have 'faculty' or 'hod' roles
      setFacultyUsers(usersData.filter(u => u.roles.includes('faculty') || u.roles.includes('hod')));
    } catch (error) {
      console.error("Failed to load data", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load departments or faculty data." });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDepartmentsAndFaculty();
  }, []);

  const resetForm = () => {
    setFormDeptName('');
    setFormDeptCode('');
    setFormDeptDescription('');
    setFormHodId(undefined);
    setFormEstablishmentYear(undefined);
    setFormStatus('active');
    setCurrentDepartment(null);
  };

  const handleEdit = (department: Department) => {
    setCurrentDepartment(department);
    setFormDeptName(department.name);
    setFormDeptCode(department.code);
    setFormDeptDescription(department.description || '');
    setFormHodId(department.hodId || undefined);
    setFormEstablishmentYear(department.establishmentYear || undefined);
    setFormStatus(department.status);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (departmentId: string) => {
    setIsSubmitting(true);
    try {
      await departmentService.deleteDepartment(departmentId);
      await fetchDepartmentsAndFaculty();
      setSelectedDepartmentIds(prev => prev.filter(id => id !== departmentId));
      toast({ title: "Department Deleted", description: "The department has been successfully deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete department." });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formDeptName.trim() || !formDeptCode.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Department Name and Code cannot be empty."});
      return;
    }
    if (formEstablishmentYear && (isNaN(formEstablishmentYear) || formEstablishmentYear < 1900 || formEstablishmentYear > new Date().getFullYear())) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid establishment year." });
      return;
    }

    setIsSubmitting(true);
    
    const departmentData: Omit<Department, 'id' | 'instituteId'> & { instituteId?: string } = { 
      name: formDeptName.trim(), 
      code: formDeptCode.trim().toUpperCase(), 
      description: formDeptDescription.trim() || undefined, 
      hodId: formHodId === NO_HOD_VALUE ? undefined : formHodId,
      establishmentYear: formEstablishmentYear ? Number(formEstablishmentYear) : undefined,
      status: formStatus,
      instituteId: currentDepartment?.instituteId || "inst1", // TODO: Make this dynamic if supporting multiple institutes
    };
    if (!departmentData.instituteId) {
        toast({variant: "destructive", title: "Error", description: "Institute ID is missing."});
        setIsSubmitting(false);
        return;
    }


    try {
      if (currentDepartment && currentDepartment.id) {
        await departmentService.updateDepartment(currentDepartment.id, departmentData);
        toast({ title: "Department Updated", description: "The department has been successfully updated." });
      } else {
        await departmentService.createDepartment(departmentData as Omit<Department, 'id'>);
        toast({ title: "Department Created", description: "The new department has been successfully created." });
      }
      await fetchDepartmentsAndFaculty();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message || "Could not save department." });
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

  const handleImportDepartments = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
    setIsSubmitting(true);
    try {
      // Assuming instituteId will be handled by the backend or a default is set.
      // For a multi-institute setup, you might need to pass an instituteId or select one in the UI.
      const result = await departmentService.importDepartments(selectedFile, "inst1"); // Example instituteId
      await fetchDepartmentsAndFaculty();
      toast({ title: "Import Successful", description: `${result.newCount} departments added, ${result.updatedCount} departments updated.` });
    } catch (error: unknown) {
      console.error("Error processing CSV file:", error);
      toast({ variant: "destructive", title: "Import Failed", description: error.message || "Could not process the CSV file." });
    } finally {
      setIsSubmitting(false);
      setSelectedFile(null); 
      const fileInput = document.getElementById('csvImportDepartment') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleExportDepartments = () => {
    if (filteredDepartments.length === 0) {
      toast({ title: "Export Canceled", description: "No departments to export (check filters)." });
      return;
    }
    const header = ["id", "name", "code", "description", "hodId", "hodName", "establishmentYear", "status", "instituteId"];
    const csvRows = [
      header.join(','),
      ...filteredDepartments.map(dept => {
        const hod = facultyUsers.find(u => u.id === dept.hodId);
        return [
          dept.id,
          `"${dept.name.replace(/"/g, '""')}"`,
          `"${dept.code.replace(/"/g, '""')}"`,
          `"${(dept.description || "").replace(/"/g, '""')}"`,
          dept.hodId || "",
          `"${(hod?.displayName || "").replace(/"/g, '""')}"`,
          dept.establishmentYear || "",
          dept.status,
          dept.instituteId || "inst1" // Example default
        ].join(',');
      })
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "departments_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Departments exported to departments_export.csv" });
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,name,code,description,hodId,establishmentYear,status,instituteId
dept_sample_1,Information Technology,IT,"Handles all IT related courses and infrastructure",user_hod_it_id,2005,active,inst1
,Textile Engineering,TX,"Focuses on textile manufacturing and design",,1998,inactive,inst1
`; 
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_departments_import.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_departments_import.csv downloaded." });
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
  
  const filteredDepartments = useMemo(() => {
    let result = [...departments];

    if (searchTerm) {
      result = result.filter(dept => 
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterStatus !== 'all') {
      result = result.filter(dept => dept.status === filterStatus);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: unknown = a[sortField as keyof Department];
        let valB: unknown = b[sortField as keyof Department];

        if (sortField === 'establishmentYear') {
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
  }, [departments, searchTerm, filterStatus, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const paginatedDepartments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDepartments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDepartments, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterStatus, itemsPerPage]);


  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedDepartmentIds(paginatedDepartments.map(dept => dept.id));
    } else {
      setSelectedDepartmentIds([]);
    }
  };

  const handleSelectDepartment = (departmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDepartmentIds(prev => [...prev, departmentId]);
    } else {
      setSelectedDepartmentIds(prev => prev.filter(id => id !== departmentId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDepartmentIds.length === 0) {
      toast({ variant: "destructive", title: "No Departments Selected", description: "Please select departments to delete." });
      return;
    }
    setIsSubmitting(true);
    try {
      for (const id of selectedDepartmentIds) {
        await departmentService.deleteDepartment(id);
      }
      await fetchDepartmentsAndFaculty();
      toast({ title: "Departments Deleted", description: `${selectedDepartmentIds.length} department(s) have been successfully deleted.` });
      setSelectedDepartmentIds([]);
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete selected departments." });
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedDepartments.length > 0 && paginatedDepartments.every(dept => selectedDepartmentIds.includes(dept.id));
  const isSomeSelectedOnPage = paginatedDepartments.some(dept => selectedDepartmentIds.includes(dept.id)) && !isAllSelectedOnPage;


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
              <Building2 className="h-6 w-6" />
              Department Management
            </CardTitle>
            <CardDescription>
              Manage academic departments, their codes, HODs, and status.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Department
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>{currentDepartment?.id ? "Edit Department" : "Add New Department"}</DialogTitle>
                  <DialogDescription>
                    {currentDepartment?.id ? "Modify the details of this department." : "Create a new department record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="deptName">Department Name *</Label>
                    <Input id="deptName" value={formDeptName} onChange={(e) => setFormDeptName(e.target.value)} placeholder="e.g., Computer Engineering" disabled={isSubmitting} required />
                  </div>
                  <div>
                    <Label htmlFor="deptCode">Department Code *</Label>
                    <Input id="deptCode" value={formDeptCode} onChange={(e) => setFormDeptCode(e.target.value.toUpperCase())} placeholder="e.g., CE" disabled={isSubmitting} required />
                  </div>
                  <div>
                    <Label htmlFor="deptDescription">Description</Label>
                    <Textarea id="deptDescription" value={formDeptDescription} onChange={(e) => setFormDeptDescription(e.target.value)} placeholder="Brief description of the department" disabled={isSubmitting} rows={3} />
                  </div>
                  <div>
                    <Label htmlFor="deptHod">Head of Department (HOD)</Label>
                    <Select 
                      value={formHodId || NO_HOD_VALUE} 
                      onValueChange={(value) => setFormHodId(value === NO_HOD_VALUE ? undefined : value)} 
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="deptHod"><SelectValue placeholder="Select HOD (Optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_HOD_VALUE}>None</SelectItem>
                        {facultyUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.displayName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="deptEstablishmentYear">Establishment Year</Label>
                    <Input id="deptEstablishmentYear" type="number" value={formEstablishmentYear || ''} onChange={(e) => setFormEstablishmentYear(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 1984" disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="deptStatus">Status *</Label>
                    <Select value={formStatus} onValueChange={(value) => setFormStatus(value as 'active' | 'inactive')} disabled={isSubmitting} required>
                      <SelectTrigger id="deptStatus"><SelectValue /></SelectTrigger>
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
                      {currentDepartment?.id ? "Save Changes" : "Create Department"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportDepartments} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Departments from CSV</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportDepartment" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportDepartments} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                Import
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
                </Button>
                <p className="text-xs text-muted-foreground">
                  CSV format: id (optional), name, code, description, hodId, establishmentYear, status, instituteId.
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="searchDepartment">Search Departments</Label>
              <div className="relative">
                 <Input 
                    id="searchDepartment" 
                    placeholder="Search by name, code..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-8"
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterDeptStatus">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'active' | 'inactive' | 'all')}>
                <SelectTrigger id="filterDeptStatus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedDepartmentIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedDepartmentIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedDepartmentIds.length} department(s) selected.
                </span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[50px]">
                    <Checkbox 
                        checked={isAllSelectedOnPage || (paginatedDepartments.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)}
                        onCheckedChange={(checkedState) => handleSelectAll(!!checkedState)}
                        aria-label="Select all departments on this page"
                    />
                </TableHead>
                <SortableTableHeader field="name" label="Department Name" />
                <SortableTableHeader field="code" label="Code" />
                <TableHead>HOD</TableHead>
                <SortableTableHeader field="establishmentYear" label="Estd. Year" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDepartments.map((dept) => (
                <TableRow key={dept.id} data-state={selectedDepartmentIds.includes(dept.id) ? "selected" : undefined}>
                  <TableCell>
                      <Checkbox
                        checked={selectedDepartmentIds.includes(dept.id)}
                        onCheckedChange={(checked) => handleSelectDepartment(dept.id, !!checked)}
                        aria-labelledby={`dept-name-${dept.id}`}
                       />
                  </TableCell>
                  <TableCell id={`dept-name-${dept.id}`} className="font-medium">{dept.name}</TableCell>
                  <TableCell>{dept.code}</TableCell>
                  <TableCell>{facultyUsers.find(u => u.id === dept.hodId)?.displayName || '-'}</TableCell>
                  <TableCell>{dept.establishmentYear || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${dept.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                      {dept.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(dept)} disabled={isSubmitting}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Department</span>
                    </Button>
                    <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => handleDelete(dept.id)} 
                        disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Department</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedDepartments.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No departments found. Try adjusting your search or filters, or add a new department.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage -1) * itemsPerPage + 1, filteredDepartments.length)} to {Math.min(currentPage * itemsPerPage, filteredDepartments.length)} of {filteredDepartments.length} departments.
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
