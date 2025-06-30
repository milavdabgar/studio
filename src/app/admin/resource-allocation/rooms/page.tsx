"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Edit, Trash2, DoorOpen, Loader2, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO, isValid, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { cn } from "@/lib/utils";
import type { RoomAllocation, RoomAllocationPurpose, RoomAllocationStatus, DayOfWeek, Room, CourseOffering, Faculty, Committee } from '@/types/entities';
import { roomAllocationService } from '@/lib/api/roomAllocations';
import { roomService } from '@/lib/services/roomService'; 
// Mock services for related entities - replace with actual when available
// import { courseOfferingService } from '@/lib/api/courseOfferings';
// import { facultyService } from '@/lib/api/faculty';
// import { committeeService } from '@/lib/api/committees';

const PURPOSE_OPTIONS: RoomAllocationPurpose[] = ['lecture', 'practical', 'exam', 'event', 'meeting', 'other'];
const STATUS_OPTIONS: {value: RoomAllocationStatus, label: string}[] = [
    {value:'scheduled', label: 'Scheduled'}, 
    {value: 'cancelled', label: 'Cancelled'}, 
    {value:'completed', label: 'Completed'}, 
    {value:'ongoing', label: 'Ongoing'}
];
const DAY_OPTIONS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type SortField = keyof RoomAllocation | 'roomNumber' | 'none';
type SortDirection = 'asc' | 'desc';
const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function RoomAllocationManagementPage() {
  const [allocations, setAllocations] = useState<RoomAllocation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  // const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  // const [faculties, setFaculties] = useState<Faculty[]>([]);
  // const [committees, setCommittees] = useState<Committee[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAllocation, setCurrentAllocation] = useState<Partial<RoomAllocation> | null>(null);

  // Form state
  const [formRoomId, setFormRoomId] = useState<string>('');
  const [formPurpose, setFormPurpose] = useState<RoomAllocationPurpose>('lecture');
  const [formTitle, setFormTitle] = useState('');
  const [formStartTime, setFormStartTime] = useState<Date | undefined>(undefined);
  const [formEndTime, setFormEndTime] = useState<Date | undefined>(undefined);
  const [formDayOfWeek, setFormDayOfWeek] = useState<DayOfWeek | undefined>(undefined);
  const [formIsRecurring, setFormIsRecurring] = useState<boolean>(false);
  const [formStatus, setFormStatus] = useState<RoomAllocationStatus>('scheduled');
  const [formNotes, setFormNotes] = useState('');
  const [formCourseOfferingId, setFormCourseOfferingId] = useState<string | undefined>(undefined);
  const [formFacultyId, setFormFacultyId] = useState<string | undefined>(undefined);
  const [formCommitteeId, setFormCommitteeId] = useState<string | undefined>(undefined);


  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoomId, setFilterRoomId] = useState<string>('all');
  const [filterPurpose, setFilterPurpose] = useState<RoomAllocationPurpose | 'all'>('all');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  const [sortField, setSortField] = useState<SortField>('startTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [allocationsData, roomsData /*, offeringsData, facultyData, committeesData */] = await Promise.all([
          roomAllocationService.getAllRoomAllocations(),
          roomService.getAllRooms(),
          // courseOfferingService.getAll(), 
          // facultyService.getAllFaculty(),
          // committeeService.getAllCommittees(),
        ]);
        setAllocations(allocationsData);
        setRooms(roomsData);
        // setCourseOfferings(offeringsData);
        // setFaculties(facultyData);
        // setCommittees(committeesData);
        if (roomsData.length > 0 && !formRoomId) {
          setFormRoomId(roomsData[0].id);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load initial data." });
      }
      setIsLoading(false);
    };
    fetchInitialData();
  }, [toast, formRoomId]);

  const resetForm = () => {
    setFormRoomId(rooms.length > 0 ? rooms[0].id : '');
    setFormPurpose('lecture');
    setFormTitle('');
    setFormStartTime(undefined);
    setFormEndTime(undefined);
    setFormDayOfWeek(undefined);
    setFormIsRecurring(false);
    setFormStatus('scheduled');
    setFormNotes('');
    setFormCourseOfferingId(undefined);
    setFormFacultyId(undefined);
    setFormCommitteeId(undefined);
    setCurrentAllocation(null);
  };
  
  const handleEdit = (allocation: RoomAllocation) => {
    setCurrentAllocation(allocation);
    setFormRoomId(allocation.roomId);
    setFormPurpose(allocation.purpose);
    setFormTitle(allocation.title || '');
    setFormStartTime(allocation.startTime ? parseISO(allocation.startTime) : undefined);
    setFormEndTime(allocation.endTime ? parseISO(allocation.endTime) : undefined);
    setFormDayOfWeek(allocation.dayOfWeek as DayOfWeek || undefined);
    setFormIsRecurring(allocation.isRecurring || false);
    setFormStatus(allocation.status);
    setFormNotes(allocation.notes || '');
    setFormCourseOfferingId(allocation.courseOfferingId || undefined);
    setFormFacultyId(allocation.facultyId || undefined);
    setFormCommitteeId(allocation.committeeId || undefined);
    setIsDialogOpen(true);
  };

  const handleDelete = async (allocationId: string) => {
    setIsSubmitting(true);
    try {
      await roomAllocationService.deleteRoomAllocation(allocationId);
      const updatedAllocations = await roomAllocationService.getAllRoomAllocations();
      setAllocations(updatedAllocations);
      toast({ title: "Allocation Deleted", description: "The room allocation has been successfully deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formRoomId || !formStartTime || !formEndTime) {
      toast({ variant: "destructive", title: "Validation Error", description: "Room, Start Time, and End Time are required."});
      return;
    }
    if (formStartTime >= formEndTime) {
      toast({ variant: "destructive", title: "Validation Error", description: "End time must be after start time."});
      return;
    }

    setIsSubmitting(true);
    const allocationData: Omit<RoomAllocation, 'id' | 'createdAt' | 'updatedAt'> = {
      roomId: formRoomId,
      purpose: formPurpose,
      title: formTitle.trim() || undefined,
      startTime: format(formStartTime, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      endTime: format(formEndTime, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      dayOfWeek: formDayOfWeek,
      isRecurring: formIsRecurring,
      status: formStatus,
      notes: formNotes.trim() || undefined,
      courseOfferingId: formCourseOfferingId,
      facultyId: formFacultyId,
      committeeId: formCommitteeId,
    };

    try {
      if (currentAllocation && currentAllocation.id) {
        await roomAllocationService.updateRoomAllocation(currentAllocation.id, allocationData);
        toast({ title: "Allocation Updated", description: "The room allocation has been successfully updated." });
      } else {
        await roomAllocationService.createRoomAllocation(allocationData);
        toast({ title: "Allocation Created", description: "The new room allocation has been successfully created." });
      }
      const updatedAllocations = await roomAllocationService.getAllRoomAllocations();
      setAllocations(updatedAllocations);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDateTimeChange = (date: Date | undefined, field: 'startTime' | 'endTime', type: 'date' | 'time', value?: string) => {
    const setFunction = field === 'startTime' ? setFormStartTime : setFormEndTime;
    const currentValue = field === 'startTime' ? formStartTime : formEndTime;

    if (type === 'date' && date) {
        const existingTime = currentValue || new Date();
        const newDate = setHours(setMinutes(setSeconds(setMilliseconds(date,0),existingTime.getSeconds()), existingTime.getMinutes()), existingTime.getHours());
        setFunction(newDate);
    } else if (type === 'time' && value) {
        const [hours, minutes] = value.split(':').map(Number);
        const newDateWithTime = setHours(setMinutes(currentValue || new Date(), minutes), hours);
        setFunction(newDateWithTime);
    }
  };

  const filteredAndSortedAllocations = useMemo(() => {
    let result = [...allocations];
    if (searchTerm) {
      result = result.filter(a => 
        (a.title && a.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rooms.find(r=>r.id === a.roomId)?.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.notes && a.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterRoomId !== 'all') {
      result = result.filter(a => a.roomId === filterRoomId);
    }
    if (filterPurpose !== 'all') {
      result = result.filter(a => a.purpose === filterPurpose);
    }
    if (filterDate) {
      const dateStr = format(filterDate, 'yyyy-MM-dd');
      result = result.filter(a => a.startTime.startsWith(dateStr));
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: unknown = a[sortField as keyof RoomAllocation];
        let valB: unknown = b[sortField as keyof RoomAllocation];
        if (sortField === 'roomNumber') {
            valA = rooms.find(r=>r.id === a.roomId)?.roomNumber || '';
            valB = rooms.find(r=>r.id === b.roomId)?.roomNumber || '';
        }
        if (sortField === 'startTime' || sortField === 'endTime') {
            valA = new Date(valA as string | number | Date).getTime();
            valB = new Date(valB as string | number | Date).getTime();
        }
        if (typeof valA === 'string' && typeof valB === 'string') return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        if (typeof valA === 'number' && typeof valB === 'number') return sortDirection === 'asc' ? valA - valB : valB - valA;
        return 0;
      });
    }
    return result;
  }, [allocations, searchTerm, filterRoomId, filterPurpose, filterDate, sortField, sortDirection, rooms]);

  const totalPages = Math.ceil(filteredAndSortedAllocations.length / itemsPerPage);
  const paginatedAllocations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedAllocations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedAllocations, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterRoomId, filterPurpose, filterDate, itemsPerPage]);

  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => { setSortField(field); setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">{label}{sortField === field && <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" />}{sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}</div>
    </TableHead>
  );


  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2"><DoorOpen className="h-6 w-6" />Room Allocation Management</CardTitle>
            <CardDescription>Schedule and manage room bookings for various purposes.</CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} disabled={rooms.length === 0}><PlusCircle className="mr-2 h-5 w-5" />New Allocation</Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg">
            <div><Label htmlFor="searchTerm">Search Title/Room/Notes</Label><Input id="searchTerm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Keyword..." /></div>
            <div><Label htmlFor="filterRoom">Filter by Room</Label><Select value={filterRoomId} onValueChange={setFilterRoomId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Rooms</SelectItem>{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.roomNumber} ({r.name || r.type})</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="filterPurpose">Filter by Purpose</Label><Select value={filterPurpose} onValueChange={val => setFilterPurpose(val as RoomAllocationPurpose | 'all')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Purposes</SelectItem>{PURPOSE_OPTIONS.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="filterDate">Filter by Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !filterDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{filterDate ? format(filterDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterDate} onSelect={setFilterDate} initialFocus /></PopoverContent></Popover></div>
          </div>

          <Table>
            <TableHeader><TableRow><SortableTableHeader field="roomNumber" label="Room" /><SortableTableHeader field="title" label="Title" /><SortableTableHeader field="purpose" label="Purpose" /><SortableTableHeader field="startTime" label="Start Time" /><SortableTableHeader field="endTime" label="End Time" /><SortableTableHeader field="status" label="Status" /><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {paginatedAllocations.map((alloc) => (
                <TableRow key={alloc.id}>
                  <TableCell>{rooms.find(r=>r.id === alloc.roomId)?.roomNumber || 'N/A'}</TableCell>
                  <TableCell>{alloc.title || '-'}</TableCell>
                  <TableCell>{alloc.purpose}</TableCell>
                  <TableCell>{format(parseISO(alloc.startTime), "Pp")}</TableCell>
                  <TableCell>{format(parseISO(alloc.endTime), "Pp")}</TableCell>
                  <TableCell><span className={`px-2 py-1 text-xs font-semibold rounded-full ${alloc.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200' : alloc.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200' : alloc.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200'}`}>{STATUS_OPTIONS.find(s => s.value === alloc.status)?.label || alloc.status}</span></TableCell>
                  <TableCell className="text-right space-x-2"><Button variant="outline" size="icon" onClick={() => handleEdit(alloc)}><Edit className="h-4 w-4" /></Button><Button variant="destructive" size="icon" onClick={() => handleDelete(alloc.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
              {paginatedAllocations.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No allocations found. Try adjusting filters.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">Showing {paginatedAllocations.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedAllocations.length): 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedAllocations.length)} of {filteredAndSortedAllocations.length} allocations.</div>
            <div className="flex items-center gap-2">
                 <Select value={String(itemsPerPage)} onValueChange={(value) => {setItemsPerPage(Number(value)); setCurrentPage(1);}}><SelectTrigger className="w-[70px] h-8 text-xs"><SelectValue placeholder={String(itemsPerPage)} /></SelectTrigger><SelectContent side="top">{ITEMS_PER_PAGE_OPTIONS.map(sz => <SelectItem key={sz} value={String(sz)} className="text-xs">{sz}</SelectItem>)}</SelectContent></Select>
                <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}><ChevronsRight className="h-4 w-4" /></Button>
                </div>
            </div>
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={isOpen => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
        <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{currentAllocation?.id ? "Edit Allocation" : "New Allocation"}</DialogTitle><DialogDescription>Fill in the details for the room allocation.</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div><Label htmlFor="formRoomId">Room *</Label><Select value={formRoomId} onValueChange={setFormRoomId} disabled={isSubmitting || rooms.length === 0} required><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.roomNumber} ({r.name || r.type})</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="formTitle">Title (Optional)</Label><Input id="formTitle" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g., CS101 Lecture" disabled={isSubmitting} /></div>
            <div><Label htmlFor="formPurpose">Purpose *</Label><Select value={formPurpose} onValueChange={val => setFormPurpose(val as RoomAllocationPurpose)} disabled={isSubmitting} required><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PURPOSE_OPTIONS.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="formStartTimeDate">Start Date & Time *</Label>
              <div className="flex gap-2">
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-1/2 justify-start text-left font-normal", !formStartTime && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{formStartTime ? format(formStartTime, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formStartTime} onSelect={(date) => handleDateTimeChange(date, 'startTime', 'date')} initialFocus /></PopoverContent></Popover>
                <Input type="time" className="w-1/2" value={formStartTime ? format(formStartTime, "HH:mm") : ""} onChange={e => handleDateTimeChange(undefined, 'startTime', 'time', e.target.value)} required/>
              </div>
            </div>
             <div><Label htmlFor="formEndTimeDate">End Date & Time *</Label>
              <div className="flex gap-2">
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-1/2 justify-start text-left font-normal", !formEndTime && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{formEndTime ? format(formEndTime, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formEndTime} onSelect={(date) => handleDateTimeChange(date, 'endTime', 'date')} initialFocus /></PopoverContent></Popover>
                <Input type="time" className="w-1/2" value={formEndTime ? format(formEndTime, "HH:mm") : ""} onChange={e => handleDateTimeChange(undefined, 'endTime', 'time', e.target.value)} required/>
              </div>
            </div>
            <div><Label htmlFor="formStatus">Status *</Label><Select value={formStatus} onValueChange={val => setFormStatus(val as RoomAllocationStatus)} disabled={isSubmitting} required><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="formNotes">Notes</Label><Textarea id="formNotes" value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Additional details..." disabled={isSubmitting} /></div>
            {/* Add Selects for CourseOffering, Faculty, Committee if needed, populating from fetched data */}
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{currentAllocation?.id ? "Save Changes" : "Create Allocation"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}