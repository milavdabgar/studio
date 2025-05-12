// src/app/admin/project-fair/events/[eventId]/projects/page.tsx
"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, Briefcase, PlusCircle, Edit, Trash2, Search, Filter, Download, UploadCloud, FileSpreadsheet, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Project, ProjectEvent, Department, ProjectTeam, ProjectStatus, User as FacultyUser } from '@/types/entities';
import { projectService } from '@/lib/api/projects';
import { projectEventService } from '@/lib/api/projectEvents';
import { departmentService } from '@/lib/api/departments';
import ProjectForm from '@/components/admin/project-fair/ProjectForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown } from 'lucide-react';

type SortField = keyof Project | 'teamName' | 'departmentName' | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const PROJECT_STATUS_OPTIONS: ProjectStatus[] = ['draft', 'submitted', 'approved', 'rejected', 'completed', 'evaluated'];
const PROJECT_CATEGORIES = ["IoT & Smart Systems", "Software Development", "Hardware Project", "Sustainable Technology", "Industry Problem Solution", "Research & Innovation", "Other"];


export default function EventProjectsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<ProjectEvent | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<ProjectTeam[]>([]); // To get team names
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Filtering and Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const fetchEventData = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const [eventData, projectsData, deptData, teamData] = await Promise.all([
        projectEventService.getEventById(eventId),
        projectService.getAllProjects({ eventId }),
        departmentService.getAllDepartments(),
        projectService.getAllTeams({ eventId }) // Fetch all teams for the event
      ]);
      setEvent(eventData);
      setProjects(Array.isArray(projectsData) ? projectsData : projectsData.data?.projects || []);
      setDepartments(deptData);
      setTeams(Array.isArray(teamData) ? teamData : teamData.data?.teams || []);

    } catch (error) {
      console.error("Failed to load event projects data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load event projects data." });
    }
    setIsLoading(false);
  }, [eventId, toast]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  const handleProjectSaved = () => {
    fetchEventData(); // Refresh projects list
    setIsProjectFormOpen(false);
    setEditingProject(null);
  };

  const handleAddNewProject = () => {
    setEditingProject(null);
    setIsProjectFormOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectFormOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectService.deleteProject(projectId);
        toast({ title: "Project Deleted", description: "Successfully deleted project." });
        fetchEventData(); // Refresh
      } catch (error) {
        toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message });
      }
    }
  };
  
  const handleDeleteSelected = async () => {
    if (selectedProjectIds.length === 0) {
        toast({ variant: "destructive", title: "No Selection", description: "Please select projects to delete." });
        return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedProjectIds.length} selected project(s)?`)) {
        try {
            await Promise.all(selectedProjectIds.map(id => projectService.deleteProject(id)));
            toast({ title: "Projects Deleted", description: `${selectedProjectIds.length} projects deleted successfully.` });
            setSelectedProjectIds([]);
            fetchEventData(); // Refresh
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message });
        }
    }
  };


  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];
    if (searchTerm) {
      result = result.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterDepartment !== 'all') result = result.filter(p => p.department === filterDepartment);
    if (filterCategory !== 'all') result = result.filter(p => p.category === filterCategory);
    if (filterStatus !== 'all') result = result.filter(p => p.status === filterStatus);

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: unknown, valB: unknown;
        if (sortField === 'teamName') {
            valA = teams.find(t => t.id === a.teamId)?.name || '';
            valB = teams.find(t => t.id === b.teamId)?.name || '';
        } else if (sortField === 'departmentName') {
            valA = departments.find(d => d.id === a.department)?.name || '';
            valB = departments.find(d => d.id === b.department)?.name || '';
        } else {
            valA = a[sortField as keyof Project];
            valB = b[sortField as keyof Project];
        }
        if (typeof valA === 'string' && typeof valB === 'string') return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        if (typeof valA === 'number' && typeof valB === 'number') return sortDirection === 'asc' ? valA - valB : valB - valA;
        return 0;
      });
    }
    return result;
  }, [projects, searchTerm, filterDepartment, filterCategory, filterStatus, sortField, sortDirection, teams, departments]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedProjects, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedProjects.length / itemsPerPage);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterDepartment, filterCategory, filterStatus, itemsPerPage]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedProjectIds(checked === true ? paginatedProjects.map(p => p.id) : []);
  };
  const isAllSelectedOnPage = paginatedProjects.length > 0 && paginatedProjects.every(p => selectedProjectIds.includes(p.id));
  const isSomeSelectedOnPage = paginatedProjects.some(p => selectedProjectIds.includes(p.id)) && !isAllSelectedOnPage;

  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => { setSortField(field); setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">{label}{sortField === field && <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" />}{sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}</div>
    </TableHead>
  );


  if (isLoading && !event) { // Show loader only if event data is also not available
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!event) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground mb-4">Event not found.</p>
         <Button onClick={() => router.push(`/admin/project-fair/events`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push(`/admin/project-fair/events/${eventId}/dashboard`)} className="mb-4 print:hidden">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Dashboard
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                <Briefcase className="h-6 w-6" /> Projects for {event.name}
              </CardTitle>
              <CardDescription>Manage all projects registered for this event.</CardDescription>
            </div>
            <Button onClick={handleAddNewProject}><PlusCircle className="mr-2 h-4 w-4"/> Add New Project</Button>
          </div>
        </CardHeader>
        <CardContent>
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div><Label htmlFor="projectSearch">Search Projects</Label><Input id="projectSearch" placeholder="Title, ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                <div><Label htmlFor="projectDeptFilter">Department</Label><Select value={filterDepartment} onValueChange={setFilterDepartment}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Departments</SelectItem>{departments.map(d=><SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label htmlFor="projectCatFilter">Category</Label><Select value={filterCategory} onValueChange={setFilterCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{PROJECT_CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div><Label htmlFor="projectStatusFilter">Status</Label><Select value={filterStatus} onValueChange={s => setFilterStatus(s as ProjectStatus | 'all')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{PROJECT_STATUS_OPTIONS.map(s=><SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div>
            </div>
            
            {selectedProjectIds.length > 0 && (
                <div className="mb-4 flex items-center gap-2">
                    <Button variant="destructive" onClick={handleDeleteSelected}><Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedProjectIds.length})</Button>
                    <span className="text-sm text-muted-foreground">{selectedProjectIds.length} project(s) selected.</span>
                </div>
            )}

            {isLoading ? <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto my-4 text-primary" /></div> :
                paginatedProjects.length === 0 ? <p className="text-center text-muted-foreground py-8">No projects found for this event or matching your filters.</p> :
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-[50px]"><Checkbox checked={isAllSelectedOnPage || (paginatedProjects.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)} onCheckedChange={(val) => handleSelectAll(val as boolean | 'indeterminate')}/></TableHead>
                <SortableTableHeader field="id" label="Project ID" />
                <SortableTableHeader field="title" label="Title" />
                <SortableTableHeader field="category" label="Category" />
                <SortableTableHeader field="departmentName" label="Department" />
                <SortableTableHeader field="teamName" label="Team" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginatedProjects.map((project) => (
                  <TableRow key={project.id} data-state={selectedProjectIds.includes(project.id) ? "selected" : undefined}>
                    <TableCell><Checkbox checked={selectedProjectIds.includes(project.id)} onCheckedChange={(checked) => setSelectedProjectIds(prev => checked ? [...prev, project.id] : prev.filter(id => id !== project.id))}/></TableCell>
                    <TableCell>{project.id}</TableCell>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>{project.category}</TableCell>
                    <TableCell>{departments.find(d => d.id === project.department)?.name || 'N/A'}</TableCell>
                    <TableCell>{teams.find(t => t.id === project.teamId)?.name || 'N/A'}</TableCell>
                    <TableCell><span className={`px-2 py-0.5 text-xs rounded-full font-medium bg-${project.status === 'approved' ? 'green' : project.status === 'rejected' ? 'red' : project.status === 'submitted' ? 'blue' : 'yellow'}-100 text-${project.status === 'approved' ? 'green' : project.status === 'rejected' ? 'red' : project.status === 'submitted' ? 'blue' : 'yellow'}-700`}>{project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span></TableCell>
                    <TableCell className="text-right space-x-1"><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEditProject(project)}><Edit className="h-4 w-4" /></Button><Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDeleteProject(project.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            }
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">Showing {paginatedProjects.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedProjects.length): 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedProjects.length)} of {filteredAndSortedProjects.length} projects.</div>
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
      
      {/* Project Form Dialog */}
      <ProjectForm
        eventId={eventId}
        existingProject={editingProject}
        onProjectSaved={handleProjectSaved}
        onCancel={() => { setIsProjectFormOpen(false); setEditingProject(null); }}
        isOpen={isProjectFormOpen}
        setIsOpen={setIsProjectFormOpen}
      />
    </div>
  );
}
