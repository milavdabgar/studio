
import type { Project, ProjectEvent, ProjectTeam, Department, ProjectLocation, ProjectStatistics, EvaluationData, CategoryCounts, User } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

interface CertificateInfo {
    projectId: string;
    title: string;
    teamName?: string;
    teamMembers?: string[];
    departmentName?: string;
    score?: number;
    rank?: number;
    certificateType: 'participation' | 'department-winner' | 'institute-winner';
    eventName: string;
    eventDate: string; // Assuming eventDate is a string like "YYYY-MM-DD"
    downloadUrl: string;
}


export const projectService = {
  async getAllProjects(filters: Record<string, string | number | boolean> = {}): Promise<Project[]> {
    const queryParams = new URLSearchParams();
    for (const key in filters) {
      if (Object.prototype.hasOwnProperty.call(filters, key) && filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, String(filters[key]));
      }
    }
    const response = await fetch(`${API_BASE_URL}/projects?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch projects' }));
      throw new Error(errorData.message || 'Failed to fetch projects');
    }
    const data = await response.json();
    // Adjust to handle potential nesting: { status: 'success', data: { projects: [] } } or just []
    return Array.isArray(data) ? data : (data.data?.projects || data.projects || []); 
  },

  async getProjectById(id: string): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch project with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch project with id ${id}`);
    }
    const data = await response.json();
    return data.data?.project || data; // Handle potential nesting
  },
  
  async getProjectWithDetails(id: string): Promise<Project & { team?: ProjectTeam, location?: ProjectLocation, event?: ProjectEvent, departmentDetails?: Department, guideDetails?: User, deptJuryDetails?: User, centralJuryDetails?: User }> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}/details`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch detailed project data for id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch detailed project data for id ${id}`);
    }
    const data = await response.json();
    return data.data?.project || data; // Handle potential nesting
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
    return response.json();
  },

  async updateProject(id: string, projectData: Partial<Omit<Project, 'id'>>): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT', // Changed to PUT as per API route
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update project' }));
      throw new Error(errorData.message || 'Failed to update project');
    }
    return response.json();
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
    return data.data || data; // Handle potential nesting
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
    return data.data?.project || data; // Handle potential nesting
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
    return data.data?.project || data; // Handle potential nesting
  },
  
  async generateProjectCertificates(eventId: string, type: 'participation' | 'department-winner' | 'institute-winner' = 'participation'): Promise<CertificateInfo[]> {
    const response = await fetch(`${API_BASE_URL}/projects/event/${eventId}/certificates?type=${type}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to generate certificate data.' }));
        throw new Error(errorData.message || 'Failed to generate certificate data.');
    }
    const result = await response.json();
    return result.data?.certificates || result.certificates || []; 
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

  async importProjects(file: File, departments: Department[], teams: ProjectTeam[], events: ProjectEvent[], users: User[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number, errors?: any[] }> {
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
        detailedMessage += ` Specific issues: ${responseData.errors.slice(0,3).map((e: any) => e.message || JSON.stringify(e.data)).join('; ')}${responseData.errors.length > 3 ? '...' : ''}`;
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
    return data.data || data; // Handle potential nesting of 'data' property
  },

};
