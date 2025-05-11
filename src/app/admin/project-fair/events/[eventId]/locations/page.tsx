// src/app/admin/project-fair/events/[eventId]/locations/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectLocation, ProjectEvent } from '@/types/entities';
import { projectLocationService } from '@/lib/api/projectLocations'; 
import { projectEventService } from '@/lib/api/projectEvents';
// TODO: Import LocationTable and LocationForm components when they are created

export default function EventLocationsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<ProjectEvent | null>(null);
  const [locations, setLocations] = useState<ProjectLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!eventId) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [eventData, locationsDataResponse] = await Promise.all([ // Renamed locationsData to locationsDataResponse
          projectEventService.getEventById(eventId),
          projectLocationService.getAllLocations({ eventId: eventId }), 
        ]);
        setEvent(eventData);
        // Assuming getAllLocations returns an object like { locations: [], pagination: {} }
        // Adjust based on actual return type of projectLocationService.getAllLocations
        setLocations(locationsDataResponse.locations || []); 
      } catch (error) {
        console.error("Failed to load event locations data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load event locations data." });
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
            <MapPin className="h-6 w-6" /> Locations for {event.name}
          </CardTitle>
          <CardDescription>
            Manage and assign project locations/stalls for this event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Location management features are under development.
            </p>
            <p className="text-sm text-muted-foreground">
              This section will allow defining sections, positions, and assigning projects to specific stalls.
            </p>
            {/* TODO: Add LocationTable and LocationForm/Assignment components here */}
            {/* <Button className="mt-4">Add New Location/Section</Button> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
