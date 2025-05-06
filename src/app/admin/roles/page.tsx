
"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, Edit, Trash2, UserCog, Loader2, UploadCloud, Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const initialRoles: Role[] = [
  { id: "1", name: "Admin", description: "Full access to all system features.", permissions: ["manage_users", "manage_roles", "manage_settings"] },
  { id: "2", name: "Student", description: "Access to student-specific features.", permissions: ["view_courses", "submit_assignments"] },
  { id: "3", name: "Faculty", description: "Access to faculty-specific features.", permissions: ["manage_courses", "grade_assignments"] },
  { id: "4", name: "HOD", description: "Head of Department access.", permissions: ["manage_faculty", "view_department_reports"] },
  { id: "5", name: "Jury", description: "Project fair jury access.", permissions: ["evaluate_projects"] },
];

const LOCAL_STORAGE_KEY_ROLES = 'managedRoles';

// Mock permissions list
const allPermissions = [
  "manage_users", "manage_roles", "manage_settings", "view_courses", 
  "submit_assignments", "manage_courses", "grade_assignments", 
  "manage_faculty", "view_department_reports", "evaluate_projects",
  "view_feedback", "generate_reports"
];


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

  const { toast } = useToast();

 useEffect(() => {
    setIsLoading(true);
    try {
      const storedRoles = localStorage.getItem(LOCAL_STORAGE_KEY_ROLES);
      if (storedRoles) {
        setRoles(JSON.parse(storedRoles));
      } else {
        setRoles(initialRoles);
      }
    } catch (error) {
      console.error("Failed to load roles from localStorage", error);
      setRoles(initialRoles);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if(!isLoading) { // Only save if initial load is complete
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY_ROLES, JSON.stringify(roles));
        } catch (error) {
            console.error("Failed to save roles to localStorage", error);
            toast({
                variant: "destructive",
                title: "Storage Error",
                description: "Could not save role data locally. Changes might be lost.",
            });
        }
    }
  }, [roles, isLoading, toast]);

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

  const handleDelete = (roleId: string) => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => { 
      setRoles(prevRoles => prevRoles.filter(role => role.id !== roleId));
      toast({ title: "Role Deleted", description: "The role has been successfully deleted." });
      setIsSubmitting(false);
    }, 500);
  };

  const handlePermissionChange = (permission: string) => {
    setFormRolePermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission) 
        : [...prev, permission]
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formRoleName.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Role name cannot be empty."});
      return;
    }
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => { 
      if (currentRole && currentRole.id) {
        setRoles(prevRoles => prevRoles.map(r => r.id === currentRole.id ? { ...r, name: formRoleName, description: formRoleDescription, permissions: formRolePermissions } : r));
        toast({ title: "Role Updated", description: "The role has been successfully updated." });
      } else {
        const newRole: Role = { 
          id: String(Date.now()), 
          name: formRoleName, 
          description: formRoleDescription, 
          permissions: formRolePermissions 
        };
        setRoles(prevRoles => [...prevRoles, newRole]);
        toast({ title: "Role Created", description: "The new role has been successfully created." });
      }
      setIsSubmitting(false);
      setIsDialogOpen(false);
    }, 1000);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleImportRoles = () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length <= 1) {
          throw new Error("CSV file is empty or has only a header.");
        }
        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        const expectedHeaders = ['id', 'name', 'description', 'permissions'];
        if (!expectedHeaders.every(eh => header.includes(eh))) {
            throw new Error(`CSV header is missing some_expected columns. Expected: ${expectedHeaders.join(', ')} Got: ${header.join(', ')}`);
        }
        
        const idIndex = header.indexOf('id');
        const nameIndex = header.indexOf('name');
        const descriptionIndex = header.indexOf('description');
        const permissionsIndex = header.indexOf('permissions');

        const importedRolesBatch: Role[] = [];
        const currentRolesCopy = [...roles]; // Work on a copy
        let newRolesCount = 0;
        let updatedRolesCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const data = lines[i].split(',');
          const id = data[idIndex]?.trim();
          const name = data[nameIndex]?.trim();
          const description = data[descriptionIndex]?.trim();
          const permissionsString = data[permissionsIndex]?.trim().replace(/^"|"$/g, ''); 
          const permissions = permissionsString ? permissionsString.split(';').map(p => p.trim()).filter(p => p) : [];


          if (!name) {
            console.warn(`Skipping row ${i+1}: Name is missing.`);
            continue;
          }

          const roleData = { name, description: description || "", permissions };
          
          if (id) {
            const existingRoleIndex = currentRolesCopy.findIndex(r => r.id === id);
            if (existingRoleIndex !== -1) {
              currentRolesCopy[existingRoleIndex] = { ...currentRolesCopy[existingRoleIndex], ...roleData };
              updatedRolesCount++;
            } else {
              importedRolesBatch.push({ id, ...roleData });
              newRolesCount++;
            }
          } else {
            importedRolesBatch.push({ id: String(Date.now() + Math.random()), ...roleData });
            newRolesCount++;
          }
        }
        
        const finalRolesList = [
          ...currentRolesCopy.filter(r => !importedRolesBatch.find(ir => ir.id === r.id)), 
          ...importedRolesBatch
        ];
        setRoles(finalRolesList);

        toast({ title: "Import Successful", description: `${newRolesCount} roles added, ${updatedRolesCount} roles updated.` });

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
    reader.readAsText(selectedFile);
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
role_001,Editor,Can edit content but not publish,"manage_content;view_content"
role_002,Viewer,Can only view published content,"view_content"
,Moderator,Can moderate comments and user interactions,"moderate_comments;manage_users_basic" 
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
                          <input
                            type="checkbox"
                            id={`perm-${permission}`}
                            checked={formRolePermissions.includes(permission)}
                            onChange={() => handlePermissionChange(permission)}
                            disabled={isSubmitting}
                            className="form-checkbox h-4 w-4 text-primary border-muted-foreground focus:ring-primary rounded"
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {role.permissions.map(p => p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ') || '-'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(role)} disabled={isSubmitting}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Role</span>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(role.id)} disabled={isSubmitting || role.name === 'Admin' /* Prevent Admin role deletion */}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Role</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {roles.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No roles found. Click "Add New Role" or import a CSV file to create roles.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    