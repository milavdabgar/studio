"use client";

import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
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
import { 
  UserCircle, 
  Mail, 
  Phone, 
  CalendarDays, 
  Landmark, 
  GraduationCap, 
  Loader2, 
  Edit, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  EyeOff, 
  Download, 
  FileText, 
  BookOpen,
  Briefcase,
  Code,
  Award,
  Globe,
  Star,
  Link as LinkIcon,
  Building,
  Users,
  Calendar,
  Trophy,
  FileCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { 
  Student, 
  Program, 
  Batch, 
  EducationEntry, 
  ExperienceEntry, 
  ProjectEntry, 
  SkillEntry, 
  AchievementEntry, 
  CertificationEntry, 
  PublicationEntry, 
  LanguageEntry 
} from '@/types/entities';
import { studentService } from '@/lib/api/students';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { format, parseISO, isValid } from 'date-fns';
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

// Section Components
const EducationSection = ({ 
  education, 
  onUpdate 
}: { 
  education: EducationEntry[], 
  onUpdate: (education: EducationEntry[]) => void 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<EducationEntry>({
    id: '',
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    isCurrently: false,
    grade: '',
    description: '',
    location: '',
    order: 0
  });

  const handleAdd = () => {
    setFormData({
      id: Date.now().toString(),
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      isCurrently: false,
      grade: '',
      description: '',
      location: '',
      order: education.length
    });
    setEditingIndex(null);
    setIsEditing(true);
  };

  const handleEdit = (index: number) => {
    setFormData(education[index]);
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedEducation = [...education];
    if (editingIndex !== null) {
      updatedEducation[editingIndex] = formData;
    } else {
      updatedEducation.push(formData);
    }
    onUpdate(updatedEducation);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const updatedEducation = education.filter((_, i) => i !== index);
    onUpdate(updatedEducation);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education
          </CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Education
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {education.map((edu, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{edu.degree}</h4>
                  <p className="text-sm text-gray-600">{edu.institution}</p>
                  <p className="text-sm text-gray-500">
                    {edu.startDate} - {edu.isCurrently ? 'Present' : edu.endDate}
                    {edu.grade && <span className="ml-2">• {edu.grade}</span>}
                  </p>
                  {edu.description && (
                    <p className="text-sm text-gray-600 mt-1">{edu.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(index)} size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => handleDelete(index)} size="sm" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? 'Edit Education' : 'Add Education'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="institution">Institution</Label>
                  <Input
                    id="institution"
                    value={formData.institution}
                    onChange={(e) => setFormData({...formData, institution: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="degree">Degree</Label>
                  <Input
                    id="degree"
                    value={formData.degree}
                    onChange={(e) => setFormData({...formData, degree: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="fieldOfStudy">Field of Study</Label>
                  <Input
                    id="fieldOfStudy"
                    value={formData.fieldOfStudy}
                    onChange={(e) => setFormData({...formData, fieldOfStudy: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    disabled={formData.isCurrently}
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade/Score</Label>
                  <Input
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isCurrently"
                    checked={formData.isCurrently}
                    onChange={(e) => setFormData({...formData, isCurrently: e.target.checked})}
                  />
                  <Label htmlFor="isCurrently">Currently studying</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

const SkillsSection = ({ 
  skills, 
  onUpdate 
}: { 
  skills: SkillEntry[], 
  onUpdate: (skills: SkillEntry[]) => void 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<SkillEntry>({
    id: '',
    name: '',
    category: 'technical',
    proficiency: 'beginner',
    order: 0
  });

  const handleAdd = () => {
    setFormData({
      id: Date.now().toString(),
      name: '',
      category: 'technical',
      proficiency: 'beginner',
      order: skills.length
    });
    setEditingIndex(null);
    setIsEditing(true);
  };

  const handleEdit = (index: number) => {
    setFormData(skills[index]);
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedSkills = [...skills];
    if (editingIndex !== null) {
      updatedSkills[editingIndex] = formData;
    } else {
      updatedSkills.push(formData);
    }
    onUpdate(updatedSkills);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    onUpdate(updatedSkills);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Skills
          </CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Skill
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill, index) => (
            <div key={index} className="group relative">
              <Badge 
                variant={skill.category === 'technical' ? 'default' : 'secondary'}
                className="cursor-pointer"
              >
                {skill.name} ({skill.proficiency})
                <button 
                  onClick={() => handleDelete(index)}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? 'Edit Skill' : 'Add Skill'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="skillName">Skill Name</Label>
                <Input
                  id="skillName"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({...formData, category: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="soft">Soft Skills</SelectItem>
                    <SelectItem value="language">Language</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="proficiency">Proficiency</Label>
                <Select 
                  value={formData.proficiency} 
                  onValueChange={(value) => setFormData({...formData, proficiency: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select proficiency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default function EnhancedProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();

  // Profile Summary State
  const [profileSummary, setProfileSummary] = useState('');
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private' | 'institute_only'>('public');

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse auth_user cookie:', error);
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    }
  }, [toast]);

  const fetchProfileData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const allStudents = await studentService.getAllStudents(); 
      const studentProfile = allStudents.find(s => s.userId === user.id);

      if (studentProfile) {
        setStudent(studentProfile);
        setProfileSummary(studentProfile.profileSummary || '');
        setProfileVisibility(studentProfile.profileVisibility || 'public');

        const [progData, batchData] = await Promise.all([
          studentProfile.programId ? programService.getProgramById(studentProfile.programId) : Promise.resolve(null),
          studentProfile.batchId ? batchService.getBatchById(studentProfile.batchId) : Promise.resolve(null)
        ]);
        setProgram(progData);
        setBatch(batchData);
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load profile data." });
    }
    setIsLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleUpdateProfile = async (updates: Partial<Student>) => {
    if (!student) return;
    
    try {
      await studentService.updateStudent(student.id, updates);
      setStudent(prev => prev ? { ...prev, ...updates } : null);
      toast({ title: "Profile Updated", description: "Your profile has been updated successfully." });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ variant: "destructive", title: "Update Failed", description: "Failed to update profile." });
    }
  };

  const handleUpdateEducation = (education: EducationEntry[]) => {
    handleUpdateProfile({ education });
  };

  const handleUpdateSkills = (skills: SkillEntry[]) => {
    handleUpdateProfile({ skills });
  };

  const handleUpdateProfileSummary = () => {
    handleUpdateProfile({ profileSummary, profileVisibility });
  };

  const getPublicProfileUrl = () => {
    if (!student) return '';
    return `${window.location.origin}/people/${student.enrollmentNumber}`;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!student) {
    return <div className="text-center py-10">Student profile not found. Please contact administration.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Enhanced Profile</CardTitle>
              <CardDescription>
                Create a comprehensive LinkedIn-like profile with all your information
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/student/profile">
                  <Eye className="h-4 w-4 mr-2" />
                  Basic Profile
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={getPublicProfileUrl()} target="_blank">
                  <Globe className="h-4 w-4 mr-2" />
                  Public View
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-6">
          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
              <CardDescription>
                Write a brief summary about yourself that will appear at the top of your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="profileSummary">About Me</Label>
                <Textarea
                  id="profileSummary"
                  value={profileSummary}
                  onChange={(e) => setProfileSummary(e.target.value)}
                  placeholder="Tell us about yourself, your goals, interests, and what makes you unique..."
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

        <TabsContent value="education" className="space-y-6">
          <EducationSection 
            education={student.education || []} 
            onUpdate={handleUpdateEducation}
          />
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <SkillsSection 
            skills={student.skills || []} 
            onUpdate={handleUpdateSkills}
          />
        </TabsContent>

        <TabsContent value="experience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work Experience
              </CardTitle>
              <CardDescription>
                Add your work experience, internships, and professional roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Experience section coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Projects
              </CardTitle>
              <CardDescription>
                Showcase your academic and personal projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Projects section coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Achievements & Awards
              </CardTitle>
              <CardDescription>
                Add your achievements, awards, and recognitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Achievements section coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}