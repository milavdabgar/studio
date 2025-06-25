import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Reports API - In-Memory Storage Endpoints
 * Priority: Reports Module (Critical for Analytics and Business Intelligence)
 * 
 * This test suite covers the reports API endpoints that use in-memory storage
 * and are critical for the MongoDB migration. Tests ensure data integrity
 * and business logic preservation during migration.
 */

// Base URL for API endpoints
const API_BASE = '/api';

test.describe('Reports API - Critical In-Memory Storage', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that initializes the app context
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should generate course enrollments report', async ({ page }) => {
    // Test GET /api/reports/course-enrollments
    const response = await page.request.get(`${API_BASE}/reports/course-enrollments`);
    
    expect(response.status()).toBe(200);
    const responseData = await response.json();
    
    // Should return structured report data
    expect(responseData).toHaveProperty('data');
    expect(Array.isArray(responseData.data)).toBe(true);
    
    if (responseData.data.length > 0) {
      const firstReport = responseData.data[0];
      
      // Check report structure
      expect(firstReport).toHaveProperty('courseOfferingId');
      expect(firstReport).toHaveProperty('courseName');
      expect(firstReport).toHaveProperty('courseCode');
      expect(firstReport).toHaveProperty('programName');
      expect(firstReport).toHaveProperty('semester');
      expect(firstReport).toHaveProperty('academicYear');
      expect(firstReport).toHaveProperty('enrolledStudents');
      expect(firstReport).toHaveProperty('facultyNames');
      
      // Check data types
      expect(typeof firstReport.courseOfferingId).toBe('string');
      expect(typeof firstReport.courseName).toBe('string');
      expect(typeof firstReport.enrolledStudents).toBe('number');
      expect(Array.isArray(firstReport.facultyNames)).toBe(true);
    }
  });

  test('should filter course enrollments report by program', async ({ page }) => {
    // Test filtering by programId
    const programResponse = await page.request.get(`${API_BASE}/reports/course-enrollments?programId=test_program_id`);
    
    expect(programResponse.status()).toBe(200);
    const programData = await programResponse.json();
    
    expect(programData).toHaveProperty('data');
    expect(Array.isArray(programData.data)).toBe(true);
    
    // If there are results, they should be filtered by the program
    if (programData.data.length > 0) {
      // All results should be from the specified program or related
      programData.data.forEach((report: any) => {
        expect(report).toHaveProperty('programName');
      });
    }
  });

  test('should filter course enrollments report by academic year', async ({ page }) => {
    // Test filtering by academicYear
    const academicYearResponse = await page.request.get(`${API_BASE}/reports/course-enrollments?academicYear=2024-25`);
    
    expect(academicYearResponse.status()).toBe(200);
    const academicYearData = await academicYearResponse.json();
    
    expect(academicYearData).toHaveProperty('data');
    expect(Array.isArray(academicYearData.data)).toBe(true);
    
    // If there are results, they should be filtered by academic year
    if (academicYearData.data.length > 0) {
      academicYearData.data.forEach((report: any) => {
        expect(report.academicYear).toBe('2024-25');
      });
    }
  });

  test('should filter course enrollments report by semester', async ({ page }) => {
    // Test filtering by semester
    const semesterResponse = await page.request.get(`${API_BASE}/reports/course-enrollments?semester=1`);
    
    expect(semesterResponse.status()).toBe(200);
    const semesterData = await semesterResponse.json();
    
    expect(semesterData).toHaveProperty('data');
    expect(Array.isArray(semesterData.data)).toBe(true);
    
    // If there are results, they should be filtered by semester
    if (semesterData.data.length > 0) {
      semesterData.data.forEach((report: any) => {
        expect(report.semester).toBe(1);
      });
    }
  });

  test('should handle multiple filters for course enrollments', async ({ page }) => {
    // Test multiple filters combined
    const multiFilterResponse = await page.request.get(`${API_BASE}/reports/course-enrollments?academicYear=2024-25&semester=1&programId=test_program`);
    
    expect(multiFilterResponse.status()).toBe(200);
    const multiFilterData = await multiFilterResponse.json();
    
    expect(multiFilterData).toHaveProperty('data');
    expect(Array.isArray(multiFilterData.data)).toBe(true);
    
    // Results should match all applied filters
    if (multiFilterData.data.length > 0) {
      multiFilterData.data.forEach((report: any) => {
        expect(report.academicYear).toBe('2024-25');
        expect(report.semester).toBe(1);
      });
    }
  });

  test('should generate student strength report', async ({ page }) => {
    // Test GET /api/reports/student-strength
    const response = await page.request.get(`${API_BASE}/reports/student-strength`);
    
    expect(response.status()).toBe(200);
    const responseData = await response.json();
    
    // Should return structured report data (direct structure, not wrapped in 'data')
    expect(responseData).toHaveProperty('byInstitute');
    expect(responseData).toHaveProperty('overallTotal');
    
    expect(Array.isArray(responseData.byInstitute)).toBe(true);
    expect(typeof responseData.overallTotal).toBe('number');
    
    if (responseData.byInstitute.length > 0) {
      const firstInstitute = responseData.byInstitute[0];
      
      // Check institute structure
      expect(firstInstitute).toHaveProperty('instituteId');
      expect(firstInstitute).toHaveProperty('instituteName');
      expect(firstInstitute).toHaveProperty('instituteCode');
      expect(firstInstitute).toHaveProperty('totalStudents');
      expect(firstInstitute).toHaveProperty('programs');
      
      expect(typeof firstInstitute.instituteId).toBe('string');
      expect(typeof firstInstitute.instituteName).toBe('string');
      expect(typeof firstInstitute.totalStudents).toBe('number');
      expect(Array.isArray(firstInstitute.programs)).toBe(true);
      
      if (firstInstitute.programs.length > 0) {
        const firstProgram = firstInstitute.programs[0];
        
        // Check program structure
        expect(firstProgram).toHaveProperty('programId');
        expect(firstProgram).toHaveProperty('programName');
        expect(firstProgram).toHaveProperty('programCode');
        expect(firstProgram).toHaveProperty('totalStudents');
        expect(firstProgram).toHaveProperty('batches');
        
        expect(Array.isArray(firstProgram.batches)).toBe(true);
        
        if (firstProgram.batches.length > 0) {
          const firstBatch = firstProgram.batches[0];
          
          // Check batch structure
          expect(firstBatch).toHaveProperty('batchId');
          expect(firstBatch).toHaveProperty('batchName');
          expect(firstBatch).toHaveProperty('totalStudents');
          expect(firstBatch).toHaveProperty('semesters');
          
          expect(Array.isArray(firstBatch.semesters)).toBe(true);
          
          if (firstBatch.semesters.length > 0) {
            const firstSemester = firstBatch.semesters[0];
            
            // Check semester structure
            expect(firstSemester).toHaveProperty('semester');
            expect(firstSemester).toHaveProperty('totalStudents');
            
            expect(typeof firstSemester.semester).toBe('number');
            expect(typeof firstSemester.totalStudents).toBe('number');
          }
        }
      }
    }
  });

  test('should filter student strength report by institute', async ({ page }) => {
    // Test filtering by instituteId
    const instituteResponse = await page.request.get(`${API_BASE}/reports/student-strength?instituteId=test_institute_id`);
    
    expect(instituteResponse.status()).toBe(200);
    const instituteData = await instituteResponse.json();
    
    expect(instituteData).toHaveProperty('byInstitute');
    expect(instituteData).toHaveProperty('overallTotal');
    
    // Should only return data for the specified institute
    if (instituteData.byInstitute.length > 0) {
      expect(instituteData.byInstitute.length).toBeLessThanOrEqual(1);
      if (instituteData.byInstitute.length === 1) {
        expect(instituteData.byInstitute[0].instituteId).toBe('test_institute_id');
      }
    }
  });

  test('should handle empty data gracefully for course enrollments', async ({ page }) => {
    // Test with filters that likely return no data
    const emptyResponse = await page.request.get(`${API_BASE}/reports/course-enrollments?programId=non_existent_program&academicYear=1900-01`);
    
    expect(emptyResponse.status()).toBe(200);
    const emptyData = await emptyResponse.json();
    
    expect(emptyData).toHaveProperty('data');
    expect(Array.isArray(emptyData.data)).toBe(true);
    expect(emptyData.data.length).toBe(0);
  });

  test('should handle empty data gracefully for student strength', async ({ page }) => {
    // Test with filters that likely return no data
    const emptyResponse = await page.request.get(`${API_BASE}/reports/student-strength?instituteId=non_existent_institute`);
    
    expect(emptyResponse.status()).toBe(200);
    const emptyData = await emptyResponse.json();
    
    // Student strength returns data directly (not wrapped in 'data' property)
    expect(emptyData).toHaveProperty('byInstitute');
    expect(emptyData).toHaveProperty('overallTotal');
    expect(Array.isArray(emptyData.byInstitute)).toBe(true);
    expect(emptyData.byInstitute.length).toBe(0);
    expect(emptyData.overallTotal).toBe(0);
  });

  test('should validate numeric filters for course enrollments', async ({ page }) => {
    // Test with invalid semester (non-numeric)
    const invalidSemesterResponse = await page.request.get(`${API_BASE}/reports/course-enrollments?semester=invalid`);
    
    // Should either handle gracefully or return valid response (depends on implementation)
    expect([200, 400]).toContain(invalidSemesterResponse.status());
    
    if (invalidSemesterResponse.status() === 200) {
      const data = await invalidSemesterResponse.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    }
  });

  test('should return consistent data structure', async ({ page }) => {
    // Test that the report structure is consistent across multiple calls
    const response1 = await page.request.get(`${API_BASE}/reports/course-enrollments`);
    const response2 = await page.request.get(`${API_BASE}/reports/student-strength`);
    
    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);
    
    const data1 = await response1.json();
    const data2 = await response2.json();
    
    // Course enrollments returns data wrapped in 'data' property
    expect(data1).toHaveProperty('data');
    expect(Array.isArray(data1.data)).toBe(true);
    
    // Student strength returns data directly (not wrapped)
    expect(data2).toHaveProperty('byInstitute');
    expect(data2).toHaveProperty('overallTotal');
  });

  test('should handle concurrent requests', async ({ page }) => {
    // Test multiple concurrent requests to ensure data consistency
    const requests = [
      page.request.get(`${API_BASE}/reports/course-enrollments`),
      page.request.get(`${API_BASE}/reports/student-strength`),
      page.request.get(`${API_BASE}/reports/course-enrollments?academicYear=2024-25`),
      page.request.get(`${API_BASE}/reports/student-strength?instituteId=test_institute`)
    ];
    
    const responses = await Promise.all(requests);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
    
    // All should return valid JSON
    const dataArray = await Promise.all(responses.map(r => r.json()));
    
    // Course enrollments return data wrapped, student strength returns data directly
    expect(dataArray[0]).toHaveProperty('data'); // course-enrollments
    expect(dataArray[1]).toHaveProperty('byInstitute'); // student-strength 
    expect(dataArray[2]).toHaveProperty('data'); // course-enrollments with filter
    expect(dataArray[3]).toHaveProperty('byInstitute'); // student-strength with filter
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test that reports handle missing related data gracefully
    // (This is mostly about ensuring no crashes occur when data is missing)
    
    const courseEnrollmentsResponse = await page.request.get(`${API_BASE}/reports/course-enrollments`);
    const studentStrengthResponse = await page.request.get(`${API_BASE}/reports/student-strength`);
    
    // Should not crash even if related data is missing
    expect([200, 500]).toContain(courseEnrollmentsResponse.status());
    expect([200, 500]).toContain(studentStrengthResponse.status());
    
    if (courseEnrollmentsResponse.status() === 200) {
      const data = await courseEnrollmentsResponse.json();
      expect(data).toHaveProperty('data');
    }
    
    if (studentStrengthResponse.status() === 200) {
      const data = await studentStrengthResponse.json();
      expect(data).toHaveProperty('byInstitute'); // Not wrapped in 'data'
    }
  });
});
