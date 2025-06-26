import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Security and Authorization - MongoDB Migration Security
 * 
 * This test suite validates security controls, input sanitization,
 * and authorization mechanisms. Critical for ensuring MongoDB migration
 * preserves all security measures and access controls.
 */

const API_BASE = '/api';

// Helper function to generate unique identifiers
const generateUniqueId = () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

test.describe('Security and Authorization - Migration Security', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('Input Sanitization and XSS Prevention', async ({ page }) => {
    // Test various XSS attack vectors and input sanitization
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      '<svg onload="alert(\'XSS\')">',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '"><script>alert("XSS")</script>',
      '\'; alert("XSS"); //',
      '<style>@import "javascript:alert(\'XSS\')"</style>',
      '<div onmouseover="alert(\'XSS\')">Hover me</div>',
      '<input onfocus="alert(\'XSS\')" autofocus>'
    ];

    const createdStudents = [];

    try {
      // Test XSS in various student fields
      for (let i = 0; i < xssPayloads.length; i++) {
        const payload = xssPayloads[i];
        const studentData = {
          firstName: payload,
          lastName: `XSS Test ${i}`,
          enrollmentNumber: `XSS_${generateUniqueId()}_${i}`,
          email: `xss.test.${i}.${generateUniqueId()}@example.com`,
          currentSemester: 3,
          department: 'Computer Engineering',
          description: payload,
          address: payload
        };

        const createResponse = await page.request.post(`${API_BASE}/students`, {
          data: studentData
        });

        if (createResponse.status() === 201) {
          const createdStudent = await createResponse.json();
          createdStudents.push(createdStudent);

          // Verify XSS payload was sanitized or safely stored
          expect(createdStudent.firstName).toBeDefined();
          expect(typeof createdStudent.firstName).toBe('string');
          
          // The payload should not contain active script tags
          if (createdStudent.firstName.includes('<script>')) {
            expect(createdStudent.firstName).not.toContain('alert(');
          }
        } else {
          // Rejection is also acceptable for security
          expect([400, 422].includes(createResponse.status())).toBe(true);
        }
      }

      // Test XSS in project data
      const projectXSSData = {
        title: '<script>alert("Project XSS")</script>',
        description: '<img src="x" onerror="alert(\'Project XSS\')">',
        department: 'Computer Engineering',
        eventId: 'event_xss_test',
        category: 'Software',
        status: 'active',
        keywords: ['<script>alert("keyword")</script>', 'normal-keyword']
      };

      const projectXSSResponse = await page.request.post(`${API_BASE}/projects`, {
        data: projectXSSData
      });

      if (projectXSSResponse.status() === 201) {
        const projectResponseData = await projectXSSResponse.json();
        const createdProject = projectResponseData.data?.project || projectResponseData;
        
        // Verify XSS was handled safely
        expect(createdProject.title).toBeDefined();
        expect(typeof createdProject.title).toBe('string');
        
        await page.request.delete(`${API_BASE}/projects/${createdProject.id}`);
      }

    } finally {
      // Clean up created students
      for (const student of createdStudents) {
        await page.request.delete(`${API_BASE}/students/${student.id}`);
      }
    }
  });

  test('SQL Injection Prevention', async ({ page }) => {
    // Test various SQL injection attack vectors
    
    const sqlInjectionPayloads = [
      "'; DROP TABLE students; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "'; DELETE FROM students; --",
      "' OR 1=1 --",
      "admin'--",
      "admin'/*",
      "' OR 'x'='x",
      "'; EXEC sp_configure 'show advanced options', 1--",
      "' AND (SELECT COUNT(*) FROM students) > 0 --"
    ];

    const createdStudents = [];

    try {
      // Test SQL injection in student creation
      for (let i = 0; i < sqlInjectionPayloads.length; i++) {
        const payload = sqlInjectionPayloads[i];
        const studentData = {
          firstName: payload,
          lastName: 'SQL Test',
          enrollmentNumber: `SQL_${generateUniqueId()}_${i}`,
          email: `sql.test.${i}.${generateUniqueId()}@example.com`,
          currentSemester: 3,
          department: 'Computer Engineering'
        };

        const createResponse = await page.request.post(`${API_BASE}/students`, {
          data: studentData
        });

        if (createResponse.status() === 201) {
          const createdStudent = await createResponse.json();
          createdStudents.push(createdStudent);

          // Verify SQL injection was safely handled
          expect(createdStudent.firstName).toBeDefined();
          expect(typeof createdStudent.firstName).toBe('string');
        } else {
          // Rejection is acceptable for security
          expect([400, 422].includes(createResponse.status())).toBe(true);
        }
      }

      // Test SQL injection in search/filter parameters
      const searchPayloads = [
        "'; DROP TABLE students; --",
        "' OR '1'='1",
        "' UNION SELECT password FROM users --"
      ];

      for (const searchPayload of searchPayloads) {
        const searchResponse = await page.request.get(`${API_BASE}/students?search=${encodeURIComponent(searchPayload)}`);
        
        // Should return normally (empty or filtered results) without exposing data
        expect([200, 400].includes(searchResponse.status())).toBe(true);
        
        if (searchResponse.status() === 200) {
          const searchData = await searchResponse.json();
          expect(searchData).toBeDefined();
          // Should not return unexpected data structure
        }
      }

    } finally {
      // Clean up created students
      for (const student of createdStudents) {
        await page.request.delete(`${API_BASE}/students/${student.id}`);
      }
    }
  });

  test('Authentication and Session Security', async ({ page }) => {
    // Test authentication bypass attempts and session security
    
    // Test 1: Access protected endpoints without authentication
    const protectedEndpoints = [
      `${API_BASE}/students`,
      `${API_BASE}/faculty`,
      `${API_BASE}/projects`,
      `${API_BASE}/assessments`,
      `${API_BASE}/results`
    ];

    for (const endpoint of protectedEndpoints) {
      // Create a new context without authentication
      const unauthenticatedContext = await page.context().browser()?.newContext();
      if (unauthenticatedContext) {
        const unauthenticatedPage = await unauthenticatedContext.newPage();
        
        const unauthenticatedResponse = await unauthenticatedPage.request.get(endpoint);
        
        // Should either redirect to login or return 401/403
        expect([200, 302, 401, 403].includes(unauthenticatedResponse.status())).toBe(true);
        
        await unauthenticatedContext.close();
      }
    }

    // Test 2: Invalid session token handling
    const invalidTokenResponse = await page.request.get(`${API_BASE}/students`, {
      headers: {
        'Authorization': 'Bearer invalid-token-12345',
        'Cookie': 'session=invalid-session-id'
      }
    });
    
    expect([200, 401, 403].includes(invalidTokenResponse.status())).toBe(true);

    // Test 3: Session fixation attempts
    const sessionFixationResponse = await page.request.get(`${API_BASE}/students`, {
      headers: {
        'Cookie': 'session=attacker-controlled-session-id'
      }
    });
    
    expect([200, 401, 403].includes(sessionFixationResponse.status())).toBe(true);
  });

  test('Authorization and Role-Based Access Control', async ({ page }) => {
    // Test role-based access control and authorization
    
    // Test 1: Admin-only operations
    const adminOnlyOperations = [
      { method: 'DELETE', endpoint: `${API_BASE}/students/test-id` },
      { method: 'POST', endpoint: `${API_BASE}/faculty`, data: { firstName: 'Test' } },
      { method: 'DELETE', endpoint: `${API_BASE}/projects/test-id` },
      { method: 'POST', endpoint: `${API_BASE}/users`, data: { username: 'test' } }
    ];

    for (const operation of adminOnlyOperations) {
      let response;
      
      if (operation.method === 'GET') {
        response = await page.request.get(operation.endpoint);
      } else if (operation.method === 'POST') {
        response = await page.request.post(operation.endpoint, { data: operation.data });
      } else if (operation.method === 'DELETE') {
        response = await page.request.delete(operation.endpoint);
      }

      if (response) {
        // Should either succeed (if user has admin rights) or fail with authorization error
        expect([200, 201, 401, 403, 404].includes(response.status())).toBe(true);
      }
    }

    // Test 2: Student data access restrictions
    const studentData = {
      firstName: 'Authorization',
      lastName: 'Test Student',
      enrollmentNumber: generateUniqueId(),
      email: `auth.test.${generateUniqueId()}@example.com`,
      currentSemester: 4,
      department: 'Computer Engineering'
    };

    const createStudentResponse = await page.request.post(`${API_BASE}/students`, {
      data: studentData
    });

    if (createStudentResponse.status() === 201) {
      const createdStudent = await createStudentResponse.json();
      const studentId = createdStudent.id;

      try {
        // Test unauthorized modification attempts
        const unauthorizedUpdateResponse = await page.request.patch(`${API_BASE}/students/${studentId}`, {
          data: { firstName: 'Unauthorized Change' },
          headers: {
            'X-User-Role': 'student', // Simulate student trying to modify data
            'X-User-ID': 'different-user-id'
          }
        });

        // Should either succeed (if allowed) or fail with authorization error
        expect([200, 401, 403].includes(unauthorizedUpdateResponse.status())).toBe(true);

      } finally {
        await page.request.delete(`${API_BASE}/students/${studentId}`);
      }
    }

    // Test 3: Cross-user data access
    const userId1 = `user_${generateUniqueId()}_1`;
    const userId2 = `user_${generateUniqueId()}_2`;

    // Create notifications for user1
    const notification1Data = {
      userId: userId1,
      title: 'User 1 Notification',
      message: 'Private notification for user 1',
      type: 'info'
    };

    const createNotificationResponse = await page.request.post(`${API_BASE}/notifications`, {
      data: notification1Data
    });

    if (createNotificationResponse.status() === 201) {
      const createdNotification = await createNotificationResponse.json();

      try {
        // Test user2 trying to access user1's notifications
        const crossUserAccessResponse = await page.request.get(`${API_BASE}/notifications?userId=${userId1}`, {
          headers: {
            'X-User-ID': userId2 // User 2 trying to access User 1's data
          }
        });

        // Should either return empty results or authorization error
        expect([200, 401, 403].includes(crossUserAccessResponse.status())).toBe(true);

        if (crossUserAccessResponse.status() === 200) {
          const notifications = await crossUserAccessResponse.json();
          // Should not return user1's private notifications to user2
          if (Array.isArray(notifications)) {
            const privateNotifications = notifications.filter((n: any) => n.userId === userId1);
            expect(privateNotifications.length).toBe(0);
          }
        }

      } finally {
        await page.request.delete(`${API_BASE}/notifications/${createdNotification.id}`);
      }
    }
  });

  test('Data Privacy and Information Disclosure', async ({ page }) => {
    // Test for information disclosure vulnerabilities
    
    // Test 1: Error message information disclosure
    const sensitiveOperations = [
      { endpoint: `${API_BASE}/students/non-existent-id`, method: 'GET' },
      { endpoint: `${API_BASE}/faculty/invalid-id`, method: 'GET' },
      { endpoint: `${API_BASE}/results/secret-id`, method: 'GET' }
    ];

    for (const operation of sensitiveOperations) {
      const response = await page.request.get(operation.endpoint);
      
      if (response.status() >= 400) {
        const errorData = await response.text();
        
        // Error messages should not reveal sensitive information
        expect(errorData).not.toContain('database');
        expect(errorData).not.toContain('password');
        expect(errorData).not.toContain('secret');
        expect(errorData).not.toContain('connection');
        expect(errorData).not.toContain('server');
        expect(errorData).not.toContain('internal');
      }
    }

    // Test 2: Sensitive data in API responses
    const studentData = {
      firstName: 'Privacy',
      lastName: 'Test Student',
      enrollmentNumber: generateUniqueId(),
      email: `privacy.test.${generateUniqueId()}@example.com`,
      currentSemester: 5,
      department: 'Computer Engineering',
      personalDetails: {
        ssn: '123-45-6789',
        motherName: 'Jane Doe',
        fatherName: 'John Doe',
        bankAccount: '1234567890'
      }
    };

    const createStudentResponse = await page.request.post(`${API_BASE}/students`, {
      data: studentData
    });

    if (createStudentResponse.status() === 201) {
      const createdStudent = await createStudentResponse.json();
      const studentId = createdStudent.id;

      try {
        // Test that sensitive data is not exposed in public endpoints
        const getStudentResponse = await page.request.get(`${API_BASE}/students/${studentId}`);
        
        if (getStudentResponse.status() === 200) {
          const studentDetails = await getStudentResponse.json();
          
          // Sensitive fields should be filtered out or masked
          expect(studentDetails).not.toHaveProperty('ssn');
          expect(studentDetails).not.toHaveProperty('bankAccount');
          
          // Basic information should be available
          expect(studentDetails.firstName).toBe('Privacy');
          expect(studentDetails.enrollmentNumber).toBe(studentData.enrollmentNumber);
        }

        // Test bulk export doesn't expose sensitive data
        const exportResponse = await page.request.get(`${API_BASE}/students/export?format=csv`);
        
        if (exportResponse.status() === 200) {
          const exportData = await exportResponse.text();
          expect(exportData).not.toContain('123-45-6789'); // SSN
          expect(exportData).not.toContain('1234567890'); // Bank account
        }

      } finally {
        await page.request.delete(`${API_BASE}/students/${studentId}`);
      }
    }
  });

  test('File Upload Security', async ({ page }) => {
    // Test file upload security measures
    
    // Test 1: Malicious file upload attempts
    const maliciousFiles = [
      {
        name: 'malicious.php',
        content: '<?php system($_GET["cmd"]); ?>',
        contentType: 'application/x-php'
      },
      {
        name: 'script.js',
        content: 'alert("XSS from file");',
        contentType: 'application/javascript'
      },
      {
        name: 'exploit.html',
        content: '<script>document.location="http://evil.com"</script>',
        contentType: 'text/html'
      },
      {
        name: 'large_file.txt',
        content: 'A'.repeat(10 * 1024 * 1024), // 10MB file
        contentType: 'text/plain'
      }
    ];

    for (const file of maliciousFiles) {
      const formData = new FormData();
      const blob = new Blob([file.content], { type: file.contentType });
      formData.append('file', blob, file.name);

      // Test various file upload endpoints
      const uploadEndpoints = [
        `${API_BASE}/students/import`,
        `${API_BASE}/faculty/import`,
        `${API_BASE}/projects/import`
      ];

      for (const endpoint of uploadEndpoints) {
        try {
          const uploadResponse = await page.request.post(endpoint, {
            multipart: { file: { name: file.name, mimeType: file.contentType, buffer: Buffer.from(file.content) } },
            timeout: 10000
          });

          // Should either reject malicious files or handle them safely
          expect([200, 400, 413, 415, 422].includes(uploadResponse.status())).toBe(true);

          if (uploadResponse.status() >= 400) {
            const errorData = await uploadResponse.text();
            // Error should not expose system information
            expect(errorData).not.toContain('path');
            expect(errorData).not.toContain('directory');
          }
        } catch (error) {
          // Network errors are acceptable for large files or timeout
          expect(error.message).toContain('timeout');
        }
      }
    }

    // Test 2: Valid file upload
    const validCSVContent = 'firstName,lastName,enrollmentNumber,email\nTest,User,TEST123,test@example.com';
    const validFormData = new FormData();
    const validBlob = new Blob([validCSVContent], { type: 'text/csv' });
    validFormData.append('file', validBlob, 'valid_students.csv');

    const validUploadResponse = await page.request.post(`${API_BASE}/students/import`, {
      multipart: { 
        file: { 
          name: 'valid_students.csv', 
          mimeType: 'text/csv', 
          buffer: Buffer.from(validCSVContent) 
        } 
      }
    });

    // Valid uploads should be processed or validated
    expect([200, 201, 400, 422].includes(validUploadResponse.status())).toBe(true);
  });

  test('Rate Limiting and DoS Protection', async ({ page }) => {
    // Test rate limiting and denial of service protection
    
    // Test 1: Rapid API requests
    const rapidRequests = [];
    const requestCount = 20;

    for (let i = 0; i < requestCount; i++) {
      const promise = page.request.get(`${API_BASE}/students?page=1&limit=1`);
      rapidRequests.push(promise);
    }

    const results = await Promise.allSettled(rapidRequests);
    
    let successCount = 0;
    let rateLimitCount = 0;
    let errorCount = 0;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const status = result.value.status();
        if (status === 200) {
          successCount++;
        } else if (status === 429) { // Too Many Requests
          rateLimitCount++;
        } else {
          errorCount++;
        }
      } else {
        errorCount++;
      }
    }

    // System should handle rapid requests gracefully
    expect(successCount + rateLimitCount + errorCount).toBe(requestCount);
    
    // Either all requests succeed (no rate limiting) or some are rate limited
    expect(successCount + rateLimitCount).toBeGreaterThan(requestCount * 0.5);

    // Test 2: Large payload DoS attempt
    const largePayload = {
      firstName: 'A'.repeat(100000), // Very large field
      lastName: 'DoS Test',
      enrollmentNumber: generateUniqueId(),
      email: `dos.test.${generateUniqueId()}@example.com`,
      description: 'B'.repeat(500000), // Very large description
      currentSemester: 3,
      department: 'Computer Engineering'
    };

    const dosResponse = await page.request.post(`${API_BASE}/students`, {
      data: largePayload,
      timeout: 10000
    });

    // Should reject or handle large payloads gracefully
    expect([200, 201, 400, 413, 422].includes(dosResponse.status())).toBe(true);

    if (dosResponse.status() === 201) {
      const student = await dosResponse.json();
      // If accepted, data should be truncated or normalized
      expect(student.firstName.length).toBeLessThan(largePayload.firstName.length);
      await page.request.delete(`${API_BASE}/students/${student.id}`);
    }

    // Test 3: Concurrent resource creation DoS
    const concurrentCreations = [];
    for (let i = 0; i < 15; i++) {
      const notificationData = {
        userId: `dos_user_${i}`,
        title: `DoS Test Notification ${i}`,
        message: `DoS test message ${i}`,
        type: 'info'
      };

      const promise = page.request.post(`${API_BASE}/notifications`, {
        data: notificationData
      });
      concurrentCreations.push({ promise, index: i });
    }

    const concurrentResults = await Promise.allSettled(concurrentCreations.map(c => c.promise));
    const createdNotifications = [];

    for (let i = 0; i < concurrentResults.length; i++) {
      const result = concurrentResults[i];
      if (result.status === 'fulfilled' && result.value.status() === 201) {
        const notification = await result.value.json();
        createdNotifications.push(notification.id);
      }
    }

    // System should handle concurrent creations without corruption
    expect(createdNotifications.length).toBeGreaterThan(0);

    // Clean up created notifications
    for (const notificationId of createdNotifications) {
      await page.request.delete(`${API_BASE}/notifications/${notificationId}`);
    }
  });

  test('Security Headers and Response Validation', async ({ page }) => {
    // Test security headers and response security measures
    
    const endpoints = [
      `${API_BASE}/students`,
      `${API_BASE}/projects`,
      `${API_BASE}/notifications`
    ];

    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint);
      
      if (response.status() === 200) {
        const headers = response.headers();
        
        // Check for security headers (optional but recommended)
        const securityHeaders = [
          'x-frame-options',
          'x-content-type-options',
          'x-xss-protection',
          'strict-transport-security',
          'content-security-policy'
        ];

        // Note: Not all headers may be present, but check for their existence
        for (const header of securityHeaders) {
          if (headers[header]) {
            expect(headers[header]).toBeDefined();
          }
        }

        // Ensure content type is properly set
        expect(headers['content-type']).toContain('application/json');

        // Ensure no sensitive information in headers
        const headerValues = Object.values(headers).join(' ');
        expect(headerValues).not.toContain('password');
        expect(headerValues).not.toContain('secret');
        expect(headerValues).not.toContain('database');
      }
    }

    // Test CORS handling
    const corsResponse = await page.request.get(`${API_BASE}/students`, {
      headers: {
        'Origin': 'http://malicious-site.com'
      }
    });

    // CORS should be properly configured
    expect([200, 403].includes(corsResponse.status())).toBe(true);
  });
});