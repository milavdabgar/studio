// src/app/admin/project-fair/events/edit/[eventId]/page.tsx
"use client";
import ProjectEventForm from '@/components/admin/project-fair/ProjectEventForm';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { projectEventService } from '@/lib/api/projectEvents';
import type { ProjectEvent } from '@/types/entities';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export default function EditProjectEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<ProjectEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (eventId) {
      const fetchEvent = async () => {
        setIsLoading(true);
        try {
          const eventData = await projectEventService.getEventById(eventId);
          setEvent(eventData);
        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "Could not load event data for editing."});
          router.push('/admin/project-fair/events');
        }
        setIsLoading(false);
      };
      fetchEvent();
    }
  }, [eventId, router, toast]);

  const handleEventUpdated = (updatedEvent: ProjectEvent) => {
    toast({ title: "Success", description: `Event "${updatedEvent.name}" updated successfully.` });
    router.push(`/admin/project-fair/events/${updatedEvent.id}/dashboard`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!event) {
    return <div className="text-center py-10">Event not found or failed to load.</div>;
  }

  return (
    <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4 print:hidden">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Dashboard
        </Button>
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Edit Project Fair Event</CardTitle>
                <CardDescription>Modify the details for "{event.name}".</CardDescription>
            </CardHeader>
            <CardContent>
                <ProjectEventForm
                    existingEvent={event}
                    onEventSaved={handleEventUpdated}
                    onCancel={() => router.push(`/admin/project-fair/events/${eventId}/dashboard`)}
                />
            </CardContent>
        </Card>
    </div>
  );
}
