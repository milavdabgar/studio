
"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Users, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, BookUser, CalendarDays as CalendarIcon, Info, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import type { Student, StudentStatus, SemesterStatus } from '@/types/entities';
import { studentService } from '@/lib/api/students';


const DEPARTMENT_OPTIONS = [
  "Computer Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Electronics & Communication Engineering",
  "General",
];

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => i + 1);

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "graduated", label: "Graduated" },
  { value: "dropped", label: "Dropped Out" },
];

const SEMESTER_STATUS_OPTIONS: { value: SemesterStatus; label: string }[] = [
    { value: "N/A", label: "N/A" },
    { value: "Passed", label: "Passed" },
    { value: "Pending", label: "Pending" },
    { value: "Not Appeared", label: "Not Appeared" },
];

const GENDER_OPTIONS: Student['gender'][] = ["Male", "Female", "Other"];
const SHIFT_OPTIONS: Student['shift'][] = ["Morning", "Afternoon"];


type SortField = keyof Student | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const parseGtuName = (gtuName: string | undefined): { firstName?: string, middleName?: string, lastName?: string } => {
    if (!gtuName) return {};
    const parts = gtuName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0] };
    if (parts.length === 2) return { lastName: parts[0], firstName: parts[1] };
    return { lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') };
};

const mapSemesterCodeToStatus = (code: string | undefined | null): SemesterStatus => {
    if (code === '2') return 'Passed';
    if (code === '1') return 'Pending';
    if (code === '' || code === undefined || code === null) return 'Not Appeared';
    return 'N/A';
};

const normalizeGender = (gender: string | undefined): Student['gender'] | undefined => {
    if (!gender) return undefined;
    const lowerGender = gender.toLowerCase();
    if (lowerGender.startsWith('m')) return 'Male';
    if (lowerGender.startsWith('f')) return 'Female';
    if (lowerGender.startsWith('o')) return 'Other';
    return undefined;
};

const normalizeShift = (shift: string | undefined): Student['shift'] | undefined => {
    if (!shift) return undefined;
    const lowerShift = shift.toLowerCase();
    if (lowerShift.startsWith('m')) return 'Morning';
    if (lowerShift.startsWith('a')) return 'Afternoon';
    return shift; 
};


export default function StudentManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student> | null>(null);

  const [formEnrollment, setFormEnrollment] = useState('');
  const [formGtuName, setFormGtuName] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formMiddleName, setFormMiddleName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formPersonalEmail, setFormPersonalEmail] = useState('');
  const [formDepartment, setFormDepartment] = useState(DEPARTMENT_OPTIONS[0]);
  const [formBranchCode, setFormBranchCode] = useState('');
  const [formSemester, setFormSemester] = useState<number>(1);
  const [formStatus, setFormStatus] = useState<StudentStatus>('active');
  const [formContact, setFormContact] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDob, setFormDob] = useState<Date | undefined>(undefined);
  const [formAdmissionDate, setFormAdmissionDate] = useState<Date | undefined>(undefined);
  const [formGender, setFormGender] = useState<Student['gender'] | undefined>(undefined);
  const [formConvocationYear, setFormConvocationYear] = useState<number | undefined>(undefined);
  const [formShift, setFormShift] = useState<Student['shift'] | undefined>(undefined);

  const initialSemesterStatusGetters: { [key: number]: SemesterStatus } = {
    1: 'N/A', 2: 'N/A', 3: 'N/A', 4: 'N/A',
    5: 'N/A', 6: 'N/A', 7: 'N/A', 8: 'N/A',
  };
  const [formSemesterStatuses, setFormSemesterStatuses] = useState<typeof initialSemesterStatusGetters>(initialSemesterStatusGetters);


  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGtuFile, setSelectedGtuFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartmentVal, setFilterDepartmentVal] = useState<string>('all');
  const [filterSemesterVal, setFilterSemesterVal] = useState<string>('all');
  const [filterStatusVal, setFilterStatusVal] = useState<StudentStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('gtuName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);


  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);

  const { toast } = useToast();

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await studentService.getAllStudents();
      setStudents(data);
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: (error as Error).message || "Could not load student data." });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const resetForm = () => {
    setFormEnrollment(''); setFormGtuName(''); setFormFirstName('');
    setFormMiddleName(''); setFormLastName(''); setFormPersonalEmail('');
    setFormDepartment(DEPARTMENT_OPTIONS[0]); setFormBranchCode('');
    setFormSemester(1); setFormStatus('active'); setFormContact('');
    setFormAddress(''); setFormDob(undefined); setFormAdmissionDate(undefined);
    setFormGender(undefined); setFormConvocationYear(undefined);
    setFormShift(undefined);
    setFormSemesterStatuses(initialSemesterStatusGetters);
    setCurrentStudent(null);
  };

  const handleEdit = (student: Student) => {
    setCurrentStudent(student);
    setFormEnrollment(student.enrollmentNumber);
    setFormGtuName(student.gtuName || '');
    setFormFirstName(student.firstName || '');
    setFormMiddleName(student.middleName || '');
    setFormLastName(student.lastName || '');
    setFormPersonalEmail(student.personalEmail || '');
    setFormDepartment(student.department);
    setFormBranchCode(student.branchCode || '');
    setFormSemester(student.currentSemester);
    setFormStatus(student.status);
    setFormContact(student.contactNumber || '');
    setFormAddress(student.address || '');
    setFormDob(student.dateOfBirth && isValid(parseISO(student.dateOfBirth)) ? parseISO(student.dateOfBirth) : undefined);
    setFormAdmissionDate(student.admissionDate && isValid(parseISO(student.admissionDate)) ? parseISO(student.admissionDate) : undefined);
    setFormGender(student.gender === '' ? undefined : student.gender); 
    setFormConvocationYear(student.convocationYear === null ? undefined : student.convocationYear); 
    setFormShift(student.shift || undefined);
    
    const newSemesterStatuses = {...initialSemesterStatusGetters};
    SEMESTER_OPTIONS.forEach(semNum => {
        newSemesterStatuses[semNum] = student[`sem${semNum}Status` as keyof Student] as SemesterStatus || 'N/A';
    });
    setFormSemesterStatuses(newSemesterStatuses);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (studentId: string) => {
    setIsSubmitting(true);
    try {
      await studentService.deleteStudent(studentId);
      await fetchStudents();
      setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
      toast({ title: "Student Deleted", description: "The student record has been successfully deleted." });
    } catch (error) {
        toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete student." });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formEnrollment.trim() || (!formGtuName.trim() && (!formFirstName.trim() || !formLastName.trim()))) {
      toast({ variant: "destructive", title: "Validation Error", description: "Enrollment Number and Name (GTU Name or First/Last Name) are required." });
      return;
    }
    if (formPersonalEmail.trim() && !/\S+@\S+\.\S+/.test(formPersonalEmail)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid personal email address or leave it empty." });
        return;
    }
    if (formConvocationYear && (isNaN(formConvocationYear) || formConvocationYear < 1950 || formConvocationYear > new Date().getFullYear() + 5)) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid convocation year." });
      return;
    }

    setIsSubmitting(true);

    const { firstName: parsedFN, middleName: parsedMN, lastName: parsedLN } = parseGtuName(formGtuName);

    const studentData: Omit<Student, 'id' | 'instituteEmail'> & { instituteEmail?: string } = {
      enrollmentNumber: formEnrollment.trim(),
      gtuName: formGtuName.trim() || undefined,
      firstName: formFirstName.trim() || parsedFN || undefined,
      middleName: formMiddleName.trim() || parsedMN || undefined,
      lastName: formLastName.trim() || parsedLN || undefined,
      personalEmail: formPersonalEmail.trim() || undefined,
      department: formDepartment,
      branchCode: formBranchCode.trim() || undefined,
      currentSemester: formSemester,
      status: formStatus,
      contactNumber: formContact.trim() || undefined,
      address: formAddress.trim() || undefined,
      dateOfBirth: formDob ? format(formDob, "yyyy-MM-dd") : undefined,
      admissionDate: formAdmissionDate ? format(formAdmissionDate, "yyyy-MM-dd") : undefined,
      gender: formGender,
      convocationYear: formConvocationYear ? Number(formConvocationYear) : undefined,
      shift: formShift,
      sem1Status: formSemesterStatuses[1],
      sem2Status: formSemesterStatuses[2],
      sem3Status: formSemesterStatuses[3],
      sem4Status: formSemesterStatuses[4],
      sem5Status: formSemesterStatuses[5],
      sem6Status: formSemesterStatuses[6],
      sem7Status: formSemesterStatuses[7],
      sem8Status: formSemesterStatuses[8],
    };
      
    studentData.instituteEmail = `${studentData.enrollmentNumber}@gppalanpur.in`;

    try {
        if (currentStudent && currentStudent.id) {
            await studentService.updateStudent(currentStudent.id, studentData);
            toast({ title: "Student Updated", description: "The student record has been successfully updated." });
        } else {
            await studentService.createStudent(studentData as Omit<Student, 'id'>);
            const systemUserName = studentData.gtuName || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim();
            toast({ title: "Student Added", description: `Student ${systemUserName} added. Institute Email: ${studentData.instituteEmail}, Default Password: ${studentData.enrollmentNumber}` });
        }
        await fetchStudents();
        setIsDialogOpen(false);
        resetForm();
    } catch (error) {
        toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message || "Could not save student record." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };
  const handleGtuFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedGtuFile(event.target.files[0]);
    } else {
      setSelectedGtuFile(null);
    }
  };

  const handleImportStudents = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
    setIsSubmitting(true);
    try {
        const result = await studentService.importStudents(selectedFile);
        await fetchStudents();
        toast({ title: "Import Successful", description: `${result.newCount} students added, ${result.updatedCount} students updated. Skipped: ${result.skippedCount}` });
    } catch (error: unknown) {
        console.error("Error processing standard CSV file:", error);
        toast({ variant: "destructive", title: "Standard Import Failed", description: error.message || "Could not process the CSV file." });
    } finally {
        setIsSubmitting(false);
        setSelectedFile(null);
        const fileInput = document.getElementById('csvImportStudent') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }
  };

  const handleExportStudents = () => {
    if (filteredStudents.length === 0) {
      toast({ title: "Export Canceled", description: "No students to export (check filters)." });
      return;
    }
    const header = ["id", "enrollmentNumber", "gtuName", "firstName", "middleName", "lastName", "personalEmail", "instituteEmail", "department", "branchCode", "currentSemester", "status", "contactNumber", "address", "dateOfBirth", "admissionDate", "gender", "convocationYear", "shift", "sem1Status", "sem2Status", "sem3Status", "sem4Status", "sem5Status", "sem6Status", "sem7Status", "sem8Status", "category", "isComplete", "termClose", "isCancel", "isPassAll", "aadharNumber"];
    const csvRows = [
      header.join(','),
      ...filteredStudents.map(student => [ 
        student.id,
        student.enrollmentNumber,
        `"${(student.gtuName || "").replace(/"/g, '""')}"`,
        `"${(student.firstName || "").replace(/"/g, '""')}"`,
        `"${(student.middleName || "").replace(/"/g, '""')}"`,
        `"${(student.lastName || "").replace(/"/g, '""')}"`,
        `"${(student.personalEmail || "").replace(/"/g, '""')}"`,
        student.instituteEmail,
        `"${student.department.replace(/"/g, '""')}"`,
        student.branchCode || "",
        student.currentSemester,
        student.status,
        `"${(student.contactNumber || "").replace(/"/g, '""')}"`,
        `"${(student.address || "").replace(/"/g, '""')}"`,
        student.dateOfBirth || "",
        student.admissionDate || "",
        student.gender || "",
        student.convocationYear || "",
        student.shift || "",
        student.sem1Status || "N/A", student.sem2Status || "N/A", student.sem3Status || "N/A", student.sem4Status || "N/A", student.sem5Status || "N/A", student.sem6Status || "N/A", student.sem7Status || "N/A", student.sem8Status || "N/A",
        student.category || "",
        student.isComplete ? "true" : "false",
        student.termClose ? "true" : "false",
        student.isCancel ? "true" : "false",
        student.isPassAll ? "true" : "false",
        student.aadharNumber || ""
      ].join(','))
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "students_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Students exported to students_export.csv" });
  };
  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,enrollmentNumber,gtuName,firstName,middleName,lastName,personalEmail,instituteEmail,department,branchCode,currentSemester,status,contactNumber,address,dateOfBirth,admissionDate,gender,convocationYear,shift,sem1Status,sem2Status,sem3Status,sem4Status,sem5Status,sem6Status,sem7Status,sem8Status,category,isComplete,termClose,isCancel,isPassAll,aadharNumber
s_001,GPPLN22001,SHARMA AARAV ROHIT,AARAV,ROHIT,SHARMA,aarav.s@example.com,,Computer Engineering,CE,3,active,9988776655,"123 Cyber Lane, Palanpur",2003-08-15,2022-07-01,Male,2025,Morning,Passed,Passed,Pending,N/A,N/A,N/A,N/A,N/A,OPEN,false,false,false,false,123456789012
,GPPLN21005,PATEL BHAVNA MAHESH,BHAVNA,MAHESH,PATEL,bhavna.p@example.com,,Mechanical Engineering,ME,5,active,9988776650,"Plot 45, Industrial Area, Mehsana",2002-01-20,2021-06-15,Female,2024,Afternoon,Passed,Passed,Passed,Passed,Passed,N/A,N/A,N/A,SEBC,false,false,false,false,
`;
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_students_import.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_students_import.csv downloaded." });
  };


  const handleImportGtuStudents = async () => {
    if (!selectedGtuFile) {
      toast({ variant: "destructive", title: "GTU Import Error", description: "Please select a GTU CSV file to import." });
      return;
    }
    setIsSubmitting(true);
    try {
        const result = await studentService.importGtuStudents(selectedGtuFile);
        await fetchStudents();
        toast({ title: "GTU Import Successful", description: `${result.newCount} students added, ${result.updatedCount} students updated. ${result.skippedCount} rows skipped.` });
    } catch (error: unknown) {
        console.error("Error processing GTU CSV file:", error);
        toast({ variant: "destructive", title: "GTU Import Failed", description: error.message || "Could not process the GTU CSV file." });
    } finally {
        setIsSubmitting(false);
        setSelectedGtuFile(null);
        const fileInput = document.getElementById('gtuCsvImportStudent') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }
  };

  const handleDownloadGtuSampleCsv = () => {
    const sampleCsvContent = `S.NO,map_number,BR_CODE,Name,Email,Mobile,Gender,convoyear,SEM1,SEM2,SEM3,SEM4,SEM5,SEM6,SEM7,SEM8,Category,isComplete,termClose,isCancel,ispassall,aadhar,shift
1,190010107001,CE,DOE JOHN MICHAEL,john.doe@example.com,9876500001,Male,2023,2,2,2,2,1,,,GENERAL,FALSE,FALSE,FALSE,FALSE,123456789012,Morning
2,190010107002,ME,SMITH JANE ANNA,jane.smith@example.com,9876500002,Female,,2,2,1,,,,,,SC,FALSE,FALSE,FALSE,FALSE,,Afternoon
3,200010107003,EE,PATEL RAJ KUMAR,raj.patel@example.com,9876500003,Male,2024,2,2,2,2,2,2,,ST,TRUE,TRUE,FALSE,TRUE,987654321098,Morning
`;
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_gtu_students_import.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "GTU Sample CSV Downloaded", description: "sample_gtu_students_import.csv downloaded." });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); 
  };

  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      result = result.filter(student =>
        (student.gtuName && student.gtuName.toLowerCase().includes(termLower)) ||
        (student.firstName && student.firstName.toLowerCase().includes(termLower)) ||
        (student.lastName && student.lastName.toLowerCase().includes(termLower)) ||
        student.enrollmentNumber.toLowerCase().includes(termLower) ||
        student.instituteEmail.toLowerCase().includes(termLower) ||
        (student.personalEmail && student.personalEmail.toLowerCase().includes(termLower)) ||
        (student.department && student.department.toLowerCase().includes(termLower))
      );
    }
    if (filterDepartmentVal !== 'all') {
      result = result.filter(student => student.department === filterDepartmentVal);
    }
    if (filterSemesterVal !== 'all') {
      result = result.filter(student => student.currentSemester === parseInt(filterSemesterVal, 10));
    }
    if (filterStatusVal !== 'all') {
      result = result.filter(student => student.status === filterStatusVal);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: unknown = a[sortField as keyof Student]; 
        let valB: unknown = b[sortField as keyof Student]; 

        if (sortField === 'currentSemester' || sortField === 'convocationYear') {
            valA = Number(valA) || 0;
            valB = Number(valB) || 0;
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
  }, [students, searchTerm, filterDepartmentVal, filterSemesterVal, filterStatusVal, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterDepartmentVal, filterSemesterVal, filterStatusVal, itemsPerPage]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedStudentIds(paginatedStudents.map(student => student.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(prev => [...prev, studentId]);
    } else {
      setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedStudentIds.length === 0) {
      toast({ variant: "destructive", title: "No Students Selected", description: "Please select students to delete." });
      return;
    }
    setIsSubmitting(true);
    try {
        for (const id of selectedStudentIds) {
            await studentService.deleteStudent(id);
        }
        await fetchStudents();
        toast({ title: "Students Deleted", description: `${selectedStudentIds.length} student(s) have been successfully deleted.` });
        setSelectedStudentIds([]);
    } catch (error) {
        toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete selected students." });
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedStudents.length > 0 && paginatedStudents.every(student => selectedStudentIds.includes(student.id));
  const isSomeSelectedOnPage = paginatedStudents.some(student => selectedStudentIds.includes(student.id)) && !isAllSelectedOnPage;


  if (isLoading) { 
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => handleSort(field)} className="cursor-pointer hover:bg-muted/50 whitespace-nowrap">
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (sortDirection === 'asc' ? <ArrowUpDown className="h-3 w-3 opacity-50 scale-y-[-1]" /> : <ArrowUpDown className="h-3 w-3 opacity-50" />)}
        {sortField !== field && <ArrowUpDown className="h-3 w-3 opacity-20" />}
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <BookUser className="h-6 w-6" />
              Student Management
            </CardTitle>
            <CardDescription>
              Manage student records, academic details, and status.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{currentStudent?.id ? "Edit Student" : "Add New Student"}</DialogTitle>
                  <DialogDescription>
                    {currentStudent?.id ? "Modify the details of this student." : "Create a new student record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[75vh] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                  <div className="md:col-span-1">
                    <Label htmlFor="studentEnrollment">Enrollment Number *</Label>
                    <Input id="studentEnrollment" value={formEnrollment} onChange={(e) => setFormEnrollment(e.target.value)} placeholder="e.g., GPPLN20001" disabled={isSubmitting || !!currentStudent?.id} required />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="studentGtuName">Full Name (GTU Format)</Label>
                    <Input id="studentGtuName" value={formGtuName} onChange={(e) => {setFormGtuName(e.target.value); const {firstName,middleName,lastName} = parseGtuName(e.target.value); setFormFirstName(firstName || ''); setFormMiddleName(middleName||''); setFormLastName(lastName||'');}} placeholder="e.g., SURNAME NAME FATHERNAME" disabled={isSubmitting} />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentFirstName">First Name</Label>
                    <Input id="studentFirstName" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} placeholder="e.g., John" disabled={isSubmitting} />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentMiddleName">Middle Name</Label>
                    <Input id="studentMiddleName" value={formMiddleName} onChange={(e) => setFormMiddleName(e.target.value)} placeholder="e.g., Robert" disabled={isSubmitting} />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentLastName">Last Name</Label>
                    <Input id="studentLastName" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} placeholder="e.g., Doe" disabled={isSubmitting} />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="studentPersonalEmail">Personal Email</Label>
                    <Input id="studentPersonalEmail" type="email" value={formPersonalEmail} onChange={(e) => setFormPersonalEmail(e.target.value)} placeholder="e.g., john.doe@example.com" disabled={isSubmitting} />
                  </div>
                   <div className="md:col-span-1">
                    <Label htmlFor="studentContact">Contact Number</Label>
                    <Input id="studentContact" type="tel" value={formContact} onChange={(e) => setFormContact(e.target.value)} placeholder="e.g., 9876543210" disabled={isSubmitting} />
                  </div>

                  <div className="md:col-span-1">
                    <Label htmlFor="studentDepartment">Department *</Label>
                    <Select value={formDepartment} onValueChange={(value) => setFormDepartment(value)} disabled={isSubmitting} required>
                       <SelectTrigger id="studentDepartment"><SelectValue placeholder="Select Department" /></SelectTrigger>
                        <SelectContent>
                            {DEPARTMENT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentBranchCode">Branch Code</Label>
                    <Input id="studentBranchCode" value={formBranchCode} onChange={(e) => setFormBranchCode(e.target.value)} placeholder="e.g., CE" disabled={isSubmitting} />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentSemester">Current Semester *</Label>
                     <Select value={String(formSemester)} onValueChange={(value) => setFormSemester(parseInt(value))} disabled={isSubmitting} required>
                       <SelectTrigger id="studentSemester"><SelectValue placeholder="Select Semester" /></SelectTrigger>
                        <SelectContent>
                            {SEMESTER_OPTIONS.map(opt => <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentStatus">Status *</Label>
                     <Select value={formStatus} onValueChange={(value) => setFormStatus(value as StudentStatus)} disabled={isSubmitting} required>
                       <SelectTrigger id="studentStatus"><SelectValue placeholder="Select Status" /></SelectTrigger>
                        <SelectContent>
                            {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                   <div className="md:col-span-1">
                     <Label htmlFor="studentGender">Gender</Label>
                     <Select value={formGender} onValueChange={(value) => setFormGender(value as Student['gender'] || undefined)} disabled={isSubmitting}>
                        <SelectTrigger id="studentGender"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                        <SelectContent>
                            {GENDER_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentShift">Shift</Label>
                     <Select value={formShift || ""} onValueChange={(value) => setFormShift(value as Student['shift'] || undefined)} disabled={isSubmitting}>
                        <SelectTrigger id="studentShift"><SelectValue placeholder="Select Shift" /></SelectTrigger>
                         <SelectContent>
                            {SHIFT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                   <div className="md:col-span-1">
                    <Label htmlFor="studentDob">Date of Birth</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !formDob && "text-muted-foreground")}
                                disabled={isSubmitting}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formDob ? format(formDob, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={formDob} onSelect={setFormDob} initialFocus captionLayout="dropdown-buttons" fromYear={1980} toYear={new Date().getFullYear() - 15} />
                        </PopoverContent>
                    </Popover>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentAdmissionDate">Admission Date</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !formAdmissionDate && "text-muted-foreground")}
                                disabled={isSubmitting}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formAdmissionDate ? format(formAdmissionDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={formAdmissionDate} onSelect={setFormAdmissionDate} initialFocus captionLayout="dropdown-buttons" fromYear={2000} toYear={new Date().getFullYear()} />
                        </PopoverContent>
                    </Popover>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentConvocationYear">Convocation Year</Label>
                    <Input id="studentConvocationYear" type="number" value={formConvocationYear || ''} onChange={(e) => setFormConvocationYear(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 2025" disabled={isSubmitting} />
                  </div>

                  <div className="md:col-span-3">
                    <Label htmlFor="studentAddress">Address</Label>
                    <Textarea id="studentAddress" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="e.g., 123 Main St, City" disabled={isSubmitting} rows={2} />
                  </div>

                  <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 border p-3 rounded-md">
                    <h4 className="md:col-span-full text-sm font-medium mb-1">Semester Statuses</h4>
                    {SEMESTER_OPTIONS.map(semNum => (
                        <div key={`sem-${semNum}-status-form`}>
                            <Label htmlFor={`sem${semNum}StatusForm`}>Sem {semNum}</Label>
                            <Select
                                value={formSemesterStatuses[semNum] || "N/A"}
                                onValueChange={(val) => setFormSemesterStatuses(prev => ({...prev, [semNum]: val as SemesterStatus}))}
                                disabled={isSubmitting}
                            >
                               <SelectTrigger id={`sem${semNum}StatusForm`}><SelectValue placeholder="Select Status" /></SelectTrigger>
                                <SelectContent>
                                    {SEMESTER_STATUS_OPTIONS.map(opt => <SelectItem key={`${opt.value}-${semNum}`} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                      ))}
                  </div>

                  <DialogFooter className="md:col-span-3 mt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {currentStudent?.id ? "Save Changes" : "Create Student"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportStudents} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Students (Standard Format)</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportStudent" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportStudents} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                Import Standard
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample (Standard)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Use for general student data import/update.
                </p>
            </div>
          </div>

          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-accent"/>Import GTU Student Data</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="gtuCsvImportStudent" accept=".csv" onChange={handleGtuFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportGtuStudents} disabled={isSubmitting || !selectedGtuFile} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                {isSubmitting && selectedGtuFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                Import GTU Data
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadGtuSampleCsv} variant="link" size="sm" className="px-0 text-accent">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample (GTU)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Import student data using the official GTU CSV format.
                </p>
            </div>
          </div>


          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="searchStudent">Search Students</Label>
              <div className="relative">
                 <Input
                    id="searchStudent"
                    placeholder="Name, email, enrollment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-8"
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterDepartmentStudent">Filter by Department</Label>
              <Select value={filterDepartmentVal} onValueChange={(value) => setFilterDepartmentVal(value)}>
                 <SelectTrigger id="filterDepartmentStudent"><SelectValue placeholder="All Departments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterSemesterStudent">Filter by Semester</Label>
              <Select value={filterSemesterVal} onValueChange={(value) => setFilterSemesterVal(value)}>
                 <SelectTrigger id="filterSemesterStudent"><SelectValue placeholder="All Semesters" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {SEMESTER_OPTIONS.map(opt => <SelectItem key={opt} value={String(opt)}>{`Semester ${opt}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStatusStudent">Filter by Status</Label>
              <Select value={filterStatusVal} onValueChange={(value) => setFilterStatusVal(value as StudentStatus | 'all')}>
                 <SelectTrigger id="filterStatusStudent"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedStudentIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedStudentIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedStudentIds.length} student(s) selected.
                </span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                    <Checkbox 
                        checked={isAllSelectedOnPage || (paginatedStudents.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)}
                        onCheckedChange={(checkedState) => handleSelectAll(!!checkedState)}
                        aria-label="Select all students on this page"
                    />
                </TableHead>
                <SortableTableHeader field="gtuName" label="Name (GTU)" />
                <SortableTableHeader field="enrollmentNumber" label="Enrollment No." />
                <SortableTableHeader field="department" label="Department" />
                <SortableTableHeader field="currentSemester" label="Sem" />
                <SortableTableHeader field="status" label="Status" />
                 <TableHead>Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student) => (
                <TableRow key={student.id} data-state={selectedStudentIds.includes(student.id) ? "selected" : undefined}>
                   <TableCell>
                      <Checkbox
                        checked={selectedStudentIds.includes(student.id)}
                        onCheckedChange={(checked) => handleSelectStudent(student.id, !!checked)}
                        aria-labelledby={`student-name-${student.id}`}
                       />
                  </TableCell>
                  <TableCell id={`student-name-${student.id}`} className="font-medium">
                    <div className="flex flex-col">
                        <span className="font-semibold">{student.gtuName || `${student.firstName || ''} ${student.lastName || ''}`.trim()}</span>
                        <span className="text-xs text-muted-foreground">{student.instituteEmail}</span>
                        {student.personalEmail && <span className="text-xs text-muted-foreground">P: {student.personalEmail}</span>}
                    </div>
                  </TableCell>
                  <TableCell>{student.enrollmentNumber}</TableCell>
                  <TableCell>
                    {student.department}
                    {student.branchCode && <span className="text-xs text-muted-foreground ml-1">({student.branchCode})</span>}
                  </TableCell>
                  <TableCell className="text-center">{student.currentSemester}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        student.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : student.status === 'graduated' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : student.status === 'dropped' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' // inactive
                    }`}>
                      {STATUS_OPTIONS.find(s => s.value === student.status)?.label || student.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <Info className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="w-64 p-2 text-xs">
                                <p><strong>Gender:</strong> {student.gender || 'N/A'}</p>
                                <p><strong>DOB:</strong> {student.dateOfBirth && isValid(parseISO(student.dateOfBirth)) ? format(parseISO(student.dateOfBirth), 'dd MMM yyyy') : 'N/A'}</p>
                                <p><strong>Admission:</strong> {student.admissionDate && isValid(parseISO(student.admissionDate)) ? format(parseISO(student.admissionDate), 'dd MMM yyyy') : 'N/A'}</p>
                                <p><strong>Convocation:</strong> {student.convocationYear || 'N/A'}</p>
                                <p><strong>Shift:</strong> {student.shift || 'N/A'}</p>
                                <p><strong>Category:</strong> {student.category || 'N/A'}</p>
                                <p><strong>All Pass:</strong> {student.isPassAll ? 'Yes' : 'No'}</p>
                                <div className="mt-1 pt-1 border-t">
                                    Semesters:
                                    {SEMESTER_OPTIONS.map(s => {
                                        const statusKey = `sem${s}Status` as keyof Student;
                                        const statusValue = student[statusKey] as SemesterStatus | undefined;
                                        return (
                                          statusValue && statusValue !== 'N/A' &&
                                          <span key={s} className="ml-1 text-muted-foreground">S{s}: {statusValue}</span>
                                        )
                                    })}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(student)} disabled={isSubmitting}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Student</span>
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(student.id)}
                        disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Student</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedStudents.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No students found. Try adjusting your search or filters, or add a new student.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {filteredStudents.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredStudents.length) : 0} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students.
            </div>
            <div className="flex items-center gap-2">
                 <Select
                    value={String(itemsPerPage)}
                    onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                    }}
                    >
                    <SelectTrigger className="w-[70px] h-8 text-xs">
                        <SelectValue placeholder={String(itemsPerPage)} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {ITEMS_PER_PAGE_OPTIONS.map((pageSize) => (
                        <SelectItem key={pageSize} value={String(pageSize)} className="text-xs">
                            {pageSize}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages > 0 ? totalPages : 1}
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1 || totalPages === 0}
                        >
                        <ChevronsLeft className="h-4 w-4" />
                        <span className="sr-only">First page</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || totalPages === 0}
                        >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous page</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next page</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        >
                        <ChevronsRight className="h-4 w-4" />
                        <span className="sr-only">Last page</span>
                    </Button>
                </div>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
