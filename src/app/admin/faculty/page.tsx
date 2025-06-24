"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, UsersRound, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, CalendarDays as CalendarIcon, Info, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Removed unused Textarea import
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import type { Faculty, FacultyStatus, JobType, Gender, Institute, StaffCategory } from '@/types/entities'; 
import { STAFF_CATEGORY_OPTIONS } from '@/types/entities'; // Import STAFF_CATEGORY_OPTIONS
import { facultyService } from '@/lib/api/faculty';
import { instituteService } from '@/lib/api/institutes'; 

const DEPARTMENT_OPTIONS = [
  "Computer Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Electronics & Communication Engineering",
  "Applied Mechanics",
  "General Department", 
  "Administration",
  "Other",
];

const DESIGNATION_OPTIONS = [
  "Lecturer", "Senior Lecturer", "Head of Department (HOD)", 
  "Principal", "Assistant Professor", "Associate Professor", "Professor",
  "Lab Assistant", "Workshop Instructor", "Clerk", "Accountant", "Librarian", "Other"
];

const JOB_TYPE_OPTIONS: JobType[] = ["Regular", "Adhoc", "Contractual", "Visiting", "Other"];
const FACULTY_STATUS_OPTIONS: { value: FacultyStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
  { value: "retired", label: "Retired" },
  { value: "resigned", label: "Resigned" },
];
const GENDER_OPTIONS: Gender[] = ["Male", "Female", "Other"];
const TITLE_OPTIONS = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];
const MARITAL_STATUS_OPTIONS = ["Single", "Married", "Divorced", "Widowed", "Other"];

type SortField = keyof Faculty | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const parseGtuFacultyName = (gtuNameInput: string | undefined): { title?: string, firstName?: string, middleName?: string, lastName?: string } => {
    if (!gtuNameInput) return {};
    let gtuName = gtuNameInput.trim();
    let title: string | undefined;
    const titles = ["Dr. Prof.", "Dr.", "Prof.", "Mr.", "Ms.", "Mrs."];
    
    for (const t of titles) {
      const tLower = t.toLowerCase();
      if (gtuName.toLowerCase().startsWith(tLower + " ") || (t.endsWith(".") && gtuName.toLowerCase().startsWith(tLower))) {
        title = gtuName.substring(0, t.length); 
        gtuName = gtuName.substring(t.length).trim();
        if (gtuName.startsWith(".")) gtuName = gtuName.substring(1).trim(); 
        break; 
      }
    }
    
    const parts = gtuName.split(/\s+/).filter(p => p);
    if (parts.length === 0) return { title };
    if (parts.length === 1) return { title, firstName: parts[0], lastName: 'SURNAME' }; 
    if (parts.length === 2) return { title, lastName: parts[0], firstName: parts[1] }; 
    return { title, lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') }; 
};

const generateInstituteEmail = (firstName?: string, lastName?: string, instituteDomain: string = "gppalanpur.ac.in"): string => {
  const fn = (firstName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  const ln = (lastName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  if (fn && ln) {
    return `${fn}.${ln}@${instituteDomain}`;
  }
  // Fallback if names are not sufficient
  return `faculty_${Date.now().toString().slice(-5)}_${Math.random().toString(36).substring(2,5)}@${instituteDomain}`;
};


export default function FacultyManagementPage() {
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentFaculty, setCurrentFaculty] = useState<Partial<Faculty> | null>(null);

  // Form state
  const [formStaffCode, setFormStaffCode] = useState('');
  const [formGtuName, setFormGtuName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formMiddleName, setFormMiddleName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formPersonalEmail, setFormPersonalEmail] = useState('');
  const [formDepartment, setFormDepartment] = useState(DEPARTMENT_OPTIONS[0]);
  const [formDesignation, setFormDesignation] = useState(DESIGNATION_OPTIONS[0]);
  const [formJobType, setFormJobType] = useState<JobType>('Regular');
  const [formStaffCategory, setFormStaffCategory] = useState<StaffCategory>('Teaching'); // Added
  const [formContact, setFormContact] = useState('');
  const [formDob, setFormDob] = useState<Date | undefined>(undefined);
  const [formJoiningDate, setFormJoiningDate] = useState<Date | undefined>(undefined);
  const [formGender, setFormGender] = useState<Gender | undefined>(undefined);
  const [formMaritalStatus, setFormMaritalStatus] = useState<string | undefined>(undefined);
  const [formStatus, setFormStatus] = useState<FacultyStatus>('active');
  const [formAadhar, setFormAadhar] = useState('');
  const [formPan, setFormPan] = useState('');
  const [formInstituteId, setFormInstituteId] = useState<string>('');


  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGtuFile, setSelectedGtuFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartmentVal, setFilterDepartmentVal] = useState<string>('all');
  const [filterDesignationVal, setFilterDesignationVal] = useState<string>('all');
  const [filterStatusVal, setFilterStatusVal] = useState<FacultyStatus | 'all'>('all');
  const [filterStaffCategoryVal, setFilterStaffCategoryVal] = useState<StaffCategory | 'all'>('all'); // Added
  const [sortField, setSortField] = useState<SortField>('gtuName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>([]);


  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);

  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [facultyData, instituteData] = await Promise.all([
        facultyService.getAllFaculty(),
        instituteService.getAllInstitutes()
      ]);
      setFacultyList(facultyData);
      setInstitutes(instituteData);
      if (instituteData.length > 0 && !formInstituteId) {
        setFormInstituteId(instituteData[0].id); 
      }
    } catch (_error: unknown) {
      console.error("Failed to load data:", _error);
      toast({ variant: "destructive", title: "Error", description: "Could not load faculty data" });
    }
    setIsLoading(false);
  }, [formInstituteId, toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const resetForm = () => {
    setFormStaffCode(''); setFormGtuName(''); setFormTitle('');
    setFormFirstName(''); setFormMiddleName(''); setFormLastName('');
    setFormPersonalEmail(''); setFormDepartment(DEPARTMENT_OPTIONS[0]); 
    setFormDesignation(DESIGNATION_OPTIONS[0]); 
    setFormJobType('Regular'); setFormStaffCategory('Teaching'); // Added
    setFormContact('');
    setFormDob(undefined); setFormJoiningDate(undefined);
    setFormGender(undefined); setFormMaritalStatus(undefined);
    setFormStatus('active'); setFormAadhar(''); setFormPan('');
    setFormInstituteId(institutes.length > 0 ? institutes[0].id : '');
    setCurrentFaculty(null);
  };

  const handleEdit = (faculty: Faculty) => {
    setCurrentFaculty(faculty);
    setFormStaffCode(faculty.staffCode);
    
    if (faculty.firstName || faculty.lastName) {
        setFormGtuName(faculty.gtuName || ''); 
        setFormTitle(faculty.title || '');
        setFormFirstName(faculty.firstName || '');
        setFormMiddleName(faculty.middleName || '');
        setFormLastName(faculty.lastName || '');
    } else {
        const { title, firstName, middleName, lastName } = parseGtuFacultyName(faculty.gtuName);
        setFormGtuName(faculty.gtuName || ''); 
        setFormTitle(title || faculty.title || '');
        setFormFirstName(firstName || '');
        setFormMiddleName(middleName || '');
        setFormLastName(lastName || '');
    }

    setFormPersonalEmail(faculty.personalEmail || ''); 
    setFormDepartment(faculty.department || DEPARTMENT_OPTIONS[0]); 
    setFormDesignation(faculty.designation || DESIGNATION_OPTIONS[0]);
    setFormJobType(faculty.jobType ?? 'Regular'); 
    setFormStaffCategory(faculty.staffCategory || 'Teaching'); // Added
    setFormContact(faculty.contactNumber ?? '');
    setFormDob(faculty.dateOfBirth && isValid(parseISO(faculty.dateOfBirth)) ? parseISO(faculty.dateOfBirth) : undefined);
    setFormJoiningDate(faculty.joiningDate && isValid(parseISO(faculty.joiningDate)) ? parseISO(faculty.joiningDate) : undefined);
    setFormGender(faculty.gender ?? undefined);
    setFormMaritalStatus(faculty.maritalStatus ?? undefined);
    setFormStatus(faculty.status);
    setFormAadhar(faculty.aadharNumber || '');
    setFormPan(faculty.panCardNumber || '');
    setFormInstituteId(faculty.instituteId || (institutes.length > 0 ? institutes[0].id : ''));


    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    if (institutes.length === 0) {
      toast({ variant: "destructive", title: "Cannot Add Faculty", description: "No institutes available. Please create an institute first." });
      return;
    }
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (facultyId: string) => {
    setIsSubmitting(true);
    try {
      await facultyService.deleteFaculty(facultyId);
      await fetchInitialData();
      setSelectedFacultyIds(prev => prev.filter(id => id !== facultyId));
      toast({ title: "Faculty Deleted", description: "The faculty record has been successfully deleted." });
    } catch (_error: unknown) {
        console.error("Failed to delete faculty member:", _error);
        toast({ variant: "destructive", title: "Delete Failed", description: _error instanceof Error ? _error.message : "Failed to delete faculty member" });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formStaffCode.trim() || (!formFirstName.trim() || !formLastName.trim())) {
      toast({ variant: "destructive", title: "Validation Error", description: "Staff Code, First Name and Last Name are required." });
      return;
    }
    if (!formInstituteId) {
      toast({ variant: "destructive", title: "Validation Error", description: "Institute is required." });
      return;
    }
    if (formPersonalEmail.trim() && !/\S+@\S+\.\S+/.test(formPersonalEmail)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid personal email address or leave it empty." });
        return;
    }
    
    setIsSubmitting(true);
      
    const selectedInstitute = institutes.find(inst => inst.id === formInstituteId);
    const instituteDomain = selectedInstitute?.domain || "gppalanpur.ac.in";


    const facultyData: Omit<Faculty, 'id' > & { instituteId: string } = { // Ensure instituteId is part of the payload
      staffCode: formStaffCode.trim(),
      gtuName: formGtuName.trim() || [formTitle.trim(), formFirstName.trim(), formMiddleName.trim(), formLastName.trim()].filter(Boolean).join(' ') || undefined,
      title: formTitle.trim() || undefined,
      firstName: formFirstName.trim() || undefined,
      middleName: formMiddleName.trim() || undefined,
      lastName: formLastName.trim() || undefined,
      personalEmail: formPersonalEmail.trim() || undefined, 
      instituteEmail: generateInstituteEmail(formFirstName.trim(), formLastName.trim(), instituteDomain),
      department: formDepartment,
      designation: formDesignation.trim() || undefined,
      jobType: formJobType,
      staffCategory: formStaffCategory, // Added
      contactNumber: formContact.trim() || undefined,
      dateOfBirth: formDob ? format(formDob, "yyyy-MM-dd") : undefined,
      joiningDate: formJoiningDate ? format(formJoiningDate, "yyyy-MM-dd") : undefined,
      gender: formGender,
      maritalStatus: formMaritalStatus,
      status: formStatus,
      aadharNumber: formAadhar.trim() || undefined,
      panCardNumber: formPan.trim() || undefined,
      instituteId: formInstituteId, // Added instituteId
    };
      

    try {
      let resultFaculty;
      if (currentFaculty && currentFaculty.id) {
        resultFaculty = await facultyService.updateFaculty(currentFaculty.id, facultyData);
        toast({ title: "Faculty Updated", description: "The faculty record has been successfully updated." });
      } else {
        resultFaculty = await facultyService.createFaculty(facultyData as Omit<Faculty, 'id'> & { instituteId: string }); 
        const defaultPassword = facultyData.staffCode;
        toast({ title: "Faculty Added", description: `Faculty ${resultFaculty.firstName} ${resultFaculty.lastName} added. Institute Email: ${resultFaculty.instituteEmail}. Default Password: ${defaultPassword}` });
      }
      await fetchInitialData();
      setIsDialogOpen(false);
      resetForm();
    } catch (_error: unknown) {
      console.error("Failed to save faculty member:", _error);
      toast({ variant: "destructive", title: "Error", description: _error instanceof Error ? _error.message : "Failed to save faculty member" });
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

  const handleImportFaculty = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
    if (!formInstituteId && institutes.length > 0) { // Check if an institute context is needed/available
        toast({ variant: "warning", title: "Institute Context", description: "No institute selected for import context. Using first available or system default for new users." });
    }
    setIsSubmitting(true);
    try {
        const result = await facultyService.importFaculty(selectedFile, formInstituteId || undefined);
        await fetchInitialData();
        toast({ title: "Standard Import Successful", description: `${result.newCount} faculty added, ${result.updatedCount} faculty updated. Skipped: ${result.skippedCount}` });
    } catch (error: unknown) {
        console.error("Error processing standard CSV file:", error);
        toast({ variant: "destructive", title: "Standard Import Failed", description: error instanceof Error ? error.message : "Could not process the CSV file." });
    } finally {
        setIsSubmitting(false);
        setSelectedFile(null);
        const fileInput = document.getElementById('csvImportFaculty') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }
  };
  
  const handleExportFaculty = () => {
    if (filteredFaculty.length === 0) {
      toast({ title: "Export Canceled", description: "No faculty to export (check filters)." });
      return;
    }
    const header = ['id', 'staffCode', 'gtuName', 'title', 'firstName', 'middleName', 'lastName', 'personalEmail', 'instituteEmail', 'contactNumber', 'department', 'designation', 'jobType', 'staffCategory', 'instType', 'dateOfBirth', 'joiningDate', 'gender', 'maritalStatus', 'status', 'aadharNumber', 'panCardNumber', 'gpfNpsNumber', 'placeOfBirth', 'nationality', 'knownAs', 'userId', 'instituteId'];
    const csvRows = [
      header.join(','),
      ...filteredFaculty.map(f => [
        f.id, f.staffCode, `"${f.gtuName || ''}"`, `"${f.title || ''}"`, `"${f.firstName || ''}"`, `"${f.middleName || ''}"`, `"${f.lastName || ''}"`,
        `"${f.personalEmail || ''}"`, f.instituteEmail, `"${f.contactNumber || ''}"`, `"${f.department}"`, `"${f.designation || ''}"`,
        f.jobType || '', f.staffCategory || 'Teaching', f.instType || '', f.dateOfBirth || '', f.joiningDate || '', f.gender || '', f.maritalStatus || '', f.status,
        `"${f.aadharNumber || ''}"`, `"${f.panCardNumber || ''}"`, `"${f.gpfNpsNumber || ''}"`, `"${f.placeOfBirth || ''}"`, `"${f.nationality || ''}"`, `"${f.knownAs || ''}"`,
        f.userId || '', f.instituteId || ''
      ].join(','))
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "faculty_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Faculty exported to faculty_export.csv" });
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,staffCode,gtuName,title,firstName,middleName,lastName,personalEmail,instituteEmail,contactNumber,department,designation,jobType,staffCategory,instType,dateOfBirth,joiningDate,gender,maritalStatus,status,aadharNumber,panCardNumber,gpfNpsNumber,placeOfBirth,nationality,knownAs,userId,instituteId
faculty_001,S001,"Dr. SHARMA ANIL KUMAR",Dr.,ANIL,KUMAR,SHARMA,anil.sharma@example.com,anil.sharma@gppalanpur.ac.in,9876543210,Computer Engineering,Professor,Regular,Teaching,DI,1975-05-15,2005-08-01,Male,Married,active,123456789012,ABCDE1234F,GPF123,Palanpur,Indian,"Anil S.",user_id_link,inst1
,S002,"Ms. PATEL PRIYA RAJESH",Ms.,PRIYA,RAJESH,PATEL,priya.patel@example.com,priya.patel@gppalanpur.ac.in,9876543211,Mechanical Engineering,Lecturer,Adhoc,Teaching,DI,1988-11-20,2015-06-10,Female,Single,active,,,,,,,user_id_link2,inst1
,C001,"Mr. Admin Clerk",Mr.,Admin,,Clerk,clerk.admin@example.com,clerk.admin@gppalanpur.ac.in,9876500000,Administration,Clerk,Regular,Clerical,DI,1990-01-01,2018-01-01,Male,Single,active,,,,,,,user_clerk_1,inst1
`;
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_faculty_import.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_faculty_import.csv downloaded." });
  };

  const handleImportGtuFaculty = async () => {
    if (!selectedGtuFile) {
      toast({ variant: "destructive", title: "GTU Import Error", description: "Please select a GTU CSV file to import." });
      return;
    }
    if (!formInstituteId && institutes.length > 0) {
        toast({ variant: "warning", title: "Institute Context", description: "No default institute selected for GTU import. Using first available or system default for new users." });
    }
    setIsSubmitting(true);
    try {
        const result = await facultyService.importGtuFaculty(selectedGtuFile, formInstituteId || undefined);
        await fetchInitialData();
        toast({ title: "GTU Import Successful", description: `${result.newCount} faculty added, ${result.updatedCount} faculty updated. ${result.skippedCount} rows skipped.` });

    } catch (error: unknown) {
        console.error("Error processing GTU CSV file:", error);
        toast({ variant: "destructive", title: "GTU Import Failed", description: error instanceof Error ? error.message : "Could not process the GTU CSV file." });
    } finally {
        setIsSubmitting(false);
        setSelectedGtuFile(null);
        const fileInput = document.getElementById('gtuCsvImportFaculty') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }
  };
  
  const handleDownloadGtuSampleCsv = () => {
    const sampleCsvContent = `staffcode,Name,InstType,Department,Designation,JobType,Mobile No,Email Address
S001,Mr. RAJGOR NARENDRAKUMAR NATVARLAL,DI,CIVIL ENGINEERING,Lecturer,Regular,9909253651,narendrarajgor@yahoo.com
S002,Dr. TANK MAHESHKUMAR FULCHANDBHAI,DI,GENERAL DEPARTMENT,Lecturer,Regular,9328951125,maheshftank@gmail.com
`;
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_gtu_faculty_import.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "GTU Sample CSV Downloaded", description: "sample_gtu_faculty_import.csv downloaded." });
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

  const filteredFaculty = useMemo(() => {
    let result = [...facultyList];

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      result = result.filter(f =>
        (f.gtuName && f.gtuName.toLowerCase().includes(termLower)) ||
        (f.firstName && f.firstName.toLowerCase().includes(termLower)) ||
        (f.lastName && f.lastName.toLowerCase().includes(termLower)) ||
        f.staffCode.toLowerCase().includes(termLower) ||
        f.instituteEmail.toLowerCase().includes(termLower) ||
        (f.personalEmail && f.personalEmail.toLowerCase().includes(termLower)) ||
        (f.department && f.department.toLowerCase().includes(termLower)) ||
        (f.designation && f.designation.toLowerCase().includes(termLower)) ||
        (f.staffCategory && f.staffCategory.toLowerCase().includes(termLower))
      );
    }
    if (filterDepartmentVal !== 'all') {
      result = result.filter(f => f.department === filterDepartmentVal);
    }
    if (filterDesignationVal !== 'all') {
      result = result.filter(f => f.designation === filterDesignationVal);
    }
    if (filterStatusVal !== 'all') {
      result = result.filter(f => f.status === filterStatusVal);
    }
    if (filterStaffCategoryVal !== 'all') { // Added filter for staff category
      result = result.filter(f => f.staffCategory === filterStaffCategoryVal);
    }


    if (sortField !== 'none') {
      result.sort((a, b) => {
        const valA = a[sortField as keyof Faculty] as string | number | Date | undefined; 
        const valB = b[sortField as keyof Faculty] as string | number | Date | undefined; 

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
  }, [facultyList, searchTerm, filterDepartmentVal, filterDesignationVal, filterStatusVal, filterStaffCategoryVal, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredFaculty.length / itemsPerPage);
  const paginatedFaculty = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFaculty.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFaculty, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterDepartmentVal, filterDesignationVal, filterStatusVal, filterStaffCategoryVal, itemsPerPage]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedFacultyIds(paginatedFaculty.map(f => f.id));
    } else {
      setSelectedFacultyIds([]);
    }
  };

  const handleSelectFaculty = (facultyId: string, checked: boolean) => {
    if (checked) {
      setSelectedFacultyIds(prev => [...prev, facultyId]);
    } else {
      setSelectedFacultyIds(prev => prev.filter(id => id !== facultyId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFacultyIds.length === 0) {
      toast({ variant: "destructive", title: "No Faculty Selected", description: "Please select faculty members to delete." });
      return;
    }
    setIsSubmitting(true);
    try {
        for (const id of selectedFacultyIds) {
            await facultyService.deleteFaculty(id);
        }
        await fetchInitialData();
        toast({ title: "Faculty Deleted", description: `${selectedFacultyIds.length} faculty member(s) have been successfully deleted.` });
        setSelectedFacultyIds([]);
    } catch (error) {
        toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete selected faculty." });
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedFaculty.length > 0 && paginatedFaculty.every(f => selectedFacultyIds.includes(f.id));
  const isSomeSelectedOnPage = paginatedFaculty.some(f => selectedFacultyIds.includes(f.id)) && !isAllSelectedOnPage;


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
              <UsersRound className="h-6 w-6" />
              Faculty & Staff Management
            </CardTitle>
            <CardDescription>
              Manage faculty and other staff records, academic details, and status.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto" disabled={institutes.length === 0}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{currentFaculty?.id ? "Edit Staff" : "Add New Staff"}</DialogTitle>
                  <DialogDescription>
                    {currentFaculty?.id ? "Modify the details of this staff member." : "Create a new staff record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[75vh] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyStaffCode">Staff Code *</Label>
                    <Input id="facultyStaffCode" value={formStaffCode} onChange={(e) => setFormStaffCode(e.target.value)} placeholder="e.g., S001" disabled={isSubmitting} required />
                  </div>
                   <div className="md:col-span-1">
                    <Label htmlFor="facultyInstitute">Institute *</Label>
                    <Select value={formInstituteId} onValueChange={setFormInstituteId} disabled={isSubmitting || institutes.length === 0} required>
                        <SelectTrigger id="facultyInstitute"><SelectValue placeholder="Select Institute"/></SelectTrigger>
                        <SelectContent>
                            {institutes.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name} ({inst.code})</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyStaffCategory">Staff Category *</Label>
                    <Select value={formStaffCategory} onValueChange={(v) => setFormStaffCategory(v as StaffCategory)} disabled={isSubmitting} required>
                      <SelectTrigger id="facultyStaffCategory"><SelectValue placeholder="Select Category"/></SelectTrigger>
                      <SelectContent>{STAFF_CATEGORY_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>


                  <div className="md:col-span-3">
                    <Label htmlFor="facultyGtuName">Full Name (GTU Format)</Label>
                    <Input 
                      id="facultyGtuName" 
                      value={formGtuName} 
                      onChange={(e) => {
                        setFormGtuName(e.target.value); 
                        const {title, firstName, middleName, lastName} = parseGtuFacultyName(e.target.value); 
                        if (!formTitle) setFormTitle(title||''); 
                        if (!formFirstName) setFormFirstName(firstName || ''); 
                        if (!formMiddleName) setFormMiddleName(middleName||''); 
                        if (!formLastName) setFormLastName(lastName||'');
                      }} 
                      placeholder="e.g., Mr. SURNAME NAME FATHERNAME" 
                      disabled={isSubmitting} 
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyTitle">Title</Label>
                     <Select value={formTitle || "none"} onValueChange={(value) => setFormTitle(value === "none" ? "" : value)} disabled={isSubmitting}>
                        <SelectTrigger id="facultyTitle"><SelectValue placeholder="Select Title" /></SelectTrigger>
                        <SelectContent >
                            {TITLE_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                             <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyFirstName">First Name *</Label>
                    <Input id="facultyFirstName" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} placeholder="e.g., John" disabled={isSubmitting} required/>
                  </div>
                   <div className="md:col-span-1">
                    <Label htmlFor="facultyMiddleName">Middle Name</Label>
                    <Input id="facultyMiddleName" value={formMiddleName} onChange={(e) => setFormMiddleName(e.target.value)} placeholder="e.g., Robert" disabled={isSubmitting} />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyLastName">Last Name *</Label>
                    <Input id="facultyLastName" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} placeholder="e.g., Doe" disabled={isSubmitting} required/>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="facultyPersonalEmail">Personal Email</Label>
                    <Input id="facultyPersonalEmail" type="email" value={formPersonalEmail} onChange={(e) => setFormPersonalEmail(e.target.value)} placeholder="e.g., john.doe@example.com" disabled={isSubmitting} />
                  </div>
                   <div className="md:col-span-1">
                    <Label htmlFor="facultyContact">Contact Number</Label>
                    <Input id="facultyContact" type="tel" value={formContact} onChange={(e) => setFormContact(e.target.value)} placeholder="e.g., 9876543210" disabled={isSubmitting} />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyGender">Gender</Label>
                     <Select value={formGender || "none"} onValueChange={(value) => setFormGender(value === "none" ? undefined : value as Gender)} disabled={isSubmitting}>
                        <SelectTrigger id="facultyGender"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                        <SelectContent >
                            {GENDER_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                             <SelectItem value="none">Prefer not to say</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyDob">Date of Birth</Label>
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
                            <Calendar mode="single" selected={formDob} onSelect={setFormDob} initialFocus captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear() - 18} />
                        </PopoverContent>
                    </Popover>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyMaritalStatus">Marital Status</Label>
                     <Select value={formMaritalStatus || "none"} onValueChange={(value) => setFormMaritalStatus(value === "none" ? undefined : value)} disabled={isSubmitting}>
                        <SelectTrigger id="facultyMaritalStatus"><SelectValue placeholder="Select Status" /></SelectTrigger>
                        <SelectContent >
                            {MARITAL_STATUS_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            <SelectItem value="none">Prefer not to say</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyDepartment">Department *</Label>
                    <Select value={formDepartment} onValueChange={(value) => setFormDepartment(value)} disabled={isSubmitting} required>
                        <SelectTrigger id="facultyDepartment"><SelectValue placeholder="Select Department"/></SelectTrigger>
                        <SelectContent>
                            {DEPARTMENT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyDesignation">Designation</Label>
                    <Select value={formDesignation} onValueChange={(value) => setFormDesignation(value)} disabled={isSubmitting}>
                        <SelectTrigger id="facultyDesignation"><SelectValue placeholder="Select Designation"/></SelectTrigger>
                        <SelectContent>
                            {DESIGNATION_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyJobType">Job Type</Label>
                    <Select value={formJobType} onValueChange={(value) => setFormJobType(value as JobType)} disabled={isSubmitting}>
                        <SelectTrigger id="facultyJobType"><SelectValue placeholder="Select Job Type"/></SelectTrigger>
                        <SelectContent>
                            {JOB_TYPE_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyJoiningDate">Joining Date</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !formJoiningDate && "text-muted-foreground")}
                                disabled={isSubmitting}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formJoiningDate ? format(formJoiningDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={formJoiningDate} onSelect={setFormJoiningDate} initialFocus captionLayout="dropdown-buttons" fromYear={1970} toYear={new Date().getFullYear()} />
                        </PopoverContent>
                    </Popover>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyStatus">Status *</Label>
                     <Select value={formStatus} onValueChange={(value) => setFormStatus(value as FacultyStatus)} disabled={isSubmitting} required>
                        <SelectTrigger id="facultyStatus"><SelectValue placeholder="Select Status"/></SelectTrigger>
                        <SelectContent>
                            {FACULTY_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyAadhar">Aadhar Number</Label>
                    <Input id="facultyAadhar" value={formAadhar} onChange={(e) => setFormAadhar(e.target.value)} placeholder="e.g., 123456789012" disabled={isSubmitting} />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyPan">PAN Card Number</Label>
                    <Input id="facultyPan" value={formPan} onChange={(e) => setFormPan(e.target.value)} placeholder="e.g., ABCDE1234F" disabled={isSubmitting} />
                  </div>
                  <DialogFooter className="md:col-span-3 mt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {currentFaculty?.id ? "Save Changes" : "Create Staff"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportFaculty} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Staff (Standard Format)</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportFaculty" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportFaculty} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                Import Standard
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample (Standard)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Use for general staff data import/update. Requires staffCode, firstName, lastName, department, status.
                </p>
            </div>
          </div>

          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-accent"/>Import GTU Faculty Data</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="gtuCsvImportFaculty" accept=".csv" onChange={handleGtuFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportGtuFaculty} disabled={isSubmitting || !selectedGtuFile || institutes.length === 0} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                {isSubmitting && selectedGtuFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                Import GTU Data
              </Button>
            </div>
             {institutes.length === 0 && <p className="text-xs text-destructive">GTU Import disabled: No institutes found. Please add institutes first.</p>}
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadGtuSampleCsv} variant="link" size="sm" className="px-0 text-accent">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample (GTU)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Import faculty data using the official GTU CSV format. Select default institute for new users above.
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="searchFaculty">Search Staff</Label>
              <div className="relative">
                 <Input
                    id="searchFaculty"
                    placeholder="Name, email, staff code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-8"
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterFacultyDepartment">Filter by Department</Label>
              <Select value={filterDepartmentVal} onValueChange={(value) => setFilterDepartmentVal(value)}>
                <SelectTrigger id="filterFacultyDepartment"><SelectValue placeholder="All Departments"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStaffCategory">Filter by Staff Category</Label>
              <Select value={filterStaffCategoryVal} onValueChange={(value) => setFilterStaffCategoryVal(value as StaffCategory | 'all')}>
                <SelectTrigger id="filterStaffCategory"><SelectValue placeholder="All Categories"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {STAFF_CATEGORY_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterFacultyDesignation">Filter by Designation</Label>
              <Select value={filterDesignationVal} onValueChange={(value) => setFilterDesignationVal(value)}>
                <SelectTrigger id="filterFacultyDesignation"><SelectValue placeholder="All Designations"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Designations</SelectItem>
                  {DESIGNATION_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterFacultyStatus">Filter by Status</Label>
              <Select value={filterStatusVal} onValueChange={(value) => setFilterStatusVal(value as FacultyStatus | 'all')}>
                <SelectTrigger id="filterFacultyStatus"><SelectValue placeholder="All Statuses"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {FACULTY_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedFacultyIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedFacultyIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedFacultyIds.length} staff member(s) selected.
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
                        aria-label="Select all faculty on this page"
                    />
                </TableHead>
                <SortableTableHeader field="gtuName" label="Name (GTU)" />
                <SortableTableHeader field="staffCode" label="Staff Code" />
                <SortableTableHeader field="department" label="Department" />
                <SortableTableHeader field="staffCategory" label="Category" /> {/* Added Category Header */}
                <SortableTableHeader field="designation" label="Designation" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFaculty.map((faculty) => (
                <TableRow key={faculty.id} data-state={selectedFacultyIds.includes(faculty.id) ? "selected" : undefined}>
                   <TableCell>
                      <Checkbox
                        checked={selectedFacultyIds.includes(faculty.id)}
                        onCheckedChange={(checked) => handleSelectFaculty(faculty.id, !!checked)}
                        aria-labelledby={`faculty-name-${faculty.id}`}
                       />
                  </TableCell>
                  <TableCell id={`faculty-name-${faculty.id}`} className="font-medium">
                    <div className="flex flex-col">
                        <span className="font-semibold">
                          {[faculty.title, faculty.firstName, faculty.middleName, faculty.lastName].filter(Boolean).join(' ') || faculty.gtuName || faculty.staffCode}
                        </span>
                        <span className="text-xs text-muted-foreground">{faculty.instituteEmail}</span>
                        {faculty.personalEmail && <span className="text-xs text-muted-foreground">P: {faculty.personalEmail}</span>}
                    </div>
                  </TableCell>
                  <TableCell>{faculty.staffCode}</TableCell>
                  <TableCell>{faculty.department}</TableCell>
                  <TableCell>{faculty.staffCategory || 'Teaching'}</TableCell> {/* Display Staff Category */}
                  <TableCell>{faculty.designation}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        faculty.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : faculty.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : faculty.status === 'retired' || faculty.status === 'resigned' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300' 
                    }`}>
                      {FACULTY_STATUS_OPTIONS.find(s => s.value === faculty.status)?.label || faculty.status}
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
                                <p><strong>Job Type:</strong> {faculty.jobType || 'N/A'}</p>
                                <p><strong>Gender:</strong> {faculty.gender || 'N/A'}</p>
                                <p><strong>DOB:</strong> {faculty.dateOfBirth && isValid(parseISO(faculty.dateOfBirth)) ? format(parseISO(faculty.dateOfBirth), 'dd MMM yyyy') : 'N/A'}</p>
                                <p><strong>Joining:</strong> {faculty.joiningDate && isValid(parseISO(faculty.joiningDate)) ? format(parseISO(faculty.joiningDate), 'dd MMM yyyy') : 'N/A'}</p>
                                <p><strong>Marital Status:</strong> {faculty.maritalStatus || 'N/A'}</p>
                                <p><strong>Contact:</strong> {faculty.contactNumber || 'N/A'}</p>
                                <p><strong>Aadhar:</strong> {faculty.aadharNumber ? 'Yes' : 'No'}</p>
                                <p><strong>PAN:</strong> {faculty.panCardNumber ? 'Yes' : 'No'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(faculty)} disabled={isSubmitting}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Staff</span>
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(faculty.id)}
                        disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Staff</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedFaculty.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8"> {/* Updated colSpan */}
                        No staff members found. Try adjusting your search or filters, or add a new staff member.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {filteredFaculty.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredFaculty.length) : 0} to {Math.min(currentPage * itemsPerPage, filteredFaculty.length)} of {filteredFaculty.length} staff members.
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

