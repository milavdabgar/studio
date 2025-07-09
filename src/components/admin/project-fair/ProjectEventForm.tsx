// src/components/admin/project-fair/ProjectEventForm.tsx
"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Loader2, Save, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import type { ProjectEvent, Department, ProjectEventStatus } from '@/types/entities';
import { projectEventService } from '@/lib/api/projectEvents';
import { departmentService } from '@/lib/api/departments';

interface ProjectEventFormProps {
  existingEvent?: ProjectEvent | null;
  onEventSaved: (event: ProjectEvent) => void;
  onCancel: () => void;
}

const EVENT_STATUS_OPTIONS: { value: ProjectEventStatus, label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const ProjectEventForm: React.FC<ProjectEventFormProps> = ({ existingEvent, onEventSaved, onCancel }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [name, setName] = useState(existingEvent?.name || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [academicYear, setAcademicYear] = useState(existingEvent?.academicYear || `${new Date().getFullYear()}-${(new Date().getFullYear() % 100) + 1}`);
  const [eventDate, setEventDate] = useState<Date | undefined>(existingEvent?.eventDate ? parseISO(existingEvent.eventDate) : undefined);
  const [registrationStartDate, setRegistrationStartDate] = useState<Date | undefined>(existingEvent?.registrationStartDate ? parseISO(existingEvent.registrationStartDate) : undefined);
  const [registrationEndDate, setRegistrationEndDate] = useState<Date | undefined>(existingEvent?.registrationEndDate ? parseISO(existingEvent.registrationEndDate) : undefined);
  const [status, setStatus] = useState<ProjectEventStatus>(existingEvent?.status || 'upcoming');
  const [isActive, setIsActive] = useState(existingEvent?.isActive === undefined ? true : existingEvent.isActive);
  const [publishResults, setPublishResults] = useState(existingEvent?.publishResults || false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(existingEvent?.departments || []);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const deptData = await departmentService.getAllDepartments();
        setDepartments(deptData);
      } catch {
        toast({ variant: "destructive", title: "Error loading departments" });
      }
    };
    fetchDepts();
  }, [toast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !academicYear.trim() || !eventDate || !registrationStartDate || !registrationEndDate) {
      toast({ variant: "destructive", title: "Missing Information", description: "Name, Academic Year, and all Dates are required." });
      return;
    }
    if (registrationStartDate >= eventDate || registrationEndDate >= eventDate || registrationStartDate >= registrationEndDate) {
      toast({variant: "destructive", title: "Invalid Dates", description: "Event dates are illogical."});
      return;
    }

    setIsSubmitting(true);
    const eventDataPayload: Partial<Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'schedule'>> & { schedule?: ProjectEvent['schedule'] } = {
      name: name.trim(),
      description: description.trim() || undefined,
      academicYear: academicYear.trim(),
      eventDate: format(eventDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      registrationStartDate: format(registrationStartDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      registrationEndDate: format(registrationEndDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      status,
      isActive,
      publishResults,
      departments: selectedDepartments,
      schedule: existingEvent?.schedule || [], // Preserve existing schedule or init as empty
    };

    try {
      let savedEvent: ProjectEvent;
      if (existingEvent && existingEvent.id) {
        savedEvent = await projectEventService.updateEvent(existingEvent.id, eventDataPayload);
      } else {
        // For create, ensure no ID is passed. The service layer should handle Omit correctly.
        const createData = eventDataPayload as Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'schedule'> & {schedule: []};
        savedEvent = await projectEventService.createEvent(createData);
      }
      onEventSaved(savedEvent);
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><Label htmlFor="eventName">Event Name *</Label><Input id="eventName" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting} /></div>
        <div><Label htmlFor="academicYear">Academic Year *</Label><Input id="academicYear" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} required disabled={isSubmitting} /></div>
      </div>
      <div><Label htmlFor="eventDescription">Description</Label><Textarea id="eventDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={isSubmitting} /></div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div><Label htmlFor="eventDate">Event Date *</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !eventDate && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{eventDate ? format(eventDate, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus /></PopoverContent></Popover></div>
        <div><Label htmlFor="registrationStartDate">Registration Start *</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !registrationStartDate && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{registrationStartDate ? format(registrationStartDate, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={registrationStartDate} onSelect={setRegistrationStartDate} initialFocus /></PopoverContent></Popover></div>
        <div><Label htmlFor="registrationEndDate">Registration End *</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !registrationEndDate && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{registrationEndDate ? format(registrationEndDate, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={registrationEndDate} onSelect={setRegistrationEndDate} initialFocus /></PopoverContent></Popover></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div><Label htmlFor="status">Status *</Label><Select value={status} onValueChange={(v) => setStatus(v as ProjectEventStatus)} required disabled={isSubmitting}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EVENT_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select></div>
        <div className="flex items-center space-x-2 pt-2"><Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} disabled={isSubmitting} /><Label htmlFor="isActive">Is Active</Label></div>
        <div className="flex items-center space-x-2 pt-2"><Switch id="publishResults" checked={publishResults} onCheckedChange={setPublishResults} disabled={isSubmitting} /><Label htmlFor="publishResults">Publish Results</Label></div>
      </div>
      
      <div>
        <Label>Target Departments (Optional)</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-md max-h-48 overflow-y-auto bg-muted/20 mt-1 dark:border-gray-700">
            {departments.map(dept => (
                <div key={dept.id} className="flex items-center space-x-2">
                    <Checkbox 
                        id={`dept-check-${dept.id}`} 
                        checked={selectedDepartments.includes(dept.id)}
                        onCheckedChange={(checked) => {
                            setSelectedDepartments(prev => 
                                checked ? [...prev, dept.id] : prev.filter(id => id !== dept.id)
                            );
                        }}
                    />
                    <Label htmlFor={`dept-check-${dept.id}`} className="text-sm font-normal cursor-pointer">{dept.name} ({dept.code})</Label>
                </div>
            ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}><XCircle className="mr-2 h-4 w-4" />Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {existingEvent?.id ? "Save Changes" : "Create Event"}
        </Button>
      </div>
    </form>
  );
};

export default ProjectEventForm;
    