"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Users, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, CalendarDays as CalendarIcon, Info, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import type { Student, StudentStatus, Program, Institute, Batch } from '@/types/entities'; 
import { studentService } from '@/lib/api/students';
import { programService } from '@/lib/api/programs';
import { instituteService } from '@/lib/api/institutes';
import { batchService } from '@/lib/api/batches';

const STUDENT_STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "graduated", label: "Graduated" },
  { value: "dropped", label: "Dropped" },
];

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SHIFT_OPTIONS = ["Morning", "Afternoon", "Evening"];
const CATEGORY_OPTIONS = ["GENERAL", "OPEN", "SEBC", "OBC", "SC", "ST", "EWS", "Other"];
const GUARDIAN_RELATION_OPTIONS = ["Father", "Mother", "Guardian", "Uncle", "Aunt", "Brother", "Sister", "Other"];

type SortField = keyof Student | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const generateInstituteEmail = (firstName?: string, lastName?: string, instituteDomain: string = "gppalanpur.in"): string => {
  const fn = (firstName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  const ln = (lastName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  if (fn && ln) {
    return `${fn}.${ln}@${instituteDomain}`;
  }
  return `student_${Date.now().toString().slice(-5)}_${Math.random().toString(36).substring(2,5)}@${instituteDomain}`;
};

export default function AdminStudentsPage() {
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isBulkBatchDialogOpen, setIsBulkBatchDialogOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student> | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [bulkBatchId, setBulkBatchId] = useState<string>('');

  // Form state
  const [formEnrollmentNumber, setFormEnrollmentNumber] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formMiddleName, setFormMiddleName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formFullNameGtuFormat, setFormFullNameGtuFormat] = useState('');
  const [formPersonalEmail, setFormPersonalEmail] = useState('');
  const [formContactNumber, setFormContactNumber] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formProgramId, setFormProgramId] = useState<string>('');
  const [formBatchId, setFormBatchId] = useState<string>('');
  const [formCurrentSemester, setFormCurrentSemester] = useState<number>(1);
  const [formAdmissionDate, setFormAdmissionDate] = useState<Date | undefined>(undefined);
  const [formCategory, setFormCategory] = useState<string>('');
  const [formShift, setFormShift] = useState<string>('');
  const [formGender, setFormGender] = useState<string>('');
  const [formDateOfBirth, setFormDateOfBirth] = useState<Date | undefined>(undefined);
  const [formBloodGroup, setFormBloodGroup] = useState<string>('');
  const [formAadharNumber, setFormAadharNumber] = useState('');
  const [formStatus, setFormStatus] = useState<StudentStatus>('active');
  const [formAcademicRemarks, setFormAcademicRemarks] = useState('');
  
  // Guardian details
  const [formGuardianName, setFormGuardianName] = useState('');
  const [formGuardianRelation, setFormGuardianRelation] = useState('');
  const [formGuardianContact, setFormGuardianContact] = useState('');
  const [formGuardianOccupation, setFormGuardianOccupation] = useState('');
  const [formGuardianAnnualIncome, setFormGuardianAnnualIncome] = useState<number | undefined>(undefined);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGtuFile, setSelectedGtuFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgramVal, setFilterProgramVal] = useState<string>('all');
  const [filterBatchVal, setFilterBatchVal] = useState<string>('all');
  const [filterStatusVal, setFilterStatusVal] = useState<StudentStatus | 'all'>('all');
  const [filterSemesterVal, setFilterSemesterVal] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('enrollmentNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);

  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studentData, programData, instituteData, batchData] = await Promise.all([
        studentService.getAllStudents(),
        programService.getAllPrograms(),
        instituteService.getAllInstitutes(),
        batchService.getAllBatches()
      ]);
      setStudentList(studentData);
      setPrograms(programData);
      setInstitutes(instituteData);
      setBatches(batchData);
      if (programData.length > 0 && !formProgramId) {
        setFormProgramId(programData[0].id);
      }
    } catch (_error: unknown) {
      console.error("Failed to load data:", _error);
      toast({ variant: "destructive", title: "Error", description: "Could not load student data" });
    }
    setIsLoading(false);
  }, [formProgramId, toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const resetForm = () => {
    setFormEnrollmentNumber('');
    setFormFirstName(''); 
    setFormMiddleName(''); 
    setFormLastName('');
    setFormFullNameGtuFormat('');
    setFormPersonalEmail(''); 
    setFormContactNumber('');
    setFormAddress('');
    setFormProgramId(programs.length > 0 ? programs[0].id : '');
    setFormBatchId('');
    setFormCurrentSemester(1);
    setFormAdmissionDate(undefined);
    setFormCategory('');
    setFormShift('');
    setFormGender('');
    setFormDateOfBirth(undefined);
    setFormBloodGroup('');
    setFormAadharNumber('');
    setFormStatus('active');
    setFormAcademicRemarks('');
    setFormGuardianName('');
    setFormGuardianRelation('');
    setFormGuardianContact('');
    setFormGuardianOccupation('');
    setFormGuardianAnnualIncome(undefined);
    setCurrentStudent(null);
  };

  const handleEdit = (student: Student) => {
    setCurrentStudent(student);
    setFormEnrollmentNumber(student.enrollmentNumber);
    setFormFirstName(student.firstName || '');
    setFormMiddleName(student.middleName || '');
    setFormLastName(student.lastName || '');
    setFormFullNameGtuFormat(student.fullNameGtuFormat || '');
    setFormPersonalEmail(student.personalEmail || '');
    setFormContactNumber(student.contactNumber || '');
    setFormAddress(student.address || '');
    setFormProgramId(student.programId || (programs.length > 0 ? programs[0].id : ''));
    setFormBatchId(student.batchId || '');
    setFormCurrentSemester(student.currentSemester || 1);
    setFormAdmissionDate(student.admissionDate && isValid(parseISO(student.admissionDate)) ? parseISO(student.admissionDate) : undefined);
    setFormCategory(student.category || '');
    setFormShift(student.shift || '');
    setFormGender(student.gender || '');
    setFormDateOfBirth(student.dateOfBirth && isValid(parseISO(student.dateOfBirth)) ? parseISO(student.dateOfBirth) : undefined);
    setFormBloodGroup(student.bloodGroup || '');
    setFormAadharNumber(student.aadharNumber || '');
    setFormStatus(student.status);
    setFormAcademicRemarks(student.academicRemarks || '');
    
    // Guardian details
    setFormGuardianName(student.guardianDetails?.name || '');
    setFormGuardianRelation(student.guardianDetails?.relation || '');
    setFormGuardianContact(student.guardianDetails?.contactNumber || '');
    setFormGuardianOccupation(student.guardianDetails?.occupation || '');
    setFormGuardianAnnualIncome(student.guardianDetails?.annualIncome || undefined);

    setIsDialogOpen(true);
  };

  const handleView = (student: Student) => {
    setViewStudent(student);
    setIsViewDialogOpen(true);
  };

  const handleAddNew = () => {
    if (programs.length === 0) {
      toast({ variant: "destructive", title: "Cannot Add Student", description: "No programs available. Please create a program first." });
      return;
    }
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (studentId: string) => {
    setIsSubmitting(true);
    try {
      // Use role-specific deletion (removes student role, deletes user if it's the last role)
      const result = await studentService.removeStudentRole(studentId);
      await fetchInitialData();
      setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
      
      if (result.userDeleted) {
        toast({ 
          title: "Student and User Deleted", 
          description: "Student role removed. User account was also deleted as it was their only role." 
        });
      } else {
        toast({ 
          title: "Student Role Removed", 
          description: "Student role removed. User account retained with other roles." 
        });
      }
    } catch (_error: unknown) {
      console.error("Failed to remove student role:", _error);
      const errorMessage = _error instanceof Error ? _error.message : "Failed to remove student role";
      
      // Handle the case where student was already deleted
      if (errorMessage.includes("Student not found")) {
        await fetchInitialData();
        setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
        toast({ 
          title: "Student Record Not Found", 
          description: "This student record has already been deleted or does not exist. The list has been refreshed.",
          variant: "default"
        });
      } else {
        toast({ variant: "destructive", title: "Delete Failed", description: errorMessage });
      }
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formEnrollmentNumber.trim() || !formFirstName.trim() || !formLastName.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Enrollment Number, First Name and Last Name are required." });
      return;
    }
    if (!formProgramId) {
      toast({ variant: "destructive", title: "Validation Error", description: "Program is required." });
      return;
    }
    if (formPersonalEmail.trim() && !/\S+@\S+\.\S+/.test(formPersonalEmail)) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid personal email address or leave it empty." });
      return;
    }
    
    setIsSubmitting(true);
      
    const selectedProgram = programs.find(prog => prog.id === formProgramId);
    const selectedInstitute = institutes.find(inst => inst.id === selectedProgram?.instituteId);
    const instituteDomain = selectedInstitute?.domain || "gppalanpur.in";

    const studentData: Omit<Student, 'id'> & { instituteId?: string } = {
      enrollmentNumber: formEnrollmentNumber.trim(),
      firstName: formFirstName.trim() || undefined,
      middleName: formMiddleName.trim() || undefined,
      lastName: formLastName.trim() || undefined,
      fullNameGtuFormat: formFullNameGtuFormat.trim() || undefined,
      personalEmail: formPersonalEmail.trim() || undefined,
      instituteEmail: generateInstituteEmail(formFirstName.trim(), formLastName.trim(), instituteDomain),
      contactNumber: formContactNumber.trim() || undefined,
      address: formAddress.trim() || undefined,
      programId: formProgramId,
      batchId: formBatchId && formBatchId !== 'none' ? formBatchId : undefined,
      currentSemester: formCurrentSemester,
      admissionDate: formAdmissionDate ? format(formAdmissionDate, "yyyy-MM-dd") : undefined,
      category: formCategory || undefined,
      shift: formShift || undefined,
      gender: formGender || undefined,
      dateOfBirth: formDateOfBirth ? format(formDateOfBirth, "yyyy-MM-dd") : undefined,
      bloodGroup: formBloodGroup || undefined,
      aadharNumber: formAadharNumber.trim() || undefined,
      status: formStatus,
      academicRemarks: formAcademicRemarks.trim() || undefined,
      guardianDetails: (formGuardianName || formGuardianRelation || formGuardianContact) ? {
        name: formGuardianName.trim(),
        relation: formGuardianRelation,
        contactNumber: formGuardianContact.trim(),
        occupation: formGuardianOccupation.trim() || undefined,
        annualIncome: formGuardianAnnualIncome || undefined,
      } : undefined,
      instituteId: selectedProgram?.instituteId,
    };

    try {
      let resultStudent;
      if (currentStudent && currentStudent.id) {
        resultStudent = await studentService.updateStudent(currentStudent.id, studentData);
        toast({ title: "Student Updated", description: "The student record has been successfully updated." });
      } else {
        resultStudent = await studentService.createStudent(studentData);
        const defaultPassword = studentData.enrollmentNumber;
        toast({ title: "Student Added", description: `Student ${resultStudent.firstName} ${resultStudent.lastName} added. Institute Email: ${resultStudent.instituteEmail}. Default Password: ${defaultPassword}` });
      }
      await fetchInitialData();
      setIsDialogOpen(false);
      resetForm();
    } catch (_error: unknown) {
      console.error("Failed to save student:", _error);
      toast({ variant: "destructive", title: "Error", description: _error instanceof Error ? _error.message : "Failed to save student" });
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

  const handleImportStudents = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await studentService.importStudents(selectedFile, programs);
      await fetchInitialData();
      toast({ title: "Standard Import Successful", description: `${result.newCount} students added, ${result.updatedCount} students updated. Skipped: ${result.skippedCount}` });
    } catch (error: unknown) {
      console.error("Error processing standard CSV file:", error);
      toast({ variant: "destructive", title: "Standard Import Failed", description: error instanceof Error ? error.message : "Could not process the CSV file." });
    } finally {
      setIsSubmitting(false);
      setSelectedFile(null);
      const fileInput = document.getElementById('csvImportStudents') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };
  
  const handleExportStudents = () => {
    if (filteredStudents.length === 0) {
      toast({ title: "Export Canceled", description: "No students to export (check filters)." });
      return;
    }
    const header = ['id', 'enrollmentNumber', 'firstName', 'middleName', 'lastName', 'fullNameGtuFormat', 'personalEmail', 'instituteEmail', 'contactNumber', 'address', 'programId', 'currentSemester', 'admissionDate', 'category', 'shift', 'gender', 'dateOfBirth', 'bloodGroup', 'aadharNumber', 'status', 'academicRemarks', 'guardianName', 'guardianRelation', 'guardianContact', 'guardianOccupation', 'guardianIncome'];
    const csvRows = [
      header.join(','),
      ...filteredStudents.map(s => [
        s.id, s.enrollmentNumber, `"${s.firstName || ''}"`, `"${s.middleName || ''}"`, `"${s.lastName || ''}"`,
        `"${s.fullNameGtuFormat || ''}"`, `"${s.personalEmail || ''}"`, s.instituteEmail, `"${s.contactNumber || ''}"`, `"${s.address || ''}"`,
        s.programId, s.currentSemester, s.admissionDate || '', s.category || '', s.shift || '', s.gender || '', s.dateOfBirth || '', s.bloodGroup || '',
        `"${s.aadharNumber || ''}"`, s.status, `"${s.academicRemarks || ''}"`,
        `"${s.guardianDetails?.name || ''}"`, s.guardianDetails?.relation || '', `"${s.guardianDetails?.contactNumber || ''}"`, 
        `"${s.guardianDetails?.occupation || ''}"`, s.guardianDetails?.annualIncome || ''
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
    const sampleCsvContent = `enrollmentNumber,firstName,middleName,lastName,fullNameGtuFormat,personalEmail,contactNumber,address,programId,currentSemester,admissionDate,category,shift,gender,dateOfBirth,bloodGroup,aadharNumber,status,academicRemarks,guardianName,guardianRelation,guardianContact,guardianOccupation,guardianIncome
2024CE001,AMIT,KUMAR,SHARMA,"SHARMA AMIT KUMAR",amit.sharma@example.com,9876543210,"123 Main St, Palanpur",prog1,1,2024-07-01,General,Morning,Male,2005-05-15,B+,123456789012,active,"Good academic performance",RAJESH SHARMA,Father,9876543200,Engineer,500000
2024ME002,PRIYA,RAJESH,PATEL,"PATEL PRIYA RAJESH",priya.patel@example.com,9876543211,"456 Second St, Palanpur",prog2,3,2022-07-01,OBC,Morning,Female,2003-11-20,A+,234567890123,active,"Excellent student",RAJESH PATEL,Father,9876543201,Business,750000`;
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
      const result = await studentService.importGtuStudents(selectedGtuFile, programs);
      await fetchInitialData();
      toast({ title: "GTU Import Successful", description: `${result.newCount} students added, ${result.updatedCount} students updated. ${result.skippedCount} rows skipped.` });
    } catch (error: unknown) {
      console.error("Error processing GTU CSV file:", error);
      toast({ variant: "destructive", title: "GTU Import Failed", description: error instanceof Error ? error.message : "Could not process the GTU CSV file." });
    } finally {
      setIsSubmitting(false);
      setSelectedGtuFile(null);
      const fileInput = document.getElementById('gtuCsvImportStudents') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };
  
  const handleDownloadGtuSampleCsv = () => {
    const sampleCsvContent = `S.NO,map_number,BR_CODE,Name,Email,Mobile,Gender,convoyear,SEM1,SEM2,SEM3,SEM4,SEM5,SEM6,SEM7,SEM8,Category,isComplete,termClose,isCancel,ispassall,aadhar,shift
1,226260311001,11,CHAUDHARY ARYAN JITENDRABHAI,ajchaudhary467@gmail.com,9427951973,M,,1,,,,,,,,SEBC,,,,,312161202483,1
2,226260311005,11,PRAJAPATI AKSHAY DINESHBHAI,akshayprajapati1691@gmail.com,6354953760,M,,1,,,,,,,,SEBC,,,,,778361572299,1
3,226260311007,11,PRAJAPATI HARSHDKUMAR SURESHBHAI,harshadprajapati099@gmail.com,9313031347,M,,2,2,1,1,1,2,,,SEBC,True,,,,896326556973,1`;
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
    let result = [...studentList];

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.enrollmentNumber.toLowerCase().includes(termLower) ||
        (s.firstName && s.firstName.toLowerCase().includes(termLower)) ||
        (s.lastName && s.lastName.toLowerCase().includes(termLower)) ||
        (s.fullNameGtuFormat && s.fullNameGtuFormat.toLowerCase().includes(termLower)) ||
        s.instituteEmail.toLowerCase().includes(termLower) ||
        (s.personalEmail && s.personalEmail.toLowerCase().includes(termLower))
      );
    }
    if (filterProgramVal !== 'all') {
      result = result.filter(s => s.programId === filterProgramVal);
    }
    if (filterStatusVal !== 'all') {
      result = result.filter(s => s.status === filterStatusVal);
    }
    if (filterBatchVal !== 'all') {
      if (filterBatchVal === 'unassigned') {
        result = result.filter(s => !s.batchId);
      } else {
        result = result.filter(s => s.batchId === filterBatchVal);
      }
    }
    if (filterSemesterVal !== 'all') {
      result = result.filter(s => s.currentSemester === parseInt(filterSemesterVal));
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        const valA = a[sortField as keyof Student] as string | number | Date | undefined; 
        const valB = b[sortField as keyof Student] as string | number | Date | undefined; 

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
  }, [studentList, searchTerm, filterProgramVal, filterBatchVal, filterStatusVal, filterSemesterVal, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterProgramVal, filterBatchVal, filterStatusVal, filterSemesterVal, itemsPerPage]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedStudentIds(paginatedStudents.map(s => s.id));
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
    let deletedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;
    
    try {
        for (const id of selectedStudentIds) {
            try {
                await studentService.deleteStudent(id);
                deletedCount++;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                if (errorMessage.includes("Student not found")) {
                    notFoundCount++;
                } else {
                    errorCount++;
                    console.error(`Failed to delete student ${id}:`, error);
                }
            }
        }
        
        await fetchInitialData();
        setSelectedStudentIds([]);
        
        // Build appropriate success/warning message
        let title = "Deletion Complete";
        let description = "";
        let variant: "default" | "destructive" = "default";
        
        if (deletedCount > 0 && errorCount === 0) {
            description = `${deletedCount} student(s) deleted successfully.`;
            if (notFoundCount > 0) {
                description += ` ${notFoundCount} were already deleted.`;
            }
        } else if (errorCount > 0) {
            title = "Partial Deletion";
            description = `${deletedCount} deleted, ${errorCount} failed.`;
            if (notFoundCount > 0) {
                description += ` ${notFoundCount} were already deleted.`;
            }
            variant = "destructive";
        } else if (notFoundCount > 0) {
            title = "Records Not Found";
            description = "The selected student records were already deleted.";
        }
        
        toast({ title, description, variant });
    } catch (error) {
        await fetchInitialData();
        setSelectedStudentIds([]);
        toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete selected students." });
    }
    setIsSubmitting(false);
  };

  const handleBulkBatchAssignment = async () => {
    if (selectedStudentIds.length === 0) {
      toast({ variant: "destructive", title: "No Students Selected", description: "Please select students to assign to batch." });
      return;
    }
    if (!bulkBatchId) {
      toast({ variant: "destructive", title: "No Batch Selected", description: "Please select a batch to assign students to." });
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const studentId of selectedStudentIds) {
        try {
          const student = studentList.find(s => s.id === studentId);
          if (student) {
            await studentService.updateStudent(studentId, { ...student, batchId: bulkBatchId === 'none' ? undefined : bulkBatchId });
            successCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`Failed to assign batch to student ${studentId}:`, error);
        }
      }
      
      await fetchInitialData();
      setSelectedStudentIds([]);
      setIsBulkBatchDialogOpen(false);
      setBulkBatchId('');
      
      if (successCount > 0 && errorCount === 0) {
        toast({ 
          title: "Batch Assignment Complete", 
          description: `${successCount} student(s) successfully assigned to batch.` 
        });
      } else if (errorCount > 0) {
        toast({ 
          variant: "destructive",
          title: "Partial Assignment", 
          description: `${successCount} assigned, ${errorCount} failed.` 
        });
      }
    } catch (error) {
      await fetchInitialData();
      setSelectedStudentIds([]);
      toast({ 
        variant: "destructive", 
        title: "Assignment Failed", 
        description: (error as Error).message || "Could not assign students to batch." 
      });
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudentIds.includes(s.id));
  const isSomeSelectedOnPage = paginatedStudents.some(s => selectedStudentIds.includes(s.id)) && !isAllSelectedOnPage;

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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-3 sm:px-4 py-4 sm:py-6">
      <Card className="shadow-lg sm:shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6">
          <div className="w-full sm:w-auto">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-primary flex items-center gap-2">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="sm:hidden">Students</span>
              <span className="hidden sm:inline">Student Management</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Manage student records, academic details, and enrollment information.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto min-h-[44px]" disabled={programs.length === 0}>
                  <PlusCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> 
                  <span className="sm:hidden">Add Student</span>
                  <span className="hidden sm:inline">Add New Student</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>{currentStudent?.id ? "Edit Student" : "Add New Student"}</DialogTitle>
                  <DialogDescription>
                    {currentStudent?.id ? "Modify the details of this student." : "Create a new student record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 py-4 max-h-[75vh] overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 sm:gap-x-4 lg:gap-x-6 gap-y-3 sm:gap-y-4">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="studentEnrollmentNumber" className="text-sm font-medium">Enrollment Number *</Label>
                    <Input id="studentEnrollmentNumber" value={formEnrollmentNumber} onChange={(e) => setFormEnrollmentNumber(e.target.value)} placeholder="e.g., 2024CE001" disabled={isSubmitting} required className="mt-1 min-h-[44px]" />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="studentProgram" className="text-sm font-medium">Program *</Label>
                    <Select value={formProgramId} onValueChange={(value) => {
                      setFormProgramId(value);
                      setFormBatchId(''); // Reset batch when program changes
                      const selectedProgram = programs.find(p => p.id === value);
                    }} disabled={isSubmitting || programs.length === 0} required>
                      <SelectTrigger id="studentProgram" className="mt-1 min-h-[44px]"><SelectValue placeholder="Select Program"/></SelectTrigger>
                      <SelectContent>
                        {programs.map(prog => <SelectItem key={prog.id} value={prog.id}>{prog.name} ({prog.code})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="studentBatch" className="text-sm font-medium">Batch</Label>
                    <Select value={formBatchId} onValueChange={setFormBatchId} disabled={isSubmitting || !formProgramId}>
                      <SelectTrigger id="studentBatch" className="mt-1 min-h-[44px]"><SelectValue placeholder="Select Batch"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Batch</SelectItem>
                        {batches
                          .filter(batch => batch.programId === formProgramId)
                          .map(batch => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.name} ({batch.status})
                              {batch.maxIntake && ` - Max: ${batch.maxIntake}`}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <Label htmlFor="studentFullNameGtu" className="text-sm font-medium">Full Name (GTU Format)</Label>
                    <Input id="studentFullNameGtu" value={formFullNameGtuFormat} onChange={(e) => setFormFullNameGtuFormat(e.target.value)} placeholder="e.g., SHARMA AMIT KUMAR" disabled={isSubmitting} className="mt-1 min-h-[44px]" />
                  </div>
                  <div className="sm:col-span-1 lg:col-span-1">
                    <Label htmlFor="studentFirstName" className="text-sm font-medium">First Name *</Label>
                    <Input id="studentFirstName" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} placeholder="e.g., Amit" disabled={isSubmitting} required className="mt-1 min-h-[44px]"/>
                  </div>
                  <div className="sm:col-span-1 lg:col-span-1">
                    <Label htmlFor="studentMiddleName" className="text-sm font-medium">Middle Name</Label>
                    <Input id="studentMiddleName" value={formMiddleName} onChange={(e) => setFormMiddleName(e.target.value)} placeholder="e.g., Kumar" disabled={isSubmitting} className="mt-1 min-h-[44px]" />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="studentLastName" className="text-sm font-medium">Last Name *</Label>
                    <Input id="studentLastName" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} placeholder="e.g., Sharma" disabled={isSubmitting} required className="mt-1 min-h-[44px]"/>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-2">
                    <Label htmlFor="studentPersonalEmail" className="text-sm font-medium">Personal Email</Label>
                    <Input id="studentPersonalEmail" type="email" value={formPersonalEmail} onChange={(e) => setFormPersonalEmail(e.target.value)} placeholder="e.g., amit.sharma@example.com" disabled={isSubmitting} className="mt-1 min-h-[44px]" />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="studentContact" className="text-sm font-medium">Contact Number</Label>
                    <Input id="studentContact" type="tel" value={formContactNumber} onChange={(e) => setFormContactNumber(e.target.value)} placeholder="e.g., 9876543210" disabled={isSubmitting} className="mt-1 min-h-[44px]" />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Label htmlFor="studentAddress" className="text-sm font-medium">Address</Label>
                    <Textarea id="studentAddress" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Full address" disabled={isSubmitting} className="mt-1 min-h-[44px]" />
                  </div>
                  
                  <div className="sm:col-span-1 lg:col-span-1">
                    <Label htmlFor="studentSemester" className="text-sm font-medium">Current Semester</Label>
                    <Select value={String(formCurrentSemester)} onValueChange={(value) => setFormCurrentSemester(parseInt(value))} disabled={isSubmitting}>
                      <SelectTrigger id="studentSemester" className="mt-1 min-h-[44px]"><SelectValue placeholder="Select Semester"/></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6].map(sem => <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-1 lg:col-span-1">
                    <Label htmlFor="studentAdmissionDate" className="text-sm font-medium">Admission Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal mt-1 min-h-[44px]", !formAdmissionDate && "text-muted-foreground")}
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
                  
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="studentCategory" className="text-sm font-medium">Category</Label>
                    <Select value={formCategory || ""} onValueChange={setFormCategory} disabled={isSubmitting}>
                      <SelectTrigger id="studentCategory" className="mt-1 min-h-[44px]"><SelectValue placeholder="Select Category"/></SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-1 lg:col-span-1">
                    <Label htmlFor="studentShift" className="text-sm font-medium">Shift</Label>
                    <Select value={formShift} onValueChange={setFormShift} disabled={isSubmitting}>
                      <SelectTrigger id="studentShift" className="mt-1 min-h-[44px]"><SelectValue placeholder="Select Shift"/></SelectTrigger>
                      <SelectContent>
                        {SHIFT_OPTIONS.map(shift => <SelectItem key={shift} value={shift}>{shift}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-1 lg:col-span-1">
                    <Label htmlFor="studentGender" className="text-sm font-medium">Gender</Label>
                    <Select value={formGender} onValueChange={setFormGender} disabled={isSubmitting}>
                      <SelectTrigger id="studentGender" className="mt-1 min-h-[44px]"><SelectValue placeholder="Select Gender"/></SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map(gender => <SelectItem key={gender} value={gender}>{gender}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="sm:col-span-1 lg:col-span-1">
                    <Label htmlFor="studentDob" className="text-sm font-medium">Date of Birth</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal mt-1 min-h-[44px]", !formDateOfBirth && "text-muted-foreground")}
                          disabled={isSubmitting}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formDateOfBirth ? format(formDateOfBirth, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={formDateOfBirth} onSelect={setFormDateOfBirth} initialFocus captionLayout="dropdown-buttons" fromYear={1980} toYear={new Date().getFullYear() - 16} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="sm:col-span-1 lg:col-span-1">
                    <Label htmlFor="studentBloodGroup" className="text-sm font-medium">Blood Group</Label>
                    <Select value={formBloodGroup} onValueChange={setFormBloodGroup} disabled={isSubmitting}>
                      <SelectTrigger id="studentBloodGroup" className="mt-1 min-h-[44px]"><SelectValue placeholder="Select Blood Group"/></SelectTrigger>
                      <SelectContent>
                        {BLOOD_GROUP_OPTIONS.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="studentAadhar" className="text-sm font-medium">Aadhar Number</Label>
                    <Input id="studentAadhar" value={formAadharNumber} onChange={(e) => setFormAadharNumber(e.target.value)} placeholder="e.g., 123456789012" disabled={isSubmitting} className="mt-1 min-h-[44px]" />
                  </div>
                  
                  <div className="sm:col-span-1 lg:col-span-1">
                    <Label htmlFor="studentStatus" className="text-sm font-medium">Status *</Label>
                    <Select value={formStatus} onValueChange={(value) => setFormStatus(value as StudentStatus)} disabled={isSubmitting} required>
                      <SelectTrigger id="studentStatus" className="mt-1 min-h-[44px]"><SelectValue placeholder="Select Status"/></SelectTrigger>
                      <SelectContent>
                        {STUDENT_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-2">
                    <Label htmlFor="studentAcademicRemarks" className="text-sm font-medium">Academic Remarks</Label>
                    <Textarea id="studentAcademicRemarks" value={formAcademicRemarks} onChange={(e) => setFormAcademicRemarks(e.target.value)} placeholder="Academic notes and remarks" disabled={isSubmitting} className="mt-1 min-h-[44px]" />
                  </div>
                  
                  {/* Guardian Details */}
                  <div className="sm:col-span-2 lg:col-span-3 border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Guardian Details</h4>
                  </div>
                  <div className="sm:col-span-1 lg:col-span-1">
                    <Label htmlFor="guardianName" className="text-sm font-medium">Guardian Name</Label>
                    <Input id="guardianName" value={formGuardianName} onChange={(e) => setFormGuardianName(e.target.value)} placeholder="Guardian's full name" disabled={isSubmitting} className="mt-1 min-h-[44px]" />
                  </div>
                  <div className="sm:col-span-1 lg:col-span-1">
                    <Label htmlFor="guardianRelation" className="text-sm font-medium">Relation</Label>
                    <Select value={formGuardianRelation} onValueChange={setFormGuardianRelation} disabled={isSubmitting}>
                      <SelectTrigger id="guardianRelation" className="mt-1 min-h-[44px]"><SelectValue placeholder="Select Relation"/></SelectTrigger>
                      <SelectContent>
                        {GUARDIAN_RELATION_OPTIONS.map(rel => <SelectItem key={rel} value={rel}>{rel}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="guardianContact" className="text-sm font-medium">Guardian Contact</Label>
                    <Input id="guardianContact" value={formGuardianContact} onChange={(e) => setFormGuardianContact(e.target.value)} placeholder="Guardian's phone number" disabled={isSubmitting} className="mt-1 min-h-[44px]" />
                  </div>
                  <div className="sm:col-span-1 lg:col-span-1">
                    <Label htmlFor="guardianOccupation" className="text-sm font-medium">Guardian Occupation</Label>
                    <Input id="guardianOccupation" value={formGuardianOccupation} onChange={(e) => setFormGuardianOccupation(e.target.value)} placeholder="Guardian's occupation" disabled={isSubmitting} className="mt-1 min-h-[44px]" />
                  </div>
                  <div className="sm:col-span-1 lg:col-span-1">
                    <Label htmlFor="guardianIncome" className="text-sm font-medium">Annual Income</Label>
                    <Input id="guardianIncome" type="number" value={formGuardianAnnualIncome || ''} onChange={(e) => setFormGuardianAnnualIncome(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="Annual income" disabled={isSubmitting} className="mt-1 min-h-[44px]" />
                  </div>
                  
                  <DialogFooter className="sm:col-span-2 lg:col-span-3 mt-4 flex flex-col sm:flex-row gap-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px]">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {currentStudent?.id ? "Save Changes" : "Create Student"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportStudents} variant="outline" className="w-full sm:w-auto min-h-[44px]">
              <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> 
              <span className="sm:hidden">Export</span>
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-4 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-medium flex items-center gap-2"><UploadCloud className="h-4 w-4 sm:h-5 sm:w-5 text-primary"/>Import Students (Standard Format)</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportStudents" accept=".csv" onChange={handleFileChange} className="flex-grow min-h-[44px] text-sm" disabled={isSubmitting} />
              <Button onClick={handleImportStudents} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto min-h-[44px] text-sm">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                <span className="sm:hidden">Import</span>
                <span className="hidden sm:inline">Import Standard</span>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary w-fit">
                <FileSpreadsheet className="mr-1 h-4 w-4" /> 
                <span className="text-xs sm:text-sm">Download Sample (Standard)</span>
              </Button>
              <p className="text-xs text-muted-foreground">
                Use for general student data import/update. Requires enrollmentNumber, firstName, lastName, programId, status.
              </p>
            </div>
          </div>

          <div className="mb-4 sm:mb-6 p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-4 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-medium flex items-center gap-2"><UploadCloud className="h-4 w-4 sm:h-5 sm:w-5 text-accent"/>Import GTU Student Data</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="gtuCsvImportStudents" accept=".csv" onChange={handleGtuFileChange} className="flex-grow min-h-[44px] text-sm" disabled={isSubmitting} />
              <Button onClick={handleImportGtuStudents} disabled={isSubmitting || !selectedGtuFile || programs.length === 0} className="w-full sm:w-auto min-h-[44px] text-sm bg-accent hover:bg-accent/90 text-accent-foreground">
                {isSubmitting && selectedGtuFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                <span className="sm:hidden">Import GTU</span>
                <span className="hidden sm:inline">Import GTU Data</span>
              </Button>
            </div>
            {programs.length === 0 && <p className="text-xs text-destructive">GTU Import disabled: No programs found. Please add programs first.</p>}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Button onClick={handleDownloadGtuSampleCsv} variant="link" size="sm" className="px-0 text-accent w-fit">
                <FileSpreadsheet className="mr-1 h-4 w-4" /> 
                <span className="text-xs sm:text-sm">Download Sample (GTU)</span>
              </Button>
              <p className="text-xs text-muted-foreground">
                Import student data using the official GTU CSV format.
              </p>
            </div>
          </div>

          <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg dark:border-gray-700">
            <div>
              <Label htmlFor="searchStudents" className="text-sm font-medium">Search Students</Label>
              <div className="relative mt-1">
                <Input
                  id="searchStudents"
                  placeholder="Name, enrollment, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-8 min-h-[44px] text-sm"
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterStudentProgram" className="text-sm font-medium">Filter by Program</Label>
              <Select value={filterProgramVal} onValueChange={setFilterProgramVal}>
                <SelectTrigger id="filterStudentProgram" className="mt-1 min-h-[44px] text-sm"><SelectValue placeholder="All Programs"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map(prog => <SelectItem key={prog.id} value={prog.id}>{prog.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStudentBatch" className="text-sm font-medium">Filter by Batch</Label>
              <Select value={filterBatchVal} onValueChange={setFilterBatchVal}>
                <SelectTrigger id="filterStudentBatch" className="mt-1 min-h-[44px] text-sm"><SelectValue placeholder="All Batches"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {batches.map(batch => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({programs.find(p => p.id === batch.programId)?.code || 'Unknown Program'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStudentStatus" className="text-sm font-medium">Filter by Status</Label>
              <Select value={filterStatusVal} onValueChange={(value) => setFilterStatusVal(value as StudentStatus | 'all')}>
                <SelectTrigger id="filterStudentStatus" className="mt-1 min-h-[44px] text-sm"><SelectValue placeholder="All Statuses"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STUDENT_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStudentSemester" className="text-sm font-medium">Filter by Semester</Label>
              <Select value={filterSemesterVal} onValueChange={setFilterSemesterVal}>
                <SelectTrigger id="filterStudentSemester" className="mt-1 min-h-[44px] text-sm"><SelectValue placeholder="All Semesters"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {[1,2,3,4,5,6].map(sem => <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedStudentIds.length > 0 && (
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={() => setIsBulkBatchDialogOpen(true)} 
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[44px]"
              >
                <Users className="mr-2 h-4 w-4" /> 
                <span className="sm:hidden">Assign Batch ({selectedStudentIds.length})</span>
                <span className="hidden sm:inline">Assign to Batch ({selectedStudentIds.length})</span>
              </Button>
              <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
                <Trash2 className="mr-2 h-4 w-4" /> 
                <span className="sm:hidden">Delete ({selectedStudentIds.length})</span>
                <span className="hidden sm:inline">Delete Selected ({selectedStudentIds.length})</span>
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedStudentIds.length} student(s) selected.
              </span>
            </div>
          )}

          {/* Mobile View */}
          <div className="block lg:hidden space-y-3">
            {paginatedStudents.map((student) => (
              <Card key={student.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Checkbox
                        checked={selectedStudentIds.includes(student.id)}
                        onCheckedChange={(checked) => handleSelectStudent(student.id, !!checked)}
                        aria-labelledby={`student-name-mobile-${student.id}`}
                      />
                      <div className="min-w-0 flex-1">
                        <h4 id={`student-name-mobile-${student.id}`} className="font-semibold text-sm leading-tight">
                          {[student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ') || student.fullNameGtuFormat || student.enrollmentNumber}
                        </h4>
                        <p className="text-xs text-muted-foreground">{student.enrollmentNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">{student.instituteEmail}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                      student.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : student.status === 'graduated' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : student.status === 'dropped' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300' 
                    }`}>
                      {STUDENT_STATUS_OPTIONS.find(s => s.value === student.status)?.label || student.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">Program:</span>
                      <p className="font-medium truncate">{programs.find(p => p.id === student.programId)?.name || student.programId}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Semester:</span>
                      <p className="font-medium">Sem {student.currentSemester}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Batch:</span>
                      <p className="font-medium truncate">
                        {student.batchId ? 
                          batches.find(b => b.id === student.batchId)?.name || student.batchId
                          : 'Not Assigned'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Contact:</span>
                      <p className="font-medium">{student.contactNumber || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(student)} disabled={isSubmitting} className="flex-1 min-h-[40px]">
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(student)} disabled={isSubmitting} className="flex-1 min-h-[40px]">
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(student.id)} disabled={isSubmitting} className="min-h-[40px]">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {paginatedStudents.length === 0 && (
              <Card className="shadow-sm">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No students found. Try adjusting your search or filters, or add a new student.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto border rounded-lg">
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={isAllSelectedOnPage ? true : (isSomeSelectedOnPage ? 'indeterminate' : false)}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean | 'indeterminate')}
                    aria-label="Select all students on this page"
                  />
                </TableHead>
                <SortableTableHeader field="enrollmentNumber" label="Enrollment" />
                <SortableTableHeader field="firstName" label="Name" />
                <SortableTableHeader field="programId" label="Program" />
                <SortableTableHeader field="batchId" label="Batch" />
                <SortableTableHeader field="currentSemester" label="Semester" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead>Details</TableHead>
                <TableHead className="text-right w-32">Actions</TableHead>
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
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="font-semibold">{student.enrollmentNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell id={`student-name-${student.id}`} className="font-medium">
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {[student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ') || student.fullNameGtuFormat || student.enrollmentNumber}
                      </span>
                      <span className="text-xs text-muted-foreground">{student.instituteEmail}</span>
                      {student.personalEmail && <span className="text-xs text-muted-foreground">P: {student.personalEmail}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {programs.find(p => p.id === student.programId)?.name || student.programId}
                  </TableCell>
                  <TableCell>
                    {student.batchId ? 
                      batches.find(b => b.id === student.batchId)?.name || student.batchId
                      : <span className="text-muted-foreground">Not Assigned</span>
                    }
                  </TableCell>
                  <TableCell>Sem {student.currentSemester}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      student.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : student.status === 'graduated' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : student.status === 'dropped' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300' 
                    }`}>
                      {STUDENT_STATUS_OPTIONS.find(s => s.value === student.status)?.label || student.status}
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
                          <p><strong>Category:</strong> {student.category || 'N/A'}</p>
                          <p><strong>Contact:</strong> {student.contactNumber || 'N/A'}</p>
                          <p><strong>Blood Group:</strong> {student.bloodGroup || 'N/A'}</p>
                          <p><strong>Guardian:</strong> {student.guardianDetails?.name || 'N/A'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="icon" onClick={() => handleView(student)} disabled={isSubmitting}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Student</span>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleEdit(student)} disabled={isSubmitting}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit Student</span>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(student.id)} disabled={isSubmitting}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Student</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No students found. Try adjusting your search or filters, or add a new student.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 sm:px-6">
          <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
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
              <SelectTrigger className="w-[70px] h-8 sm:h-10 text-xs">
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
            <span className="text-xs sm:text-sm text-muted-foreground">
              Page {currentPage} of {totalPages > 0 ? totalPages : 1}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || totalPages === 0}
              >
                <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="sr-only">First page</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || totalPages === 0}
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="sr-only">Previous page</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="sr-only">Next page</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="sr-only">Last page</span>
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* View Student Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Complete information for {viewStudent?.firstName} {viewStudent?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {viewStudent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <span className="font-medium">Enrollment Number:</span>
                    <p className="text-muted-foreground">{viewStudent.enrollmentNumber}</p>
                  </div>
                  <div>
                    <span className="font-medium">Full Name:</span>
                    <p className="text-muted-foreground">{viewStudent.firstName} {viewStudent.middleName} {viewStudent.lastName}</p>
                  </div>
                  <div>
                    <span className="font-medium">GTU Format Name:</span>
                    <p className="text-muted-foreground">{viewStudent.fullNameGtuFormat || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Gender:</span>
                    <p className="text-muted-foreground">{viewStudent.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date of Birth:</span>
                    <p className="text-muted-foreground">
                      {viewStudent.dateOfBirth ? format(parseISO(viewStudent.dateOfBirth), 'dd/MM/yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Blood Group:</span>
                    <p className="text-muted-foreground">{viewStudent.bloodGroup || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Aadhar Number:</span>
                    <p className="text-muted-foreground">{viewStudent.aadharNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Category:</span>
                    <p className="text-muted-foreground">{viewStudent.category || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Contact Information</h3>
                <div className="grid grid-cols-1 gap-3 sm:gap-4 text-sm">
                  <div>
                    <span className="font-medium">Personal Email:</span>
                    <p className="text-muted-foreground">{viewStudent.personalEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Contact Number:</span>
                    <p className="text-muted-foreground">{viewStudent.contactNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Address:</span>
                    <p className="text-muted-foreground">{viewStudent.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Academic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <span className="font-medium">Program:</span>
                    <p className="text-muted-foreground">
                      {programs.find(p => p.id === viewStudent.programId)?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Current Semester:</span>
                    <p className="text-muted-foreground">{viewStudent.currentSemester}</p>
                  </div>
                  <div>
                    <span className="font-medium">Admission Date:</span>
                    <p className="text-muted-foreground">
                      {viewStudent.admissionDate ? format(parseISO(viewStudent.admissionDate), 'dd/MM/yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Shift:</span>
                    <p className="text-muted-foreground">{viewStudent.shift || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      viewStudent.status === 'active' ? 'bg-green-100 text-green-800' :
                      viewStudent.status === 'graduated' ? 'bg-blue-100 text-blue-800' :
                      viewStudent.status === 'dropped' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {viewStudent.status}
                    </span>
                  </div>
                </div>
                {viewStudent.academicRemarks && (
                  <div className="mt-4">
                    <span className="font-medium">Academic Remarks:</span>
                    <p className="text-muted-foreground mt-1">{viewStudent.academicRemarks}</p>
                  </div>
                )}
              </div>

              {/* Guardian Information */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Guardian Information</h3>
                <div className="grid grid-cols-1 gap-3 sm:gap-4 text-sm">
                  <div>
                    <span className="font-medium">Guardian Name:</span>
                    <p className="text-muted-foreground">{viewStudent.guardianDetails?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Relation:</span>
                    <p className="text-muted-foreground">{viewStudent.guardianDetails?.relation || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Contact Number:</span>
                    <p className="text-muted-foreground">{viewStudent.guardianDetails?.contactNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Occupation:</span>
                    <p className="text-muted-foreground">{viewStudent.guardianDetails?.occupation || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Annual Income:</span>
                    <p className="text-muted-foreground">
                      {viewStudent.guardianDetails?.annualIncome ? `₹${viewStudent.guardianDetails.annualIncome.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto min-h-[44px]">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Batch Assignment Dialog */}
      <Dialog open={isBulkBatchDialogOpen} onOpenChange={(isOpen) => { setIsBulkBatchDialogOpen(isOpen); if (!isOpen) setBulkBatchId(''); }}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Students to Batch</DialogTitle>
            <DialogDescription>
              Assign {selectedStudentIds.length} selected student(s) to a batch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="bulkBatchSelect" className="text-sm font-medium">Select Batch</Label>
              <Select value={bulkBatchId} onValueChange={setBulkBatchId}>
                <SelectTrigger id="bulkBatchSelect" className="mt-1 min-h-[44px]">
                  <SelectValue placeholder="Select a batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Remove from Batch</SelectItem>
                  {batches.map(batch => {
                    const program = programs.find(p => p.id === batch.programId);
                    return (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} - {program?.name || 'Unknown Program'}
                        {batch.maxIntake && ` (Max: ${batch.maxIntake})`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {bulkBatchId && (
              <div className="text-sm text-muted-foreground">
                <p>Selected batch: {batches.find(b => b.id === bulkBatchId)?.name}</p>
                <p>Students to assign: {selectedStudentIds.length}</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px]">Cancel</Button>
            </DialogClose>
            <Button onClick={handleBulkBatchAssignment} disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign to Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}