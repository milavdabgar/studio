import { projectService } from './projects';
import type { Project, EvaluationData, ProjectStatistics, ProjectStatus, User, Department, ProjectTeam, ProjectEvent } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Helper to create mock responses
const createMockResponse = (options: { ok: boolean; status?: number; json?: () => Promise<unknown>; statusText?: string; text?: () => Promise<string> }): Response => {
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

    it('should handle filters correctly', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockProjectsResponse }));
      await projectService.getAllProjects({ category: 'Web', status: 'submitted', active: true, priority: 1 });
      expect(fetch).toHaveBeenCalledWith('/api/projects?category=Web&status=submitted&active=true&priority=1');
    });

    it('should filter out undefined, null, and empty string values', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockProjectsResponse }));
      await projectService.getAllProjects({ category: 'Web', status: undefined as any as string, active: null as any, priority: '' as any, empty: '   ' as any }); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(fetch).toHaveBeenCalledWith('/api/projects?category=Web');
    });

    it('should handle filter with Object.prototype.hasOwnProperty check', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockProjectsResponse }));
      const filters = Object.create(null); // Create object without prototype
      filters.category = 'Web';
      filters.status = 'submitted';
      await projectService.getAllProjects(filters);
      expect(fetch).toHaveBeenCalledWith('/api/projects?category=Web&status=submitted');
    });

    it('should handle direct projects array response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ projects: [mockProject] }) }));
      const result = await projectService.getAllProjects();
      expect(result).toEqual([mockProject]);
    });

    it('should handle direct array response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => [mockProject] }));
      const result = await projectService.getAllProjects();
      expect(result).toEqual([mockProject]);
    });

    it('should return empty array for unexpected response structure', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ someOtherData: 'value' }) }));
      const result = await projectService.getAllProjects();
      expect(result).toEqual([]);
    });

    it('should handle errors when fetching projects', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Server error' }) }));
      await expect(projectService.getAllProjects()).rejects.toThrow('Server error');
    });

    it('should handle errors without message when fetching projects', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectService.getAllProjects()).rejects.toThrow('Failed to fetch projects');
    });

    it('should handle error response without message property', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectService.getAllProjects()).rejects.toThrow('Failed to fetch projects');
    });
  });

  describe('getProjectById', () => {
    it('should fetch a project by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockSingleProjectResponse }));
      const result = await projectService.getProjectById('proj1');
      expect(fetch).toHaveBeenCalledWith('/api/projects/proj1');
      expect(result).toEqual(mockSingleProjectResponse.data.project);
    });

    it('should handle direct project object response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockProject }));
      const result = await projectService.getProjectById('proj1');
      expect(result).toEqual(mockProject);
    });

    it('should handle errors when fetching project by ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Project not found' }) }));
      await expect(projectService.getProjectById('proj999')).rejects.toThrow('Project not found');
    });

    it('should handle errors without message when fetching project by ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectService.getProjectById('proj1')).rejects.toThrow('Failed to fetch project with id proj1');
    });

    it('should handle error response without message property when fetching project by ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectService.getProjectById('proj1')).rejects.toThrow('Failed to fetch project with id proj1');
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

    it('should handle direct project object response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => detailedProject }));
      const result = await projectService.getProjectWithDetails('proj1');
      expect(result).toEqual(detailedProject);
    });

    it('should handle errors when fetching detailed project', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Project details not found' }) }));
      await expect(projectService.getProjectWithDetails('proj999')).rejects.toThrow('Project details not found');
    });

    it('should handle errors without message when fetching detailed project', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectService.getProjectWithDetails('proj1')).rejects.toThrow('Failed to fetch detailed project data for id proj1');
    });

    it('should handle error response without message property when fetching detailed project', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectService.getProjectWithDetails('proj1')).rejects.toThrow('Failed to fetch detailed project data for id proj1');
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

    it('should handle structured response when creating project', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => ({ data: { project: createdProject } }) }));
      const result = await projectService.createProject(newProjectData);
      expect(result).toEqual(createdProject);
    });

    it('should handle errors when creating project', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Validation failed' }) }));
      await expect(projectService.createProject(newProjectData)).rejects.toThrow('Validation failed');
    });

    it('should handle errors without message when creating project', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectService.createProject(newProjectData)).rejects.toThrow('Failed to create project');
    });

    it('should handle error response without message property when creating project', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectService.createProject(newProjectData)).rejects.toThrow('Failed to create project');
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

    it('should handle structured response when updating project', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ data: { project: updatedProject } }) }));
      const result = await projectService.updateProject('proj1', updateData);
      expect(result).toEqual(updatedProject);
    });

    it('should handle errors when updating project', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Update failed' }) }));
      await expect(projectService.updateProject('proj1', updateData)).rejects.toThrow('Update failed');
    });

    it('should handle errors without message when updating project', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectService.updateProject('proj1', updateData)).rejects.toThrow('Failed to update project');
    });

    it('should handle error response without message property when updating project', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectService.updateProject('proj1', updateData)).rejects.toThrow('Failed to update project');
    });
  });

  describe('deleteProject', () => {
    it('should delete a project successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));
      await projectService.deleteProject('proj1');
      expect(fetch).toHaveBeenCalledWith('/api/projects/proj1', expect.objectContaining({ method: 'DELETE' }));
    });

    it('should handle errors when deleting project', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Delete failed' }) }));
      await expect(projectService.deleteProject('proj1')).rejects.toThrow('Delete failed');
    });

    it('should handle errors without message when deleting project', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectService.deleteProject('proj1')).rejects.toThrow('Failed to delete project with id proj1');
    });

    it('should handle error response without message property when deleting project', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectService.deleteProject('proj1')).rejects.toThrow('Failed to delete project with id proj1');
    });
  });
  
  describe('getMyProjects', () => {
    it('should fetch user specific projects successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, json: async () => mockProjectsResponse }));
        const result = await projectService.getMyProjects();
        expect(fetch).toHaveBeenCalledWith('/api/projects/my-projects');
        expect(result).toEqual(mockProjectsResponse.data.projects);
    });

    it('should handle direct array response', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => [mockProject] }));
        const result = await projectService.getMyProjects();
        expect(result).toEqual([mockProject]);
    });

    it('should return data for unexpected response structure', async () => {
        const unexpectedData = { someOtherData: 'value' };
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => unexpectedData }));
        const result = await projectService.getMyProjects();
        expect(result).toEqual(unexpectedData);
    });

    it('should handle errors when fetching my projects', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Unauthorized' }) }));
        await expect(projectService.getMyProjects()).rejects.toThrow('Unauthorized');
    });

    it('should handle errors without message when fetching my projects', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
        await expect(projectService.getMyProjects()).rejects.toThrow('Failed to fetch your projects');
    });

    it('should handle error response without message property when fetching my projects', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
        await expect(projectService.getMyProjects()).rejects.toThrow('Failed to fetch your projects');
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

    it('should handle JSON parsing error when fetching projects for jury fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(projectService.getProjectsForJury('event1')).rejects.toThrow('Failed to fetch projects for jury');
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

    it('should handle JSON parsing error when department evaluation fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(projectService.evaluateProjectByDepartment('proj1', evalData)).rejects.toThrow('Failed to submit department evaluation');
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

    it('should handle JSON parsing error when central evaluation fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(projectService.evaluateProjectByCentral('proj1', evalData)).rejects.toThrow('Failed to submit central evaluation');
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

    it('should handle JSON parsing error when generating certificates fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(projectService.generateProjectCertificates('event1')).rejects.toThrow('Failed to generate certificate data.');
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

    it('should handle JSON parsing error when sending certificate emails fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(projectService.sendCertificateEmails({ certificateIds: ['cert1'] })).rejects.toThrow('Failed to send certificate emails.');
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

    it('should handle import errors with details', async () => {
      const errorResponse = { message: 'Import failed', errors: [{row: 1, message: 'Bad data'}]};
      mockFetch.mockResolvedValueOnce(createMockResponse({ok: false, status: 400, json: async () => errorResponse}));
      await expect(projectService.importProjects(mockFile, mockDepartments, mockTeams, mockEvents, mockUsers)).rejects.toThrow('Import failed Specific issues: Bad data');
    });

    it('should handle generic import error', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: false, status: 500, json: async () => ({ message: 'Server error during import' })}));
        await expect(projectService.importProjects(mockFile, mockDepartments, mockTeams, mockEvents, mockUsers)).rejects.toThrow('Server error during import');
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

     it('should handle filters correctly for export', async () => {
        const csvText = "id,title,category\nproj1,Test Project,Test";
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, text: async () => csvText }));
        await projectService.exportProjects({ category: 'Web', status: 'submitted', active: true, priority: 1 });
        expect(fetch).toHaveBeenCalledWith('/api/projects/export?category=Web&status=submitted&active=true&priority=1');
     });

     it('should filter out undefined, null, and empty string values for export', async () => {
        const csvText = "id,title,category\nproj1,Test Project,Test";
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, text: async () => csvText }));
        await projectService.exportProjects({ category: 'Web', status: undefined as any as string, active: null as any, priority: '' as any }); // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(fetch).toHaveBeenCalledWith('/api/projects/export?category=Web');
     });

     it('should handle filter with Object.prototype.hasOwnProperty check for export', async () => {
        const csvText = "id,title,category\nproj1,Test Project,Test";
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, text: async () => csvText }));
        const filters = Object.create(null); // Create object without prototype
        filters.category = 'Web';
        filters.status = 'submitted';
        await projectService.exportProjects(filters);
        expect(fetch).toHaveBeenCalledWith('/api/projects/export?category=Web&status=submitted');
     });

     it('should handle export errors', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false }));
        await expect(projectService.exportProjects()).rejects.toThrow('Failed to export projects to CSV');
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

    it('should fetch statistics without eventId', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ data: mockStats }) }));
        const result = await projectService.getProjectStatistics();
        expect(fetch).toHaveBeenCalledWith('/api/projects/statistics');
        expect(result).toEqual(mockStats);
    });

    it('should handle direct statistics response', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockStats }));
        const result = await projectService.getProjectStatistics('event1');
        expect(result).toEqual(mockStats);
    });

    it('should handle errors when fetching project statistics', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Statistics failed' }) }));
        await expect(projectService.getProjectStatistics('event1')).rejects.toThrow('Statistics failed');
    });

    it('should handle errors without message when fetching project statistics', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
        await expect(projectService.getProjectStatistics('event1')).rejects.toThrow('Failed to fetch project statistics');
    });

    it('should handle error response without message property when fetching project statistics', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
        await expect(projectService.getProjectStatistics('event1')).rejects.toThrow('Failed to fetch project statistics');
    });
  });

  describe('getEventWinners', () => {
    const mockWinners = { departmentWinners: [], instituteWinners: [] };
    const mockWinnersResponse = { data: mockWinners };
    it('should fetch event winners successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockWinnersResponse }));
        const result = await projectService.getEventWinners('event1');
        expect(fetch).toHaveBeenCalledWith('/api/projects/event/event1/winners');
        expect(result).toEqual(mockWinners);
    });

    it('should handle direct winners response', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockWinners }));
        const result = await projectService.getEventWinners('event1');
        expect(result).toEqual(mockWinners);
    });

    it('should handle errors when fetching event winners', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Winners not found' }) }));
        await expect(projectService.getEventWinners('event1')).rejects.toThrow('Winners not found');
    });

    it('should handle errors without message when fetching event winners', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
        await expect(projectService.getEventWinners('event1')).rejects.toThrow('Failed to fetch event winners');
    });

    it('should handle error response without message property when fetching event winners', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
        await expect(projectService.getEventWinners('event1')).rejects.toThrow('Failed to fetch event winners');
    });
  });

  describe('getAllTeams', () => {
    const mockTeamsResponse = { data: { teams: mockTeams } };
    it('should fetch all teams successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockTeamsResponse }));
        const result = await projectService.getAllTeams({ eventId: 'event1' });
        expect(fetch).toHaveBeenCalledWith('/api/project-teams?eventId=event1');
        expect(result).toEqual(mockTeams);
    });

    it('should handle direct teams array response', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ teams: mockTeams }) }));
        const result = await projectService.getAllTeams();
        expect(result).toEqual(mockTeams);
    });

    it('should handle direct array response', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockTeams }));
        const result = await projectService.getAllTeams();
        expect(result).toEqual(mockTeams);
    });

    it('should return empty array for unexpected response structure', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ someOtherData: 'value' }) }));
        const result = await projectService.getAllTeams();
        expect(result).toEqual([]);
    });

    it('should handle errors when fetching teams', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Teams fetch failed' }) }));
        await expect(projectService.getAllTeams()).rejects.toThrow('Teams fetch failed');
    });

    it('should handle errors without message when fetching teams', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
        await expect(projectService.getAllTeams()).rejects.toThrow('Failed to fetch project teams');
    });

    it('should handle error response without message property when fetching teams', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
        await expect(projectService.getAllTeams()).rejects.toThrow('Failed to fetch project teams');
    });
  });

});
