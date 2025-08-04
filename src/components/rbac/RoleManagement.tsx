'use client';

/**
 * Role Management Component - RBAC role administration interface
 * Provides comprehensive role management with permissions and inheritance
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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
  UserCheck, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Shield, 
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Users,
  Key,
  Clock,
  TrendingUp,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

// Types
import type { UserRole } from '@/types/entities';
import type { RoleWithRBAC } from '@/lib/auth/rbac-extensions';

interface RoleManagementProps {
  currentUser: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
  };
}

interface RoleListItem extends Partial<RoleWithRBAC> {
  _id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RoleFilters {
  search: string;
  riskLevel: string;
  requiresApproval: string;
  systemRole: string;
}

const AVAILABLE_PERMISSIONS = [
  'users.view', 'users.create', 'users.edit', 'users.delete',
  'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
  'permissions.view', 'permissions.create', 'permissions.edit', 'permissions.delete',
  'reports.view', 'reports.create', 'reports.export',
  'system.admin', 'system.settings', 'system.audit',
  'rbac.users.view', 'rbac.users.manage', 'rbac.roles.view', 'rbac.roles.manage',
  'rbac.permissions.view', 'rbac.permissions.manage', 'rbac.security.view', 'rbac.analytics.view'
];

export function RoleManagement({ currentUser }: RoleManagementProps) {
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleListItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState<RoleFilters>({
    search: '',
    riskLevel: 'all',
    requiresApproval: 'all',
    systemRole: 'all'
  });

  // Load roles on component mount
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/rbac/roles');
      if (!response.ok) throw new Error('Failed to load roles');
      
      const data = await response.json();
      setRoles(data.roles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
      console.error('Roles loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Permission checks
  const canManageRoles = currentUser.permissions.includes('rbac.roles.manage') || 
                        currentUser.role === 'super_admin';
  const canViewRoleDetails = currentUser.permissions.includes('rbac.roles.view') || 
                            currentUser.role === 'super_admin';
  const canEditRoles = currentUser.permissions.includes('rbac.roles.edit') || 
                      currentUser.role === 'super_admin';

  // Filter roles based on current filters
  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const matchesSearch = filters.search === '' || 
        role.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        role.code.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesRiskLevel = filters.riskLevel === 'all' || 
        role.rbac?.properties?.riskProfile?.riskLevel === filters.riskLevel;
      
      const matchesApproval = filters.requiresApproval === 'all' ||
        (filters.requiresApproval === 'required' && role.rbac?.properties?.assignment?.requiresApproval) ||
        (filters.requiresApproval === 'not_required' && !role.rbac?.properties?.assignment?.requiresApproval);
      
      const matchesSystemRole = filters.systemRole === 'all' ||
        (filters.systemRole === 'system' && role.isSystemRole) ||
        (filters.systemRole === 'custom' && !role.isSystemRole);

      return matchesSearch && matchesRiskLevel && matchesApproval && matchesSystemRole;
    });
  }, [roles, filters]);

  const handleRoleAction = async (action: string, roleId: string) => {
    try {
      const response = await fetch(`/api/rbac/roles/${roleId}/${action}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error(`Failed to ${action} role`);
      
      await loadRoles(); // Reload roles after action
    } catch (err) {
      console.error(`Role ${action} error:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${action} role`);
    }
  };

  const getRiskLevelBadge = (level?: string) => {
    const variants = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive',
      critical: 'destructive'
    } as const;

    const icons = {
      low: CheckCircle,
      medium: AlertCircle,
      high: AlertTriangle,
      critical: XCircle
    };

    const Icon = icons[level as keyof typeof icons] || CheckCircle;

    return (
      <Badge variant={variants[level as keyof typeof variants] || 'default'} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {level || 'Unknown'}
      </Badge>
    );
  };

  const getApprovalBadge = (requiresApproval?: boolean) => {
    return requiresApproval ? (
      <Badge variant="secondary" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Required
      </Badge>
    ) : (
      <Badge variant="outline">Not Required</Badge>
    );
  };

  if (loading) {
    return <RoleManagementSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserCheck className="h-6 w-6" />
            Role Management
          </h2>
          <p className="text-muted-foreground">
            Manage user roles, permissions, and access control policies
          </p>
        </div>

        {canManageRoles && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
              <RoleFormDialog 
                role={selectedRole}
                onSave={() => {
                  setIsDialogOpen(false);
                  setSelectedRole(null);
                  loadRoles();
                }}
                onClose={() => {
                  setIsDialogOpen(false);
                  setSelectedRole(null);
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

      {/* Role Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">
              {roles.filter(r => r.isSystemRole).length} system, {roles.filter(r => !r.isSystemRole).length} custom
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Roles</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.filter(r => ['high', 'critical'].includes(r.rbac?.properties?.riskProfile?.riskLevel || '')).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require enhanced monitoring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Required</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.filter(r => r.rbac?.properties?.assignment?.requiresApproval).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Roles requiring approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.reduce((sum, role) => sum + (role.rbac?.analytics?.usage?.activeUsers || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all roles
            </p>
          </CardContent>
        </Card>
      </div>

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
                  placeholder="Search roles..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="risk">Risk Level</Label>
              <Select value={filters.riskLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, riskLevel: value }))}>
                <SelectTrigger id="risk">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="approval">Approval Required</Label>
              <Select value={filters.requiresApproval} onValueChange={(value) => setFilters(prev => ({ ...prev, requiresApproval: value }))}>
                <SelectTrigger id="approval">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="required">Required</SelectItem>
                  <SelectItem value="not_required">Not Required</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="system">Role Type</Label>
              <Select value={filters.systemRole} onValueChange={(value) => setFilters(prev => ({ ...prev, systemRole: value }))}>
                <SelectTrigger id="system">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Roles ({filteredRoles.length})</span>
            <Badge variant="outline">{filteredRoles.length} of {roles.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{role.name}</div>
                        <div className="text-sm text-muted-foreground">{role.code}</div>
                        {role.description && (
                          <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                            {role.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.isSystemRole ? 'default' : 'secondary'}>
                        {role.isSystemRole ? 'System' : 'Custom'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getRiskLevelBadge(role.rbac?.properties?.riskProfile?.riskLevel)}
                    </TableCell>
                    <TableCell>
                      {getApprovalBadge(role.rbac?.properties?.assignment?.requiresApproval)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-sm">
                          <div className="font-medium">
                            {role.rbac?.analytics?.usage?.totalUsers || 0}
                          </div>
                          <div className="text-muted-foreground">
                            {role.rbac?.analytics?.usage?.activeUsers || 0} active
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Key className="h-3 w-3" />
                          {role.permissions?.length || 0}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canViewRoleDetails && (
                            <DropdownMenuItem onClick={() => setSelectedRole(role)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          
                          {canEditRoles && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedRole(role);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Role
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => handleRoleAction('duplicate', role._id)}>
                                <Settings className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              
                              {!role.isSystemRole && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleRoleAction('delete', role._id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredRoles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No roles found matching the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Role Form Dialog Component
function RoleFormDialog({ 
  role, 
  onSave, 
  onClose 
}: { 
  role: RoleListItem | null; 
  onSave: () => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    code: role?.code || '',
    description: role?.description || '',
    permissions: role?.permissions || [],
    requiresApproval: role?.rbac?.properties?.assignment?.requiresApproval || false,
    riskLevel: role?.rbac?.properties?.riskProfile?.riskLevel || 'low',
    maxUsers: role?.rbac?.properties?.assignment?.maxUsers || -1,
    canInherit: role?.rbac?.properties?.inheritance?.canInherit || true,
    canDelegate: role?.rbac?.properties?.inheritance?.canDelegate || false
  });

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = role ? `/api/rbac/roles/${role._id}` : '/api/rbac/roles';
      const method = role ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save role');
      
      onSave();
    } catch (error) {
      console.error('Save role error:', error);
    }
  };

  const permissionCategories = {
    'User Management': AVAILABLE_PERMISSIONS.filter(p => p.startsWith('users.')),
    'Role Management': AVAILABLE_PERMISSIONS.filter(p => p.startsWith('roles.')),
    'Permission Management': AVAILABLE_PERMISSIONS.filter(p => p.startsWith('permissions.')),
    'System Management': AVAILABLE_PERMISSIONS.filter(p => p.startsWith('system.')),
    'RBAC Management': AVAILABLE_PERMISSIONS.filter(p => p.startsWith('rbac.')),
    'Reporting': AVAILABLE_PERMISSIONS.filter(p => p.startsWith('reports.'))
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{role ? 'Edit Role' : 'Create New Role'}</DialogTitle>
        <DialogDescription>
          {role ? 'Update role configuration and permissions.' : 'Create a new role with specific permissions.'}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Department Manager"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="code">Role Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
              placeholder="e.g., dept_manager"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the role's purpose and responsibilities..."
          />
        </div>

        {/* Role Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="riskLevel">Risk Level</Label>
            <Select value={formData.riskLevel} onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setFormData(prev => ({ ...prev, riskLevel: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="maxUsers">Max Users (-1 for unlimited)</Label>
            <Input
              id="maxUsers"
              type="number"
              value={formData.maxUsers}
              onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) || -1 }))}
              min="-1"
            />
          </div>
        </div>

        {/* Role Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Requires Approval</Label>
              <p className="text-sm text-muted-foreground">
                Role assignments require administrator approval
              </p>
            </div>
            <Switch
              checked={formData.requiresApproval}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresApproval: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Can Inherit</Label>
              <p className="text-sm text-muted-foreground">
                Role can inherit permissions from parent roles
              </p>
            </div>
            <Switch
              checked={formData.canInherit}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canInherit: checked as true }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Can Delegate</Label>
              <p className="text-sm text-muted-foreground">
                Role holders can delegate permissions to others
              </p>
            </div>
            <Switch
              checked={formData.canDelegate}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canDelegate: checked }))}
            />
          </div>
        </div>

        {/* Permissions */}
        <div>
          <Label>Permissions</Label>
          <div className="mt-2 space-y-4 max-h-60 overflow-y-auto border rounded-md p-4">
            {Object.entries(permissionCategories).map(([category, permissions]) => (
              <div key={category}>
                <h4 className="font-medium text-sm mb-2">{category}</h4>
                <div className="grid grid-cols-2 gap-2 ml-4">
                  {permissions.map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission}
                        checked={formData.permissions.includes(permission)}
                        onCheckedChange={(checked) => handlePermissionChange(permission, !!checked)}
                      />
                      <Label htmlFor={permission} className="text-sm">
                        {permission}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Selected {formData.permissions.length} of {AVAILABLE_PERMISSIONS.length} permissions
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {role ? 'Update Role' : 'Create Role'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

// Loading Skeleton
function RoleManagementSkeleton() {
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

export default RoleManagement;