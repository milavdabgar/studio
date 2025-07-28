"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Calendar, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  RefreshCw,
  Building,
  UserCheck,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";

interface AnalyticsData {
  roomUtilization: {
    roomId: string;
    roomNumber: string;
    capacity: number;
    totalSlots: number;
    occupiedSlots: number;
    utilizationPercentage: number;
    peakHours: string[];
  }[];
  facultyWorkload: {
    facultyId: string;
    facultyName: string;
    department: string;
    totalHours: number;
    maxHours: number;
    workloadPercentage: number;
    subjects: string[];
  }[];
  timeSlotAnalysis: {
    timeSlot: string;
    totalClasses: number;
    rooms: number;
    utilization: number;
  }[];
  departmentStats: {
    department: string;
    totalFaculty: number;
    totalSubjects: number;
    totalHours: number;
    avgWorkload: number;
  }[];
  timetableMetrics: {
    totalTimetables: number;
    published: number;
    draft: number;
    pendingApproval: number;
    conflicts: number;
    lastUpdated: Date;
  };
  trends: {
    date: string;
    roomUtilization: number;
    facultyWorkload: number;
    conflicts: number;
  }[];
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const StatCard = ({ title, value, subtitle, icon: Icon, trend, className = "" }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}) => (
  <Card className={`hover:shadow-lg transition-shadow ${className}`}>
    <CardContent className="p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-lg sm:text-2xl font-bold">{value}</p>
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
          <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function TimetableAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [activeTab, setActiveTab] = useState('overview');

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
    }
  }, [toast]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      try {
        // Mock analytics data - replace with actual API calls
        const mockData: AnalyticsData = {
          roomUtilization: [
            { roomId: '1', roomNumber: 'A101', capacity: 60, totalSlots: 48, occupiedSlots: 36, utilizationPercentage: 75, peakHours: ['10:00-11:00', '14:00-15:00'] },
            { roomId: '2', roomNumber: 'A102', capacity: 40, totalSlots: 48, occupiedSlots: 28, utilizationPercentage: 58, peakHours: ['09:00-10:00', '15:00-16:00'] },
            { roomId: '3', roomNumber: 'B201', capacity: 80, totalSlots: 48, occupiedSlots: 42, utilizationPercentage: 88, peakHours: ['11:00-12:00', '13:00-14:00'] },
            { roomId: '4', roomNumber: 'C301', capacity: 50, totalSlots: 48, occupiedSlots: 24, utilizationPercentage: 50, peakHours: ['12:00-13:00'] },
          ],
          facultyWorkload: [
            { facultyId: '1', facultyName: 'Dr. Smith', department: 'Computer Science', totalHours: 18, maxHours: 20, workloadPercentage: 90, subjects: ['Data Structures', 'Algorithms'] },
            { facultyId: '2', facultyName: 'Prof. Johnson', department: 'Electronics', totalHours: 16, maxHours: 20, workloadPercentage: 80, subjects: ['Digital Circuits', 'Microprocessors'] },
            { facultyId: '3', facultyName: 'Dr. Brown', department: 'Mechanical', totalHours: 14, maxHours: 20, workloadPercentage: 70, subjects: ['Thermodynamics'] },
            { facultyId: '4', facultyName: 'Prof. Davis', department: 'Computer Science', totalHours: 19, maxHours: 20, workloadPercentage: 95, subjects: ['Database Systems', 'Web Development', 'AI'] },
          ],
          timeSlotAnalysis: [
            { timeSlot: '09:00-10:00', totalClasses: 12, rooms: 8, utilization: 75 },
            { timeSlot: '10:00-11:00', totalClasses: 15, rooms: 10, utilization: 90 },
            { timeSlot: '11:00-12:00', totalClasses: 14, rooms: 9, utilization: 85 },
            { timeSlot: '12:00-13:00', totalClasses: 8, rooms: 6, utilization: 50 },
            { timeSlot: '13:00-14:00', totalClasses: 10, rooms: 7, utilization: 60 },
            { timeSlot: '14:00-15:00', totalClasses: 13, rooms: 9, utilization: 80 },
            { timeSlot: '15:00-16:00', totalClasses: 11, rooms: 8, utilization: 70 },
            { timeSlot: '16:00-17:00', totalClasses: 7, rooms: 5, utilization: 45 },
          ],
          departmentStats: [
            { department: 'Computer Science', totalFaculty: 12, totalSubjects: 8, totalHours: 180, avgWorkload: 85 },
            { department: 'Electronics', totalFaculty: 10, totalSubjects: 6, totalHours: 150, avgWorkload: 75 },
            { department: 'Mechanical', totalFaculty: 8, totalSubjects: 5, totalHours: 120, avgWorkload: 70 },
            { department: 'Civil', totalFaculty: 6, totalSubjects: 4, totalHours: 90, avgWorkload: 65 },
          ],
          timetableMetrics: {
            totalTimetables: 24,
            published: 18,
            draft: 4,
            pendingApproval: 2,
            conflicts: 3,
            lastUpdated: new Date()
          },
          trends: [
            { date: '2024-07-01', roomUtilization: 70, facultyWorkload: 75, conflicts: 5 },
            { date: '2024-07-02', roomUtilization: 72, facultyWorkload: 78, conflicts: 4 },
            { date: '2024-07-03', roomUtilization: 75, facultyWorkload: 80, conflicts: 3 },
            { date: '2024-07-04', roomUtilization: 78, facultyWorkload: 82, conflicts: 2 },
            { date: '2024-07-05', roomUtilization: 76, facultyWorkload: 85, conflicts: 3 },
            { date: '2024-07-06', roomUtilization: 80, facultyWorkload: 83, conflicts: 1 },
            { date: '2024-07-07', roomUtilization: 82, facultyWorkload: 86, conflicts: 2 },
          ]
        };

        setAnalyticsData(mockData);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load analytics data." });
      }
      setIsLoading(false);
    };

    fetchAnalyticsData();
  }, [toast, selectedDepartment, dateRange]);

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      // Mock export functionality
      toast({
        title: "Export Started",
        description: `Your ${format.toUpperCase()} report will be ready shortly.`
      });
      
      // Simulate export delay
      setTimeout(() => {
        toast({
          title: "Export Complete",
          description: `Your ${format.toUpperCase()} report has been downloaded.`
        });
      }, 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not generate the report. Please try again."
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-muted-foreground">No analytics data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <Card className="shadow-xl">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" /> 
                Timetable Analytics & Reporting
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Comprehensive insights into timetable utilization, faculty workload, and resource optimization.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="computer-science">Computer Science</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="mechanical">Mechanical</SelectItem>
                  <SelectItem value="civil">Civil</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          title="Total Timetables"
          value={analyticsData.timetableMetrics.totalTimetables}
          subtitle={`${analyticsData.timetableMetrics.published} published`}
          icon={Calendar}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Room Utilization"
          value={`${Math.round(analyticsData.roomUtilization.reduce((acc, room) => acc + room.utilizationPercentage, 0) / analyticsData.roomUtilization.length)}%`}
          subtitle="Average across all rooms"
          icon={Building}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Faculty Workload"
          value={`${Math.round(analyticsData.facultyWorkload.reduce((acc, faculty) => acc + faculty.workloadPercentage, 0) / analyticsData.facultyWorkload.length)}%`}
          subtitle="Average workload"
          icon={UserCheck}
          trend={{ value: 3, isPositive: false }}
        />
        <StatCard
          title="Active Conflicts"
          value={analyticsData.timetableMetrics.conflicts}
          subtitle="Require attention"
          icon={AlertTriangle}
          trend={{ value: 2, isPositive: false }}
          className={analyticsData.timetableMetrics.conflicts > 0 ? "border-red-200" : ""}
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="rooms" className="text-xs sm:text-sm">Rooms</TabsTrigger>
            <TabsTrigger value="faculty" className="text-xs sm:text-sm">Faculty</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs sm:text-sm">Trends</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Time Slot Analysis */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base sm:text-lg">Time Slot Utilization</CardTitle>
                <CardDescription className="text-sm">Classes scheduled by time slots</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.timeSlotAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timeSlot" 
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="totalClasses" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Department Stats */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base sm:text-lg">Department Overview</CardTitle>
                <CardDescription className="text-sm">Faculty and workload distribution</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.departmentStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalHours"
                        label={({ department, percent }) => `${department.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        fontSize={10}
                      >
                        {analyticsData.departmentStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Stats Table */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base sm:text-lg">Department Statistics</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <div className="grid grid-cols-1 sm:hidden gap-3">
                  {analyticsData.departmentStats.map((dept) => (
                    <Card key={dept.department} className="p-3">
                      <div className="font-semibold text-sm">{dept.department}</div>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <div>Faculty: {dept.totalFaculty}</div>
                        <div>Subjects: {dept.totalSubjects}</div>
                        <div>Hours: {dept.totalHours}</div>
                        <div>Avg Load: {dept.avgWorkload}%</div>
                      </div>
                    </Card>
                  ))}
                </div>
                <table className="hidden sm:table w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Department</th>
                      <th className="text-right p-2">Faculty</th>
                      <th className="text-right p-2">Subjects</th>
                      <th className="text-right p-2">Total Hours</th>
                      <th className="text-right p-2">Avg Workload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.departmentStats.map((dept) => (
                      <tr key={dept.department} className="border-b">
                        <td className="p-2 font-medium">{dept.department}</td>
                        <td className="p-2 text-right">{dept.totalFaculty}</td>
                        <td className="p-2 text-right">{dept.totalSubjects}</td>
                        <td className="p-2 text-right">{dept.totalHours}</td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span>{dept.avgWorkload}%</span>
                            <Progress value={dept.avgWorkload} className="w-12 h-2" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base sm:text-lg">Room Utilization Analysis</CardTitle>
              <CardDescription className="text-sm">Detailed room usage statistics and optimization opportunities</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {analyticsData.roomUtilization.map((room) => (
                  <div key={room.roomId} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-semibold text-sm sm:text-base">Room {room.roomNumber}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Capacity: {room.capacity} students
                        </p>
                      </div>
                      <Badge 
                        className={`text-xs ${
                          room.utilizationPercentage >= 80 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : room.utilizationPercentage >= 60
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {room.utilizationPercentage}% utilized
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Utilization</span>
                        <span>{room.occupiedSlots}/{room.totalSlots} slots</span>
                      </div>
                      <Progress value={room.utilizationPercentage} className="h-2" />
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-muted-foreground">Peak hours:</span>
                        {room.peakHours.map((hour) => (
                          <Badge key={hour} variant="outline" className="text-xs">
                            {hour}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faculty" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base sm:text-lg">Faculty Workload Analysis</CardTitle>
              <CardDescription className="text-sm">Teaching load distribution and capacity planning</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {analyticsData.facultyWorkload.map((faculty) => (
                  <div key={faculty.facultyId} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-semibold text-sm sm:text-base">{faculty.facultyName}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {faculty.department}
                        </p>
                      </div>
                      <Badge 
                        className={`text-xs ${
                          faculty.workloadPercentage >= 90 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : faculty.workloadPercentage >= 70
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}
                      >
                        {faculty.workloadPercentage}% load
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Teaching Hours</span>
                        <span>{faculty.totalHours}/{faculty.maxHours} hours/week</span>
                      </div>
                      <Progress value={faculty.workloadPercentage} className="h-2" />
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-muted-foreground">Subjects:</span>
                        {faculty.subjects.map((subject) => (
                          <Badge key={subject} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base sm:text-lg">Usage Trends</CardTitle>
              <CardDescription className="text-sm">Historical trends in utilization and conflicts</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="roomUtilization" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Room Utilization %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="facultyWorkload" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Faculty Workload %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="conflicts" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                      name="Conflicts"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Actions */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Export Reports</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Download detailed analytics reports in your preferred format
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportReport('pdf')}
                className="flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportReport('excel')}
                className="flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportReport('csv')}
                className="flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}