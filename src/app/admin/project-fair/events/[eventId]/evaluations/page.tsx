// src/app/admin/project-fair/events/[eventId]/evaluations/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectEvent, Project, ProjectEvaluation } from '@/types/entities';
import { projectEventService } from '@/lib/api/projectEvents';
// TODO: Import EvaluationTable and related components when they are created

export default function EventEvaluationsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<ProjectEvent | null>(null);
  // const [evaluations, setEvaluations] = useState<ProjectEvaluation[]>([]); // Or link evaluations to projects
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!eventId) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const eventData = await projectEventService.getEventById(eventId);
        setEvent(eventData);
        // TODO: Fetch evaluation data related to this event's projects
      } catch (error) {
        console.error("Failed to load event evaluations data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load event evaluations data." });
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
            <Award className="h-6 w-6" /> Jury Evaluations for {event.name}
          </CardTitle>
          <CardDescription>
            Oversee and manage jury assignments and project evaluations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Jury and evaluation management features are under development.
            </p>
            <p className="text-sm text-muted-foreground">
              This section will allow assigning jury members to projects, tracking evaluation progress, and viewing scores.
            </p>
            {/* TODO: Add components for jury assignment and evaluation tracking */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
