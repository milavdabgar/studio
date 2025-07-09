"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, CheckSquare, UserCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import type { CourseOffering, Student, AttendanceRecord, AttendanceStatus } from '@/types/entities';
// Mock services - replace with actual API calls
import { studentService } from '@/lib/api/students'; // Assuming this exists
import { courseService } from '@/lib/api/courses'; // Assuming this exists
import { batchService } from '@/lib/api/batches'; // Assuming this exists
import { programService } from '@/lib/api/programs'; // Assuming this exists
import { attendanceService } from '@/lib/api/attendance';


// MOCK DATA - Replace with API calls
const MOCK_COURSE_OFFERINGS: (CourseOffering & { courseName?: string, batchName?: string })[] = [
  { id: "co1", courseId: "crs1", batchId: "batch1", academicYear: "2023-24", semester: 1, facultyIds: ["fac1"], status: "ongoing", courseName: "Intro to Programming", batchName: "CS Batch A" },
  { id: "co2", courseId: "crs2", batchId: "batch2", academicYear: "2023-24", semester: 3, facultyIds: ["fac1"], status: "ongoing", courseName: "Data Structures", batchName: "CS Batch B" },
];

export default function MarkAttendancePage() {
  const [selectedCourseOffering, setSelectedCourseOffering] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courseOfferings, setCourseOfferings] = useState<(CourseOffering & { courseName?: string, batchName?: string, programName?: string })[]>([]);


  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // TODO: Fetch actual course offerings assigned to the logged-in faculty
        // For now, using mock data with added details
        const courses = await courseService.getAllCourses();
        const batches = await batchService.getAllBatches();
        const programs = await programService.getAllPrograms();

        const enrichedOfferings = MOCK_COURSE_OFFERINGS.map(co => {
            const course = courses.find(c => c.id === co.courseId);
            const batch = batches.find(b => b.id === co.batchId);
            const program = batch ? programs.find(p => p.id === batch.programId) : undefined;
            return {
                ...co,
                courseName: course?.subjectName || 'Unknown Course',
                batchName: batch?.name || 'Unknown Batch',
                programName: program?.name || 'Unknown Program',
            }
        });
        setCourseOfferings(enrichedOfferings);
        if (enrichedOfferings.length > 0) {
          setSelectedCourseOffering(enrichedOfferings[0].id);
        }
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to load course offerings." });
      }
      setIsLoading(false);
    };
    fetchInitialData();
  }, [toast]);

  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      if (!selectedCourseOffering || !selectedDate) {
        setStudents([]);
        setAttendanceData({});
        return;
      }
      setIsLoading(true);
      try {
        const offering = courseOfferings.find(co => co.id === selectedCourseOffering);
        if (!offering || !offering.batchId) {
             setStudents([]); setAttendanceData({}); setIsLoading(false); return;
        }
        // Fetch students for the batch of the selected course offering
        // This is a simplified fetch; in reality, you'd filter students by batchId directly via API if possible
        const allStudents = await studentService.getAllStudents();
        const batchStudents = allStudents.filter(s => s.batchId === offering.batchId && s.status === 'active');
        setStudents(batchStudents);

        // Fetch existing attendance for this date and offering
        const existingRecords = await attendanceService.getAttendanceRecords({
          courseOfferingId: selectedCourseOffering,
          date: format(selectedDate, "yyyy-MM-dd"),
        });
        
        const newAttendanceData: Record<string, AttendanceStatus> = {};
        batchStudents.forEach(student => {
          const existingRecord = existingRecords.find(r => r.studentId === student.id);
          newAttendanceData[student.id] = existingRecord ? existingRecord.status : 'present'; // Default to present
        });
        setAttendanceData(newAttendanceData);

      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to load students or attendance." });
        setStudents([]);
        setAttendanceData({});
      }
      setIsLoading(false);
    };
    fetchStudentsAndAttendance();
  }, [selectedCourseOffering, selectedDate, toast, courseOfferings]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCourseOffering || !selectedDate || students.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please select course, date, and ensure students are loaded." });
      return;
    }
    setIsSubmitting(true);

    const recordsToSubmit: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>[] = students.map(student => ({
      studentId: student.id,
      courseOfferingId: selectedCourseOffering,
      date: format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"), 
      status: attendanceData[student.id] || 'present', // Default to present if somehow missing
      markedBy: "faculty_user_id_placeholder", // TODO: Replace with actual logged-in faculty ID
      remarks: "" 
    }));

    try {
      await attendanceService.markAttendance(recordsToSubmit);
      toast({ title: "Success", description: "Attendance marked successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Submission Failed", description: (error as Error).message || "Could not save attendance." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const markAll = (status: AttendanceStatus) => {
    const newAttendanceData: Record<string, AttendanceStatus> = {};
    students.forEach(student => {
      newAttendanceData[student.id] = status;
    });
    setAttendanceData(newAttendanceData);
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <UserCheck className="h-6 w-6" /> Mark Attendance
          </CardTitle>
          <CardDescription>Select a course offering and date to mark student attendance.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="courseOffering">Course Offering</Label>
                <Select value={selectedCourseOffering} onValueChange={setSelectedCourseOffering} disabled={isLoading || courseOfferings.length === 0}>
                  <SelectTrigger id="courseOffering">
                    <SelectValue placeholder="Select Course Offering" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseOfferings.map(co => (
                      <SelectItem key={co.id} value={co.id}>
                        {co.courseName} ({co.batchName} - {co.programName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="attendanceDate">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus disabled={(date) => date > new Date() || date < new Date("2000-01-01")} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {isLoading && !isSubmitting && <div className="flex justify-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading students...</span></div>}

            {students.length > 0 && !isLoading && (
              <>
                <div className="flex justify-end gap-2 mb-4">
                    <Button type="button" variant="outline" size="sm" onClick={() => markAll('present')}>Mark All Present</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => markAll('absent')}>Mark All Absent</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Enrollment</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead className="w-[300px] text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(student => (
                      <TableRow key={student.id}>
                        <TableCell>{student.enrollmentNumber}</TableCell>
                        <TableCell>{student.firstName} {student.lastName}</TableCell>
                        <TableCell className="text-center">
                          <RadioGroup
                            value={attendanceData[student.id] || 'present'}
                            onValueChange={(value) => handleStatusChange(student.id, value as AttendanceStatus)}
                            className="flex justify-around"
                          >
                            {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map(statusOption => (
                              <div key={statusOption} className="flex items-center space-x-1">
                                <RadioGroupItem value={statusOption} id={`${student.id}-${statusOption}`} />
                                <Label htmlFor={`${student.id}-${statusOption}`} className="text-xs capitalize cursor-pointer">{statusOption}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
            {students.length === 0 && selectedCourseOffering && selectedDate && !isLoading && (
                 <p className="text-center text-muted-foreground py-4">No active students found for the selected batch or an error occurred.</p>
            )}


            <CardFooter className="mt-6 px-0">
              <Button type="submit" disabled={isSubmitting || isLoading || students.length === 0}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckSquare className="mr-2 h-4 w-4" />}
                Save Attendance
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
    