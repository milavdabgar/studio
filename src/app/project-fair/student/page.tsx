
"use client";

import React, { useEffect, useState } from 'react';
import ProjectList, { Project as ProjectListProject } from './ProjectList';
import ProjectView from './ProjectView';
import { ChevronLeft, Users as UsersIconLucide} from 'lucide-react';
import { projectService } from '@/lib/api/projects';
import { projectTeamService } from '@/lib/api/projectTeams';
import { useToast } from '@/hooks/use-toast';
import type { Project as EntityProject, ProjectEvent, ProjectTeam as Team } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { userService } from '@/lib/api/users'; // To search for users to add

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string; 
}

interface TeamMemberFormData {
    userId: string;
    name: string;
    enrollmentNo: string;
    role: string;
}

const ProjectFairStudent: React.FC<{ event?: ProjectEvent }> = ({ event }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<UserCookie | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'my-projects'>('list');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [myProjects, setMyProjects] = useState<EntityProject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamMemberSearch, setTeamMemberSearch] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<{ id: string; displayName: string; email: string }[]>([]);
  const [newMemberFormData, setNewMemberFormData] = useState<TeamMemberFormData>({ userId: '', name: '', enrollmentNo: '', role: 'Member' });


  useEffect(() => {
    const authUserCookie = document.cookie.split('; ').find(row => row.startsWith('auth_user='));
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie.split('=')[1]);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch {
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    }
  }, [toast]);

  useEffect(() => {
    const fetchMyProjects = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const projectsData = await projectService.getMyProjects();
        setMyProjects(Array.isArray(projectsData) ? projectsData : []);
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch your projects." });
      } finally {
        setLoading(false);
      }
    };

    if (viewMode === 'my-projects') {
      fetchMyProjects();
    }
  }, [user, viewMode, toast]);

  const handleViewProject = (project: ProjectListProject) => {
    setSelectedProjectId(project.id);
    setViewMode('details');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedProjectId(null);
  };


  const openTeamManagementModal = async (project: EntityProject) => {
    if (!project.teamId || typeof project.teamId !== 'string') {
        toast({variant: "destructive", title: "Error", description: "Project does not have a valid team ID."});
        return;
    }
    try {
        const teamDetails = await projectTeamService.getTeamById(project.teamId);
        setEditingTeam(teamDetails);
        setIsTeamModalOpen(true);
    } catch {
        toast({variant: "destructive", title: "Error", description: "Could not load team details."});
    }
  };

  const handleSearchUsers = async () => {
      if(!teamMemberSearch.trim()) {
          setSearchedUsers([]);
          return;
      }
      try {
          const users = await userService.getAllUsers(); // In a real app, this would be a search API
          const filtered = users.filter(u => 
              u.displayName.toLowerCase().includes(teamMemberSearch.toLowerCase()) || 
              u.email.toLowerCase().includes(teamMemberSearch.toLowerCase())
          );
          setSearchedUsers(filtered);
      } catch (error) {
          toast({variant: "destructive", title: "Error searching users", description: (error as Error).message});
      }
  };

  const handleAddMemberToTeam = async () => {
      if (!editingTeam || !newMemberFormData.userId) {
          toast({variant: "destructive", title: "Error", description: "Please select a user to add."});
          return;
      }
      try {
          const updatedTeam = await projectTeamService.addTeamMember(editingTeam.id, {
              userId: newMemberFormData.userId,
              name: newMemberFormData.name, // Ensure name is passed if not automatically derived by backend
              enrollmentNo: newMemberFormData.enrollmentNo,
              role: newMemberFormData.role,
          });
          setEditingTeam(updatedTeam);
          setNewMemberFormData({ userId: '', name: '', enrollmentNo: '', role: 'Member' });
          setSearchedUsers([]);
          setTeamMemberSearch('');
          toast({title: "Success", description: "Team member added."});
      } catch (error) {
          toast({variant: "destructive", title: "Error adding member", description: (error as Error).message});
      }
  };

  const handleRemoveMemberFromTeam = async (memberUserId: string) => {
    if (!editingTeam) return;
    if (window.confirm("Are you sure you want to remove this member?")) {
        try {
            const updatedTeam = await projectTeamService.removeTeamMember(editingTeam.id, memberUserId);
            setEditingTeam(updatedTeam);
            toast({title: "Success", description: "Team member removed."});
        } catch (error) {
            toast({variant: "destructive", title: "Error removing member", description: (error as Error).message});
        }
    }
  };

  const handleSetTeamLeader = async (memberUserId: string) => {
    if (!editingTeam) return;
     if (window.confirm("Are you sure you want to make this member the team leader?")) {
        try {
            const updatedTeam = await projectTeamService.setTeamLeader(editingTeam.id, memberUserId);
            setEditingTeam(updatedTeam);
            toast({title: "Success", description: "Team leader updated."});
        } catch (error) {
            toast({variant: "destructive", title: "Error setting leader", description: (error as Error).message});
        }
    }
  };

  return (
      <div className="p-4">
          {event && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 dark:border-gray-700">
              {/* ... event banner ... */}
            </div>
          )}
          <div className="mb-6">
            {/* ... navigation tabs ... */}
          </div>
          {viewMode === 'list' ? (
            <ProjectList onViewProject={handleViewProject} event={event} />
          ) : viewMode === 'my-projects' ? (
            <div>
              <h2 className="text-xl font-bold mb-4">My Projects</h2>
              {loading ? (
                <p>Loading your projects...</p>
              ) : myProjects.length === 0 ? (
                <p>You haven&apos;t registered any projects yet.</p>
              ) : (
                <div className="grid gap-6">
                  {myProjects.map((project) => (
                    <div key={project.id} className="bg-white rounded-lg shadow p-6 dark:bg-gray-900">
                      {/* ... project summary ... */}
                      <div className="flex justify-end space-x-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => openTeamManagementModal(project)}>
                            <UsersIconLucide className="mr-2 h-4 w-4"/> Manage Team
                        </Button>
                        <Button size="sm" onClick={() => handleViewProject({
                          id: project.id,
                          title: project.title || 'Untitled Project',
                          description: project.abstract || 'No description available',
                          status: 'draft' as const,
                          category: project.category || 'General',
                          technologies: [],
                          teamSize: 1
                        })}>View Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <button
                onClick={handleBackToList}
                className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center dark:text-white dark:text-gray-400"
              >
                <ChevronLeft size={20} className="mr-1" />
                Back to Projects
              </button>
              <ProjectView 
                project={{ 
                  id: selectedProjectId || '', 
                  title: 'Loading...', 
                  description: '', 
                  status: 'draft' as const, 
                  category: '', 
                  technologies: [], 
                  teamSize: 0 
                }} 
                onBack={handleBackToList} 
              />
            </div>
          )}
          {/* Team Management Modal */}
          <Dialog open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen}>
              <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                      <DialogTitle>Manage Team: {editingTeam?.name}</DialogTitle>
                      <DialogDescription>Add, remove, or change roles for your team members.</DialogDescription>
                  </DialogHeader>
                  {editingTeam && (
                      <div className="py-4 space-y-4">
                          <div>
                              <h4 className="font-semibold mb-2">Current Members:</h4>
                              <ul className="space-y-2">
                                  {editingTeam.members.map(member => (
                                      <li key={member.userId} className="flex justify-between items-center p-2 border rounded-md dark:border-gray-700">
                                          <div>
                                              <p className="font-medium">{member.name} ({member.enrollmentNo})</p>
                                              <p className="text-xs text-muted-foreground">{member.role} {member.isLeader && "(Leader)"}</p>
                                          </div>
                                          <div className="space-x-1">
                                              {!member.isLeader && (
                                                    <Button variant="outline" size="xs" onClick={() => handleSetTeamLeader(member.userId)}>Make Leader</Button>
                                              )}
                                              {editingTeam.members.length > 1 && !member.isLeader && ( // Ensure at least one member and not removing self if leader
                                                (<Button variant="destructive" size="xs" onClick={() => handleRemoveMemberFromTeam(member.userId)}>Remove</Button>)
                                              )}
                                          </div>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                          {editingTeam.members.length < 4 && (
                            <div className="pt-4 border-t dark:border-gray-700">
                                <h4 className="font-semibold mb-2">Add New Member:</h4>
                                <div className="flex gap-2 mb-2">
                                    <Input 
                                        placeholder="Search user by name or email" 
                                        value={teamMemberSearch} 
                                        onChange={(e) => setTeamMemberSearch(e.target.value)}
                                    />
                                    <Button onClick={handleSearchUsers} type="button">Search</Button>
                                </div>
                                {searchedUsers.length > 0 && (
                                    <Select 
                                        onValueChange={(userId) => {
                                            const selectedUser = searchedUsers.find(u => u.id === userId);
                                            setNewMemberFormData(prev => ({...prev, userId, name: selectedUser?.displayName || ''}));
                                        }}
                                        value={newMemberFormData.userId}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select User to Add" /></SelectTrigger>
                                        <SelectContent>
                                            {searchedUsers.map(u => (
                                                <SelectItem key={u.id} value={u.id}>{u.displayName} ({u.email})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                 <Input 
                                    placeholder="Enrollment No." 
                                    className="mt-2"
                                    value={newMemberFormData.enrollmentNo}
                                    onChange={(e) => setNewMemberFormData(prev => ({...prev, enrollmentNo: e.target.value}))}
                                />
                                <Input 
                                    placeholder="Role (e.g., Developer)" 
                                    className="mt-2"
                                    value={newMemberFormData.role}
                                    onChange={(e) => setNewMemberFormData(prev => ({...prev, role: e.target.value}))}
                                />
                                <Button onClick={handleAddMemberToTeam} className="mt-2" type="button" disabled={!newMemberFormData.userId || !newMemberFormData.enrollmentNo}>Add to Team</Button>
                            </div>
                          )}
                      </div>
                  )}
                  <DialogFooter>
                      <DialogClose asChild>
                          <Button type="button" variant="outline">Close</Button>
                      </DialogClose>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      </div>
  );
};

export default ProjectFairStudent;
