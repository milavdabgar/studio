"use client";

import React, { useState, useEffect, FormEvent, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Edit, Trash2, Clock, Loader2, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Eye} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// import { Textarea } from '@/components/ui/textarea'; // Not used in current implementation
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import type { Timetable, TimetableEntry, TimetableStatus, DayOfWeek, Program, Batch, CourseOffering, Faculty, Room, Course } from '@/types/entities';
import { timetableService } from '@/lib/api/timetables';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { courseOfferingService } from '@/lib/api/courseOfferings'; 
import { facultyService } from '@/lib/api/faculty';
import { roomService } from '@/lib/services/roomService';
import { courseService } from '@/lib/api/courses';


const STATUS_OPTIONS: {value: TimetableStatus, label: string}[] = [
    {value:'draft', label: 'Draft'}, 
    {value: 'published', label: 'Published'}, 
    {value:'archived', label: 'Archived'}
];
const DAY_OPTIONS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type SortField = keyof Timetable | 'programName' | 'batchName' | 'none';
type SortDirection = 'asc' | 'desc';
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

export default function TimetableManagementPage() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);


  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentTimetable, setCurrentTimetable] = useState<Partial<Timetable> | null>(null);
  const [viewTimetable, setViewTimetable] = useState<Timetable | null>(null);
  const [currentEntries, setCurrentEntries] = useState<TimetableEntry[]>([]);

  // Form state for Timetable
  const [formName, setFormName] = useState('');
  const [formAcademicYear, setFormAcademicYear] = useState('');
  const [formSemester, setFormSemester] = useState<number>(1);
  const [formProgramId, setFormProgramId] = useState<string>('');
  const [formBatchId, setFormBatchId] = useState<string>('');
  const [formVersion, setFormVersion] = useState('1.0');
  const [formStatus, setFormStatus] = useState<TimetableStatus>('draft');
  const [formEffectiveDate, setFormEffectiveDate] = useState<Date | undefined>(new Date());

  // Form state for TimetableEntry (within the dialog)
  const [entryDayOfWeek, setEntryDayOfWeek] = useState<DayOfWeek>('Monday');
  const [entryStartTime, setEntryStartTime] = useState<string>('09:00');
  const [entryEndTime, setEntryEndTime] = useState<string>('10:00');
  const [entryCourseOfferingId, setEntryCourseOfferingId] = useState<string>('');
  const [entryFacultyId, setEntryFacultyId] = useState<string>('');
  const [entryRoomId, setEntryRoomId] = useState<string>('');
  const [entryType, setEntryType] = useState<'lecture' | 'lab' | 'tutorial' | 'break' | 'other'>('lecture');
  const [entryEditingIndex, setEntryEditingIndex] = useState<number | null>(null);


  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<TimetableStatus | 'all'>('all');

  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedTimetableIds, setSelectedTimetableIds] = useState<string[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [ttData, progData, batchData, coData, facData, roomData, crsData] = await Promise.all([
          timetableService.getAllTimetables(),
          programService.getAllPrograms(),
          batchService.getAllBatches(),
          courseOfferingService.getAllCourseOfferings(),
          facultyService.getAllFaculty(),
          roomService.getAllRooms(),
          courseService.getAllCourses(),
        ]);
        setTimetables(ttData);
        setPrograms(progData);
        setBatches(batchData);
        setCourseOfferings(coData);
        setFaculties(facData);
        setRooms(roomData);
        setCourses(crsData);


        if (progData.length > 0 && !formProgramId) setFormProgramId(progData[0].id);
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not load initial data." });
      }
      setIsLoading(false);
    };
    fetchInitialData();
  }, [formProgramId, toast]);
  
  const filteredBatchesForForm = useMemo(() => {
      if(!formProgramId) return [];
      return batches.filter(b => b.programId === formProgramId);
  }, [formProgramId, batches]);

  const filteredCourseOfferingsForEntry = useMemo(() => {
      if(!formBatchId || !formSemester || !formAcademicYear) return [];
      return courseOfferings.filter(co => 
        co.batchId === formBatchId && 
        co.semester === formSemester && 
        co.academicYear === formAcademicYear
      );
  }, [formBatchId, formSemester, formAcademicYear, courseOfferings]);

  const availableFacultiesForEntry = useMemo(() => {
    if (!entryCourseOfferingId) return faculties;
    const selectedCourseOffering = courseOfferings.find(co => co.id === entryCourseOfferingId);
    if (!selectedCourseOffering?.facultyIds?.length) return faculties;
    return faculties.filter(f => selectedCourseOffering.facultyIds.includes(f.id));
  }, [entryCourseOfferingId, courseOfferings, faculties]);

  const availableRoomsForEntry = useMemo(() => {
    if (!entryCourseOfferingId) return rooms;
    const selectedCourseOffering = courseOfferings.find(co => co.id === entryCourseOfferingId);
    if (!selectedCourseOffering?.roomIds?.length) return rooms;
    return rooms.filter(r => selectedCourseOffering.roomIds!.includes(r.id));
  }, [entryCourseOfferingId, courseOfferings, rooms]);

  useEffect(() => {
      if(filteredBatchesForForm.length > 0 && !filteredBatchesForForm.find(b => b.id === formBatchId)){
          setFormBatchId(filteredBatchesForForm[0].id);
      } else if (filteredBatchesForForm.length === 0 && formProgramId) { 
          setFormBatchId('');
      }
  }, [formProgramId, filteredBatchesForForm, formBatchId]);

  // Reset entry fields when course offering changes to ensure valid selections
  useEffect(() => {
    if (!availableFacultiesForEntry.find(f => f.id === entryFacultyId)) {
      setEntryFacultyId('');
    }
  }, [entryCourseOfferingId, availableFacultiesForEntry, entryFacultyId]);

  useEffect(() => {
    if (!availableRoomsForEntry.find(r => r.id === entryRoomId)) {
      setEntryRoomId('');
    }
  }, [entryCourseOfferingId, availableRoomsForEntry, entryRoomId]);


  const resetForm = () => {
    setFormName(''); setFormAcademicYear(''); setFormSemester(1);
    setFormProgramId(programs.length > 0 ? programs[0].id : '');
    setFormBatchId(filteredBatchesForForm.length > 0 ? filteredBatchesForForm[0].id : '');
    setFormVersion('1.0'); setFormStatus('draft'); setFormEffectiveDate(new Date());
    setCurrentEntries([]); setCurrentTimetable(null); setEntryEditingIndex(null);
  };
  
  const handleView = (timetable: Timetable) => {
    setViewTimetable(timetable);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (timetable: Timetable) => {
    setCurrentTimetable(timetable);
    setFormName(timetable.name);
    setFormAcademicYear(timetable.academicYear);
    setFormSemester(timetable.semester);
    setFormProgramId(timetable.programId);
    setFormBatchId(timetable.batchId || ''); 
    setFormVersion(timetable.version);
    setFormStatus(timetable.status);
    setFormEffectiveDate(timetable.effectiveDate ? parseISO(timetable.effectiveDate) : new Date());
    setCurrentEntries([...timetable.entries]);
    setIsDialogOpen(true);
  };

  const handleDelete = async (timetableId: string) => {
    setIsSubmitting(true);
    try {
      await timetableService.deleteTimetable(timetableId);
      setTimetables(prev => prev.filter(t => t.id !== timetableId));
      setSelectedTimetableIds(prev => prev.filter(id => id !== timetableId));
      toast({ title: "Timetable Deleted", description: "The timetable has been successfully deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message });
    }
    setIsSubmitting(false);
  };


  const addEntry = () => {
    if (!entryCourseOfferingId || !entryFacultyId || !entryRoomId) {
        toast({variant: "destructive", title: "Missing Entry Details", description: "Please select Course Offering, Faculty and Room for the entry."});
        return;
    }
     if(entryStartTime >= entryEndTime) {
        toast({variant: "destructive", title: "Invalid Time", description: "End time must be after start time."});
        return;
    }

    const newEntry: TimetableEntry = {
      dayOfWeek: entryDayOfWeek,
      startTime: entryStartTime,
      endTime: entryEndTime,
      courseOfferingId: entryCourseOfferingId,
      courseId: courseOfferings.find(co => co.id === entryCourseOfferingId)?.courseId || '', // Store courseId for easier access
      facultyId: entryFacultyId,
      roomId: entryRoomId,
      entryType: entryType,
    };

    const conflict = currentEntries.find((e, idx) => 
        idx !== entryEditingIndex && 
        e.dayOfWeek === newEntry.dayOfWeek &&
        e.roomId === newEntry.roomId &&
        !(newEntry.endTime <= e.startTime || newEntry.startTime >= e.endTime) 
    );
    if(conflict) {
        toast({variant: "destructive", title: "Slot Conflict", description: `Room ${rooms.find(r=>r.id === conflict.roomId)?.roomNumber || 'selected'} is already booked for ${conflict.dayOfWeek} between ${conflict.startTime}-${conflict.endTime}.`});
        return;
    }
    
    if(entryEditingIndex !== null) {
        const updatedEntries = [...currentEntries];
        updatedEntries[entryEditingIndex] = newEntry;
        setCurrentEntries(updatedEntries);
        setEntryEditingIndex(null);
    } else {
      setCurrentEntries(prev => [...prev, newEntry]);
    }
    setEntryDayOfWeek('Monday'); setEntryStartTime('09:00'); setEntryEndTime('10:00');
    setEntryCourseOfferingId(''); setEntryFacultyId(''); setEntryRoomId(''); setEntryType('lecture');
  };
  
  const editExistingEntry = (entry: TimetableEntry, index: number) => {
    setEntryDayOfWeek(entry.dayOfWeek);
    setEntryStartTime(entry.startTime);
    setEntryEndTime(entry.endTime);
    setEntryCourseOfferingId(entry.courseOfferingId || '');
    setEntryFacultyId(entry.facultyId);
    setEntryRoomId(entry.roomId);
    setEntryType(entry.entryType);
    setEntryEditingIndex(index);
  };


  const removeEntry = (index: number) => {
    setCurrentEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleTimetableSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formName.trim() || !formProgramId || !formBatchId || !formAcademicYear.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name, Program, Batch, and Academic Year are required."});
      return;
    }
    setIsSubmitting(true);
    const timetableData: Omit<Timetable, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formName.trim(), academicYear: formAcademicYear.trim(), semester: Number(formSemester),
      programId: formProgramId, batchId: formBatchId, version: formVersion, status: formStatus,
      effectiveDate: formEffectiveDate ? format(formEffectiveDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : new Date().toISOString(),
      entries: currentEntries,
    };

    try {
      if (currentTimetable && currentTimetable.id) {
        await timetableService.updateTimetable(currentTimetable.id, timetableData);
        toast({ title: "Timetable Updated", description: "Successfully updated." });
      } else {
        await timetableService.createTimetable(timetableData);
        toast({ title: "Timetable Created", description: "Successfully created." });
      }
      const updatedTTs = await timetableService.getAllTimetables();
      setTimetables(updatedTTs);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const filteredTimetables = useMemo(() => {
      let result = [...timetables];
      if (searchTerm) {
        result = result.filter(tt => tt.name.toLowerCase().includes(searchTerm.toLowerCase()) || tt.academicYear.includes(searchTerm));
      }
      if (filterProgram !== 'all') result = result.filter(tt => tt.programId === filterProgram);
      if (filterBatch !== 'all') result = result.filter(tt => tt.batchId === filterBatch);
      if (filterStatus !== 'all') result = result.filter(tt => tt.status === filterStatus);
      return result;
  }, [timetables, searchTerm, filterProgram, filterBatch, filterStatus]);

  const sortedTimetables = useMemo(() => {
    const sorted = [...filteredTimetables];
    if (sortField !== 'none') {
      sorted.sort((a, b) => {
        let valA: unknown = a[sortField as keyof Timetable];
        let valB: unknown = b[sortField as keyof Timetable];
        if (sortField === 'programName') {
            valA = programs.find(p => p.id === a.programId)?.name || '';
            valB = programs.find(p => p.id === b.programId)?.name || '';
        } else if (sortField === 'batchName') {
            valA = batches.find(bt => bt.id === a.batchId)?.name || '';
            valB = batches.find(bt => bt.id === b.batchId)?.name || '';
        }
        if (typeof valA === 'string' && typeof valB === 'string') return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        if (typeof valA === 'number' && typeof valB === 'number') return sortDirection === 'asc' ? valA - valB : valB - valA;
        return 0;
      });
    }
    return sorted;
  }, [filteredTimetables, sortField, sortDirection, programs, batches]);

  const paginatedTimetables = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTimetables.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTimetables, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(sortedTimetables.length / itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterProgram, filterBatch, filterStatus, itemsPerPage]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => setSelectedTimetableIds(checked === true ? paginatedTimetables.map(t => t.id) : []);
  const handleSelectTimetable = (id: string, checked: boolean) => setSelectedTimetableIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  const isAllSelectedOnPage = paginatedTimetables.length > 0 && paginatedTimetables.every(t => selectedTimetableIds.includes(t.id));
  const isSomeSelectedOnPage = paginatedTimetables.some(t => selectedTimetableIds.includes(t.id)) && !isAllSelectedOnPage;

  const handleDeleteSelected = async () => { 
    if(selectedTimetableIds.length === 0) {
      toast({variant: "destructive", title: "No Selection", description: "Please select timetables to delete."});
      return;
    }
    setIsSubmitting(true);
    try {
      for(const id of selectedTimetableIds) {
        await timetableService.deleteTimetable(id);
      }
      setTimetables(prev => prev.filter(t => !selectedTimetableIds.includes(t.id)));
      setSelectedTimetableIds([]);
      toast({title: "Deleted", description: `${selectedTimetableIds.length} timetables deleted.`});
    } catch (error) {
      toast({variant: "destructive", title: "Delete Failed", description: (error as Error).message});
    }
    setIsSubmitting(false);
  }; 

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
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2"><Clock className="h-6 w-6" />Timetable Management</CardTitle>
            <CardDescription>Create, publish, and manage academic timetables.</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} disabled={programs.length === 0 || batches.length === 0}><PlusCircle className="mr-2 h-5 w-5" />New Timetable</Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg dark:border-gray-700">
            <div><Label htmlFor="searchTerm">Search Name/Year</Label><Input id="searchTerm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Keyword..." /></div>
            <div><Label htmlFor="filterProgram">Filter Program</Label><Select value={filterProgram} onValueChange={setFilterProgram}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Programs</SelectItem>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="filterBatch">Filter Batch</Label><Select value={filterBatch} onValueChange={setFilterBatch} disabled={filterProgram === 'all'}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Batches</SelectItem>{batches.filter(b=>b.programId === filterProgram).map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="filterStatus">Filter Status</Label><Select value={filterStatus} onValueChange={val => setFilterStatus(val as TimetableStatus | 'all')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
            {selectedTimetableIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedTimetableIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedTimetableIds.length} timetable(s) selected.
                </span>
            </div>
          )}

          <Table>
            <TableHeader><TableRow><TableHead className="w-[50px]"><Checkbox checked={isAllSelectedOnPage || (paginatedTimetables.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)} onCheckedChange={(val) => handleSelectAll(val as boolean | 'indeterminate')}/></TableHead><SortableTableHeader field="name" label="Name" /><SortableTableHeader field="programName" label="Program" /><SortableTableHeader field="batchName" label="Batch" /><SortableTableHeader field="academicYear" label="Academic Year" /><SortableTableHeader field="status" label="Status" /><TableHead className="text-right w-32">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {paginatedTimetables.map((tt) => (
                <TableRow key={tt.id} data-state={selectedTimetableIds.includes(tt.id) ? "selected" : undefined}>
                  <TableCell><Checkbox checked={selectedTimetableIds.includes(tt.id)} onCheckedChange={(checked) => handleSelectTimetable(tt.id, !!checked)}/></TableCell>
                  <TableCell className="font-medium">{tt.name} (v{tt.version})</TableCell>
                  <TableCell>{programs.find(p=>p.id===tt.programId)?.name || 'N/A'}</TableCell>
                  <TableCell>{batches.find(b=>b.id===tt.batchId)?.name || 'N/A'}</TableCell>
                  <TableCell>{tt.academicYear} Sem-{tt.semester}</TableCell>
                  <TableCell><span className={`px-2 py-1 text-xs font-semibold rounded-full ${tt.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200' : tt.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200'}`}>{STATUS_OPTIONS.find(s=>s.value === tt.status)?.label || tt.status}</span></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="icon" onClick={() => handleView(tt)} disabled={isSubmitting}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Timetable</span>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleEdit(tt)} disabled={isSubmitting}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit Timetable</span>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(tt.id)} disabled={isSubmitting}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Timetable</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedTimetables.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No timetables found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
             <div className="text-sm text-muted-foreground">Showing {paginatedTimetables.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, sortedTimetables.length): 0} to {Math.min(currentPage * itemsPerPage, sortedTimetables.length)} of {sortedTimetables.length} timetables.</div>
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
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>{currentTimetable?.id ? "Edit Timetable" : "New Timetable"}</DialogTitle><DialogDescription>Define timetable details and add entries.</DialogDescription></DialogHeader>
          <form id="timetableForm" onSubmit={handleTimetableSubmit} className="space-y-4 py-2 overflow-y-auto flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label htmlFor="ttName">Name *</Label><Input id="ttName" value={formName} onChange={e => setFormName(e.target.value)} required/></div>
              <div><Label htmlFor="ttAcadYear">Academic Year *</Label><Input id="ttAcadYear" value={formAcademicYear} onChange={e => setFormAcademicYear(e.target.value)} placeholder="e.g. 2024-25" required/></div>
              <div><Label htmlFor="ttSemester">Semester *</Label><Input id="ttSemester" type="number" value={formSemester} onChange={e => setFormSemester(Number(e.target.value))} required min={1} max={8}/></div>
              <div><Label htmlFor="ttProgram">Program *</Label><Select value={formProgramId} onValueChange={setFormProgramId} required><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label htmlFor="ttBatch">Batch *</Label><Select value={formBatchId} onValueChange={setFormBatchId} required disabled={!formProgramId || filteredBatchesForForm.length === 0}><SelectTrigger><SelectValue placeholder={!formProgramId ? "Select Program First" : (filteredBatchesForForm.length === 0 ? "No batches for program" : "Select Batch")} /></SelectTrigger><SelectContent>{filteredBatchesForForm.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label htmlFor="ttVersion">Version</Label><Input id="ttVersion" value={formVersion} onChange={e => setFormVersion(e.target.value)} /></div>
              <div><Label htmlFor="ttStatus">Status</Label><Select value={formStatus} onValueChange={val => setFormStatus(val as TimetableStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label htmlFor="ttEffectiveDate">Effective Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !formEffectiveDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{formEffectiveDate ? format(formEffectiveDate, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formEffectiveDate} onSelect={setFormEffectiveDate} /></PopoverContent></Popover></div>
            </div>
            <h4 className="text-md font-semibold pt-4 border-t mt-4 dark:border-gray-700">Timetable Entries</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border p-3 rounded-md dark:border-gray-700">
                <div><Label>Day</Label><Select value={entryDayOfWeek} onValueChange={val => setEntryDayOfWeek(val as DayOfWeek)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{DAY_OPTIONS.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Start Time</Label><Input type="time" value={entryStartTime} onChange={e=>setEntryStartTime(e.target.value)} /></div>
                <div><Label>End Time</Label><Input type="time" value={entryEndTime} onChange={e=>setEntryEndTime(e.target.value)} /></div>
                <div><Label>Type</Label><Select value={entryType} onValueChange={val => setEntryType(val as 'lecture' | 'lab' | 'tutorial' | 'break' | 'other')}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['lecture','lab','tutorial','break','other'].map(t=><SelectItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>)}</SelectContent></Select></div>
                <div className="md:col-span-2">
                  <Label>Course Offering</Label>
                  <Select value={entryCourseOfferingId} onValueChange={setEntryCourseOfferingId} disabled={!formBatchId || !formSemester || !formAcademicYear}>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formBatchId || !formSemester || !formAcademicYear 
                          ? "Complete form fields above" 
                          : filteredCourseOfferingsForEntry.length === 0
                            ? "No course offerings found"
                            : "Select Course Offering"
                      }/>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCourseOfferingsForEntry.length > 0 ? (
                        filteredCourseOfferingsForEntry.map(co => (
                          <SelectItem key={co.id} value={co.id}>
                            {courses.find(c=>c.id===co.courseId)?.subjectName} ({courses.find(c=>c.id===co.courseId)?.subjectCode})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-options" disabled>
                          No course offerings available for {formAcademicYear} Semester {formSemester}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {formBatchId && formSemester && formAcademicYear && filteredCourseOfferingsForEntry.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No course offerings found for the selected batch, semester, and academic year. 
                      <br />Create course offerings first in Course Management.
                    </p>
                  )}
                </div>
                <div>
                  <Label>Faculty</Label>
                  <Select value={entryFacultyId} onValueChange={setEntryFacultyId}>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        entryCourseOfferingId && availableFacultiesForEntry.length === 0
                          ? "No faculty assigned to course"
                          : "Select Faculty"
                      }/>
                    </SelectTrigger>
                    <SelectContent>
                      {availableFacultiesForEntry.length > 0 ? (
                        availableFacultiesForEntry.map(f => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.gtuName || `${f.firstName} ${f.lastName}`}
                            {entryCourseOfferingId && availableFacultiesForEntry.length < faculties.length && (
                              <span className="text-xs text-muted-foreground"> (Assigned)</span>
                            )}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-faculty" disabled>
                          No faculty available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Room</Label>
                  <Select value={entryRoomId} onValueChange={setEntryRoomId}>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        entryCourseOfferingId && availableRoomsForEntry.length === 0
                          ? "No rooms assigned to course"
                          : "Select Room"
                      }/>
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoomsForEntry.length > 0 ? (
                        availableRoomsForEntry.map(r => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.roomNumber} ({r.name || r.type})
                            {entryCourseOfferingId && availableRoomsForEntry.length < rooms.length && (
                              <span className="text-xs text-muted-foreground"> (Assigned)</span>
                            )}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-room" disabled>
                          No rooms available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-4 text-right">
                    <Button type="button" onClick={addEntry} size="sm">{entryEditingIndex !== null ? 'Update Entry' : 'Add Entry'}</Button>
                    {entryEditingIndex !== null && <Button type="button" variant="ghost" size="sm" onClick={() => {setEntryEditingIndex(null); setEntryDayOfWeek('Monday'); setEntryStartTime('09:00'); setEntryEndTime('10:00'); setEntryCourseOfferingId(''); setEntryFacultyId(''); setEntryRoomId(''); setEntryType('lecture'); }}>Cancel Edit</Button>}
                </div>
            </div>
            <div className="max-h-60 overflow-y-auto border rounded-md dark:border-gray-700">
                {currentEntries.length > 0 ? <Table><TableHeader><TableRow><TableHead>Day</TableHead><TableHead>Time</TableHead><TableHead>Course</TableHead><TableHead>Faculty</TableHead><TableHead>Room</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>{currentEntries.map((entry, index) => (
                    <TableRow key={index}>
                        <TableCell>{entry.dayOfWeek}</TableCell><TableCell>{entry.startTime}-{entry.endTime}</TableCell>
                        <TableCell>{courses.find(c=>c.id === (entry.courseId))?.subjectName || 'N/A'}</TableCell>
                        <TableCell>{faculties.find(f=>f.id===entry.facultyId)?.gtuName?.split(' ')[0] || 'N/A'}</TableCell>
                        <TableCell>{rooms.find(r=>r.id===entry.roomId)?.roomNumber || 'N/A'}</TableCell>
                        <TableCell className="space-x-1">
                            <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={()=>editExistingEntry(entry, index)}><Edit className="h-3 w-3"/></Button>
                            <Button type="button" variant="destructive" size="icon" className="h-6 w-6" onClick={()=>removeEntry(index)}><Trash2 className="h-3 w-3"/></Button>
                        </TableCell>
                    </TableRow>
                ))}</TableBody></Table> : <p className="p-4 text-sm text-muted-foreground text-center">No entries added yet.</p>}
            </div>
          </form>
          <DialogFooter className="pt-4 border-t mt-auto dark:border-gray-700"> 
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
            <Button type="submit" form="timetableForm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentTimetable?.id ? "Save Changes" : "Create Timetable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Timetable Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Timetable Details</DialogTitle>
            <DialogDescription>
              View detailed information about the timetable.
            </DialogDescription>
          </DialogHeader>
          {viewTimetable && (
            <div className="grid gap-6 py-4">
              <div className="grid gap-4">
                <h4 className="font-semibold text-primary border-b pb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                    <p className="text-sm">{viewTimetable.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Version</Label>
                    <p className="text-sm">{viewTimetable.version}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Academic Year</Label>
                    <p className="text-sm">{viewTimetable.academicYear}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Semester</Label>
                    <p className="text-sm">{viewTimetable.semester}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <p className="text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        viewTimetable.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200' 
                        : viewTimetable.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200'
                      }`}>
                        {STATUS_OPTIONS.find(s => s.value === viewTimetable.status)?.label || viewTimetable.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Effective Date</Label>
                    <p className="text-sm">{viewTimetable.effectiveDate ? format(parseISO(viewTimetable.effectiveDate), 'PPP') : 'Not set'}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <h4 className="font-semibold text-primary border-b pb-2">Program & Batch Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Program</Label>
                    <p className="text-sm">{programs.find(p => p.id === viewTimetable.programId)?.name || 'Not found'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Program Code</Label>
                    <p className="text-sm">{programs.find(p => p.id === viewTimetable.programId)?.code || 'Not found'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Batch</Label>
                    <p className="text-sm">{batches.find(b => b.id === viewTimetable.batchId)?.name || 'Not found'}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <h4 className="font-semibold text-primary border-b pb-2">Timetable Entries ({viewTimetable.entries.length})</h4>
                {viewTimetable.entries.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Day</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Faculty</TableHead>
                          <TableHead>Room</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewTimetable.entries.map((entry, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{entry.dayOfWeek}</TableCell>
                            <TableCell>{entry.startTime} - {entry.endTime}</TableCell>
                            <TableCell className="capitalize">{entry.entryType}</TableCell>
                            <TableCell>{courses.find(c => c.id === entry.courseId)?.subjectName || 'N/A'}</TableCell>
                            <TableCell>{faculties.find(f => f.id === entry.facultyId)?.gtuName || faculties.find(f => f.id === entry.facultyId)?.firstName + ' ' + faculties.find(f => f.id === entry.facultyId)?.lastName || 'N/A'}</TableCell>
                            <TableCell>{rooms.find(r => r.id === entry.roomId)?.roomNumber || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No entries added to this timetable yet.</p>
                )}
              </div>

              <div className="grid gap-4">
                <h4 className="font-semibold text-primary border-b pb-2">System Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Timetable ID</Label>
                    <p className="text-sm font-mono">{viewTimetable.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                    <p className="text-sm">{viewTimetable.createdAt ? new Date(viewTimetable.createdAt).toLocaleString() : 'Not available'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p className="text-sm">{viewTimetable.updatedAt ? new Date(viewTimetable.updatedAt).toLocaleString() : 'Not available'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
