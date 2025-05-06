
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
import { PlusCircle, Edit, Trash2, Users, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, BookUser } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';

type StudentStatus = 'active' | 'inactive' | 'graduated' | 'dropped';

interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentNumber: string;
  department: string;
  currentSemester: number;
  status: StudentStatus;
  contactNumber?: string;
  address?: string;
  dateOfBirth?: string; // Store as ISO string e.g., "2000-01-01"
  admissionDate?: string; // Store as ISO string e.g., "2020-07-15"
}

const DEPARTMENT_OPTIONS = [
  "Computer Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Electronics & Communication Engineering",
  "General",
];

const SEMESTER_OPTIONS = Array.from({ length: 6 }, (_, i) => i + 1); // Semesters 1-6

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "graduated", label: "Graduated" },
  { value: "dropped", label: "Dropped Out" },
];

const initialStudents: Student[] = [
  { id: "s1", name: "Rajesh Kumar", email: "rajesh.k@example.com", enrollmentNumber: "GPPLN20001", department: "Computer Engineering", currentSemester: 4, status: "active", contactNumber: "9876543210", address: "123 Tech Park, Palanpur", dateOfBirth: "2002-05-15", admissionDate: "2020-07-01" },
  { id: "s2", name: "Priya Sharma", email: "priya.s@example.com", enrollmentNumber: "GPPLN20002", department: "Mechanical Engineering", currentSemester: 6, status: "active", contactNumber: "9876543211", dateOfBirth: "2001-11-20" },
  { id: "s3", name: "Amit Patel", email: "amit.p@example.com", enrollmentNumber: "GPPLN19005", department: "Electrical Engineering", currentSemester: 6, status: "graduated", address: "456 Power House, Deesa" , admissionDate: "2019-06-20"},
  { id: "s4", name: "Sunita Singh", email: "sunita.s@example.com", enrollmentNumber: "GPPLN21010", department: "Civil Engineering", currentSemester: 2, status: "active", contactNumber: "9876543212", dateOfBirth: "2003-02-10", admissionDate: "2021-07-10" },
  { id: "s5", name: "Vikram Rathod", email: "vikram.r@example.com", enrollmentNumber: "GPPLN20015", department: "Computer Engineering", currentSemester: 5, status: "inactive" },
];

type SortField = keyof Student | 'none';
type SortDirection = 'asc' | 'desc';

export default function StudentManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student> | null>(null);

  // Form state for Dialog
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formEnrollment, setFormEnrollment] = useState('');
  const [formDepartment, setFormDepartment] = useState(DEPARTMENT_OPTIONS[0]);
  const [formSemester, setFormSemester] = useState<number>(1);
  const [formStatus, setFormStatus] = useState<StudentStatus>('active');
  const [formContact, setFormContact] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDob, setFormDob] = useState<Date | undefined>(undefined);
  const [formAdmissionDate, setFormAdmissionDate] = useState<Date | undefined>(undefined);


  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all'); // 'all' or number as string
  const [filterStatus, setFilterStatus] = useState<StudentStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { toast } = useToast();

  useEffect(() => {
    setTimeout(() => {
      setStudents(initialStudents);
      setIsLoading(false);
    }, 500);
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormEnrollment('');
    setFormDepartment(DEPARTMENT_OPTIONS[0]);
    setFormSemester(1);
    setFormStatus('active');
    setFormContact('');
    setFormAddress('');
    setFormDob(undefined);
    setFormAdmissionDate(undefined);
    setCurrentStudent(null);
  };

  const handleEdit = (student: Student) => {
    setCurrentStudent(student);
    setFormName(student.name);
    setFormEmail(student.email);
    setFormEnrollment(student.enrollmentNumber);
    setFormDepartment(student.department);
    setFormSemester(student.currentSemester);
    setFormStatus(student.status);
    setFormContact(student.contactNumber || '');
    setFormAddress(student.address || '');
    setFormDob(student.dateOfBirth ? parseISO(student.dateOfBirth) : undefined);
    setFormAdmissionDate(student.admissionDate ? parseISO(student.admissionDate) : undefined);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = (studentId: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setStudents(students.filter(student => student.id !== studentId));
      toast({ title: "Student Deleted", description: "The student record has been successfully deleted." });
      setIsSubmitting(false);
    }, 500);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formEnrollment.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name, Email, and Enrollment Number cannot be empty." });
      return;
    }
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(formEmail)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid email address." });
        return;
    }
    // Check for duplicate enrollment number on add
    if (!currentStudent?.id && students.some(s => s.enrollmentNumber === formEnrollment.trim())) {
        toast({ variant: "destructive", title: "Validation Error", description: `Enrollment number ${formEnrollment.trim()} already exists.` });
        return;
    }
    // Check for duplicate enrollment number on edit (if changed)
    if (currentStudent?.id && formEnrollment.trim() !== currentStudent.enrollmentNumber && students.some(s => s.id !== currentStudent.id && s.enrollmentNumber === formEnrollment.trim())) {
        toast({ variant: "destructive", title: "Validation Error", description: `Enrollment number ${formEnrollment.trim()} already exists for another student.` });
        return;
    }


    setIsSubmitting(true);

    setTimeout(() => {
      const studentData: Omit<Student, 'id'> = {
        name: formName.trim(),
        email: formEmail.trim(),
        enrollmentNumber: formEnrollment.trim(),
        department: formDepartment,
        currentSemester: formSemester,
        status: formStatus,
        contactNumber: formContact.trim() || undefined,
        address: formAddress.trim() || undefined,
        dateOfBirth: formDob ? format(formDob, "yyyy-MM-dd") : undefined,
        admissionDate: formAdmissionDate ? format(formAdmissionDate, "yyyy-MM-dd") : undefined,
      };

      if (currentStudent && currentStudent.id) {
        setStudents(students.map(s => s.id === currentStudent.id ? { ...s, ...studentData } : s));
        toast({ title: "Student Updated", description: "The student record has been successfully updated." });
      } else {
        const newStudent: Student = {
          id: String(Date.now()),
          ...studentData
        };
        setStudents([...students, newStudent]);
        toast({ title: "Student Added", description: "The new student record has been successfully created." });
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

  const handleImportStudents = () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length <= 1) throw new Error("CSV file is empty or has only a header.");
        
        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        const expectedHeaders = ['id', 'name', 'email', 'enrollmentnumber', 'department', 'currentsemester', 'status', 'contactnumber', 'address', 'dateofbirth', 'admissiondate'];
        const requiredHeaders = ['name', 'email', 'enrollmentnumber', 'department', 'currentsemester', 'status'];

        if (!requiredHeaders.every(rh => header.includes(rh.replace(/\s+/g, '')))) { // Normalize expected headers for check
            throw new Error(`CSV header is missing required columns. Expected at least: ${requiredHeaders.join(', ')}. Found: ${header.join(', ')}`);
        }
        
        const hMap = Object.fromEntries(expectedHeaders.map(eh => [eh, header.indexOf(eh)]));

        const importedStudents: Student[] = [];
        const updatedStudentsList = [...students];
        let newStudentsCount = 0;
        let updatedStudentsCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const data = lines[i].split(',').map(d => d.trim().replace(/^"|"$/g, ''));
          
          const name = data[hMap['name']];
          const email = data[hMap['email']];
          const enrollmentNumber = data[hMap['enrollmentnumber']];
          const department = data[hMap['department']];
          const currentSemesterStr = data[hMap['currentsemester']];
          const status = data[hMap['status']] as StudentStatus;
          const contactNumber = data[hMap['contactnumber']];
          const address = data[hMap['address']];
          const dateOfBirth = data[hMap['dateofbirth']]; // Expect YYYY-MM-DD
          const admissionDate = data[hMap['admissiondate']]; // Expect YYYY-MM-DD
          const id = data[hMap['id']];

          if (!name || !email || !enrollmentNumber || !department || !currentSemesterStr || !STATUS_OPTIONS.find(s => s.value === status)) {
            console.warn(`Skipping row ${i+1}: Missing or invalid required data.`);
            continue;
          }
          const currentSemester = parseInt(currentSemesterStr, 10);
          if (isNaN(currentSemester) || currentSemester < 1 || currentSemester > 6) {
             console.warn(`Skipping row ${i+1}: Invalid semester value for ${name}.`);
             continue;
          }
           // Basic validation for dates if provided
          if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
            console.warn(`Skipping row ${i+1}: Invalid Date of Birth format for ${name}. Expected YYYY-MM-DD.`);
            continue;
          }
          if (admissionDate && !/^\d{4}-\d{2}-\d{2}$/.test(admissionDate)) {
            console.warn(`Skipping row ${i+1}: Invalid Admission Date format for ${name}. Expected YYYY-MM-DD.`);
            continue;
          }


          const studentData: Omit<Student, 'id'> = { 
            name, email, enrollmentNumber, department, currentSemester, status, 
            contactNumber: contactNumber || undefined, 
            address: address || undefined,
            dateOfBirth: dateOfBirth || undefined,
            admissionDate: admissionDate || undefined,
          };
          
          // Check for duplicate enrollment numbers
          const existingByEnrollment = updatedStudentsList.find(s => s.enrollmentNumber === enrollmentNumber);
          if (id) { // Trying to update
            const existingByIdIndex = updatedStudentsList.findIndex(u => u.id === id);
            if (existingByIdIndex !== -1) { // Found by ID, update it
                // If enrollment number is changing, ensure it's not conflicting with another student
                if (updatedStudentsList[existingByIdIndex].enrollmentNumber !== enrollmentNumber && existingByEnrollment && existingByEnrollment.id !== id) {
                    console.warn(`Skipping update for ID ${id} (${name}): Enrollment number ${enrollmentNumber} already exists for another student.`);
                    continue;
                }
                updatedStudentsList[existingByIdIndex] = { ...updatedStudentsList[existingByIdIndex], ...studentData };
                updatedStudentsCount++;
            } else { // ID provided but not found, treat as new if enrollment doesn't conflict
                 if (existingByEnrollment) {
                    console.warn(`Skipping new student ID ${id} (${name}): Enrollment number ${enrollmentNumber} already exists.`);
                    continue;
                }
                importedStudents.push({ id, ...studentData });
                newStudentsCount++;
            }
          } else { // No ID, treat as new
             if (existingByEnrollment) {
                console.warn(`Skipping new student (${name}): Enrollment number ${enrollmentNumber} already exists.`);
                continue;
            }
            importedStudents.push({ id: String(Date.now() + Math.random()), ...studentData });
            newStudentsCount++;
          }
        }
        
        const finalStudents = [
            ...updatedStudentsList.filter(s => !importedStudents.find(is => is.id === s.id)),
            ...importedStudents
        ];

        setStudents(finalStudents);
        toast({ title: "Import Successful", description: `${newStudentsCount} students added, ${updatedStudentsCount} students updated.` });

      } catch (error: any) {
        console.error("Error processing CSV file:", error);
        toast({ variant: "destructive", title: "Import Failed", description: error.message || "Could not process the CSV file." });
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
    const header = ["id", "name", "email", "enrollmentNumber", "department", "currentSemester", "status", "contactNumber", "address", "dateOfBirth", "admissionDate"];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedStudents.map(student => [
        student.id,
        `"${student.name.replace(/"/g, '""')}"`,
        `"${student.email.replace(/"/g, '""')}"`,
        student.enrollmentNumber,
        `"${student.department.replace(/"/g, '""')}"`,
        student.currentSemester,
        student.status,
        `"${(student.contactNumber || "").replace(/"/g, '""')}"`,
        `"${(student.address || "").replace(/"/g, '""')}"`,
        student.dateOfBirth || "",
        student.admissionDate || ""
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
    const sampleCsvContent = `id,name,email,enrollmentNumber,department,currentSemester,status,contactNumber,address,dateOfBirth,admissionDate
s_001,Aarav Sharma,aarav.s@example.com,GPPLN22001,Computer Engineering,3,active,9988776655,"123 Cyber Lane, Palanpur",2003-08-15,2022-07-01
s_002,Bhavna Patel,bhavna.p@example.com,GPPLN21005,Mechanical Engineering,5,active,9988776650,"Plot 45, Industrial Area, Mehsana",2002-01-20,2021-06-15
,Chetan Dave,chetan.d@example.com,GPPLN23010,Electrical Engineering,1,active,,,,2023-07-10
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
      result = result.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.department && student.department.toLowerCase().includes(searchTerm.toLowerCase()))
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
        
        if (sortField === 'currentSemester') {
            valA = Number(valA);
            valB = Number(valB);
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
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{currentStudent?.id ? "Edit Student" : "Add New Student"}</DialogTitle>
                  <DialogDescription>
                    {currentStudent?.id ? "Modify the details of this student." : "Create a new student record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="studentName">Full Name *</Label>
                    <Input id="studentName" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., John Doe" disabled={isSubmitting} required />
                  </div>
                  <div>
                    <Label htmlFor="studentEmail">Email Address *</Label>
                    <Input id="studentEmail" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="e.g., john.doe@example.com" disabled={isSubmitting} required />
                  </div>
                  <div>
                    <Label htmlFor="studentEnrollment">Enrollment Number *</Label>
                    <Input id="studentEnrollment" value={formEnrollment} onChange={(e) => setFormEnrollment(e.target.value)} placeholder="e.g., GPPLN20001" disabled={isSubmitting} required />
                  </div>
                  <div>
                    <Label htmlFor="studentDepartment">Department *</Label>
                    <Select value={formDepartment} onValueChange={(value) => setFormDepartment(value)} disabled={isSubmitting} required>
                        <SelectTrigger id="studentDepartment"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {DEPARTMENT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="studentSemester">Current Semester *</Label>
                     <Select value={String(formSemester)} onValueChange={(value) => setFormSemester(parseInt(value))} disabled={isSubmitting} required>
                        <SelectTrigger id="studentSemester"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {SEMESTER_OPTIONS.map(opt => <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="studentContact">Contact Number</Label>
                    <Input id="studentContact" type="tel" value={formContact} onChange={(e) => setFormContact(e.target.value)} placeholder="e.g., 9876543210" disabled={isSubmitting} />
                  </div>
                   <div>
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
                  <div className="md:col-span-2">
                    <Label htmlFor="studentAddress">Address</Label>
                    <Textarea id="studentAddress" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="e.g., 123 Main St, City" disabled={isSubmitting} rows={3} />
                  </div>
                  <div>
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
                  <div className="flex items-center space-x-2 pt-4">
                    <Switch id="studentStatusSwitch" checked={formStatus === 'active'} onCheckedChange={(checked) => setFormStatus(checked ? 'active' : 'inactive')} disabled={isSubmitting} />
                    <Label htmlFor="studentStatusSwitch">Status: {formStatus.charAt(0).toUpperCase() + formStatus.slice(1)}</Label>
                    { (formStatus !== 'active' && formStatus !== 'inactive') && 
                        <Select value={formStatus} onValueChange={(value) => setFormStatus(value as StudentStatus)} disabled={isSubmitting}>
                            <SelectTrigger className="w-[180px] h-9 ml-auto"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    }
                     { (formStatus === 'active' || formStatus === 'inactive') && 
                        <Select value={formStatus} onValueChange={(value) => setFormStatus(value as StudentStatus)} disabled={isSubmitting}>
                            <SelectTrigger className="w-[180px] h-9 ml-auto"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                 <SelectItem value="graduated">Graduated</SelectItem>
                                <SelectItem value="dropped">Dropped Out</SelectItem>
                            </SelectContent>
                        </Select>
                    }
                  </div>
                  
                  <DialogFooter className="md:col-span-2 mt-4">
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
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Students from CSV</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportStudent" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportStudents} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                Import
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
                </Button>
                <p className="text-xs text-muted-foreground">
                  CSV: id (opt), name, email, enrollmentNumber, department, currentSemester, status, contactNumber, address, dateOfBirth (YYYY-MM-DD), admissionDate (YYYY-MM-DD).
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="searchStudent">Search Students</Label>
              <div className="relative">
                 <Input 
                    id="searchStudent" 
                    placeholder="Search by name, email, enrollment..." 
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
                <SortableTableHeader field="name" label="Name" />
                <SortableTableHeader field="enrollmentNumber" label="Enrollment No." />
                <SortableTableHeader field="department" label="Department" />
                <SortableTableHeader field="currentSemester" label="Semester" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                        <span>{student.name}</span>
                        <span className="text-xs text-muted-foreground">{student.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{student.enrollmentNumber}</TableCell>
                  <TableCell>{student.department}</TableCell>
                  <TableCell className="text-center">{student.currentSemester}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        student.status === 'active' ? 'bg-success/20 text-success-foreground' 
                        : student.status === 'graduated' ? 'bg-primary/20 text-primary-foreground'
                        : student.status === 'dropped' ? 'bg-destructive/20 text-destructive-foreground'
                        : 'bg-warning/20 text-warning-foreground' // inactive
                    }`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
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
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
