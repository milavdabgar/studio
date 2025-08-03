"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CommitteeBaseLayout from '@/components/committee/CommitteeBaseLayout';
import { 
  Briefcase,
  Building2,
  Users,
  TrendingUp,
  Calendar,
  FileText,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Award,
  Target,
  UserCheck,
  Loader2,
  ExternalLink,
  Download,
  Filter,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlacementDrive {
  id: string;
  companyName: string;
  companyLogo?: string;
  jobTitle: string;
  packageOffered: {
    min: number;
    max: number;
    currency: string;
  };
  eligibility: {
    branches: string[];
    cgpaMin: number;
    backlogsAllowed: number;
  };
  applicationDeadline: Date;
  driveDate: Date;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  applicationsReceived: number;
  studentsShortlisted: number;
  studentsSelected: number;
  hrContact: {
    name: string;
    email: string;
    phone: string;
  };
  driveDetails: {
    rounds: string[];
    venue: string;
    additionalInfo: string;
  };
}

interface PlacementStats {
  totalCompanies: number;
  activeCompanies: number;
  totalStudents: number;
  placedStudents: number;
  pendingPlacements: number;
  averagePackage: number;
  highestPackage: number;
  placementPercentage: number;
  upcomingDrives: number;
  ongoingDrives: number;
}

interface Student {
  id: string;
  name: string;
  enrollmentNo: string;
  branch: string;
  cgpa: number;
  backlogs: number;
  placementStatus: 'eligible' | 'placed' | 'not_eligible' | 'opted_out';
  placedCompany?: string;
  packageOffered?: number;
  appliedDrives: string[];
  skillSet: string[];
  resumeUploaded: boolean;
  contactInfo: {
    email: string;
    phone: string;
  };
}

interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
  description: string;
  hrContacts: {
    name: string;
    designation: string;
    email: string;
    phone: string;
  }[];
  partnershipSince: Date;
  totalHires: number;
  averagePackage: number;
  lastVisit: Date;
  status: 'active' | 'inactive' | 'blacklisted';
  preferences: {
    branches: string[];
    cgpaMin: number;
    skillsRequired: string[];
  };
}

const TPODashboard = () => {
  const [placementStats, setPlacementStats] = useState<PlacementStats | null>(null);
  const [upcomingDrives, setUpcomingDrives] = useState<PlacementDrive[]>([]);
  const [eligibleStudents, setEligibleStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const { toast } = useToast();

  useEffect(() => {
    fetchTPOData();
  }, []);

  const fetchTPOData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockStats: PlacementStats = {
        totalCompanies: 125,
        activeCompanies: 85,
        totalStudents: 450,
        placedStudents: 285,
        pendingPlacements: 165,
        averagePackage: 650000,
        highestPackage: 1800000,
        placementPercentage: 63.3,
        upcomingDrives: 8,
        ongoingDrives: 3
      };

      const mockDrives: PlacementDrive[] = [
        {
          id: '1',
          companyName: 'TechCorp Solutions',
          jobTitle: 'Software Developer',
          packageOffered: { min: 600000, max: 800000, currency: 'INR' },
          eligibility: {
            branches: ['Computer Engineering', 'Information Technology'],
            cgpaMin: 7.0,
            backlogsAllowed: 0
          },
          applicationDeadline: new Date('2024-08-05'),
          driveDate: new Date('2024-08-10'),
          status: 'upcoming',
          applicationsReceived: 45,
          studentsShortlisted: 25,
          studentsSelected: 0,
          hrContact: {
            name: 'Priya Sharma',
            email: 'priya.sharma@techcorp.com',
            phone: '+91 9876543210'
          },
          driveDetails: {
            rounds: ['Aptitude Test', 'Technical Interview', 'HR Interview'],
            venue: 'Seminar Hall A',
            additionalInfo: 'Candidates should bring updated resume and photo ID'
          }
        },
        {
          id: '2',
          companyName: 'InnovateTech Systems',
          jobTitle: 'Backend Developer',
          packageOffered: { min: 550000, max: 750000, currency: 'INR' },
          eligibility: {
            branches: ['Computer Engineering', 'Electronics & Communication'],
            cgpaMin: 6.5,
            backlogsAllowed: 1
          },
          applicationDeadline: new Date('2024-08-08'),
          driveDate: new Date('2024-08-12'),
          status: 'upcoming',
          applicationsReceived: 62,
          studentsShortlisted: 35,
          studentsSelected: 0,
          hrContact: {
            name: 'Rajesh Kumar',
            email: 'rajesh.k@innovatetech.com',
            phone: '+91 9876543211'
          },
          driveDetails: {
            rounds: ['Online Assessment', 'System Design', 'Technical Interview', 'Manager Round'],
            venue: 'Computer Lab 1',
            additionalInfo: 'Strong programming skills in Java/Python required'
          }
        },
        {
          id: '3',
          companyName: 'GlobalSoft Industries',
          jobTitle: 'Quality Assurance Engineer',
          packageOffered: { min: 450000, max: 600000, currency: 'INR' },
          eligibility: {
            branches: ['Computer Engineering', 'Information Technology', 'Electronics & Communication'],
            cgpaMin: 6.0,
            backlogsAllowed: 2
          },
          applicationDeadline: new Date('2024-08-03'),
          driveDate: new Date('2024-08-07'),
          status: 'ongoing',
          applicationsReceived: 78,
          studentsShortlisted: 50,
          studentsSelected: 12,
          hrContact: {
            name: 'Sneha Patel',
            email: 'sneha.patel@globalsoft.com',
            phone: '+91 9876543212'
          },
          driveDetails: {
            rounds: ['Written Test', 'Technical Interview', 'Final Interview'],
            venue: 'Placement Cell',
            additionalInfo: 'Testing tools knowledge preferred'
          }
        }
      ];

      const mockStudents: Student[] = [
        {
          id: '1',
          name: 'Arjun Patel',
          enrollmentNo: '190360116001',
          branch: 'Computer Engineering',
          cgpa: 8.5,
          backlogs: 0,
          placementStatus: 'eligible',
          appliedDrives: ['1', '2'],
          skillSet: ['Java', 'Python', 'React', 'Node.js'],
          resumeUploaded: true,
          contactInfo: {
            email: 'arjun.patel@student.edu',
            phone: '+91 9876543213'
          }
        },
        {
          id: '2',
          name: 'Kavya Sharma',
          enrollmentNo: '190360116025',
          branch: 'Information Technology',
          cgpa: 9.2,
          backlogs: 0,
          placementStatus: 'placed',
          placedCompany: 'Microsoft India',
          packageOffered: 1600000,
          appliedDrives: ['ms1'],
          skillSet: ['C++', 'DSA', 'System Design', 'Azure'],
          resumeUploaded: true,
          contactInfo: {
            email: 'kavya.sharma@student.edu',
            phone: '+91 9876543214'
          }
        }
      ];

      const mockCompanies: Company[] = [
        {
          id: '1',
          name: 'TechCorp Solutions',
          industry: 'Software Development',
          website: 'https://techcorp.com',
          description: 'Leading software solutions provider with global presence',
          hrContacts: [
            {
              name: 'Priya Sharma',
              designation: 'HR Manager',
              email: 'priya.sharma@techcorp.com',
              phone: '+91 9876543210'
            }
          ],
          partnershipSince: new Date('2020-06-15'),
          totalHires: 45,
          averagePackage: 700000,
          lastVisit: new Date('2024-03-15'),
          status: 'active',
          preferences: {
            branches: ['Computer Engineering', 'Information Technology'],
            cgpaMin: 7.0,
            skillsRequired: ['Java', 'Spring Boot', 'React']
          }
        }
      ];

      setPlacementStats(mockStats);
      setUpcomingDrives(mockDrives);
      setEligibleStudents(mockStudents);
      setCompanies(mockCompanies);

    } catch (error) {
      console.error("Error fetching TPO data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load placement data." });
    }
    setIsLoading(false);
  };

  const getStatusColor = (status: PlacementDrive['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ongoing': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPlacementStatusColor = (status: Student['placementStatus']) => {
    switch (status) {
      case 'placed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'eligible': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'not_eligible': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'opted_out': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (isLoading || !placementStats) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mx-auto mb-4" />
          <p>Loading TPO Dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Schedule Drive",
      description: "New placement drive",
      icon: Calendar,
      action: () => toast({ title: "Schedule Drive", description: "Opening drive scheduling form..." }),
    },
    {
      title: "Add Company",
      description: "Register new company",
      icon: Building2,
      action: () => toast({ title: "Add Company", description: "Opening company registration form..." }),
    },
    {
      title: "Student Database",
      description: "Manage students",
      icon: Users,
      action: () => toast({ title: "Student Database", description: "Opening student management..." }),
    },
    {
      title: "Reports",
      description: "Generate reports",
      icon: FileText,
      action: () => toast({ title: "Reports", description: "Opening report generation..." }),
    }
  ];

  const recentTasks = [
    {
      id: '1',
      title: 'Coordinate TechCorp placement drive',
      description: 'Finalize venue and schedule for upcoming drive',
      priority: 'high' as const,
      status: 'in_progress' as const,
      assignedTo: 'TPO Coordinator',
      dueDate: new Date('2024-08-05')
    },
    {
      id: '2',
      title: 'Update student eligibility list',
      description: 'Review and update eligibility for final year students',
      priority: 'medium' as const,
      status: 'pending' as const,
      assignedTo: 'Assistant Coordinator',
      dueDate: new Date('2024-08-10')
    },
    {
      id: '3',
      title: 'Follow up with placed students',
      description: 'Contact students for offer letter submission',
      priority: 'low' as const,
      status: 'completed' as const,
      assignedTo: 'TPO Staff',
      dueDate: new Date('2024-07-30')
    }
  ];

  const members = [
    {
      id: '1',
      name: 'Dr. Rajesh Kumar',
      role: 'convener' as const,
      email: 'rajesh.kumar@college.edu',
      department: 'Computer Science & Engineering',
      joinDate: new Date('2023-01-15'),
      status: 'active' as const
    },
    {
      id: '2',
      name: 'Prof. Priya Sharma',
      role: 'co_convener' as const,
      email: 'priya.sharma@college.edu',
      department: 'Information Technology',
      joinDate: new Date('2023-06-01'),
      status: 'active' as const
    },
    {
      id: '3',
      name: 'Ms. Sneha Patel',
      role: 'secretary' as const,
      email: 'sneha.patel@college.edu',
      department: 'Training & Placement Office',
      joinDate: new Date('2023-01-15'),
      status: 'active' as const
    }
  ];

  const metrics = {
    totalMembers: members.length,
    activeTasks: 5,
    completedTasks: 12,
    pendingApprovals: 3,
    upcomingMeetings: 2,
    monthlyProgress: 78,
    budget: {
      allocated: 500000,
      utilized: 325000,
      remaining: 175000
    }
  };

  return (
    <CommitteeBaseLayout
      committeeName="Training & Placement Office (TPO)"
      committeeType="tpo"
      description="Coordinating placement activities and industry partnerships"
      icon={Briefcase}
      color="blue"
      metrics={metrics}
      recentTasks={recentTasks}
      members={members}
      quickActions={quickActions}
    >
      {/* TPO-specific content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="drives">Placement Drives</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Placement Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Placement Rate</p>
                    <p className="text-2xl font-bold">{placementStats.placementPercentage.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">{placementStats.placedStudents}/{placementStats.totalStudents} students</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Package</p>
                    <p className="text-2xl font-bold">₹{(placementStats.averagePackage / 100000).toFixed(1)}L</p>
                    <p className="text-xs text-muted-foreground">Per annum</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Highest Package</p>
                    <p className="text-2xl font-bold">₹{(placementStats.highestPackage / 100000).toFixed(1)}L</p>
                    <p className="text-xs text-muted-foreground">This year</p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Companies</p>
                    <p className="text-2xl font-bold">{placementStats.activeCompanies}</p>
                    <p className="text-xs text-muted-foreground">Total: {placementStats.totalCompanies}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Placement Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Placement Progress (Academic Year 2024-25)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Students Placed</span>
                    <span>{placementStats.placedStudents}/{placementStats.totalStudents}</span>
                  </div>
                  <Progress value={placementStats.placementPercentage} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-bold text-lg text-green-600">{placementStats.placedStudents}</div>
                    <div className="text-sm text-muted-foreground">Placed</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-blue-600">{placementStats.pendingPlacements}</div>
                    <div className="text-sm text-muted-foreground">Eligible</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-orange-600">{placementStats.upcomingDrives}</div>
                    <div className="text-sm text-muted-foreground">Upcoming Drives</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drives" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Placement Drives</CardTitle>
              <CardDescription>Scheduled campus recruitment drives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {upcomingDrives.map((drive) => (
                  <div key={drive.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{drive.companyName}</h3>
                        <p className="text-muted-foreground">{drive.jobTitle}</p>
                      </div>
                      <Badge className={getStatusColor(drive.status)}>
                        {drive.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Package</span>
                        <div className="font-medium">
                          ₹{(drive.packageOffered.min / 100000).toFixed(1)}L - ₹{(drive.packageOffered.max / 100000).toFixed(1)}L
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Applications</span>
                        <div className="font-medium">{drive.applicationsReceived}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Shortlisted</span>
                        <div className="font-medium">{drive.studentsShortlisted}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Selected</span>
                        <div className="font-medium">{drive.studentsSelected}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Eligibility</span>
                        <div className="text-sm">
                          <div>Branches: {drive.eligibility.branches.join(', ')}</div>
                          <div>Min CGPA: {drive.eligibility.cgpaMin}</div>
                          <div>Backlogs: {drive.eligibility.backlogsAllowed} allowed</div>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Important Dates</span>
                        <div className="text-sm">
                          <div>Application Deadline: {drive.applicationDeadline.toLocaleDateString()}</div>
                          <div>Drive Date: {drive.driveDate.toLocaleDateString()}</div>
                          <div>Venue: {drive.driveDetails.venue}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Manage Applications
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Contact HR
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Placement Status</CardTitle>
              <CardDescription>Track student eligibility and placement status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eligibleStudents.map((student) => (
                  <div key={student.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{student.name}</h4>
                        <p className="text-sm text-muted-foreground">{student.enrollmentNo} • {student.branch}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getPlacementStatusColor(student.placementStatus)}>
                          {student.placementStatus.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {student.placedCompany && (
                          <div className="text-sm font-medium text-green-600 mt-1">
                            {student.placedCompany}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">CGPA:</span>
                        <div className="font-medium">{student.cgpa}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Backlogs:</span>
                        <div className="font-medium">{student.backlogs}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Applied Drives:</span>
                        <div className="font-medium">{student.appliedDrives.length}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Resume:</span>
                        <div className="font-medium">
                          {student.resumeUploaded ? (
                            <CheckCircle className="h-4 w-4 text-green-500 inline" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500 inline" />
                          )}
                        </div>
                      </div>
                    </div>

                    {student.packageOffered && (
                      <div className="mt-3">
                        <span className="text-sm text-muted-foreground">Package Offered:</span>
                        <span className="font-medium text-green-600 ml-2">
                          ₹{(student.packageOffered / 100000).toFixed(1)}L per annum
                        </span>
                      </div>
                    )}

                    <div className="mt-3">
                      <span className="text-sm text-muted-foreground">Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {student.skillSet.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
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

        <TabsContent value="companies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Partner Companies</CardTitle>
              <CardDescription>Companies actively participating in campus recruitment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {companies.map((company) => (
                  <div key={company.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{company.name}</h3>
                        <p className="text-muted-foreground">{company.industry}</p>
                        <p className="text-sm text-muted-foreground">{company.description}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Website
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Total Hires</span>
                        <div className="font-medium">{company.totalHires}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Avg Package</span>
                        <div className="font-medium">₹{(company.averagePackage / 100000).toFixed(1)}L</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Partnership Since</span>
                        <div className="font-medium">{company.partnershipSince.getFullYear()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Last Visit</span>
                        <div className="font-medium">{company.lastVisit.toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Preferred Branches</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {company.preferences.branches.map((branch) => (
                            <Badge key={branch} variant="outline" className="text-xs">
                              {branch}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Required Skills</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {company.preferences.skillsRequired.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <span className="text-sm text-muted-foreground">HR Contacts</span>
                      <div className="mt-2 space-y-2">
                        {company.hrContacts.map((contact, index) => (
                          <div key={index} className="flex items-center gap-4 text-sm">
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-muted-foreground">{contact.designation}</div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </CommitteeBaseLayout>
  );
};

export default TPODashboard;