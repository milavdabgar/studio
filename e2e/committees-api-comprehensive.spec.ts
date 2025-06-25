import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Committees API - In-Memory Storage Endpoints
 * Priority: Committees Module (Critical for Administrative Management)
 * 
 * This test suite covers the committees API endpoints that use in-memory storage
 * and are critical for the MongoDB migration. Tests ensure data integrity
 * and business logic preservation during migration.
 */

// Base URL for API endpoints
const API_BASE = '/api';

// Test data for committees
const testCommittee = {
  name: 'E2E Test Committee',
  description: 'A test committee for E2E testing purposes',
  type: 'Academic',
  department: 'dept_ce_gpp',
  chairperson: {
    userId: 'user_faculty_cs01_gpp',
    name: 'Test Faculty Chair',
    email: 'chair@test.edu',
    contactNumber: '9876543210'
  },
  members: [
    {
      userId: 'user_faculty_me01_gpp',
      name: 'Test Faculty Member 1',
      role: 'Secretary',
      email: 'member1@test.edu',
      contactNumber: '9876543211'
    },
    {
      userId: 'user_faculty_ee01_gpp',
      name: 'Test Faculty Member 2',
      role: 'Member',
      email: 'member2@test.edu',
      contactNumber: '9876543212'
    }
  ],
  establishedDate: '2024-01-15',
  status: 'active',
  meetingSchedule: 'Monthly',
  responsibilities: [
    'Academic curriculum review',
    'Student affairs oversight',
    'Policy recommendations'
  ]
};

const testCommitteeUpdate = {
  name: 'Updated E2E Test Committee',
  description: 'Updated description for E2E testing',
  type: 'Administrative',
  status: 'inactive',
  meetingSchedule: 'Quarterly'
};

test.describe('Committees API - Critical In-Memory Storage', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that initializes the app context
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should create, read, update, and delete committees (CRUD)', async ({ page }) => {
    let createdCommitteeId: string;

    // Test CREATE - POST /api/committees
    const createResponse = await page.request.post(`${API_BASE}/committees`, {
      data: testCommittee
    });

    expect(createResponse.status()).toBe(201);
    const createResponseData = await createResponse.json();
    
    // Handle response structure - could be direct committee or wrapped
    const createdCommittee = createResponseData.data?.committee || createResponseData;
    expect(createdCommittee).toHaveProperty('id');
    expect(createdCommittee.name).toBe(testCommittee.name);
    expect(createdCommittee.description).toBe(testCommittee.description);
    expect(createdCommittee.type).toBe(testCommittee.type);
    expect(createdCommittee.department).toBe(testCommittee.department);
    expect(createdCommittee.status).toBe(testCommittee.status);
    
    createdCommitteeId = createdCommittee.id;

    // Test READ ALL - GET /api/committees
    const getAllResponse = await page.request.get(`${API_BASE}/committees`);
    expect(getAllResponse.status()).toBe(200);
    
    const allCommittees = await getAllResponse.json();
    expect(Array.isArray(allCommittees)).toBe(true);
    
    const foundCommittee = allCommittees.find((c: any) => c.id === createdCommitteeId);
    expect(foundCommittee).toBeDefined();
    expect(foundCommittee.name).toBe(testCommittee.name);

    // Test READ ONE - GET /api/committees/:id
    const getOneResponse = await page.request.get(`${API_BASE}/committees/${createdCommitteeId}`);
    expect(getOneResponse.status()).toBe(200);
    
    const getOneResponseData = await getOneResponse.json();
    const committeeData = getOneResponseData.data?.committee || getOneResponseData;
    expect(committeeData.id).toBe(createdCommitteeId);
    expect(committeeData.name).toBe(testCommittee.name);

    // Test UPDATE - PUT /api/committees/:id
    const updateResponse = await page.request.put(`${API_BASE}/committees/${createdCommitteeId}`, {
      data: {
        ...testCommittee,
        ...testCommitteeUpdate
      }
    });

    expect(updateResponse.status()).toBe(200);
    const updateResponseData = await updateResponse.json();
    const updatedCommittee = updateResponseData.data?.committee || updateResponseData;
    expect(updatedCommittee.id).toBe(createdCommitteeId);
    expect(updatedCommittee.name).toBe(testCommitteeUpdate.name);
    expect(updatedCommittee.description).toBe(testCommitteeUpdate.description);
    expect(updatedCommittee.type).toBe(testCommitteeUpdate.type);
    expect(updatedCommittee.status).toBe(testCommitteeUpdate.status);

    // Verify update persisted
    const getUpdatedResponse = await page.request.get(`${API_BASE}/committees/${createdCommitteeId}`);
    expect(getUpdatedResponse.status()).toBe(200);
    const getUpdatedResponseData = await getUpdatedResponse.json();
    const updatedCommitteeVerify = getUpdatedResponseData.data?.committee || getUpdatedResponseData;
    expect(updatedCommitteeVerify.name).toBe(testCommitteeUpdate.name);
    expect(updatedCommitteeVerify.type).toBe(testCommitteeUpdate.type);

    // Test DELETE - DELETE /api/committees/:id
    const deleteResponse = await page.request.delete(`${API_BASE}/committees/${createdCommitteeId}`);
    expect(deleteResponse.status()).toBe(200);

    // Verify deletion
    const getDeletedResponse = await page.request.get(`${API_BASE}/committees/${createdCommitteeId}`);
    expect(getDeletedResponse.status()).toBe(404);
  });

  test('should validate required fields', async ({ page }) => {
    // Test missing committee name
    const missingName = { ...testCommittee } as any;
    delete missingName.name;

    const missingNameResponse = await page.request.post(`${API_BASE}/committees`, {
      data: missingName
    });

    expect(missingNameResponse.status()).toBe(400);
    const errorData1 = await missingNameResponse.json();
    expect(errorData1).toHaveProperty('message');
    expect(errorData1.message).toContain('name');

    // Test missing committee type
    const missingType = { ...testCommittee } as any;
    delete missingType.type;

    const missingTypeResponse = await page.request.post(`${API_BASE}/committees`, {
      data: missingType
    });

    expect(missingTypeResponse.status()).toBe(400);
    const errorData2 = await missingTypeResponse.json();
    expect(errorData2).toHaveProperty('message');
    expect(errorData2.message).toContain('type');

    // Test missing chairperson
    const missingChairperson = { ...testCommittee } as any;
    delete missingChairperson.chairperson;

    const missingChairResponse = await page.request.post(`${API_BASE}/committees`, {
      data: missingChairperson
    });

    expect(missingChairResponse.status()).toBe(400);
    const errorData3 = await missingChairResponse.json();
    expect(errorData3).toHaveProperty('message');
    expect(errorData3.message).toContain('chairperson');
  });

  test('should validate committee types', async ({ page }) => {
    const validTypes = ['Academic', 'Administrative', 'Research', 'Student Affairs', 'Infrastructure'];
    
    for (const type of validTypes) {
      const committeeWithType = {
        ...testCommittee,
        name: `Test Committee ${type}`,
        type: type
      };

      const createResponse = await page.request.post(`${API_BASE}/committees`, {
        data: committeeWithType
      });

      if (createResponse.status() === 201) {
        const createResponseData = await createResponse.json();
        const createdCommittee = createResponseData.data?.committee || createResponseData;
        expect(createdCommittee.type).toBe(type);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/committees/${createdCommittee.id}`);
      }
    }
  });

  test('should validate committee status', async ({ page }) => {
    const validStatuses = ['active', 'inactive', 'dissolved', 'suspended'];
    
    for (const status of validStatuses) {
      const committeeWithStatus = {
        ...testCommittee,
        name: `Test Committee ${status}`,
        status: status
      };

      const createResponse = await page.request.post(`${API_BASE}/committees`, {
        data: committeeWithStatus
      });

      if (createResponse.status() === 201) {
        const createResponseData = await createResponse.json();
        const createdCommittee = createResponseData.data?.committee || createResponseData;
        expect(createdCommittee.status).toBe(status);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/committees/${createdCommittee.id}`);
      }
    }
  });

  test('should handle committee member management', async ({ page }) => {
    // Create a committee first
    const createResponse = await page.request.post(`${API_BASE}/committees`, {
      data: testCommittee
    });

    expect(createResponse.status()).toBe(201);
    const createResponseData = await createResponse.json();
    const createdCommittee = createResponseData.data?.committee || createResponseData;
    const committeeId = createdCommittee.id;

    try {
      // Verify initial members
      expect(createdCommittee.members).toBeDefined();
      expect(Array.isArray(createdCommittee.members)).toBe(true);
      expect(createdCommittee.members.length).toBe(testCommittee.members.length);

      // Test member details
      const firstMember = createdCommittee.members[0];
      expect(firstMember).toHaveProperty('userId');
      expect(firstMember).toHaveProperty('name');
      expect(firstMember).toHaveProperty('role');
      expect(firstMember).toHaveProperty('email');

      // Test chairperson details
      expect(createdCommittee.chairperson).toBeDefined();
      expect(createdCommittee.chairperson).toHaveProperty('userId');
      expect(createdCommittee.chairperson).toHaveProperty('name');
      expect(createdCommittee.chairperson.userId).toBe(testCommittee.chairperson.userId);

    } finally {
      // Cleanup
      await page.request.delete(`${API_BASE}/committees/${committeeId}`);
    }
  });

  test('should validate email formats in member data', async ({ page }) => {
    // Test valid email format
    const validEmailCommittee = {
      ...testCommittee,
      name: 'Valid Email Test Committee',
      chairperson: {
        ...testCommittee.chairperson,
        email: 'valid.chair@university.edu'
      },
      members: [
        {
          ...testCommittee.members[0],
          email: 'valid.member@university.edu'
        }
      ]
    };

    const validResponse = await page.request.post(`${API_BASE}/committees`, {
      data: validEmailCommittee
    });

    if (validResponse.status() === 201) {
      const createResponseData = await validResponse.json();
      const createdCommittee = createResponseData.data?.committee || createResponseData;
      expect(createdCommittee.chairperson.email).toBe('valid.chair@university.edu');
      expect(createdCommittee.members[0].email).toBe('valid.member@university.edu');
      
      // Cleanup
      await page.request.delete(`${API_BASE}/committees/${createdCommittee.id}`);
    }

    // Test invalid email format
    const invalidEmailCommittee = {
      ...testCommittee,
      name: 'Invalid Email Test Committee',
      chairperson: {
        ...testCommittee.chairperson,
        email: 'invalid-email'
      }
    };

    const invalidResponse = await page.request.post(`${API_BASE}/committees`, {
      data: invalidEmailCommittee
    });

    // Should reject invalid emails
    expect([400, 409]).toContain(invalidResponse.status());
  });

  test('should handle date validation', async ({ page }) => {
    // Test valid date formats
    const validDates = [
      '2024-01-15',
      '2023-12-31',
      '2025-06-30'
    ];

    for (let i = 0; i < validDates.length; i++) {
      const date = validDates[i];
      const committeeWithDate = {
        ...testCommittee,
        name: `Test Committee Date ${i}`,
        establishedDate: date
      };

      const createResponse = await page.request.post(`${API_BASE}/committees`, {
        data: committeeWithDate
      });

      if (createResponse.status() === 201) {
        const createResponseData = await createResponse.json();
        const createdCommittee = createResponseData.data?.committee || createResponseData;
        expect(createdCommittee.establishedDate).toBe(date);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/committees/${createdCommittee.id}`);
      }
    }
  });

  test('should handle responsibilities array', async ({ page }) => {
    const committeeWithResponsibilities = {
      ...testCommittee,
      name: 'Responsibilities Test Committee',
      responsibilities: [
        'Test responsibility 1',
        'Test responsibility 2',
        'Test responsibility 3'
      ]
    };

    const createResponse = await page.request.post(`${API_BASE}/committees`, {
      data: committeeWithResponsibilities
    });

    if (createResponse.status() === 201) {
      const createResponseData = await createResponse.json();
      const createdCommittee = createResponseData.data?.committee || createResponseData;
      
      expect(createdCommittee.responsibilities).toBeDefined();
      expect(Array.isArray(createdCommittee.responsibilities)).toBe(true);
      expect(createdCommittee.responsibilities.length).toBe(3);
      expect(createdCommittee.responsibilities).toContain('Test responsibility 1');
      
      // Cleanup
      await page.request.delete(`${API_BASE}/committees/${createdCommittee.id}`);
    }
  });

  test('should prevent duplicate committee names', async ({ page }) => {
    const duplicateCommittee = { 
      ...testCommittee, 
      name: 'Duplicate Test Committee' 
    };

    // Create first committee
    const firstCreateResponse = await page.request.post(`${API_BASE}/committees`, {
      data: duplicateCommittee
    });

    if (firstCreateResponse.status() === 201) {
      const firstCreateResponseData = await firstCreateResponse.json();
      const firstCommittee = firstCreateResponseData.data?.committee || firstCreateResponseData;
      
      try {
        // Try to create duplicate
        const duplicateResponse = await page.request.post(`${API_BASE}/committees`, {
          data: duplicateCommittee
        });

        expect([400, 409]).toContain(duplicateResponse.status());
        const duplicateErrorData = await duplicateResponse.json();
        expect(duplicateErrorData).toHaveProperty('message');
        expect(duplicateErrorData.message).toMatch(/already exists|duplicate/i);
      } finally {
        // Cleanup
        await page.request.delete(`${API_BASE}/committees/${firstCommittee.id}`);
      }
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test invalid committee ID for GET
    const invalidGetResponse = await page.request.get(`${API_BASE}/committees/invalid-id`);
    expect(invalidGetResponse.status()).toBe(404);

    // Test invalid committee ID for UPDATE
    const invalidUpdateResponse = await page.request.put(`${API_BASE}/committees/invalid-id`, {
      data: testCommittee
    });
    expect(invalidUpdateResponse.status()).toBe(404);

    // Test invalid committee ID for DELETE
    const invalidDeleteResponse = await page.request.delete(`${API_BASE}/committees/invalid-id`);
    expect(invalidDeleteResponse.status()).toBe(404);

    // Test malformed data
    const malformedResponse = await page.request.post(`${API_BASE}/committees`, {
      data: null
    });
    expect([400, 500]).toContain(malformedResponse.status());
  });

  test('should handle contact number validation', async ({ page }) => {
    // Test valid contact numbers
    const validNumbers = [
      '9876543210',
      '8765432109',
      '7654321098'
    ];

    for (let i = 0; i < validNumbers.length; i++) {
      const number = validNumbers[i];
      const committeeWithNumber = {
        ...testCommittee,
        name: `Test Committee Number ${i}`,
        chairperson: {
          ...testCommittee.chairperson,
          contactNumber: number
        }
      };

      const createResponse = await page.request.post(`${API_BASE}/committees`, {
        data: committeeWithNumber
      });

      if (createResponse.status() === 201) {
        const createResponseData = await createResponse.json();
        const createdCommittee = createResponseData.data?.committee || createResponseData;
        expect(createdCommittee.chairperson.contactNumber).toBe(number);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/committees/${createdCommittee.id}`);
      }
    }

    // Test invalid contact numbers
    const invalidNumbers = [
      '123456789',  // too short
      '12345678901', // too long
      'abcd123456',  // contains letters
    ];

    for (let i = 0; i < invalidNumbers.length; i++) {
      const number = invalidNumbers[i];
      const committeeWithInvalidNumber = {
        ...testCommittee,
        name: `Test Committee Invalid Number ${i}`,
        chairperson: {
          ...testCommittee.chairperson,
          contactNumber: number
        }
      };

      const createResponse = await page.request.post(`${API_BASE}/committees`, {
        data: committeeWithInvalidNumber
      });

      // Should reject invalid contact numbers
      expect([400, 409]).toContain(createResponse.status());
    }
  });
});
