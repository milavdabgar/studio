
"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Edit, Trash2, Users, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UserRole = 'admin' | 'student' | 'faculty' | 'hod' | 'jury' | 'unknown';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  department?: string; // Optional
  // Password is not stored in this client-side state for security, handled in form
}

const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "hod", label: "HOD" },
  { value: "jury", label: "Jury" },
];

const STATUS_OPTIONS: { value: 'active' | 'inactive'; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const initialUsers: User[] = [
  { id: "u1", name: "Super Admin", email: "admin@gppalanpur.in", role: "admin", status: "active", department: "Administration" },
  { id: "u2", name: "Alice Wonderland", email: "alice.wonder@example.com", role: "student", status: "active", department: "Computer Science" },
  { id: "u3", name: "Bob The Builder", email: "bob.builder@example.com", role: "faculty", status: "active", department: "Civil Engineering" },
  { id: "u4", name: "Charlie Chaplin", email: "charlie.c@example.com", role: "hod", status: "active", department: "Mechanical Engineering" },
  { id: "u5", name: "Diana Prince", email: "diana.p@example.com", role: "jury", status: "inactive", department: "General" },
  { id: "u6", name: "Edward Scissorhands", email: "ed.hands@example.com", role: "student", status: "active", department: "Computer Science" },
];

type SortField = keyof User | 'none';
type SortDirection = 'asc' | 'desc';

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User> & { password?: string; confirmPassword?: string } | null>(null);

  // Form state for Dialog
  const [formUserName, setFormUserName] = useState('');
  const [formUserEmail, setFormUserEmail] = useState('');
  const [formUserRole, setFormUserRole] = useState<UserRole>('student');
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

  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching users
    setTimeout(() => {
      setUsers(initialUsers);
      setIsLoading(false);
    }, 500);
  }, []);

  const resetForm = () => {
    setFormUserName('');
    setFormUserEmail('');
    setFormUserRole('student');
    setFormUserStatus('active');
    setFormUserDepartment('');
    setFormUserPassword('');
    setFormUserConfirmPassword('');
    setCurrentUser(null);
  };

  const handleEdit = (user: User) => {
    setCurrentUser(user);
    setFormUserName(user.name);
    setFormUserEmail(user.email);
    setFormUserRole(user.role);
    setFormUserStatus(user.status);
    setFormUserDepartment(user.department || '');
    // Password fields remain empty for editing (security best practice)
    setFormUserPassword('');
    setFormUserConfirmPassword('');
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = (userId: string) => {
    // Prevent deleting the main admin user as a safeguard
    if (userId === "u1" && users.find(u => u.id === userId)?.email === "admin@gppalanpur.in") {
        toast({ variant: "destructive", title: "Action Forbidden", description: "Cannot delete the primary admin user." });
        return;
    }
    setIsSubmitting(true);
    setTimeout(() => { 
      setUsers(users.filter(user => user.id !== userId));
      toast({ title: "User Deleted", description: "The user has been successfully deleted." });
      setIsSubmitting(false);
    }, 500);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formUserName.trim() || !formUserEmail.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name and Email cannot be empty."});
      return;
    }
    if (!currentUser) { // Adding new user, password is required
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
    
    setTimeout(() => { 
      const userData: Omit<User, 'id'> = { 
        name: formUserName, 
        email: formUserEmail, 
        role: formUserRole, 
        status: formUserStatus,
        department: formUserDepartment,
      };

      if (currentUser && currentUser.id) {
        setUsers(users.map(u => u.id === currentUser.id ? { ...u, ...userData } : u));
        toast({ title: "User Updated", description: "The user has been successfully updated." });
      } else {
        const newUser: User = { 
          id: String(Date.now()), 
          ...userData
        };
        setUsers([...users, newUser]);
        toast({ title: "User Created", description: "The new user has been successfully created." });
      }
      setIsSubmitting(false);
      setIsDialogOpen(false);
      resetForm();
    }, 1000);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleImportUsers = () => {
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
        if (lines.length <= 1) throw new Error("CSV file is empty or has only a header.");
        
        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        const expectedHeaders = ['id', 'name', 'email', 'role', 'status', 'department']; // Password is not imported for security
        const requiredHeaders = ['name', 'email', 'role', 'status'];

        if (!requiredHeaders.every(rh => header.includes(rh))) {
            throw new Error(`CSV header is missing required columns. Expected at least: ${requiredHeaders.join(', ')}`);
        }
        
        const hMap = Object.fromEntries(expectedHeaders.map(eh => [eh, header.indexOf(eh)]));

        const importedUsers: User[] = [];
        const updatedUsersList = [...users];
        let newUsersCount = 0;
        let updatedUsersCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const data = lines[i].split(',').map(d => d.trim().replace(/^"|"$/g, '')); // Basic CSV parsing
          
          const name = data[hMap['name']];
          const email = data[hMap['email']];
          const role = data[hMap['role']] as UserRole;
          const status = data[hMap['status']] as 'active' | 'inactive';
          const department = data[hMap['department']];
          const id = data[hMap['id']];

          if (!name || !email || !USER_ROLE_OPTIONS.find(r => r.value === role) || !STATUS_OPTIONS.find(s => s.value === status)) {
            console.warn(`Skipping row ${i+1}: Missing or invalid required data (name, email, role, status).`);
            continue;
          }

          const userData: Omit<User, 'id'> = { name, email, role, status, department: department || "" };
          
          if (id) {
            const existingUserIndex = updatedUsersList.findIndex(u => u.id === id);
            if (existingUserIndex !== -1) {
              updatedUsersList[existingUserIndex] = { ...updatedUsersList[existingUserIndex], ...userData };
              updatedUsersCount++;
            } else {
              importedUsers.push({ id, ...userData });
              newUsersCount++;
            }
          } else { // New user, generate ID
            importedUsers.push({ id: String(Date.now() + Math.random()), ...userData });
            newUsersCount++;
          }
        }
        
        // Combine existing users not in import, updated users, and new users
        const finalUsers = [
            ...updatedUsersList.filter(u => !importedUsers.find(iu => iu.id === u.id)), // Keep existing users not touched by ID match
            ...importedUsers // Add new and ID-matched (updated) users
        ];

        setUsers(finalUsers);
        toast({ title: "Import Successful", description: `${newUsersCount} users added, ${updatedUsersCount} users updated.` });

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
    reader.readAsText(selectedFile);
  };

  const handleExportUsers = () => {
    if (filteredAndSortedUsers.length === 0) {
      toast({ title: "Export Canceled", description: "No users to export (check filters)." });
      return;
    }
    const header = ["id", "name", "email", "role", "status", "department"];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedUsers.map(user => [
        user.id,
        `"${user.name.replace(/"/g, '""')}"`,
        `"${user.email.replace(/"/g, '""')}"`,
        user.role,
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
    const sampleCsvContent = `id,name,email,role,status,department
u_001,John Doe,john.doe@example.com,student,active,Computer Science
u_002,Jane Smith,jane.smith@example.com,faculty,active,Electrical Engineering
,New User,new.user@example.com,jury,inactive,General
`; // Last user has no ID to demonstrate auto-ID generation
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
  };
  
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Filter
    if (searchTerm) {
      result = result.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterRole !== 'all') {
      result = result.filter(user => user.role === filterRole);
    }
    if (filterStatus !== 'all') {
      result = result.filter(user => user.status === filterStatus);
    }

    // Sort
    if (sortField !== 'none') {
      result.sort((a, b) => {
        const valA = a[sortField as keyof User];
        const valB = b[sortField as keyof User];

        if (valA === undefined || valA === null) return sortDirection === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null) return sortDirection === 'asc' ? -1 : 1;
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        // Add more type checks if needed (e.g. for numbers)
        return 0;
      });
    }
    return result;
  }, [users, searchTerm, filterRole, filterStatus, sortField, sortDirection]);

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
              <Users className="h-6 w-6" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage system users, their roles, and status.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                    <Input id="userEmail" type="email" value={formUserEmail} onChange={(e) => setFormUserEmail(e.target.value)} placeholder="e.g., john.doe@example.com" disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="userRole">Role</Label>
                    <Select value={formUserRole} onValueChange={(value) => setFormUserRole(value as UserRole)} disabled={isSubmitting}>
                      <SelectTrigger id="userRole"><SelectValue placeholder="Select a role" /></SelectTrigger>
                      <SelectContent>
                        {USER_ROLE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
                  CSV format: id (optional), name, email, role, status, department. Password is not imported/exported.
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="searchUser">Search Users</Label>
              <div className="relative">
                 <Input 
                    id="searchUser" 
                    placeholder="Search by name, email, department..." 
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

          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHeader field="name" label="Name" />
                <SortableTableHeader field="email" label="Email" />
                <SortableTableHeader field="role" label="Role" />
                <SortableTableHeader field="department" label="Department" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
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
                        disabled={isSubmitting || user.email === "admin@gppalanpur.in"} // Prevent admin deletion
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete User</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAndSortedUsers.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No users found. Try adjusting your search or filters, or add a new user.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="justify-end">
            <p className="text-sm text-muted-foreground">
                Showing {filteredAndSortedUsers.length} of {users.length} users.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

    