"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import type { Timetable, TimetableEntry } from '@/types/entities';
import { timetableService } from '@/lib/api/timetables';
import { studentService } from '@/lib/api/students';
import { courseService } from '@/lib/api/courses';
import { facultyService } from '@/lib/api/faculty';
import { roomService } from '@/lib/services/roomService';


const DAYS_OF_WEEK: TimetableEntry['dayOfWeek'][] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
  "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", 
  "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
]; // Example time slots

interface EnrichedTimetableEntry extends TimetableEntry {
  courseName?: string;
  facultyName?: string;
  roomNumber?: string;
}

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string; // Assuming user ID is in cookie for fetching profile
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


export default function StudentTimetablePage() {
  const [studentTimetable, setStudentTimetable] = useState<Timetable | null>(null);
  const [enrichedEntries, setEnrichedEntries] = useState<EnrichedTimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse auth_user cookie:', error);
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    } else {
        toast({ variant: "destructive", title: "Authentication Error", description: "User not logged in." });
    }
  }, [toast]);

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchStudentData = async () => {
      setIsLoading(true);
      try {
        // Assuming user.id from cookie is the User.id, which links to StudentProfile.userId
        // Fetch all students and find the one matching the userId from the cookie.
        // This is inefficient; ideally, you'd have an API endpoint like /api/students/by-user/{userId}
        // or ensure the student's profile ID or batchId is directly available.
        const allStudents = await studentService.getAllStudents();
        const studentProfile = allStudents.find(s => s.userId === user.id);

        if (!studentProfile || !studentProfile.batchId) {
          toast({ variant: "destructive", title: "Error", description: "Student profile or batch information not found." });
          setIsLoading(false);
          return;
        }
        // Student profile found, proceed with timetable lookup

        const allTimetables = await timetableService.getAllTimetables();
        const applicableTimetable = allTimetables.find(tt => tt.batchId === studentProfile.batchId && tt.status === 'published');
        
        if (applicableTimetable) {
          setStudentTimetable(applicableTimetable);
          
          // Fetch related data for enrichment
          const [courses, faculties, rooms] = await Promise.all([
            courseService.getAllCourses(),
            facultyService.getAllFaculty(),
            roomService.getAllRooms()
          ]);

          const enriched = applicableTimetable.entries.map(entry => ({
            ...entry,
            courseName: courses.find((c: { id: string }) => c.id === entry.courseId)?.subjectName || 'N/A',
            facultyName: faculties.find((f: { id: string }) => f.id === entry.facultyId)?.firstName || 'N/A',
            roomNumber: rooms.find((r: { id: string }) => r.id === entry.roomId)?.roomNumber || 'N/A',
          }));
          setEnrichedEntries(enriched);

        } else {
          toast({ title: "No Timetable", description: "No published timetable found for your batch." });
          setStudentTimetable(null);
          setEnrichedEntries([]);
        }

      } catch (error) {
        console.error('Error fetching student timetable data:', error);
        toast({ variant: "destructive", title: "Error", description: "Could not load timetable data." });
      }
      setIsLoading(false);
    };

    fetchStudentData();
  }, [user, toast]);


  const timetableGrid = useMemo(() => {
    if (!studentTimetable || enrichedEntries.length === 0) return [];
    
    const grid: (EnrichedTimetableEntry | null)[][] = Array(TIME_SLOTS.length)
      .fill(null)
      .map(() => Array(DAYS_OF_WEEK.length).fill(null));

    enrichedEntries.forEach(entry => {
      const dayIndex = DAYS_OF_WEEK.indexOf(entry.dayOfWeek as TimetableEntry['dayOfWeek']);
      const slotIndex = TIME_SLOTS.findIndex(slot => {
        const [slotStart] = slot.split('-');
        return entry.startTime === slotStart; 
      });

      if (dayIndex !== -1 && slotIndex !== -1) {
        grid[slotIndex][dayIndex] = entry;
      }
    });
    return grid;
  }, [studentTimetable, enrichedEntries]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Clock className="h-6 w-6" /> My Timetable
          </CardTitle>
          <CardDescription>
            Your weekly class schedule. {studentTimetable ? `(Version: ${studentTimetable.version}, Effective: ${format(new Date(studentTimetable.effectiveDate || new Date()), "PPP")})` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {studentTimetable && enrichedEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-full border dark:border-gray-700">
                <TableHeader>
                  <TableRow>
                    <TableHead className="border w-28 dark:border-gray-700">Time</TableHead>
                    {DAYS_OF_WEEK.map(day => (
                      <TableHead key={day} className="border text-center dark:border-gray-700">{day}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TIME_SLOTS.map((slot, slotIndex) => (
                    <TableRow key={slot}>
                      <TableCell className="border font-medium dark:border-gray-700">{slot}</TableCell>
                      {DAYS_OF_WEEK.map((day, dayIndex) => {
                        const entry = timetableGrid[slotIndex]?.[dayIndex];
                        return (
                          <TableCell key={`${day}-${slot}`} className="border p-1 h-20 align-top dark:border-gray-700">
                            {entry ? (
                              <div className="bg-primary/10 p-1.5 rounded-md text-xs h-full flex flex-col justify-between dark:bg-primary/20">
                                <div>
                                    <p className="font-semibold text-primary">{entry.courseName}</p>
                                    <p className="text-muted-foreground">{entry.facultyName}</p>
                                </div>
                                <p className="text-muted-foreground text-[0.7rem] mt-1">Room: {entry.roomNumber}</p>
                              </div>
                            ) : null}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Your timetable is not available at the moment. Please check back later or contact administration.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}