// src/app/admin/project-fair/events/[eventId]/locations/page.tsx
"use client";

import React, { useEffect, useState, useMemo, useCallback, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, MapPin, PlusCircle, Edit, Trash2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectLocation, ProjectEvent, Department, Project } from '@/types/entities';
import { projectLocationService } from '@/lib/api/projectLocations'; 
import { projectEventService } from '@/lib/api/projectEvents';
import { departmentService } from '@/lib/api/departments';
import { projectService } from '@/lib/api/projects';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown } from 'lucide-react';

type SortField = keyof ProjectLocation | 'projectName' | 'departmentName' | 'none';
type SortDirection = 'asc' | 'desc';
const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function EventLocationsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<ProjectEvent | null>(null);
  const [locations, setLocations] = useState<ProjectLocation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]); // For assigning projects
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ProjectLocation | null>(null);
  
  // Form state
  const [formLocationId, setFormLocationId] = useState('');
  const [formSection, setFormSection] = useState('');
  const [formPosition, setFormPosition] = useState<number | undefined>(undefined);
  const [formDepartmentId, setFormDepartmentId] = useState<string | undefined>(undefined);
  const [formProjectId, setFormProjectId] = useState<string | undefined>(undefined);

  // Filtering & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterAssigned, setFilterAssigned] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [sortField, setSortField] = useState<SortField>('locationId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);

  const fetchPageData = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const [eventData, locationsDataResponse, deptData, projectsDataResponse] = await Promise.all([
        projectEventService.getEventById(eventId),
        projectLocationService.getAllLocations({ eventId }),
        departmentService.getAllDepartments(),
        projectService.getAllProjects({ eventId }), // Fetch projects for this event
      ]);
      setEvent(eventData);
      setLocations((locationsDataResponse as any)?.locations || []);
      setDepartments(deptData);
      setProjects(Array.isArray(projectsDataResponse) ? projectsDataResponse : ((projectsDataResponse as any)?.data?.projects || []));
    } catch (_error) {
      toast({ variant: "destructive", title: "Error", description: "Could not load event locations data." });
    }
    setIsLoading(false);
  }, [eventId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const resetForm = () => {
    setFormLocationId(''); setFormSection(''); setFormPosition(undefined);
    setFormDepartmentId(undefined); setFormProjectId(undefined);
    setEditingLocation(null);
  };

  const handleAddNewLocation = () => {
    resetForm();
    setIsFormOpen(true);
  };
  
  const handleEditLocation = (location: ProjectLocation) => {
    setEditingLocation(location);
    setFormLocationId(location.locationId);
    setFormSection(location.section);
    setFormPosition(location.position);
    setFormDepartmentId(location.department || undefined);
    setFormProjectId(location.projectId || undefined);
    setIsFormOpen(true);
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await projectLocationService.deleteLocation(locationId);
        toast({ title: "Location Deleted" });
        fetchPageData();
      } catch (error) {
        toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message });
      }
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formLocationId.trim() || !formSection.trim() || formPosition === undefined) {
      toast({ variant: "destructive", title: "Validation Error", description: "Location ID, Section, and Position are required." });
      return;
    }
    setIsSubmitting(true);
    const locationData: Omit<ProjectLocation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
      locationId: formLocationId.trim(),
      section: formSection.trim().toUpperCase(),
      position: Number(formPosition),
      department: formDepartmentId,
      eventId,
      isAssigned: !!formProjectId,
      projectId: formProjectId || undefined,
    };
    try {
      if (editingLocation?.id) {
        await projectLocationService.updateLocation(editingLocation.id, locationData);
      } else {
        await projectLocationService.createLocation(locationData);
      }
      toast({ title: `Location ${editingLocation ? 'Updated' : 'Created'}` });
      fetchPageData();
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: `Save Failed`, description: (error as Error).message });
    }
    setIsSubmitting(false);
  };

  const handleAutoAssign = async () => {
    if(!eventId) return;
    setIsSubmitting(true);
    try {
      const result = await projectLocationService.autoAssignLocations(eventId, true); // Assuming department-wise
      toast({ title: "Auto-Assignment Complete", description: `${result.assignedCount} projects assigned.`});
      fetchPageData(); // Refresh data
    } catch (error) {
      toast({ variant: "destructive", title: "Auto-Assignment Failed", description: (error as Error).message });
    }
    setIsSubmitting(false);
  };
  
  const filteredAndSortedLocations = useMemo(() => {
    let result = [...locations];
    if (searchTerm) result = result.filter(loc => loc.locationId.toLowerCase().includes(searchTerm.toLowerCase()) || (loc.projectId && projects.find(p=>p.id === loc.projectId)?.title.toLowerCase().includes(searchTerm.toLowerCase())));
    if (filterSection !== 'all') result = result.filter(loc => loc.section === filterSection);
    if (filterDepartment !== 'all') result = result.filter(loc => loc.department === filterDepartment);
    if (filterAssigned !== 'all') result = result.filter(loc => loc.isAssigned === (filterAssigned === 'assigned'));

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: any = a[sortField as keyof ProjectLocation];
        let valB: any = b[sortField as keyof ProjectLocation];
        if (sortField === 'projectName') {
            valA = projects.find(p => p.id === a.projectId)?.title || '';
            valB = projects.find(p => p.id === b.projectId)?.title || '';
        } else if (sortField === 'departmentName') {
            valA = departments.find(d => d.id === a.department)?.name || '';
            valB = departments.find(d => d.id === b.department)?.name || '';
        }
        
        if (valA === undefined || valA === null) return sortDirection === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null) return sortDirection === 'asc' ? -1 : 1;
        
        if (typeof valA === 'string' && typeof valB === 'string') return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        if (typeof valA === 'number' && typeof valB === 'number') return sortDirection === 'asc' ? valA - valB : valB - valA;
        if (typeof valA === 'boolean' && typeof valB === 'boolean') return sortDirection === 'asc' ? (valA === valB ? 0 : valA ? -1 : 1) : (valA === valB ? 0 : valA ? 1 : -1) ;
        return 0;
      });
    }
    return result;
  }, [locations, searchTerm, filterSection, filterDepartment, filterAssigned, sortField, sortDirection, projects, departments]);

  const paginatedLocations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedLocations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedLocations, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(filteredAndSortedLocations.length / itemsPerPage);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterSection, filterDepartment, filterAssigned, itemsPerPage]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => setSelectedLocationIds(checked === true ? paginatedLocations.map(p => p.id) : []);
  const isAllSelectedOnPage = paginatedLocations.length > 0 && paginatedLocations.every(p => selectedLocationIds.includes(p.id));
  const isSomeSelectedOnPage = paginatedLocations.some(p => selectedLocationIds.includes(p.id)) && !isAllSelectedOnPage;
  
  const handleDeleteSelected = async () => { /* Placeholder */ };


  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => { setSortField(field); setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">{label}{sortField === field && <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" />}{sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}</div>
    </TableHead>
  );


  if (isLoading && !event) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!event) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground mb-4">Event not found.</p>
         <Button onClick={() => router.push(`/admin/project-fair/events/${eventId}/dashboard`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push(`/admin/project-fair/events/${eventId}/dashboard`)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Dashboard
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                        <MapPin className="h-6 w-6" /> Locations for {event.name}
                    </CardTitle>
                    <CardDescription>Define sections, positions, and assign projects to specific stalls.</CardDescription>
                </div>
                 <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button onClick={handleAddNewLocation}><PlusCircle className="mr-2 h-4 w-4"/> Add Location</Button>
                    <Button onClick={handleAutoAssign} variant="outline" disabled={isSubmitting || projects.filter(p => !p.locationId && p.status === 'approved').length === 0 || locations.filter(loc => !loc.isAssigned).length === 0}>
                        <RefreshCw className="mr-2 h-4 w-4"/> Auto-Assign
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
             <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg dark:border-gray-700">
                <div><Label htmlFor="locSearch">Search Location/Project</Label><Input id="locSearch" placeholder="ID, Title..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                <div><Label htmlFor="locSectionFilter">Section</Label><Select value={filterSection} onValueChange={setFilterSection}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Sections</SelectItem>{Array.from(new Set(locations.map(l => l.section))).map(s=><SelectItem key={s} value={s}>Section {s}</SelectItem>)}</SelectContent></Select></div>
                <div><Label htmlFor="locDeptFilter">Department</Label><Select value={filterDepartment} onValueChange={setFilterDepartment}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Departments</SelectItem>{departments.map(d=><SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label htmlFor="locAssignedFilter">Assignment Status</Label><Select value={filterAssigned} onValueChange={s => setFilterAssigned(s as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="assigned">Assigned</SelectItem><SelectItem value="unassigned">Unassigned</SelectItem></SelectContent></Select></div>
            </div>
            {selectedLocationIds.length > 0 && (
                <div className="mb-4 flex items-center gap-2">
                    <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}><Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedLocationIds.length})</Button>
                    <span className="text-sm text-muted-foreground">{selectedLocationIds.length} location(s) selected.</span>
                </div>
            )}

            {isLoading ? <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto my-4 text-primary" /></div> :
                paginatedLocations.length === 0 ? <p className="text-center text-muted-foreground py-8">No locations found for this event or matching your filters.</p> :
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-[50px]"><Checkbox checked={isAllSelectedOnPage || (paginatedLocations.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)} onCheckedChange={(val) => handleSelectAll(val as boolean | 'indeterminate')}/></TableHead>
                <SortableTableHeader field="locationId" label="Location ID" />
                <SortableTableHeader field="section" label="Section" />
                <SortableTableHeader field="position" label="Position" />
                <SortableTableHeader field="departmentName" label="Department" />
                <SortableTableHeader field="projectName" label="Assigned Project" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginatedLocations.map((loc) => {
                    const project = loc.projectId ? projects.find(p => p.id === loc.projectId) : null;
                    const department = loc.department ? departments.find(d => d.id === loc.department) : null;
                    return (
                        <TableRow key={loc.id} data-state={selectedLocationIds.includes(loc.id) ? "selected" : undefined}>
                            <TableCell><Checkbox checked={selectedLocationIds.includes(loc.id)} onCheckedChange={(checked) => setSelectedLocationIds(prev => checked ? [...prev, loc.id] : prev.filter(id => id !== loc.id))}/></TableCell>
                            <TableCell className="font-medium">{loc.locationId}</TableCell>
                            <TableCell>{loc.section}</TableCell>
                            <TableCell>{loc.position}</TableCell>
                            <TableCell>{department?.name || 'N/A'}</TableCell>
                            <TableCell>{project ? project.title : <span className="text-muted-foreground italic">Unassigned</span>}</TableCell>
                            <TableCell className="text-right space-x-1"><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEditLocation(loc)}><Edit className="h-4 w-4" /></Button><Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDeleteLocation(loc.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                    );
                })}
              </TableBody>
            </Table>
            }
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t dark:border-gray-700">
            <div className="text-sm text-muted-foreground">Showing {paginatedLocations.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedLocations.length): 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedLocations.length)} of {filteredAndSortedLocations.length} locations.</div>
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
      
      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingLocation ? "Edit Location" : "Add New Location"}</DialogTitle></DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            <div><Label htmlFor="formLocId">Location ID *</Label><Input id="formLocId" value={formLocationId} onChange={e => setFormLocationId(e.target.value.toUpperCase())} placeholder="e.g., A-01" required /></div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="formSection">Section *</Label><Input id="formSection" value={formSection} onChange={e => setFormSection(e.target.value.toUpperCase())} placeholder="e.g., A" required/></div>
                <div><Label htmlFor="formPosition">Position *</Label><Input id="formPosition" type="number" value={formPosition === undefined ? '' : formPosition} onChange={e => setFormPosition(e.target.value ? parseInt(e.target.value) : undefined)} min="1" required/></div>
            </div>
            <div><Label htmlFor="formDept">Department (Optional)</Label><Select value={formDepartmentId || ''} onValueChange={val => setFormDepartmentId(val === '' ? undefined : val)}><SelectTrigger><SelectValue placeholder="Assign to Department"/></SelectTrigger><SelectContent>{departments.map(d=><SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>)}</SelectContent></Select></div>
             <div><Label htmlFor="formProject">Assign Project (Optional)</Label><Select value={formProjectId || ''} onValueChange={val => setFormProjectId(val === '' ? undefined : val)}><SelectTrigger><SelectValue placeholder="Assign to Project"/></SelectTrigger><SelectContent>{projects.filter(p => !p.locationId || (editingLocation && p.locationId === editingLocation.locationId)).map(p=><SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingLocation ? "Save Changes" : "Create Location"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
