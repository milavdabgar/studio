import { test, expect } from '@playwright/test';

test.describe('Results API - Comprehensive E2E Tests', () => {
  const baseURL = 'http://localhost:3000';
  let resultId: string;
  let studentId: string;
  let courseId: string;

  test.beforeEach(async () => {
    // Note: These tests assume the server is running and authentication is handled
  });

  test.describe('Results CRUD Operations', () => {
    test('should create a new result', async ({ request }) => {
      const resultData = {
        studentId: 'std_test_123',
        st_id: '220010107123',
        enrollmentNo: '220010107123',
        name: 'TEST STUDENT',
        branchName: 'Computer Engineering',
        semester: 2,
        exam: 'Winter 2024 Regular',
        examid: 54321,
        subjects: [
          {
            code: 'CS201',
            name: 'Data Structures',
            credits: 4,
            grade: 'A',
            isBacklog: false,
            theoryEseGrade: 'A'
          },
          {
            code: 'MA201',
            name: 'Mathematics 2',
            credits: 3,
            grade: 'B+',
            isBacklog: false,
            theoryEseGrade: 'B+'
          }
        ],
        spi: 8.5,
        cpi: 8.5,
        result: 'PASS',
        uploadBatch: 'test_batch_123'
      };

      const response = await request.post(`${baseURL}/api/results`, {
        data: resultData
      });

      expect(response.status()).toBe(201);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('_id');
      expect(responseData.studentId).toBe(resultData.studentId);
      expect(responseData.enrollmentNo).toBe(resultData.enrollmentNo);
      expect(responseData.name).toBe(resultData.name);
      expect(responseData.semester).toBe(resultData.semester);
      expect(responseData.examid).toBe(resultData.examid);
      expect(responseData.spi).toBe(resultData.spi);
      expect(responseData.result).toBe(resultData.result);
      expect(Array.isArray(responseData.subjects)).toBe(true);
      expect(responseData.subjects).toHaveLength(2);
      expect(responseData.createdAt).toBeTruthy();
      expect(responseData.updatedAt).toBeTruthy();

      resultId = responseData._id;
      studentId = resultData.studentId;
    });

    test('should get all results', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/results`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.status).toBe('success');
      expect(responseData.data).toHaveProperty('results');
      expect(Array.isArray(responseData.data.results)).toBe(true);
      expect(responseData.data).toHaveProperty('pagination');
      
      if (responseData.data.results.length > 0) {
        const result = responseData.data.results[0];
        expect(result).toHaveProperty('st_id');
        expect(result).toHaveProperty('studentId');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('semester');
        expect(result).toHaveProperty('exam');
        expect(result).toHaveProperty('subjects');
        expect(result).toHaveProperty('spi');
        expect(result).toHaveProperty('cpi');
        expect(result).toHaveProperty('result');
        expect(Array.isArray(result.subjects)).toBe(true);
      }
    });

    test('should get a specific result by ID', async ({ request }) => {
      // First create a result
      const resultData = {
        studentId: 'student_456',
        courseId: 'course_789',
        semester: 'Spring 2024',
        academicYear: '2023-24',
        examType: 'midterm',
        subjectCode: 'MATH201',
        subjectName: 'Advanced Mathematics',
        marksObtained: 92,
        totalMarks: 100,
        grade: 'A+',
        credits: 3,
        gpa: 10.0,
        resultStatus: 'pass'
      };

      const createResponse = await request.post(`${baseURL}/api/results`, {
        data: resultData
      });

      const createdResult = await createResponse.json();
      const testResultId = createdResult.data.id;

      // Get the specific result
      const response = await request.get(`${baseURL}/api/results/${testResultId}`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe(testResultId);
      expect(responseData.data.studentId).toBe(resultData.studentId);
      expect(responseData.data.marksObtained).toBe(resultData.marksObtained);
    });

    test('should update a result', async ({ request }) => {
      // First create a result
      const resultData = {
        studentId: 'student_update',
        courseId: 'course_update',
        semester: 'Fall 2024',
        examType: 'final',
        subjectCode: 'PHY101',
        subjectName: 'Physics Fundamentals',
        marksObtained: 75,
        totalMarks: 100,
        grade: 'B+',
        credits: 4,
        gpa: 8.0,
        resultStatus: 'pass'
      };

      const createResponse = await request.post(`${baseURL}/api/results`, {
        data: resultData
      });

      const createdResult = await createResponse.json();
      const testResultId = createdResult.data.id;

      // Update the result
      const updateData = {
        marksObtained: 88,
        grade: 'A',
        gpa: 9.0,
        resultStatus: 'pass'
      };

      const updateResponse = await request.put(`${baseURL}/api/results/${testResultId}`, {
        data: updateData
      });

      expect(updateResponse.status()).toBe(200);
      const updateResponseData = await updateResponse.json();
      expect(updateResponseData.success).toBe(true);
      expect(updateResponseData.data.marksObtained).toBe(updateData.marksObtained);
      expect(updateResponseData.data.grade).toBe(updateData.grade);
      expect(updateResponseData.data.gpa).toBe(updateData.gpa);
    });

    test('should delete a result', async ({ request }) => {
      // First create a result
      const resultData = {
        studentId: 'student_delete',
        courseId: 'course_delete',
        semester: 'Spring 2024',
        examType: 'final',
        subjectCode: 'CHEM101',
        subjectName: 'Chemistry Basics',
        marksObtained: 70,
        totalMarks: 100,
        grade: 'B',
        credits: 3,
        gpa: 7.0,
        resultStatus: 'pass'
      };

      const createResponse = await request.post(`${baseURL}/api/results`, {
        data: resultData
      });

      const createdResult = await createResponse.json();
      const testResultId = createdResult.data.id;

      // Delete the result
      const deleteResponse = await request.delete(`${baseURL}/api/results/${testResultId}`);

      expect(deleteResponse.status()).toBe(200);
      const deleteResponseData = await deleteResponse.json();
      expect(deleteResponseData.success).toBe(true);

      // Verify the result is deleted
      const getResponse = await request.get(`${baseURL}/api/results/${testResultId}`);
      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe('Results Query and Filtering', () => {
    test('should filter results by student ID', async ({ request }) => {
      const testStudentId = 'filter_student_123';
      
      // Create a result for the test student
      const resultData = {
        studentId: testStudentId,
        courseId: 'course_filter',
        semester: 'Fall 2024',
        examType: 'final',
        subjectCode: 'ENG101',
        subjectName: 'English Literature',
        marksObtained: 80,
        totalMarks: 100,
        grade: 'A-',
        credits: 3,
        gpa: 8.5,
        resultStatus: 'pass'
      };

      await request.post(`${baseURL}/api/results`, { data: resultData });

      const response = await request.get(`${baseURL}/api/results?studentId=${testStudentId}`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.data)).toBe(true);
      
      responseData.data.forEach((result: any) => {
        expect(result.studentId).toBe(testStudentId);
      });
    });

    test('should filter results by semester', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/results?semester=Fall 2024`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.data)).toBe(true);
      
      responseData.data.forEach((result: any) => {
        expect(result.semester).toBe('Fall 2024');
      });
    });

    test('should filter results by academic year', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/results?academicYear=2024-25`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.data)).toBe(true);
      
      responseData.data.forEach((result: any) => {
        expect(result.academicYear).toBe('2024-25');
      });
    });

    test('should filter results by exam type', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/results?examType=final`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.data)).toBe(true);
      
      responseData.data.forEach((result: any) => {
        expect(result.examType).toBe('final');
      });
    });

    test('should filter results by result status', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/results?resultStatus=pass`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.data)).toBe(true);
      
      responseData.data.forEach((result: any) => {
        expect(result.resultStatus).toBe('pass');
      });
    });

    test('should support pagination', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/results?page=1&limit=5`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.data)).toBe(true);
      expect(responseData.data.length).toBeLessThanOrEqual(5);
    });
  });

  test.describe('Results Analysis and Reporting', () => {
    test('should get results analysis', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/results/analysis`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveProperty('totalResults');
      expect(responseData.data).toHaveProperty('passPercentage');
      expect(responseData.data).toHaveProperty('failPercentage');
      expect(responseData.data).toHaveProperty('averageGPA');
      expect(responseData.data).toHaveProperty('gradeDistribution');
    });

    test('should get results analysis by semester', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/results/analysis?semester=Fall 2024`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveProperty('semester');
      expect(responseData.data.semester).toBe('Fall 2024');
    });

    test('should get student-specific results', async ({ request }) => {
      const testStudentId = 'student_analysis_123';
      
      // Create results for the test student
      const results = [
        {
          studentId: testStudentId,
          courseId: 'course_1',
          semester: 'Fall 2024',
          subjectCode: 'CS101',
          subjectName: 'Programming',
          marksObtained: 85,
          totalMarks: 100,
          grade: 'A',
          credits: 4,
          gpa: 9.0,
          resultStatus: 'pass'
        },
        {
          studentId: testStudentId,
          courseId: 'course_2',
          semester: 'Fall 2024',
          subjectCode: 'MATH101',
          subjectName: 'Mathematics',
          marksObtained: 78,
          totalMarks: 100,
          grade: 'B+',
          credits: 3,
          gpa: 8.0,
          resultStatus: 'pass'
        }
      ];

      for (const result of results) {
        await request.post(`${baseURL}/api/results`, { data: result });
      }

      const response = await request.get(`${baseURL}/api/results/student/${testStudentId}`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.data.results)).toBe(true);
      expect(responseData.data).toHaveProperty('cgpa');
      expect(responseData.data).toHaveProperty('totalCredits');
      expect(responseData.data).toHaveProperty('totalSubjects');
      
      responseData.data.results.forEach((result: any) => {
        expect(result.studentId).toBe(testStudentId);
      });
    });

    test('should export results', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/results/export?format=csv`);

      expect(response.status()).toBe(200);
      // The response should be a file download
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('text/csv');
    });
  });

  test.describe('Results Batch Operations', () => {
    test('should get results batches', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/results/batches`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.data)).toBe(true);
    });

    test('should delete a results batch', async ({ request }) => {
      // This test assumes there's a batch to delete
      // In a real scenario, you'd create a batch first
      const batchId = 'test_batch_123';
      
      const response = await request.delete(`${baseURL}/api/results/batches/${batchId}`);

      // Could be 200 (deleted) or 404 (not found) - both are valid
      expect([200, 404]).toContain(response.status());
    });
  });

  test.describe('Results Validation', () => {
    test('should reject result creation with missing required fields', async ({ request }) => {
      const invalidData = {
        studentId: 'student_123'
        // Missing required fields
      };

      const response = await request.post(`${baseURL}/api/results`, {
        data: invalidData
      });

      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBeTruthy();
    });

    test('should reject result with invalid marks', async ({ request }) => {
      const invalidData = {
        studentId: 'student_123',
        courseId: 'course_456',
        semester: 'Fall 2024',
        examType: 'final',
        subjectCode: 'CS101',
        marksObtained: 150, // Invalid: more than total marks
        totalMarks: 100,
        grade: 'A',
        credits: 4,
        gpa: 9.0,
        resultStatus: 'pass'
      };

      const response = await request.post(`${baseURL}/api/results`, {
        data: invalidData
      });

      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('marks');
    });

    test('should reject result with invalid GPA', async ({ request }) => {
      const invalidData = {
        studentId: 'student_123',
        courseId: 'course_456',
        semester: 'Fall 2024',
        examType: 'final',
        subjectCode: 'CS101',
        marksObtained: 85,
        totalMarks: 100,
        grade: 'A',
        credits: 4,
        gpa: 15.0, // Invalid: GPA should be 0-10
        resultStatus: 'pass'
      };

      const response = await request.post(`${baseURL}/api/results`, {
        data: invalidData
      });

      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('gpa');
    });

    test('should handle non-existent result operations', async ({ request }) => {
      const nonExistentId = 'non_existent_result';

      // Test GET
      const getResponse = await request.get(`${baseURL}/api/results/${nonExistentId}`);
      expect(getResponse.status()).toBe(404);

      // Test PUT
      const putResponse = await request.put(`${baseURL}/api/results/${nonExistentId}`, {
        data: { marksObtained: 90 }
      });
      expect(putResponse.status()).toBe(404);

      // Test DELETE
      const deleteResponse = await request.delete(`${baseURL}/api/results/${nonExistentId}`);
      expect(deleteResponse.status()).toBe(404);
    });
  });

  test.describe('Results GTU Import', () => {
    test('should handle GTU results import', async ({ request }) => {
      const importData = {
        file: 'test-results.xlsx',
        semester: 'Fall 2024',
        academicYear: '2024-25',
        examType: 'final'
      };

      const response = await request.post(`${baseURL}/api/results/import-gtu`, {
        data: importData
      });

      // The response could be 200 (success) or 400 (validation error) depending on the file
      expect([200, 400]).toContain(response.status());
      const responseData = await response.json();
      expect(responseData).toHaveProperty('success');
    });
  });
});
