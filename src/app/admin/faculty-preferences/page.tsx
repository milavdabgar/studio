'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, Edit, Trash2, PlusCircle, Users, Clock, BookOpenCheck, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FacultyPreference, Faculty, Course, AcademicTerm, CoursePreference, TimePreference, TimeSlot } from '@/types/entities';

interface FacultyPreferenceWithDetails extends FacultyPreference {
  facultyName?: string;
  facultyDepartment?: string;
  termName?: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export default function FacultyPreferencesPage() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<FacultyPreferenceWithDetails[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    academicYear: 'all',
    semester: 'all',
    facultyId: 'all'
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPreference, setEditingPreference] = useState<FacultyPreferenceWithDetails | null>(null);

  // Form state for creating/editing preferences
  const [formData, setFormData] = useState<Omit<FacultyPreference, 'id' | 'createdAt' | 'updatedAt'>>({
    facultyId: '',
    academicYear: '',
    semester: 1,
    preferredCourses: [],
    timePreferences: [],
    roomPreferences: [],
    maxHoursPerWeek: 18,
    maxConsecutiveHours: 4,
    unavailableSlots: [],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    priority: 5
  });

  // Fetch all data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [preferencesRes, facultiesRes, coursesRes, termsRes] = await Promise.all([
        fetch('/api/faculty-preferences'),
        fetch('/api/faculty'),
        fetch('/api/courses'),
        fetch('/api/academic-terms')
      ]);

      const [preferencesData, facultiesData, coursesData, termsData] = await Promise.all([
        preferencesRes.json(),
        facultiesRes.json(),
        coursesRes.json(),
        termsRes.json()
      ]);

      // Enrich preferences with additional details
      const enrichedPreferences = (preferencesData.success ? preferencesData.data : []).map((pref: FacultyPreference) => {
        const faculty = facultiesData.find((f: Faculty) => f.id === pref.facultyId);
        const term = termsData?.data?.find((t: AcademicTerm) => t.academicYear === pref.academicYear);

        return {
          ...pref,
          facultyName: faculty?.displayName || faculty?.fullName || faculty?.firstName || 'Unknown Faculty',
          facultyDepartment: faculty?.department || 'Unknown Department',
          termName: term?.name || `${pref.academicYear} - Semester ${pref.semester}`
        };
      });

      setPreferences(enrichedPreferences);
      setFaculties(facultiesData);
      setCourses(coursesData);
      setAcademicTerms(termsData.success ? termsData.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load faculty preferences data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    // Validation
    if (!formData.facultyId || !formData.academicYear || !formData.semester) {
      toast({
        title: "Validation Error",
        description: "Please select faculty, academic year, and semester.",
        variant: "destructive",
      });
      return;
    }

    try {
      const method = editingPreference ? 'PUT' : 'POST';
      const url = editingPreference 
        ? `/api/faculty-preferences/${editingPreference.id}` 
        : '/api/faculty-preferences';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: `Faculty preference ${editingPreference ? 'updated' : 'created'} successfully`,
        });
        setShowCreateDialog(false);
        setEditingPreference(null);
        resetForm();
        fetchData();
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to save faculty preference',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving faculty preference:', error);
      toast({
        title: "Error",
        description: "Failed to save faculty preference",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/faculty-preferences/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Faculty preference deleted successfully",
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete faculty preference",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting faculty preference:', error);
      toast({
        title: "Error",
        description: "Failed to delete faculty preference",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      facultyId: '',
      academicYear: '',
      semester: 1,
      preferredCourses: [],
      timePreferences: [],
      roomPreferences: [],
      maxHoursPerWeek: 18,
      maxConsecutiveHours: 4,
      unavailableSlots: [],
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      priority: 5
    });
    setEditingPreference(null);
  };

  const openEditDialog = (preference: FacultyPreferenceWithDetails) => {
    setEditingPreference(preference);
    setFormData({
      facultyId: preference.facultyId,
      academicYear: preference.academicYear,
      semester: preference.semester,
      preferredCourses: preference.preferredCourses || [],
      timePreferences: preference.timePreferences || [],
      roomPreferences: preference.roomPreferences || [],
      maxHoursPerWeek: preference.maxHoursPerWeek,
      maxConsecutiveHours: preference.maxConsecutiveHours,
      unavailableSlots: preference.unavailableSlots || [],
      workingDays: preference.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      priority: preference.priority
    });
    setShowCreateDialog(true);
  };

  const addCoursePreference = () => {
    const newCoursePreference: CoursePreference = {
      courseId: '',
      preference: 'medium',
      expertise: 5,
      previouslyTaught: false
    };
    setFormData({
      ...formData,
      preferredCourses: [...formData.preferredCourses, newCoursePreference]
    });
  };

  const updateCoursePreference = (index: number, field: keyof CoursePreference, value: any) => {
    const updatedCourses = [...formData.preferredCourses];
    updatedCourses[index] = { ...updatedCourses[index], [field]: value };
    setFormData({ ...formData, preferredCourses: updatedCourses });
  };

  const removeCoursePreference = (index: number) => {
    const updatedCourses = formData.preferredCourses.filter((_, i) => i !== index);
    setFormData({ ...formData, preferredCourses: updatedCourses });
  };

  const addTimePreference = () => {
    const newTimePreference: TimePreference = {
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      preference: 'preferred'
    };
    setFormData({
      ...formData,
      timePreferences: [...formData.timePreferences, newTimePreference]
    });
  };

  const updateTimePreference = (index: number, field: keyof TimePreference, value: any) => {
    const updatedTimes = [...formData.timePreferences];
    updatedTimes[index] = { ...updatedTimes[index], [field]: value };
    setFormData({ ...formData, timePreferences: updatedTimes });
  };

  const removeTimePreference = (index: number) => {
    const updatedTimes = formData.timePreferences.filter((_, i) => i !== index);
    setFormData({ ...formData, timePreferences: updatedTimes });
  };

  // Filter preferences
  const filteredPreferences = preferences.filter(preference => {
    const matchesSearch = !searchTerm || 
      preference.facultyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preference.facultyDepartment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preference.termName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters = 
      (filters.academicYear === 'all' || preference.academicYear === filters.academicYear) &&
      (filters.semester === 'all' || preference.semester.toString() === filters.semester) &&
      (filters.facultyId === 'all' || preference.facultyId === filters.facultyId);

    return matchesSearch && matchesFilters;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-full sm:w-40"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <Users className="h-6 w-6" />
              Faculty Preferences Management
            </CardTitle>
            <CardDescription>
              Manage faculty teaching preferences for automated timetable generation.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add Faculty Preference
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPreference ? 'Edit Faculty Preference' : 'Create Faculty Preference'}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  {/* Basic Information */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="facultyId">
                        Faculty <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.facultyId} 
                        onValueChange={(value) => setFormData({...formData, facultyId: value})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select faculty" />
                        </SelectTrigger>
                        <SelectContent>
                          {faculties.map((faculty) => (
                            <SelectItem key={faculty.id} value={faculty.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {faculty.displayName || faculty.fullName || faculty.firstName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {faculty.department} • {faculty.designation}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="academicYear">
                        Academic Year <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.academicYear} 
                        onValueChange={(value) => setFormData({...formData, academicYear: value})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicTerms.map((term) => (
                            <SelectItem key={term.academicYear} value={term.academicYear}>
                              {term.academicYear} ({term.term} Term)
                            </SelectItem>
                          ))}
                          {academicTerms.length === 0 && (
                            <>
                              <SelectItem value="2025-26">2025-26</SelectItem>
                              <SelectItem value="2024-25">2024-25</SelectItem>
                              <SelectItem value="2023-24">2023-24</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="semester">
                        Semester <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.semester.toString()} 
                        onValueChange={(value) => setFormData({...formData, semester: parseInt(value)})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((sem) => (
                            <SelectItem key={sem} value={sem.toString()}>
                              Semester {sem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Workload Settings */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="maxHoursPerWeek">Max Hours Per Week</Label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.maxHoursPerWeek}
                        onChange={(e) => setFormData({...formData, maxHoursPerWeek: parseInt(e.target.value)})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxConsecutiveHours">Max Consecutive Hours</Label>
                      <Input
                        type="number"
                        min="1"
                        max="8"
                        value={formData.maxConsecutiveHours}
                        onChange={(e) => setFormData({...formData, maxConsecutiveHours: parseInt(e.target.value)})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="priority">
                        Priority (1-10)
                        <span className="text-xs text-muted-foreground ml-2">Higher number = Higher priority</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  {/* Working Days */}
                  <div className="md:col-span-2">
                    <Label>Working Days</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day}`}
                            checked={formData.workingDays.includes(day as any)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  workingDays: [...formData.workingDays, day as any]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  workingDays: formData.workingDays.filter(d => d !== day)
                                });
                              }
                            }}
                          />
                          <label htmlFor={`day-${day}`} className="text-sm font-medium">
                            {day.substring(0, 3)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Course Preferences */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Course Preferences</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addCoursePreference}>
                        <Plus className="h-4 w-4 mr-1" /> Add Course
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {formData.preferredCourses.map((coursePreference, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 border rounded">
                          <div className="col-span-4">
                            <Select
                              value={coursePreference.courseId}
                              onValueChange={(value) => updateCoursePreference(index, 'courseId', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select course" />
                              </SelectTrigger>
                              <SelectContent>
                                {courses.map((course) => (
                                  <SelectItem key={course.id} value={course.id}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{course.subjectName}</span>
                                      <span className="text-xs text-muted-foreground">{course.subcode}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Select
                              value={coursePreference.preference}
                              onValueChange={(value) => updateCoursePreference(index, 'preference', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              placeholder="Expertise"
                              value={coursePreference.expertise}
                              onChange={(e) => updateCoursePreference(index, 'expertise', parseInt(e.target.value))}
                            />
                          </div>
                          <div className="col-span-2">
                            <Checkbox
                              checked={coursePreference.previouslyTaught}
                              onCheckedChange={(checked) => updateCoursePreference(index, 'previouslyTaught', checked)}
                            />
                            <label className="text-xs ml-1">Previously taught</label>
                          </div>
                          <div className="col-span-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeCoursePreference(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time Preferences */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Time Preferences</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addTimePreference}>
                        <Clock className="h-4 w-4 mr-1" /> Add Time Slot
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {formData.timePreferences.map((timePreference, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 border rounded">
                          <div className="col-span-3">
                            <Select
                              value={timePreference.dayOfWeek}
                              onValueChange={(value) => updateTimePreference(index, 'dayOfWeek', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DAYS_OF_WEEK.map((day) => (
                                  <SelectItem key={day} value={day}>{day}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Select
                              value={timePreference.startTime}
                              onValueChange={(value) => updateTimePreference(index, 'startTime', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_SLOTS.map((time) => (
                                  <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Select
                              value={timePreference.endTime}
                              onValueChange={(value) => updateTimePreference(index, 'endTime', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_SLOTS.map((time) => (
                                  <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3">
                            <Select
                              value={timePreference.preference}
                              onValueChange={(value) => updateTimePreference(index, 'preference', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="preferred">Preferred</SelectItem>
                                <SelectItem value="available">Available</SelectItem>
                                <SelectItem value="avoid">Avoid</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeTimePreference(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-6 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOrUpdate} className="w-full sm:w-auto">
                    {editingPreference ? 'Update' : 'Create'} Preference
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4 dark:border-gray-700">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary"/>
              Filters & Search
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search faculty, department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label>Academic Year</Label>
                <Select value={filters.academicYear} onValueChange={(value) => setFilters({...filters, academicYear: value})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    <SelectItem value="2025-26">2025-26</SelectItem>
                    <SelectItem value="2024-25">2024-25</SelectItem>
                    <SelectItem value="2023-24">2023-24</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Semester</Label>
                <Select value={filters.semester} onValueChange={(value) => setFilters({...filters, semester: value})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All semesters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All semesters</SelectItem>
                    {[1, 2, 3, 4, 5, 6].map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Faculty</Label>
                <Select value={filters.facultyId} onValueChange={(value) => setFilters({...filters, facultyId: value})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All faculties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All faculties</SelectItem>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.displayName || faculty.fullName || faculty.firstName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Faculty Preferences Table */}
          <div className="mb-6 p-4 border rounded-lg space-y-4 dark:border-gray-700">
            <h3 className="text-lg font-medium">
              Faculty Preferences ({filteredPreferences.length})
            </h3>
            {filteredPreferences.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No faculty preferences found matching your criteria.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Max Hours/Week</TableHead>
                    <TableHead>Course Preferences</TableHead>
                    <TableHead className="text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPreferences.map((preference) => (
                    <TableRow key={preference.id}>
                      <TableCell className="font-medium">
                        {preference.facultyName}
                      </TableCell>
                      <TableCell>{preference.facultyDepartment}</TableCell>
                      <TableCell>{preference.academicYear}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Sem {preference.semester}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {preference.priority}
                        </div>
                      </TableCell>
                      <TableCell>{preference.maxHoursPerWeek}h</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {preference.preferredCourses.length} courses
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(preference)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(preference.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}