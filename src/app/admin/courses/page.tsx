
"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Edit, Trash2, ClipboardList, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface Course {
  id: string;
  subcode: string; // Subject Code
  branchCode?: string; // Optional, as some courses might be general
  effFrom?: string; // Effective From Year, e.g., 2024-25
  subjectName: string;
  category?: string; // e.g., Basic Science Courses, Program Core
  semester: number; // Semester or Year
  lectureHours: number; // L
  tutorialHours: number; // T
  practicalHours: number; // P
  credits: number; // Total Credits (L+T+P)
  theoryEseMarks: number; // Theory ESE (E)
  theoryPaMarks: number; // Theory PA (M)
  practicalEseMarks: number; // Practical ESE/Viva (V)
  practicalPaMarks: number; // Practical PA (I)
  totalMarks: number; // (E+M+V+I)
  isElective: boolean;
  isTheory: boolean;
  theoryExamDuration?: string; // e.g., 2.5 Hrs
  isPractical: boolean;
  practicalExamDuration?: string;
  isFunctional: boolean;
  isSemiPractical?: boolean; // If applicable
  remarks?: string;
  departmentId: string; // Associated department
  programId: string; // Associated program
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
  departmentId: string;
}

const initialCourses: Course[] = [
  { id: "crs1", subcode: "DI01000021", branchCode: "011", effFrom: "2024-25", subjectName: "Mathematics-I", category: "Basic Science Courses", semester: 1, lectureHours: 3, tutorialHours: 1, practicalHours: 0, credits: 4, theoryEseMarks: 70, theoryPaMarks: 30, practicalEseMarks: 0, practicalPaMarks: 0, totalMarks: 100, isElective: false, isTheory: true, theoryExamDuration: "2.5 Hrs", isPractical: false, isFunctional: true, departmentId: "dept6", programId: "prog1" },
  { id: "crs2", subcode: "CE01000001", branchCode: "005", effFrom: "2023-24", subjectName: "Introduction to Computer Engg", category: "Program Core", semester: 1, lectureHours: 2, tutorialHours: 0, practicalHours: 2, credits: 3, theoryEseMarks: 50, theoryPaMarks: 25, practicalEseMarks: 25, practicalPaMarks: 0, totalMarks: 100, isElective: false, isTheory: true, isPractical: true, isFunctional: true, departmentId: "dept1", programId: "prog1" },
];

const LOCAL_STORAGE_KEY_COURSES = 'managedCoursesPMP';
const LOCAL_STORAGE_KEY_DEPARTMENTS = 'managedDepartmentsPMP';
const LOCAL_STORAGE_KEY_PROGRAMS = 'managedProgramsPMP';

type SortField = keyof Course | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const generateClientId = (): string => `crs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export default function CourseManagementPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Partial<Course> | null>(null);

  // Form state
  const [formSubcode, setFormSubcode] = useState('');
  const [formBranchCode, setFormBranchCode] = useState('');
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemesterVal, setFilterSemesterVal] = useState<string>('all');
  const [filterDepartmentVal, setFilterDepartmentVal] = useState<string>('all');
  const [filterProgramVal, setFilterProgramVal] = useState<string>('all');

  const [sortField, setSortField] = useState<SortField>('subjectName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedCourses = localStorage.getItem(LOCAL_STORAGE_KEY_COURSES);
      setCourses(storedCourses ? JSON.parse(storedCourses) : initialCourses);

      const storedDepartments = localStorage.getItem(LOCAL_STORAGE_KEY_DEPARTMENTS);
      setDepartments(storedDepartments ? JSON.parse(storedDepartments) : []);
      
      const storedPrograms = localStorage.getItem(LOCAL_STORAGE_KEY_PROGRAMS);
      setPrograms(storedPrograms ? JSON.parse(storedPrograms) : []);

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setCourses(initialCourses);
      setDepartments([]);
      setPrograms([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if(!isLoading) { 
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY_COURSES, JSON.stringify(courses));
        } catch (error) {
            console.error("Failed to save courses to localStorage", error);
            toast({
                variant: "destructive",
                title: "Storage Error",
                description: "Could not save course data locally. Changes might be lost.",
            });
        }
    }
  }, [courses, isLoading, toast]);

  useEffect(() => {
    if (formDepartmentId) {
      setFilteredPrograms(programs.filter(p => p.departmentId === formDepartmentId));
      if(!programs.find(p => p.id === formProgramId && p.departmentId === formDepartmentId)){
        setFormProgramId(''); // Reset program if it doesn't belong to the selected department
      }
    } else {
      setFilteredPrograms(programs);
    }
  }, [formDepartmentId, programs, formProgramId]);


  const resetForm = () => {
    setFormSubcode(''); setFormBranchCode(''); setFormEffFrom(''); setFormSubjectName('');
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
    setFormSubcode(course.subcode); setFormBranchCode(course.branchCode || '');
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

  const handleAddNew = () => {
    if (departments.length === 0 || programs.length === 0) {
      toast({ variant: "destructive", title: "Cannot Add Course", description: "Departments or Programs not available. Please create them first." });
      return;
    }
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = (courseId: string) => {
    setIsSubmitting(true);
    setTimeout(() => { 
      setCourses(prev => prev.filter(c => c.id !== courseId));
      setSelectedCourseIds(prev => prev.filter(id => id !== courseId));
      toast({ title: "Course Deleted", description: "The course has been successfully deleted." });
      setIsSubmitting(false);
    }, 500);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formSubcode.trim() || !formSubjectName.trim() || !formDepartmentId || !formProgramId || formSemester <=0 ) {
      toast({ variant: "destructive", title: "Validation Error", description: "Subcode, Subject Name, Department, Program and Semester are required."});
      return;
    }
    // Additional validations for numeric fields
    const numericFields = {formLectureHours, formTutorialHours, formPracticalHours, formTheoryEseMarks, formTheoryPaMarks, formPracticalEseMarks, formPracticalPaMarks};
    for (const [key, value] of Object.entries(numericFields)) {
        if (value < 0 || isNaN(value)) {
            toast({ variant: "destructive", title: "Validation Error", description: `${key.replace('form','')} must be a non-negative number.` });
            return;
        }
    }

    setIsSubmitting(true);
    
    setTimeout(() => { 
      const credits = formLectureHours + formTutorialHours + formPracticalHours;
      const totalMarks = formTheoryEseMarks + formTheoryPaMarks + formPracticalEseMarks + formPracticalPaMarks;

      const courseData: Omit<Course, 'id'> = { 
        subcode: formSubcode.trim().toUpperCase(), branchCode: formBranchCode.trim() || undefined,
        effFrom: formEffFrom.trim() || undefined, subjectName: formSubjectName.trim(),
        category: formCategory.trim() || undefined, semester: formSemester,
        lectureHours: formLectureHours, tutorialHours: formTutorialHours, practicalHours: formPracticalHours,
        credits, theoryEseMarks: formTheoryEseMarks, theoryPaMarks: formTheoryPaMarks,
        practicalEseMarks: formPracticalEseMarks, practicalPaMarks: formPracticalPaMarks, totalMarks,
        isElective: formIsElective, isTheory: formIsTheory, theoryExamDuration: formTheoryExamDuration.trim() || undefined,
        isPractical: formIsPractical, practicalExamDuration: formPracticalExamDuration.trim() || undefined,
        isFunctional: formIsFunctional, isSemiPractical: formIsSemiPractical || false,
        remarks: formRemarks.trim() || undefined,
        departmentId: formDepartmentId, programId: formProgramId,
      };

      if (currentCourse && currentCourse.id) {
        setCourses(prev => prev.map(c => c.id === currentCourse.id ? { ...c, ...courseData } : c));
        toast({ title: "Course Updated", description: "The course has been successfully updated." });
      } else {
        const newCourse: Course = { 
          id: generateClientId(), 
          ...courseData
        };
        setCourses(prev => [...prev, newCourse]);
        toast({ title: "Course Created", description: "The new course has been successfully created." });
      }
      setIsSubmitting(false);
      setIsDialogOpen(false);
      resetForm();
    }, 1000);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
  };

  const handleImportCourses = () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
    if (departments.length === 0 || programs.length === 0) {
        toast({ variant: "destructive", title: "Import Error", description: "No departments or programs loaded. Cannot map IDs." });
        return;
    }

    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length <= 1) throw new Error("CSV file is empty or has only a header.");
        
        const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
        const expectedHeaders = ['id', 'subcode', 'branchcode', 'efffrom', 'subjectname', 'category', 'semester', 'lecturehours', 'tutorialhours', 'practicalhours', 'credits', 'theoryesemarks', 'theorypamarks', 'practicalesemarks', 'practicalpamarks', 'totalmarks', 'iselective', 'istheory', 'theoryexamduration', 'ispractical', 'practicalexamduration', 'isfunctional', 'issemipractical', 'remarks', 'departmentid', 'programid'];
        const requiredHeaders = ['subcode', 'subjectname', 'semester', 'departmentid', 'programid'];

        if (!requiredHeaders.every(rh => header.includes(rh))) {
            throw new Error(`CSV header is missing required columns. Expected at least: ${requiredHeaders.join(', ')}. Found: ${header.join(', ')}`);
        }
        
        const hMap = Object.fromEntries(expectedHeaders.map(eh => [eh, header.indexOf(eh)]));

        const importedBatch: Course[] = [];
        const currentCopy = [...courses];
        let newCount = 0, updatedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const data = lines[i].split(',').map(d => d.trim().replace(/^"|"$/g, ''));
          
          const subcode = data[hMap['subcode']];
          const subjectName = data[hMap['subjectname']];
          const semesterStr = data[hMap['semester']];
          const departmentId = data[hMap['departmentid']];
          const programId = data[hMap['programid']];

          if (!subcode || !subjectName || !semesterStr || !departmentId || !programId ) {
            console.warn(`Skipping row ${i+1}: Missing or invalid required data (subcode, subjectName, semester, departmentId, programId).`);
            continue;
          }
          if (!departments.find(d => d.id === departmentId) || !programs.find(p => p.id === programId && p.departmentId === departmentId)) {
            console.warn(`Skipping row ${i+1}: Department ID '${departmentId}' or Program ID '${programId}' not found or mismatched.`);
            continue;
          }
          const semester = parseInt(semesterStr);
          if(isNaN(semester) || semester <=0) {
            console.warn(`Skipping row ${i+1}: Invalid semester value '${semesterStr}'.`);
            continue;
          }

          const id = data[hMap['id']];
          const courseData: Omit<Course, 'id'> = {
            subcode: subcode.toUpperCase(), branchCode: data[hMap['branchcode']] || undefined,
            effFrom: data[hMap['efffrom']] || undefined, subjectName, category: data[hMap['category']] || undefined,
            semester, lectureHours: parseInt(data[hMap['lecturehours']]) || 0,
            tutorialHours: parseInt(data[hMap['tutorialhours']]) || 0, practicalHours: parseInt(data[hMap['practicalhours']]) || 0,
            credits: parseInt(data[hMap['credits']]) || 0, // Or calculate
            theoryEseMarks: parseInt(data[hMap['theoryesemarks']]) || 0, theoryPaMarks: parseInt(data[hMap['theorypamarks']]) || 0,
            practicalEseMarks: parseInt(data[hMap['practicalesemarks']]) || 0, practicalPaMarks: parseInt(data[hMap['practicalpamarks']]) || 0,
            totalMarks: parseInt(data[hMap['totalmarks']]) || 0, // Or calculate
            isElective: data[hMap['iselective']]?.toLowerCase() === 'true',
            isTheory: data[hMap['istheory']]?.toLowerCase() !== 'false', // Default true
            theoryExamDuration: data[hMap['theoryexamduration']] || undefined,
            isPractical: data[hMap['ispractical']]?.toLowerCase() === 'true',
            practicalExamDuration: data[hMap['practicalexamduration']] || undefined,
            isFunctional: data[hMap['isfunctional']]?.toLowerCase() !== 'false', // Default true
            isSemiPractical: data[hMap['issemipractical']]?.toLowerCase() === 'true',
            remarks: data[hMap['remarks']] || undefined,
            departmentId, programId,
          };
           // Recalculate credits and totalMarks based on imported L,T,P and marks
          courseData.credits = courseData.lectureHours + courseData.tutorialHours + courseData.practicalHours;
          courseData.totalMarks = courseData.theoryEseMarks + courseData.theoryPaMarks + courseData.practicalEseMarks + courseData.practicalPaMarks;
          
          if (id) {
            const existingIdx = currentCopy.findIndex(c => c.id === id);
            if (existingIdx !== -1) {
              currentCopy[existingIdx] = { ...currentCopy[existingIdx], ...courseData };
              updatedCount++;
            } else {
              importedBatch.push({ id, ...courseData });
              newCount++;
            }
          } else {
            importedBatch.push({ id: generateClientId(), ...courseData });
            newCount++;
          }
        }
        
        const finalCourses = [...currentCopy.filter(c => !importedBatch.find(ic => ic.id === c.id)), ...importedBatch];
        setCourses(finalCourses);
        toast({ title: "Import Successful", description: `${newCount} courses added, ${updatedCount} courses updated.` });

      } catch (error: any) {
        console.error("Error processing CSV file:", error);
        toast({ variant: "destructive", title: "Import Failed", description: error.message || "Could not process the CSV file." });
      } finally {
        setIsSubmitting(false); setSelectedFile(null); 
        const fileInput = document.getElementById('csvImportCourse') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleExportCourses = () => {
    if (filteredAndSortedCourses.length === 0) {
      toast({ title: "Export Canceled", description: "No courses to export (check filters)." });
      return;
    }
    const header = ['id', 'subcode', 'branchCode', 'effFrom', 'subjectName', 'category', 'semester', 'lectureHours', 'tutorialHours', 'practicalHours', 'credits', 'theoryEseMarks', 'theoryPaMarks', 'practicalEseMarks', 'practicalPaMarks', 'totalMarks', 'isElective', 'isTheory', 'theoryExamDuration', 'isPractical', 'practicalExamDuration', 'isFunctional', 'isSemiPractical', 'remarks', 'departmentId', 'programId'];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedCourses.map(c => [
        c.id, c.subcode, c.branchCode || "", c.effFrom || "", `"${c.subjectName.replace(/"/g, '""')}"`,
        `"${(c.category || "").replace(/"/g, '""')}"`, c.semester, c.lectureHours, c.tutorialHours, c.practicalHours,
        c.credits, c.theoryEseMarks, c.theoryPaMarks, c.practicalEseMarks, c.practicalPaMarks, c.totalMarks,
        c.isElective, c.isTheory, c.theoryExamDuration || "", c.isPractical, c.practicalExamDuration || "",
        c.isFunctional, c.isSemiPractical || false, `"${(c.remarks || "").replace(/"/g, '""')}"`,
        c.departmentId, c.programId
      ].join(','))
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "courses_export.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Courses exported to courses_export.csv" });
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,subcode,branchCode,effFrom,subjectName,category,semester,lectureHours,tutorialHours,practicalHours,credits,theoryEseMarks,theoryPaMarks,practicalEseMarks,practicalPaMarks,totalMarks,isElective,isTheory,theoryExamDuration,isPractical,practicalExamDuration,isFunctional,isSemiPractical,remarks,departmentId,programId
crs_sample_1,CS101,CS,2024-25,Introduction to Programming,Core,1,3,1,2,6,70,30,25,25,150,false,true,2.5 Hrs,true,2 Hrs,true,false,"Basic programming concepts",dept1,prog1
,MA101,,2024-25,Calculus I,Basic Science,1,4,0,0,4,100,0,0,0,100,false,true,3 Hrs,false,,true,false,,dept6,prog1
`; 
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_courses_import.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_courses_import.csv downloaded." });
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
        (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.branchCode && c.branchCode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterSemesterVal !== 'all') {
      result = result.filter(c => c.semester === parseInt(filterSemesterVal));
    }
    if (filterDepartmentVal !== 'all') {
      result = result.filter(c => c.departmentId === filterDepartmentVal);
    }
    if (filterProgramVal !== 'all') {
      result = result.filter(c => c.programId === filterProgramVal);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: any = a[sortField as keyof Course];
        let valB: any = b[sortField as keyof Course];
        
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
  }, [courses, searchTerm, filterSemesterVal, filterDepartmentVal, filterProgramVal, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedCourses.length / itemsPerPage);
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCourses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCourses, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterSemesterVal, filterDepartmentVal, filterProgramVal, itemsPerPage]);


  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedCourseIds(checked === true ? paginatedCourses.map(c => c.id) : []);
  };

  const handleSelectCourse = (courseId: string, checked: boolean) => {
    setSelectedCourseIds(prev => checked ? [...prev, courseId] : prev.filter(id => id !== courseId));
  };

  const handleDeleteSelected = () => {
    if (selectedCourseIds.length === 0) {
      toast({ variant: "destructive", title: "No Courses Selected", description: "Please select courses to delete." });
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setCourses(prev => prev.filter(c => !selectedCourseIds.includes(c.id)));
      setSelectedCourseIds([]);
      toast({ title: "Courses Deleted", description: `${selectedCourseIds.length} course(s) have been successfully deleted.` });
      setIsSubmitting(false);
    }, 500);
  };
  
  const isAllSelectedOnPage = paginatedCourses.length > 0 && paginatedCourses.every(c => selectedCourseIds.includes(c.id));
  const isSomeSelectedOnPage = paginatedCourses.some(c => selectedCourseIds.includes(c.id)) && !isAllSelectedOnPage;

  const programsForFilter = useMemo(() => {
    if(filterDepartmentVal === 'all') return programs;
    return programs.filter(p => p.departmentId === filterDepartmentVal);
  }, [filterDepartmentVal, programs]);

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
                  <div className="md:col-span-1"><Label htmlFor="branchCode">Branch Code</Label><Input id="branchCode" value={formBranchCode} onChange={e => setFormBranchCode(e.target.value)} placeholder="e.g., 005 (for CE)" disabled={isSubmitting} /></div>
                  <div className="md:col-span-1"><Label htmlFor="effFrom">Effective From</Label><Input id="effFrom" value={formEffFrom} onChange={e => setFormEffFrom(e.target.value)} placeholder="e.g., 2024-25" disabled={isSubmitting} /></div>
                  <div className="md:col-span-1"><Label htmlFor="category">Category</Label><Input id="category" value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="e.g., Program Core" disabled={isSubmitting} /></div>
                  <div className="md:col-span-1"><Label htmlFor="semester">Semester *</Label><Input id="semester" type="number" value={formSemester} onChange={e => setFormSemester(parseInt(e.target.value) || 1)} min="1" disabled={isSubmitting} required /></div>
                  
                  {/* Department & Program */}
                  <div className="md:col-span-1">
                    <Label htmlFor="departmentId">Department *</Label>
                    <Select value={formDepartmentId} onValueChange={val => {setFormDepartmentId(val); setFormProgramId('');}} disabled={isSubmitting} required>
                      <SelectTrigger id="departmentId"><SelectValue placeholder="Select Department" /></SelectTrigger>
                      <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="programId">Program *</Label>
                    <Select value={formProgramId} onValueChange={setFormProgramId} disabled={isSubmitting || !formDepartmentId} required>
                      <SelectTrigger id="programId"><SelectValue placeholder="Select Program" /></SelectTrigger>
                      <SelectContent>{filteredPrograms.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  
                  {/* Hours & Credits */}
                  <div className="md:col-span-3 border p-3 rounded-md grid grid-cols-1 md:grid-cols-4 gap-4">
                    <h4 className="md:col-span-full text-sm font-medium mb-1">Hours & Credits</h4>
                    <div><Label htmlFor="lectureHours">Lecture (L)</Label><Input id="lectureHours" type="number" value={formLectureHours} onChange={e => setFormLectureHours(parseInt(e.target.value) || 0)} min="0" disabled={isSubmitting} /></div>
                    <div><Label htmlFor="tutorialHours">Tutorial (T)</Label><Input id="tutorialHours" type="number" value={formTutorialHours} onChange={e => setFormTutorialHours(parseInt(e.target.value) || 0)} min="0" disabled={isSubmitting} /></div>
                    <div><Label htmlFor="practicalHours">Practical (P)</Label><Input id="practicalHours" type="number" value={formPracticalHours} onChange={e => setFormPracticalHours(parseInt(e.target.value) || 0)} min="0" disabled={isSubmitting} /></div>
                    <div><Label>Credits (L+T+P)</Label><Input value={formLectureHours + formTutorialHours + formPracticalHours} disabled readOnly /></div>
                  </div>

                  {/* Marks Distribution */}
                  <div className="md:col-span-3 border p-3 rounded-md grid grid-cols-1 md:grid-cols-5 gap-4">
                    <h4 className="md:col-span-full text-sm font-medium mb-1">Marks Distribution</h4>
                    <div><Label htmlFor="theoryEseMarks">Theory ESE (E)</Label><Input id="theoryEseMarks" type="number" value={formTheoryEseMarks} onChange={e => setFormTheoryEseMarks(parseInt(e.target.value) || 0)} min="0" disabled={isSubmitting} /></div>
                    <div><Label htmlFor="theoryPaMarks">Theory PA (M)</Label><Input id="theoryPaMarks" type="number" value={formTheoryPaMarks} onChange={e => setFormTheoryPaMarks(parseInt(e.target.value) || 0)} min="0" disabled={isSubmitting} /></div>
                    <div><Label htmlFor="practicalEseMarks">Practical ESE (V)</Label><Input id="practicalEseMarks" type="number" value={formPracticalEseMarks} onChange={e => setFormPracticalEseMarks(parseInt(e.target.value) || 0)} min="0" disabled={isSubmitting} /></div>
                    <div><Label htmlFor="practicalPaMarks">Practical PA (I)</Label><Input id="practicalPaMarks" type="number" value={formPracticalPaMarks} onChange={e => setFormPracticalPaMarks(parseInt(e.target.value) || 0)} min="0" disabled={isSubmitting} /></div>
                    <div><Label>Total Marks</Label><Input value={formTheoryEseMarks + formTheoryPaMarks + formPracticalEseMarks + formPracticalPaMarks} disabled readOnly /></div>
                  </div>
                  
                  {/* Switches & Durations */}
                  <div className="md:col-span-3 border p-3 rounded-md grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 items-start">
                    <div className="flex items-center space-x-2"><Switch id="isElective" checked={formIsElective} onCheckedChange={setFormIsElective} disabled={isSubmitting} /><Label htmlFor="isElective">Is Elective</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="isTheory" checked={formIsTheory} onCheckedChange={setFormIsTheory} disabled={isSubmitting} /><Label htmlFor="isTheory">Is Theory</Label></div>
                    {formIsTheory && <div><Label htmlFor="theoryExamDuration">Theory Exam Duration</Label><Input id="theoryExamDuration" value={formTheoryExamDuration} onChange={e => setFormTheoryExamDuration(e.target.value)} placeholder="e.g., 2.5 Hrs" disabled={isSubmitting || !formIsTheory} /></div>}
                    <div className="flex items-center space-x-2"><Switch id="isPractical" checked={formIsPractical} onCheckedChange={setFormIsPractical} disabled={isSubmitting} /><Label htmlFor="isPractical">Is Practical</Label></div>
                    {formIsPractical && <div><Label htmlFor="practicalExamDuration">Practical Exam Duration</Label><Input id="practicalExamDuration" value={formPracticalExamDuration} onChange={e => setFormPracticalExamDuration(e.target.value)} placeholder="e.g., 2 Hrs" disabled={isSubmitting || !formIsPractical} /></div>}
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Courses from CSV</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportCourse" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportCourses} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>} Import
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
                </Button>
                <p className="text-xs text-muted-foreground">
                  CSV format fields: id (optional), subcode, subjectName, semester, departmentId, programId, and other relevant fields.
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
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
              <Label htmlFor="filterDepartment">Filter by Department</Label>
              <Select value={filterDepartmentVal} onValueChange={val => {setFilterDepartmentVal(val); setFilterProgramVal('all');}}>
                <SelectTrigger id="filterDepartment"><SelectValue placeholder="All Departments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterProgram">Filter by Program</Label>
              <Select value={filterProgramVal} onValueChange={setFilterProgramVal} disabled={programsForFilter.length === 0}>
                <SelectTrigger id="filterProgram"><SelectValue placeholder="All Programs" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programsForFilter.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}
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
                 <TableHead className="w-[50px]"><Checkbox checked={isAllSelectedOnPage || (paginatedCourses.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)} onCheckedChange={handleSelectAll} aria-label="Select all courses on this page"/></TableHead>
                <SortableTableHeader field="subjectName" label="Subject Name" />
                <SortableTableHeader field="subcode" label="Sub. Code" />
                <SortableTableHeader field="semester" label="Sem" />
                <TableHead>Dept.</TableHead>
                <TableHead>Program</TableHead>
                <SortableTableHeader field="credits" label="Credits" />
                <SortableTableHeader field="totalMarks" label="Total Marks" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCourses.map((course) => (
                <TableRow key={course.id} data-state={selectedCourseIds.includes(course.id) ? "selected" : undefined}>
                  <TableCell><Checkbox checked={selectedCourseIds.includes(course.id)} onCheckedChange={(checked) => handleSelectCourse(course.id, !!checked)} aria-labelledby={`course-name-${course.id}`}/></TableCell>
                  <TableCell id={`course-name-${course.id}`} className="font-medium">{course.subjectName}{course.branchCode ? ` (${course.branchCode})`: ''}</TableCell>
                  <TableCell>{course.subcode}</TableCell>
                  <TableCell>{course.semester}</TableCell>
                  <TableCell>{departments.find(d => d.id === course.departmentId)?.code || 'N/A'}</TableCell>
                  <TableCell>{programs.find(p => p.id === course.programId)?.code || 'N/A'}</TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell>{course.totalMarks}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(course)} disabled={isSubmitting}><Edit className="h-4 w-4" /><span className="sr-only">Edit Course</span></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(course.id)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /><span className="sr-only">Delete Course</span></Button>
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
    </div>
  );
}
