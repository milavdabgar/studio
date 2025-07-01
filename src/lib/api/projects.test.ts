import { projectService } from './projects';
import type { Project, EvaluationData, ProjectStatistics, ProjectStatus, User, Department, ProjectTeam, ProjectEvent, ProjectLocation } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Helper to create mock responses
const createMockResponse = (options: { ok: boolean; status?: number; json?: () => Promise<any>; statusText?: string; text?: () => Promise<string> }): Response => {
  return {
    ok: options.ok,
    status: options.status || (options.ok ? 200 : 500),
    statusText: options.statusText || (options.ok ? 'OK' : 'Error'),
    json: options.json || (async () => ({})),
    text: options.text || (async () => JSON.stringify(await (options.json ? options.json() : {}))),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(options),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    bodyUsed: false,
  } as Response;
};

// Mock fetch globally for all tests in this file
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('ProjectService API Tests', () => {
  const now = new Date().toISOString();
  const mockProject: Project = {
    id: "proj1", title: "Test Project", category: "Test", abstract: "Abstract", department: "dept1",
    status: "submitted", requirements: { power: false, internet: false, specialSpace: false },
    guide: { userId: "faculty1", name: "Guide Name", department: "dept1", contactNumber: "123" },
    teamId: "team1", eventId: "event1", createdAt: now, updatedAt: now,
  };
  const mockProjectsResponse = { data: { projects: [mockProject] }}; // Adjusted to match expected structure
  const mockSingleProjectResponse = { data: { project: mockProject }}; // Adjusted

  const mockDepartments: Department[] = [{ id: 'dept1', name: 'CS', code: 'CS', instituteId: 'inst1', status: 'active'}];
  const mockTeams: ProjectTeam[] = [{ id: 'team1', name: 'Team Alpha', department: 'dept1', members: [], eventId: 'event1' }];
  const mockEvents: ProjectEvent[] = [{ id: 'event1', name: 'TechFest', academicYear: '2024', eventDate: now, registrationStartDate: now, registrationEndDate: now, status: 'upcoming', isActive: true }];
  const mockUsers: User[] = [{ id: 'faculty1', displayName: 'Guide Name', email: 'guide@example.com', roles: ['faculty'], isActive: true, authProviders: ['password'], currentRole: 'faculty' }];


  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getAllProjects', () => {
    it('should fetch all projects successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockProjectsResponse }));
      const result = await projectService.getAllProjects();
      expect(fetch).toHaveBeenCalledWith('/api/projects?');
      expect(result).toEqual(mockProjectsResponse.data.projects);
    });
  });

  describe('getProjectById', () => {
    it('should fetch a project by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockSingleProjectResponse }));
      const result = await projectService.getProjectById('proj1');
      expect(fetch).toHaveBeenCalledWith('/api/projects/proj1');
      expect(result).toEqual(mockSingleProjectResponse.data.project);
    });
  });
  
  describe('getProjectWithDetails', () => {
    const detailedProject = { ...mockProject, team: mockTeams[0], event: mockEvents[0] };
    it('should fetch a project with details successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ data: {project: detailedProject }}) }));
      const result = await projectService.getProjectWithDetails('proj1');
      expect(fetch).toHaveBeenCalledWith('/api/projects/proj1/details');
      expect(result).toEqual(detailedProject);
    });
  });

  describe('createProject', () => {
    const newProjectData: Omit<Project, 'id'> = {
      title: "New Project", category: "New", abstract: "New Abstract", department: "dept1",
      status: "draft", requirements: { power: true, internet: false, specialSpace: true },
      guide: { userId: "faculty1", name: "Guide Name", department: "dept1", contactNumber: "123" },
      teamId: "team1", eventId: "event1", createdAt: now, updatedAt: now,
    };
    const createdProject: Project = { ...newProjectData, id: 'proj_new' };

    it('should create a project successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => createdProject }));
      const result = await projectService.createProject(newProjectData);
      expect(fetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({ method: 'POST', body: JSON.stringify(newProjectData) }));
      expect(result).toEqual(createdProject);
    });
  });
  
  describe('updateProject', () => {
    const updateData: Partial<Omit<Project, 'id'>> = { title: "Updated Project Title" };
    const updatedProject: Project = { ...mockProject, title: "Updated Project Title", updatedAt: new Date().toISOString() };

    it('should update a project successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => updatedProject }));
      const result = await projectService.updateProject('proj1', updateData);
      expect(fetch).toHaveBeenCalledWith('/api/projects/proj1', expect.objectContaining({ method: 'PUT', body: JSON.stringify(updateData) }));
      expect(result).toEqual(updatedProject);
    });
  });

  describe('deleteProject', () => {
    it('should delete a project successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));
      await projectService.deleteProject('proj1');
      expect(fetch).toHaveBeenCalledWith('/api/projects/proj1', expect.objectContaining({ method: 'DELETE' }));
    });
  });
  
  describe('getMyProjects', () => {
    it('should fetch user specific projects successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, json: async () => mockProjectsResponse }));
        const result = await projectService.getMyProjects();
        expect(fetch).toHaveBeenCalledWith('/api/projects/my-projects');
        expect(result).toEqual(mockProjectsResponse.data.projects);
    });
  });
  
  describe('getProjectsForJury', () => {
    const juryProjectsResponse = { data: { evaluatedProjects: [], pendingProjects: [mockProject], totalEvaluated:0, totalPending:1 }};
    it('should fetch projects for jury successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, json: async () => juryProjectsResponse}));
        const result = await projectService.getProjectsForJury('event1', 'department');
        expect(fetch).toHaveBeenCalledWith('/api/projects/jury-assignments?eventId=event1&evaluationType=department');
        expect(result).toEqual(juryProjectsResponse.data);
    });
  });
  
  describe('evaluateProjectByDepartment', () => {
    const evalData: EvaluationData = { 
      projectId: 'proj1',
      evaluatorId: 'eval1',
      scores: { overall: 80 }, 
      timestamp: '2024-01-01T00:00:00.000Z'
    };
    const evaluatedProject = {...mockProject, deptEvaluation: { completed: true, ...evalData }};
    it('should submit department evaluation successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok:true, json: async () => ({ data: { project: evaluatedProject}})}) );
        const result = await projectService.evaluateProjectByDepartment('proj1', evalData);
        expect(fetch).toHaveBeenCalledWith('/api/projects/proj1/department-evaluation', expect.objectContaining({method:'POST', body: JSON.stringify(evalData)}));
        expect(result).toEqual(evaluatedProject);
    });
  });
  
  describe('evaluateProjectByCentral', () => {
    const evalData: EvaluationData = { 
      projectId: 'proj1',
      evaluatorId: 'eval1',
      scores: { overall: 85 }, 
      timestamp: '2024-01-01T00:00:00.000Z'
    };
    const evaluatedProject = {...mockProject, centralEvaluation: { completed: true, ...evalData }};
    it('should submit central evaluation successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok:true, json: async () => ({ data: { project: evaluatedProject}})}) );
        const result = await projectService.evaluateProjectByCentral('proj1', evalData);
        expect(fetch).toHaveBeenCalledWith('/api/projects/proj1/central-evaluation', expect.objectContaining({method:'POST', body: JSON.stringify(evalData)}));
        expect(result).toEqual(evaluatedProject);
    });
  });
  
  describe('generateProjectCertificates', () => {
    const mockCertificatesResponse = { data: { certificates: [{projectId: 'proj1', title: 'Test Project', certificateType: 'participation'}]} };
    it('should fetch certificate data successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok:true, json: async () => mockCertificatesResponse }));
        const result = await projectService.generateProjectCertificates('event1', 'participation');
        expect(fetch).toHaveBeenCalledWith('/api/projects/event/event1/certificates?type=participation');
        expect(result).toEqual(mockCertificatesResponse.data.certificates);
    });
  });
  
  describe('sendCertificateEmails', () => {
    const emailData = { certificateIds: ['cert1'], emailSubject: 'Your Cert'};
    const mockEmailResponse = { message: 'Emails sent', emailsSent: 1};
    it('should send certificate emails successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, json: async () => mockEmailResponse}));
        const result = await projectService.sendCertificateEmails(emailData);
        expect(fetch).toHaveBeenCalledWith('/api/projects/certificates/send', expect.objectContaining({method: 'POST', body: JSON.stringify(emailData)}));
        expect(result).toEqual(mockEmailResponse);
    });
  });

  describe('importProjects', () => {
    const mockFile = new File(['test data'], 'projects.csv', { type: 'text/csv' });
    const mockResponse = { newCount: 1, updatedCount: 0, skippedCount: 0 };
    it('should import projects successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockResponse }));
      const result = await projectService.importProjects(mockFile, mockDepartments, mockTeams, mockEvents, mockUsers);
      expect(fetch).toHaveBeenCalledWith('/api/projects/import', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
      expect(result).toEqual(mockResponse);
    });
  });
  
  describe('exportProjects', () => {
     it('should export projects as CSV text', async () => {
        const csvText = "id,title,category\nproj1,Test Project,Test";
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, text: async() => csvText, json: async() => csvText }));
        const result = await projectService.exportProjects({eventId: 'event1'});
        expect(fetch).toHaveBeenCalledWith('/api/projects/export?eventId=event1');
        expect(result).toEqual(csvText);
     });
  });
  
  describe('getProjectStatistics', () => {
    const mockStats: ProjectStatistics = { 
      totalProjects: 10,
      total: 10, 
      evaluated: 5, 
      pending: 5, 
      averageScore: 80, 
      departmentStats: [{ departmentId: 'CS', departmentName: 'Computer Science', projectCount: 5 }],
      departmentWise: {"CS": 5},
      statusCounts: {} as Record<ProjectStatus, number>
    };
    it('should fetch project statistics successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, json: async () => ({data: mockStats}) }));
        const result = await projectService.getProjectStatistics('event1');
        expect(fetch).toHaveBeenCalledWith('/api/projects/statistics?eventId=event1');
        expect(result).toEqual(mockStats);
    });
  });

});
