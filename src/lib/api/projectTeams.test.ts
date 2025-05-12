import { projectTeamService } from './projectTeams';
import type { ProjectTeam, Department, ProjectEvent, User, ProjectTeamMember } from '@/types/entities';
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

describe('ProjectTeamService API Tests', () => {
  const now = new Date().toISOString();
  const mockTeamMember: ProjectTeamMember = { userId: 'user1', name: 'John Doe', enrollmentNo: 'E001', role: 'Leader', isLeader: true };
  const mockTeam: ProjectTeam = {
    id: "team1",
    name: "Innovators",
    department: "dept1",
    members: [mockTeamMember],
    eventId: "event1",
    createdBy: "admin1",
    updatedBy: "admin1",
    createdAt: now,
    updatedAt: now,
  };
  const mockTeamsResponse = { data: { teams: [mockTeam], pagination: {total: 1, page: 1, limit: 10, pages:1}}};
  const mockSingleTeamResponse = { data: { team: mockTeam }};

  const mockDepartments: Department[] = [{ id: 'dept1', name: 'CS', code: 'CS', instituteId: 'inst1', status: 'active'}];
  const mockEvents: ProjectEvent[] = [{ id: 'event1', name: 'TechFest', academicYear: '2024', eventDate: now, registrationStartDate: now, registrationEndDate: now, status: 'upcoming', isActive: true }];
  const mockUsers: User[] = [{ id: 'user1', displayName: 'John Doe', email: 'john@example.com', roles: ['student'], isActive: true, authProviders: ['password'], currentRole: 'student' }];

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getAllTeams', () => {
    it('should fetch all teams successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockTeamsResponse }));
      const result = await projectTeamService.getAllTeams();
      expect(fetch).toHaveBeenCalledWith('/api/project-teams?');
      expect(result).toEqual(mockTeamsResponse.data.teams);
    });
  });

  describe('getTeamById', () => {
    it('should fetch a team by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockSingleTeamResponse }));
      const result = await projectTeamService.getTeamById('team1');
      expect(fetch).toHaveBeenCalledWith('/api/project-teams/team1');
      expect(result).toEqual(mockSingleTeamResponse.data.team);
    });
  });

  describe('createTeam', () => {
    const newTeamData: Omit<ProjectTeam, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
      name: "Newbies", department: "dept2", members: [{ userId: 'user2', name: 'Jane Doe', enrollmentNo: 'E002', role: 'Member', isLeader: false }], eventId: "event1"
    };
    const createdTeam: ProjectTeam = { ...newTeamData, id: 'team2', createdBy:'admin1', updatedBy:'admin1', createdAt: now, updatedAt: now };
    
    it('should create a team successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => ({ data: { team: createdTeam }}) }));
      const result = await projectTeamService.createTeam(newTeamData);
      expect(fetch).toHaveBeenCalledWith('/api/project-teams', expect.objectContaining({ method: 'POST', body: JSON.stringify(newTeamData) }));
      expect(result).toEqual(createdTeam);
    });
  });
  
  describe('updateTeam', () => {
    const updateData: Partial<Omit<ProjectTeam, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>> = { name: "Innovators V2" };
    const updatedTeam: ProjectTeam = { ...mockTeam, name: "Innovators V2", updatedAt: new Date().toISOString() };

    it('should update a team successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ data: {team: updatedTeam} }) }));
      const result = await projectTeamService.updateTeam('team1', updateData);
      expect(fetch).toHaveBeenCalledWith('/api/project-teams/team1', expect.objectContaining({ method: 'PATCH', body: JSON.stringify(updateData) }));
      expect(result).toEqual(updatedTeam);
    });
  });

  describe('deleteTeam', () => {
    it('should delete a team successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));
      await projectTeamService.deleteTeam('team1');
      expect(fetch).toHaveBeenCalledWith('/api/project-teams/team1', expect.objectContaining({ method: 'DELETE' }));
    });
  });
  
  describe('getMyTeams', () => {
    it('should fetch user specific teams successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, json: async () => mockTeamsResponse}));
      const result = await projectTeamService.getMyTeams();
      expect(fetch).toHaveBeenCalledWith('/api/project-teams/my-teams');
      expect(result).toEqual(mockTeamsResponse.data.teams);
    });
  });
  
  describe('getTeamMembers', () => {
     const teamMembersData = { teamId: 'team1', teamName: 'Innovators', members: [{userId: 'user1', name:'John Doe', enrollmentNo: 'E001', role:'Leader', isLeader:true, email:'john@example.com'}]};
     it('should fetch team members successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok:true, json: async () => ({data: teamMembersData})}));
        const result = await projectTeamService.getTeamMembers('team1');
        expect(fetch).toHaveBeenCalledWith('/api/project-teams/team1/members');
        expect(result).toEqual(teamMembersData);
     });
  });
  
  describe('addTeamMember', () => {
    const memberData = { userId: 'user_new', name: 'New Member', enrollmentNo: 'E003', role: 'Developer' };
    const teamWithNewMember = {...mockTeam, members: [...mockTeam.members, {...memberData, isLeader: false}]};
    it('should add a team member successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok:true, json: async () => ({data: {team: teamWithNewMember}}) }));
        const result = await projectTeamService.addTeamMember('team1', memberData);
        expect(fetch).toHaveBeenCalledWith('/api/project-teams/team1/members', expect.objectContaining({method: 'POST', body: JSON.stringify(memberData)}));
        expect(result).toEqual(teamWithNewMember);
    });
  });

  describe('removeTeamMember', () => {
    const teamAfterRemove = {...mockTeam, members: []}; // simplified
    it('should remove a team member successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, json: async () => ({ data: { team: teamAfterRemove }}) }));
        const result = await projectTeamService.removeTeamMember('team1', 'user1');
        expect(fetch).toHaveBeenCalledWith('/api/project-teams/team1/members/user1', expect.objectContaining({method: 'DELETE'}));
        expect(result).toEqual(teamAfterRemove);
    });
  });
  
  describe('setTeamLeader', () => {
     const teamWithNewLeader = {...mockTeam, members: mockTeam.members.map(m => ({...m, isLeader: m.userId === 'user1'}))};
     it('should set a team leader successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, json: async () => ({ data: { team: teamWithNewLeader }})}));
        const result = await projectTeamService.setTeamLeader('team1', 'user1');
        expect(fetch).toHaveBeenCalledWith('/api/project-teams/team1/leader/user1', expect.objectContaining({method: 'PATCH'}));
        expect(result).toEqual(teamWithNewLeader);
     });
  });

  describe('importTeams', () => {
    const mockFile = new File(['test data'], 'teams.csv', { type: 'text/csv' });
    const mockResponse = { newCount: 1, updatedCount: 0, skippedCount: 0 };
    it('should import teams successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockResponse }));
      const result = await projectTeamService.importTeams(mockFile, mockDepartments, mockEvents, mockUsers);
      expect(fetch).toHaveBeenCalledWith('/api/project-teams/import', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
      expect(result).toEqual(mockResponse);
    });
  });
  
  describe('exportTeams', () => {
     it('should export teams as CSV text', async () => {
        const csvText = "id,name,department\nteam1,Innovators,dept1";
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, text: async() => csvText, json: async() => csvText }));
        const result = await projectTeamService.exportTeams({eventId: 'event1'});
        expect(fetch).toHaveBeenCalledWith('/api/project-teams/export?eventId=event1');
        expect(result).toEqual(csvText);
     });
  });

});
