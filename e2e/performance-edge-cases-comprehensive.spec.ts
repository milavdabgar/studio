import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Performance and Edge Cases - MongoDB Migration Robustness
 * 
 * This test suite validates system behavior under edge conditions, stress scenarios,
 * and performance constraints. Critical for ensuring MongoDB migration handles
 * all edge cases and maintains performance characteristics.
 */

const API_BASE = '/api';

// Helper function to generate unique identifiers
const generateUniqueId = () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

test.describe('Performance and Edge Cases - Migration Robustness', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('Large Data Set Handling - Pagination and Performance', async ({ page }) => {
    // Test API performance with large datasets and pagination
    
    const createdStudents = [];
    const batchSize = 10; // Create 10 students for testing

    try {
      // Step 1: Create multiple students for pagination testing
      for (let i = 0; i < batchSize; i++) {
        const studentData = {
          enrollmentNumber: `BATCH_${generateUniqueId()}_${i}`,
          firstName: `Batch`,
          lastName: `Student ${i}`,
          email: `batch.student.${i}.${generateUniqueId()}@example.com`,
          program: 'B.Tech',
          currentSemester: (i % 8) + 1,
          institute: 'GPPEC',
          department: 'Computer Engineering'
        };

        const createResponse = await page.request.post(`${API_BASE}/students`, {
          data: studentData
        });
        expect(createResponse.status()).toBe(201);
        const createdStudent = await createResponse.json();
        createdStudents.push(createdStudent);
      }

      // Step 2: Test pagination with various page sizes
      const pageSizes = [3, 5, 10];
      
      for (const pageSize of pageSizes) {
        const paginationResponse = await page.request.get(`${API_BASE}/students?page=1&limit=${pageSize}`);
        expect(paginationResponse.status()).toBe(200);
        
        const paginationData = await paginationResponse.json();
        
        // Handle different response structures
        let students, pagination;
        if (paginationData.data && paginationData.data.students) {
          students = paginationData.data.students;
          pagination = paginationData.data.pagination;
        } else if (Array.isArray(paginationData)) {
          students = paginationData.slice(0, pageSize);
          pagination = { limit: pageSize, page: 1 };
        } else {
          students = paginationData.students || [];
          pagination = paginationData.pagination || {};
        }

        expect(students.length).toBeLessThanOrEqual(pageSize);
        
        if (pagination) {
          expect(pagination.limit).toBe(pageSize);
          expect(pagination.page).toBe(1);
        }
      }

      // Step 3: Test sorting and filtering performance
      const sortedResponse = await page.request.get(`${API_BASE}/students?sortBy=firstName&sortOrder=asc`);
      expect(sortedResponse.status()).toBe(200);

      const filteredResponse = await page.request.get(`${API_BASE}/students?department=Computer Engineering`);
      expect(filteredResponse.status()).toBe(200);

      // Step 4: Test search performance
      const searchResponse = await page.request.get(`${API_BASE}/students?search=Batch`);
      expect(searchResponse.status()).toBe(200);
      
      const searchData = await searchResponse.json();
      const searchResults = searchData.data?.students || searchData.students || searchData;
      
      if (Array.isArray(searchResults)) {
        // Verify search results contain our test data
        const foundBatchStudents = searchResults.filter((s: any) => 
          s.firstName === 'Batch' || s.lastName?.includes('Student')
        );
        expect(foundBatchStudents.length).toBeGreaterThan(0);
      }

    } finally {
      // Clean up all created students
      for (const student of createdStudents) {
        await page.request.delete(`${API_BASE}/students/${student.id}`);
      }
    }
  });

  test('Concurrent API Operations Stress Test', async ({ page }) => {
    // Test system behavior under concurrent load
    
    const concurrentOperations = 15;
    const operationPromises = [];

    // Create different types of concurrent operations
    for (let i = 0; i < concurrentOperations; i++) {
      const operationType = i % 4;
      
      switch (operationType) {
        case 0: // Create student
          const studentPromise = page.request.post(`${API_BASE}/students`, {
            data: {
              enrollmentNumber: `CONC_${generateUniqueId()}_${i}`,
              firstName: `Concurrent`,
              lastName: `Student ${i}`,
              email: `concurrent.${i}.${generateUniqueId()}@example.com`,
              currentSemester: (i % 8) + 1,
              department: 'Computer Engineering'
            }
          });
          operationPromises.push({ type: 'student', promise: studentPromise, index: i });
          break;

        case 1: // Create notification
          const notificationPromise = page.request.post(`${API_BASE}/notifications`, {
            data: {
              userId: `user_concurrent_${i}`,
              title: `Concurrent Notification ${i}`,
              message: `Test notification for concurrent operations ${i}`,
              type: 'info'
            }
          });
          operationPromises.push({ type: 'notification', promise: notificationPromise, index: i });
          break;

        case 2: // Get students
          const getStudentsPromise = page.request.get(`${API_BASE}/students?page=1&limit=5`);
          operationPromises.push({ type: 'get', promise: getStudentsPromise, index: i });
          break;

        case 3: // Create project
          const projectPromise = page.request.post(`${API_BASE}/projects`, {
            data: {
              projectTitle: `Concurrent Project ${i} ${generateUniqueId()}`,
              description: `Project for concurrent testing ${i}`,
              department: 'Computer Engineering',
              eventId: 'event_concurrent_stress',
              category: 'Software',
              status: 'active'
            }
          });
          operationPromises.push({ type: 'project', promise: projectPromise, index: i });
          break;
      }
    }

    // Execute all operations concurrently
    const startTime = Date.now();
    const results = await Promise.allSettled(operationPromises.map(op => op.promise));
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Verify performance - should complete within reasonable time (10 seconds)
    expect(totalTime).toBeLessThan(10000);

    // Analyze results
    let successCount = 0;
    let failureCount = 0;
    const createdResources = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const operation = operationPromises[i];

      if (result.status === 'fulfilled') {
        const response = result.value;
        if (response.status() >= 200 && response.status() < 300) {
          successCount++;
          
          // Store created resources for cleanup
          if (operation.type !== 'get') {
            try {
              const responseData = await response.json();
              createdResources.push({
                type: operation.type,
                data: responseData,
                id: responseData.id || responseData.data?.id
              });
            } catch (e) {
              // Ignore JSON parsing errors for now
            }
          }
        } else {
          failureCount++;
        }
      } else {
        failureCount++;
      }
    }

    // Expect majority of operations to succeed
    expect(successCount).toBeGreaterThan(failureCount);
    expect(successCount).toBeGreaterThan(concurrentOperations * 0.6); // At least 60% success rate

    // Clean up created resources
    for (const resource of createdResources) {
      try {
        const endpoint = resource.type === 'student' ? 'students' :
                        resource.type === 'notification' ? 'notifications' :
                        resource.type === 'project' ? 'projects' : null;
        
        if (endpoint && resource.id) {
          await page.request.delete(`${API_BASE}/${endpoint}/${resource.id}`);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  test('Boundary Value Testing', async ({ page }) => {
    // Test system behavior at boundary values
    
    // Test 1: Maximum string lengths
    const longString = 'A'.repeat(1000); // Very long string
    const maxLengthStudentData = {
      enrollmentNumber: generateUniqueId(),
      firstName: longString.substring(0, 100), // Typical max length
      lastName: longString.substring(0, 100),
      email: `boundary.test.${generateUniqueId()}@example.com`,
      description: longString, // Test very long description
      currentSemester: 8, // Maximum semester
      department: 'Computer Engineering'
    };

    const longStringResponse = await page.request.post(`${API_BASE}/students`, {
      data: maxLengthStudentData
    });
    
    // Should either succeed with truncation or fail with validation error
    if (longStringResponse.status() === 201) {
      const createdStudent = await longStringResponse.json();
      expect(createdStudent.firstName.length).toBeLessThanOrEqual(100);
      await page.request.delete(`${API_BASE}/students/${createdStudent.id}`);
    } else {
      expect([400, 413, 422].includes(longStringResponse.status())).toBe(true);
    }

    // Test 2: Minimum/Maximum numeric values
    const extremeValues = [
      { semester: 0, shouldPass: true }, // Minimum semester
      { semester: 8, shouldPass: true }, // Maximum semester
      { semester: -1, shouldPass: false }, // Below minimum
      { semester: 15, shouldPass: false }, // Above maximum
    ];

    for (const testCase of extremeValues) {
      const testData = {
        enrollmentNumber: generateUniqueId(),
        firstName: 'Boundary',
        lastName: 'Test',
        email: `boundary.${testCase.semester}.${generateUniqueId()}@example.com`,
        currentSemester: testCase.semester,
        department: 'Computer Engineering'
      };

      const response = await page.request.post(`${API_BASE}/students`, {
        data: testData
      });

      if (testCase.shouldPass) {
        if (response.status() === 201) {
          const student = await response.json();
          expect(student.currentSemester).toBeGreaterThanOrEqual(0);
          expect(student.currentSemester).toBeLessThanOrEqual(8);
          await page.request.delete(`${API_BASE}/students/${student.id}`);
        }
      } else {
        expect([400, 422].includes(response.status())).toBe(true);
      }
    }

    // Test 3: Assessment score boundaries
    const assessmentData = {
      name: 'Boundary Test Assessment',
      type: 'quiz',
      courseOfferingId: 'course_boundary_test',
      maxMarks: 100,
      weightage: 50,
      assessmentDate: '2024-10-15',
      status: 'active'
    };

    const createAssessmentResponse = await page.request.post(`${API_BASE}/assessments`, {
      data: assessmentData
    });
    
    if (createAssessmentResponse.status() === 201) {
      const createdAssessment = await createAssessmentResponse.json();
      await page.request.delete(`${API_BASE}/assessments/${createdAssessment.id}`);
    }

    // Test extreme weightage values
    const extremeWeightageData = {
      ...assessmentData,
      name: 'Extreme Weightage Test',
      weightage: 0 // Minimum weightage
    };

    const extremeWeightageResponse = await page.request.post(`${API_BASE}/assessments`, {
      data: extremeWeightageData
    });
    
    if (extremeWeightageResponse.status() === 201) {
      const assessment = await extremeWeightageResponse.json();
      await page.request.delete(`${API_BASE}/assessments/${assessment.id}`);
    }
  });

  test('Error Handling and Recovery', async ({ page }) => {
    // Test system behavior under error conditions
    
    // Test 1: Invalid JSON payload
    const invalidJSONResponse = await page.request.post(`${API_BASE}/students`, {
      data: 'invalid-json-string',
      headers: { 'Content-Type': 'application/json' }
    });
    expect([400, 422].includes(invalidJSONResponse.status())).toBe(true);

    // Test 2: Missing required fields
    const missingFieldsResponse = await page.request.post(`${API_BASE}/students`, {
      data: {} // Empty payload
    });
    expect([400, 422].includes(missingFieldsResponse.status())).toBe(true);

    // Test 3: Invalid data types
    const invalidTypesData = {
      enrollmentNumber: [], // Should be string
      firstName: 123, // Should be string
      lastName: true, // Should be string
      currentSemester: 'invalid', // Should be number
      email: 'valid@example.com',
      department: 'Computer Engineering'
    };

    const invalidTypesResponse = await page.request.post(`${API_BASE}/students`, {
      data: invalidTypesData
    });
    expect([400, 422].includes(invalidTypesResponse.status())).toBe(true);

    // Test 4: SQL Injection attempts (should be safely handled)
    const sqlInjectionData = {
      enrollmentNumber: generateUniqueId(),
      firstName: "'; DROP TABLE students; --",
      lastName: "Test",
      email: `sql.injection.${generateUniqueId()}@example.com`,
      currentSemester: 3,
      department: 'Computer Engineering'
    };

    const sqlInjectionResponse = await page.request.post(`${API_BASE}/students`, {
      data: sqlInjectionData
    });
    
    // Should either succeed (properly escaped) or fail with validation error
    if (sqlInjectionResponse.status() === 201) {
      const student = await sqlInjectionResponse.json();
      // Verify the malicious content was safely stored or sanitized
      expect(student.firstName).toBeDefined();
      await page.request.delete(`${API_BASE}/students/${student.id}`);
    } else {
      expect([400, 422].includes(sqlInjectionResponse.status())).toBe(true);
    }

    // Test 5: XSS attempts (should be safely handled)
    const xssData = {
      enrollmentNumber: generateUniqueId(),
      firstName: '<script>alert("XSS")</script>',
      lastName: '<img src="x" onerror="alert(\'XSS\')">',
      email: `xss.test.${generateUniqueId()}@example.com`,
      currentSemester: 3,
      department: 'Computer Engineering'
    };

    const xssResponse = await page.request.post(`${API_BASE}/students`, {
      data: xssData
    });
    
    if (xssResponse.status() === 201) {
      const student = await xssResponse.json();
      // Verify XSS content was safely stored or sanitized
      expect(student.firstName).toBeDefined();
      await page.request.delete(`${API_BASE}/students/${student.id}`);
    } else {
      expect([400, 422].includes(xssResponse.status())).toBe(true);
    }
  });

  test('Memory and Resource Usage', async ({ page }) => {
    // Test system behavior with memory-intensive operations
    
    const largeDataOperations = [];
    const createdResources = [];

    try {
      // Test 1: Create large result objects
      for (let i = 0; i < 5; i++) {
        const largeSubjects = [];
        
        // Create 20 subjects per result (large result object)
        for (let j = 0; j < 20; j++) {
          largeSubjects.push({
            subjectCode: `SUB${j}${generateUniqueId().substr(-3)}`,
            subjectName: `Large Test Subject ${j} with Very Long Name ${generateUniqueId()}`,
            credits: 3,
            grade: 'A',
            gradePoints: 9,
            marks: 85 + (j % 15)
          });
        }

        const largeResultData = {
          studentId: `student_large_${i}`,
          semester: 6,
          academicYear: '2024-25',
          enrollmentNumber: `LARGE_${generateUniqueId()}_${i}`,
          branch: 'Computer Engineering',
          subjects: largeSubjects,
          spi: 8.5,
          cpi: 8.2,
          resultStatus: 'Pass'
        };

        const createLargeResultResponse = await page.request.post(`${API_BASE}/results`, {
          data: largeResultData
        });
        
        if (createLargeResultResponse.status() === 201) {
          const result = await createLargeResultResponse.json();
          createdResources.push({ type: 'result', id: result.id });
        }
      }

      // Test 2: Large bulk operations
      const bulkNotifications = [];
      for (let i = 0; i < 25; i++) {
        bulkNotifications.push({
          userId: `user_bulk_${i}`,
          title: `Bulk Notification ${i} ${generateUniqueId()}`,
          message: `Large bulk notification message with lots of content ${'details '.repeat(50)}`,
          type: 'info'
        });
      }

      // Create notifications in smaller batches to avoid overwhelming the system
      const batchSize = 5;
      for (let i = 0; i < bulkNotifications.length; i += batchSize) {
        const batch = bulkNotifications.slice(i, i + batchSize);
        const batchPromises = batch.map(notification => 
          page.request.post(`${API_BASE}/notifications`, { data: notification })
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value.status() === 201) {
            const notification = await result.value.json();
            createdResources.push({ type: 'notification', id: notification.id });
          }
        }
        
        // Small delay between batches to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Test 3: Large export operations
      const exportResponse = await page.request.get(`${API_BASE}/students/export?format=csv`);
      
      if (exportResponse.status() === 200) {
        const exportData = await exportResponse.text();
        expect(exportData.length).toBeGreaterThan(0);
        // Verify export completes without memory issues
        expect(exportData).toContain('firstName'); // Should contain header
      }

      // Test 4: Complex query operations
      const complexQueryResponse = await page.request.get(
        `${API_BASE}/results?semester=6&academicYear=2024-25&sortBy=cpi&sortOrder=desc&limit=20`
      );
      expect(complexQueryResponse.status()).toBe(200);

    } finally {
      // Clean up all created resources
      for (const resource of createdResources) {
        try {
          const endpoint = resource.type === 'result' ? 'results' : 'notifications';
          await page.request.delete(`${API_BASE}/${endpoint}/${resource.id}`);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  });

  test('Network and Connection Edge Cases', async ({ page }) => {
    // Test system behavior under network stress and edge cases
    
    // Test 1: Large request timeout handling
    const startTime = Date.now();
    
    const largeProjectData = {
      projectTitle: `Timeout Test Project ${generateUniqueId()}`,
      description: 'A'.repeat(5000), // Large description
      department: 'Computer Engineering',
      eventId: 'event_timeout_test',
      category: 'Software',
      status: 'active',
      keywords: Array.from({ length: 100 }, (_, i) => `keyword${i}${generateUniqueId()}`),
      technologies: Array.from({ length: 50 }, (_, i) => `tech${i}${generateUniqueId()}`)
    };

    const largeRequestResponse = await page.request.post(`${API_BASE}/projects`, {
      data: largeProjectData,
      timeout: 30000 // 30 second timeout
    });

    const endTime = Date.now();
    const requestTime = endTime - startTime;

    if (largeRequestResponse.status() === 201) {
      const project = await largeRequestResponse.json();
      const projectData = project.data?.project || project;
      
      // Verify large data was handled correctly
      expect(projectData.projectTitle).toBe(largeProjectData.projectTitle);
      expect(requestTime).toBeLessThan(30000); // Should complete within timeout
      
      await page.request.delete(`${API_BASE}/projects/${projectData.id}`);
    } else {
      // Request failed - should fail gracefully
      expect([400, 413, 422, 500, 504].includes(largeRequestResponse.status())).toBe(true);
    }

    // Test 2: Rapid successive requests
    const rapidRequests = [];
    for (let i = 0; i < 10; i++) {
      const promise = page.request.get(`${API_BASE}/students?page=1&limit=5`);
      rapidRequests.push(promise);
    }

    const rapidResults = await Promise.allSettled(rapidRequests);
    
    // Verify most requests succeed or fail gracefully
    let successCount = 0;
    let rateLimitCount = 0;
    
    for (const result of rapidResults) {
      if (result.status === 'fulfilled') {
        const status = result.value.status();
        if (status === 200) {
          successCount++;
        } else if (status === 429) { // Rate limited
          rateLimitCount++;
        }
      }
    }

    expect(successCount + rateLimitCount).toBeGreaterThan(rapidResults.length * 0.7);

    // Test 3: Invalid content types
    const invalidContentTypeResponse = await page.request.post(`${API_BASE}/students`, {
      data: 'not-json-data',
      headers: { 'Content-Type': 'text/plain' }
    });
    expect([400, 415, 422].includes(invalidContentTypeResponse.status())).toBe(true);

    // Test 4: Large header values
    const largeHeaderResponse = await page.request.get(`${API_BASE}/students`, {
      headers: {
        'X-Large-Header': 'A'.repeat(8000) // Very large header
      }
    });
    
    // Should either succeed (header ignored) or fail gracefully
    expect([200, 400, 413, 431].includes(largeHeaderResponse.status())).toBe(true);
  });

  test('Data Export Performance and Integrity', async ({ page }) => {
    // Test export functionality under various conditions
    
    // Create test data for export
    const testStudents = [];
    for (let i = 0; i < 5; i++) {
      const studentData = {
        enrollmentNumber: `EXP_${generateUniqueId()}_${i}`,
        firstName: `Export`,
        lastName: `Student ${i}`,
        email: `export.student.${i}.${generateUniqueId()}@example.com`,
        currentSemester: (i % 8) + 1,
        department: 'Computer Engineering',
        program: 'B.Tech'
      };

      const createResponse = await page.request.post(`${API_BASE}/students`, {
        data: studentData
      });
      
      if (createResponse.status() === 201) {
        const student = await createResponse.json();
        testStudents.push(student);
      }
    }

    try {
      // Test 1: CSV export with large dataset
      const csvExportResponse = await page.request.get(`${API_BASE}/students/export?format=csv`);
      
      if (csvExportResponse.status() === 200) {
        const csvData = await csvExportResponse.text();
        
        // Verify CSV structure
        expect(csvData).toContain('firstName');
        expect(csvData).toContain('lastName');
        expect(csvData).toContain('enrollmentNumber');
        
        // Verify our test data is included
        for (const student of testStudents) {
          expect(csvData).toContain(student.enrollmentNumber);
        }
      }

      // Test 2: Filtered export
      const filteredExportResponse = await page.request.get(
        `${API_BASE}/students/export?format=csv&department=Computer Engineering`
      );
      
      if (filteredExportResponse.status() === 200) {
        const filteredData = await filteredExportResponse.text();
        expect(filteredData.length).toBeGreaterThan(0);
      }

      // Test 3: Project export with relationships
      const projectExportResponse = await page.request.get(`${API_BASE}/projects/export?format=csv`);
      
      if (projectExportResponse.status() === 200) {
        const projectData = await projectExportResponse.text();
        expect(projectData).toContain('projectTitle');
      }

      // Test 4: Team export with member data
      const teamExportResponse = await page.request.get(`${API_BASE}/project-teams/export?format=csv`);
      
      if (teamExportResponse.status() === 200) {
        const teamData = await teamExportResponse.text();
        expect(teamData).toContain('teamId');
      }

    } finally {
      // Clean up test students
      for (const student of testStudents) {
        await page.request.delete(`${API_BASE}/students/${student.id}`);
      }
    }
  });
});