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
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Building,
  AlertTriangle,
  MessageSquare,
  Filter,
  Search,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Edit,
  BarChart3,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { 
  AllocationSessionWithDetails, 
  CourseAllocationWithDetails,
  Faculty
} from '@/types/entities';

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  needsReview: number;
}

interface DepartmentSummary {
  department: string;
  totalAllocations: number;
  pending: number;
  approved: number;
  rejected: number;
  facultyCount: number;
}

interface ApprovalRecord {
  id: string;
  action: string;
  approverRole: string;
  approverName: string;
  approverEmail: string;
  comments: string;
  timestamp: string;
  department?: string;
}

export default function AllocationApprovalPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<AllocationSessionWithDetails[]>([]);
  const [selectedSession, setSelectedSession] = useState<AllocationSessionWithDetails | null>(null);
  const [allocations, setAllocations] = useState<CourseAllocationWithDetails[]>([]);
  const [approvalStats, setApprovalStats] = useState<ApprovalStats>({ pending: 0, approved: 0, rejected: 0, needsReview: 0 });
  const [departmentSummary, setDepartmentSummary] = useState<DepartmentSummary[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAllocations, setSelectedAllocations] = useState<string[]>([]);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    department: 'all',
    approvalStatus: 'pending'
  });

  // Approval form state
  const [approvalForm, setApprovalForm] = useState({
    action: 'approve' as 'approve' | 'reject' | 'request_changes',
    comments: '',
    approverRole: 'admin', // Could be dynamic based on user role
    approverName: 'Current User', // Should come from auth context
    approverEmail: 'user@example.com', // Should come from auth context
    department: '' // For HOD approvals
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, facultiesRes] = await Promise.all([
        fetch('/api/allocation-sessions'),
        fetch('/api/faculty')
      ]);

      const [sessionsData, facultiesData] = await Promise.all([
        sessionsRes.json(),
        facultiesRes.json()
      ]);

      setSessions(sessionsData.success ? sessionsData.data : []);
      setFaculties(facultiesData || []);

      // Load first completed/in-progress session if available
      if (sessionsData.success && sessionsData.data.length > 0) {
        const approvalReadySession = sessionsData.data.find((s: any) => 
          s.status === 'completed' || s.status === 'in_progress'
        );
        if (approvalReadySession) {
          await loadSessionApprovalData(approvalReadySession);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load approval data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSessionApprovalData = async (session: AllocationSessionWithDetails) => {
    setSelectedSession(session);
    try {
      const [approvalRes, allocationsRes] = await Promise.all([
        fetch(`/api/allocation-sessions/${session.id}/approval?role=${approvalForm.approverRole}`),
        fetch(`/api/course-allocations?sessionId=${session.id}&includeDetails=true`)
      ]);

      const [approvalData, allocationsData] = await Promise.all([
        approvalRes.json(),
        allocationsRes.json()
      ]);

      if (approvalData.success) {
        setApprovalStats(approvalData.data.approvalStats);
        setDepartmentSummary(approvalData.data.departmentSummary || []);
      }

      setAllocations(allocationsData.success ? allocationsData.data : []);
    } catch (error) {
      console.error('Error loading session approval data:', error);
      toast({
        title: "Error",
        description: "Failed to load session approval data",
        variant: "destructive",
      });
    }
  };

  const handleApprovalSubmit = async () => {
    if (selectedAllocations.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select allocations to approve/reject",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/allocation-sessions/${selectedSession?.id}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allocationIds: selectedAllocations,
          ...approvalForm
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: `${result.data.processedAllocations} allocation(s) ${approvalForm.action}d successfully`,
        });
        setShowApprovalDialog(false);
        setSelectedAllocations([]);
        setApprovalForm(prev => ({ ...prev, comments: '' }));
        
        // Refresh data
        if (selectedSession) {
          await loadSessionApprovalData(selectedSession);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to process approval',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: "Error",
        description: "Failed to process approval",
        variant: "destructive",
      });
    }
  };

  const handleBulkApproval = async (action: string, criteria: any = {}) => {
    if (!selectedSession) return;

    try {
      const response = await fetch(`/api/allocation-sessions/${selectedSession.id}/approval`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          approverRole: approvalForm.approverRole,
          approverName: approvalForm.approverName,
          approverEmail: approvalForm.approverEmail,
          department: approvalForm.department,
          criteria,
          comments: `Bulk ${action.replace('_', ' ')}`
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: `${result.data.processedAllocations} allocation(s) processed successfully`,
        });
        
        // Refresh data
        await loadSessionApprovalData(selectedSession);
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to process bulk approval',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing bulk approval:', error);
      toast({
        title: "Error",
        description: "Failed to process bulk approval",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'outline' as const, color: 'text-yellow-600', label: 'Pending', icon: Clock },
      approved: { variant: 'default' as const, color: 'text-green-600', label: 'Approved', icon: CheckCircle },
      rejected: { variant: 'destructive' as const, color: 'text-red-600', label: 'Rejected', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredAllocations = allocations.filter(allocation => {
    const matchesSearch = !searchTerm || 
      allocation.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.facultyName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters = 
      (filters.approvalStatus === 'all' || 
       (allocation as any).approvalStatus === filters.approvalStatus ||
       (!((allocation as any).approvalStatus) && filters.approvalStatus === 'pending')) &&
      (filters.department === 'all' || allocation.facultyDepartment === filters.department) &&
      (filters.status === 'all' || allocation.status === filters.status);

    return matchesSearch && matchesFilters;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
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
              <CheckCircle2 className="h-6 w-6" />
              Allocation Approval Workflow
            </CardTitle>
            <CardDescription>
              Review and approve course allocations for HOD and administrative oversight.
            </CardDescription>
          </div>
          {selectedSession && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {selectedSession.name}
              </Badge>
              <Badge variant="secondary">
                {approvalStats.approved}/{approvalStats.approved + approvalStats.pending + approvalStats.rejected} Approved
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Session Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Select Session for Approval
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.filter(s => s.status === 'completed' || s.status === 'in_progress').map((session) => (
                      <Card 
                        key={session.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedSession?.id === session.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => loadSessionApprovalData(session)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{session.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {session.academicYear} • Semesters: {session.semesters.join(', ')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm">
                            <span>{session.statistics?.allocatedCourses || 0} allocations</span>
                            <Badge variant="outline">{session.status}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedSession && (
                <>
                  {/* Approval Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{approvalStats.pending}</div>
                        <Progress value={(approvalStats.pending / (approvalStats.pending + approvalStats.approved + approvalStats.rejected)) * 100} className="mt-2" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{approvalStats.approved}</div>
                        <Progress value={(approvalStats.approved / (approvalStats.pending + approvalStats.approved + approvalStats.rejected)) * 100} className="mt-2" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">{approvalStats.rejected}</div>
                        <Progress value={(approvalStats.rejected / (approvalStats.pending + approvalStats.approved + approvalStats.rejected)) * 100} className="mt-2" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{approvalStats.needsReview}</div>
                        <p className="text-xs text-muted-foreground">Manual assignments</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Quick Approval Actions
                      </CardTitle>
                      <CardDescription>
                        Bulk approval actions for efficient workflow management
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => handleBulkApproval('approve_by_criteria', { preferenceMatch: 'high', onlyAutomatic: true })}
                        >
                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                          Approve High-Preference Auto
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => handleBulkApproval('approve_by_criteria', { minScore: 80 })}
                        >
                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                          Approve Score ≥ 80
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => handleBulkApproval('approve_all')}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                          Approve All Pending
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {selectedSession ? (
                <div>
                  {/* Filters and Actions */}
                  <div className="mb-6 p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Filter className="h-5 w-5 text-primary"/>
                        Filters & Actions
                      </h3>
                      <div className="flex space-x-2">
                        {selectedAllocations.length > 0 && (
                          <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                            <DialogTrigger asChild>
                              <Button>
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                Review Selected ({selectedAllocations.length})
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Review Allocations</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Action</Label>
                                  <Select 
                                    value={approvalForm.action} 
                                    onValueChange={(value: any) => setApprovalForm(prev => ({ ...prev, action: value }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="approve">Approve</SelectItem>
                                      <SelectItem value="reject">Reject</SelectItem>
                                      <SelectItem value="request_changes">Request Changes</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Comments</Label>
                                  <Textarea
                                    placeholder="Add comments for this approval decision..."
                                    value={approvalForm.comments}
                                    onChange={(e) => setApprovalForm(prev => ({ ...prev, comments: e.target.value }))}
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleApprovalSubmit}>
                                    Submit Review
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="search">Search</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="search"
                            placeholder="Search allocations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Approval Status</Label>
                        <Select value={filters.approvalStatus} onValueChange={(value) => setFilters({...filters, approvalStatus: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="all">All Status</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Department</Label>
                        <Select value={filters.department} onValueChange={(value) => setFilters({...filters, department: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {[...new Set(allocations.map(a => a.facultyDepartment).filter(Boolean))].map((dept) => (
                              <SelectItem key={dept} value={dept!}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Allocation Status</Label>
                        <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {filteredAllocations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No allocations found matching the current filters.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedAllocations.length === filteredAllocations.length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedAllocations(filteredAllocations.map(a => a.id));
                                } else {
                                  setSelectedAllocations([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Faculty</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Preference</TableHead>
                          <TableHead>Approval Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAllocations.map((allocation) => (
                          <TableRow 
                            key={allocation.id}
                            className={(allocation as any).isManualAssignment ? 'bg-orange-50' : ''}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedAllocations.includes(allocation.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedAllocations(prev => [...prev, allocation.id]);
                                  } else {
                                    setSelectedAllocations(prev => prev.filter(id => id !== allocation.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{allocation.courseName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {(allocation as any).courseCode}
                                  {(allocation as any).isManualAssignment && (
                                    <Badge variant="outline" className="ml-2 text-xs">Manual</Badge>
                                  )}
                                </div>
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
                              {getStatusBadge((allocation as any).approvalStatus || 'pending')}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
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
                  Select a session to review pending allocations.
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                Approved allocations view - similar structure to pending but filtered for approved items.
              </div>
            </TabsContent>

            <TabsContent value="departments" className="space-y-4">
              {selectedSession && departmentSummary.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departmentSummary.map((dept) => (
                    <Card key={dept.department}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="h-5 w-5" />
                          {dept.department}
                        </CardTitle>
                        <CardDescription>
                          {dept.facultyCount} faculty members
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span>Total Allocations:</span>
                            <Badge variant="outline">{dept.totalAllocations}</Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>Approved:</span>
                            <Badge className="bg-green-100 text-green-800">{dept.approved}</Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>Pending:</span>
                            <Badge className="bg-yellow-100 text-yellow-800">{dept.pending}</Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>Rejected:</span>
                            <Badge className="bg-red-100 text-red-800">{dept.rejected}</Badge>
                          </div>
                          <div className="mt-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span>Approval Progress</span>
                              <span>{Math.round((dept.approved / dept.totalAllocations) * 100)}%</span>
                            </div>
                            <Progress value={(dept.approved / dept.totalAllocations) * 100} />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-4"
                            onClick={() => handleBulkApproval('approve_department', { department: dept.department })}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve All Department
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a session to view department approval summary.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}