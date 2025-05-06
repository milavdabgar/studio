
"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, UsersRound, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, CalendarDays as CalendarIcon, Info, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid, parse as parseDate } from 'date-fns';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';

type UserRole = 'admin' | 'student' | 'faculty' | 'hod' | 'jury' | 'unknown';
interface SystemUser {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  status: 'active' | 'inactive';
  department?: string;
}

type FacultyStatus = 'active' | 'inactive' | 'retired' | 'resigned' | 'on_leave';
type JobType = 'Regular' | 'Adhoc' | 'Contractual' | 'Visiting' | 'Other';
type Gender = 'Male' | 'Female' | 'Other';

interface Faculty {
  id: string;
  staffCode: string; 
  gtuName?: string; 
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  personalEmail?: string; 
  instituteEmail: string; 
  contactNumber?: string; 
  department: string;
  designation?: string;
  jobType?: JobType;
  instType?: string; // Institute Type from GTU e.g., DI
  dateOfBirth?: string; // YYYY-MM-DD
  gender?: Gender;
  maritalStatus?: string;
  joiningDate?: string; // YYYY-MM-DD
  status: FacultyStatus;
  aadharNumber?: string;
  panCardNumber?: string;
  gpfNpsNumber?: string;
  placeOfBirth?: string;
  nationality?: string;
  knownAs?: string;
  // Add other fields as needed from Karmyogi if relevant
}

const DEPARTMENT_OPTIONS = [
  "Computer Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Electronics & Communication Engineering",
  "Applied Mechanics",
  "General Department", // For subjects like Maths, Physics, English
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


const LOCAL_STORAGE_KEY_FACULTY = 'managedFacultyPMP';
const LOCAL_STORAGE_KEY_USERS = 'managedUsers';

type SortField = keyof Faculty | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const generateClientId = (): string => `faculty_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const parseGtuFacultyName = (gtuNameInput: string | undefined): { title?: string, firstName?: string, middleName?: string, lastName?: string } => {
    if (!gtuNameInput) return {};
    let gtuName = gtuNameInput.trim();
    let title: string | undefined;
    // Prioritize longer titles first to avoid partial matches like "Prof." matching "Pr." if that were a title
    const titles = ["Dr. Prof.", "Dr.", "Prof.", "Mr.", "Ms.", "Mrs."];
    
    for (const t of titles) {
      const tLower = t.toLowerCase();
      // Check if gtuName starts with title followed by a space or just the title if it ends with a period
      if (gtuName.toLowerCase().startsWith(tLower + " ") || (t.endsWith(".") && gtuName.toLowerCase().startsWith(tLower))) {
        title = gtuName.substring(0, t.length); // Capture the exact casing of the title
        gtuName = gtuName.substring(t.length).trim();
        if (gtuName.startsWith(".")) gtuName = gtuName.substring(1).trim(); // Remove period if present after title
        break; 
      }
    }
    
    const parts = gtuName.split(/\s+/).filter(p => p);
    if (parts.length === 0) return { title };
    if (parts.length === 1) return { title, firstName: parts[0], lastName: 'SURNAME' }; 
    if (parts.length === 2) return { title, lastName: parts[0], firstName: parts[1] }; 
    return { title, lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') }; 
};


const addUserToLocalStorage = (newUser: SystemUser) => {
  if (typeof window === 'undefined') return;
  try {
    const storedUsers = localStorage.getItem(LOCAL_STORAGE_KEY_USERS);
    let users: SystemUser[] = storedUsers ? JSON.parse(storedUsers) : [];
    
    // Check if a user with the same email already exists
    const existingUserIndex = users.findIndex(u => u.email === newUser.email);
    if (existingUserIndex !== -1) {
      toast({
        variant: "warning",
        title: "User Exists",
        description: `A system user with email ${newUser.email} already exists. Skipped adding user.`,
 });
      return; // User already exists
    }
    
    users.push(newUser);
    localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (error) {
    console.error("Failed to add user to localStorage", error);
  }
};

const generateInstituteEmail = (firstName?: string, lastName?: string, staffCode?: string): string => {
  const fn = (firstName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  const ln = (lastName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  if (fn && ln) {
    return `${fn}.${ln}@gppalanpur.ac.in`;
  }
  if (staffCode) {
    return `${staffCode.toLowerCase()}@gppalanpur.ac.in`;
  }
  return `faculty_${Date.now()}@gppalanpur.ac.in`; // Fallback, should ideally not happen
};


export default function FacultyManagementPage() {
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
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
  const [formContact, setFormContact] = useState('');
  const [formDob, setFormDob] = useState<Date | undefined>(undefined);
  const [formJoiningDate, setFormJoiningDate] = useState<Date | undefined>(undefined);
  const [formGender, setFormGender] = useState<Gender | undefined>(undefined);
  const [formMaritalStatus, setFormMaritalStatus] = useState<string | undefined>(undefined);
  const [formStatus, setFormStatus] = useState<FacultyStatus>('active');
  const [formAadhar, setFormAadhar] = useState('');
  const [formPan, setFormPan] = useState('');


  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGtuFile, setSelectedGtuFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterDesignation, setFilterDesignation] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<FacultyStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('gtuName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>([]);


  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);


  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoading(true);
      try {
        const storedFaculty = localStorage.getItem(LOCAL_STORAGE_KEY_FACULTY);
        if (storedFaculty) {
          setFacultyList(JSON.parse(storedFaculty));
        }
      } catch (error) {
        console.error("Failed to load faculty from localStorage", error);
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY_FACULTY, JSON.stringify(facultyList));
        } catch (error) {
            console.error("Failed to save faculty to localStorage", error);
             setTimeout(() => {
                toast({
                    variant: "destructive",
                    title: "Storage Error",
                    description: "Could not save faculty data locally. Changes might be lost.",
                });
            }, 0);
        }
    }
  }, [facultyList, isLoading, toast]);


  const resetForm = () => {
    setFormStaffCode('');
    setFormGtuName('');
    setFormTitle('');
    setFormFirstName('');
    setFormMiddleName('');
    setFormLastName('');
    setFormPersonalEmail('');
    setFormDepartment(DEPARTMENT_OPTIONS[0]); 
    setFormDesignation(''); 
    if (document.getElementById('facultyDepartment')) {
        document.getElementById('facultyDepartment')?.setAttribute('value', DEPARTMENT_OPTIONS[0]);
    }

    setFormJobType('Regular');
    setFormContact('');
    setFormDob(undefined);
    setFormJoiningDate(undefined);
    setFormGender(undefined);
    setFormMaritalStatus(undefined);
    setFormStatus('active');
    setFormAadhar('');
    setFormPan('');
    setCurrentFaculty(null);
  };

  const handleEdit = (faculty: Faculty) => {
    setCurrentFaculty(faculty);
    setFormStaffCode(faculty.staffCode);
    
    // When editing, prefer the individual name parts if they exist, otherwise parse gtuName
    if (faculty.firstName || faculty.lastName) {
        setFormGtuName(faculty.gtuName || ''); // Keep gtuName if it was there
        setFormTitle(faculty.title || '');
        setFormFirstName(faculty.firstName || '');
        setFormMiddleName(faculty.middleName || '');
        setFormLastName(faculty.lastName || '');
    } else {
        const { title, firstName, middleName, lastName } = parseGtuFacultyName(faculty.gtuName);
        setFormGtuName(faculty.gtuName || ''); // Keep original GTU name
        setFormTitle(title || faculty.title || '');
        setFormFirstName(firstName || '');
        setFormMiddleName(middleName || '');
        setFormLastName(lastName || '');
    }

    setFormPersonalEmail(faculty.personalEmail || ''); 
    setFormDepartment(faculty.department || DEPARTMENT_OPTIONS[0]); 
    setFormDesignation(faculty.designation || '');
    setFormJobType(faculty.jobType ?? 'Regular'); 
    setFormContact(faculty.contactNumber ?? '');
    setFormDob(faculty.dateOfBirth && isValid(parseISO(faculty.dateOfBirth)) ? parseISO(faculty.dateOfBirth) : undefined);
    setFormJoiningDate(faculty.joiningDate && isValid(parseISO(faculty.joiningDate)) ? parseISO(faculty.joiningDate) : undefined);
    setFormGender(faculty.gender ?? undefined);
    setFormMaritalStatus(faculty.maritalStatus ?? undefined);
    setFormStatus(faculty.status);
    setFormAadhar(faculty.aadharNumber || '');
    setFormPan(faculty.panCardNumber || '');
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = (facultyId: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setFacultyList(prevList => prevList.filter(f => f.id !== facultyId));
      setSelectedFacultyIds(prev => prev.filter(id => id !== facultyId));
      toast({ title: "Faculty Deleted", description: "The faculty record has been successfully deleted." });
      setIsSubmitting(false);
    }, 500);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formStaffCode.trim() || (!formFirstName.trim() || !formLastName.trim())) {
      toast({ variant: "destructive", title: "Validation Error", description: "Staff Code, First Name and Last Name are required." });
      return;
    }
    if (formPersonalEmail.trim() && !/\S+@\S+\.\S+/.test(formPersonalEmail)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid personal email address or leave it empty." });
        return;
    }
     if (!currentFaculty?.id && facultyList.some(f => f.staffCode === formStaffCode.trim())) {
        toast({ variant: "destructive", title: "Validation Error", description: `Staff code ${formStaffCode.trim()} already exists.` });
        return;
    }
    if (currentFaculty?.id && formStaffCode.trim() !== currentFaculty.staffCode && facultyList.some(f => f.id !== currentFaculty.id && f.staffCode === formStaffCode.trim())) {
        toast({ variant: "destructive", title: "Validation Error", description: `Staff code ${formStaffCode.trim()} already exists for another faculty member.` });
        return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const facultyFirstName = formFirstName.trim();
      const facultyLastName = formLastName.trim();
      
      const facultyData: Omit<Faculty, 'id' | 'instituteEmail'> & { instituteEmail?: string; } = {
        staffCode: formStaffCode.trim(),
        gtuName: formGtuName.trim() || [formTitle.trim(), facultyFirstName, formMiddleName.trim(), facultyLastName].filter(Boolean).join(' ') || undefined,
        title: formTitle.trim() || undefined,
        firstName: facultyFirstName || undefined,
        middleName: formMiddleName.trim() || undefined,
        lastName: facultyLastName || undefined,
        personalEmail: formPersonalEmail.trim() || undefined, 
        department: formDepartment,
        designation: formDesignation.trim() || undefined,
        jobType: formJobType,
        contactNumber: formContact.trim() || undefined,
        dateOfBirth: formDob ? format(formDob, "yyyy-MM-dd") : undefined,
        joiningDate: formJoiningDate ? format(formJoiningDate, "yyyy-MM-dd") : undefined,
        gender: formGender,
        maritalStatus: formMaritalStatus,
        status: formStatus,
        aadharNumber: formAadhar.trim() || undefined,
        panCardNumber: formPan.trim() || undefined,
      };
      
      facultyData.instituteEmail = generateInstituteEmail(facultyData.firstName, facultyData.lastName, facultyData.staffCode);

      const systemUserName = [facultyData.title, facultyData.firstName, facultyData.middleName, facultyData.lastName].filter(Boolean).join(' ') || facultyData.gtuName || facultyData.staffCode;

      if (currentFaculty && currentFaculty.id) {
        setFacultyList(prevList => prevList.map(f => f.id === currentFaculty.id ? { ...f, ...facultyData, instituteEmail: facultyData.instituteEmail! } : f));
        toast({ title: "Faculty Updated", description: "The faculty record has been successfully updated." });
      } else {
        const newFaculty: Faculty = {
          id: generateClientId(),
          ...facultyData,
          instituteEmail: facultyData.instituteEmail!,
        };
        setFacultyList(prevList => [...prevList, newFaculty]);
        
        const newUserForSystem: SystemUser = {
          id: `user_fac_${newFaculty.id}`, 
          name: systemUserName,
          email: newFaculty.instituteEmail,
          roles: ['faculty'], 
          status: 'active',
          department: newFaculty.department,
        };
        addUserToLocalStorage(newUserForSystem);

        toast({ title: "Faculty Added", description: `Faculty ${systemUserName} added. Institute Email: ${newFaculty.instituteEmail}, Default Password: ${newFaculty.staffCode}` });
      }
      setIsSubmitting(false);
      setIsDialogOpen(false);
      resetForm();
    }, 1000);
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
    if (event.target.files && event.target.files[0]) {
      setSelectedGtuFile(event.target.files[0]);
    } else {
      setSelectedGtuFile(null);
    }
     const inputElement = event.target as HTMLInputElement;
     if (!event.target.files || event.target.files.length === 0) {
       inputElement.value = '';
     }
  };

  const handleImportFaculty = () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      let newFacultyCount = 0;
      let updatedFacultyCount = 0;
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '').map(line => line.endsWith(',') ? line + ' ' : line); 
        if (lines.length <= 1) throw new Error("CSV file is empty or has only a header.");

        const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
        const expectedHeaders = ['id', 'staffcode', 'gtuname', 'title', 'firstname', 'middlename', 'lastname', 'personalemail', 'department', 'designation', 'jobtype', 'contactnumber', 'dateofbirth', 'joiningdate', 'gender', 'maritalstatus', 'status', 'aadharnumber', 'pancardnumber'];
        const requiredHeaders = ['staffcode', 'firstname', 'lastname', 'department', 'status'];

        if (!requiredHeaders.every(rh => header.includes(rh))) {
            throw new Error(`CSV header is missing required columns. Expected at least: ${requiredHeaders.join(', ')}. Found: ${header.join(', ')}`);
        }

        const hMap = Object.fromEntries(expectedHeaders.map(eh => [eh, header.indexOf(eh)]));
        let facultyToUpdate = [...facultyList];

        for (let i = 1; i < lines.length; i++) {
          const data = lines[i].split(',').map(d => d.trim().replace(/^"|"$/g, ''));

          const staffCode = data[hMap['staffcode']];
          const firstNameFromCsv = data[hMap['firstname']];
          const lastNameFromCsv = data[hMap['lastname']];

          if (!staffCode || !firstNameFromCsv || !lastNameFromCsv) {
            console.warn(`Skipping row ${i+1}: Staff code, First Name or Last Name is missing.`);
            continue;
          }
          const department = data[hMap['department']];
          const status = data[hMap['status']] as FacultyStatus;

          if (!department || !FACULTY_STATUS_OPTIONS.find(s => s.value === status)) {
            console.warn(`Skipping row ${i+1} for ${staffCode}: Missing or invalid department or status.`);
            continue;
          }

          const gtuNameFromCsv = data[hMap['gtuname']];
          const titleFromCsv = data[hMap['title']];
          const middleNameFromCsv = data[hMap['middlename']];
          
          // If individual name parts are not directly in CSV but gtuName is, parse it
          const parsedFromGtuName = gtuNameFromCsv ? parseGtuFacultyName(gtuNameFromCsv) : {};

          const facultyDataPartial: Omit<Faculty, 'id' | 'instituteEmail'| 'staffCode' | 'firstName' | 'lastName' | 'department' | 'status'> = {
            gtuName: gtuNameFromCsv || [titleFromCsv || parsedFromGtuName.title, firstNameFromCsv, middleNameFromCsv || parsedFromGtuName.middleName, lastNameFromCsv].filter(Boolean).join(' ') || undefined,
            title: titleFromCsv || parsedFromGtuName.title || undefined,
            middleName: middleNameFromCsv || parsedFromGtuName.middleName || undefined,
            personalEmail: data[hMap['personalemail']] || undefined,
            designation: data[hMap['designation']] || undefined,
            jobType: (data[hMap['jobtype']] && JOB_TYPE_OPTIONS.includes(data[hMap['jobtype']] as JobType)) ? data[hMap['jobtype']] as JobType : 'Regular',
            contactNumber: data[hMap['contactnumber']] || undefined,
            dateOfBirth: data[hMap['dateofbirth']] || undefined, 
            joiningDate: data[hMap['joiningdate']] || undefined, 
            gender: data[hMap['gender']] as Gender || undefined,
            maritalStatus: data[hMap['maritalstatus']] || undefined,
            aadharNumber: data[hMap['aadharnumber']] || undefined,
            panCardNumber: data[hMap['pancardnumber']] || undefined,
          };
          
          const facultyData: Omit<Faculty, 'id'> = {
            staffCode,
            firstName: firstNameFromCsv,
            lastName: lastNameFromCsv,
            department,
            status,
            instituteEmail: generateInstituteEmail(firstNameFromCsv, lastNameFromCsv, staffCode),
            ...facultyDataPartial
          };

          const idFromCsv = data[hMap['id']];
          let existingFacultyIndex = -1;

          if (idFromCsv) {
            existingFacultyIndex = facultyToUpdate.findIndex(f => f.id === idFromCsv);
             if (existingFacultyIndex !== -1 && facultyToUpdate[existingFacultyIndex].staffCode !== staffCode) {
              const conflictIndex = facultyToUpdate.findIndex(f => f.staffCode === staffCode && f.id !== idFromCsv);
              if (conflictIndex !== -1) {
                console.warn(`Skipping update for ID ${idFromCsv}: Staff Code ${staffCode} from CSV conflicts with an existing different faculty (ID: ${facultyToUpdate[conflictIndex].id}). Faculty with this staff code will be updated if found by staff code directly.`);
                existingFacultyIndex = -1; 
              }
            }
          }
           if(existingFacultyIndex === -1){
            existingFacultyIndex = facultyToUpdate.findIndex(f => f.staffCode === staffCode);
          }

          if (existingFacultyIndex !== -1) {
            facultyToUpdate[existingFacultyIndex] = { ...facultyToUpdate[existingFacultyIndex], ...facultyData };
            updatedFacultyCount++;
          } else {
            const systemUserName = [facultyData.title, facultyData.firstName, facultyData.middleName, facultyData.lastName].filter(Boolean).join(' ') || facultyData.gtuName || facultyData.staffCode;
            const newFaculty = { id: generateClientId(), ...facultyData };
            facultyToUpdate.push(newFaculty);
            newFacultyCount++;
            
            addUserToLocalStorage({
              id: `user_fac_${newFaculty.id}`,
              name: systemUserName,
              email: newFaculty.instituteEmail, 
              roles: ['faculty'], 
              status: 'active',
              department: newFaculty.department,
            });
          }
        }
        setFacultyList(facultyToUpdate);
        toast({ title: "Standard Import Successful", description: `${newFacultyCount} faculty added, ${updatedFacultyCount} faculty updated.` });

      } catch (error: any) {
        console.error("Error processing standard CSV file:", error);
        toast({ variant: "destructive", title: "Standard Import Failed", description: error.message || "Could not process the CSV file." });
      } finally {
        setIsSubmitting(false);
        setSelectedFile(null);
        const fileInput = document.getElementById('csvImportFaculty') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    };
    reader.readAsText(selectedFile);
  };
  
  const handleExportFaculty = () => {
    if (filteredFaculty.length === 0) {
      toast({ title: "Export Canceled", description: "No faculty to export (check filters)." });
      return;
    }
    const header = ['id', 'staffCode', 'gtuName', 'title', 'firstName', 'middleName', 'lastName', 'personalEmail', 'instituteEmail', 'contactNumber', 'department', 'designation', 'jobType', 'dateOfBirth', 'joiningDate', 'gender', 'maritalStatus', 'status', 'aadharNumber', 'panCardNumber'];
    const csvRows = [
      header.join(','),
      ...filteredFaculty.map(f => [
        f.id, f.staffCode, `"${f.gtuName || ''}"`, `"${f.title || ''}"`, `"${f.firstName || ''}"`, `"${f.middleName || ''}"`, `"${f.lastName || ''}"`,
        `"${f.personalEmail || ''}"`, f.instituteEmail, `"${f.contactNumber || ''}"`, `"${f.department}"`, `"${f.designation || ''}"`,
        f.jobType || '', f.dateOfBirth || '', f.joiningDate || '', f.gender || '', f.maritalStatus || '', f.status,
        `"${f.aadharNumber || ''}"`, `"${f.panCardNumber || ''}"`
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
    const sampleCsvContent = `id,staffCode,gtuName,title,firstName,middleName,lastName,personalEmail,instituteEmail,contactNumber,department,designation,jobType,dateOfBirth,joiningDate,gender,maritalStatus,status,aadharNumber,panCardNumber
faculty_001,S001,"Dr. SHARMA ANIL KUMAR",Dr.,ANIL,KUMAR,SHARMA,anil.sharma@example.com,anil.sharma@gppalanpur.ac.in,9876543210,Computer Engineering,Professor,Regular,1975-05-15,2005-08-01,Male,Married,active,123456789012,ABCDE1234F
,S002,"Ms. PATEL PRIYA RAJESH",Ms.,PRIYA,RAJESH,PATEL,priya.patel@example.com,priya.patel@gppalanpur.ac.in,9876543211,Mechanical Engineering,Lecturer,Adhoc,1988-11-20,2015-06-10,Female,Single,active,,
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


  const handleImportGtuFaculty = () => {
    if (!selectedGtuFile) {
      toast({ variant: "destructive", title: "GTU Import Error", description: "Please select a GTU CSV file to import." });
      return;
    }
    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      let newFacultyCount = 0;
      let updatedFacultyCount = 0;
      let skippedCount = 0;
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '').map(line => line.endsWith(',') ? line + ' ' : line); 
        if (lines.length <= 1) throw new Error("GTU CSV file is empty or has only a header.");

        const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '')); 
        const gtuExpectedHeaders = ['staffcode','name','insttype','department','designation','jobtype','mobileno','emailaddress'];
        const requiredGtuHeaders = ['staffcode', 'name', 'department', 'designation'];

        if (!requiredGtuHeaders.every(rh => header.includes(rh))) {
            throw new Error(`GTU CSV header is missing required columns. Expected at least: ${requiredGtuHeaders.join(', ')}. Found: ${header.join(', ')}`);
        }
        const hMap = Object.fromEntries(gtuExpectedHeaders.map(eh => [eh, header.indexOf(eh)]));
        let facultyToUpdate = [...facultyList];

        for (let i = 1; i < lines.length; i++) { 
          const data = lines[i].split(',').map(d => d.trim().replace(/^"|"$/g, ''));

          const staffCode = data[hMap['staffcode']];
          const gtuNameFromCsv = data[hMap['name']];
          const department = data[hMap['department']];
          const designation = data[hMap['designation']];

          if (!staffCode || !gtuNameFromCsv || !department || !designation) {
            console.warn(`Skipping GTU row ${i+1}: Staff Code, Name, Department, or Designation is missing.`);
            skippedCount++;
            continue;
          }
          const parsedNames = parseGtuFacultyName(gtuNameFromCsv);
          
          const personalEmail = data[hMap['emailaddress']];
          const contactNumber = data[hMap['mobileno']];
          const jobType = (data[hMap['jobtype']]?.trim() && JOB_TYPE_OPTIONS.includes(data[hMap['jobtype']].trim() as JobType)) ? data[hMap['jobtype']].trim() as JobType : 'Other';
          const instType = data[hMap['insttype']];

          const facultyData: Omit<Faculty, 'id'> = {
            staffCode,
            gtuName: gtuNameFromCsv, 
            title: parsedNames.title, 
            firstName: parsedNames.firstName ?? undefined, 
            middleName: parsedNames.middleName ?? undefined, 
            lastName: parsedNames.lastName ?? undefined, 
            personalEmail: personalEmail?.trim() || undefined,
            instituteEmail: generateInstituteEmail(parsedNames.firstName, parsedNames.lastName, staffCode),
            contactNumber: contactNumber || undefined,
            department,
            designation,
            jobType: JOB_TYPE_OPTIONS.includes(jobType) ? jobType : 'Other',
            instType: instType || undefined,
            status: 'active', 
          };

          const existingFacultyIndex = facultyToUpdate.findIndex(f => f.staffCode === staffCode);
          if (existingFacultyIndex !== -1) {
            facultyToUpdate[existingFacultyIndex] = { ...facultyToUpdate[existingFacultyIndex], ...facultyData };
            updatedFacultyCount++;
          } else {
            const newFaculty = { id: generateClientId(), ...facultyData };
            facultyToUpdate.push(newFaculty);
            newFacultyCount++;

            const systemUserName = [newFaculty.title, newFaculty.firstName, newFaculty.middleName, newFaculty.lastName].filter(Boolean).join(' ') || newFaculty.gtuName || newFaculty.staffCode;

            addUserToLocalStorage({
              id: `user_fac_${newFaculty.id}`,
              name: systemUserName,
              email: newFaculty.instituteEmail,
              roles: ['faculty'],
              status: 'active',
              department: newFaculty.department,
            });
          }
        }
        setFacultyList(facultyToUpdate);

        toast({ title: "GTU Import Successful", description: `${newFacultyCount} faculty added, ${updatedFacultyCount} faculty updated. ${skippedCount} rows skipped.` });

      } catch (error: any) {
        console.error("Error processing GTU CSV file:", error);
        toast({ variant: "destructive", title: "GTU Import Failed", description: error.message || "Could not process the GTU CSV file." });
      } finally {
        setIsSubmitting(false);
        setSelectedGtuFile(null);
        const fileInput = document.getElementById('gtuCsvImportFaculty') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    };
    reader.readAsText(selectedGtuFile);
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
        (f.designation && f.designation.toLowerCase().includes(termLower))
      );
    }
    if (filterDepartment !== 'all') {
      result = result.filter(f => f.department === filterDepartment);
    }
    if (filterDesignation !== 'all') {
      result = result.filter(f => f.designation === filterDesignation);
    }
    if (filterStatus !== 'all') {
      result = result.filter(f => f.status === filterStatus);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: any = a[sortField as keyof Faculty]; 
        let valB: any = b[sortField as keyof Faculty]; 

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
  }, [facultyList, searchTerm, filterDepartment, filterDesignation, filterStatus, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredFaculty.length / itemsPerPage);
  const paginatedFaculty = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFaculty.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFaculty, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterDepartment, filterDesignation, filterStatus, itemsPerPage]);

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

  const handleDeleteSelected = () => {
    if (selectedFacultyIds.length === 0) {
      toast({ variant: "destructive", title: "No Faculty Selected", description: "Please select faculty members to delete." });
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setFacultyList(prevList => prevList.filter(f => !selectedFacultyIds.includes(f.id)));
      setSelectedFacultyIds([]);
      toast({ title: "Faculty Deleted", description: `${selectedFacultyIds.length} faculty member(s) have been successfully deleted.` });
      setIsSubmitting(false);
    }, 500);
  };
  
  const isAllSelectedOnPage = paginatedFaculty.length > 0 && paginatedFaculty.every(f => selectedFacultyIds.includes(f.id));
  const isSomeSelectedOnPage = paginatedFaculty.some(f => selectedFacultyIds.includes(f.id)) && !isAllSelectedOnPage;


  if (isLoading && !facultyList.length) { 
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
              Faculty Management
            </CardTitle>
            <CardDescription>
              Manage faculty records, academic details, and status.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Faculty
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{currentFaculty?.id ? "Edit Faculty" : "Add New Faculty"}</DialogTitle>
                  <DialogDescription>
                    {currentFaculty?.id ? "Modify the details of this faculty member." : "Create a new faculty record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[75vh] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                  {/* Personal Information */}
                  <div className="md:col-span-1">
                    <Label htmlFor="facultyStaffCode">Staff Code *</Label>
                    <Input id="facultyStaffCode" value={formStaffCode} onChange={(e) => setFormStaffCode(e.target.value)} placeholder="e.g., S001" disabled={isSubmitting} required />
                  </div>
                  <div className="md:col-span-2">
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
                     <Select value={formTitle} onValueChange={(value) => setFormTitle(value)} disabled={isSubmitting}>
                        <SelectTrigger id="facultyTitle"><SelectValue placeholder="Select Title" /></SelectTrigger>
                        <SelectContent >
                            {TITLE_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
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
                     <Select value={formGender || ""} onValueChange={(value) => setFormGender(value as Gender || undefined)} disabled={isSubmitting}>
                        <SelectTrigger id="facultyGender"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                        <SelectContent >

                            {GENDER_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
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
                     <Select value={formMaritalStatus || ""} onValueChange={(value) => setFormMaritalStatus(value || undefined)} disabled={isSubmitting}>
                        <SelectTrigger id="facultyMaritalStatus"><SelectValue placeholder="Select Status" /></SelectTrigger>
                        <SelectContent >

                            {MARITAL_STATUS_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>

                  {/* Official Information */}
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
                  {/* ID Numbers */}
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
                      {currentFaculty?.id ? "Save Changes" : "Create Faculty"}
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
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Faculty (Standard Format)</h3>
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
                  Use for general faculty data import/update. Requires staffCode, firstName, lastName, department, status.
                </p>
            </div>
          </div>

          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-accent"/>Import GTU Faculty Data</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="gtuCsvImportFaculty" accept=".csv" onChange={handleGtuFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportGtuFaculty} disabled={isSubmitting || !selectedGtuFile} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                {isSubmitting && selectedGtuFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                Import GTU Data
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadGtuSampleCsv} variant="link" size="sm" className="px-0 text-accent">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample (GTU)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Import faculty data using the official GTU CSV format.
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="searchFaculty">Search Faculty</Label>
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
              <Select value={filterDepartment} onValueChange={(value) => setFilterDepartment(value)}>
                <SelectTrigger id="filterFacultyDepartment"><SelectValue placeholder="All Departments"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterFacultyDesignation">Filter by Designation</Label>
              <Select value={filterDesignation} onValueChange={(value) => setFilterDesignation(value)}>
                <SelectTrigger id="filterFacultyDesignation"><SelectValue placeholder="All Designations"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Designations</SelectItem>
                  {DESIGNATION_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterFacultyStatus">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FacultyStatus | 'all')}>
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
                    {selectedFacultyIds.length} faculty member(s) selected.
                </span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                    <Checkbox 
                        checked={isAllSelectedOnPage ? true : (isSomeSelectedOnPage ? 'indeterminate' : false)}
                        onCheckedChange={(checked) => handleSelectAll(checked)}
                        aria-label="Select all faculty on this page"
                    />
                </TableHead>
                <SortableTableHeader field="gtuName" label="Name (GTU)" />
                <SortableTableHeader field="staffCode" label="Staff Code" />
                <SortableTableHeader field="department" label="Department" />
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
                  <TableCell>{faculty.designation}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        faculty.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : faculty.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : faculty.status === 'retired' || faculty.status === 'resigned' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300' // inactive or other
                    }`}>
                      {faculty.status.charAt(0).toUpperCase() + faculty.status.slice(1).replace('_', ' ')}
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
                      <span className="sr-only">Edit Faculty</span>
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(faculty.id)}
                        disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Faculty</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedFaculty.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No faculty members found. Try adjusting your search or filters, or add a new faculty member.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage -1) * itemsPerPage + 1, filteredFaculty.length)} to {Math.min(currentPage * itemsPerPage, filteredFaculty.length)} of {filteredFaculty.length} faculty members.
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
                        disabled={currentPage === 1}
                        >
                        <ChevronsLeft className="h-4 w-4" />
                        <span className="sr-only">First page</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
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

    