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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  Settings, 
  Users, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  BarChart3,
  Filter,
  Search,
  PlusCircle,
  Edit,
  Trash2,
  Target,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { 
  AllocationSessionWithDetails, 
  CourseAllocationWithDetails, 
  AllocationConflictWithDetails,
  AllocationSession,
  Faculty,
  AcademicTerm,
  Program
} from '@/types/entities';

export default function CourseAllocationPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<AllocationSessionWithDetails[]>([]);
  const [selectedSession, setSelectedSession] = useState<AllocationSessionWithDetails | null>(null);
  const [allocations, setAllocations] = useState<CourseAllocationWithDetails[]>([]);
  const [conflicts, setConflicts] = useState<AllocationConflictWithDetails[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    academicYear: 'all'
  });

  // Form state for creating sessions
  const [formData, setFormData] = useState<Omit<AllocationSession, 'id' | 'createdAt' | 'updatedAt' | 'statistics'>>({
    name: '',
    academicYear: '',
    semesters: [],
    targetPrograms: [],
    status: 'draft',
    createdBy: 'current-user', // TODO: Get from auth context
    allocationMethod: 'preference_based',
    algorithmSettings: {
      prioritizeSeniority: true,
      expertiseWeightage: 0.4,
      preferencePriorityWeightage: 0.3,
      workloadBalanceWeightage: 0.2,
      minimizeConflicts: true
    },
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, facultiesRes, termsRes, programsRes] = await Promise.all([
        fetch('/api/allocation-sessions'),
        fetch('/api/faculty'),
        fetch('/api/academic-terms'),
        fetch('/api/programs')
      ]);

      const [sessionsData, facultiesData, termsData, programsData] = await Promise.all([
        sessionsRes.json(),
        facultiesRes.json(),
        termsRes.json(),
        programsRes.json()
      ]);

      setSessions(sessionsData.success ? sessionsData.data : []);
      setFaculties(facultiesData || []);
      setAcademicTerms(termsData.success ? termsData.data : []);
      setPrograms(programsData?.data || []);

      // Load first session if available
      if (sessionsData.success && sessionsData.data.length > 0) {
        await loadSessionDetails(sessionsData.data[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load allocation data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (session: AllocationSessionWithDetails) => {
    setSelectedSession(session);
    try {
      const [allocationsRes, conflictsRes] = await Promise.all([
        fetch(`/api/course-allocations?sessionId=${session.id}&includeDetails=true`),
        fetch(`/api/allocation-conflicts?sessionId=${session.id}&includeDetails=true`)
      ]);

      const [allocationsData, conflictsData] = await Promise.all([
        allocationsRes.json(),
        conflictsRes.json()
      ]);

      setAllocations(allocationsData.success ? allocationsData.data : []);
      setConflicts(conflictsData.success ? conflictsData.data : []);
    } catch (error) {
      console.error('Error loading session details:', error);
      toast({
        title: "Error",
        description: "Failed to load session details",
        variant: "destructive",
      });
    }
  };

  const handleCreateSession = async () => {
    if (!formData.name || !formData.academicYear || formData.semesters.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/allocation-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Allocation session created successfully",
        });
        setShowCreateDialog(false);
        resetForm();
        fetchData();
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to create allocation session',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create allocation session",
        variant: "destructive",
      });
    }
  };

  const handleExecuteAllocation = async (sessionId: string) => {
    if (!selectedSession) return;

    setExecuting(true);
    try {
      const response = await fetch(`/api/allocation-sessions/${sessionId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: `Allocation completed! Created ${result.data.allocationsCreated} allocations with ${result.data.conflictsDetected} conflicts detected.`,
        });
        
        // Refresh session data
        await fetchData();
        if (selectedSession) {
          const updatedSession = sessions.find(s => s.id === sessionId);
          if (updatedSession) {
            await loadSessionDetails(updatedSession);
          }
        }
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to execute allocation',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error executing allocation:', error);
      toast({
        title: "Error",
        description: "Failed to execute allocation",
        variant: "destructive",
      });
    } finally {
      setExecuting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      academicYear: '',
      semesters: [],
      targetPrograms: [],
      status: 'draft',
      createdBy: 'current-user',
      allocationMethod: 'preference_based',
      algorithmSettings: {
        prioritizeSeniority: true,
        expertiseWeightage: 0.4,
        preferencePriorityWeightage: 0.3,
        workloadBalanceWeightage: 0.2,
        minimizeConflicts: true
      },
      notes: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'outline' as const, color: 'text-gray-600', label: 'Draft' },
      in_progress: { variant: 'default' as const, color: 'text-blue-600', label: 'In Progress' },
      completed: { variant: 'secondary' as const, color: 'text-green-600', label: 'Completed' },
      archived: { variant: 'outline' as const, color: 'text-gray-400', label: 'Archived' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const getConflictSeverityBadge = (severity: string) => {
    const severityConfig = {
      low: { variant: 'outline' as const, color: 'text-yellow-600', label: 'Low' },
      medium: { variant: 'default' as const, color: 'text-orange-600', label: 'Medium' },
      high: { variant: 'destructive' as const, color: 'text-red-600', label: 'High' },
      critical: { variant: 'destructive' as const, color: 'text-red-800', label: 'Critical' }
    };
    
    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.medium;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = !searchTerm || 
      session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.academicYear.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters = 
      (filters.status === 'all' || session.status === filters.status) &&
      (filters.academicYear === 'all' || session.academicYear === filters.academicYear);

    return matchesSearch && matchesFilters;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-10 bg-gray-200 rounded w-40"></div>
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
              <Target className="h-6 w-6" />
              Course Allocation Dashboard
            </CardTitle>
            <CardDescription>
              Semi-automatic course allocation with preference-based algorithms and manual adjustments.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> New Allocation Session
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Allocation Session</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 py-4">
                  <div>
                    <Label htmlFor="name">Session Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      placeholder="e.g., 2025-26 Semester 1,3,5 Allocation"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="academicYear">Academic Year <span className="text-red-500">*</span></Label>
                      <Select value={formData.academicYear} onValueChange={(value) => setFormData({...formData, academicYear: value})}>
                        <SelectTrigger>
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
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Target Semesters <span className="text-red-500">*</span></Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[1, 2, 3, 4, 5, 6].map((sem) => (
                          <div key={sem} className="flex items-center space-x-2">
                            <Checkbox
                              id={`sem-${sem}`}
                              checked={formData.semesters.includes(sem)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({...formData, semesters: [...formData.semesters, sem]});
                                } else {
                                  setFormData({...formData, semesters: formData.semesters.filter(s => s !== sem)});
                                }
                              }}
                            />
                            <label htmlFor={`sem-${sem}`} className="text-sm">Sem {sem}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Target Programs</Label>
                    <div className="mt-2 max-h-32 overflow-y-auto border rounded p-2">
                      {programs.slice(0, 10).map((program) => (
                        <div key={program.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`program-${program.id}`}
                            checked={formData.targetPrograms.includes(program.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({...formData, targetPrograms: [...formData.targetPrograms, program.id]});
                              } else {
                                setFormData({...formData, targetPrograms: formData.targetPrograms.filter(id => id !== program.id)});
                              }
                            }}
                          />
                          <label htmlFor={`program-${program.id}`} className="text-sm">
                            {program.name} ({program.code})
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      placeholder="Optional notes about this allocation session"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSession}>
                    Create Session
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sessions">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="allocations">Allocations</TabsTrigger>
              <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="space-y-4">
              <div className="mb-6 p-4 border rounded-lg space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary"/>
                  Filters & Search
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search sessions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Status</Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Academic Year</Label>
                    <Select value={filters.academicYear} onValueChange={(value) => setFilters({...filters, academicYear: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {academicTerms.map((term) => (
                          <SelectItem key={term.academicYear} value={term.academicYear}>
                            {term.academicYear}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No allocation sessions found. Create one to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSessions.map((session) => (
                    <Card key={session.id} className={selectedSession?.id === session.id ? 'ring-2 ring-primary' : ''}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{session.name}</CardTitle>
                          <CardDescription>
                            {session.academicYear} • Semesters: {session.semesters.join(', ')} • 
                            {session.targetPrograms.length} programs
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(session.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <BookOpen className="mr-1 h-4 w-4" />
                              {session.statistics?.allocatedCourses || 0} allocated
                            </span>
                            <span className="flex items-center">
                              <AlertTriangle className="mr-1 h-4 w-4" />
                              {session.statistics?.conflictsDetected || 0} conflicts
                            </span>
                            <span className="flex items-center">
                              <Users className="mr-1 h-4 w-4" />
                              {session.statistics?.facultyWithFullLoad || 0} faculty loaded
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadSessionDetails(session)}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Button>
                            {(session.status === 'draft' || session.status === 'in_progress') && (
                              <Button
                                size="sm"
                                onClick={() => handleExecuteAllocation(session.id)}
                                disabled={executing}
                              >
                                {executing ? (
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Play className="mr-2 h-4 w-4" />
                                )}
                                {session.status === 'draft' ? 'Execute' : 'Re-execute'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="allocations" className="space-y-4">
              {selectedSession ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">
                      Allocations for {selectedSession.name}
                    </h3>
                    <Badge variant="outline">
                      {allocations.length} total allocations
                    </Badge>
                  </div>
                  {allocations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No allocations found. Execute the allocation algorithm to generate assignments.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead>Faculty</TableHead>
                          <TableHead>Hours/Week</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Preference Match</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allocations.map((allocation) => (
                          <TableRow key={allocation.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{allocation.courseName}</div>
                                <div className="text-sm text-muted-foreground">{(allocation as any).courseCode}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{allocation.facultyName}</div>
                                <div className="text-sm text-muted-foreground">{allocation.facultyDepartment}</div>
                              </div>
                            </TableCell>
                            <TableCell>{allocation.hoursPerWeek}h</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {allocation.allocationScore}/100
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  allocation.preferenceMatch === 'high' ? 'default' :
                                  allocation.preferenceMatch === 'medium' ? 'secondary' :
                                  allocation.preferenceMatch === 'low' ? 'outline' : 'destructive'
                                }
                              >
                                {allocation.preferenceMatch}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(allocation.status)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a session to view its allocations.
                </div>
              )}
            </TabsContent>

            <TabsContent value="conflicts" className="space-y-4">
              {selectedSession ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">
                      Conflicts for {selectedSession.name}
                    </h3>
                    <Badge variant="outline">
                      {conflicts.filter(c => c.status === 'unresolved').length} unresolved conflicts
                    </Badge>
                  </div>
                  {conflicts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      No conflicts detected! All allocations are clean.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Faculty</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conflicts.map((conflict) => (
                          <TableRow key={conflict.id}>
                            <TableCell>
                              <Badge variant="outline">
                                {conflict.conflictType.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>{getConflictSeverityBadge(conflict.severity)}</TableCell>
                            <TableCell>{conflict.facultyName || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate">{conflict.description}</TableCell>
                            <TableCell>{getStatusBadge(conflict.status)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a session to view its conflicts.
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              {selectedSession ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedSession.statistics?.totalCourses || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {selectedSession.statistics?.allocatedCourses || 0} allocated
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Faculty Load</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedSession.statistics?.facultyWithFullLoad || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        of {selectedSession.statistics?.totalFaculty || 0} faculty
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedSession.statistics?.averageSatisfactionScore || 0}%</div>
                      <Progress value={selectedSession.statistics?.averageSatisfactionScore || 0} className="mt-2" />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Conflicts</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedSession.statistics?.conflictsDetected || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {conflicts.filter(c => c.status === 'resolved').length} resolved
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a session to view analytics.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}