"use client";

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Plane, Loader2, XCircle} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO, isValid, differenceInCalendarDays } from 'date-fns';
import { cn } from "@/lib/utils";
import type { LeaveRequest, LeaveType, LeaveRequestStatus, Faculty } from '@/types/entities';
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
  const [formHalfDayPeriod, setFormHalfDayPeriod] = useState<'morning' | 'afternoon'>('morning');


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
    } catch {
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
    setFormHalfDayPeriod('morning');
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
    const leaveRequestData: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt'> = {
      userId: currentFaculty.userId || '',
      facultyId: currentFaculty.id,
      instituteId: currentFaculty.instituteId || "inst1",
      departmentId: currentFaculty.departmentId,
      type: formLeaveType,
      leaveType: formLeaveType,
      reason: formReason.trim(),
      startDate: format(formFromDate, "yyyy-MM-dd"),
      endDate: format(formToDate, "yyyy-MM-dd"),
      fromDate: format(formFromDate, "yyyy-MM-dd"),
      toDate: format(formToDate, "yyyy-MM-dd"),
      isHalfDay: formIsHalfDay,
      halfDayPeriod: formIsHalfDay ? formHalfDayPeriod : undefined,
      totalDays: formIsHalfDay ? 0.5 : differenceInCalendarDays(formToDate, formFromDate) + 1,
      days: formIsHalfDay ? 0.5 : differenceInCalendarDays(formToDate, formFromDate) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
  
  const calculateLeaveDays = (fromDateStr: string | undefined, toDateStr: string | undefined, isHalfDay?: boolean) => {
    if (!fromDateStr || !toDateStr) return "N/A";
    if (!isValid(parseISO(fromDateStr)) || !isValid(parseISO(toDateStr))) return "N/A";
    if (isHalfDay) return "0.5";
    const diff = differenceInCalendarDays(parseISO(toDateStr), parseISO(fromDateStr)) + 1;
    return diff.toString();
  };


  if (isLoading && !currentFaculty) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" /></div>;
  }
  if (!currentFaculty && !isLoading) {
      return <div className="text-center py-8 px-4 text-muted-foreground text-sm sm:text-base">Faculty profile not found. Please contact admin.</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6">
          <div className="w-full sm:w-auto">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-primary flex items-center gap-2">
              <Plane className="h-5 w-5 sm:h-6 sm:w-6" /> My Leave Requests
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">Apply for new leave and track the status of your requests.</CardDescription>
          </div>
          <Button onClick={handleApplyLeave} className="w-full sm:w-auto min-h-[44px]">
            <PlusCircle className="mr-2 h-4 w-4" /> 
            <span className="hidden sm:inline">Apply for Leave</span>
            <span className="sm:hidden">Apply Leave</span>
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex justify-center py-6 sm:py-8"><Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" /></div>
          ) : myLeaves.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm sm:text-base px-4">You have not submitted any leave requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader><TableRow>
                  <TableHead className="text-xs sm:text-sm">Type</TableHead>
                  <TableHead className="text-xs sm:text-sm">From</TableHead>
                  <TableHead className="text-xs sm:text-sm">To</TableHead>
                  <TableHead className="text-xs sm:text-sm">Days</TableHead>
                  <TableHead className="text-xs sm:text-sm">Reason</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm">Applied On</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {myLeaves.map(leave => (
                    <TableRow key={leave.id}>
                      <TableCell className="capitalize text-xs sm:text-sm">{leave.leaveType}</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {leave.fromDate ? format(parseISO(leave.fromDate), "dd/MM/yy") : leave.startDate ? format(parseISO(leave.startDate), "dd/MM/yy") : "N/A"}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {leave.toDate ? format(parseISO(leave.toDate), "dd/MM/yy") : leave.endDate ? format(parseISO(leave.endDate), "dd/MM/yy") : "N/A"}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {calculateLeaveDays(leave.fromDate || leave.startDate, leave.toDate || leave.endDate, leave.isHalfDay)} 
                        {leave.isHalfDay ? (
                          <div className="text-[10px] text-muted-foreground">({leave.halfDayPeriod || 'morning'})</div>
                        ) : ''}
                      </TableCell>
                      <TableCell className="max-w-[120px] sm:max-w-xs truncate text-xs sm:text-sm" title={leave.reason}>{leave.reason}</TableCell>
                      <TableCell>
                          <span className={cn("px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full", 
                              leave.status === 'pending' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-300',
                              leave.status === 'approved' && 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300',
                              leave.status === 'rejected' && 'bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300',
                              leave.status === 'cancelled' && 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-300',
                              leave.status === 'taken' && 'bg-blue-100 text-blue-800 dark:bg-blue-700/30 dark:text-blue-300',
                          )}>
                              {LEAVE_STATUS_DISPLAY[leave.status] || leave.status}
                          </span>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">{format(parseISO(leave.appliedAt), "dd/MM/yy")}</TableCell>
                      <TableCell className="text-right">
                        {leave.status === 'pending' && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive min-h-[44px] sm:min-h-0 p-1 sm:p-2" onClick={() => handleCancelLeaveRequest(leave.id)} disabled={isSubmitting}>
                             <XCircle className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1"/>
                             <span className="hidden sm:inline">Cancel</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Apply for Leave</DialogTitle>
            <DialogDescription>Fill in the details for your leave request.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitLeaveRequest} className="space-y-3 sm:space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="formLeaveType" className="text-sm sm:text-base">Leave Type *</Label>
              <Select value={formLeaveType} onValueChange={val => setFormLeaveType(val as LeaveType)} required>
                <SelectTrigger className="min-h-[44px] text-sm">
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="formFromDate" className="text-sm sm:text-base">From Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start min-h-[44px] text-sm", !formFromDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4"/>
                      {formFromDate ? format(formFromDate, "dd/MM/yyyy") : <span>Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formFromDate} onSelect={setFormFromDate} initialFocus disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="formToDate" className="text-sm sm:text-base">To Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start min-h-[44px] text-sm", !formToDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4"/>
                      {formToDate ? format(formToDate, "dd/MM/yyyy") : <span>Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formToDate} onSelect={setFormToDate} initialFocus disabled={(date) => formFromDate ? date < formFromDate : date < new Date(new Date().setDate(new Date().getDate() -1))} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
             <div className="flex items-center space-x-2">
                <Checkbox id="formIsHalfDay" checked={formIsHalfDay} onCheckedChange={val => setFormIsHalfDay(val === true)} />
                <Label htmlFor="formIsHalfDay" className="text-sm font-normal">Request Half Day</Label>
            </div>
            {formIsHalfDay && (
                <div className="space-y-2">
                  <Label htmlFor="formHalfDayPeriod" className="text-sm sm:text-base">Half Day Period *</Label>
                  <Select value={formHalfDayPeriod} onValueChange={val => setFormHalfDayPeriod(val as 'morning' | 'afternoon')} required={formIsHalfDay}>
                    <SelectTrigger className="min-h-[44px] text-sm">
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="formReason" className="text-sm sm:text-base">Reason *</Label>
              <Textarea 
                id="formReason" 
                value={formReason} 
                onChange={e => setFormReason(e.target.value)} 
                rows={3} 
                required 
                placeholder="Briefly state the reason for your leave."
                className="text-sm resize-none"
              />
            </div>
            <DialogFooter className="pt-3 sm:pt-4 flex-col sm:flex-row gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px] order-2 sm:order-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px] order-1 sm:order-2">
                {isSubmitting && <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin"/>}
                <span className="text-sm sm:text-base">Submit Request</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

