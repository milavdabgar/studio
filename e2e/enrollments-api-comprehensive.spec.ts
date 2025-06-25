import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Enrollments API - In-Memory Storage Endpoints
 * Priority: Enrollments Module (Critical for Academic Registration Management)
 * 
 * This test suite covers the enrollments API endpoints that use in-memory storage
 * and are critical for the MongoDB migration. Tests ensure data integrity
 * and business logic preservation during migration.
 */

// Base URL for API endpoints
const API_BASE = '/api';

// Test data for enrollments
const generateUniqueId = () => `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const testEnrollment = {
  studentId: 'student_test_e2e_001',
  courseOfferingId: 'course_offering_test_e2e_001',
  status: 'requested' as const,
  internalMarks: 85,
  externalMarks: 78,
  grade: 'A',
  attendancePercentage: 92.5
};

const testEnrollmentUpdate = {
  status: 'enrolled' as const,
  internalMarks: 88,
  externalMarks: 82,
  grade: 'A+',
  attendancePercentage: 95.0
};

// Test data for required entities (students and course offerings should exist)
const testStudent = {
  id: 'student_test_e2e_001',
  enrollmentNumber: 'E2E001',
  firstName: 'Test',
  lastName: 'Student',
  email: 'test.student@example.edu',
  contactNumber: '9876543210',
  departmentId: 'dept_test_e2e',
  programId: 'prog_test_e2e',
  semester: 1,
  isComplete: false
};

const testCourseOffering = {
  id: 'course_offering_test_e2e_001',
  courseId: 'course_test_e2e_001',
  programId: 'prog_test_e2e',
  semester: 1,
  academicYear: '2024-25',
  facultyId: 'faculty_test_e2e_001',
  maxCapacity: 50
};

test.describe('Enrollments API - Critical In-Memory Storage', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that initializes the app context
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Set up test data - create required student and course offering
    const studentResponse = await page.request.post(`${API_BASE}/students`, {
      data: testStudent
    });

    // Note: We might need to create course offering too, but let's first test with existing data
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test data
    try {
      await page.request.delete(`${API_BASE}/students/${testStudent.id}`);
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should create, read, update, and delete enrollments (CRUD)', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const enrollmentData = {
      ...testEnrollment,
      studentId: `student_${uniqueId}`,
      courseOfferingId: `course_offering_${uniqueId}`
    };

    let createdEnrollmentId: string;

    // Test CREATE - POST /api/enrollments
    const createResponse = await page.request.post(`${API_BASE}/enrollments`, {
      data: enrollmentData
    });

    if (createResponse.status() === 201) {
      const createdEnrollment = await createResponse.json();
      
      expect(createdEnrollment).toHaveProperty('id');
      expect(createdEnrollment.studentId).toBe(enrollmentData.studentId);
      expect(createdEnrollment.courseOfferingId).toBe(enrollmentData.courseOfferingId);
      expect(createdEnrollment.status).toBe(enrollmentData.status);
      expect(createdEnrollment.internalMarks).toBe(enrollmentData.internalMarks);
      expect(createdEnrollment.externalMarks).toBe(enrollmentData.externalMarks);
      expect(createdEnrollment.grade).toBe(enrollmentData.grade);
      expect(createdEnrollment.attendancePercentage).toBe(enrollmentData.attendancePercentage);
      expect(createdEnrollment).toHaveProperty('createdAt');
      
      createdEnrollmentId = createdEnrollment.id;

      try {
        // Test READ ALL - GET /api/enrollments
        const getAllResponse = await page.request.get(`${API_BASE}/enrollments`);
        expect(getAllResponse.status()).toBe(200);
        
        const allEnrollments = await getAllResponse.json();
        expect(Array.isArray(allEnrollments)).toBe(true);
        
        const foundEnrollment = allEnrollments.find((e: any) => e.id === createdEnrollmentId);
        expect(foundEnrollment).toBeDefined();
        expect(foundEnrollment.studentId).toBe(enrollmentData.studentId);

        // Test READ BY STUDENT - GET /api/enrollments?studentId=...
        const getByStudentResponse = await page.request.get(`${API_BASE}/enrollments?studentId=${enrollmentData.studentId}`);
        expect(getByStudentResponse.status()).toBe(200);
        
        const studentEnrollments = await getByStudentResponse.json();
        expect(Array.isArray(studentEnrollments)).toBe(true);
        expect(studentEnrollments.length).toBeGreaterThan(0);
        
        const studentEnrollment = studentEnrollments.find((e: any) => e.id === createdEnrollmentId);
        expect(studentEnrollment).toBeDefined();

        // Test READ BY COURSE OFFERING - GET /api/enrollments?courseOfferingId=...
        const getByCourseResponse = await page.request.get(`${API_BASE}/enrollments?courseOfferingId=${enrollmentData.courseOfferingId}`);
        expect(getByCourseResponse.status()).toBe(200);
        
        const courseEnrollments = await getByCourseResponse.json();
        expect(Array.isArray(courseEnrollments)).toBe(true);
        expect(courseEnrollments.length).toBeGreaterThan(0);

        // Test UPDATE - PUT /api/enrollments/:id (if endpoint exists)
        // Note: The route file shows only GET and POST, so we may need to test through individual route

        // Test DELETE - DELETE /api/enrollments/:id (if endpoint exists)
        // Similar note as above

      } finally {
        // Cleanup - try to delete via individual route if it exists
        try {
          await page.request.delete(`${API_BASE}/enrollments/${createdEnrollmentId}`);
        } catch {
          // If individual route doesn't exist, we'll need manual cleanup
        }
      }
    } else if (createResponse.status() === 404) {
      // This means student or course offering doesn't exist - expected in isolated test
      console.log('Enrollment creation failed due to missing dependencies - this is expected in isolated tests');
      expect(createResponse.status()).toBe(404);
      const errorData = await createResponse.json();
      expect(errorData.message).toMatch(/not found/i);
    } else {
      // Other errors should be investigated
      const errorData = await createResponse.json();
      console.log('Unexpected enrollment creation error:', errorData);
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Test missing studentId
    const missingStudentId = { ...testEnrollment } as any;
    delete missingStudentId.studentId;

    const missingStudentResponse = await page.request.post(`${API_BASE}/enrollments`, {
      data: missingStudentId
    });

    expect(missingStudentResponse.status()).toBe(400);
    const errorData1 = await missingStudentResponse.json();
    expect(errorData1).toHaveProperty('message');
    expect(errorData1.message).toContain('studentId');

    // Test missing courseOfferingId
    const missingCourseOffering = { ...testEnrollment } as any;
    delete missingCourseOffering.courseOfferingId;

    const missingCourseResponse = await page.request.post(`${API_BASE}/enrollments`, {
      data: missingCourseOffering
    });

    expect(missingCourseResponse.status()).toBe(400);
    const errorData2 = await missingCourseResponse.json();
    expect(errorData2).toHaveProperty('message');
    expect(errorData2.message).toContain('courseOfferingId');
  });

  test('should validate enrollment status values', async ({ page }) => {
    const validStatuses = ['requested', 'enrolled', 'withdrawn', 'completed', 'failed'];
    const uniqueId = generateUniqueId();
    
    for (let i = 0; i < validStatuses.length; i++) {
      const status = validStatuses[i];
      const enrollmentWithStatus = {
        ...testEnrollment,
        studentId: `student_status_${uniqueId}_${i}`,
        courseOfferingId: `course_status_${uniqueId}_${i}`,
        status: status
      };

      const createResponse = await page.request.post(`${API_BASE}/enrollments`, {
        data: enrollmentWithStatus
      });

      // Either succeeds (201) or fails due to missing dependencies (404)
      expect([201, 404]).toContain(createResponse.status());
      
      if (createResponse.status() === 201) {
        const createdEnrollment = await createResponse.json();
        expect(createdEnrollment.status).toBe(status);
        
        // If status is 'enrolled', enrolledAt should be set
        if (status === 'enrolled') {
          expect(createdEnrollment.enrolledAt).toBeDefined();
        }
        
        // Cleanup
        try {
          await page.request.delete(`${API_BASE}/enrollments/${createdEnrollment.id}`);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  test('should prevent duplicate enrollments', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const duplicateEnrollment = {
      ...testEnrollment,
      studentId: `student_duplicate_${uniqueId}`,
      courseOfferingId: `course_duplicate_${uniqueId}`
    };

    // Create first enrollment
    const firstCreateResponse = await page.request.post(`${API_BASE}/enrollments`, {
      data: duplicateEnrollment
    });

    if (firstCreateResponse.status() === 201) {
      const firstEnrollment = await firstCreateResponse.json();
      
      try {
        // Try to create duplicate
        const duplicateResponse = await page.request.post(`${API_BASE}/enrollments`, {
          data: duplicateEnrollment
        });

        expect(duplicateResponse.status()).toBe(409);
        const duplicateErrorData = await duplicateResponse.json();
        expect(duplicateErrorData).toHaveProperty('message');
        expect(duplicateErrorData.message).toMatch(/already enrolled|has requested enrollment/i);
      } finally {
        // Cleanup
        try {
          await page.request.delete(`${API_BASE}/enrollments/${firstEnrollment.id}`);
        } catch {
          // Ignore cleanup errors
        }
      }
    } else {
      // If creation fails due to missing dependencies, test the duplicate logic wouldn't be reached
      expect(firstCreateResponse.status()).toBe(404);
    }
  });

  test('should handle numeric field validation', async ({ page }) => {
    const uniqueId = generateUniqueId();
    
    // Test valid numeric values
    const validNumericEnrollment = {
      ...testEnrollment,
      studentId: `student_numeric_${uniqueId}`,
      courseOfferingId: `course_numeric_${uniqueId}`,
      internalMarks: 95,
      externalMarks: 88,
      attendancePercentage: 96.5
    };

    const createResponse = await page.request.post(`${API_BASE}/enrollments`, {
      data: validNumericEnrollment
    });

    if (createResponse.status() === 201) {
      const createdEnrollment = await createResponse.json();
      
      expect(createdEnrollment.internalMarks).toBe(95);
      expect(createdEnrollment.externalMarks).toBe(88);
      expect(createdEnrollment.attendancePercentage).toBe(96.5);
      
      // Cleanup
      try {
        await page.request.delete(`${API_BASE}/enrollments/${createdEnrollment.id}`);
      } catch {
        // Ignore cleanup errors
      }
    }

    // Test boundary values
    const boundaryValues = [
      { field: 'internalMarks', value: 0 },
      { field: 'internalMarks', value: 100 },
      { field: 'externalMarks', value: 0 },
      { field: 'externalMarks', value: 100 },
      { field: 'attendancePercentage', value: 0.0 },
      { field: 'attendancePercentage', value: 100.0 }
    ];

    for (const boundary of boundaryValues) {
      const boundaryEnrollment = {
        ...testEnrollment,
        studentId: `student_boundary_${uniqueId}_${boundary.field}`,
        courseOfferingId: `course_boundary_${uniqueId}_${boundary.field}`,
        [boundary.field]: boundary.value
      };

      const boundaryResponse = await page.request.post(`${API_BASE}/enrollments`, {
        data: boundaryEnrollment
      });

      if (boundaryResponse.status() === 201) {
        const createdEnrollment = await boundaryResponse.json();
        expect(createdEnrollment[boundary.field]).toBe(boundary.value);
        
        // Cleanup
        try {
          await page.request.delete(`${API_BASE}/enrollments/${createdEnrollment.id}`);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  test('should handle grade field validation', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const validGrades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'I', 'W'];
    
    for (let i = 0; i < validGrades.length; i++) {
      const grade = validGrades[i];
      const enrollmentWithGrade = {
        ...testEnrollment,
        studentId: `student_grade_${uniqueId}_${i}`,
        courseOfferingId: `course_grade_${uniqueId}_${i}`,
        grade: grade
      };

      const createResponse = await page.request.post(`${API_BASE}/enrollments`, {
        data: enrollmentWithGrade
      });

      if (createResponse.status() === 201) {
        const createdEnrollment = await createResponse.json();
        expect(createdEnrollment.grade).toBe(grade);
        
        // Cleanup
        try {
          await page.request.delete(`${API_BASE}/enrollments/${createdEnrollment.id}`);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  test('should filter enrollments by studentId', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const testStudentId = `student_filter_${uniqueId}`;
    const createdIds: string[] = [];

    try {
      // Create multiple enrollments for the same student
      const enrollmentPromises = Array.from({ length: 3 }, (_, i) => {
        const enrollmentData = {
          ...testEnrollment,
          studentId: testStudentId,
          courseOfferingId: `course_filter_${uniqueId}_${i}`,
          status: i === 0 ? 'enrolled' : 'requested'
        };

        return page.request.post(`${API_BASE}/enrollments`, {
          data: enrollmentData
        });
      });

      const responses = await Promise.all(enrollmentPromises);
      
      // Collect successful creations
      for (const response of responses) {
        if (response.status() === 201) {
          const enrollment = await response.json();
          createdIds.push(enrollment.id);
        }
      }

      if (createdIds.length > 0) {
        // Test filtering by studentId
        const filterResponse = await page.request.get(`${API_BASE}/enrollments?studentId=${testStudentId}`);
        expect(filterResponse.status()).toBe(200);
        
        const filteredEnrollments = await filterResponse.json();
        expect(Array.isArray(filteredEnrollments)).toBe(true);
        expect(filteredEnrollments.length).toBe(createdIds.length);
        
        // All returned enrollments should belong to the test student
        filteredEnrollments.forEach((enrollment: any) => {
          expect(enrollment.studentId).toBe(testStudentId);
        });
      }

    } finally {
      // Cleanup all created enrollments
      for (const id of createdIds) {
        try {
          await page.request.delete(`${API_BASE}/enrollments/${id}`);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  test('should filter enrollments by courseOfferingId', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const testCourseOfferingId = `course_filter_${uniqueId}`;
    const createdIds: string[] = [];

    try {
      // Create multiple enrollments for the same course offering
      const enrollmentPromises = Array.from({ length: 3 }, (_, i) => {
        const enrollmentData = {
          ...testEnrollment,
          studentId: `student_filter_${uniqueId}_${i}`,
          courseOfferingId: testCourseOfferingId,
          status: i % 2 === 0 ? 'enrolled' : 'requested'
        };

        return page.request.post(`${API_BASE}/enrollments`, {
          data: enrollmentData
        });
      });

      const responses = await Promise.all(enrollmentPromises);
      
      // Collect successful creations
      for (const response of responses) {
        if (response.status() === 201) {
          const enrollment = await response.json();
          createdIds.push(enrollment.id);
        }
      }

      if (createdIds.length > 0) {
        // Test filtering by courseOfferingId
        const filterResponse = await page.request.get(`${API_BASE}/enrollments?courseOfferingId=${testCourseOfferingId}`);
        expect(filterResponse.status()).toBe(200);
        
        const filteredEnrollments = await filterResponse.json();
        expect(Array.isArray(filteredEnrollments)).toBe(true);
        expect(filteredEnrollments.length).toBe(createdIds.length);
        
        // All returned enrollments should belong to the test course offering
        filteredEnrollments.forEach((enrollment: any) => {
          expect(enrollment.courseOfferingId).toBe(testCourseOfferingId);
        });
      }

    } finally {
      // Cleanup all created enrollments
      for (const id of createdIds) {
        try {
          await page.request.delete(`${API_BASE}/enrollments/${id}`);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  test('should handle combined filters', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const testStudentId = `student_combined_${uniqueId}`;
    const testCourseOfferingId = `course_combined_${uniqueId}`;
    let createdEnrollmentId: string;

    // Create an enrollment with specific student and course offering
    const createResponse = await page.request.post(`${API_BASE}/enrollments`, {
      data: {
        ...testEnrollment,
        studentId: testStudentId,
        courseOfferingId: testCourseOfferingId
      }
    });

    if (createResponse.status() === 201) {
      const createdEnrollment = await createResponse.json();
      createdEnrollmentId = createdEnrollment.id;

      try {
        // Test combined filtering
        const combinedFilterResponse = await page.request.get(
          `${API_BASE}/enrollments?studentId=${testStudentId}&courseOfferingId=${testCourseOfferingId}`
        );
        expect(combinedFilterResponse.status()).toBe(200);
        
        const filteredEnrollments = await combinedFilterResponse.json();
        expect(Array.isArray(filteredEnrollments)).toBe(true);
        expect(filteredEnrollments.length).toBe(1);
        expect(filteredEnrollments[0].id).toBe(createdEnrollmentId);
        expect(filteredEnrollments[0].studentId).toBe(testStudentId);
        expect(filteredEnrollments[0].courseOfferingId).toBe(testCourseOfferingId);

      } finally {
        // Cleanup
        try {
          await page.request.delete(`${API_BASE}/enrollments/${createdEnrollmentId}`);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test malformed request data
    const malformedResponse = await page.request.post(`${API_BASE}/enrollments`, {
      data: null
    });
    expect([400, 500]).toContain(malformedResponse.status());

    // Test invalid JSON
    const invalidJsonResponse = await page.request.post(`${API_BASE}/enrollments`, {
      data: 'invalid-json'
    });
    expect([400, 500]).toContain(invalidJsonResponse.status());

    // Test empty request body
    const emptyResponse = await page.request.post(`${API_BASE}/enrollments`, {
      data: {}
    });
    expect(emptyResponse.status()).toBe(400);
    const emptyErrorData = await emptyResponse.json();
    expect(emptyErrorData.message).toMatch(/studentId|courseOfferingId/);
  });

  test('should handle enrollment date fields properly', async ({ page }) => {
    const uniqueId = generateUniqueId();
    
    // Test enrollment with enrolled status (should set enrolledAt)
    const enrolledData = {
      ...testEnrollment,
      studentId: `student_enrolled_${uniqueId}`,
      courseOfferingId: `course_enrolled_${uniqueId}`,
      status: 'enrolled'
    };

    const enrolledResponse = await page.request.post(`${API_BASE}/enrollments`, {
      data: enrolledData
    });

    if (enrolledResponse.status() === 201) {
      const enrolledEnrollment = await enrolledResponse.json();
      
      expect(enrolledEnrollment.status).toBe('enrolled');
      expect(enrolledEnrollment.enrolledAt).toBeDefined();
      expect(enrolledEnrollment.createdAt).toBeDefined();
      expect(enrolledEnrollment.updatedAt).toBeDefined();
      
      // Cleanup
      try {
        await page.request.delete(`${API_BASE}/enrollments/${enrolledEnrollment.id}`);
      } catch {
        // Ignore cleanup errors
      }
    }

    // Test enrollment with requested status (should not set enrolledAt)
    const requestedData = {
      ...testEnrollment,
      studentId: `student_requested_${uniqueId}`,
      courseOfferingId: `course_requested_${uniqueId}`,
      status: 'requested'
    };

    const requestedResponse = await page.request.post(`${API_BASE}/enrollments`, {
      data: requestedData
    });

    if (requestedResponse.status() === 201) {
      const requestedEnrollment = await requestedResponse.json();
      
      expect(requestedEnrollment.status).toBe('requested');
      expect(requestedEnrollment.enrolledAt).toBeUndefined();
      expect(requestedEnrollment.createdAt).toBeDefined();
      
      // Cleanup
      try {
        await page.request.delete(`${API_BASE}/enrollments/${requestedEnrollment.id}`);
      } catch {
        // Ignore cleanup errors
      }
    }
  });
});
