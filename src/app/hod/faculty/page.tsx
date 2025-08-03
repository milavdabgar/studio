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
  Users, 
  Search,
  Filter,
  Download,
  UserCheck,
  BookOpen,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Clock,
  UserPlus,
  FileText,
  Eye,
  Loader2,
  RefreshCw,
  Settings,
  Award,
  Phone,
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DepartmentFaculty {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  designation: string;
  qualification: string;
  experience: number;
  specialization: string[];
  status: 'active' | 'on_leave' | 'inactive';
  workload: {
    assigned: number;
    maximum: number;
    percentage: number;
  };
  subjects: string[];
  timetables: string[];
  preferences: {
    maxHours: number;
    preferredDays: string[];
    preferredSlots: string[];
  };
  performance: {
    rating: number;
    feedback: number;
    punctuality: number;
  };
  committees: string[];
  achievements: string[];
  joinDate: Date;
  lastActivity: Date;
}

interface FacultyMetrics {
  totalFaculty: number;
  activeFaculty: number;
  onLeave: number;
  avgWorkload: number;
  overloadedFaculty: number;
  underloadedFaculty: number;
  avgExperience: number;
  avgRating: number;
  committeesManaged: number;
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

export default function HODFacultyPage() {
  const [faculty, setFaculty] = useState<DepartmentFaculty[]>([]);
  const [metrics, setMetrics] = useState<FacultyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedWorkload, setSelectedWorkload] = useState('all');
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

  const fetchFacultyData = async () => {
    if (!user?.department) return;
    
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockMetrics: FacultyMetrics = {
        totalFaculty: 24,
        activeFaculty: 22,
        onLeave: 2,
        avgWorkload: 82,
        overloadedFaculty: 3,
        underloadedFaculty: 5,
        avgExperience: 8.5,
        avgRating: 4.2,
        committeesManaged: 12
      };

      const mockFaculty: DepartmentFaculty[] = [
        {
          id: '1',
          employeeId: 'EMP001',
          name: 'Dr. Rajesh Kumar',
          email: 'rajesh.kumar@college.edu',
          phone: '+91 9876543210',
          designation: 'Professor',
          qualification: 'Ph.D. Computer Science',
          experience: 15,
          specialization: ['Data Structures', 'Algorithms', 'Database Systems'],
          status: 'active',
          workload: {
            assigned: 19,
            maximum: 18,
            percentage: 106
          },
          subjects: ['Data Structures', 'Algorithms', 'Database Systems'],
          timetables: ['CS Sem 3', 'CS Sem 5'],
          preferences: {
            maxHours: 18,
            preferredDays: ['Monday', 'Wednesday', 'Friday'],
            preferredSlots: ['09:00-10:00', '10:00-11:00']
          },
          performance: {
            rating: 4.8,
            feedback: 95,
            punctuality: 98
          },
          committees: ['Academic Committee', 'Curriculum Committee'],
          achievements: ['Best Teacher Award 2023', 'Research Excellence Award'],
          joinDate: new Date('2009-06-15'),
          lastActivity: new Date('2024-07-26')
        },
        {
          id: '2',
          employeeId: 'EMP002',
          name: 'Prof. Priya Sharma',
          email: 'priya.sharma@college.edu',
          phone: '+91 9876543211',
          designation: 'Associate Professor',
          qualification: 'M.Tech Computer Engineering',
          experience: 12,
          specialization: ['Software Engineering', 'Web Development', 'Mobile Apps'],
          status: 'active',
          workload: {
            assigned: 16,
            maximum: 20,
            percentage: 80
          },
          subjects: ['Software Engineering', 'Web Development'],
          timetables: ['CS Sem 4', 'CS Sem 6'],
          preferences: {
            maxHours: 20,
            preferredDays: ['Tuesday', 'Thursday'],
            preferredSlots: ['14:00-15:00', '15:00-16:00']
          },
          performance: {
            rating: 4.5,
            feedback: 88,
            punctuality: 95
          },
          committees: ['Placement Committee', 'Industrial Training Committee'],
          achievements: ['Innovation in Teaching Award 2022'],
          joinDate: new Date('2012-08-20'),
          lastActivity: new Date('2024-07-25')
        },
        {
          id: '3',
          employeeId: 'EMP003',
          name: 'Dr. Amit Patel',
          email: 'amit.patel@college.edu',
          phone: '+91 9876543212',
          designation: 'Assistant Professor',
          qualification: 'Ph.D. Artificial Intelligence',
          experience: 8,
          specialization: ['Machine Learning', 'AI', 'Data Science'],
          status: 'active',
          workload: {
            assigned: 14,
            maximum: 20,
            percentage: 70
          },
          subjects: ['Machine Learning', 'AI Fundamentals'],
          timetables: ['CS Sem 7', 'CS Sem 8'],
          preferences: {
            maxHours: 20,
            preferredDays: ['Monday', 'Tuesday', 'Wednesday'],
            preferredSlots: ['11:00-12:00', '12:00-13:00']
          },
          performance: {
            rating: 4.6,
            feedback: 92,
            punctuality: 90
          },
          committees: ['Research Committee', 'SSIP Committee'],
          achievements: ['Young Researcher Award 2021', 'Best Paper Award'],
          joinDate: new Date('2016-01-10'),
          lastActivity: new Date('2024-07-26')
        },
        {
          id: '4',
          employeeId: 'EMP004',
          name: 'Prof. Sneha Joshi',
          email: 'sneha.joshi@college.edu',
          phone: '+91 9876543213',
          designation: 'Assistant Professor',
          qualification: 'M.Tech Information Technology',
          experience: 6,
          specialization: ['Computer Networks', 'Cybersecurity', 'System Administration'],
          status: 'on_leave',
          workload: {
            assigned: 0,
            maximum: 20,
            percentage: 0
          },
          subjects: ['Computer Networks', 'Cybersecurity'],
          timetables: [],
          preferences: {
            maxHours: 20,
            preferredDays: ['Tuesday', 'Thursday', 'Friday'],
            preferredSlots: ['09:00-10:00', '11:00-12:00']
          },
          performance: {
            rating: 4.3,
            feedback: 85,
            punctuality: 92
          },
          committees: ['IT Committee', 'Library Committee'],
          achievements: ['Cisco Certified Network Associate'],
          joinDate: new Date('2018-07-01'),
          lastActivity: new Date('2024-06-30')
        },
        {
          id: '5',
          employeeId: 'EMP005',
          name: 'Dr. Vivek Mehta',
          email: 'vivek.mehta@college.edu',
          phone: '+91 9876543214',
          designation: 'Professor',
          qualification: 'Ph.D. Computer Engineering',
          experience: 20,
          specialization: ['Computer Graphics', 'Image Processing', 'HCI'],
          status: 'active',
          workload: {
            assigned: 18,
            maximum: 18,
            percentage: 100
          },
          subjects: ['Computer Graphics', 'Image Processing'],
          timetables: ['CS Sem 5', 'CS Sem 7'],
          preferences: {
            maxHours: 18,
            preferredDays: ['Monday', 'Wednesday', 'Friday'],
            preferredSlots: ['10:00-11:00', '14:00-15:00']
          },
          performance: {
            rating: 4.7,
            feedback: 96,
            punctuality: 99
          },
          committees: ['Academic Committee', 'Examination Committee'],
          achievements: ['Lifetime Achievement Award', 'Distinguished Professor'],
          joinDate: new Date('2004-06-01'),
          lastActivity: new Date('2024-07-26')
        }
      ];

      setMetrics(mockMetrics);
      setFaculty(mockFaculty);

    } catch (error) {
      console.error("Error fetching faculty data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load faculty data." });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFacultyData();
  }, [user]);

  const filteredFaculty = faculty.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDesignation = selectedDesignation === 'all' || member.designation === selectedDesignation;
    const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus;
    
    let matchesWorkload = true;
    if (selectedWorkload === 'overloaded') matchesWorkload = member.workload.percentage > 100;
    else if (selectedWorkload === 'underloaded') matchesWorkload = member.workload.percentage < 75;
    else if (selectedWorkload === 'balanced') matchesWorkload = member.workload.percentage >= 75 && member.workload.percentage <= 100;
    
    return matchesSearch && matchesDesignation && matchesStatus && matchesWorkload;
  });

  const getStatusColor = (status: DepartmentFaculty['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getWorkloadColor = (percentage: number) => {
    if (percentage > 100) return 'text-red-600';
    if (percentage >= 90) return 'text-orange-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mx-auto mb-4" />
          <p>Loading Faculty Management...</p>
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
            <Users className="h-6 w-6 sm:h-8 sm:w-8" />
            Faculty Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {user?.department} • Academic Year 2024-25
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchFacultyData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Faculty
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3 sm:gap-4">
          <MetricCard
            title="Total Faculty"
            value={metrics.totalFaculty}
            subtitle="Department strength"
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Active"
            value={metrics.activeFaculty}
            subtitle="Currently teaching"
            icon={UserCheck}
            color="green"
          />
          <MetricCard
            title="On Leave"
            value={metrics.onLeave}
            subtitle="Temporary absence"
            icon={Calendar}
            color="yellow"
          />
          <MetricCard
            title="Avg Workload"
            value={`${metrics.avgWorkload}%`}
            subtitle="Department average"
            icon={TrendingUp}
            color="orange"
            trend={{ value: 5, isPositive: true }}
          />
          <MetricCard
            title="Overloaded"
            value={metrics.overloadedFaculty}
            subtitle="Above capacity"
            icon={AlertTriangle}
            color="red"
            alert={metrics.overloadedFaculty > 2}
          />
          <MetricCard
            title="Underloaded"
            value={metrics.underloadedFaculty}
            subtitle="Below capacity"
            icon={TrendingDown}
            color="blue"
          />
          <MetricCard
            title="Avg Experience"
            value={`${metrics.avgExperience}y`}
            subtitle="Years of experience"
            icon={Award}
            color="purple"
          />
          <MetricCard
            title="Avg Rating"
            value={metrics.avgRating.toFixed(1)}
            subtitle="Performance rating"
            icon={CheckCircle}
            color="indigo"
            trend={{ value: 2, isPositive: true }}
          />
          <MetricCard
            title="Committees"
            value={metrics.committeesManaged}
            subtitle="Active committees"
            icon={Settings}
            color="teal"
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
                  placeholder="Search by name, employee ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={selectedDesignation} onValueChange={setSelectedDesignation}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Designations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Designations</SelectItem>
                  <SelectItem value="Professor">Professor</SelectItem>
                  <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                  <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                  <SelectItem value="Lecturer">Lecturer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedWorkload} onValueChange={setSelectedWorkload}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Workload" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workload</SelectItem>
                  <SelectItem value="overloaded">Overloaded</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="underloaded">Underloaded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Faculty List */}
      <Card>
        <CardHeader>
          <CardTitle>Faculty Members ({filteredFaculty.length})</CardTitle>
          <CardDescription>Department faculty overview and workload management</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFaculty.length > 0 ? (
            <div className="space-y-6">
              {filteredFaculty.map((member) => (
                <div key={member.id} className="border rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Faculty Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-semibold text-xl">{member.name}</h4>
                        <Badge className={getStatusColor(member.status)}>
                          {member.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {member.workload.percentage > 100 && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Overloaded
                          </Badge>
                        )}
                        {member.achievements.length > 0 && (
                          <Badge variant="secondary">
                            <Award className="h-3 w-3 mr-1" />
                            {member.achievements.length} Awards
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-muted-foreground">Employee ID:</span>
                          <div className="font-medium">{member.employeeId}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Designation:</span>
                          <div className="font-medium">{member.designation}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Experience:</span>
                          <div className="font-medium">{member.experience} years</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Qualification:</span>
                          <div className="font-medium">{member.qualification}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Contact:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-3 w-3" />
                            <span className="text-xs">{member.email}</span>
                          </div>
                          {member.phone && (
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs">{member.phone}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Specialization:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {member.specialization.slice(0, 3).map((spec) => (
                              <Badge key={spec} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                            {member.specialization.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{member.specialization.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance Metrics */}
                    <div className="lg:w-80">
                      <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                        {/* Workload */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Workload</span>
                            <span className={`font-bold ${getWorkloadColor(member.workload.percentage)}`}>
                              {member.workload.percentage}%
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(member.workload.percentage, 100)} 
                            className="h-2 mb-2"
                          />
                          <div className="text-xs text-muted-foreground">
                            {member.workload.assigned}/{member.workload.maximum} hours/week
                          </div>
                        </div>

                        {/* Performance */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <div className="text-sm font-medium mb-2">Performance</div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Rating:</span>
                              <span className="font-medium">
                                {getRatingStars(member.performance.rating)} ({member.performance.rating})
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Feedback:</span>
                              <span className="font-medium">{member.performance.feedback}%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Punctuality:</span>
                              <span className="font-medium">{member.performance.punctuality}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <FileText className="h-4 w-4 mr-2" />
                          Profile
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Details */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Current Subjects:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.subjects.map((subject) => (
                            <Badge key={subject} variant="secondary" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Committees:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.committees.map((committee) => (
                            <Badge key={committee} variant="outline" className="text-xs">
                              {committee}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Recent Achievements:</span>
                        <div className="mt-1">
                          {member.achievements.slice(0, 2).map((achievement, index) => (
                            <div key={index} className="text-xs text-muted-foreground">
                              • {achievement}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No faculty members found matching your criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}