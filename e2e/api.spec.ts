import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000/api'; // Adjust if your API runs on a different port

test.describe('API Endpoints E2E Tests', () => {
  test('GET /assessments - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/assessments`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /assessments/[id] - Should return 200 OK for an existing assessment', async ({ request }) => {
    // Assuming you have at least one assessment in the DB. If not then create it using POST method.
    const responseList = await request.get(`${API_BASE_URL}/assessments`);
    const bodyList = await responseList.json();
    const firstAssessmentId = bodyList[0].id;
    
    const response = await request.get(`${API_BASE_URL}/assessments/${firstAssessmentId}`);
    expect(response.status()).toBe(200);
  });

  test('GET /attendance - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/attendance`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
  test('GET /attendance/[id] - Should return 200 OK for an existing assessment', async ({ request }) => {
    // Assuming you have at least one attendance in the DB. If not then create it using POST method.
    const responseList = await request.get(`${API_BASE_URL}/attendance`);
    const bodyList = await responseList.json();
    const firstAttendanceId = bodyList[0].id;
    
    const response = await request.get(`${API_BASE_URL}/attendance/${firstAttendanceId}`);
    expect(response.status()).toBe(200);
  });
    test('GET /batches - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/batches`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

    test('GET /batches/[id] - Should return 200 OK for an existing batch', async ({ request }) => {
      // Assuming you have at least one batch in the DB. If not then create it using POST method.
      const responseList = await request.get(`${API_BASE_URL}/batches`);
      const bodyList = await responseList.json();
      const firstBatchId = bodyList[0].id;

      const response = await request.get(`${API_BASE_URL}/batches/${firstBatchId}`);
      expect(response.status()).toBe(200);
    });

    test('GET /buildings - Should return 200 OK and an array', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/buildings`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });

    test('GET /buildings/[id] - Should return 200 OK for an existing building', async ({ request }) => {
      // Assuming you have at least one building in the DB. If not then create it using POST method.
      const responseList = await request.get(`${API_BASE_URL}/buildings`);
      const bodyList = await responseList.json();
      const firstBuildingId = bodyList[0].id;
  
      const response = await request.get(`${API_BASE_URL}/buildings/${firstBuildingId}`);
      expect(response.status()).toBe(200);
    });
      test('GET /committees - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/committees`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

    test('GET /committees/[id] - Should return 200 OK for an existing committee', async ({ request }) => {
      // Assuming you have at least one committee in the DB. If not then create it using POST method.
      const responseList = await request.get(`${API_BASE_URL}/committees`);
      const bodyList = await responseList.json();
      const firstCommitteeId = bodyList[0].id;
  
      const response = await request.get(`${API_BASE_URL}/committees/${firstCommitteeId}`);
      expect(response.status()).toBe(200);
    });
      test('GET /courses - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/courses`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

    test('GET /courses/[id] - Should return 200 OK for an existing course', async ({ request }) => {
      // Assuming you have at least one course in the DB. If not then create it using POST method.
      const responseList = await request.get(`${API_BASE_URL}/courses`);
      const bodyList = await responseList.json();
      const firstCourseId = bodyList[0].id;
  
      const response = await request.get(`${API_BASE_URL}/courses/${firstCourseId}`);
      expect(response.status()).toBe(200);
    });
      test('GET /departments - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/departments`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

    test('GET /departments/[id] - Should return 200 OK for an existing department', async ({ request }) => {
      // Assuming you have at least one department in the DB. If not then create it using POST method.
      const responseList = await request.get(`${API_BASE_URL}/departments`);
      const bodyList = await responseList.json();
      const firstDepartmentId = bodyList[0].id;
  
      const response = await request.get(`${API_BASE_URL}/departments/${firstDepartmentId}`);
      expect(response.status()).toBe(200);
    });
    test('GET /faculty - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/faculty`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

    test('GET /faculty/[id] - Should return 200 OK for an existing faculty', async ({ request }) => {
      // Assuming you have at least one faculty in the DB. If not then create it using POST method.
      const responseList = await request.get(`${API_BASE_URL}/faculty`);
      const bodyList = await responseList.json();
      const firstFacultyId = bodyList[0].id;
  
      const response = await request.get(`${API_BASE_URL}/faculty/${firstFacultyId}`);
      expect(response.status()).toBe(200);
    });
        test('GET /institutes - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/institutes`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

    test('GET /institutes/[id] - Should return 200 OK for an existing institute', async ({ request }) => {
      // Assuming you have at least one institute in the DB. If not then create it using POST method.
      const responseList = await request.get(`${API_BASE_URL}/institutes`);
      const bodyList = await responseList.json();
      const firstInstituteId = bodyList[0].id;
  
      const response = await request.get(`${API_BASE_URL}/institutes/${firstInstituteId}`);
      expect(response.status()).toBe(200);
    });
     test('GET /permissions - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/permissions`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
        test('GET /programs - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/programs`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

    test('GET /programs/[id] - Should return 200 OK for an existing program', async ({ request }) => {
      // Assuming you have at least one program in the DB. If not then create it using POST method.
      const responseList = await request.get(`${API_BASE_URL}/programs`);
      const bodyList = await responseList.json();
      const firstProgramId = bodyList[0].id;
  
      const response = await request.get(`${API_BASE_URL}/programs/${firstProgramId}`);
      expect(response.status()).toBe(200);
    });
            test('GET /roles - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/roles`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

    test('GET /roles/[id] - Should return 200 OK for an existing role', async ({ request }) => {
      // Assuming you have at least one role in the DB. If not then create it using POST method.
      const responseList = await request.get(`${API_BASE_URL}/roles`);
      const bodyList = await responseList.json();
      const firstRoleId = bodyList[0].id;
  
      const response = await request.get(`${API_BASE_URL}/roles/${firstRoleId}`);
      expect(response.status()).toBe(200);
    });
                test('GET /room-allocations - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/room-allocations`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

    test('GET /room-allocations/[id] - Should return 200 OK for an existing room allocation', async ({ request }) => {
      // Assuming you have at least one room allocation in the DB. If not then create it using POST method.
      const responseList = await request.get(`${API_BASE_URL}/room-allocations`);
      const bodyList = await responseList.json();
      const firstRoomAllocationId = bodyList[0].id;
  
      const response = await request.get(`${API_BASE_URL}/room-allocations/${firstRoomAllocationId}`);
      expect(response.status()).toBe(200);
    });
                test('GET /rooms - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/rooms`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

    test('GET /rooms/[id] - Should return 200 OK for an existing room', async ({ request }) => {
      // Assuming you have at least one room in the DB. If not then create it using POST method.
      const responseList = await request.get(`${API_BASE_URL}/rooms`);
      const bodyList = await responseList.json();
      const firstRoomId = bodyList[0].id;
  
      const response = await request.get(`${API_BASE_URL}/rooms/${firstRoomId}`);
      expect(response.status()).toBe(200);
    });
                    test('GET /students - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/students`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

    test('GET /students/[id] - Should return 200 OK for an existing student', async ({ request }) => {
      // Assuming you have at least one student in the DB. If not then create it using POST method.
      const responseList = await request.get(`${API_BASE_URL}/students`);
      const bodyList = await responseList.json();
      const firstStudentId = bodyList[0].id;
  
      const response = await request.get(`${API_BASE_URL}/students/${firstStudentId}`);
      expect(response.status()).toBe(200);
    });
                test('GET /users - Should return 200 OK and an array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/users`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

    test('GET /users/[id] - Should return 200 OK for an existing user', async ({ request }) => {
      // Assuming you have at least one user in the DB. If not then create it using POST method.
      const responseList = await request.get(`${API_BASE_URL}/users`);
      const bodyList = await responseList.json();
      const firstUserId = bodyList[0].id;
  
      const response = await request.get(`${API_BASE_URL}/users/${firstUserId}`);
      expect(response.status()).toBe(200);
    });
    // Add POST, PUT, DELETE tests similarly here

    //Example to test post
    test('POST /assessments - Should return 201 created', async ({ request }) => {
      const data = {
          name: 'Test Assessment',
          description: 'Test Assessment Description'
      }
      const response = await request.post(`${API_BASE_URL}/assessments`, {data});
      expect(response.status()).toBe(201);
  });

    test('POST /batches - Should return 201 created', async ({ request }) => {
      const data = {
          name: 'Test Batch',
          description: 'Test Batch Description'
      }
      const response = await request.post(`${API_BASE_URL}/batches`, {data});
      expect(response.status()).toBe(201);
  });

    test('POST /buildings - Should return 201 created', async ({ request }) => {
      const data = {
          name: 'Test Building',
          description: 'Test Building Description'
      }
      const response = await request.post(`${API_BASE_URL}/buildings`, {data});
      expect(response.status()).toBe(201);
  });

    test('POST /committees - Should return 201 created', async ({ request }) => {
      const data = {
          name: 'Test Committee',
          description: 'Test Committee Description'
      }
      const response = await request.post(`${API_BASE_URL}/committees`, {data});
      expect(response.status()).toBe(201);
  });

    test('POST /courses - Should return 201 created', async ({ request }) => {
      const data = {
          name: 'Test Course',
          description: 'Test Course Description'
      }
      const response = await request.post(`${API_BASE_URL}/courses`, {data});
      expect(response.status()).toBe(201);
  });

    test('POST /departments - Should return 201 created', async ({ request }) => {
      const data = {
          name: 'Test Department',
          description: 'Test Department Description'
      }
      const response = await request.post(`${API_BASE_URL}/departments`, {data});
      expect(response.status()).toBe(201);
  });

    test('POST /faculty - Should return 201 created', async ({ request }) => {
      const data = {
          name: 'Test Faculty',
          description: 'Test Faculty Description'
      }
      const response = await request.post(`${API_BASE_URL}/faculty`, {data});
      expect(response.status()).toBe(201);
  });

    test('POST /institutes - Should return 201 created', async ({ request }) => {
      const data = {
          name: 'Test Institute',
          description: 'Test Institute Description'
      }
      const response = await request.post(`${API_BASE_URL}/institutes`, {data});
      expect(response.status()).toBe(201);
  });

    test('POST /programs - Should return 201 created', async ({ request }) => {
      const data = {
          name: 'Test Program',
          description: 'Test Program Description'
      }
      const response = await request.post(`${API_BASE_URL}/programs`, {data});
      expect(response.status()).toBe(201);
  });

    test('POST /roles - Should return 201 created', async ({ request }) => {
      const data = {
          name: 'Test Role',
          description: 'Test Role Description'
      }
      const response = await request.post(`${API_BASE_URL}/roles`, {data});
      expect(response.status()).toBe(201);
  });

    test('POST /room-allocations - Should return 201 created', async ({ request }) => {
      const data = {
          name: 'Test Room Allocation',
          description: 'Test Room Allocation Description'
      }
      const response = await request.post(`${API_BASE_URL}/room-allocations`, {data});
      expect(response.status()).toBe(201);
  });

    test('POST /rooms - Should return 201 created', async ({ request }) => {
      const data = {
          name: 'Test Room',
          description: 'Test Room Description'
      }
      const response = await request.post(`${API_BASE_URL}/rooms`, {data});
      expect(response.status()).toBe(201);
  });

    test('POST /students - Should return 201 created', async ({ request }) => {
      const data = {
          name: 'Test Student',
          description: 'Test Student Description'
      }
      const response = await request.post(`${API_BASE_URL}/students`, {data});
      expect(response.status()).toBe(201);
  });

    test('POST /users - Should return 201 created', async ({ request }) => {
      const data = {
          name: 'Test User',
          description: 'Test User Description'
      }
      const response = await request.post(`${API_BASE_URL}/users`, {data});
      expect(response.status()).toBe(201);
  });

});