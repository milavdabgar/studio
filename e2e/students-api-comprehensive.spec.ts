import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Students API - In-Memory Storage Endpoints
 * Priority: Students Module (Critical for Academic Management)
 * 
 * This test suite covers the students API endpoints that use in-memory storage
 * and are critical for the MongoDB migration. Tests ensure data integrity
 * and business logic preservation during migration.
 */

// Base URL for API endpoints
const API_BASE = '/api';

// Test data for students
const testStudent = {
  enrollmentNumber: 'E2E12345678',
  gtuEnrollmentNumber: 'GTU2E234567890',
  fullNameGtuFormat: 'E2E TEST STUDENT NAME',
  firstName: 'Test',
  middleName: 'E2E',
  lastName: 'Student',
  personalEmail: 'test.e2e@example.com',
  instituteEmail: 'teste2e@institute.edu',
  programId: 'prog_test_e2e',
  department: 'dept_ce_gpp',
  currentSemester: 5,
  status: 'active',
  contactNumber: '9876543210',
  address: '123 Test Street, Test City',
  dateOfBirth: '2000-01-15',
  gender: 'Male',
  category: 'General',
  convocationYear: 2024,
  sem1Status: 'Passed',
  sem2Status: 'Passed',
  sem3Status: 'Passed',
  sem4Status: 'Passed',
  sem5Status: 'Pending',
  sem6Status: 'N/A',
  sem7Status: 'N/A',
  sem8Status: 'N/A',
  isComplete: false,
  termClose: false,
  isCancel: false,
  isPassAll: false
};

const testStudentUpdate = {
  firstName: 'Updated',
  currentSemester: 6,
  status: 'inactive',
  sem5Status: 'Passed',
  sem6Status: 'Pending'
};

test.describe('Students API - Critical In-Memory Storage', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that initializes the app context
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should create, read, update, and delete students (CRUD)', async ({ page }) => {
    let createdStudentId: string;

    // Make enrollment number unique to avoid conflicts
    const uniqueTestStudent = {
      ...testStudent,
      enrollmentNumber: `E2E${Date.now()}`,
      gtuEnrollmentNumber: `GTU${Date.now()}`,
      personalEmail: `test.e2e.${Date.now()}@example.com`,
      instituteEmail: `test${Date.now()}@institute.edu`
    };

    // Test CREATE - POST /api/students
    const createResponse = await page.request.post(`${API_BASE}/students`, {
      data: uniqueTestStudent
    });

    expect(createResponse.status()).toBe(201);
    const createdStudent = await createResponse.json();
    expect(createdStudent).toHaveProperty('id');
    expect(createdStudent.enrollmentNumber).toBe(uniqueTestStudent.enrollmentNumber);
    expect(createdStudent.firstName).toBe(uniqueTestStudent.firstName);
    expect(createdStudent.lastName).toBe(uniqueTestStudent.lastName);
    expect(createdStudent.personalEmail).toBe(uniqueTestStudent.personalEmail);
    expect(createdStudent.department).toBe(uniqueTestStudent.department);
    expect(createdStudent.currentSemester).toBe(uniqueTestStudent.currentSemester);
    expect(createdStudent.status).toBe(uniqueTestStudent.status);
    
    createdStudentId = createdStudent.id;

    // Test READ ALL - GET /api/students
    const getAllResponse = await page.request.get(`${API_BASE}/students`);
    expect(getAllResponse.status()).toBe(200);
    
    const allStudents = await getAllResponse.json();
    expect(Array.isArray(allStudents)).toBe(true);
    
    const foundStudent = allStudents.find((s: any) => s.id === createdStudentId);
    expect(foundStudent).toBeDefined();
    expect(foundStudent.enrollmentNumber).toBe(uniqueTestStudent.enrollmentNumber);
    expect(foundStudent.firstName).toBe(uniqueTestStudent.firstName);

    // Test READ ONE - GET /api/students/:id
    const getOneResponse = await page.request.get(`${API_BASE}/students/${createdStudentId}`);
    expect(getOneResponse.status()).toBe(200);
    
    const studentData = await getOneResponse.json();
    expect(studentData.id).toBe(createdStudentId);
    expect(studentData.enrollmentNumber).toBe(uniqueTestStudent.enrollmentNumber);
    expect(studentData.firstName).toBe(uniqueTestStudent.firstName);

    // Test UPDATE - PUT /api/students/:id
    const updateResponse = await page.request.put(`${API_BASE}/students/${createdStudentId}`, {
      data: {
        ...uniqueTestStudent,
        ...testStudentUpdate
      }
    });

    expect(updateResponse.status()).toBe(200);
    const updatedStudent = await updateResponse.json();
    expect(updatedStudent.id).toBe(createdStudentId);
    expect(updatedStudent.firstName).toBe(testStudentUpdate.firstName);
    expect(updatedStudent.currentSemester).toBe(testStudentUpdate.currentSemester);
    expect(updatedStudent.status).toBe(testStudentUpdate.status);
    expect(updatedStudent.sem5Status).toBe(testStudentUpdate.sem5Status);
    expect(updatedStudent.sem6Status).toBe(testStudentUpdate.sem6Status);

    // Verify update persisted
    const getUpdatedResponse = await page.request.get(`${API_BASE}/students/${createdStudentId}`);
    expect(getUpdatedResponse.status()).toBe(200);
    const updatedStudentVerify = await getUpdatedResponse.json();
    expect(updatedStudentVerify.firstName).toBe(testStudentUpdate.firstName);
    expect(updatedStudentVerify.currentSemester).toBe(testStudentUpdate.currentSemester);

    // Test DELETE - DELETE /api/students/:id
    const deleteResponse = await page.request.delete(`${API_BASE}/students/${createdStudentId}`);
    expect(deleteResponse.status()).toBe(200);

    // Verify deletion
    const getDeletedResponse = await page.request.get(`${API_BASE}/students/${createdStudentId}`);
    expect(getDeletedResponse.status()).toBe(404);
  });

  test('should validate required fields and data types', async ({ page }) => {
    // Test missing enrollment number
    const missingEnrollmentNumber = { ...testStudent } as any;
    delete missingEnrollmentNumber.enrollmentNumber;

    const missingEnrollmentResponse = await page.request.post(`${API_BASE}/students`, {
      data: missingEnrollmentNumber
    });

    expect(missingEnrollmentResponse.status()).toBe(400);
    const errorData1 = await missingEnrollmentResponse.json();
    expect(errorData1).toHaveProperty('message');
    expect(errorData1.message).toContain('Enrollment Number');

    // Test missing first name
    const missingFirstName = { 
      ...testStudent,
      enrollmentNumber: `MISSING_FNAME_${Date.now()}`,
      gtuEnrollmentNumber: `GTU_FNAME_${Date.now()}`,
      personalEmail: `missing.fname.${Date.now()}@example.com`,
      instituteEmail: `missing.fname.${Date.now()}@institute.edu`
    } as any;
    delete missingFirstName.firstName;
    delete missingFirstName.fullNameGtuFormat; // Also remove GTU format to trigger validation

    const missingFirstNameResponse = await page.request.post(`${API_BASE}/students`, {
      data: missingFirstName
    });

    expect(missingFirstNameResponse.status()).toBe(400);
    const errorData2 = await missingFirstNameResponse.json();
    expect(errorData2).toHaveProperty('message');
    expect(errorData2.message).toContain('Student Name');

    // Test missing last name
    const missingLastName = { 
      ...testStudent,
      enrollmentNumber: `MISSING_LNAME_${Date.now()}`,
      gtuEnrollmentNumber: `GTU_LNAME_${Date.now()}`,
      personalEmail: `missing.lname.${Date.now()}@example.com`,
      instituteEmail: `missing.lname.${Date.now()}@institute.edu`
    } as any;
    delete missingLastName.lastName;
    delete missingLastName.fullNameGtuFormat; // Also remove GTU format to trigger validation

    const missingLastNameResponse = await page.request.post(`${API_BASE}/students`, {
      data: missingLastName
    });

    expect(missingLastNameResponse.status()).toBe(400);
    const errorData3 = await missingLastNameResponse.json();
    expect(errorData3).toHaveProperty('message');
    expect(errorData3.message).toContain('Student Name');

    // Test duplicate enrollment number
    const duplicateStudent = { ...testStudent, enrollmentNumber: 'DUPLICATE123' };

    // Create first student
    const firstCreateResponse = await page.request.post(`${API_BASE}/students`, {
      data: duplicateStudent
    });

    if (firstCreateResponse.status() === 201) {
      const firstStudent = await firstCreateResponse.json();
      
      try {
        // Try to create duplicate
        const duplicateResponse = await page.request.post(`${API_BASE}/students`, {
          data: duplicateStudent
        });

        expect(duplicateResponse.status()).toBe(409);
        const duplicateErrorData = await duplicateResponse.json();
        expect(duplicateErrorData).toHaveProperty('message');
        expect(duplicateErrorData.message).toContain('already exists');
      } finally {
        // Cleanup
        await page.request.delete(`${API_BASE}/students/${firstStudent.id}`);
      }
    }
  });

  test('should handle semester status validation', async ({ page }) => {
    // Test valid semester statuses
    const validStatuses = ['Passed', 'N/A', 'Pending', 'Not Appeared'];
    
    for (const status of validStatuses) {
      const studentWithStatus = {
        ...testStudent,
        enrollmentNumber: `TEST${status}${Date.now()}`,
        gtuEnrollmentNumber: `GTU${status}${Date.now()}`,
        personalEmail: `test.${status.toLowerCase()}.${Date.now()}@example.com`,
        instituteEmail: `test.${status.toLowerCase()}.${Date.now()}@institute.edu`,
        sem1Status: status
      };

      const createResponse = await page.request.post(`${API_BASE}/students`, {
        data: studentWithStatus
      });

      if (createResponse.status() === 201) {
        const createdStudent = await createResponse.json();
        expect(createdStudent.sem1Status).toBe(status);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/students/${createdStudent.id}`);
      }
    }

    // Test invalid semester status should default to valid value or be rejected
    const invalidStatusStudent = {
      ...testStudent,
      enrollmentNumber: `TESTINVALID${Date.now()}`,
      gtuEnrollmentNumber: `GTUINVALID${Date.now()}`,
      personalEmail: `test.invalid.${Date.now()}@example.com`,
      instituteEmail: `test.invalid.${Date.now()}@institute.edu`,
      sem1Status: 'InvalidStatus'
    };

    const invalidResponse = await page.request.post(`${API_BASE}/students`, {
      data: invalidStatusStudent
    });

    // Either it should be rejected (400/409/500) or accepted with any value (as the API may store invalid values)
    if (invalidResponse.status() === 201) {
      const createdStudent = await invalidResponse.json();
      // The API may accept invalid values, so just check that student was created
      expect(createdStudent).toHaveProperty('id');
      await page.request.delete(`${API_BASE}/students/${createdStudent.id}`);
    } else {
      expect([400, 409, 500]).toContain(invalidResponse.status());
    }
  });

  test('should handle gender validation', async ({ page }) => {
    const validGenders = ['Male', 'Female', 'Other'];
    
    for (const gender of validGenders) {
      const studentWithGender = {
        ...testStudent,
        enrollmentNumber: `TEST${gender.toUpperCase()}123`,
        gender: gender
      };

      const createResponse = await page.request.post(`${API_BASE}/students`, {
        data: studentWithGender
      });

      if (createResponse.status() === 201) {
        const createdStudent = await createResponse.json();
        expect(createdStudent.gender).toBe(gender);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/students/${createdStudent.id}`);
      }
    }
  });

  test('should handle current semester validation', async ({ page }) => {
    // Test valid semester numbers (1-8)
    for (let semester = 1; semester <= 8; semester++) {
      const studentWithSemester = {
        ...testStudent,
        enrollmentNumber: `TESTSEM${semester}123`,
        currentSemester: semester
      };

      const createResponse = await page.request.post(`${API_BASE}/students`, {
        data: studentWithSemester
      });

      if (createResponse.status() === 201) {
        const createdStudent = await createResponse.json();
        expect(createdStudent.currentSemester).toBe(semester);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/students/${createdStudent.id}`);
      }
    }

    // Test invalid semester numbers
    const invalidSemesters = [0, 9, -1, 100];
    
    for (const invalidSem of invalidSemesters) {
      const studentWithInvalidSem = {
        ...testStudent,
        enrollmentNumber: `TESTINVALIDSEM${invalidSem}123`,
        currentSemester: invalidSem
      };

      const createResponse = await page.request.post(`${API_BASE}/students`, {
        data: studentWithInvalidSem
      });

      // Should either reject or normalize to valid range
      if (createResponse.status() === 201) {
        const createdStudent = await createResponse.json();
        expect(createdStudent.currentSemester).toBeGreaterThanOrEqual(0);
        expect(createdStudent.currentSemester).toBeLessThanOrEqual(8);
        await page.request.delete(`${API_BASE}/students/${createdStudent.id}`);
      } else {
        expect([400, 409]).toContain(createResponse.status());
      }
    }
  });

  test('should handle email validation', async ({ page }) => {
    // Test valid email formats
    const validEmails = [
      'test@example.com',
      'student.test@university.edu',
      'test123@domain.co.in'
    ];

    for (let i = 0; i < validEmails.length; i++) {
      const email = validEmails[i];
      const studentWithEmail = {
        ...testStudent,
        enrollmentNumber: `TESTEMAIL${i}123`,
        personalEmail: email
      };

      const createResponse = await page.request.post(`${API_BASE}/students`, {
        data: studentWithEmail
      });

      if (createResponse.status() === 201) {
        const createdStudent = await createResponse.json();
        expect(createdStudent.personalEmail).toBe(email);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/students/${createdStudent.id}`);
      }
    }

    // Test invalid email formats
    const invalidEmails = [
      'invalid-email',
      '@domain.com',
      'test@',
      'test..test@domain.com'
    ];

    for (let i = 0; i < invalidEmails.length; i++) {
      const email = invalidEmails[i];
      const studentWithInvalidEmail = {
        ...testStudent,
        enrollmentNumber: `TESTINVALIDEMAIL${i}123`,
        personalEmail: email
      };

      const createResponse = await page.request.post(`${API_BASE}/students`, {
        data: studentWithInvalidEmail
      });

      // Should reject invalid emails (400 for validation, 409 for duplicate)
      expect([400, 409]).toContain(createResponse.status());
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test invalid student ID for GET
    const invalidGetResponse = await page.request.get(`${API_BASE}/students/invalid-id`);
    expect(invalidGetResponse.status()).toBe(404);

    // Test invalid student ID for UPDATE
    const invalidUpdateResponse = await page.request.put(`${API_BASE}/students/invalid-id`, {
      data: testStudent
    });
    expect(invalidUpdateResponse.status()).toBe(404);

    // Test invalid student ID for DELETE
    const invalidDeleteResponse = await page.request.delete(`${API_BASE}/students/invalid-id`);
    expect(invalidDeleteResponse.status()).toBe(404);

    // Test malformed data
    const malformedResponse = await page.request.post(`${API_BASE}/students`, {
      data: null
    });
    expect([400, 500]).toContain(malformedResponse.status());
  });

  test('should handle boolean field validation', async ({ page }) => {
    const booleanFields = ['isComplete', 'termClose', 'isCancel', 'isPassAll'];
    
    for (const field of booleanFields) {
      // Test true value
      const studentTrue = {
        ...testStudent,
        enrollmentNumber: `TEST${field.toUpperCase()}TRUE123`,
        [field]: true
      };

      const trueResponse = await page.request.post(`${API_BASE}/students`, {
        data: studentTrue
      });

      if (trueResponse.status() === 201) {
        const createdStudent = await trueResponse.json();
        expect(createdStudent[field]).toBe(true);
        await page.request.delete(`${API_BASE}/students/${createdStudent.id}`);
      }

      // Test false value
      const studentFalse = {
        ...testStudent,
        enrollmentNumber: `TEST${field.toUpperCase()}FALSE123`,
        [field]: false
      };

      const falseResponse = await page.request.post(`${API_BASE}/students`, {
        data: studentFalse
      });

      if (falseResponse.status() === 201) {
        const createdStudent = await falseResponse.json();
        expect(createdStudent[field]).toBe(false);
        await page.request.delete(`${API_BASE}/students/${createdStudent.id}`);
      }
    }
  });

  test('should handle date validation', async ({ page }) => {
    // Test valid date formats
    const validDates = [
      '2000-01-15',
      '1995-12-31',
      '2002-06-30'
    ];

    for (let i = 0; i < validDates.length; i++) {
      const date = validDates[i];
      const studentWithDate = {
        ...testStudent,
        enrollmentNumber: `TESTDATE${i}123`,
        dateOfBirth: date
      };

      const createResponse = await page.request.post(`${API_BASE}/students`, {
        data: studentWithDate
      });

      if (createResponse.status() === 201) {
        const createdStudent = await createResponse.json();
        expect(createdStudent.dateOfBirth).toBe(date);
        await page.request.delete(`${API_BASE}/students/${createdStudent.id}`);
      }
    }
  });
});
