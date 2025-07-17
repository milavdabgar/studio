"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserCircle, Mail, Phone, CalendarDays, Briefcase, Edit, Loader2, Building, Star, Download, FileText, FileCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Faculty } from '@/types/entities';
import { facultyService } from '@/lib/api/faculty';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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

export default function FacultyProfilePage() {
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch {
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
        const allFaculty = await facultyService.getAllFaculty();
        const facultyProfile = allFaculty.find(f => f.userId === user.id); 

        if (facultyProfile) {
          setFaculty(facultyProfile);
        } else {
          toast({ variant: "destructive", title: "Profile Not Found", description: "Could not find your faculty profile." });
        }
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not load profile data." });
      }
      setIsLoading(false);
    };
    fetchProfileData();
  }, [user, toast]);

  const handleGenerateResume = async (format: 'pdf' | 'pdf-latex' | 'docx' | 'html' | 'txt') => {
    if (!faculty || !user) {
      toast({ variant: "destructive", title: "Error", description: "Faculty data not available." });
      return;
    }

    setIsGeneratingResume(true);
    
    try {
      const response = await fetch(`/api/faculty/${faculty.id}/resume?format=${format}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate resume');
      }

      // Get the filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${faculty.firstName || 'Faculty'}_Resume.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]*)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ 
        title: "Resume Generated", 
        description: `Your resume has been generated and downloaded as ${format.toUpperCase()}.` 
      });

    } catch (error) {
      console.error('Error generating resume:', error);
      toast({ 
        variant: "destructive", 
        title: "Generation Failed", 
        description: error instanceof Error ? error.message : "Could not generate resume." 
      });
    } finally {
      setIsGeneratingResume(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!faculty) {
    return <div className="text-center py-10">Faculty profile not found. Please contact administration.</div>;
  }
  
  const fullName = [faculty.title, faculty.firstName, faculty.middleName, faculty.lastName].filter(Boolean).join(' ') || faculty.gtuName || faculty.staffCode;

  const profileItems = [
    { icon: Briefcase, label: "Staff Code", value: faculty.staffCode },
    { icon: Mail, label: "Institute Email", value: faculty.instituteEmail },
    { icon: Mail, label: "Personal Email", value: faculty.personalEmail || "N/A" },
    { icon: Phone, label: "Contact", value: faculty.contactNumber || "N/A" },
    { icon: Building, label: "Department", value: faculty.department },
    { icon: Star, label: "Designation", value: faculty.designation || "N/A" },
    { icon: UserCircle, label: "Job Type", value: faculty.jobType || "N/A" },
    { icon: CalendarDays, label: "Date of Birth", value: faculty.dateOfBirth ? format(new Date(faculty.dateOfBirth), "PPP") : "N/A" },
    { icon: CalendarDays, label: "Joining Date", value: faculty.joiningDate ? format(new Date(faculty.joiningDate), "PPP") : "N/A" },
    { icon: UserCircle, label: "Gender", value: faculty.gender || "N/A" },
    { icon: UserCircle, label: "Marital Status", value: faculty.maritalStatus || "N/A" },
    { icon: Briefcase, label: "Aadhar No.", value: faculty.aadharNumber ? `${faculty.aadharNumber.substring(0,4)}********` : "N/A"},
    { icon: Briefcase, label: "PAN Card No.", value: faculty.panCardNumber || "N/A"},
    { icon: Briefcase, label: "GPF/NPS No.", value: faculty.gpfNpsNumber || "N/A"},
  ];


  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Faculty Profile</h1>
        <p className="text-muted-foreground">View and manage your faculty profile information</p>
      </div>
      <Card className="shadow-xl" data-testid="faculty-profile-card">
        <CardHeader className="items-center text-center">
          <Avatar className="w-24 h-24 mb-4 ring-2 ring-primary ring-offset-2">
            <AvatarImage src={`https://picsum.photos/seed/${faculty.id}/100/100`} alt={fullName} data-ai-hint="faculty avatar" />
            <AvatarFallback>{(faculty.firstName?.[0] || 'F').toUpperCase()}{(faculty.lastName?.[0] || 'M').toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold text-primary">{fullName}</CardTitle>
          <CardDescription className="text-lg">{faculty.designation || faculty.jobType}</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-4 px-6 md:px-10">
           {profileItems.map((item, index) => (
            <div key={index} className="flex items-start space-x-3 py-2 border-b border-muted last:border-b-0 md:last:border-b dark:border-gray-700">
              <item.icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <p className="text-md text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
           {faculty.qualifications && faculty.qualifications.length > 0 && (
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-semibold mb-2 text-primary">Qualifications</h3>
              <ul className="space-y-1 list-disc list-inside">
                {faculty.qualifications.map((q, i) => (
                  <li key={i} className="text-sm">{q.degree} in {q.field} from {q.institution} ({q.year})</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
         <CardFooter className="justify-center pt-6 gap-4">
           <Button variant="outline" disabled>
            <Edit className="mr-2 h-4 w-4" /> Edit Profile (Coming Soon)
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isGeneratingResume}>
                {isGeneratingResume ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Generate Resume
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleGenerateResume('pdf')}>
                <FileText className="mr-2 h-4 w-4" />
                Download as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateResume('pdf-latex')}>
                <FileText className="mr-2 h-4 w-4" />
                Download as PDF LaTeX
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateResume('docx')}>
                <FileCheck className="mr-2 h-4 w-4" />
                Download as DOCX
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateResume('html')}>
                <FileText className="mr-2 h-4 w-4" />
                Download as HTML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateResume('txt')}>
                <FileText className="mr-2 h-4 w-4" />
                Download as TXT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
    </div>
  );
}