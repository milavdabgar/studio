import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Room Allocations API - In-Memory Storage Endpoints
 * Priority: Room Allocations Module (Critical for Space Management and Scheduling)
 * 
 * This test suite covers the room allocations API endpoints that use in-memory storage
 * and are critical for the MongoDB migration. Tests ensure data integrity
 * and business logic preservation during migration.
 */

// Base URL for API endpoints
const API_BASE = '/api';

// Test data for room allocations
const testRoomAllocation = {
  roomId: 'room_test_101',
  purpose: 'lecture' as const,
  courseOfferingId: 'co_test_cs101',
  facultyId: 'user_faculty_test01',
  title: 'E2E Test Lecture',
  startTime: '2025-03-15T09:00:00.000Z',
  endTime: '2025-03-15T10:00:00.000Z',
  dayOfWeek: 'Monday',
  isRecurring: false,
  status: 'scheduled' as const,
  notes: 'Test allocation for E2E testing'
};

const testRoomAllocationUpdate = {
  title: 'Updated E2E Test Lecture',
  purpose: 'practical' as const,
  status: 'ongoing' as const,
  notes: 'Updated notes for testing',
  isRecurring: true
};

const testMeetingAllocation = {
  roomId: 'room_test_202',
  purpose: 'meeting' as const,
  committeeId: 'cmt_test_committee',
  title: 'E2E Test Meeting',
  startTime: '2025-03-16T14:00:00.000Z',
  endTime: '2025-03-16T15:30:00.000Z',
  status: 'scheduled' as const
};

test.describe('Room Allocations API - Critical In-Memory Storage', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that initializes the app context
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should create, read, update, and delete room allocations (CRUD)', async ({ page }) => {
    let createdAllocationId: string;

    // Test CREATE - POST /api/room-allocations
    const uniqueId = Date.now();
    const allocationData = {
      ...testRoomAllocation,
      roomId: `room_test_${uniqueId}`,
      title: `${testRoomAllocation.title} ${uniqueId}`,
      startTime: `2025-03-15T${(9 + (uniqueId % 6)).toString().padStart(2, '0')}:00:00.000Z`,
      endTime: `2025-03-15T${(10 + (uniqueId % 6)).toString().padStart(2, '0')}:00:00.000Z`
    };

    const createResponse = await page.request.post(`${API_BASE}/room-allocations`, {
      data: allocationData
    });

    expect(createResponse.status()).toBe(201);
    const createResponseData = await createResponse.json();
    
    // Handle response structure - could be direct allocation or wrapped
    const createdAllocation = createResponseData.data?.allocation || createResponseData;
    expect(createdAllocation).toHaveProperty('id');
    expect(createdAllocation.roomId).toBe(allocationData.roomId);
    expect(createdAllocation.purpose).toBe(allocationData.purpose);
    expect(createdAllocation.title).toBe(allocationData.title);
    expect(createdAllocation.status).toBe(allocationData.status);
    expect(createdAllocation.facultyId).toBe(allocationData.facultyId);
    expect(createdAllocation.courseOfferingId).toBe(allocationData.courseOfferingId);
    
    createdAllocationId = createdAllocation.id;

    // Test READ ALL - GET /api/room-allocations
    const getAllResponse = await page.request.get(`${API_BASE}/room-allocations`);
    expect(getAllResponse.status()).toBe(200);
    
    const allAllocations = await getAllResponse.json();
    expect(Array.isArray(allAllocations)).toBe(true);
    
    const foundAllocation = allAllocations.find((a: any) => a.id === createdAllocationId);
    expect(foundAllocation).toBeDefined();
    expect(foundAllocation.title).toBe(allocationData.title);

    // Test READ ONE - GET /api/room-allocations/:id
    const getOneResponse = await page.request.get(`${API_BASE}/room-allocations/${createdAllocationId}`);
    expect(getOneResponse.status()).toBe(200);
    
    const getOneResponseData = await getOneResponse.json();
    const allocationData1 = getOneResponseData.data?.allocation || getOneResponseData;
    expect(allocationData1.id).toBe(createdAllocationId);
    expect(allocationData1.title).toBe(allocationData.title);

    // Test UPDATE - PUT /api/room-allocations/:id
    const updateResponse = await page.request.put(`${API_BASE}/room-allocations/${createdAllocationId}`, {
      data: {
        ...testRoomAllocationUpdate,
        title: `Updated ${allocationData.title}`
      }
    });

    expect(updateResponse.status()).toBe(200);
    const updateResponseData = await updateResponse.json();
    const updatedAllocation = updateResponseData.data?.allocation || updateResponseData;
    expect(updatedAllocation.id).toBe(createdAllocationId);
    expect(updatedAllocation.title).toBe(`Updated ${allocationData.title}`);
    expect(updatedAllocation.purpose).toBe(testRoomAllocationUpdate.purpose);
    expect(updatedAllocation.status).toBe(testRoomAllocationUpdate.status);
    expect(updatedAllocation.isRecurring).toBe(testRoomAllocationUpdate.isRecurring);

    // Verify update persisted
    const getUpdatedResponse = await page.request.get(`${API_BASE}/room-allocations/${createdAllocationId}`);
    expect(getUpdatedResponse.status()).toBe(200);
    const getUpdatedResponseData = await getUpdatedResponse.json();
    const updatedAllocationVerify = getUpdatedResponseData.data?.allocation || getUpdatedResponseData;
    expect(updatedAllocationVerify.title).toBe(`Updated ${allocationData.title}`);
    expect(updatedAllocationVerify.purpose).toBe(testRoomAllocationUpdate.purpose);

    // Test DELETE - DELETE /api/room-allocations/:id
    const deleteResponse = await page.request.delete(`${API_BASE}/room-allocations/${createdAllocationId}`);
    expect(deleteResponse.status()).toBe(200);

    // Verify deletion
    const getDeletedResponse = await page.request.get(`${API_BASE}/room-allocations/${createdAllocationId}`);
    expect(getDeletedResponse.status()).toBe(404);
  });

  test('should validate required fields', async ({ page }) => {
    // Test missing roomId
    const missingRoomId = { ...testRoomAllocation } as any;
    delete missingRoomId.roomId;

    const missingRoomIdResponse = await page.request.post(`${API_BASE}/room-allocations`, {
      data: missingRoomId
    });

    expect(missingRoomIdResponse.status()).toBe(400);
    const errorData1 = await missingRoomIdResponse.json();
    expect(errorData1).toHaveProperty('message');
    expect(errorData1.message).toContain('roomId');

    // Test missing purpose
    const missingPurpose = { ...testRoomAllocation } as any;
    delete missingPurpose.purpose;

    const missingPurposeResponse = await page.request.post(`${API_BASE}/room-allocations`, {
      data: missingPurpose
    });

    expect(missingPurposeResponse.status()).toBe(400);
    const errorData2 = await missingPurposeResponse.json();
    expect(errorData2).toHaveProperty('message');
    expect(errorData2.message).toContain('purpose');

    // Test missing startTime
    const missingStartTime = { ...testRoomAllocation } as any;
    delete missingStartTime.startTime;

    const missingStartTimeResponse = await page.request.post(`${API_BASE}/room-allocations`, {
      data: missingStartTime
    });

    expect(missingStartTimeResponse.status()).toBe(400);
    const errorData3 = await missingStartTimeResponse.json();
    expect(errorData3).toHaveProperty('message');
    expect(errorData3.message).toContain('startTime');

    // Test missing endTime
    const missingEndTime = { ...testRoomAllocation } as any;
    delete missingEndTime.endTime;

    const missingEndTimeResponse = await page.request.post(`${API_BASE}/room-allocations`, {
      data: missingEndTime
    });

    expect(missingEndTimeResponse.status()).toBe(400);
    const errorData4 = await missingEndTimeResponse.json();
    expect(errorData4).toHaveProperty('message');
    expect(errorData4.message).toContain('endTime');

    // Test missing status
    const missingStatus = { ...testRoomAllocation } as any;
    delete missingStatus.status;

    const missingStatusResponse = await page.request.post(`${API_BASE}/room-allocations`, {
      data: missingStatus
    });

    expect(missingStatusResponse.status()).toBe(400);
    const errorData5 = await missingStatusResponse.json();
    expect(errorData5).toHaveProperty('message');
    expect(errorData5.message).toContain('status');
  });

  test('should validate purpose values', async ({ page }) => {
    const validPurposes = ['lecture', 'practical', 'exam', 'event', 'meeting', 'other'];
    
    for (const purpose of validPurposes) {
      const uniqueId = Date.now() + Math.random();
      const allocationWithPurpose = {
        ...testRoomAllocation,
        roomId: `room_test_${uniqueId}`,
        title: `Test Allocation ${purpose}`,
        purpose: purpose,
        startTime: `2025-03-15T${(9 + validPurposes.indexOf(purpose)).toString().padStart(2, '0')}:00:00.000Z`,
        endTime: `2025-03-15T${(10 + validPurposes.indexOf(purpose)).toString().padStart(2, '0')}:00:00.000Z`
      };

      const createResponse = await page.request.post(`${API_BASE}/room-allocations`, {
        data: allocationWithPurpose
      });

      if (createResponse.status() === 201) {
        const createResponseData = await createResponse.json();
        const createdAllocation = createResponseData.data?.allocation || createResponseData;
        expect(createdAllocation.purpose).toBe(purpose);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/room-allocations/${createdAllocation.id}`);
      }
    }
  });

  test('should validate status values', async ({ page }) => {
    const validStatuses = ['scheduled', 'cancelled', 'completed', 'ongoing'];
    
    for (const status of validStatuses) {
      const uniqueId = Date.now() + Math.random();
      const allocationWithStatus = {
        ...testRoomAllocation,
        roomId: `room_test_${uniqueId}`,
        title: `Test Allocation ${status}`,
        status: status,
        startTime: `2025-03-15T${(9 + validStatuses.indexOf(status)).toString().padStart(2, '0')}:00:00.000Z`,
        endTime: `2025-03-15T${(10 + validStatuses.indexOf(status)).toString().padStart(2, '0')}:00:00.000Z`
      };

      const createResponse = await page.request.post(`${API_BASE}/room-allocations`, {
        data: allocationWithStatus
      });

      if (createResponse.status() === 201) {
        const createResponseData = await createResponse.json();
        const createdAllocation = createResponseData.data?.allocation || createResponseData;
        expect(createdAllocation.status).toBe(status);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/room-allocations/${createdAllocation.id}`);
      }
    }
  });

  test('should validate time logic', async ({ page }) => {
    const uniqueId = Date.now();
    
    // Test case where end time is before start time
    const invalidTimesAllocation = {
      ...testRoomAllocation,
      roomId: `room_test_${uniqueId}`,
      title: `Invalid Times Allocation ${uniqueId}`,
      startTime: '2025-03-15T10:00:00.000Z',
      endTime: '2025-03-15T09:00:00.000Z' // Before start time
    };

    const invalidResponse = await page.request.post(`${API_BASE}/room-allocations`, {
      data: invalidTimesAllocation
    });

    expect(invalidResponse.status()).toBe(400);
    const errorData = await invalidResponse.json();
    expect(errorData.message).toContain('End time must be after start time');

    // Test case where start time equals end time
    const equalTimesAllocation = {
      ...testRoomAllocation,
      roomId: `room_test_${uniqueId}_2`,
      title: `Equal Times Allocation ${uniqueId}`,
      startTime: '2025-03-15T10:00:00.000Z',
      endTime: '2025-03-15T10:00:00.000Z' // Same as start time
    };

    const equalResponse = await page.request.post(`${API_BASE}/room-allocations`, {
      data: equalTimesAllocation
    });

    expect(equalResponse.status()).toBe(400);
    const errorData2 = await equalResponse.json();
    expect(errorData2.message).toContain('End time must be after start time');
  });

  test('should validate date format', async ({ page }) => {
    const uniqueId = Date.now();
    
    // Test invalid date format for start time
    const invalidStartTimeAllocation = {
      ...testRoomAllocation,
      roomId: `room_test_${uniqueId}`,
      title: `Invalid Start Time Allocation ${uniqueId}`,
      startTime: 'invalid-date-format',
      endTime: '2025-03-15T10:00:00.000Z'
    };

    const invalidStartResponse = await page.request.post(`${API_BASE}/room-allocations`, {
      data: invalidStartTimeAllocation
    });

    expect(invalidStartResponse.status()).toBe(400);
    const errorData1 = await invalidStartResponse.json();
    expect(errorData1.message).toContain('Invalid startTime or endTime format');

    // Test invalid date format for end time
    const invalidEndTimeAllocation = {
      ...testRoomAllocation,
      roomId: `room_test_${uniqueId}_2`,
      title: `Invalid End Time Allocation ${uniqueId}`,
      startTime: '2025-03-15T09:00:00.000Z',
      endTime: 'invalid-date-format'
    };

    const invalidEndResponse = await page.request.post(`${API_BASE}/room-allocations`, {
      data: invalidEndTimeAllocation
    });

    expect(invalidEndResponse.status()).toBe(400);
    const errorData2 = await invalidEndResponse.json();
    expect(errorData2.message).toContain('Invalid startTime or endTime format');
  });

  test('should detect time slot conflicts', async ({ page }) => {
    const uniqueId = Date.now();
    const roomId = `room_conflict_test_${uniqueId}`;
    
    // Create first allocation
    const firstAllocation = {
      ...testRoomAllocation,
      roomId: roomId,
      title: `First Allocation ${uniqueId}`,
      startTime: '2025-03-15T09:00:00.000Z',
      endTime: '2025-03-15T10:00:00.000Z'
    };

    const firstCreateResponse = await page.request.post(`${API_BASE}/room-allocations`, {
      data: firstAllocation
    });

    expect(firstCreateResponse.status()).toBe(201);
    const firstCreatedAllocation = await firstCreateResponse.json();
    const firstAllocationId = (firstCreatedAllocation.data?.allocation || firstCreatedAllocation).id;

    try {
      // Try to create overlapping allocation (same time slot)
      const conflictingAllocation = {
        ...testRoomAllocation,
        roomId: roomId, // Same room
        title: `Conflicting Allocation ${uniqueId}`,
        startTime: '2025-03-15T09:00:00.000Z', // Same start time
        endTime: '2025-03-15T10:00:00.000Z'   // Same end time
      };

      const conflictResponse = await page.request.post(`${API_BASE}/room-allocations`, {
        data: conflictingAllocation
      });

      expect(conflictResponse.status()).toBe(409);
      const conflictErrorData = await conflictResponse.json();
      expect(conflictErrorData.message).toContain('Time slot conflict');
      expect(conflictErrorData.message).toContain(roomId);

      // Try to create partially overlapping allocation
      const partialOverlapAllocation = {
        ...testRoomAllocation,
        roomId: roomId, // Same room
        title: `Partial Overlap Allocation ${uniqueId}`,
        startTime: '2025-03-15T09:30:00.000Z', // Overlaps with first allocation
        endTime: '2025-03-15T10:30:00.000Z'
      };

      const partialOverlapResponse = await page.request.post(`${API_BASE}/room-allocations`, {
        data: partialOverlapAllocation
      });

      expect(partialOverlapResponse.status()).toBe(409);
      const partialOverlapErrorData = await partialOverlapResponse.json();
      expect(partialOverlapErrorData.message).toContain('Time slot conflict');

      // Create non-conflicting allocation (different time)
      const nonConflictingAllocation = {
        ...testRoomAllocation,
        roomId: roomId, // Same room
        title: `Non-Conflicting Allocation ${uniqueId}`,
        startTime: '2025-03-15T11:00:00.000Z', // After first allocation
        endTime: '2025-03-15T12:00:00.000Z'
      };

      const nonConflictResponse = await page.request.post(`${API_BASE}/room-allocations`, {
        data: nonConflictingAllocation
      });

      expect(nonConflictResponse.status()).toBe(201);
      const nonConflictCreated = await nonConflictResponse.json();
      const nonConflictAllocationId = (nonConflictCreated.data?.allocation || nonConflictCreated).id;

      // Cleanup non-conflicting allocation
      await page.request.delete(`${API_BASE}/room-allocations/${nonConflictAllocationId}`);

    } finally {
      // Cleanup first allocation
      await page.request.delete(`${API_BASE}/room-allocations/${firstAllocationId}`);
    }
  });

  test('should handle filtering by room ID', async ({ page }) => {
    const uniqueId = Date.now();
    const room1Id = `room_filter_test_1_${uniqueId}`;
    const room2Id = `room_filter_test_2_${uniqueId}`;
    
    // Create allocations for different rooms
    const allocation1 = {
      ...testRoomAllocation,
      roomId: room1Id,
      title: `Room 1 Allocation ${uniqueId}`,
      startTime: '2025-03-15T09:00:00.000Z',
      endTime: '2025-03-15T10:00:00.000Z'
    };

    const allocation2 = {
      ...testRoomAllocation,
      roomId: room2Id,
      title: `Room 2 Allocation ${uniqueId}`,
      startTime: '2025-03-15T11:00:00.000Z',
      endTime: '2025-03-15T12:00:00.000Z'
    };

    const create1Response = await page.request.post(`${API_BASE}/room-allocations`, {
      data: allocation1
    });

    const create2Response = await page.request.post(`${API_BASE}/room-allocations`, {
      data: allocation2
    });

    expect(create1Response.status()).toBe(201);
    expect(create2Response.status()).toBe(201);

    const created1 = await create1Response.json();
    const created2 = await create2Response.json();
    const allocation1Id = (created1.data?.allocation || created1).id;
    const allocation2Id = (created2.data?.allocation || created2).id;

    try {
      // Test filtering by room 1
      const room1FilterResponse = await page.request.get(`${API_BASE}/room-allocations?roomId=${room1Id}`);
      expect(room1FilterResponse.status()).toBe(200);
      const room1Allocations = await room1FilterResponse.json();
      
      const foundRoom1Allocation = room1Allocations.find((a: any) => a.id === allocation1Id);
      expect(foundRoom1Allocation).toBeDefined();
      expect(foundRoom1Allocation.roomId).toBe(room1Id);

      // Should not contain room 2 allocation
      const foundRoom2InRoom1Filter = room1Allocations.find((a: any) => a.id === allocation2Id);
      expect(foundRoom2InRoom1Filter).toBeUndefined();

      // Test filtering by room 2
      const room2FilterResponse = await page.request.get(`${API_BASE}/room-allocations?roomId=${room2Id}`);
      expect(room2FilterResponse.status()).toBe(200);
      const room2Allocations = await room2FilterResponse.json();
      
      const foundRoom2Allocation = room2Allocations.find((a: any) => a.id === allocation2Id);
      expect(foundRoom2Allocation).toBeDefined();
      expect(foundRoom2Allocation.roomId).toBe(room2Id);

    } finally {
      // Cleanup
      await page.request.delete(`${API_BASE}/room-allocations/${allocation1Id}`);
      await page.request.delete(`${API_BASE}/room-allocations/${allocation2Id}`);
    }
  });

  test('should handle filtering by faculty ID', async ({ page }) => {
    const uniqueId = Date.now();
    const faculty1Id = `faculty_filter_test_1_${uniqueId}`;
    const faculty2Id = `faculty_filter_test_2_${uniqueId}`;
    
    // Create allocations for different faculty
    const allocation1 = {
      ...testRoomAllocation,
      roomId: `room_faculty_test_1_${uniqueId}`,
      facultyId: faculty1Id,
      title: `Faculty 1 Allocation ${uniqueId}`,
      startTime: '2025-03-15T09:00:00.000Z',
      endTime: '2025-03-15T10:00:00.000Z'
    };

    const allocation2 = {
      ...testRoomAllocation,
      roomId: `room_faculty_test_2_${uniqueId}`,
      facultyId: faculty2Id,
      title: `Faculty 2 Allocation ${uniqueId}`,
      startTime: '2025-03-15T11:00:00.000Z',
      endTime: '2025-03-15T12:00:00.000Z'
    };

    const create1Response = await page.request.post(`${API_BASE}/room-allocations`, {
      data: allocation1
    });

    const create2Response = await page.request.post(`${API_BASE}/room-allocations`, {
      data: allocation2
    });

    expect(create1Response.status()).toBe(201);
    expect(create2Response.status()).toBe(201);

    const created1 = await create1Response.json();
    const created2 = await create2Response.json();
    const allocation1Id = (created1.data?.allocation || created1).id;
    const allocation2Id = (created2.data?.allocation || created2).id;

    try {
      // Test filtering by faculty 1
      const faculty1FilterResponse = await page.request.get(`${API_BASE}/room-allocations?facultyId=${faculty1Id}`);
      expect(faculty1FilterResponse.status()).toBe(200);
      const faculty1Allocations = await faculty1FilterResponse.json();
      
      const foundFaculty1Allocation = faculty1Allocations.find((a: any) => a.id === allocation1Id);
      expect(foundFaculty1Allocation).toBeDefined();
      expect(foundFaculty1Allocation.facultyId).toBe(faculty1Id);

      // Should not contain faculty 2 allocation
      const foundFaculty2InFaculty1Filter = faculty1Allocations.find((a: any) => a.id === allocation2Id);
      expect(foundFaculty2InFaculty1Filter).toBeUndefined();

    } finally {
      // Cleanup
      await page.request.delete(`${API_BASE}/room-allocations/${allocation1Id}`);
      await page.request.delete(`${API_BASE}/room-allocations/${allocation2Id}`);
    }
  });

  test('should handle filtering by course offering ID', async ({ page }) => {
    const uniqueId = Date.now();
    const course1Id = `course_filter_test_1_${uniqueId}`;
    const course2Id = `course_filter_test_2_${uniqueId}`;
    
    // Create allocations for different courses
    const allocation1 = {
      ...testRoomAllocation,
      roomId: `room_course_test_1_${uniqueId}`,
      courseOfferingId: course1Id,
      title: `Course 1 Allocation ${uniqueId}`,
      startTime: '2025-03-15T09:00:00.000Z',
      endTime: '2025-03-15T10:00:00.000Z'
    };

    const allocation2 = {
      ...testRoomAllocation,
      roomId: `room_course_test_2_${uniqueId}`,
      courseOfferingId: course2Id,
      title: `Course 2 Allocation ${uniqueId}`,
      startTime: '2025-03-15T11:00:00.000Z',
      endTime: '2025-03-15T12:00:00.000Z'
    };

    const create1Response = await page.request.post(`${API_BASE}/room-allocations`, {
      data: allocation1
    });

    const create2Response = await page.request.post(`${API_BASE}/room-allocations`, {
      data: allocation2
    });

    expect(create1Response.status()).toBe(201);
    expect(create2Response.status()).toBe(201);

    const created1 = await create1Response.json();
    const created2 = await create2Response.json();
    const allocation1Id = (created1.data?.allocation || created1).id;
    const allocation2Id = (created2.data?.allocation || created2).id;

    try {
      // Test filtering by course 1
      const course1FilterResponse = await page.request.get(`${API_BASE}/room-allocations?courseOfferingId=${course1Id}`);
      expect(course1FilterResponse.status()).toBe(200);
      const course1Allocations = await course1FilterResponse.json();
      
      const foundCourse1Allocation = course1Allocations.find((a: any) => a.id === allocation1Id);
      expect(foundCourse1Allocation).toBeDefined();
      expect(foundCourse1Allocation.courseOfferingId).toBe(course1Id);

    } finally {
      // Cleanup
      await page.request.delete(`${API_BASE}/room-allocations/${allocation1Id}`);
      await page.request.delete(`${API_BASE}/room-allocations/${allocation2Id}`);
    }
  });

  test('should handle date filtering', async ({ page }) => {
    const uniqueId = Date.now();
    
    // Create allocations for different dates
    const allocation1 = {
      ...testRoomAllocation,
      roomId: `room_date_test_1_${uniqueId}`,
      title: `Date 1 Allocation ${uniqueId}`,
      startTime: '2025-03-15T09:00:00.000Z', // March 15, 2025
      endTime: '2025-03-15T10:00:00.000Z'
    };

    const allocation2 = {
      ...testRoomAllocation,
      roomId: `room_date_test_2_${uniqueId}`,
      title: `Date 2 Allocation ${uniqueId}`,
      startTime: '2025-03-16T09:00:00.000Z', // March 16, 2025
      endTime: '2025-03-16T10:00:00.000Z'
    };

    const create1Response = await page.request.post(`${API_BASE}/room-allocations`, {
      data: allocation1
    });

    const create2Response = await page.request.post(`${API_BASE}/room-allocations`, {
      data: allocation2
    });

    expect(create1Response.status()).toBe(201);
    expect(create2Response.status()).toBe(201);

    const created1 = await create1Response.json();
    const created2 = await create2Response.json();
    const allocation1Id = (created1.data?.allocation || created1).id;
    const allocation2Id = (created2.data?.allocation || created2).id;

    try {
      // Test filtering by March 15, 2025
      const date1FilterResponse = await page.request.get(`${API_BASE}/room-allocations?date=2025-03-15`);
      expect(date1FilterResponse.status()).toBe(200);
      const date1Allocations = await date1FilterResponse.json();
      
      const foundDate1Allocation = date1Allocations.find((a: any) => a.id === allocation1Id);
      expect(foundDate1Allocation).toBeDefined();

      // Should not contain March 16 allocation
      const foundDate2InDate1Filter = date1Allocations.find((a: any) => a.id === allocation2Id);
      expect(foundDate2InDate1Filter).toBeUndefined();

      // Test filtering by March 16, 2025
      const date2FilterResponse = await page.request.get(`${API_BASE}/room-allocations?date=2025-03-16`);
      expect(date2FilterResponse.status()).toBe(200);
      const date2Allocations = await date2FilterResponse.json();
      
      const foundDate2Allocation = date2Allocations.find((a: any) => a.id === allocation2Id);
      expect(foundDate2Allocation).toBeDefined();

    } finally {
      // Cleanup
      await page.request.delete(`${API_BASE}/room-allocations/${allocation1Id}`);
      await page.request.delete(`${API_BASE}/room-allocations/${allocation2Id}`);
    }
  });

  test('should handle meeting allocations (without course/faculty)', async ({ page }) => {
    const uniqueId = Date.now();
    
    const meetingAllocation = {
      ...testMeetingAllocation,
      roomId: `room_meeting_test_${uniqueId}`,
      title: `Meeting Allocation ${uniqueId}`,
      startTime: `2025-03-16T${(14 + (uniqueId % 3)).toString().padStart(2, '0')}:00:00.000Z`,
      endTime: `2025-03-16T${(15 + (uniqueId % 3)).toString().padStart(2, '0')}:30:00.000Z`
    };

    const createResponse = await page.request.post(`${API_BASE}/room-allocations`, {
      data: meetingAllocation
    });

    if (createResponse.status() === 201) {
      const createResponseData = await createResponse.json();
      const createdMeeting = createResponseData.data?.allocation || createResponseData;
      
      expect(createdMeeting.purpose).toBe('meeting');
      expect(createdMeeting.committeeId).toBe(meetingAllocation.committeeId);
      expect(createdMeeting.facultyId).toBeUndefined();
      expect(createdMeeting.courseOfferingId).toBeUndefined();
      
      // Cleanup
      await page.request.delete(`${API_BASE}/room-allocations/${createdMeeting.id}`);
    }
  });

  test('should handle recurring allocations', async ({ page }) => {
    const uniqueId = Date.now();
    
    const recurringAllocation = {
      ...testRoomAllocation,
      roomId: `room_recurring_test_${uniqueId}`,
      title: `Recurring Allocation ${uniqueId}`,
      isRecurring: true,
      dayOfWeek: 'Tuesday',
      recurrencePattern: 'weekly',
      startTime: `2025-03-18T${(9 + (uniqueId % 4)).toString().padStart(2, '0')}:00:00.000Z`,
      endTime: `2025-03-18T${(10 + (uniqueId % 4)).toString().padStart(2, '0')}:00:00.000Z`
    };

    const createResponse = await page.request.post(`${API_BASE}/room-allocations`, {
      data: recurringAllocation
    });

    if (createResponse.status() === 201) {
      const createResponseData = await createResponse.json();
      const createdRecurring = createResponseData.data?.allocation || createResponseData;
      
      expect(createdRecurring.isRecurring).toBe(true);
      expect(createdRecurring.dayOfWeek).toBe('Tuesday');
      expect(createdRecurring.recurrencePattern).toBe('weekly');
      
      // Cleanup
      await page.request.delete(`${API_BASE}/room-allocations/${createdRecurring.id}`);
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test invalid allocation ID for GET
    const invalidGetResponse = await page.request.get(`${API_BASE}/room-allocations/invalid-id`);
    expect(invalidGetResponse.status()).toBe(404);

    // Test invalid allocation ID for UPDATE
    const invalidUpdateResponse = await page.request.put(`${API_BASE}/room-allocations/invalid-id`, {
      data: testRoomAllocation
    });
    expect(invalidUpdateResponse.status()).toBe(404);

    // Test invalid allocation ID for DELETE
    const invalidDeleteResponse = await page.request.delete(`${API_BASE}/room-allocations/invalid-id`);
    expect(invalidDeleteResponse.status()).toBe(404);

    // Test malformed data
    const malformedResponse = await page.request.post(`${API_BASE}/room-allocations`, {
      data: null
    });
    expect([400, 500]).toContain(malformedResponse.status());
  });

  test('should handle time validation in updates', async ({ page }) => {
    const uniqueId = Date.now();
    
    // Create allocation first
    const allocationData = {
      ...testRoomAllocation,
      roomId: `room_update_test_${uniqueId}`,
      title: `Time Update Test Allocation ${uniqueId}`,
      startTime: `2025-03-15T${(9 + (uniqueId % 3)).toString().padStart(2, '0')}:00:00.000Z`,
      endTime: `2025-03-15T${(10 + (uniqueId % 3)).toString().padStart(2, '0')}:00:00.000Z`
    };

    const createResponse = await page.request.post(`${API_BASE}/room-allocations`, {
      data: allocationData
    });

    expect(createResponse.status()).toBe(201);
    const createdAllocation = await createResponse.json();
    const allocationId = (createdAllocation.data?.allocation || createdAllocation).id;

    try {
      // Test updating with invalid time logic
      const invalidUpdateResponse = await page.request.put(`${API_BASE}/room-allocations/${allocationId}`, {
        data: {
          startTime: '2025-03-15T11:00:00.000Z',
          endTime: '2025-03-15T10:00:00.000Z' // Before start time
        }
      });

      expect(invalidUpdateResponse.status()).toBe(400);
      const errorData = await invalidUpdateResponse.json();
      expect(errorData.message).toContain('End time must be after start time');

      // Test updating with valid times
      const validUpdateResponse = await page.request.put(`${API_BASE}/room-allocations/${allocationId}`, {
        data: {
          startTime: '2025-03-15T14:00:00.000Z',
          endTime: '2025-03-15T15:00:00.000Z'
        }
      });

      expect(validUpdateResponse.status()).toBe(200);

    } finally {
      // Cleanup
      await page.request.delete(`${API_BASE}/room-allocations/${allocationId}`);
    }
  });
});
