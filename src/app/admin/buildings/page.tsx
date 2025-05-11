
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
import { PlusCircle, Edit, Trash2, Building, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import type { Building as BuildingType, Institute } from '@/types/entities'; // Renamed Building to BuildingType
import { buildingService } from '@/lib/services/buildingService';
import { instituteService } from '@/lib/api/institutes';

type BuildingStatus = 'active' | 'inactive' | 'under_maintenance' | 'demolished';
const BUILDING_STATUS_OPTIONS: { value: BuildingStatus, label: string }[] = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "under_maintenance", label: "Under Maintenance" },
    { value: "demolished", label: "Demolished" },
];


type SortField = keyof BuildingType | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

export default function BuildingManagementPage() {
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentBuilding, setCurrentBuilding] = useState<Partial<BuildingType> | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formInstituteId, setFormInstituteId] = useState<string>('');
  const [formStatus, setFormStatus] = useState<BuildingStatus>('active');
  const [formConstructionYear, setFormConstructionYear] = useState<number | undefined>(undefined);
  const [formNumberOfFloors, setFormNumberOfFloors] = useState<number | undefined>(undefined);
  const [formTotalAreaSqFt, setFormTotalAreaSqFt] = useState<number | undefined>(undefined);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatusVal, setFilterStatusVal] = useState<BuildingStatus | 'all'>('all');
  const [filterInstituteVal, setFilterInstituteVal] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  const fetchBuildingsAndInstitutes = async () => {
    setIsLoading(true);
    try {
      const [buildingData, instituteData] = await Promise.all([
        buildingService.getAllBuildings(),
        instituteService.getAllInstitutes()
      ]);
      setBuildings(buildingData);
      setInstitutes(instituteData);
      if (instituteData.length > 0 && !formInstituteId) {
        setFormInstituteId(instituteData[0].id);
      }
    } catch (error) {
      console.error("Failed to load data", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load buildings or institutes data." });
    }
    setIsLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchBuildingsAndInstitutes();
  }, []);


  const resetForm = () => {
    setFormName(''); setFormCode(''); setFormDescription('');
    setFormInstituteId(institutes.length > 0 ? institutes[0].id : ''); 
    setFormStatus('active'); setFormConstructionYear(undefined);
    setFormNumberOfFloors(undefined); setFormTotalAreaSqFt(undefined);
    setCurrentBuilding(null);
  };

  const handleEdit = (building: BuildingType) => {
    setCurrentBuilding(building);
    setFormName(building.name);
    setFormCode(building.code || '');
    setFormDescription(building.description || '');
    setFormInstituteId(building.instituteId);
    setFormStatus(building.status);
    setFormConstructionYear(building.constructionYear || undefined);
    setFormNumberOfFloors(building.numberOfFloors || undefined);
    setFormTotalAreaSqFt(building.totalAreaSqFt || undefined);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    if (institutes.length === 0) {
      toast({ variant: "destructive", title: "Cannot Add Building", description: "No institutes available. Please create an institute first." });
      return;
    }
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (buildingId: string) => {
    setIsSubmitting(true);
    try {
      await buildingService.deleteBuilding(buildingId);
      await fetchBuildingsAndInstitutes();
      setSelectedBuildingIds(prev => prev.filter(id => id !== buildingId));
      toast({ title: "Building Deleted", description: "The building has been successfully deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete building." });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formName.trim() || !formInstituteId) {
      toast({ variant: "destructive", title: "Validation Error", description: "Building Name and Institute are required."});
      return;
    }
    const numericFields = {formConstructionYear, formNumberOfFloors, formTotalAreaSqFt};
    for (const [key, value] of Object.entries(numericFields)) {
        if (value !== undefined && (isNaN(value) || value < 0)) {
            toast({ variant: "destructive", title: "Validation Error", description: `${key.replace('form','')} must be a non-negative number.` });
            return;
        }
    }

    setIsSubmitting(true);
    
    const buildingData: Omit<BuildingType, 'id'> = { 
      name: formName.trim(), code: formCode.trim() || undefined,
      description: formDescription.trim() || undefined,
      instituteId: formInstituteId,
      status: formStatus,
      constructionYear: formConstructionYear ? Number(formConstructionYear) : undefined,
      numberOfFloors: formNumberOfFloors ? Number(formNumberOfFloors) : undefined,
      totalAreaSqFt: formTotalAreaSqFt ? Number(formTotalAreaSqFt) : undefined,
    };

    try {
      if (currentBuilding && currentBuilding.id) {
        await buildingService.updateBuilding(currentBuilding.id, buildingData);
        toast({ title: "Building Updated", description: "The building has been successfully updated." });
      } else {
        await buildingService.createBuilding(buildingData);
        toast({ title: "Building Created", description: "The new building has been successfully created." });
      }
      await fetchBuildingsAndInstitutes();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message || "Could not save building." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
  };

  const handleImportBuildings = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
     if (institutes.length === 0) {
      toast({ variant: "destructive", title: "Import Error", description: "No institutes loaded. Cannot map institute IDs." });
      return;
    }

    setIsSubmitting(true);
    try {
        const result = await buildingService.importBuildings(selectedFile, institutes);
        await fetchBuildingsAndInstitutes();
        toast({ title: "Import Successful", description: `${result.newCount} buildings added, ${result.updatedCount} updated. Skipped: ${result.skippedCount}`});
    } catch (error: unknown) {
      console.error("Error processing CSV file:", error);
      toast({ variant: "destructive", title: "Import Failed", description: error instanceof Error ? error.message : "Could not process the CSV file." });
    } finally {
        setIsSubmitting(false); setSelectedFile(null); 
        const fileInput = document.getElementById('csvImportBuilding') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }
  };

  const handleExportBuildings = () => {
    if (filteredAndSortedBuildings.length === 0) {
      toast({ title: "Export Canceled", description: "No buildings to export (check filters)." });
      return;
    }
    const header = ['id', 'name', 'code', 'description', 'instituteId', 'instituteName', 'instituteCode', 'status', 'constructionYear', 'numberOfFloors', 'totalAreaSqFt'];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedBuildings.map(b => {
        const inst = institutes.find(i => i.id === b.instituteId);
        return [
          b.id, `"${b.name.replace(/"/g, '""')}"`, b.code || "", 
          `"${(b.description || "").replace(/"/g, '""')}"`,
          b.instituteId, 
          `"${(inst?.name || "").replace(/"/g, '""')}"`,
          `"${(inst?.code || "").replace(/"/g, '""')}"`,
          b.status, b.constructionYear || "", 
          b.numberOfFloors || "", b.totalAreaSqFt || ""
        ].join(',')
      })
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "buildings_export.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Buildings exported to buildings_export.csv" });
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,name,code,description,instituteId,instituteName,instituteCode,status,constructionYear,numberOfFloors,totalAreaSqFt
bldg_sample_1,Science Block,SCI,"Labs for Physics and Chemistry",inst1,"Government Polytechnic Palanpur","GPP",active,2005,2,20000
,Library Building,LIB,,inst1,"Government Polytechnic Palanpur","GPP",inactive,1980,1,15000
`; 
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_buildings_import.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_buildings_import.csv downloaded." });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field); setSortDirection('asc');
    }
    setCurrentPage(1); 
  };
  
  const filteredAndSortedBuildings = useMemo(() => {
    let result = [...buildings];

    if (searchTerm) {
      result = result.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.code && b.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.description && b.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterStatusVal !== 'all') {
      result = result.filter(b => b.status === filterStatusVal);
    }
    if (filterInstituteVal !== 'all') {
      result = result.filter(b => b.instituteId === filterInstituteVal);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA = a[sortField as keyof BuildingType] as string | number | Date | undefined;
        let valB = b[sortField as keyof BuildingType] as string | number | Date | undefined;
        
        const numericFields: (keyof BuildingType)[] = ['constructionYear', 'numberOfFloors', 'totalAreaSqFt'];
        if (numericFields.includes(sortField as keyof BuildingType)) {
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
  }, [buildings, searchTerm, filterStatusVal, filterInstituteVal, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedBuildings.length / itemsPerPage);
  const paginatedBuildings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedBuildings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedBuildings, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterStatusVal, filterInstituteVal, itemsPerPage]);


  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedBuildingIds(checked === true ? paginatedBuildings.map(b => b.id) : []);
  };

  const handleSelectBuilding = (buildingId: string, checked: boolean) => {
    setSelectedBuildingIds(prev => checked ? [...prev, buildingId] : prev.filter(id => id !== buildingId));
  };

  const handleDeleteSelected = async () => {
    if (selectedBuildingIds.length === 0) {
      toast({ variant: "destructive", title: "No Buildings Selected", description: "Please select buildings to delete." });
      return;
    }
    setIsSubmitting(true);
    try {
        for(const id of selectedBuildingIds) {
            await buildingService.deleteBuilding(id);
        }
        await fetchBuildingsAndInstitutes();
        toast({ title: "Buildings Deleted", description: `${selectedBuildingIds.length} building(s) have been successfully deleted.` });
        setSelectedBuildingIds([]);
    } catch (error) {
        toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete selected buildings."});
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedBuildings.length > 0 && paginatedBuildings.every(b => selectedBuildingIds.includes(b.id));
  const isSomeSelectedOnPage = paginatedBuildings.some(b => selectedBuildingIds.includes(b.id)) && !isAllSelectedOnPage;

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
              <Building className="h-6 w-6" />
              Building Management
            </CardTitle>
            <CardDescription>
              Manage institute buildings, their codes, status, and other details.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto" disabled={institutes.length === 0}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Building
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{currentBuilding?.id ? "Edit Building" : "Add New Building"}</DialogTitle>
                  <DialogDescription>
                    {currentBuilding?.id ? "Modify building details." : "Create a new building record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="md:col-span-1"><Label htmlFor="name">Building Name *</Label><Input id="name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., Main Block" disabled={isSubmitting} required /></div>
                  <div className="md:col-span-1"><Label htmlFor="code">Building Code</Label><Input id="code" value={formCode} onChange={e => setFormCode(e.target.value.toUpperCase())} placeholder="e.g., MB" disabled={isSubmitting} /></div>
                  
                  <div className="md:col-span-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Brief description or purpose of the building" disabled={isSubmitting} rows={2}/></div>
                  
                  <div className="md:col-span-1">
                    <Label htmlFor="instituteId">Institute *</Label>
                    <Select value={formInstituteId} onValueChange={setFormInstituteId} disabled={isSubmitting || institutes.length === 0} required>
                      <SelectTrigger id="instituteId"><SelectValue placeholder="Select Institute" /></SelectTrigger>
                      <SelectContent>{institutes.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.code})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-1">
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formStatus} onValueChange={(value) => setFormStatus(value as BuildingStatus)} disabled={isSubmitting} required>
                      <SelectTrigger id="status"><SelectValue placeholder="Select Status"/></SelectTrigger>
                      <SelectContent>{BUILDING_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-1"><Label htmlFor="constructionYear">Construction Year</Label><Input id="constructionYear" type="number" value={formConstructionYear || ''} onChange={e => setFormConstructionYear(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 1995" disabled={isSubmitting} /></div>
                  <div className="md:col-span-1"><Label htmlFor="numberOfFloors">Number of Floors</Label><Input id="numberOfFloors" type="number" value={formNumberOfFloors || ''} onChange={e => setFormNumberOfFloors(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 3" disabled={isSubmitting} /></div>
                  <div className="md:col-span-1"><Label htmlFor="totalAreaSqFt">Total Area (sq. ft.)</Label><Input id="totalAreaSqFt" type="number" value={formTotalAreaSqFt || ''} onChange={e => setFormTotalAreaSqFt(e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="e.g., 25000.50" disabled={isSubmitting} /></div>
                  
                  <DialogFooter className="md:col-span-2 mt-4">
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{currentBuilding?.id ? "Save Changes" : "Create Building"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportBuildings} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Buildings from CSV</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportBuilding" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportBuildings} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>} Import
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
                </Button>
                <p className="text-xs text-muted-foreground">
                  CSV fields: id (optional), name, code, description, instituteId OR (instituteName and instituteCode), status, constructionYear, numberOfFloors, totalAreaSqFt.
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="searchBuilding">Search Buildings</Label>
              <div className="relative">
                 <Input id="searchBuilding" placeholder="Name, code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-8"/>
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
             <div>
              <Label htmlFor="filterStatus">Filter by Status</Label>
              <Select value={filterStatusVal} onValueChange={(value) => setFilterStatusVal(value as BuildingStatus | 'all')}>
                <SelectTrigger id="filterStatus"><SelectValue placeholder="All Statuses"/></SelectTrigger>
                <SelectContent>{[{value: 'all', label: 'All Statuses'}, ...BUILDING_STATUS_OPTIONS].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
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
          </div>

          {selectedBuildingIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedBuildingIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedBuildingIds.length} building(s) selected.
                </span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[50px]"><Checkbox checked={isAllSelectedOnPage || (paginatedBuildings.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)} onCheckedChange={(checkedState) => handleSelectAll(!!checkedState)} aria-label="Select all buildings on this page"/></TableHead>
                <SortableTableHeader field="name" label="Building Name" />
                <SortableTableHeader field="code" label="Code" />
                <TableHead>Institute</TableHead>
                <SortableTableHeader field="constructionYear" label="Built Year" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBuildings.map((building) => (
                <TableRow key={building.id} data-state={selectedBuildingIds.includes(building.id) ? "selected" : undefined}>
                  <TableCell><Checkbox checked={selectedBuildingIds.includes(building.id)} onCheckedChange={(checked) => handleSelectBuilding(building.id, !!checked)} aria-labelledby={`building-name-${building.id}`}/></TableCell>
                  <TableCell id={`building-name-${building.id}`} className="font-medium">{building.name}</TableCell>
                  <TableCell>{building.code || '-'}</TableCell>
                  <TableCell>{institutes.find(i => i.id === building.instituteId)?.name || 'N/A'}</TableCell>
                  <TableCell>{building.constructionYear || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        building.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : building.status === 'inactive' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' /* under_maintenance */
                    }`}>
                      {BUILDING_STATUS_OPTIONS.find(s => s.value === building.status)?.label || building.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(building)} disabled={isSubmitting}><Edit className="h-4 w-4" /><span className="sr-only">Edit Building</span></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(building.id)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /><span className="sr-only">Delete Building</span></Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedBuildings.length === 0 && (
                 <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No buildings found. Adjust filters or add a new building.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedBuildings.length)} to {Math.min(currentPage * itemsPerPage, filteredAndSortedBuildings.length)} of {filteredAndSortedBuildings.length} buildings.
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

