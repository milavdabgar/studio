// Quick script to seed test users for project teams E2E tests

const users = [
  {
    id: 'student_test_3',
    displayName: 'Test Student 3',
    email: 'student.test3@gppalanpur.ac.in',
    username: 'student_test_3',
    enrollmentNo: '220010107003',
    role: 'student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'student_leader_1', 
    displayName: 'Student Leader 1',
    email: 'student.leader1@gppalanpur.ac.in',
    username: 'student_leader_1',
    enrollmentNo: '220010107011',
    role: 'student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'student_member_1',
    displayName: 'Student Member 1', 
    email: 'student.member1@gppalanpur.ac.in',
    username: 'student_member_1',
    enrollmentNo: '220010107012',
    role: 'student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'student_member_2',
    displayName: 'Student Member 2',
    email: 'student.member2@gppalanpur.ac.in', 
    username: 'student_member_2',
    enrollmentNo: '220010107013',
    role: 'student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'student_1',
    displayName: 'Student 1',
    email: 'student.1@gppalanpur.ac.in',
    username: 'student_1', 
    enrollmentNo: '220010107021',
    role: 'student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'student_2',
    displayName: 'Student 2',
    email: 'student.2@gppalanpur.ac.in',
    username: 'student_2',
    enrollmentNo: '220010107022', 
    role: 'student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'student_3',
    displayName: 'Student 3',
    email: 'student.3@gppalanpur.ac.in',
    username: 'student_3',
    enrollmentNo: '220010107023',
    role: 'student', 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Add users to global store (in-memory storage)
if (typeof global !== 'undefined') {
  if (!global.__API_USERS_STORE__) {
    global.__API_USERS_STORE__ = [];
  }
  
  // Add test users to the store
  users.forEach(user => {
    if (!global.__API_USERS_STORE__.find(u => u.id === user.id)) {
      global.__API_USERS_STORE__.push(user);
    }
  });
  
  console.log(`✅ Seeded ${users.length} test users for project teams tests`);
} else {
  console.log('⚠️ Global object not available - this script should be required before tests');
}

module.exports = { users };