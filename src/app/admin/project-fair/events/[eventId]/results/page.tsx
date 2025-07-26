// src/app/admin/project-fair/events/[eventId]/results/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Award, Download, Mail, Eye, EyeOff} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectEvent, Project, Department } from '@/types/entities';
import { projectEventService } from '@/lib/api/projectEvents';
import { projectService } from '@/lib/api/projects';
import { departmentService } from '@/lib/api/departments'; // For department names
import { projectTeamService } from '@/lib/api/projectTeams'; // For team names
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EnrichedWinner extends Project {
    rank: number;
    teamName?: string;
    departmentName?: string;
}

interface DepartmentWinnerGroup {
    department: Department;
    winners: EnrichedWinner[];
}

export default function EventResultsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string;

  const [event, setEvent] = useState<ProjectEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [departmentWinners, setDepartmentWinners] = useState<DepartmentWinnerGroup[]>([]);
  const [instituteWinners, setInstituteWinners] = useState<EnrichedWinner[]>([]);
  const [certificateStats, setCertificateStats] = useState({
    participation: { total: 0, generated: 0, downloaded: 0, emailSent: 0 },
    department: { total: 0, generated: 0, downloaded: 0, emailSent: 0 },
    institute: { total: 0, generated: 0, downloaded: 0, emailSent: 0 },
  });
  const [emailSettings, setEmailSettings] = useState({
    subject: 'Your Project Fair Certificate',
    template: 'Dear {participant_name},\n\nCongratulations on your participation/achievement in the {event_name}!\n\nPlease find your certificate attached.\n\nRegards,\nThe Organizing Team'
  });

  const fetchEventAndResultsData = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const eventData = await projectEventService.getEventById(eventId);
      setEvent(eventData);

      if (eventData) {
        const winnersData = await projectService.getEventWinners(eventId);
        
        const allDepartments = await departmentService.getAllDepartments();
        const allTeamsResponse = await projectTeamService.getAllTeams({ eventId });
        const allTeams = Array.isArray(allTeamsResponse) ? allTeamsResponse : ((allTeamsResponse as { data?: { teams?: Array<{ id: string; name: string }> } })?.data?.teams || []);

        const enrichWinners = (projects: (Project & { rank?: number })[]): EnrichedWinner[] => {
          return projects.map(p => ({
            ...p,
            rank: p.rank || 0,
            teamName: allTeams?.find((t) => t.id === p.teamId)?.name || 'N/A',
            departmentName: allDepartments.find(d => d.id === (typeof p.department === 'string' ? p.department : (p.department as { id?: string })?.id))?.name || 'N/A',
          }));
        };
        
        setInstituteWinners(enrichWinners(winnersData.instituteWinners || []));
        
        const deptWinnersEnriched: DepartmentWinnerGroup[] = (winnersData.departmentWinners || []).map(dw => ({
            department: dw.department, // department should be the full Department object from API
            winners: enrichWinners(dw.winners)
        }));
        setDepartmentWinners(deptWinnersEnriched);

        // Mock certificate stats
        const allProjectsResponse = await projectService.getAllProjects({eventId});
        const allProjects = Array.isArray(allProjectsResponse) ? allProjectsResponse : ((allProjectsResponse as { data?: { projects?: Project[] } })?.data?.projects || []);
        const participationTotal = allProjects.length;
        const deptWinnersTotal = deptWinnersEnriched.reduce((sum, dept) => sum + dept.winners.length, 0);
        const instWinnersTotal = (winnersData.instituteWinners || []).length;

        setCertificateStats({
            participation: { total: participationTotal, generated: participationTotal, downloaded: 0, emailSent: 0 },
            department: { total: deptWinnersTotal, generated: deptWinnersTotal, downloaded: 0, emailSent: 0 },
            institute: { total: instWinnersTotal, generated: instWinnersTotal, downloaded: 0, emailSent: 0 },
        });

      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load event results data." });
    }
    setIsLoading(false);
  }, [eventId, toast]);

  useEffect(() => {
    fetchEventAndResultsData();
  }, [fetchEventAndResultsData]);

  const handleTogglePublishResults = async () => {
    if (!event) return;
    setIsSubmitting(true);
    try {
      const updatedEvent = await projectEventService.publishEventResults(event.id, !event.publishResults);
      setEvent(updatedEvent);
      toast({ title: "Success", description: `Results ${updatedEvent.publishResults ? 'published' : 'unpublished'} successfully.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: (error as Error).message });
    }
    setIsSubmitting(false);
  };
  
  const handleSimulatedAction = async (actionType: 'email' | 'download', certType: 'participation' | 'department' | 'institute') => {
      if(!event) return;
      setIsSubmitting(true);
      const typeMapping = {
          participation: 'participation',
          department: 'department-winner',
          institute: 'institute-winner'
      }
      const certsToProcess = await projectService.generateProjectCertificates(event.id, typeMapping[certType] as 'participation' | 'department-winner' | 'institute-winner');

      if (actionType === 'email') {
          const certIds = certsToProcess.map(c => c.projectId); // Assuming cert has projectId
          if (certIds.length > 0) {
            await projectService.sendCertificateEmails({ certificateIds: certIds, emailSubject: emailSettings.subject, emailTemplate: emailSettings.template });
            toast({title: `${certsToProcess.length} ${certType} certificate emails (simulated) sent!`});
            setCertificateStats(prev => ({...prev, [certType]: {...prev[certType], emailSent: prev[certType].total }}));
          } else {
            toast({title: "No Certificates", description: `No ${certType} certificates to email.`});
          }
      } else if (actionType === 'download') {
          // Simulate batch download (actual implementation would zip and download)
          toast({title: `Simulating download of ${certsToProcess.length} ${certType} certificates.`});
          setCertificateStats(prev => ({...prev, [certType]: {...prev[certType], downloaded: prev[certType].total }}));
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
         <Button onClick={() => router.push(`/admin/project-fair/events`)} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events List
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
                    <Award className="h-6 w-6" /> Results & Certificates for {event.name}
                </CardTitle>
                <CardDescription>Publish results and manage certificate distribution.</CardDescription>
            </div>
            <Button onClick={handleTogglePublishResults} disabled={isSubmitting} variant={event.publishResults ? "destructive" : "default"}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              {event.publishResults ? <><EyeOff className="mr-2 h-4 w-4"/>Unpublish Results</> : <><Eye className="mr-2 h-4 w-4"/>Publish Results</>}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="institute_winners">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
                    <TabsTrigger value="institute_winners">Institute Winners</TabsTrigger>
                    <TabsTrigger value="department_winners">Department Winners</TabsTrigger>
                    <TabsTrigger value="certificates">Certificate Management</TabsTrigger>
                </TabsList>
                
                <TabsContent value="institute_winners">
                    <Card>
                        <CardHeader><CardTitle>Overall Institute Winners</CardTitle></CardHeader>
                        <CardContent>
                            {instituteWinners.length === 0 && <p className="text-muted-foreground">No institute-level winners declared yet or no central evaluations completed.</p>}
                            <div className="grid md:grid-cols-3 gap-4">
                                {instituteWinners.map(winner => (
                                    <Card key={winner.id} className={winner.rank === 1 ? "border-2 border-yellow-400 bg-yellow-50" : ""}>
                                        <CardHeader><CardTitle className="text-lg">Rank #{winner.rank}: {winner.title}</CardTitle><CardDescription>Team: {winner.teamName || 'N/A'} | Dept: {winner.departmentName || 'N/A'}</CardDescription></CardHeader>
                                        <CardContent><p className="font-semibold">Score: {winner.centralEvaluation?.score?.toFixed(2) || 'N/A'}%</p></CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="department_winners">
                    <Card>
                        <CardHeader><CardTitle>Department-wise Winners</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {departmentWinners.length === 0 && <p className="text-muted-foreground">No department-level winners declared yet or no departmental evaluations completed.</p>}
                            {departmentWinners.map(deptGroup => (
                                <div key={deptGroup.department.id}>
                                    <h3 className="text-lg font-semibold mb-2 text-secondary">{deptGroup.department.name}</h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                    {deptGroup.winners.map(winner => (
                                        <Card key={winner.id} className={winner.rank === 1 ? "border-yellow-300 bg-yellow-50/50" : ""}>
                                            <CardHeader><CardTitle className="text-md">Rank #{winner.rank}: {winner.title}</CardTitle><CardDescription>Team: {winner.teamName || 'N/A'}</CardDescription></CardHeader>
                                            <CardContent><p className="font-semibold">Score: {winner.deptEvaluation?.score?.toFixed(2) || 'N/A'}%</p></CardContent>
                                        </Card>
                                    ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="certificates">
                    <Card>
                        <CardHeader><CardTitle>Certificate Management</CardTitle><CardDescription>Generate, download, and distribute certificates.</CardDescription></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-3 gap-4">
                                {/* Participation Certificates */}
                                <Card>
                                    <CardHeader><CardTitle className="text-md">Participation</CardTitle></CardHeader>
                                    <CardContent className="text-sm space-y-1">
                                        <p>Total: {certificateStats.participation.total}</p>
                                        <p>Generated: {certificateStats.participation.generated}</p>
                                        <p>Downloaded: {certificateStats.participation.downloaded}</p>
                                        <p>Emailed: {certificateStats.participation.emailSent}</p>
                                    </CardContent>
                                    <CardFooter className="gap-2"><Button size="sm" onClick={() => handleSimulatedAction('download', 'participation')} disabled={isSubmitting}><Download className="mr-1 h-3 w-3"/>Download All</Button><Button size="sm" onClick={() => handleSimulatedAction('email', 'participation')} disabled={isSubmitting}><Mail className="mr-1 h-3 w-3"/>Email All</Button></CardFooter>
                                </Card>
                                {/* Department Winner Certificates */}
                                <Card>
                                    <CardHeader><CardTitle className="text-md">Department Winners</CardTitle></CardHeader>
                                    <CardContent className="text-sm space-y-1">
                                        <p>Total: {certificateStats.department.total}</p>
                                        <p>Generated: {certificateStats.department.generated}</p>
                                        <p>Downloaded: {certificateStats.department.downloaded}</p>
                                        <p>Emailed: {certificateStats.department.emailSent}</p>
                                    </CardContent>
                                    <CardFooter className="gap-2"><Button size="sm" onClick={() => handleSimulatedAction('download', 'department')} disabled={isSubmitting}><Download className="mr-1 h-3 w-3"/>Download All</Button><Button size="sm" onClick={() => handleSimulatedAction('email', 'department')} disabled={isSubmitting}><Mail className="mr-1 h-3 w-3"/>Email All</Button></CardFooter>
                                </Card>
                                {/* Institute Winner Certificates */}
                                <Card>
                                    <CardHeader><CardTitle className="text-md">Institute Winners</CardTitle></CardHeader>
                                    <CardContent className="text-sm space-y-1">
                                        <p>Total: {certificateStats.institute.total}</p>
                                        <p>Generated: {certificateStats.institute.generated}</p>
                                        <p>Downloaded: {certificateStats.institute.downloaded}</p>
                                        <p>Emailed: {certificateStats.institute.emailSent}</p>
                                    </CardContent>
                                    <CardFooter className="gap-2"><Button size="sm" onClick={() => handleSimulatedAction('download', 'institute')} disabled={isSubmitting}><Download className="mr-1 h-3 w-3"/>Download All</Button><Button size="sm" onClick={() => handleSimulatedAction('email', 'institute')} disabled={isSubmitting}><Mail className="mr-1 h-3 w-3"/>Email All</Button></CardFooter>
                                </Card>
                            </div>
                             <Card className="mt-6">
                                <CardHeader><CardTitle className="text-lg">Email Settings</CardTitle><CardDescription>Customize the email sent with certificates.</CardDescription></CardHeader>
                                <CardContent className="space-y-3">
                                    <div><Label htmlFor="emailSubject">Subject</Label><Input id="emailSubject" value={emailSettings.subject} onChange={e => setEmailSettings(s => ({...s, subject: e.target.value}))} /></div>
                                    <div><Label htmlFor="emailTemplate">Body Template</Label><Textarea id="emailTemplate" value={emailSettings.template} onChange={e => setEmailSettings(s => ({...s, template: e.target.value}))} rows={5}/><p className="text-xs text-muted-foreground mt-1">Placeholders: {"{participant_name}"}, {"{event_name}"}, {"{certificate_type}"}</p></div>
                                    <Button size="sm" onClick={() => toast({title: "Settings Saved", description: "Email settings updated (simulation)."})} >Save Email Settings</Button>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}