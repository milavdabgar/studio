// src/components/admin/project-fair/ProjectForm.tsx
"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Removed DialogClose import
import { Loader2, Save, XCircle} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Project, Department, ProjectTeam, User as FacultyUser, ProjectStatus, ProjectRequirements, ProjectGuide } from '@/types/entities';
import { projectService } from '@/lib/api/projects';
import { departmentService } from '@/lib/api/departments';
import { projectTeamService } from '@/lib/api/projectTeams';
import { userService } from '@/lib/api/users';

interface ProjectFormProps {
  eventId: string;
  existingProject?: Project | null;
  onProjectSaved: (project: Project) => void;
  onCancel: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const PROJECT_CATEGORIES = ["IoT & Smart Systems", "Software Development", "Hardware Project", "Sustainable Technology", "Industry Problem Solution", "Research & Innovation", "Other"];
const PROJECT_STATUS_OPTIONS: ProjectStatus[] = ['draft', 'submitted', 'approved', 'rejected', 'completed', 'evaluated'];

const ProjectForm: React.FC<ProjectFormProps> = ({
  eventId,
  existingProject,
  onProjectSaved,
  onCancel,
  isOpen,
  setIsOpen,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize state with empty strings for potentially undefined fields
  const [title, setTitle] = useState(existingProject?.title || '');
  const [category, setCategory] = useState(existingProject?.category || PROJECT_CATEGORIES[0]);
  const [abstract, setAbstract] = useState(existingProject?.abstract || '');
  const [departmentId, setDepartmentId] = useState(existingProject?.department || '');
  const [status, setStatus] = useState<ProjectStatus>(existingProject?.status || 'draft');
  const [requirements, setRequirements] = useState<ProjectRequirements>(
    existingProject?.requirements 
      ? {
          power: existingProject.requirements.power || false,
          internet: existingProject.requirements.internet || false,
          specialSpace: existingProject.requirements.specialSpace || false,
          otherRequirements: existingProject.requirements.otherRequirements || '',
        }
      : { power: false, internet: false, specialSpace: false, otherRequirements: '' }
  );
  const [guide, setGuide] = useState<ProjectGuide>(
    existingProject?.guide 
      ? {
          userId: existingProject.guide.userId || '',
          name: existingProject.guide.name || '',
          department: existingProject.guide.department || '',
          contactNumber: existingProject.guide.contactNumber || '',
        }
      : { userId: '', name: '', department: '', contactNumber: '' }
  );
  const [teamId, setTeamId] = useState(existingProject?.teamId || '');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<ProjectTeam[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyUser[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptData, teamDataResponse, facultyData] = await Promise.all([
          departmentService.getAllDepartments(),
          projectTeamService.getAllTeams({ eventId }), 
          userService.getAllUsers().then(users => users.filter(u => u.roles.includes('faculty') || u.roles.includes('hod'))),
        ]);
        setDepartments(deptData);
        setTeams(Array.isArray(teamDataResponse) ? teamDataResponse : []);
        setFacultyList(facultyData);

        // Set initial form values if not editing an existing project
        if (!existingProject) {
            if (deptData.length > 0 && !departmentId) setDepartmentId(deptData[0].id);
            if (facultyData.length > 0 && !guide.userId) {
                 setGuide(prev => ({ ...prev, userId: facultyData[0].id, name: facultyData[0].displayName, department: facultyData[0].departmentId || '' }));
            }
            if (teamDataResponse.length > 0 && !teamId) {
                 setTeamId(Array.isArray(teamDataResponse) ? teamDataResponse[0].id : '');
            }
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error loading form data", description: (error as Error).message });
      }
    };
    if (isOpen) {
        fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, isOpen, toast, existingProject]); // Removed departmentId, guide.userId, teamId from deps as they are set inside based on initial state

  useEffect(() => {
    if (existingProject) {
      setTitle(existingProject.title || '');
      setCategory(existingProject.category || PROJECT_CATEGORIES[0]);
      setAbstract(existingProject.abstract || '');
      setDepartmentId(existingProject.department || (departments.length > 0 ? departments[0].id : ''));
      setStatus(existingProject.status || 'draft');
      setRequirements(
        existingProject.requirements 
          ? {
              power: existingProject.requirements.power || false,
              internet: existingProject.requirements.internet || false,
              specialSpace: existingProject.requirements.specialSpace || false,
              otherRequirements: existingProject.requirements.otherRequirements || '',
            }
          : { power: false, internet: false, specialSpace: false, otherRequirements: '' }
      );
      setGuide(
        existingProject.guide 
          ? {
              userId: existingProject.guide.userId || '',
              name: existingProject.guide.name || '',
              department: existingProject.guide.department || '',
              contactNumber: existingProject.guide.contactNumber || '',
            }
          : { userId: (facultyList.length > 0 ? facultyList[0].id : ''), name: (facultyList.length > 0 ? facultyList[0].displayName : ''), department: (facultyList.length > 0 ? (facultyList[0].departmentId || '') : ''), contactNumber: '' }
      );
      setTeamId(existingProject.teamId || (teams.length > 0 ? teams[0].id : ''));
    } else {
      // Reset form for new project
      setTitle('');
      setCategory(PROJECT_CATEGORIES[0]);
      setAbstract('');
      setDepartmentId(departments.length > 0 ? departments[0].id : '');
      setStatus('draft');
      setRequirements({ power: false, internet: false, specialSpace: false, otherRequirements: '' });
      setGuide({ userId: (facultyList.length > 0 ? facultyList[0].id : ''), name: (facultyList.length > 0 ? facultyList[0].displayName : ''), department: (facultyList.length > 0 ? (facultyList[0].departmentId || '') : ''), contactNumber: '' });
      setTeamId(teams.length > 0 ? teams[0].id : '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingProject, departments, facultyList, teams, isOpen]); // Added isOpen to re-init form when dialog opens

  const handleGuideChange = (facultyId: string) => {
    const selectedFaculty = facultyList.find(f => f.id === facultyId);
    if (selectedFaculty) {
      setGuide({
        userId: selectedFaculty.id,
        name: selectedFaculty.displayName || '',
        department: selectedFaculty.departmentId || '',
        contactNumber: selectedFaculty.phoneNumber || ''
      });
    } else {
      setGuide({ userId: '', name: '', department: '', contactNumber: '' });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !category || !abstract || !departmentId || !teamId || !guide.userId) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fill all required fields." });
      return;
    }
    setIsSubmitting(true);

    const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
      title, category, abstract, department: departmentId, status, requirements, guide, teamId, eventId,
    };

    try {
      let savedProject: Project;
      if (existingProject && existingProject.id) {
        savedProject = await projectService.updateProject(existingProject.id, projectData);
      } else {
        savedProject = await projectService.createProject(projectData);
      }
      onProjectSaved(savedProject);
      toast({ title: "Success", description: `Project "${savedProject.title}" saved successfully.` });
      setIsOpen(false); 
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) onCancel(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{existingProject?.id ? "Edit Project" : "Add New Project"}</DialogTitle>
          <DialogDescription>
            {existingProject?.id ? "Modify the project details." : "Enter details for the new project."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2 overflow-y-auto flex-grow pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="projTitle">Project Title *</Label><Input id="projTitle" value={title} onChange={e => setTitle(e.target.value)} required disabled={isSubmitting} /></div>
            <div><Label htmlFor="projCategory">Category *</Label><Select value={category} onValueChange={setCategory} required disabled={isSubmitting}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROJECT_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><Label htmlFor="projAbstract">Abstract *</Label><Textarea id="projAbstract" value={abstract} onChange={e => setAbstract(e.target.value)} rows={3} required disabled={isSubmitting} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="projDepartment">Department *</Label><Select value={departmentId} onValueChange={setDepartmentId} required disabled={isSubmitting || departments.length === 0}><SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="projTeam">Team *</Label><Select value={teamId} onValueChange={setTeamId} required disabled={isSubmitting || teams.length === 0}><SelectTrigger><SelectValue placeholder="Select Team" /></SelectTrigger><SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="projGuide">Guide *</Label><Select value={guide.userId} onValueChange={handleGuideChange} required disabled={isSubmitting || facultyList.length === 0}><SelectTrigger><SelectValue placeholder="Select Guide" /></SelectTrigger><SelectContent>{facultyList.map(f => <SelectItem key={f.id} value={f.id}>{f.displayName}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="projGuideContact">Guide Contact</Label><Input id="projGuideContact" value={guide.contactNumber} onChange={e => setGuide(g => ({ ...g, contactNumber: e.target.value }))} disabled={isSubmitting} /></div>
          </div>
          
          <div className="space-y-2 border p-4 rounded-md bg-muted/30 dark:border-gray-700">
            <h4 className="text-sm font-medium">Requirements</h4>
            <div className="flex items-center space-x-2"><Switch id="reqPower" checked={requirements.power} onCheckedChange={c => setRequirements(r => ({...r, power:c}))} disabled={isSubmitting} /><Label htmlFor="reqPower">Power Outlet</Label></div>
            <div className="flex items-center space-x-2"><Switch id="reqInternet" checked={requirements.internet} onCheckedChange={c => setRequirements(r => ({...r, internet:c}))} disabled={isSubmitting} /><Label htmlFor="reqInternet">Internet Access</Label></div>
            <div className="flex items-center space-x-2"><Switch id="reqSpace" checked={requirements.specialSpace} onCheckedChange={c => setRequirements(r => ({...r, specialSpace:c}))} disabled={isSubmitting} /><Label htmlFor="reqSpace">Special Space</Label></div>
            <div><Label htmlFor="reqOther">Other Requirements</Label><Input id="reqOther" value={requirements.otherRequirements} onChange={e => setRequirements(r => ({...r, otherRequirements: e.target.value}))} disabled={isSubmitting} /></div>
          </div>
          
          <div><Label htmlFor="projStatus">Status *</Label><Select value={status} onValueChange={s => setStatus(s as ProjectStatus)} required disabled={isSubmitting}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROJECT_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div>

          <DialogFooter className="pt-4 border-t dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}><XCircle className="mr-2 h-4 w-4"/>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {existingProject?.id ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectForm;
    