import { projectTeamService } from './projectTeams';
import type { ProjectTeam, Department, ProjectEvent, User, ProjectTeamMember } from '@/types/entities';
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

    it('should handle filters correctly', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockTeamsResponse }));
      await projectTeamService.getAllTeams({ eventId: 'event1', department: 'CS' });
      expect(fetch).toHaveBeenCalledWith('/api/project-teams?eventId=event1&department=CS');
    });

    it('should handle direct array response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => [mockTeam] }));
      const result = await projectTeamService.getAllTeams();
      expect(result).toEqual([mockTeam]);
    });

    it('should handle unexpected response structure and log warning', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const unexpectedResponse = { someOtherStructure: 'value' };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => unexpectedResponse }));
      
      const result = await projectTeamService.getAllTeams();
      
      expect(consoleSpy).toHaveBeenCalledWith('Unexpected response structure for getAllTeams:', unexpectedResponse);
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('should handle errors when fetching teams', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Server error' }) }));
      await expect(projectTeamService.getAllTeams()).rejects.toThrow('Server error');
    });

    it('should handle errors without message when fetching teams', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectTeamService.getAllTeams()).rejects.toThrow('Failed to fetch project teams');
    });

    it('should handle error response without message property', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectTeamService.getAllTeams()).rejects.toThrow('Failed to fetch project teams');
    });
  });

  describe('getTeamById', () => {
    it('should fetch a team by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockSingleTeamResponse }));
      const result = await projectTeamService.getTeamById('team1');
      expect(fetch).toHaveBeenCalledWith('/api/project-teams/team1');
      expect(result).toEqual(mockSingleTeamResponse.data.team);
    });

    it('should handle direct team object response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockTeam }));
      const result = await projectTeamService.getTeamById('team1');
      expect(result).toEqual(mockTeam);
    });

    it('should throw error for unexpected response structure', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ someOtherData: 'value' }) }));
      await expect(projectTeamService.getTeamById('team1')).rejects.toThrow('Unexpected response structure for getTeamById.');
    });

    it('should handle errors when fetching team by ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Team not found' }) }));
      await expect(projectTeamService.getTeamById('team999')).rejects.toThrow('Team not found');
    });

    it('should handle errors without message when fetching team by ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectTeamService.getTeamById('team1')).rejects.toThrow('Failed to fetch project team with id team1');
    });

    it('should handle error response without message property when fetching team by ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectTeamService.getTeamById('team1')).rejects.toThrow('Failed to fetch project team with id team1');
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

    it('should handle direct team object response when creating', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => createdTeam }));
      const result = await projectTeamService.createTeam(newTeamData);
      expect(result).toEqual(createdTeam);
    });

    it('should throw error for unexpected response structure when creating', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ someOtherData: 'value' }) }));
      await expect(projectTeamService.createTeam(newTeamData)).rejects.toThrow('Unexpected response structure after creating team.');
    });

    it('should handle errors when creating team', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Validation failed' }) }));
      await expect(projectTeamService.createTeam(newTeamData)).rejects.toThrow('Validation failed');
    });

    it('should handle errors without message when creating team', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectTeamService.createTeam(newTeamData)).rejects.toThrow('Failed to create project team');
    });

    it('should handle error response without message property when creating team', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectTeamService.createTeam(newTeamData)).rejects.toThrow('Failed to create project team');
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

    it('should handle direct team object response when updating', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => updatedTeam }));
      const result = await projectTeamService.updateTeam('team1', updateData);
      expect(result).toEqual(updatedTeam);
    });

    it('should throw error for unexpected response structure when updating', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ someOtherData: 'value' }) }));
      await expect(projectTeamService.updateTeam('team1', updateData)).rejects.toThrow('Unexpected response structure after updating team.');
    });

    it('should handle errors when updating team', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Update failed' }) }));
      await expect(projectTeamService.updateTeam('team1', updateData)).rejects.toThrow('Update failed');
    });

    it('should handle errors without message when updating team', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectTeamService.updateTeam('team1', updateData)).rejects.toThrow('Failed to update project team');
    });

    it('should handle error response without message property when updating team', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectTeamService.updateTeam('team1', updateData)).rejects.toThrow('Failed to update project team');
    });
  });

  describe('deleteTeam', () => {
    it('should delete a team successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));
      await projectTeamService.deleteTeam('team1');
      expect(fetch).toHaveBeenCalledWith('/api/project-teams/team1', expect.objectContaining({ method: 'DELETE' }));
    });

    it('should handle errors when deleting team', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Delete failed' }) }));
      await expect(projectTeamService.deleteTeam('team1')).rejects.toThrow('Delete failed');
    });

    it('should handle errors without message when deleting team', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectTeamService.deleteTeam('team1')).rejects.toThrow('Failed to delete project team with id team1');
    });

    it('should handle error response without message property when deleting team', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectTeamService.deleteTeam('team1')).rejects.toThrow('Failed to delete project team with id team1');
    });
  });
  
  describe('getMyTeams', () => {
    it('should fetch user specific teams successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ok: true, json: async () => mockTeamsResponse}));
      const result = await projectTeamService.getMyTeams();
      expect(fetch).toHaveBeenCalledWith('/api/project-teams/my-teams');
      expect(result).toEqual(mockTeamsResponse.data.teams);
    });

    it('should handle direct array response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => [mockTeam] }));
      const result = await projectTeamService.getMyTeams();
      expect(result).toEqual([mockTeam]);
    });

    it('should handle unexpected response structure and log warning', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const unexpectedResponse = { someOtherStructure: 'value' };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => unexpectedResponse }));
      
      const result = await projectTeamService.getMyTeams();
      
      expect(consoleSpy).toHaveBeenCalledWith('Unexpected response structure for getMyTeams:', unexpectedResponse);
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('should handle errors when fetching my teams', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Unauthorized' }) }));
      await expect(projectTeamService.getMyTeams()).rejects.toThrow('Unauthorized');
    });

    it('should handle errors without message when fetching my teams', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(projectTeamService.getMyTeams()).rejects.toThrow('Failed to fetch your teams');
    });

    it('should handle error response without message property when fetching my teams', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(projectTeamService.getMyTeams()).rejects.toThrow('Failed to fetch your teams');
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

     it('should handle unexpected response structure and log warning', async () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const unexpectedResponse = { someOtherStructure: 'value' };
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => unexpectedResponse }));
        
        await expect(projectTeamService.getTeamMembers('team1')).rejects.toThrow('Unexpected response structure when fetching team members.');
        
        expect(consoleSpy).toHaveBeenCalledWith('Unexpected response structure for getTeamMembers:', unexpectedResponse);
        consoleSpy.mockRestore();
     });

     it('should handle errors when fetching team members', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Team not found' }) }));
        await expect(projectTeamService.getTeamMembers('team999')).rejects.toThrow('Team not found');
     });

     it('should handle errors without message when fetching team members', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
        await expect(projectTeamService.getTeamMembers('team1')).rejects.toThrow('Failed to fetch team members');
     });

     it('should handle error response without message property when fetching team members', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
        await expect(projectTeamService.getTeamMembers('team1')).rejects.toThrow('Failed to fetch team members');
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

    it('should handle direct team object response when adding member', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => teamWithNewMember }));
        const result = await projectTeamService.addTeamMember('team1', memberData);
        expect(result).toEqual(teamWithNewMember);
    });

    it('should throw error for unexpected response structure when adding member', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ someOtherData: 'value' }) }));
        await expect(projectTeamService.addTeamMember('team1', memberData)).rejects.toThrow('Unexpected response structure after adding team member.');
    });

    it('should handle errors when adding team member', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Member already exists' }) }));
        await expect(projectTeamService.addTeamMember('team1', memberData)).rejects.toThrow('Member already exists');
    });

    it('should handle errors without message when adding team member', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
        await expect(projectTeamService.addTeamMember('team1', memberData)).rejects.toThrow('Failed to add team member');
    });

    it('should handle error response without message property when adding team member', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
        await expect(projectTeamService.addTeamMember('team1', memberData)).rejects.toThrow('Failed to add team member');
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

    it('should handle direct team object response when removing member', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => teamAfterRemove }));
        const result = await projectTeamService.removeTeamMember('team1', 'user1');
        expect(result).toEqual(teamAfterRemove);
    });

    it('should throw error for unexpected response structure when removing member', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ someOtherData: 'value' }) }));
        await expect(projectTeamService.removeTeamMember('team1', 'user1')).rejects.toThrow('Unexpected response structure after removing team member.');
    });

    it('should handle errors when removing team member', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Member not found' }) }));
        await expect(projectTeamService.removeTeamMember('team1', 'user999')).rejects.toThrow('Member not found');
    });

    it('should handle errors without message when removing team member', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
        await expect(projectTeamService.removeTeamMember('team1', 'user1')).rejects.toThrow('Failed to remove team member');
    });

    it('should handle error response without message property when removing team member', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
        await expect(projectTeamService.removeTeamMember('team1', 'user1')).rejects.toThrow('Failed to remove team member');
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

     it('should handle direct team object response when setting leader', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => teamWithNewLeader }));
        const result = await projectTeamService.setTeamLeader('team1', 'user1');
        expect(result).toEqual(teamWithNewLeader);
     });

     it('should throw error for unexpected response structure when setting leader', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => ({ someOtherData: 'value' }) }));
        await expect(projectTeamService.setTeamLeader('team1', 'user1')).rejects.toThrow('Unexpected response structure after setting team leader.');
     });

     it('should handle errors when setting team leader', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'User not in team' }) }));
        await expect(projectTeamService.setTeamLeader('team1', 'user999')).rejects.toThrow('User not in team');
     });

     it('should handle errors without message when setting team leader', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
        await expect(projectTeamService.setTeamLeader('team1', 'user1')).rejects.toThrow('Failed to set team leader');
     });

     it('should handle error response without message property when setting team leader', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
        await expect(projectTeamService.setTeamLeader('team1', 'user1')).rejects.toThrow('Failed to set team leader');
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

    it('should handle import errors with detailed error messages', async () => {
      const errorResponse = {
        message: 'Import failed',
        errors: [
          { message: 'Row 1: Invalid team name', data: { row: 1 } },
          { message: 'Row 2: Missing department', data: { row: 2 } },
          { message: 'Row 3: Invalid event', data: { row: 3 } },
          { message: 'Row 4: Duplicate team', data: { row: 4 } }
        ]
      };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      try {
        await projectTeamService.importTeams(mockFile, mockDepartments, mockEvents, mockUsers);
        fail('Should have thrown an error');
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(error.message).toBe('Import failed Specific issues: Row 1: Invalid team name; Row 2: Missing department; Row 3: Invalid event...');
      }
    });

    it('should handle import errors with few error messages', async () => {
      const errorResponse = {
        message: 'Import failed',
        errors: [
          { message: 'Row 1: Invalid team name', data: { row: 1 } },
          { message: 'Row 2: Missing department', data: { row: 2 } }
        ]
      };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      try {
        await projectTeamService.importTeams(mockFile, mockDepartments, mockEvents, mockUsers);
        fail('Should have thrown an error');
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(error.message).toBe('Import failed Specific issues: Row 1: Invalid team name; Row 2: Missing department');
      }
    });

    it('should handle import errors with errors missing message property', async () => {
      const errorResponse = {
        message: 'Import failed',
        errors: [
          { data: { row: 1, issue: 'missing field' } },
          { message: 'Row 2: Valid error', data: { row: 2 } }
        ]
      };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      try {
        await projectTeamService.importTeams(mockFile, mockDepartments, mockEvents, mockUsers);
        fail('Should have thrown an error');
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(error.message).toBe('Import failed Specific issues: {"row":1,"issue":"missing field"}; Row 2: Valid error');
      }
    });

    it('should handle import errors without detailed errors array', async () => {
      const errorResponse = { message: 'Simple import failed' };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      await expect(projectTeamService.importTeams(mockFile, mockDepartments, mockEvents, mockUsers))
        .rejects.toThrow('Simple import failed');
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

     it('should handle export errors', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false }));
        await expect(projectTeamService.exportTeams()).rejects.toThrow('Failed to export project teams to CSV');
     });
  });

});
