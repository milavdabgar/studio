// Simple script to initialize test data for E2E tests
const fetch = require('node-fetch');
const { Headers } = require('node-fetch');

const API_BASE_URL = 'http://localhost:9003/api';

async function initializeTestData() {
  try {
    console.log('Initializing test data...');
    
    // Check if we have at least one institute
    let response = await fetch(`${API_BASE_URL}/institutes`);
    let institutes = await response.json();
    let instituteId = '';
    
    if (!institutes || !Array.isArray(institutes) || institutes.length === 0) {
      // Create a test institute
      response = await fetch(`${API_BASE_URL}/institutes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Institute',
          code: 'TEST',
          address: 'Test Address',
          city: 'Test City',
          state: 'Test State',
          zip: '12345',
          country: 'Test Country',
          phone: '1234567890',
          email: 'test@example.com',
          website: 'https://test.example.com',
        })
      });
      
      if (response.ok) {
        const newInstitute = await response.json();
        instituteId = newInstitute.id;
        console.log('Created test institute:', newInstitute.name);
      } else {
        console.error('Failed to create test institute');
      }
    } else {
      instituteId = institutes[0].id;
      console.log('Using existing institute:', institutes[0].name);
    }

    // Check if we have at least one building
    response = await fetch(`${API_BASE_URL}/buildings`);
    let buildings = await response.json();
    
    if (!buildings || !Array.isArray(buildings) || buildings.length === 0) {
      // Create a test building
      response = await fetch(`${API_BASE_URL}/buildings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Building',
          code: 'TB',
          description: 'Test Building Description',
          floors: 3,
          instituteId: instituteId,
          status: 'active'
        })
      });
      
      if (response.ok) {
        const newBuilding = await response.json();
        console.log('Created test building:', newBuilding.name);
      } else {
        console.error('Failed to create test building');
      }
    } else {
      console.log('Using existing building:', buildings[0].name);
    }

    // Check if we have at least one program
    response = await fetch(`${API_BASE_URL}/programs`);
    let programs = await response.json();
    let programId = '';
    
    if (!programs || !Array.isArray(programs) || programs.length === 0) {
      // Create a test program
      response = await fetch(`${API_BASE_URL}/programs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Program',
          code: 'TP',
          description: 'Test Program Description',
          instituteId: instituteId,
          durationYears: 4,
          degreeType: 'bachelor',
          status: 'active'
        })
      });
      
      if (response.ok) {
        const newProgram = await response.json();
        programId = newProgram.id;
        console.log('Created test program:', newProgram.name);
      } else {
        console.error('Failed to create test program');
      }
    } else {
      programId = programs[0].id;
      console.log('Using existing program:', programs[0].name);
    }

    // Check if we have at least one batch
    response = await fetch(`${API_BASE_URL}/batches`);
    let batches = await response.json();
    
    if (!batches || !Array.isArray(batches) || batches.length === 0) {
      // Create a test batch
      response = await fetch(`${API_BASE_URL}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Batch 2025',
          programId: programId,
          startAcademicYear: 2021,
          endAcademicYear: 2025,
          maxIntake: 60,
          status: 'active'
        })
      });
      
      if (response.ok) {
        const newBatch = await response.json();
        console.log('Created test batch:', newBatch.name);
      } else {
        console.error('Failed to create test batch');
      }
    } else {
      console.log('Using existing batch:', batches[0].name);
    }

    // Check if we have at least one course
    response = await fetch(`${API_BASE_URL}/courses`);
    let courses = await response.json();
    let courseId = '';
    
    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      // Create a test course
      response = await fetch(`${API_BASE_URL}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Course',
          code: 'TC101',
          description: 'Test Course Description',
          programId: programId,
          credits: 4,
          semester: 1,
          status: 'active'
        })
      });
      
      if (response.ok) {
        const newCourse = await response.json();
        courseId = newCourse.id;
        console.log('Created test course:', newCourse.name);
      } else {
        console.error('Failed to create test course');
      }
    } else {
      courseId = courses[0].id;
      console.log('Using existing course:', courses[0].name);
    }

    // Check if we have at least one assessment
    response = await fetch(`${API_BASE_URL}/assessments`);
    let assessments = await response.json();
    
    if (!assessments || !Array.isArray(assessments) || assessments.length === 0) {
      // Create a test assessment
      response = await fetch(`${API_BASE_URL}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Assessment',
          description: 'Test Assessment Description',
          courseId: courseId,
          type: 'quiz',
          maxMarks: 20,
          weightage: 10,
          status: 'active'
        })
      });
      
      if (response.ok) {
        const newAssessment = await response.json();
        console.log('Created test assessment:', newAssessment.name);
      } else {
        console.error('Failed to create test assessment');
      }
    } else {
      console.log('Using existing assessment:', assessments[0].name);
    }

    console.log('Test data initialization complete');
  } catch (error) {
    console.error('Error initializing test data:', error);
  }
}

// Run the initialization
initializeTestData();
