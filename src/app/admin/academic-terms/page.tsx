"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Loader2, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Eye, Calendar, Users, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { AcademicTerm, Program, ProgramSemesterDateEntry } from '@/types/entities';

// Extended interfaces for API responses with populated data
interface ProgramDetails {
  id: string;
  name: string;
  code: string;
}

interface ExtendedProgramSemesterDateEntry extends ProgramSemesterDateEntry {
  programsWithDetails?: ProgramDetails[];
}

interface ExtendedAcademicTerm extends Omit<AcademicTerm, 'dateEntries'> {
  dateEntries: ExtendedProgramSemesterDateEntry[];
}

// Academic year options
const ACADEMIC_YEARS = [
  '2025-26', '2024-25', '2023-24', '2022-23', '2021-22', 
  '2020-21', '2019-20', '2018-19', '2017-18', '2016-17',
  '2015-16', '2014-15', '2013-14', '2012-13', '2011-12'
];

type SortField = keyof AcademicTerm | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

// Helper function to get available semesters based on term type
const getAvailableSemesters = (termType: 'Odd' | 'Even'): number[] => {
  if (termType === 'Odd') {
    return [1, 3, 5]; // Odd semesters
  } else {
    return [2, 4, 6]; // Even semesters
  }
};

export default function AcademicTermManagementPage() {
  const [academicTerms, setAcademicTerms] = useState<ExtendedAcademicTerm[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentTerm, setCurrentTerm] = useState<Partial<ExtendedAcademicTerm> | null>(null);
  const [viewTerm, setViewTerm] = useState<ExtendedAcademicTerm | null>(null);

  // Form state for table-style academic terms
  const [formAcademicYear, setFormAcademicYear] = useState('');
  const [formTerm, setFormTerm] = useState<'Odd' | 'Even'>('Odd');
  const [formDateEntries, setFormDateEntries] = useState<ProgramSemesterDateEntry[]>([]);
  const [formStatus, setFormStatus] = useState<'draft' | 'active' | 'completed' | 'cancelled'>('draft');
  const [formGtuCalendarUrl, setFormGtuCalendarUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('all');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Pagination and sorting
  const [sortField, setSortField] = useState<SortField>('academicYear');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [termsResponse, programsResponse] = await Promise.all([
        fetch('/api/academic-terms'),
        fetch('/api/programs')
      ]);

      const [termsData, programsData] = await Promise.all([
        termsResponse.json(),
        programsResponse.json()
      ]);

      setAcademicTerms(termsData.success ? termsData.data : []);
      setPrograms(programsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load academic terms data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormAcademicYear('');
    setFormTerm('Odd');
    setFormDateEntries([]);
    setFormStatus('draft');
    setFormGtuCalendarUrl('');
    setFormNotes('');
    setCurrentTerm(null);
  };

  // Handle term change and filter semester options accordingly
  const handleTermChange = (newTerm: 'Odd' | 'Even') => {
    setFormTerm(newTerm);
    
    // Filter existing date entries to only include valid semesters for the new term
    const availableSemesters = getAvailableSemesters(newTerm);
    const updatedEntries = formDateEntries.map(entry => ({
      ...entry,
      semesters: (entry.semesters || []).filter(sem => availableSemesters.includes(sem))
    })).filter(entry => entry.semesters.length > 0); // Remove entries with no valid semesters
    
    setFormDateEntries(updatedEntries);
  };

  // Add date entry
  const addDateEntry = () => {
    setFormDateEntries([...formDateEntries, { programs: [], semesters: [], startDate: '', endDate: '' }]);
  };

  // Remove date entry
  const removeDateEntry = (index: number) => {
    const updated = formDateEntries.filter((_, i) => i !== index);
    setFormDateEntries(updated);
  };

  // Update date entry
  const updateDateEntry = (index: number, field: keyof ProgramSemesterDateEntry, value: string | string[] | number[]) => {
    const updated = [...formDateEntries];
    updated[index] = { ...updated[index], [field]: value };
    setFormDateEntries(updated);
  };

  // Open create dialog
  const openCreateDialog = () => {
    resetForm();
    setFormDateEntries([{ programs: [], semesters: [], startDate: '', endDate: '' }]); // Initialize with one empty entry
    setIsDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (term: AcademicTerm) => {
    setCurrentTerm(term);
    setFormAcademicYear(term.academicYear);
    setFormTerm(term.term);
    
    // Convert ISO date strings to date input format (YYYY-MM-DD)
    const formattedDateEntries = (term.dateEntries || []).map(entry => ({
      ...entry,
      startDate: entry.startDate ? new Date(entry.startDate).toISOString().split('T')[0] : '',
      endDate: entry.endDate ? new Date(entry.endDate).toISOString().split('T')[0] : ''
    }));
    
    setFormDateEntries(formattedDateEntries);
    setFormStatus(term.status);
    setFormGtuCalendarUrl(term.gtuCalendarUrl || '');
    setFormNotes(term.notes || '');
    setIsDialogOpen(true);
  };

  // Open view dialog
  const openViewDialog = (term: AcademicTerm) => {
    setViewTerm(term);
    setIsViewDialogOpen(true);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formAcademicYear || !formTerm) {
      toast({
        title: "Validation Error",
        description: "Please fill in academic year and term",
        variant: "destructive",
      });
      return;
    }

    // Validate date entries
    if (!formDateEntries || formDateEntries.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one date entry",
        variant: "destructive",
      });
      return;
    }

    // Validate each date entry
    for (let i = 0; i < formDateEntries.length; i++) {
      const entry = formDateEntries[i];
      
      if (!entry.programs || entry.programs.length === 0) {
        toast({
          title: "Validation Error",
          description: `Entry ${i + 1}: Please select at least one program`,
          variant: "destructive",
        });
        return;
      }
      
      if (!entry.semesters || entry.semesters.length === 0) {
        toast({
          title: "Validation Error",
          description: `Entry ${i + 1}: Please select at least one semester`,
          variant: "destructive",
        });
        return;
      }
      
      if (!entry.startDate || !entry.endDate) {
        toast({
          title: "Validation Error",
          description: `Entry ${i + 1}: Please fill in both start and end dates`,
          variant: "destructive",
        });
        return;
      }

      // Validate that start date is before end date
      const startDate = new Date(entry.startDate);
      const endDate = new Date(entry.endDate);
      
      if (startDate >= endDate) {
        toast({
          title: "Validation Error",
          description: `Entry ${i + 1}: Start date must be before end date`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const termData = {
        academicYear: formAcademicYear,
        term: formTerm,
        dateEntries: formDateEntries.map(entry => ({
          programs: entry.programs,
          semesters: entry.semesters,
          startDate: new Date(entry.startDate).toISOString(),
          endDate: new Date(entry.endDate).toISOString()
        })),
        status: formStatus,
        gtuCalendarUrl: formGtuCalendarUrl || undefined,
        notes: formNotes || undefined
      };

      const response = await fetch(
        currentTerm ? `/api/academic-terms/${currentTerm.id}` : '/api/academic-terms',
        {
          method: currentTerm ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(termData),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `Academic term ${currentTerm ? 'updated' : 'created'} successfully`,
        });
        setIsDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || 'Failed to save academic term',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving academic term:', error);
      toast({
        title: "Error",
        description: "Failed to save academic term",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (term: AcademicTerm) => {
    if (!confirm(`Are you sure you want to delete the academic term "${term.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/academic-terms/${term.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Academic term deleted successfully",
        });
        fetchData();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || 'Failed to delete academic term',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting academic term:', error);
      toast({
        title: "Error",
        description: "Failed to delete academic term",
        variant: "destructive",
      });
    }
  };

  // Filtering and sorting logic
  const filteredAndSortedTerms = useMemo(() => {
    let result = academicTerms.filter(term => {
      const matchesSearch = term.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (term.programAssignments || []).some(pa => {
                             const program = programs.find(p => p.id === pa.programId);
                             return program?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    program?.code.toLowerCase().includes(searchTerm.toLowerCase());
                           });

      const matchesFilters = 
        (filterAcademicYear === 'all' || term.academicYear === filterAcademicYear) &&
        (filterProgram === 'all' || (term.programAssignments || []).some(pa => pa.programId === filterProgram)) &&
        (filterTerm === 'all' || term.term === filterTerm) &&
        (filterStatus === 'all' || term.status === filterStatus);

      return matchesSearch && matchesFilters;
    });

    // Sort the results
    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: unknown = a[sortField as keyof AcademicTerm];
        let valB: unknown = b[sortField as keyof AcademicTerm];

        // Handle special cases
        if (sortField === 'createdAt' || sortField === 'updatedAt' || sortField === 'startDate' || sortField === 'endDate') {
          valA = new Date(valA as string).getTime();
          valB = new Date(valB as string).getTime();
        }

        if (valA == null) valA = '';
        if (valB == null) valB = '';

        if ((valA as string | number) < (valB as string | number)) return sortDirection === 'asc' ? -1 : 1;
        if ((valA as string | number) > (valB as string | number)) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [academicTerms, searchTerm, filterAcademicYear, filterProgram, filterTerm, filterStatus, sortField, sortDirection]);

  // Pagination
  const totalItems = filteredAndSortedTerms.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentTerms = filteredAndSortedTerms.slice(startIndex, endIndex);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Academic Terms</h1>
          <p className="text-muted-foreground">Manage GTU academic terms and calendars</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Academic Term
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {currentTerm ? 'Edit Academic Term' : 'Create New Academic Term'}
              </DialogTitle>
              <DialogDescription>
                {currentTerm ? 'Update the academic term details.' : 'Create a new academic term for a program.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="academicYear">Academic Year *</Label>
                  <Select value={formAcademicYear} onValueChange={setFormAcademicYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_YEARS.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>


                <div>
                  <Label htmlFor="term">Term *</Label>
                  <Select value={formTerm} onValueChange={handleTermChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Odd">Odd (Semesters 1, 3, 5)</SelectItem>
                      <SelectItem value="Even">Even (Semesters 2, 4, 6)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formStatus} onValueChange={(value: 'draft' | 'active' | 'completed' | 'cancelled') => setFormStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>

              {/* Date Entries Table */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <Label className="text-base font-semibold">Program-Semester Date Entries *</Label>
                    <p className="text-sm text-muted-foreground">
                      Add entries with different programs, semesters, and date ranges. Group programs and semesters that share the same dates.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDateEntry}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  {/* Table Header */}
                  <div className="bg-muted/50 px-3 py-2 border-b">
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                      <div className="col-span-1">#</div>
                      <div className="col-span-2">Programs</div>
                      <div className="col-span-2">Semesters</div>
                      <div className="col-span-3">Start Date</div>
                      <div className="col-span-3">End Date</div>
                      <div className="col-span-1">Actions</div>
                    </div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y">
                    {formDateEntries.map((entry, index) => (
                      <div key={index} className="px-3 py-2 hover:bg-muted/30">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          {/* Row Number */}
                          <div className="col-span-1">
                            <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
                          </div>

                          {/* Programs */}
                          <div className="col-span-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1">
                                {(entry.programs || []).map(programId => {
                                  const program = programs.find(p => p.id === programId || (p as any)._id === programId);
                                  return (
                                    <span key={programId} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                                      {program?.code || programId}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newPrograms = (entry.programs || []).filter(p => p !== programId);
                                          updateDateEntry(index, 'programs', newPrograms);
                                        }}
                                        className="hover:bg-primary/20 rounded-full p-0.5"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                              <Select onValueChange={(value) => {
                                if (value && !(entry.programs || []).includes(value)) {
                                  updateDateEntry(index, 'programs', [...(entry.programs || []), value]);
                                }
                              }}>
                                <SelectTrigger className="h-6 text-xs">
                                  <SelectValue placeholder="+ Add" />
                                </SelectTrigger>
                                <SelectContent>
                                  {programs.filter(p => !(entry.programs || []).includes(p.id) && !(entry.programs || []).includes((p as any)._id)).map((program) => (
                                    <SelectItem key={program.id} value={program.id || (program as any)._id}>
                                      {program.code}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Semesters */}
                          <div className="col-span-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1">
                                {(entry.semesters || []).map(semester => (
                                  <span key={semester} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-secondary/80 text-secondary-foreground rounded text-xs font-medium">
                                    {semester}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newSemesters = (entry.semesters || []).filter(s => s !== semester);
                                        updateDateEntry(index, 'semesters', newSemesters);
                                      }}
                                      className="hover:bg-secondary rounded-full p-0.5"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <Select onValueChange={(value) => {
                                const semesterNum = parseInt(value);
                                if (semesterNum && !(entry.semesters || []).includes(semesterNum)) {
                                  updateDateEntry(index, 'semesters', [...(entry.semesters || []), semesterNum]);
                                }
                              }}>
                                <SelectTrigger className="h-6 text-xs">
                                  <SelectValue placeholder="+ Add" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableSemesters(formTerm).filter(s => !(entry.semesters || []).includes(s)).map((semester) => (
                                    <SelectItem key={semester} value={semester.toString()}>
                                      {semester}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Start Date */}
                          <div className="col-span-3">
                            <Input
                              type="date"
                              value={entry.startDate || ''}
                              onChange={(e) => updateDateEntry(index, 'startDate', e.target.value)}
                              required
                              className="h-8 text-xs font-medium w-full min-w-0"
                            />
                          </div>

                          {/* End Date */}
                          <div className="col-span-3">
                            <Input
                              type="date"
                              value={entry.endDate || ''}
                              onChange={(e) => updateDateEntry(index, 'endDate', e.target.value)}
                              required
                              className="h-8 text-xs font-medium w-full min-w-0"
                            />
                          </div>

                          {/* Actions */}
                          <div className="col-span-1 flex items-center justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDateEntry(index)}
                              disabled={formDateEntries.length === 1}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gtuCalendarUrl">GTU Calendar URL</Label>
                  <Input
                    id="gtuCalendarUrl"
                    type="url"
                    value={formGtuCalendarUrl}
                    onChange={(e) => setFormGtuCalendarUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional notes about this academic term..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {currentTerm ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    currentTerm ? 'Update Term' : 'Create Term'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Terms</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academicTerms.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Terms</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {academicTerms.filter(t => t.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programs Covered</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(academicTerms.map(t => t.programId)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Academic Year</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2024-25</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search and Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search terms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="filterAcademicYear">Academic Year</Label>
              <Select value={filterAcademicYear} onValueChange={setFilterAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {ACADEMIC_YEARS.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filterProgram">Program</Label>
              <Select value={filterProgram} onValueChange={setFilterProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="All programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filterTerm">Term</Label>
              <Select value={filterTerm} onValueChange={setFilterTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="All terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  <SelectItem value="Odd">Odd</SelectItem>
                  <SelectItem value="Even">Even</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filterStatus">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Academic Terms ({totalItems})</CardTitle>
              <CardDescription>
                Showing {startIndex + 1} to {endIndex} of {totalItems} terms
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="itemsPerPage">Items per page:</Label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option.toString()}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('name')} className="h-8 p-0 font-semibold">
                      Term Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('academicYear')} className="h-8 p-0 font-semibold">
                      Academic Year
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('term')} className="h-8 p-0 font-semibold">
                      Term
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Semesters</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('startDate')} className="h-8 p-0 font-semibold">
                      Duration
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('status')} className="h-8 p-0 font-semibold">
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTerms.length > 0 ? (
                  currentTerms.map((term) => (
                    <TableRow key={term.id}>
                      <TableCell className="font-medium">{term.name}</TableCell>
                      <TableCell>{term.academicYear}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {term.dateEntries && term.dateEntries.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {[...new Set(term.dateEntries.flatMap(entry => 
                                (entry.programsWithDetails || entry.programs || []).map((programOrId: any) => {
                                  const program = typeof programOrId === 'object' && programOrId?.name 
                                    ? programOrId 
                                    : programs.find(p => p.id === programOrId || (p as any)._id === programOrId);
                                  return program?.code || programOrId;
                                })
                              ))].map((programCode, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                                  {programCode}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">No programs</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={term.term === 'Odd' ? 'default' : 'secondary'}>
                          {term.term}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {term.dateEntries && term.dateEntries.length > 0 
                            ? [...new Set(term.dateEntries.flatMap(entry => entry.semesters || []))].sort((a, b) => a - b).join(', ')
                            : 'N/A'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {term.dateEntries && term.dateEntries.length > 0 ? (
                            <div className="space-y-1">
                              {term.dateEntries.map((entry, index) => (
                                <div key={index} className="text-muted-foreground">
                                  {entry.startDate && entry.endDate 
                                    ? `${new Date(entry.startDate).toLocaleDateString()} - ${new Date(entry.endDate).toLocaleDateString()}`
                                    : 'No dates'
                                  }
                                </div>
                              ))}
                            </div>
                          ) : term.startDate && term.endDate ? (
                            <div className="text-muted-foreground">
                              {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No dates</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            term.status === 'active' ? 'default' :
                            term.status === 'completed' ? 'secondary' :
                            term.status === 'cancelled' ? 'destructive' : 'outline'
                          }
                        >
                          {term.status.charAt(0).toUpperCase() + term.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewDialog(term)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(term)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(term)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {filteredAndSortedTerms.length === 0 ? "No academic terms found." : "No results match your filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {endIndex} of {totalItems} terms
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-1">
                  <span className="text-sm">Page</span>
                  <Input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        handlePageChange(page);
                      }
                    }}
                    className="w-16 h-8 text-center"
                  />
                  <span className="text-sm">of {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Academic Term Details</DialogTitle>
            <DialogDescription>
              View detailed information about this academic term.
            </DialogDescription>
          </DialogHeader>
          {viewTerm && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Term Name</Label>
                  <div className="font-medium">{viewTerm.name}</div>
                </div>
                <div>
                  <Label>Academic Year</Label>
                  <div className="font-medium">{viewTerm.academicYear}</div>
                </div>
                <div className="md:col-span-2">
                  <Label>Programs & Schedules</Label>
                  <div className="mt-2">
                    {viewTerm.dateEntries && viewTerm.dateEntries.length > 0 ? (
                      <div className="space-y-3">
                        {viewTerm.dateEntries.map((entry, index) => (
                          <div key={index} className="border rounded-lg p-3 bg-card">
                            <div className="flex justify-between items-start mb-3">
                              <div className="font-medium text-sm text-primary">
                                Schedule {index + 1}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Semesters: {(entry.semesters || []).join(', ')}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              <div>
                                <div className="text-xs font-medium text-muted-foreground mb-1">Programs</div>
                                <div className="space-y-1">
                                  {(entry.programsWithDetails || entry.programs || []).map((programOrId: any, pIndex: number) => {
                                    const program = typeof programOrId === 'object' && programOrId?.name 
                                      ? programOrId 
                                      : programs.find(p => p.id === programOrId || (p as any)._id === programOrId);
                                    
                                    const programKey = typeof programOrId === 'object' ? programOrId.id || pIndex : programOrId;
                                    
                                    return (
                                      <div key={programKey} className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                        <div className="text-sm">
                                          <span className="font-medium">{program?.name || 'Unknown Program'}</span>
                                          <span className="text-muted-foreground ml-1">({program?.code || programKey})</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-xs font-medium text-muted-foreground mb-1">Duration</div>
                                <div className="text-sm font-medium">
                                  {entry.startDate && entry.endDate 
                                    ? `${new Date(entry.startDate).toLocaleDateString()} - ${new Date(entry.endDate).toLocaleDateString()}`
                                    : 'No dates configured'
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No programs configured</div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Term Type</Label>
                  <Badge variant={viewTerm.term === 'Odd' ? 'default' : 'secondary'}>
                    {viewTerm.term}
                  </Badge>
                </div>
                <div>
                  <Label>Configured Semesters</Label>
                  <div className="font-medium">
                    {viewTerm.dateEntries && viewTerm.dateEntries.length > 0 
                      ? [...new Set(viewTerm.dateEntries.flatMap(entry => entry.semesters || []))].sort((a, b) => a - b).join(', ')
                      : 'N/A'
                    }
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge 
                    variant={
                      viewTerm.status === 'active' ? 'default' :
                      viewTerm.status === 'completed' ? 'secondary' :
                      viewTerm.status === 'cancelled' ? 'destructive' : 'outline'
                    }
                  >
                    {viewTerm.status.charAt(0).toUpperCase() + viewTerm.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <Label>Max Enrollment Per Course</Label>
                  <div className="font-medium">{viewTerm.maxEnrollmentPerCourse}</div>
                </div>
                {viewTerm.gtuCalendarUrl && (
                  <div>
                    <Label>GTU Calendar</Label>
                    <div>
                      <a 
                        href={viewTerm.gtuCalendarUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Calendar
                      </a>
                    </div>
                  </div>
                )}
              </div>
              {viewTerm.notes && (
                <div>
                  <Label>Notes</Label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm">
                    {viewTerm.notes}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <Label>Created</Label>
                  <div>{new Date(viewTerm.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <div>{new Date(viewTerm.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}