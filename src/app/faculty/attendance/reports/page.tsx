"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ListFilter, Download, Loader2, BarChart2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from "@/lib/utils";
import type { CourseOffering, Student, AttendanceRecord, Batch, Course, Program, Faculty } from '@/types/entities';
import { attendanceService } from '@/lib/api/attendance';
import { studentService } from '@/lib/api/students';
import { courseService } from '@/lib/api/courses';
import { batchService } from '@/lib/api/batches';
import { programService } from '@/lib/api/programs';
import { facultyService } from '@/lib/api/faculty';

// MOCK DATA for CourseOfferings - Replace with API calls
const MOCK_COURSE_OFFERINGS: (CourseOffering & { courseName?: string, batchName?: string, programName?: string })[] = [
  { id: "co_cs101_b2022_sem1_gpp", courseId: "course_cs101_dce_gpp", batchId: "batch_dce_2022_gpp", academicYear: "2023-24", semester: 1, facultyIds: ["user_faculty_cs01_gpp"], status: "ongoing", courseName: "Intro to Programming", batchName: "CS Batch 2022", programName: "DCE" },
  { id: "co_me101_b2023_sem1_gpp", courseId: "course_me101_dme_gpp", batchId: "batch_dme_2023_gpp", academicYear: "2023-24", semester: 1, facultyIds: ["user_faculty_me01_gpp"], status: "ongoing", courseName: "Mechanics", batchName: "ME Batch 2023", programName: "DME" },
];

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string; 
}

interface EnrichedAttendanceRecord extends AttendanceRecord {
  studentName?: string;
  studentEnrollment?: string;
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookiePart = parts.pop();
    if (cookiePart) {
        return cookiePart.split(';').shift();
    }
  }
  return undefined;
}

export default function AttendanceReportsPage() {
  const [user, setUser] = useState<UserCookie | null>(null);
  const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
  
  const [courseOfferings, setCourseOfferings] = useState<(CourseOffering & { courseName?: string, batchName?: string, programName?: string })[]>([]);
  const [selectedCourseOfferingId, setSelectedCourseOfferingId] = useState<string>("");
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  
  const [attendanceRecords, setAttendanceRecords] = useState<EnrichedAttendanceRecord[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch (error) { /* Handled by global layout */ }
    }
  }, []);

  useEffect(() => {
    if (!user || !user.id) return;
    const fetchFacultyAndOfferings = async () => {
      setIsLoading(true);
      try {
        const faculties = await facultyService.getAllFaculty();
        const facultyProfile = faculties.find(f => f.userId === user.id);
        setCurrentFaculty(facultyProfile || null);

        if (facultyProfile) {
            const courses = await courseService.getAllCourses();
            const batches = await batchService.getAllBatches();
            const programs = await programService.getAllPrograms();
            
            // Filter MOCK_COURSE_OFFERINGS for the current facultyId
            const facultyCOs = MOCK_COURSE_OFFERINGS
              .filter(co => co.facultyIds.includes(facultyProfile.id)) // Use facultyProfile.id
              .map(co => {
                const course = courses.find(c => c.id === co.courseId);
                const batch = batches.find(b => b.id === co.batchId);
                const program = batch ? programs.find(p => p.id === batch.programId) : undefined;
                return {
                  ...co,
                  courseName: course?.subjectName || 'Unknown Course',
                  batchName: batch?.name || 'Unknown Batch',
                  programName: program?.name || 'Unknown Program',
                };
              });
            setCourseOfferings(facultyCOs);
            if (facultyCOs.length > 0) {
              setSelectedCourseOfferingId(facultyCOs[0].id);
            } else {
                toast({title: "No Assigned Courses", description: "You are not assigned to any active course offerings."});
            }
        } else {
            toast({title: "Profile Error", description: "Faculty profile not found."});
        }
        
        const studentsData = await studentService.getAllStudents();
        setAllStudents(studentsData);

      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to load initial data." });
      }
      setIsLoading(false);
    };
    fetchFacultyAndOfferings();
  }, [user, toast]);

  useEffect(() => {
    if (!selectedCourseOfferingId || !dateRange.from || !dateRange.to) {
      setAttendanceRecords([]);
      return;
    }
    const fetchAttendance = async () => {
      setIsLoading(true);
      try {
        const records = await attendanceService.getAttendanceRecords({ 
          courseOfferingId: selectedCourseOfferingId,
          // Backend should handle date range filtering if possible, or filter client-side for now
        });
        
        // Client-side date filtering
        const filteredByDate = records.filter(r => {
            const recordDate = new Date(r.date);
            return recordDate >= dateRange.from! && recordDate <= dateRange.to!;
        });

        const enriched = filteredByDate.map(r => {
          const student = allStudents.find(s => s.id === r.studentId);
          return {
            ...r,
            studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
            studentEnrollment: student?.enrollmentNumber || 'N/A',
          };
        });
        setAttendanceRecords(enriched);
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to load attendance records." });
      }
      setIsLoading(false);
    };
    fetchAttendance();
  }, [selectedCourseOfferingId, dateRange, allStudents, toast]);

  const studentAttendanceSummary = useMemo(() => {
    const summary: Record<string, { studentName: string, enrollment: string, present: number, absent: number, late: number, excused: number, total: number, percentage: number }> = {};
    const offering = courseOfferings.find(co => co.id === selectedCourseOfferingId);
    if (!offering || !offering.batchId) return summary;

    const studentsInBatch = allStudents.filter(s => s.batchId === offering.batchId && s.status === 'active');

    studentsInBatch.forEach(student => {
      const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
      const counts = { present: 0, absent: 0, late: 0, excused: 0, total: studentRecords.length };
      studentRecords.forEach(r => counts[r.status]++);
      
      const effectivePresent = counts.present + (counts.late * 0.5) + counts.excused; // Example: late counts as half, excused counts as present
      const percentage = counts.total > 0 ? (effectivePresent / counts.total) * 100 : 0;

      summary[student.id] = {
        studentName: `${student.firstName} ${student.lastName}`,
        enrollment: student.enrollmentNumber,
        ...counts,
        percentage: parseFloat(percentage.toFixed(1)),
      };
    });
    return summary;
  }, [attendanceRecords, selectedCourseOfferingId, courseOfferings, allStudents]);

  const overallAttendancePercentage = useMemo(() => {
    const totalEffectivePresent = Object.values(studentAttendanceSummary).reduce((sum, s) => sum + (s.present + s.late * 0.5 + s.excused), 0);
    const totalPossible = Object.values(studentAttendanceSummary).reduce((sum, s) => sum + s.total, 0);
    return totalPossible > 0 ? parseFloat(((totalEffectivePresent / totalPossible) * 100).toFixed(1)) : 0;
  }, [studentAttendanceSummary]);

  const handleExport = () => {
    // Basic CSV export functionality
    if (Object.keys(studentAttendanceSummary).length === 0) {
      toast({ title: "No Data", description: "No attendance data to export for the current selection." });
      return;
    }
    const offering = courseOfferings.find(co => co.id === selectedCourseOfferingId);
    const header = "Enrollment,Student Name,Total Classes,Present,Absent,Late,Excused,Attendance %\n";
    const csvRows = Object.values(studentAttendanceSummary).map(s => 
      `${s.enrollment},"${s.studentName}",${s.total},${s.present},${s.absent},${s.late},${s.excused},${s.percentage}`
    ).join("\n");
    const csvString = header + csvRows;
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_report_${offering?.courseName?.replace(/\s+/g, '_') || 'course'}_${format(dateRange.from!, 'yyyyMMdd')}_${format(dateRange.to!, 'yyyyMMdd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Attendance report downloaded." });
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <BarChart2 className="h-6 w-6" /> Attendance Reports
          </CardTitle>
          <CardDescription>View and export attendance reports for your course offerings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="courseOfferingSelect">Course Offering</Label>
              <Select value={selectedCourseOfferingId} onValueChange={setSelectedCourseOfferingId} disabled={isLoading || courseOfferings.length === 0}>
                <SelectTrigger id="courseOfferingSelect"><SelectValue placeholder="Select Course" /></SelectTrigger>
                <SelectContent>
                  {courseOfferings.map(co => (
                    <SelectItem key={co.id} value={co.id}>{co.courseName} ({co.batchName})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateRangeFrom">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="dateRangeFrom" variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")} disabled={isLoading}>
                    <CalendarIcon className="mr-2 h-4 w-4" />{dateRange.from ? format(dateRange.from, "PPP") : <span>Pick start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateRange.from} onSelect={(date) => setDateRange(prev => ({...prev, from:date}))} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="dateRangeTo">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="dateRangeTo" variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")} disabled={isLoading}>
                    <CalendarIcon className="mr-2 h-4 w-4" />{dateRange.to ? format(dateRange.to, "PPP") : <span>Pick end date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateRange.to} onSelect={(date) => setDateRange(prev => ({...prev, to:date}))} initialFocus /></PopoverContent>
              </Popover>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : Object.keys(studentAttendanceSummary).length > 0 ? (
            <>
              <Card className="mb-4 bg-muted/40">
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary"/>Overall Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                    Selected Course Offering: <strong>{courseOfferings.find(co=>co.id === selectedCourseOfferingId)?.courseName}</strong>
                    <p>Overall Attendance: <span className={`font-bold ${overallAttendancePercentage >= 75 ? 'text-success' : 'text-destructive'}`}>{overallAttendancePercentage}%</span></p>
                    <Button onClick={handleExport} size="sm" className="mt-3"><Download className="mr-2 h-4 w-4" /> Export Summary CSV</Button>
                </CardContent>
              </Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enrollment No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Late</TableHead>
                    <TableHead className="text-center">Excused</TableHead>
                    <TableHead className="text-center">Attendance %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(studentAttendanceSummary).sort((a,b) => a.enrollment.localeCompare(b.enrollment)).map(summary => (
                    <TableRow key={summary.enrollment}>
                      <TableCell>{summary.enrollment}</TableCell>
                      <TableCell>{summary.studentName}</TableCell>
                      <TableCell className="text-center">{summary.total}</TableCell>
                      <TableCell className="text-center text-green-600">{summary.present}</TableCell>
                      <TableCell className="text-center text-red-600">{summary.absent}</TableCell>
                      <TableCell className="text-center text-yellow-600">{summary.late}</TableCell>
                      <TableCell className="text-center text-blue-600">{summary.excused}</TableCell>
                      <TableCell className={`text-center font-semibold ${summary.percentage >= 75 ? 'text-success' : 'text-destructive'}`}>{summary.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">No attendance records found for the selected criteria.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

