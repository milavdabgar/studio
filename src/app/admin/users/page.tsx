
"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Edit, Trash2, Users as UsersIcon, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react"; // Renamed Users to UsersIcon
import { useToast } from "@/hooks/use-toast";
import type { SystemUser, UserRole } from '@/types/entities'; // Renamed User to SystemUser
import { userService } from '@/lib/api/users';

const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "hod", label: "HOD" },
  { value: "jury", label: "Jury" },
  { value: "unknown", label: "Unknown" },
];

const STATUS_OPTIONS: { value: 'active' | 'inactive'; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

type SortField = keyof Omit<SystemUser, 'roles'> | 'roles' | 'none'; 
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];


export default function UserManagementPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<SystemUser> & { password?: string; confirmPassword?: string } | null>(null);

  const [formUserName, setFormUserName] = useState('');
  const [formUserEmail, setFormUserEmail] = useState('');
  const [formUserRoles, setFormUserRoles] = useState<UserRole[]>(['student']); 
  const [formUserStatus, setFormUserStatus] = useState<'active' | 'inactive'>('active');
  const [formUserDepartment, setFormUserDepartment] = useState('');
  const [formUserPassword, setFormUserPassword] = useState('');
  const [formUserConfirmPassword, setFormUserConfirmPassword] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);

  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users", error);
      toast({ variant: "destructive", title: "Error", description: (error as Error).message || "Could not load users." });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFormUserName('');
    setFormUserEmail('');
    setFormUserRoles(['student']);
    setFormUserStatus('active');
    setFormUserDepartment('');
    setFormUserPassword('');
    setFormUserConfirmPassword('');
    setCurrentUser(null);
  };

  const handleEdit = (user: SystemUser) => {
    setCurrentUser(user);
    setFormUserName(user.name);
    setFormUserEmail(user.email);
    setFormUserRoles(user.roles);
    setFormUserStatus(user.status);
    setFormUserDepartment(user.department || '');
    setFormUserPassword('');
    setFormUserConfirmPassword('');
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.email === "admin@gppalanpur.in") { // Assuming this is the primary admin
        toast({ variant: "destructive", title: "Action Forbidden", description: "Cannot delete the primary admin user." });
        return;
    }
    setIsSubmitting(true);
    try {
      await userService.deleteUser(userId);
      await fetchUsers();
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
      toast({ title: "User Deleted", description: "The user has been successfully deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete user." });
    }
    setIsSubmitting(false);
  };

  const handleRoleCheckboxChange = (roleValue: UserRole) => {
    setFormUserRoles(prevRoles => {
      if (prevRoles.includes(roleValue)) {
        return prevRoles.filter(r => r !== roleValue);
      } else {
        return [...prevRoles, roleValue];
      }
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formUserName.trim() || !formUserEmail.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name and Email cannot be empty."});
      return;
    }
    if (formUserRoles.length === 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "User must have at least one role."});
      return;
    }
    if (!currentUser?.id) { // Only require password for new users
        if (!formUserPassword || formUserPassword.length < 6) {
            toast({ variant: "destructive", title: "Validation Error", description: "Password must be at least 6 characters long for new users." });
            return;
        }
    }
    if (formUserPassword && formUserPassword !== formUserConfirmPassword) {
        toast({ variant: "destructive", title: "Validation Error", description: "Passwords do not match." });
        return;
    }

    setIsSubmitting(true);
    
    const userData: Omit<SystemUser, 'id'> & { password?: string } = { 
      name: formUserName, 
      email: formUserEmail, 
      roles: formUserRoles, 
      status: formUserStatus,
      department: formUserDepartment,
    };
    if (formUserPassword) {
      userData.password = formUserPassword;
    }

    try {
      if (currentUser && currentUser.id) {
        await userService.updateUser(currentUser.id, userData);
        toast({ title: "User Updated", description: "The user has been successfully updated." });
      } else {
        await userService.createUser(userData);
        toast({ title: "User Created", description: "The new user has been successfully created." });
      }
      await fetchUsers();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message || "Could not save user." });
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

  const handleImportUsers = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await userService.importUsers(selectedFile);
      await fetchUsers();
      toast({ title: "Import Successful", description: `${result.newCount} users added, ${result.updatedCount} users updated. Skipped: ${result.skippedCount}` });
    } catch (error: any) {
      console.error("Error processing CSV file:", error);
      toast({ variant: "destructive", title: "Import Failed", description: error.message || "Could not process the CSV file." });
    } finally {
      setIsSubmitting(false);
      setSelectedFile(null); 
      const fileInput = document.getElementById('csvImportUser') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleExportUsers = () => {
    if (filteredAndSortedUsers.length === 0) {
      toast({ title: "Export Canceled", description: "No users to export (check filters)." });
      return;
    }
    const header = ["id", "name", "email", "roles", "status", "department"];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedUsers.map(user => [
        user.id,
        `"${user.name.replace(/"/g, '""')}"`,
        `"${user.email.replace(/"/g, '""')}"`,
        `"${user.roles.join(';')}"`, 
        user.status,
        `"${(user.department || "").replace(/"/g, '""')}"`
      ].join(','))
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "users_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Users exported to users_export.csv" });
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,name,email,roles,status,department,password
u_001,John Doe,john.doe@example.com,student,active,Computer Science,Pass@123
u_002,Jane Smith,jane.smith@example.com,faculty;jury,active,Electrical Engineering,Pass@123
,New User,new.user@example.com,jury,inactive,General,Pass@123
`; 
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_users_import.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_users_import.csv downloaded." });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); 
  };
  
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    if (searchTerm) {
      result = result.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterRole !== 'all') {
      result = result.filter(user => user.roles.includes(filterRole));
    }
    if (filterStatus !== 'all') {
      result = result.filter(user => user.status === filterStatus);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortField === 'roles') {
          valA = a.roles.join(', '); 
          valB = b.roles.join(', ');
        } else {
          valA = a[sortField as keyof Omit<SystemUser, 'roles'>];
          valB = b[sortField as keyof Omit<SystemUser, 'roles'>];
        }

        if (valA === undefined || valA === null) return sortDirection === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null) return sortDirection === 'asc' ? -1 : 1;
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
    }
    return result;
  }, [users, searchTerm, filterRole, filterStatus, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedUsers, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterRole, filterStatus, itemsPerPage]);


  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedUserIds(paginatedUsers.map(user => user.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUserIds.length === 0) {
      toast({ variant: "destructive", title: "No Users Selected", description: "Please select users to delete." });
      return;
    }
    setIsSubmitting(true);
    let deletedCount = 0;
    let adminSkipped = false;

    for (const id of selectedUserIds) {
        const user = users.find(u => u.id === id);
        if (user?.email === "admin@gppalanpur.in") {
            adminSkipped = true;
            continue;
        }
        try {
            await userService.deleteUser(id);
            deletedCount++;
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: `Could not delete user ${user?.name || id}.`});
        }
    }
    
    await fetchUsers();
    setSelectedUserIds([]);
    let description = `${deletedCount} user(s) have been successfully deleted.`;
    if(adminSkipped){
      toast({ variant: "warning", title: "Admin User Protected", description: "The primary admin user (admin@gppalanpur.in) cannot be deleted." });
    }
    if (deletedCount > 0) {
        toast({ title: "Users Deleted", description });
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedUsers.length > 0 && paginatedUsers.every(user => selectedUserIds.includes(user.id));
  const isSomeSelectedOnPage = paginatedUsers.some(user => selectedUserIds.includes(user.id)) && !isAllSelectedOnPage;


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => handleSort(field)} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">
        {label}
        {sortField === field && (sortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" /> : <ArrowUpDown className="h-4 w-4 opacity-50" />)}
        {sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}
      </div>
    </TableHead>
  );


  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <UsersIcon className="h-6 w-6" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage system users, their roles, and status.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>{currentUser?.id ? "Edit User" : "Add New User"}</DialogTitle>
                  <DialogDescription>
                    {currentUser?.id ? "Modify the details of this user." : "Create a new user account."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div>
                    <Label htmlFor="userName">Full Name</Label>
                    <Input id="userName" value={formUserName} onChange={(e) => setFormUserName(e.target.value)} placeholder="e.g., John Doe" disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="userEmail">Email Address</Label>
                    <Input id="userEmail" type="email" value={formUserEmail} onChange={(e) => setFormUserEmail(e.target.value)} placeholder="e.g., john.doe@example.com" disabled={isSubmitting || !!currentUser?.id} />
                  </div>
                  <div>
                    <Label>Roles</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border rounded-md max-h-40 overflow-y-auto">
                      {USER_ROLE_OPTIONS.filter(opt => opt.value !== 'unknown').map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${opt.value}`}
                            checked={formUserRoles.includes(opt.value)}
                            onCheckedChange={() => handleRoleCheckboxChange(opt.value)}
                            disabled={isSubmitting}
                          />
                          <Label htmlFor={`role-${opt.value}`} className="text-sm font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="userDepartment">Department (Optional)</Label>
                    <Input id="userDepartment" value={formUserDepartment} onChange={(e) => setFormUserDepartment(e.target.value)} placeholder="e.g., Computer Science" disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="userPassword">Password {currentUser?.id ? "(Leave blank to keep current)" : ""}</Label>
                    <Input id="userPassword" type="password" value={formUserPassword} onChange={(e) => setFormUserPassword(e.target.value)} placeholder="••••••••" disabled={isSubmitting} />
                  </div>
                   <div>
                    <Label htmlFor="userConfirmPassword">Confirm Password</Label>
                    <Input id="userConfirmPassword" type="password" value={formUserConfirmPassword} onChange={(e) => setFormUserConfirmPassword(e.target.value)} placeholder="••••••••" disabled={isSubmitting} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="userStatus" checked={formUserStatus === 'active'} onCheckedChange={(checked) => setFormUserStatus(checked ? 'active' : 'inactive')} disabled={isSubmitting} />
                    <Label htmlFor="userStatus">User Status: {formUserStatus === 'active' ? 'Active' : 'Inactive'}</Label>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {currentUser?.id ? "Save Changes" : "Create User"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportUsers} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Users from CSV</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportUser" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportUsers} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                Import
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
                </Button>
                <p className="text-xs text-muted-foreground">
                  CSV format: id (optional), name, email, roles (semicolon-separated), status, department, password (for new users).
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="searchUser">Search Users</Label>
              <div className="relative">
                 <Input 
                    id="searchUser" 
                    placeholder="Search by name, email, dept, role..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-8"
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterRole">Filter by Role</Label>
              <Select value={filterRole} onValueChange={(value) => setFilterRole(value as UserRole | 'all')}>
                <SelectTrigger id="filterRole"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {USER_ROLE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStatus">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'active' | 'inactive' | 'all')}>
                <SelectTrigger id="filterStatus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedUserIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedUserIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedUserIds.length} user(s) selected.
                </span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[50px]">
                    <Checkbox 
                        checked={isAllSelectedOnPage || (paginatedUsers.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)}
                        onCheckedChange={(checkedState) => handleSelectAll(!!checkedState)}
                        aria-label="Select all users on this page"
                    />
                </TableHead>
                <SortableTableHeader field="name" label="Name" />
                <SortableTableHeader field="email" label="Email" />
                <SortableTableHeader field="roles" label="Roles" />
                <SortableTableHeader field="department" label="Department" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id} data-state={selectedUserIds.includes(user.id) ? "selected" : undefined}>
                  <TableCell>
                      <Checkbox
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                        aria-labelledby={`user-name-${user.id}`}
                        disabled={user.email === "admin@gppalanpur.in"}
                       />
                  </TableCell>
                  <TableCell id={`user-name-${user.id}`} className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {user.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}
                  </TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'active' ? 'bg-success/20 text-success-foreground' : 'bg-destructive/20 text-destructive-foreground'}`}>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(user)} disabled={isSubmitting}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit User</span>
                    </Button>
                    <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => handleDelete(user.id)} 
                        disabled={isSubmitting || user.email === "admin@gppalanpur.in"}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete User</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedUsers.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No users found. Try adjusting your search or filters, or add a new user.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedUsers.length)} to {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} users.
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

