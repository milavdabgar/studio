"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { UserCircle, Mail, Phone, CalendarDays, Briefcase, Edit, Loader2, Building, Star, Download, FileText, FileCheck, Globe, Save, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Faculty } from '@/types/entities';
import { facultyService } from '@/lib/api/faculty';
import PasswordChangeForm from '@/components/password-change-form';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  EducationSection, 
  ExperienceSection, 
  ProjectsSection, 
  SkillsSection, 
  PublicationsSection 
} from '@/components/profile/shared-profile-sections';
import { FacultyBasicInfoForm } from '@/components/profile/faculty-basic-info-form';
import { 
  AwardsSection, 
  CertificationsSection 
} from '@/components/profile/additional-profile-sections';
import { ProfileCompleteness } from '@/components/profile/profile-completeness';
import type { 
  EducationEntry, 
  ExperienceEntry, 
  ProjectEntry, 
  SkillEntry, 
  PublicationEntry 
} from '@/types/entities';
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

export default function FacultyProfilePage() {
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // Profile Summary State
  const [profileSummary, setProfileSummary] = useState('');
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private' | 'institute_only'>('public');
  
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

  const fetchProfileData = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    setIsLoading(true);
    try {
      const allFaculty = await facultyService.getAllFaculty();
      const facultyProfile = allFaculty.find(f => f.userId === user.id); 

      if (facultyProfile) {
        setFaculty(facultyProfile);
        setProfileSummary(facultyProfile.profileSummary || '');
        setProfileVisibility(facultyProfile.profileVisibility || 'public');
      } else {
        toast({ variant: "destructive", title: "Profile Not Found", description: "Could not find your faculty profile." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load profile data." });
    }
    setIsLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleUpdateProfile = async (updates: Partial<Faculty>) => {
    if (!faculty) return;
    
    try {
      console.log('🔄 Updating faculty profile with:', updates);
      console.log('📝 Faculty ID:', faculty.id);
      
      const updatedFaculty = await facultyService.updateFaculty(faculty.id, updates);
      console.log('✅ Server response:', updatedFaculty);
      
      setFaculty(prev => prev ? { ...prev, ...updates } : null);
      toast({ title: "Profile Updated", description: "Your profile has been updated successfully." });
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      toast({ variant: "destructive", title: "Update Failed", description: "Failed to update profile." });
    }
  };

  const handleUpdateEducation = (education: EducationEntry[]) => {
    handleUpdateProfile({ education });
  };

  const handleUpdateSkills = (skills: SkillEntry[]) => {
    handleUpdateProfile({ skills });
  };

  const handleUpdateExperience = (experience: ExperienceEntry[]) => {
    handleUpdateProfile({ experience });
  };

  const handleUpdateProjects = (projects: ProjectEntry[]) => {
    handleUpdateProfile({ projects });
  };

  const handleUpdatePublications = (publications: PublicationEntry[]) => {
    handleUpdateProfile({ publications });
  };

  const handleUpdateAwards = (awards: any[]) => {
    // Awards functionality removed - keeping handler for future implementation
    console.log('Awards update requested:', awards);
  };

  const handleUpdateCertifications = (certifications: any[]) => {
    handleUpdateProfile({ certifications });
  };

  const handleUpdateProfileSummary = () => {
    handleUpdateProfile({ profileSummary, profileVisibility });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !faculty) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "Error", description: "Please select an image file." });
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Error", description: "Image must be less than 2MB." });
      return;
    }

    setIsUploadingPhoto(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('facultyId', faculty.id);

      // Upload to server
      const response = await fetch('/api/faculty/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const { photoURL } = await response.json();
      
      // Update faculty profile with new photo URL
      await handleUpdateProfile({ photoURL });
      
      toast({ title: "Success", description: "Profile photo updated successfully!" });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to upload photo. Please try again." });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const getPublicProfileUrl = () => {
    if (!faculty) return '';
    return `${window.location.origin}/faculty/${faculty.staffCode}`;
  };

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
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Faculty Profile</CardTitle>
              <CardDescription>
                Manage your comprehensive faculty profile with academic information, research, publications, and more
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={getPublicProfileUrl()} target="_blank">
                  <Globe className="h-4 w-4 mr-2" />
                  Public View
                </Link>
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
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-6">
          {/* Profile Header */}
          <Card className="shadow-xl">
            <CardHeader className="items-center text-center">
              <div className="relative">
                <Avatar className="w-24 h-24 mb-4 ring-2 ring-primary ring-offset-2">
                  <AvatarImage src={faculty.photoURL || `https://picsum.photos/seed/${faculty.id}/100/100`} alt={fullName} />
                  <AvatarFallback>{(faculty.firstName?.[0] || 'F').toUpperCase()}{(faculty.lastName?.[0] || 'M').toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer inline-flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </label>
                </div>
              </div>
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
          </Card>

          {/* Enhanced Basic Information Form */}
          <FacultyBasicInfoForm 
            faculty={faculty}
            onUpdate={handleUpdateProfile}
          />

          {/* Profile Completeness */}
          <ProfileCompleteness 
            profile={faculty}
            userType="faculty"
          />

          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
              <CardDescription>
                Write a brief summary about yourself, your research interests, and expertise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="profileSummary">About Me</Label>
                <Textarea
                  id="profileSummary"
                  value={profileSummary}
                  onChange={(e) => setProfileSummary(e.target.value)}
                  placeholder="Tell us about your academic background, research interests, teaching philosophy, and what drives your work..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="visibility">Profile Visibility</Label>
                <Select value={profileVisibility} onValueChange={(value) => setProfileVisibility(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can view</SelectItem>
                    <SelectItem value="institute_only">Institute Only - Only institute members</SelectItem>
                    <SelectItem value="private">Private - Only you can view</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Public URL: <code className="bg-gray-100 px-2 py-1 rounded">{getPublicProfileUrl()}</code>
                </div>
                <Button onClick={handleUpdateProfileSummary}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="academics" className="space-y-6">
          <EducationSection 
            education={faculty.education || []} 
            onUpdate={handleUpdateEducation}
            userType="faculty"
          />
          <SkillsSection 
            skills={faculty.skills || []} 
            onUpdate={handleUpdateSkills}
            userType="faculty"
          />
          <CertificationsSection 
            certifications={faculty.certifications || []} 
            onUpdate={handleUpdateCertifications}
          />
          <AwardsSection 
            awards={[]} 
            onUpdate={handleUpdateAwards}
          />
        </TabsContent>

        <TabsContent value="research" className="space-y-6">
          <ExperienceSection 
            experience={faculty.experience || []} 
            onUpdate={handleUpdateExperience}
            userType="faculty"
          />
          <ProjectsSection 
            projects={faculty.projects || []} 
            onUpdate={handleUpdateProjects}
            userType="faculty"
          />
          <PublicationsSection 
            publications={faculty.publications || []} 
            onUpdate={handleUpdatePublications}
            userType="faculty"
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <PasswordChangeForm 
            userEmail={user?.email || ''} 
            variant="card"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}