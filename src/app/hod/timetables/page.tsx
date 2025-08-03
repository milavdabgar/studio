"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Calendar,
  Search,
  Filter,
  Download,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  FileText,
  TrendingUp,
  Building,
  UserCheck,
  BookOpen,
  Loader2,
  RefreshCw,
  Settings,
  PlusCircle,
  X,
  Check,
  RotateCcw,
  MapPin,
  Play,
  Pause
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TimetableEntry {
  id: string;
  timeSlot: string;
  subject: string;
  subjectCode: string;
  faculty: string;
  room: string;
  type: 'lecture' | 'lab' | 'tutorial';
  batch: string;
  duration: number;
}

interface DepartmentTimetable {
  id: string;
  name: string;
  program: string;
  batch: string;
  semester: number;
  academicYear: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'archived';
  version: string;
  approvalStatus: {
    hodApproved: boolean;
    principalApproved: boolean;
    finalApproved: boolean;
  };
  metadata: {
    totalSubjects: number;
    totalFaculty: number;
    totalHours: number;
    workingDays: number;
    conflicts: number;
    roomUtilization: number;
    facultyWorkload: number;
  };
  schedule: {
    [day: string]: TimetableEntry[];
  };
  conflicts: {
    id: string;
    type: 'faculty_clash' | 'room_clash' | 'subject_clash';
    severity: 'high' | 'medium' | 'low';
    description: string;
    affectedEntries: string[];
    suggestions: string[];
  }[];
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

interface TimetableMetrics {
  totalTimetables: number;
  pendingApproval: number;
  approved: number;
  published: number;
  totalConflicts: number;
  averageUtilization: number;
  facultyAssigned: number;
  roomsUtilized: number;
  approvalPendingDays: number;
}

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string;
  department?: string;
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

const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = "blue", alert }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  trend?: { value: number; isPositive: boolean };
  color?: string;
  alert?: boolean;
}) => (
  <Card className={`hover:shadow-lg transition-shadow ${alert ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10' : ''}`}>
    <CardContent className="p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl sm:text-3xl font-bold">{value}</p>
            {trend && (
              <Badge variant={trend.isPositive ? "default" : "destructive"} className="text-xs">
                {trend.isPositive ? "+" : ""}{trend.value}%
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          <Icon className={`h-6 w-6 sm:h-8 sm:w-8 text-${color}-500 ${alert ? 'animate-pulse' : ''}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function HODTimetablesPage() {
  const [timetables, setTimetables] = useState<DepartmentTimetable[]>([]);
  const [metrics, setMetrics] = useState<TimetableMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        parsedUser.department = 'Computer Science & Engineering';
        setUser(parsedUser);
      } catch {
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    }
  }, [toast]);

  const fetchTimetableData = async () => {
    if (!user?.department) return;
    
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockMetrics: TimetableMetrics = {
        totalTimetables: 12,
        pendingApproval: 3,
        approved: 8,
        published: 7,
        totalConflicts: 5,
        averageUtilization: 78,
        facultyAssigned: 22,
        roomsUtilized: 15,
        approvalPendingDays: 2
      };

      const mockTimetables: DepartmentTimetable[] = [
        {
          id: '1',
          name: 'CE Semester 3 Regular Timetable',
          program: 'B.Tech Computer Engineering',
          batch: 'CE-2023-A',
          semester: 3,
          academicYear: '2024-25',
          status: 'pending_approval',
          version: 'v2.1',
          approvalStatus: {
            hodApproved: false,
            principalApproved: false,
            finalApproved: false
          },
          metadata: {
            totalSubjects: 6,
            totalFaculty: 8,
            totalHours: 30,
            workingDays: 6,
            conflicts: 2,
            roomUtilization: 82,
            facultyWorkload: 85
          },
          schedule: {
            'Monday': [
              {
                id: 'mon1',
                timeSlot: '09:00-10:00',
                subject: 'Data Structures',
                subjectCode: 'CS-201',
                faculty: 'Dr. Rajesh Kumar',
                room: 'Room 201',
                type: 'lecture',
                batch: 'CE-2023-A',
                duration: 60
              },
              {
                id: 'mon2',
                timeSlot: '10:00-11:00',
                subject: 'Digital Electronics',
                subjectCode: 'EC-203',
                faculty: 'Prof. Priya Sharma',
                room: 'Room 202',
                type: 'lecture',
                batch: 'CE-2023-A',
                duration: 60
              }
            ],
            'Tuesday': [],
            'Wednesday': [],
            'Thursday': [],
            'Friday': [],
            'Saturday': []
          },
          conflicts: [
            {
              id: 'conf1',
              type: 'faculty_clash',
              severity: 'high',
              description: 'Dr. Rajesh Kumar has overlapping classes in CS-201 and CS-301',
              affectedEntries: ['mon1', 'tue2'],
              suggestions: ['Reschedule CS-301 to different time slot', 'Assign co-instructor']
            },
            {
              id: 'conf2',
              type: 'room_clash',
              severity: 'medium',
              description: 'Room 201 is double-booked on Tuesday 10:00-11:00',
              affectedEntries: ['tue1', 'tue3'],
              suggestions: ['Use Room 203 for one of the classes', 'Shift one class to different time']
            }
          ],
          createdBy: 'System',
          createdAt: new Date('2024-07-20'),
          lastModified: new Date('2024-07-26')
        },
        {
          id: '2',
          name: 'CE Semester 5 Regular Timetable',
          program: 'B.Tech Computer Engineering',
          batch: 'CE-2022-A',
          semester: 5,
          academicYear: '2024-25',
          status: 'approved',
          version: 'v1.8',
          approvalStatus: {
            hodApproved: true,
            principalApproved: true,
            finalApproved: true
          },
          metadata: {
            totalSubjects: 7,
            totalFaculty: 10,
            totalHours: 35,
            workingDays: 6,
            conflicts: 0,
            roomUtilization: 89,
            facultyWorkload: 92
          },
          schedule: {
            'Monday': [],
            'Tuesday': [],
            'Wednesday': [],
            'Thursday': [],
            'Friday': [],
            'Saturday': []
          },
          conflicts: [],
          createdBy: 'Dr. Amit Patel',
          createdAt: new Date('2024-07-15'),
          lastModified: new Date('2024-07-22'),
          approvedBy: 'HOD',
          approvedAt: new Date('2024-07-24')
        },
        {
          id: '3',
          name: 'DCE Semester 2 Regular Timetable',
          program: 'Diploma Computer Engineering',
          batch: 'DCE-2024-B',
          semester: 2,
          academicYear: '2024-25',
          status: 'published',
          version: 'v1.5',
          approvalStatus: {
            hodApproved: true,
            principalApproved: true,
            finalApproved: true
          },
          metadata: {
            totalSubjects: 5,
            totalFaculty: 6,
            totalHours: 25,
            workingDays: 6,
            conflicts: 0,
            roomUtilization: 75,
            facultyWorkload: 78
          },
          schedule: {
            'Monday': [],
            'Tuesday': [],
            'Wednesday': [],
            'Thursday': [],
            'Friday': [],
            'Saturday': []
          },
          conflicts: [],
          createdBy: 'Prof. Sneha Joshi',
          createdAt: new Date('2024-07-10'),
          lastModified: new Date('2024-07-18'),
          approvedBy: 'Principal',
          approvedAt: new Date('2024-07-20')
        }
      ];

      setMetrics(mockMetrics);
      setTimetables(mockTimetables);

    } catch (error) {
      console.error("Error fetching timetable data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load timetable data." });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTimetableData();
  }, [user]);

  const filteredTimetables = timetables.filter(timetable => {
    const matchesSearch = timetable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         timetable.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         timetable.program.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || timetable.status === selectedStatus;
    const matchesProgram = selectedProgram === 'all' || timetable.program === selectedProgram;
    const matchesSemester = selectedSemester === 'all' || timetable.semester.toString() === selectedSemester;
    
    return matchesSearch && matchesStatus && matchesProgram && matchesSemester;
  });

  const getStatusColor = (status: DepartmentTimetable['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'archived': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleApprove = async (timetableId: string) => {
    try {
      // API call to approve timetable
      toast({
        title: "Timetable Approved",
        description: "Timetable has been successfully approved.",
      });
      fetchTimetableData(); // Refresh data
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve timetable.",
      });
    }
  };

  const handleReject = async (timetableId: string) => {
    try {
      // API call to reject timetable
      toast({
        title: "Timetable Rejected",
        description: "Timetable has been rejected and sent back for revision.",
      });
      fetchTimetableData(); // Refresh data
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject timetable.",
      });
    }
  };

  const handlePublish = async (timetableId: string) => {
    try {
      // API call to publish timetable
      toast({
        title: "Timetable Published",
        description: "Timetable has been published and is now live.",
      });
      fetchTimetableData(); // Refresh data
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to publish timetable.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mx-auto mb-4" />
          <p>Loading Timetable Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8" />
            Timetable Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {user?.department} • Academic Year 2024-25
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchTimetableData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Timetable
          </Button>
        </div>
      </div>

      {/* Urgent Actions Alert */}
      {metrics && metrics.pendingApproval > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            {metrics.pendingApproval} timetables are pending your approval for {metrics.approvalPendingDays} days. 
            Please review and approve to avoid academic schedule delays.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          <MetricCard
            title="Total Timetables"
            value={metrics.totalTimetables}
            subtitle="Department schedules"
            icon={Calendar}
            color="blue"
          />
          <MetricCard
            title="Pending Approval"
            value={metrics.pendingApproval}
            subtitle="Awaiting review"
            icon={Clock}
            color="orange"
            alert={metrics.pendingApproval > 2}
          />
          <MetricCard
            title="Approved"
            value={metrics.approved}
            subtitle="Ready to publish"
            icon={CheckCircle}
            color="green"
          />
          <MetricCard
            title="Published"
            value={metrics.published}
            subtitle="Live schedules"
            icon={Play}
            color="purple"
          />
          <MetricCard
            title="Total Conflicts"
            value={metrics.totalConflicts}
            subtitle="Need resolution"
            icon={AlertTriangle}
            color="red"
            alert={metrics.totalConflicts > 3}
          />
          <MetricCard
            title="Avg Utilization"
            value={`${metrics.averageUtilization}%`}
            subtitle="Resource usage"
            icon={TrendingUp}
            color="teal"
          />
          <MetricCard
            title="Faculty Assigned"
            value={metrics.facultyAssigned}
            subtitle="Teaching staff"
            icon={UserCheck}
            color="indigo"
          />
          <MetricCard
            title="Rooms Utilized"
            value={metrics.roomsUtilized}
            subtitle="Active classrooms"
            icon={Building}
            color="yellow"
          />
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by timetable name, program, or batch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  <SelectItem value="B.Tech Computer Engineering">B.Tech Computer Engineering</SelectItem>
                  <SelectItem value="Diploma Computer Engineering">Diploma Computer Engineering</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timetables List */}
      <Card>
        <CardHeader>
          <CardTitle>Department Timetables ({filteredTimetables.length})</CardTitle>
          <CardDescription>Academic schedule management and approval workflows</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTimetables.length > 0 ? (
            <div className="space-y-6">
              {filteredTimetables.map((timetable) => (
                <div key={timetable.id} className="border rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Timetable Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-semibold text-xl">{timetable.name}</h4>
                        <Badge className={getStatusColor(timetable.status)}>
                          {timetable.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {timetable.version}
                        </Badge>
                        {timetable.conflicts.length > 0 && (
                          <Badge variant="destructive">
                            {timetable.conflicts.length} Conflicts
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-muted-foreground">Program:</span>
                          <div className="font-medium">{timetable.program}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Batch:</span>
                          <div className="font-medium">{timetable.batch}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Semester:</span>
                          <div className="font-medium">Semester {timetable.semester}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Academic Year:</span>
                          <div className="font-medium">{timetable.academicYear}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-muted-foreground">Subjects:</span>
                          <div className="font-medium">{timetable.metadata.totalSubjects}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Faculty:</span>
                          <div className="font-medium">{timetable.metadata.totalFaculty}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Hours:</span>
                          <div className="font-medium">{timetable.metadata.totalHours}/week</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Working Days:</span>
                          <div className="font-medium">{timetable.metadata.workingDays}</div>
                        </div>
                      </div>

                      {/* Approval Status */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Approval Status:</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {timetable.approvalStatus.hodApproved ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className="text-xs">HOD</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {timetable.approvalStatus.principalApproved ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-xs">Principal</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {timetable.approvalStatus.finalApproved ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-xs">Final</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Timetable Metrics & Actions */}
                    <div className="lg:w-80">
                      <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 mb-4">
                        {/* Utilization */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Room Utilization</span>
                            <span className="font-bold text-blue-600">{timetable.metadata.roomUtilization}%</span>
                          </div>
                          <Progress value={timetable.metadata.roomUtilization} className="h-2" />
                        </div>

                        {/* Faculty Workload */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Faculty Workload</span>
                            <span className="font-bold text-green-600">{timetable.metadata.facultyWorkload}%</span>
                          </div>
                          <Progress value={timetable.metadata.facultyWorkload} className="h-2" />
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                        
                        {/* Approval Actions */}
                        {timetable.status === 'pending_approval' && !timetable.approvalStatus.hodApproved && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleApprove(timetable.id)}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleReject(timetable.id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                        
                        {/* Publish Action */}
                        {timetable.status === 'approved' && (
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handlePublish(timetable.id)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Publish Timetable
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Conflicts Section */}
                  {timetable.conflicts.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Conflicts Requiring Resolution
                      </h5>
                      <div className="space-y-2">
                        {timetable.conflicts.map((conflict) => (
                          <Alert key={conflict.id} className={`border-l-4 ${getSeverityColor(conflict.severity)}`}>
                            <AlertDescription className="text-sm">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium capitalize">{conflict.type.replace('_', ' ')}: </span>
                                  {conflict.description}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {conflict.severity.toUpperCase()}
                                </Badge>
                              </div>
                              {conflict.suggestions.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs font-medium">Suggestions:</span>
                                  <ul className="text-xs mt-1 list-disc list-inside">
                                    {conflict.suggestions.map((suggestion, index) => (
                                      <li key={index}>{suggestion}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Details */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Created By:</span>
                        <div className="font-medium">{timetable.createdBy}</div>
                        <div className="text-xs text-muted-foreground">
                          {timetable.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Modified:</span>
                        <div className="text-xs">{timetable.lastModified.toLocaleDateString()}</div>
                      </div>
                      <div>
                        {timetable.approvedBy && (
                          <>
                            <span className="text-muted-foreground">Approved By:</span>
                            <div className="font-medium">{timetable.approvedBy}</div>
                            <div className="text-xs text-muted-foreground">
                              {timetable.approvedAt?.toLocaleDateString()}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No timetables found matching your criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}