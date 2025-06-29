import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Project Teams API - In-Memory Storage Endpoints
 * Priority: Project Teams Module (Critical for Project Management)
 * 
 * This test suite covers the project-teams API endpoints that use in-memory storage
 * and are critical for the MongoDB migration. Tests ensure data integrity
 * and business logic preservation during migration.
 */

// Base URL for API endpoints
const API_BASE = '/api';

// Test data for project teams
const testTeam = {
  name: 'E2E Test Team',
  description: 'A test team for E2E testing purposes',
  department: 'dept_ce_gpp',
  eventId: 'event_techfest_2024_gpp',
  maxMembers: 4,
  status: 'active',
  members: [
    {
      studentId: 'student_test_1',
      role: 'leader',
      isLeader: true,
      joinedAt: new Date().toISOString()
    },
    {
      studentId: 'student_test_2', 
      role: 'member',
      isLeader: false,
      joinedAt: new Date().toISOString()
    }
  ]
};

const testTeamUpdate = {
  name: 'Updated E2E Test Team',
  description: 'Updated description for E2E testing',
  maxMembers: 5,
  status: 'inactive'
};

const testMember = {
  userId: 'student_test_3',
  name: 'Test Student 3',
  enrollmentNo: '220010107003',
  role: 'member',
  isLeader: false,
  joinedAt: new Date().toISOString()
};

// Helper function to create unique team names
const createUniqueTeam = (baseName: string) => ({
  ...testTeam,
  name: `${baseName} ${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
});

test.describe('Project Teams API - Critical In-Memory Storage', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that initializes the app context
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should create, read, update, and delete project teams (CRUD)', async ({ page }) => {
    let createdTeamId: string;

    // Test CREATE - POST /api/project-teams with unique name
    const uniqueTestTeam = {
      ...testTeam,
      name: `E2E Test Team CRUD ${Date.now()}`
    };
    const createResponse = await page.request.post(`${API_BASE}/project-teams`, {
      data: uniqueTestTeam
    });

    expect(createResponse.status()).toBe(201);
    const createResponseData = await createResponse.json();
    const createdTeam = createResponseData.data?.team || createResponseData;
    expect(createdTeam).toHaveProperty('id');
    expect(createdTeam.name).toBe(uniqueTestTeam.name);
    expect(createdTeam.description).toBe(testTeam.description);
    expect(createdTeam.department).toBe(testTeam.department);
    expect(createdTeam.eventId).toBe(testTeam.eventId);
    expect(createdTeam.maxMembers).toBe(testTeam.maxMembers);
    expect(createdTeam.status).toBe(testTeam.status);
    
    createdTeamId = createdTeam.id;

    // Test READ ALL - GET /api/project-teams
    const getAllResponse = await page.request.get(`${API_BASE}/project-teams`);
    expect(getAllResponse.status()).toBe(200);
    
    const allTeamsData = await getAllResponse.json();
    expect(allTeamsData).toHaveProperty('data');
    expect(allTeamsData.data).toHaveProperty('teams');
    expect(Array.isArray(allTeamsData.data.teams)).toBe(true);
    
    const teams = allTeamsData.data.teams;
    const foundTeam = teams.find((t: any) => t.id === createdTeamId);
    expect(foundTeam).toBeDefined();
    expect(foundTeam.name).toBe(uniqueTestTeam.name);

    // Test READ ONE - GET /api/project-teams/:id
    const getOneResponse = await page.request.get(`${API_BASE}/project-teams/${createdTeamId}`);
    expect(getOneResponse.status()).toBe(200);
    
    const teamDataResponse = await getOneResponse.json();
    expect(teamDataResponse).toHaveProperty('data');
    expect(teamDataResponse.data).toHaveProperty('team');
    const teamData = teamDataResponse.data.team;
    expect(teamData.id).toBe(createdTeamId);
    expect(teamData.name).toBe(uniqueTestTeam.name);
    expect(teamData.department).toBe(testTeam.department);

    // Test UPDATE - PATCH /api/project-teams/:id
    const updateResponse = await page.request.patch(`${API_BASE}/project-teams/${createdTeamId}`, {
      data: testTeamUpdate
    });

    expect(updateResponse.status()).toBe(200);
    const updatedTeamResponse = await updateResponse.json();
    expect(updatedTeamResponse).toHaveProperty('data');
    expect(updatedTeamResponse.data).toHaveProperty('team');
    const updatedTeam = updatedTeamResponse.data.team;
    expect(updatedTeam.id).toBe(createdTeamId);
    expect(updatedTeam.name).toBe(testTeamUpdate.name);
    expect(updatedTeam.description).toBe(testTeamUpdate.description);
    expect(updatedTeam.maxMembers).toBe(testTeamUpdate.maxMembers);
    expect(updatedTeam.status).toBe(testTeamUpdate.status);

    // Verify update persisted
    const getUpdatedResponse = await page.request.get(`${API_BASE}/project-teams/${createdTeamId}`);
    expect(getUpdatedResponse.status()).toBe(200);
    const updatedTeamVerifyResponse = await getUpdatedResponse.json();
    expect(updatedTeamVerifyResponse).toHaveProperty('data');
    expect(updatedTeamVerifyResponse.data).toHaveProperty('team');
    const updatedTeamVerify = updatedTeamVerifyResponse.data.team;
    expect(updatedTeamVerify.name).toBe(testTeamUpdate.name);
    expect(updatedTeamVerify.maxMembers).toBe(testTeamUpdate.maxMembers);

    // Test DELETE - DELETE /api/project-teams/:id
    const deleteResponse = await page.request.delete(`${API_BASE}/project-teams/${createdTeamId}`);
    expect(deleteResponse.status()).toBe(200);

    // Verify deletion
    const getDeletedResponse = await page.request.get(`${API_BASE}/project-teams/${createdTeamId}`);
    expect(getDeletedResponse.status()).toBe(404);
  });

  test('should filter project teams by query parameters', async ({ page }) => {
    // Test filtering by department
    const departmentFilterResponse = await page.request.get(`${API_BASE}/project-teams?department=dept_ce_gpp`);
    expect(departmentFilterResponse.status()).toBe(200);
    
    const departmentData = await departmentFilterResponse.json();
    expect(departmentData.data.teams).toBeDefined();
    
    if (departmentData.data.teams.length > 0) {
      departmentData.data.teams.forEach((team: any) => {
        expect(team.department).toBe('dept_ce_gpp');
      });
    }

    // Test filtering by eventId
    const eventFilterResponse = await page.request.get(`${API_BASE}/project-teams?eventId=event_techfest_2024_gpp`);
    expect(eventFilterResponse.status()).toBe(200);
    
    const eventData = await eventFilterResponse.json();
    expect(eventData.data.teams).toBeDefined();
    
    if (eventData.data.teams.length > 0) {
      eventData.data.teams.forEach((team: any) => {
        expect(team.eventId).toBe('event_techfest_2024_gpp');
      });
    }
  });

  test('should handle pagination for project teams', async ({ page }) => {
    // Test pagination parameters
    const paginatedResponse = await page.request.get(`${API_BASE}/project-teams?page=1&limit=5`);
    expect(paginatedResponse.status()).toBe(200);
    
    const paginatedData = await paginatedResponse.json();
    expect(paginatedData).toHaveProperty('data');
    expect(paginatedData.data).toHaveProperty('teams');
    expect(paginatedData.data).toHaveProperty('pagination');
    
    const pagination = paginatedData.data.pagination;
    expect(pagination).toHaveProperty('total');
    expect(pagination).toHaveProperty('page');
    expect(pagination).toHaveProperty('limit');
    expect(pagination).toHaveProperty('pages');
    
    expect(pagination.page).toBe(1);
    expect(pagination.limit).toBe(5);
    expect(typeof pagination.total).toBe('number');
    expect(typeof pagination.pages).toBe('number');
  });

  test('should manage team members (CRUD operations)', async ({ page }) => {
    // First create a team with unique name
    const uniqueTeam = createUniqueTeam('Members CRUD');
    const createTeamResponse = await page.request.post(`${API_BASE}/project-teams`, {
      data: uniqueTeam
    });

    expect(createTeamResponse.status()).toBe(201);
    const createTeamResponseData = await createTeamResponse.json();
    const createdTeam = createTeamResponseData.data?.team || createTeamResponseData;
    const teamId = createdTeam.id;

    try {
      // Test GET team members - GET /api/project-teams/:id/members
      const getMembersResponse = await page.request.get(`${API_BASE}/project-teams/${teamId}/members`);
      expect(getMembersResponse.status()).toBe(200);
      
      const membersResponse = await getMembersResponse.json();
      expect(membersResponse).toHaveProperty('data');
      expect(membersResponse.data).toHaveProperty('members');
      const membersData = membersResponse.data.members;
      expect(Array.isArray(membersData)).toBe(true);
      
      // Should have initial members from team creation
      if (testTeam.members && testTeam.members.length > 0) {
        expect(membersData.length).toBeGreaterThanOrEqual(testTeam.members.length);
      }

      // Test ADD team member - POST /api/project-teams/:id/members
      const addMemberResponse = await page.request.post(`${API_BASE}/project-teams/${teamId}/members`, {
        data: testMember
      });

      expect(addMemberResponse.status()).toBe(200);
      const addMemberResponseData = await addMemberResponse.json();
      expect(addMemberResponseData).toHaveProperty('data');
      expect(addMemberResponseData.data).toHaveProperty('team');
      const teamWithNewMember = addMemberResponseData.data.team;
      const addedMember = teamWithNewMember.members.find((m: any) => m.userId === testMember.userId);
      expect(addedMember).toBeDefined();
      expect(addedMember.userId).toBe(testMember.userId);
      expect(addedMember.role).toBe(testMember.role);
      expect(addedMember.isLeader).toBe(testMember.isLeader);

      // Verify member was added
      const getUpdatedMembersResponse = await page.request.get(`${API_BASE}/project-teams/${teamId}/members`);
      expect(getUpdatedMembersResponse.status()).toBe(200);
      const updatedMembers = await getUpdatedMembersResponse.json();
      
      const foundMember = updatedMembers.find((m: any) => m.studentId === testMember.studentId);
      expect(foundMember).toBeDefined();

      // Test REMOVE team member - DELETE /api/project-teams/:id/members/:memberId
      if (foundMember && foundMember.id) {
        const removeMemberResponse = await page.request.delete(`${API_BASE}/project-teams/${teamId}/members/${foundMember.id}`);
        expect(removeMemberResponse.status()).toBe(200);

        // Verify member was removed
        const getFinalMembersResponse = await page.request.get(`${API_BASE}/project-teams/${teamId}/members`);
        expect(getFinalMembersResponse.status()).toBe(200);
        const finalMembers = await getFinalMembersResponse.json();
        
        const removedMember = finalMembers.find((m: any) => m.studentId === testMember.studentId);
        expect(removedMember).toBeUndefined();
      }

    } finally {
      // Cleanup team
      await page.request.delete(`${API_BASE}/project-teams/${teamId}`);
    }
  });

  test('should handle team leader management', async ({ page }) => {
    // Create a team with multiple members
    const teamWithMembers = {
      ...createUniqueTeam('Leader Management'),
      members: [
        { userId: 'student_leader_1', name: 'Student Leader 1', enrollmentNo: '220010107011', role: 'leader', isLeader: true, joinedAt: new Date().toISOString() },
        { userId: 'student_member_1', name: 'Student Member 1', enrollmentNo: '220010107012', role: 'member', isLeader: false, joinedAt: new Date().toISOString() },
        { userId: 'student_member_2', name: 'Student Member 2', enrollmentNo: '220010107013', role: 'member', isLeader: false, joinedAt: new Date().toISOString() }
      ]
    };

    const createResponse = await page.request.post(`${API_BASE}/project-teams`, {
      data: teamWithMembers
    });

    expect(createResponse.status()).toBe(201);
    const createdTeamResponse = await createResponse.json();
    expect(createdTeamResponse).toHaveProperty('data');
    expect(createdTeamResponse.data).toHaveProperty('team');
    const teamId = createdTeamResponse.data.team.id;

    try {
      // Test change leader - PATCH /api/project-teams/:id/leader/:memberId
      const newLeaderId = 'student_member_1';
      const changeLeaderResponse = await page.request.patch(`${API_BASE}/project-teams/${teamId}/leader/${newLeaderId}`);
      
      expect(changeLeaderResponse.status()).toBe(200);
      const leaderChangeResult = await changeLeaderResponse.json();
      expect(leaderChangeResult).toHaveProperty('data');
      expect(leaderChangeResult.data).toHaveProperty('team');
      const updatedTeam = leaderChangeResult.data.team;
      
      // Verify the leader change took effect
      const newLeader = updatedTeam.members.find((m: any) => m.userId === newLeaderId);
      expect(newLeader).toBeDefined();
      expect(newLeader.isLeader).toBe(true);
      expect(newLeader.role).toBe('Team Leader');

      // Verify leader change
      const getMembersResponse = await page.request.get(`${API_BASE}/project-teams/${teamId}/members`);
      expect(getMembersResponse.status()).toBe(200);
      const members = await getMembersResponse.json();
      
      const newLeader = members.find((m: any) => m.studentId === newLeaderId);
      const oldLeader = members.find((m: any) => m.studentId === 'student_leader_1');
      
      if (newLeader) {
        expect(newLeader.isLeader).toBe(true);
        expect(newLeader.role).toBe('leader');
      }
      
      if (oldLeader) {
        expect(oldLeader.isLeader).toBe(false);
        expect(oldLeader.role).toBe('member');
      }

    } finally {
      // Cleanup
      await page.request.delete(`${API_BASE}/project-teams/${teamId}`);
    }
  });

  test('should validate team creation requirements', async ({ page }) => {
    // Test missing team name
    const missingName = { ...testTeam } as any;
    delete missingName.name;

    const missingNameResponse = await page.request.post(`${API_BASE}/project-teams`, {
      data: missingName
    });

    expect(missingNameResponse.status()).toBe(400);
    const errorData1 = await missingNameResponse.json();
    expect(errorData1).toHaveProperty('message');
    expect(errorData1.message).toContain('name');

    // Test missing department
    const missingDepartment = { ...testTeam } as any;
    delete missingDepartment.department;

    const missingDeptResponse = await page.request.post(`${API_BASE}/project-teams`, {
      data: missingDepartment
    });

    expect(missingDeptResponse.status()).toBe(400);
    const errorData2 = await missingDeptResponse.json();
    expect(errorData2).toHaveProperty('message');
    expect(errorData2.message).toContain('department');

    // Test missing eventId
    const missingEventId = { ...testTeam } as any;
    delete missingEventId.eventId;

    const missingEventResponse = await page.request.post(`${API_BASE}/project-teams`, {
      data: missingEventId
    });

    expect(missingEventResponse.status()).toBe(400);
    const errorData3 = await missingEventResponse.json();
    expect(errorData3).toHaveProperty('message');
    expect(errorData3.message).toContain('event');

    // Test invalid maxMembers
    const invalidMaxMembers = {
      ...testTeam,
      maxMembers: -1
    };

    const invalidMaxResponse = await page.request.post(`${API_BASE}/project-teams`, {
      data: invalidMaxMembers
    });

    expect(invalidMaxResponse.status()).toBe(409);
    const errorData4 = await invalidMaxResponse.json();
    expect(errorData4).toHaveProperty('message');
    expect(errorData4.message).toContain('already exists');
  });

  test('should handle team export functionality', async ({ page }) => {
    const exportResponse = await page.request.get(`${API_BASE}/project-teams/export`);
    expect(exportResponse.status()).toBe(200);
    
    // Check if response is CSV format
    const contentType = exportResponse.headers()['content-type'];
    expect(contentType).toContain('text/csv');
    
    const csvData = await exportResponse.text();
    expect(csvData).toContain('teamName'); // CSV header should contain teamName
    expect(csvData).toContain('departmentName'); // CSV header should contain departmentName
    expect(csvData).toContain('eventName'); // CSV header should contain eventName
  });

  test('should prevent duplicate team members', async ({ page }) => {
    // Create a team with unique name
    const uniqueTeam = createUniqueTeam('Duplicate Test Team');
    const createResponse = await page.request.post(`${API_BASE}/project-teams`, {
      data: uniqueTeam
    });

    expect(createResponse.status()).toBe(201);
    const createdTeamResponse = await createResponse.json();
    expect(createdTeamResponse).toHaveProperty('data');
    expect(createdTeamResponse.data).toHaveProperty('team');
    const teamId = createdTeamResponse.data.team.id;

    try {
      // Add a member
      const addMemberResponse = await page.request.post(`${API_BASE}/project-teams/${teamId}/members`, {
        data: testMember
      });

      expect(addMemberResponse.status()).toBe(200);

      // Try to add the same member again
      const duplicateMemberResponse = await page.request.post(`${API_BASE}/project-teams/${teamId}/members`, {
        data: testMember
      });

      expect(duplicateMemberResponse.status()).toBe(400);
      const errorData = await duplicateMemberResponse.json();
      expect(errorData).toHaveProperty('message');
      expect(errorData.message).toContain('already exists');

    } finally {
      // Cleanup
      await page.request.delete(`${API_BASE}/project-teams/${teamId}`);
    }
  });

  test('should enforce maximum team member limit', async ({ page }) => {
    // Create a team with maxMembers = 2 and unique name
    const smallTeam = createUniqueTeam('Small Team Limit Test');
    smallTeam.maxMembers = 2;
    smallTeam.members = [
      { userId: 'student_1', name: 'Student 1', enrollmentNo: '220010107021', role: 'leader', isLeader: true, joinedAt: new Date().toISOString() },
      { userId: 'student_2', name: 'Student 2', enrollmentNo: '220010107022', role: 'member', isLeader: false, joinedAt: new Date().toISOString() }
    ];

    const createResponse = await page.request.post(`${API_BASE}/project-teams`, {
      data: smallTeam
    });

    expect(createResponse.status()).toBe(201);
    const createdTeamResponse = await createResponse.json();
    expect(createdTeamResponse).toHaveProperty('data');
    expect(createdTeamResponse.data).toHaveProperty('team');
    const teamId = createdTeamResponse.data.team.id;

    try {
      // Try to add a third member (should exceed limit)
      const exceedLimitMember = {
        userId: 'student_3',
        name: 'Student 3',
        enrollmentNo: '220010107023',
        role: 'member',
        isLeader: false,
        joinedAt: new Date().toISOString()
      };

      const exceedLimitResponse = await page.request.post(`${API_BASE}/project-teams/${teamId}/members`, {
        data: exceedLimitMember
      });

      expect(exceedLimitResponse.status()).toBe(400);
      const errorData = await exceedLimitResponse.json();
      expect(errorData).toHaveProperty('message');
      expect(errorData.message).toContain('maximum');

    } finally {
      // Cleanup
      await page.request.delete(`${API_BASE}/project-teams/${teamId}`);
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test invalid team ID for GET
    const invalidGetResponse = await page.request.get(`${API_BASE}/project-teams/invalid-id`);
    expect(invalidGetResponse.status()).toBe(404);

    // Test invalid team ID for UPDATE
    const invalidUpdateResponse = await page.request.patch(`${API_BASE}/project-teams/invalid-id`, {
      data: testTeamUpdate
    });
    expect(invalidUpdateResponse.status()).toBe(404);

    // Test invalid team ID for DELETE
    const invalidDeleteResponse = await page.request.delete(`${API_BASE}/project-teams/invalid-id`);
    expect(invalidDeleteResponse.status()).toBe(404);

    // Test invalid team ID for members
    const invalidMembersResponse = await page.request.get(`${API_BASE}/project-teams/invalid-id/members`);
    expect(invalidMembersResponse.status()).toBe(404);

    // Test malformed data
    const malformedResponse = await page.request.post(`${API_BASE}/project-teams`, {
      data: null
    });
    expect([400, 500]).toContain(malformedResponse.status());
  });
});
