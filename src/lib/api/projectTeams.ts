
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
    return response.json();
  },

  async getTeamById(id: string): Promise<ProjectTeam> {
    const response = await fetch(`${API_BASE_URL}/project-teams/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch project team with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch project team with id ${id}`);
    }
    return response.json();
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
    return response.json();
  },

  async updateTeam(id: string, teamData: Partial<Omit<ProjectTeam, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>): Promise<ProjectTeam> {
    const response = await fetch(`${API_BASE_URL}/project-teams/${id}`, {
      method: 'PATCH', // Or PUT, depending on API design for partial updates
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update project team' }));
      throw new Error(errorData.message || 'Failed to update project team');
    }
    return response.json();
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
    return response.json();
  },

  async getTeamMembers(teamId: string): Promise<TeamWithMembers> {
    const response = await fetch(`${API_BASE_URL}/project-teams/${teamId}/members`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch team members' }));
      throw new Error(errorData.message || 'Failed to fetch team members');
    }
    return response.json();
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
    return response.json();
  },

  async removeTeamMember(teamId: string, memberUserId: string): Promise<ProjectTeam> {
    const response = await fetch(`${API_BASE_URL}/project-teams/${teamId}/members/${memberUserId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to remove team member' }));
      throw new Error(errorData.message || 'Failed to remove team member');
    }
    return response.json();
  },

  async setTeamLeader(teamId: string, memberUserId: string): Promise<ProjectTeam> {
    const response = await fetch(`${API_BASE_URL}/project-teams/${teamId}/leader/${memberUserId}`, {
      method: 'PATCH', // Using PATCH for updating a specific field
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to set team leader' }));
      throw new Error(errorData.message || 'Failed to set team leader');
    }
    return response.json();
  },


  // Import/Export
  async importTeams(file: File, departments: Department[], events: ProjectEvent[], users: User[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number, errors?: any[] }> {
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
        detailedMessage += ` Specific issues: ${responseData.errors.slice(0,3).map((e: any) => e.message || JSON.stringify(e.data)).join('; ')}${responseData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return responseData;
  },

  async exportTeams(filters: Record<string, string> = {}): Promise<string> { // Returns CSV string
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/project-teams/export?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to export project teams to CSV');
    }
    return response.text();
  },
};
