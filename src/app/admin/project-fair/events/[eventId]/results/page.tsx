// src/app/admin/project-fair/events/[eventId]/results/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, CalendarCheck as ResultsIcon, Download, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectEvent } from '@/types/entities';
import { projectEventService } from '@/lib/api/projectEvents';

export default function EventResultsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<ProjectEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!eventId) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const eventData = await projectEventService.getEventById(eventId);
        setEvent(eventData);
        // TODO: Fetch results and certificate generation status
      } catch (error) {
        console.error("Failed to load event results data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load event results data." });
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
            <ResultsIcon className="h-6 w-6" /> Results & Certificates for {event.name}
          </CardTitle>
          <CardDescription>
            Publish results, manage winner declarations, and generate/distribute certificates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <ResultsIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Results and certificate management features are under development.
            </p>
            <p className="text-sm text-muted-foreground">
              This section will allow publishing final results, declaring winners, and managing certificate generation and distribution.
            </p>
            <div className="mt-6 flex justify-center gap-4">
                <Button disabled> <Download className="mr-2 h-4 w-4"/> Generate Certificates (Coming Soon)</Button>
                <Button disabled> <Mail className="mr-2 h-4 w-4"/> Email Certificates (Coming Soon)</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
