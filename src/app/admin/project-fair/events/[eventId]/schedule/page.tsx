// src/app/admin/project-fair/events/[eventId]/schedule/page.tsx
"use client";

import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Loader2, ArrowLeft, ListChecks, PlusCircle, Edit2, Trash2} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectEvent, ProjectEventScheduleItem, User as SystemUser } from '@/types/entities';
import { projectEventService } from '@/lib/api/projectEvents';
import { userService } from '@/lib/api/users';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function EventSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string;

  const [event, setEvent] = useState<ProjectEvent | null>(null);
  const [schedule, setSchedule] = useState<ProjectEventScheduleItem[]>([]);
  const [facultyUsers, setFacultyUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectEventScheduleItem | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Form state for schedule item
  const [formTime, setFormTime] = useState(""); // e.g., "09:00 AM - 10:00 AM"
  const [formActivity, setFormActivity] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formCoordinatorId, setFormCoordinatorId] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    if (!eventId) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [eventData, usersData] = await Promise.all([
          projectEventService.getEventById(eventId),
          userService.getAllUsers().then(users => users.filter(u => u.roles.includes('faculty') || u.roles.includes('admin') || u.roles.includes('hod')))
        ]);
        setEvent(eventData);
        setSchedule(eventData.schedule || []);
        setFacultyUsers(usersData);
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not load event schedule data." });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [eventId, toast]);

  const resetForm = () => {
    setFormTime("");
    setFormActivity("");
    setFormLocation("");
    setFormCoordinatorId("");
    setFormNotes("");
    setEditingItem(null);
    setEditingItemIndex(null);
  };

  const handleOpenForm = (item?: ProjectEventScheduleItem, index?: number) => {
    if (item && index !== undefined) {
      setEditingItem(item);
      setEditingItemIndex(index);
      setFormTime(item.time);
      setFormActivity(item.activity);
      setFormLocation(item.location);
      setFormCoordinatorId(item.coordinator.userId);
      setFormNotes(item.notes || "");
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };

  const handleScheduleItemSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formTime.trim() || !formActivity.trim() || !formLocation.trim() || !formCoordinatorId.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Time, Activity, Location, and Coordinator are required." });
      return;
    }
    // Basic time format validation (HH:MM AM/PM - HH:MM AM/PM)
    if (!/^\d{2}:\d{2}\s*(AM|PM|am|pm)\s*-\s*\d{2}:\d{2}\s*(AM|PM|am|pm)$/i.test(formTime.trim())) {
        toast({ variant: "destructive", title: "Validation Error", description: "Time format should be HH:MM AM/PM - HH:MM AM/PM (e.g., 09:00 AM - 10:00 AM)."});
        return;
    }


    setIsSubmitting(true);
    const coordinator = facultyUsers.find(f => f.id === formCoordinatorId);
    if (!coordinator) {
        toast({ variant: "destructive", title: "Validation Error", description: "Selected coordinator not found." });
        setIsSubmitting(false);
        return;
    }

    const newItem: ProjectEventScheduleItem = {
      time: formTime.trim(),
      activity: formActivity.trim(),
      location: formLocation.trim(),
      coordinator: { userId: formCoordinatorId, name: coordinator.displayName },
      notes: formNotes.trim() || undefined,
    };

    let updatedSchedule: ProjectEventScheduleItem[];
    if (editingItem && editingItemIndex !== null) {
      updatedSchedule = schedule.map((item, index) => index === editingItemIndex ? newItem : item);
    } else {
      updatedSchedule = [...schedule, newItem];
    }

    try {
      await projectEventService.updateEventSchedule(eventId, { schedule: updatedSchedule });
      setSchedule(updatedSchedule);
      toast({ title: "Schedule Updated", description: `Schedule item ${editingItem ? 'updated' : 'added'} successfully.` });
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (indexToDelete: number) => {
    if (!window.confirm("Are you sure you want to delete this schedule item?")) return;
    
    const updatedSchedule = schedule.filter((_, index) => index !== indexToDelete);
    setIsSubmitting(true);
    try {
      await projectEventService.updateEventSchedule(eventId, { schedule: updatedSchedule });
      setSchedule(updatedSchedule);
      toast({ title: "Item Deleted", description: "Schedule item removed successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };


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
      <Button variant="outline" onClick={() => router.push(`/admin/project-fair/events/${eventId}/dashboard`)} className="mb-4 print:hidden">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Dashboard
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                    <ListChecks className="h-6 w-6" /> Schedule for {event.name}
                </CardTitle>
                <CardDescription>Manage the timeline and activities for this event.</CardDescription>
            </div>
            <Button onClick={() => handleOpenForm()}><PlusCircle className="mr-2 h-4 w-4"/>Add Schedule Item</Button>
          </div>
        </CardHeader>
        <CardContent>
          {schedule.length === 0 ? (
            <div className="text-center py-10">
              <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No schedule items created yet.</p>
              <p className="text-sm text-muted-foreground">Click &quot;Add Schedule Item&quot; to start building the event timeline.</p>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="block lg:hidden space-y-3">
                {schedule.map((item, index) => (
                  <Card key={index} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm leading-tight">{item.activity}</h4>
                          <p className="text-xs text-muted-foreground font-medium">{item.time}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-xs text-muted-foreground mb-3">
                        <div><span className="font-medium">Location:</span> {item.location}</div>
                        <div><span className="font-medium">Coordinator:</span> {item.coordinator.name}</div>
                        {item.notes && <div><span className="font-medium">Notes:</span> {item.notes}</div>}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenForm(item, index)} className="min-h-[44px] flex-1">
                          <Edit2 className="h-3 w-3 mr-1" />Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(index)} className="min-h-[44px] flex-1">
                          <Trash2 className="h-3 w-3 mr-1" />Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Time</TableHead>
                      <TableHead className="w-2/5">Activity</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Coordinator</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.time}</TableCell>
                        <TableCell>{item.activity}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>{item.coordinator.name}</TableCell>
                        <TableCell className="text-right space-x-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleOpenForm(item, index)}><Edit2 className="h-4 w-4"/></Button>
                            <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDeleteItem(index)}><Trash2 className="h-4 w-4"/></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Schedule Item" : "Add New Schedule Item"}</DialogTitle>
                <DialogDescription>Fill in the schedule item details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleScheduleItemSubmit} className="space-y-4 py-2">
                <div><Label htmlFor="formTime">Time Slot *</Label><Input id="formTime" value={formTime} onChange={e => setFormTime(e.target.value)} placeholder="e.g., 09:00 AM - 10:00 AM" required /></div>
                <div><Label htmlFor="formActivity">Activity *</Label><Input id="formActivity" value={formActivity} onChange={e => setFormActivity(e.target.value)} placeholder="e.g., Inauguration Ceremony" required /></div>
                <div><Label htmlFor="formLocation">Location *</Label><Input id="formLocation" value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="e.g., Main Auditorium" required /></div>
                <div>
                    <Label htmlFor="formCoordinatorId">Coordinator *</Label>
                    <Select value={formCoordinatorId} onValueChange={setFormCoordinatorId} required>
                        <SelectTrigger><SelectValue placeholder="Select Coordinator" /></SelectTrigger>
                        <SelectContent>
                            {facultyUsers.map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.displayName} ({user.email})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div><Label htmlFor="formNotes">Notes (Optional)</Label><Textarea id="formNotes" value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Any additional details..." rows={2}/></div>
                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                        {editingItem ? "Save Changes" : "Add Item"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
