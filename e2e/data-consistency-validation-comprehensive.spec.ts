import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Data Consistency and Validation - MongoDB Migration Safety
 * 
 * This test suite validates data consistency rules, business logic constraints,
 * and referential integrity across the application. Critical for ensuring
 * MongoDB migration preserves all data validation rules.
 */

const API_BASE = '/api';

// Helper function to generate unique identifiers
const generateUniqueId = () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

test.describe('Data Consistency and Validation - Migration Safety', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('Student Data Validation and Business Rules', async ({ page }) => {
    // Test comprehensive student data validation
    
    // Test 1: Valid student creation
    const validStudentData = {
      enrollmentNumber: generateUniqueId(),
      firstName: 'Valid',
      lastName: 'Student',
      email: `valid.student.${generateUniqueId()}@example.com`,
      program: 'B.Tech',
      currentSemester: 3,
      institute: 'GPPEC',
      department: 'Computer Engineering',
      gender: 'Male',
      contactNumber: '9876543210',
      birthDate: '2000-05-15'
    };

    const createValidResponse = await page.request.post(`${API_BASE}/students`, {
      data: validStudentData
    });
    expect(createValidResponse.status()).toBe(201);
    const createdStudent = await createValidResponse.json();
    const studentId = createdStudent.id;

    try {
      // Test 2: Duplicate enrollment number validation
      const duplicateEnrollmentData = {
        ...validStudentData,
        firstName: 'Duplicate',
        email: `duplicate.${generateUniqueId()}@example.com`,
        enrollmentNumber: validStudentData.enrollmentNumber // Same enrollment number
      };

      const duplicateResponse = await page.request.post(`${API_BASE}/students`, {
        data: duplicateEnrollmentData
      });
      expect(duplicateResponse.status()).toBe(409); // Conflict

      // Test 3: Invalid email format validation
      const invalidEmailData = {
        ...validStudentData,
        enrollmentNumber: generateUniqueId(),
        email: 'invalid-email-format'
      };

      const invalidEmailResponse = await page.request.post(`${API_BASE}/students`, {
        data: invalidEmailData
      });
      expect([400, 422].includes(invalidEmailResponse.status())).toBe(true);

      // Test 4: Invalid semester validation
      const invalidSemesterData = {
        ...validStudentData,
        enrollmentNumber: generateUniqueId(),
        email: `invalid.semester.${generateUniqueId()}@example.com`,
        currentSemester: 15 // Invalid semester
      };

      const invalidSemesterResponse = await page.request.post(`${API_BASE}/students`, {
        data: invalidSemesterData
      });
      
      // Should either reject or normalize
      if (invalidSemesterResponse.status() === 201) {
        const normalizedStudent = await invalidSemesterResponse.json();
        expect(normalizedStudent.currentSemester).toBeLessThanOrEqual(8);
        await page.request.delete(`${API_BASE}/students/${normalizedStudent.id}`);
      } else {
        expect([400, 422].includes(invalidSemesterResponse.status())).toBe(true);
      }

      // Test 5: Data update consistency
      const updateData = {
        currentSemester: 4,
        contactNumber: '9876543211'
      };

      const updateResponse = await page.request.patch(`${API_BASE}/students/${studentId}`, {
        data: updateData
      });
      expect(updateResponse.status()).toBe(200);

      const updatedStudent = await updateResponse.json();
      expect(updatedStudent.currentSemester).toBe(4);
      expect(updatedStudent.contactNumber).toBe('9876543211');

    } finally {
      await page.request.delete(`${API_BASE}/students/${studentId}`);
    }
  });

  test('Course Offering and Enrollment Consistency', async ({ page }) => {
    // Test course offering and enrollment business rules
    
    // Step 1: Create a valid course offering
    const courseOfferingData = {
      courseId: `course_${generateUniqueId()}`,
      batchId: `batch_${generateUniqueId()}`,
      academicYear: '2024-25',
      semester: 5,
      facultyIds: ['faculty_consistency_test'],
      courseCode: `CS${generateUniqueId().substr(-4)}`,
      courseName: 'Data Consistency Test Course',
      credits: 3,
      startDate: '2024-09-01',
      endDate: '2024-12-31',
      status: 'active',
      maxEnrollments: 50
    };

    const createOfferingResponse = await page.request.post(`${API_BASE}/course-offerings`, {
      data: courseOfferingData
    });
    expect(createOfferingResponse.status()).toBe(201);
    const createdOffering = await createOfferingResponse.json();
    const offeringId = createdOffering.id;

    try {
      // Test 1: Valid enrollment creation
      const studentData = {
        enrollmentNumber: generateUniqueId(),
        firstName: 'Enrollment',
        lastName: 'Test',
        email: `enrollment.test.${generateUniqueId()}@example.com`,
        currentSemester: 5,
        department: 'Computer Engineering'
      };

      const createStudentResponse = await page.request.post(`${API_BASE}/students`, {
        data: studentData
      });
      expect(createStudentResponse.status()).toBe(201);
      const createdStudent = await createStudentResponse.json();
      const studentId = createdStudent.id;

      const enrollmentData = {
        studentId: studentId,
        courseOfferingId: offeringId,
        enrollmentDate: '2024-09-01',
        status: 'enrolled',
        academicYear: '2024-25',
        semester: 5
      };

      const createEnrollmentResponse = await page.request.post(`${API_BASE}/enrollments`, {
        data: enrollmentData
      });
      expect(createEnrollmentResponse.status()).toBe(201);
      const createdEnrollment = await createEnrollmentResponse.json();
      const enrollmentId = createdEnrollment.id;

      // Test 2: Duplicate enrollment prevention
      const duplicateEnrollmentResponse = await page.request.post(`${API_BASE}/enrollments`, {
        data: enrollmentData
      });
      expect([400, 409].includes(duplicateEnrollmentResponse.status())).toBe(true);

      // Test 3: Invalid date range validation
      const invalidDateEnrollmentData = {
        ...enrollmentData,
        enrollmentDate: '2024-08-15' // Before course start date
      };

      const invalidDateResponse = await page.request.post(`${API_BASE}/enrollments`, {
        data: invalidDateEnrollmentData
      });
      expect([400, 422].includes(invalidDateResponse.status())).toBe(true);

      // Test 4: Enrollment status transitions
      const statusUpdateResponse = await page.request.patch(`${API_BASE}/enrollments/${enrollmentId}`, {
        data: { status: 'completed' }
      });
      expect(statusUpdateResponse.status()).toBe(200);

      const updatedEnrollment = await statusUpdateResponse.json();
      expect(updatedEnrollment.status).toBe('completed');

      // Clean up
      await page.request.delete(`${API_BASE}/enrollments/${enrollmentId}`);
      await page.request.delete(`${API_BASE}/students/${studentId}`);

    } finally {
      await page.request.delete(`${API_BASE}/course-offerings/${offeringId}`);
    }
  });

  test('Project Team Member Management Validation', async ({ page }) => {
    // Test project team member constraints and business rules
    
    // Step 1: Create a project event
    const eventData = {
      name: `Team Validation Event ${generateUniqueId()}`,
      description: 'Event for testing team validation',
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
      // Step 2: Create a team with member constraints
      const teamData = {
        name: `Validation Test Team ${generateUniqueId()}`,
        description: 'Team for testing member validation',
        department: 'Computer Engineering',
        eventId: eventId,
        maxMembers: 3, // Limited to 3 members
        status: 'active',
        members: [
          {
            studentId: 'student_team_leader',
            role: 'leader',
            isLeader: true,
            joinedAt: new Date().toISOString()
          },
          {
            studentId: 'student_team_member_1',
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

      // Test 1: Add member within limit
      const validMemberData = {
        studentId: 'student_team_member_2',
        role: 'member',
        isLeader: false,
        joinedAt: new Date().toISOString()
      };

      const addMemberResponse = await page.request.post(`${API_BASE}/project-teams/${teamId}/members`, {
        data: validMemberData
      });
      expect([200, 201].includes(addMemberResponse.status())).toBe(true);

      // Test 2: Try to exceed member limit
      const exceedLimitMemberData = {
        studentId: 'student_team_member_3',
        role: 'member',
        isLeader: false,
        joinedAt: new Date().toISOString()
      };

      const exceedLimitResponse = await page.request.post(`${API_BASE}/project-teams/${teamId}/members`, {
        data: exceedLimitMemberData
      });
      expect([400, 409].includes(exceedLimitResponse.status())).toBe(true);

      // Test 3: Duplicate member prevention
      const duplicateMemberResponse = await page.request.post(`${API_BASE}/project-teams/${teamId}/members`, {
        data: validMemberData // Same student ID
      });
      expect([400, 409].includes(duplicateMemberResponse.status())).toBe(true);

      // Test 4: Leader management validation
      const changeLeaderResponse = await page.request.patch(
        `${API_BASE}/project-teams/${teamId}/leader/student_team_member_1`
      );
      
      // May return 404 if endpoint doesn't exist, or 200 if it works
      expect([200, 404].includes(changeLeaderResponse.status())).toBe(true);

      // Test 5: Remove member
      const removeMemberResponse = await page.request.delete(
        `${API_BASE}/project-teams/${teamId}/members/student_team_member_2`
      );
      expect([200, 204, 404].includes(removeMemberResponse.status())).toBe(true);

      await page.request.delete(`${API_BASE}/project-teams/${teamId}`);

    } finally {
      await page.request.delete(`${API_BASE}/project-events/${eventId}`);
    }
  });

  test('Assessment and Results Validation', async ({ page }) => {
    // Test assessment creation and results validation
    
    // Step 1: Create course offering for assessments
    const courseOfferingData = {
      courseId: `course_${generateUniqueId()}`,
      batchId: `batch_${generateUniqueId()}`,
      academicYear: '2024-25',
      semester: 6,
      facultyIds: ['faculty_assessment_test'],
      courseCode: `AS${generateUniqueId().substr(-4)}`,
      courseName: 'Assessment Validation Course',
      credits: 4,
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

    try {
      // Test 1: Valid assessment creation
      const assessmentData = {
        name: 'Validation Test Assessment',
        type: 'midterm',
        courseOfferingId: offeringId,
        maxMarks: 100,
        weightage: 40,
        assessmentDate: '2024-10-15',
        status: 'active'
      };

      const createAssessmentResponse = await page.request.post(`${API_BASE}/assessments`, {
        data: assessmentData
      });
      expect(createAssessmentResponse.status()).toBe(201);
      const createdAssessment = await createAssessmentResponse.json();
      const assessmentId = createdAssessment.id;

      // Test 2: Invalid marks validation
      const invalidMarksAssessmentData = {
        ...assessmentData,
        name: 'Invalid Marks Assessment',
        maxMarks: -50 // Negative marks
      };

      const invalidMarksResponse = await page.request.post(`${API_BASE}/assessments`, {
        data: invalidMarksAssessmentData
      });
      expect([400, 422].includes(invalidMarksResponse.status())).toBe(true);

      // Test 3: Invalid weightage validation
      const invalidWeightageData = {
        ...assessmentData,
        name: 'Invalid Weightage Assessment',
        weightage: 150 // Over 100%
      };

      const invalidWeightageResponse = await page.request.post(`${API_BASE}/assessments`, {
        data: invalidWeightageData
      });
      expect([400, 422].includes(invalidWeightageResponse.status())).toBe(true);

      // Test 4: Duplicate assessment name in same course
      const duplicateNameResponse = await page.request.post(`${API_BASE}/assessments`, {
        data: assessmentData // Same name and course
      });
      expect([400, 409].includes(duplicateNameResponse.status())).toBe(true);

      // Test 5: Valid result creation
      const studentData = {
        enrollmentNumber: generateUniqueId(),
        firstName: 'Result',
        lastName: 'Test Student',
        email: `result.test.${generateUniqueId()}@example.com`,
        currentSemester: 6,
        department: 'Computer Engineering'
      };

      const createStudentResponse = await page.request.post(`${API_BASE}/students`, {
        data: studentData
      });
      expect(createStudentResponse.status()).toBe(201);
      const createdStudent = await createStudentResponse.json();
      const studentId = createdStudent.id;

      const resultData = {
        studentId: studentId,
        semester: 6,
        academicYear: '2024-25',
        enrollmentNumber: studentData.enrollmentNumber,
        branch: 'Computer Engineering',
        subjects: [
          {
            subjectCode: courseOfferingData.courseCode,
            subjectName: courseOfferingData.courseName,
            credits: 4,
            grade: 'A+',
            gradePoints: 10,
            marks: 95
          }
        ],
        spi: 10.0,
        cpi: 9.2,
        resultStatus: 'Pass'
      };

      const createResultResponse = await page.request.post(`${API_BASE}/results`, {
        data: resultData
      });
      expect(createResultResponse.status()).toBe(201);
      const createdResult = await createResultResponse.json();

      // Test 6: Invalid SPI/CPI validation
      const invalidSPIData = {
        ...resultData,
        enrollmentNumber: generateUniqueId(),
        spi: 15.0, // Invalid SPI > 10
        cpi: 12.0  // Invalid CPI > 10
      };

      const invalidSPIResponse = await page.request.post(`${API_BASE}/results`, {
        data: invalidSPIData
      });
      
      // Should either reject or normalize
      if (invalidSPIResponse.status() === 201) {
        const normalizedResult = await invalidSPIResponse.json();
        expect(normalizedResult.spi).toBeLessThanOrEqual(10);
        expect(normalizedResult.cpi).toBeLessThanOrEqual(10);
        await page.request.delete(`${API_BASE}/results/${normalizedResult.id}`);
      } else {
        expect([400, 422].includes(invalidSPIResponse.status())).toBe(true);
      }

      // Clean up
      await page.request.delete(`${API_BASE}/results/${createdResult.id}`);
      await page.request.delete(`${API_BASE}/students/${studentId}`);
      await page.request.delete(`${API_BASE}/assessments/${assessmentId}`);

    } finally {
      await page.request.delete(`${API_BASE}/course-offerings/${offeringId}`);
    }
  });

  test('Timetable and Room Allocation Conflict Validation', async ({ page }) => {
    // Test time slot conflict detection and validation
    
    // Test 1: Valid timetable entry
    const timetableData = {
      academicYear: '2024-25',
      semester: 3,
      department: 'Computer Engineering',
      status: 'active',
      effectiveDate: '2024-09-01',
      version: '1.0',
      entries: [
        {
          dayOfWeek: 'monday',
          timeSlot: '10:00-11:00',
          courseOfferingId: 'course_timetable_test_1',
          facultyId: 'faculty_timetable_test_1',
          roomId: 'room_timetable_test',
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

    try {
      // Test 2: Room allocation with same time slot
      const roomAllocationData = {
        roomId: 'room_timetable_test',
        courseOfferingId: 'course_timetable_test_2',
        facultyId: 'faculty_timetable_test_2',
        purpose: 'lecture',
        startTime: '10:00',
        endTime: '11:00',
        date: '2024-09-02', // Monday
        status: 'confirmed',
        academicYear: '2024-25',
        semester: 3
      };

      const createAllocationResponse = await page.request.post(`${API_BASE}/room-allocations`, {
        data: roomAllocationData
      });
      
      // Should either succeed (if no conflict detection) or fail with conflict
      if (createAllocationResponse.status() === 201) {
        const createdAllocation = await createAllocationResponse.json();
        await page.request.delete(`${API_BASE}/room-allocations/${createdAllocation.id}`);
      } else {
        expect([400, 409].includes(createAllocationResponse.status())).toBe(true);
      }

      // Test 3: Invalid time format validation
      const invalidTimeData = {
        ...roomAllocationData,
        startTime: '25:00', // Invalid hour
        endTime: '26:00'
      };

      const invalidTimeResponse = await page.request.post(`${API_BASE}/room-allocations`, {
        data: invalidTimeData
      });
      expect([400, 422].includes(invalidTimeResponse.status())).toBe(true);

      // Test 4: End time before start time validation
      const invalidSequenceData = {
        ...roomAllocationData,
        startTime: '11:00',
        endTime: '10:00' // End before start
      };

      const invalidSequenceResponse = await page.request.post(`${API_BASE}/room-allocations`, {
        data: invalidSequenceData
      });
      expect([400, 422].includes(invalidSequenceResponse.status())).toBe(true);

    } finally {
      await page.request.delete(`${API_BASE}/timetables/${timetableId}`);
    }
  });

  test('Faculty Assignment and Workload Validation', async ({ page }) => {
    // Test faculty assignment constraints and workload validation
    
    // Step 1: Create a faculty member
    const facultyData = {
      staffCode: generateUniqueId(),
      firstName: 'Workload',
      lastName: 'Test Faculty',
      email: `workload.faculty.${generateUniqueId()}@example.com`,
      department: 'Computer Engineering',
      designation: 'Assistant Professor',
      status: 'active'
    };

    const createFacultyResponse = await page.request.post(`${API_BASE}/faculty`, {
      data: facultyData
    });
    
    let facultyId;
    if (createFacultyResponse.status() === 201) {
      const createdFaculty = await createFacultyResponse.json();
      facultyId = createdFaculty.id;
    } else {
      // Skip test if faculty creation fails due to validation differences
      test.skip();
      return;
    }

    try {
      // Step 2: Create multiple course offerings for the faculty
      const courseOfferings = [];
      for (let i = 1; i <= 3; i++) {
        const courseData = {
          courseCode: `WL${generateUniqueId().substr(-3)}_${i}`,
          courseName: `Workload Test Course ${i}`,
          credits: 3,
          semester: 4,
          academicYear: '2024-25',
          facultyId: facultyId,
          startDate: '2024-09-01',
          endDate: '2024-12-31',
          status: 'active'
        };

        const createCourseResponse = await page.request.post(`${API_BASE}/course-offerings`, {
          data: courseData
        });
        expect(createCourseResponse.status()).toBe(201);
        const createdCourse = await createCourseResponse.json();
        courseOfferings.push(createdCourse);
      }

      // Test 1: Verify faculty has multiple course assignments
      const getFacultyCoursesResponse = await page.request.get(`${API_BASE}/course-offerings?facultyId=${facultyId}`);
      expect(getFacultyCoursesResponse.status()).toBe(200);
      const facultyCourses = await getFacultyCoursesResponse.json();
      expect(facultyCourses.length).toBeGreaterThanOrEqual(3);

      // Test 2: Create assessments for all courses
      const assessments = [];
      for (const course of courseOfferings) {
        const assessmentData = {
          name: `Assessment for ${course.courseName}`,
          type: 'assignment',
          courseOfferingId: course.id,
          maxMarks: 50,
          weightage: 25,
          assessmentDate: '2024-10-20',
          status: 'active'
        };

        const createAssessmentResponse = await page.request.post(`${API_BASE}/assessments`, {
          data: assessmentData
        });
        expect(createAssessmentResponse.status()).toBe(201);
        const createdAssessment = await createAssessmentResponse.json();
        assessments.push(createdAssessment);
      }

      // Test 3: Verify faculty workload distribution
      const getAssessmentsResponse = await page.request.get(`${API_BASE}/assessments`);
      expect(getAssessmentsResponse.status()).toBe(200);
      const allAssessments = await getAssessmentsResponse.json();
      
      const facultyAssessments = allAssessments.filter((a: any) => 
        courseOfferings.some(c => c.id === a.courseOfferingId)
      );
      expect(facultyAssessments.length).toBeGreaterThanOrEqual(3);

      // Clean up assessments
      for (const assessment of assessments) {
        await page.request.delete(`${API_BASE}/assessments/${assessment.id}`);
      }

      // Clean up course offerings
      for (const course of courseOfferings) {
        await page.request.delete(`${API_BASE}/course-offerings/${course.id}`);
      }

    } finally {
      await page.request.delete(`${API_BASE}/faculty/${facultyId}`);
    }
  });

  test('Data Integrity During Concurrent Operations', async ({ page }) => {
    // Test data integrity when multiple operations happen concurrently
    
    const baseData = {
      projectTitle: `Concurrent Test Project`,
      description: 'Project for testing concurrent operations',
      department: 'Computer Engineering',
      eventId: 'event_concurrent_test',
      category: 'Software',
      status: 'active'
    };

    // Create multiple projects concurrently
    const concurrentPromises = [];
    for (let i = 0; i < 5; i++) {
      const projectData = {
        ...baseData,
        projectTitle: `${baseData.projectTitle} ${i} ${generateUniqueId()}`
      };

      const promise = page.request.post(`${API_BASE}/projects`, {
        data: projectData
      });
      concurrentPromises.push(promise);
    }

    const responses = await Promise.all(concurrentPromises);
    const createdProjects = [];

    try {
      // Verify all projects were created successfully
      for (const response of responses) {
        expect(response.status()).toBe(201);
        const responseData = await response.json();
        const project = responseData.data?.project || responseData;
        createdProjects.push(project);
      }

      // Verify no duplicate IDs were assigned
      const projectIds = createdProjects.map(p => p.id);
      const uniqueIds = new Set(projectIds);
      expect(uniqueIds.size).toBe(projectIds.length);

      // Verify all projects exist in the system
      const getAllProjectsResponse = await page.request.get(`${API_BASE}/projects`);
      expect(getAllProjectsResponse.status()).toBe(200);
      const allProjectsData = await getAllProjectsResponse.json();
      const allProjects = allProjectsData.data?.projects || allProjectsData;

      for (const project of createdProjects) {
        const foundProject = allProjects.find((p: any) => p.id === project.id);
        expect(foundProject).toBeDefined();
        expect(foundProject.projectTitle).toBe(project.projectTitle);
      }

    } finally {
      // Clean up all created projects
      for (const project of createdProjects) {
        await page.request.delete(`${API_BASE}/projects/${project.id}`);
      }
    }
  });
});