import { test, expect } from '@playwright/test';

// Helper function to generate unique IDs
const generateUniqueId = () => `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

test.describe('Results API - Comprehensive E2E Tests', () => {
  const baseURL = 'http://localhost:3000';
  let testResultId: string;

  test.describe('Results CRUD Operations', () => {
    test('should create a new result', async ({ request }) => {
      const uniqueId = generateUniqueId();
      const resultData = {
        studentId: `std_test_${uniqueId}`,
        enrollmentNo: `220010${uniqueId.slice(-6)}`,
        st_id: `220010${uniqueId.slice(-6)}`,
        name: `Test Student ${uniqueId}`,
        branchName: 'Computer Engineering',
        semester: 3,
        exam: 'Winter 2024 Regular',
        examid: 12345,
        subjects: [
          {
            code: 'CS301',
            name: 'Data Structures',
            credits: 4,
            grade: 'AA',
            isBacklog: false,
            theoryEseGrade: 'AA'
          },
          {
            code: 'CS302',
            name: 'Database Systems',
            credits: 3,
            grade: 'AB',
            isBacklog: false,
            theoryEseGrade: 'AB'
          }
        ],
        spi: 9.2,
        cpi: 9.0,
        result: 'PASS',
        uploadBatch: `batch_test_${uniqueId}`,
        totalCredits: 7,
        earnedCredits: 7
      };

      const response = await request.post(`${baseURL}/api/results`, {
        data: resultData
      });

      expect(response.status()).toBe(201);
      const responseData = await response.json();
      
      // API returns the created object directly, not wrapped
      expect(responseData).toHaveProperty('_id');
      expect(responseData.studentId).toBe(resultData.studentId);
      expect(responseData.enrollmentNo).toBe(resultData.enrollmentNo);
      expect(responseData.semester).toBe(resultData.semester);
      expect(responseData.examid).toBe(resultData.examid);
      expect(responseData.spi).toBe(resultData.spi);
      expect(responseData.result).toBe(resultData.result);
      expect(responseData).toHaveProperty('createdAt');
      expect(responseData).toHaveProperty('updatedAt');

      testResultId = responseData._id;
    });

    test('should get all results', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/results`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      
      // API returns wrapped response
      expect(responseData).toHaveProperty('status');
      expect(responseData.status).toBe('success');
      expect(responseData).toHaveProperty('data');
      expect(responseData.data).toHaveProperty('results');
      expect(Array.isArray(responseData.data.results)).toBe(true);
      
      if (responseData.data.results.length > 0) {
        const result = responseData.data.results[0];
        expect(result).toHaveProperty('_id');
        expect(result).toHaveProperty('studentId');
        expect(result).toHaveProperty('enrollmentNo');
        expect(result).toHaveProperty('semester');
        expect(result).toHaveProperty('examid');
        expect(result).toHaveProperty('subjects');
        expect(result).toHaveProperty('spi');
        expect(result).toHaveProperty('result');
      }
    });

    test('should get a specific result by ID', async ({ request }) => {
      // First create a test result
      const uniqueId = generateUniqueId();
      const resultData = {
        studentId: `std_single_test_${uniqueId}`,
        enrollmentNo: `220010${uniqueId.slice(-6)}`,
        st_id: `220010${uniqueId.slice(-6)}`,
        name: `Single Test Student ${uniqueId}`,
        branchName: 'Computer Engineering',
        semester: 4,
        exam: 'Summer 2024 Regular',
        examid: 12346,
        subjects: [
          {
            code: 'CS401',
            name: 'Software Engineering',
            credits: 4,
            grade: 'AA',
            isBacklog: false,
            theoryEseGrade: 'AA'
          }
        ],
        spi: 9.5,
        cpi: 9.2,
        result: 'PASS'
      };

      const createResponse = await request.post(`${baseURL}/api/results`, {
        data: resultData
      });
      expect(createResponse.status()).toBe(201);
      
      const createdResult = await createResponse.json();
      const resultId = createdResult._id;

      // Get the specific result
      const response = await request.get(`${baseURL}/api/results/${resultId}`);
      
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      
      // API returns wrapped response: {status: 'success', data: {result: ...}}
      expect(responseData.status).toBe('success');
      expect(responseData.data).toHaveProperty('result');
      const result = responseData.data.result;
      expect(result._id).toBe(resultId);
      expect(result.studentId).toBe(resultData.studentId);
      expect(result.enrollmentNo).toBe(resultData.enrollmentNo);
    });

    test('should update a result', async ({ request }) => {
      // First create a test result
      const uniqueId = generateUniqueId();
      const resultData = {
        studentId: `std_update_test_${uniqueId}`,
        enrollmentNo: `220010${uniqueId.slice(-6)}`,
        st_id: `220010${uniqueId.slice(-6)}`,
        name: `Update Test Student ${uniqueId}`,
        branchName: 'Computer Engineering',
        semester: 5,
        exam: 'Winter 2024 Regular',
        examid: 12347,
        subjects: [
          {
            code: 'CS501',
            name: 'Machine Learning',
            credits: 4,
            grade: 'AB',
            isBacklog: false,
            theoryEseGrade: 'AB'
          }
        ],
        spi: 8.5,
        cpi: 8.8,
        result: 'PASS'
      };

      const createResponse = await request.post(`${baseURL}/api/results`, {
        data: resultData
      });
      expect(createResponse.status()).toBe(201);
      
      const createdResult = await createResponse.json();
      const resultId = createdResult._id;

      // Update the result (add another subject)
      const updateData = {
        studentId: resultData.studentId,
        enrollmentNo: resultData.enrollmentNo,
        examid: resultData.examid,
        subjects: [
          {
            code: 'CS502',
            name: 'Deep Learning',
            credits: 3,
            grade: 'AA',
            isBacklog: false,
            theoryEseGrade: 'AA'
          }
        ],
        spi: 9.0,
        cpi: 9.0
      };

      const updateResponse = await request.post(`${baseURL}/api/results`, {
        data: updateData
      });

      expect(updateResponse.status()).toBe(200); // Update returns 200
      const updatedResult = await updateResponse.json();
      
      expect(updatedResult._id).toBe(resultId);
      expect(updatedResult.spi).toBe(updateData.spi);
      expect(updatedResult.subjects).toHaveLength(2); // Original + new subject
    });

    test('should delete a result', async ({ request }) => {
      // First create a test result
      const uniqueId = generateUniqueId();
      const resultData = {
        studentId: `std_delete_test_${uniqueId}`,
        enrollmentNo: `220010${uniqueId.slice(-6)}`,
        st_id: `220010${uniqueId.slice(-6)}`,
        name: `Delete Test Student ${uniqueId}`,
        branchName: 'Computer Engineering',
        semester: 6,
        exam: 'Summer 2024 Regular',
        examid: 12348,
        subjects: [
          {
            code: 'CS601',
            name: 'Project Work',
            credits: 8,
            grade: 'AA',
            isBacklog: false,
            theoryEseGrade: 'AA'
          }
        ],
        spi: 9.5,
        cpi: 9.3,
        result: 'PASS'
      };

      const createResponse = await request.post(`${baseURL}/api/results`, {
        data: resultData
      });
      expect(createResponse.status()).toBe(201);
      
      const createdResult = await createResponse.json();
      const resultId = createdResult._id;

      // Delete the result
      const deleteResponse = await request.delete(`${baseURL}/api/results/${resultId}`);
      expect(deleteResponse.status()).toBe(200);

      // Verify it's deleted
      const getResponse = await request.get(`${baseURL}/api/results/${resultId}`);
      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe('Results Query and Filtering', () => {
    test('should filter results by student ID', async ({ request }) => {
      const testStudentId = `std_filter_test_${generateUniqueId()}`;
      
      const response = await request.get(`${baseURL}/api/results?studentId=${testStudentId}`);
      
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.status).toBe('success');
      expect(Array.isArray(responseData.data.results)).toBe(true);
      
      responseData.data.results.forEach((result: any) => {
        expect(result.studentId).toBe(testStudentId);
      });
    });

    test('should filter results by semester', async ({ request }) => {
      const testSemester = 3;
      
      const response = await request.get(`${baseURL}/api/results?semester=${testSemester}`);
      
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.status).toBe('success');
      expect(Array.isArray(responseData.data.results)).toBe(true);
      
      responseData.data.results.forEach((result: any) => {
        expect(result.semester).toBe(testSemester);
      });
    });

    test('should filter results by branch name', async ({ request }) => {
      const testBranch = 'Computer Engineering';
      
      const response = await request.get(`${baseURL}/api/results?branchName=${encodeURIComponent(testBranch)}`);
      
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.status).toBe('success');
      expect(Array.isArray(responseData.data.results)).toBe(true);
      
      responseData.data.results.forEach((result: any) => {
        expect(result.branchName).toBe(testBranch);
      });
    });

    test('should filter results by exam ID', async ({ request }) => {
      const testExamId = 12345;
      
      const response = await request.get(`${baseURL}/api/results?examid=${testExamId}`);
      
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.status).toBe('success');
      expect(Array.isArray(responseData.data.results)).toBe(true);
      
      responseData.data.results.forEach((result: any) => {
        expect(result.examid).toBe(testExamId);
      });
    });

    test('should support pagination', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/results?page=1&limit=5`);
      
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.status).toBe('success');
      expect(Array.isArray(responseData.data.results)).toBe(true);
      expect(responseData.data.results.length).toBeLessThanOrEqual(5);
      expect(responseData.data).toHaveProperty('pagination');
      expect(responseData.data.pagination).toHaveProperty('total');
      expect(responseData.data.pagination).toHaveProperty('page');
      expect(responseData.data.pagination).toHaveProperty('limit');
    });
  });

  test.describe('Results Validation', () => {
    test('should reject result creation with missing required fields', async ({ request }) => {
      const incompleteData = {
        studentId: 'incomplete_test'
        // Missing enrollmentNo, examid, subjects
      };

      const response = await request.post(`${baseURL}/api/results`, {
        data: incompleteData
      });

      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
      expect(responseData.message).toContain('required');
    });

    test('should reject result with empty subjects array', async ({ request }) => {
      const uniqueId = generateUniqueId();
      const invalidData = {
        studentId: `std_empty_subjects_${uniqueId}`,
        enrollmentNo: `220010${uniqueId.slice(-6)}`,
        examid: 12349,
        subjects: [] // Empty subjects array
      };

      const response = await request.post(`${baseURL}/api/results`, {
        data: invalidData
      });

      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toContain('at least one subject');
    });

    test('should handle non-existent result operations', async ({ request }) => {
      const nonExistentId = 'non_existent_result_id';

      // Test GET
      const getResponse = await request.get(`${baseURL}/api/results/${nonExistentId}`);
      expect(getResponse.status()).toBe(404);

      // Test DELETE
      const deleteResponse = await request.delete(`${baseURL}/api/results/${nonExistentId}`);
      expect(deleteResponse.status()).toBe(404);
    });
  });

  test.describe('Results Business Logic', () => {
    test('should handle different result statuses', async ({ request }) => {
      const statuses = ['PASS', 'FAIL', 'ABSENT', 'WITHHELD'];

      for (const status of statuses) {
        const uniqueId = generateUniqueId();
        const resultData = {
          studentId: `std_status_${status.toLowerCase()}_${uniqueId}`,
          enrollmentNo: `220010${uniqueId.slice(-6)}`,
          st_id: `220010${uniqueId.slice(-6)}`,
          name: `Test Student ${status}`,
          branchName: 'Computer Engineering',
          semester: 1,
          exam: 'Winter 2024 Regular',
          examid: 12350 + statuses.indexOf(status),
          subjects: [
            {
              code: 'CS101',
              name: 'Programming Fundamentals',
              credits: 4,
              grade: status === 'PASS' ? 'AA' : 'FF',
              isBacklog: false,
              theoryEseGrade: status === 'PASS' ? 'AA' : 'FF'
            }
          ],
          spi: status === 'PASS' ? 9.0 : 0.0,
          cpi: status === 'PASS' ? 9.0 : 0.0,
          result: status
        };

        const response = await request.post(`${baseURL}/api/results`, {
          data: resultData
        });

        expect(response.status()).toBe(201);
        const responseData = await response.json();
        expect(responseData.result).toBe(status);
      }
    });

    test('should handle subject grades and credits', async ({ request }) => {
      const uniqueId = generateUniqueId();
      const resultData = {
        studentId: `std_grades_test_${uniqueId}`,
        enrollmentNo: `220010${uniqueId.slice(-6)}`,
        st_id: `220010${uniqueId.slice(-6)}`,
        name: `Grades Test Student ${uniqueId}`,
        branchName: 'Computer Engineering',
        semester: 2,
        exam: 'Winter 2024 Regular',
        examid: 12355,
        subjects: [
          {
            code: 'CS201',
            name: 'Data Structures',
            credits: 4,
            grade: 'AA',
            isBacklog: false,
            theoryEseGrade: 'AA'
          },
          {
            code: 'MA201',
            name: 'Mathematics II',
            credits: 3,
            grade: 'AB',
            isBacklog: false,
            theoryEseGrade: 'AB'
          },
          {
            code: 'CS199',
            name: 'Backlog Subject',
            credits: 2,
            grade: 'BC',
            isBacklog: true,
            theoryEseGrade: 'BC'
          }
        ],
        spi: 8.5,
        cpi: 8.7,
        result: 'PASS',
        totalCredits: 9,
        earnedCredits: 7 // Excluding backlog credits
      };

      const response = await request.post(`${baseURL}/api/results`, {
        data: resultData
      });

      expect(response.status()).toBe(201);
      const responseData = await response.json();
      
      expect(responseData.subjects).toHaveLength(3);
      expect(responseData.totalCredits).toBe(9);
      expect(responseData.earnedCredits).toBe(7);
      
      // Check individual subjects
      const regularSubjects = responseData.subjects.filter((s: any) => !s.isBacklog);
      const backlogSubjects = responseData.subjects.filter((s: any) => s.isBacklog);
      
      expect(regularSubjects).toHaveLength(2);
      expect(backlogSubjects).toHaveLength(1);
    });

    test('should handle SPI and CPI calculations', async ({ request }) => {
      const uniqueId = generateUniqueId();
      const resultData = {
        studentId: `std_spi_cpi_test_${uniqueId}`,
        enrollmentNo: `220010${uniqueId.slice(-6)}`,
        st_id: `220010${uniqueId.slice(-6)}`,
        name: `SPI CPI Test Student ${uniqueId}`,
        branchName: 'Computer Engineering',
        semester: 3,
        exam: 'Winter 2024 Regular',
        examid: 12356,
        subjects: [
          {
            code: 'CS301',
            name: 'Database Systems',
            credits: 4,
            grade: 'AA',
            isBacklog: false,
            theoryEseGrade: 'AA'
          }
        ],
        spi: 9.5,
        cpi: 9.2,
        result: 'PASS'
      };

      const response = await request.post(`${baseURL}/api/results`, {
        data: resultData
      });

      expect(response.status()).toBe(201);
      const responseData = await response.json();
      
      expect(responseData.spi).toBe(9.5);
      expect(responseData.cpi).toBe(9.2);
      expect(typeof responseData.spi).toBe('number');
      expect(typeof responseData.cpi).toBe('number');
    });
  });

  test.describe('Results Data Integrity', () => {
    test('should maintain data consistency during updates', async ({ request }) => {
      const uniqueId = generateUniqueId();
      // Create initial result
      const originalData = {
        studentId: `std_consistency_test_${uniqueId}`,
        enrollmentNo: `220010${uniqueId.slice(-6)}`,
        st_id: `220010${uniqueId.slice(-6)}`,
        name: `Consistency Test Student ${uniqueId}`,
        branchName: 'Computer Engineering',
        semester: 4,
        exam: 'Winter 2024 Regular',
        examid: 12357,
        subjects: [
          {
            code: 'CS401',
            name: 'Software Engineering',
            credits: 4,
            grade: 'AB',
            isBacklog: false,
            theoryEseGrade: 'AB'
          }
        ],
        spi: 8.0,
        cpi: 8.2,
        result: 'PASS'
      };

      const createResponse = await request.post(`${baseURL}/api/results`, {
        data: originalData
      });
      
      const createdResult = await createResponse.json();
      const resultId = createdResult._id;
      const originalCreatedAt = createdResult.createdAt;

      // Update result
      const updateData = {
        studentId: originalData.studentId,
        enrollmentNo: originalData.enrollmentNo,
        examid: originalData.examid,
        subjects: [
          {
            code: 'CS402',
            name: 'Web Technologies',
            credits: 3,
            grade: 'AA',
            isBacklog: false,
            theoryEseGrade: 'AA'
          }
        ],
        spi: 8.5,
        cpi: 8.4
      };

      const updateResponse = await request.post(`${baseURL}/api/results`, {
        data: updateData
      });

      const updatedResult = await updateResponse.json();

      // Verify data integrity
      expect(updatedResult._id).toBe(resultId);
      expect(updatedResult.createdAt).toBe(originalCreatedAt); // Should not change
      expect(updatedResult.updatedAt).not.toBe(originalCreatedAt); // Should be updated
      expect(updatedResult.studentId).toBe(originalData.studentId); // Should be preserved
      expect(updatedResult.enrollmentNo).toBe(originalData.enrollmentNo); // Should be preserved
      expect(updatedResult.subjects).toHaveLength(2); // Should have both subjects
      expect(updatedResult.spi).toBe(updateData.spi); // Should be updated
    });
  });
});
