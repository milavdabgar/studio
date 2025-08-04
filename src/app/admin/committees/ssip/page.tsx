'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Lightbulb, 
  Users, 
  TrendingUp, 
  Award,
  Rocket,
  Target,
  IndianRupee,
  Calendar,
  FileText,
  Plus,
  Eye
} from 'lucide-react';
import { DepartmentScopedPage } from '@/components/auth/PageAccessControl';

interface StartupProject {
  id: string;
  title: string;
  description: string;
  teamLeader: string;
  teamMembers: string[];
  department: string;
  category: 'tech' | 'social' | 'healthcare' | 'fintech' | 'edutech' | 'other';
  stage: 'idea' | 'prototype' | 'mvp' | 'pilot' | 'scaling';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  fundingReceived: number;
  fundingGoal: number;
  mentorAssigned?: string;
  submissionDate: string;
  lastUpdated: string;
}

interface InnovationEvent {
  id: string;
  name: string;
  type: 'hackathon' | 'workshop' | 'seminar' | 'competition' | 'bootcamp';
  date: string;
  duration: string;
  participants: number;
  maxParticipants: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  prizes?: { first: number; second: number; third: number };
}

export default function SSIPDashboard() {
  const [projects, setProjects] = useState<StartupProject[]>([]);
  const [events, setEvents] = useState<InnovationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalFunding: 0,
    successfulStartups: 0
  });

  useEffect(() => {
    // Mock data - in production, fetch from APIs
    const mockProjects: StartupProject[] = [
      {
        id: '1',
        title: 'EcoTrack - Carbon Footprint Monitor',
        description: 'Mobile app to track and reduce personal carbon footprint with AI recommendations',
        teamLeader: 'Arjun Patel',
        teamMembers: ['Riya Shah', 'Karan Modi', 'Neha Joshi'],
        department: 'Computer Engineering',
        category: 'tech',
        stage: 'mvp',
        status: 'active',
        fundingReceived: 250000,
        fundingGoal: 500000,
        mentorAssigned: 'Dr. Amit Kumar',
        submissionDate: '2024-01-15',
        lastUpdated: '2024-03-10'
      },
      {
        id: '2',
        title: 'HealthBridge - Rural Healthcare Platform',
        description: 'Telemedicine platform connecting rural patients with urban doctors',
        teamLeader: 'Priya Desai',
        teamMembers: ['Rohit Sharma', 'Anjali Patel'],
        department: 'Electronics & Communication',
        category: 'healthcare',
        stage: 'pilot',
        status: 'active',
        fundingReceived: 400000,
        fundingGoal: 800000,
        mentorAssigned: 'Dr. Rajesh Mehta',
        submissionDate: '2024-02-01',
        lastUpdated: '2024-03-12'
      }
    ];

    const mockEvents: InnovationEvent[] = [
      {
        id: '1',
        name: 'InnoHack 2024',
        type: 'hackathon',
        date: '2024-04-20',
        duration: '36 hours',
        participants: 150,
        maxParticipants: 200,
        status: 'upcoming',
        prizes: { first: 100000, second: 50000, third: 25000 }
      },
      {
        id: '2',
        name: 'Startup Funding Workshop',
        type: 'workshop',
        date: '2024-04-05',
        duration: '4 hours',
        participants: 80,
        maxParticipants: 100,
        status: 'upcoming'
      }
    ];

    setProjects(mockProjects);
    setEvents(mockEvents);
    
    // Calculate stats
    setStats({
      totalProjects: mockProjects.length,
      activeProjects: mockProjects.filter(p => p.status === 'active').length,
      totalFunding: mockProjects.reduce((sum, p) => sum + p.fundingReceived, 0),
      successfulStartups: 5 // Mock count
    });
    
    setLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'paused': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800',
      'upcoming': 'bg-purple-100 text-purple-800',
      'ongoing': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getStageBadge = (stage: string) => {
    const variants = {
      'idea': 'bg-gray-100 text-gray-800',
      'prototype': 'bg-blue-100 text-blue-800',
      'mvp': 'bg-purple-100 text-purple-800',
      'pilot': 'bg-orange-100 text-orange-800',
      'scaling': 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge className={variants[stage as keyof typeof variants]}>
        {stage.toUpperCase()}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      'tech': 'bg-blue-100 text-blue-800',
      'social': 'bg-green-100 text-green-800',
      'healthcare': 'bg-red-100 text-red-800',
      'fintech': 'bg-yellow-100 text-yellow-800',
      'edutech': 'bg-purple-100 text-purple-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge variant="outline" className={variants[category as keyof typeof variants]}>
        {category}
      </Badge>
    );
  };

  return (
    <DepartmentScopedPage pageName="SSIP dashboard">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Lightbulb className="h-8 w-8" />
              SSIP Dashboard
            </h1>
            <p className="text-muted-foreground">Student Startup and Innovation Policy Management</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Event
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(stats.totalFunding / 100000).toFixed(1)}L</div>
              <p className="text-xs text-muted-foreground">Disbursed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Startups</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successfulStartups}</div>
              <p className="text-xs text-muted-foreground">Launched</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Active Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Active Projects
              </CardTitle>
              <CardDescription>Currently running startup projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.filter(p => p.status === 'active').map((project) => (
                  <div key={project.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{project.title}</div>
                      {getStageBadge(project.stage)}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {project.description}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium">{project.teamLeader}</div>
                        <div className="text-muted-foreground">{project.department}</div>
                      </div>
                      <div className="text-right">
                        {getCategoryBadge(project.category)}
                        <div className="text-muted-foreground mt-1">
                          ₹{(project.fundingReceived / 1000).toFixed(0)}K / ₹{(project.fundingGoal / 1000).toFixed(0)}K
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
              <CardDescription>Innovation and startup events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.filter(e => e.status === 'upcoming').map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{event.name}</div>
                      <Badge variant="outline">{event.type}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {new Date(event.date).toLocaleDateString()} • {event.duration}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <div className="text-muted-foreground">
                          {event.participants}/{event.maxParticipants} participants
                        </div>
                      </div>
                      <div className="text-right">
                        {event.prizes && (
                          <div className="text-green-600 font-medium">
                            Prize: ₹{(event.prizes.first / 1000).toFixed(0)}K
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
            <CardDescription>Complete list of startup projects</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Team Leader</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Funding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {project.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.teamLeader}</div>
                        <div className="text-sm text-muted-foreground">
                          +{project.teamMembers.length} members
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{project.department}</TableCell>
                    <TableCell>{getCategoryBadge(project.category)}</TableCell>
                    <TableCell>{getStageBadge(project.stage)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          ₹{(project.fundingReceived / 1000).toFixed(0)}K
                        </div>
                        <div className="text-muted-foreground">
                          / ₹{(project.fundingGoal / 1000).toFixed(0)}K
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DepartmentScopedPage>
  );
}