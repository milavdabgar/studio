"use client";

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
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
import { CalendarIcon, PlusCircle, Edit, Trash2, Plane, Loader2, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Filter, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO, isValid, differenceInCalendarDays } from 'date-fns';
import { cn } from "@/lib/utils";
import type { LeaveRequest, LeaveType, LeaveRequestStatus, Faculty, User as SystemUser } from '@/types/entities';
import { leaveService } from '@/lib/api/leaves';
import { facultyService } from '@/lib/api/faculty';

const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: "casual", label: "Casual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "earned", label: "Earned Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "duty", label: "On Duty / Official Work" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "other", label: "Other" },
];

const LEAVE_STATUS_DISPLAY: Record<LeaveRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  taken: "Taken",
};

interface UserCookie {
  id?: string;
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookiePart = parts.pop();
    if (cookiePart) return cookiePart.split(';').shift();
  }
  return undefined;
}

export default function FacultyLeavesPage() {
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formLeaveType, setFormLeaveType] = useState<LeaveType>('casual');
  const [formFromDate, setFormFromDate] = useState<Date | undefined>(new Date());
  const [formToDate, setFormToDate] = useState<Date | undefined>(new Date());
  const [formReason, setFormReason] = useState('');
  const [formIsHalfDay, setFormIsHalfDay] = useState(false);
  const [formHalfDayPeriod, setFormHalfDayPeriod] = useState<'first_half' | 'second_half'>('first_half');


  const fetchFacultyAndLeaves = useCallback(async () => {
    const authUserCookie = getCookie('auth_user');
    if (!authUserCookie) {
      toast({ variant: "destructive", title: "Authentication Error", description: "User not logged in." });
      setIsLoading(false);
      return;
    }
    
    let userIdFromCookie: string | undefined;
    try {
      const decodedCookie = decodeURIComponent(authUserCookie);
      const parsedUser = JSON.parse(decodedCookie) as UserCookie;
      userIdFromCookie = parsedUser.id;
    } catch (error) {
      toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      setIsLoading(false);
      return;
    }

    if (!userIdFromCookie) {
        toast({ variant: "destructive", title: "Authentication Error", description: "User ID not found." });
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    try {
      const allFaculty = await facultyService.getAllFaculty();
      const facultyProfile = allFaculty.find(f => f.userId === userIdFromCookie);
      
      if (facultyProfile) {
        setCurrentFaculty(facultyProfile);
        const leavesData = await leaveService.getFacultyLeaveRequests(facultyProfile.id);
        setMyLeaves(leavesData.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()));
      } else {
        toast({ variant: "warning", title: "Profile Not Found", description: "Faculty profile not found for your account." });
        setMyLeaves([]);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message || "Could not load leave data." });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchFacultyAndLeaves();
  }, [fetchFacultyAndLeaves]);

  const resetForm = () => {
    setFormLeaveType('casual');
    setFormFromDate(new Date());
    setFormToDate(new Date());
    setFormReason('');
    setFormIsHalfDay(false);
    setFormHalfDayPeriod('first_half');
  };

  const handleApplyLeave = () => {
    if (!currentFaculty) {
      toast({ variant: "destructive", title: "Error", description: "Faculty profile not loaded." });
      return;
    }
    resetForm();
    setIsFormOpen(true);
  };

  const handleSubmitLeaveRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentFaculty) {
      toast({ variant: "destructive", title: "Error", description: "Faculty profile not loaded." });
      return;
    }
    if (!formFromDate || !formToDate || !formReason.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Leave dates and reason are required." });
      return;
    }
    if (formToDate < formFromDate) {
      toast({ variant: "destructive", title: "Validation Error", description: "To date cannot be before From date." });
      return;
    }

    setIsSubmitting(true);
    const leaveRequestData: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt' | 'actionTakenAt' | 'actionTakenBy' | 'rejectionReason' | 'createdAt' | 'updatedAt'> = {
      facultyId: currentFaculty.id,
      instituteId: currentFaculty.instituteId || "inst1", // Assuming faculty has instituteId
      departmentId: currentFaculty.departmentId, // Assuming faculty has departmentId
      leaveType: formLeaveType,
      fromDate: format(formFromDate, "yyyy-MM-dd"),
      toDate: format(formToDate, "yyyy-MM-dd"),
      reason: formReason.trim(),
      isHalfDay: formIsHalfDay,
      halfDayPeriod: formIsHalfDay ? formHalfDayPeriod : undefined,
      // contactAddress: currentFaculty.contactNumber || '', // Or a specific leave contact
      // 담당자 (approver) will be set by backend or HOD/Admin
    };

    try {
      await leaveService.createLeaveRequest(leaveRequestData);
      toast({ title: "Leave Request Submitted", description: "Your leave request has been submitted for approval." });
      setIsFormOpen(false);
      fetchFacultyAndLeaves(); // Refresh list
    } catch (error) {
      toast({ variant: "destructive", title: "Submission Failed", description: (error as Error).message || "Could not submit leave request." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelLeaveRequest = async (leaveId: string) => {
    if (!currentFaculty) return;
    if (!window.confirm("Are you sure you want to cancel this leave request?")) return;
    setIsSubmitting(true);
    try {
      await leaveService.cancelLeaveRequestByFaculty(leaveId, currentFaculty.id);
      toast({ title: "Leave Request Cancelled", description: "Your leave request has been cancelled." });
      fetchFacultyAndLeaves();
    } catch (error) {
      toast({ variant: "destructive", title: "Cancellation Failed", description: (error as Error).message });
    }
    setIsSubmitting(false);
  };
  
  const calculateLeaveDays = (fromDateStr: string, toDateStr: string, isHalfDay?: boolean) => {
    if (!isValid(parseISO(fromDateStr)) || !isValid(parseISO(toDateStr))) return "N/A";
    if (isHalfDay) return "0.5";
    const diff = differenceInCalendarDays(parseISO(toDateStr), parseISO(fromDateStr)) + 1;
    return diff.toString();
  };


  if (isLoading && !currentFaculty) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  if (!currentFaculty && !isLoading) {
      return <div className="text-center py-10 text-muted-foreground">Faculty profile not found. Please contact admin.</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <Plane className="h-6 w-6" /> My Leave Requests
            </CardTitle>
            <CardDescription>Apply for new leave and track the status of your requests.</CardDescription>
          </div>
          <Button onClick={handleApplyLeave}><PlusCircle className="mr-2 h-4 w-4" /> Apply for Leave</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : myLeaves.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">You have not submitted any leave requests yet.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Days</TableHead>
                <TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Applied On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {myLeaves.map(leave => (
                  <TableRow key={leave.id}>
                    <TableCell className="capitalize">{leave.leaveType}</TableCell>
                    <TableCell>{format(parseISO(leave.fromDate), "PPP")}</TableCell>
                    <TableCell>{format(parseISO(leave.toDate), "PPP")}</TableCell>
                    <TableCell>{calculateLeaveDays(leave.fromDate, leave.toDate, leave.isHalfDay)} {leave.isHalfDay ? `(${leave.halfDayPeriod?.replace('_',' ')})` : ''}</TableCell>
                    <TableCell className="max-w-xs truncate" title={leave.reason}>{leave.reason}</TableCell>
                    <TableCell>
                        <span className={cn("px-2 py-0.5 text-xs font-semibold rounded-full", 
                            leave.status === 'pending' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-300',
                            leave.status === 'approved' && 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300',
                            leave.status === 'rejected' && 'bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300',
                            leave.status === 'cancelled' && 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-300',
                            leave.status === 'taken' && 'bg-blue-100 text-blue-800 dark:bg-blue-700/30 dark:text-blue-300',
                        )}>
                            {LEAVE_STATUS_DISPLAY[leave.status] || leave.status}
                        </span>
                    </TableCell>
                    <TableCell>{format(parseISO(leave.appliedAt), "PPP")}</TableCell>
                    <TableCell className="text-right">
                      {leave.status === 'pending' && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleCancelLeaveRequest(leave.id)} disabled={isSubmitting}>
                           <XCircle className="h-4 w-4 mr-1"/> Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitLeaveRequest} className="space-y-4 py-2">
            <div><Label htmlFor="formLeaveType">Leave Type *</Label><Select value={formLeaveType} onValueChange={val => setFormLeaveType(val as LeaveType)} required><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{LEAVE_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="formFromDate">From Date *</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !formFromDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{formFromDate ? format(formFromDate, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formFromDate} onSelect={setFormFromDate} initialFocus disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} /></PopoverContent></Popover></div>
              <div><Label htmlFor="formToDate">To Date *</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !formToDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{formToDate ? format(formToDate, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formToDate} onSelect={setFormToDate} initialFocus disabled={(date) => formFromDate ? date < formFromDate : date < new Date(new Date().setDate(new Date().getDate() -1))} /></PopoverContent></Popover></div>
            </div>
             <div className="flex items-center space-x-2">
                <Checkbox id="formIsHalfDay" checked={formIsHalfDay} onCheckedChange={val => setFormIsHalfDay(val === true)} />
                <Label htmlFor="formIsHalfDay" className="text-sm font-normal">Request Half Day</Label>
            </div>
            {formIsHalfDay && (
                <div><Label htmlFor="formHalfDayPeriod">Half Day Period *</Label><Select value={formHalfDayPeriod} onValueChange={val => setFormHalfDayPeriod(val as 'first_half' | 'second_half')} required={formIsHalfDay}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="first_half">First Half</SelectItem><SelectItem value="second_half">Second Half</SelectItem></SelectContent></Select></div>
            )}
            <div><Label htmlFor="formReason">Reason *</Label><Textarea id="formReason" value={formReason} onChange={e => setFormReason(e.target.value)} rows={3} required placeholder="Briefly state the reason for your leave."/></div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

