
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Faculty, Department } from '@/types/entities';
import { facultyService } from '@/lib/api/faculty';
import { courseOfferingService } from '@/lib/api/courseOfferings';
import { courseService } from '@/lib/api/courses';
import { departmentService } from '@/lib/api/departments';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';

interface EnrichedFacultyWorkload extends Faculty {
  totalTeachingHours: number;
  assignedOfferingsDetails: Array<{
    courseName: string;
    courseCode: string;
    batchName: string;
    programCode: string;
    semester: number;
    hours: number;
  }>;
}

type SortField = keyof EnrichedFacultyWorkload | 'departmentName' | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function FacultyWorkloadPage() {
  const [facultyWorkloads, setFacultyWorkloads] = useState<EnrichedFacultyWorkload[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('lastName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  useEffect(() => {
    const fetchWorkloadData = async () => {
      setIsLoading(true);
      try {
        const [
          facultyData, 
          offeringsData, 
          coursesData, 
          deptData,
          programsData,
          batchesData
        ] = await Promise.all([
          facultyService.getAllFaculty(),
          courseOfferingService.getAllCourseOfferings(),
          courseService.getAllCourses(),
          departmentService.getAllDepartments(),
          programService.getAllPrograms(),
          batchService.getAllBatches(),
        ]);
        
        setDepartments(deptData);

        const enrichedData = facultyData.map(faculty => {
          let totalTeachingHours = 0;
          const assignedOfferingsDetails: EnrichedFacultyWorkload['assignedOfferingsDetails'] = [];

          offeringsData.forEach(offering => {
            if (offering.facultyIds.includes(faculty.id)) {
              const course = coursesData.find(c => c.id === offering.courseId);
              const batch = batchesData.find(b => b.id === offering.batchId);
              const program = batch ? programsData.find(p => p.id === batch.programId) : undefined;

              if (course) {
                const offeringHours = (course.lectureHours || 0) + (course.tutorialHours || 0) + (course.practicalHours || 0);
                totalTeachingHours += offeringHours;
                assignedOfferingsDetails.push({
                  courseName: course.subjectName,
                  courseCode: course.subcode,
                  batchName: batch?.name || 'N/A',
                  programCode: program?.code || 'N/A',
                  semester: offering.semester,
                  hours: offeringHours,
                });
              }
            }
          });
          return { ...faculty, totalTeachingHours, assignedOfferingsDetails };
        });
        setFacultyWorkloads(enrichedData);

      } catch (error) {
        console.error("Failed to load workload data", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load faculty workload data." });
      }
      setIsLoading(false);
    };
    fetchWorkloadData();
  }, [toast]);

  const filteredAndSortedWorkloads = useMemo(() => {
    let result = [...facultyWorkloads];
    if (searchTerm) {
      result = result.filter(f => 
        (f.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (f.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        f.staffCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterDepartment !== 'all') {
      result = result.filter(f => f.department === filterDepartment);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: any, valB: any;
        if (sortField === 'departmentName') { // Assuming Faculty has department name directly
            valA = a.department || '';
            valB = b.department || '';
        } else {
            valA = a[sortField as keyof EnrichedFacultyWorkload];
            valB = b[sortField as keyof EnrichedFacultyWorkload];
        }
        
        if (valA === undefined || valA === null) return sortDirection === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null) return sortDirection === 'asc' ? -1 : 1;
        if (typeof valA === 'string' && typeof valB === 'string') return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        if (typeof valA === 'number' && typeof valB === 'number') return sortDirection === 'asc' ? valA - valB : valB - valA;
        return 0;
      });
    }
    return result;
  }, [facultyWorkloads, searchTerm, filterDepartment, sortField, sortDirection]);
  
  const totalPages = Math.ceil(filteredAndSortedWorkloads.length / itemsPerPage);
  const paginatedWorkloads = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedWorkloads.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedWorkloads, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterDepartment, itemsPerPage]);

  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => { setSortField(field); setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">{label}{sortField === field && <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" />}{sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}</div>
    </TableHead>
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Briefcase className="h-6 w-6" /> Faculty Workload Overview
          </CardTitle>
          <CardDescription>
            View teaching loads and assigned courses for faculty members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="searchFacultyWorkload">Search Faculty</Label>
              <div className="relative">
                 <Input id="searchFacultyWorkload" placeholder="Name, Staff Code, Department..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-8"/>
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterWorkloadDepartment">Filter by Department</Label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger id="filterWorkloadDepartment"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHeader field="lastName" label="Faculty Name" />
                <SortableTableHeader field="staffCode" label="Staff Code" />
                <SortableTableHeader field="departmentName" label="Department" />
                <SortableTableHeader field="designation" label="Designation" />
                <SortableTableHeader field="totalTeachingHours" label="Total Hours" />
                <TableHead>Assigned Courses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedWorkloads.map((faculty) => (
                <TableRow key={faculty.id}>
                  <TableCell className="font-medium">{faculty.lastName}, {faculty.firstName} {faculty.middleName || ''}</TableCell>
                  <TableCell>{faculty.staffCode}</TableCell>
                  <TableCell>{faculty.department}</TableCell>
                  <TableCell>{faculty.designation || 'N/A'}</TableCell>
                  <TableCell className="text-center font-semibold">{faculty.totalTeachingHours}</TableCell>
                  <TableCell>
                    {faculty.assignedOfferingsDetails.length > 0 ? (
                      <ul className="list-disc list-inside text-xs">
                        {faculty.assignedOfferingsDetails.map((offering, idx) => (
                          <li key={idx} title={`${offering.courseName} (${offering.courseCode}) - ${offering.programCode} ${offering.batchName} Sem ${offering.semester} (${offering.hours} hrs)`}>
                            {offering.courseCode} ({offering.hours}h)
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-muted-foreground">No courses assigned</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {paginatedWorkloads.length === 0 && (
                 <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No faculty workload data found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedWorkloads.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedWorkloads.length): 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedWorkloads.length)} of {filteredAndSortedWorkloads.length} faculty.
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

