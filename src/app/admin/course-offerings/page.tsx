'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, Edit, Trash2, PlusCircle, BookOpenCheck, ArrowUpDown, Download, UploadCloud, FileSpreadsheet, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CourseOffering, Course, Batch, Faculty } from '@/types/entities';
import { courseOfferingService } from '@/lib/api/course-offerings';

interface CourseOfferingWithDetails extends CourseOffering {
  courseName?: string;
  batchName?: string;
  facultyNames?: string[];
  academicYear?: string;
  semester?: number;
  semesterDisplay?: string;
  programId?: string;
}

export default function CourseOfferingsPage() {
  const { toast } = useToast();
  const [courseOfferings, setCourseOfferings] = useState<CourseOfferingWithDetails[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    academicYear: 'all',
    semester: 'all',
    status: 'all',
    batchId: 'all'
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingOffering, setEditingOffering] = useState<CourseOfferingWithDetails | null>(null);
  
  // Bulk selection and advanced features
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof CourseOfferingWithDetails | 'none'>('academicYear');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
  
  // File handling state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Form state for creating/editing course offerings
  const [formData, setFormData] = useState({
    courseId: '',
    academicTermId: '',
    programId: '',
    semester: '',
    facultyIds: [] as string[],
    status: 'scheduled' as CourseOffering['status']
  });
  const [academicTerms, setAcademicTerms] = useState<any[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
  const [availableSemesters, setAvailableSemesters] = useState<number[]>([]);
  const [termInfo, setTermInfo] = useState<any>(null);

  // Fetch all data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [offeringsRes, coursesRes, batchesRes, facultiesRes, termsRes] = await Promise.all([
        fetch('/api/course-offerings'),
        fetch('/api/courses'),
        fetch('/api/batches'),
        fetch('/api/faculty'),
        fetch('/api/academic-terms')
      ]);

      const [offeringsData, coursesData, batchesData, facultiesData, termsData] = await Promise.all([
        offeringsRes.json(),
        coursesRes.json(),
        batchesRes.json(),
        facultiesRes.json(),
        termsRes.json()
      ]);

      // Enrich course offerings with additional details
      const enrichedOfferings = offeringsData.map((offering: CourseOffering) => {
        const course = coursesData.find((c: Course) => c.id === offering.courseId);
        const academicTerm = termsData?.data?.find((t: any) => t.id === offering.academicTermId);
        const batch = batchesData.find((b: Batch) => b.id === offering.batchId); // Legacy support
        const offeringFaculties = facultiesData.filter((f: Faculty) => 
          offering.facultyIds?.includes(f.id)
        );

        return {
          ...offering,
          courseName: course?.subjectName || 'Unknown Course',
          batchName: batch?.name || (academicTerm ? `${academicTerm.name} Batch` : 'Unknown Batch'),
          academicYear: offering.academicYear || academicTerm?.academicYear || 'Unknown Year',
          semester: offering.semester || academicTerm?.semesters?.[0] || 0, // Keep as number for form compatibility
          semesterDisplay: offering.semester ? `Sem ${offering.semester}` : (academicTerm?.semesters?.[0] ? `Sem ${academicTerm.semesters[0]}` : 'Unknown'), // For display only
          facultyNames: offeringFaculties.map((f: any) => f.displayName || f.fullName || f.firstName) || []
        };
      });

      setCourseOfferings(enrichedOfferings);
      setCourses(coursesData);
      setBatches(batchesData);
      setFaculties(facultiesData);
      setAcademicTerms(termsData.success ? termsData.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load course offerings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch term info and set up programs/semesters
  const fetchTermInfo = async (termId: string) => {
    if (!termId) {
      setAvailablePrograms([]);
      setAvailableSemesters([]);
      setTermInfo(null);
      setFilteredCourses([]);
      return;
    }

    setLoadingCourses(true);
    try {
      const response = await fetch(`/api/courses/by-term?termId=${termId}`);
      const data = await response.json();

      if (data.success) {
        const termInfo = data.data.termInfo;
        
        setTermInfo(termInfo);
        setAvailablePrograms(termInfo?.programs || []);
        setAvailableSemesters(termInfo?.semesters || []);
        
        // Only reset form data if this is not for editing (i.e. when editing, don't reset)
        if (!editingOffering) {
          setFormData(prev => ({ ...prev, programId: '', semester: '', courseId: '' }));
        }
        setFilteredCourses([]);
      } else {
        console.error('Error fetching term info:', data.error);
        setAvailablePrograms([]);
        setAvailableSemesters([]);
        setTermInfo(null);
        setFilteredCourses([]);
      }
    } catch (error) {
      console.error('Error fetching term info:', error);
      setAvailablePrograms([]);
      setAvailableSemesters([]);
      setTermInfo(null);
      setFilteredCourses([]);
      toast({
        title: "Error",
        description: "Failed to load term information",
        variant: "destructive",
      });
    } finally {
      setLoadingCourses(false);
    }
  };

  // Fetch filtered courses based on term, program, and semester selection
  const fetchFilteredCourses = async (termId: string, programId: string, semester: string, selectedCourseId?: string) => {
    if (!termId || !programId || !semester) {
      setFilteredCourses([]);
      return;
    }

    setLoadingCourses(true);
    try {
      // Call API with specific program and semester parameters for precise filtering
      const response = await fetch(`/api/courses/by-term?termId=${termId}&programId=${programId}&semester=${semester}`);
      const data = await response.json();

      if (data.success && data.data.courses) {
        // API now returns only courses for the specific program and semester
        setFilteredCourses(data.data.courses);
        
        // If a specific course ID was provided (for editing), ensure it's selected
        if (selectedCourseId) {
          setFormData(prev => ({ ...prev, courseId: selectedCourseId }));
        }
      } else {
        console.error('Error fetching filtered courses:', data.error);
        setFilteredCourses([]);
      }
    } catch (error) {
      console.error('Error fetching filtered courses:', error);
      setFilteredCourses([]);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    // Validation
    if (!formData.courseId || !formData.academicTermId || !formData.programId || !formData.semester || formData.facultyIds.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including academic term, program, semester, course, and at least one faculty member.",
        variant: "destructive",
      });
      return;
    }

    try {
      const method = editingOffering ? 'PUT' : 'POST';
      const url = editingOffering 
        ? `/api/course-offerings/${editingOffering.id}` 
        : '/api/course-offerings';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Course offering ${editingOffering ? 'updated' : 'created'} successfully`,
        });
        setShowCreateDialog(false);
        setEditingOffering(null);
        resetForm();
        fetchData();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || 'Failed to save course offering',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving course offering:', error);
      toast({
        title: "Error",
        description: "Failed to save course offering",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/course-offerings/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Course offering deleted successfully",
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete course offering",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting course offering:', error);
      toast({
        title: "Error",
        description: "Failed to delete course offering",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      courseId: '',
      academicTermId: '',
      programId: '',
      semester: '',
      facultyIds: [],
      status: 'scheduled'
    });
    setFilteredCourses([]);
    setAvailablePrograms([]);
    setAvailableSemesters([]);
    setTermInfo(null);
    setEditingOffering(null);
  };

  const openEditDialog = (offering: CourseOfferingWithDetails) => {
    setEditingOffering(offering);
    
    // For new course offerings, programId and semester should be available directly
    // For legacy offerings, we might need to derive them from the academic term
    let programId = offering.programId || '';
    let semester = offering.semester?.toString() || '';

    const newFormData = {
      courseId: offering.courseId,
      academicTermId: offering.academicTermId || '',
      programId,
      semester,
      facultyIds: offering.facultyIds || [],
      status: offering.status
    };

    setFormData(newFormData);
    
    // Load term info and then filtered courses
    if (offering.academicTermId) {
      fetchTermInfo(offering.academicTermId).then(() => {
        // Update form data again after term info is loaded, preserving the courseId
        setFormData(prev => ({
          ...prev,
          programId,
          semester,
          courseId: offering.courseId // Ensure courseId is preserved
        }));
        
        // After term info is loaded, if we have program/semester, load courses
        if (programId && semester) {
          fetchFilteredCourses(offering.academicTermId, programId, semester, offering.courseId);
        }
      });
    }
    
    setShowCreateDialog(true);
  };

  // Sorting function
  const handleSort = (field: keyof CourseOfferingWithDetails) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Bulk selection functions
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedOfferingIds(checked === true ? paginatedOfferings.map(o => o.id) : []);
  };

  const handleSelectOffering = (offeringId: string, checked: boolean) => {
    setSelectedOfferingIds(prev => 
      checked ? [...prev, offeringId] : prev.filter(id => id !== offeringId)
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedOfferingIds.length === 0) {
      toast({
        title: "No Offerings Selected",
        description: "Please select offerings to delete.",
        variant: "destructive",
      });
      return;
    }

    try {
      for (const id of selectedOfferingIds) {
        await fetch(`/api/course-offerings/${id}`, { method: 'DELETE' });
      }
      toast({
        title: "Success",
        description: `${selectedOfferingIds.length} course offering(s) deleted successfully`,
      });
      setSelectedOfferingIds([]);
      fetchData();
    } catch (error) {
      console.error('Error deleting selected offerings:', error);
      toast({
        title: "Error",
        description: "Failed to delete selected offerings",
        variant: "destructive",
      });
    }
  };

  // Filter and sort course offerings
  const filteredAndSortedOfferings = (() => {
    let result = courseOfferings.filter(offering => {
      const matchesSearch = !searchTerm || 
        offering.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offering.batchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offering.facultyNames?.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilters = 
        (filters.academicYear === 'all' || offering.academicYear === filters.academicYear) &&
        (filters.semester === 'all' || offering.semester?.toString() === filters.semester) &&
        (filters.status === 'all' || offering.status === filters.status) &&
        (filters.batchId === 'all' || offering.batchId === filters.batchId);

      return matchesSearch && matchesFilters;
    });

    // Sort the results
    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: unknown = a[sortField as keyof CourseOfferingWithDetails];
        let valB: unknown = b[sortField as keyof CourseOfferingWithDetails];
        
        if (valA === undefined || valA === null) return sortDirection === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null) return sortDirection === 'asc' ? -1 : 1;
        
        if (['semester', 'maxEnrollments', 'currentEnrollments'].includes(sortField as string)) {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        }
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
    }
    return result;
  })();

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedOfferings.length / itemsPerPage);
  const paginatedOfferings = (() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedOfferings.slice(startIndex, startIndex + itemsPerPage);
  })();

  // Selection state helpers
  const isAllSelectedOnPage = paginatedOfferings.length > 0 && paginatedOfferings.every(o => selectedOfferingIds.includes(o.id));
  const isSomeSelectedOnPage = paginatedOfferings.some(o => selectedOfferingIds.includes(o.id)) && !isAllSelectedOnPage;

  // File handling functions
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
    const inputElement = event.target as HTMLInputElement;
    if (!event.target.files || event.target.files.length === 0) {
      inputElement.value = '';
    }
  };

  const handleImportCourseOfferings = async () => {
    if (!selectedFile) {
      toast({
        title: "Import Error",
        description: "Please select a CSV file to import.",
        variant: "destructive",
      });
      return;
    }
    if (courses.length === 0 || batches.length === 0 || faculties.length === 0) {
      toast({
        title: "Import Error",
        description: "No courses, batches, or faculties loaded. Cannot map IDs.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const result = await courseOfferingService.importCourseOfferings(selectedFile, courses, batches, faculties);
      await fetchData();
      toast({
        title: "Import Successful",
        description: `${result.newCount} course offerings added, ${result.updatedCount} updated. Skipped: ${result.skippedCount}`,
      });
    } catch (error: unknown) {
      console.error('Error importing course offerings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not process the CSV file.';
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
      const fileInput = document.getElementById('csvImportCourseOfferings') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleExportCourseOfferings = async () => {
    if (filteredAndSortedOfferings.length === 0) {
      toast({
        title: "Export Canceled",
        description: "No course offerings to export (check filters).",
      });
      return;
    }
    
    try {
      const blob = await courseOfferingService.exportCourseOfferings('csv');
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "course_offerings_export.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Export Successful",
        description: "Course offerings exported to course_offerings_export.csv",
      });
    } catch (error) {
      console.error('Error exporting course offerings:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export course offerings.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSampleCsv = async () => {
    try {
      const blob = await courseOfferingService.downloadSampleCSV();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "sample_course_offerings_import.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Sample CSV Downloaded",
        description: "sample_course_offerings_import.csv downloaded.",
      });
    } catch (error) {
      console.error('Error downloading sample CSV:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download sample CSV.",
        variant: "destructive",
      });
    }
  };

  // Sortable table header component
  const SortableTableHeader = ({ field, label }: { field: keyof CourseOfferingWithDetails; label: string }) => (
    <TableHead onClick={() => handleSort(field)} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">
        {label}
        {sortField === field && (sortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" /> : <ArrowUpDown className="h-4 w-4 opacity-50" />)}
        {sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}
      </div>
    </TableHead>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-full sm:w-40"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <BookOpenCheck className="h-6 w-6" />
              Course Offerings Management
            </CardTitle>
            <CardDescription>
              Manage course offerings for different programs and semesters.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Course Offering
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOffering ? 'Edit Course Offering' : 'Create New Course Offering'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {/* Step 1: Select Academic Term */}
              <div className="md:col-span-2">
                <Label htmlFor="academicTermId">
                  Academic Term <span className="text-red-500">*</span>
                  <span className="text-xs text-muted-foreground ml-2">(Select term to show available programs and semesters)</span>
                </Label>
                <Select 
                  value={formData.academicTermId} 
                  onValueChange={(value) => {
                    setFormData({...formData, academicTermId: value, programId: '', semester: '', courseId: ''}); // Reset downstream selections
                    fetchTermInfo(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select academic term" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicTerms
                      .filter(term => ['active', 'draft'].includes(term.status))
                      .map((term) => (
                        <SelectItem key={term.id} value={term.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{term.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {term.academicYear}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2: Select Program */}
              <div>
                <Label htmlFor="programId">
                  Program <span className="text-red-500">*</span>
                  {availablePrograms.length > 0 && (
                    <span className="text-xs text-green-600 ml-2">
                      ({availablePrograms.length} available)
                    </span>
                  )}
                </Label>
                <Select 
                  value={formData.programId} 
                  onValueChange={(value) => {
                    // Only reset courseId if the program is actually changing (not just being set to initial value)
                    const shouldResetCourse = formData.programId !== '' && formData.programId !== value;
                    setFormData({...formData, programId: value, ...(shouldResetCourse && {courseId: ''})}); 
                    if (formData.semester) {
                      fetchFilteredCourses(formData.academicTermId, value, formData.semester);
                    }
                  }}
                  disabled={!formData.academicTermId || availablePrograms.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue 
                      placeholder={
                        !formData.academicTermId 
                          ? "Select academic term first" 
                          : availablePrograms.length === 0 
                            ? "No programs available"
                            : "Select program"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrograms.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{program.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {program.code}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 3: Select Semester */}
              <div>
                <Label htmlFor="semester">
                  Semester <span className="text-red-500">*</span>
                  {availableSemesters.length > 0 && (
                    <span className="text-xs text-green-600 ml-2">
                      ({availableSemesters.length} available)
                    </span>
                  )}
                </Label>
                <Select 
                  value={formData.semester} 
                  onValueChange={(value) => {
                    // Only reset courseId if the semester is actually changing (not just being set to initial value)
                    const shouldResetCourse = formData.semester !== '' && formData.semester !== value;
                    setFormData({...formData, semester: value, ...(shouldResetCourse && {courseId: ''})}); 
                    if (formData.programId) {
                      fetchFilteredCourses(formData.academicTermId, formData.programId, value);
                    }
                  }}
                  disabled={!formData.academicTermId || availableSemesters.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue 
                      placeholder={
                        !formData.academicTermId 
                          ? "Select academic term first" 
                          : availableSemesters.length === 0 
                            ? "No semesters available"
                            : "Select semester"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSemesters.map((semester) => (
                      <SelectItem key={semester} value={semester.toString()}>
                        Semester {semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 4: Select Course (filtered based on term, program, and semester) */}
              <div className="md:col-span-2">
                <Label htmlFor="courseId">
                  Course <span className="text-red-500">*</span>
                  {formData.programId && formData.semester && (
                    <span className="text-xs text-green-600 ml-2">
                      ({filteredCourses.length} courses available for {availablePrograms.find(p => p.id === formData.programId)?.name} - Semester {formData.semester})
                    </span>
                  )}
                </Label>
                <Select 
                  value={formData.courseId} 
                  onValueChange={(value) => setFormData({...formData, courseId: value})}
                  disabled={!formData.programId || !formData.semester || loadingCourses}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue 
                      placeholder={
                        !formData.academicTermId 
                          ? "Select academic term first" 
                          : !formData.programId
                            ? "Select program first"
                            : !formData.semester
                              ? "Select semester first"
                              : loadingCourses 
                                ? "Loading courses..." 
                                : filteredCourses.length === 0 
                                  ? "No courses available"
                                  : "Select course"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCourses.length > 0 && (
                      <>
                        {/* Group core courses */}
                        {filteredCourses.filter(course => !course.isElective).length > 0 && (
                          <>
                            <div className="px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50">
                              Core Courses
                            </div>
                            {filteredCourses
                              .filter(course => !course.isElective)
                              .map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{course.subjectName}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {course.subcode} • {course.credits} credits • Semester {course.semester}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            }
                          </>
                        )}
                        
                        {/* Group elective courses */}
                        {filteredCourses.filter(course => course.isElective).length > 0 && (
                          <>
                            <div className="px-2 py-1 text-xs font-semibold text-orange-600 bg-orange-50">
                              Elective Courses
                            </div>
                            {filteredCourses
                              .filter(course => course.isElective)
                              .map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{course.subjectName}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {course.subcode} • {course.credits} credits • Semester {course.semester}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            }
                          </>
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: CourseOffering['status']) => setFormData({...formData, status: value})}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="facultyIds">Assign Faculty *</Label>
                <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                  {faculties.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No faculty available</p>
                  ) : (
                    faculties.map((faculty) => (
                      <div key={faculty.id} className="flex items-center space-x-2 py-2">
                        <Checkbox
                          id={`faculty-${faculty.id}`}
                          checked={formData.facultyIds.includes(faculty.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                facultyIds: [...formData.facultyIds, faculty.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                facultyIds: formData.facultyIds.filter(id => id !== faculty.id)
                              });
                            }
                          }}
                        />
                        <label 
                          htmlFor={`faculty-${faculty.id}`} 
                          className="text-sm cursor-pointer flex-1"
                        >
                          {faculty.displayName || faculty.fullName || faculty.firstName || 'Unknown Faculty'}
                          {faculty.designation && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({faculty.designation})
                            </span>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {formData.facultyIds.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Please select at least one faculty member</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleCreateOrUpdate} className="w-full sm:w-auto">
                {editingOffering ? 'Update' : 'Create'} Course Offering
              </Button>
            </div>
          </DialogContent>
            </Dialog>
            <Button onClick={handleExportCourseOfferings} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4 dark:border-gray-700">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary"/>
              Import Course Offerings
            </h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input 
                id="csvImportCourseOfferings"
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
                className="flex-grow" 
                disabled={isImporting}
              />
              <Button 
                onClick={handleImportCourseOfferings}
                disabled={isImporting || !selectedFile}
                className="w-full sm:w-auto"
              >
                {isImporting ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /></> : <UploadCloud className="mr-2 h-4 w-4"/>}
                Import CSV
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
              </Button>
              <p className="text-xs text-muted-foreground">
                Use for importing course offering data with course, batch, academic year, semester, and faculty assignments.
              </p>
            </div>
          </div>
          <div className="mb-6 p-4 border rounded-lg space-y-4 dark:border-gray-700">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary"/>
              Filters & Search
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search courses, batches, faculty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Academic Year</Label>
              <Select value={filters.academicYear} onValueChange={(value) => setFilters({...filters, academicYear: value})}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  <SelectItem value="2025-26">2025-26</SelectItem>
                  <SelectItem value="2024-25">2024-25</SelectItem>
                  <SelectItem value="2023-24">2023-24</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Semester</Label>
              <Select value={filters.semester} onValueChange={(value) => setFilters({...filters, semester: value})}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All semesters</SelectItem>
                  {[1, 2, 3, 4, 5, 6].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Batch</Label>
              <Select value={filters.batchId} onValueChange={(value) => setFilters({...filters, batchId: value})}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All batches</SelectItem>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
          </div>

          {selectedOfferingIds.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <Button variant="destructive" onClick={handleDeleteSelected}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedOfferingIds.length})
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedOfferingIds.length} offering(s) selected.
              </span>
            </div>
          )}

          {/* Course Offerings Table */}
          <div className="mb-6 p-4 border rounded-lg space-y-4 dark:border-gray-700">
            <h3 className="text-lg font-medium">
              Course Offerings ({filteredAndSortedOfferings.length})
            </h3>
            {/* Mobile View */}
            <div className="block lg:hidden space-y-3">
            {paginatedOfferings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No course offerings found matching your criteria.
              </div>
            ) : (
              paginatedOfferings.map((offering) => (
                <Card key={offering.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Checkbox 
                          checked={selectedOfferingIds.includes(offering.id)} 
                          onCheckedChange={(checked) => handleSelectOffering(offering.id, !!checked)}
                          className="flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-sm">{offering.courseName}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {offering.batchName} • {offering.academicYear} • {offering.semesterDisplay}
                          </p>
                        </div>
                      </div>
                      <Badge className={
                        offering.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        offering.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                        offering.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {offering.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Faculty:</span>
                        <div className="mt-1 space-y-1">
                          {offering.facultyNames?.map((name, index) => (
                            <Badge key={`${offering.id}-faculty-${index}`} variant="secondary" className="text-xs mr-1">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Enrollments:</span>
                        <p className="mt-1">{offering.currentEnrollments || 0} / {offering.maxEnrollments || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(offering)}
                        className="text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(offering.id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block">
            {paginatedOfferings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No course offerings found matching your criteria.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={isAllSelectedOnPage || (paginatedOfferings.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)} 
                        onCheckedChange={(checked) => handleSelectAll(!!checked)} 
                        aria-label="Select all course offerings on this page"
                      />
                    </TableHead>
                    <SortableTableHeader field="courseName" label="Course" />
                    <SortableTableHeader field="batchName" label="Batch" />
                    <SortableTableHeader field="academicYear" label="Academic Year" />
                    <SortableTableHeader field="semester" label="Semester" />
                    <TableHead>Faculty</TableHead>
                    <SortableTableHeader field="status" label="Status" />
                    <TableHead>Enrollments</TableHead>
                    <TableHead className="text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOfferings.map((offering) => (
                    <TableRow key={offering.id} data-state={selectedOfferingIds.includes(offering.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedOfferingIds.includes(offering.id)} 
                          onCheckedChange={(checked) => handleSelectOffering(offering.id, !!checked)} 
                          aria-labelledby={`offering-name-${offering.id}`}
                        />
                      </TableCell>
                      <TableCell id={`offering-name-${offering.id}`} className="font-medium">
                        <div>
                          <div className="font-medium">{offering.courseName}</div>
                          <div className="text-sm text-gray-500">ID: {offering.courseId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{offering.batchName}</TableCell>
                      <TableCell>{offering.academicYear}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{offering.semesterDisplay}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {offering.facultyNames?.map((name, index) => (
                            <Badge key={`${offering.id}-faculty-${index}`} variant="secondary" className="text-xs mr-1">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          offering.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          offering.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                          offering.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {offering.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {offering.currentEnrollments || 0} / {offering.maxEnrollments || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(offering)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(offering.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedOfferings.length)} to {Math.min(currentPage * itemsPerPage, filteredAndSortedOfferings.length)} of {filteredAndSortedOfferings.length} offerings.
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(itemsPerPage)} onValueChange={(value) => {setItemsPerPage(Number(value)); setCurrentPage(1);}}>
              <SelectTrigger className="w-[70px] h-8 text-xs">
                <SelectValue placeholder={String(itemsPerPage)} />
              </SelectTrigger>
              <SelectContent side="top">
                {ITEMS_PER_PAGE_OPTIONS.map(size => (
                  <SelectItem key={size} value={String(size)} className="text-xs">{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="h-4 w-4" />
                <span className="sr-only">First</span>
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous</span>
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next</span>
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}>
                <ChevronsRight className="h-4 w-4" />
                <span className="sr-only">Last</span>
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}