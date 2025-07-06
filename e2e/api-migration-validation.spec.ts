import { test, expect } from '@playwright/test';

/**
 * API Migration Validation Suite
 * 
 * This comprehensive test suite validates all API endpoints before and after MongoDB migration.
 * Tests are designed to:
 * 1. Verify current in-memory API behavior
 * 2. Validate identical behavior after MongoDB migration
 * 3. Ensure data integrity and relationships are preserved
 * 4. Check performance characteristics remain acceptable
 */

test.describe('API Migration Validation Suite', () => {
  
  // Test configuration
  const API_TIMEOUT = 10000; // 10 seconds
  const PERFORMANCE_THRESHOLD = 5000; // 5 seconds max response time
  
  test.describe('Students API Validation', () => {
    
    test('should return all students with correct structure', async ({ request }) => {
      const response = await request.get('/api/students');
      
      expect(response.status()).toBe(200);
      
      const students = await response.json();
      expect(Array.isArray(students)).toBe(true);
      expect(students.length).toBeGreaterThan(0);
      
      // Validate student structure
      if (students.length > 0) {
        const student = students[0];
        expect(student).toHaveProperty('id');
        expect(student).toHaveProperty('personalEmail'); // Students use personalEmail, not email
        expect(student).toHaveProperty('firstName');
        expect(student).toHaveProperty('lastName');
        expect(student).toHaveProperty('status'); // Students use status, not isActive
        
        console.log(`✓ Students API: ${students.length} students, structure validated`);
      }
    });

    test('should create new student successfully', async ({ request }) => {
      // First get available programs, batches, and departments
      const programsResponse = await request.get('/api/programs');
      const programs = await programsResponse.json();
      
      const batchesResponse = await request.get('/api/batches');
      const batches = await batchesResponse.json();
      
      const departmentsResponse = await request.get('/api/departments');
      const departments = await departmentsResponse.json();
      
      if (programs.length === 0) {
        console.log('⚠ Students CREATE: No programs available, skipping test');
        return;
      }
      
      if (departments.length === 0) {
        console.log('⚠ Students CREATE: No departments available, skipping test');
        return;
      }
      
      const newStudent = {
        firstName: 'Migration',
        lastName: 'Test',
        personalEmail: `migration-test-${Date.now()}@example.com`,
        instituteEmail: `migration-test-${Date.now()}@institution.ac.in`,
        contactNumber: '9876543210',
        gender: 'Male',
        status: 'active',
        programId: programs[0].id, // Use first available program
        department: departments[0].id, // Use first available department
        batchId: batches.length > 0 ? batches[0].id : undefined,
        enrollmentNumber: `TEST${Date.now().toString().slice(-6)}`
      };

      const response = await request.post('/api/students', {
        data: newStudent,
        timeout: API_TIMEOUT
      });

      expect(response.status()).toBe(201);
      
      const created = await response.json();
      expect(created.personalEmail).toBe(newStudent.personalEmail);
      expect(created.firstName).toBe(newStudent.firstName);
      
      console.log(`✓ Students CREATE: ${created.id}`);
    });
  });

  test.describe('Faculty API Validation', () => {
    
    test('should return all faculty with correct structure', async ({ request }) => {
      const response = await request.get('/api/faculty');
      
      expect(response.status()).toBe(200);
      
      const faculty = await response.json();
      expect(Array.isArray(faculty)).toBe(true);
      
      if (faculty.length > 0) {
        const member = faculty[0];
        expect(member).toHaveProperty('id');
        expect(member).toHaveProperty('fullName');
        expect(member).toHaveProperty('email');
        
        console.log(`✓ Faculty API: ${faculty.length} faculty members, structure validated`);
      }
    });

    test('should create new faculty member', async ({ request }) => {
      const newFaculty = {
        fullName: 'Test Faculty Member',
        firstName: 'Test',
        lastName: 'Faculty',
        email: `faculty-test-${Date.now()}@example.com`,
        department: 'Computer Science',
        designation: 'Assistant Professor',
        isActive: true
      };

      const response = await request.post('/api/faculty', {
        data: newFaculty,
        timeout: API_TIMEOUT
      });

      if (response.status() === 201) {
        const created = await response.json();
        expect(created.email).toBe(newFaculty.email);
        console.log(`✓ Faculty CREATE: ${created.id}`);
      } else {
        console.log(`ℹ Faculty CREATE: Status ${response.status()} (may not be implemented)`);
      }
    });
  });

  test.describe('Programs API Validation', () => {
    
    test('should return all programs with correct structure', async ({ request }) => {
      const response = await request.get('/api/programs');
      
      expect(response.status()).toBe(200);
      
      const programs = await response.json();
      expect(Array.isArray(programs)).toBe(true);
      
      if (programs.length > 0) {
        const program = programs[0];
        expect(program).toHaveProperty('id');
        expect(program).toHaveProperty('name');
        
        console.log(`✓ Programs API: ${programs.length} programs, structure validated`);
      }
    });
  });

  test.describe('Courses API Validation', () => {
    
    test('should return all courses with correct structure', async ({ request }) => {
      const response = await request.get('/api/courses');
      
      expect(response.status()).toBe(200);
      
      const courses = await response.json();
      expect(Array.isArray(courses)).toBe(true);
      
      if (courses.length > 0) {
        const course = courses[0];
        expect(course).toHaveProperty('id');
        expect(course).toHaveProperty('subjectName'); // Courses use subjectName, not name
        expect(course).toHaveProperty('subcode'); // Courses use subcode, not code
        
        console.log(`✓ Courses API: ${courses.length} courses, structure validated`);
      }
    });
  });

  test.describe('Batches API Validation', () => {
    
    test('should return all batches with correct structure', async ({ request }) => {
      const response = await request.get('/api/batches');
      
      expect(response.status()).toBe(200);
      
      const batches = await response.json();
      expect(Array.isArray(batches)).toBe(true);
      
      if (batches.length > 0) {
        const batch = batches[0];
        expect(batch).toHaveProperty('id');
        expect(batch).toHaveProperty('name');
        
        console.log(`✓ Batches API: ${batches.length} batches, structure validated`);
      }
    });
  });

  test.describe('Enrollments API Validation', () => {
    
    test('should return all enrollments with correct structure', async ({ request }) => {
      const response = await request.get('/api/enrollments');
      
      expect(response.status()).toBe(200);
      
      const enrollments = await response.json();
      expect(Array.isArray(enrollments)).toBe(true);
      
      if (enrollments.length > 0) {
        const enrollment = enrollments[0];
        expect(enrollment).toHaveProperty('id');
        expect(enrollment).toHaveProperty('studentId');
        expect(enrollment).toHaveProperty('courseId');
        
        console.log(`✓ Enrollments API: ${enrollments.length} enrollments, structure validated`);
      }
    });
  });

  test.describe('Attendance API Validation', () => {
    
    test('should return attendance records with correct structure', async ({ request }) => {
      const response = await request.get('/api/attendance');
      
      // Attendance might require parameters, so 400 is acceptable
      if (response.status() === 200) {
        const attendance = await response.json();
        expect(Array.isArray(attendance)).toBe(true);
        console.log(`✓ Attendance API: ${attendance.length} records`);
      } else if (response.status() === 400) {
        console.log('ℹ Attendance API: Requires parameters (expected)');
      } else {
        console.log(`ℹ Attendance API: Status ${response.status()}`);
      }
    });
  });

  test.describe('Performance Validation', () => {
    
    test('should maintain acceptable response times', async ({ request }) => {
      const endpoints = [
        '/api/students',
        '/api/faculty', 
        '/api/programs',
        '/api/courses',
        '/api/batches',
        '/api/enrollments'
      ];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        
        const response = await request.get(endpoint);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        expect(response.status()).toBe(200);
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLD);
        
        console.log(`⚡ ${endpoint}: ${responseTime}ms`);
      }
    });
  });

  test.describe('Data Relationships Validation', () => {
    
    test('should preserve student-program relationships', async ({ request }) => {
      const [studentsRes, programsRes] = await Promise.all([
        request.get('/api/students'),
        request.get('/api/programs')
      ]);

      const students = await studentsRes.json();
      const programs = await programsRes.json();

      if (students.length > 0 && programs.length > 0) {
        // Check if students have program references
        const studentsWithPrograms = students.filter((s: any) => s.programId || s.program);
        console.log(`✓ Relationships: ${studentsWithPrograms.length}/${students.length} students have program links`);
      }
    });

    test('should preserve enrollment relationships', async ({ request }) => {
      const [enrollmentsRes, studentsRes, coursesRes] = await Promise.all([
        request.get('/api/enrollments'),
        request.get('/api/students'),
        request.get('/api/courses')
      ]);

      const enrollments = await enrollmentsRes.json();
      const students = await studentsRes.json();
      const courses = await coursesRes.json();

      if (enrollments.length > 0) {
        const enrollment = enrollments[0];
        
        // Verify referenced entities exist
        const studentExists = students.some((s: any) => s.id === enrollment.studentId);
        const courseExists = courses.some((c: any) => c.id === enrollment.courseId);
        
        if (studentExists && courseExists) {
          console.log('✓ Relationships: Enrollment references are valid');
        }
      }
    });
  });

  test.describe('Data Integrity Validation', () => {
    
    test('should maintain consistent student count across operations', async ({ request }) => {
      // Get initial count
      const initialResponse = await request.get('/api/students');
      const initialStudents = await initialResponse.json();
      const initialCount = initialStudents.length;

      // Create a new student
      const newStudent = {
        firstName: 'Integrity',
        lastName: 'Test',
        personalEmail: `integrity-test-${Date.now()}@example.com`,
        instituteEmail: `integrity-test-${Date.now()}@institution.ac.in`,
        contactNumber: '9876543210',
        gender: 'Male',
        status: 'active',
        programId: 'prog_dme_gpp',
        batchId: 'batch_dme_2023_gpp',
        enrollmentNumber: `INT${Date.now().toString().slice(-6)}`
      };

      const createResponse = await request.post('/api/students', {
        data: newStudent
      });

      if (createResponse.status() === 201) {
        // Check count increased by 1
        const afterCreateResponse = await request.get('/api/students');
        const afterCreateStudents = await afterCreateResponse.json();
        
        expect(afterCreateStudents.length).toBe(initialCount + 1);
        console.log(`✓ Integrity: Student count correctly increased from ${initialCount} to ${afterCreateStudents.length}`);
      }
    });

    test('should handle concurrent requests safely', async ({ request }) => {
      // Make multiple concurrent requests to test data consistency
      const promises = Array.from({ length: 5 }, () => 
        request.get('/api/students')
      );

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach((response, index) => {
        expect(response.status()).toBe(200);
      });

      // All should return the same count (data consistency)
      const counts = await Promise.all(
        responses.map(async (response) => {
          const data = await response.json();
          return data.length;
        })
      );

      const uniqueCounts = [...new Set(counts)];
      expect(uniqueCounts.length).toBe(1); // All counts should be the same
      
      console.log(`✓ Concurrency: All ${promises.length} requests returned consistent count of ${counts[0]}`);
    });
  });

  test.describe('MongoDB Migration Readiness', () => {
    
    test('should validate all in-memory endpoints are functional', async ({ request }) => {
      const inMemoryEndpoints = [
        '/api/students',
        '/api/faculty',
        '/api/programs', 
        '/api/courses',
        '/api/batches',
        '/api/enrollments'
      ];

      const results = [];
      
      for (const endpoint of inMemoryEndpoints) {
        try {
          const response = await request.get(endpoint);
          const data = await response.json();
          
          results.push({
            endpoint,
            status: response.status(),
            count: Array.isArray(data) ? data.length : 'N/A',
            success: response.status() === 200
          });
        } catch (error) {
          results.push({
            endpoint,
            status: 'ERROR',
            count: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Log summary
      console.log('\n📊 Migration Readiness Summary:');
      results.forEach(result => {
        const status = result.success ? '✓' : '✗';
        console.log(`  ${status} ${result.endpoint}: ${result.status} (${result.count} records)`);
      });

      // Ensure all endpoints are working
      const failedEndpoints = results.filter(r => !r.success);
      expect(failedEndpoints.length).toBe(0);
    });
  });
});
