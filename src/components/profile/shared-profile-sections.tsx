"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  GraduationCap,
  Briefcase,
  Code,
  Trophy,
  Award,
  Users,
  FileText,
  Globe,
  Heart,
  Building,
  BookOpen
} from "lucide-react";

import type { 
  EducationEntry, 
  ExperienceEntry, 
  ProjectEntry, 
  SkillEntry, 
  AchievementEntry, 
  CertificationEntry,
  PublicationEntry,
  LanguageEntry,
  VolunteerEntry,
  ProfessionalMembershipEntry,
  AwardEntry,
  ReferenceEntry,
  ProfessionalDevelopmentEntry
} from '@/types/entities';

// Shared Education Section Component
interface EducationSectionProps {
  education: EducationEntry[];
  onUpdate: (education: EducationEntry[]) => void;
  userType?: 'student' | 'faculty';
}

export const EducationSection: React.FC<EducationSectionProps> = ({ 
  education, 
  onUpdate, 
  userType = 'student' 
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

// Shared Experience Section Component
interface ExperienceSectionProps {
  experience: ExperienceEntry[];
  onUpdate: (experience: ExperienceEntry[]) => void;
  userType?: 'student' | 'faculty';
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ 
  experience, 
  onUpdate, 
  userType = 'student' 
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
            {userType === 'faculty' ? 'Professional Experience' : 'Work Experience'}
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
                  <Label htmlFor="company">{userType === 'faculty' ? 'Organization' : 'Company'}</Label>
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

// Shared Projects Section Component
interface ProjectsSectionProps {
  projects: ProjectEntry[];
  onUpdate: (projects: ProjectEntry[]) => void;
  userType?: 'student' | 'faculty';
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ 
  projects, 
  onUpdate, 
  userType = 'student' 
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
            {userType === 'faculty' ? 'Research Projects' : 'Projects'}
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
                <Label htmlFor="technologies">{userType === 'faculty' ? 'Research Areas/Technologies' : 'Technologies'} (comma-separated)</Label>
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

// Shared Skills Section Component
interface SkillsSectionProps {
  skills: SkillEntry[];
  onUpdate: (skills: SkillEntry[]) => void;
  userType?: 'student' | 'faculty';
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ 
  skills, 
  onUpdate, 
  userType = 'student' 
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
            Skills & Competencies
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

// Publications Section (primarily for faculty)
interface PublicationsSectionProps {
  publications: PublicationEntry[];
  onUpdate: (publications: PublicationEntry[]) => void;
  userType?: 'student' | 'faculty';
}

export const PublicationsSection: React.FC<PublicationsSectionProps> = ({ 
  publications, 
  onUpdate, 
  userType = 'faculty' 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<PublicationEntry>({
    id: '',
    title: '',
    type: 'journal',
    authors: [],
    publicationDate: '',
    venue: '',
    description: '',
    doi: '',
    url: '',
    order: 0
  });

  const handleAdd = () => {
    setFormData({
      id: Date.now().toString(),
      title: '',
      type: 'journal',
      authors: [],
      publicationDate: '',
      venue: '',
      description: '',
      doi: '',
      url: '',
      order: publications.length
    });
    setEditingIndex(null);
    setIsEditing(true);
  };

  const handleEdit = (index: number) => {
    setFormData(publications[index]);
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedPublications = [...publications];
    if (editingIndex !== null) {
      updatedPublications[editingIndex] = formData;
    } else {
      updatedPublications.push(formData);
    }
    onUpdate(updatedPublications);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const updatedPublications = publications.filter((_, i) => i !== index);
    onUpdate(updatedPublications);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Publications & Research
          </CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Publication
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {publications.map((publication, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{publication.title}</h4>
                  <p className="text-sm text-gray-600">{publication.authors.join(', ')}</p>
                  <p className="text-sm text-gray-500">
                    {publication.venue} • {publication.publicationDate}
                  </p>
                  {publication.description && (
                    <p className="text-sm text-gray-600 mt-1">{publication.description}</p>
                  )}
                  <Badge variant="outline" className="mt-2 text-xs">
                    {publication.type}
                  </Badge>
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
                {editingIndex !== null ? 'Edit Publication' : 'Add Publication'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({...formData, type: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="journal">Journal Article</SelectItem>
                      <SelectItem value="conference">Conference Paper</SelectItem>
                      <SelectItem value="book">Book</SelectItem>
                      <SelectItem value="chapter">Book Chapter</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="thesis">Thesis</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="publicationDate">Publication Date</Label>
                  <Input
                    id="publicationDate"
                    type="date"
                    value={formData.publicationDate}
                    onChange={(e) => setFormData({...formData, publicationDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => setFormData({...formData, venue: e.target.value})}
                    placeholder="Journal/Conference name"
                  />
                </div>
                <div>
                  <Label htmlFor="doi">DOI</Label>
                  <Input
                    id="doi"
                    value={formData.doi}
                    onChange={(e) => setFormData({...formData, doi: e.target.value})}
                    placeholder="10.1000/182"
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="authors">Authors (comma-separated)</Label>
                <Input
                  id="authors"
                  value={formData.authors.join(', ')}
                  onChange={(e) => setFormData({...formData, authors: e.target.value.split(',').map(a => a.trim()).filter(a => a)})}
                  placeholder="First Author, Second Author, Third Author"
                />
              </div>
              <div>
                <Label htmlFor="description">Abstract/Description</Label>
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