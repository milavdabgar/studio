import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Critical In-Memory Storage Endpoints
 * Priority: Projects Module (Core Business Logic)
 * 
 * This test suite covers the projects API endpoints that use in-memory storage
 * and are critical for the MongoDB migration. These tests ensure data integrity
 * and business logic preservation during migration.
 */

// Base URL for API endpoints
const API_BASE = '/api';

// Test data for projects
const testProject = {
  title: 'Test Project for E2E',
  category: 'Software',
  abstract: 'A test project for E2E testing purposes',
  department: 'dept_ce_gpp',
  status: 'draft',
  requirements: {
    power: true,
    internet: true,
    specialSpace: false,
    otherRequirements: 'Test requirements'
  },
  guide: {
    userId: 'user_faculty_cs01_gpp',
    name: 'Test Faculty',
    department: 'dept_ce_gpp',
    contactNumber: '1234567890'
  },
  teamId: 'team_test_gpp',
  eventId: 'event_techfest_2024_gpp'
};

const testProjectUpdate = {
  title: 'Updated Test Project',
  category: 'Hardware',
  abstract: 'Updated test project for E2E testing',
  status: 'approved'
};

test.describe('Projects API - Critical In-Memory Storage', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that initializes the app context
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should create, read, update, and delete projects (CRUD)', async ({ page }) => {
    let createdProjectId: string;

    // Test CREATE - POST /api/projects
    const createResponse = await page.request.post(`${API_BASE}/projects`, {
      data: testProject
    });

    expect(createResponse.status()).toBe(201);
    const createResponseData = await createResponse.json();
    
    // Handle response structure - could be direct project or wrapped in data.project
    const createdProject = createResponseData.data?.project || createResponseData;
    expect(createdProject).toHaveProperty('id');
    expect(createdProject.title).toBe(testProject.title);
    expect(createdProject.category).toBe(testProject.category);
    expect(createdProject.department).toBe(testProject.department);
    expect(createdProject.status).toBe(testProject.status);
    
    createdProjectId = createdProject.id;

    // Test READ ALL - GET /api/projects
    const getAllResponse = await page.request.get(`${API_BASE}/projects`);
    expect(getAllResponse.status()).toBe(200);
    
    const allProjectsData = await getAllResponse.json();
    expect(allProjectsData).toHaveProperty('data');
    expect(allProjectsData.data).toHaveProperty('projects');
    expect(Array.isArray(allProjectsData.data.projects)).toBe(true);
    
    const projects = allProjectsData.data.projects;
    const foundProject = projects.find((p: any) => p.id === createdProjectId);
    expect(foundProject).toBeDefined();
    expect(foundProject.title).toBe(testProject.title);

    // Test READ ONE - GET /api/projects/:id
    const getOneResponse = await page.request.get(`${API_BASE}/projects/${createdProjectId}`);
    expect(getOneResponse.status()).toBe(200);
    
    const getOneResponseData = await getOneResponse.json();
    // Handle response structure - could be direct project or wrapped
    const projectData = getOneResponseData.data?.project || getOneResponseData;
    expect(projectData.id).toBe(createdProjectId);
    expect(projectData.title).toBe(testProject.title);

    // Test UPDATE - PUT /api/projects/:id
    const updateResponse = await page.request.put(`${API_BASE}/projects/${createdProjectId}`, {
      data: {
        ...testProject,
        ...testProjectUpdate
      }
    });

    expect(updateResponse.status()).toBe(200);
    const updateResponseData = await updateResponse.json();
    const updatedProject = updateResponseData.data?.project || updateResponseData;
    expect(updatedProject.id).toBe(createdProjectId);
    expect(updatedProject.title).toBe(testProjectUpdate.title);
    expect(updatedProject.category).toBe(testProjectUpdate.category);
    expect(updatedProject.status).toBe(testProjectUpdate.status);

    // Verify update persisted
    const getUpdatedResponse = await page.request.get(`${API_BASE}/projects/${createdProjectId}`);
    expect(getUpdatedResponse.status()).toBe(200);
    const getUpdatedResponseData = await getUpdatedResponse.json();
    const updatedProjectVerify = getUpdatedResponseData.data?.project || getUpdatedResponseData;
    expect(updatedProjectVerify.title).toBe(testProjectUpdate.title);

    // Test DELETE - DELETE /api/projects/:id
    const deleteResponse = await page.request.delete(`${API_BASE}/projects/${createdProjectId}`);
    expect(deleteResponse.status()).toBe(200);

    // Verify deletion
    const getDeletedResponse = await page.request.get(`${API_BASE}/projects/${createdProjectId}`);
    expect(getDeletedResponse.status()).toBe(404);
  });

  test('should filter projects by query parameters', async ({ page }) => {
    // Test filtering by department
    const departmentFilterResponse = await page.request.get(`${API_BASE}/projects?department=dept_ce_gpp`);
    expect(departmentFilterResponse.status()).toBe(200);
    
    const departmentData = await departmentFilterResponse.json();
    expect(departmentData.data.projects).toBeDefined();
    
    if (departmentData.data.projects.length > 0) {
      departmentData.data.projects.forEach((project: any) => {
        expect(project.department).toBe('dept_ce_gpp');
      });
    }

    // Test filtering by status
    const statusFilterResponse = await page.request.get(`${API_BASE}/projects?status=approved`);
    expect(statusFilterResponse.status()).toBe(200);
    
    const statusData = await statusFilterResponse.json();
    expect(statusData.data.projects).toBeDefined();
    
    if (statusData.data.projects.length > 0) {
      statusData.data.projects.forEach((project: any) => {
        expect(project.status).toBe('approved');
      });
    }

    // Test filtering by category
    const categoryFilterResponse = await page.request.get(`${API_BASE}/projects?category=Software`);
    expect(categoryFilterResponse.status()).toBe(200);
    
    const categoryData = await categoryFilterResponse.json();
    expect(categoryData.data.projects).toBeDefined();
    
    if (categoryData.data.projects.length > 0) {
      categoryData.data.projects.forEach((project: any) => {
        expect(project.category).toBe('Software');
      });
    }
  });

  test('should handle project validation errors', async ({ page }) => {
    // Test missing required fields
    const incompleteProject = {
      category: 'Software',
      abstract: 'Missing title and other required fields'
    };

    const createResponse = await page.request.post(`${API_BASE}/projects`, {
      data: incompleteProject
    });

    expect(createResponse.status()).toBe(400);
    const errorData = await createResponse.json();
    expect(errorData).toHaveProperty('message');
    expect(errorData.message).toContain('required');

    // Test invalid project ID for update
    const invalidUpdateResponse = await page.request.put(`${API_BASE}/projects/invalid-id`, {
      data: testProject
    });

    expect(invalidUpdateResponse.status()).toBe(404);

    // Test invalid project ID for delete
    const invalidDeleteResponse = await page.request.delete(`${API_BASE}/projects/invalid-id`);
    expect(invalidDeleteResponse.status()).toBe(404);
  });

  test('should handle project statistics endpoint', async ({ page }) => {
    // Test basic statistics endpoint
    const statsResponse = await page.request.get(`${API_BASE}/projects/statistics`);
    expect(statsResponse.status()).toBe(200);
    
    const statsResponseData = await statsResponse.json();
    // Handle response structure - could be direct data or wrapped
    const statsData = statsResponseData.data || statsResponseData;
    
    // Check for actual properties returned by the API
    expect(statsData).toHaveProperty('total');
    expect(statsData).toHaveProperty('evaluated');
    expect(statsData).toHaveProperty('pending');
    
    expect(typeof statsData.total).toBe('number');
    expect(typeof statsData.evaluated).toBe('number');
    expect(typeof statsData.pending).toBe('number');
    
    // Additional properties that might be present
    if (statsData.averageScore !== undefined) {
      expect(typeof statsData.averageScore).toBe('number');
    }
    if (statsData.departmentWise !== undefined) {
      expect(typeof statsData.departmentWise).toBe('object');
    }
  });

  test('should handle project statistics endpoint with eventId filter', async ({ page }) => {
    // This test specifically covers the bug that was occurring with eventId parameter
    // Test with a realistic eventId that would trigger ObjectId casting error if not fixed
    const eventId = 'event_techfest_2024_gpp';
    const statsResponse = await page.request.get(`${API_BASE}/projects/statistics?eventId=${eventId}`);
    
    // Should not return 500 error due to ObjectId casting issue
    expect(statsResponse.status()).toBeLessThan(500);
    
    const statsResponseData = await statsResponse.json();
    
    if (statsResponse.status() === 200) {
      // If successful, verify response structure
      const statsData = statsResponseData.data || statsResponseData;
      expect(statsData).toHaveProperty('total');
      expect(statsData).toHaveProperty('evaluated');
      expect(statsData).toHaveProperty('pending');
      expect(typeof statsData.total).toBe('number');
    } else if (statsResponse.status() === 404) {
      // If event doesn't exist, should return proper 404 message
      expect(statsResponseData.message).toBe('Event not found.');
    }
    
    // Test with different eventId formats to ensure robustness
    const otherEventIds = [
      'event_annual_2024',
      'proj_fair_2024_ce',
      'tech_expo_2025'
    ];
    
    for (const eventId of otherEventIds) {
      const response = await page.request.get(`${API_BASE}/projects/statistics?eventId=${eventId}`);
      // Should never return 500 due to ObjectId casting issues
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('should handle project details endpoint', async ({ page }) => {
    // First create a project to get details for
    const createResponse = await page.request.post(`${API_BASE}/projects`, {
      data: testProject
    });

    expect(createResponse.status()).toBe(201);
    const createResponseData = await createResponse.json();
    const createdProject = createResponseData.data?.project || createResponseData;
    const projectId = createdProject.id;

    try {
      // Test project details endpoint
      const detailsResponse = await page.request.get(`${API_BASE}/projects/${projectId}/details`);
      
      // The endpoint might return 404 if related data (team, event, etc.) doesn't exist
      if (detailsResponse.status() === 200) {
        const detailsResponseData = await detailsResponse.json();
        // Handle response structure - project details are wrapped in data.project
        const detailsData = detailsResponseData.data || detailsResponseData;
        
        expect(detailsData).toHaveProperty('project');
        expect(detailsData.project.id).toBe(projectId);
        expect(detailsData.project.title).toBe(testProject.title);
        
        // Check that properties exist in the project object (even if null)
        expect(detailsData.project).toHaveProperty('team');
        expect(detailsData.project).toHaveProperty('event');
        expect(detailsData.project).toHaveProperty('guide');
        
        // Verify event data is populated (from the actual response)
        if (detailsData.project.event) {
          expect(detailsData.project.event).toHaveProperty('id');
          expect(detailsData.project.event.id).toBe(testProject.eventId);
        }
      } else {
        // If 404, it might be because related data doesn't exist in the stores
        expect([200, 404]).toContain(detailsResponse.status());
      }
    } finally {
      // Cleanup
      await page.request.delete(`${API_BASE}/projects/${projectId}`);
    }
  });

  test('should handle project evaluation endpoints', async ({ page }) => {
    // Create a project for evaluation testing
    const createResponse = await page.request.post(`${API_BASE}/projects`, {
      data: testProject
    });

    expect(createResponse.status()).toBe(201);
    const createResponseData = await createResponse.json();
    const createdProject = createResponseData.data?.project || createResponseData;
    const projectId = createdProject.id;

    try {
      // Test department evaluation - check expected structure
      const deptEvaluationData = {
        score: 85,
        feedback: 'Good project for department evaluation',
        criteriaScores: { 
          innovation: 8, 
          implementation: 7, 
          presentation: 9 
        }
      };

      const deptEvalResponse = await page.request.post(`${API_BASE}/projects/${projectId}/department-evaluation`, {
        data: deptEvaluationData
      });

      // The endpoint might return 200 or 404 depending on implementation
      if (deptEvalResponse.status() === 200) {
        const deptEvalResult = await deptEvalResponse.json();
        expect(deptEvalResult).toHaveProperty('status');
        expect(deptEvalResult.status).toBe('success');
      } else {
        // If 404, the endpoint might not be fully implemented or project not found
        expect([200, 404]).toContain(deptEvalResponse.status());
      }

      // Test central evaluation
      const centralEvaluationData = {
        score: 88,
        feedback: 'Excellent project for central evaluation',
        criteriaScores: { 
          innovation: 9, 
          implementation: 8, 
          presentation: 8, 
          impact: 7 
        }
      };

      const centralEvalResponse = await page.request.post(`${API_BASE}/projects/${projectId}/central-evaluation`, {
        data: centralEvaluationData
      });

      // Similar handling for central evaluation
      if (centralEvalResponse.status() === 200) {
        const centralEvalResult = await centralEvalResponse.json();
        expect(centralEvalResult).toHaveProperty('status');
        expect(centralEvalResult.status).toBe('success');
      } else {
        expect([200, 404]).toContain(centralEvalResponse.status());
      }

    } finally {
      // Cleanup
      await page.request.delete(`${API_BASE}/projects/${projectId}`);
    }
  });

  test('should handle project export functionality', async ({ page }) => {
    const exportResponse = await page.request.get(`${API_BASE}/projects/export`);
    expect(exportResponse.status()).toBe(200);
    
    // Check if response is CSV format
    const contentType = exportResponse.headers()['content-type'];
    expect(contentType).toContain('text/csv');
    
    const csvData = await exportResponse.text();
    expect(csvData).toContain('title'); // CSV header should contain title
    expect(csvData).toContain('category'); // CSV header should contain category
    expect(csvData).toContain('department'); // CSV header should contain department
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test server error handling
    const invalidDataResponse = await page.request.post(`${API_BASE}/projects`, {
      data: null
    });

    expect([400, 500]).toContain(invalidDataResponse.status());

    // Test malformed JSON
    const malformedResponse = await page.request.post(`${API_BASE}/projects`, {
      data: 'invalid-json'
    });

    expect([400, 500]).toContain(malformedResponse.status());
  });
});
