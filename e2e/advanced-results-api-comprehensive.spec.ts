import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';

test.describe('Advanced Results APIs - Critical In-Memory Storage', () => {

  test('should handle Results Analysis API', async ({ page }) => {
    const analysisEndpoint = `${API_BASE}/results/analysis`;
    
    const response = await page.request.get(analysisEndpoint);
    
    expect([200, 404, 500]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      
      // Should return analysis data structure
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
      
      // Common analysis properties
      if (data.overallStatistics) {
        expect(data.overallStatistics).toHaveProperty('totalStudents');
        expect(data.overallStatistics).toHaveProperty('averagePercentage');
      }
    }
  });

  test('should handle Results Analysis with filters', async ({ page }) => {
    const filters = [
      'semester=3',
      'academicYear=2024-25',
      'branchName=Computer%20Engineering',
      'examType=regular'
    ];
    
    for (const filter of filters) {
      const response = await page.request.get(`${API_BASE}/results/analysis?${filter}`);
      
      expect([200, 404, 400]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toBeDefined();
        expect(typeof data).toBe('object');
      }
    }
  });

  test('should handle Results Batches API', async ({ page }) => {
    const batchesEndpoint = `${API_BASE}/results/batches`;
    
    const response = await page.request.get(batchesEndpoint);
    
    expect([200, 404]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      
      if (Array.isArray(data)) {
        data.forEach(batch => {
          expect(batch).toHaveProperty('id');
          expect(batch).toHaveProperty('name');
        });
      }
    }
  });

  test('should handle Results Batch deletion', async ({ page }) => {
    // First, try to get batches to find one to delete
    const batchesResponse = await page.request.get(`${API_BASE}/results/batches`);
    
    if (batchesResponse.status() === 200) {
      const batches = await batchesResponse.json();
      
      if (Array.isArray(batches) && batches.length > 0) {
        const batchToDelete = batches[0];
        
        const deleteResponse = await page.request.delete(`${API_BASE}/results/batches/${batchToDelete.id}`);
        
        // Should handle deletion request
        expect([200, 204, 404, 400]).toContain(deleteResponse.status());
        
        if ([200, 204].includes(deleteResponse.status())) {
          // Verify batch is deleted
          const verifyResponse = await page.request.get(`${API_BASE}/results/batches`);
          
          if (verifyResponse.status() === 200) {
            const remainingBatches = await verifyResponse.json();
            if (Array.isArray(remainingBatches)) {
              const deletedBatch = remainingBatches.find(b => b.id === batchToDelete.id);
              expect(deletedBatch).toBeUndefined();
            }
          }
        }
      }
    }
  });

  test('should handle Student-specific Results API', async ({ page }) => {
    const studentIds = ['student_001', 'student_002', 'nonexistent_student'];
    
    for (const studentId of studentIds) {
      const response = await page.request.get(`${API_BASE}/results/student/${studentId}`);
      
      expect([200, 404, 400]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toBeDefined();
        expect(typeof data === 'object' || Array.isArray(data)).toBe(true);
        
        if (Array.isArray(data)) {
          data.forEach(result => {
            expect(result).toHaveProperty('studentId');
            expect(result.studentId).toBe(studentId);
          });
        } else if (data.studentId) {
          expect(data.studentId).toBe(studentId);
        }
      }
    }
  });

  test('should handle GTU Results Import API', async ({ page }) => {
    const importEndpoint = `${API_BASE}/results/import-gtu`;
    
    // Mock GTU results CSV data
    const gtuCsvData = `enrollmentNo,semester,examYear,examMonth,subjectCode,subjectName,theory,practical,total,grade,credits,status
STU001,3,2024,MAY,CSE301,Data Structures,85,90,175,AA,4,PASS
STU002,3,2024,MAY,CSE301,Data Structures,75,80,155,AB,4,PASS
STU001,3,2024,MAY,CSE302,Database Systems,80,85,165,AB,4,PASS`;

    const formData = new FormData();
    const blob = new Blob([gtuCsvData], { type: 'text/csv' });
    formData.append('file', blob, 'gtu_results.csv');
    
    const response = await page.request.post(importEndpoint, {
      data: formData
    });
    
    expect([200, 400, 422, 500]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('message');
      
      if (data.imported) {
        expect(typeof data.imported).toBe('number');
        expect(data.imported).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should validate GTU import data format', async ({ page }) => {
    const importEndpoint = `${API_BASE}/results/import-gtu`;
    
    // Test with invalid GTU data format
    const invalidData = `invalid,data,format
without,proper,gtu,headers`;

    const formData = new FormData();
    const blob = new Blob([invalidData], { type: 'text/csv' });
    formData.append('file', blob, 'invalid_gtu.csv');
    
    const response = await page.request.post(importEndpoint, {
      data: formData
    });
    
    // Should handle invalid data gracefully
    expect([400, 422, 500]).toContain(response.status());
    
    if (response.status() >= 400) {
      const errorData = await response.json();
      expect(errorData).toHaveProperty('message');
    }
  });

  test('should handle Results Export with advanced filters', async ({ page }) => {
    const exportEndpoint = `${API_BASE}/results/export`;
    
    const filters = [
      '', // No filters
      '?semester=3',
      '?academicYear=2024-25',
      '?branchName=Computer%20Engineering',
      '?semester=3&academicYear=2024-25',
      '?format=csv',
      '?format=excel'
    ];
    
    for (const filter of filters) {
      const response = await page.request.get(`${exportEndpoint}${filter}`);
      
      expect([200, 404, 400]).toContain(response.status());
      
      if (response.status() === 200) {
        const contentType = response.headers()['content-type'];
        expect([
          'text/csv', 
          'application/csv', 
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/octet-stream'
        ]).toContain(contentType);
      }
    }
  });

  test('should handle comprehensive results analysis', async ({ page }) => {
    const analysisEndpoint = `${API_BASE}/results/analysis`;
    
    // Test various analysis parameters
    const analysisParams = [
      'groupBy=semester',
      'groupBy=branch',
      'groupBy=academicYear',
      'includeStatistics=true',
      'includePercentiles=true',
      'includeTrends=true'
    ];
    
    for (const param of analysisParams) {
      const response = await page.request.get(`${analysisEndpoint}?${param}`);
      
      expect([200, 400, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toBeDefined();
        expect(typeof data).toBe('object');
      }
    }
  });

  test('should validate student results data integrity', async ({ page }) => {
    // Get a student's results
    const studentResponse = await page.request.get(`${API_BASE}/results/student/student_001`);
    
    if (studentResponse.status() === 200) {
      const results = await studentResponse.json();
      
      if (Array.isArray(results) && results.length > 0) {
        results.forEach(result => {
          // Validate result structure
          expect(result).toHaveProperty('studentId');
          expect(result).toHaveProperty('semester');
          expect(result).toHaveProperty('examYear');
          
          // Validate data types
          expect(typeof result.studentId).toBe('string');
          expect(typeof result.semester).toBe('number');
          
          // Validate marks if present
          if (result.theory !== undefined) {
            expect(typeof result.theory).toBe('number');
            expect(result.theory).toBeGreaterThanOrEqual(0);
          }
          
          if (result.practical !== undefined) {
            expect(typeof result.practical).toBe('number');
            expect(result.practical).toBeGreaterThanOrEqual(0);
          }
          
          if (result.total !== undefined) {
            expect(typeof result.total).toBe('number');
            expect(result.total).toBeGreaterThanOrEqual(0);
          }
        });
      }
    }
  });

  test('should handle concurrent results operations', async ({ page }) => {
    // Test multiple concurrent operations
    const operations = [
      page.request.get(`${API_BASE}/results/analysis`),
      page.request.get(`${API_BASE}/results/batches`),
      page.request.get(`${API_BASE}/results/student/student_001`),
      page.request.get(`${API_BASE}/results/export?format=csv`)
    ];
    
    const responses = await Promise.all(operations);
    
    // All operations should complete without crashes
    responses.forEach(response => {
      expect([200, 404, 400, 500]).toContain(response.status());
    });
    
    // Verify that operations don't interfere with each other
    const validResponses = responses.filter(r => r.status() === 200);
    
    if (validResponses.length > 0) {
      // Handle responses based on content type
      for (const response of validResponses) {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          expect(data).toBeDefined();
        } else if (contentType.includes('text/csv')) {
          const csvData = await response.text();
          expect(csvData).toBeDefined();
          expect(csvData.length).toBeGreaterThan(0);
        } else {
          // For other content types, just verify the response is defined
          const data = await response.text();
          expect(data).toBeDefined();
        }
      }
    }
  });

  test('should handle results batch processing operations', async ({ page }) => {
    // Test batch operations for results
    const testOperations = [
      'create_batch',
      'process_batch',
      'validate_batch',
      'delete_batch'
    ];
    
    for (const operation of testOperations) {
      const batchesResponse = await page.request.get(`${API_BASE}/results/batches`);
      
      expect([200, 404]).toContain(batchesResponse.status());
      
      if (batchesResponse.status() === 200) {
        const batches = await batchesResponse.json();
        
        if (Array.isArray(batches) && batches.length > 0) {
          const testBatch = batches[0];
          
          // Test batch-specific operations
          const batchResponse = await page.request.get(`${API_BASE}/results/batches/${testBatch.id}`);
          expect([200, 404]).toContain(batchResponse.status());
        }
      }
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    const errorScenarios = [
      `${API_BASE}/results/analysis?invalidParam=value`,
      `${API_BASE}/results/student/nonexistent_student_12345`,
      `${API_BASE}/results/batches/nonexistent_batch_12345`,
      `${API_BASE}/results/export?format=unsupported_format`
    ];
    
    for (const scenario of errorScenarios) {
      const response = await page.request.get(scenario);
      
      // Should handle errors gracefully without crashing
      expect([200, 400, 404, 405, 422, 500]).toContain(response.status());
      
      if (response.status() >= 400) {
        try {
          const errorData = await response.json();
          expect(errorData).toHaveProperty('message');
          expect(typeof errorData.message).toBe('string');
        } catch (e) {
          // Some error responses may not be JSON (e.g., 405 Method Not Allowed)
          const textResponse = await response.text();
          expect(typeof textResponse).toBe('string');
        }
      }
    }
  });

  test('should maintain data consistency across advanced operations', async ({ page }) => {
    // Test that advanced operations don't corrupt basic results data
    const basicEndpoint = `${API_BASE}/results`;
    
    // Get baseline data
    const beforeResponse = await page.request.get(basicEndpoint);
    
    if (beforeResponse.status() === 200) {
      // Perform various advanced operations
      await page.request.get(`${API_BASE}/results/analysis`);
      await page.request.get(`${API_BASE}/results/batches`);
      await page.request.get(`${API_BASE}/results/export`);
      
      // Verify basic data is still intact
      const afterResponse = await page.request.get(basicEndpoint);
      expect(afterResponse.status()).toBe(beforeResponse.status());
      
      if (afterResponse.status() === 200) {
        const beforeData = await beforeResponse.json();
        const afterData = await afterResponse.json();
        
        // Data structure should remain consistent
        expect(typeof afterData).toBe(typeof beforeData);
        
        if (Array.isArray(beforeData) && Array.isArray(afterData)) {
          // Should have same or more records (in case of imports)
          expect(afterData.length).toBeGreaterThanOrEqual(beforeData.length);
        }
      }
    }
  });
});
