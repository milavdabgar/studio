
import type { ProjectTeam, Department, ProjectEvent, User } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

interface TeamMemberInfo {
    userId: string;
    name: string;
    enrollmentNo: string;
    role: string;
    isLeader: boolean;
    email?: string;
}

interface TeamWithMembers {
    teamId: string;
    teamName: string;
    members: TeamMemberInfo[];
}

export const projectTeamService = {
  async getAllTeams(filters: Record<string, string> = {}): Promise<ProjectTeam[]> {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/project-teams?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch project teams' }));
      throw new Error(errorData.message || 'Failed to fetch project teams');
    }
    const responseData = await response.json();
    if (responseData.data && Array.isArray(responseData.data.teams)) {
      return responseData.data.teams;
    }
    if (Array.isArray(responseData)) { // Fallback for direct array response
        return responseData;
    }
    console.warn("Unexpected response structure for getAllTeams:", responseData);
    return []; // Return empty array if structure is unexpected
  },

  async getTeamById(id: string): Promise<ProjectTeam> {
    const response = await fetch(`${API_BASE_URL}/project-teams/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch project team with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch project team with id ${id}`);
    }
    const responseData = await response.json();
    if (responseData.data && responseData.data.team) { // Expecting { data: { team: { ... } } }
        return responseData.data.team;
    }
     // Handle cases where the API might return the team object directly
    if (responseData && typeof responseData === 'object' && responseData.id === id) {
        return responseData as ProjectTeam;
    }
    throw new Error('Unexpected response structure for getTeamById.');
  },

  async createTeam(teamData: Omit<ProjectTeam, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<ProjectTeam> {
    const response = await fetch(`${API_BASE_URL}/project-teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create project team' }));
      throw new Error(errorData.message || 'Failed to create project team');
    }
    const responseData = await response.json();
     if (responseData.data && responseData.data.team) { // Expecting { data: { team: { ... } } }
        return responseData.data.team;
    }
    // Handle cases where the API might return the team object directly
    if (responseData && typeof responseData === 'object' && responseData.id) {
        return responseData as ProjectTeam;
    }
    throw new Error('Unexpected response structure after creating team.');
  },

  async updateTeam(id: string, teamData: Partial<Omit<ProjectTeam, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>): Promise<ProjectTeam> {
    const response = await fetch(`${API_BASE_URL}/project-teams/${id}`, {
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update project team' }));
      throw new Error(errorData.message || 'Failed to update project team');
    }
    const responseData = await response.json();
    if (responseData.data && responseData.data.team) {
        return responseData.data.team;
    }
     if (responseData && typeof responseData === 'object' && responseData.id === id) {
        return responseData as ProjectTeam;
    }
    throw new Error('Unexpected response structure after updating team.');
  },

  async deleteTeam(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/project-teams/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete project team with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete project team with id ${id}`);
    }
  },
  
  async getMyTeams(): Promise<ProjectTeam[]> {
    const response = await fetch(`${API_BASE_URL}/project-teams/my-teams`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch your teams' }));
      throw new Error(errorData.message || 'Failed to fetch your teams');
    }
    const responseData = await response.json();
    if (responseData.data && Array.isArray(responseData.data.teams)) {
        return responseData.data.teams;
    }
    if (Array.isArray(responseData)) return responseData;
    console.warn("Unexpected response structure for getMyTeams:", responseData);
    return [];
  },

  async getTeamMembers(teamId: string): Promise<TeamWithMembers> {
    const response = await fetch(`${API_BASE_URL}/project-teams/${teamId}/members`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch team members' }));
      throw new Error(errorData.message || 'Failed to fetch team members');
    }
    const responseData = await response.json();
    if (responseData.data) {
        return responseData.data;
    }
    console.warn("Unexpected response structure for getTeamMembers:", responseData);
    throw new Error('Unexpected response structure when fetching team members.');
  },

  async addTeamMember(teamId: string, memberData: Omit<TeamMemberInfo, 'id' | 'isLeader'> & { isLeader?: boolean }): Promise<ProjectTeam> {
    const response = await fetch(`${API_BASE_URL}/project-teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to add team member' }));
      throw new Error(errorData.message || 'Failed to add team member');
    }
    const responseData = await response.json();
    if (responseData.data && responseData.data.team) {
        return responseData.data.team;
    }
    if (responseData && typeof responseData === 'object' && responseData.id) { // Direct team object
        return responseData as ProjectTeam;
    }
    throw new Error('Unexpected response structure after adding team member.');
  },

  async removeTeamMember(teamId: string, memberUserId: string): Promise<ProjectTeam> {
    const response = await fetch(`${API_BASE_URL}/project-teams/${teamId}/members/${memberUserId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to remove team member' }));
      throw new Error(errorData.message || 'Failed to remove team member');
    }
    const responseData = await response.json();
     if (responseData && typeof responseData === 'object' && responseData.id) { 
        return responseData as ProjectTeam;
    }
    if (responseData.data && responseData.data.team) { 
        return responseData.data.team;
    }
    throw new Error('Unexpected response structure after removing team member.');
  },

  async setTeamLeader(teamId: string, memberUserId: string): Promise<ProjectTeam> {
    const response = await fetch(`${API_BASE_URL}/project-teams/${teamId}/leader/${memberUserId}`, {
      method: 'PATCH', 
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to set team leader' }));
      throw new Error(errorData.message || 'Failed to set team leader');
    }
     const responseData = await response.json();
    if (responseData && typeof responseData === 'object' && responseData.id) {
        return responseData as ProjectTeam;
    }
    if (responseData.data && responseData.data.team) {
        return responseData.data.team;
    }
    throw new Error('Unexpected response structure after setting team leader.');
  },

  async importTeams(file: File, departments: Department[], events: ProjectEvent[], users: User[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number, errors?: Record<string, unknown>[] }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('departments', JSON.stringify(departments));
    formData.append('events', JSON.stringify(events));
    formData.append('users', JSON.stringify(users));

    const response = await fetch(`${API_BASE_URL}/project-teams/import`, {
      method: 'POST',
      body: formData,
    });
    const responseData = await response.json();
    if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import project teams.';
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        detailedMessage += ` Specific issues: ${responseData.errors.slice(0,3).map((e: Record<string, unknown>) => e.message || JSON.stringify(e.data)).join('; ')}${responseData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return responseData;
  },

  async exportTeams(filters: Record<string, string> = {}): Promise<string> { 
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/project-teams/export?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to export project teams to CSV');
    }
    return response.text();
  },
};
