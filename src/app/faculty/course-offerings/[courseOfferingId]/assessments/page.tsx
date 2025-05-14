// src/app/faculty/course-offerings/[courseOfferingId]/assessments/page.tsx
"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // Added for bulk actions if needed later
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Edit, Trash2, FileText as AssessmentIcon, Loader2, Search, ArrowUpDown, ArrowLeft, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import type { Assessment, AssessmentStatus, AssessmentType, CourseOffering, Course, Program, Batch, Faculty } from '@/types/entities';
import { assessmentService } from '@/lib/api/assessments';
import { courseOfferingService } from '@/lib/api/courseOfferings';
import { courseService } from '@/lib/api/courses';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { facultyService } from '@/lib/api/faculty';
import { useParams, useRouter } from 'next/navigation';

const ASSESSMENT_TYPE_OPTIONS: AssessmentType[] = ['Quiz', 'Midterm', 'Final Exam', 'Assignment', 'Project', 'Lab Work', 'Presentation', 'Other'];
const ASSESSMENT_STATUS_OPTIONS: { value: AssessmentStatus, label: string }[] = [
  { value: "Draft", label: "Draft" }, { value: "Published", label: "Published" },
  { value: "Ongoing", label: "Ongoing" }, { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

type SortField = keyof Assessment | 'none';
type SortDirection = 'asc' | 'desc';
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

interface UserCookie { id?: string; } // Simplified for getting facultyId

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

export default function ManageCourseOfferingAssessmentsPage() {
  const router = useRouter();
  const params = useParams();
  const courseOfferingId = params.courseOfferingId as string;

  const [courseOffering, setCourseOffering] = useState<CourseOffering | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<Partial<Assessment> | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AssessmentType>('Assignment');
  const [formDescription, setFormDescription] = useState('');
  const [formMaxMarks, setFormMaxMarks] = useState<number>(100);
  const [formPassingMarks, setFormPassingMarks] = useState<number | undefined>(undefined);
  const [formAssessmentDate, setFormAssessmentDate] = useState<Date | undefined>(undefined);
  const [formDueDate, setFormDueDate] = useState<Date | undefined>(undefined);
  const [formStatus, setFormStatus] = useState<AssessmentStatus>('Draft');
  const [formInstructions, setFormInstructions] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    let userIdFromCookie: string | undefined;
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        userIdFromCookie = parsedUser.id;
      } catch (error) { console.error("Error parsing user cookie:", error); }
    }

    if (!courseOfferingId) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [offeringData, allAssessments, allCourses, allPrograms, allBatches, allFaculty] = await Promise.all([
          courseOfferingService.getCourseOfferingById(courseOfferingId),
          assessmentService.getAllAssessments(),
          courseService.getAllCourses(),
          programService.getAllPrograms(),
          batchService.getAllBatches(),
          facultyService.getAllFaculty(),
        ]);
        setCourseOffering(offeringData);
        
        const facultyProfile = allFaculty.find(f => f.userId === userIdFromCookie);
        setCurrentFaculty(facultyProfile || null);

        if (offeringData) {
          const courseData = allCourses.find(c => c.id === offeringData.courseId);
          setCourse(courseData || null);
          const batchData = allBatches.find(b => b.id === offeringData.batchId);
          setBatch(batchData || null);
          if (batchData?.programId) {
            const programData = allPrograms.find(p => p.id === batchData.programId);
            setProgram(programData || null);
          }
          // Filter assessments for this specific course offering context
          setAssessments(allAssessments.filter(a => 
            a.courseId === offeringData.courseId &&
            a.programId === (batchData?.programId || courseData?.programId) && // Match program
            (a.batchId === offeringData.batchId || !a.batchId) // Match batch or be program-wide for the course
          ));
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load data." });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [courseOfferingId, toast]);

  const resetForm = () => {
    setFormName(''); setFormType('Assignment'); setFormDescription('');
    setFormMaxMarks(100); setFormPassingMarks(undefined);
    setFormAssessmentDate(undefined); setFormDueDate(undefined);
    setFormStatus('Draft'); setFormInstructions(''); setCurrentAssessment(null);
  };

  const handleEdit = (assessment: Assessment) => {
    setCurrentAssessment(assessment);
    setFormName(assessment.name); setFormType(assessment.type);
    setFormDescription(assessment.description || ''); setFormMaxMarks(assessment.maxMarks);
    setFormPassingMarks(assessment.passingMarks);
    setFormAssessmentDate(assessment.assessmentDate && isValid(parseISO(assessment.assessmentDate)) ? parseISO(assessment.assessmentDate) : undefined);
    setFormDueDate(assessment.dueDate && isValid(parseISO(assessment.dueDate)) ? parseISO(assessment.dueDate) : undefined);
    setFormStatus(assessment.status); setFormInstructions(assessment.instructions || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (assessmentId: string) => {
    if (!window.confirm("Are you sure you want to delete this assessment?")) return;
    setIsSubmitting(true);
    try {
      await assessmentService.deleteAssessment(assessmentId);
      setAssessments(prev => prev.filter(a => a.id !== assessmentId));
      toast({ title: "Assessment Deleted" });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!courseOffering || !course || !program || !currentFaculty) {
      toast({ variant: "destructive", title: "Context Error", description: "Course offering, course, program or faculty context is missing."});
      return;
    }
    if (!formName.trim() || formMaxMarks <= 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name and valid Max Marks are required."});
      return;
    }

    setIsSubmitting(true);
    const assessmentData: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = { 
      name: formName.trim(),
      courseId: course.id,
      programId: program.id,
      batchId: courseOffering.batchId, // Assessments created by faculty are specific to this batch offering
      type: formType,
      description: formDescription.trim() || undefined,
      maxMarks: Number(formMaxMarks),
      passingMarks: formPassingMarks !== undefined ? Number(formPassingMarks) : undefined,
      assessmentDate: formAssessmentDate ? format(formAssessmentDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : undefined,
      dueDate: formDueDate ? format(formDueDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : undefined,
      status: formStatus,
      instructions: formInstructions.trim() || undefined,
      facultyId: currentFaculty.id,
    };
    
    try {
      let savedAssessment: Assessment;
      if (currentAssessment && currentAssessment.id) {
        savedAssessment = await assessmentService.updateAssessment(currentAssessment.id, assessmentData);
        toast({ title: "Assessment Updated" });
      } else {
        savedAssessment = await assessmentService.createAssessment(assessmentData);
        toast({ title: "Assessment Created" });
      }
      // Optimistically update or add to local state
      setAssessments(prev => {
        const index = prev.findIndex(a => a.id === savedAssessment.id);
        if (index !== -1) {
          const newAssessments = [...prev];
          newAssessments[index] = savedAssessment;
          return newAssessments;
        }
        return [...prev, savedAssessment];
      });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAndSortedAssessments = useMemo(() => {
    let result = [...assessments];
    if (searchTerm) result = result.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA = a[sortField as keyof Assessment] as string | number | Date | undefined;
        let valB = b[sortField as keyof Assessment] as string | number | Date | undefined;
        if (sortField === 'assessmentDate' || sortField === 'dueDate') { valA = valA ? new Date(valA).getTime() : 0; valB = valB ? new Date(valB).getTime() : 0;}
        if (typeof valA === 'string' && typeof valB === 'string') return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        if (typeof valA === 'number' && typeof valB === 'number') return sortDirection === 'asc' ? valA - valB : valB - valA;
        return 0;
      });
    }
    return result;
  }, [assessments, searchTerm, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedAssessments.length / itemsPerPage);
  const paginatedAssessments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedAssessments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedAssessments, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, itemsPerPage]);
  
  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => { setSortField(field); setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">{label}{sortField === field && <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" />}{sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}</div>
    </TableHead>
  );

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!courseOffering || !course || !program) return <div className="text-center py-10 text-muted-foreground">Course offering details not found.</div>;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/faculty/my-courses')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Courses
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-3">
            <AssessmentIcon className="h-7 w-7" /> Manage Assessments
          </CardTitle>
          <CardDescription>
            For: {course.subjectName} ({course.subcode}) - {program.name} ({batch?.name || 'N/A'}) <br/>
            Academic Year: {courseOffering.academicYear} | Semester: {courseOffering.semester}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center">
            <div className="relative w-full sm:max-w-xs">
              <Input type="text" placeholder="Search assessments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10"/>
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button onClick={() => handleEdit({} as Assessment)}><PlusCircle className="mr-2 h-4 w-4"/> Add New Assessment</Button>
          </div>
          
          {paginatedAssessments.length === 0 ? (
             <p className="text-center text-muted-foreground py-8">No assessments found for this course offering.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <SortableTableHeader field="name" label="Name" /><SortableTableHeader field="type" label="Type" />
                <SortableTableHeader field="maxMarks" label="Max Marks" /><SortableTableHeader field="dueDate" label="Due Date" />
                <SortableTableHeader field="status" label="Status" /><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginatedAssessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.name}</TableCell><TableCell>{assessment.type}</TableCell>
                    <TableCell>{assessment.maxMarks}</TableCell>
                    <TableCell>{assessment.dueDate ? format(parseISO(assessment.dueDate), "PPP") : 'N/A'}</TableCell>
                    <TableCell><span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${assessment.status === 'Published' ? 'green' : 'yellow'}-100 text-${assessment.status === 'Published' ? 'green' : 'yellow'}-700`}>{assessment.status}</span></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEdit(assessment)}><Edit className="h-4 w-4"/></Button>
                      <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDelete(assessment.id)}><Trash2 className="h-4 w-4"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">Showing {paginatedAssessments.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedAssessments.length): 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedAssessments.length)} of {filteredAndSortedAssessments.length} assessments.</div>
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

      <Dialog open={isDialogOpen} onOpenChange={isOpen => { setIsDialogOpen(isOpen); if(!isOpen) resetForm();}}>
        <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{currentAssessment?.id ? "Edit Assessment" : "Add New Assessment"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div><Label htmlFor="formName">Assessment Name *</Label><Input id="formName" value={formName} onChange={e=>setFormName(e.target.value)} required/></div>
            <div><Label htmlFor="formType">Type *</Label><Select value={formType} onValueChange={v => setFormType(v as AssessmentType)} required><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{ASSESSMENT_TYPE_OPTIONS.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="formDescription">Description</Label><Textarea id="formDescription" value={formDescription} onChange={e=>setFormDescription(e.target.value)} rows={2}/></div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="formMaxMarks">Max Marks *</Label><Input id="formMaxMarks" type="number" value={formMaxMarks} onChange={e=>setFormMaxMarks(Number(e.target.value))} required min={1}/></div>
                <div><Label htmlFor="formPassingMarks">Passing Marks</Label><Input id="formPassingMarks" type="number" value={formPassingMarks || ''} onChange={e=>setFormPassingMarks(e.target.value ? Number(e.target.value) : undefined)} min={0}/></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="formAssessmentDate">Assessment Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !formAssessmentDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{formAssessmentDate ? format(formAssessmentDate, "PPP HH:mm") : <span>Pick date & time</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formAssessmentDate} onSelect={setFormAssessmentDate} initialFocus /><Input type="time" className="mt-1" defaultValue={formAssessmentDate ? format(formAssessmentDate, "HH:mm") : "00:00"} onChange={(e) => {const time = e.target.value.split(':'); setFormAssessmentDate(current => { const d = current || new Date(); d.setHours(parseInt(time[0]), parseInt(time[1])); return new Date(d); })}}/></PopoverContent></Popover></div>
                <div><Label htmlFor="formDueDate">Due Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !formDueDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{formDueDate ? format(formDueDate, "PPP HH:mm") : <span>Pick date & time</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formDueDate} onSelect={setFormDueDate} initialFocus /><Input type="time" className="mt-1" defaultValue={formDueDate ? format(formDueDate, "HH:mm") : "23:59"} onChange={(e) => {const time = e.target.value.split(':'); setFormDueDate(current => { const d = current || new Date(); d.setHours(parseInt(time[0]), parseInt(time[1])); return new Date(d); })}}/></PopoverContent></Popover></div>
            </div>
            <div><Label htmlFor="formStatus">Status *</Label><Select value={formStatus} onValueChange={v=>setFormStatus(v as AssessmentStatus)} required><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{ASSESSMENT_STATUS_OPTIONS.map(s=><SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="formInstructions">Instructions</Label><Textarea id="formInstructions" value={formInstructions} onChange={e=>setFormInstructions(e.target.value)} rows={3}/></div>
            <DialogFooter className="pt-4"><DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{currentAssessment?.id ? "Save Changes" : "Create Assessment"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
