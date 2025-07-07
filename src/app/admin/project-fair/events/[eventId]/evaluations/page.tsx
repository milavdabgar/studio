
// src/app/admin/project-fair/events/[eventId]/evaluations/page.tsx
"use client";

import React, { useEffect, useState, useMemo, useCallback, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, Award, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectEvent, Project, Department, ProjectTeam, SystemUser, ProjectEvaluation } from '@/types/entities';
import { projectEventService } from '@/lib/api/projectEvents';
import { projectService } from '@/lib/api/projects';
import { departmentService } from '@/lib/api/departments';
import { projectTeamService } from '@/lib/api/projectTeams';
import { userService } from '@/lib/api/users';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type SortField = keyof Project | 'teamName' | 'departmentName' | 'deptEvalStatus' | 'centralEvalStatus' | 'none';
type SortDirection = 'asc' | 'desc';
const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
type EvaluationStatusFilter = 'all' | 'pending' | 'completed' | 'assigned' | 'unassigned';

export default function EventEvaluationsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<ProjectEvent | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<ProjectTeam[]>([]);
  const [juryMembers, setJuryMembers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [isAssignJuryDialogOpen, setIsAssignJuryDialogOpen] = useState(false);
  const [selectedProjectForJury, setSelectedProjectForJury] = useState<Project | null>(null);
  const [formDeptJuryId, setFormDeptJuryId] = useState<string | undefined>(undefined);
  const [formCentralJuryId, setFormCentralJuryId] = useState<string | undefined>(undefined);
  const [isSubmittingJury, setIsSubmittingJury] = useState(false);

  // Filtering & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterDeptEvalStatus, setFilterDeptEvalStatus] = useState<EvaluationStatusFilter>('all');
  const [filterCentralEvalStatus, setFilterCentralEvalStatus] = useState<EvaluationStatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const fetchPageData = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const [eventData, projectsDataResponse, deptData, teamDataResponse, usersData] = await Promise.all([
        projectEventService.getEventById(eventId),
        projectService.getAllProjects({ eventId }),
        departmentService.getAllDepartments(),
        projectTeamService.getAllTeams({ eventId }),
        userService.getAllUsers(),
      ]);
      setEvent(eventData);
      setProjects(Array.isArray(projectsDataResponse) ? projectsDataResponse : ((projectsDataResponse as Record<string, unknown>)?.data as Record<string, unknown>)?.projects as Project[] || []);
      setDepartments(deptData);
      setTeams(Array.isArray(teamDataResponse) ? teamDataResponse : ((teamDataResponse as Record<string, unknown>)?.data as Record<string, unknown>)?.teams as ProjectTeam[] || []);
      setJuryMembers(usersData.filter(u => u.roles.some(r => ['jury', 'faculty', 'hod', 'admin', 'super_admin'].includes(r))));
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load event evaluations data." });
    }
    setIsLoading(false);
  }, [eventId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleOpenAssignJuryDialog = (project: Project) => {
    setSelectedProjectForJury(project);
    setFormDeptJuryId(project.deptEvaluation?.juryId || undefined);
    setFormCentralJuryId(project.centralEvaluation?.juryId || undefined);
    setIsAssignJuryDialogOpen(true);
  };

  const handleAssignJurySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForJury) return;
    setIsSubmittingJury(true);
    try {
      const currentProjectData = projects.find(p => p.id === selectedProjectForJury.id);
      if (!currentProjectData) throw new Error("Project data not found for update.");

      const updatePayload: Partial<Project> = {
        deptEvaluation: {
            ...(currentProjectData.deptEvaluation || { completed: false }), // Preserve existing score/feedback if any
            juryId: formDeptJuryId === "" ? undefined : formDeptJuryId,
        },
        centralEvaluation: {
            ...(currentProjectData.centralEvaluation || { completed: false }), // Preserve existing score/feedback if any
            juryId: formCentralJuryId === "" ? undefined : formCentralJuryId,
        },
      };
      
      await projectService.updateProject(selectedProjectForJury.id, updatePayload);
      toast({ title: "Jury Assigned", description: `Jury members updated for project "${selectedProjectForJury.title}".` });
      fetchPageData(); // Refresh project list
      setIsAssignJuryDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Assignment Failed", description: (error as Error).message });
    }
    setIsSubmittingJury(false);
  };

  const getEvaluationStatus = useCallback((evaluation: ProjectEvaluation | undefined): { text: string; color: string; juryName?: string, score?: number } => {
    if (!evaluation) return { text: "Not Started", color: "text-gray-500" };
    const jury = evaluation.juryId ? juryMembers.find(j => j.id === evaluation.juryId) : null;
    if (evaluation.completed) {
      return { text: "Completed", color: "text-green-600", juryName: jury?.displayName, score: evaluation.score };
    }
    if (evaluation.juryId) {
      return { text: "Assigned", color: "text-blue-600", juryName: jury?.displayName };
    }
    return { text: "Pending Assignment", color: "text-yellow-600" };
  }, [juryMembers]);

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];
    if (searchTerm) result = result.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterDepartment !== 'all') result = result.filter(p => p.department === filterDepartment);
    
    const filterByEvalStatus = (project: Project, type: 'dept' | 'central', statusFilter: EvaluationStatusFilter) => {
        const evaluation = type === 'dept' ? project.deptEvaluation : project.centralEvaluation;
        if (statusFilter === 'all') return true;
        if (statusFilter === 'pending') return !evaluation?.completed && !!evaluation?.juryId;
        if (statusFilter === 'completed') return !!evaluation?.completed;
        if (statusFilter === 'assigned') return !!evaluation?.juryId;
        if (statusFilter === 'unassigned') return !evaluation?.juryId;
        return true;
    };

    if (filterDeptEvalStatus !== 'all') result = result.filter(p => filterByEvalStatus(p, 'dept', filterDeptEvalStatus));
    if (filterCentralEvalStatus !== 'all') result = result.filter(p => filterByEvalStatus(p, 'central', filterCentralEvalStatus));


    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: any, valB: any;
        // Populate valA and valB based on sortField
        if (sortField === 'teamName') { valA = teams.find(t => t.id === a.teamId)?.name || ''; valB = teams.find(t => t.id === b.teamId)?.name || ''; }
        else if (sortField === 'departmentName') { valA = departments.find(d => d.id === a.department)?.name || ''; valB = departments.find(d => d.id === b.department)?.name || ''; }
        else if (sortField === 'deptEvalStatus') { valA = getEvaluationStatus(a.deptEvaluation).text; valB = getEvaluationStatus(b.deptEvaluation).text; }
        else if (sortField === 'centralEvalStatus') { valA = getEvaluationStatus(a.centralEvaluation).text; valB = getEvaluationStatus(b.centralEvaluation).text; }
        else { valA = a[sortField as keyof Project]; valB = b[sortField as keyof Project]; }

        if (valA === undefined || valA === null) return sortDirection === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null) return sortDirection === 'asc' ? -1 : 1;
        if (typeof valA === 'string' && typeof valB === 'string') return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        if (typeof valA === 'number' && typeof valB === 'number') return sortDirection === 'asc' ? valA - valB : valB - valA;
        return 0;
      });
    }
    return result;
  }, [projects, searchTerm, filterDepartment, filterDeptEvalStatus, filterCentralEvalStatus, sortField, sortDirection, teams, departments, getEvaluationStatus]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedProjects, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(filteredAndSortedProjects.length / itemsPerPage);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterDepartment, filterDeptEvalStatus, filterCentralEvalStatus, itemsPerPage]);

  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => { setSortField(field); setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">{label}{sortField === field && <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" />}{sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}</div>
    </TableHead>
  );

  if (isLoading && !event) { 
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  if (!event) {
    return (<div className="text-center py-10"><p className="text-xl text-muted-foreground mb-4">Event not found.</p><Button onClick={() => router.push(`/admin/project-fair/events`)}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Events List</Button></div>);
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push(`/admin/project-fair/events/${eventId}/dashboard`)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Dashboard
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                <Award className="h-6 w-6" /> Jury Assignments & Evaluations for {event.name}
            </CardTitle>
            <CardDescription>Assign jury members to projects and monitor evaluation progress.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg dark:border-gray-700">
                <div><Label htmlFor="evalSearch">Search Projects</Label><Input id="evalSearch" placeholder="Title, ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                <div><Label htmlFor="evalDeptFilter">Department</Label><Select value={filterDepartment} onValueChange={setFilterDepartment}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Departments</SelectItem>{departments.map(d=><SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label htmlFor="evalDeptStatusFilter">Dept. Eval Status</Label><Select value={filterDeptEvalStatus} onValueChange={s => setFilterDeptEvalStatus(s as EvaluationStatusFilter)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="assigned">Assigned</SelectItem><SelectItem value="unassigned">Unassigned</SelectItem></SelectContent></Select></div>
                <div><Label htmlFor="evalCentralStatusFilter">Central Eval Status</Label><Select value={filterCentralEvalStatus} onValueChange={s => setFilterCentralEvalStatus(s as EvaluationStatusFilter)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="assigned">Assigned</SelectItem><SelectItem value="unassigned">Unassigned</SelectItem></SelectContent></Select></div>
            </div>
            
            {isLoading ? <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto my-4 text-primary" /></div> :
                paginatedProjects.length === 0 ? <p className="text-center text-muted-foreground py-8">No projects found for this event or matching filters.</p> :
            <Table>
              <TableHeader><TableRow>
                <SortableTableHeader field="title" label="Project Title" />
                <SortableTableHeader field="departmentName" label="Department" />
                <SortableTableHeader field="teamName" label="Team" />
                <SortableTableHeader field="deptEvalStatus" label="Dept. Evaluation" />
                <SortableTableHeader field="centralEvalStatus" label="Central Evaluation" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginatedProjects.map((project) => {
                    const deptEvalInfo = getEvaluationStatus(project.deptEvaluation);
                    const centralEvalInfo = getEvaluationStatus(project.centralEvaluation);
                    return (
                        <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.title}</TableCell>
                            <TableCell>{departments.find(d=>d.id === project.department)?.name || 'N/A'}</TableCell>
                            <TableCell>{teams.find(t=>t.id === project.teamId)?.name || 'N/A'}</TableCell>
                            <TableCell>
                                <Badge variant={deptEvalInfo.text === 'Completed' ? 'default' : deptEvalInfo.text === 'Assigned' ? 'secondary' : 'outline'} className={deptEvalInfo.color}>{deptEvalInfo.text}</Badge>
                                {deptEvalInfo.juryName && <span className="text-xs text-muted-foreground block">Jury: {deptEvalInfo.juryName}</span>}
                                {deptEvalInfo.score !== undefined && <span className="text-xs text-muted-foreground block">Score: {deptEvalInfo.score}%</span>}
                            </TableCell>
                            <TableCell>
                                <Badge variant={centralEvalInfo.text === 'Completed' ? 'default' : centralEvalInfo.text === 'Assigned' ? 'secondary' : 'outline'} className={centralEvalInfo.color}>{centralEvalInfo.text}</Badge>
                                {centralEvalInfo.juryName && <span className="text-xs text-muted-foreground block">Jury: {centralEvalInfo.juryName}</span>}
                                {centralEvalInfo.score !== undefined && <span className="text-xs text-muted-foreground block">Score: {centralEvalInfo.score}%</span>}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => handleOpenAssignJuryDialog(project)}><UserCheck className="mr-1 h-4 w-4"/>Assign Jury</Button>
                            </TableCell>
                        </TableRow>
                    );
                })}
              </TableBody>
            </Table>
            }
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t dark:border-gray-700">
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

      <Dialog open={isAssignJuryDialogOpen} onOpenChange={setIsAssignJuryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Jury for: {selectedProjectForJury?.title}</DialogTitle>
            <DialogDescription>Select jury members for departmental and central evaluations.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignJurySubmit} className="space-y-4 py-2">
            <div>
              <Label htmlFor="deptJurySelect">Departmental Evaluation Jury</Label>
              <Select value={formDeptJuryId || ""} onValueChange={(val) => setFormDeptJuryId(val === "" ? undefined : val)}>
                <SelectTrigger><SelectValue placeholder="Select Department Jury" /></SelectTrigger>
                <SelectContent><SelectItem value="">None</SelectItem>{juryMembers.map(j => <SelectItem key={j.id} value={j.id}>{j.displayName} ({j.email})</SelectItem>)}</SelectContent>
              </Select>
              {selectedProjectForJury?.deptEvaluation?.completed && <p className="text-xs text-green-600 mt-1">Evaluation completed. Score: {selectedProjectForJury.deptEvaluation.score}%</p>}
            </div>
            <div>
              <Label htmlFor="centralJurySelect">Central Evaluation Jury</Label>
              <Select value={formCentralJuryId || ""} onValueChange={(val) => setFormCentralJuryId(val === "" ? undefined : val)}>
                <SelectTrigger><SelectValue placeholder="Select Central Jury" /></SelectTrigger>
                <SelectContent><SelectItem value="">None</SelectItem>{juryMembers.map(j => <SelectItem key={j.id} value={j.id}>{j.displayName} ({j.email})</SelectItem>)}</SelectContent>
              </Select>
              {selectedProjectForJury?.centralEvaluation?.completed && <p className="text-xs text-green-600 mt-1">Evaluation completed. Score: {selectedProjectForJury.centralEvaluation.score}%</p>}
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAssignJuryDialogOpen(false)} disabled={isSubmittingJury}>Cancel</Button>
              <Button type="submit" disabled={isSubmittingJury}>{isSubmittingJury && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Jury Assignments</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

