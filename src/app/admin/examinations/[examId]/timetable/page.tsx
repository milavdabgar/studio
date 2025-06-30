"use client";

import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Edit2, Trash2, Loader2, ArrowLeft, ListChecks, Download, UploadCloud, BookCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import type { Examination, ExaminationTimeTableEntry, Course, Room, User } from '@/types/entities';
import { examinationService } from '@/lib/api/examinations';
import { courseService } from '@/lib/api/courses';
import { roomService } from '@/lib/services/roomService';
import { userService } from '@/lib/api/users'; // For faculty/invigilators


export default function ExamTimetablePage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [examination, setExamination] = useState<Examination | null>(null);
  const [timetableEntries, setTimetableEntries] = useState<ExaminationTimeTableEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [invigilators, setInvigilators] = useState<Omit<User, "password">[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Partial<ExaminationTimeTableEntry> & { tempId?: string } | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Form state for timetable entry
  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formDate, setFormDate] = useState<Date | undefined>(new Date());
  const [formStartTime, setFormStartTime] = useState<string>('10:00'); // HH:mm format
  const [formEndTime, setFormEndTime] = useState<string>('13:00');   // HH:mm format
  const [formRoomId, setFormRoomId] = useState<string>('');
  const [formSelectedInvigilators, setFormSelectedInvigilators] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    if (!examId) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [examData, coursesData, roomsData, usersData] = await Promise.all([
          examinationService.getExaminationById(examId),
          courseService.getAllCourses(),
          roomService.getAllRooms(),
          userService.getAllUsers().then(users => users.filter(u => u.roles.includes('faculty') || u.roles.includes('hod')))
        ]);
        setExamination(examData);
        setTimetableEntries(examData?.examinationTimeTable || []);
        // Filter courses relevant to the programs of this examination
        const relevantCourses = coursesData.filter(c => examData?.programIds.includes(c.programId));
        setCourses(relevantCourses);
        setRooms(roomsData);
        setInvigilators(usersData);

        if (relevantCourses.length > 0 && !formCourseId) setFormCourseId(relevantCourses[0].id);
        if (roomsData.length > 0 && !formRoomId) setFormRoomId(roomsData[0].id);

      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not load examination or related data." });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [examId, toast, formCourseId, formRoomId]);


  const resetEntryForm = useCallback(() => {
    setFormCourseId(courses.length > 0 ? courses[0].id : '');
    setFormDate(new Date());
    setFormStartTime('10:00');
    setFormEndTime('13:00');
    setFormRoomId(rooms.length > 0 ? rooms[0].id : '');
    setFormSelectedInvigilators([]);
    setFormNotes('');
    setEditingEntry(null);
    setEditingItemIndex(null);
  }, [courses, rooms]);

  const handleOpenEntryForm = (entry?: ExaminationTimeTableEntry, index?: number) => {
    if (entry && index !== undefined) {
      setEditingEntry({ ...entry, tempId: entry.id || `temp-${Date.now()}` }); // Use tempId if no id
      setEditingItemIndex(index);
      setFormCourseId(entry.courseId);
      setFormDate(entry.date ? parseISO(entry.date) : new Date());
      setFormStartTime(entry.startTime);
      setFormEndTime(entry.endTime);
      setFormRoomId(entry.roomId || '');
      setFormSelectedInvigilators(entry.invigilatorIds || []);
      setFormNotes(entry.notes || '');
    } else {
      resetEntryForm();
    }
    setIsEntryFormOpen(true);
  };

  const handleEntryFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formCourseId || !formDate || !formStartTime || !formEndTime || !formRoomId) {
      toast({ variant: "destructive", title: "Validation Error", description: "Course, Date, Times, and Room are required." });
      return;
    }
    // Basic time validation
    if (formStartTime >= formEndTime) {
      toast({variant: "destructive", title: "Invalid Time", description: "End time must be after start time."});
      return;
    }

    setIsSubmitting(true);
    const newEntry: ExaminationTimeTableEntry = {
      id: editingEntry?.id || `temp_entry_${Date.now()}`, // Keep existing ID or generate temp one
      examinationId: examId, // This is implied, but good to ensure
      courseId: formCourseId,
      date: format(formDate, "yyyy-MM-dd"), // Store as string
      startTime: formStartTime,
      endTime: formEndTime,
      roomId: formRoomId,
      invigilatorIds: formSelectedInvigilators,
      notes: formNotes.trim() || undefined,
    };

    // Basic conflict detection (client-side for now)
    const conflict = timetableEntries.find((existingEntry, idx) => {
        if (editingItemIndex === idx) return false; // Don't compare with itself when editing
        if (existingEntry.date !== newEntry.date || existingEntry.roomId !== newEntry.roomId) return false;
        // Check for time overlap
        return !(newEntry.endTime <= existingEntry.startTime || newEntry.startTime >= existingEntry.endTime);
    });

    if (conflict) {
        toast({ variant: "destructive", title: "Slot Conflict", description: `Room ${rooms.find(r=>r.id === conflict.roomId)?.roomNumber} is already booked on ${conflict.date} from ${conflict.startTime} to ${conflict.endTime}.`});
        setIsSubmitting(false);
        return;
    }


    let updatedEntries: ExaminationTimeTableEntry[];
    if (editingItemIndex !== null) {
      updatedEntries = timetableEntries.map((item, index) => index === editingItemIndex ? newEntry : item);
    } else {
      updatedEntries = [...timetableEntries, newEntry];
    }
    
    // Persist the entire timetable to the parent Examination object
    try {
      await examinationService.updateExamination(examId, { examinationTimeTable: updatedEntries });
      setTimetableEntries(updatedEntries);
      toast({ title: `Timetable Entry ${editingEntry ? 'Updated' : 'Added'}`, description: "Changes saved to examination." });
      setIsEntryFormOpen(false);
      resetEntryForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (indexToDelete: number) => {
    if (!window.confirm("Are you sure you want to delete this timetable entry?")) return;
    const updatedEntries = timetableEntries.filter((_, index) => index !== indexToDelete);
    setIsSubmitting(true);
    try {
      await examinationService.updateExamination(examId, { examinationTimeTable: updatedEntries });
      setTimetableEntries(updatedEntries);
      toast({ title: "Entry Deleted", description: "Timetable entry removed." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!examination) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground mb-4">Examination not found.</p>
        <Button onClick={() => router.push('/admin/examinations')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Examinations List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/admin/examinations')} className="mb-4 print:hidden">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Examinations List
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                <ListChecks className="h-6 w-6" /> Manage Timetable for: {examination.name}
              </CardTitle>
              <CardDescription>
                Academic Year: {examination.academicYear} | Type: {examination.examType}
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenEntryForm()}><PlusCircle className="mr-2 h-4 w-4"/>Add Timetable Entry</Button>
          </div>
        </CardHeader>
        <CardContent>
          {timetableEntries.length === 0 ? (
            <div className="text-center py-10">
              <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No timetable entries created yet.</p>
              <p className="text-sm text-muted-foreground">Click &quot;Add Timetable Entry&quot; to start building the schedule.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Invigilators</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timetableEntries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.startTime.localeCompare(b.startTime)).map((entry, index) => {
                  const courseName = courses.find(c => c.id === entry.courseId)?.subjectName || 'N/A';
                  const roomName = rooms.find(r => r.id === entry.roomId)?.roomNumber || 'N/A';
                  const invigilatorNames = entry.invigilatorIds?.map(id => invigilators.find(i => i.id === id)?.displayName || 'Unknown').join(', ') || 'N/A';
                  return (
                    <TableRow key={entry.id || `entry-${index}`}>
                      <TableCell>{format(parseISO(entry.date), "PPP")}</TableCell>
                      <TableCell>{entry.startTime} - {entry.endTime}</TableCell>
                      <TableCell>{courseName}</TableCell>
                      <TableCell>{roomName}</TableCell>
                      <TableCell>{invigilatorNames}</TableCell>
                      <TableCell className="text-right space-x-1">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleOpenEntryForm(entry, index)}><Edit2 className="h-4 w-4"/></Button>
                          <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDeleteEntry(index)}><Trash2 className="h-4 w-4"/></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" disabled><Download className="mr-2 h-4 w-4"/>Export Timetable (CSV)</Button>
             <Button variant="outline" disabled><UploadCloud className="mr-2 h-4 w-4"/>Import Timetable (CSV)</Button>
            <Button disabled><BookCheck className="mr-2 h-4 w-4"/>Enter/View Results</Button>
          </div>
           <p className="text-xs text-muted-foreground mt-2 text-right">Note: Import/Export and Result Entry features are placeholders.</p>
        </CardContent>
      </Card>

      <Dialog open={isEntryFormOpen} onOpenChange={(open) => { setIsEntryFormOpen(open); if (!open) resetEntryForm(); }}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{editingEntry ? "Edit Timetable Entry" : "Add New Timetable Entry"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEntryFormSubmit} className="space-y-4 py-2">
                <div>
                    <Label htmlFor="formCourseId">Course *</Label>
                    <Select value={formCourseId} onValueChange={setFormCourseId} required disabled={isSubmitting || courses.length === 0}>
                        <SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger>
                        <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.subjectName} ({c.subcode})</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="formDate">Date *</Label>
                    <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !formDate && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{formDate ? format(formDate, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formDate} onSelect={setFormDate} initialFocus /></PopoverContent></Popover>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="formStartTime">Start Time *</Label><Input id="formStartTime" type="time" value={formStartTime} onChange={e => setFormStartTime(e.target.value)} required disabled={isSubmitting} /></div>
                    <div><Label htmlFor="formEndTime">End Time *</Label><Input id="formEndTime" type="time" value={formEndTime} onChange={e => setFormEndTime(e.target.value)} required disabled={isSubmitting} /></div>
                </div>
                <div>
                    <Label htmlFor="formRoomId">Room *</Label>
                    <Select value={formRoomId} onValueChange={setFormRoomId} required disabled={isSubmitting || rooms.length === 0}>
                        <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger><SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.roomNumber} ({r.name || r.type}) - Cap: {r.capacity || 'N/A'}</SelectItem>)}</SelectContent></Select>
                </div>
                 <div>
                    <Label htmlFor="formInvigilators">Invigilators (Hold Ctrl/Cmd to select multiple)</Label>
                    <Select 
                        value={formSelectedInvigilators.length > 0 ? formSelectedInvigilators[0] : ""} // Simplified for single selection UI for now
                        onValueChange={(value) => setFormSelectedInvigilators(value ? [value] : [])} // Simplified
                        disabled={isSubmitting || invigilators.length === 0}
                    >
                        <SelectTrigger id="formInvigilators"><SelectValue placeholder="Select Invigilator(s)" /></SelectTrigger>
                        <SelectContent className="max-h-48 overflow-y-auto">
                            <SelectItem value="">None</SelectItem>
                            {invigilators.map(inv => <SelectItem key={inv.id} value={inv.id}>{inv.displayName} ({inv.email})</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {/* For proper multi-select, a multi-select component would be needed. This is a simplification. */}
                    {formSelectedInvigilators.length > 0 && <p className="text-xs text-muted-foreground mt-1">Selected: {formSelectedInvigilators.map(id => invigilators.find(i=>i.id===id)?.displayName).join(', ')}</p>}
                </div>
                <div><Label htmlFor="formNotes">Notes</Label><Textarea id="formNotes" value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} placeholder="Any specific instructions or notes" disabled={isSubmitting}/></div>

                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsEntryFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                        {editingEntry ? "Save Changes" : "Add Entry"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
