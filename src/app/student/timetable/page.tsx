"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Loader2, Calendar, MapPin, User, BookOpen, Download, Share2, Filter, AlertCircle, Bell, RefreshCw, Smartphone, Grid, List, Search, Info } from "lucide-react";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useStudentRealtimeTimetable } from "@/hooks/useRealtimeTimetable";
import { RealtimeStatus, RealtimeNotification } from "@/components/RealtimeStatus";
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
  
  // Enhanced Phase 4 features
  const [viewMode, setViewMode] = useState<'weekly' | 'daily' | 'list'>('weekly');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<string>('current');
  const [showDetails, setShowDetails] = useState(false);
  const [realtimeNotification, setRealtimeNotification] = useState<{
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
  } | null>(null);

  const { toast } = useToast();

  // Real-time timetable updates
  const { isConnected, lastUpdate, reconnect } = useStudentRealtimeTimetable(
    user?.id || '',
    studentTimetable?.batchId ? [studentTimetable.batchId] : [],
    (event) => {
      // Handle real-time timetable changes
      console.log('Timetable update received:', event);
      
      // Show notification
      setRealtimeNotification({
        title: getUpdateTitle(event.type),
        message: getUpdateMessage(event),
        type: getUpdateType(event.type)
      });

      // Refresh timetable data
      if (user?.id) {
        fetchStudentData();
      }

      // Show toast notification
      toast({
        title: getUpdateTitle(event.type),
        description: getUpdateMessage(event),
        duration: 5000
      });
    }
  );

  const getUpdateTitle = (eventType: string): string => {
    const titles = {
      timetable_created: '📅 New Timetable Published',
      timetable_updated: '🔄 Timetable Updated',
      entry_changed: '⏰ Schedule Changed',
      conflict_detected: '⚠️ Conflict Detected'
    };
    return titles[eventType as keyof typeof titles] || 'Timetable Update';
  };

  const getUpdateMessage = (event: any): string => {
    switch (event.type) {
      case 'timetable_created':
        return 'A new timetable has been published for your batch.';
      case 'timetable_updated':
        return `Your timetable has been updated with ${event.changes?.modified.length || 0} changes.`;
      case 'entry_changed':
        return `${event.changes?.modified.length || 0} of your classes have been rescheduled.`;
      case 'conflict_detected':
        return 'There are scheduling conflicts that may affect your classes.';
      default:
        return 'Your timetable has been updated.';
    }
  };

  const getUpdateType = (eventType: string): 'info' | 'warning' | 'error' | 'success' => {
    const types = {
      timetable_created: 'success' as const,
      timetable_updated: 'info' as const,
      entry_changed: 'warning' as const,
      conflict_detected: 'error' as const
    };
    return types[eventType as keyof typeof types] || 'info';
  };

  const fetchStudentData = async () => {
    if (!user || !user.id) return;
    
    setIsLoading(true);
    try {
      const allStudents = await studentService.getAllStudents();
      const studentProfile = allStudents.find(s => s.userId === user.id);

      if (!studentProfile || !studentProfile.batchId) {
        toast({ variant: "destructive", title: "Error", description: "Student profile or batch information not found." });
        setIsLoading(false);
        return;
      }

      const allTimetables = await timetableService.getAllTimetables();
      const applicableTimetable = allTimetables.find(tt => tt.batchId === studentProfile.batchId && tt.status === 'published');
      
      if (applicableTimetable) {
        setStudentTimetable(applicableTimetable);
        
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

  const getUpcomingClasses = () => {
    if (!enrichedEntries.length) return [];
    
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);
    
    return enrichedEntries
      .filter(entry => {
        if (entry.dayOfWeek === today) {
          return entry.startTime > currentTime;
        }
        const dayIndex = DAYS_OF_WEEK.indexOf(entry.dayOfWeek);
        const todayIndex = DAYS_OF_WEEK.indexOf(today as any);
        return dayIndex > todayIndex;
      })
      .sort((a, b) => {
        const dayDiff = DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek);
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, 3);
  };

  const getUniqueSubjects = () => {
    if (!enrichedEntries.length) return [];
    
    const subjects = new Map<string, string>();
    enrichedEntries.forEach(entry => {
      subjects.set(entry.courseId, entry.courseName || entry.courseId);
    });
    
    return Array.from(subjects.entries()).map(([id, name]) => ({ id, name }));
  };

  const getTimetableStats = () => {
    if (!enrichedEntries.length) return {
      totalSubjects: 0,
      weeklyHours: 0,
      totalFaculty: 0,
      activeDays: 0
    };

    const subjects = new Set(enrichedEntries.map(e => e.courseId));
    const faculty = new Set(enrichedEntries.map(e => e.facultyId));
    const days = new Set(enrichedEntries.map(e => e.dayOfWeek));
    
    const weeklyHours = enrichedEntries.reduce((total, entry) => {
      const start = new Date(`2000-01-01T${entry.startTime}`);
      const end = new Date(`2000-01-01T${entry.endTime}`);
      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    return {
      totalSubjects: subjects.size,
      weeklyHours: Math.round(weeklyHours * 10) / 10,
      totalFaculty: faculty.size,
      activeDays: days.size
    };
  };

  const exportTimetable = async (format: 'pdf' | 'ical' | 'image') => {
    if (!studentTimetable) return;
    
    try {
      const response = await fetch(`/api/student/timetable/export?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timetableId: studentTimetable.id })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timetable.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast({ title: "Export successful", description: `Timetable exported as ${format.toUpperCase()}` });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({ variant: "destructive", title: "Export failed", description: "Could not export timetable" });
    }
  };

  const shareTimeTable = async () => {
    if (navigator.share && studentTimetable) {
      try {
        await navigator.share({
          title: 'My Timetable',
          text: `My timetable for ${studentTimetable.academicYear} Semester ${studentTimetable.semester}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Share failed:', error);
        toast({ variant: "destructive", title: "Share failed", description: "Could not share timetable" });
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copied", description: "Timetable link copied to clipboard" });
      } catch (error) {
        toast({ variant: "destructive", title: "Share failed", description: "Could not copy link" });
      }
    }
  };

  const filteredEntries = enrichedEntries.filter(entry => 
    filterSubject === 'all' || entry.courseId === filterSubject
  );

  const stats = getTimetableStats();


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Timetable</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {studentTimetable ? `${studentTimetable.academicYear} Semester ${studentTimetable.semester}` : 'Loading...'}
            {studentTimetable && (
              <span className="hidden sm:inline"> • Version: {studentTimetable.version}</span>
            )}
          </p>
          {studentTimetable && (
            <p className="text-xs text-gray-500 dark:text-gray-500 sm:hidden mt-1">
              Version: {studentTimetable.version}
            </p>
          )}
        </div>
        
        {/* Mobile-friendly controls */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <RealtimeStatus showLabel onReconnect={reconnect} />
            
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-32 sm:w-40 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Week</SelectItem>
                <SelectItem value="next">Next Week</SelectItem>
                <SelectItem value="semester">Full Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => exportTimetable('pdf')} className="flex-1 sm:flex-none text-xs sm:text-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export </span>PDF
            </Button>
            
            <Button variant="outline" size="sm" onClick={shareTimeTable} className="flex-1 sm:flex-none text-xs sm:text-sm">
              <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Share
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchStudentData}
              disabled={isLoading}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Real-time Notification */}
      {realtimeNotification && (
        <RealtimeNotification
          title={realtimeNotification.title}
          message={realtimeNotification.message}
          type={realtimeNotification.type}
          onDismiss={() => setRealtimeNotification(null)}
          onAction={() => {
            setRealtimeNotification(null);
            // Could navigate to specific view or refresh data
          }}
          actionLabel="View Changes"
        />
      )}

      {studentTimetable && enrichedEntries.length > 0 ? (
        <>
          {/* Stats Cards - Mobile Optimized */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Subjects</p>
                    <p className="text-lg sm:text-2xl font-bold">{stats.totalSubjects}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Hours/Week</p>
                    <p className="text-lg sm:text-2xl font-bold">{stats.weeklyHours}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Faculty</p>
                    <p className="text-lg sm:text-2xl font-bold">{stats.totalFaculty}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Days/Week</p>
                    <p className="text-lg sm:text-2xl font-bold">{stats.activeDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Classes - Mobile Optimized */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                Upcoming Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {getUpcomingClasses().map((entry, index) => (
                  <div key={index} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2 sm:gap-0">
                      <h4 className="font-semibold text-sm sm:text-base truncate flex-1">{entry.courseName}</h4>
                      <Badge variant="outline" className="text-xs self-start sm:self-auto">{entry.entryType}</Badge>
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{entry.dayOfWeek}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{entry.startTime} - {entry.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{entry.roomNumber}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{entry.facultyName}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {getUpcomingClasses().length === 0 && (
                  <div className="col-span-full text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm sm:text-base">No upcoming classes for today</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Timetable - Mobile Optimized */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:flex">
                  <TabsTrigger value="weekly" className="text-xs sm:text-sm">Weekly</TabsTrigger>
                  <TabsTrigger value="daily" className="text-xs sm:text-sm">Daily</TabsTrigger>
                  <TabsTrigger value="list" className="text-xs sm:text-sm">List</TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger className="w-full sm:w-48 text-xs sm:text-sm">
                      <SelectValue placeholder="Filter by subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {getUniqueSubjects().map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <TabsContent value="weekly" className="mt-4 sm:mt-6">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table className="min-w-[700px] border dark:border-gray-700">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="border w-16 sm:w-28 dark:border-gray-700 text-xs sm:text-sm">Time</TableHead>
                          {DAYS_OF_WEEK.map(day => (
                            <TableHead key={day} className="border text-center dark:border-gray-700 text-xs sm:text-sm min-w-[80px] sm:min-w-[120px]">
                              <span className="hidden sm:inline">{day}</span>
                              <span className="sm:hidden">{day.substring(0, 3)}</span>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {TIME_SLOTS.map((slot, slotIndex) => (
                          <TableRow key={slot}>
                            <TableCell className="border font-medium dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs sm:text-sm">
                              <div className="writing-vertical-rl sm:writing-horizontal-tb text-center sm:text-left">
                                <span className="hidden sm:inline">{slot}</span>
                                <span className="sm:hidden text-[10px] leading-tight">{slot.split('-')[0]}</span>
                              </div>
                            </TableCell>
                            {DAYS_OF_WEEK.map((day, dayIndex) => {
                              const entry = timetableGrid[slotIndex]?.[dayIndex];
                              const isFiltered = filterSubject !== 'all' && entry && entry.courseId !== filterSubject;
                              
                              return (
                                <TableCell key={`${day}-${slot}`} className="border p-1 sm:p-2 h-16 sm:h-20 align-top dark:border-gray-700">
                                  {entry && !isFiltered && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-1 sm:p-2 h-full flex flex-col justify-between dark:bg-blue-900/20 dark:border-blue-700">
                                      <div className="flex-1 min-h-0">
                                        <p className="font-semibold text-[10px] sm:text-sm text-blue-900 dark:text-blue-100 truncate leading-tight">
                                          {entry.courseName}
                                        </p>
                                        <p className="text-[8px] sm:text-xs text-blue-700 dark:text-blue-300 mt-0.5 sm:mt-1 truncate">
                                          {entry.entryType}
                                        </p>
                                      </div>
                                      <div className="text-[8px] sm:text-xs text-gray-600 dark:text-gray-400 space-y-0.5 sm:space-y-1 mt-1">
                                        <div className="flex items-center gap-0.5 sm:gap-1">
                                          <MapPin className="h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0" />
                                          <span className="truncate">{entry.roomNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-0.5 sm:gap-1 hidden sm:flex">
                                          <User className="h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0" />
                                          <span className="truncate">{entry.facultyName}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Mobile scroll hint */}
                  <div className="sm:hidden text-center py-2 text-xs text-gray-500 border-t">
                    ← Swipe to scroll horizontally →
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="daily" className="mt-4 sm:mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
                {DAYS_OF_WEEK.map((day) => (
                  <Card key={day}>
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardTitle className="text-sm sm:text-lg text-center">
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.substring(0, 3)}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {filteredEntries
                        .filter(entry => entry.dayOfWeek === day)
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((entry, index) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 dark:bg-blue-900/20 dark:border-blue-700">
                            <div className="font-semibold text-xs sm:text-sm text-blue-900 dark:text-blue-100 truncate">
                              {entry.courseName}
                            </div>
                            <div className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 mt-1">
                              {entry.startTime} - {entry.endTime}
                            </div>
                            <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                              {entry.roomNumber} • {entry.facultyName}
                            </div>
                            <Badge variant="outline" className="mt-1 sm:mt-2 text-[8px] sm:text-xs px-1 sm:px-2 py-0.5">
                              {entry.entryType}
                            </Badge>
                          </div>
                        ))}
                      {filteredEntries.filter(entry => entry.dayOfWeek === day).length === 0 && (
                        <div className="text-center py-3 sm:py-4 text-gray-500 text-xs sm:text-sm">
                          No classes
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="list" className="mt-4 sm:mt-6">
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {filteredEntries
                      .sort((a, b) => {
                        const dayDiff = DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek);
                        if (dayDiff !== 0) return dayDiff;
                        return a.startTime.localeCompare(b.startTime);
                      })
                      .map((entry, index) => (
                        <div key={index} className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex flex-col gap-2 sm:gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <h4 className="font-semibold text-sm sm:text-base truncate">{entry.courseName}</h4>
                                  <Badge variant="outline" className="text-xs self-start sm:self-auto">{entry.entryType}</Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">{entry.dayOfWeek}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">{entry.startTime} - {entry.endTime}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">{entry.roomNumber}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">{entry.facultyName}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    {filteredEntries.length === 0 && (
                      <div className="text-center py-6 sm:py-8 text-gray-500">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm sm:text-base">No classes match the current filter</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Timetable Available</h3>
            <p className="text-gray-600">Your timetable has not been published yet. Please check back later.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}