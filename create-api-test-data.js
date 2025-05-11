#!/usr/bin/env node

/**
 * This script creates the minimum required test data for API tests
 * It focuses specifically on creating data for endpoints that are being skipped
 */

const fetch = require('node-fetch');
const API_BASE_URL = 'http://localhost:9003/api';

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (response.ok) {
      return await response.json();
    } else {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      return null;
    }
  } catch (error) {
    console.error(`Request Error: ${error.message}`);
    return null;
  }
}

// Create test data for API tests
async function createApiTestData() {
  console.log('Creating test data for API tests...');

  // 1. Create or get an institute
  let institute;
  const institutes = await apiRequest('/institutes');
  
  if (institutes && institutes.length > 0) {
    institute = institutes[0];
    console.log(`Using existing institute: ${institute.name}`);
  } else {
    institute = await apiRequest('/institutes', 'POST', {
      name: 'Test Institute',
      code: 'TEST',
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zip: '12345',
      country: 'Test Country',
      phone: '1234567890',
      email: 'test@example.com',
      website: 'https://test.example.com'
    });
    
    if (institute) {
      console.log(`Created institute: ${institute.name}`);
    }
  }
  
  if (!institute) {
    console.error('Failed to get or create institute');
    return;
  }

  // 2. Create or get a building (needed for buildings API tests)
  let building;
  const buildings = await apiRequest('/buildings');
  
  if (buildings && buildings.length > 0) {
    building = buildings[0];
    console.log(`Using existing building: ${building.name}`);
  } else {
    building = await apiRequest('/buildings', 'POST', {
      name: 'Test Building',
      code: 'TB',
      description: 'A test building',
      floors: 3,
      instituteId: institute.id,
      status: 'active'
    });
    
    if (building) {
      console.log(`Created building: ${building.name}`);
    }
  }

  // 3. Create or get a program (needed for batches and courses)
  let program;
  const programs = await apiRequest('/programs');
  
  if (programs && programs.length > 0) {
    program = programs[0];
    console.log(`Using existing program: ${program.name}`);
  } else {
    program = await apiRequest('/programs', 'POST', {
      name: 'Test Program',
      code: 'TP',
      description: 'A test program',
      instituteId: institute.id,
      durationYears: 4,
      degreeType: 'bachelor',
      status: 'active'
    });
    
    if (program) {
      console.log(`Created program: ${program.name}`);
    }
  }
  
  if (!program) {
    console.error('Failed to get or create program');
    return;
  }

  // 4. Create or get a batch (needed for batch API tests)
  let batch;
  const batches = await apiRequest('/batches');
  
  if (batches && batches.length > 0) {
    batch = batches[0];
    console.log(`Using existing batch: ${batch.name}`);
  } else {
    batch = await apiRequest('/batches', 'POST', {
      name: 'Test Batch 2025',
      programId: program.id,
      startAcademicYear: 2021,
      endAcademicYear: 2025,
      maxIntake: 60,
      status: 'active'
    });
    
    if (batch) {
      console.log(`Created batch: ${batch.name}`);
    }
  }

  // 5. Create a new test course specifically for assessments
  console.log('Creating a new test course for assessments...');
  const testCourse = await apiRequest('/courses', 'POST', {
    name: 'Assessment Test Course',
    code: 'ATC101',
    subjectCode: 'SUBJ101', // Added subject code
    description: 'A test course for assessments',
    programId: program.id,
    credits: 4,
    semester: 1,
    status: 'active',
    teachingHours: 40, // Added teaching hours
    practicalHours: 20, // Added practical hours
    totalMarks: 100 // Added total marks
  });
  
  let course = testCourse;
  if (course) {
    console.log(`Created new course for assessments: ${course.name}`);
  } else {
    console.error('Failed to create new course for assessments');
    
    // Fall back to existing courses if available
    const courses = await apiRequest('/courses');
    if (courses && courses.length > 0) {
      course = courses[0];
      console.log(`Using existing course as fallback: ${course?.name || 'Unknown Course'}`);
    }
  }
  
  if (!course) {
    console.error('Failed to get or create course');
    return;
  }

  // 6. Create or get an assessment (needed for assessment API tests)
  let assessment;
  const assessments = await apiRequest('/assessments');
  
  if (assessments && assessments.length > 0) {
    assessment = assessments[0];
    console.log(`Using existing assessment: ${assessment.name}`);
  } else {
    assessment = await apiRequest('/assessments', 'POST', {
      name: 'Test Assessment',
      description: 'A test assessment',
      courseId: course.id,
      type: 'quiz',
      maxMarks: 20,
      weightage: 10,
      status: 'active'
    });
    
    if (assessment) {
      console.log(`Created assessment: ${assessment.name}`);
    } else {
      console.error('Failed to create assessment - check if all required fields are provided');
    }
  }

  console.log('Test data creation completed!');
}

// Run the function
createApiTestData().catch(error => {
  console.error('Error creating test data:', error);
});
