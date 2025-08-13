"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  Plus, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  CalendarClock,
  Users,
  Shield,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  Timer,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { temporaryRoleService, type TemporaryRoleAssignment, type TemporaryRoleRequest, type TemporaryRoleStats } from '@/lib/services/temporaryRoleService';
import type { UserRole as UserRoleCode, Role } from '@/types/entities';

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  currentRoles: UserRoleCode[];
}

interface TemporaryRoleManagerProps {
  users: User[];
  availableRoles: Role[];
  currentUser: {
    id: string;
    name: string;
    activeRole: UserRoleCode;
  };
}

const TemporaryRoleManager: React.FC<TemporaryRoleManagerProps> = ({
  users,
  availableRoles,
  currentUser
}) => {
  const [assignments, setAssignments] = useState<TemporaryRoleAssignment[]>([]);
  const [stats, setStats] = useState<TemporaryRoleStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TemporaryRoleAssignment | null>(null);
  const [activeTab, setActiveTab] = useState('assignments');
  
  // Form state for creating new assignment
  const [formData, setFormData] = useState<TemporaryRoleRequest>({
    userId: '',
    roleCode: '' as UserRoleCode,
    duration: 24,
    reason: '',
    justification: '',
    urgency: 'medium',
    metadata: {}
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  
  const { toast } = useToast();

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [assignmentsData, statsData] = await Promise.all([
        temporaryRoleService.getAllTemporaryAssignments(),
        temporaryRoleService.getTemporaryRoleStats()
      ]);
      
      setAssignments(assignmentsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching temporary role data:", error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to load temporary role assignments." 
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle form submission
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = temporaryRoleService.utils.validateRequest(formData);
    if (!validation.valid) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: validation.errors.join(', ')
      });
      return;
    }
    
    try {
      await temporaryRoleService.createTemporaryAssignment(formData);
      await fetchData();
      setIsCreateDialogOpen(false);
      setFormData({
        userId: '',
        roleCode: '' as UserRoleCode,
        duration: 24,
        reason: '',
        justification: '',
        urgency: 'medium',
        metadata: {}
      });
      
      toast({
        title: "Assignment Created",
        description: "Temporary role assignment has been created successfully."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: (error as Error).message || "Failed to create temporary assignment."
      });
    }
  };

  // Handle assignment actions
  const handleApprove = async (assignment: TemporaryRoleAssignment) => {
    try {
      await temporaryRoleService.approveTemporaryAssignment(assignment.id, currentUser.id);
      await fetchData();
      toast({
        title: "Assignment Approved",
        description: `Temporary role assignment for ${assignment.roleCode} has been approved.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: (error as Error).message || "Failed to approve assignment."
      });
    }
  };

  const handleRevoke = async (assignment: TemporaryRoleAssignment) => {
    try {
      await temporaryRoleService.revokeTemporaryAssignment(assignment.id, currentUser.id, "Revoked by admin");
      await fetchData();
      toast({
        title: "Assignment Revoked",
        description: `Temporary role assignment for ${assignment.roleCode} has been revoked.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Revocation Failed",
        description: (error as Error).message || "Failed to revoke assignment."
      });
    }
  };

  const handleExtend = async (assignment: TemporaryRoleAssignment, additionalHours: number) => {
    try {
      const newExpiryDate = new Date(assignment.expiresAt);
      newExpiryDate.setHours(newExpiryDate.getHours() + additionalHours);
      
      await temporaryRoleService.extendTemporaryAssignment(
        assignment.id, 
        newExpiryDate, 
        `Extended by ${additionalHours} hours`
      );
      await fetchData();
      toast({
        title: "Assignment Extended",
        description: `Assignment extended by ${additionalHours} hours.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Extension Failed",
        description: (error as Error).message || "Failed to extend assignment."
      });
    }
  };

  // Process expired assignments
  const processExpiredAssignments = async () => {
    try {
      const result = await temporaryRoleService.processExpiredAssignments();
      await fetchData();
      toast({
        title: "Expired Assignments Processed",
        description: `Processed ${result.processed} expired assignments.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: (error as Error).message || "Failed to process expired assignments."
      });
    }
  };

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    if (statusFilter !== 'all' && assignment.status !== statusFilter) return false;
    if (roleFilter !== 'all' && assignment.roleCode !== roleFilter) return false;
    if (urgencyFilter !== 'all') {
      const isEmergency = assignment.metadata?.emergency;
      if (urgencyFilter === 'emergency' && !isEmergency) return false;
      if (urgencyFilter === 'normal' && isEmergency) return false;
    }
    return true;
  });

  const getStatusBadgeVariant = (status: TemporaryRoleAssignment['status']) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'expired': return 'destructive';
      case 'revoked': return 'outline';
      default: return 'outline';
    }
  };

  const getUrgencyBadgeVariant = (assignment: TemporaryRoleAssignment) => {
    if (assignment.metadata?.emergency) return 'destructive';
    return 'outline';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p>Loading temporary role assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Timer className="h-6 w-6" />
            Temporary Role Management
          </h1>
          <p className="text-muted-foreground">
            Manage temporary role assignments with expiration dates
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={processExpiredAssignments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Process Expired
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Temporary Role Assignment</DialogTitle>
                <DialogDescription>
                  Assign a temporary role to a user with an expiration date
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateAssignment} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user">Select User *</Label>
                    <Select 
                      value={formData.userId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, userId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex flex-col">
                              <span>{user.name}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="role">Select Role *</Label>
                    <Select 
                      value={formData.roleCode} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, roleCode: value as UserRoleCode }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose role" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.id} value={role.code}>
                            <div className="flex flex-col">
                              <span>{role.name}</span>
                              <span className="text-xs text-muted-foreground">{role.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (hours) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="8760"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="urgency">Urgency Level *</Label>
                    <Select 
                      value={formData.urgency} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        urgency: value as 'low' | 'medium' | 'high' | 'emergency',
                        metadata: { ...prev.metadata, emergency: value === 'emergency' }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Reason *</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Brief reason for temporary assignment"
                  />
                </div>

                <div>
                  <Label htmlFor="justification">Justification *</Label>
                  <Textarea
                    id="justification"
                    value={formData.justification}
                    onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
                    placeholder="Detailed justification for the temporary role assignment"
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Assignment
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Active Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActive}</div>
              <p className="text-xs text-muted-foreground">
                {stats.expiringIn24Hours} expiring in 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApproval}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Emergency Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.emergencyAssignments}</div>
              <p className="text-xs text-muted-foreground">
                High priority
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalActive + stats.totalExpired + stats.totalRevoked}
              </div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.code}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Urgency</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Assignments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Temporary Role Assignments ({filteredAssignments.length})</CardTitle>
              <CardDescription>
                Manage temporary role assignments with expiration tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => {
                    const user = users.find(u => u.id === assignment.userId);
                    const role = availableRoles.find(r => r.code === assignment.roleCode);
                    const remainingTime = temporaryRoleService.utils.getRemainingTime(assignment);
                    const isExpiringSoon = temporaryRoleService.utils.isExpiringSoon(assignment);
                    
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user?.name || 'Unknown User'}</div>
                            <div className="text-sm text-muted-foreground">{user?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{role?.name || assignment.roleCode}</div>
                            {assignment.metadata?.emergency && (
                              <Badge variant="destructive" className="text-xs mt-1">
                                Emergency
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(assignment.status)}>
                            {assignment.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(assignment.expiresAt).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`text-sm ${isExpiringSoon ? 'text-orange-600 font-medium' : ''}`}>
                            {remainingTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            
                            {assignment.status === 'pending' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleApprove(assignment)}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                            
                            {assignment.status === 'active' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleExtend(assignment, 24)}
                                  title="Extend by 24 hours"
                                >
                                  <CalendarClock className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleRevoke(assignment)}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredAssignments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-muted-foreground">
                          No temporary role assignments found.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics content would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Analytics</CardTitle>
              <CardDescription>
                Statistics and trends for temporary role assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Assignment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
            <DialogDescription>
              View detailed information about the temporary role assignment
            </DialogDescription>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="space-y-4 py-4">
              {/* Assignment details content */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">User</Label>
                  <p className="text-sm">
                    {users.find(u => u.id === selectedAssignment.userId)?.name || 'Unknown User'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                  <p className="text-sm">
                    {availableRoles.find(r => r.code === selectedAssignment.roleCode)?.name || selectedAssignment.roleCode}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant={getStatusBadgeVariant(selectedAssignment.status)}>
                    {selectedAssignment.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Remaining Time</Label>
                  <p className="text-sm">
                    {temporaryRoleService.utils.getRemainingTime(selectedAssignment)}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Reason</Label>
                <p className="text-sm">{selectedAssignment.reason}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Assigned</Label>
                <p className="text-sm">
                  {new Date(selectedAssignment.assignedAt).toLocaleString()} by {selectedAssignment.assignedBy}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Expires</Label>
                <p className="text-sm">
                  {new Date(selectedAssignment.expiresAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemporaryRoleManager;