'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  GripVertical,
  Save,
  RotateCcw,
  UserCircle,
  Calendar,
  TrendingUp,
  PieChart,
  Activity,
  Award,
  AlertCircle
} from 'lucide-react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
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
  
  // Drag and drop state
  const [isDragMode, setIsDragMode] = useState(false);
  const [draggedAllocation, setDraggedAllocation] = useState<CourseAllocationWithDetails | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'faculty'>('faculty');
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const allocation = allocations.find(a => a.id === event.active.id);
    if (allocation) {
      setDraggedAllocation(allocation);
    }
  }, [allocations]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedAllocation(null);
    
    if (!over || active.id === over.id) return;
    
    // Extract faculty ID from droppable ID (format: "faculty-{facultyId}")
    const targetFacultyId = over.id.toString().replace('faculty-', '');
    const allocationId = active.id.toString();
    
    // Find the allocation being moved
    const allocation = allocations.find(a => a.id === allocationId);
    if (!allocation || allocation.facultyId === targetFacultyId) return;
    
    // Update local state immediately for responsive UI
    const updatedAllocations = allocations.map(a => 
      a.id === allocationId 
        ? { 
            ...a, 
            facultyId: targetFacultyId,
            facultyName: faculties.find(f => f.id === targetFacultyId)?.displayName || 'Unknown Faculty',
            isManualAssignment: true,
            status: 'pending' as const
          }
        : a
    );
    setAllocations(updatedAllocations);
    setHasUnsavedChanges(true);
    
    toast({
      title: "Allocation moved",
      description: `Course moved to ${faculties.find(f => f.id === targetFacultyId)?.displayName || 'faculty'}. Click Save to persist changes.`,
    });
  }, [allocations, faculties, toast]);

  const saveChanges = async () => {
    if (!hasUnsavedChanges) return;
    
    try {
      const changedAllocations = allocations.filter(a => a.isManualAssignment);
      
      await Promise.all(
        changedAllocations.map(allocation =>
          fetch(`/api/course-allocations/${allocation.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              facultyId: allocation.facultyId,
              isManualAssignment: true,
              status: 'approved'
            })
          })
        )
      );
      
      setHasUnsavedChanges(false);
      toast({
        title: "Changes saved",
        description: `${changedAllocations.length} allocation(s) updated successfully.`,
      });
      
      // Refresh data
      if (selectedSession) {
        await loadSessionDetails(selectedSession);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const revertChanges = async () => {
    setHasUnsavedChanges(false);
    if (selectedSession) {
      await loadSessionDetails(selectedSession);
    }
    toast({
      title: "Changes reverted",
      description: "All unsaved changes have been discarded.",
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

  // Group allocations by faculty for drag-and-drop view
  const facultyAllocations = faculties.map(faculty => ({
    faculty,
    allocations: allocations.filter(a => a.facultyId === faculty.id),
    totalHours: allocations
      .filter(a => a.facultyId === faculty.id)
      .reduce((sum, a) => sum + (a.hoursPerWeek || 0), 0)
  }));

  // Analytics calculations
  const analyticsData = {
    workloadDistribution: facultyAllocations.map(f => ({
      name: f.faculty.displayName || f.faculty.fullName || 'Unknown',
      hours: f.totalHours,
      courses: f.allocations.length,
      utilization: Math.round((f.totalHours / 18) * 100),
      department: f.faculty.department || 'Unknown'
    })),
    
    departmentStats: Object.entries(
      facultyAllocations.reduce((acc, f) => {
        const dept = f.faculty.department || 'Unknown';
        if (!acc[dept]) acc[dept] = { totalHours: 0, facultyCount: 0, courses: 0 };
        acc[dept].totalHours += f.totalHours;
        acc[dept].facultyCount += 1;
        acc[dept].courses += f.allocations.length;
        return acc;
      }, {} as Record<string, { totalHours: number; facultyCount: number; courses: number }>)
    ).map(([dept, stats]) => ({
      department: dept,
      avgHours: Math.round(stats.totalHours / stats.facultyCount),
      totalCourses: stats.courses,
      facultyCount: stats.facultyCount,
      utilization: Math.round((stats.totalHours / (stats.facultyCount * 18)) * 100)
    })),

    preferenceSatisfaction: allocations.reduce((acc, a) => {
      acc[a.preferenceMatch] = (acc[a.preferenceMatch] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),

    allocationEfficiency: {
      totalAllocations: allocations.length,
      manualAdjustments: allocations.filter(a => a.isManualAssignment).length,
      highPreferenceMatch: allocations.filter(a => a.preferenceMatch === 'high').length,
      averageScore: Math.round(allocations.reduce((sum, a) => sum + (a.allocationScore || 0), 0) / allocations.length),
      overloadedFaculty: facultyAllocations.filter(f => f.totalHours > 18).length,
      underutilizedFaculty: facultyAllocations.filter(f => f.totalHours < 12).length
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Draggable allocation item component
  const DraggableAllocation = ({ allocation }: { allocation: CourseAllocationWithDetails }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: allocation.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-3 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow ${
          isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''
        } ${allocation.isManualAssignment ? 'border-orange-200 bg-orange-50' : ''}`}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <div>
              <div className="font-medium text-sm">{allocation.courseName}</div>
              <div className="text-xs text-muted-foreground">{(allocation as any).courseCode}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {allocation.hoursPerWeek}h
            </Badge>
            <Badge 
              variant={
                allocation.preferenceMatch === 'high' ? 'default' :
                allocation.preferenceMatch === 'medium' ? 'secondary' :
                allocation.preferenceMatch === 'low' ? 'outline' : 'destructive'
              }
              className="text-xs"
            >
              {allocation.preferenceMatch}
            </Badge>
            {allocation.isManualAssignment && (
              <Badge variant="outline" className="text-xs text-orange-600">
                Manual
              </Badge>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Score: {allocation.allocationScore}/100 • {allocation.assignmentType}
        </div>
      </div>
    );
  };

  // Droppable faculty column component
  const FacultyColumn = ({ facultyData }: { facultyData: typeof facultyAllocations[0] }) => {
    const { faculty, allocations: facultyAllocationsData, totalHours } = facultyData;
    const isOverloaded = totalHours > 18; // GTU limit
    
    const { isOver, setNodeRef } = useDroppable({
      id: `faculty-${faculty.id}`,
    });
    
    return (
      <Card 
        ref={setNodeRef}
        className={`min-h-96 transition-colors ${
          isOverloaded ? 'border-red-200 bg-red-50' : ''
        } ${
          isOver ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserCircle className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-sm">{faculty.displayName || faculty.fullName}</CardTitle>
                <CardDescription className="text-xs">{faculty.department}</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${isOverloaded ? 'text-red-600' : 'text-green-600'}`}>
                {totalHours}h / 18h
              </div>
              <div className="text-xs text-muted-foreground">
                {facultyAllocationsData.length} courses
              </div>
            </div>
          </div>
          <Progress 
            value={(totalHours / 18) * 100} 
            className={`h-2 ${isOverloaded ? 'bg-red-100' : ''}`} 
          />
        </CardHeader>
        <CardContent 
          className={`space-y-2 min-h-64 transition-colors ${
            isOver ? 'bg-blue-50' : ''
          }`}
        >
          <SortableContext items={facultyAllocationsData.map(a => a.id)} strategy={verticalListSortingStrategy}>
            {facultyAllocationsData.map((allocation) => (
              <DraggableAllocation key={allocation.id} allocation={allocation} />
            ))}
          </SortableContext>
          {facultyAllocationsData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
              <div>No courses assigned</div>
              <div className="mt-2 text-xs">
                {isOver ? 'Drop course here' : 'Drag courses here to assign'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-medium">
                        Allocations for {selectedSession.name}
                      </h3>
                      <Badge variant="outline">
                        {allocations.length} total allocations
                      </Badge>
                      {hasUnsavedChanges && (
                        <Badge variant="secondary" className="text-orange-600">
                          Unsaved changes
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select value={viewMode} onValueChange={(value: 'table' | 'faculty') => setViewMode(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="faculty">Faculty View</SelectItem>
                          <SelectItem value="table">Table View</SelectItem>
                        </SelectContent>
                      </Select>
                      {hasUnsavedChanges && (
                        <>
                          <Button variant="outline" size="sm" onClick={revertChanges}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Revert
                          </Button>
                          <Button size="sm" onClick={saveChanges}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {allocations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No allocations found. Execute the allocation algorithm to generate assignments.
                    </div>
                  ) : viewMode === 'faculty' && selectedSession.status !== 'completed' ? (
                    <div>
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-blue-900">Drag & Drop Mode</h4>
                            <p className="text-sm text-blue-700">
                              Drag courses between faculty to reassign them. Changes are highlighted and must be saved manually.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {facultyAllocations.map((facultyData) => (
                            <div key={facultyData.faculty.id} id={`faculty-${facultyData.faculty.id}`}>
                              <FacultyColumn facultyData={facultyData} />
                            </div>
                          ))}
                        </div>
                        
                        <DragOverlay>
                          {draggedAllocation ? (
                            <div className="p-3 border rounded-lg bg-white shadow-lg border-blue-300">
                              <div className="flex items-center space-x-2">
                                <GripVertical className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="font-medium text-sm">{draggedAllocation.courseName}</div>
                                  <div className="text-xs text-muted-foreground">{(draggedAllocation as any).courseCode}</div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </DragOverlay>
                      </DndContext>
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
                          <TableRow key={allocation.id} className={allocation.isManualAssignment ? 'bg-orange-50' : ''}>
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
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getStatusBadge(allocation.status)}
                                {allocation.isManualAssignment && (
                                  <Badge variant="outline" className="text-xs text-orange-600">
                                    Manual
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
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

            <TabsContent value="analytics" className="space-y-6">
              {selectedSession ? (
                <div className="space-y-6">
                  {/* Key Metrics Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.allocationEfficiency.totalAllocations}</div>
                        <p className="text-xs text-muted-foreground">
                          {analyticsData.allocationEfficiency.highPreferenceMatch} high preference
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Faculty Load</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {Math.round(analyticsData.workloadDistribution.reduce((sum, f) => sum + f.hours, 0) / analyticsData.workloadDistribution.length)}h
                        </div>
                        <p className="text-xs text-muted-foreground">
                          of 18h maximum
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Allocation Score</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.allocationEfficiency.averageScore}/100</div>
                        <Progress value={analyticsData.allocationEfficiency.averageScore} className="mt-2" />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Workload Issues</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">{analyticsData.allocationEfficiency.overloadedFaculty}</div>
                        <p className="text-xs text-muted-foreground">
                          overloaded faculty
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Faculty Workload Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Faculty Workload Distribution
                        </CardTitle>
                        <CardDescription>
                          Hours per week by faculty member (GTU limit: 18h)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={analyticsData.workloadDistribution.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45}
                              textAnchor="end"
                              height={100}
                              interval={0}
                              fontSize={12}
                            />
                            <YAxis />
                            <Tooltip 
                              formatter={(value, name) => [
                                `${value}h`,
                                name === 'hours' ? 'Teaching Load' : name
                              ]}
                              labelFormatter={(label) => `Faculty: ${label}`}
                            />
                            <Bar 
                              dataKey="hours" 
                              name="Teaching Hours"
                            >
                              {analyticsData.workloadDistribution.slice(0, 10).map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`}
                                  fill={entry.hours > 18 ? '#EF4444' : entry.hours < 12 ? '#F59E0B' : '#10B981'}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Preference Satisfaction */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="h-5 w-5" />
                          Preference Satisfaction
                        </CardTitle>
                        <CardDescription>
                          Distribution of preference matching levels
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsPieChart>
                            <Pie
                              data={Object.entries(analyticsData.preferenceSatisfaction).map(([key, value]) => ({
                                name: key.charAt(0).toUpperCase() + key.slice(1),
                                value,
                                percentage: Math.round((value / allocations.length) * 100)
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({name, percentage}) => `${name} (${percentage}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {Object.entries(analyticsData.preferenceSatisfaction).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => [value, 'Allocations']} />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Department Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Department Analysis
                      </CardTitle>
                      <CardDescription>
                        Workload distribution and utilization by department
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={analyticsData.departmentStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="department" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'avgHours' ? `${value}h` :
                              name === 'utilization' ? `${value}%` :
                              value,
                              name === 'avgHours' ? 'Avg Hours' :
                              name === 'utilization' ? 'Utilization' :
                              name === 'totalCourses' ? 'Total Courses' :
                              name === 'facultyCount' ? 'Faculty Count' : name
                            ]}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="avgHours" fill="#8884d8" name="Avg Hours" />
                          <Bar yAxisId="left" dataKey="totalCourses" fill="#82ca9d" name="Total Courses" />
                          <Bar yAxisId="right" dataKey="utilization" fill="#ffc658" name="Utilization %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Detailed Faculty Workload Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Detailed Faculty Workload
                      </CardTitle>
                      <CardDescription>
                        Comprehensive faculty workload breakdown with alerts
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Faculty</TableHead>
                              <TableHead>Department</TableHead>
                              <TableHead>Teaching Hours</TableHead>
                              <TableHead>Courses</TableHead>
                              <TableHead>Utilization</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analyticsData.workloadDistribution
                              .sort((a, b) => b.hours - a.hours)
                              .map((faculty) => {
                                const status = 
                                  faculty.hours > 18 ? 'overloaded' :
                                  faculty.hours < 12 ? 'underutilized' :
                                  'optimal';
                                
                                return (
                                  <TableRow key={faculty.name} className={
                                    status === 'overloaded' ? 'bg-red-50' :
                                    status === 'underutilized' ? 'bg-yellow-50' :
                                    'bg-green-50'
                                  }>
                                    <TableCell className="font-medium">{faculty.name}</TableCell>
                                    <TableCell>{faculty.department}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        <span>{faculty.hours}h</span>
                                        <Progress value={(faculty.hours / 18) * 100} className="w-20 h-2" />
                                      </div>
                                    </TableCell>
                                    <TableCell>{faculty.courses}</TableCell>
                                    <TableCell>{faculty.utilization}%</TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant={
                                          status === 'overloaded' ? 'destructive' :
                                          status === 'underutilized' ? 'secondary' :
                                          'default'
                                        }
                                      >
                                        {status === 'overloaded' ? 'Overloaded' :
                                         status === 'underutilized' ? 'Under-utilized' :
                                         'Optimal'}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
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