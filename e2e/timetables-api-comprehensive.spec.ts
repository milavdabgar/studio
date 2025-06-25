import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Timetables API - In-Memory Storage Endpoints
 * Priority: Timetables Module (Critical for Academic Scheduling Management)
 * 
 * This test suite covers the timetables API endpoints that use in-memory storage
 * and are critical for the MongoDB migration. Tests ensure data integrity
 * and business logic preservation during migration.
 */

// Base URL for API endpoints
const API_BASE = '/api';

// Test data for timetables
const generateUniqueId = () => `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const testTimetableEntry = {
  dayOfWeek: 'Monday' as const,
  startTime: '09:00',
  endTime: '10:00',
  courseId: 'course_cs101_test',
  facultyId: 'faculty_test_001',
  roomId: 'room_a101_test',
  entryType: 'lecture' as const,
  notes: 'Computer Science Fundamentals'
};

const testTimetable = {
  name: 'E2E Test Timetable',
  academicYear: '2024-25',
  semester: 1,
  programId: 'prog_test_e2e',
  batchId: 'batch_test_e2e',
  version: '1.0',
  status: 'draft' as const,
  effectiveDate: '2024-07-15T00:00:00.000Z',
  entries: [
    testTimetableEntry,
    {
      dayOfWeek: 'Tuesday' as const,
      startTime: '10:00',
      endTime: '11:00',
      courseId: 'course_math101_test',
      facultyId: 'faculty_test_002',
      roomId: 'room_b202_test',
      entryType: 'lecture' as const,
      notes: 'Mathematics for Engineers'
    },
    {
      dayOfWeek: 'Wednesday' as const,
      startTime: '14:00',
      endTime: '17:00',
      courseId: 'course_cs101_test',
      facultyId: 'faculty_test_001',
      roomId: 'room_lab_001_test',
      entryType: 'lab' as const,
      notes: 'Programming Lab Session'
    }
  ]
};

const testTimetableUpdate = {
  name: 'Updated E2E Test Timetable',
  version: '1.1',
  status: 'published' as const,
  effectiveDate: '2024-08-01T00:00:00.000Z'
};

test.describe('Timetables API - Critical In-Memory Storage', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that initializes the app context
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should create, read, update, and delete timetables (CRUD)', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const timetableData = {
      ...testTimetable,
      name: `CRUD Test Timetable ${uniqueId}`,
      programId: `prog_crud_${uniqueId}`,
      batchId: `batch_crud_${uniqueId}`
    };

    let createdTimetableId: string;

    // Test CREATE - POST /api/timetables
    const createResponse = await page.request.post(`${API_BASE}/timetables`, {
      data: timetableData
    });

    expect(createResponse.status()).toBe(201);
    const createdTimetable = await createResponse.json();
    
    expect(createdTimetable).toHaveProperty('id');
    expect(createdTimetable.name).toBe(timetableData.name);
    expect(createdTimetable.academicYear).toBe(timetableData.academicYear);
    expect(createdTimetable.semester).toBe(timetableData.semester);
    expect(createdTimetable.programId).toBe(timetableData.programId);
    expect(createdTimetable.status).toBe(timetableData.status);
    expect(createdTimetable.entries).toBeDefined();
    expect(Array.isArray(createdTimetable.entries)).toBe(true);
    expect(createdTimetable.entries.length).toBe(timetableData.entries.length);
    expect(createdTimetable).toHaveProperty('createdAt');
    expect(createdTimetable).toHaveProperty('updatedAt');
    
    createdTimetableId = createdTimetable.id;

    try {
      // Test READ ALL - GET /api/timetables
      const getAllResponse = await page.request.get(`${API_BASE}/timetables`);
      expect(getAllResponse.status()).toBe(200);
      
      const allTimetables = await getAllResponse.json();
      expect(Array.isArray(allTimetables)).toBe(true);
      
      const foundTimetable = allTimetables.find((t: any) => t.id === createdTimetableId);
      expect(foundTimetable).toBeDefined();
      expect(foundTimetable.name).toBe(timetableData.name);

      // Test READ ONE - GET /api/timetables/:id
      const getOneResponse = await page.request.get(`${API_BASE}/timetables/${createdTimetableId}`);
      expect(getOneResponse.status()).toBe(200);
      
      const getTimetable = await getOneResponse.json();
      expect(getTimetable.id).toBe(createdTimetableId);
      expect(getTimetable.name).toBe(timetableData.name);
      expect(getTimetable.entries.length).toBe(timetableData.entries.length);

      // Test UPDATE - PUT /api/timetables/:id
      const updateData = {
        ...timetableData,
        ...testTimetableUpdate
      };

      const updateResponse = await page.request.put(`${API_BASE}/timetables/${createdTimetableId}`, {
        data: updateData
      });

      expect(updateResponse.status()).toBe(200);
      const updatedTimetable = await updateResponse.json();
      expect(updatedTimetable.id).toBe(createdTimetableId);
      expect(updatedTimetable.name).toBe(testTimetableUpdate.name);
      expect(updatedTimetable.version).toBe(testTimetableUpdate.version);
      expect(updatedTimetable.status).toBe(testTimetableUpdate.status);

      // Verify update persisted
      const getUpdatedResponse = await page.request.get(`${API_BASE}/timetables/${createdTimetableId}`);
      expect(getUpdatedResponse.status()).toBe(200);
      const getUpdatedTimetable = await getUpdatedResponse.json();
      expect(getUpdatedTimetable.name).toBe(testTimetableUpdate.name);
      expect(getUpdatedTimetable.version).toBe(testTimetableUpdate.version);

      // Test DELETE - DELETE /api/timetables/:id
      const deleteResponse = await page.request.delete(`${API_BASE}/timetables/${createdTimetableId}`);
      expect(deleteResponse.status()).toBe(200);

      // Verify deletion
      const getDeletedResponse = await page.request.get(`${API_BASE}/timetables/${createdTimetableId}`);
      expect(getDeletedResponse.status()).toBe(404);

    } catch (error) {
      // Cleanup in case of error
      await page.request.delete(`${API_BASE}/timetables/${createdTimetableId}`);
      throw error;
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Test missing name
    const missingName = { ...testTimetable } as any;
    delete missingName.name;

    const missingNameResponse = await page.request.post(`${API_BASE}/timetables`, {
      data: missingName
    });

    expect(missingNameResponse.status()).toBe(400);
    const errorData1 = await missingNameResponse.json();
    expect(errorData1).toHaveProperty('message');
    expect(errorData1.message).toContain('required fields');

    // Test missing programId
    const missingProgramId = { ...testTimetable } as any;
    delete missingProgramId.programId;

    const missingProgramResponse = await page.request.post(`${API_BASE}/timetables`, {
      data: missingProgramId
    });

    expect(missingProgramResponse.status()).toBe(400);
    const errorData2 = await missingProgramResponse.json();
    expect(errorData2).toHaveProperty('message');
    expect(errorData2.message).toContain('required fields');

    // Test missing academicYear
    const missingAcademicYear = { ...testTimetable } as any;
    delete missingAcademicYear.academicYear;

    const missingYearResponse = await page.request.post(`${API_BASE}/timetables`, {
      data: missingAcademicYear
    });

    expect(missingYearResponse.status()).toBe(400);
    const errorData3 = await missingYearResponse.json();
    expect(errorData3).toHaveProperty('message');
    expect(errorData3.message).toContain('required fields');

    // Test missing semester
    const missingSemester = { ...testTimetable } as any;
    delete missingSemester.semester;

    const missingSemesterResponse = await page.request.post(`${API_BASE}/timetables`, {
      data: missingSemester
    });

    expect(missingSemesterResponse.status()).toBe(400);
    const errorData4 = await missingSemesterResponse.json();
    expect(errorData4).toHaveProperty('message');
    expect(errorData4.message).toContain('required fields');
  });

  test('should validate timetable status values', async ({ page }) => {
    const validStatuses = ['draft', 'published', 'archived', 'inactive'];
    const uniqueId = generateUniqueId();
    
    for (let i = 0; i < validStatuses.length; i++) {
      const status = validStatuses[i];
      const timetableWithStatus = {
        ...testTimetable,
        name: `Status Test Timetable ${status} ${uniqueId}`,
        programId: `prog_status_${uniqueId}_${i}`,
        status: status
      };

      const createResponse = await page.request.post(`${API_BASE}/timetables`, {
        data: timetableWithStatus
      });

      expect(createResponse.status()).toBe(201);
      const createdTimetable = await createResponse.json();
      expect(createdTimetable.status).toBe(status);
      
      // Cleanup
      await page.request.delete(`${API_BASE}/timetables/${createdTimetable.id}`);
    }
  });

  test('should validate timetable entry structure', async ({ page }) => {
    const uniqueId = generateUniqueId();
    
    // Test timetable with valid entries
    const timetableWithEntries = {
      ...testTimetable,
      name: `Entries Test Timetable ${uniqueId}`,
      programId: `prog_entries_${uniqueId}`,
      entries: [
        {
          dayOfWeek: 'Monday',
          startTime: '09:00',
          endTime: '10:00',
          courseId: 'course_test_001',
          facultyId: 'faculty_test_001',
          roomId: 'room_test_001',
          entryType: 'lecture',
          notes: 'Test lecture entry'
        },
        {
          dayOfWeek: 'Tuesday',
          startTime: '14:00',
          endTime: '17:00',
          courseId: 'course_test_002',
          facultyId: 'faculty_test_002',
          roomId: 'room_lab_001',
          entryType: 'lab',
          notes: 'Test lab entry'
        }
      ]
    };

    const createResponse = await page.request.post(`${API_BASE}/timetables`, {
      data: timetableWithEntries
    });

    expect(createResponse.status()).toBe(201);
    const createdTimetable = await createResponse.json();
    
    expect(createdTimetable.entries).toBeDefined();
    expect(Array.isArray(createdTimetable.entries)).toBe(true);
    expect(createdTimetable.entries.length).toBe(2);
    
    // Validate entry structure
    const firstEntry = createdTimetable.entries[0];
    expect(firstEntry.dayOfWeek).toBe('Monday');
    expect(firstEntry.startTime).toBe('09:00');
    expect(firstEntry.endTime).toBe('10:00');
    expect(firstEntry.courseId).toBe('course_test_001');
    expect(firstEntry.facultyId).toBe('faculty_test_001');
    expect(firstEntry.roomId).toBe('room_test_001');
    expect(firstEntry.entryType).toBe('lecture');
    expect(firstEntry.notes).toBe('Test lecture entry');
    
    const secondEntry = createdTimetable.entries[1];
    expect(secondEntry.entryType).toBe('lab');
    expect(secondEntry.dayOfWeek).toBe('Tuesday');
    
    // Cleanup
    await page.request.delete(`${API_BASE}/timetables/${createdTimetable.id}`);
  });

  test('should validate day of week values', async ({ page }) => {
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const uniqueId = generateUniqueId();
    
    for (let i = 0; i < validDays.length; i++) {
      const day = validDays[i];
      const timetableWithDay = {
        ...testTimetable,
        name: `Day Test Timetable ${day} ${uniqueId}`,
        programId: `prog_day_${uniqueId}_${i}`,
        entries: [
          {
            ...testTimetableEntry,
            dayOfWeek: day
          }
        ]
      };

      const createResponse = await page.request.post(`${API_BASE}/timetables`, {
        data: timetableWithDay
      });

      expect(createResponse.status()).toBe(201);
      const createdTimetable = await createResponse.json();
      expect(createdTimetable.entries[0].dayOfWeek).toBe(day);
      
      // Cleanup
      await page.request.delete(`${API_BASE}/timetables/${createdTimetable.id}`);
    }
  });

  test('should validate entry type values', async ({ page }) => {
    const validEntryTypes = ['lecture', 'lab', 'tutorial', 'seminar', 'exam', 'break'];
    const uniqueId = generateUniqueId();
    
    for (let i = 0; i < validEntryTypes.length; i++) {
      const entryType = validEntryTypes[i];
      const timetableWithEntryType = {
        ...testTimetable,
        name: `Entry Type Test Timetable ${entryType} ${uniqueId}`,
        programId: `prog_entry_${uniqueId}_${i}`,
        entries: [
          {
            ...testTimetableEntry,
            entryType: entryType
          }
        ]
      };

      const createResponse = await page.request.post(`${API_BASE}/timetables`, {
        data: timetableWithEntryType
      });

      expect(createResponse.status()).toBe(201);
      const createdTimetable = await createResponse.json();
      expect(createdTimetable.entries[0].entryType).toBe(entryType);
      
      // Cleanup  
      await page.request.delete(`${API_BASE}/timetables/${createdTimetable.id}`);
    }
  });

  test('should validate time format and logic', async ({ page }) => {
    const uniqueId = generateUniqueId();
    
    // Test valid time formats
    const validTimeEntries = [
      { startTime: '08:00', endTime: '09:00' },
      { startTime: '13:30', endTime: '15:00' },
      { startTime: '16:45', endTime: '18:15' }
    ];

    for (let i = 0; i < validTimeEntries.length; i++) {
      const timeEntry = validTimeEntries[i];
      const timetableWithTime = {
        ...testTimetable,
        name: `Time Test Timetable ${i} ${uniqueId}`,
        programId: `prog_time_${uniqueId}_${i}`,
        entries: [
          {
            ...testTimetableEntry,
            startTime: timeEntry.startTime,
            endTime: timeEntry.endTime
          }
        ]
      };

      const createResponse = await page.request.post(`${API_BASE}/timetables`, {
        data: timetableWithTime
      });

      expect(createResponse.status()).toBe(201);
      const createdTimetable = await createResponse.json();
      expect(createdTimetable.entries[0].startTime).toBe(timeEntry.startTime);
      expect(createdTimetable.entries[0].endTime).toBe(timeEntry.endTime);
      
      // Cleanup
      await page.request.delete(`${API_BASE}/timetables/${createdTimetable.id}`);
    }
  });

  test('should validate semester values', async ({ page }) => {
    const validSemesters = [1, 2, 3, 4, 5, 6, 7, 8];
    const uniqueId = generateUniqueId();
    
    for (let i = 0; i < validSemesters.length; i++) {
      const semester = validSemesters[i];
      const timetableWithSemester = {
        ...testTimetable,
        name: `Semester Test Timetable ${semester} ${uniqueId}`,
        programId: `prog_sem_${uniqueId}_${i}`,
        semester: semester
      };

      const createResponse = await page.request.post(`${API_BASE}/timetables`, {
        data: timetableWithSemester
      });

      expect(createResponse.status()).toBe(201);
      const createdTimetable = await createResponse.json();
      expect(createdTimetable.semester).toBe(semester);
      
      // Cleanup
      await page.request.delete(`${API_BASE}/timetables/${createdTimetable.id}`);
    }
  });

  test('should validate academic year format', async ({ page }) => {
    const validAcademicYears = ['2023-24', '2024-25', '2025-26', '2026-27'];
    const uniqueId = generateUniqueId();
    
    for (let i = 0; i < validAcademicYears.length; i++) {
      const academicYear = validAcademicYears[i];
      const timetableWithYear = {
        ...testTimetable,
        name: `Academic Year Test Timetable ${academicYear} ${uniqueId}`,
        programId: `prog_year_${uniqueId}_${i}`,
        academicYear: academicYear
      };

      const createResponse = await page.request.post(`${API_BASE}/timetables`, {
        data: timetableWithYear
      });

      expect(createResponse.status()).toBe(201);
      const createdTimetable = await createResponse.json();
      expect(createdTimetable.academicYear).toBe(academicYear);
      
      // Cleanup
      await page.request.delete(`${API_BASE}/timetables/${createdTimetable.id}`);
    }
  });

  test('should handle effective date validation', async ({ page }) => {
    const uniqueId = generateUniqueId();
    
    // Test valid date formats
    const validDates = [
      '2024-07-15T00:00:00.000Z',
      '2024-08-01T00:00:00.000Z',
      '2024-12-31T23:59:59.999Z'
    ];

    for (let i = 0; i < validDates.length; i++) {
      const effectiveDate = validDates[i];
      const timetableWithDate = {
        ...testTimetable,
        name: `Date Test Timetable ${i} ${uniqueId}`,
        programId: `prog_date_${uniqueId}_${i}`,
        effectiveDate: effectiveDate
      };

      const createResponse = await page.request.post(`${API_BASE}/timetables`, {
        data: timetableWithDate
      });

      expect(createResponse.status()).toBe(201);
      const createdTimetable = await createResponse.json();
      expect(createdTimetable.effectiveDate).toBe(effectiveDate);
      
      // Cleanup
      await page.request.delete(`${API_BASE}/timetables/${createdTimetable.id}`);
    }
  });

  test('should handle version management', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const baseData = {
      ...testTimetable,
      name: `Version Test Timetable ${uniqueId}`,
      programId: `prog_version_${uniqueId}`
    };

    const versions = ['1.0', '1.1', '2.0', '2.1'];
    const createdIds: string[] = [];

    try {
      // Create multiple versions of the same timetable
      for (let i = 0; i < versions.length; i++) {
        const version = versions[i];
        const versionedTimetable = {
          ...baseData,
          name: `${baseData.name} v${version}`,
          version: version,
          batchId: `batch_version_${uniqueId}_${i}` // Different batchId for each version
        };

        const createResponse = await page.request.post(`${API_BASE}/timetables`, {
          data: versionedTimetable
        });

        expect(createResponse.status()).toBe(201);
        const createdTimetable = await createResponse.json();
        expect(createdTimetable.version).toBe(version);
        createdIds.push(createdTimetable.id);
      }

      // Verify all versions exist
      const getAllResponse = await page.request.get(`${API_BASE}/timetables`);
      expect(getAllResponse.status()).toBe(200);
      
      const allTimetables = await getAllResponse.json();
      const createdTimetables = allTimetables.filter((t: any) => createdIds.includes(t.id));
      expect(createdTimetables.length).toBe(versions.length);

      // Verify versions are correct
      createdTimetables.forEach((timetable: any) => {
        expect(versions).toContain(timetable.version);
      });

    } finally {
      // Cleanup all created timetables
      for (const id of createdIds) {
        await page.request.delete(`${API_BASE}/timetables/${id}`);
      }
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test invalid timetable ID for GET
    const invalidGetResponse = await page.request.get(`${API_BASE}/timetables/invalid-id`);
    expect(invalidGetResponse.status()).toBe(404);

    // Test invalid timetable ID for UPDATE
    const invalidUpdateResponse = await page.request.put(`${API_BASE}/timetables/invalid-id`, {
      data: testTimetable
    });
    expect(invalidUpdateResponse.status()).toBe(404);

    // Test invalid timetable ID for DELETE
    const invalidDeleteResponse = await page.request.delete(`${API_BASE}/timetables/invalid-id`);
    expect(invalidDeleteResponse.status()).toBe(404);

    // Test malformed data
    const malformedResponse = await page.request.post(`${API_BASE}/timetables`, {
      data: null
    });
    expect([400, 500]).toContain(malformedResponse.status());

    // Test empty entries array
    const emptyEntriesResponse = await page.request.post(`${API_BASE}/timetables`, {
      data: {
        ...testTimetable,
        entries: []
      }
    });
    // Should still succeed with empty entries
    expect(emptyEntriesResponse.status()).toBe(201);
    
    if (emptyEntriesResponse.status() === 201) {
      const createdTimetable = await emptyEntriesResponse.json();
      expect(Array.isArray(createdTimetable.entries)).toBe(true);
      expect(createdTimetable.entries.length).toBe(0);
      
      // Cleanup
      await page.request.delete(`${API_BASE}/timetables/${createdTimetable.id}`);
    }
  });

  test('should handle complex timetable with multiple entries per day', async ({ page }) => {
    const uniqueId = generateUniqueId();
    
    const complexTimetable = {
      ...testTimetable,
      name: `Complex Timetable ${uniqueId}`,
      programId: `prog_complex_${uniqueId}`,
      entries: [
        // Monday
        { dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', courseId: 'course_001', facultyId: 'faculty_001', roomId: 'room_001', entryType: 'lecture' },
        { dayOfWeek: 'Monday', startTime: '10:00', endTime: '11:00', courseId: 'course_002', facultyId: 'faculty_002', roomId: 'room_002', entryType: 'lecture' },
        { dayOfWeek: 'Monday', startTime: '14:00', endTime: '17:00', courseId: 'course_001', facultyId: 'faculty_001', roomId: 'room_lab_001', entryType: 'lab' },
        
        // Tuesday  
        { dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '10:00', courseId: 'course_003', facultyId: 'faculty_003', roomId: 'room_003', entryType: 'lecture' },
        { dayOfWeek: 'Tuesday', startTime: '11:00', endTime: '12:00', courseId: 'course_004', facultyId: 'faculty_004', roomId: 'room_004', entryType: 'tutorial' },
        
        // Break
        { dayOfWeek: 'Wednesday', startTime: '11:00', endTime: '11:15', courseId: '', facultyId: '', roomId: '', entryType: 'break', notes: 'Tea Break' }
      ]
    };

    const createResponse = await page.request.post(`${API_BASE}/timetables`, {
      data: complexTimetable
    });

    expect(createResponse.status()).toBe(201);
    const createdTimetable = await createResponse.json();
    
    expect(createdTimetable.entries.length).toBe(6);
    
    // Verify different days
    const mondayEntries = createdTimetable.entries.filter((e: any) => e.dayOfWeek === 'Monday');
    const tuesdayEntries = createdTimetable.entries.filter((e: any) => e.dayOfWeek === 'Tuesday');
    const wednesdayEntries = createdTimetable.entries.filter((e: any) => e.dayOfWeek === 'Wednesday');
    
    expect(mondayEntries.length).toBe(3);
    expect(tuesdayEntries.length).toBe(2);
    expect(wednesdayEntries.length).toBe(1);
    
    // Verify different entry types
    const lectures = createdTimetable.entries.filter((e: any) => e.entryType === 'lecture');
    const labs = createdTimetable.entries.filter((e: any) => e.entryType === 'lab');
    const tutorials = createdTimetable.entries.filter((e: any) => e.entryType === 'tutorial');
    const breaks = createdTimetable.entries.filter((e: any) => e.entryType === 'break');
    
    expect(lectures.length).toBe(3);
    expect(labs.length).toBe(1);
    expect(tutorials.length).toBe(1);
    expect(breaks.length).toBe(1);
    
    // Verify break entry
    const breakEntry = breaks[0];
    expect(breakEntry.notes).toBe('Tea Break');
    expect(breakEntry.dayOfWeek).toBe('Wednesday');
    
    // Cleanup
    await page.request.delete(`${API_BASE}/timetables/${createdTimetable.id}`);
  });
});
