
"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Edit, Trash2, Users, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, BookUser, CalendarDays as CalendarIcon, Info } from "lucide-react"; // Renamed CalendarDays to CalendarIcon
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


type StudentStatus = 'active' | 'inactive' | 'graduated' | 'dropped';
type SemesterStatus = 'Passed' | 'Pending' | 'Not Appeared' | 'N/A'; // Added N/A as a valid status

interface Student {
  id: string; // Internal ID
  enrollmentNumber: string; // map_number from GTU CSV
  gtuName?: string; // Name as per GTU records (Surname Name FatherName)
  firstName?: string;
  middleName?: string;
  lastName?: string;
  personalEmail?: string; // Email from GTU CSV
  instituteEmail: string; // enrollmentNumber@gppalanpur.in
  department: string;
  branchCode?: string; // BR_CODE from GTU CSV
  currentSemester: number;
  status: StudentStatus;
  contactNumber?: string; // Mobile from GTU CSV
  address?: string;
  dateOfBirth?: string; // Store as ISO string e.g., "2000-01-01"
  admissionDate?: string; // Store as ISO string e.g., "2020-07-15"
  gender?: 'Male' | 'Female' | 'Other';
  convocationYear?: number;
  sem1Status?: SemesterStatus;
  sem2Status?: SemesterStatus;
  sem3Status?: SemesterStatus;
  sem4Status?: SemesterStatus;
  sem5Status?: SemesterStatus;
  sem6Status?: SemesterStatus;
  sem7Status?: SemesterStatus;
  sem8Status?: SemesterStatus;
  category?: string;
  isComplete?: boolean;
  termClose?: boolean;
  isCancel?: boolean;
  isPassAll?: boolean;
  aadharNumber?: string;
  shift?: 'Morning' | 'Afternoon' | string; // Or string for flexibility
}

const DEPARTMENT_OPTIONS = [
  "Computer Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Electronics & Communication Engineering",
  "General",
];

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => i + 1); // Semesters 1-8 for GTU data

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "graduated", label: "Graduated" },
  { value: "dropped", label: "Dropped Out" },
];

const SEMESTER_STATUS_OPTIONS: { value: SemesterStatus; label: string }[] = [
    { value: "N/A", label: "N/A" }, // Ensure N/A has a non-empty value
    { value: "Passed", label: "Passed" },
    { value: "Pending", label: "Pending" },
    { value: "Not Appeared", label: "Not Appeared" },
];

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const SHIFT_OPTIONS = ["Morning", "Afternoon"];


const initialStudents: Student[] = [
  { id: "s1", enrollmentNumber: "GPPLN20001", gtuName: "KUMAR RAJESH SHANTILAL", firstName: "RAJESH", middleName: "SHANTILAL", lastName: "KUMAR", personalEmail: "rajesh.k@example.com", instituteEmail: "GPPLN20001@gppalanpur.in", department: "Computer Engineering", branchCode: "CE", currentSemester: 4, status: "active", contactNumber: "9876543210", address: "123 Tech Park, Palanpur", dateOfBirth: "2002-05-15", admissionDate: "2020-07-01", gender: "Male", convocationYear: 2024, sem1Status: "Passed", sem2Status: "Passed", sem3Status: "Passed", category: "OPEN", shift: "Morning", isPassAll: false },
  { id: "s2", enrollmentNumber: "GPPLN20002", gtuName: "SHARMA PRIYA MOHAN", firstName: "PRIYA", middleName: "MOHAN", lastName: "SHARMA", personalEmail: "priya.s@example.com", instituteEmail: "GPPLN20002@gppalanpur.in", department: "Mechanical Engineering", branchCode: "ME", currentSemester: 6, status: "active", contactNumber: "9876543211", dateOfBirth: "2001-11-20", gender: "Female", sem1Status: "Passed", sem2Status: "Passed", sem3Status: "Passed", sem4Status: "Passed", sem5Status: "Passed", shift: "Afternoon", isComplete: false },
  { id: "s3", enrollmentNumber: "GPPLN19005", gtuName: "PATEL AMIT DINESHBHAI", firstName: "AMIT", middleName: "DINESHBHAI", lastName: "PATEL", instituteEmail: "GPPLN19005@gppalanpur.in", department: "Electrical Engineering", branchCode: "EE", currentSemester: 6, status: "graduated", address: "456 Power House, Deesa", admissionDate: "2019-06-20", gender: "Male", convocationYear: 2023, sem1Status: "Passed", sem2Status: "Passed", sem3Status: "Passed", sem4Status: "Passed", sem5Status: "Passed", sem6Status: "Passed", isPassAll: true, isComplete: true, termClose: true },
];

const LOCAL_STORAGE_KEY_STUDENTS = 'managedStudentsPMP'; // Unique key

type SortField = keyof Student | 'none';
type SortDirection = 'asc' | 'desc';

const parseGtuName = (gtuName: string): { firstName?: string, middleName?: string, lastName?: string } => {
    if (!gtuName) return {};
    const parts = gtuName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0] };
    if (parts.length === 2) return { lastName: parts[0], firstName: parts[1] };
    // Assumes Surname FirstName MiddleName format for 3+ parts
    return { lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') };
};

const mapSemesterCodeToStatus = (code: string | undefined | null): SemesterStatus => {
    if (code === '2') return 'Passed';
    if (code === '1') return 'Pending';
    if (code === '' || code === undefined || code === null) return 'Not Appeared';
    return 'N/A'; 
};

const generateClientId = (): string => {
  return `client_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};


export default function StudentManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student> | null>(null);

  // Form state for Dialog
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
  // Semester statuses
  const [formSem1Status, setFormSem1Status] = useState<SemesterStatus>('N/A');
  const [formSem2Status, setFormSem2Status] = useState<SemesterStatus>('N/A');
  const [formSem3Status, setFormSem3Status] = useState<SemesterStatus>('N/A');
  const [formSem4Status, setFormSem4Status] = useState<SemesterStatus>('N/A');
  const [formSem5Status, setFormSem5Status] = useState<SemesterStatus>('N/A');
  const [formSem6Status, setFormSem6Status] = useState<SemesterStatus>('N/A');
  const [formSem7Status, setFormSem7Status] = useState<SemesterStatus>('N/A');
  const [formSem8Status, setFormSem8Status] = useState<SemesterStatus>('N/A');


  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGtuFile, setSelectedGtuFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all'); 
  const [filterStatus, setFilterStatus] = useState<StudentStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('gtuName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedStudents = localStorage.getItem(LOCAL_STORAGE_KEY_STUDENTS);
      if (storedStudents) {
        setStudents(JSON.parse(storedStudents));
      } else {
        setStudents(initialStudents); 
      }
    } catch (error) {
      console.error("Failed to load students from localStorage", error);
      setStudents(initialStudents);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) { 
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY_STUDENTS, JSON.stringify(students));
        } catch (error) {
            console.error("Failed to save students to localStorage", error);
            toast({
                variant: "destructive",
                title: "Storage Error",
                description: "Could not save student data locally. Changes might be lost.",
            });
        }
    }
  }, [students, isLoading, toast]);


  const resetForm = () => {
    setFormEnrollment('');
    setFormGtuName('');
    setFormFirstName('');
    setFormMiddleName('');
    setFormLastName('');
    setFormPersonalEmail('');
    setFormDepartment(DEPARTMENT_OPTIONS[0]);
    setFormBranchCode('');
    setFormSemester(1);
    setFormStatus('active');
    setFormContact('');
    setFormAddress('');
    setFormDob(undefined);
    setFormAdmissionDate(undefined);
    setFormGender(undefined);
    setFormConvocationYear(undefined);
    setFormShift(undefined);
    setFormSem1Status('N/A');
    setFormSem2Status('N/A');
    setFormSem3Status('N/A');
    setFormSem4Status('N/A');
    setFormSem5Status('N/A');
    setFormSem6Status('N/A');
    setFormSem7Status('N/A');
    setFormSem8Status('N/A');
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
    setFormGender(student.gender);
    setFormConvocationYear(student.convocationYear);
    setFormShift(student.shift);
    setFormSem1Status(student.sem1Status || 'N/A');
    setFormSem2Status(student.sem2Status || 'N/A');
    setFormSem3Status(student.sem3Status || 'N/A');
    setFormSem4Status(student.sem4Status || 'N/A');
    setFormSem5Status(student.sem5Status || 'N/A');
    setFormSem6Status(student.sem6Status || 'N/A');
    setFormSem7Status(student.sem7Status || 'N/A');
    setFormSem8Status(student.sem8Status || 'N/A');
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = (studentId: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setStudents(prevStudents => prevStudents.filter(student => student.id !== studentId));
      toast({ title: "Student Deleted", description: "The student record has been successfully deleted." });
      setIsSubmitting(false);
    }, 500);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formEnrollment.trim() || (!formGtuName.trim() && (!formFirstName.trim() || !formLastName.trim()))) {
      toast({ variant: "destructive", title: "Validation Error", description: "Enrollment Number and Name (GTU Name or First/Last Name) are required." });
      return;
    }
    if (formPersonalEmail.trim() && !/\S+@\S+\.\S+/.test(formPersonalEmail)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid personal email address or leave it empty." });
        return;
    }
    if (!currentStudent?.id && students.some(s => s.enrollmentNumber === formEnrollment.trim())) {
        toast({ variant: "destructive", title: "Validation Error", description: `Enrollment number ${formEnrollment.trim()} already exists.` });
        return;
    }
    if (currentStudent?.id && formEnrollment.trim() !== currentStudent.enrollmentNumber && students.some(s => s.id !== currentStudent.id && s.enrollmentNumber === formEnrollment.trim())) {
        toast({ variant: "destructive", title: "Validation Error", description: `Enrollment number ${formEnrollment.trim()} already exists for another student.` });
        return;
    }
    if (formConvocationYear && (isNaN(formConvocationYear) || formConvocationYear < 1950 || formConvocationYear > new Date().getFullYear() + 5)) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid convocation year." });
      return;
    }


    setIsSubmitting(true);

    setTimeout(() => {
      const { firstName, middleName, lastName } = parseGtuName(formGtuName);

      const studentData: Omit<Student, 'id' | 'instituteEmail'> & { instituteEmail?: string } = {
        enrollmentNumber: formEnrollment.trim(),
        gtuName: formGtuName.trim() || undefined,
        firstName: formFirstName.trim() || firstName || undefined,
        middleName: formMiddleName.trim() || middleName || undefined,
        lastName: formLastName.trim() || lastName || undefined,
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
        sem1Status: formSem1Status,
        sem2Status: formSem2Status,
        sem3Status: formSem3Status,
        sem4Status: formSem4Status,
        sem5Status: formSem5Status,
        sem6Status: formSem6Status,
        sem7Status: formSem7Status,
        sem8Status: formSem8Status,
      };
      
      studentData.instituteEmail = `${studentData.enrollmentNumber}@gppalanpur.in`;

      if (currentStudent && currentStudent.id) {
        setStudents(prevStudents => prevStudents.map(s => s.id === currentStudent.id ? { ...s, ...studentData, instituteEmail: studentData.instituteEmail! } : s));
        toast({ title: "Student Updated", description: "The student record has been successfully updated." });
      } else {
        const newStudent: Student = {
          id: generateClientId(),
          ...studentData,
          instituteEmail: studentData.instituteEmail!,
        };
        setStudents(prevStudents => [...prevStudents, newStudent]);
        toast({ title: "Student Added", description: `Student ${newStudent.gtuName || `${newStudent.firstName} ${newStudent.lastName}`} added. Institute Email: ${newStudent.instituteEmail}, Default Password: ${newStudent.enrollmentNumber}` });
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
  };
  const handleGtuFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedGtuFile(event.target.files[0]);
    } else {
      setSelectedGtuFile(null);
    }
  };

  // Standard CSV import/export (existing functionality)
  const handleImportStudents = () => { 
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      let newStudentsCount = 0;
      let updatedStudentsCount = 0;
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length <= 1) throw new Error("CSV file is empty or has only a header.");
        
        const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '')); // normalize header
        const expectedHeaders = ['id', 'enrollmentnumber', 'gtuname', 'firstname', 'middlename', 'lastname', 'personalemail', 'department', 'branchcode', 'currentsemester', 'status', 'contactnumber', 'address', 'dateofbirth', 'admissiondate', 'gender', 'convocationyear', 'shift', 'sem1status', 'sem2status', 'sem3status', 'sem4status', 'sem5status', 'sem6status', 'sem7status', 'sem8status', 'category', 'iscomplete', 'termclose', 'iscancel', 'ispassall', 'aadharnumber'];
        const requiredHeaders = ['enrollmentnumber', 'department', 'currentsemester', 'status']; 

        if (!requiredHeaders.every(rh => header.includes(rh))) {
            throw new Error(`CSV header is missing required columns. Expected at least: ${requiredHeaders.join(', ')}. Found: ${header.join(', ')}`);
        }
        
        const hMap = Object.fromEntries(expectedHeaders.map(eh => [eh, header.indexOf(eh)]));

        const importedOrUpdatedStudents: Student[] = [];
        
        setStudents(prevStudents => {
            const currentStudentsMap = new Map(prevStudents.map(s => [s.enrollmentNumber, s]));
            const currentStudentsByIdMap = new Map(prevStudents.map(s => [s.id, s]));


            for (let i = 1; i < lines.length; i++) {
              const data = lines[i].split(',').map(d => d.trim().replace(/^"|"$/g, ''));
              
              const enrollmentNumber = data[hMap['enrollmentnumber']];
              if (!enrollmentNumber) {
                console.warn(`Skipping row ${i+1}: Enrollment number is missing.`);
                continue;
              }
              const department = data[hMap['department']];
              const currentSemesterStr = data[hMap['currentsemester']];
              const status = data[hMap['status']] as StudentStatus;

              if (!department || !currentSemesterStr || !STATUS_OPTIONS.find(s => s.value === status)) {
                console.warn(`Skipping row ${i+1} for ${enrollmentNumber}: Missing or invalid department, current semester, or status.`);
                continue;
              }
              const currentSemester = parseInt(currentSemesterStr, 10);
              if (isNaN(currentSemester) || !SEMESTER_OPTIONS.includes(currentSemester)) {
                 console.warn(`Skipping row ${i+1} for ${enrollmentNumber}: Invalid semester value.`);
                 continue;
              }

              const gtuName = data[hMap['gtuname']];
              const parsedNames = parseGtuName(gtuName || '');
              
              const studentDataPartial: Omit<Student, 'id' | 'instituteEmail'| 'enrollmentNumber' | 'department' | 'currentSemester' | 'status'> & {instituteEmail?: string} = {
                gtuName: gtuName || undefined,
                firstName: data[hMap['firstname']] || parsedNames.firstName || undefined,
                middleName: data[hMap['middlename']] || parsedNames.middleName || undefined,
                lastName: data[hMap['lastname']] || parsedNames.lastName || undefined,
                personalEmail: data[hMap['personalemail']] || undefined,
                branchCode: data[hMap['branchcode']] || undefined,
                contactNumber: data[hMap['contactnumber']] || undefined,
                address: data[hMap['address']] || undefined,
                dateOfBirth: data[hMap['dateofbirth']] || undefined,
                admissionDate: data[hMap['admissiondate']] || undefined,
                gender: data[hMap['gender']] as Student['gender'] || undefined,
                convocationYear: data[hMap['convocationyear']] ? parseInt(data[hMap['convocationyear']], 10) : undefined,
                shift: data[hMap['shift']] as Student['shift'] || undefined,
                sem1Status: (data[hMap['sem1status']] as SemesterStatus) || 'N/A',
                sem2Status: (data[hMap['sem2status']] as SemesterStatus) || 'N/A',
                sem3Status: (data[hMap['sem3status']] as SemesterStatus) || 'N/A',
                sem4Status: (data[hMap['sem4status']] as SemesterStatus) || 'N/A',
                sem5Status: (data[hMap['sem5status']] as SemesterStatus) || 'N/A',
                sem6Status: (data[hMap['sem6status']] as SemesterStatus) || 'N/A',
                sem7Status: (data[hMap['sem7status']] as SemesterStatus) || 'N/A',
                sem8Status: (data[hMap['sem8status']] as SemesterStatus) || 'N/A',
                category: data[hMap['category']] || undefined,
                isComplete: data[hMap['iscomplete']] ? data[hMap['iscomplete']].toLowerCase() === 'true' : undefined,
                termClose: data[hMap['termclose']] ? data[hMap['termclose']].toLowerCase() === 'true' : undefined,
                isCancel: data[hMap['iscancel']] ? data[hMap['iscancel']].toLowerCase() === 'true' : undefined,
                isPassAll: data[hMap['ispassall']] ? data[hMap['ispassall']].toLowerCase() === 'true' : undefined,
                aadharNumber: data[hMap['aadharnumber']] || undefined,
              };
              
              const studentData: Omit<Student, 'id'> = {
                enrollmentNumber,
                department,
                currentSemester,
                status,
                instituteEmail: `${enrollmentNumber}@gppalanpur.in`,
                ...studentDataPartial
              };

              const idFromCsv = data[hMap['id']];
              let existingStudent: Student | undefined = undefined;

              if (idFromCsv) {
                existingStudent = currentStudentsByIdMap.get(idFromCsv);
                 if (existingStudent && existingStudent.enrollmentNumber !== enrollmentNumber && currentStudentsMap.has(enrollmentNumber)) {
                     console.warn(`Skipping update for ID ${idFromCsv}: Enrollment number ${enrollmentNumber} from CSV conflicts with an existing different student. Student with this enrollment will be updated instead if no other ID matches.`);
                     existingStudent = undefined; // Force check by enrollment number
                 }
              }
              
              if(!existingStudent){
                 existingStudent = currentStudentsMap.get(enrollmentNumber);
              }


              if (existingStudent) { 
                const updatedStudent = { ...existingStudent, ...studentData };
                currentStudentsMap.set(enrollmentNumber, updatedStudent);
                if (idFromCsv && existingStudent.id === idFromCsv) currentStudentsByIdMap.set(idFromCsv, updatedStudent);
                updatedStudentsCount++;
              } else { 
                const newStudent = { id: generateClientId(), ...studentData };
                currentStudentsMap.set(enrollmentNumber, newStudent);
                currentStudentsByIdMap.set(newStudent.id, newStudent);
                newStudentsCount++;
                console.log(`Creating user account for ${studentData.enrollmentNumber}: Email: ${studentData.instituteEmail}, Password: ${studentData.enrollmentNumber}`);
              }
            }
            return Array.from(currentStudentsMap.values());
        });
        
        toast({ title: "Import Successful", description: `${newStudentsCount} students added, ${updatedStudentsCount} students updated.` });

      } catch (error: any) {
        console.error("Error processing standard CSV file:", error);
        toast({ variant: "destructive", title: "Standard Import Failed", description: error.message || "Could not process the CSV file." });
      } finally {
        setIsSubmitting(false);
        setSelectedFile(null); 
        const fileInput = document.getElementById('csvImportStudent') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    };
    reader.readAsText(selectedFile);
  };
  const handleExportStudents = () => { 
    if (filteredAndSortedStudents.length === 0) {
      toast({ title: "Export Canceled", description: "No students to export (check filters)." });
      return;
    }
    const header = ["id", "enrollmentNumber", "gtuName", "firstName", "middleName", "lastName", "personalEmail", "instituteEmail", "department", "branchCode", "currentSemester", "status", "contactNumber", "address", "dateOfBirth", "admissionDate", "gender", "convocationYear", "shift", "sem1Status", "sem2Status", "sem3Status", "sem4Status", "sem5Status", "sem6Status", "sem7Status", "sem8Status", "category", "isComplete", "termClose", "isCancel", "isPassAll", "aadharNumber"];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedStudents.map(student => [
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
s_001,GPPLN22001,SHARMA AARAV ROHIT,AARAV,ROHIT,SHARMA,aarav.s@example.com,GPPLN22001@gppalanpur.in,Computer Engineering,CE,3,active,9988776655,"123 Cyber Lane, Palanpur",2003-08-15,2022-07-01,Male,2025,Morning,Passed,Passed,Pending,N/A,N/A,N/A,N/A,N/A,OPEN,false,false,false,false,123456789012
,GPPLN21005,PATEL BHAVNA MAHESH,BHAVNA,MAHESH,PATEL,bhavna.p@example.com,GPPLN21005@gppalanpur.in,Mechanical Engineering,ME,5,active,9988776650,"Plot 45, Industrial Area, Mehsana",2002-01-20,2021-06-15,Female,2024,Afternoon,Passed,Passed,Passed,Passed,Passed,N/A,N/A,N/A,SEBC,false,false,false,false,
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


  // GTU CSV import
  const handleImportGtuStudents = () => {
    if (!selectedGtuFile) {
      toast({ variant: "destructive", title: "GTU Import Error", description: "Please select a GTU CSV file to import." });
      return;
    }
    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      let newStudentsCount = 0;
      let updatedStudentsCount = 0;
      let skippedCount = 0;
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length <= 1) throw new Error("GTU CSV file is empty or has only a header.");
        
        const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '')); // normalize header
        const gtuHeaders = ['s.no','map_number','br_code','name','email','mobile','gender','convoyear','sem1','sem2','sem3','sem4','sem5','sem6','sem7','sem8','category','iscomplete','termclose','iscancel','ispassall','aadhar','shift'];
        const requiredGtuHeaders = ['map_number', 'name']; 

        if (!requiredGtuHeaders.every(rh => header.includes(rh))) {
            throw new Error(`GTU CSV header is missing required columns. Expected at least: ${requiredGtuHeaders.join(', ')}. Found: ${header.join(', ')}`);
        }
        
        const hMap = Object.fromEntries(gtuHeaders.map(eh => [eh, header.indexOf(eh)]));
        
        setStudents(prevStudents => {
            const currentStudentsMap = new Map(prevStudents.map(s => [s.enrollmentNumber, s]));

            for (let i = 1; i < lines.length; i++) {
              const data = lines[i].split(',').map(d => d.trim().replace(/^"|"$/g, ''));
              
              const enrollmentNumber = data[hMap['map_number']];
              const gtuName = data[hMap['name']];

              if (!enrollmentNumber || !gtuName) {
                console.warn(`Skipping GTU row ${i+1}: Enrollment number or GTU Name is missing.`);
                skippedCount++;
                continue;
              }

              const { firstName, middleName, lastName } = parseGtuName(gtuName);
              const branchCode = data[hMap['br_code']];
              const department = DEPARTMENT_OPTIONS.find(d => d.toLowerCase().includes((branchCode || "").toLowerCase().substring(0,2))) || "General"; 
              
              let currentSemester = 1;
              for (let sem = 8; sem >= 1; sem--) {
                if (mapSemesterCodeToStatus(data[hMap[`sem${sem}` as keyof typeof hMap]]) === 'Passed') {
                    currentSemester = Math.min(sem + 1, 8); 
                    break;
                }
              }
              if (data[hMap['ispassall']]?.toLowerCase() === 'true' || data[hMap['iscomplete']]?.toLowerCase() === 'true'){
                currentSemester = 8; 
              }


              const studentData: Omit<Student, 'id'> = {
                enrollmentNumber,
                gtuName,
                firstName,
                middleName,
                lastName,
                personalEmail: data[hMap['email']] || undefined,
                instituteEmail: `${enrollmentNumber}@gppalanpur.in`,
                department,
                branchCode: branchCode || undefined,
                currentSemester: currentSemester, 
                status: data[hMap['iscancel']]?.toLowerCase() === 'true' ? 'dropped' : (data[hMap['iscomplete']]?.toLowerCase() === 'true' || data[hMap['ispassall']]?.toLowerCase() === 'true' ? 'graduated' : 'active'),
                contactNumber: data[hMap['mobile']] || undefined,
                gender: data[hMap['gender']] as Student['gender'] || undefined,
                convocationYear: data[hMap['convoyear']] ? parseInt(data[hMap['convoyear']], 10) : undefined,
                sem1Status: mapSemesterCodeToStatus(data[hMap['sem1']]),
                sem2Status: mapSemesterCodeToStatus(data[hMap['sem2']]),
                sem3Status: mapSemesterCodeToStatus(data[hMap['sem3']]),
                sem4Status: mapSemesterCodeToStatus(data[hMap['sem4']]),
                sem5Status: mapSemesterCodeToStatus(data[hMap['sem5']]),
                sem6Status: mapSemesterCodeToStatus(data[hMap['sem6']]),
                sem7Status: mapSemesterCodeToStatus(data[hMap['sem7']]),
                sem8Status: mapSemesterCodeToStatus(data[hMap['sem8']]),
                category: data[hMap['category']] || undefined,
                isComplete: data[hMap['iscomplete']]?.toLowerCase() === 'true',
                termClose: data[hMap['termclose']]?.toLowerCase() === 'true',
                isCancel: data[hMap['iscancel']]?.toLowerCase() === 'true',
                isPassAll: data[hMap['ispassall']]?.toLowerCase() === 'true',
                aadharNumber: data[hMap['aadhar']] || undefined,
                shift: data[hMap['shift']] || undefined,
              };

              const existingStudent = currentStudentsMap.get(enrollmentNumber);
              if (existingStudent) {
                currentStudentsMap.set(enrollmentNumber, { ...existingStudent, ...studentData });
                updatedStudentsCount++;
              } else {
                currentStudentsMap.set(enrollmentNumber, { id: generateClientId(), ...studentData });
                newStudentsCount++;
                console.log(`Creating user account for ${studentData.enrollmentNumber} (GTU Import): Email: ${studentData.instituteEmail}, Password: ${studentData.enrollmentNumber}`);
                toast({ title: `User Account (Simulated)`, description: `Account for ${studentData.enrollmentNumber} would be created. Email: ${studentData.instituteEmail}, Pass: ${studentData.enrollmentNumber}`});
              }
            }
            return Array.from(currentStudentsMap.values());
        });
        
        toast({ title: "GTU Import Successful", description: `${newStudentsCount} students added, ${updatedStudentsCount} students updated. ${skippedCount} rows skipped.` });

      } catch (error: any) {
        console.error("Error processing GTU CSV file:", error);
        toast({ variant: "destructive", title: "GTU Import Failed", description: error.message || "Could not process the GTU CSV file." });
      } finally {
        setIsSubmitting(false);
        setSelectedGtuFile(null); 
        const fileInput = document.getElementById('gtuCsvImportStudent') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    };
    reader.readAsText(selectedGtuFile);
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
  };
  
  const filteredAndSortedStudents = useMemo(() => {
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
    if (filterDepartment !== 'all') {
      result = result.filter(student => student.department === filterDepartment);
    }
    if (filterSemester !== 'all') {
      result = result.filter(student => student.currentSemester === parseInt(filterSemester, 10));
    }
    if (filterStatus !== 'all') {
      result = result.filter(student => student.status === filterStatus);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];
        
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
  }, [students, searchTerm, filterDepartment, filterSemester, filterStatus, sortField, sortDirection]);

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

  const semesterStatusGetters: { [key: number]: SemesterStatus } = {
    1: formSem1Status, 2: formSem2Status, 3: formSem3Status, 4: formSem4Status,
    5: formSem5Status, 6: formSem6Status, 7: formSem7Status, 8: formSem8Status,
  };

  const semesterStatusSetters: { [key: number]: React.Dispatch<React.SetStateAction<SemesterStatus>> } = {
    1: setFormSem1Status, 2: setFormSem2Status, 3: setFormSem3Status, 4: setFormSem4Status,
    5: setFormSem5Status, 6: setFormSem6Status, 7: setFormSem7Status, 8: setFormSem8Status,
  };


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
                  {/* Enrollment & Name */}
                  <div className="md:col-span-1">
                    <Label htmlFor="studentEnrollment">Enrollment Number *</Label>
                    <Input id="studentEnrollment" value={formEnrollment} onChange={(e) => setFormEnrollment(e.target.value)} placeholder="e.g., GPPLN20001" disabled={isSubmitting} required />
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
                  
                  {/* Email and Contact */}
                  <div className="md:col-span-2">
                    <Label htmlFor="studentPersonalEmail">Personal Email</Label>
                    <Input id="studentPersonalEmail" type="email" value={formPersonalEmail} onChange={(e) => setFormPersonalEmail(e.target.value)} placeholder="e.g., john.doe@example.com" disabled={isSubmitting} />
                  </div>
                   <div className="md:col-span-1">
                    <Label htmlFor="studentContact">Contact Number</Label>
                    <Input id="studentContact" type="tel" value={formContact} onChange={(e) => setFormContact(e.target.value)} placeholder="e.g., 9876543210" disabled={isSubmitting} />
                  </div>

                  {/* Department & Academics */}
                  <div className="md:col-span-1">
                    <Label htmlFor="studentDepartment">Department *</Label>
                    <Select value={formDepartment} onValueChange={(value) => setFormDepartment(value)} disabled={isSubmitting} required>
                        <SelectTrigger id="studentDepartment"><SelectValue /></SelectTrigger>
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
                        <SelectTrigger id="studentSemester"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {SEMESTER_OPTIONS.map(opt => <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentStatus">Status *</Label>
                     <Select value={formStatus} onValueChange={(value) => setFormStatus(value as StudentStatus)} disabled={isSubmitting} required>
                        <SelectTrigger id="studentStatus"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                   <div className="md:col-span-1">
                    <Label htmlFor="studentGender">Gender</Label>
                     <Select value={formGender} onValueChange={(value) => setFormGender(value as Student['gender'])} disabled={isSubmitting}>
                        <SelectTrigger id="studentGender"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                        <SelectContent>
                            {GENDER_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="studentShift">Shift</Label>
                     <Select value={formShift} onValueChange={(value) => setFormShift(value as Student['shift'])} disabled={isSubmitting}>
                        <SelectTrigger id="studentShift"><SelectValue placeholder="Select Shift" /></SelectTrigger>
                        <SelectContent>
                            {SHIFT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>


                  {/* Dates */}
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

                  {/* Address */}
                  <div className="md:col-span-3">
                    <Label htmlFor="studentAddress">Address</Label>
                    <Textarea id="studentAddress" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="e.g., 123 Main St, City" disabled={isSubmitting} rows={2} />
                  </div>

                  {/* Semester Statuses */}
                  <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 border p-3 rounded-md">
                    <h4 className="md:col-span-full text-sm font-medium mb-1">Semester Statuses</h4>
                    {SEMESTER_OPTIONS.map(semNum => (
                        <div key={`sem-${semNum}-status-form`}>
                            <Label htmlFor={`sem${semNum}StatusForm`}>Sem {semNum}</Label>
                            <Select 
                                value={semesterStatusGetters[semNum]} 
                                onValueChange={(val) => semesterStatusSetters[semNum](val as SemesterStatus)} 
                                disabled={isSubmitting}
                            >
                                <SelectTrigger id={`sem${semNum}StatusForm`}><SelectValue placeholder="Status" /></SelectTrigger>
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
          {/* Standard CSV Import */}
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

           {/* GTU CSV Import */}
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
              <Label htmlFor="filterDepartment">Filter by Department</Label>
              <Select value={filterDepartment} onValueChange={(value) => setFilterDepartment(value)}>
                <SelectTrigger id="filterDepartment"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterSemester">Filter by Semester</Label>
              <Select value={filterSemester} onValueChange={(value) => setFilterSemester(value)}>
                <SelectTrigger id="filterSemester"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {SEMESTER_OPTIONS.map(opt => <SelectItem key={opt} value={String(opt)}>{`Semester ${opt}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStatusStudent">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as StudentStatus | 'all')}>
                <SelectTrigger id="filterStatusStudent"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
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
              {filteredAndSortedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
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
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' 
                    }`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
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
                                        const statusValue = student[statusKey];
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
              {filteredAndSortedStudents.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No students found. Try adjusting your search or filters, or add a new student.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="justify-end">
            <p className="text-sm text-muted-foreground">
                Showing {filteredAndSortedStudents.length} of {students.length} students.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

