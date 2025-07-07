
"use client";

import React, { useState, FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Briefcase, PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

// Placeholder for actual project fair event type and service
// import type { ProjectFairEvent } from '@/types/entities'; 
// import { projectFairService } from '@/lib/api/projectFair';

export default function NewProjectFairEventPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [academicYear, setAcademicYear] = useState(""); // e.g., "2024-25"
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [registrationDeadline, setRegistrationDeadline] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<'planning' | 'open_for_registration' | 'ongoing' | 'completed' | 'cancelled'>('planning');


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!eventName || !academicYear || !startDate || !endDate || !registrationDeadline) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill all required fields for the event." });
      return;
    }
    if (startDate >= endDate) {
      toast({variant: "destructive", title: "Invalid Dates", description: "End date must be after start date."});
      return;
    }
    if (registrationDeadline >= startDate) {
        toast({variant: "destructive", title: "Invalid Dates", description: "Registration deadline must be before the event start date."});
        return;
    }

    setIsLoading(true);
    try {
      // const eventData = {
      //   name: eventName,
      //   description: eventDescription,
      //   academicYear,
      //   startDate: format(startDate, "yyyy-MM-dd"),
      //   endDate: format(endDate, "yyyy-MM-dd"),
      //   registrationDeadline: format(registrationDeadline, "yyyy-MM-dd"),
      //   status,
      // };
      // await projectFairService.createEvent(eventData); // Replace with actual service call
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      toast({ title: "Project Fair Event Created", description: `The event "${eventName}" has been successfully created.` });
      // Reset form or redirect
      setEventName(""); setEventDescription(""); setAcademicYear("");
      setStartDate(undefined); setEndDate(undefined); setRegistrationDeadline(undefined);
      setStatus('planning');
    } catch (error) {
      toast({ variant: "destructive", title: "Creation Failed", description: (error as Error).message || "Could not create project fair event." });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Create New Project Fair Event
          </CardTitle>
          <CardDescription>
            Define the details for a new project fair or innovation event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div>
              <Label htmlFor="eventName">Event Name *</Label>
              <Input id="eventName" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g., Annual Project Expo 2025" disabled={isLoading} required />
            </div>
            <div>
              <Label htmlFor="eventDescription">Description</Label>
              <Textarea id="eventDescription" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="Brief overview, theme, or goals of the event." rows={3} disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="academicYear">Academic Year *</Label>
              <Input id="academicYear" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="e.g., 2024-25" disabled={isLoading} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")} disabled={isLoading}><CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "PPP") : <span>Pick start date</span>}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
                    </Popover>
                </div>
                <div>
                    <Label htmlFor="endDate">End Date *</Label>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")} disabled={isLoading}><CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, "PPP") : <span>Pick end date</span>}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus /></PopoverContent>
                    </Popover>
                </div>
                 <div>
                    <Label htmlFor="registrationDeadline">Registration Deadline *</Label>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !registrationDeadline && "text-muted-foreground")} disabled={isLoading}><CalendarIcon className="mr-2 h-4 w-4" />{registrationDeadline ? format(registrationDeadline, "PPP") : <span>Pick deadline</span>}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={registrationDeadline} onSelect={setRegistrationDeadline} initialFocus /></PopoverContent>
                    </Popover>
                </div>
            </div>
             <div>
              <Label htmlFor="status">Initial Status *</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as 'planning' | 'open_for_registration' | 'ongoing' | 'completed' | 'cancelled')} disabled={isLoading}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="open_for_registration">Open for Registration</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Add fields for eligibility criteria, themes, max team size, etc. as needed */}

            <CardFooter className="px-0 pt-6">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Create Event
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
