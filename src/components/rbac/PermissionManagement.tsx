'use client';

/**
 * Permission Management Component - RBAC permission administration interface
 * Provides comprehensive permission management with inheritance and delegation
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Key, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Shield, 
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Users,
  Clock,
  TrendingUp,
  GitBranch,
  Share2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';

// Types
import type { UserRole } from '@/types/entities';
import type { IPermissionNode, IPermissionInheritance } from '@/lib/auth/rbac-models';

interface PermissionManagementProps {
  currentUser: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
  };
}

interface PermissionNodeItem extends IPermissionNode {
  _id: string;
  userCount?: number;
  roleCount?: number;
  lastUsed?: Date;
}

interface PermissionInheritanceItem extends IPermissionInheritance {
  _id: string;
  parentName?: string;
  childName?: string;
}

interface PermissionFilters {
  search: string;
  type: string;
  isActive: string;
  hasInheritance: string;
}

export function PermissionManagement({ currentUser }: PermissionManagementProps) {
  const [activeTab, setActiveTab] = useState('permissions');
  const [permissions, setPermissions] = useState<PermissionNodeItem[]>([]);
  const [inheritanceRules, setInheritanceRules] = useState<PermissionInheritanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<PermissionNodeItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState<PermissionFilters>({
    search: '',
    type: 'all',
    isActive: 'all',
    hasInheritance: 'all'
  });

  // Load data on component mount
  useEffect(() => {
    loadPermissions();
    loadInheritanceRules();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/rbac/permissions');
      if (!response.ok) throw new Error('Failed to load permissions');
      
      const data = await response.json();
      setPermissions(data.permissions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
      console.error('Permissions loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadInheritanceRules = async () => {
    try {
      const response = await fetch('/api/rbac/permissions/inheritance');
      if (!response.ok) throw new Error('Failed to load inheritance rules');
      
      const data = await response.json();
      setInheritanceRules(data.rules || []);
    } catch (err) {
      console.error('Inheritance rules loading error:', err);
    }
  };

  // Permission checks
  const canManagePermissions = currentUser.permissions.includes('rbac.permissions.manage') || 
                              currentUser.role === 'super_admin';
  const canViewPermissionDetails = currentUser.permissions.includes('rbac.permissions.view') || 
                                  currentUser.role === 'super_admin';
  const canEditPermissions = currentUser.permissions.includes('rbac.permissions.edit') || 
                            currentUser.role === 'super_admin';

  // Filter permissions based on current filters
  const filteredPermissions = useMemo(() => {
    return permissions.filter(permission => {
      const matchesSearch = filters.search === '' || 
        permission.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        permission.nodeId.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesType = filters.type === 'all' || permission.type === filters.type;
      
      const matchesActive = filters.isActive === 'all' ||
        (filters.isActive === 'active' && permission.isActive) ||
        (filters.isActive === 'inactive' && !permission.isActive);
      
      const matchesInheritance = filters.hasInheritance === 'all' ||
        (filters.hasInheritance === 'yes' && permission.inheritanceRules?.canInherit) ||
        (filters.hasInheritance === 'no' && !permission.inheritanceRules?.canInherit);

      return matchesSearch && matchesType && matchesActive && matchesInheritance;
    });
  }, [permissions, filters]);

  const handlePermissionAction = async (action: string, permissionId: string) => {
    try {
      const response = await fetch(`/api/rbac/permissions/${permissionId}/${action}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error(`Failed to ${action} permission`);
      
      await loadPermissions(); // Reload permissions after action
    } catch (err) {
      console.error(`Permission ${action} error:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${action} permission`);
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      role: 'default',
      user: 'secondary',
      resource: 'outline',
      department: 'destructive'
    } as const;

    const colors = {
      role: 'bg-blue-50 text-blue-700 border-blue-200',
      user: 'bg-green-50 text-green-700 border-green-200',
      resource: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      department: 'bg-purple-50 text-purple-700 border-purple-200'
    };

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'default'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getInheritanceBadge = (canInherit?: boolean, canDelegate?: boolean) => {
    if (canInherit && canDelegate) {
      return (
        <div className="flex gap-1">
          <Badge variant="default" className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            Inherit
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Share2 className="h-3 w-3" />
            Delegate
          </Badge>
        </div>
      );
    } else if (canInherit) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          Inherit
        </Badge>
      );
    } else if (canDelegate) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Share2 className="h-3 w-3" />
          Delegate
        </Badge>
      );
    }
    return <Badge variant="outline">None</Badge>;
  };

  if (loading) {
    return <PermissionManagementSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Key className="h-6 w-6" />
            Permission Management
          </h2>
          <p className="text-muted-foreground">
            Manage permissions, inheritance rules, and access policies
          </p>
        </div>

        {canManagePermissions && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Permission
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <PermissionFormDialog 
                permission={selectedPermission}
                onSave={() => {
                  setIsDialogOpen(false);
                  setSelectedPermission(null);
                  loadPermissions();
                }}
                onClose={() => {
                  setIsDialogOpen(false);
                  setSelectedPermission(null);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Permission Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissions.length}</div>
            <p className="text-xs text-muted-foreground">
              {permissions.filter(p => p.isActive).length} active, {permissions.filter(p => !p.isActive).length} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inheritance Rules</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inheritanceRules.length}</div>
            <p className="text-xs text-muted-foreground">
              {inheritanceRules.filter(r => r.isActive).length} active rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permission Types</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(permissions.map(p => p.type)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Distinct permission types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {permissions.reduce((sum, p) => sum + (p.userCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total user assignments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="inheritance" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Inheritance
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search permissions..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="role">Role</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="resource">Resource</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="active">Status</Label>
                  <Select value={filters.isActive} onValueChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}>
                    <SelectTrigger id="active">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="inheritance">Inheritance</Label>
                  <Select value={filters.hasInheritance} onValueChange={(value) => setFilters(prev => ({ ...prev, hasInheritance: value }))}>
                    <SelectTrigger id="inheritance">
                      <SelectValue placeholder="All permissions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All permissions</SelectItem>
                      <SelectItem value="yes">Can inherit</SelectItem>
                      <SelectItem value="no">Cannot inherit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Permissions ({filteredPermissions.length})</span>
                <Badge variant="outline">{filteredPermissions.length} of {permissions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Inheritance</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPermissions.map((permission) => (
                      <TableRow key={permission._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{permission.name}</div>
                            <div className="text-sm text-muted-foreground">{permission.nodeId}</div>
                            {permission.description && (
                              <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                                {permission.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(permission.type)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={permission.isActive ? 'default' : 'secondary'}>
                            {permission.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getInheritanceBadge(
                            permission.inheritanceRules?.canInherit,
                            permission.inheritanceRules?.canDelegate
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="text-sm">
                              <div className="font-medium">
                                {permission.userCount || 0} users
                              </div>
                              <div className="text-muted-foreground">
                                {permission.roleCount || 0} roles
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {permission.lastUsed ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              {new Date(permission.lastUsed).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canViewPermissionDetails && (
                                <DropdownMenuItem onClick={() => setSelectedPermission(permission)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                              )}
                              
                              {canEditPermissions && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedPermission(permission);
                                      setIsDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Permission
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem 
                                    onClick={() => handlePermissionAction(permission.isActive ? 'deactivate' : 'activate', permission._id)}
                                  >
                                    {permission.isActive ? (
                                      <>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem 
                                    onClick={() => handlePermissionAction('delete', permission._id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {filteredPermissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No permissions found matching the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inheritance Tab */}
        <TabsContent value="inheritance" className="space-y-4">
          <InheritanceRulesView rules={inheritanceRules} onUpdate={loadInheritanceRules} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <PermissionAnalyticsView permissions={permissions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Permission Form Dialog Component
function PermissionFormDialog({ 
  permission, 
  onSave, 
  onClose 
}: { 
  permission: PermissionNodeItem | null; 
  onSave: () => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: permission?.name || '',
    nodeId: permission?.nodeId || '',
    type: permission?.type || 'role',
    description: permission?.description || '',
    permissions: permission?.permissions || [],
    isActive: permission?.isActive ?? true,
    canInherit: permission?.inheritanceRules?.canInherit ?? true,
    canDelegate: permission?.inheritanceRules?.canDelegate ?? false,
    inheritanceLevel: permission?.inheritanceRules?.inheritanceLevel || 0,
    excludedPermissions: permission?.inheritanceRules?.excludedPermissions || []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = permission ? `/api/rbac/permissions/${permission._id}` : '/api/rbac/permissions';
      const method = permission ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save permission');
      
      onSave();
    } catch (error) {
      console.error('Save permission error:', error);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{permission ? 'Edit Permission' : 'Create New Permission'}</DialogTitle>
        <DialogDescription>
          {permission ? 'Update permission configuration.' : 'Create a new permission node.'}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Permission Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., User Management"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="nodeId">Node ID</Label>
            <Input
              id="nodeId"
              value={formData.nodeId}
              onChange={(e) => setFormData(prev => ({ ...prev, nodeId: e.target.value }))}
              placeholder="e.g., user_management"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="role">Role</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="resource">Resource</SelectItem>
              <SelectItem value="department">Department</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the permission's purpose..."
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active</Label>
              <p className="text-sm text-muted-foreground">
                Permission is active and can be used
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Can Inherit</Label>
              <p className="text-sm text-muted-foreground">
                Permission can be inherited from parent nodes
              </p>
            </div>
            <Switch
              checked={formData.canInherit}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canInherit: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Can Delegate</Label>
              <p className="text-sm text-muted-foreground">
                Permission can be delegated to other nodes
              </p>
            </div>
            <Switch
              checked={formData.canDelegate}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canDelegate: checked }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {permission ? 'Update Permission' : 'Create Permission'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

// Inheritance Rules View Component
function InheritanceRulesView({ 
  rules, 
  onUpdate 
}: { 
  rules: PermissionInheritanceItem[]; 
  onUpdate: () => void; 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inheritance Rules</CardTitle>
        <CardDescription>
          Manage permission inheritance relationships between nodes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parent</TableHead>
                <TableHead>Child</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule._id}>
                  <TableCell>
                    <div className="font-medium">{rule.parentName || rule.parentId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{rule.childName || rule.childId}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.relationshipType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {rule.inheritedPermissions.length} permissions
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No inheritance rules configured.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Permission Analytics View Component
function PermissionAnalyticsView({ 
  permissions 
}: { 
  permissions: PermissionNodeItem[]; 
}) {
  const stats = useMemo(() => {
    const byType = permissions.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsed = permissions
      .sort((a, b) => (b.userCount || 0) - (a.userCount || 0))
      .slice(0, 5);

    const leastUsed = permissions
      .filter(p => p.isActive)
      .sort((a, b) => (a.userCount || 0) - (b.userCount || 0))
      .slice(0, 5);

    return { byType, mostUsed, leastUsed };
  }, [permissions]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Permission Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTypeBadge(type)}
                  <span className="capitalize">{type}</span>
                </div>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most Used Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.mostUsed.map((permission) => (
              <div key={permission._id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{permission.name}</div>
                  <div className="text-xs text-muted-foreground">{permission.nodeId}</div>
                </div>
                <Badge variant="default">{permission.userCount || 0}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading Skeleton
function PermissionManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-16" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getTypeBadge(type: string) {
  const variants = {
    role: 'default',
    user: 'secondary',
    resource: 'outline',
    department: 'destructive'
  } as const;

  return (
    <Badge variant={variants[type as keyof typeof variants] || 'default'}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

export default PermissionManagement;