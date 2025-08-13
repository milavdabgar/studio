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
  Lightbulb,
  Users,
  TrendingUp,
  Calendar,
  FileText,
  DollarSign,
  Award,
  Target,
  Loader2,
  ExternalLink,
  Download,
  Filter,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building2,
  Zap,
  Star,
  PlusCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InnovationProject {
  id: string;
  title: string;
  description: string;
  category: 'startup' | 'innovation' | 'research' | 'social_impact';
  stage: 'idea' | 'prototype' | 'pilot' | 'scaling' | 'market_ready';
  teamLead: {
    name: string;
    enrollmentNo: string;
    branch: string;
    year: number;
  };
  teamMembers: number;
  mentor: string;
  fundingRequested: number;
  fundingApproved: number;
  submissionDate: Date;
  lastUpdate: Date;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'funded';
  milestones: {
    completed: number;
    total: number;
  };
  keyMetrics: {
    prototypeDeveloped: boolean;
    marketValidation: boolean;
    businessModel: boolean;
    ipFiled: boolean;
  };
}

interface SSIPStats {
  totalProjects: number;
  activeProjects: number;
  fundedProjects: number;
  totalFundingDisbursed: number;
  successfulStartups: number;
  patentsApplied: number;
  studentsEngaged: number;
  mentorsAssigned: number;
  averageProjectValue: number;
  successRate: number;
}

const SSIPDashboard = () => {
  const [ssipStats, setSSIPStats] = useState<SSIPStats | null>(null);
  const [projects, setProjects] = useState<InnovationProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const { toast } = useToast();

  useEffect(() => {
    fetchSSIPData();
  }, []);

  const fetchSSIPData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockStats: SSIPStats = {
        totalProjects: 45,
        activeProjects: 28,
        fundedProjects: 12,
        totalFundingDisbursed: 2500000,
        successfulStartups: 8,
        patentsApplied: 15,
        studentsEngaged: 180,
        mentorsAssigned: 22,
        averageProjectValue: 208333,
        successRate: 66.7
      };

      const mockProjects: InnovationProject[] = [
        {
          id: '1',
          title: 'EcoSmart Waste Management System',
          description: 'IoT-based smart waste segregation and collection system for urban areas',
          category: 'social_impact',
          stage: 'prototype',
          teamLead: {
            name: 'Arjun Patel',
            enrollmentNo: '190360116001',
            branch: 'Computer Engineering',
            year: 4
          },
          teamMembers: 5,
          mentor: 'Dr. Rajesh Kumar',
          fundingRequested: 500000,
          fundingApproved: 350000,
          submissionDate: new Date('2024-06-15'),
          lastUpdate: new Date('2024-07-25'),
          status: 'funded',
          milestones: {
            completed: 6,
            total: 10
          },
          keyMetrics: {
            prototypeDeveloped: true,
            marketValidation: true,
            businessModel: true,
            ipFiled: false
          }
        },
        {
          id: '2',
          title: 'StudyBuddy AI Platform',
          description: 'AI-powered personalized learning assistant for engineering students',
          category: 'startup',
          stage: 'pilot',
          teamLead: {
            name: 'Kavya Sharma',
            enrollmentNo: '190360116025',
            branch: 'Information Technology',
            year: 3
          },
          teamMembers: 4,
          mentor: 'Prof. Priya Sharma',
          fundingRequested: 750000,
          fundingApproved: 600000,
          submissionDate: new Date('2024-05-20'),
          lastUpdate: new Date('2024-07-26'),
          status: 'funded',
          milestones: {
            completed: 8,
            total: 12
          },
          keyMetrics: {
            prototypeDeveloped: true,
            marketValidation: true,
            businessModel: true,
            ipFiled: true
          }
        },
        {
          id: '3',
          title: 'AgriTech Drone Solution',
          description: 'Autonomous drones for precision agriculture and crop monitoring',
          category: 'innovation',
          stage: 'idea',
          teamLead: {
            name: 'Rohit Mehta',
            enrollmentNo: '190360116045',
            branch: 'Electronics & Communication',
            year: 2
          },
          teamMembers: 3,
          mentor: 'Dr. Amit Patel',
          fundingRequested: 400000,
          fundingApproved: 0,
          submissionDate: new Date('2024-07-10'),
          lastUpdate: new Date('2024-07-20'),
          status: 'under_review',
          milestones: {
            completed: 2,
            total: 8
          },
          keyMetrics: {
            prototypeDeveloped: false,
            marketValidation: false,
            businessModel: true,
            ipFiled: false
          }
        }
      ];

      setSSIPStats(mockStats);
      setProjects(mockProjects);

    } catch (error) {
      console.error("Error fetching SSIP data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load SSIP data." });
    }
    setIsLoading(false);
  };

  const getStatusColor = (status: InnovationProject['status']) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'funded': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getCategoryColor = (category: InnovationProject['category']) => {
    switch (category) {
      case 'startup': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'innovation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'research': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'social_impact': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStageColor = (stage: InnovationProject['stage']) => {
    switch (stage) {
      case 'idea': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'prototype': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pilot': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'scaling': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'market_ready': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (isLoading || !ssipStats) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mx-auto mb-4" />
          <p>Loading SSIP Dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Review Projects",
      description: "Evaluate submissions",
      icon: FileText,
      action: () => toast({ title: "Review Projects", description: "Opening project review panel..." }),
    },
    {
      title: "Fund Disbursement",
      description: "Process payments",
      icon: DollarSign,
      action: () => toast({ title: "Fund Disbursement", description: "Opening funding management..." }),
    },
    {
      title: "Mentor Assignment",
      description: "Assign project mentors",
      icon: Users,
      action: () => toast({ title: "Mentor Assignment", description: "Opening mentor assignment..." }),
    },
    {
      title: "Generate Reports",
      description: "Innovation analytics",
      icon: TrendingUp,
      action: () => toast({ title: "Generate Reports", description: "Opening analytics dashboard..." }),
    }
  ];

  const recentTasks = [
    {
      id: '1',
      title: 'Review EcoSmart funding proposal',
      description: 'Evaluate funding request and milestone progress',
      priority: 'high' as const,
      status: 'in_progress' as const,
      assignedTo: 'SSIP Coordinator',
      dueDate: new Date('2024-08-05')
    },
    {
      id: '2',
      title: 'Assign mentor for AgriTech project',
      description: 'Find suitable industry expert for drone technology',
      priority: 'medium' as const,
      status: 'pending' as const,
      assignedTo: 'Committee Member',
      dueDate: new Date('2024-08-08')
    },
    {
      id: '3',
      title: 'Organize innovation showcase event',
      description: 'Plan annual startup presentation event',
      priority: 'medium' as const,
      status: 'pending' as const,
      assignedTo: 'Event Coordinator',
      dueDate: new Date('2024-08-15')
    }
  ];

  const members = [
    {
      id: '1',
      name: 'Dr. Neha Gupta',
      role: 'convener' as const,
      email: 'neha.gupta@college.edu',
      department: 'Computer Science & Engineering',
      joinDate: new Date('2023-02-01'),
      status: 'active' as const
    },
    {
      id: '2',
      name: 'Prof. Vivek Mehta',
      role: 'co_convener' as const,
      email: 'vivek.mehta@college.edu',
      department: 'Mechanical Engineering',
      joinDate: new Date('2023-02-01'),
      status: 'active' as const
    },
    {
      id: '3',
      name: 'Ms. Sneha Joshi',
      role: 'secretary' as const,
      email: 'sneha.joshi@college.edu',
      department: 'SSIP Office',
      joinDate: new Date('2023-02-01'),
      status: 'active' as const
    }
  ];

  const metrics = {
    totalMembers: members.length,
    activeTasks: 8,
    completedTasks: 15,
    pendingApprovals: 5,
    upcomingMeetings: 3,
    monthlyProgress: 82,
    budget: {
      allocated: 5000000,
      utilized: 2500000,
      remaining: 2500000
    }
  };

  return (
    <CommitteeBaseLayout
      committeeName="Student Startup & Innovation Policy (SSIP)"
      committeeType="ssip"
      description="Fostering innovation and entrepreneurship among students"
      icon={Lightbulb}
      color="purple"
      metrics={metrics}
      recentTasks={recentTasks}
      members={members}
      quickActions={quickActions}
    >
      {/* SSIP-specific content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="funding">Funding</TabsTrigger>
          <TabsTrigger value="mentors">Mentors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Innovation Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">{ssipStats.successRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">{ssipStats.successfulStartups} successful startups</p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Funding</p>
                    <p className="text-2xl font-bold">₹{(ssipStats.totalFundingDisbursed / 100000).toFixed(1)}L</p>
                    <p className="text-xs text-muted-foreground">Disbursed to date</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Patents Applied</p>
                    <p className="text-2xl font-bold">{ssipStats.patentsApplied}</p>
                    <p className="text-xs text-muted-foreground">IP applications</p>
                  </div>
                  <Star className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Students Engaged</p>
                    <p className="text-2xl font-bold">{ssipStats.studentsEngaged}</p>
                    <p className="text-xs text-muted-foreground">Across all projects</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Project Portfolio Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-bold text-lg text-blue-600">{ssipStats.totalProjects}</div>
                    <div className="text-sm text-muted-foreground">Total Projects</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-green-600">{ssipStats.activeProjects}</div>
                    <div className="text-sm text-muted-foreground">Active Projects</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-purple-600">{ssipStats.fundedProjects}</div>
                    <div className="text-sm text-muted-foreground">Funded Projects</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Projects Funded</span>
                    <span>{ssipStats.fundedProjects}/{ssipStats.totalProjects}</span>
                  </div>
                  <Progress value={(ssipStats.fundedProjects / ssipStats.totalProjects) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Innovation Projects</CardTitle>
              <CardDescription>Student startup and innovation initiatives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {projects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{project.title}</h3>
                        <p className="text-muted-foreground text-sm">{project.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getCategoryColor(project.category)}>
                          {project.category.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getStageColor(project.stage)}>
                          {project.stage.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Team Lead</span>
                        <div className="font-medium">{project.teamLead.name}</div>
                        <div className="text-xs text-muted-foreground">{project.teamLead.enrollmentNo}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Team Size</span>
                        <div className="font-medium">{project.teamMembers} members</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Mentor</span>
                        <div className="font-medium">{project.mentor}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Funding</span>
                        <div className="font-medium">
                          ₹{(project.fundingApproved / 100000).toFixed(1)}L / ₹{(project.fundingRequested / 100000).toFixed(1)}L
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <div className="mt-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Milestones</span>
                            <span>{project.milestones.completed}/{project.milestones.total}</span>
                          </div>
                          <Progress value={(project.milestones.completed / project.milestones.total) * 100} className="h-2" />
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Key Achievements</span>
                        <div className="flex gap-2 mt-1">
                          {project.keyMetrics.prototypeDeveloped && (
                            <Badge variant="outline" className="text-xs">Prototype</Badge>
                          )}
                          {project.keyMetrics.marketValidation && (
                            <Badge variant="outline" className="text-xs">Market Validation</Badge>
                          )}
                          {project.keyMetrics.businessModel && (
                            <Badge variant="outline" className="text-xs">Business Model</Badge>
                          )}
                          {project.keyMetrics.ipFiled && (
                            <Badge variant="outline" className="text-xs">IP Filed</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Team Info
                      </Button>
                      {project.status === 'under_review' && (
                        <Button variant="outline" size="sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funding" className="space-y-6">
          <div className="text-center py-8">
            <DollarSign className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Funding Management</h3>
            <p className="text-muted-foreground">Fund allocation and disbursement tracking interface.</p>
          </div>
        </TabsContent>

        <TabsContent value="mentors" className="space-y-6">
          <div className="text-center py-8">
            <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Mentor Network</h3>
            <p className="text-muted-foreground">Industry experts and faculty mentor management system.</p>
          </div>
        </TabsContent>
      </Tabs>
    </CommitteeBaseLayout>
  );
};

export default SSIPDashboard;