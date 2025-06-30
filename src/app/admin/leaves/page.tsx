"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Edit, CheckCircle, XCircle, Plane, Loader2, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO, isValid, differenceInCalendarDays } from 'date-fns';
import { cn } from "@/lib/utils";
import type { LeaveRequest, LeaveType, LeaveRequestStatus, Faculty, Department, Institute } from '@/types/entities';
import { leaveService } from '@/lib/api/leaves';
import { facultyService } from '@/lib/api/faculty';
import { departmentService } from '@/lib/api/departments';
import { instituteService } from '@/lib/api/institutes';

const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: "casual", label: "Casual Leave" }, { value: "sick", label: "Sick Leave" },
  { value: "earned", label: "Earned Leave" }, { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" }, { value: "duty", label: "On Duty / Official Work" },
  { value: "unpaid", label: "Unpaid Leave" }, { value: "other", label: "Other" },
];

const LEAVE_STATUS_OPTIONS: { value: LeaveRequestStatus; label: string }[] = [
  { value: "pending", label: "Pending" }, { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" }, { value: "cancelled", label: "Cancelled" },
  { value: "taken", label: "Taken" },
];

type SortField = keyof LeaveRequest | 'facultyName' | 'departmentName' | 'none';
type SortDirection = 'asc' | 'desc';
const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function AdminLeavesManagementPage() {
  const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [formActionRemarks, setFormActionRemarks] = useState('');

  // Filters
  const [filterInstitute, setFilterInstitute] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterFaculty, setFilterFaculty] = useState<string>('all');
  const [filterLeaveType, setFilterLeaveType] = useState<LeaveType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<LeaveRequestStatus | 'all'>('pending');
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined);
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');


  const [sortField, setSortField] = useState<SortField>('appliedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leavesData, facultyData, deptData, instData] = await Promise.all([
        leaveService.getLeaveRequestsForManagement({}), // Fetch all initially
        facultyService.getAllFaculty(),
        departmentService.getAllDepartments(),
        instituteService.getAllInstitutes(),
      ]);
      setAllLeaveRequests(leavesData.sort((a,b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()));
      setFaculties(facultyData);
      setDepartments(deptData);
      setInstitutes(instData);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message || "Could not load leave data." });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleActionSubmit = async () => {
    if (!selectedLeaveRequest || !actionType) return;
    
    // Assuming the logged-in admin/HOD user ID is available, e.g., from a context or cookie
    const approverId = "admin_user_placeholder"; // Replace with actual logged-in user ID
    
    setIsSubmitting(true);
    try {
      if (actionType === 'approve') {
        await leaveService.approveLeaveRequest(selectedLeaveRequest.id, approverId, formActionRemarks);
        toast({ title: "Leave Approved", description: `Leave request for ${faculties.find(f=>f.id === selectedLeaveRequest.facultyId)?.firstName || 'faculty'} approved.`});
      } else if (actionType === 'reject') {
        if(!formActionRemarks.trim()){
            toast({variant: "destructive", title: "Reason Required", description: "Please provide a reason for rejection."});
            setIsSubmitting(false);
            return;
        }
        await leaveService.rejectLeaveRequest(selectedLeaveRequest.id, approverId, formActionRemarks);
        toast({ title: "Leave Rejected", description: `Leave request for ${faculties.find(f=>f.id === selectedLeaveRequest.facultyId)?.firstName || 'faculty'} rejected.`});
      }
      fetchInitialData(); // Refresh list
      setIsActionDialogOpen(false);
      setFormActionRemarks('');
      setSelectedLeaveRequest(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed", description: (error as Error).message });
    }
    setIsSubmitting(false);
  };
  
  const openActionDialog = (leaveRequest: LeaveRequest, type: 'approve' | 'reject') => {
    setSelectedLeaveRequest(leaveRequest);
    setActionType(type);
    setFormActionRemarks(type === 'approve' ? (leaveRequest.remarks || '') : (leaveRequest.rejectionReason || ''));
    setIsActionDialogOpen(true);
  };

  const filteredDepartmentsForSelect = useMemo(() => {
    if (filterInstitute === 'all') return departments;
    return departments.filter(d => d.instituteId === filterInstitute);
  }, [filterInstitute, departments]);

  const filteredFacultiesForSelect = useMemo(() => {
    if (filterDepartment === 'all') {
        if (filterInstitute === 'all') return faculties;
        return faculties.filter(f => f.instituteId === filterInstitute);
    }
    return faculties.filter(f => f.departmentId === filterDepartment && (filterInstitute === 'all' || f.instituteId === filterInstitute) );
  }, [filterDepartment, filterInstitute, faculties]);

  const filteredAndSortedLeaveRequests = useMemo(() => {
    let result = [...allLeaveRequests];
    if (searchTerm) {
        const termLower = searchTerm.toLowerCase();
        result = result.filter(req => {
            const faculty = faculties.find(f => f.id === req.facultyId);
            return faculty?.firstName?.toLowerCase().includes(termLower) ||
                   faculty?.lastName?.toLowerCase().includes(termLower) ||
                   faculty?.staffCode?.toLowerCase().includes(termLower) ||
                   req.reason.toLowerCase().includes(termLower) ||
                   req.leaveType?.toLowerCase().includes(termLower);
        });
    }
    if (filterInstitute !== 'all') result = result.filter(req => req.instituteId === filterInstitute);
    if (filterDepartment !== 'all') result = result.filter(req => req.departmentId === filterDepartment);
    if (filterFaculty !== 'all') result = result.filter(req => req.facultyId === filterFaculty);
    if (filterLeaveType !== 'all') result = result.filter(req => req.leaveType === filterLeaveType);
    if (filterStatus !== 'all') result = result.filter(req => req.status === filterStatus);
    if (filterDateFrom) result = result.filter(req => req.fromDate && new Date(req.fromDate) >= filterDateFrom!);
    if (filterDateTo) result = result.filter(req => req.toDate && new Date(req.toDate) <= filterDateTo!);


    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: any, valB: any;
        if (sortField === 'facultyName') {
            const facA = faculties.find(f => f.id === a.facultyId);
            const facB = faculties.find(f => f.id === b.facultyId);
            valA = `${facA?.lastName || ''} ${facA?.firstName || ''}`.trim();
            valB = `${facB?.lastName || ''} ${facB?.firstName || ''}`.trim();
        } else if (sortField === 'departmentName') {
            valA = departments.find(d => d.id === a.departmentId)?.name || '';
            valB = departments.find(d => d.id === b.departmentId)?.name || '';
        } else if (['appliedAt', 'fromDate', 'toDate'].includes(sortField)) {
            const fieldKey = sortField as 'appliedAt' | 'fromDate' | 'toDate';
            valA = a[fieldKey] ? new Date(a[fieldKey]!).getTime() : 0;
            valB = b[fieldKey] ? new Date(b[fieldKey]!).getTime() : 0;
        }
        else {
            valA = a[sortField as keyof LeaveRequest];
            valB = b[sortField as keyof LeaveRequest];
        }
        
        if (valA === undefined || valA === null) return sortDirection === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null) return sortDirection === 'asc' ? -1 : 1;
        if (typeof valA === 'string' && typeof valB === 'string') return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        if (typeof valA === 'number' && typeof valB === 'number') return sortDirection === 'asc' ? valA - valB : valB - valA;
        return 0;
      });
    }
    return result;
  }, [allLeaveRequests, searchTerm, filterInstitute, filterDepartment, filterFaculty, filterLeaveType, filterStatus, filterDateFrom, filterDateTo, sortField, sortDirection, faculties, departments]);

  const totalPages = Math.ceil(filteredAndSortedLeaveRequests.length / itemsPerPage);
  const paginatedLeaveRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedLeaveRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedLeaveRequests, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterInstitute, filterDepartment, filterFaculty, filterLeaveType, filterStatus, filterDateFrom, filterDateTo, itemsPerPage]);

  const calculateLeaveDays = (fromDateStr: string, toDateStr: string, isHalfDay?: boolean) => {
    if (!isValid(parseISO(fromDateStr)) || !isValid(parseISO(toDateStr))) return "N/A";
    if (isHalfDay) return "0.5";
    const diff = differenceInCalendarDays(parseISO(toDateStr), parseISO(fromDateStr)) + 1;
    return diff.toString();
  };


  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => { setSortField(field); setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">{label}{sortField === field && <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" />}{sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}</div>
    </TableHead>
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2"><Plane className="h-6 w-6" /> Leave Request Management</CardTitle>
          <CardDescription>Review and manage faculty and staff leave requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
            <div><Label htmlFor="searchTermLeaves">Search</Label><Input id="searchTermLeaves" placeholder="Faculty, Reason, Type..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div>
            <div><Label htmlFor="filterInstituteLeaves">Institute</Label><Select value={filterInstitute} onValueChange={val => {setFilterInstitute(val); setFilterDepartment('all'); setFilterFaculty('all');}}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All Institutes</SelectItem>{institutes.map(i=><SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="filterDepartmentLeaves">Department</Label><Select value={filterDepartment} onValueChange={val => {setFilterDepartment(val); setFilterFaculty('all');}} disabled={filterInstitute === 'all' && departments.length === 0}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All Departments</SelectItem>{filteredDepartmentsForSelect.map(d=><SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="filterFacultyLeaves">Faculty</Label><Select value={filterFaculty} onValueChange={setFilterFaculty} disabled={filteredFacultiesForSelect.length === 0}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All Faculty</SelectItem>{filteredFacultiesForSelect.map(f=><SelectItem key={f.id} value={f.id}>{f.firstName} {f.lastName}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="filterLeaveTypeLeaves">Leave Type</Label><Select value={filterLeaveType} onValueChange={val => setFilterLeaveType(val as LeaveType | 'all')}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{LEAVE_TYPE_OPTIONS.map(t=><SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="filterStatusLeaves">Status</Label><Select value={filterStatus} onValueChange={val => setFilterStatus(val as LeaveRequestStatus | 'all')}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{LEAVE_STATUS_OPTIONS.map(s=><SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="filterDateFromLeaves">Date From</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !filterDateFrom && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{filterDateFrom ? format(filterDateFrom, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterDateFrom} onSelect={setFilterDateFrom} initialFocus/></PopoverContent></Popover></div>
            <div><Label htmlFor="filterDateToLeaves">Date To</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !filterDateTo && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{filterDateTo ? format(filterDateTo, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterDateTo} onSelect={setFilterDateTo} initialFocus/></PopoverContent></Popover></div>
          </div>

          {paginatedLeaveRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No leave requests match your current filters.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <SortableTableHeader field="facultyName" label="Faculty" />
                <SortableTableHeader field="departmentName" label="Department" />
                <SortableTableHeader field="leaveType" label="Type" />
                <SortableTableHeader field="fromDate" label="From" />
                <SortableTableHeader field="toDate" label="To" />
                <SortableTableHeader field="reason" label="Reason" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginatedLeaveRequests.map(req => {
                  const faculty = faculties.find(f => f.id === req.facultyId);
                  const department = departments.find(d => d.id === req.departmentId);
                  return (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{faculty?.firstName} {faculty?.lastName}</TableCell>
                    <TableCell>{department?.name || 'N/A'}</TableCell>
                    <TableCell className="capitalize">{req.leaveType || req.type}</TableCell>
                    <TableCell>{req.fromDate ? format(parseISO(req.fromDate), "PPP") : req.startDate ? format(parseISO(req.startDate), "PPP") : 'N/A'}</TableCell>
                    <TableCell>{req.toDate ? format(parseISO(req.toDate), "PPP") : req.endDate ? format(parseISO(req.endDate), "PPP") : 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate" title={req.reason}>{req.reason}</TableCell>
                    <TableCell><span className={cn("px-2 py-0.5 text-xs font-semibold rounded-full", req.status === 'pending' && 'bg-yellow-100 text-yellow-800', req.status === 'approved' && 'bg-green-100 text-green-800', req.status === 'rejected' && 'bg-red-100 text-red-800', req.status === 'cancelled' && 'bg-slate-100 text-slate-800', req.status === 'taken' && 'bg-blue-100 text-blue-800')}>{LEAVE_STATUS_OPTIONS.find(s => s.value === req.status)?.label || req.status}</span></TableCell>
                    <TableCell className="text-right space-x-1">
                        {req.status === 'pending' && (<><Button variant="outline" size="xs" className="text-success border-success hover:bg-success/10" onClick={()=>openActionDialog(req, 'approve')}><CheckCircle className="mr-1 h-3 w-3"/>Approve</Button><Button variant="outline" size="xs" className="text-destructive border-destructive hover:bg-destructive/10" onClick={()=>openActionDialog(req, 'reject')}><XCircle className="mr-1 h-3 w-3"/>Reject</Button></>)}
                        {(req.status === 'approved' || req.status === 'rejected') && <Button variant="ghost" size="xs" onClick={()=>openActionDialog(req, req.status as 'approve' | 'reject')}><Edit className="mr-1 h-3 w-3"/>Review</Button>}
                    </TableCell>
                  </TableRow>
                );})}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {filteredAndSortedLeaveRequests.length > 0 && (
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t">
                <div className="text-sm text-muted-foreground">Showing {Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedLeaveRequests.length)} to {Math.min(currentPage * itemsPerPage, filteredAndSortedLeaveRequests.length)} of {filteredAndSortedLeaveRequests.length} requests.</div>
                <div className="flex items-center gap-2">
                    <Select value={String(itemsPerPage)} onValueChange={(value) => {setItemsPerPage(Number(value)); setCurrentPage(1);}}><SelectTrigger className="w-[70px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent side="top">{ITEMS_PER_PAGE_OPTIONS.map(sz => <SelectItem key={sz} value={String(sz)} className="text-xs">{sz}</SelectItem>)}</SelectContent></Select>
                    <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}><ChevronsRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            </CardFooter>
        )}
      </Card>

      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">{actionType} Leave Request</DialogTitle>
            <DialogDescription>
              Review the leave request and {actionType === 'approve' ? 'add remarks or ' : 'provide a reason to '} {actionType} it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p><span className="font-semibold">Faculty:</span> {faculties.find(f=>f.id === selectedLeaveRequest?.facultyId)?.firstName} {faculties.find(f=>f.id === selectedLeaveRequest?.facultyId)?.lastName}</p>
            <p><span className="font-semibold">Type:</span> <span className="capitalize">{selectedLeaveRequest?.leaveType || selectedLeaveRequest?.type}</span></p>
            <p><span className="font-semibold">Dates:</span> {selectedLeaveRequest?.fromDate && format(parseISO(selectedLeaveRequest.fromDate), "PPP")} to {selectedLeaveRequest?.toDate && format(parseISO(selectedLeaveRequest.toDate), "PPP")} ({selectedLeaveRequest && selectedLeaveRequest.fromDate && selectedLeaveRequest.toDate && calculateLeaveDays(selectedLeaveRequest.fromDate, selectedLeaveRequest.toDate, selectedLeaveRequest.isHalfDay)} days)</p>
            <p><span className="font-semibold">Reason:</span> {selectedLeaveRequest?.reason}</p>
             {selectedLeaveRequest?.isHalfDay && <p><span className="font-semibold">Half Day:</span> {selectedLeaveRequest?.halfDayPeriod?.replace('_',' ')}</p>}
            <div>
                <Label htmlFor="formActionRemarks">{actionType === 'approve' ? 'Approval Remarks (Optional)' : 'Rejection Reason *'}</Label>
                <Textarea id="formActionRemarks" value={formActionRemarks} onChange={e => setFormActionRemarks(e.target.value)} rows={3} required={actionType === 'reject'}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button 
                onClick={handleActionSubmit} 
                disabled={isSubmitting || (actionType === 'reject' && !formActionRemarks.trim())}
                className={cn(actionType === 'approve' && "bg-success hover:bg-success/90", actionType === 'reject' && "bg-destructive hover:bg-destructive/90")}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === 'approve' ? 'Approve Leave' : 'Reject Leave'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

