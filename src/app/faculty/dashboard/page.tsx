'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  BookOpen, 
  AlertTriangle, 
  TrendingUp,
  CheckCircle2,
  XCircle,
  BarChart3,
  PieChart,
  Download,
  Settings,
  Podcast,
  Mic,
  Play,
  Headphones
} from 'lucide-react';
import type { FacultyTimetableView, TimetableEntry, WorkloadAlert } from '@/types/entities';

interface FacultyDashboardPageProps {}

export default function FacultyDashboardPage({}: FacultyDashboardPageProps) {
  const [facultyData, setFacultyData] = useState<FacultyTimetableView | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>('current');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchFacultyData();
  }, [selectedWeek]);

  const fetchFacultyData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      const response = await fetch(`/api/faculty/dashboard?week=${selectedWeek}`);
      const data = await response.json();
      setFacultyData(data);
    } catch (error) {
      console.error('Failed to fetch faculty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTodaysClasses = (): TimetableEntry[] => {
    if (!facultyData?.assignedTimetables) return [];
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    return facultyData.assignedTimetables
      .flatMap(tt => tt.entries)
      .filter(entry => entry.dayOfWeek === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getUpcomingClasses = (): TimetableEntry[] => {
    if (!facultyData?.assignedTimetables) return [];
    
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);
    
    return facultyData.assignedTimetables
      .flatMap(tt => tt.entries)
      .filter(entry => {
        if (entry.dayOfWeek === today) {
          return entry.startTime > currentTime;
        }
        const dayIndex = daysOfWeek.indexOf(entry.dayOfWeek);
        const todayIndex = daysOfWeek.indexOf(today);
        return dayIndex > todayIndex;
      })
      .sort((a, b) => {
        const dayDiff = daysOfWeek.indexOf(a.dayOfWeek) - daysOfWeek.indexOf(b.dayOfWeek);
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, 5);
  };

  const getWorkloadUtilization = (): number => {
    if (!facultyData?.workloadAnalysis) return 0;
    return Math.min(100, (facultyData.workloadAnalysis.currentHours / facultyData.workloadAnalysis.maxHours) * 100);
  };

  const getAlertsByPriority = () => {
    if (!facultyData?.workloadAlerts) return { high: 0, medium: 0, low: 0 };
    
    return facultyData.workloadAlerts.reduce((acc, alert) => {
      acc[alert.priority as keyof typeof acc]++;
      return acc;
    }, { high: 0, medium: 0, low: 0 });
  };

  const exportSchedule = async (format: 'pdf' | 'ical') => {
    try {
      const response = await fetch(`/api/faculty/schedule/export?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facultyId: facultyData?.facultyId })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schedule.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-3 sm:p-4 md:p-6">
        <div className="animate-pulse space-y-4 sm:space-y-6">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-2/3 sm:w-1/3"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 sm:h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!facultyData) {
    return (
      <div className="container mx-auto p-3 sm:p-4 md:p-6">
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <AlertTriangle className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-gray-600 text-sm sm:text-base px-4">Could not load your dashboard data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const alertCounts = getAlertsByPriority();
  const utilizationPercentage = getWorkloadUtilization();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
          <p className="text-gray-600">
            Welcome, {facultyData.facultyName} • {facultyData.department}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportSchedule('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => exportSchedule('ical')}>
            <Calendar className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold">{facultyData.totalCourses}</p>
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
                <p className="text-2xl font-bold">{facultyData.weeklyHours}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{facultyData.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p>Workload</p>
                <div className="flex items-center gap-2">
                  <Progress value={utilizationPercentage} className="flex-1 h-2" />
                  <span className="text-sm font-medium">{Math.round(utilizationPercentage)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {facultyData.workloadAlerts && facultyData.workloadAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Workload Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {facultyData.workloadAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className={`p-1 rounded-full ${
                    alert.priority === 'high' ? 'bg-red-100 text-red-600' :
                    alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {alert.priority === 'high' ? <XCircle className="h-4 w-4" /> : 
                     alert.priority === 'medium' ? <AlertTriangle className="h-4 w-4" /> : 
                     <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                  </div>
                  <Badge variant={alert.priority === 'high' ? 'destructive' : 'secondary'}>
                    {alert.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getTodaysClasses().length > 0 ? (
            <div className="space-y-3">
              {getTodaysClasses().map((entry, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="text-center">
                    <div className="text-lg font-bold">{entry.startTime}</div>
                    <div className="text-sm text-gray-500">{entry.endTime}</div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{entry.courseId}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {entry.roomId}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Batch {entry.courseOfferingId?.slice(-1)}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{entry.entryType}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No classes scheduled for today
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="schedule" className="space-y-3 sm:space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5">
          <TabsTrigger value="schedule" className="text-xs sm:text-sm">Schedule</TabsTrigger>
          <TabsTrigger value="workload" className="text-xs sm:text-sm">Workload</TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs sm:text-sm">Upcoming</TabsTrigger>
          <TabsTrigger value="podcasts" className="text-xs sm:text-sm">Podcasts</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Teaching Schedule</CardTitle>
              <CardDescription>Your complete weekly schedule across all courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 gap-1 min-w-[600px] sm:min-w-[800px]">
                  <div className="p-1 sm:p-2 font-semibold text-xs sm:text-sm">Time</div>
                  {daysOfWeek.map((day) => (
                    <div key={day} className="p-1 sm:p-2 font-semibold text-center text-xs sm:text-sm">
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.slice(0, 3)}</span>
                    </div>
                  ))}
                  
                  {[...Array(10)].map((_, timeIndex) => {
                    const hour = 8 + timeIndex;
                    const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                    
                    return (
                      <React.Fragment key={timeSlot}>
                        <div className="p-1 sm:p-2 text-xs sm:text-sm font-medium bg-gray-50 border-r">
                          {timeSlot}
                        </div>
                        {daysOfWeek.map((day) => {
                          const entry = facultyData.assignedTimetables
                            ?.flatMap(tt => tt.entries)
                            .find(e => e.dayOfWeek === day && e.startTime === timeSlot);
                          
                          return (
                            <div key={`${day}-${timeSlot}`} className="p-0.5 sm:p-1 border min-h-[50px] sm:min-h-[60px]">
                              {entry && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-1 sm:p-2 text-xs">
                                  <div className="font-semibold text-blue-900 truncate">{entry.courseId}</div>
                                  <div className="text-blue-700 truncate">{entry.roomId}</div>
                                  <div className="text-gray-600 text-[10px] sm:text-xs truncate">{entry.entryType}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workload">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Workload Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {facultyData.workloadAnalysis && (
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs sm:text-sm font-medium">Current Hours</span>
                        <span className="text-xs sm:text-sm text-gray-600">
                          {facultyData.workloadAnalysis.currentHours} / {facultyData.workloadAnalysis.maxHours}
                        </span>
                      </div>
                      <Progress value={utilizationPercentage} className="h-2 sm:h-3" />
                      <div className="text-xs text-gray-500 mt-1">
                        {utilizationPercentage > 90 ? 'Overloaded' : 
                         utilizationPercentage > 70 ? 'Well Utilized' : 'Under Utilized'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Lecture Hours</p>
                        <p className="text-base sm:text-lg font-semibold">{facultyData.workloadAnalysis.lectureHours}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Lab Hours</p>
                        <p className="text-base sm:text-lg font-semibold">{facultyData.workloadAnalysis.labHours}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Tutorial Hours</p>
                        <p className="text-base sm:text-lg font-semibold">{facultyData.workloadAnalysis.tutorialHours}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Avg Daily Hours</p>
                        <p className="text-base sm:text-lg font-semibold">
                          {(facultyData.workloadAnalysis.currentHours / 6).toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Hour Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {daysOfWeek.map((day) => {
                    const dayHours = facultyData.assignedTimetables
                      ?.flatMap(tt => tt.entries)
                      .filter(e => e.dayOfWeek === day)
                      .reduce((total, entry) => {
                        const start = new Date(`2000-01-01T${entry.startTime}`);
                        const end = new Date(`2000-01-01T${entry.endTime}`);
                        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                      }, 0) || 0;
                    
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <div className="w-20 text-sm font-medium">{day}</div>
                        <div className="flex-1">
                          <Progress value={(dayHours / 8) * 100} className="h-2" />
                        </div>
                        <div className="w-12 text-sm text-right">{dayHours.toFixed(1)}h</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Classes</CardTitle>
              <CardDescription>Your next scheduled classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getUpcomingClasses().map((entry, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="text-center">
                      <div className="text-sm font-medium">{entry.dayOfWeek}</div>
                      <div className="text-lg font-bold">{entry.startTime}</div>
                      <div className="text-sm text-gray-500">{entry.endTime}</div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{entry.courseId}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {entry.roomId}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Batch {entry.courseOfferingId?.slice(-1)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{entry.entryType}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="podcasts">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course-Related Podcasts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Podcast className="h-5 w-5 text-pink-600" />
                  Course Podcasts
                </CardTitle>
                <CardDescription>
                  Podcast episodes related to your courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Machine Learning Fundamentals</h4>
                      <p className="text-sm text-muted-foreground">AI Research Insights • 45:30</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">Your Course</Badge>
                        <Badge variant="outline" className="text-xs">New</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Headphones className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Research Methodology in CS</h4>
                      <p className="text-sm text-muted-foreground">Academic Discussions • 38:15</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">Related</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Headphones className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-center pt-4">
                    <Button variant="outline" size="sm">
                      View All Course Podcasts
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recording & Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-red-600" />
                  Create Content
                </CardTitle>
                <CardDescription>
                  Record and share educational content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Mic className="h-4 w-4 text-pink-600" />
                      <h4 className="font-semibold text-pink-900">Quick Recording</h4>
                    </div>
                    <p className="text-sm text-pink-800 mb-3">
                      Record course explanations or lectures directly from your browser
                    </p>
                    <Button size="sm" className="bg-pink-600 hover:bg-pink-700">
                      <Mic className="w-4 h-4 mr-2" />
                      Start Recording
                    </Button>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Podcast className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">Upload Content</h4>
                    </div>
                    <p className="text-sm text-blue-800 mb-3">
                      Share pre-recorded lectures or educational content
                    </p>
                    <Button size="sm" variant="outline" className="border-blue-600 text-blue-700 hover:bg-blue-50">
                      Upload Audio
                    </Button>
                  </div>

                  <div className="pt-2 text-center">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      View Podcast Studio →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Podcast Activity</CardTitle>
              <CardDescription>Your recent podcast interactions and uploads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Episode published successfully</p>
                    <p className="text-xs text-muted-foreground">"CNN Modulation Classification" • 2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New episode available</p>
                    <p className="text-xs text-muted-foreground">"Research Methodology in CS" • 1 day ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Mic className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Recording uploaded</p>
                    <p className="text-xs text-muted-foreground">"Machine Learning Basics" • 3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Course Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {facultyData.courseDistribution?.map((course, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{course.courseName}</div>
                        <div className="text-sm text-gray-600">{course.hours} hours/week</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{course.percentage}%</div>
                        <Progress value={course.percentage} className="h-2 w-16" />
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-gray-500">
                      No course distribution data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teaching Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Classes Completed</span>
                    <span className="font-semibold">{facultyData.performanceMetrics?.completedClasses || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Classes Remaining</span>
                    <span className="font-semibold">{facultyData.performanceMetrics?.remainingClasses || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Attendance Rate</span>
                    <span className="font-semibold">{facultyData.performanceMetrics?.attendanceRate || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Student Satisfaction</span>
                    <span className="font-semibold">{facultyData.performanceMetrics?.satisfactionScore || 0}/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}