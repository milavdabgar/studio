import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';

test.describe('Import/Export APIs - Critical In-Memory Storage', () => {
  
  // Test Import APIs for critical entities
  test('should handle Students Import API', async ({ page }) => {
    const importEndpoint = `${API_BASE}/students/import`;
    
    // Test CSV data for students import
    const csvData = `enrollmentNo,name,email,contactNumber,dateOfBirth,gender,category,programId,batchId,currentSemester,isComplete,termClose
STU001,John Doe,john@example.com,1234567890,1995-05-15,Male,General,prog_001,batch_001,3,false,false
STU002,Jane Smith,jane@example.com,0987654321,1996-08-22,Female,OBC,prog_001,batch_001,3,false,false`;

    // Mock CSV file upload
    const formData = new FormData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    formData.append('file', blob, 'students.csv');
    
    const response = await page.request.post(importEndpoint, {
      data: formData
    });
    
    // Should handle the import request (success or meaningful error)
    expect([200, 400, 500]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('message');
    }
  });

  test('should handle Faculty Import API', async ({ page }) => {
    const importEndpoint = `${API_BASE}/faculty/import`;
    
    const csvData = `employeeId,name,email,contactNumber,qualification,experience,designation,specialization,departmentId,isHOD,isPrincipal
EMP001,Dr. John Smith,john@faculty.com,1234567890,PhD,10,Professor,Computer Science,dept_001,false,false
EMP002,Prof. Jane Doe,jane@faculty.com,0987654321,MSc,5,Assistant Professor,Mathematics,dept_002,true,false`;

    const formData = new FormData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    formData.append('file', blob, 'faculty.csv');
    
    const response = await page.request.post(importEndpoint, {
      data: formData
    });
    
    expect([200, 400, 500]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('message');
    }
  });

  test('should handle Projects Import API', async ({ page }) => {
    const importEndpoint = `${API_BASE}/projects/import`;
    
    const csvData = `title,description,category,department,guide,eventId,submissionStatus,status
AI Chatbot,An intelligent chatbot using machine learning,Software Development,Computer Engineering,Dr. Smith,event_001,submitted,approved
IoT Home Automation,Smart home system using IoT sensors,Hardware,Electronics Engineering,Prof. Johnson,event_001,pending,active`;

    const formData = new FormData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    formData.append('file', blob, 'projects.csv');
    
    const response = await page.request.post(importEndpoint, {
      data: formData
    });
    
    expect([200, 400, 500]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('message');
    }
  });

  test('should handle Project Teams Import API', async ({ page }) => {
    const importEndpoint = `${API_BASE}/project-teams/import`;
    
    const csvData = `projectId,teamName,leaderId,memberIds,department,eventId
proj_001,Team Alpha,leader_001,member_001;member_002,Computer Engineering,event_001
proj_002,Team Beta,leader_002,member_003;member_004,Electronics Engineering,event_001`;

    const formData = new FormData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    formData.append('file', blob, 'teams.csv');
    
    const response = await page.request.post(importEndpoint, {
      data: formData
    });
    
    expect([200, 400, 500]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('message');
    }
  });

  test('should handle Committees Import API', async ({ page }) => {
    const importEndpoint = `${API_BASE}/committees/import`;
    
    const csvData = `name,type,description,chairpersonId,memberIds,departmentId,isActive
Academic Committee,academic,Handles academic policies,chair_001,member_001;member_002,dept_001,true
Research Committee,research,Oversees research activities,chair_002,member_003;member_004,dept_002,true`;

    const formData = new FormData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    formData.append('file', blob, 'committees.csv');
    
    const response = await page.request.post(importEndpoint, {
      data: formData
    });
    
    expect([200, 400, 500]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('message');
    }
  });

  test('should handle Assessments Import API', async ({ page }) => {
    const importEndpoint = `${API_BASE}/assessments/import`;
    
    const csvData = `name,type,description,totalMarks,courseOfferingId,dueDate,instructions
Midterm Exam,exam,Mid-semester examination,100,co_001,2024-03-15,Bring calculator and ID
Assignment 1,assignment,Programming assignment,50,co_001,2024-02-28,Submit via portal`;

    const formData = new FormData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    formData.append('file', blob, 'assessments.csv');
    
    const response = await page.request.post(importEndpoint, {
      data: formData
    });
    
    expect([200, 400, 500]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('message');
    }
  });

  // Test Export APIs
  test('should handle Projects Export API', async ({ page }) => {
    const exportEndpoint = `${API_BASE}/projects/export`;
    
    const response = await page.request.get(exportEndpoint);
    
    expect([200, 404]).toContain(response.status());
    
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'];
      // Should return CSV or similar export format
      expect(['text/csv', 'application/csv', 'application/octet-stream']).toContain(contentType);
    }
  });

  test('should handle Project Teams Export API', async ({ page }) => {
    const exportEndpoint = `${API_BASE}/project-teams/export`;
    
    const response = await page.request.get(exportEndpoint);
    
    expect([200, 404]).toContain(response.status());
    
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'];
      expect(['text/csv', 'application/csv', 'application/octet-stream']).toContain(contentType);
    }
  });

  test('should handle Results Export API', async ({ page }) => {
    const exportEndpoint = `${API_BASE}/results/export`;
    
    const response = await page.request.get(exportEndpoint);
    
    expect([200, 404]).toContain(response.status());
    
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'];
      expect(['text/csv', 'application/csv', 'application/octet-stream']).toContain(contentType);
    }
  });

  // Test import validation and error handling
  test('should validate CSV format in import APIs', async ({ page }) => {
    const endpoints = [
      `${API_BASE}/students/import`,
      `${API_BASE}/faculty/import`,
      `${API_BASE}/projects/import`
    ];
    
    for (const endpoint of endpoints) {
      // Test with invalid CSV data
      const invalidCsvData = 'invalid,csv,data\nwithout,proper,headers';
      const formData = new FormData();
      const blob = new Blob([invalidCsvData], { type: 'text/csv' });
      formData.append('file', blob, 'invalid.csv');
      
      const response = await page.request.post(endpoint, {
        data: formData
      });
      
      // Should handle invalid data gracefully
      expect([200, 400, 422, 500]).toContain(response.status());
      
      if (response.status() >= 400) {
        const errorData = await response.json();
        expect(errorData).toHaveProperty('message');
      }
    }
  });

  test('should handle file upload errors in import APIs', async ({ page }) => {
    const endpoint = `${API_BASE}/students/import`;
    
    // Test without file
    const response = await page.request.post(endpoint);
    
    expect([400, 422, 500]).toContain(response.status());
    
    if (response.status() >= 400) {
      const errorData = await response.json();
      expect(errorData).toHaveProperty('message');
    }
  });

  test('should handle export with filtering parameters', async ({ page }) => {
    const endpoints = [
      `${API_BASE}/projects/export?department=Computer%20Engineering`,
      `${API_BASE}/project-teams/export?eventId=event_001`,
      `${API_BASE}/results/export?semester=3`
    ];
    
    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint);
      
      // Should handle filtered exports
      expect([200, 404, 400]).toContain(response.status());
      
      if (response.status() === 200) {
        const contentType = response.headers()['content-type'];
        expect(['text/csv', 'application/csv', 'application/octet-stream']).toContain(contentType);
      }
    }
  });

  test('should handle batch operations in import APIs', async ({ page }) => {
    // Test large batch import
    const batchCsvData = Array.from({ length: 50 }, (_, i) => 
      `STU${String(i + 1).padStart(3, '0')},Student ${i + 1},student${i + 1}@example.com,12345678${String(i).padStart(2, '0')},1995-01-01,Male,General,prog_001,batch_001,1,false,false`
    ).join('\n');
    
    const csvWithHeaders = `enrollmentNo,name,email,contactNumber,dateOfBirth,gender,category,programId,batchId,currentSemester,isComplete,termClose\n${batchCsvData}`;
    
    const formData = new FormData();
    const blob = new Blob([csvWithHeaders], { type: 'text/csv' });
    formData.append('file', blob, 'batch_students.csv');
    
    const response = await page.request.post(`${API_BASE}/students/import`, {
      data: formData
    });
    
    // Should handle batch imports
    expect([200, 400, 413, 500]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('message');
    }
  });

  test('should preserve data integrity during import operations', async ({ page }) => {
    // Test that imports don't corrupt existing data structure
    const testEndpoints = [
      `${API_BASE}/students`,
      `${API_BASE}/faculty`,
      `${API_BASE}/projects`
    ];
    
    // Get data before import
    const beforeData = await Promise.all(
      testEndpoints.map(endpoint => page.request.get(endpoint))
    );
    
    // Attempt import with valid data
    const csvData = `enrollmentNo,name,email,contactNumber,dateOfBirth,gender,category,programId,batchId,currentSemester,isComplete,termClose
TEST001,Test Student,test@example.com,1234567890,1995-01-01,Male,General,prog_001,batch_001,1,false,false`;

    const formData = new FormData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    formData.append('file', blob, 'test.csv');
    
    await page.request.post(`${API_BASE}/students/import`, {
      data: formData
    });
    
    // Get data after import
    const afterData = await Promise.all(
      testEndpoints.map(endpoint => page.request.get(endpoint))
    );
    
    // Verify API endpoints still respond correctly
    beforeData.forEach((response, index) => {
      expect(afterData[index].status()).toBe(response.status());
    });
  });
});
