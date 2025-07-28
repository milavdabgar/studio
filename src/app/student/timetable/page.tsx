"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Loader2, Calendar, MapPin, User, BookOpen, Download, Share2, Filter, AlertCircle, Bell, RefreshCw } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<'weekly' | 'daily' | 'list'>('weekly');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<string>('current');
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Timetable</h1>
          <p className="text-gray-600">
            {studentTimetable ? `${studentTimetable.academicYear} Semester ${studentTimetable.semester}` : 'Loading...'}
            {studentTimetable && ` • Version: ${studentTimetable.version}`}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <RealtimeStatus showLabel onReconnect={reconnect} />
          
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Week</SelectItem>
              <SelectItem value="next">Next Week</SelectItem>
              <SelectItem value="semester">Full Semester</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => exportTimetable('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          
          <Button variant="outline" onClick={shareTimeTable}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          <Button 
            variant="outline" 
            onClick={fetchStudentData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Subjects</p>
                    <p className="text-2xl font-bold">{stats.totalSubjects}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Weekly Hours</p>
                    <p className="text-2xl font-bold">{stats.weeklyHours}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Faculty</p>
                    <p className="text-2xl font-bold">{stats.totalFaculty}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Days/Week</p>
                    <p className="text-2xl font-bold">{stats.activeDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Upcoming Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getUpcomingClasses().map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{entry.courseName}</h4>
                      <Badge variant="outline">{entry.entryType}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {entry.dayOfWeek}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {entry.startTime} - {entry.endTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {entry.roomNumber}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {entry.facultyName}
                      </div>
                    </div>
                  </div>
                ))}
                {getUpcomingClasses().length === 0 && (
                  <div className="col-span-3 text-center py-8 text-gray-500">
                    No upcoming classes for today
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Timetable */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="weekly">Weekly View</TabsTrigger>
                <TabsTrigger value="daily">Daily View</TabsTrigger>
                <TabsTrigger value="list">List View</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="w-48">
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

            <TabsContent value="weekly" className="mt-6">
              <Card>
                <CardContent className="p-0">
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
                            <TableCell className="border font-medium dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                              {slot}
                            </TableCell>
                            {DAYS_OF_WEEK.map((day, dayIndex) => {
                              const entry = timetableGrid[slotIndex]?.[dayIndex];
                              const isFiltered = filterSubject !== 'all' && entry && entry.courseId !== filterSubject;
                              
                              return (
                                <TableCell key={`${day}-${slot}`} className="border p-2 h-20 align-top dark:border-gray-700">
                                  {entry && !isFiltered && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 h-full flex flex-col justify-between dark:bg-blue-900/20 dark:border-blue-700">
                                      <div>
                                        <p className="font-semibold text-sm text-blue-900 dark:text-blue-100 truncate">
                                          {entry.courseName}
                                        </p>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                          {entry.entryType}
                                        </p>
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          <span className="truncate">{entry.roomNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <User className="h-3 w-3" />
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="daily" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                {DAYS_OF_WEEK.map((day) => (
                  <Card key={day}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-center">{day}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {filteredEntries
                        .filter(entry => entry.dayOfWeek === day)
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((entry, index) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3 dark:bg-blue-900/20 dark:border-blue-700">
                            <div className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                              {entry.courseName}
                            </div>
                            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              {entry.startTime} - {entry.endTime}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {entry.roomNumber} • {entry.facultyName}
                            </div>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {entry.entryType}
                            </Badge>
                          </div>
                        ))}
                      {filteredEntries.filter(entry => entry.dayOfWeek === day).length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No classes
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="list" className="mt-6">
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
                        <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="font-semibold">{entry.courseName}</h4>
                                <Badge variant="outline">{entry.entryType}</Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {entry.dayOfWeek}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {entry.startTime} - {entry.endTime}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {entry.roomNumber}
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {entry.facultyName}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    {filteredEntries.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No classes match the current filter
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