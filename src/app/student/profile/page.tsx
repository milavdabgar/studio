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
  Camera,
  Upload,
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
import StudentDownloadButtons from '@/components/student-download-buttons';
import PasswordChangeForm from '@/components/password-change-form';
import { StudentBasicInfoForm } from '@/components/profile/student-basic-info-form';
import { 
  VolunteerSection, 
  ProfessionalMembershipsSection, 
  AwardsSection, 
  CertificationsSection 
} from '@/components/profile/additional-profile-sections';
import { ProfileCompleteness } from '@/components/profile/profile-completeness';
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

const ExperienceSection = ({ 
  experience, 
  onUpdate 
}: { 
  experience: ExperienceEntry[], 
  onUpdate: (experience: ExperienceEntry[]) => void 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ExperienceEntry>({
    id: '',
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrently: false,
    description: '',
    responsibilities: [],
    achievements: [],
    skills: [],
    order: 0
  });

  const handleAdd = () => {
    setFormData({
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrently: false,
      description: '',
      responsibilities: [],
      achievements: [],
      skills: [],
      order: experience.length
    });
    setEditingIndex(null);
    setIsEditing(true);
  };

  const handleEdit = (index: number) => {
    setFormData(experience[index]);
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedExperience = [...experience];
    if (editingIndex !== null) {
      updatedExperience[editingIndex] = formData;
    } else {
      updatedExperience.push(formData);
    }
    onUpdate(updatedExperience);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const updatedExperience = experience.filter((_, i) => i !== index);
    onUpdate(updatedExperience);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Experience
          </CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Experience
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {experience.map((exp, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{exp.position}</h4>
                  <p className="text-sm text-gray-600">{exp.company}</p>
                  <p className="text-sm text-gray-500">
                    {exp.startDate} - {exp.isCurrently ? 'Present' : exp.endDate}
                    {exp.location && <span className="ml-2">• {exp.location}</span>}
                  </p>
                  {exp.description && (
                    <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
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
                {editingIndex !== null ? 'Edit Experience' : 'Add Experience'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
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
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isCurrently"
                    checked={formData.isCurrently}
                    onChange={(e) => setFormData({...formData, isCurrently: e.target.checked})}
                  />
                  <Label htmlFor="isCurrently">Currently working here</Label>
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

const ProjectsSection = ({ 
  projects, 
  onUpdate 
}: { 
  projects: ProjectEntry[], 
  onUpdate: (projects: ProjectEntry[]) => void 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProjectEntry>({
    id: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    isOngoing: false,
    technologies: [],
    role: '',
    teamSize: 1,
    projectUrl: '',
    githubUrl: '',
    images: [],
    achievements: [],
    order: 0
  });

  const handleAdd = () => {
    setFormData({
      id: Date.now().toString(),
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      isOngoing: false,
      technologies: [],
      role: '',
      teamSize: 1,
      projectUrl: '',
      githubUrl: '',
      images: [],
      achievements: [],
      order: projects.length
    });
    setEditingIndex(null);
    setIsEditing(true);
  };

  const handleEdit = (index: number) => {
    setFormData(projects[index]);
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedProjects = [...projects];
    if (editingIndex !== null) {
      updatedProjects[editingIndex] = formData;
    } else {
      updatedProjects.push(formData);
    }
    onUpdate(updatedProjects);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const updatedProjects = projects.filter((_, i) => i !== index);
    onUpdate(updatedProjects);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Projects
          </CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{project.title}</h4>
                  <p className="text-sm text-gray-600">{project.description}</p>
                  <p className="text-sm text-gray-500">
                    {project.startDate} - {project.isOngoing ? 'Present' : project.endDate}
                    {project.role && <span className="ml-2">• {project.role}</span>}
                  </p>
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.technologies.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
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
                {editingIndex !== null ? 'Edit Project' : 'Add Project'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Your Role</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
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
                    disabled={formData.isOngoing}
                  />
                </div>
                <div>
                  <Label htmlFor="teamSize">Team Size</Label>
                  <Input
                    id="teamSize"
                    type="number"
                    value={formData.teamSize}
                    onChange={(e) => setFormData({...formData, teamSize: parseInt(e.target.value)})}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isOngoing"
                    checked={formData.isOngoing}
                    onChange={(e) => setFormData({...formData, isOngoing: e.target.checked})}
                  />
                  <Label htmlFor="isOngoing">Currently working on this</Label>
                </div>
                <div>
                  <Label htmlFor="projectUrl">Project URL</Label>
                  <Input
                    id="projectUrl"
                    type="url"
                    value={formData.projectUrl}
                    onChange={(e) => setFormData({...formData, projectUrl: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="githubUrl">GitHub URL</Label>
                  <Input
                    id="githubUrl"
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
                  />
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
              <div>
                <Label htmlFor="technologies">Technologies (comma-separated)</Label>
                <Input
                  id="technologies"
                  value={formData.technologies?.join(', ') || ''}
                  onChange={(e) => setFormData({...formData, technologies: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                  placeholder="React, Node.js, MongoDB"
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

const AchievementsSection = ({ 
  achievements, 
  onUpdate 
}: { 
  achievements: AchievementEntry[], 
  onUpdate: (achievements: AchievementEntry[]) => void 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<AchievementEntry>({
    id: '',
    title: '',
    description: '',
    date: '',
    issuer: '',
    category: 'academic',
    certificateUrl: '',
    order: 0
  });

  const handleAdd = () => {
    setFormData({
      id: Date.now().toString(),
      title: '',
      description: '',
      date: '',
      issuer: '',
      category: 'academic',
      certificateUrl: '',
      order: achievements.length
    });
    setEditingIndex(null);
    setIsEditing(true);
  };

  const handleEdit = (index: number) => {
    setFormData(achievements[index]);
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedAchievements = [...achievements];
    if (editingIndex !== null) {
      updatedAchievements[editingIndex] = formData;
    } else {
      updatedAchievements.push(formData);
    }
    onUpdate(updatedAchievements);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const updatedAchievements = achievements.filter((_, i) => i !== index);
    onUpdate(updatedAchievements);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements & Awards
          </CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Achievement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {achievements.map((achievement, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{achievement.title}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  <p className="text-sm text-gray-500">
                    {achievement.date}
                    {achievement.issuer && <span className="ml-2">• {achievement.issuer}</span>}
                  </p>
                  {achievement.category && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {achievement.category}
                    </Badge>
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
                {editingIndex !== null ? 'Edit Achievement' : 'Add Achievement'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Achievement Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="issuer">Issuer/Organization</Label>
                  <Input
                    id="issuer"
                    value={formData.issuer}
                    onChange={(e) => setFormData({...formData, issuer: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
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
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                      <SelectItem value="competition">Competition</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="certificateUrl">Certificate URL (optional)</Label>
                  <Input
                    id="certificateUrl"
                    type="url"
                    value={formData.certificateUrl}
                    onChange={(e) => setFormData({...formData, certificateUrl: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  placeholder="Describe your achievement and its significance..."
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
                className="cursor-pointer pr-16"
              >
                {skill.name} ({skill.proficiency})
                <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex gap-1">
                  <button 
                    onClick={() => handleEdit(index)}
                    className="hover:bg-white/20 rounded p-0.5"
                    title="Edit skill"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={() => handleDelete(index)}
                    className="hover:bg-white/20 rounded p-0.5"
                    title="Delete skill"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
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

export default function StudentProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();

  // Profile Summary State
  const [profileSummary, setProfileSummary] = useState('');
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private' | 'institute_only'>('public');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // Current Semester Edit State
  const [isEditingSemester, setIsEditingSemester] = useState(false);
  const [editingSemester, setEditingSemester] = useState<number>(1);

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    console.log('🍪 Raw auth_user cookie:', authUserCookie);
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        console.log('🔓 Decoded cookie:', decodedCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        console.log('👤 Parsed user from cookie:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse auth_user cookie:', error);
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    } else {
        console.warn('❌ No auth_user cookie found');
    }
  }, [toast]);

  const fetchProfileData = useCallback(async () => {
    console.log('🔍 fetchProfileData called with user:', user);
    console.log('📋 user.id:', user?.id);
    console.log('📧 user.email:', user?.email);
    if (!user?.id && !user?.email) {
      console.warn('❌ Early return: user or user.id/email is missing');
      return;
    }
    setIsLoading(true);
    try {
      console.log('📡 Fetching all students...');
      const allStudents = await studentService.getAllStudents(); 
      console.log('👥 All students count:', allStudents.length);
      
      // First try to find by userId (database User ID)
      console.log('🔍 Looking for student with userId:', user.id);
      let studentProfile = allStudents.find(s => s.userId === user.id);
      console.log('👤 Found student profile by userId:', studentProfile);
      
      // If not found by userId, try to find by email as fallback
      if (!studentProfile && user.email) {
        console.log('🔄 Fallback: Looking for student with email:', user.email);
        studentProfile = allStudents.find(s => 
          s.instituteEmail === user.email || 
          s.personalEmail === user.email
        );
        console.log('👤 Found student profile by email:', studentProfile);
        
        // If found by email, log the ID mismatch for debugging
        if (studentProfile) {
          console.warn('⚠️ ID MISMATCH DETECTED:');
          console.warn('   Cookie user.id:', user.id);
          console.warn('   Student userId:', studentProfile.userId);
          console.warn('   Match found by email:', user.email);
        }
      }

      if (studentProfile) {
        console.log('📊 Retrieved student profile:', studentProfile);
        console.log('🛠️ Skills in profile:', studentProfile.skills);
        
        setStudent(studentProfile);
        setProfileSummary(studentProfile.profileSummary || '');
        setProfileVisibility(studentProfile.profileVisibility || 'public');
        setEditingSemester(studentProfile.currentSemester || 1);

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
      console.log('🔄 Updating profile with:', updates);
      console.log('📝 Student ID:', student.id);
      
      const updatedStudent = await studentService.updateStudent(student.id, updates);
      console.log('✅ Server response:', updatedStudent);
      
      setStudent(prev => prev ? { ...prev, ...updates } : null);
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

  const handleUpdateAchievements = (achievements: AchievementEntry[]) => {
    handleUpdateProfile({ achievements });
  };

  const handleUpdateVolunteerWork = (volunteerWork: any[]) => {
    handleUpdateProfile({ volunteerWork });
  };

  const handleUpdateProfessionalMemberships = (professionalMemberships: any[]) => {
    handleUpdateProfile({ professionalMemberships });
  };

  const handleUpdateAwards = (awards: any[]) => {
    handleUpdateProfile({ awards });
  };

  const handleUpdateCertifications = (certifications: any[]) => {
    handleUpdateProfile({ certifications });
  };

  const handleUpdateProfileSummary = () => {
    handleUpdateProfile({ profileSummary, profileVisibility });
  };

  const handleSemesterEdit = () => {
    setIsEditingSemester(true);
  };

  const handleSemesterSave = async () => {
    if (editingSemester < 1 || editingSemester > 6) {
      toast({ variant: "destructive", title: "Invalid Semester", description: "Please select a semester between 1 and 6." });
      return;
    }
    
    await handleUpdateProfile({ currentSemester: editingSemester });
    setIsEditingSemester(false);
  };

  const handleSemesterCancel = () => {
    setEditingSemester(student?.currentSemester || 1);
    setIsEditingSemester(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !student) return;

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
      formData.append('studentId', student.id);

      // Upload to server
      const response = await fetch('/api/students/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const { photoURL } = await response.json();
      
      // Update student profile with new photo URL
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
    if (!student) return '';
    return `${window.location.origin}/students/${student.enrollmentNumber}`;
  };

  const handleGenerateResume = async (format: 'pdf' | 'pdf-latex' | 'docx' | 'html' | 'txt' | 'biodata' | 'resume' | 'cv' | 'biodata-html' | 'resume-html' | 'cv-html' | 'latex' | 'biodata-latex' | 'resume-latex' | 'cv-latex') => {
    if (!student || !user) {
      toast({ variant: "destructive", title: "Error", description: "Student data not available." });
      return;
    }

    setIsGeneratingResume(true);
    try {
      const response = await fetch(`/api/students/${student.id}/resume?format=${format}`, {
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
      let filename = `${student.firstName || 'Student'}_${format.toUpperCase()}.${format === 'docx' ? 'docx' : format === 'html' ? 'html' : format === 'txt' ? 'txt' : 'pdf'}`;
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
        title: "Document Generated", 
        description: `Your ${format.toUpperCase()} has been generated and downloaded.` 
      });

    } catch (error) {
      console.error('Error generating document:', error);
      toast({ 
        variant: "destructive", 
        title: "Generation Failed", 
        description: error instanceof Error ? error.message : "Could not generate document." 
      });
    } finally {
      setIsGeneratingResume(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!student) {
    return <div className="text-center py-10">Student profile not found. Please contact administration.</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header - Mobile Optimized */}
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Student Profile</CardTitle>
              <CardDescription className="text-sm sm:text-base mt-1">
                Manage your comprehensive profile with academic information, skills, projects, and more
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild variant="outline" size="sm" className="text-xs sm:text-sm">
                <Link href={getPublicProfileUrl()} target="_blank">
                  <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Public View
                </Link>
              </Button>
              <StudentDownloadButtons 
                onDownload={handleGenerateResume}
                isLoading={isGeneratingResume}
                variant="default"
                size="sm"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Management Tabs - Mobile Optimized */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="basic" className="text-xs sm:text-sm py-2 sm:py-3">
            <span className="hidden sm:inline">Basic Info</span>
            <span className="sm:hidden">Basic</span>
          </TabsTrigger>
          <TabsTrigger value="academics" className="text-xs sm:text-sm py-2 sm:py-3">
            <span className="hidden sm:inline">Academics</span>
            <span className="sm:hidden">Academic</span>
          </TabsTrigger>
          <TabsTrigger value="professional" className="text-xs sm:text-sm py-2 sm:py-3">
            <span className="hidden sm:inline">Professional</span>
            <span className="sm:hidden">Pro</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm py-2 sm:py-3">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Profile Header - Mobile Optimized */}
          <Card className="shadow-xl">
            <CardHeader className="items-center text-center pb-4 sm:pb-6">
              <div className="relative">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 mb-3 sm:mb-4 ring-2 ring-primary ring-offset-2">
                  <AvatarImage src={student.photoURL || `https://picsum.photos/seed/${student.id}/100/100`} alt={student.firstName || student.enrollmentNumber} />
                  <AvatarFallback>{(student.firstName?.[0] || 'S').toUpperCase()}{(student.lastName?.[0] || 'P').toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                      <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </label>
                </div>
              </div>
              <CardTitle className="text-xl sm:text-3xl font-bold text-primary text-center">
                {student.firstName} {student.middleName} {student.lastName}
              </CardTitle>
              <CardDescription className="text-sm sm:text-lg">{student.enrollmentNumber}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-x-8 sm:gap-y-4 px-4 sm:px-6 md:px-10">
              <div className="flex items-start space-x-2 sm:space-x-3 py-2 sm:py-3 border-b border-muted last:border-b-0">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Institute Email</p>
                  <p className="text-sm sm:text-base text-foreground truncate">{student.instituteEmail}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3 py-2 sm:py-3 border-b border-muted last:border-b-0">
                <UserCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Enrollment No.</p>
                  <p className="text-sm sm:text-base text-foreground">{student.enrollmentNumber}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3 py-2 sm:py-3 border-b border-muted last:border-b-0">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Program</p>
                  <p className="text-sm sm:text-base text-foreground truncate">{program?.name || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3 py-2 sm:py-3 border-b border-muted last:border-b-0">
                <Landmark className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Current Semester</p>
                  {isEditingSemester ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                      <Select 
                        value={String(editingSemester)} 
                        onValueChange={(value) => setEditingSemester(parseInt(value))}
                      >
                        <SelectTrigger className="w-full sm:w-32 h-8 text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6].map(sem => (
                            <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button size="sm" onClick={handleSemesterSave} className="flex-1 sm:flex-none text-xs sm:text-sm">
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleSemesterCancel} className="flex-1 sm:flex-none text-xs sm:text-sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm sm:text-base text-foreground">Semester {student.currentSemester}</p>
                      <Button size="sm" variant="ghost" onClick={handleSemesterEdit}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Basic Information Form */}
          <StudentBasicInfoForm 
            student={student}
            onUpdate={handleUpdateProfile}
          />

          {/* Profile Completeness */}
          <ProfileCompleteness 
            profile={student}
            userType="student"
          />

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
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                  <span className="block sm:inline">Public URL: </span>
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs break-all">{getPublicProfileUrl()}</code>
                </div>
                <Button onClick={handleUpdateProfileSummary} size="sm" className="order-1 sm:order-2 w-full sm:w-auto">
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-xs sm:text-sm">Save Changes</span>
                </Button>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="academics" className="space-y-6">
          <EducationSection 
            education={student.education || []} 
            onUpdate={handleUpdateEducation}
          />
          <SkillsSection 
            skills={student.skills || []} 
            onUpdate={handleUpdateSkills}
          />
          <AchievementsSection 
            achievements={student.achievements || []} 
            onUpdate={handleUpdateAchievements}
          />
          <CertificationsSection 
            certifications={student.certifications || []} 
            onUpdate={handleUpdateCertifications}
          />
        </TabsContent>

        <TabsContent value="professional" className="space-y-6">
          <ExperienceSection 
            experience={student.experience || []} 
            onUpdate={handleUpdateExperience}
          />
          <ProjectsSection 
            projects={student.projects || []} 
            onUpdate={handleUpdateProjects}
          />
          <VolunteerSection 
            volunteerWork={student.volunteerWork || []} 
            onUpdate={handleUpdateVolunteerWork}
          />
          <ProfessionalMembershipsSection 
            memberships={student.professionalMemberships || []} 
            onUpdate={handleUpdateProfessionalMemberships}
          />
          <AwardsSection 
            awards={student.awards || []} 
            onUpdate={handleUpdateAwards}
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