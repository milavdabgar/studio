"use client";

import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { UserCircle, Mail, Phone, CalendarDays, Landmark, GraduationCap, Loader2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, User, Program, Batch } from '@/types/entities';
import { studentService } from '@/lib/api/students';
import { userService } from '@/lib/api/users';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { format, parseISO, isValid } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';


interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string; 
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookiePart = parts.pop();
    if (cookiePart) {
        return cookiePart.split(';').shift();
    }
  }
  return undefined;
}

export default function StudentProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Form state for editing
  const [formPersonalEmail, setFormPersonalEmail] = useState('');
  const [formContactNumber, setFormContactNumber] = useState('');
  const [formAddress, setFormAddress] = useState('');
  // Add other editable fields as needed e.g. photoURL, guardianDetails
  const [formPhotoURL, setFormPhotoURL] = useState('');


  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse auth_user cookie:", error);
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    } else {
        toast({ variant: "destructive", title: "Authentication Error", description: "User not logged in." });
    }
  }, [toast]);

  const fetchProfileData = useCallback(async () => {
    if (!user || !user.id) return;
    setIsLoading(true);
    try {
      const allStudents = await studentService.getAllStudents(); 
      const studentProfile = allStudents.find(s => s.userId === user.id);

      if (studentProfile) {
        setStudent(studentProfile);
        setFormPersonalEmail(studentProfile.personalEmail || '');
        setFormContactNumber(studentProfile.contactNumber || '');
        setFormAddress(studentProfile.address || '');
        setFormPhotoURL(studentProfile.photoURL || '');

        if (studentProfile.programId) {
          const prog = await programService.getProgramById(studentProfile.programId);
          setProgram(prog);
        }
        if (studentProfile.batchId) {
          const bat = await batchService.getBatchById(studentProfile.batchId);
          setBatch(bat);
        }
      } else {
        toast({ variant: "destructive", title: "Profile Not Found", description: "Could not find your student profile." });
      }
    } catch (error) {
      console.error("Error fetching student profile:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load profile data." });
    }
    setIsLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]); // fetchProfileData is memoized with useCallback

  const handleEditProfile = () => {
    if (student) {
      setFormPersonalEmail(student.personalEmail || '');
      setFormContactNumber(student.contactNumber || '');
      setFormAddress(student.address || '');
      setFormPhotoURL(student.photoURL || '');
      setIsEditDialogOpen(true);
    }
  };

  const handleProfileUpdateSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!student || !user || !user.id) return;

    setIsSubmittingEdit(true);
    
    const updatedStudentData: Partial<Student> = {
      personalEmail: formPersonalEmail.trim() || undefined,
      contactNumber: formContactNumber.trim() || undefined,
      address: formAddress.trim() || undefined,
      photoURL: formPhotoURL.trim() || undefined,
    };

    try {
      await studentService.updateStudent(student.id, updatedStudentData);
      
      // Check if user display name needs update (if student name changes are allowed)
      // For now, assuming student name fields (firstName, lastName) are not editable here.
      // If they were, and they affect User.displayName:
      // const systemUser = await userService.getUserById(user.id);
      // const newDisplayName = `${student.firstName} ${student.lastName}`; // From form if editable
      // if(systemUser.displayName !== newDisplayName) {
      //    await userService.updateUser(user.id, { displayName: newDisplayName });
      // }
      // Also, if personalEmail is the primary email on User record and it changed:
      // await userService.updateUser(user.id, { email: formPersonalEmail.trim() });


      toast({ title: "Profile Updated", description: "Your profile details have been updated." });
      setIsEditDialogOpen(false);
      await fetchProfileData(); // Re-fetch to show updated data
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: (error as Error).message || "Could not update profile." });
    } finally {
      setIsSubmittingEdit(false);
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!student) {
    return <div className="text-center py-10">Student profile not found. Please contact administration.</div>;
  }

  const profileItems = [
    { icon: UserCircle, label: "Enrollment No.", value: student.enrollmentNumber },
    { icon: Mail, label: "Institute Email", value: student.instituteEmail },
    { icon: Mail, label: "Personal Email", value: student.personalEmail || "N/A" },
    { icon: Phone, label: "Contact", value: student.contactNumber || "N/A" },
    { icon: CalendarDays, label: "Date of Birth", value: student.dateOfBirth && isValid(parseISO(student.dateOfBirth)) ? format(parseISO(student.dateOfBirth), "PPP") : "N/A" },
    { icon: GraduationCap, label: "Program", value: program?.name || "N/A" },
    { icon: UsersIcon, label: "Batch", value: batch?.name || "N/A" },
    { icon: Landmark, label: "Current Semester", value: student.currentSemester.toString() },
    { icon: UserCircle, label: "Address", value: student.address || "N/A"}
  ];

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="items-center text-center">
          <Avatar className="w-24 h-24 mb-4 ring-2 ring-primary ring-offset-2">
            <AvatarImage src={student.photoURL || `https://picsum.photos/seed/${student.id}/100/100`} alt={student.firstName || student.enrollmentNumber} data-ai-hint="student avatar" />
            <AvatarFallback>{(student.firstName?.[0] || 'S').toUpperCase()}{(student.lastName?.[0] || 'P').toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold text-primary">
            {student.firstName} {student.middleName} {student.lastName}
          </CardTitle>
          <CardDescription className="text-lg">{student.enrollmentNumber}</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-4 px-6 md:px-10">
          {profileItems.map((item, index) => (
            <div key={index} className="flex items-start space-x-3 py-2 border-b border-muted last:border-b-0 md:last:border-b">
              <item.icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <p className="text-md text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="justify-center pt-6">
           <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handleEditProfile}>
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Your Profile</DialogTitle>
                <DialogDescription>
                  Update your personal information. Some fields may be locked by administration.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleProfileUpdateSubmit} className="space-y-4 py-4">
                <div>
                  <Label htmlFor="editPersonalEmail">Personal Email</Label>
                  <Input id="editPersonalEmail" type="email" value={formPersonalEmail} onChange={e => setFormPersonalEmail(e.target.value)} disabled={isSubmittingEdit}/>
                </div>
                <div>
                  <Label htmlFor="editContactNumber">Contact Number</Label>
                  <Input id="editContactNumber" type="tel" value={formContactNumber} onChange={e => setFormContactNumber(e.target.value)} disabled={isSubmittingEdit}/>
                </div>
                <div>
                  <Label htmlFor="editAddress">Address</Label>
                  <Textarea id="editAddress" value={formAddress} onChange={e => setFormAddress(e.target.value)} disabled={isSubmittingEdit} rows={3}/>
                </div>
                 <div>
                  <Label htmlFor="editPhotoURL">Photo URL</Label>
                  <Input id="editPhotoURL" type="url" value={formPhotoURL} onChange={e => setFormPhotoURL(e.target.value)} placeholder="https://example.com/photo.jpg" disabled={isSubmittingEdit}/>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmittingEdit}>Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSubmittingEdit}>
                    {isSubmittingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
           </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}

// Placeholder for UsersIcon if it's used from a different import
const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
