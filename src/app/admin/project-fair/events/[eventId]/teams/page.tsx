// src/app/admin/project-fair/events/[eventId]/teams/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectTeam, ProjectEvent } from '@/types/entities';
import { projectTeamService } from '@/lib/api/projectTeams';
import { projectEventService } from '@/lib/api/projectEvents';
// TODO: Import TeamTable and TeamForm components when they are created

export default function EventTeamsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<ProjectEvent | null>(null);
  const [teams, setTeams] = useState<ProjectTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!eventId) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [eventData, teamsData] = await Promise.all([
          projectEventService.getEventById(eventId),
          projectTeamService.getAllTeams({ eventId: eventId }), 
        ]);
        setEvent(eventData);
        setTeams(teamsData);
      } catch (error) {
        console.error("Failed to load event teams data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load event teams data." });
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
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Users className="h-6 w-6" /> Teams for {event.name}
          </CardTitle>
          <CardDescription>
            Manage all teams participating in this event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Team management features are under development.
            </p>
            <p className="text-sm text-muted-foreground">
              This section will display a table of teams with options to add, edit, view members, and manage team details.
            </p>
            {/* TODO: Add TeamTable and TeamForm components here */}
            {/* <Button className="mt-4">Add New Team</Button> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
