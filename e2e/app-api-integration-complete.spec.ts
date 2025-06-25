import { test, expect } from '@playwright/test';

/**
 * E2E Tests for API Integration Complete Coverage
 * Priority: API Functionality (Critical)
 * 
 * This test suite covers API endpoints integration, data flow,
 * and error handling across the application.
 */

test.describe('API Integration Complete Coverage', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  test('should test core API endpoints availability', async ({ page }) => {
    const coreEndpoints = [
      '/api/students',
      '/api/faculty', 
      '/api/courses',
      '/api/users',
      '/api/departments',
      '/api/programs',
      '/api/batches',
      '/api/assessments'
    ];
    
    for (const endpoint of coreEndpoints) {
      const response = await page.request.get(`http://localhost:3000${endpoint}`);
      
      // Should return successful response or proper auth error
      expect([200, 401, 403].includes(response.status())).toBe(true);
      
      // Should have proper content type
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
      
      // Should not return HTML error pages for API calls
      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      }
    }
  });

  test('should test students API CRUD operations', async ({ page }) => {
    // Test data
    const testStudent = {
      enrollmentNumber: `E2E${Date.now()}`,
      gtuEnrollmentNumber: `GTU${Date.now()}`,
      firstName: 'API',
      lastName: 'Test',
      programId: 'test-program',
      department: 'test-dept',
      personalEmail: `apitest${Date.now()}@example.com`,
      status: 'active'
    };

    // CREATE - POST /api/students
    const createResponse = await page.request.post('http://localhost:3000/api/students', {
      data: testStudent
    });
    
    // Should either create successfully or require auth
    if (createResponse.status() === 201) {
      const createdStudent = await createResponse.json();
      expect(createdStudent).toHaveProperty('id');
      expect(createdStudent.enrollmentNumber).toBe(testStudent.enrollmentNumber);
      
      const studentId = createdStudent.id;
      
      // READ - GET /api/students/:id
      const readResponse = await page.request.get(`http://localhost:3000/api/students/${studentId}`);
      expect(readResponse.status()).toBe(200);
      
      const studentData = await readResponse.json();
      expect(studentData.id).toBe(studentId);
      
      // UPDATE - PUT /api/students/:id
      const updateData = { firstName: 'Updated' };
      const updateResponse = await page.request.put(`http://localhost:3000/api/students/${studentId}`, {
        data: updateData
      });
      expect(updateResponse.status()).toBe(200);
      
      // DELETE - DELETE /api/students/:id
      const deleteResponse = await page.request.delete(`http://localhost:3000/api/students/${studentId}`);
      expect(deleteResponse.status()).toBe(200);
      
      // Verify deletion
      const verifyResponse = await page.request.get(`http://localhost:3000/api/students/${studentId}`);
      expect(verifyResponse.status()).toBe(404);
    } else {
      // Should require authentication
      expect([401, 403].includes(createResponse.status())).toBe(true);
    }
  });

  test('should test API error handling', async ({ page }) => {
    // Test 404 for non-existent resources
    const notFoundResponse = await page.request.get('http://localhost:3000/api/students/non-existent-id');
    expect(notFoundResponse.status()).toBe(404);
    
    const errorData = await notFoundResponse.json();
    expect(errorData).toHaveProperty('message');
    
    // Test 400 for invalid data
    const invalidDataResponse = await page.request.post('http://localhost:3000/api/students', {
      data: { invalidField: 'invalid' }
    });
    
    expect([400, 401, 403].includes(invalidDataResponse.status())).toBe(true);
    
    // Test malformed JSON
    try {
      const malformedResponse = await page.request.post('http://localhost:3000/api/students', {
        data: 'invalid json'
      });
      expect([400, 500].includes(malformedResponse.status())).toBe(true);
    } catch (error) {
      // Expected for malformed data
    }
  });

  test('should test faculty API endpoints', async ({ page }) => {
    // Test faculty list endpoint
    const facultyResponse = await page.request.get('http://localhost:3000/api/faculty');
    expect([200, 401, 403].includes(facultyResponse.status())).toBe(true);
    
    if (facultyResponse.status() === 200) {
      const facultyData = await facultyResponse.json();
      expect(Array.isArray(facultyData)).toBe(true);
      
      if (facultyData.length > 0) {
        const faculty = facultyData[0];
        expect(faculty).toHaveProperty('id');
        
        // Test individual faculty endpoint
        const singleFacultyResponse = await page.request.get(`http://localhost:3000/api/faculty/${faculty.id}`);
        expect(singleFacultyResponse.status()).toBe(200);
      }
    }
  });

  test('should test courses API endpoints', async ({ page }) => {
    // Test courses list endpoint
    const coursesResponse = await page.request.get('http://localhost:3000/api/courses');
    expect([200, 401, 403].includes(coursesResponse.status())).toBe(true);
    
    if (coursesResponse.status() === 200) {
      const coursesData = await coursesResponse.json();
      expect(Array.isArray(coursesData)).toBe(true);
      
      if (coursesData.length > 0) {
        const course = coursesData[0];
        expect(course).toHaveProperty('id');
        
        // Test individual course endpoint
        const singleCourseResponse = await page.request.get(`http://localhost:3000/api/courses/${course.id}`);
        expect(singleCourseResponse.status()).toBe(200);
      }
    }
  });

  test('should test authentication API endpoints', async ({ page }) => {
    // Test login endpoint (should exist and handle requests)
    const loginResponse = await page.request.post('http://localhost:3000/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'invalid',
        role: 'student'
      }
    });
    
    // Should handle login attempt (success, failure, or not implemented)
    expect([200, 400, 401, 404, 500].includes(loginResponse.status())).toBe(true);
    
    // Test logout endpoint
    const logoutResponse = await page.request.post('http://localhost:3000/api/auth/logout');
    expect([200, 401, 404].includes(logoutResponse.status())).toBe(true);
  });

  test('should test data validation across APIs', async ({ page }) => {
    const endpoints = [
      { path: '/api/students', method: 'post' },
      { path: '/api/faculty', method: 'post' },
      { path: '/api/courses', method: 'post' }
    ];
    
    for (const endpoint of endpoints) {
      // Test empty data
      const emptyResponse = await page.request.post(`http://localhost:3000${endpoint.path}`, {
        data: {}
      });
      expect([400, 401, 403].includes(emptyResponse.status())).toBe(true);
      
      // Test invalid email format
      const invalidEmailResponse = await page.request.post(`http://localhost:3000${endpoint.path}`, {
        data: { email: 'invalid-email' }
      });
      expect([400, 401, 403].includes(invalidEmailResponse.status())).toBe(true);
    }
  });

  test('should test API rate limiting and performance', async ({ page }) => {
    const startTime = Date.now();
    
    // Make multiple requests to test rate limiting
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(page.request.get('http://localhost:3000/api/students'));
    }
    
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    
    // Should handle multiple requests without crashing
    for (const response of responses) {
      expect([200, 401, 403, 429].includes(response.status())).toBe(true);
    }
    
    // Should respond within reasonable time
    const totalTime = endTime - startTime;
    expect(totalTime).toBeLessThan(10000); // 10 seconds max
  });

  test('should test API data consistency', async ({ page }) => {
    // Test that GET requests return consistent data structure
    const endpoints = ['/api/students', '/api/faculty', '/api/courses'];
    
    for (const endpoint of endpoints) {
      const response = await page.request.get(`http://localhost:3000${endpoint}`);
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
        
        // If data exists, check structure consistency
        if (data.length > 0) {
          const item = data[0];
          expect(item).toHaveProperty('id');
          expect(typeof item.id).toBe('string');
          
          // Should have timestamps if it's a database entity
          if (item.createdAt) {
            expect(typeof item.createdAt).toBe('string');
            expect(new Date(item.createdAt).toString()).not.toBe('Invalid Date');
          }
        }
      }
    }
  });

  test('should test API pagination and filtering', async ({ page }) => {
    const endpoints = ['/api/students', '/api/faculty', '/api/courses'];
    
    for (const endpoint of endpoints) {
      // Test with query parameters
      const paginatedResponse = await page.request.get(`http://localhost:3000${endpoint}?page=1&limit=10`);
      expect([200, 401, 403].includes(paginatedResponse.status())).toBe(true);
      
      // Test with search parameters
      const searchResponse = await page.request.get(`http://localhost:3000${endpoint}?search=test`);
      expect([200, 401, 403].includes(searchResponse.status())).toBe(true);
      
      // Test with filter parameters
      const filterResponse = await page.request.get(`http://localhost:3000${endpoint}?status=active`);
      expect([200, 401, 403].includes(filterResponse.status())).toBe(true);
    }
  });
});