// src/app/admin/project-fair/events/[eventId]/results/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, Award as ResultsIcon, Download, Mail, Settings, FileText, Users as UsersIcon, BarChart3, CheckCircle, AlertTriangle, Info, ListChecks } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import type { ProjectEvent, Project, ProjectTeam, Department, SystemUser as User, ProjectEvaluationScore, Checkbox } from '@/types/entities';
import { projectEventService } from '@/lib/api/projectEvents';
import { projectService } from '@/lib/api/projects';
import { departmentService } from '@/lib/api/departments';
import { projectTeamService } from '@/lib/api/projectTeams';
import { userService } from '@/lib/api/users';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface WinnerProject extends Project {
    rank?: number;
    teamDetails?: ProjectTeam;
    departmentDetails?: Department;
}

interface DepartmentWinnerGroup {
    departmentId: string;
    departmentName: string;
    departmentCode: string;
    winners: WinnerProject[];
}

export default function EventResultsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<ProjectEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [departmentWinners, setDepartmentWinners] = useState<DepartmentWinnerGroup[]>([]);
  const [instituteWinners, setInstituteWinners] = useState<WinnerProject[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allTeams, setAllTeams] = useState<ProjectTeam[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);

  const [isPublishResultsDialogOpen, setIsPublishResultsDialogOpen] = useState(false);
  const [publishResultsConfirmation, setPublishResultsConfirmation] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [eventData, projectsData, teamsData, deptsData] = await Promise.all([
          projectEventService.getEventById(eventId),
          projectService.getAllProjects({ eventId }),
          projectTeamService.getAllTeams({ eventId }),
          departmentService.getAllDepartments(),
        ]);
        setEvent(eventData);
        setAllProjects(Array.isArray(projectsData) ? projectsData : (projectsData.data?.projects || []));
        setAllTeams(Array.isArray(teamsData) ? teamsData : (teamsData.data?.teams || []));
        setAllDepartments(deptsData);
        setPublishResultsConfirmation(eventData.publishResults || false);
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load event data." });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [eventId, toast]);

  useEffect(() => {
    if (event && allProjects.length > 0 && allTeams.length > 0 && allDepartments.length > 0) {
      calculateWinners();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, allProjects, allTeams, allDepartments]);

  const calculateWinners = () => {
    // Department Winners (Top 3 per department based on deptEvaluation.score)
    const deptWinnersMap = new Map<string, WinnerProject[]>();
    allProjects
      .filter(p => p.deptEvaluation?.completed && typeof p.deptEvaluation.score === 'number')
      .forEach(p => {
        if (!deptWinnersMap.has(p.department)) {
          deptWinnersMap.set(p.department, []);
        }
        deptWinnersMap.get(p.department)!.push({
            ...p,
            teamDetails: allTeams.find(t => t.id === p.teamId),
            departmentDetails: allDepartments.find(d => d.id === p.department)
        });
      });

    const finalDeptWinners: DepartmentWinnerGroup[] = [];
    deptWinnersMap.forEach((projectsInDept, deptId) => {
      const sorted = projectsInDept.sort((a, b) => (b.deptEvaluation!.score!) - (a.deptEvaluation!.score!));
      const deptDetails = allDepartments.find(d => d.id === deptId);
      finalDeptWinners.push({
        departmentId: deptId,
        departmentName: deptDetails?.name || 'Unknown Department',
        departmentCode: deptDetails?.code || 'N/A',
        winners: sorted.slice(0, 3).map((proj, idx) => ({ ...proj, rank: idx + 1 })),
      });
    });
    setDepartmentWinners(finalDeptWinners);

    // Institute Winners (Top 3 overall based on centralEvaluation.score)
    const instWinners = allProjects
      .filter(p => p.centralEvaluation?.completed && typeof p.centralEvaluation.score === 'number')
      .sort((a, b) => (b.centralEvaluation!.score!) - (a.centralEvaluation!.score!))
      .slice(0, 3)
      .map((p, idx) => ({
        ...p,
        rank: idx + 1,
        teamDetails: allTeams.find(t => t.id === p.teamId),
        departmentDetails: allDepartments.find(d => d.id === p.department)
      }));
    setInstituteWinners(instWinners);
  };

  const handlePublishResultsToggle = async () => {
    if (!event) return;
    setIsSubmitting(true);
    try {
        const updatedEvent = await projectEventService.publishEventResults(event.id, publishResultsConfirmation);
        setEvent(updatedEvent);
        toast({ title: "Success", description: `Results are now ${updatedEvent.publishResults ? 'Published' : 'Unpublished'}.`});
        setIsPublishResultsDialogOpen(false);
    } catch (error) {
        toast({variant: "destructive", title: "Error", description: "Failed to update results publication status."});
    }
    setIsSubmitting(false);
  };


  if (isLoading) {
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

  const WinnerCard: React.FC<{ project: WinnerProject }> = ({ project }) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
                <CardTitle className="text-md font-semibold">{project.title}</CardTitle>
                {project.rank && <Badge variant={project.rank === 1 ? "default" : project.rank === 2 ? "secondary" : "outline"} className="text-xs">Rank #{project.rank}</Badge>}
            </div>
            <CardDescription className="text-xs">{project.teamDetails?.name || 'N/A Team'}</CardDescription>
        </CardHeader>
        <CardContent className="text-xs">
            <p>Score: {project.deptEvaluation?.score || project.centralEvaluation?.score || 'N/A'}%</p>
            <p>Department: {project.departmentDetails?.name || 'N/A'}</p>
        </CardContent>
    </Card>
  );


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
                        <ResultsIcon className="h-6 w-6" /> Results & Certificates for {event.name}
                    </CardTitle>
                    <CardDescription>Publish results, manage winner declarations, and generate/distribute certificates.</CardDescription>
                </div>
                <Dialog open={isPublishResultsDialogOpen} onOpenChange={setIsPublishResultsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant={event.publishResults ? "destructive" : "default"}>
                            {event.publishResults ? "Unpublish Results" : "Publish Results"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm {event.publishResults ? "Unpublish" : "Publish"} Results</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to {event.publishResults ? "make the results private" : "make the results public"}?
                                This will affect visibility for students and faculty.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="confirmPublish" checked={publishResultsConfirmation} onCheckedChange={(checked) => setPublishResultsConfirmation(!!checked)} />
                                <Label htmlFor="confirmPublish" className="text-sm">I understand the consequences of this action.</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPublishResultsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handlePublishResultsToggle} disabled={!publishResultsConfirmation || isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm {event.publishResults ? "Unpublish" : "Publish"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
             <Alert className={`mt-4 ${event.publishResults ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                {event.publishResults ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <AlertDescription className="ml-2">
                    Results are currently <strong>{event.publishResults ? "Published" : "Not Published"}</strong>.
                </AlertDescription>
            </Alert>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="institute_winners">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="institute_winners">Institute Winners</TabsTrigger>
                    <TabsTrigger value="department_winners">Department Winners</TabsTrigger>
                    <TabsTrigger value="certificates">Certificates</TabsTrigger>
                </TabsList>
                <TabsContent value="institute_winners">
                    <Card>
                        <CardHeader><CardTitle>Institute Level Winners</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {instituteWinners.length > 0 ? instituteWinners.map(p => <WinnerCard key={p.id} project={p} />)
                            : <p className="col-span-full text-center text-muted-foreground p-4">No institute-level winners declared or evaluations pending.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="department_winners">
                    <div className="space-y-6">
                    {departmentWinners.length > 0 ? departmentWinners.map(deptGroup => (
                        <Card key={deptGroup.departmentId}>
                            <CardHeader><CardTitle>Top Projects: {deptGroup.departmentName} ({deptGroup.departmentCode})</CardTitle></CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {deptGroup.winners.map(p => <WinnerCard key={p.id} project={p} />)}
                            </CardContent>
                        </Card>
                    )) : <p className="text-center text-muted-foreground p-4">No department-level winners declared or evaluations pending.</p>}
                    </div>
                </TabsContent>
                 <TabsContent value="certificates">
                    <Card>
                        <CardHeader><CardTitle>Certificate Management</CardTitle><CardDescription>Generate and distribute participation and winner certificates.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">Certificate generation and distribution features are under development.</p>
                            <div className="flex gap-2">
                                <Button disabled><Download className="mr-2 h-4 w-4" /> Generate All Participation Certificates</Button>
                                <Button disabled><Mail className="mr-2 h-4 w-4" /> Email All Winner Certificates</Button>
                            </div>
                        </CardContent>
                    </Card>
                 </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
