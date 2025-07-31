
// src/app/admin/enrollments/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, CheckCircle, XCircle, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Enrollment, Student, CourseOffering, Course, Program, Batch, EnrollmentStatus } from '@/types/entities';
import { enrollmentService } from '@/lib/api/enrollments';
import { studentService } from '@/lib/api/students';
import { courseOfferingService } from '@/lib/api/courseOfferings';
import { courseService } from '@/lib/api/courses';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { format, parseISO } from 'date-fns';

type SortField = keyof EnrichedEnrollment | 'none';
type SortDirection = 'asc' | 'desc';

interface EnrichedEnrollment extends Enrollment {
  studentName?: string;
  studentEnrollmentNo?: string;
  courseName?: string;
  batchName?: string;
  programName?: string;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const ENROLLMENT_STATUS_OPTIONS: EnrollmentStatus[] = ['requested', 'enrolled', 'withdrawn', 'completed', 'failed', 'incomplete', 'rejected'];

export default function EnrollmentManagementPage() {
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgramId, setFilterProgramId] = useState<string>("all");
  const [filterBatchId, setFilterBatchId] = useState<string>("all");
  const [filterCourseOfferingId, setFilterCourseOfferingId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<EnrollmentStatus | "all">("requested");

  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);


  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          enrollmentsData, studentsData, coData, coursesData, programsData, batchesData
        ] = await Promise.all([
          enrollmentService.getAllEnrollments(), 
          studentService.getAllStudents(),
          courseOfferingService.getAllCourseOfferings(),
          courseService.getAllCourses(),
          programService.getAllPrograms(),
          batchService.getAllBatches(),
        ]);
        setAllEnrollments(enrollmentsData);
        setStudents(studentsData);
        setCourseOfferings(coData);
        setCourses(coursesData);
        setPrograms(programsData);
        setBatches(batchesData);
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not load enrollment data." });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [toast]);

  const enrichedEnrollments = useMemo(() => {
    return allEnrollments.map(enrollment => {
      const student = students.find(s => s.id === enrollment.studentId);
      const co = courseOfferings.find(c => c.id === enrollment.courseOfferingId);
      const course = co ? courses.find(c => c.id === co.courseId) : undefined;
      const batch = co ? batches.find(b => b.id === co.batchId) : undefined;
      const program = batch ? programs.find(p => p.id === batch.programId) : undefined;
      return {
        ...enrollment,
        studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.enrollmentNumber : 'Unknown Student',
        studentEnrollmentNo: student?.enrollmentNumber,
        courseName: course?.subjectName || 'Unknown Course',
        batchName: batch?.name || 'Unknown Batch',
        programName: program?.name || 'Unknown Program',
      };
    });
  }, [allEnrollments, students, courseOfferings, courses, programs, batches]);

  const filteredAndSortedEnrollments = useMemo(() => {
    let result = [...enrichedEnrollments];
    if (searchTerm) {
      result = result.filter(e => 
        e.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.studentEnrollmentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterProgramId !== 'all') {
        const programBatches = batches.filter(b => b.programId === filterProgramId).map(b => b.id);
        const programOfferings = courseOfferings.filter(co => co.batchId && programBatches.includes(co.batchId)).map(co => co.id);
        result = result.filter(e => programOfferings.includes(e.courseOfferingId));
    }
    if (filterBatchId !== 'all') {
        const batchOfferings = courseOfferings.filter(co => co.batchId === filterBatchId).map(co => co.id);
        result = result.filter(e => batchOfferings.includes(e.courseOfferingId));
    }
    if (filterCourseOfferingId !== 'all') result = result.filter(e => e.courseOfferingId === filterCourseOfferingId);
    if (filterStatus !== 'all') result = result.filter(e => e.status === filterStatus);

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA = a[sortField as keyof EnrichedEnrollment] as unknown;
        let valB = b[sortField as keyof EnrichedEnrollment] as unknown;
        if (sortField === 'createdAt' || sortField === 'updatedAt' || sortField === 'enrolledAt') {
            valA = a[sortField] ? new Date(a[sortField]!).getTime() : 0;
            valB = b[sortField] ? new Date(b[sortField]!).getTime() : 0;
        }
        if (typeof valA === 'string' && typeof valB === 'string') return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        if (typeof valA === 'number' && typeof valB === 'number') return sortDirection === 'asc' ? valA - valB : valB - valA;
        return 0;
      });
    }
    return result;
  }, [enrichedEnrollments, searchTerm, filterProgramId, filterBatchId, filterCourseOfferingId, filterStatus, sortField, sortDirection, batches, courseOfferings]);

  const totalPages = Math.ceil(filteredAndSortedEnrollments.length / itemsPerPage);
  const paginatedEnrollments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedEnrollments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedEnrollments, currentPage, itemsPerPage]);
  
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterProgramId, filterBatchId, filterCourseOfferingId, filterStatus, itemsPerPage]);


  const handleUpdateStatus = async (enrollmentId: string, newStatus: EnrollmentStatus) => {
    setIsSubmitting(true);
    try {
      await enrollmentService.updateEnrollmentStatus(enrollmentId, newStatus);
      setAllEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, status: newStatus, updatedAt: new Date().toISOString() } : e));
      toast({ title: "Status Updated", description: `Enrollment status changed to ${newStatus}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: (error as Error).message });
    }
    setIsSubmitting(false);
  };
  
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
    setCurrentPage(1);
  };

  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => handleSort(field)} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">{label}{sortField === field && <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" />}{sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}</div>
    </TableHead>
  );


  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
          <UserPlus className="h-6 w-6" /> Enrollment Management
        </CardTitle>
        <CardDescription>Review and manage student course enrollment requests.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 border rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 dark:border-gray-700">
          <div><Label htmlFor="searchTermEnroll">Search Student/Course</Label><Input id="searchTermEnroll" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Name, Enroll No, Course..." /></div>
          <div><Label htmlFor="filterProgramEnroll">Program</Label><Select value={filterProgramId} onValueChange={setFilterProgramId}><SelectTrigger><SelectValue placeholder="All Programs"/></SelectTrigger><SelectContent><SelectItem value="all">All Programs</SelectItem>{programs.map(p=><SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="filterBatchEnroll">Batch</Label><Select value={filterBatchId} onValueChange={setFilterBatchId} disabled={filterProgramId === 'all' && batches.length === 0}><SelectTrigger><SelectValue placeholder="All Batches"/></SelectTrigger><SelectContent><SelectItem value="all">All Batches</SelectItem>{batches.filter(b=> filterProgramId==='all' || b.programId === filterProgramId).map(b=><SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="filterCourseOfferingEnroll">Course Offering</Label><Select value={filterCourseOfferingId} onValueChange={setFilterCourseOfferingId} disabled={courseOfferings.length === 0}><SelectTrigger><SelectValue placeholder="All Offerings"/></SelectTrigger><SelectContent><SelectItem value="all">All Offerings</SelectItem>{courseOfferings.filter(co => (filterBatchId === 'all' || co.batchId === filterBatchId) && (filterProgramId === 'all' || co.programId === filterProgramId)).map(co=><SelectItem key={co.id} value={co.id}>{courses.find(c=>c.id === co.courseId)?.subjectName} ({co.academicYear} Sem {co.semester})</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="filterStatusEnroll">Status</Label><Select value={filterStatus} onValueChange={s => setFilterStatus(s as EnrollmentStatus | "all")}><SelectTrigger><SelectValue placeholder="All Statuses"/></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{ENROLLMENT_STATUS_OPTIONS.map(s=><SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : paginatedEnrollments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No enrollment records found matching your criteria.</p>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3">
              {paginatedEnrollments.map(enroll => (
                <Card key={enroll.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm leading-tight">
                          {enroll.studentName}
                        </h4>
                        <p className="text-xs text-muted-foreground">{enroll.studentEnrollmentNo}</p>
                        <p className="text-xs text-muted-foreground truncate">{enroll.courseName}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap capitalize ${
                        enroll.status === 'enrolled' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : enroll.status === 'requested' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : enroll.status === 'rejected' || enroll.status === 'withdrawn' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300'
                      }`}>
                        {enroll.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-2 text-xs mb-3">
                      <div>
                        <span className="text-muted-foreground">Batch:</span>
                        <p className="font-medium truncate">{enroll.batchName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Program:</span>
                        <p className="font-medium truncate">{enroll.programName}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Request Date:</span>
                        <p className="font-medium">{enroll.createdAt ? format(parseISO(enroll.createdAt), "PPP") : 'N/A'}</p>
                      </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="flex gap-2 mt-3">
                      {enroll.status === 'requested' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-600 dark:hover:bg-green-900/20 min-h-[44px] flex-1 text-xs" 
                            onClick={() => handleUpdateStatus(enroll.id, 'enrolled')} 
                            disabled={isSubmitting}
                          >
                            <CheckCircle className="mr-1 h-3 w-3"/>
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-600 dark:hover:bg-red-900/20 min-h-[44px] flex-1 text-xs" 
                            onClick={() => handleUpdateStatus(enroll.id, 'rejected')} 
                            disabled={isSubmitting}
                          >
                            <XCircle className="mr-1 h-3 w-3"/>
                            Reject
                          </Button>
                        </>
                      )}
                      {enroll.status === 'enrolled' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-600 dark:hover:bg-orange-900/20 min-h-[44px] flex-1 text-xs" 
                          onClick={() => handleUpdateStatus(enroll.id, 'withdrawn')} 
                          disabled={isSubmitting}
                        >
                          <XCircle className="mr-1 h-3 w-3"/>
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader><TableRow>
                    <SortableTableHeader field="studentEnrollmentNo" label="Enroll. No" />
                    <SortableTableHeader field="studentName" label="Student" />
                    <SortableTableHeader field="courseName" label="Course" />
                    <SortableTableHeader field="batchName" label="Batch" />
                    <SortableTableHeader field="createdAt" label="Request Date" />
                    <SortableTableHeader field="status" label="Status" />
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {paginatedEnrollments.map(enroll => (
                      <TableRow key={enroll.id}>
                        <TableCell>{enroll.studentEnrollmentNo}</TableCell>
                        <TableCell>{enroll.studentName}</TableCell>
                        <TableCell>{enroll.courseName}</TableCell>
                        <TableCell>{enroll.batchName} ({enroll.programName})</TableCell>
                        <TableCell>{enroll.createdAt ? format(parseISO(enroll.createdAt), "PPP") : 'N/A'}</TableCell>
                        <TableCell><span className={`capitalize px-2 py-0.5 text-xs rounded-full font-medium bg-${enroll.status === 'enrolled' ? 'green' : enroll.status === 'requested' ? 'yellow' : enroll.status === 'rejected' || enroll.status === 'withdrawn' ? 'red' : 'slate'}-100 text-${enroll.status === 'enrolled' ? 'green' : enroll.status === 'requested' ? 'yellow' : enroll.status === 'rejected' || enroll.status === 'withdrawn' ? 'red' : 'slate'}-700`}>{enroll.status}</span></TableCell>
                        <TableCell className="text-right space-x-1">
                          {enroll.status === 'requested' && (
                            <>
                              <Button size="xs" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 dark:border-gray-700" onClick={() => handleUpdateStatus(enroll.id, 'enrolled')} disabled={isSubmitting}><CheckCircle className="mr-1 h-3 w-3"/>Approve</Button>
                              <Button size="xs" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 dark:border-gray-700" onClick={() => handleUpdateStatus(enroll.id, 'rejected')} disabled={isSubmitting}><XCircle className="mr-1 h-3 w-3"/>Reject</Button>
                            </>
                          )}
                          {enroll.status === 'enrolled' && (
                               <Button size="xs" variant="outline" className="text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-gray-700" onClick={() => handleUpdateStatus(enroll.id, 'withdrawn')} disabled={isSubmitting}><XCircle className="mr-1 h-3 w-3"/>Withdraw</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t dark:border-gray-700">
            <div className="text-sm text-muted-foreground">Showing {paginatedEnrollments.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedEnrollments.length): 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedEnrollments.length)} of {filteredAndSortedEnrollments.length} enrollments.</div>
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
    </Card>
  );
}
