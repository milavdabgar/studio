
"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, Edit, Trash2, UserCog, Loader2, UploadCloud, Download, FileSpreadsheet, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
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
  const [currentRole, setCurrentRole] = useState<Partial<Role> | null>(null);
  const [formRoleName, setFormRoleName] = useState('');
  const [formRoleDescription, setFormRoleDescription] = useState('');
  const [formRolePermissions, setFormRolePermissions] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const data = await roleService.getAllRoles();
      setRoles(data);
    } catch (error) {
      console.error("Failed to load roles", error);
      toast({ variant: "destructive", title: "Error", description: (error as Error).message || "Could not load roles." });
    }
    setIsLoading(false);
  };

 useEffect(() => {
    fetchRoles();
  }, []);

  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return roles.slice(startIndex, startIndex + itemsPerPage);
  }, [roles, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(roles.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);


  const handleEdit = (role: Role) => {
    setCurrentRole(role);
    setFormRoleName(role.name);
    setFormRoleDescription(role.description);
    setFormRolePermissions([...role.permissions]);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setCurrentRole(null);
    setFormRoleName('');
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
    if (!formRoleName.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Role name cannot be empty."});
      return;
    }
    setIsSubmitting(true);
    
    const roleData: Omit<Role, 'id'> = { 
      name: formRoleName, 
      description: formRoleDescription, 
      permissions: formRolePermissions 
    };
    
    try {
      if (currentRole && currentRole.id) {
        await roleService.updateRole(currentRole.id, roleData);
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
    } catch (error: any) {
      console.error("Error processing CSV file:", error);
      toast({ variant: "destructive", title: "Import Failed", description: error.message || "Could not process the CSV file." });
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
    const header = ["id", "name", "description", "permissions"];
    const csvRows = [
      header.join(','),
      ...roles.map(role => [
        role.id,
        `"${role.name.replace(/"/g, '""')}"`, 
        `"${role.description.replace(/"/g, '""')}"`, 
        `"${role.permissions.join(';')}"` 
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
    const sampleCsvContent = `id,name,description,permissions
role_001,Editor,"Can edit content but not publish","manage_content;view_content"
role_002,Viewer,"Can only view published content","view_content"
,Moderator,"Can moderate comments and user interactions","moderate_comments;manage_users_basic" 
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
      if (role?.name === 'Admin') {
        adminSkipped = true;
        continue;
      }
      try {
        await roleService.deleteRole(id);
        deletedCount++;
      } catch (error) {
        toast({ variant: "destructive", title: "Delete Failed", description: `Could not delete role ${role?.name || id}.` });
      }
    }
    
    await fetchRoles();
    setSelectedRoleIds([]);
    let description = `${deletedCount} role(s) have been successfully deleted.`;
    if (adminSkipped) {
        toast({ variant: "warning", title: "Admin Role Protected", description: "The 'Admin' role cannot be deleted." });
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
                    <Label htmlFor="roleName">Role Name</Label>
                    <Input 
                      id="roleName" 
                      value={formRoleName} 
                      onChange={(e) => setFormRoleName(e.target.value)} 
                      placeholder="e.g., Administrator" 
                      disabled={isSubmitting}
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                      {allPermissions.map(permission => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${permission}`}
                            checked={formRolePermissions.includes(permission)}
                            onCheckedChange={() => handlePermissionChange(permission)}
                            disabled={isSubmitting}
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
                    <Button type="submit" disabled={isSubmitting}>
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
          <div className="mb-6 p-4 border rounded-lg">
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
              CSV format: id (optional, for updates), name, description, permissions (semicolon-separated, e.g., "perm1;perm2").
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

          <Table>
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
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                        disabled={role.name === 'Admin'}
                       />
                  </TableCell>
                  <TableCell id={`role-name-${role.id}`} className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {role.permissions.map(p => p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ') || '-'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(role)} disabled={isSubmitting}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Role</span>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(role.id)} disabled={isSubmitting || role.name === 'Admin'}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Role</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedRoles.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No roles found. Click "Add New Role" or import a CSV file to create roles.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage -1) * itemsPerPage + 1, roles.length)} to {Math.min(currentPage * itemsPerPage, roles.length)} of {roles.length} roles.
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
    </div>
  );
}

