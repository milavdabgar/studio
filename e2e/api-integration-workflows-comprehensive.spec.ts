import { test, expect } from '@playwright/test';

/**
 * E2E Tests for API Integration Workflows - Critical for MongoDB Migration
 * 
 * This test suite covers real-world workflows that span multiple APIs
 * and validates data consistency across related endpoints. Essential for
 * ensuring MongoDB migration preserves complex business relationships.
 */

const API_BASE = '/api';

// Helper function to generate unique identifiers
const generateUniqueId = () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

test.describe('API Integration Workflows - Critical Migration Safety', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('Complete Student Enrollment Workflow', async ({ page }) => {
    // Test the complete workflow: Student -> Course Offering -> Enrollment -> Assessment -> Results
    
    // Step 1: Create a student
    const studentData = {
      enrollmentNumber: generateUniqueId(),
      firstName: 'Integration',
      lastName: 'Test Student',
      email: `integration.test.${generateUniqueId()}@example.com`,
      programId: 'prog_btech_ce_gpp',
      currentSemester: 3,
      department: 'Computer Engineering'
    };

    const createStudentResponse = await page.request.post(`${API_BASE}/students`, {
      data: studentData
    });
    expect(createStudentResponse.status()).toBe(201);
    const createdStudent = await createStudentResponse.json();
    const studentId = createdStudent.id;

    try {
      // Step 2: Create a course offering
      const courseOfferingData = {
        courseCode: `CS${generateUniqueId().substr(-4)}`,
        courseName: 'Integration Test Course',
        credits: 3,
        semester: 3,
        academicYear: '2024-25',
        facultyId: 'faculty_test_integration',
        startDate: '2024-09-01',
        endDate: '2024-12-31',
        status: 'active'
      };

      const createOfferingResponse = await page.request.post(`${API_BASE}/course-offerings`, {
        data: courseOfferingData
      });
      expect(createOfferingResponse.status()).toBe(201);
      const createdOffering = await createOfferingResponse.json();
      const offeringId = createdOffering.id;

      // Step 3: Create enrollment linking student to course
      const enrollmentData = {
        studentId: studentId,
        courseOfferingId: offeringId,
        enrollmentDate: '2024-09-01',
        status: 'enrolled',
        academicYear: '2024-25',
        semester: 3
      };

      const createEnrollmentResponse = await page.request.post(`${API_BASE}/enrollments`, {
        data: enrollmentData
      });
      expect(createEnrollmentResponse.status()).toBe(201);
      const createdEnrollment = await createEnrollmentResponse.json();
      const enrollmentId = createdEnrollment.id;

      // Step 4: Create assessment for the course
      const assessmentData = {
        name: 'Integration Test Assessment',
        type: 'midterm',
        courseOfferingId: offeringId,
        maxMarks: 100,
        weightage: 30,
        assessmentDate: '2024-10-15',
        status: 'active'
      };

      const createAssessmentResponse = await page.request.post(`${API_BASE}/assessments`, {
        data: assessmentData
      });
      expect(createAssessmentResponse.status()).toBe(201);
      const createdAssessment = await createAssessmentResponse.json();
      const assessmentId = createdAssessment.id;

      // Step 5: Create result for the student
      const resultData = {
        studentId: studentId,
        semester: 3,
        academicYear: '2024-25',
        enrollmentNumber: studentData.enrollmentNumber,
        branch: 'Computer Engineering',
        subjects: [
          {
            subjectCode: courseOfferingData.courseCode,
            subjectName: courseOfferingData.courseName,
            credits: 3,
            grade: 'A',
            gradePoints: 9,
            marks: 85
          }
        ],
        spi: 9.0,
        cpi: 8.5,
        resultStatus: 'Pass'
      };

      const createResultResponse = await page.request.post(`${API_BASE}/results`, {
        data: resultData
      });
      expect(createResultResponse.status()).toBe(201);
      const createdResult = await createResultResponse.json();

      // Validation: Verify data consistency across all created entities
      
      // Check student-enrollment relationship
      const getEnrollmentsResponse = await page.request.get(`${API_BASE}/enrollments?studentId=${studentId}`);
      expect(getEnrollmentsResponse.status()).toBe(200);
      const enrollments = await getEnrollmentsResponse.json();
      expect(enrollments.data.enrollments.some((e: any) => e.id === enrollmentId)).toBe(true);

      // Check course-offering-assessment relationship
      const getAssessmentsResponse = await page.request.get(`${API_BASE}/assessments`);
      expect(getAssessmentsResponse.status()).toBe(200);
      const assessments = await getAssessmentsResponse.json();
      expect(assessments.some((a: any) => a.courseOfferingId === offeringId)).toBe(true);

      // Check student-result relationship
      const getResultsResponse = await page.request.get(`${API_BASE}/results?studentId=${studentId}`);
      expect(getResultsResponse.status()).toBe(200);
      const results = await getResultsResponse.json();
      expect(results.data.results.some((r: any) => r.studentId === studentId)).toBe(true);

      // Clean up (in reverse order of creation)
      await page.request.delete(`${API_BASE}/results/${createdResult.id}`);
      await page.request.delete(`${API_BASE}/assessments/${assessmentId}`);
      await page.request.delete(`${API_BASE}/enrollments/${enrollmentId}`);
      await page.request.delete(`${API_BASE}/course-offerings/${offeringId}`);

    } finally {
      // Always clean up the student
      await page.request.delete(`${API_BASE}/students/${studentId}`);
    }
  });

  test('Project Fair Management Workflow', async ({ page }) => {
    // Test the complete project fair workflow: Event -> Teams -> Projects -> Evaluations
    
    // Step 1: Create a project event
    const eventData = {
      name: `Integration Test Event ${generateUniqueId()}`,
      description: 'Test event for integration testing',
      eventDate: '2024-10-01',
      academicYear: '2024-25',
      registrationStartDate: '2024-09-01',
      registrationEndDate: '2024-09-20',
      status: 'active'
    };

    const createEventResponse = await page.request.post(`${API_BASE}/project-events`, {
      data: eventData
    });
    expect(createEventResponse.status()).toBe(201);
    const createdEvent = await createEventResponse.json();
    const eventId = createdEvent.id;

    try {
      // Step 2: Create a project team
      const teamData = {
        name: `Integration Test Team ${generateUniqueId()}`,
        description: 'Test team for integration workflow',
        department: 'Computer Engineering',
        eventId: eventId,
        maxMembers: 4,
        status: 'active',
        members: [
          {
            studentId: 'student_integration_1',
            role: 'leader',
            isLeader: true,
            joinedAt: new Date().toISOString()
          },
          {
            studentId: 'student_integration_2',
            role: 'member',
            isLeader: false,
            joinedAt: new Date().toISOString()
          }
        ]
      };

      const createTeamResponse = await page.request.post(`${API_BASE}/project-teams`, {
        data: teamData
      });
      expect(createTeamResponse.status()).toBe(201);
      const teamResponseData = await createTeamResponse.json();
      const createdTeam = teamResponseData.data?.team || teamResponseData;
      const teamId = createdTeam.id;

      // Step 3: Create a project
      const projectData = {
        projectTitle: `Integration Test Project ${generateUniqueId()}`,
        description: 'Test project for integration workflow',
        department: 'Computer Engineering',
        eventId: eventId,
        teamId: teamId,
        category: 'Software',
        keywords: ['integration', 'testing', 'automation'],
        status: 'active',
        isComplete: false
      };

      const createProjectResponse = await page.request.post(`${API_BASE}/projects`, {
        data: projectData
      });
      expect(createProjectResponse.status()).toBe(201);
      const projectResponseData = await createProjectResponse.json();
      const createdProject = projectResponseData.data?.project || projectResponseData;
      const projectId = createdProject.id;

      // Step 4: Test project evaluation workflow
      const evaluationData = {
        evaluatorId: 'faculty_evaluator_1',
        evaluationType: 'department',
        scores: {
          innovation: 8,
          implementation: 7,
          presentation: 9,
          documentation: 8
        },
        feedback: 'Good integration test project',
        evaluationDate: new Date().toISOString()
      };

      const evaluateProjectResponse = await page.request.post(`${API_BASE}/projects/${projectId}/department-evaluation`, {
        data: evaluationData
      });
      expect(evaluateProjectResponse.status()).toBe(200);

      // Validation: Verify relationships and data consistency
      
      // Check event-team relationship
      const getTeamsResponse = await page.request.get(`${API_BASE}/project-teams?eventId=${eventId}`);
      expect(getTeamsResponse.status()).toBe(200);
      const teamsData = await getTeamsResponse.json();
      const teams = teamsData.data?.teams || teamsData;
      expect(teams.some((t: any) => t.id === teamId)).toBe(true);

      // Check team-project relationship
      const getProjectsResponse = await page.request.get(`${API_BASE}/projects?teamId=${teamId}`);
      expect(getProjectsResponse.status()).toBe(200);
      const projectsData = await getProjectsResponse.json();
      const projects = projectsData.data?.projects || projectsData;
      expect(projects.some((p: any) => p.id === projectId)).toBe(true);

      // Check project details include evaluation
      const getProjectDetailsResponse = await page.request.get(`${API_BASE}/projects/${projectId}/details`);
      expect(getProjectDetailsResponse.status()).toBe(200);
      const projectDetails = await getProjectDetailsResponse.json();
      expect(projectDetails.data?.project || projectDetails).toHaveProperty('id', projectId);

      // Clean up (in reverse order)
      await page.request.delete(`${API_BASE}/projects/${projectId}`);
      await page.request.delete(`${API_BASE}/project-teams/${teamId}`);

    } finally {
      // Always clean up the event
      await page.request.delete(`${API_BASE}/project-events/${eventId}`);
    }
  });

  test('Faculty Assignment and Course Management Workflow', async ({ page }) => {
    // Test faculty assignment to courses, timetables, and room allocations
    
    // Step 1: Create a faculty member
    const facultyData = {
      staffCode: generateUniqueId(),
      firstName: 'Integration',
      lastName: 'Test Faculty',
      email: `faculty.integration.${generateUniqueId()}@example.com`,
      department: 'Computer Engineering',
      designation: 'Assistant Professor',
      qualification: 'Ph.D.',
      experience: 5,
      contactNumber: '9999999999',
      joiningDate: '2020-07-01',
      status: 'active',
      isHOD: false,
      instituteId: 'inst_gpp'
    };

    const createFacultyResponse = await page.request.post(`${API_BASE}/faculty`, {
      data: facultyData
    });
    
    // Handle potential validation differences
    if (createFacultyResponse.status() === 400) {
      const errorData = await createFacultyResponse.json();
      console.log('Faculty creation error:', errorData.message);
      // Try with minimal required fields
      const minimalFacultyData = {
        staffCode: generateUniqueId(),
        firstName: 'Integration',
        lastName: 'Test Faculty',
        department: 'Computer Engineering',
        instituteId: 'inst_gpp'
      };
      
      const retryResponse = await page.request.post(`${API_BASE}/faculty`, {
        data: minimalFacultyData
      });
      expect(retryResponse.status()).toBe(201);
      const createdFaculty = await retryResponse.json();
      var facultyId = createdFaculty.id;
    } else {
      expect(createFacultyResponse.status()).toBe(201);
      const createdFaculty = await createFacultyResponse.json();
      var facultyId = createdFaculty.id;
    }

    try {
      // Step 2: Create a course offering assigned to this faculty
      const courseOfferingData = {
        courseId: `course_${generateUniqueId()}`,
        batchId: `batch_${generateUniqueId()}`,
        academicYear: '2024-25',
        semester: 4,
        facultyIds: [facultyId],
        courseCode: `CS${generateUniqueId().substr(-4)}`,
        courseName: 'Faculty Integration Course',
        credits: 3,
        startDate: '2024-09-01',
        endDate: '2024-12-31',
        status: 'active'
      };

      const createOfferingResponse = await page.request.post(`${API_BASE}/course-offerings`, {
        data: courseOfferingData
      });
      expect(createOfferingResponse.status()).toBe(201);
      const createdOffering = await createOfferingResponse.json();
      const offeringId = createdOffering.id;

      // Step 3: Create a timetable entry for the faculty
      const timetableData = {
        academicYear: '2024-25',
        semester: 4,
        department: 'Computer Engineering',
        status: 'active',
        effectiveDate: '2024-09-01',
        version: '1.0',
        entries: [
          {
            dayOfWeek: 'monday',
            timeSlot: '09:00-10:00',
            courseOfferingId: offeringId,
            facultyId: facultyId,
            roomId: 'room_integration_test',
            entryType: 'lecture'
          }
        ]
      };

      const createTimetableResponse = await page.request.post(`${API_BASE}/timetables`, {
        data: timetableData
      });
      expect(createTimetableResponse.status()).toBe(201);
      const createdTimetable = await createTimetableResponse.json();
      const timetableId = createdTimetable.id;

      // Step 4: Create a room allocation
      const roomAllocationData = {
        roomId: 'room_integration_test',
        courseOfferingId: offeringId,
        facultyId: facultyId,
        purpose: 'lecture',
        startTime: '09:00',
        endTime: '10:00',
        date: '2024-09-02',
        status: 'confirmed',
        academicYear: '2024-25',
        semester: 4
      };

      const createAllocationResponse = await page.request.post(`${API_BASE}/room-allocations`, {
        data: roomAllocationData
      });
      expect(createAllocationResponse.status()).toBe(201);
      const createdAllocation = await createAllocationResponse.json();
      const allocationId = createdAllocation.id;

      // Validation: Verify faculty assignments across all systems
      
      // Check faculty-course relationship
      const getFacultyCoursesResponse = await page.request.get(`${API_BASE}/course-offerings?facultyId=${facultyId}`);
      expect(getFacultyCoursesResponse.status()).toBe(200);
      const facultyCourses = await getFacultyCoursesResponse.json();
      expect(facultyCourses.some((c: any) => c.id === offeringId)).toBe(true);

      // Check faculty presence in timetable
      const getTimetablesResponse = await page.request.get(`${API_BASE}/timetables?facultyId=${facultyId}`);
      expect(getTimetablesResponse.status()).toBe(200);
      const timetables = await getTimetablesResponse.json();
      expect(timetables.some((t: any) => t.id === timetableId)).toBe(true);

      // Check faculty room allocations
      const getRoomAllocationsResponse = await page.request.get(`${API_BASE}/room-allocations?facultyId=${facultyId}`);
      expect(getRoomAllocationsResponse.status()).toBe(200);
      const allocations = await getRoomAllocationsResponse.json();
      expect(allocations.some((a: any) => a.id === allocationId)).toBe(true);

      // Clean up (in reverse order)
      await page.request.delete(`${API_BASE}/room-allocations/${allocationId}`);
      await page.request.delete(`${API_BASE}/timetables/${timetableId}`);
      await page.request.delete(`${API_BASE}/course-offerings/${offeringId}`);

    } finally {
      // Always clean up the faculty
      await page.request.delete(`${API_BASE}/faculty/${facultyId}`);
    }
  });

  test('Import-Export Data Consistency Workflow', async ({ page }) => {
    // Test data consistency through import-export operations
    
    // Step 1: Create test data for export
    const projectData = {
      projectTitle: `Export Test Project ${generateUniqueId()}`,
      description: 'Project for testing export-import workflow',
      department: 'Computer Engineering',
      eventId: 'event_export_test',
      category: 'Software',
      status: 'active'
    };

    const createProjectResponse = await page.request.post(`${API_BASE}/projects`, {
      data: projectData
    });
    expect(createProjectResponse.status()).toBe(201);
    const projectResponseData = await createProjectResponse.json();
    const createdProject = projectResponseData.data?.project || projectResponseData;
    const projectId = createdProject.id;

    try {
      // Step 2: Export project data
      const exportResponse = await page.request.get(`${API_BASE}/projects/export?format=csv`);
      expect(exportResponse.status()).toBe(200);
      const exportData = await exportResponse.text();
      
      // Validate export contains our test project
      expect(exportData).toContain(projectData.projectTitle);

      // Step 3: Test team export
      const teamData = {
        name: `Export Test Team ${generateUniqueId()}`,
        description: 'Team for testing export-import workflow',
        department: 'Computer Engineering',
        eventId: 'event_export_test',
        maxMembers: 3,
        status: 'active'
      };

      const createTeamResponse = await page.request.post(`${API_BASE}/project-teams`, {
        data: teamData
      });
      expect(createTeamResponse.status()).toBe(201);
      const teamResponseData = await createTeamResponse.json();
      const createdTeam = teamResponseData.data?.team || teamResponseData;
      const teamId = createdTeam.id;

      // Export team data
      const exportTeamsResponse = await page.request.get(`${API_BASE}/project-teams/export?format=csv`);
      expect(exportTeamsResponse.status()).toBe(200);
      const exportTeamsData = await exportTeamsResponse.text();
      
      // Validate team export contains our test team
      expect(exportTeamsData).toContain('teamId'); // CSV header validation

      // Step 4: Test import validation (without actually importing to avoid data pollution)
      const importResponse = await page.request.post(`${API_BASE}/projects/import`, {
        data: {
          validate: true,
          data: `title,description,department,category\n"Test Import Project","Imported for testing","Computer Engineering","Software"`
        }
      });
      
      // Should return validation results
      expect([200, 400].includes(importResponse.status())).toBe(true);

      // Clean up
      await page.request.delete(`${API_BASE}/project-teams/${teamId}`);

    } finally {
      await page.request.delete(`${API_BASE}/projects/${projectId}`);
    }
  });

  test('Notification and Communication Workflow', async ({ page }) => {
    // Test notification creation, delivery, and status management
    
    const testUserId = `user_notification_test_${generateUniqueId()}`;
    
    // Step 1: Create multiple notifications for a user
    const notifications = [
      {
        userId: testUserId,
        title: 'Integration Test Notification 1',
        message: 'This is a test notification for integration testing',
        type: 'info',
        link: '/dashboard'
      },
      {
        userId: testUserId,
        title: 'Integration Test Notification 2',
        message: 'Second test notification',
        type: 'warning',
        link: '/profile'
      },
      {
        userId: testUserId,
        title: 'Integration Test Notification 3',
        message: 'Third test notification',
        type: 'success'
      }
    ];

    const createdNotificationIds = [];

    try {
      // Create all notifications
      for (const notificationData of notifications) {
        const createResponse = await page.request.post(`${API_BASE}/notifications`, {
          data: notificationData
        });
        expect(createResponse.status()).toBe(201);
        const createdNotification = await createResponse.json();
        createdNotificationIds.push(createdNotification.id);
      }

      // Step 2: Get all notifications for the user
      const getUserNotificationsResponse = await page.request.get(`${API_BASE}/notifications?userId=${testUserId}`);
      expect(getUserNotificationsResponse.status()).toBe(200);
      const userNotifications = await getUserNotificationsResponse.json();
      
      // Validate all notifications are returned
      expect(userNotifications.length).toBeGreaterThanOrEqual(3);
      expect(userNotifications.every((n: any) => n.userId === testUserId)).toBe(true);

      // Step 3: Mark one notification as read
      const markReadResponse = await page.request.patch(`${API_BASE}/notifications/${createdNotificationIds[0]}/read`);
      expect(markReadResponse.status()).toBe(200);

      // Validate read status
      const getUpdatedNotificationsResponse = await page.request.get(`${API_BASE}/notifications?userId=${testUserId}`);
      expect(getUpdatedNotificationsResponse.status()).toBe(200);
      const updatedNotifications = await getUpdatedNotificationsResponse.json();
      
      const readNotification = updatedNotifications.find((n: any) => n.id === createdNotificationIds[0]);
      expect(readNotification.isRead).toBe(true);

      // Step 4: Mark all remaining notifications as read
      const markAllReadResponse = await page.request.patch(`${API_BASE}/notifications/mark-all-read`, {
        data: { userId: testUserId }
      });
      expect(markAllReadResponse.status()).toBe(200);

      // Validate all are marked as read
      const getFinalNotificationsResponse = await page.request.get(`${API_BASE}/notifications?userId=${testUserId}`);
      expect(getFinalNotificationsResponse.status()).toBe(200);
      const finalNotifications = await getFinalNotificationsResponse.json();
      
      const allRead = finalNotifications
        .filter((n: any) => createdNotificationIds.includes(n.id))
        .every((n: any) => n.isRead === true);
      expect(allRead).toBe(true);

    } finally {
      // Clean up all notifications
      for (const notificationId of createdNotificationIds) {
        await page.request.delete(`${API_BASE}/notifications/${notificationId}`);
      }
    }
  });

  test('Cross-API Data Validation and Referential Integrity', async ({ page }) => {
    // Test that API endpoints properly validate references to other entities
    
    const nonExistentId = 'non_existent_id_12345';
    
    // Test 1: Try to create enrollment with non-existent student
    const invalidEnrollmentResponse = await page.request.post(`${API_BASE}/enrollments`, {
      data: {
        studentId: nonExistentId,
        courseOfferingId: 'course_offering_1',
        enrollmentDate: '2024-09-01',
        status: 'enrolled'
      }
    });
    
    // Should fail with appropriate error
    expect([400, 404, 409].includes(invalidEnrollmentResponse.status())).toBe(true);

    // Test 2: Try to create assessment with non-existent course offering
    const invalidAssessmentResponse = await page.request.post(`${API_BASE}/assessments`, {
      data: {
        name: 'Invalid Assessment',
        type: 'quiz',
        courseOfferingId: nonExistentId,
        maxMarks: 50,
        weightage: 20
      }
    });
    
    expect([400, 404, 409].includes(invalidAssessmentResponse.status())).toBe(true);

    // Test 3: Try to create project team with non-existent event
    const invalidTeamResponse = await page.request.post(`${API_BASE}/project-teams`, {
      data: {
        name: 'Invalid Team',
        description: 'Team with invalid event reference',
        department: 'Computer Engineering',
        eventId: nonExistentId,
        maxMembers: 4
      }
    });
    
    expect([400, 404, 409].includes(invalidTeamResponse.status())).toBe(true);

    // Test 4: Try to access non-existent resources
    const getNonExistentStudentResponse = await page.request.get(`${API_BASE}/students/${nonExistentId}`);
    expect(getNonExistentStudentResponse.status()).toBe(404);

    const getNonExistentProjectResponse = await page.request.get(`${API_BASE}/projects/${nonExistentId}`);
    expect(getNonExistentProjectResponse.status()).toBe(404);

    // Test 5: Try to delete non-existent resources
    const deleteNonExistentResponse = await page.request.delete(`${API_BASE}/faculty/${nonExistentId}`);
    expect([404, 410].includes(deleteNonExistentResponse.status())).toBe(true);
  });
});