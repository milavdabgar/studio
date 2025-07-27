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
import { PlusCircle, Edit, Trash2, CalendarRange, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Eye, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Batch, Program, BatchStatus, Student } from '@/types/entities';
import { batchService } from '@/lib/api/batches';
import { programService } from '@/lib/api/programs';
import { studentService } from '@/lib/api/students';
import { getIntakeCapacityForYear } from '@/lib/utils/intake-capacity';

type SortField = keyof Batch | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];
const BATCH_STATUS_OPTIONS: { value: BatchStatus, label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "inactive", label: "Inactive" },
];

export default function BatchManagementPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const [batchCreationMethod, setBatchCreationMethod] = useState<'semester' | 'enrollment'>('semester');
  const [currentBatch, setCurrentBatch] = useState<Partial<Batch> | null>(null);
  const [viewBatch, setViewBatch] = useState<Batch | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formProgramId, setFormProgramId] = useState<string>('');
  const [formStartAcademicYear, setFormStartAcademicYear] = useState<number | undefined>(new Date().getFullYear());
  const [formEndAcademicYear, setFormEndAcademicYear] = useState<number | undefined>(undefined);
  const [formMaxIntake, setFormMaxIntake] = useState<number | undefined>(undefined);
  const [formStatus, setFormStatus] = useState<BatchStatus>('upcoming');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatusVal, setFilterStatusVal] = useState<BatchStatus | 'all'>('all');
  const [filterProgramVal, setFilterProgramVal] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [batchData, programData, studentData] = await Promise.all([
        batchService.getAllBatches(),
        programService.getAllPrograms(),
        studentService.getAllStudents()
      ]);
      setBatches(batchData);
      setPrograms(programData);
      setStudents(studentData);
      if (programData.length > 0 && !formProgramId) {
        setFormProgramId(programData[0].id);
      }
    } catch (error) {
      console.error("Failed to load data", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load batches or programs data." });
    }
    setIsLoading(false);
  }, [toast, formProgramId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const resetForm = () => {
    setFormName(''); 
    setFormProgramId(programs.length > 0 ? programs[0].id : ''); 
    setFormStartAcademicYear(new Date().getFullYear());
    setFormEndAcademicYear(undefined);
    setFormMaxIntake(undefined);
    setFormStatus('upcoming');
    setCurrentBatch(null);
  };

  const handleView = (batch: Batch) => {
    setViewBatch(batch);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (batch: Batch) => {
    setCurrentBatch(batch);
    setFormName(batch.name);
    setFormProgramId(batch.programId);
    setFormStartAcademicYear(batch.startAcademicYear);
    setFormEndAcademicYear(batch.endAcademicYear);
    setFormMaxIntake(batch.maxIntake);
    setFormStatus(batch.status);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    if (programs.length === 0) {
      toast({ variant: "destructive", title: "Cannot Add Batch", description: "No programs available. Please create a program first." });
      return;
    }
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (batchId: string) => {
    setIsSubmitting(true);
    try {
      await batchService.deleteBatch(batchId);
      await fetchInitialData();
      setSelectedBatchIds(prev => prev.filter(id => id !== batchId));
      toast({ title: "Batch Deleted", description: "The batch has been successfully deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete batch." });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formName.trim() || !formProgramId || !formStartAcademicYear) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name, Program, and Start Academic Year are required."});
      return;
    }
    if (formStartAcademicYear < 1900 || formStartAcademicYear > new Date().getFullYear() + 10) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid Start Academic Year." });
        return;
    }
    if (formEndAcademicYear && (formEndAcademicYear < formStartAcademicYear || formEndAcademicYear > formStartAcademicYear + 10)) {
        toast({ variant: "destructive", title: "Validation Error", description: "End Academic Year must be after Start Year and within a reasonable range." });
        return;
    }
    if (formMaxIntake !== undefined && (isNaN(formMaxIntake) || formMaxIntake < 0)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Max Intake must be a non-negative number." });
        return;
    }

    // Check if reducing max intake below current enrollment (when editing)
    if (currentBatch && currentBatch.id && formMaxIntake !== undefined) {
        const currentEnrollment = students.filter(s => s.batchId === currentBatch.id).length;
        if (formMaxIntake < currentEnrollment) {
            toast({ 
                variant: "destructive", 
                title: "Validation Error", 
                description: `Cannot set max intake to ${formMaxIntake}. This batch currently has ${currentEnrollment} enrolled students.` 
            });
            return;
        }
    }

    setIsSubmitting(true);
    
    const batchData: Omit<Batch, 'id' | 'createdAt' | 'updatedAt'> = { 
      name: formName.trim(),
      programId: formProgramId,
      startAcademicYear: Number(formStartAcademicYear),
      endAcademicYear: formEndAcademicYear ? Number(formEndAcademicYear) : undefined,
      maxIntake: formMaxIntake ? Number(formMaxIntake) : undefined,
      status: formStatus,
    };

    try {
      if (currentBatch && currentBatch.id) {
        await batchService.updateBatch(currentBatch.id, batchData);
        toast({ title: "Batch Updated", description: "The batch has been successfully updated." });
      } else {
        await batchService.createBatch(batchData);
        toast({ title: "Batch Created", description: "The new batch has been successfully created." });
      }
      await fetchInitialData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message || "Could not save batch." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
  };

  const handleImportBatches = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
     if (programs.length === 0) {
      toast({ variant: "destructive", title: "Import Error", description: "No programs loaded. Cannot map program IDs." });
      return;
    }

    setIsSubmitting(true);
    try {
        const result = await batchService.importBatches(selectedFile, programs);
        await fetchInitialData();
        toast({ title: "Import Successful", description: `${result.newCount} batches added, ${result.updatedCount} updated. Skipped: ${result.skippedCount}`});
        if (result.errors && result.errors.length > 0) {
          result.errors.slice(0, 3).forEach((err: unknown) => {
            const error = err as { row?: number; message?: string };
            toast({ variant: "destructive", title: `Import Warning (Row ${error.row || 'unknown'})`, description: error.message || 'Unknown error' });
          });
        }
    } catch (error: unknown) {
        console.error("Error processing CSV file:", error);
        const errorMessage = error instanceof Error ? error.message : "Could not process the CSV file.";
        toast({ variant: "destructive", title: "Import Failed", description: errorMessage });
    } finally {
        setIsSubmitting(false); setSelectedFile(null); 
        const fileInput = document.getElementById('csvImportBatch') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }
  };

  const handleExportBatches = () => {
    if (filteredAndSortedBatches.length === 0) {
      toast({ title: "Export Canceled", description: "No batches to export (check filters)." });
      return;
    }
    const header = ['id', 'name', 'programId', 'programName', 'programCode', 'startAcademicYear', 'endAcademicYear', 'maxIntake', 'status'];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedBatches.map(b => {
        const prog = programs.find(p => p.id === b.programId);
        return [
          b.id, `"${b.name.replace(/"/g, '""')}"`,
          b.programId, 
          `"${(prog?.name || "").replace(/"/g, '""')}"`,
          `"${(prog?.code || "").replace(/"/g, '""')}"`,
          b.startAcademicYear, b.endAcademicYear || "", b.maxIntake || "", b.status
        ].join(',');
      })
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "batches_export.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Batches exported to batches_export.csv" });
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,name,programId,programName,programCode,startAcademicYear,endAcademicYear,maxIntake,status
batch_s1,2024-2027,prog1,"Diploma in Computer Engg","DCE",2024,2027,60,upcoming
,2023-2026,prog1,"Diploma in Computer Engg","DCE",2023,2026,60,active
`; 
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_batches_import.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_batches_import.csv downloaded." });
  };

  const handleAutoCreateBatches = async () => {
    if (programs.length === 0) {
      toast({ variant: "destructive", title: "No Programs", description: "No programs found. Please create programs first." });
      return;
    }
    if (students.length === 0) {
      toast({ variant: "destructive", title: "No Students", description: "No students found. Cannot create semester-based batches." });
      return;
    }

    setIsAutoCreating(true);
    
    try {
      let createdCount = 0;
      let skippedCount = 0;
      let assignedStudentCount = 0;
      const createdBatches: string[] = [];

      // Group students by program and current semester
      const studentsByProgramAndSemester = new Map<string, Map<number, Student[]>>();
      
      students.forEach(student => {
        if (!student.programId || !student.currentSemester) return;
        
        if (!studentsByProgramAndSemester.has(student.programId)) {
          studentsByProgramAndSemester.set(student.programId, new Map());
        }
        
        const programMap = studentsByProgramAndSemester.get(student.programId)!;
        if (!programMap.has(student.currentSemester)) {
          programMap.set(student.currentSemester, []);
        }
        
        programMap.get(student.currentSemester)!.push(student);
      });

      // Create batches for each program-semester combination
      for (const [programId, semesterMap] of studentsByProgramAndSemester) {
        const program = programs.find(p => p.id === programId);
        if (!program) continue;

        for (const [semester, studentsInSemester] of semesterMap) {
          // For active students, create semester-based batches like EC1, EC3, EC5
          if (studentsInSemester.some(s => s.status === 'active')) {
            const batchName = `${program.code}${semester}`;
            
            // Check if batch already exists
            const existingBatch = batches.find(b => 
              b.name === batchName && b.programId === programId
            );
            
            if (existingBatch) {
              skippedCount++;
              continue;
            }

            // Determine academic year based on enrollment numbers or current year
            let startAcademicYear = new Date().getFullYear();
            
            // Try to extract admission year from enrollment numbers (like 246260311002 -> 24)
            const firstStudent = studentsInSemester[0];
            if (firstStudent.enrollmentNumber && firstStudent.enrollmentNumber.length >= 2) {
              const yearPrefix = firstStudent.enrollmentNumber.substring(0, 2);
              const admissionYear = parseInt(yearPrefix);
              if (!isNaN(admissionYear)) {
                // Convert 2-digit year to 4-digit (24 -> 2024)
                startAcademicYear = admissionYear < 50 ? 2000 + admissionYear : 1900 + admissionYear;
              }
            }

            // Get intake capacity for semester-based batches (use current year or program capacity)
            let maxIntakeCapacity = 60; // Default fallback
            
            // Try range-based capacity first
            const currentYear = new Date().getFullYear();
            const rangeCapacity = getIntakeCapacityForYear(program.intakeCapacityRanges, currentYear);
            if (rangeCapacity) {
              maxIntakeCapacity = rangeCapacity;
            } else if (program.currentIntakeCapacity) {
              maxIntakeCapacity = program.currentIntakeCapacity;
            } else if (program.yearlyIntakeCapacities?.[currentYear]) {
              maxIntakeCapacity = program.yearlyIntakeCapacities[currentYear];
            } else if (program.admissionCapacity) {
              maxIntakeCapacity = program.admissionCapacity;
            }

            const batchData: Omit<Batch, 'id'> = {
              name: batchName,
              programId: programId,
              startAcademicYear: startAcademicYear,
              endAcademicYear: startAcademicYear + 3, // Diploma is 3 years
              maxIntake: Math.max(maxIntakeCapacity, studentsInSemester.length), // At least current enrollment or official capacity
              status: 'active' as BatchStatus
            };

            const newBatch = await batchService.createBatch(batchData);
            createdCount++;
            createdBatches.push(batchName);
            
            // Auto-assign students to the created batch
            const studentsToAssign = studentsInSemester.filter(s => s.status === 'active');
            for (const student of studentsToAssign) {
              try {
                await studentService.updateStudent(student.id, { batchId: newBatch.id });
                assignedStudentCount++;
              } catch (error) {
                console.error(`Failed to assign student ${student.enrollmentNumber} to batch ${batchName}:`, error);
              }
            }
          }
        }
      }

      // Also create batches for graduated students based on convocation year or admission year
      const graduatedStudents = students.filter(s => s.status === 'graduated');
      const graduatedByProgramAndYear = new Map<string, Map<number, Student[]>>();
      
      graduatedStudents.forEach(student => {
        if (!student.programId) return;
        
        // Use convocation year if available, otherwise calculate from admission year
        let batchYear = student.convocationYear;
        if (!batchYear && student.enrollmentNumber && student.enrollmentNumber.length >= 2) {
          const yearPrefix = student.enrollmentNumber.substring(0, 2);
          const admissionYear = parseInt(yearPrefix);
          if (!isNaN(admissionYear)) {
            const fullAdmissionYear = admissionYear < 50 ? 2000 + admissionYear : 1900 + admissionYear;
            batchYear = fullAdmissionYear + 3; // Diploma completion year
          }
        }
        
        if (!batchYear) return;
        
        if (!graduatedByProgramAndYear.has(student.programId)) {
          graduatedByProgramAndYear.set(student.programId, new Map());
        }
        
        const programMap = graduatedByProgramAndYear.get(student.programId)!;
        if (!programMap.has(batchYear)) {
          programMap.set(batchYear, []);
        }
        
        programMap.get(batchYear)!.push(student);
      });

      // Create batches for graduated students
      for (const [programId, yearMap] of graduatedByProgramAndYear) {
        const program = programs.find(p => p.id === programId);
        if (!program) continue;

        for (const [graduationYear, graduatedStudents] of yearMap) {
          const batchName = `${program.code}-${graduationYear}`;
          
          // Check if batch already exists
          const existingBatch = batches.find(b => 
            b.name === batchName && b.programId === programId
          );
          
          if (existingBatch) {
            skippedCount++;
            continue;
          }

          // Get intake capacity for graduated batch (use admission year capacity)
          const admissionYear = graduationYear - 3; // Diploma is 3 years
          let maxIntakeCapacity = graduatedStudents.length; // Default to actual graduated count
          
          // Try range-based capacity first for the admission year
          const rangeCapacity = getIntakeCapacityForYear(program.intakeCapacityRanges, admissionYear);
          if (rangeCapacity) {
            maxIntakeCapacity = Math.max(rangeCapacity, graduatedStudents.length);
          } else if (program.yearlyIntakeCapacities?.[admissionYear]) {
            maxIntakeCapacity = Math.max(program.yearlyIntakeCapacities[admissionYear], graduatedStudents.length);
          } else if (program.currentIntakeCapacity) {
            maxIntakeCapacity = Math.max(program.currentIntakeCapacity, graduatedStudents.length);
          } else if (program.admissionCapacity) {
            maxIntakeCapacity = Math.max(program.admissionCapacity, graduatedStudents.length);
          }

          const batchData: Omit<Batch, 'id'> = {
            name: batchName,
            programId: programId,
            startAcademicYear: admissionYear,
            endAcademicYear: graduationYear,
            maxIntake: maxIntakeCapacity,
            status: 'completed' as BatchStatus
          };

          const newBatch = await batchService.createBatch(batchData);
          createdCount++;
          createdBatches.push(batchName);
          
          // Auto-assign graduated students to the created batch
          for (const student of graduatedStudents) {
            try {
              await studentService.updateStudent(student.id, { batchId: newBatch.id });
              assignedStudentCount++;
            } catch (error) {
              console.error(`Failed to assign graduated student ${student.enrollmentNumber} to batch ${batchName}:`, error);
            }
          }
        }
      }

      await fetchInitialData();
      
      if (createdCount > 0) {
        toast({ 
          title: "Auto-Create Successful", 
          description: `Created ${createdCount} batches and assigned ${assignedStudentCount} students. Skipped ${skippedCount} existing batches.` 
        });
      } else {
        toast({ 
          title: "No Batches Created", 
          description: `All ${skippedCount} batches already exist or no eligible students found.` 
        });
      }
      
    } catch (error) {
      console.error("Error auto-creating batches:", error);
      toast({ 
        variant: "destructive", 
        title: "Auto-Create Failed", 
        description: (error as Error).message || "Could not auto-create batches." 
      });
    } finally {
      setIsAutoCreating(false);
    }
  };

  const handleAutoCreateBatchesByEnrollment = async () => {
    if (programs.length === 0) {
      toast({ variant: "destructive", title: "No Programs", description: "No programs found. Please create programs first." });
      return;
    }
    if (students.length === 0) {
      toast({ variant: "destructive", title: "No Students", description: "No students found. Cannot create enrollment-based batches." });
      return;
    }
    setIsAutoCreating(true);
    
    try {
      let createdCount = 0;
      let skippedCount = 0;
      let assignedStudentCount = 0;
      const createdBatches: string[] = [];

      // Extract admission year and program from enrollment numbers
      const parseEnrollmentNumber = (enrollmentNumber: string) => {
        if (enrollmentNumber.length < 10) return null;
        
        const yearPrefix = enrollmentNumber.substring(0, 2);
        const admissionYear = parseInt(yearPrefix);
        const fullAdmissionYear = admissionYear < 50 ? 2000 + admissionYear : 1900 + admissionYear;
        
        return { admissionYear: fullAdmissionYear };
      };

      // Group students by program and admission year
      const studentsByProgramAndYear = new Map<string, Map<number, Student[]>>();
      
      students.forEach(student => {
        if (!student.programId || !student.enrollmentNumber) return;
        
        const parsedData = parseEnrollmentNumber(student.enrollmentNumber);
        if (!parsedData) return;
        
        if (!studentsByProgramAndYear.has(student.programId)) {
          studentsByProgramAndYear.set(student.programId, new Map());
        }
        
        const programMap = studentsByProgramAndYear.get(student.programId)!;
        if (!programMap.has(parsedData.admissionYear)) {
          programMap.set(parsedData.admissionYear, []);
        }
        
        programMap.get(parsedData.admissionYear)!.push(student);
      });

      // Create batches for each program-year combination
      for (const [programId, yearMap] of studentsByProgramAndYear) {
        const program = programs.find(p => p.id === programId);
        if (!program) continue;

        for (const [admissionYear, studentsInYear] of yearMap) {
          // Create batch name like "EC-2024", "ICT-2023"
          const batchName = `${program.code}-${admissionYear}`;
          
          // Check if batch already exists
          const existingBatch = batches.find(b => 
            b.name === batchName && b.programId === programId
          );
          
          if (existingBatch) {
            skippedCount++;
            continue;
          }

          // Determine batch status based on current year and expected completion
          const currentYear = new Date().getFullYear();
          const expectedCompletionYear = admissionYear + 3; // Diploma is 3 years
          const batchStatus: BatchStatus = currentYear >= expectedCompletionYear ? 'completed' : 'active';

          // Get intake capacity for the admission year, fallback to current or legacy capacity
          let maxIntakeCapacity = 60; // Default fallback
          
          // Try range-based capacity first for the admission year
          const rangeCapacity = getIntakeCapacityForYear(program.intakeCapacityRanges, admissionYear);
          if (rangeCapacity) {
            maxIntakeCapacity = rangeCapacity;
          } else if (program.yearlyIntakeCapacities?.[admissionYear]) {
            maxIntakeCapacity = program.yearlyIntakeCapacities[admissionYear];
          } else if (program.currentIntakeCapacity) {
            maxIntakeCapacity = program.currentIntakeCapacity;
          } else if (program.admissionCapacity) {
            maxIntakeCapacity = program.admissionCapacity;
          }
          
          const batchData: Omit<Batch, 'id'> = {
            name: batchName,
            programId: programId,
            startAcademicYear: admissionYear,
            endAcademicYear: expectedCompletionYear,
            maxIntake: Math.max(maxIntakeCapacity, studentsInYear.length), // At least current enrollment or official capacity
            status: batchStatus
          };

          const newBatch = await batchService.createBatch(batchData);
          createdCount++;
          createdBatches.push(batchName);
          
          // Auto-assign students to the created batch
          for (const student of studentsInYear) {
            try {
              await studentService.updateStudent(student.id, { batchId: newBatch.id });
              assignedStudentCount++;
            } catch (error) {
              console.error(`Failed to assign student ${student.enrollmentNumber} to batch ${batchName}:`, error);
            }
          }
        }
      }

      await fetchInitialData();
      
      if (createdCount > 0) {
        toast({ 
          title: "Auto-Create Successful", 
          description: `Created ${createdCount} enrollment-based batches and assigned ${assignedStudentCount} students. Skipped ${skippedCount} existing batches.` 
        });
      } else {
        toast({ 
          title: "No Batches Created", 
          description: `All ${skippedCount} batches already exist or no eligible students found.` 
        });
      }
      
    } catch (error) {
      console.error("Error auto-creating enrollment-based batches:", error);
      toast({ 
        variant: "destructive", 
        title: "Auto-Create Failed", 
        description: (error as Error).message || "Could not auto-create enrollment-based batches." 
      });
    } finally {
      setIsAutoCreating(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field); setSortDirection('asc');
    }
    setCurrentPage(1); 
  };
  
  const filteredAndSortedBatches = useMemo(() => {
    let result = [...batches];

    if (searchTerm) {
      result = result.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.startAcademicYear.toString().includes(searchTerm) ||
        (b.endAcademicYear && b.endAcademicYear.toString().includes(searchTerm))
      );
    }
    if (filterStatusVal !== 'all') {
      result = result.filter(b => b.status === filterStatusVal);
    }
    if (filterProgramVal !== 'all') {
      result = result.filter(b => b.programId === filterProgramVal);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: unknown = a[sortField as keyof Batch];
        let valB: unknown = b[sortField as keyof Batch];
        
        const numericFields: (keyof Batch)[] = ['startAcademicYear', 'endAcademicYear', 'maxIntake'];
        if (numericFields.includes(sortField as keyof Batch)) {
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
  }, [batches, searchTerm, filterStatusVal, filterProgramVal, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedBatches.length / itemsPerPage);
  const paginatedBatches = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedBatches.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedBatches, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterStatusVal, filterProgramVal, itemsPerPage]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedBatchIds(checked === true ? paginatedBatches.map(c => c.id) : []);
  };

  const handleSelectBatch = (batchId: string, checked: boolean) => {
    setSelectedBatchIds(prev => checked ? [...prev, batchId] : prev.filter(id => id !== batchId));
  };

  const handleDeleteSelected = async () => {
    if (selectedBatchIds.length === 0) {
      toast({ variant: "destructive", title: "No Batches Selected", description: "Please select batches to delete." });
      return;
    }
    setIsSubmitting(true);
    try {
        for(const id of selectedBatchIds) {
            await batchService.deleteBatch(id);
        }
        await fetchInitialData();
        toast({ title: "Batches Deleted", description: `${selectedBatchIds.length} batch(es) have been successfully deleted.` });
        setSelectedBatchIds([]);
    } catch (error) {
        toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete selected batches."});
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedBatches.length > 0 && paginatedBatches.every(c => selectedBatchIds.includes(c.id));
  const isSomeSelectedOnPage = paginatedBatches.some(c => selectedBatchIds.includes(c.id)) && !isAllSelectedOnPage;

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
              <CalendarRange className="h-6 w-6" />
              Batch Management
            </CardTitle>
            <CardDescription>
              Manage academic batches, their academic years, associated programs, and status.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto" disabled={programs.length === 0}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Batch
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{currentBatch?.id ? "Edit Batch" : "Add New Batch"}</DialogTitle>
                  <DialogDescription>
                    {currentBatch?.id ? "Modify batch details." : "Create a new batch record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div><Label htmlFor="name">Batch Name *</Label><Input id="name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., 2024-2027" disabled={isSubmitting} required /></div>
                  
                  <div>
                    <Label htmlFor="programId">Program *</Label>
                    <Select value={formProgramId} onValueChange={setFormProgramId} disabled={isSubmitting || programs.length === 0} required>
                      <SelectTrigger id="programId"><SelectValue placeholder="Select Program" /></SelectTrigger>
                      <SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="startAcademicYear">Start Academic Year *</Label><Input id="startAcademicYear" type="number" value={formStartAcademicYear || ''} onChange={e => setFormStartAcademicYear(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 2024" disabled={isSubmitting} required /></div>
                    <div><Label htmlFor="endAcademicYear">End Academic Year</Label><Input id="endAcademicYear" type="number" value={formEndAcademicYear || ''} onChange={e => setFormEndAcademicYear(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 2027" disabled={isSubmitting} /></div>
                  </div>

                  <div><Label htmlFor="maxIntake">Max Intake</Label><Input id="maxIntake" type="number" value={formMaxIntake || ''} onChange={e => setFormMaxIntake(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 60" disabled={isSubmitting} /></div>
                  
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formStatus} onValueChange={(value) => setFormStatus(value as BatchStatus)} disabled={isSubmitting} required>
                      <SelectTrigger id="status"><SelectValue placeholder="Select Status"/></SelectTrigger>
                      <SelectContent>{BATCH_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  
                  <DialogFooter className="mt-4">
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{currentBatch?.id ? "Save Changes" : "Create Batch"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <Select value={batchCreationMethod} onValueChange={(value: 'semester' | 'enrollment') => setBatchCreationMethod(value)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semester">By Current Semester</SelectItem>
                    <SelectItem value="enrollment">By Enrollment Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={batchCreationMethod === 'semester' ? handleAutoCreateBatches : handleAutoCreateBatchesByEnrollment} 
                  variant="secondary" 
                  className="w-full sm:w-auto"
                  disabled={programs.length === 0 || students.length === 0 || isAutoCreating}
                >
                  {isAutoCreating ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-5 w-5" />
                  )}
                  Auto-Create Batches
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {batchCreationMethod === 'semester' 
                  ? "Creates batches like 'EC1', 'EC3' based on current semester (e.g., active students in semester 1, 3, etc.)"
                  : "Creates batches like 'EC-2024', 'ICT-2023' based on admission year from enrollment numbers (more reliable data)"}
              </p>
            </div>
            <Button onClick={handleExportBatches} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4 dark:border-gray-700">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Batches from CSV</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportBatch" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportBatches} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>} Import
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
                </Button>
                <p className="text-xs text-muted-foreground">
                  CSV fields: id (opt), name, programId OR (programName & programCode), startAcademicYear, endAcademicYear, maxIntake, status.
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border rounded-lg dark:border-gray-700">
            <div>
              <Label htmlFor="searchBatch">Search Batches</Label>
              <div className="relative">
                 <Input id="searchBatch" placeholder="Name, year..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-8"/>
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterProgram">Filter by Program</Label>
              <Select value={filterProgramVal} onValueChange={setFilterProgramVal} disabled={programs.length === 0}>
                <SelectTrigger id="filterProgram"><SelectValue placeholder="All Programs"/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStatusBatch">Filter by Status</Label>
              <Select value={filterStatusVal} onValueChange={(value) => setFilterStatusVal(value as BatchStatus | 'all')}>
                <SelectTrigger id="filterStatusBatch"><SelectValue placeholder="All Statuses"/></SelectTrigger>
                <SelectContent>{[{value: 'all', label: 'All Statuses'} as {value: BatchStatus | 'all', label: string}, ...BATCH_STATUS_OPTIONS].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {selectedBatchIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedBatchIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedBatchIds.length} batch(es) selected.
                </span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[50px]"><Checkbox checked={isAllSelectedOnPage || (paginatedBatches.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)} onCheckedChange={(checkedState) => handleSelectAll(!!checkedState)} aria-label="Select all batches on this page"/></TableHead>
                <SortableTableHeader field="name" label="Batch Name" />
                <SortableTableHeader field="programId" label="Program" />
                <SortableTableHeader field="startAcademicYear" label="Start Year" />
                <SortableTableHeader field="endAcademicYear" label="End Year" />
                <SortableTableHeader field="maxIntake" label="Enrollment" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead className="text-right w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBatches.map((batch) => (
                <TableRow key={batch.id} data-state={selectedBatchIds.includes(batch.id) ? "selected" : undefined}>
                  <TableCell><Checkbox checked={selectedBatchIds.includes(batch.id)} onCheckedChange={(checked) => handleSelectBatch(batch.id, !!checked)} aria-labelledby={`batch-name-${batch.id}`}/></TableCell>
                  <TableCell id={`batch-name-${batch.id}`} className="font-medium">{batch.name}</TableCell>
                  <TableCell>{programs.find(p => p.id === batch.programId)?.name || 'N/A'}</TableCell>
                  <TableCell>{batch.startAcademicYear}</TableCell>
                  <TableCell>{batch.endAcademicYear || '-'}</TableCell>
                  <TableCell>
                    {(() => {
                      const enrolledCount = students.filter(s => s.batchId === batch.id).length;
                      const maxIntake = batch.maxIntake;
                      if (maxIntake) {
                        const percentage = Math.round((enrolledCount / maxIntake) * 100);
                        const isOverCapacity = enrolledCount > maxIntake;
                        return (
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${
                              isOverCapacity ? 'text-red-600' : enrolledCount === maxIntake ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {enrolledCount} / {maxIntake}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {percentage}% filled
                            </span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{enrolledCount}</span>
                            <span className="text-xs text-muted-foreground">No limit</span>
                          </div>
                        );
                      }
                    })()} 
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        batch.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : batch.status === 'upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : batch.status === 'completed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' /* inactive */
                    }`}>
                      {BATCH_STATUS_OPTIONS.find(s => s.value === batch.status)?.label || batch.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="icon" onClick={() => handleView(batch)} disabled={isSubmitting}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Batch</span>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleEdit(batch)} disabled={isSubmitting}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit Batch</span>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(batch.id)} disabled={isSubmitting}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Batch</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedBatches.length === 0 && (
                 <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No batches found. Adjust filters or add a new batch.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedBatches.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedBatches.length): 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedBatches.length)} of {filteredAndSortedBatches.length} batches.
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

      {/* View Batch Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
            <DialogDescription>
              View detailed information about the batch.
            </DialogDescription>
          </DialogHeader>
          {viewBatch && (
            <div className="grid gap-6 py-4">
              <div className="grid gap-4">
                <h4 className="font-semibold text-primary border-b pb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Batch Name</Label>
                    <p className="text-sm">{viewBatch.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <p className="text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        viewBatch.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : viewBatch.status === 'upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : viewBatch.status === 'completed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {BATCH_STATUS_OPTIONS.find(s => s.value === viewBatch.status)?.label || viewBatch.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <h4 className="font-semibold text-primary border-b pb-2">Academic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Start Academic Year</Label>
                    <p className="text-sm">{viewBatch.startAcademicYear}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">End Academic Year</Label>
                    <p className="text-sm">{viewBatch.endAcademicYear || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Max Intake</Label>
                    <p className="text-sm">{viewBatch.maxIntake || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <h4 className="font-semibold text-primary border-b pb-2">Program Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Program ID</Label>
                    <p className="text-sm font-mono">{viewBatch.programId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Program Name</Label>
                    <p className="text-sm">{programs.find(p => p.id === viewBatch.programId)?.name || 'Not found'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Program Code</Label>
                    <p className="text-sm">{programs.find(p => p.id === viewBatch.programId)?.code || 'Not found'}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <h4 className="font-semibold text-primary border-b pb-2">System Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Batch ID</Label>
                    <p className="text-sm font-mono">{viewBatch.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                    <p className="text-sm">{viewBatch.createdAt ? new Date(viewBatch.createdAt).toLocaleString() : 'Not available'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p className="text-sm">{viewBatch.updatedAt ? new Date(viewBatch.updatedAt).toLocaleString() : 'Not available'}</p>
                  </div>
                </div>
              </div>

              {/* Assigned Students */}
              <div className="grid gap-4">
                <h4 className="font-semibold text-primary border-b pb-2">Assigned Students</h4>
                {(() => {
                  const assignedStudents = students.filter(s => s.batchId === viewBatch.id);
                  if (assignedStudents.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground">No students assigned to this batch.</p>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">
                          Total Students: {assignedStudents.length}
                          {viewBatch.maxIntake && ` / ${viewBatch.maxIntake} (${Math.round((assignedStudents.length / viewBatch.maxIntake) * 100)}% filled)`}
                        </p>
                        {viewBatch.maxIntake && assignedStudents.length > viewBatch.maxIntake && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                            Over Capacity
                          </span>
                        )}
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {assignedStudents.map(student => (
                          <div key={student.id} className="flex justify-between items-center p-2 bg-muted/50 rounded text-xs">
                            <div>
                              <span className="font-medium">{student.enrollmentNumber}</span>
                              <span className="ml-2">
                                {[student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ') || student.fullNameGtuFormat}
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              Sem {student.currentSemester}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}