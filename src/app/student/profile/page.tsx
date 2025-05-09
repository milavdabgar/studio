"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserCircle, Mail, Phone, CalendarDays, Landmark, GraduationCap, Loader2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, User, Program, Batch } from '@/types/entities';
import { studentService } from '@/lib/api/students';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { format } from 'date-fns';
import Link from 'next/link';

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

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        // Assuming student ID is linked to user ID. This logic might need adjustment
        // based on how student profiles are fetched (e.g., by user ID or enrollment number).
        const allStudents = await studentService.getAllStudents(); 
        const studentProfile = allStudents.find(s => s.userId === user.id); // or s.email === user.email for initial link

        if (studentProfile) {
          setStudent(studentProfile);
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
        toast({ variant: "destructive", title: "Error", description: "Could not load profile data." });
      }
      setIsLoading(false);
    };
    fetchProfileData();
  }, [user, toast]);

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
    { icon: CalendarDays, label: "Date of Birth", value: student.dateOfBirth ? format(new Date(student.dateOfBirth), "PPP") : "N/A" },
    { icon: GraduationCap, label: "Program", value: program?.name || "N/A" },
    { icon: UsersIcon, label: "Batch", value: batch?.name || "N/A" },
    { icon: Landmark, label: "Current Semester", value: student.currentSemester.toString() },
  ];

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="items-center text-center">
          <Avatar className="w-24 h-24 mb-4 ring-2 ring-primary ring-offset-2">
            <AvatarImage src={user?.avatarUrl || `https://picsum.photos/seed/${student.id}/100/100`} alt={student.firstName || student.enrollmentNumber} data-ai-hint="student avatar" />
            <AvatarFallback>{(student.firstName?.[0] || 'S').toUpperCase()}{(student.lastName?.[0] || 'P').toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold text-primary">
            {student.firstName} {student.middleName} {student.lastName}
          </CardTitle>
          <CardDescription className="text-lg">{student.gtuName || student.enrollmentNumber}</CardDescription>
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
           <Button variant="outline" disabled>
            <Edit className="mr-2 h-4 w-4" /> Edit Profile (Coming Soon)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Placeholder for UsersIcon as it seems it's not imported or used in this component.
// If it's needed, it should be imported from lucide-react. For now, we can use a generic one.
const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);