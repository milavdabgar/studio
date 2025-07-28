"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TimetableEntry, Faculty } from '@/types/entities';
import { timetableService } from '@/lib/api/timetables';
import { facultyService } from '@/lib/api/faculty';
import { courseService } from '@/lib/api/courses';
import { roomService } from '@/lib/services/roomService'; // Corrected import path
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';


const DAYS_OF_WEEK: TimetableEntry['dayOfWeek'][] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
  "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", 
  "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
]; // Example time slots

interface EnrichedTimetableEntry extends TimetableEntry {
  courseName?: string;
  roomNumber?: string;
  programCode?: string;
  batchName?: string;
  timetableName?: string;
  timetableVersion?: string;
}

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string; 
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

export default function FacultyTimetablePage() {
  const [facultyTimetableEntries, setFacultyTimetableEntries] = useState<EnrichedTimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setCurrentFaculty] = useState<Faculty | null>(null);
  const [user, setUser] = useState<UserCookie | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch {
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    } else {
        toast({ variant: "destructive", title: "Authentication Error", description: "User not logged in." });
    }
  }, [toast]);

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchFacultyData = async () => {
      setIsLoading(true);
      try {
        const allFaculty = await facultyService.getAllFaculty();
        const facultyProfile = allFaculty.find(f => f.userId === user.id);

        if (!facultyProfile) {
          toast({ variant: "destructive", title: "Error", description: "Faculty profile not found." });
          setIsLoading(false);
          return;
        }
        setCurrentFaculty(facultyProfile);

        const allTimetables = await timetableService.getAllTimetables();
        const [courses, rooms, programs, batches] = await Promise.all([
            courseService.getAllCourses(),
            roomService.getAllRooms(),
            programService.getAllPrograms(),
            batchService.getAllBatches()
        ]);

        const relevantEntries: EnrichedTimetableEntry[] = [];
        allTimetables.forEach(tt => {
          if (tt.status === 'published') {
            tt.entries.forEach(entry => {
              if (entry.facultyId === facultyProfile.id) {
                const course = courses.find(c => c.id === entry.courseId);
                const room = rooms.find(r => r.id === entry.roomId);
                const batch = batches.find(b => b.id === tt.batchId);
                const program = programs.find(p => p.id === tt.programId);
                relevantEntries.push({
                  ...entry,
                  courseName: course?.subjectName || 'N/A',
                  roomNumber: room?.roomNumber || 'N/A',
                  batchName: batch?.name || 'N/A',
                  programCode: program?.code || 'N/A',
                  timetableName: tt.name,
                  timetableVersion: tt.version
                });
              }
            });
          }
        });
        setFacultyTimetableEntries(relevantEntries);
        if(relevantEntries.length === 0) {
            toast({ title: "No Schedule", description: "No classes currently assigned to you in published timetables." });
        }

      } catch (error) {
        console.error("Error fetching faculty timetable data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load timetable data." });
      }
      setIsLoading(false);
    };

    fetchFacultyData();
  }, [user, toast]);

  const timetableGrid = useMemo(() => {
    if (facultyTimetableEntries.length === 0) return [];
    
    const grid: (EnrichedTimetableEntry | null)[][] = Array(TIME_SLOTS.length)
      .fill(null)
      .map(() => Array(DAYS_OF_WEEK.length).fill(null));

    facultyTimetableEntries.forEach(entry => {
      const dayIndex = DAYS_OF_WEEK.indexOf(entry.dayOfWeek as TimetableEntry['dayOfWeek']);
       // Simplified time slot matching
      const slotIndex = TIME_SLOTS.findIndex(slot => entry.startTime === slot.split('-')[0]);


      if (dayIndex !== -1 && slotIndex !== -1) {
        if (!grid[slotIndex][dayIndex]) { // Prioritize first entry if multiple (should ideally not happen for a faculty)
            grid[slotIndex][dayIndex] = entry;
        }
      }
    });
    return grid;
  }, [facultyTimetableEntries]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-primary flex items-center gap-2">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6" /> My Teaching Schedule
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Your weekly teaching and other scheduled activities.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {facultyTimetableEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[600px] sm:min-w-full border dark:border-gray-700">
                <TableHeader>
                  <TableRow>
                    <TableHead className="border w-16 sm:w-28 text-xs sm:text-sm dark:border-gray-700">Time</TableHead>
                    {DAYS_OF_WEEK.map(day => (
                      <TableHead key={day} className="border text-center text-xs sm:text-sm dark:border-gray-700">
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.slice(0, 3)}</span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TIME_SLOTS.map((slot, slotIndex) => (
                    <TableRow key={slot}>
                      <TableCell className="border font-medium text-xs sm:text-sm dark:border-gray-700 p-1 sm:p-2">
                        <div className="transform -rotate-90 sm:rotate-0 origin-center whitespace-nowrap">
                          <span className="hidden sm:inline">{slot}</span>
                          <span className="sm:hidden">{slot.split('-')[0]}</span>
                        </div>
                      </TableCell>
                      {DAYS_OF_WEEK.map((day, dayIndex) => {
                        const entry = timetableGrid[slotIndex]?.[dayIndex];
                        return (
                          <TableCell key={`${day}-${slot}`} className="border p-0.5 sm:p-1 h-16 sm:h-24 align-top dark:border-gray-700">
                            {entry ? (
                              <div className="bg-secondary/20 p-1 sm:p-1.5 rounded-md text-[10px] sm:text-xs h-full flex flex-col justify-between">
                                <div>
                                  <p className="font-semibold text-secondary-foreground leading-tight truncate" title={entry.courseName}>
                                    {entry.courseName}
                                  </p>
                                  <p className="text-muted-foreground text-[8px] sm:text-[0.7rem] leading-tight truncate" title={`${entry.programCode} - ${entry.batchName}`}>
                                    {entry.programCode} - {entry.batchName}
                                  </p>
                                  {entry.timetableName && (
                                    <p className="text-muted-foreground text-[8px] sm:text-[0.65rem] italic truncate hidden sm:block" title={entry.timetableName}>
                                      TT: {entry.timetableName} (v{entry.timetableVersion})
                                    </p>
                                  )}
                                </div>
                                <p className="text-muted-foreground text-[8px] sm:text-[0.7rem] mt-0.5 sm:mt-1 truncate" title={`Room: ${entry.roomNumber}`}>
                                  Room: {entry.roomNumber}
                                </p>
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
            <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm sm:text-base px-4">
              Your schedule is not available or no classes are assigned.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}