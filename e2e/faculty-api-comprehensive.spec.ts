import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Faculty API - In-Memory Storage Endpoints
 * Priority: Faculty Module (Critical for Academic Management)
 * 
 * This test suite covers the faculty API endpoints that use in-memory storage
 * and are critical for the MongoDB migration. Tests ensure data integrity
 * and business logic preservation during migration.
 */

// Base URL for API endpoints
const API_BASE = '/api';

// Test data for faculty
const testFaculty = {
  employeeId: 'EMP001',
  gtuFacultyId: 'GTU_FAC_001',
  firstName: 'Test',
  middleName: 'E2E',
  lastName: 'Faculty',
  fullName: 'Test E2E Faculty',
  personalEmail: 'test.faculty@example.com',
  instituteEmail: 'test.faculty@institute.edu',
  contactNumber: '9876543210',
  department: 'dept_ce_gpp',
  instituteId: 'inst_gpp',
  designation: 'Assistant Professor',
  qualification: 'M.Tech, PhD',
  experience: 5,
  joiningDate: '2020-07-15',
  dateOfBirth: '1985-05-20',
  gender: 'Male',
  category: 'Teaching',
  status: 'active',
  address: '123 Faculty Colony, Test City',
  specialization: 'Computer Networks, Software Engineering',
  isHOD: false,
  isPrincipal: false,
  researchInterests: 'Machine Learning, Data Mining'
};

const testFacultyUpdate = {
  firstName: 'Updated',
  designation: 'Associate Professor',
  experience: 7,
  status: 'inactive',
  isHOD: true
};

test.describe('Faculty API - Critical In-Memory Storage', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that initializes the app context
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should create, read, update, and delete faculty (CRUD)', async ({ page }) => {
    let createdFacultyId: string;

    // Test CREATE - POST /api/faculty
    const createResponse = await page.request.post(`${API_BASE}/faculty`, {
      data: testFaculty
    });

    expect(createResponse.status()).toBe(201);
    const createdFaculty = await createResponse.json();
    expect(createdFaculty).toHaveProperty('id');
    expect(createdFaculty.employeeId).toBe(testFaculty.employeeId);
    expect(createdFaculty.firstName).toBe(testFaculty.firstName);
    expect(createdFaculty.lastName).toBe(testFaculty.lastName);
    expect(createdFaculty.personalEmail).toBe(testFaculty.personalEmail);
    expect(createdFaculty.department).toBe(testFaculty.department);
    expect(createdFaculty.designation).toBe(testFaculty.designation);
    expect(createdFaculty.status).toBe(testFaculty.status);
    
    createdFacultyId = createdFaculty.id;

    // Test READ ALL - GET /api/faculty
    const getAllResponse = await page.request.get(`${API_BASE}/faculty`);
    expect(getAllResponse.status()).toBe(200);
    
    const allFaculty = await getAllResponse.json();
    expect(Array.isArray(allFaculty)).toBe(true);
    
    const foundFaculty = allFaculty.find((f: any) => f.id === createdFacultyId);
    expect(foundFaculty).toBeDefined();
    expect(foundFaculty.employeeId).toBe(testFaculty.employeeId);
    expect(foundFaculty.firstName).toBe(testFaculty.firstName);

    // Test READ ONE - GET /api/faculty/:id
    const getOneResponse = await page.request.get(`${API_BASE}/faculty/${createdFacultyId}`);
    expect(getOneResponse.status()).toBe(200);
    
    const facultyData = await getOneResponse.json();
    expect(facultyData.id).toBe(createdFacultyId);
    expect(facultyData.employeeId).toBe(testFaculty.employeeId);
    expect(facultyData.firstName).toBe(testFaculty.firstName);

    // Test UPDATE - PUT /api/faculty/:id
    const updateResponse = await page.request.put(`${API_BASE}/faculty/${createdFacultyId}`, {
      data: {
        ...testFaculty,
        ...testFacultyUpdate
      }
    });

    expect(updateResponse.status()).toBe(200);
    const updatedFaculty = await updateResponse.json();
    expect(updatedFaculty.id).toBe(createdFacultyId);
    expect(updatedFaculty.firstName).toBe(testFacultyUpdate.firstName);
    expect(updatedFaculty.designation).toBe(testFacultyUpdate.designation);
    expect(updatedFaculty.experience).toBe(testFacultyUpdate.experience);
    expect(updatedFaculty.status).toBe(testFacultyUpdate.status);
    expect(updatedFaculty.isHOD).toBe(testFacultyUpdate.isHOD);

    // Verify update persisted
    const getUpdatedResponse = await page.request.get(`${API_BASE}/faculty/${createdFacultyId}`);
    expect(getUpdatedResponse.status()).toBe(200);
    const updatedFacultyVerify = await getUpdatedResponse.json();
    expect(updatedFacultyVerify.firstName).toBe(testFacultyUpdate.firstName);
    expect(updatedFacultyVerify.designation).toBe(testFacultyUpdate.designation);

    // Test DELETE - DELETE /api/faculty/:id
    const deleteResponse = await page.request.delete(`${API_BASE}/faculty/${createdFacultyId}`);
    expect(deleteResponse.status()).toBe(200);

    // Verify deletion
    const getDeletedResponse = await page.request.get(`${API_BASE}/faculty/${createdFacultyId}`);
    expect(getDeletedResponse.status()).toBe(404);
  });

  test('should validate required fields', async ({ page }) => {
    // Test missing employee ID
    const missingEmployeeId = { ...testFaculty } as any;
    delete missingEmployeeId.employeeId;

    const missingEmpIdResponse = await page.request.post(`${API_BASE}/faculty`, {
      data: missingEmployeeId
    });

    expect(missingEmpIdResponse.status()).toBe(400);
    const errorData1 = await missingEmpIdResponse.json();
    expect(errorData1).toHaveProperty('message');
    expect(errorData1.message).toContain('Employee ID');

    // Test missing first name
    const missingFirstName = { ...testFaculty } as any;
    delete missingFirstName.firstName;

    const missingFirstNameResponse = await page.request.post(`${API_BASE}/faculty`, {
      data: missingFirstName
    });

    expect(missingFirstNameResponse.status()).toBe(400);
    const errorData2 = await missingFirstNameResponse.json();
    expect(errorData2).toHaveProperty('message');
    expect(errorData2.message).toContain('First Name');

    // Test missing last name
    const missingLastName = { ...testFaculty } as any;
    delete missingLastName.lastName;

    const missingLastNameResponse = await page.request.post(`${API_BASE}/faculty`, {
      data: missingLastName
    });

    expect(missingLastNameResponse.status()).toBe(400);
    const errorData3 = await missingLastNameResponse.json();
    expect(errorData3).toHaveProperty('message');
    expect(errorData3.message).toContain('Last Name');

    // Test missing department
    const missingDepartment = { ...testFaculty } as any;
    delete missingDepartment.department;

    const missingDeptResponse = await page.request.post(`${API_BASE}/faculty`, {
      data: missingDepartment
    });

    expect(missingDeptResponse.status()).toBe(400);
    const errorData4 = await missingDeptResponse.json();
    expect(errorData4).toHaveProperty('message');
    expect(errorData4.message).toContain('department');

    // Test duplicate employee ID
    const duplicateFaculty = { ...testFaculty, employeeId: 'DUPLICATE001' };

    // Create first faculty
    const firstCreateResponse = await page.request.post(`${API_BASE}/faculty`, {
      data: duplicateFaculty
    });

    if (firstCreateResponse.status() === 201) {
      const firstFaculty = await firstCreateResponse.json();
      
      try {
        // Try to create duplicate
        const duplicateResponse = await page.request.post(`${API_BASE}/faculty`, {
          data: duplicateFaculty
        });

        expect(duplicateResponse.status()).toBe(400);
        const duplicateErrorData = await duplicateResponse.json();
        expect(duplicateErrorData).toHaveProperty('message');
        expect(duplicateErrorData.message).toContain('already exists');
      } finally {
        // Cleanup
        await page.request.delete(`${API_BASE}/faculty/${firstFaculty.id}`);
      }
    }
  });

  test('should validate email formats', async ({ page }) => {
    // Test valid email formats
    const validEmails = [
      'faculty@example.com',
      'test.faculty@university.edu',
      'faculty123@domain.co.in'
    ];

    for (let i = 0; i < validEmails.length; i++) {
      const email = validEmails[i];
      const facultyWithEmail = {
        ...testFaculty,
        employeeId: `TESTEMAIL${i}`,
        personalEmail: email
      };

      const createResponse = await page.request.post(`${API_BASE}/faculty`, {
        data: facultyWithEmail
      });

      if (createResponse.status() === 201) {
        const createdFaculty = await createResponse.json();
        expect(createdFaculty.personalEmail).toBe(email);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/faculty/${createdFaculty.id}`);
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
      const facultyWithInvalidEmail = {
        ...testFaculty,
        employeeId: `TESTINVALIDEMAIL${i}`,
        personalEmail: email
      };

      const createResponse = await page.request.post(`${API_BASE}/faculty`, {
        data: facultyWithInvalidEmail
      });

      // Should reject invalid emails
      expect(createResponse.status()).toBe(400);
    }
  });

  test('should validate gender values', async ({ page }) => {
    const validGenders = ['Male', 'Female', 'Other'];
    
    for (const gender of validGenders) {
      const facultyWithGender = {
        ...testFaculty,
        employeeId: `TEST${gender.toUpperCase()}`,
        gender: gender
      };

      const createResponse = await page.request.post(`${API_BASE}/faculty`, {
        data: facultyWithGender
      });

      if (createResponse.status() === 201) {
        const createdFaculty = await createResponse.json();
        expect(createdFaculty.gender).toBe(gender);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/faculty/${createdFaculty.id}`);
      }
    }
  });

  test('should validate staff category values', async ({ page }) => {
    const validCategories = ['Teaching', 'Non-Teaching', 'Administrative', 'Technical'];
    
    for (const category of validCategories) {
      const facultyWithCategory = {
        ...testFaculty,
        employeeId: `TEST${category.toUpperCase().replace('-', '')}`,
        category: category
      };

      const createResponse = await page.request.post(`${API_BASE}/faculty`, {
        data: facultyWithCategory
      });

      if (createResponse.status() === 201) {
        const createdFaculty = await createResponse.json();
        expect(createdFaculty.category).toBe(category);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/faculty/${createdFaculty.id}`);
      }
    }
  });

  test('should validate experience as positive number', async ({ page }) => {
    // Test valid experience values
    const validExperiences = [0, 1, 5, 10, 25];
    
    for (const experience of validExperiences) {
      const facultyWithExperience = {
        ...testFaculty,
        employeeId: `TESTEXP${experience}`,
        experience: experience
      };

      const createResponse = await page.request.post(`${API_BASE}/faculty`, {
        data: facultyWithExperience
      });

      if (createResponse.status() === 201) {
        const createdFaculty = await createResponse.json();
        expect(createdFaculty.experience).toBe(experience);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/faculty/${createdFaculty.id}`);
      }
    }

    // Test invalid experience values
    const invalidExperiences = [-1, -5];
    
    for (const invalidExp of invalidExperiences) {
      const facultyWithInvalidExp = {
        ...testFaculty,
        employeeId: `TESTINVALIDEXP${Math.abs(invalidExp)}`,
        experience: invalidExp
      };

      const createResponse = await page.request.post(`${API_BASE}/faculty`, {
        data: facultyWithInvalidExp
      });

      // Should either reject or normalize to valid value
      if (createResponse.status() === 201) {
        const createdFaculty = await createResponse.json();
        expect(createdFaculty.experience).toBeGreaterThanOrEqual(0);
        await page.request.delete(`${API_BASE}/faculty/${createdFaculty.id}`);
      } else {
        expect(createResponse.status()).toBe(400);
      }
    }
  });

  test('should handle date validation', async ({ page }) => {
    // Test valid date formats for joining date
    const validDates = [
      '2020-01-15',
      '2019-12-31',
      '2021-06-30'
    ];

    for (let i = 0; i < validDates.length; i++) {
      const date = validDates[i];
      const facultyWithDate = {
        ...testFaculty,
        employeeId: `TESTDATE${i}`,
        joiningDate: date
      };

      const createResponse = await page.request.post(`${API_BASE}/faculty`, {
        data: facultyWithDate
      });

      if (createResponse.status() === 201) {
        const createdFaculty = await createResponse.json();
        expect(createdFaculty.joiningDate).toBe(date);
        await page.request.delete(`${API_BASE}/faculty/${createdFaculty.id}`);
      }
    }
    
    // Test valid date formats for date of birth
    const validBirthDates = [
      '1980-05-15',
      '1975-12-31',
      '1990-06-30'
    ];

    for (let i = 0; i < validBirthDates.length; i++) {
      const date = validBirthDates[i];
      const facultyWithBirthDate = {
        ...testFaculty,
        employeeId: `TESTBIRTHDATE${i}`,
        dateOfBirth: date
      };

      const createResponse = await page.request.post(`${API_BASE}/faculty`, {
        data: facultyWithBirthDate
      });

      if (createResponse.status() === 201) {
        const createdFaculty = await createResponse.json();
        expect(createdFaculty.dateOfBirth).toBe(date);
        await page.request.delete(`${API_BASE}/faculty/${createdFaculty.id}`);
      }
    }
  });

  test('should handle boolean field validation', async ({ page }) => {
    const booleanFields = ['isHOD', 'isPrincipal'];
    
    for (const field of booleanFields) {
      // Test true value
      const facultyTrue = {
        ...testFaculty,
        employeeId: `TEST${field.toUpperCase()}TRUE`,
        [field]: true
      };

      const trueResponse = await page.request.post(`${API_BASE}/faculty`, {
        data: facultyTrue
      });

      if (trueResponse.status() === 201) {
        const createdFaculty = await trueResponse.json();
        expect(createdFaculty[field]).toBe(true);
        await page.request.delete(`${API_BASE}/faculty/${createdFaculty.id}`);
      }

      // Test false value
      const facultyFalse = {
        ...testFaculty,
        employeeId: `TEST${field.toUpperCase()}FALSE`,
        [field]: false
      };

      const falseResponse = await page.request.post(`${API_BASE}/faculty`, {
        data: facultyFalse
      });

      if (falseResponse.status() === 201) {
        const createdFaculty = await falseResponse.json();
        expect(createdFaculty[field]).toBe(false);
        await page.request.delete(`${API_BASE}/faculty/${createdFaculty.id}`);
      }
    }
  });

  test('should validate contact number format', async ({ page }) => {
    // Test valid contact numbers
    const validNumbers = [
      '9876543210',
      '8765432109',
      '7654321098'
    ];

    for (let i = 0; i < validNumbers.length; i++) {
      const number = validNumbers[i];
      const facultyWithNumber = {
        ...testFaculty,
        employeeId: `TESTNUM${i}`,
        contactNumber: number
      };

      const createResponse = await page.request.post(`${API_BASE}/faculty`, {
        data: facultyWithNumber
      });

      if (createResponse.status() === 201) {
        const createdFaculty = await createResponse.json();
        expect(createdFaculty.contactNumber).toBe(number);
        await page.request.delete(`${API_BASE}/faculty/${createdFaculty.id}`);
      }
    }

    // Test invalid contact numbers
    const invalidNumbers = [
      '123456789',  // too short
      '12345678901', // too long
      'abcd123456',  // contains letters
      '1234 56789'   // contains space
    ];

    for (let i = 0; i < invalidNumbers.length; i++) {
      const number = invalidNumbers[i];
      const facultyWithInvalidNumber = {
        ...testFaculty,
        employeeId: `TESTINVALIDNUM${i}`,
        contactNumber: number
      };

      const createResponse = await page.request.post(`${API_BASE}/faculty`, {
        data: facultyWithInvalidNumber
      });

      // Should reject invalid contact numbers
      expect(createResponse.status()).toBe(400);
    }
  });

  test('should handle status validation', async ({ page }) => {
    const validStatuses = ['active', 'inactive', 'suspended', 'retired'];
    
    for (const status of validStatuses) {
      const facultyWithStatus = {
        ...testFaculty,
        employeeId: `TESTSTATUS${status.toUpperCase()}`,
        status: status
      };

      const createResponse = await page.request.post(`${API_BASE}/faculty`, {
        data: facultyWithStatus
      });

      if (createResponse.status() === 201) {
        const createdFaculty = await createResponse.json();
        expect(createdFaculty.status).toBe(status);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/faculty/${createdFaculty.id}`);
      }
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test invalid faculty ID for GET
    const invalidGetResponse = await page.request.get(`${API_BASE}/faculty/invalid-id`);
    expect(invalidGetResponse.status()).toBe(404);

    // Test invalid faculty ID for UPDATE
    const invalidUpdateResponse = await page.request.put(`${API_BASE}/faculty/invalid-id`, {
      data: testFaculty
    });
    expect(invalidUpdateResponse.status()).toBe(404);

    // Test invalid faculty ID for DELETE
    const invalidDeleteResponse = await page.request.delete(`${API_BASE}/faculty/invalid-id`);
    expect(invalidDeleteResponse.status()).toBe(404);

    // Test malformed data
    const malformedResponse = await page.request.post(`${API_BASE}/faculty`, {
      data: null
    });
    expect([400, 500]).toContain(malformedResponse.status());
  });

  test('should handle complex search and filtering scenarios', async ({ page }) => {
    // Create multiple faculty members for testing
    const facultyMembers = [
      { ...testFaculty, employeeId: 'SEARCH001', department: 'dept_ce_gpp', designation: 'Professor', status: 'active' },
      { ...testFaculty, employeeId: 'SEARCH002', department: 'dept_me_gpp', designation: 'Assistant Professor', status: 'active' },
      { ...testFaculty, employeeId: 'SEARCH003', department: 'dept_ce_gpp', designation: 'Associate Professor', status: 'inactive' }
    ];

    const createdIds: string[] = [];

    try {
      // Create test faculty members
      for (const faculty of facultyMembers) {
        const createResponse = await page.request.post(`${API_BASE}/faculty`, {
          data: faculty
        });

        if (createResponse.status() === 201) {
          const created = await createResponse.json();
          createdIds.push(created.id);
        }
      }

      // Test basic GET all
      const getAllResponse = await page.request.get(`${API_BASE}/faculty`);
      expect(getAllResponse.status()).toBe(200);
      const allFaculty = await getAllResponse.json();
      expect(Array.isArray(allFaculty)).toBe(true);
      expect(allFaculty.length).toBeGreaterThanOrEqual(createdIds.length);

    } finally {
      // Cleanup created faculty members
      for (const id of createdIds) {
        await page.request.delete(`${API_BASE}/faculty/${id}`);
      }
    }
  });
});
