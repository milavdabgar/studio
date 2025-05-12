// src/app/admin/project-fair/events/[eventId]/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Users, Briefcase, CalendarCheck, Award, MapPin, ListChecks, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectEvent, Project, ProjectStatistics } from '@/types/entities';
import { projectEventService } from '@/lib/api/projectEvents';
import { projectService } from '@/lib/api/projects'; 
import Link from 'next/link';
import { format, isValid, parseISO } from 'date-fns';

export default function ProjectEventDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<ProjectEvent | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!eventId) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const eventData = await projectEventService.getEventById(eventId);
        setEvent(eventData);
        
        // Fetch projects for this event
        const projectsData = await projectService.getAllProjects({ eventId: eventId });
        setProjects(Array.isArray(projectsData) ? projectsData : (projectsData.data?.projects || []));


        // Fetch statistics for this event
        const statsData = await projectService.getProjectStatistics(eventId);
        setStats(statsData && typeof statsData === 'object' ? (statsData.data || statsData) : { total: 0, evaluated: 0, pending: 0, averageScore: 0, departmentWise: {} });


      } catch (error) {
        console.error("Failed to load event dashboard data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load event dashboard data." });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [eventId, toast]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!event) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground mb-4">Project Fair Event not found.</p>
        <Button onClick={() => router.push('/admin/project-fair/events')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events List
        </Button>
      </div>
    );
  }

  const dashboardCards = [
    { title: "Total Projects", value: String(stats?.total ?? projects.length), icon: Briefcase, color: "text-blue-500", href: `/admin/project-fair/events/${eventId}/projects` },
    { title: "Total Teams", value: String(new Set(projects.map(p => p.teamId)).size), icon: Users, color: "text-green-500", href: `/admin/project-fair/events/${eventId}/teams` },
    { title: "Evaluated Projects", value: String(stats?.evaluated ?? projects.filter(p => p.deptEvaluation?.completed || p.centralEvaluation?.completed).length), icon: CalendarCheck, color: "text-purple-500", href: `/admin/project-fair/events/${eventId}/evaluations` },
    { title: "Winners Published", value: event.publishResults ? "Yes" : "No", icon: Award, color: event.publishResults ? "text-yellow-500" : "text-gray-500", href: `/admin/project-fair/events/${eventId}/results` },
  ];

  const managementLinks = [
    { label: "Manage Projects", href: `/admin/project-fair/events/${eventId}/projects`, icon: Briefcase },
    { label: "Manage Teams", href: `/admin/project-fair/events/${eventId}/teams`, icon: Users },
    { label: "Assign Locations", href: `/admin/project-fair/events/${eventId}/locations`, icon: MapPin },
    { label: "Manage Schedule", href: `/admin/project-fair/events/${eventId}/schedule`, icon: ListChecks },
    { label: "Jury & Evaluations", href: `/admin/project-fair/events/${eventId}/evaluations`, icon: Award },
    { label: "Results & Certificates", href: `/admin/project-fair/events/${eventId}/results`, icon: CalendarCheck },
    { label: "Event Settings", href: `/admin/project-fair/events/edit/${eventId}`, icon: Settings },
  ];

  return (
    <div className="space-y-8">
       <Button variant="outline" onClick={() => router.push('/admin/project-fair/events')} className="mb-4 print:hidden">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Events
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">{event.name}</CardTitle>
          <CardDescription>
            {event.academicYear} | {event.eventDate && isValid(parseISO(event.eventDate)) ? format(parseISO(event.eventDate), "PPP") : "Date N/A"} | Status: <span className={`font-semibold ${event.status === 'completed' ? 'text-green-600' : event.status === 'ongoing' ? 'text-blue-600' : 'text-yellow-600'}`}>{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">{event.description}</p>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {dashboardCards.map((card, idx) => (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  {card.href && (
                    <Link href={card.href} passHref>
                      <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">View/Manage</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
                <CardTitle className="text-xl">Event Management Links</CardTitle>
                <CardDescription>Quick access to manage different aspects of this event.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {managementLinks.map(link => (
                    <Link key={link.href} href={link.href} passHref>
                        <Button variant="outline" className="w-full justify-start gap-3 p-4 h-auto">
                            <link.icon className="h-5 w-5 text-primary"/>
                            <span className="text-sm">{link.label}</span>
                        </Button>
                    </Link>
                ))}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}