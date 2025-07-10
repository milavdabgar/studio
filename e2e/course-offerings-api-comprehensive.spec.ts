import { test, expect } from '@playwright/test';

test.describe('Course Offerings API - Comprehensive E2E Tests', () => {
  const baseURL = 'http://localhost:3000';
  let testOfferingId: string;

  test.describe('Course Offerings CRUD Operations', () => {
    test('should create a new course offering', async ({ request }) => {
      const offeringData = {
        courseId: 'course_cs101_test',
        batchId: 'batch_dce_2024_test',
        academicYear: '2024-25',
        semester: 1,
        facultyIds: ['faculty_cs01_test', 'faculty_cs02_test'],
        roomIds: ['room_a101_test'],
        startDate: '2024-07-15T00:00:00.000Z',
        endDate: '2024-11-15T00:00:00.000Z',
        status: 'scheduled'
      };

      const response = await request.post(`${baseURL}/api/course-offerings`, {
        data: offeringData
      });

      expect(response.status()).toBe(201);
      const responseData = await response.json();
      
      // API returns the created object directly, not wrapped
      expect(responseData).toHaveProperty('id');
      expect(responseData.courseId).toBe(offeringData.courseId);
      expect(responseData.batchId).toBe(offeringData.batchId);
      expect(responseData.academicYear).toBe(offeringData.academicYear);
      expect(responseData.semester).toBe(offeringData.semester);
      expect(responseData.facultyIds).toEqual(offeringData.facultyIds);
      expect(responseData.status).toBe(offeringData.status);
      expect(responseData).toHaveProperty('createdAt');
      expect(responseData).toHaveProperty('updatedAt');

      testOfferingId = responseData.id;
    });

    test('should get all course offerings', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/course-offerings`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      
      // API returns array directly, not wrapped in success/data structure
      expect(Array.isArray(responseData)).toBe(true);
      
      if (responseData.length > 0) {
        const offering = responseData[0];
        expect(offering).toHaveProperty('id');
        expect(offering).toHaveProperty('courseId');
        expect(offering).toHaveProperty('batchId');
        expect(offering.academicYear || offering.year).toBeDefined();
        expect(offering).toHaveProperty('semester');
        expect(offering.facultyIds || offering.facultyId).toBeDefined();
        expect(offering.status || offering.isActive !== undefined).toBeTruthy();
        expect(offering).toHaveProperty('createdAt');
        expect(offering).toHaveProperty('updatedAt');
      }
    });

    test('should get a specific course offering by ID', async ({ request }) => {
      // First create a test offering
      const offeringData = {
        courseId: 'course_test_single',
        batchId: 'batch_test_single',
        academicYear: '2024-25',
        semester: 2,
        facultyIds: ['faculty_test_single']
      };

      const createResponse = await request.post(`${baseURL}/api/course-offerings`, {
        data: offeringData
      });
      expect(createResponse.status()).toBe(201);
      
      const createdOffering = await createResponse.json();
      const offeringId = createdOffering.id;

      // Get the specific course offering
      const response = await request.get(`${baseURL}/api/course-offerings/${offeringId}`);
      
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      
      // API returns the object directly
      expect(responseData.id).toBe(offeringId);
      expect(responseData.courseId).toBe(offeringData.courseId);
      expect(responseData.batchId).toBe(offeringData.batchId);
    });

    test('should update a course offering', async ({ request }) => {
      // First create a test offering
      const offeringData = {
        courseId: 'course_test_update',
        batchId: 'batch_test_update',
        academicYear: '2024-25',
        semester: 1,
        facultyIds: ['faculty_original']
      };

      const createResponse = await request.post(`${baseURL}/api/course-offerings`, {
        data: offeringData
      });
      expect(createResponse.status()).toBe(201);
      
      const createdOffering = await createResponse.json();
      const offeringId = createdOffering.id;

      // Update the course offering
      const updateData = {
        facultyIds: ['faculty_updated1', 'faculty_updated2'],
        status: 'ongoing'
      };

      const updateResponse = await request.put(`${baseURL}/api/course-offerings/${offeringId}`, {
        data: updateData
      });

      expect(updateResponse.status()).toBe(200);
      const updatedOffering = await updateResponse.json();
      
      expect(updatedOffering.id).toBe(offeringId);
      expect(updatedOffering.facultyIds).toEqual(updateData.facultyIds);
      expect(updatedOffering.status).toBe(updateData.status);
      expect(updatedOffering.courseId).toBe(offeringData.courseId); // Original data preserved
    });

    test('should delete a course offering', async ({ request }) => {
      // First create a test offering
      const offeringData = {
        courseId: 'course_test_delete',
        batchId: 'batch_test_delete',
        academicYear: '2024-25',
        semester: 1,
        facultyIds: ['faculty_delete_test']
      };

      const createResponse = await request.post(`${baseURL}/api/course-offerings`, {
        data: offeringData
      });
      expect(createResponse.status()).toBe(201);
      
      const createdOffering = await createResponse.json();
      const offeringId = createdOffering.id;

      // Delete the course offering
      const deleteResponse = await request.delete(`${baseURL}/api/course-offerings/${offeringId}`);
      expect(deleteResponse.status()).toBe(200);

      // Verify it's deleted
      const getResponse = await request.get(`${baseURL}/api/course-offerings/${offeringId}`);
      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe('Course Offerings Validation', () => {
    test('should reject course offering creation with missing required fields', async ({ request }) => {
      const incompleteData = {
        courseId: 'course_incomplete'
        // Missing batchId, academicYear, semester, facultyIds
      };

      const response = await request.post(`${baseURL}/api/course-offerings`, {
        data: incompleteData
      });

      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
      expect(responseData.message).toContain('Missing required fields');
    });

    test('should reject invalid date formats', async ({ request }) => {
      const invalidData = {
        courseId: 'course_invalid_date',
        batchId: 'batch_invalid_date',
        academicYear: '2024-25',
        semester: 1,
        facultyIds: ['faculty_test'],
        startDate: 'invalid-date-format',
        endDate: '2024-12-15T00:00:00.000Z'
      };

      const response = await request.post(`${baseURL}/api/course-offerings`, {
        data: invalidData
      });

      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toContain('Invalid startDate format');
    });

    test('should reject end date before start date', async ({ request }) => {
      const invalidData = {
        courseId: 'course_invalid_dates',
        batchId: 'batch_invalid_dates',
        academicYear: '2024-25',
        semester: 1,
        facultyIds: ['faculty_test'],
        startDate: '2024-12-15T00:00:00.000Z',
        endDate: '2024-07-15T00:00:00.000Z' // End before start
      };

      const response = await request.post(`${baseURL}/api/course-offerings`, {
        data: invalidData
      });

      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toContain('End date must be after start date');
    });

    test('should handle non-existent course offering operations', async ({ request }) => {
      const nonExistentId = 'non_existent_offering_id';

      // Test GET
      const getResponse = await request.get(`${baseURL}/api/course-offerings/${nonExistentId}`);
      expect(getResponse.status()).toBe(404);

      // Test PUT
      const putResponse = await request.put(`${baseURL}/api/course-offerings/${nonExistentId}`, {
        data: { status: 'ongoing' }
      });
      expect(putResponse.status()).toBe(404);

      // Test DELETE
      const deleteResponse = await request.delete(`${baseURL}/api/course-offerings/${nonExistentId}`);
      expect(deleteResponse.status()).toBe(404);
    });
  });

  test.describe('Course Offerings Data Integrity', () => {
    test('should maintain data consistency during updates', async ({ request }) => {
      // Create offering
      const originalData = {
        courseId: 'course_consistency_test',
        batchId: 'batch_consistency_test',
        academicYear: '2024-25',
        semester: 1,
        facultyIds: ['faculty_original'],
        status: 'scheduled'
      };

      const createResponse = await request.post(`${baseURL}/api/course-offerings`, {
        data: originalData
      });
      
      const createdOffering = await createResponse.json();
      const offeringId = createdOffering.id;
      const originalCreatedAt = createdOffering.createdAt;

      // Update offering
      const updateData = {
        facultyIds: ['faculty_updated'],
        status: 'ongoing'
      };

      const updateResponse = await request.put(`${baseURL}/api/course-offerings/${offeringId}`, {
        data: updateData
      });

      const updatedOffering = await updateResponse.json();

      // Verify data integrity
      expect(updatedOffering.id).toBe(offeringId);
      expect(updatedOffering.createdAt).toBe(originalCreatedAt); // Should not change
      expect(updatedOffering.updatedAt).not.toBe(originalCreatedAt); // Should be updated
      expect(updatedOffering.courseId).toBe(originalData.courseId); // Should be preserved
      expect(updatedOffering.batchId).toBe(originalData.batchId); // Should be preserved
      expect(updatedOffering.facultyIds).toEqual(updateData.facultyIds); // Should be updated
      expect(updatedOffering.status).toBe(updateData.status); // Should be updated
    });

    test('should handle different course offering statuses', async ({ request }) => {
      const statuses = ['scheduled', 'ongoing', 'completed', 'cancelled'];

      for (const status of statuses) {
        const offeringData = {
          courseId: `course_status_${status}`,
          batchId: `batch_status_${status}`,
          academicYear: '2024-25',
          semester: 1,
          facultyIds: ['faculty_status_test'],
          status: status
        };

        const response = await request.post(`${baseURL}/api/course-offerings`, {
          data: offeringData
        });

        expect(response.status()).toBe(201);
        const responseData = await response.json();
        expect(responseData.status).toBe(status);
      }
    });
  });
});
