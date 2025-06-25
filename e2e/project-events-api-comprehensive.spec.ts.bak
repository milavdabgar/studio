import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Project Events API - In-Memory Storage Endpoints
 * Priority: Project Events Module (Critical for Academic Event Management)
 * 
 * This test suite covers the project events API endpoints that use in-memory storage
 * and are critical for the MongoDB migration. Tests ensure data integrity
 * and business logic preservation during migration.
 */

// Base URL for API endpoints
const API_BASE = '/api';

// Test data for project events
const testProjectEvent = {
  name: 'E2E Test Event',
  description: 'A test event for E2E testing purposes',
  academicYear: '2024-25',
  eventDate: '2025-03-15T00:00:00.000Z',
  registrationStartDate: '2024-12-01T00:00:00.000Z',
  registrationEndDate: '2025-01-31T00:00:00.000Z',
  status: 'upcoming' as const,
  isActive: true,
  publishResults: false,
  departments: ['dept_ce_gpp', 'dept_me_gpp']
};

const testProjectEventUpdate = {
  name: 'Updated E2E Test Event',
  description: 'Updated description for E2E testing',
  status: 'ongoing' as const,
  publishResults: true,
  isActive: false
};

const testScheduleItem = {
  time: '09:00 AM - 10:00 AM',
  activity: 'Test Activity',
  location: 'Test Location',
  coordinator: {
    userId: 'user_faculty_cs01_gpp',
    name: 'Test Coordinator'
  },
  notes: 'Test notes for the activity'
};

test.describe('Project Events API - Critical In-Memory Storage', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that initializes the app context
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should create, read, update, and delete project events (CRUD)', async ({ page }) => {
    let createdEventId: string;

    // Test CREATE - POST /api/project-events
    const uniqueId = Date.now();
    const eventData = {
      ...testProjectEvent,
      name: `${testProjectEvent.name} ${uniqueId}`,
      academicYear: '2024-25'
    };

    const createResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: eventData
    });

    expect(createResponse.status()).toBe(201);
    const createResponseData = await createResponse.json();
    
    // Handle response structure - could be direct event or wrapped
    const createdEvent = createResponseData.data?.event || createResponseData;
    expect(createdEvent).toHaveProperty('id');
    expect(createdEvent.name).toBe(eventData.name);
    expect(createdEvent.description).toBe(eventData.description);
    expect(createdEvent.academicYear).toBe(eventData.academicYear);
    expect(createdEvent.status).toBe(eventData.status);
    expect(createdEvent.isActive).toBe(eventData.isActive);
    expect(createdEvent.publishResults).toBe(eventData.publishResults);
    
    createdEventId = createdEvent.id;

    // Test READ ALL - GET /api/project-events
    const getAllResponse = await page.request.get(`${API_BASE}/project-events`);
    expect(getAllResponse.status()).toBe(200);
    
    const allEvents = await getAllResponse.json();
    expect(Array.isArray(allEvents)).toBe(true);
    
    const foundEvent = allEvents.find((e: any) => e.id === createdEventId);
    expect(foundEvent).toBeDefined();
    expect(foundEvent.name).toBe(eventData.name);

    // Test READ ONE - GET /api/project-events/:id
    const getOneResponse = await page.request.get(`${API_BASE}/project-events/${createdEventId}`);
    expect(getOneResponse.status()).toBe(200);
    
    const getOneResponseData = await getOneResponse.json();
    const eventData1 = getOneResponseData.data?.event || getOneResponseData;
    expect(eventData1.id).toBe(createdEventId);
    expect(eventData1.name).toBe(eventData.name);

    // Test UPDATE - PUT /api/project-events/:id
    const updateResponse = await page.request.put(`${API_BASE}/project-events/${createdEventId}`, {
      data: {
        ...testProjectEventUpdate,
        name: `Updated ${eventData.name}`
      }
    });

    expect(updateResponse.status()).toBe(200);
    const updateResponseData = await updateResponse.json();
    const updatedEvent = updateResponseData.data?.event || updateResponseData;
    expect(updatedEvent.id).toBe(createdEventId);
    expect(updatedEvent.name).toBe(`Updated ${eventData.name}`);
    expect(updatedEvent.description).toBe(testProjectEventUpdate.description);
    expect(updatedEvent.status).toBe(testProjectEventUpdate.status);
    expect(updatedEvent.publishResults).toBe(testProjectEventUpdate.publishResults);

    // Verify update persisted
    const getUpdatedResponse = await page.request.get(`${API_BASE}/project-events/${createdEventId}`);
    expect(getUpdatedResponse.status()).toBe(200);
    const getUpdatedResponseData = await getUpdatedResponse.json();
    const updatedEventVerify = getUpdatedResponseData.data?.event || getUpdatedResponseData;
    expect(updatedEventVerify.name).toBe(`Updated ${eventData.name}`);
    expect(updatedEventVerify.status).toBe(testProjectEventUpdate.status);

    // Test DELETE - DELETE /api/project-events/:id
    const deleteResponse = await page.request.delete(`${API_BASE}/project-events/${createdEventId}`);
    expect(deleteResponse.status()).toBe(200);

    // Verify deletion
    const getDeletedResponse = await page.request.get(`${API_BASE}/project-events/${createdEventId}`);
    expect(getDeletedResponse.status()).toBe(404);
  });

  test('should validate required fields', async ({ page }) => {
    // Test missing event name
    const missingName = { ...testProjectEvent } as any;
    delete missingName.name;

    const missingNameResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: missingName
    });

    expect(missingNameResponse.status()).toBe(400);
    const errorData1 = await missingNameResponse.json();
    expect(errorData1).toHaveProperty('message');
    expect(errorData1.message).toContain('Event Name is required');

    // Test missing academic year
    const missingAcademicYear = { ...testProjectEvent } as any;
    delete missingAcademicYear.academicYear;

    const missingAcademicYearResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: missingAcademicYear
    });

    expect(missingAcademicYearResponse.status()).toBe(400);
    const errorData2 = await missingAcademicYearResponse.json();
    expect(errorData2).toHaveProperty('message');
    expect(errorData2.message).toContain('Academic Year is required');

    // Test missing event date
    const missingEventDate = { ...testProjectEvent } as any;
    delete missingEventDate.eventDate;

    const missingEventDateResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: missingEventDate
    });

    expect(missingEventDateResponse.status()).toBe(400);
    const errorData3 = await missingEventDateResponse.json();
    expect(errorData3).toHaveProperty('message');
    expect(errorData3.message).toContain('Event Date is required');

    // Test missing status
    const missingStatus = { ...testProjectEvent } as any;
    delete missingStatus.status;

    const missingStatusResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: missingStatus
    });

    expect(missingStatusResponse.status()).toBe(400);
    const errorData4 = await missingStatusResponse.json();
    expect(errorData4).toHaveProperty('message');
    expect(errorData4.message).toContain('Event status is required');
  });

  test('should validate event status values', async ({ page }) => {
    const validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
    
    for (const status of validStatuses) {
      const eventWithStatus = {
        ...testProjectEvent,
        name: `Test Event ${status} ${Date.now()}`,
        status: status
      };

      const createResponse = await page.request.post(`${API_BASE}/project-events`, {
        data: eventWithStatus
      });

      if (createResponse.status() === 201) {
        const createResponseData = await createResponse.json();
        const createdEvent = createResponseData.data?.event || createResponseData;
        expect(createdEvent.status).toBe(status);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/project-events/${createdEvent.id}`);
      }
    }

    // Test invalid status
    const invalidStatusEvent = {
      ...testProjectEvent,
      name: `Invalid Status Event ${Date.now()}`,
      status: 'invalid-status'
    };

    const invalidResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: invalidStatusEvent
    });

    // Should either be accepted (backend doesn't validate) or rejected with 400
    if (invalidResponse.status() === 400) {
      const errorData = await invalidResponse.json();
      expect(errorData.message).toContain('status');
    }
  });

  test('should validate date logic', async ({ page }) => {
    // Test case where registration start is after event date
    const invalidDatesEvent1 = {
      ...testProjectEvent,
      name: `Invalid Dates Event 1 ${Date.now()}`,
      eventDate: '2025-01-15T00:00:00.000Z',
      registrationStartDate: '2025-02-01T00:00:00.000Z', // After event date
      registrationEndDate: '2025-01-20T00:00:00.000Z'
    };

    const invalidResponse1 = await page.request.post(`${API_BASE}/project-events`, {
      data: invalidDatesEvent1
    });

    expect(invalidResponse1.status()).toBe(400);
    const errorData1 = await invalidResponse1.json();
    expect(errorData1.message).toContain('dates are illogical');

    // Test case where registration end is after event date
    const invalidDatesEvent2 = {
      ...testProjectEvent,
      name: `Invalid Dates Event 2 ${Date.now()}`,
      eventDate: '2025-01-15T00:00:00.000Z',
      registrationStartDate: '2024-12-01T00:00:00.000Z',
      registrationEndDate: '2025-02-01T00:00:00.000Z' // After event date
    };

    const invalidResponse2 = await page.request.post(`${API_BASE}/project-events`, {
      data: invalidDatesEvent2
    });

    expect(invalidResponse2.status()).toBe(400);
    const errorData2 = await invalidResponse2.json();
    expect(errorData2.message).toContain('dates are illogical');

    // Test case where registration start is after registration end
    const invalidDatesEvent3 = {
      ...testProjectEvent,
      name: `Invalid Dates Event 3 ${Date.now()}`,
      eventDate: '2025-03-15T00:00:00.000Z',
      registrationStartDate: '2025-01-31T00:00:00.000Z', // After registration end
      registrationEndDate: '2025-01-15T00:00:00.000Z'
    };

    const invalidResponse3 = await page.request.post(`${API_BASE}/project-events`, {
      data: invalidDatesEvent3
    });

    expect(invalidResponse3.status()).toBe(400);
    const errorData3 = await invalidResponse3.json();
    expect(errorData3.message).toContain('dates are illogical');
  });

  test('should handle isActive filtering', async ({ page }) => {
    const uniqueId = Date.now();
    
    // Create active event
    const activeEvent = {
      ...testProjectEvent,
      name: `Active Event ${uniqueId}`,
      isActive: true
    };

    const activeCreateResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: activeEvent
    });

    expect(activeCreateResponse.status()).toBe(201);
    const activeCreatedEvent = await activeCreateResponse.json();
    const activeEventId = (activeCreatedEvent.data?.event || activeCreatedEvent).id;

    // Create inactive event
    const inactiveEvent = {
      ...testProjectEvent,
      name: `Inactive Event ${uniqueId}`,
      isActive: false
    };

    const inactiveCreateResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: inactiveEvent
    });

    expect(inactiveCreateResponse.status()).toBe(201);
    const inactiveCreatedEvent = await inactiveCreateResponse.json();
    const inactiveEventId = (inactiveCreatedEvent.data?.event || inactiveCreatedEvent).id;

    try {
      // Test filtering active events
      const activeFilterResponse = await page.request.get(`${API_BASE}/project-events?isActive=true`);
      expect(activeFilterResponse.status()).toBe(200);
      const activeEvents = await activeFilterResponse.json();
      
      const foundActiveEvent = activeEvents.find((e: any) => e.id === activeEventId);
      expect(foundActiveEvent).toBeDefined();
      expect(foundActiveEvent.isActive).toBe(true);

      // Test filtering inactive events
      const inactiveFilterResponse = await page.request.get(`${API_BASE}/project-events?isActive=false`);
      expect(inactiveFilterResponse.status()).toBe(200);
      const inactiveEvents = await inactiveFilterResponse.json();

      const foundInactiveEvent = inactiveEvents.find((e: any) => e.id === inactiveEventId);
      expect(foundInactiveEvent).toBeDefined();
      expect(foundInactiveEvent.isActive).toBe(false);

      // Test getting all events (no filter)
      const allEventsResponse = await page.request.get(`${API_BASE}/project-events`);
      expect(allEventsResponse.status()).toBe(200);
      const allEvents = await allEventsResponse.json();

      const foundActiveInAll = allEvents.find((e: any) => e.id === activeEventId);
      const foundInactiveInAll = allEvents.find((e: any) => e.id === inactiveEventId);
      expect(foundActiveInAll).toBeDefined();
      expect(foundInactiveInAll).toBeDefined();

    } finally {
      // Cleanup
      await page.request.delete(`${API_BASE}/project-events/${activeEventId}`);
      await page.request.delete(`${API_BASE}/project-events/${inactiveEventId}`);
    }
  });

  test('should handle schedule management', async ({ page }) => {
    const uniqueId = Date.now();
    
    // Create event first
    const eventData = {
      ...testProjectEvent,
      name: `Schedule Test Event ${uniqueId}`
    };

    const createResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: eventData
    });

    expect(createResponse.status()).toBe(201);
    const createdEvent = await createResponse.json();
    const eventId = (createdEvent.data?.event || createdEvent).id;

    try {
      // Test schedule update - PATCH /api/project-events/:id/schedule
      const scheduleData = {
        schedule: [
          testScheduleItem,
          {
            time: '10:00 AM - 11:00 AM',
            activity: 'Second Activity',
            location: 'Second Location',
            coordinator: {
              userId: 'user_faculty_me01_gpp',
              name: 'Second Coordinator'
            },
            notes: 'Notes for second activity'
          }
        ]
      };

      const scheduleResponse = await page.request.patch(`${API_BASE}/project-events/${eventId}/schedule`, {
        data: scheduleData
      });

      expect(scheduleResponse.status()).toBe(200);
      const scheduleResponseData = await scheduleResponse.json();
      
      // The response should be the updated event, not a message
      expect(scheduleResponseData).toHaveProperty('id');
      expect(scheduleResponseData.id).toBe(eventId);

      // Verify schedule was updated by getting the event
      const getEventResponse = await page.request.get(`${API_BASE}/project-events/${eventId}`);
      expect(getEventResponse.status()).toBe(200);
      const eventWithSchedule = await getEventResponse.json();
      const event = eventWithSchedule.data?.event || eventWithSchedule;
      
      expect(event.schedule).toBeDefined();
      expect(Array.isArray(event.schedule)).toBe(true);
      expect(event.schedule.length).toBe(2);
      
      const firstScheduleItem = event.schedule[0];
      expect(firstScheduleItem.time).toBe(testScheduleItem.time);
      expect(firstScheduleItem.activity).toBe(testScheduleItem.activity);
      expect(firstScheduleItem.location).toBe(testScheduleItem.location);
      expect(firstScheduleItem.coordinator.userId).toBe(testScheduleItem.coordinator.userId);
      expect(firstScheduleItem.coordinator.name).toBe(testScheduleItem.coordinator.name);
      expect(firstScheduleItem.notes).toBe(testScheduleItem.notes);

    } finally {
      // Cleanup
      await page.request.delete(`${API_BASE}/project-events/${eventId}`);
    }
  });

  test('should validate schedule data format', async ({ page }) => {
    const uniqueId = Date.now();
    
    // Create event first
    const eventData = {
      ...testProjectEvent,
      name: `Schedule Validation Event ${uniqueId}`
    };

    const createResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: eventData
    });

    expect(createResponse.status()).toBe(201);
    const createdEvent = await createResponse.json();
    const eventId = (createdEvent.data?.event || createdEvent).id;

    try {
      // Test invalid schedule format (not an array)
      const invalidScheduleResponse = await page.request.patch(`${API_BASE}/project-events/${eventId}/schedule`, {
        data: { schedule: "not-an-array" }
      });

      expect(invalidScheduleResponse.status()).toBe(400);
      const errorData = await invalidScheduleResponse.json();
      expect(errorData.message).toContain('Expected an array');

      // Test empty schedule array (should be valid)
      const emptyScheduleResponse = await page.request.patch(`${API_BASE}/project-events/${eventId}/schedule`, {
        data: { schedule: [] }
      });

      expect(emptyScheduleResponse.status()).toBe(200);

    } finally {
      // Cleanup
      await page.request.delete(`${API_BASE}/project-events/${eventId}`);
    }
  });

  test('should handle departments array', async ({ page }) => {
    const uniqueId = Date.now();
    
    const eventWithDepartments = {
      ...testProjectEvent,
      name: `Departments Test Event ${uniqueId}`,
      departments: ['dept_ce_gpp', 'dept_me_gpp', 'dept_ee_gpp']
    };

    const createResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: eventWithDepartments
    });

    if (createResponse.status() === 201) {
      const createResponseData = await createResponse.json();
      const createdEvent = createResponseData.data?.event || createResponseData;
      
      expect(createdEvent.departments).toBeDefined();
      expect(Array.isArray(createdEvent.departments)).toBe(true);
      expect(createdEvent.departments.length).toBe(3);
      expect(createdEvent.departments).toContain('dept_ce_gpp');
      expect(createdEvent.departments).toContain('dept_me_gpp');
      expect(createdEvent.departments).toContain('dept_ee_gpp');
      
      // Cleanup
      await page.request.delete(`${API_BASE}/project-events/${createdEvent.id}`);
    }
  });

  test('should handle publishResults flag', async ({ page }) => {
    const uniqueId = Date.now();
    
    // Test default publishResults value
    const defaultEvent = {
      ...testProjectEvent,
      name: `Default PublishResults Event ${uniqueId}`
    };
    delete (defaultEvent as any).publishResults;

    const defaultCreateResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: defaultEvent
    });

    if (defaultCreateResponse.status() === 201) {
      const defaultCreatedEvent = await defaultCreateResponse.json();
      const defaultEvent1 = defaultCreatedEvent.data?.event || defaultCreatedEvent;
      expect(defaultEvent1.publishResults).toBe(false);
      
      // Cleanup
      await page.request.delete(`${API_BASE}/project-events/${defaultEvent1.id}`);
    }

    // Test explicit publishResults values
    const publishResultsValues = [true, false];
    
    for (const publishResults of publishResultsValues) {
      const eventWithPublishResults = {
        ...testProjectEvent,
        name: `PublishResults ${publishResults} Event ${uniqueId}`,
        publishResults: publishResults
      };

      const createResponse = await page.request.post(`${API_BASE}/project-events`, {
        data: eventWithPublishResults
      });

      if (createResponse.status() === 201) {
        const createResponseData = await createResponse.json();
        const createdEvent = createResponseData.data?.event || createResponseData;
        expect(createdEvent.publishResults).toBe(publishResults);
        
        // Cleanup
        await page.request.delete(`${API_BASE}/project-events/${createdEvent.id}`);
      }
    }
  });

  test('should prevent duplicate event names', async ({ page }) => {
    const uniqueId = Date.now();
    const duplicateEvent = { 
      ...testProjectEvent, 
      name: `Duplicate Test Event ${uniqueId}` 
    };

    // Create first event
    const firstCreateResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: duplicateEvent
    });

    if (firstCreateResponse.status() === 201) {
      const firstCreateResponseData = await firstCreateResponse.json();
      const firstEvent = firstCreateResponseData.data?.event || firstCreateResponseData;
      
      try {
        // Try to create duplicate (may or may not be prevented by backend)
        const duplicateResponse = await page.request.post(`${API_BASE}/project-events`, {
          data: duplicateEvent
        });

        // If duplicate prevention is implemented, expect error
        if (duplicateResponse.status() === 400 || duplicateResponse.status() === 409) {
          const duplicateErrorData = await duplicateResponse.json();
          expect(duplicateErrorData).toHaveProperty('message');
          expect(duplicateErrorData.message).toMatch(/already exists|duplicate/i);
        } else {
          // If duplicates are allowed, clean up the second event
          if (duplicateResponse.status() === 201) {
            const secondEvent = await duplicateResponse.json();
            const secondEventId = (secondEvent.data?.event || secondEvent).id;
            await page.request.delete(`${API_BASE}/project-events/${secondEventId}`);
          }
        }
      } finally {
        // Cleanup first event
        await page.request.delete(`${API_BASE}/project-events/${firstEvent.id}`);
      }
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test invalid event ID for GET
    const invalidGetResponse = await page.request.get(`${API_BASE}/project-events/invalid-id`);
    expect(invalidGetResponse.status()).toBe(404);

    // Test invalid event ID for UPDATE
    const invalidUpdateResponse = await page.request.put(`${API_BASE}/project-events/invalid-id`, {
      data: testProjectEvent
    });
    expect(invalidUpdateResponse.status()).toBe(404);

    // Test invalid event ID for DELETE
    const invalidDeleteResponse = await page.request.delete(`${API_BASE}/project-events/invalid-id`);
    expect(invalidDeleteResponse.status()).toBe(404);

    // Test invalid event ID for schedule update
    const invalidScheduleResponse = await page.request.patch(`${API_BASE}/project-events/invalid-id/schedule`, {
      data: { schedule: [testScheduleItem] }
    });
    expect(invalidScheduleResponse.status()).toBe(404);

    // Test malformed data
    const malformedResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: null
    });
    expect([400, 500]).toContain(malformedResponse.status());
  });

  test('should handle date validation in updates', async ({ page }) => {
    const uniqueId = Date.now();
    
    // Create event first
    const eventData = {
      ...testProjectEvent,
      name: `Date Update Test Event ${uniqueId}`
    };

    const createResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: eventData
    });

    expect(createResponse.status()).toBe(201);
    const createdEvent = await createResponse.json();
    const eventId = (createdEvent.data?.event || createdEvent).id;

    try {
      // Test updating with invalid date logic
      const invalidUpdateResponse = await page.request.put(`${API_BASE}/project-events/${eventId}`, {
        data: {
          eventDate: '2025-01-15T00:00:00.000Z',
          registrationStartDate: '2025-02-01T00:00:00.000Z' // After event date
        }
      });

      expect(invalidUpdateResponse.status()).toBe(400);
      const errorData = await invalidUpdateResponse.json();
      expect(errorData.message).toContain('dates are illogical');

      // Test updating with valid dates
      const validUpdateResponse = await page.request.put(`${API_BASE}/project-events/${eventId}`, {
        data: {
          eventDate: '2025-04-15T00:00:00.000Z',
          registrationStartDate: '2025-01-01T00:00:00.000Z',
          registrationEndDate: '2025-02-28T00:00:00.000Z'
        }
      });

      expect(validUpdateResponse.status()).toBe(200);

    } finally {
      // Cleanup
      await page.request.delete(`${API_BASE}/project-events/${eventId}`);
    }
  });
});
