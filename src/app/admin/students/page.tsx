"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Users, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, CalendarDays as CalendarIcon, Info, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import type { Student, StudentStatus, Program, Institute } from '@/types/entities'; 
import { studentService } from '@/lib/api/students';
import { programService } from '@/lib/api/programs';
import { instituteService } from '@/lib/api/institutes';

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

const generateInstituteEmail = (firstName?: string, lastName?: string, instituteDomain: string = "gppalanpur.ac.in"): string => {
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student> | null>(null);

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
      const [studentData, programData, instituteData] = await Promise.all([
        studentService.getAllStudents(),
        programService.getAllPrograms(),
        instituteService.getAllInstitutes()
      ]);
      setStudentList(studentData);
      setPrograms(programData);
      setInstitutes(instituteData);
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
    const instituteDomain = selectedInstitute?.domain || "gppalanpur.ac.in";

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
  }, [studentList, searchTerm, filterProgramVal, filterStatusVal, filterSemesterVal, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterProgramVal, filterStatusVal, filterSemesterVal, itemsPerPage]);

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
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <Users className="h-6 w-6" />
              Student Management
            </CardTitle>
            <CardDescription>
              Manage student records, academic details, and enrollment information.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto" disabled={programs.length === 0}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{currentStudent?.id ? "Edit Student" : "Add New Student"}</DialogTitle>
                  <DialogDescription>
                    {currentStudent?.id ? "Modify the details of this student." : "Create a new student record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[75vh] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                  <div className="md:col-span-1">
                    <Label htmlFor="studentEnrollmentNumber">Enrollment Number *</Label>
                    <Input id="studentEnrollmentNumber" value={formEnrollmentNumber} onChange={(e) => setFormEnrollmentNumber(e.target.value)} placeholder="e.g., 2024CE001" disabled={isSubmitting} required />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentProgram">Program *</Label>
                    <Select value={formProgramId} onValueChange={(value) => {
                      setFormProgramId(value);
                      const selectedProgram = programs.find(p => p.id === value);
                    }} disabled={isSubmitting || programs.length === 0} required>
                      <SelectTrigger id="studentProgram"><SelectValue placeholder="Select Program"/></SelectTrigger>
                      <SelectContent>
                        {programs.map(prog => <SelectItem key={prog.id} value={prog.id}>{prog.name} ({prog.code})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3">
                    <Label htmlFor="studentFullNameGtu">Full Name (GTU Format)</Label>
                    <Input id="studentFullNameGtu" value={formFullNameGtuFormat} onChange={(e) => setFormFullNameGtuFormat(e.target.value)} placeholder="e.g., SHARMA AMIT KUMAR" disabled={isSubmitting} />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentFirstName">First Name *</Label>
                    <Input id="studentFirstName" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} placeholder="e.g., Amit" disabled={isSubmitting} required/>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentMiddleName">Middle Name</Label>
                    <Input id="studentMiddleName" value={formMiddleName} onChange={(e) => setFormMiddleName(e.target.value)} placeholder="e.g., Kumar" disabled={isSubmitting} />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentLastName">Last Name *</Label>
                    <Input id="studentLastName" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} placeholder="e.g., Sharma" disabled={isSubmitting} required/>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="studentPersonalEmail">Personal Email</Label>
                    <Input id="studentPersonalEmail" type="email" value={formPersonalEmail} onChange={(e) => setFormPersonalEmail(e.target.value)} placeholder="e.g., amit.sharma@example.com" disabled={isSubmitting} />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentContact">Contact Number</Label>
                    <Input id="studentContact" type="tel" value={formContactNumber} onChange={(e) => setFormContactNumber(e.target.value)} placeholder="e.g., 9876543210" disabled={isSubmitting} />
                  </div>
                  <div className="md:col-span-3">
                    <Label htmlFor="studentAddress">Address</Label>
                    <Textarea id="studentAddress" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Full address" disabled={isSubmitting} />
                  </div>
                  
                  <div className="md:col-span-1">
                    <Label htmlFor="studentSemester">Current Semester</Label>
                    <Select value={String(formCurrentSemester)} onValueChange={(value) => setFormCurrentSemester(parseInt(value))} disabled={isSubmitting}>
                      <SelectTrigger id="studentSemester"><SelectValue placeholder="Select Semester"/></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8].map(sem => <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
                    <Label htmlFor="studentCategory">Category</Label>
                    <Select value={formCategory || ""} onValueChange={setFormCategory} disabled={isSubmitting}>
                      <SelectTrigger id="studentCategory"><SelectValue placeholder="Select Category"/></SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentShift">Shift</Label>
                    <Select value={formShift} onValueChange={setFormShift} disabled={isSubmitting}>
                      <SelectTrigger id="studentShift"><SelectValue placeholder="Select Shift"/></SelectTrigger>
                      <SelectContent>
                        {SHIFT_OPTIONS.map(shift => <SelectItem key={shift} value={shift}>{shift}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentGender">Gender</Label>
                    <Select value={formGender} onValueChange={setFormGender} disabled={isSubmitting}>
                      <SelectTrigger id="studentGender"><SelectValue placeholder="Select Gender"/></SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map(gender => <SelectItem key={gender} value={gender}>{gender}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-1">
                    <Label htmlFor="studentDob">Date of Birth</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !formDateOfBirth && "text-muted-foreground")}
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
                  <div className="md:col-span-1">
                    <Label htmlFor="studentBloodGroup">Blood Group</Label>
                    <Select value={formBloodGroup} onValueChange={setFormBloodGroup} disabled={isSubmitting}>
                      <SelectTrigger id="studentBloodGroup"><SelectValue placeholder="Select Blood Group"/></SelectTrigger>
                      <SelectContent>
                        {BLOOD_GROUP_OPTIONS.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentAadhar">Aadhar Number</Label>
                    <Input id="studentAadhar" value={formAadharNumber} onChange={(e) => setFormAadharNumber(e.target.value)} placeholder="e.g., 123456789012" disabled={isSubmitting} />
                  </div>
                  
                  <div className="md:col-span-1">
                    <Label htmlFor="studentStatus">Status *</Label>
                    <Select value={formStatus} onValueChange={(value) => setFormStatus(value as StudentStatus)} disabled={isSubmitting} required>
                      <SelectTrigger id="studentStatus"><SelectValue placeholder="Select Status"/></SelectTrigger>
                      <SelectContent>
                        {STUDENT_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="studentAcademicRemarks">Academic Remarks</Label>
                    <Textarea id="studentAcademicRemarks" value={formAcademicRemarks} onChange={(e) => setFormAcademicRemarks(e.target.value)} placeholder="Academic notes and remarks" disabled={isSubmitting} />
                  </div>
                  
                  {/* Guardian Details */}
                  <div className="md:col-span-3 border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Guardian Details</h4>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="guardianName">Guardian Name</Label>
                    <Input id="guardianName" value={formGuardianName} onChange={(e) => setFormGuardianName(e.target.value)} placeholder="Guardian's full name" disabled={isSubmitting} />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="guardianRelation">Relation</Label>
                    <Select value={formGuardianRelation} onValueChange={setFormGuardianRelation} disabled={isSubmitting}>
                      <SelectTrigger id="guardianRelation"><SelectValue placeholder="Select Relation"/></SelectTrigger>
                      <SelectContent>
                        {GUARDIAN_RELATION_OPTIONS.map(rel => <SelectItem key={rel} value={rel}>{rel}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="guardianContact">Guardian Contact</Label>
                    <Input id="guardianContact" value={formGuardianContact} onChange={(e) => setFormGuardianContact(e.target.value)} placeholder="Guardian's phone number" disabled={isSubmitting} />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="guardianOccupation">Guardian Occupation</Label>
                    <Input id="guardianOccupation" value={formGuardianOccupation} onChange={(e) => setFormGuardianOccupation(e.target.value)} placeholder="Guardian's occupation" disabled={isSubmitting} />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="guardianIncome">Annual Income</Label>
                    <Input id="guardianIncome" type="number" value={formGuardianAnnualIncome || ''} onChange={(e) => setFormGuardianAnnualIncome(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="Annual income" disabled={isSubmitting} />
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
          <div className="mb-6 p-4 border rounded-lg space-y-4 dark:border-gray-700">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Students (Standard Format)</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportStudents" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
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
                Use for general student data import/update. Requires enrollmentNumber, firstName, lastName, programId, status.
              </p>
            </div>
          </div>

          <div className="mb-6 p-4 border rounded-lg space-y-4 dark:border-gray-700">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-accent"/>Import GTU Student Data</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="gtuCsvImportStudents" accept=".csv" onChange={handleGtuFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportGtuStudents} disabled={isSubmitting || !selectedGtuFile || programs.length === 0} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                {isSubmitting && selectedGtuFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                Import GTU Data
              </Button>
            </div>
            {programs.length === 0 && <p className="text-xs text-destructive">GTU Import disabled: No programs found. Please add programs first.</p>}
            <div className="flex items-center gap-2">
              <Button onClick={handleDownloadGtuSampleCsv} variant="link" size="sm" className="px-0 text-accent">
                <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample (GTU)
              </Button>
              <p className="text-xs text-muted-foreground">
                Import student data using the official GTU CSV format.
              </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg dark:border-gray-700">
            <div>
              <Label htmlFor="searchStudents">Search Students</Label>
              <div className="relative">
                <Input
                  id="searchStudents"
                  placeholder="Name, enrollment, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-8"
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterStudentProgram">Filter by Program</Label>
              <Select value={filterProgramVal} onValueChange={setFilterProgramVal}>
                <SelectTrigger id="filterStudentProgram"><SelectValue placeholder="All Programs"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map(prog => <SelectItem key={prog.id} value={prog.id}>{prog.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStudentStatus">Filter by Status</Label>
              <Select value={filterStatusVal} onValueChange={(value) => setFilterStatusVal(value as StudentStatus | 'all')}>
                <SelectTrigger id="filterStudentStatus"><SelectValue placeholder="All Statuses"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STUDENT_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStudentSemester">Filter by Semester</Label>
              <Select value={filterSemesterVal} onValueChange={setFilterSemesterVal}>
                <SelectTrigger id="filterStudentSemester"><SelectValue placeholder="All Semesters"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {[1,2,3,4,5,6,7,8].map(sem => <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>)}
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
                    checked={isAllSelectedOnPage ? true : (isSomeSelectedOnPage ? 'indeterminate' : false)}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean | 'indeterminate')}
                    aria-label="Select all students on this page"
                  />
                </TableHead>
                <SortableTableHeader field="enrollmentNumber" label="Enrollment" />
                <SortableTableHeader field="firstName" label="Name" />
                <SortableTableHeader field="programId" label="Program" />
                <SortableTableHeader field="currentSemester" label="Semester" />
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