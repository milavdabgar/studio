"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Loader2, AlertTriangle, TrendingUp, Users, BookOpen, Calendar, Bell, Download, RefreshCw, BarChart3 } from "lucide-react";
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

// Enhanced Phase 4 types for faculty workload analysis
interface WorkloadAnalysis {
  totalHours: number;
  maxHours: number;
  utilizationRate: number;
  courseCount: number;
  batchCount: number;
  conflicts: WorkloadConflict[];
  weeklyDistribution: { [day: string]: number };
  timeSlotDistribution: { [slot: string]: number };
}

interface WorkloadConflict {
  type: 'overload' | 'back_to_back' | 'room_conflict' | 'time_gap';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedEntries: string[];
  suggestions: string[];
}

interface FacultyAlert {
  id: string;
  type: 'workload' | 'conflict' | 'update' | 'reminder';
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  actionRequired: boolean;
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
  const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
  const [user, setUser] = useState<UserCookie | null>(null);
  
  // Enhanced Phase 4 state
  const [workloadAnalysis, setWorkloadAnalysis] = useState<WorkloadAnalysis | null>(null);
  const [facultyAlerts, setFacultyAlerts] = useState<FacultyAlert[]>([]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'workload' | 'alerts'>('schedule');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preferences, setPreferences] = useState<{
    maxHours: number;
    preferredTimeSlots: string[];
    breakDuration: number;
  }>({ maxHours: 18, preferredTimeSlots: [], breakDuration: 60 });

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

        // Generate workload analysis after fetching data
        await generateWorkloadAnalysis(relevantEntries, facultyProfile);

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

  // Generate workload analysis
  const generateWorkloadAnalysis = async (entries: EnrichedTimetableEntry[], faculty: Faculty) => {
    setIsAnalyzing(true);
    try {
      // Calculate total hours
      const totalHours = entries.reduce((total, entry) => {
        const start = new Date(`2000-01-01T${entry.startTime}`);
        const end = new Date(`2000-01-01T${entry.endTime}`);
        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);

      // Calculate weekly distribution
      const weeklyDistribution: { [day: string]: number } = {};
      const timeSlotDistribution: { [slot: string]: number } = {};
      
      DAYS_OF_WEEK.forEach(day => {
        weeklyDistribution[day] = entries
          .filter(e => e.dayOfWeek === day)
          .reduce((total, entry) => {
            const start = new Date(`2000-01-01T${entry.startTime}`);
            const end = new Date(`2000-01-01T${entry.endTime}`);
            return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          }, 0);
      });

      TIME_SLOTS.forEach(slot => {
        timeSlotDistribution[slot] = entries.filter(e => {
          const [slotStart] = slot.split('-');
          return e.startTime === slotStart;
        }).length;
      });

      // Detect conflicts
      const conflicts: WorkloadConflict[] = [];
      
      // Check for overload
      if (totalHours > preferences.maxHours) {
        conflicts.push({
          type: 'overload',
          severity: totalHours > preferences.maxHours * 1.2 ? 'high' : 'medium',
          description: `Total workload (${totalHours.toFixed(1)}h) exceeds maximum limit (${preferences.maxHours}h)`,
          affectedEntries: entries.map((e, index) => `${e.courseId}-${e.dayOfWeek}-${e.startTime}-${index}`),
          suggestions: [
            'Request workload redistribution',
            'Consider combining related courses',
            'Discuss with HOD about additional support'
          ]
        });
      }

      // Check for back-to-back classes
      const sortedEntries = entries.sort((a, b) => {
        const dayDiff = DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek);
        return dayDiff !== 0 ? dayDiff : a.startTime.localeCompare(b.startTime);
      });

      for (let i = 0; i < sortedEntries.length - 1; i++) {
        const current = sortedEntries[i];
        const next = sortedEntries[i + 1];
        
        if (current.dayOfWeek === next.dayOfWeek && current.endTime === next.startTime) {
          const backToBackCount = entries.filter(e => 
            e.dayOfWeek === current.dayOfWeek && 
            (e.endTime === next.startTime || e.startTime === current.endTime)
          ).length;
          
          if (backToBackCount >= 3) {
            conflicts.push({
              type: 'back_to_back',
              severity: backToBackCount >= 4 ? 'high' : 'medium',
              description: `${backToBackCount} consecutive classes on ${current.dayOfWeek}`,
              affectedEntries: [`${current.courseId}-${current.dayOfWeek}-${current.startTime}`, `${next.courseId}-${next.dayOfWeek}-${next.startTime}`],
              suggestions: [
                'Request 15-minute break between classes',
                'Consider room proximity for back-to-back classes',
                'Schedule lighter activities between intensive sessions'
              ]
            });
          }
        }
      }

      // Check for time gaps
      Object.entries(weeklyDistribution).forEach(([day, hours]) => {
        const dayEntries = entries.filter(e => e.dayOfWeek === day);
        if (dayEntries.length > 0) {
          const firstClass = Math.min(...dayEntries.map(e => parseInt(e.startTime.split(':')[0])));
          const lastClass = Math.max(...dayEntries.map(e => parseInt(e.endTime.split(':')[0])));
          const totalDaySpan = lastClass - firstClass;
          
          if (totalDaySpan > 8 && hours < 4) {
            conflicts.push({
              type: 'time_gap',
              severity: 'low',
              description: `Long day span (${totalDaySpan}h) with few classes on ${day}`,
              affectedEntries: dayEntries.map(e => `${e.courseId}-${e.dayOfWeek}-${e.startTime}`),
              suggestions: [
                'Consolidate classes to reduce campus time',
                'Use gaps for office hours or research',
                'Request schedule optimization'
              ]
            });
          }
        }
      });

      // Get unique courses and batches
      const uniqueCourses = new Set(entries.map(e => e.courseId));
      const uniqueBatches = new Set(entries.map(e => e.timetableName));

      const analysis: WorkloadAnalysis = {
        totalHours: Math.round(totalHours * 10) / 10,
        maxHours: preferences.maxHours,
        utilizationRate: Math.round((totalHours / preferences.maxHours) * 100),
        courseCount: uniqueCourses.size,
        batchCount: uniqueBatches.size,
        conflicts,
        weeklyDistribution,
        timeSlotDistribution
      };

      setWorkloadAnalysis(analysis);

      // Generate alerts based on analysis
      const alerts: FacultyAlert[] = [];
      
      conflicts.forEach((conflict, index) => {
        alerts.push({
          id: `conflict-${index}`,
          type: 'conflict',
          severity: conflict.severity === 'high' ? 'error' : conflict.severity === 'medium' ? 'warning' : 'info',
          title: `${conflict.type.replace('_', ' ').toUpperCase()} Detected`,
          message: conflict.description,
          timestamp: new Date().toISOString(),
          actionRequired: conflict.severity !== 'low'
        });
      });

      if (analysis.utilizationRate > 100) {
        alerts.push({
          id: 'workload-overload',
          type: 'workload',
          severity: 'error',
          title: 'Workload Exceeded',
          message: `You are assigned ${analysis.totalHours}h out of ${analysis.maxHours}h maximum (${analysis.utilizationRate}%)`,
          timestamp: new Date().toISOString(),
          actionRequired: true
        });
      } else if (analysis.utilizationRate > 90) {
        alerts.push({
          id: 'workload-warning',
          type: 'workload',
          severity: 'warning',
          title: 'High Workload',
          message: `You are near maximum capacity at ${analysis.utilizationRate}%`,
          timestamp: new Date().toISOString(),
          actionRequired: false
        });
      }

      setFacultyAlerts(alerts);

    } catch (error) {
      console.error('Error generating workload analysis:', error);
      toast({ variant: "destructive", title: "Analysis Error", description: "Could not generate workload analysis" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header with workload summary */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 sm:h-8 sm:w-8" />
            My Teaching Schedule
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {currentFaculty ? `${currentFaculty.firstName} ${currentFaculty.lastName}` : 'Faculty Schedule'}
          </p>
        </div>
        
        {workloadAnalysis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Hours</p>
                    <p className="text-lg sm:text-2xl font-bold">{workloadAnalysis.totalHours}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className={`h-4 w-4 flex-shrink-0 ${
                    workloadAnalysis.utilizationRate > 100 ? 'text-red-500' :
                    workloadAnalysis.utilizationRate > 90 ? 'text-yellow-500' : 'text-green-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Utilization</p>
                    <p className="text-lg sm:text-2xl font-bold">{workloadAnalysis.utilizationRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Courses</p>
                    <p className="text-lg sm:text-2xl font-bold">{workloadAnalysis.courseCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${
                    workloadAnalysis.conflicts.length > 0 ? 'text-red-500' : 'text-green-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Conflicts</p>
                    <p className="text-lg sm:text-2xl font-bold">{workloadAnalysis.conflicts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="workload">
            Workload Analysis
            {isAnalyzing && <Loader2 className="h-3 w-3 ml-1 animate-spin" />}
          </TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {facultyAlerts.filter(a => !a.actionRequired || a.severity === 'error').length > 0 && (
              <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 text-xs">
                {facultyAlerts.filter(a => !a.actionRequired || a.severity === 'error').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-4">
          <Card className="shadow-xl">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-primary flex items-center gap-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" /> Weekly Teaching Schedule
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
    </TabsContent>

    <TabsContent value="workload" className="mt-4">
      {workloadAnalysis ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Weekly Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(workloadAnalysis.weeklyDistribution).map(([day, hours]) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{day}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((hours / 8) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">{hours.toFixed(1)}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Time Slot Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Slot Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(workloadAnalysis.timeSlotDistribution).map(([slot, count]) => (
                    <div key={slot} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{slot}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((count / 6) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">{count} days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workload Conflicts */}
          {workloadAnalysis.conflicts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Workload Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workloadAnalysis.conflicts.map((conflict, index) => (
                    <Alert key={index} className={`border-l-4 ${
                      conflict.severity === 'high' ? 'border-red-500' :
                      conflict.severity === 'medium' ? 'border-yellow-500' : 'border-blue-500'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="capitalize">
                        {conflict.type.replace('_', ' ')} - {conflict.severity.toUpperCase()}
                      </AlertTitle>
                      <AlertDescription>
                        <p className="mb-2">{conflict.description}</p>
                        <div>
                          <p className="text-sm font-medium mb-1">Suggestions:</p>
                          <ul className="text-sm list-disc list-inside space-y-1">
                            {conflict.suggestions.map((suggestion, idx) => (
                              <li key={idx}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Workload Analysis Available</h3>
            <p className="text-gray-600 mb-4">Analysis will be generated once your schedule is loaded.</p>
            {isAnalyzing && (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </TabsContent>

    <TabsContent value="alerts" className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Faculty Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {facultyAlerts.length > 0 ? (
            <div className="space-y-4">
              {facultyAlerts.map(alert => (
                <Alert key={alert.id} className={`border-l-4 ${
                  alert.severity === 'error' ? 'border-red-500' :
                  alert.severity === 'warning' ? 'border-yellow-500' : 'border-blue-500'
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription>
                    <p>{alert.message}</p>
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      {alert.actionRequired && (
                        <Badge variant="destructive">Action Required</Badge>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Alerts</h3>
              <p className="text-gray-600">You have no pending alerts or notifications.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
    </div>
  );
}