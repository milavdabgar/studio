"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarCheck, Loader2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AttendanceRecord, CourseOffering } from '@/types/entities';
import { attendanceService } from '@/lib/api/attendance';
import { studentService } from '@/lib/api/students';
import { courseService } from '@/lib/api/courses';
// Mock course offering service for now
// import { courseOfferingService } from '@/lib/api/courseOfferings'; 
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string; 
}

interface EnrichedAttendanceRecord extends AttendanceRecord {
  courseName?: string;
}

// Placeholder MOCK_COURSE_OFFERINGS if not fetching from API
const MOCK_COURSE_OFFERINGS: CourseOffering[] = [
    { id: "co_cs101_b2022_sem1_gpp", courseId: "course_cs101_dce_gpp", batchId: "batch_dce_2022_gpp", academicYear: "2023-24", semester: 1, facultyIds: ["user_faculty_cs01_gpp"], status: "ongoing", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "co_me101_b2023_sem1_gpp", courseId: "course_me101_dme_gpp", batchId: "batch_dme_2023_gpp", academicYear: "2023-24", semester: 1, facultyIds: ["user_faculty_me01_gpp"], status: "ongoing", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];


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

export default function StudentAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<EnrichedAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");

  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing auth cookie:', error);
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    } else {
        toast({ variant: "destructive", title: "Authentication Error", description: "User not logged in." });
    }
  }, [toast]);

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchStudentAndAttendanceData = async () => {
      setIsLoading(true);
      try {
        const allStudents = await studentService.getAllStudents();
        const studentProfile = allStudents.find(s => s.userId === user.id);

        if (studentProfile) {
          const records = await attendanceService.getAttendanceRecords({ studentId: studentProfile.id });
          const allCourses = await courseService.getAllCourses();
          
          // Enrich records with course names
          const enrichedRecords = records.map(record => {
            const courseOffering = MOCK_COURSE_OFFERINGS.find(co => co.id === record.courseOfferingId); // Using mock
            const course = allCourses.find(c => c.id === courseOffering?.courseId);
            return {
              ...record,
              courseName: course?.subjectName || "Unknown Course"
            };
          });
          setAttendanceRecords(enrichedRecords);
        } else {
          setAttendanceRecords([]);
          toast({ variant: "warning", title: "No Profile", description: "Student profile not found." });
        }
      } catch (error) {
        console.error('Error loading attendance:', error);
        toast({ variant: "destructive", title: "Error", description: "Could not load attendance data." });
      }
      setIsLoading(false);
    };

    fetchStudentAndAttendanceData();
  }, [user, toast]);
  
  const uniqueCourseNames = Array.from(new Set(attendanceRecords.map(r => r.courseName).filter(Boolean))) as string[];

  const filteredAttendanceRecords = selectedCourseFilter === "all" 
    ? attendanceRecords
    : attendanceRecords.filter(record => record.courseName === selectedCourseFilter);

  const attendanceSummary: Record<string, { present: number, absent: number, late: number, excused: number, total: number }> = {};
  filteredAttendanceRecords.forEach(record => {
    const courseKey = record.courseName || "Unknown Course";
    if (!attendanceSummary[courseKey]) {
      attendanceSummary[courseKey] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    }
    attendanceSummary[courseKey].total++;
    attendanceSummary[courseKey][record.status]++;
  });


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <CalendarCheck className="h-6 w-6" /> My Attendance
          </CardTitle>
          <CardDescription>View your attendance records and summary.</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No attendance records found.</p>
          ) : (
            <>
            <div className="mb-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <Label htmlFor="courseFilter" className="text-sm">Filter by Course:</Label>
                </div>
                <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
                    <SelectTrigger id="courseFilter" className="w-[250px]">
                    <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {uniqueCourseNames.map(courseName => (
                        <SelectItem key={courseName} value={courseName}>{courseName}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>

            {Object.keys(attendanceSummary).length > 0 && (
                <Card className="mb-6 bg-muted/30">
                    <CardHeader><CardTitle className="text-lg">Attendance Summary</CardTitle></CardHeader>
                    <CardContent>
                        {Object.entries(attendanceSummary).map(([course, summary]) => {
                            const percentage = summary.total > 0 ? ((summary.present + summary.late * 0.5 + summary.excused) / summary.total * 100).toFixed(1) : '0';
                            return (
                            <div key={course} className="mb-3 pb-3 border-b last:border-b-0 dark:border-gray-700">
                                <h4 className="font-semibold">{course}</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-sm">
                                    <p>Total: <span className="font-medium">{summary.total}</span></p>
                                    <p>Present: <span className="font-medium text-green-600">{summary.present}</span></p>
                                    <p>Absent: <span className="font-medium text-red-600">{summary.absent}</span></p>
                                    <p>Late: <span className="font-medium text-yellow-600">{summary.late}</span></p>
                                    <p>Excused: <span className="font-medium text-blue-600">{summary.excused}</span></p>
                                </div>
                                <p className="text-md font-semibold mt-1">Effective Attendance: <span className={parseFloat(percentage) >= 75 ? "text-success" : "text-destructive"}>{percentage}%</span></p>
                            </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}
              
              <h3 className="text-lg font-semibold mb-2 mt-4">Detailed Log</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marked By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendanceRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), "PPP, p")}</TableCell>
                      <TableCell>{record.courseName}</TableCell>
                      <TableCell>
                        <span className={`capitalize px-2 py-0.5 text-xs rounded-full font-medium
                          ${record.status === 'present' ? 'bg-green-100 text-green-700' : ''}
                          ${record.status === 'absent' ? 'bg-red-100 text-red-700' : ''}
                          ${record.status === 'late' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${record.status === 'excused' ? 'bg-blue-100 text-blue-700' : ''}
                        `}>
                          {record.status}
                        </span>
                      </TableCell>
                      <TableCell>{record.markedBy.includes("user_faculty") ? "Faculty" : record.markedBy}</TableCell> {/* Placeholder for faculty name */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}