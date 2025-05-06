
"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, Edit, Trash2, UsersCog, Loader2 } from "lucide-react";
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

  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching roles
    setTimeout(() => {
      setRoles(initialRoles);
      setIsLoading(false);
    }, 500);
  }, []);

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
    // In a real app, show a confirmation dialog first
    setIsSubmitting(true);
    setTimeout(() => { // Simulate API call
      setRoles(roles.filter(role => role.id !== roleId));
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
    
    setTimeout(() => { // Simulate API call
      if (currentRole && currentRole.id) {
        // Update existing role
        setRoles(roles.map(r => r.id === currentRole.id ? { ...r, name: formRoleName, description: formRoleDescription, permissions: formRolePermissions } : r));
        toast({ title: "Role Updated", description: "The role has been successfully updated." });
      } else {
        // Add new role
        const newRole: Role = { 
          id: String(Date.now()), // Simple ID generation for mock
          name: formRoleName, 
          description: formRoleDescription, 
          permissions: formRolePermissions 
        };
        setRoles([...roles, newRole]);
        toast({ title: "Role Created", description: "The new role has been successfully created." });
      }
      setIsSubmitting(false);
      setIsDialogOpen(false);
    }, 1000);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <UsersCog className="h-6 w-6" />
              Role Management
            </CardTitle>
            <CardDescription>
              Manage user roles and their permissions within the system.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
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
                          className="form-checkbox h-4 w-4 text-primary border-muted-foreground focus:ring-primary"
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>{role.permissions.length}</TableCell>
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
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No roles found. Click "Add New Role" to create one.
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
