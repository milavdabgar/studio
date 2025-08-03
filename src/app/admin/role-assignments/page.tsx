"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, Users, Shield, Search, Plus, Edit, Trash2, Eye, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { committeePermissions } from '@/lib/api/roles';
import { permissionUtils, permissionCategories } from '@/lib/utils/permissions';

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  roles: string[];
  status: 'active' | 'inactive';
}

interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  isCommitteeRole: boolean;
  committeeId?: string;
  committeeCode?: string;
}

interface Committee {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'active' | 'inactive' | 'dissolved';
}

interface RoleAssignment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userDepartment: string;
  roleId: string;
  roleName: string;
  roleCode: string;
  committeeId?: string;
  committeeName?: string;
  assignedAt: Date;
  assignedBy: string;
  status: 'active' | 'pending' | 'revoked';
  validFrom: Date;
  validUntil?: Date;
}

const RoleAssignmentPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('assignments');
  
  // Form state
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedCommittee, setSelectedCommittee] = useState<string>('');
  const [validFrom, setValidFrom] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterCommittee, setFilterCommittee] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Dr. Rajesh Kumar',
          email: 'rajesh.kumar@college.edu',
          department: 'Computer Science & Engineering',
          roles: ['faculty', 'hod'],
          status: 'active'
        },
        {
          id: '2',
          name: 'Prof. Priya Sharma',
          email: 'priya.sharma@college.edu',
          department: 'Information Technology',
          roles: ['faculty'],
          status: 'active'
        },
        {
          id: '3',
          name: 'Dr. Neha Gupta',
          email: 'neha.gupta@college.edu',
          department: 'Computer Science & Engineering',
          roles: ['faculty'],
          status: 'active'
        },
        {
          id: '4',
          name: 'Ms. Sneha Joshi',
          email: 'sneha.joshi@college.edu',
          department: 'Library Science',
          roles: ['staff'],
          status: 'active'
        }
      ];

      const mockRoles: Role[] = [
        {
          id: 'role_tpo_convener',
          name: 'TPO Convener',
          code: 'tpo_convener',
          description: 'Training & Placement Office Convener',
          permissions: ['placement_management', 'company_coordination'],
          isSystemRole: false,
          isCommitteeRole: true,
          committeeId: 'comm_tpo',
          committeeCode: 'TPO'
        },
        {
          id: 'role_ssip_convener',
          name: 'SSIP Convener',
          code: 'ssip_convener',
          description: 'Student Startup & Innovation Policy Convener',
          permissions: ['innovation_management', 'funding_approval'],
          isSystemRole: false,
          isCommitteeRole: true,
          committeeId: 'comm_ssip',
          committeeCode: 'SSIP'
        },
        {
          id: 'role_library_convener',
          name: 'Library Convener',
          code: 'library_convener',
          description: 'Library Committee Convener',
          permissions: ['library_management', 'resource_allocation'],
          isSystemRole: false,
          isCommitteeRole: true,
          committeeId: 'comm_library',
          committeeCode: 'LIBRARY'
        },
        {
          id: 'role_it_convener',
          name: 'IT/CWAN Convener',
          code: 'it_cwan_convener',
          description: 'IT & Computer Network Administration Convener',
          permissions: ['infrastructure_management', 'security_oversight'],
          isSystemRole: false,
          isCommitteeRole: true,
          committeeId: 'comm_it_cwan',
          committeeCode: 'IT_CWAN'
        }
      ];

      const mockCommittees: Committee[] = [
        { id: 'comm_tpo', name: 'Training & Placement Office', code: 'TPO', description: 'Manages placement activities', status: 'active' },
        { id: 'comm_ssip', name: 'Student Startup & Innovation Policy', code: 'SSIP', description: 'Oversees innovation projects', status: 'active' },
        { id: 'comm_library', name: 'Library Committee', code: 'LIBRARY', description: 'Manages library resources', status: 'active' },
        { id: 'comm_it_cwan', name: 'IT & Computer Network Administration', code: 'IT_CWAN', description: 'Manages IT infrastructure', status: 'active' }
      ];

      const mockAssignments: RoleAssignment[] = [
        {
          id: '1',
          userId: '1',
          userName: 'Dr. Rajesh Kumar',
          userEmail: 'rajesh.kumar@college.edu',
          userDepartment: 'Computer Science & Engineering',
          roleId: 'role_tpo_convener',
          roleName: 'TPO Convener',
          roleCode: 'tpo_convener',
          committeeId: 'comm_tpo',
          committeeName: 'Training & Placement Office',
          assignedAt: new Date('2024-01-15'),
          assignedBy: 'System Administrator',
          status: 'active',
          validFrom: new Date('2024-01-15'),
          validUntil: new Date('2025-01-15')
        },
        {
          id: '2',
          userId: '3',
          userName: 'Dr. Neha Gupta',
          userEmail: 'neha.gupta@college.edu',
          userDepartment: 'Computer Science & Engineering',
          roleId: 'role_ssip_convener',
          roleName: 'SSIP Convener',
          roleCode: 'ssip_convener',
          committeeId: 'comm_ssip',
          committeeName: 'Student Startup & Innovation Policy',
          assignedAt: new Date('2024-02-01'),
          assignedBy: 'System Administrator',
          status: 'active',
          validFrom: new Date('2024-02-01'),
          validUntil: new Date('2025-02-01')
        }
      ];

      setUsers(mockUsers);
      setRoles(mockRoles);
      setCommittees(mockCommittees);
      setAssignments(mockAssignments);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load role assignment data." });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole || !validFrom) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fill in all required fields." });
      return;
    }

    try {
      const user = users.find(u => u.id === selectedUser);
      const role = roles.find(r => r.id === selectedRole);
      const committee = committees.find(c => c.id === selectedCommittee);

      const newAssignment: RoleAssignment = {
        id: `assignment_${Date.now()}`,
        userId: selectedUser,
        userName: user?.name || '',
        userEmail: user?.email || '',
        userDepartment: user?.department || '',
        roleId: selectedRole,
        roleName: role?.name || '',
        roleCode: role?.code || '',
        committeeId: selectedCommittee || undefined,
        committeeName: committee?.name || undefined,
        assignedAt: new Date(),
        assignedBy: 'Current Admin',
        status: 'active',
        validFrom: new Date(validFrom),
        validUntil: validUntil ? new Date(validUntil) : undefined
      };

      setAssignments(prev => [...prev, newAssignment]);
      setIsDialogOpen(false);
      
      // Reset form
      setSelectedUser('');
      setSelectedRole('');
      setSelectedCommittee('');
      setValidFrom('');
      setValidUntil('');

      toast({ title: "Role Assigned", description: `Successfully assigned ${role?.name} to ${user?.name}` });

    } catch (error) {
      toast({ variant: "destructive", title: "Assignment Failed", description: "Could not assign role." });
    }
  };

  const handleRevokeAssignment = async (assignmentId: string) => {
    try {
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === assignmentId 
            ? { ...assignment, status: 'revoked' as const }
            : assignment
        )
      );
      
      toast({ title: "Assignment Revoked", description: "Role assignment has been revoked." });
    } catch (error) {
      toast({ variant: "destructive", title: "Revoke Failed", description: "Could not revoke assignment." });
    }
  };

  const getStatusColor = (status: RoleAssignment['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'revoked': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.roleName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || assignment.roleId === filterRole;
    const matchesCommittee = filterCommittee === 'all' || assignment.committeeId === filterCommittee;
    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesCommittee && matchesStatus;
  });

  const committeeRoles = roles.filter(role => role.isCommitteeRole);
  const selectedRoleObj = roles.find(r => r.id === selectedRole);
  const requiresCommittee = selectedRoleObj?.isCommitteeRole;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mx-auto mb-4" />
          <p>Loading Role Assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6 sm:h-8 sm:w-8" />
            Role Assignment Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Assign and manage user roles across committees and departments
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Assign Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Assign Role to User</DialogTitle>
              <DialogDescription>
                Select a user and role to create a new assignment
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="user">Select User *</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.status === 'active').map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span>{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email} • {user.department}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role">Select Role *</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex flex-col">
                          <span>{role.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {role.description} {role.isCommitteeRole ? `• Committee: ${role.committeeCode}` : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {requiresCommittee && (
                <div>
                  <Label htmlFor="committee">Select Committee *</Label>
                  <Select value={selectedCommittee} onValueChange={setSelectedCommittee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a committee" />
                    </SelectTrigger>
                    <SelectContent>
                      {committees.filter(c => c.status === 'active').map((committee) => (
                        <SelectItem key={committee.id} value={committee.id}>
                          <div className="flex flex-col">
                            <span>{committee.name}</span>
                            <span className="text-xs text-muted-foreground">{committee.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validFrom">Valid From *</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="validUntil">Valid Until (Optional)</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignRole}>
                Assign Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">Role Assignments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users, roles, or emails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterCommittee} onValueChange={setFilterCommittee}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Committees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Committees</SelectItem>
                      {committees.map((committee) => (
                        <SelectItem key={committee.id} value={committee.id}>{committee.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="revoked">Revoked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Role Assignments ({filteredAssignments.length})</CardTitle>
              <CardDescription>Current role assignments across all committees</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Committee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Period</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.userName}</div>
                          <div className="text-sm text-muted-foreground">{assignment.userEmail}</div>
                          <div className="text-xs text-muted-foreground">{assignment.userDepartment}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.roleName}</div>
                          <div className="text-xs text-muted-foreground">{assignment.roleCode}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignment.committeeName || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>From: {assignment.validFrom.toLocaleDateString()}</div>
                          {assignment.validUntil && (
                            <div>Until: {assignment.validUntil.toLocaleDateString()}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {assignment.status === 'active' && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleRevokeAssignment(assignment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAssignments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-muted-foreground">
                          No role assignments found matching your criteria.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Total Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{assignments.length}</div>
                <div className="text-sm text-muted-foreground">
                  {assignments.filter(a => a.status === 'active').length} active
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Committee Roles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{committeeRoles.length}</div>
                <div className="text-sm text-muted-foreground">
                  Available committee positions
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Assignment Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {((assignments.filter(a => a.status === 'active').length / committees.length) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Committees with assigned conveners
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoleAssignmentPage;