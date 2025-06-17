// src/app/admin/project-fair/events/page.tsx
"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Edit, Trash2, Briefcase, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Users as UsersIcon, MapPin, ListChecks, Award as AwardIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import type { ProjectEvent, Department, ProjectEventStatus } from '@/types/entities';
import { projectEventService } from '@/lib/api/projectEvents';
import { departmentService } from '@/lib/api/departments';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';


type SortField = keyof ProjectEvent | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];
const EVENT_STATUS_OPTIONS: { value: ProjectEventStatus, label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ProjectEventManagementPage() {
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Partial<ProjectEvent> | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAcademicYear, setFormAcademicYear] = useState<string>('');
  const [formEventDate, setFormEventDate] = useState<Date | undefined>(undefined);
  const [formRegistrationStartDate, setFormRegistrationStartDate] = useState<Date | undefined>(undefined);
  const [formRegistrationEndDate, setFormRegistrationEndDate] = useState<Date | undefined>(undefined);
  const [formStatus, setFormStatus] = useState<ProjectEventStatus>('upcoming');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formPublishResults, setFormPublishResults] = useState<boolean>(false);
  const [formSelectedDepartments, setFormSelectedDepartments] = useState<string[]>([]);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatusVal, setFilterStatusVal] = useState<ProjectEventStatus | 'all'>('all');
  const [filterAcademicYearVal, setFilterAcademicYearVal] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('eventDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [eventData, departmentData] = await Promise.all([
        projectEventService.getAllEvents(),
        departmentService.getAllDepartments()
      ]);
      setEvents(eventData);
      setDepartments(departmentData);
    } catch (error) {
      console.error("Failed to load data", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load initial data." });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, [toast]);

  const resetForm = () => {
    setFormName(''); setFormDescription('');
    setFormAcademicYear(`${new Date().getFullYear()}-${(new Date().getFullYear() % 100) + 1}`);
    setFormEventDate(undefined); setFormRegistrationStartDate(undefined); setFormRegistrationEndDate(undefined);
    setFormStatus('upcoming'); setFormIsActive(true); setFormPublishResults(false);
    setFormSelectedDepartments([]);
    setCurrentEvent(null);
  };

  const handleEdit = (event: ProjectEvent) => {
    setCurrentEvent(event);
    setFormName(event.name);
    setFormDescription(event.description || '');
    setFormAcademicYear(event.academicYear);
    setFormEventDate(event.eventDate ? parseISO(event.eventDate) : undefined);
    setFormRegistrationStartDate(event.registrationStartDate ? parseISO(event.registrationStartDate) : undefined);
    setFormRegistrationEndDate(event.registrationEndDate ? parseISO(event.registrationEndDate) : undefined);
    setFormStatus(event.status);
    setFormIsActive(event.isActive);
    setFormPublishResults(event.publishResults || false);
    setFormSelectedDepartments(event.departments || []);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    setIsSubmitting(true);
    try {
      await projectEventService.deleteEvent(eventId);
      await fetchInitialData();
      setSelectedEventIds(prev => prev.filter(id => id !== eventId));
      toast({ title: "Event Deleted", description: "The event has been successfully deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete event." });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAcademicYear.trim() || !formEventDate || !formRegistrationStartDate || !formRegistrationEndDate) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name, Academic Year, and all Dates are required."});
      return;
    }
    if (formRegistrationStartDate >= formEventDate || formRegistrationEndDate >= formEventDate || formRegistrationStartDate >= formRegistrationEndDate) {
        toast({ variant: "destructive", title: "Validation Error", description: "Event dates are illogical. Please check registration and event dates." });
        return;
    }

    setIsSubmitting(true);
    
    const eventData: Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'schedule'> = { 
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      academicYear: formAcademicYear.trim(),
      eventDate: format(formEventDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      registrationStartDate: format(formRegistrationStartDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      registrationEndDate: format(formRegistrationEndDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      status: formStatus,
      isActive: formIsActive,
      publishResults: formPublishResults,
      departments: formSelectedDepartments,
    };

    try {
      if (currentEvent && currentEvent.id) {
        await projectEventService.updateEvent(currentEvent.id, eventData);
        toast({ title: "Event Updated", description: "The event has been successfully updated." });
      } else {
        await projectEventService.createEvent(eventData);
        toast({ title: "Event Created", description: "The new event has been successfully created." });
      }
      await fetchInitialData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message || "Could not save event." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
  };

  const handleImportEvents = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
     if (departments.length === 0) {
      toast({ variant: "destructive", title: "Import Error", description: "No departments loaded. Cannot map department IDs for events." });
      return;
    }

    setIsSubmitting(true);
    try {
        const result = await projectEventService.importEvents(selectedFile, departments);
        await fetchInitialData();
        toast({ title: "Import Successful", description: `${result.newCount} events added, ${result.updatedCount} updated. Skipped: ${result.skippedCount}`});
        if (result.errors && result.errors.length > 0) {
          result.errors.slice(0, 3).forEach((err: unknown) => {
            toast({ variant: "default", title: `Import Warning (Row ${(err as {row: number}).row})`, description: (err as {message:string}).message, duration: 7000 });
          });
        }
    } catch (error: unknown) {
        console.error("Error processing event CSV file:", error);
        toast({ variant: "destructive", title: "Import Failed", description: (error as Error).message || "Could not process the event CSV file." });
    } finally {
        setIsSubmitting(false); setSelectedFile(null); 
        const fileInput = document.getElementById('csvImportEvent') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }
  };

  const handleExportEvents = () => {
    if (filteredAndSortedEvents.length === 0) {
      toast({ title: "Export Canceled", description: "No events to export (check filters)." });
      return;
    }
    const header = ['id', 'name', 'description', 'academicYear', 'eventDate', 'registrationStartDate', 'registrationEndDate', 'status', 'isActive', 'publishResults', 'departmentNames', 'departmentCodes'];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedEvents.map(e => {
        const eventDepts = e.departments?.map(deptId => departments.find(d => d.id === deptId)).filter(Boolean) || [];
        return [
          e.id, `"${e.name.replace(/"/g, '""')}"`, `"${(e.description || "").replace(/"/g, '""')}"`,
          e.academicYear, e.eventDate, e.registrationStartDate, e.registrationEndDate, e.status,
          e.isActive, e.publishResults || false,
          `"${eventDepts.map(d => d!.name).join(';')}"`,
          `"${eventDepts.map(d => d!.code).join(';')}"`
        ].join(',');
      })
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "project_events_export.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Events exported to project_events_export.csv" });
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,name,description,academicYear,eventDate,registrationStartDate,registrationEndDate,status,isActive,publishResults,departmentNames,departmentCodes
evt_s1,TechFest 2025,"Annual technical festival",2024-25,2025-03-15T10:00:00Z,2024-12-01T00:00:00Z,2025-01-31T23:59:59Z,upcoming,true,false,"Computer Engineering;Mechanical Engineering","CE;ME"
,Innovation Challenge 2024,,2024-25,2024-11-20T09:00:00Z,2024-09-01T00:00:00Z,2024-10-15T23:59:59Z,completed,true,true,"Electrical Engineering","EE"
`; 
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_project_events_import.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_project_events_import.csv downloaded." });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field); setSortDirection('asc');
    }
    setCurrentPage(1); 
  };
  
  const filteredAndSortedEvents = useMemo(() => {
    let result = [...events];

    if (searchTerm) {
      result = result.filter(e => 
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        e.academicYear.includes(searchTerm)
      );
    }
    if (filterStatusVal !== 'all') {
      result = result.filter(e => e.status === filterStatusVal);
    }
    if (filterAcademicYearVal !== 'all') {
      result = result.filter(e => e.academicYear === filterAcademicYearVal);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: unknown = a[sortField as keyof ProjectEvent];
        let valB: unknown = b[sortField as keyof ProjectEvent];
        
        if (sortField === 'eventDate' || sortField === 'registrationStartDate' || sortField === 'registrationEndDate') {
            valA = valA ? new Date(valA as string).getTime() : 0;
            valB = valB ? new Date(valB as string).getTime() : 0;
        }
        
        if (valA === undefined || valA === null) return sortDirection === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null) return sortDirection === 'asc' ? -1 : 1;
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
    }
    return result;
  }, [events, searchTerm, filterStatusVal, filterAcademicYearVal, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedEvents.length / itemsPerPage);
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedEvents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedEvents, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterStatusVal, filterAcademicYearVal, itemsPerPage]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedEventIds(checked === true ? paginatedEvents.map(e => e.id) : []);
  };

  const handleSelectEvent = (eventId: string, checked: boolean) => {
    setSelectedEventIds(prev => checked ? [...prev, eventId] : prev.filter(id => id !== eventId));
  };

  const handleDeleteSelected = async () => {
    if (selectedEventIds.length === 0) {
      toast({ variant: "destructive", title: "No Events Selected", description: "Please select events to delete." });
      return;
    }
    setIsSubmitting(true);
    try {
        for(const id of selectedEventIds) {
            await projectEventService.deleteEvent(id);
        }
        await fetchInitialData();
        toast({ title: "Events Deleted", description: `${selectedEventIds.length} event(s) have been successfully deleted.` });
        setSelectedEventIds([]);
    } catch (error) {
        toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete selected events."});
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedEvents.length > 0 && paginatedEvents.every(e => selectedEventIds.includes(e.id));
  const isSomeSelectedOnPage = paginatedEvents.some(e => selectedEventIds.includes(e.id)) && !isAllSelectedOnPage;

  const uniqueAcademicYears = useMemo(() => {
    return Array.from(new Set(events.map(e => e.academicYear))).sort().reverse();
  }, [events]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => handleSort(field)} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">
        {label}
        {sortField === field && (sortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" /> : <ArrowUpDown className="h-4 w-4 opacity-50" />)}
        {sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              Project Fair Event Management
            </CardTitle>
            <CardDescription>
              Create, manage, and oversee project fairs and innovation events.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Create New Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{currentEvent?.id ? "Edit Event" : "Create New Event"}</DialogTitle>
                  <DialogDescription>
                    {currentEvent?.id ? "Modify event details." : "Define details for a new project fair event."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[75vh] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="md:col-span-2"><Label htmlFor="eventNameForm">Event Name *</Label><Input id="eventNameForm" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., Annual Tech Expo 2025" disabled={isSubmitting} required /></div>
                  <div className="md:col-span-2"><Label htmlFor="eventDescriptionForm">Description</Label><Textarea id="eventDescriptionForm" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Brief overview, theme, or goals of the event." disabled={isSubmitting} rows={3}/></div>
                  <div className="md:col-span-1"><Label htmlFor="eventAcademicYearForm">Academic Year *</Label><Input id="eventAcademicYearForm" value={formAcademicYear} onChange={e => setFormAcademicYear(e.target.value)} placeholder="e.g., 2024-25" disabled={isSubmitting} required /></div>
                  
                  <div className="md:col-span-1">
                    <Label htmlFor="eventDateForm">Event Date *</Label>
                    <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formEventDate && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{formEventDate ? format(formEventDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formEventDate} onSelect={setFormEventDate} initialFocus /></PopoverContent></Popover>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="eventRegStartDateForm">Registration Start Date *</Label>
                    <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formRegistrationStartDate && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{formRegistrationStartDate ? format(formRegistrationStartDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formRegistrationStartDate} onSelect={setFormRegistrationStartDate} initialFocus /></PopoverContent></Popover>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="eventRegEndDateForm">Registration End Date *</Label>
                    <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formRegistrationEndDate && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{formRegistrationEndDate ? format(formRegistrationEndDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formRegistrationEndDate} onSelect={setFormRegistrationEndDate} initialFocus /></PopoverContent></Popover>
                  </div>
                  
                   <div className="md:col-span-1">
                    <Label htmlFor="eventStatusForm">Status *</Label>
                    <Select value={formStatus} onValueChange={(value) => setFormStatus(value as ProjectEventStatus)} disabled={isSubmitting} required>
                      <SelectTrigger id="eventStatusForm"><SelectValue placeholder="Select Status"/></SelectTrigger>
                      <SelectContent>{EVENT_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-2 gap-4 items-center pt-2">
                    <div className="flex items-center space-x-2"><Switch id="eventIsActiveForm" checked={formIsActive} onCheckedChange={setFormIsActive} disabled={isSubmitting} /><Label htmlFor="eventIsActiveForm">Is Active Event</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="eventPublishResultsForm" checked={formPublishResults} onCheckedChange={setFormPublishResults} disabled={isSubmitting} /><Label htmlFor="eventPublishResultsForm">Publish Results</Label></div>
                  </div>

                  <div className="md:col-span-2">
                    <Label>Target Departments (Optional)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2 border rounded-md max-h-40 overflow-y-auto">
                        {departments.map(dept => (
                            <div key={dept.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`dept-${dept.id}`} 
                                    checked={formSelectedDepartments.includes(dept.id)}
                                    onCheckedChange={(checked) => {
                                        setFormSelectedDepartments(prev => checked ? [...prev, dept.id] : prev.filter(id => id !== dept.id))
                                    }}
                                />
                                <Label htmlFor={`dept-${dept.id}`} className="text-sm font-normal cursor-pointer">{dept.name} ({dept.code})</Label>
                            </div>
                        ))}
                    </div>
                  </div>
                  
                  <DialogFooter className="md:col-span-2 mt-4">
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{currentEvent?.id ? "Save Changes" : "Create Event"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportEvents} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Project Events from CSV</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportEvent" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportEvents} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>} Import
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
                </Button>
                <p className="text-xs text-muted-foreground">
                  CSV fields: id(opt), name, description, academicYear, eventDate, registrationStartDate, registrationEndDate, status, isActive, publishResults, departmentNames (semicolon-separated), departmentCodes (semicolon-separated).
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="searchEvent">Search Events</Label>
              <div className="relative">
                 <Input id="searchEvent" placeholder="Name, description, year..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-8"/>
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterAcademicYearEvent">Filter by Academic Year</Label>
              <Select value={filterAcademicYearVal} onValueChange={setFilterAcademicYearVal} >
                <SelectTrigger id="filterAcademicYearEvent"><SelectValue placeholder="All Years"/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Academic Years</SelectItem>
                    {uniqueAcademicYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStatusEvent">Filter by Status</Label>
              <Select value={filterStatusVal} onValueChange={(value) => setFilterStatusVal(value as ProjectEventStatus | 'all')}>
                <SelectTrigger id="filterStatusEvent"><SelectValue placeholder="All Statuses"/></SelectTrigger>
                <SelectContent>{[{value: 'all', label: 'All Statuses'} as {value: ProjectEventStatus | 'all', label: string}, ...EVENT_STATUS_OPTIONS].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {selectedEventIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedEventIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedEventIds.length} event(s) selected.
                </span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[50px]"><Checkbox checked={isAllSelectedOnPage || (paginatedEvents.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)} onCheckedChange={(checkedState) => handleSelectAll(!!checkedState)} aria-label="Select all events on this page"/></TableHead>
                <SortableTableHeader field="name" label="Event Name" />
                <SortableTableHeader field="academicYear" label="Academic Year" />
                <SortableTableHeader field="eventDate" label="Event Date" />
                <SortableTableHeader field="registrationEndDate" label="Reg. Ends" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEvents.map((eventItem) => (
                <TableRow key={eventItem.id} data-state={selectedEventIds.includes(eventItem.id) ? "selected" : undefined}>
                  <TableCell><Checkbox checked={selectedEventIds.includes(eventItem.id)} onCheckedChange={(checked) => handleSelectEvent(eventItem.id, !!checked)} aria-labelledby={`event-name-${eventItem.id}`}/></TableCell>
                  <TableCell id={`event-name-${eventItem.id}`} className="font-medium">{eventItem.name}</TableCell>
                  <TableCell>{eventItem.academicYear}</TableCell>
                  <TableCell>{eventItem.eventDate && isValid(parseISO(eventItem.eventDate)) ? format(parseISO(eventItem.eventDate), 'dd MMM yyyy') : '-'}</TableCell>
                  <TableCell>{eventItem.registrationEndDate && isValid(parseISO(eventItem.registrationEndDate)) ? format(parseISO(eventItem.registrationEndDate), 'dd MMM yyyy') : '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        eventItem.status === 'ongoing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                        : eventItem.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : eventItem.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' /* cancelled */
                    }`}>
                      {EVENT_STATUS_OPTIONS.find(s => s.value === eventItem.status)?.label || eventItem.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link
                      href={`/admin/project-fair/events/${eventItem.id}/dashboard`}
                      >
                        <Button variant="ghost" size="sm" title="Event Dashboard"><Briefcase className="h-4 w-4" /></Button>
                    </Link>
                     <Link
                       href={`/admin/project-fair/events/${eventItem.id}/projects`}
                       >
                        <Button variant="ghost" size="sm" title="Manage Projects"><UsersIcon className="h-4 w-4" /></Button>
                    </Link>
                     <Link
                       href={`/admin/project-fair/events/${eventItem.id}/locations`}
                       >
                        <Button variant="ghost" size="sm" title="Manage Locations"><MapPin className="h-4 w-4" /></Button>
                    </Link>
                     <Link
                       href={`/admin/project-fair/events/${eventItem.id}/schedule`}
                       >
                        <Button variant="ghost" size="sm" title="Manage Schedule"><ListChecks className="h-4 w-4" /></Button>
                    </Link>
                     <Link
                       href={`/admin/project-fair/events/${eventItem.id}/results`}
                       >
                        <Button variant="ghost" size="sm" title="Manage Results"><AwardIcon className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="outline" size="icon" onClick={() => handleEdit(eventItem)} disabled={isSubmitting}><Edit className="h-4 w-4" /><span className="sr-only">Edit Event</span></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(eventItem.id)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /><span className="sr-only">Delete Event</span></Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedEvents.length === 0 && (
                 <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No events found. Adjust filters or add a new event.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedEvents.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedEvents.length): 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedEvents.length)} of {filteredAndSortedEvents.length} events.
            </div>
            <div className="flex items-center gap-2">
                 <Select value={String(itemsPerPage)} onValueChange={(value) => {setItemsPerPage(Number(value)); setCurrentPage(1);}}>
                    <SelectTrigger className="w-[70px] h-8 text-xs"><SelectValue placeholder={String(itemsPerPage)} /></SelectTrigger>
                    <SelectContent side="top">{ITEMS_PER_PAGE_OPTIONS.map(sz => <SelectItem key={sz} value={String(sz)} className="text-xs">{sz}</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /><span className="sr-only">First</span></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /><span className="sr-only">Prev</span></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /><span className="sr-only">Next</span></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}><ChevronsRight className="h-4 w-4" /><span className="sr-only">Last</span></Button>
                </div>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
