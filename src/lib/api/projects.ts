
import type { Project, ProjectEvent, ProjectTeam, Department, ProjectLocation, ProjectStatistics, EvaluationData, User, CertificateInfo, WinnersResponse } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';


export const projectService = {
  async getAllProjects(filters: Record<string, string | number | boolean> = {}): Promise<Project[]> {
    const queryParams = new URLSearchParams();
    for (const key in filters) {
      if (Object.prototype.hasOwnProperty.call(filters, key) && filters[key] !== undefined && filters[key] !== null && String(filters[key]).trim() !== '') {
        queryParams.append(key, String(filters[key]));
      }
    }
    const response = await fetch(`${API_BASE_URL}/projects?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch projects' }));
      throw new Error(errorData.message || 'Failed to fetch projects');
    }
    const data = await response.json();
    return data.data?.projects || data.projects || (Array.isArray(data) ? data : []); 
  },

  async getProjectById(id: string): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch project with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch project with id ${id}`);
    }
    const data = await response.json();
    return data.data?.project || data; 
  },
  
  async getProjectWithDetails(id: string): Promise<Project & { team?: ProjectTeam, location?: ProjectLocation, event?: ProjectEvent, departmentDetails?: Department, guideDetails?: User, deptJuryDetails?: User, centralJuryDetails?: User }> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}/details`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch detailed project data for id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch detailed project data for id ${id}`);
    }
    const data = await response.json();
    return data.data?.project || data; 
  },

  async createProject(projectData: Omit<Project, 'id'>): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create project' }));
      throw new Error(errorData.message || 'Failed to create project');
    }
    const responseData = await response.json();
    return responseData.data?.project || responseData;
  },

  async updateProject(id: string, projectData: Partial<Omit<Project, 'id'>>): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update project' }));
      throw new Error(errorData.message || 'Failed to update project');
    }
     const responseData = await response.json();
    return responseData.data?.project || responseData;
  },

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete project with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete project with id ${id}`);
    }
  },
  
  async getMyProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/projects/my-projects`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch your projects' }));
      throw new Error(errorData.message || 'Failed to fetch your projects');
    }
    const data = await response.json();
    return data.data?.projects || data || []; 
  },

  async getProjectsForJury(eventId: string, evaluationType: 'department' | 'central' = 'department'): Promise<{ evaluatedProjects: Project[], pendingProjects: Project[], totalEvaluated: number, totalPending: number }> {
    const response = await fetch(`${API_BASE_URL}/projects/jury-assignments?eventId=${eventId}&evaluationType=${evaluationType}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch projects for jury' }));
      throw new Error(errorData.message || 'Failed to fetch projects for jury');
    }
    const data = await response.json();
    return data.data || data; 
  },

  async evaluateProjectByDepartment(projectId: string, evaluationData: EvaluationData): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/department-evaluation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evaluationData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to submit department evaluation' }));
      throw new Error(errorData.message || 'Failed to submit department evaluation');
    }
    const data = await response.json();
    return data.data?.project || data; 
  },

  async evaluateProjectByCentral(projectId: string, evaluationData: EvaluationData): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/central-evaluation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evaluationData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to submit central evaluation' }));
      throw new Error(errorData.message || 'Failed to submit central evaluation');
    }
    const data = await response.json();
    return data.data?.project || data; 
  },
  
  async generateProjectCertificates(eventId: string, type: 'participation' | 'department-winner' | 'institute-winner' = 'participation'): Promise<CertificateInfo[]> {
    const response = await fetch(`${API_BASE_URL}/projects/event/${eventId}/certificates?type=${type}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to generate certificate data.' }));
        throw new Error(errorData.message || 'Failed to generate certificate data.');
    }
    const result = await response.json();
    return result.certificates || (result.data?.certificates || []);
  },

  async sendCertificateEmails(data: { certificateIds: string[], emailSubject?: string, emailTemplate?: string }): Promise<{ message: string, emailsSent: number }> {
    const response = await fetch(`${API_BASE_URL}/projects/certificates/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to send certificate emails.' }));
        throw new Error(errorData.message || 'Failed to send certificate emails.');
    }
    return response.json();
  },

  async importProjects(file: File, departments: Department[], teams: ProjectTeam[], events: ProjectEvent[], users: User[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number, errors?: Record<string, unknown>[] }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('departments', JSON.stringify(departments));
    formData.append('teams', JSON.stringify(teams));
    formData.append('events', JSON.stringify(events));
    formData.append('users', JSON.stringify(users)); 

    const response = await fetch(`${API_BASE_URL}/projects/import`, {
      method: 'POST',
      body: formData,
    });
    const responseData = await response.json();
    if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import projects.';
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        detailedMessage += ` Specific issues: ${responseData.errors.slice(0,3).map((e: Record<string, unknown>) => e.message || JSON.stringify(e.data)).join('; ')}${responseData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return responseData;
  },

  async exportProjects(filters: Record<string, string | number | boolean> = {}): Promise<string> { 
    const queryParams = new URLSearchParams();
     for (const key in filters) {
      if (Object.prototype.hasOwnProperty.call(filters, key) && filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, String(filters[key]));
      }
    }
    const response = await fetch(`${API_BASE_URL}/projects/export?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to export projects to CSV');
    }
    return response.text();
  },
  
  async getProjectStatistics(eventId?: string): Promise<ProjectStatistics> {
    const queryParams = eventId ? `?eventId=${eventId}` : '';
    const response = await fetch(`${API_BASE_URL}/projects/statistics${queryParams}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch project statistics' }));
        throw new Error(errorData.message || 'Failed to fetch project statistics');
    }
    const data = await response.json();
    return data.data || data; 
  },
  
  async getEventWinners(eventId: string): Promise<WinnersResponse> {
    const response = await fetch(`${API_BASE_URL}/projects/event/${eventId}/winners`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch event winners' }));
      throw new Error(errorData.message || 'Failed to fetch event winners');
    }
    const data = await response.json();
    return data.data || data; 
  },

  // Re-add getAllTeams from projectTeamService if it was meant to be part of projectService
  async getAllTeams(filters: Record<string, string> = {}): Promise<ProjectTeam[]> {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/project-teams?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch project teams' }));
      throw new Error(errorData.message || 'Failed to fetch project teams');
    }
    const responseData = await response.json();
    return responseData.data?.teams || responseData.teams || (Array.isArray(responseData) ? responseData : []);
  },
};
