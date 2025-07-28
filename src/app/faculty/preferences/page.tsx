"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Trash2, 
  Save, 
  Clock, 
  BookOpen, 
  User,
  Calendar,
  MapPin,
  Star,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { 
  FacultyPreference,
  CoursePreference,
  TimePreference,
  TimeSlot,
  DayOfWeek,
  Course
} from '@/types/entities';
import { facultyPreferenceService } from '@/lib/api/facultyPreferences';
import { courseService } from '@/lib/api/courses';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export default function FacultyPreferencesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [preferences, setPreferences] = useState<FacultyPreference[]>([]);
  const [currentPreference, setCurrentPreference] = useState<Partial<FacultyPreference>>({
    academicYear: '2024-25',
    semester: 1,
    preferredCourses: [],
    timePreferences: [],
    roomPreferences: [],
    maxHoursPerWeek: 20,
    maxConsecutiveHours: 3,
    unavailableSlots: [],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    priority: 5
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [newCourseId, setNewCourseId] = useState('');
  const [newCoursePreference, setNewCoursePreference] = useState<'high' | 'medium' | 'low'>('medium');
  const [newCourseExpertise, setNewCourseExpertise] = useState(5);
  
  const [newTimeDay, setNewTimeDay] = useState<DayOfWeek>('Monday');
  const [newTimeStart, setNewTimeStart] = useState('09:00');
  const [newTimeEnd, setNewTimeEnd] = useState('10:00');
  const [newTimePreference, setNewTimePreference] = useState<'preferred' | 'available' | 'avoid'>('preferred');

  const { toast } = useToast();

  // Mock faculty ID - in real app, get from auth context
  const facultyId = 'current-faculty-id';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseData, prefData] = await Promise.all([
          courseService.getAllCourses(),
          facultyPreferenceService.getPreferencesByFaculty(facultyId)
        ]);
        
        setCourses(courseData);
        setPreferences(prefData);
        
        // Load existing preference for current term if exists
        const existing = prefData.find(p => 
          p.academicYear === '2024-25' && p.semester === 1
        );
        
        if (existing) {
          setCurrentPreference(existing);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [facultyId, toast]);

  const handleSavePreferences = async () => {
    setIsSaving(true);
    
    try {
      const preferenceData = {
        ...currentPreference,
        facultyId
      } as Omit<FacultyPreference, 'id' | 'createdAt' | 'updatedAt'>;

      if (currentPreference.id) {
        await facultyPreferenceService.updatePreference(currentPreference.id, preferenceData);
        toast({
          title: "Preferences Updated",
          description: "Your preferences have been saved successfully."
        });
      } else {
        await facultyPreferenceService.createPreference(preferenceData);
        toast({
          title: "Preferences Saved",
          description: "Your preferences have been created successfully."
        });
      }
      
      // Refresh preferences
      const updatedPrefs = await facultyPreferenceService.getPreferencesByFaculty(facultyId);
      setPreferences(updatedPrefs);
      
      const existing = updatedPrefs.find(p => 
        p.academicYear === currentPreference.academicYear && 
        p.semester === currentPreference.semester
      );
      if (existing) {
        setCurrentPreference(existing);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: (error as Error).message
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addCoursePreference = () => {
    if (!newCourseId) return;
    
    const course = courses.find(c => c.id === newCourseId);
    if (!course) return;

    const existingIndex = currentPreference.preferredCourses?.findIndex(cp => cp.courseId === newCourseId);
    
    const newPreference: CoursePreference = {
      courseId: newCourseId,
      preference: newCoursePreference,
      expertise: newCourseExpertise,
      previouslyTaught: false,
      maxSections: 2
    };

    if (existingIndex !== undefined && existingIndex >= 0) {
      // Update existing
      const updated = [...(currentPreference.preferredCourses || [])];
      updated[existingIndex] = newPreference;
      setCurrentPreference(prev => ({ ...prev, preferredCourses: updated }));
    } else {
      // Add new
      setCurrentPreference(prev => ({
        ...prev,
        preferredCourses: [...(prev.preferredCourses || []), newPreference]
      }));
    }

    // Reset form
    setNewCourseId('');
    setNewCoursePreference('medium');
    setNewCourseExpertise(5);
  };

  const removeCoursePreference = (courseId: string) => {
    setCurrentPreference(prev => ({
      ...prev,
      preferredCourses: prev.preferredCourses?.filter(cp => cp.courseId !== courseId) || []
    }));
  };

  const addTimePreference = () => {
    if (newTimeStart >= newTimeEnd) {
      toast({
        variant: "destructive",
        title: "Invalid Time",
        description: "End time must be after start time"
      });
      return;
    }

    const newPreference: TimePreference = {
      dayOfWeek: newTimeDay,
      startTime: newTimeStart,
      endTime: newTimeEnd,
      preference: newTimePreference
    };

    setCurrentPreference(prev => ({
      ...prev,
      timePreferences: [...(prev.timePreferences || []), newPreference]
    }));

    // Reset form
    setNewTimeStart('09:00');
    setNewTimeEnd('10:00');
    setNewTimePreference('preferred');
  };

  const removeTimePreference = (index: number) => {
    setCurrentPreference(prev => ({
      ...prev,
      timePreferences: prev.timePreferences?.filter((_, i) => i !== index) || []
    }));
  };

  const toggleWorkingDay = (day: DayOfWeek) => {
    const workingDays = currentPreference.workingDays || [];
    const isSelected = workingDays.includes(day);
    
    if (isSelected) {
      setCurrentPreference(prev => ({
        ...prev,
        workingDays: workingDays.filter(d => d !== day)
      }));
    } else {
      setCurrentPreference(prev => ({
        ...prev,
        workingDays: [...workingDays, day]
      }));
    }
  };

  const getPreferenceColor = (preference: string) => {
    switch (preference) {
      case 'high': 
      case 'preferred': 
        return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200';
      case 'medium': 
      case 'available': 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200';
      case 'low': 
      case 'avoid': 
        return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading preferences...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Teaching Preferences</h1>
            <p className="text-muted-foreground">
              Configure your course and time preferences for timetable generation
            </p>
          </div>
        </div>
        
        <Button onClick={handleSavePreferences} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Academic Term
              </CardTitle>
              <CardDescription>
                Select the academic term for these preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Academic Year</Label>
                  <Select 
                    value={currentPreference.academicYear || ''}
                    onValueChange={(value) => setCurrentPreference(prev => ({ ...prev, academicYear: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-25">2024-25</SelectItem>
                      <SelectItem value="2025-26">2025-26</SelectItem>
                      <SelectItem value="2023-24">2023-24</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Semester</Label>
                  <Select 
                    value={currentPreference.semester?.toString() || ''}
                    onValueChange={(value) => setCurrentPreference(prev => ({ ...prev, semester: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8].map(sem => (
                        <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Preferences
              </CardTitle>
              <CardDescription>
                Specify which courses you'd like to teach and your expertise level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border p-3 rounded-md">
                <div>
                  <Label>Course</Label>
                  <Select value={newCourseId} onValueChange={setNewCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses
                        .filter(c => !currentPreference.preferredCourses?.some(cp => cp.courseId === c.id))
                        .map(course => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.subjectName} ({course.subjectCode})
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Preference</Label>
                  <Select value={newCoursePreference} onValueChange={(val: any) => setNewCoursePreference(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Expertise (1-10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={newCourseExpertise}
                    onChange={(e) => setNewCourseExpertise(parseInt(e.target.value))}
                  />
                </div>
                <Button onClick={addCoursePreference} disabled={!newCourseId}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {currentPreference.preferredCourses?.map((cp, index) => {
                  const course = courses.find(c => c.id === cp.courseId);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{course?.subjectName}</p>
                          <p className="text-sm text-muted-foreground">{course?.subjectCode}</p>
                        </div>
                        <Badge className={getPreferenceColor(cp.preference)}>
                          {cp.preference}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">{cp.expertise}/10</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCoursePreference(cp.courseId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                
                {(!currentPreference.preferredCourses || currentPreference.preferredCourses.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">
                    No course preferences added yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Time Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Preferences
              </CardTitle>
              <CardDescription>
                Specify your preferred, available, and unavailable time slots
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end border p-3 rounded-md">
                <div>
                  <Label>Day</Label>
                  <Select value={newTimeDay} onValueChange={(val: any) => setNewTimeDay(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Time</Label>
                  <Select value={newTimeStart} onValueChange={setNewTimeStart}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>End Time</Label>
                  <Select value={newTimeEnd} onValueChange={setNewTimeEnd}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Preference</Label>
                  <Select value={newTimePreference} onValueChange={(val: any) => setNewTimePreference(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preferred">Preferred</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="avoid">Avoid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addTimePreference}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Preference</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPreference.timePreferences?.map((tp, index) => (
                    <TableRow key={index}>
                      <TableCell>{tp.dayOfWeek}</TableCell>
                      <TableCell>{tp.startTime} - {tp.endTime}</TableCell>
                      <TableCell>
                        <Badge className={getPreferenceColor(tp.preference)}>
                          {tp.preference}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimePreference(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!currentPreference.timePreferences || currentPreference.timePreferences.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No time preferences added yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Working Days</CardTitle>
              <CardDescription>
                Select the days you're available to teach
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {DAYS.map(day => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={currentPreference.workingDays?.includes(day) || false}
                      onCheckedChange={() => toggleWorkingDay(day)}
                    />
                    <Label htmlFor={day}>{day}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workload Limits</CardTitle>
              <CardDescription>
                Set your maximum teaching load preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Max Hours Per Week</Label>
                <Input
                  type="number"
                  min={1}
                  max={40}
                  value={currentPreference.maxHoursPerWeek}
                  onChange={(e) => setCurrentPreference(prev => ({ 
                    ...prev, 
                    maxHoursPerWeek: parseInt(e.target.value) 
                  }))}
                />
              </div>
              <div>
                <Label>Max Consecutive Hours</Label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={currentPreference.maxConsecutiveHours}
                  onChange={(e) => setCurrentPreference(prev => ({ 
                    ...prev, 
                    maxConsecutiveHours: parseInt(e.target.value) 
                  }))}
                />
              </div>
              <div>
                <Label>Priority Level (1-10)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={currentPreference.priority}
                  onChange={(e) => setCurrentPreference(prev => ({ 
                    ...prev, 
                    priority: parseInt(e.target.value) 
                  }))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Higher priority = preferences weighted more heavily
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li>• Preferences are used during automatic timetable generation</li>
                <li>• High priority preferences are given more weight</li>
                <li>• Time conflicts will still be avoided regardless of preferences</li>
                <li>• You can update preferences anytime before timetable generation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}