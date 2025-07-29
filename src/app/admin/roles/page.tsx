"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, Edit, Trash2, UserCog, Loader2, UploadCloud, Download, FileSpreadsheet, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Role } from '@/types/entities';
import { roleService, allPermissions } from '@/lib/api/roles';

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Partial<Role> | null>(null);
  const [viewRole, setViewRole] = useState<Role | null>(null);
  const [formRoleName, setFormRoleName] = useState('');
  const [formRoleCode, setFormRoleCode] = useState(''); // Added for code
  const [formRoleDescription, setFormRoleDescription] = useState('');
  const [formRolePermissions, setFormRolePermissions] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await roleService.getAllRoles();
      setRoles(data);
    } catch (error) {
      console.error("Failed to load roles", error);
      toast({ variant: "destructive", title: "Error", description: (error as Error).message || "Could not load roles." });
    }
    setIsLoading(false);
  }, [toast]);

 useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return roles.slice(startIndex, startIndex + itemsPerPage);
  }, [roles, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(roles.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);


  const handleView = (role: Role) => {
    setViewRole(role);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setCurrentRole(role);
    setFormRoleName(role.name);
    setFormRoleCode(role.code); // Set code for editing
    setFormRoleDescription(role.description || '');
    setFormRolePermissions([...role.permissions]);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setCurrentRole(null);
    setFormRoleName('');
    setFormRoleCode(''); // Clear code for new role
    setFormRoleDescription('');
    setFormRolePermissions([]);
    setIsDialogOpen(true);
  };

  const handleDelete = async (roleId: string) => {
    setIsSubmitting(true);
    try {
      await roleService.deleteRole(roleId);
      await fetchRoles();
      setSelectedRoleIds(prev => prev.filter(id => id !== roleId));
      toast({ title: "Role Deleted", description: "The role has been successfully deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete role." });
    }
    setIsSubmitting(false);
  };

  const handlePermissionChange = (permission: string) => {
    setFormRolePermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission) 
        : [...prev, permission]
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formRoleName.trim() || !formRoleCode.trim()) { // Check for code
      toast({ variant: "destructive", title: "Validation Error", description: "Role name and code cannot be empty."});
      return;
    }
    setIsSubmitting(true);
    
    const roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt' > = { 
      name: formRoleName.trim(), 
      code: formRoleCode.trim().toLowerCase(), // Send lowercase code
      description: formRoleDescription.trim() || '', 
      permissions: formRolePermissions,
      isSystemRole: currentRole?.isSystemRole || false,
      isCommitteeRole: currentRole?.isCommitteeRole || false,
      committeeId: currentRole?.committeeId || undefined,
      committeeCode: currentRole?.committeeCode || undefined,
    };
    
    try {
      if (currentRole && currentRole.id) {
        const updateData = {name: roleData.name, description: roleData.description, permissions: roleData.permissions};
        await roleService.updateRole(currentRole.id, updateData);
        toast({ title: "Role Updated", description: "The role has been successfully updated." });
      } else {
        await roleService.createRole(roleData); 
        toast({ title: "Role Created", description: "The new role has been successfully created." });
      }
      await fetchRoles();
      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message || "Could not save role." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleImportRoles = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await roleService.importRoles(selectedFile);
      await fetchRoles();
      toast({ title: "Import Successful", description: `${result.newCount} roles added, ${result.updatedCount} roles updated. Skipped: ${result.skippedCount}` });
    } catch (error: unknown) {
      console.error("Error processing CSV file:", error);
      toast({ variant: "destructive", title: "Import Failed", description: (error as Error).message || "Could not process the CSV file." });
    } finally {
      setIsSubmitting(false);
      setSelectedFile(null); 
      const fileInput = document.getElementById('csvImport') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleExportRoles = () => {
    if (roles.length === 0) {
      toast({ title: "Export Canceled", description: "No roles to export." });
      return;
    }
    const header = ["id", "name", "code", "description", "permissions", "isSystemRole", "isCommitteeRole", "committeeId", "committeeCode"]; // Added code
    const csvRows = [
      header.join(','),
      ...roles.map(role => [
        role.id,
        `"${role.name.replace(/"/g, '""')}"`, 
        role.code, // Export code
        `"${(role.description || "").replace(/"/g, '""')}"`, 
        `"${role.permissions.join(';')}"`,
        role.isSystemRole || false,
        role.isCommitteeRole || false,
        role.committeeId || '',
        role.committeeCode || ''
      ].join(','))
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "roles_export.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Export Successful", description: "Roles exported to roles_export.csv" });
    } else {
       toast({ variant: "destructive", title: "Export Failed", description: "Your browser does not support this feature." });
    }
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,name,code,description,permissions,isSystemRole,isCommitteeRole,committeeId,committeeCode
role_001,Editor,editor,"Can edit content but not publish","manage_content;view_content",false,false,,
role_002,Viewer,viewer,"Can only view published content","view_content",false,false,,
,Moderator,moderator,"Can moderate comments and user interactions","moderate_comments;manage_users_basic",false,false,,
`; 
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_roles_import.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_roles_import.csv downloaded." });
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedRoleIds(paginatedRoles.map(role => role.id));
    } else {
      setSelectedRoleIds([]);
    }
  };

  const handleSelectRole = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoleIds(prev => [...prev, roleId]);
    } else {
      setSelectedRoleIds(prev => prev.filter(id => id !== roleId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRoleIds.length === 0) {
      toast({ variant: "destructive", title: "No Roles Selected", description: "Please select roles to delete." });
      return;
    }
    setIsSubmitting(true);
    let deletedCount = 0;
    let adminSkipped = false;

    for (const id of selectedRoleIds) {
      const role = roles.find(r => r.id === id);
      if (role?.code === 'admin' || role?.code === 'super_admin') { // Check by code
        adminSkipped = true;
        continue;
      }
      if (role?.isSystemRole && !role.isCommitteeRole) { // Protect non-committee system roles
        toast({ variant: "warning", title: "System Role Protected", description: `The system role '${role.name}' cannot be deleted.` });
        continue;
      }
      try {
        await roleService.deleteRole(id);
        deletedCount++;
      } catch {
        toast({ variant: "destructive", title: "Delete Failed", description: `Could not delete role ${role?.name || id}.` });
      }
    }
    
    await fetchRoles();
    setSelectedRoleIds([]);
    const description = `${deletedCount} role(s) have been successfully deleted.`;
    if (adminSkipped) {
        toast({ variant: "warning", title: "Admin Role Protected", description: "The 'admin' or 'super_admin' role cannot be deleted." });
    }
    if(deletedCount > 0) {
        toast({ title: "Roles Deleted", description });
    }
    setIsSubmitting(false);
  };

  const isAllSelectedOnPage = paginatedRoles.length > 0 && paginatedRoles.every(role => selectedRoleIds.includes(role.id));
  const isSomeSelectedOnPage = paginatedRoles.some(role => selectedRoleIds.includes(role.id)) && !isAllSelectedOnPage;


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <UserCog className="h-6 w-6" />
              Role Management
            </CardTitle>
            <CardDescription>
              Manage user roles and their permissions within the system.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Role
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>{currentRole ? "Edit Role" : "Add New Role"}</DialogTitle>
                  <DialogDescription>
                    {currentRole ? "Modify the details of this role." : "Create a new role and assign permissions."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="roleName">Role Name *</Label>
                    <Input 
                      id="roleName" 
                      value={formRoleName} 
                      onChange={(e) => setFormRoleName(e.target.value)} 
                      placeholder="e.g., Content Editor" 
                      disabled={isSubmitting || (currentRole?.isSystemRole && !currentRole.isCommitteeRole && currentRole.code !== 'admin' && currentRole.code !== 'super_admin') || false}
                    />
                  </div>
                  <div>
                    <Label htmlFor="roleCode">Role Code * (lowercase, no spaces, e.g., content_editor)</Label>
                    <Input 
                      id="roleCode" 
                      value={formRoleCode} 
                      onChange={(e) => setFormRoleCode(e.target.value.toLowerCase().replace(/\s+/g, '_'))} 
                      placeholder="e.g., content_editor" 
                      disabled={isSubmitting || !!currentRole?.id} // Code cannot be changed after creation
                    />
                  </div>
                  <div>
                    <Label htmlFor="roleDescription">Description</Label>
                    <Input 
                      id="roleDescription" 
                      value={formRoleDescription} 
                      onChange={(e) => setFormRoleDescription(e.target.value)} 
                      placeholder="Brief description of the role" 
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md dark:border-gray-700">
                      {allPermissions.map(permission => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${permission}`}
                            checked={formRolePermissions.includes(permission)}
                            onCheckedChange={() => handlePermissionChange(permission)}
                            disabled={isSubmitting || (currentRole?.code === 'admin' || currentRole?.code === 'super_admin')} // Admin roles have all perms
                          />
                          <Label htmlFor={`perm-${permission}`} className="text-sm font-normal cursor-pointer">
                            {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isSubmitting}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting || (currentRole?.isSystemRole && !currentRole.isCommitteeRole && currentRole.code !== 'admin' && currentRole.code !== 'super_admin')}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {currentRole ? "Save Changes" : "Create Role"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportRoles} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg dark:border-gray-700">
            <h3 className="text-lg font-medium mb-2 flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Roles from CSV</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImport" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportRoles} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                Import
              </Button>
            </div>
             <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="mt-2 px-0 text-primary">
                <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              CSV format: id (optional, for updates), name, code, description, permissions (semicolon-separated, e.g., &quot;perm_code1;perm_code2&quot;).
            </p>
          </div>

          {selectedRoleIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedRoleIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedRoleIds.length} role(s) selected.
                </span>
            </div>
          )}

          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-3">
            {paginatedRoles.map((role) => {
              const permissionCount = role.permissions.length;
              const displayPermissions = role.permissions.length > 2 
                ? `${role.permissions.slice(0, 2).map(p => p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ')}, +${role.permissions.length - 2} more`
                : role.permissions.map(p => p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ') || 'No permissions';
              
              return (
                <Card key={role.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Checkbox 
                        checked={selectedRoleIds.includes(role.id)} 
                        onCheckedChange={(checked) => handleSelectRole(role.id, !!checked)}
                        disabled={role.code === 'admin' || role.code === 'super_admin' || (role.isSystemRole && !role.isCommitteeRole)}
                        className="flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm leading-tight">{role.name}</h3>
                          {role.isSystemRole && (
                            <span className="text-xs px-1 py-0.5 bg-gray-100 text-gray-700 rounded dark:bg-gray-800 dark:text-gray-300">
                              System
                            </span>
                          )}
                          {role.isCommitteeRole && (
                            <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded dark:bg-blue-900 dark:text-blue-300">
                              Committee {role.committeeCode}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{role.code}</p>
                        {role.description && (
                          <p className="text-xs text-muted-foreground truncate mt-1">{role.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded flex-shrink-0">
                      {permissionCount} perms
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-xs text-muted-foreground">Permissions:</span>
                    <p className="text-xs font-medium">{displayPermissions}</p>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleView(role)} disabled={isSubmitting} className="min-h-[44px] flex-1 text-xs">
                      <Eye className="h-3 w-3" />
                      <span className="ml-1">View</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(role)} disabled={isSubmitting || (role.isSystemRole && !role.isCommitteeRole && role.code !== 'admin' && role.code !== 'super_admin')} className="min-h-[44px] flex-1 text-xs">
                      <Edit className="h-3 w-3" />
                      <span className="ml-1">Edit</span>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(role.id)} 
                      disabled={isSubmitting || role.code === 'admin' || role.code === 'super_admin' || (role.isSystemRole && !role.isCommitteeRole)}
                      className="min-h-[44px] flex-1 text-xs"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="ml-1">Delete</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
            {paginatedRoles.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">
                No roles found. Click "Add New Role" or import a CSV file to create roles.
              </Card>
            )}
          </div>

          {/* Desktop Table View */}
          <Table className="hidden lg:table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                    <Checkbox 
                        checked={isAllSelectedOnPage || (paginatedRoles.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)}
                        onCheckedChange={(checkedState) => handleSelectAll(!!checkedState)}
                        aria-label="Select all roles on this page"
                    />
                </TableHead>
                <TableHead>Role Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRoles.map((role) => (
                <TableRow key={role.id} data-state={selectedRoleIds.includes(role.id) ? "selected" : undefined}>
                  <TableCell>
                      <Checkbox
                        checked={selectedRoleIds.includes(role.id)}
                        onCheckedChange={(checked) => handleSelectRole(role.id, !!checked)}
                        aria-labelledby={`role-name-${role.id}`}
                        disabled={role.code === 'admin' || role.code === 'super_admin' || (role.isSystemRole && !role.isCommitteeRole)}
                       />
                  </TableCell>
                  <TableCell id={`role-name-${role.id}`} className="font-medium">{role.name} {role.isSystemRole && <span className="text-xs text-muted-foreground">(System)</span>} {role.isCommitteeRole && <span className="text-xs text-blue-500">(Committee {role.committeeCode})</span>}</TableCell>
                  <TableCell>{role.code}</TableCell> 
                  <TableCell>{role.description}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {role.permissions.length > 3 ? `${role.permissions.slice(0,3).map(p => p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ')}, ...` : role.permissions.map(p => p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ') || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="icon" onClick={() => handleView(role)} disabled={isSubmitting}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Role</span>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleEdit(role)} disabled={isSubmitting || (role.isSystemRole && !role.isCommitteeRole && role.code !== 'admin' && role.code !== 'super_admin')}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit Role</span>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(role.id)} disabled={isSubmitting || role.code === 'admin' || role.code === 'super_admin' || (role.isSystemRole && !role.isCommitteeRole)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Role</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedRoles.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8"> 
                        No roles found. Click &quot;Add New Role&quot; or import a CSV file to create roles.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedRoles.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, roles.length) : 0} to {Math.min(currentPage * itemsPerPage, roles.length)} of {roles.length} roles.
            </div>
            <div className="flex items-center gap-2">
                 <Select
                    value={String(itemsPerPage)}
                    onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                    }}
                    >
                    <SelectTrigger className="w-[70px] h-8 text-xs">
                        <SelectValue placeholder={String(itemsPerPage)} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {ITEMS_PER_PAGE_OPTIONS.map((pageSize) => (
                        <SelectItem key={pageSize} value={String(pageSize)} className="text-xs">
                            {pageSize}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages > 0 ? totalPages : 1}
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        >
                        <ChevronsLeft className="h-4 w-4" />
                        <span className="sr-only">First page</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous page</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next page</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        >
                        <ChevronsRight className="h-4 w-4" />
                        <span className="sr-only">Last page</span>
                    </Button>
                </div>
            </div>
        </CardFooter>
      </Card>

      {/* View Role Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Role Details</DialogTitle>
            <DialogDescription>
              View detailed information about the role.
            </DialogDescription>
          </DialogHeader>
          {viewRole && (
            <div className="grid gap-6 py-4">
              <div className="grid gap-4">
                <h4 className="font-semibold text-primary border-b pb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Role Name</Label>
                    <p className="text-sm">{viewRole.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Role Code</Label>
                    <p className="text-sm font-mono">{viewRole.code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p className="text-sm">{viewRole.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Role Type</Label>
                    <p className="text-sm">
                      {viewRole.isSystemRole && !viewRole.isCommitteeRole && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          System Role
                        </span>
                      )}
                      {viewRole.isCommitteeRole && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Committee Role ({viewRole.committeeCode})
                        </span>
                      )}
                      {!viewRole.isSystemRole && !viewRole.isCommitteeRole && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                          Custom Role
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <h4 className="font-semibold text-primary border-b pb-2">Permissions ({viewRole.permissions.length})</h4>
                {viewRole.permissions.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                    {viewRole.permissions.map(permission => (
                      <div key={permission} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">
                          {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No permissions assigned to this role.</p>
                )}
              </div>

              {viewRole.isCommitteeRole && (
                <div className="grid gap-4">
                  <h4 className="font-semibold text-primary border-b pb-2">Committee Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Committee ID</Label>
                      <p className="text-sm font-mono">{viewRole.committeeId || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Committee Code</Label>
                      <p className="text-sm font-mono">{viewRole.committeeCode || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                <h4 className="font-semibold text-primary border-b pb-2">System Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Role ID</Label>
                    <p className="text-sm font-mono">{viewRole.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                    <p className="text-sm">{viewRole.createdAt ? new Date(viewRole.createdAt).toLocaleString() : 'Not available'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p className="text-sm">{viewRole.updatedAt ? new Date(viewRole.updatedAt).toLocaleString() : 'Not available'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
    
