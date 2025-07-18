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
    if (!user?.id) {
      console.warn('❌ Early return: user or user.id is missing');
      return;
    }
    setIsLoading(true);
    try {
      console.log('📡 Fetching all students...');
      const allStudents = await studentService.getAllStudents(); 
      console.log('👥 All students count:', allStudents.length);
      console.log('🔍 Looking for student with userId:', user.id);
      const studentProfile = allStudents.find(s => s.userId === user.id);
      console.log('👤 Found student profile:', studentProfile);

      if (studentProfile) {
        console.log('📊 Retrieved student profile:', studentProfile);
        console.log('🛠️ Skills in profile:', studentProfile.skills);
        
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

  const handleUpdateProfileSummary = () => {
    handleUpdateProfile({ profileSummary, profileVisibility });
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

  const handleGenerateResume = async (format: 'pdf' | 'pdf-latex' | 'docx' | 'html' | 'txt' | 'biodata' | 'resume' | 'cv' | 'biodata-html' | 'resume-html' | 'cv-html') => {
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
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Student Profile</CardTitle>
              <CardDescription>
                Manage your comprehensive profile with academic information, skills, projects, and more
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={getPublicProfileUrl()} target="_blank">
                  <Globe className="h-4 w-4 mr-2" />
                  Public View
                </Link>
              </Button>
              <StudentDownloadButtons 
                onDownload={handleGenerateResume}
                isLoading={isGeneratingResume}
                variant="default"
                size="default"
              />
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
          {/* Profile Header */}
          <Card className="shadow-xl">
            <CardHeader className="items-center text-center">
              <div className="relative">
                <Avatar className="w-24 h-24 mb-4 ring-2 ring-primary ring-offset-2">
                  <AvatarImage src={student.photoURL || `https://picsum.photos/seed/${student.id}/100/100`} alt={student.firstName || student.enrollmentNumber} />
                  <AvatarFallback>{(student.firstName?.[0] || 'S').toUpperCase()}{(student.lastName?.[0] || 'P').toUpperCase()}</AvatarFallback>
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
              <CardTitle className="text-3xl font-bold text-primary">
                {student.firstName} {student.middleName} {student.lastName}
              </CardTitle>
              <CardDescription className="text-lg">{student.enrollmentNumber}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-4 px-6 md:px-10">
              <div className="flex items-start space-x-3 py-2 border-b border-muted last:border-b-0">
                <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Institute Email</p>
                  <p className="text-md text-foreground">{student.instituteEmail}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 py-2 border-b border-muted last:border-b-0">
                <UserCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Enrollment No.</p>
                  <p className="text-md text-foreground">{student.enrollmentNumber}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 py-2 border-b border-muted last:border-b-0">
                <GraduationCap className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Program</p>
                  <p className="text-md text-foreground">{program?.name || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 py-2 border-b border-muted last:border-b-0">
                <Landmark className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Semester</p>
                  <p className="text-md text-foreground">{student.currentSemester}</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
          <ExperienceSection 
            experience={student.experience || []} 
            onUpdate={handleUpdateExperience}
          />
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <ProjectsSection 
            projects={student.projects || []} 
            onUpdate={handleUpdateProjects}
          />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <AchievementsSection 
            achievements={student.achievements || []} 
            onUpdate={handleUpdateAchievements}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}