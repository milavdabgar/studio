
"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Edit, Trash2, ClipboardList, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Course, Department, Program } from '@/types/entities';
import { courseService } from '@/lib/api/courses';
import { departmentService } from '@/lib/api/departments';
import { programService } from '@/lib/api/programs';

// Dropdown options for categorical fields
const ACADEMIC_YEARS = [
  '2025-26', '2024-25', '2023-24', '2022-23', '2021-22', 
  '2020-21', '2019-20', '2018-19', '2017-18', '2016-17',
  '2015-16', '2014-15', '2013-14', '2012-13', '2011-12'
];

const COURSE_CATEGORIES = [
  'Basic Science Courses',
  'Engineering Science Courses', 
  'Professional Core Courses',
  'Professional Elective Courses',
  'Humanities and Social Science, including Management Courses',
  'Mandatory Non-Credit Courses – Audit Course',
  'Core',
  'Elective',
  'Compulsory'
];

const EXAM_DURATIONS = [
  '2 Hrs', '2.5 Hrs', '3 Hrs', '3.5 Hrs', '4 Hrs'
];

const PRACTICAL_EXAM_DURATIONS = [
  '2 Hrs', '3 Hrs', '4 Hrs', '6 Hrs', '8 Hrs'
];

type SortField = keyof Course | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function CourseManagementPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Partial<Course> | null>(null);
  const [viewCourse, setViewCourse] = useState<Course | null>(null);

  // Form state
  const [formSubcode, setFormSubcode] = useState('');
  const [formEffFrom, setFormEffFrom] = useState('');
  const [formSubjectName, setFormSubjectName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSemester, setFormSemester] = useState<number>(1);
  const [formLectureHours, setFormLectureHours] = useState<number>(0);
  const [formTutorialHours, setFormTutorialHours] = useState<number>(0);
  const [formPracticalHours, setFormPracticalHours] = useState<number>(0);
  const [formTheoryEseMarks, setFormTheoryEseMarks] = useState<number>(0);
  const [formTheoryPaMarks, setFormTheoryPaMarks] = useState<number>(0);
  const [formPracticalEseMarks, setFormPracticalEseMarks] = useState<number>(0);
  const [formPracticalPaMarks, setFormPracticalPaMarks] = useState<number>(0);
  const [formIsElective, setFormIsElective] = useState(false);
  const [formIsTheory, setFormIsTheory] = useState(true);
  const [formTheoryExamDuration, setFormTheoryExamDuration] = useState('');
  const [formIsPractical, setFormIsPractical] = useState(false);
  const [formPracticalExamDuration, setFormPracticalExamDuration] = useState('');
  const [formIsFunctional, setFormIsFunctional] = useState(true);
  const [formIsSemiPractical, setFormIsSemiPractical] = useState(false);
  const [formRemarks, setFormRemarks] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState<string>('');
  const [formProgramId, setFormProgramId] = useState<string>('');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGtuFile, setSelectedGtuFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemesterVal, setFilterSemesterVal] = useState<string>('all');
  const [filterProgramVal, setFilterProgramVal] = useState<string>('all');
  const [filterEffFromVal, setFilterEffFromVal] = useState<string>('all');

  const [sortField, setSortField] = useState<SortField>('effFrom');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [courseData, deptData, progData] = await Promise.all([
        courseService.getAllCourses(),
        departmentService.getAllDepartments(),
        programService.getAllPrograms()
      ]);
      setCourses(courseData);
      setDepartments(deptData);
      setPrograms(progData);
      if (deptData.length > 0 && !formDepartmentId) {
        setFormDepartmentId(deptData[0].id);
      }
    } catch (error) {
      console.error("Failed to load data", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load initial course data." });
    }
    setIsLoading(false);
  }, [toast, formDepartmentId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (formDepartmentId) {
      setFilteredPrograms(programs.filter(p => p.departmentId === formDepartmentId));
      if(!programs.find(p => p.id === formProgramId && p.departmentId === formDepartmentId)){
        setFormProgramId(''); 
      }
    } else {
      setFilteredPrograms(programs); // Show all programs if no department selected, or handle as needed
    }
  }, [formDepartmentId, programs, formProgramId]);


  const resetForm = () => {
    setFormSubcode(''); setFormEffFrom(''); setFormSubjectName('');
    setFormCategory(''); setFormSemester(1); setFormLectureHours(0); setFormTutorialHours(0);
    setFormPracticalHours(0); setFormTheoryEseMarks(0); setFormTheoryPaMarks(0);
    setFormPracticalEseMarks(0); setFormPracticalPaMarks(0); setFormIsElective(false);
    setFormIsTheory(true); setFormTheoryExamDuration(''); setFormIsPractical(false);
    setFormPracticalExamDuration(''); setFormIsFunctional(true); setFormIsSemiPractical(false);
    setFormRemarks(''); 
    setFormDepartmentId(departments.length > 0 ? departments[0].id : '');
    setFormProgramId('');
    setCurrentCourse(null);
  };

  const handleEdit = (course: Course) => {
    setCurrentCourse(course);
    setFormSubcode(course.subcode);
    setFormEffFrom(course.effFrom || ''); setFormSubjectName(course.subjectName);
    setFormCategory(course.category || ''); setFormSemester(course.semester);
    setFormLectureHours(course.lectureHours); setFormTutorialHours(course.tutorialHours);
    setFormPracticalHours(course.practicalHours);
    setFormTheoryEseMarks(course.theoryEseMarks); setFormTheoryPaMarks(course.theoryPaMarks);
    setFormPracticalEseMarks(course.practicalEseMarks); setFormPracticalPaMarks(course.practicalPaMarks);
    setFormIsElective(course.isElective); setFormIsTheory(course.isTheory);
    setFormTheoryExamDuration(course.theoryExamDuration || '');
    setFormIsPractical(course.isPractical); setFormPracticalExamDuration(course.practicalExamDuration || '');
    setFormIsFunctional(course.isFunctional); setFormIsSemiPractical(course.isSemiPractical || false);
    setFormRemarks(course.remarks || '');
    setFormDepartmentId(course.departmentId);
    setFormProgramId(course.programId);
    setIsDialogOpen(true);
  };

  const handleView = (course: Course) => {
    setViewCourse(course);
    setIsViewDialogOpen(true);
  };

  const handleAddNew = () => {
    if (departments.length === 0 || programs.length === 0) {
      toast({ variant: "destructive", title: "Cannot Add Course", description: "Departments or Programs not available. Please create them first." });
      return;
    }
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (courseId: string) => {
    setIsSubmitting(true);
    try {
      await courseService.deleteCourse(courseId);
      await fetchInitialData(); // Re-fetch courses
      setSelectedCourseIds(prev => prev.filter(id => id !== courseId));
      toast({ title: "Course Deleted", description: "The course has been successfully deleted." });
    } catch(error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete course." });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formSubcode.trim() || !formSubjectName.trim() || !formDepartmentId || !formProgramId || formSemester <=0 ) {
      toast({ variant: "destructive", title: "Validation Error", description: "Subcode, Subject Name, Department, Program and Semester are required."});
      return;
    }
    const numericFields = {formLectureHours, formTutorialHours, formPracticalHours, formTheoryEseMarks, formTheoryPaMarks, formPracticalEseMarks, formPracticalPaMarks};
    for (const [key, value] of Object.entries(numericFields)) {
        if (value < 0 || isNaN(value)) {
            toast({ variant: "destructive", title: "Validation Error", description: `${key.replace('form','')} must be a non-negative number.` });
            return;
        }
    }

    setIsSubmitting(true);
    
    const credits = formLectureHours + formTutorialHours + formPracticalHours;
    const totalMarks = formTheoryEseMarks + formTheoryPaMarks + formPracticalEseMarks + formPracticalPaMarks;

    const courseData: Omit<Course, 'id'> = { 
      subcode: formSubcode.trim().toUpperCase(),
      effFrom: formEffFrom.trim() || undefined, subjectName: formSubjectName.trim(),
      category: formCategory.trim() || undefined, semester: formSemester,
      lectureHours: formLectureHours, tutorialHours: formTutorialHours, practicalHours: formPracticalHours,
      credits, theoryEseMarks: formTheoryEseMarks, theoryPaMarks: formTheoryPaMarks,
      practicalEseMarks: formPracticalEseMarks, practicalPaMarks: formPracticalPaMarks, totalMarks,
      isElective: formIsElective, isTheory: formIsTheory, theoryExamDuration: formTheoryExamDuration.trim() || '2.5 Hrs',
      isPractical: formIsPractical, practicalExamDuration: formPracticalExamDuration.trim() || undefined,
      isFunctional: formIsFunctional, isSemiPractical: formIsSemiPractical || false,
      remarks: formRemarks.trim() || undefined,
      departmentId: formDepartmentId, programId: formProgramId,
    };
    
    try {
      if (currentCourse && currentCourse.id) {
        await courseService.updateCourse(currentCourse.id, courseData);
        toast({ title: "Course Updated", description: "The course has been successfully updated." });
      } else {
        await courseService.createCourse(courseData);
        toast({ title: "Course Created", description: "The new course has been successfully created." });
      }
      await fetchInitialData(); // Re-fetch courses
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message || "Could not save course." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
    const inputElement = event.target as HTMLInputElement;
    if (!event.target.files || event.target.files.length === 0) {
      inputElement.value = '';
    }
  };

  const handleGtuFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedGtuFile(file);
    } else {
      setSelectedGtuFile(null);
    }
    const inputElement = event.target as HTMLInputElement;
    if (!event.target.files || event.target.files.length === 0) {
      inputElement.value = '';
    }
  };

  const handleImportCourses = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
    if (departments.length === 0 || programs.length === 0) {
        toast({ variant: "destructive", title: "Import Error", description: "No departments or programs loaded. Cannot map IDs." });
        return;
    }

    setIsSubmitting(true);
    try {
      const result = await courseService.importCourses(selectedFile, departments, programs);
      await fetchInitialData();
      const message = result.isGTUFormat 
        ? `GTU Import Successful: ${result.newCount} courses added, ${result.updatedCount} updated. ${result.syllabusUrlsGenerated} syllabus URLs generated. Skipped: ${result.skippedCount}`
        : `Standard Import Successful: ${result.newCount} courses added, ${result.updatedCount} updated. Skipped: ${result.skippedCount}`;
      toast({ title: "Import Successful", description: message });
    } catch (error: unknown) {
      console.error("Error processing CSV file:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not process the CSV file.";
      toast({ variant: "destructive", title: "Import Failed", description: errorMessage });
    } finally {
      setIsSubmitting(false); setSelectedFile(null); 
      const fileInput = document.getElementById('csvImportCourse') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleImportGtuCourses = async () => {
    if (!selectedGtuFile) {
      toast({ variant: "destructive", title: "GTU Import Error", description: "Please select a GTU CSV file to import." });
      return;
    }
    if (departments.length === 0 || programs.length === 0) {
        toast({ variant: "destructive", title: "GTU Import Error", description: "No departments or programs loaded. Cannot map branch codes." });
        return;
    }

    setIsSubmitting(true);
    try {
      const result = await courseService.importCourses(selectedGtuFile, departments, programs);
      await fetchInitialData();
      toast({ 
        title: "GTU Import Successful", 
        description: `${result.newCount} courses added, ${result.updatedCount} updated. ${result.syllabusUrlsGenerated || 0} syllabus URLs generated. Skipped: ${result.skippedCount}` 
      });
    } catch (error: unknown) {
      console.error("Error processing GTU CSV file:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not process the GTU CSV file.";
      toast({ variant: "destructive", title: "GTU Import Failed", description: errorMessage });
    } finally {
      setIsSubmitting(false); setSelectedGtuFile(null); 
      const fileInput = document.getElementById('gtuCsvImportCourses') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleExportCourses = () => {
    if (filteredAndSortedCourses.length === 0) {
      toast({ title: "Export Canceled", description: "No courses to export (check filters)." });
      return;
    }
    const header = ['id', 'subcode', 'effFrom', 'subjectName', 'category', 'semester', 'lectureHours', 'tutorialHours', 'practicalHours', 'credits', 'theoryEseMarks', 'theoryPaMarks', 'practicalEseMarks', 'practicalPaMarks', 'totalMarks', 'isElective', 'isTheory', 'theoryExamDuration', 'isPractical', 'practicalExamDuration', 'isFunctional', 'isSemiPractical', 'remarks', 'departmentId', 'departmentName', 'departmentCode', 'programId', 'programName', 'programCode'];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedCourses.map(c => {
        const dept = departments.find(d => d.id === c.departmentId);
        const prog = programs.find(p => p.id === c.programId);
        return [
          c.id, c.subcode, c.effFrom || "", `"${c.subjectName.replace(/"/g, '""')}"`,
          `"${(c.category || "").replace(/"/g, '""')}"`, c.semester, c.lectureHours, c.tutorialHours, c.practicalHours,
          c.credits, c.theoryEseMarks, c.theoryPaMarks, c.practicalEseMarks, c.practicalPaMarks, c.totalMarks,
          c.isElective, c.isTheory, c.theoryExamDuration || "", c.isPractical, c.practicalExamDuration || "",
          c.isFunctional, c.isSemiPractical || false, `"${(c.remarks || "").replace(/"/g, '""')}"`,
          c.departmentId, `"${(dept?.name || "").replace(/"/g, '""')}"`, `"${(dept?.code || "").replace(/"/g, '""')}"`,
          c.programId, `"${(prog?.name || "").replace(/"/g, '""')}"`, `"${(prog?.code || "").replace(/"/g, '""')}"`
        ].join(',');
      })
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "courses_export.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Courses exported to courses_export.csv" });
  };

  const handleExportGtuCourses = () => {
    if (filteredAndSortedCourses.length === 0) {
      toast({ title: "GTU Export Canceled", description: "No courses to export (check filters)." });
      return;
    }
    
    // GTU CSV format headers (removed Exp. column)
    const header = ['Subcode', 'Branch code', 'Eff_from', 'SubjectName', 'Category', 'Sem /Year', 'L.', 'T.', 'P.', 'TW/SL', 'Total', 'E', 'M', 'I', 'V', 'Total.1', 'gtuSyllabusURL'];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedCourses.map(c => {
        const syllabusUrl = c.syllabusUrl || `https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/${c.subcode}.pdf`;
        return [
          c.subcode,
          c.effFrom || '2024-25',
          `"${c.subjectName.replace(/"/g, '""')}"`,
          `"${(c.category || "").replace(/"/g, '""')}"`,
          c.semester,
          c.lectureHours,
          c.tutorialHours,
          c.practicalHours,
          '', // TW/SL column
          c.credits,
          c.theoryEseMarks,
          c.theoryPaMarks,
          c.practicalEseMarks,
          c.practicalPaMarks,
          c.totalMarks,
          syllabusUrl
        ].join(',');
      })
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "gtu_courses_export.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "GTU Export Successful", description: "GTU courses exported to gtu_courses_export.csv" });
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,subcode,effFrom,subjectName,category,semester,lectureHours,tutorialHours,practicalHours,credits,theoryEseMarks,theoryPaMarks,practicalEseMarks,practicalPaMarks,totalMarks,isElective,isTheory,theoryExamDuration,isPractical,practicalExamDuration,isFunctional,isSemiPractical,remarks,departmentId,departmentName,departmentCode,programId,programName,programCode
crs_sample_1,CS101,2024-25,Introduction to Programming,Core,1,3,1,2,6,70,30,25,25,150,false,true,2.5 Hrs,true,2 Hrs,true,false,"Basic programming concepts",dept1,"Computer Engineering","CE",prog1,"Diploma in CE","DCE"
,MA101,2024-25,Calculus I,Basic Science,1,4,0,0,4,100,0,0,0,100,false,true,3 Hrs,false,,true,false,,dept_gen,"General Department","GEN",prog1,"Diploma in CE","DCE"
`; 
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_courses_import.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_courses_import.csv downloaded." });
  };

  const handleDownloadGtuSampleCsv = () => {
    const sampleCsvContent = `Subcode,Branch code,Eff_from,SubjectName,Category,Sem /Year,L.,T.,P.,TW/SL,Total,E,M,I,V,Total.1,gtuSyllabusURL
DI01000011,6,2024-25,Mathematics-I,Basic Science Courses,1,3,1,0,,4,70,30,0,0,100,https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/DI01000011.pdf
DI01000021,6,2024-25,Applied Physics,Basic Science Courses,1,3,0,2,,4,70,30,20,30,150,https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/DI01000021.pdf
DI01006011,6,2024-25,Engineering Drawing,Professional Core Courses,1,2,0,4,,4,70,30,20,30,150,https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/DI01006011.pdf`; 
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_gtu_courses_import.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "GTU Sample CSV Downloaded", description: "sample_gtu_courses_import.csv downloaded." });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field); setSortDirection('asc');
    }
    setCurrentPage(1); 
  };
  
  const filteredAndSortedCourses = useMemo(() => {
    let result = [...courses];

    if (searchTerm) {
      result = result.filter(c => 
        c.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterSemesterVal !== 'all') {
      result = result.filter(c => c.semester === parseInt(filterSemesterVal));
    }
    if (filterProgramVal !== 'all') {
      result = result.filter(c => c.programId === filterProgramVal);
    }
    if (filterEffFromVal !== 'all') {
      result = result.filter(c => c.effFrom === filterEffFromVal);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: unknown = a[sortField as keyof Course];
        let valB: unknown = b[sortField as keyof Course];
        
        // Special handling for programId - sort by program name instead of ID
        if (sortField === 'programId') {
          const programA = programs.find(p => p.id === a.programId);
          const programB = programs.find(p => p.id === b.programId);
          valA = programA?.name || programA?.code || '';
          valB = programB?.name || programB?.code || '';
        }
        
        const numericFields: (keyof Course)[] = ['semester', 'lectureHours', 'tutorialHours', 'practicalHours', 'credits', 'theoryEseMarks', 'theoryPaMarks', 'practicalEseMarks', 'practicalPaMarks', 'totalMarks'];
        if (numericFields.includes(sortField as keyof Course)) {
            valA = Number(valA) || 0; valB = Number(valB) || 0;
        }
        
        if (valA === undefined || valA === null) return sortDirection === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null) return sortDirection === 'asc' ? -1 : 1;
        
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
  }, [courses, programs, searchTerm, filterSemesterVal, filterProgramVal, filterEffFromVal, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedCourses.length / itemsPerPage);
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCourses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCourses, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterSemesterVal, filterProgramVal, filterEffFromVal, itemsPerPage]);


  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedCourseIds(checked === true ? paginatedCourses.map(c => c.id) : []);
  };

  const handleSelectCourse = (courseId: string, checked: boolean) => {
    setSelectedCourseIds(prev => checked ? [...prev, courseId] : prev.filter(id => id !== courseId));
  };

  const handleDeleteSelected = async () => {
    if (selectedCourseIds.length === 0) {
      toast({ variant: "destructive", title: "No Courses Selected", description: "Please select courses to delete." });
      return;
    }
    setIsSubmitting(true);
    try {
      for (const id of selectedCourseIds) {
        await courseService.deleteCourse(id);
      }
      await fetchInitialData();
      toast({ title: "Courses Deleted", description: `${selectedCourseIds.length} course(s) have been successfully deleted.` });
      setSelectedCourseIds([]);
    } catch (error) {
       toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete selected courses."});
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedCourses.length > 0 && paginatedCourses.every(c => selectedCourseIds.includes(c.id));
  const isSomeSelectedOnPage = paginatedCourses.some(c => selectedCourseIds.includes(c.id)) && !isAllSelectedOnPage;

  const uniqueEffFromValues = useMemo(() => {
    const values = courses
      .map(c => c.effFrom)
      .filter((value): value is string => Boolean(value))
      .sort();
    return [...new Set(values)];
  }, [courses]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => handleSort(field)} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">
        {label}
        {sortField === field && (sortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" /> : <ArrowUpDown className="h-4 w-4 opacity-50" />)}
        {sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}
      </div>
    </TableHead>
  );


  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              Course Management
            </CardTitle>
            <CardDescription>
              Manage academic courses, their details, credits, and marks distribution.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto" disabled={departments.length === 0 || programs.length === 0}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{currentCourse?.id ? "Edit Course" : "Add New Course"}</DialogTitle>
                  <DialogDescription>
                    {currentCourse?.id ? "Modify course details." : "Create a new course record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                  {/* Basic Info */}
                  <div className="md:col-span-1"><Label htmlFor="subcode">Subject Code *</Label><Input id="subcode" value={formSubcode} onChange={e => setFormSubcode(e.target.value)} placeholder="e.g., CS101" disabled={isSubmitting} required /></div>
                  <div className="md:col-span-2"><Label htmlFor="subjectName">Subject Name *</Label><Input id="subjectName" value={formSubjectName} onChange={e => setFormSubjectName(e.target.value)} placeholder="e.g., Introduction to Programming" disabled={isSubmitting} required /></div>
                  <div className="md:col-span-1">
                    <Label htmlFor="effFrom">Effective From</Label>
                    <Select value={formEffFrom} onValueChange={setFormEffFrom} disabled={isSubmitting}>
                      <SelectTrigger id="effFrom">
                        <SelectValue placeholder="Select Academic Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACADEMIC_YEARS.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formCategory} onValueChange={setFormCategory} disabled={isSubmitting}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSE_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1"><Label htmlFor="semester">Semester *</Label><Input id="semester" type="number" value={formSemester} onChange={e => setFormSemester(parseInt(e.target.value) || 1)} min="1" disabled={isSubmitting} required /></div>
                  
                  {/* Department & Program */}
                  <div className="md:col-span-1">
                    <Label htmlFor="departmentId">Department *</Label>
                    <Select value={formDepartmentId} onValueChange={val => {setFormDepartmentId(val); setFormProgramId('');}} disabled={isSubmitting || departments.length === 0} required>
                      <SelectTrigger id="departmentId"><SelectValue placeholder="Select Department" /></SelectTrigger>
                      <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="programId">Program *</Label>
                    <Select value={formProgramId} onValueChange={setFormProgramId} disabled={isSubmitting || !formDepartmentId || filteredPrograms.length === 0} required>
                      <SelectTrigger id="programId"><SelectValue placeholder="Select Program" /></SelectTrigger>
                      <SelectContent>{filteredPrograms.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  
                  {/* Hours & Credits */}
                  <div className="md:col-span-3 border p-3 rounded-md grid grid-cols-1 md:grid-cols-4 gap-4 dark:border-gray-700">
                    <h4 className="md:col-span-full text-sm font-medium mb-1">Hours & Credits</h4>
                    <div><Label htmlFor="lectureHours">Lecture (L)</Label><Input id="lectureHours" type="number" value={formLectureHours} onChange={e => setFormLectureHours(parseInt(e.target.value) || 0)} min="0" disabled={isSubmitting} /></div>
                    <div><Label htmlFor="tutorialHours">Tutorial (T)</Label><Input id="tutorialHours" type="number" value={formTutorialHours} onChange={e => setFormTutorialHours(parseInt(e.target.value) || 0)} min="0" disabled={isSubmitting} /></div>
                    <div><Label htmlFor="practicalHours">Practical (P)</Label><Input id="practicalHours" type="number" value={formPracticalHours} onChange={e => setFormPracticalHours(parseInt(e.target.value) || 0)} min="0" disabled={isSubmitting} /></div>
                    <div><Label>Credits (L+T+P)</Label><Input value={formLectureHours + formTutorialHours + formPracticalHours} disabled readOnly /></div>
                  </div>

                  {/* Marks Distribution */}
                  <div className="md:col-span-3 border p-3 rounded-md grid grid-cols-1 md:grid-cols-5 gap-4 dark:border-gray-700">
                    <h4 className="md:col-span-full text-sm font-medium mb-1">Marks Distribution</h4>
                    <div><Label htmlFor="theoryEseMarks">Theory ESE (E)</Label><Input id="theoryEseMarks" type="number" value={formTheoryEseMarks} onChange={e => setFormTheoryEseMarks(parseInt(e.target.value) || 0)} min="0" disabled={isSubmitting} /></div>
                    <div><Label htmlFor="theoryPaMarks">Theory PA (M)</Label><Input id="theoryPaMarks" type="number" value={formTheoryPaMarks} onChange={e => setFormTheoryPaMarks(parseInt(e.target.value) || 0)} min="0" disabled={isSubmitting} /></div>
                    <div><Label htmlFor="practicalEseMarks">Practical ESE (V)</Label><Input id="practicalEseMarks" type="number" value={formPracticalEseMarks} onChange={e => setFormPracticalEseMarks(parseInt(e.target.value) || 0)} min="0" disabled={isSubmitting} /></div>
                    <div><Label htmlFor="practicalPaMarks">Practical PA (I)</Label><Input id="practicalPaMarks" type="number" value={formPracticalPaMarks} onChange={e => setFormPracticalPaMarks(parseInt(e.target.value) || 0)} min="0" disabled={isSubmitting} /></div>
                    <div><Label>Total Marks</Label><Input value={formTheoryEseMarks + formTheoryPaMarks + formPracticalEseMarks + formPracticalPaMarks} disabled readOnly /></div>
                  </div>
                  
                  {/* Switches & Durations */}
                  <div className="md:col-span-3 border p-3 rounded-md grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 items-start dark:border-gray-700">
                    <div className="flex items-center space-x-2"><Switch id="isElective" checked={formIsElective} onCheckedChange={setFormIsElective} disabled={isSubmitting} /><Label htmlFor="isElective">Is Elective</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="isTheory" checked={formIsTheory} onCheckedChange={setFormIsTheory} disabled={isSubmitting} /><Label htmlFor="isTheory">Is Theory</Label></div>
                    {formIsTheory && (
                      <div>
                        <Label htmlFor="theoryExamDuration">Theory Exam Duration</Label>
                        <Select value={formTheoryExamDuration} onValueChange={setFormTheoryExamDuration} disabled={isSubmitting || !formIsTheory}>
                          <SelectTrigger id="theoryExamDuration">
                            <SelectValue placeholder="Select Duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXAM_DURATIONS.map(duration => (
                              <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex items-center space-x-2"><Switch id="isPractical" checked={formIsPractical} onCheckedChange={setFormIsPractical} disabled={isSubmitting} /><Label htmlFor="isPractical">Is Practical</Label></div>
                    {formIsPractical && (
                      <div>
                        <Label htmlFor="practicalExamDuration">Practical Exam Duration</Label>
                        <Select value={formPracticalExamDuration} onValueChange={setFormPracticalExamDuration} disabled={isSubmitting || !formIsPractical}>
                          <SelectTrigger id="practicalExamDuration">
                            <SelectValue placeholder="Select Duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRACTICAL_EXAM_DURATIONS.map(duration => (
                              <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex items-center space-x-2"><Switch id="isFunctional" checked={formIsFunctional} onCheckedChange={setFormIsFunctional} disabled={isSubmitting} /><Label htmlFor="isFunctional">Is Functional</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="isSemiPractical" checked={formIsSemiPractical} onCheckedChange={setFormIsSemiPractical} disabled={isSubmitting} /><Label htmlFor="isSemiPractical">Is Semi-Practical</Label></div>
                  </div>

                  {/* Remarks */}
                  <div className="md:col-span-3"><Label htmlFor="remarks">Remarks</Label><Textarea id="remarks" value={formRemarks} onChange={e => setFormRemarks(e.target.value)} placeholder="Any additional notes about the course" disabled={isSubmitting} rows={2} /></div>
                  
                  <DialogFooter className="md:col-span-3 mt-4">
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{currentCourse?.id ? "Save Changes" : "Create Course"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportCourses} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
            <Button onClick={handleExportGtuCourses} variant="outline" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
              <Download className="mr-2 h-5 w-5" /> Export GTU CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4 dark:border-gray-700">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Courses (Standard Format)</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportCourse" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportCourses} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>} Import Standard
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample (Standard)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Use for general course data import/update. Requires subcode, subjectName, semester, departmentId/Name/Code, programId/Name/Code.
                </p>
            </div>
          </div>

          <div className="mb-6 p-4 border rounded-lg space-y-4 dark:border-gray-700">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-accent"/>Import GTU Course Data</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="gtuCsvImportCourses" accept=".csv" onChange={handleGtuFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportGtuCourses} disabled={isSubmitting || !selectedGtuFile || departments.length === 0 || programs.length === 0} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                {isSubmitting && selectedGtuFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>} Import GTU Data
              </Button>
            </div>
            {(departments.length === 0 || programs.length === 0) && <p className="text-xs text-destructive">GTU Import disabled: No departments/programs found. Please add them first.</p>}
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadGtuSampleCsv} variant="link" size="sm" className="px-0 text-accent">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample (GTU)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Import course data using GTU CSV format. Automatically generates syllabus URLs and maps branch codes to departments/programs.
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg dark:border-gray-700">
            <div>
              <Label htmlFor="searchCourse">Search Courses</Label>
              <div className="relative">
                 <Input id="searchCourse" placeholder="Name, code, category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-8"/>
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
             <div>
              <Label htmlFor="filterSemester">Filter by Semester</Label>
              <Select value={filterSemesterVal} onValueChange={setFilterSemesterVal}>
                <SelectTrigger id="filterSemester"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {Array.from({length: 8}, (_, i) => i + 1).map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterProgram">Filter by Program</Label>
              <Select value={filterProgramVal} onValueChange={setFilterProgramVal} disabled={programs.length === 0}>
                <SelectTrigger id="filterProgram"><SelectValue placeholder="All Programs" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterEffFrom">Filter by Effective From</Label>
              <Select value={filterEffFromVal} onValueChange={setFilterEffFromVal} disabled={uniqueEffFromValues.length === 0}>
                <SelectTrigger id="filterEffFrom"><SelectValue placeholder="All Academic Years" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academic Years</SelectItem>
                  {uniqueEffFromValues.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCourseIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedCourseIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedCourseIds.length} course(s) selected.
                </span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[50px]"><Checkbox checked={isAllSelectedOnPage || (paginatedCourses.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)} onCheckedChange={(checkedState) => handleSelectAll(!!checkedState)} aria-label="Select all courses on this page"/></TableHead>
                <SortableTableHeader field="effFrom" label="Eff From" />
                <SortableTableHeader field="programId" label="Program" />
                <SortableTableHeader field="semester" label="Sem" />
                <SortableTableHeader field="subcode" label="Subcode" />
                <SortableTableHeader field="subjectName" label="Subject Name" />
                <SortableTableHeader field="credits" label="Credits" />
                <TableHead>Syllabus</TableHead>
                <TableHead className="text-right w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCourses.map((course) => (
                <TableRow key={course.id} data-state={selectedCourseIds.includes(course.id) ? "selected" : undefined}>
                  <TableCell><Checkbox checked={selectedCourseIds.includes(course.id)} onCheckedChange={(checked) => handleSelectCourse(course.id, !!checked)} aria-labelledby={`course-name-${course.id}`}/></TableCell>
                  <TableCell>{course.effFrom || 'N/A'}</TableCell>
                  <TableCell>{programs.find(p => p.id === course.programId)?.code || 'N/A'}</TableCell>
                  <TableCell>{course.semester}</TableCell>
                  <TableCell>{course.subcode}</TableCell>
                  <TableCell id={`course-name-${course.id}`} className="font-medium">{course.subjectName}</TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell>
                    {course.syllabusUrl ? (
                      <a href={course.syllabusUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                        View
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="icon" onClick={() => handleView(course)} disabled={isSubmitting}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Course</span>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleEdit(course)} disabled={isSubmitting}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit Course</span>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(course.id)} disabled={isSubmitting}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Course</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedCourses.length === 0 && (
                 <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No courses found. Adjust filters or add a new course.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedCourses.length)} to {Math.min(currentPage * itemsPerPage, filteredAndSortedCourses.length)} of {filteredAndSortedCourses.length} courses.
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

      {/* View Course Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
            <DialogDescription>
              Complete information for {viewCourse?.subjectName}
            </DialogDescription>
          </DialogHeader>
          
          {viewCourse && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Subject Code:</span>
                    <p className="text-muted-foreground">{viewCourse.subcode}</p>
                  </div>
                  <div>
                    <span className="font-medium">Subject Name:</span>
                    <p className="text-muted-foreground">{viewCourse.subjectName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Semester:</span>
                    <p className="text-muted-foreground">{viewCourse.semester}</p>
                  </div>
                  <div>
                    <span className="font-medium">Category:</span>
                    <p className="text-muted-foreground">{viewCourse.category || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Effective From:</span>
                    <p className="text-muted-foreground">{viewCourse.effFrom || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Credits:</span>
                    <p className="text-muted-foreground">{viewCourse.credits}</p>
                  </div>
                </div>
              </div>

              {/* Hours Distribution */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Hours Distribution</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Lecture Hours:</span>
                    <p className="text-muted-foreground">{viewCourse.lectureHours}</p>
                  </div>
                  <div>
                    <span className="font-medium">Tutorial Hours:</span>
                    <p className="text-muted-foreground">{viewCourse.tutorialHours}</p>
                  </div>
                  <div>
                    <span className="font-medium">Practical Hours:</span>
                    <p className="text-muted-foreground">{viewCourse.practicalHours}</p>
                  </div>
                  <div>
                    <span className="font-medium">Total Marks:</span>
                    <p className="text-muted-foreground">{viewCourse.totalMarks}</p>
                  </div>
                </div>
              </div>

              {/* Marks Distribution */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Marks Distribution</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Theory ESE:</span>
                    <p className="text-muted-foreground">{viewCourse.theoryEseMarks}</p>
                  </div>
                  <div>
                    <span className="font-medium">Theory PA:</span>
                    <p className="text-muted-foreground">{viewCourse.theoryPaMarks}</p>
                  </div>
                  <div>
                    <span className="font-medium">Practical ESE:</span>
                    <p className="text-muted-foreground">{viewCourse.practicalEseMarks}</p>
                  </div>
                  <div>
                    <span className="font-medium">Practical PA:</span>
                    <p className="text-muted-foreground">{viewCourse.practicalPaMarks}</p>
                  </div>
                </div>
              </div>

              {/* Course Properties */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Course Properties</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Elective:</span>
                    <span className={`px-2 py-1 rounded text-xs ${viewCourse.isElective ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {viewCourse.isElective ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Theory:</span>
                    <span className={`px-2 py-1 rounded text-xs ${viewCourse.isTheory ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {viewCourse.isTheory ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Practical:</span>
                    <span className={`px-2 py-1 rounded text-xs ${viewCourse.isPractical ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {viewCourse.isPractical ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Functional:</span>
                    <span className={`px-2 py-1 rounded text-xs ${viewCourse.isFunctional ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {viewCourse.isFunctional ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Exam Details */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold">Exam Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Theory Exam Duration:</span>
                    <p className="text-muted-foreground">{viewCourse.theoryExamDuration || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Practical Exam Duration:</span>
                    <p className="text-muted-foreground">{viewCourse.practicalExamDuration || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Semi-Practical:</span>
                    <span className={`px-2 py-1 rounded text-xs ${viewCourse.isSemiPractical ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {viewCourse.isSemiPractical ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Syllabus:</span>
                    {viewCourse.syllabusUrl ? (
                      <a href={viewCourse.syllabusUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View PDF
                      </a>
                    ) : (
                      <p className="text-muted-foreground">N/A</p>
                    )}
                  </div>
                </div>
                
                {viewCourse.remarks && (
                  <div className="mt-4">
                    <span className="font-medium">Remarks:</span>
                    <p className="text-muted-foreground mt-1">{viewCourse.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

