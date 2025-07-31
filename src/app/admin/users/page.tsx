"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Edit, Trash2, Users as UsersIcon, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SystemUser, UserRole as UserRoleCode, Institute, Role } from '@/types/entities'; 
import { userService } from '@/lib/api/users';
import { instituteService } from '@/lib/api/institutes';
import { roleService } from '@/lib/api/roles';
import { studentService } from '@/lib/api/students'; 

const STATUS_OPTIONS: { value: 'active' | 'inactive'; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

type SortField = keyof Omit<SystemUser, 'roles' | 'preferences'> | 'roles' | 'none'; 
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const NO_INSTITUTE_VALUE = "__NO_INSTITUTE__";


export default function UserManagementPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [allSystemRoles, setAllSystemRoles] = useState<Role[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<SystemUser> & { password?: string; confirmPassword?: string } | null>(null);
  const [viewUser, setViewUser] = useState<SystemUser | null>(null);

  const [formFullName, setFormFullName] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formMiddleName, setFormMiddleName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formUserEmail, setFormUserEmail] = useState('');
  const [formUserRoles, setFormUserRoles] = useState<UserRoleCode[]>([]); 
  const [formUserStatus, setFormUserStatus] = useState<'active' | 'inactive'>('active');
  const [formUserPassword, setFormUserPassword] = useState('');
  const [formUserConfirmPassword, setFormUserConfirmPassword] = useState('');
  const [formInstituteId, setFormInstituteId] = useState<string | undefined>(undefined);


  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoleCode, setFilterRoleCode] = useState<UserRoleCode | 'all'>('all'); // Filter by role code
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('all');
  const [filterInstitute, setFilterInstitute] = useState<string | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('displayName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);

  const { toast } = useToast();
  
  const parseGtuNameToComponents = (gtuName: string | undefined): { firstName?: string, middleName?: string, lastName?: string } => {
    if (!gtuName) return {};
    const parts = gtuName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: "SURNAME_PLACEHOLDER" }; // Default last name if only one part
    if (parts.length === 2) return { lastName: parts[0], firstName: parts[1] }; 
    return { lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') };
  };


  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userData, instituteData, rolesData] = await Promise.all([
        userService.getAllUsers(),
        instituteService.getAllInstitutes(),
        roleService.getAllRoles() 
      ]);
      setUsers(userData as SystemUser[]); 
      setInstitutes(instituteData);
      setAllSystemRoles(rolesData); 

      if (rolesData.length > 0 && formUserRoles.length === 0) {
        const defaultRole = rolesData.find(r => r.code === 'student') || rolesData[0];
        setFormUserRoles([defaultRole.code]); // Use role code
      }

    } catch (error) {
      console.error("Failed to load users, institutes, or roles", error);
      toast({ variant: "destructive", title: "Error", description: (error as Error).message || "Could not load data." });
    }
    setIsLoading(false);
  }, [formUserRoles.length, toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const resetForm = () => {
    setFormFullName('');
    setFormFirstName('');
    setFormMiddleName('');
    setFormLastName('');
    setFormUserEmail('');
    if (allSystemRoles.length > 0) {
        const defaultRole = allSystemRoles.find(r => r.code === 'student') || allSystemRoles[0];
        setFormUserRoles([defaultRole.code]); // Use role code
    } else {
        setFormUserRoles([]);
    }
    setFormUserStatus('active');
    setFormUserPassword('');
    setFormUserConfirmPassword('');
    setFormInstituteId(undefined); 
    setCurrentUser(null);
  };

  const handleEdit = async (user: SystemUser) => {
    setCurrentUser(user);
    setFormUserEmail(user.email);
    setFormUserRoles(user.roles || []); // User roles are stored by code
    setFormUserStatus(user.isActive ? 'active' : 'inactive');
    setFormInstituteId(user.instituteId || undefined);
    setFormUserPassword('');
    setFormUserConfirmPassword('');

    // If user has student role, try to fetch student data for name fields
    if (user.roles.includes('student')) {
      try {
        const allStudents = await studentService.getAllStudents();
        const linkedStudent = allStudents.find(s => s.userId === user.id);
        
        if (linkedStudent) {
          // Use student data for name fields
          setFormFullName(linkedStudent.fullNameGtuFormat || '');
          setFormFirstName(linkedStudent.firstName || '');
          setFormMiddleName(linkedStudent.middleName || '');
          setFormLastName(linkedStudent.lastName || '');
        } else {
          // Fallback to user data if no linked student found
          setFormFullName(user.fullName || '');
          setFormFirstName(user.firstName || '');
          setFormMiddleName(user.middleName || '');
          setFormLastName(user.lastName || '');
        }
      } catch (error) {
        console.error('Error fetching student data for user edit:', error);
        // Fallback to user data if error occurs
        setFormFullName(user.fullName || '');
        setFormFirstName(user.firstName || '');
        setFormMiddleName(user.middleName || '');
        setFormLastName(user.lastName || '');
      }
    } else {
      // For non-student users, use user data directly
      setFormFullName(user.fullName || '');
      setFormFirstName(user.firstName || '');
      setFormMiddleName(user.middleName || '');
      setFormLastName(user.lastName || '');
    }

    setIsDialogOpen(true);
  };

  const handleView = (user: SystemUser) => {
    setViewUser(user);
    setIsViewDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.email === "admin@gppalanpur..ac.in" || userToDelete?.instituteEmail === "admin@gppalanpur..ac.in") { 
        toast({ variant: "destructive", title: "Action Forbidden", description: "Cannot delete the primary admin user." });
        return;
    }
    setIsSubmitting(true);
    try {
      // Use complete user deletion (removes user and all associated role-specific data)
      await userService.deleteUserCompletely(userId);
      await fetchInitialData();
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
      toast({ 
        title: "User Completely Deleted", 
        description: "The user and all associated role-specific data have been successfully deleted." 
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete user." });
    }
    setIsSubmitting(false);
  };

  const handleRoleCheckboxChange = (roleCode: UserRoleCode) => { 
    setFormUserRoles(prevRoles => {
      if (prevRoles.includes(roleCode)) {
        return prevRoles.filter(r => r !== roleCode);
      } else {
        return [...prevRoles, roleCode];
      }
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formFullName.trim() || !formFirstName.trim() || !formLastName.trim() || !formUserEmail.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Full Name, First Name, Last Name, and Login Email are required."});
      return;
    }
    if (formUserRoles.length === 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "User must have at least one role."});
      return;
    }
    if (!currentUser?.id) { 
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
    
    const userData: Partial<Omit<SystemUser, 'id' | 'createdAt' | 'updatedAt' | 'authProviders' | 'isEmailVerified' | 'preferences'>> & { password?: string } = { 
      displayName: `${formFirstName.trim()} ${formLastName.trim()}`,
      fullName: formFullName.trim(),
      firstName: formFirstName.trim(),
      middleName: formMiddleName.trim() || undefined,
      lastName: formLastName.trim(),
      email: formUserEmail.trim(), 
      roles: formUserRoles, // Send role codes
      isActive: formUserStatus === 'active',
      instituteId: formInstituteId === NO_INSTITUTE_VALUE ? undefined : formInstituteId,
    };
    if (formUserPassword) {
      userData.password = formUserPassword;
    }

    try {
      if (currentUser && currentUser.id) {
        await userService.updateUser(currentUser.id, userData);
        
        // If this is a student user, also update the linked student record
        if (currentUser.roles && currentUser.roles.includes('student')) {
          try {
            const allStudents = await studentService.getAllStudents();
            const linkedStudent = allStudents.find(s => s.userId === currentUser.id);
            
            if (linkedStudent) {
              const studentUpdateData = {
                fullNameGtuFormat: formFullName.trim(),
                firstName: formFirstName.trim(),
                middleName: formMiddleName.trim() || undefined,
                lastName: formLastName.trim(),
              };
              await studentService.updateStudent(linkedStudent.id, studentUpdateData);
            }
          } catch (studentError) {
            console.error('Error updating linked student record:', studentError);
            // Don't fail the entire operation, just log the error
            toast({ variant: "warning", title: "Partial Update", description: "User updated but student record sync failed." });
          }
        }
        
        toast({ title: "User Updated", description: "The user has been successfully updated." });
      } else {
        await userService.createUser(userData as Parameters<typeof userService.createUser>[0]); 
        toast({ title: "User Created", description: "The new user has been successfully created." });
      }
      await fetchInitialData();
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
      const result = await userService.importUsers(selectedFile, institutes, allSystemRoles); 
      await fetchInitialData();
      toast({ title: "Import Successful", description: `${result.newCount} users added, ${result.updatedCount} users updated. Skipped: ${result.skippedCount}` });
      if(result.errors && result.errors.length > 0){
          result.errors.slice(0,3).forEach((err: unknown) => {
            const error = err as { row?: number; message?: string };
            toast({variant: "warning", title: `Import Warning (Row ${error.row || 'unknown'})`, description: error.message || 'Unknown error', duration: 7000});
          });
      }
    } catch (error: unknown) {
      console.error("Error processing CSV file for User Import:", error);
      const errorMessage = error instanceof Error ? error.message : 
        (error as { data?: { message?: string } }).data?.message || "Could not process the CSV file.";
      toast({ variant: "destructive", title: "Import Failed", description: errorMessage });
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
    const header = ["id", "displayName", "fullName_GTUFormat", "firstName", "middleName", "lastName", "email", "instituteEmail", "roles", "isActive", "instituteId", "instituteName", "instituteCode"];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedUsers.map(user => {
        const inst = institutes.find(i => i.id === user.instituteId);
        const roleNames = user.roles.map(roleCode => allSystemRoles.find(r => r.code === roleCode)?.name || roleCode); // Map codes to names for export if preferred
        return [
          user.id,
          `"${(user.displayName || "").replace(/"/g, '""')}"`,
          `"${(user.fullName || "").replace(/"/g, '""')}"`,
          `"${(user.firstName || "").replace(/"/g, '""')}"`,
          `"${(user.middleName || "").replace(/"/g, '""')}"`,
          `"${(user.lastName || "").replace(/"/g, '""')}"`,
          `"${user.email.replace(/"/g, '""')}"`,
          `"${(user.instituteEmail || "").replace(/"/g, '""')}"`,
          `"${roleNames.join(';')}"`, // Export role names
          user.isActive,
          user.instituteId || "",
          `"${(inst?.name || "").replace(/"/g, '""')}"`,
          `"${(inst?.code || "").replace(/"/g, '""')}"`,
        ].join(',');
      })
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
    const sampleCsvContent = `id,displayName,fullName_GTUFormat,firstName,middleName,lastName,username,email,instituteEmail,roles,isActive,instituteId,instituteName,instituteCode,password
,John Doe,DOE JOHN R,John,R,Doe,johndoe,john.doe@example.com,,student,true,inst1,Government Polytechnic Palanpur,GPP,Pass@123
,Jane Smith,SMITH JANE,Jane,,Smith,janesmith,jane.smith@example.com,,faculty;jury,true,inst1,Government Polytechnic Palanpur,GPP,Pass@123
,New User,USER NEW ONE,New,One,User,newuser,new.user@example.com,,jury,false,,,,Pass@123
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
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.instituteEmail && user.instituteEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.roles.some(roleCode => { // Search by role code or name
            const roleObj = allSystemRoles.find(r => r.code === roleCode);
            return roleCode.toLowerCase().includes(searchTerm.toLowerCase()) || (roleObj && roleObj.name.toLowerCase().includes(searchTerm.toLowerCase()));
        })
      );
    }
    if (filterRoleCode !== 'all') {
      result = result.filter(user => user.roles.includes(filterRoleCode)); // Filter by role code
    }
    if (filterStatus !== 'all') {
      result = result.filter(user => (user.isActive ? 'active' : 'inactive') === filterStatus);
    }
    if (filterInstitute !== 'all') {
        result = result.filter(user => user.instituteId === filterInstitute);
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: unknown;
        let valB: unknown;

        if (sortField === 'roles') {
          // Sort by concatenated role names for display consistency
          valA = a.roles.map(rc => allSystemRoles.find(r => r.code === rc)?.name || rc).join(', '); 
          valB = b.roles.map(rc => allSystemRoles.find(r => r.code === rc)?.name || rc).join(', ');
        } else if (sortField === 'isActive'){
          valA = a.isActive;
          valB = b.isActive;
        }
        else {
          valA = a[sortField as keyof Omit<SystemUser, 'roles' | 'preferences' | 'isActive'>];
          valB = b[sortField as keyof Omit<SystemUser, 'roles' | 'preferences' | 'isActive'>];
        }

        if (valA === undefined || valA === null) return sortDirection === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null) return sortDirection === 'asc' ? -1 : 1;
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
         if (typeof valA === 'boolean' && typeof valB === 'boolean') {
          return sortDirection === 'asc' ? (valA === valB ? 0 : valA ? -1 : 1) : (valA === valB ? 0 : valA ? 1 : -1);
        }
        return 0;
      });
    }
    return result;
  }, [users, searchTerm, filterRoleCode, filterStatus, filterInstitute, sortField, sortDirection, allSystemRoles]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedUsers, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterRoleCode, filterStatus, filterInstitute, itemsPerPage]);


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
        if (user?.email === "admin@gppalanpur..ac.in" || user?.instituteEmail === "admin@gppalanpur..ac.in") {
            adminSkipped = true;
            continue;
        }
        try {
            await userService.deleteUserCompletely(id);
            deletedCount++;
        } catch {
            toast({ variant: "destructive", title: "Delete Failed", description: `Could not delete user ${user?.displayName || id}.`});
        }
    }
    
    await fetchInitialData();
    setSelectedUserIds([]);
    const description = `${deletedCount} user(s) have been successfully deleted.`;
    if(adminSkipped){
      toast({ variant: "warning", title: "Admin User Protected", description: "The primary admin user (admin@gppalanpur..ac.in) cannot be deleted." });
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
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{currentUser?.id ? "Edit User" : "Add New User"}</DialogTitle>
                  <DialogDescription>
                    {currentUser?.id ? "Modify the details of this user." : "Create a new user account."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="userFullName">Full Name (GTU Format) *</Label>
                    <Input id="userFullName" value={formFullName} onChange={(e) => {setFormFullName(e.target.value); const {firstName, middleName, lastName} = parseGtuNameToComponents(e.target.value); setFormFirstName(firstName || ''); setFormMiddleName(middleName || ''); setFormLastName(lastName || '');}} placeholder="e.g., SURNAME NAME FATHERNAME" disabled={isSubmitting} required />
                  </div>
                  <div>
                    <Label htmlFor="userFirstName">First Name *</Label>
                    <Input id="userFirstName" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} placeholder="e.g., John" disabled={isSubmitting} required/>
                  </div>
                   <div>
                    <Label htmlFor="userMiddleName">Middle Name</Label>
                    <Input id="userMiddleName" value={formMiddleName} onChange={(e) => setFormMiddleName(e.target.value)} placeholder="e.g., Robert" disabled={isSubmitting}/>
                  </div>
                   <div>
                    <Label htmlFor="userLastName">Last Name *</Label>
                    <Input id="userLastName" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} placeholder="e.g., Doe" disabled={isSubmitting} required/>
                  </div>

                  <div>
                    <Label htmlFor="userEmail">Login Email *</Label>
                    <Input id="userEmail" type="email" value={formUserEmail} onChange={(e) => setFormUserEmail(e.target.value)} placeholder="e.g., john.doe@example.com" disabled={isSubmitting} required />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="userInstitute">Institute (Optional)</Label>
                     <Select value={formInstituteId || NO_INSTITUTE_VALUE} onValueChange={(value) => setFormInstituteId(value === NO_INSTITUTE_VALUE ? undefined : value)} disabled={isSubmitting}>
                        <SelectTrigger id="userInstitute"><SelectValue placeholder="Select Institute (Optional)" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NO_INSTITUTE_VALUE}>None / Not Applicable</SelectItem>
                            {institutes.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name} ({inst.code})</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label>Roles *</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border rounded-md max-h-40 overflow-y-auto dark:border-gray-700">
                      {allSystemRoles.filter(role => !role.isSystemRole || ['admin', 'student', 'faculty', 'hod', 'jury', 'super_admin', 'committee_convener', 'committee_member', 'committee_co_convener'].includes(role.code) || role.isCommitteeRole).map(role => ( 
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={formUserRoles.includes(role.code)} // Check against role code
                            onCheckedChange={() => handleRoleCheckboxChange(role.code)} // Pass role code
                            disabled={isSubmitting}
                          />
                          <Label htmlFor={`role-${role.id}`} className="text-sm font-normal cursor-pointer">{role.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="userPassword">Password {currentUser?.id ? "(Leave blank to keep current)" : "*"}</Label>
                    <Input id="userPassword" type="password" value={formUserPassword} onChange={(e) => setFormUserPassword(e.target.value)} placeholder="••••••••" disabled={isSubmitting} />
                  </div>
                   <div>
                    <Label htmlFor="userConfirmPassword">Confirm Password</Label>
                    <Input id="userConfirmPassword" type="password" value={formUserConfirmPassword} onChange={(e) => setFormUserConfirmPassword(e.target.value)} placeholder="••••••••" disabled={isSubmitting} />
                  </div>
                  <div className="md:col-span-2 flex items-center space-x-2 pt-2">
                    <Switch id="userStatus" checked={formUserStatus === 'active'} onCheckedChange={(checked) => setFormUserStatus(checked ? 'active' : 'inactive')} disabled={isSubmitting} />
                    <Label htmlFor="userStatus">User Status: {formUserStatus === 'active' ? 'Active' : 'Inactive'}</Label>
                  </div>
                  <DialogFooter className="md:col-span-2">
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
          <div className="mb-6 p-4 border rounded-lg space-y-4 dark:border-gray-700">
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
                  CSV headers: id,displayName,fullName_GTUFormat,firstName,middleName,lastName,username,email,instituteEmail,roles(codes),isActive,instituteId,instituteName,instituteCode,password
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg dark:border-gray-700">
            <div>
              <Label htmlFor="searchUser">Search Users</Label>
              <div className="relative">
                 <Input 
                    id="searchUser" 
                    placeholder="Name, email, role..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-8"
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterRole">Filter by Role</Label>
              <Select value={filterRoleCode} onValueChange={(value) => setFilterRoleCode(value as UserRoleCode | 'all')}>
                <SelectTrigger id="filterRole"><SelectValue placeholder="All Roles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {allSystemRoles.map(role => <SelectItem key={role.id} value={role.code}>{role.name}</SelectItem>)} {/* Use role.code as value */}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStatus">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'active' | 'inactive' | 'all')}>
                <SelectTrigger id="filterStatus"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="filterUserInstitute">Filter by Institute</Label>
              <Select value={filterInstitute} onValueChange={(value) => setFilterInstitute(value as string | 'all')} >
                <SelectTrigger id="filterUserInstitute"><SelectValue placeholder="All Institutes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutes</SelectItem>
                  {institutes.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name} ({inst.code})</SelectItem>)}
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
        </CardContent>
      </Card>
      
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <UsersIcon className="h-6 w-6" />
              User Listing
            </CardTitle>
            <CardDescription>
              View and manage all system users.
            </CardDescription>
          </div>
          {selectedUserIds.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedUserIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedUserIds.length} user(s) selected.
                </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-3">
            {paginatedUsers.map((user) => {
              const instituteInfo = institutes.find(i => i.id === user.instituteId);
              const userRoles = user.roles.map(roleCode => 
                allSystemRoles.find(r => r.code === roleCode)?.name || roleCode
              );
              
              return (
                <Card key={user.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Checkbox 
                        checked={selectedUserIds.includes(user.id)} 
                        onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                        disabled={user.email === "admin@gppalanpur..ac.in" || user.instituteEmail === "admin@gppalanpur..ac.in"}
                        className="flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm leading-tight">{user.displayName}</h3>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.instituteEmail && user.instituteEmail !== user.email && (
                          <p className="text-xs text-muted-foreground">{user.instituteEmail}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">Roles:</span>
                      <p className="font-medium truncate">{userRoles.join(', ') || 'No roles'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Institute:</span>
                      <p className="font-medium">{instituteInfo?.code || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleView(user)} disabled={isSubmitting} className="min-h-[44px] flex-1 text-xs">
                      <Eye className="h-3 w-3" />
                      <span className="ml-1">View</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(user)} disabled={isSubmitting} className="min-h-[44px] flex-1 text-xs">
                      <Edit className="h-3 w-3" />
                      <span className="ml-1">Edit</span>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(user.id)} 
                      disabled={isSubmitting || user.email === "admin@gppalanpur..ac.in" || user.instituteEmail === "admin@gppalanpur..ac.in"}
                      className="min-h-[44px] flex-1 text-xs"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="ml-1">Delete</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
            {paginatedUsers.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">
                No users found. Try adjusting your search or filters, or add a new user.
              </Card>
            )}
          </div>

          {/* Desktop Table View */}
          <Table className="hidden lg:table">
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[50px]">
                    <Checkbox 
                        checked={isAllSelectedOnPage || (paginatedUsers.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)}
                        onCheckedChange={(checkedState) => handleSelectAll(!!checkedState)}
                        aria-label="Select all users on this page"
                    />
                </TableHead>
                <SortableTableHeader field="displayName" label="Display Name" />
                <SortableTableHeader field="email" label="Personal Email" />
                <SortableTableHeader field="instituteEmail" label="Institute Email" />
                <SortableTableHeader field="roles" label="Roles" />
                 <TableHead>Institute</TableHead>
                <SortableTableHeader field="isActive" label="Status" />
                <TableHead className="text-right w-32">Actions</TableHead>
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
                        disabled={user.email === "admin@gppalanpur..ac.in" || user.instituteEmail === "admin@gppalanpur..ac.in"}
                       />
                  </TableCell>
                  <TableCell id={`user-name-${user.id}`} className="font-medium">{user.displayName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.instituteEmail || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {user.roles.map(roleCode => allSystemRoles.find(r => r.code === roleCode)?.name || roleCode).join(', ')}
                  </TableCell>
                  <TableCell>{institutes.find(i => i.id === user.instituteId)?.code || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="icon" onClick={() => handleView(user)} disabled={isSubmitting}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View User</span>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleEdit(user)} disabled={isSubmitting}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit User</span>
                      </Button>
                      <Button 
                          variant="destructive" 
                          size="icon" 
                          onClick={() => handleDelete(user.id)} 
                          disabled={isSubmitting || user.email === "admin@gppalanpur..ac.in" || user.instituteEmail === "admin@gppalanpur..ac.in"}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete User</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedUsers.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No users found. Try adjusting your search or filters, or add a new user.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedUsers.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedUsers.length) : 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} users.
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
                        disabled={currentPage === 1 || totalPages === 0}
                        >
                        <ChevronsLeft className="h-4 w-4" />
                        <span className="sr-only">First page</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || totalPages === 0}
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

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information for {viewUser?.fullName || viewUser?.firstName + ' ' + viewUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {viewUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Full Name:</span>
                    <p className="text-muted-foreground">{viewUser.fullName || `${viewUser.firstName} ${viewUser.middleName} ${viewUser.lastName}`.trim()}</p>
                  </div>
                  <div>
                    <span className="font-medium">First Name:</span>
                    <p className="text-muted-foreground">{viewUser.firstName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Middle Name:</span>
                    <p className="text-muted-foreground">{viewUser.middleName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Last Name:</span>
                    <p className="text-muted-foreground">{viewUser.lastName || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Personal Email:</span>
                    <p className="text-muted-foreground">{viewUser.email}</p>
                  </div>
                  <div>
                    <span className="font-medium">Institute Email:</span>
                    <p className="text-muted-foreground">{viewUser.instituteEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Phone Number:</span>
                    <p className="text-muted-foreground">{viewUser.phoneNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">System Information</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium">User ID:</span>
                    <p className="text-muted-foreground font-mono text-xs">{viewUser.id}</p>
                  </div>
                  <div>
                    <span className="font-medium">Institute:</span>
                    <p className="text-muted-foreground">
                      {institutes.find(i => i.id === viewUser.instituteId)?.name || 'No Institute Assigned'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      viewUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {viewUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Email Verified:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      viewUser.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {viewUser.isEmailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Roles and Permissions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Roles and Permissions</h3>
                <div className="space-y-2">
                  <span className="font-medium text-sm">Assigned Roles:</span>
                  <div className="flex flex-wrap gap-2">
                    {viewUser.roles && viewUser.roles.length > 0 ? (
                      viewUser.roles.map((roleCode) => {
                        const role = allSystemRoles.find(r => r.code === roleCode);
                        return (
                          <span key={roleCode} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {role?.name || roleCode}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-muted-foreground text-sm">No roles assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold">Account Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created At:</span>
                    <p className="text-muted-foreground">
                      {viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Updated At:</span>
                    <p className="text-muted-foreground">
                      {viewUser.updatedAt ? new Date(viewUser.updatedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Last Login:</span>
                    <p className="text-muted-foreground">
                      {viewUser.lastLoginAt ? new Date(viewUser.lastLoginAt).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Login Count:</span>
                    <p className="text-muted-foreground">{viewUser.loginCount || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
    