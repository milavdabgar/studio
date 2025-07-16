// Simple script to initialize test data for E2E tests
const fetch = require('node-fetch');
const { Headers } = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';

async function initializeTestData() {
  try {
    console.log('Initializing comprehensive test data...');
    
    // Check if we have at least one institute
    let response = await fetch(`${API_BASE_URL}/institutes`);
    let institutes = await response.json();
    let instituteId = '';
    
    // Always ensure "Government Polytechnic Palanpur" exists (required by UI tests)
    const requiredInstitute = institutes?.find(inst => inst.name === 'Government Polytechnic Palanpur');
    
    if (!requiredInstitute) {
      console.log('Creating Government Polytechnic Palanpur institute...');
      response = await fetch(`${API_BASE_URL}/institutes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Government Polytechnic Palanpur',
          code: 'GPP',
          address: 'Polytechnic Campus, Palanpur',
          city: 'Palanpur',
          state: 'Gujarat',
          zip: '385001',
          country: 'India',
          phone: '02742-250888',
          email: 'principal@gpp.edu.in',
          website: 'https://gpp.edu.in',
        })
      });
      
      if (response.ok) {
        const instituteData = await response.json();
        console.log('✅ Created Government Polytechnic Palanpur institute:', instituteData.data?.id || instituteData.id);
        instituteId = instituteData.data?.id || instituteData.id;
      } else {
        console.error('Failed to create Government Polytechnic Palanpur institute');
      }
    } else {
      console.log('✅ Government Polytechnic Palanpur already exists');
      instituteId = requiredInstitute.id;
    }
    
    // If we still don't have institutes, create a backup test institute
    if (!institutes || !Array.isArray(institutes) || institutes.length === 0) {
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
        if (!instituteId) {
          instituteId = newInstitute.data?.id || newInstitute.id;
        }
        console.log('Created backup test institute:', newInstitute.name);
      } else {
        console.error('Failed to create backup test institute');
      }
    }
    
    // If we still don't have an instituteId, use any existing institute
    if (!instituteId && institutes && institutes.length > 0) {
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

    // Check if we have departments (needed for courses)
    response = await fetch(`${API_BASE_URL}/departments`);
    let departments = await response.json();
    let departmentId = '';
    
    if (!departments || !Array.isArray(departments) || departments.length === 0) {
      // Create a test department
      response = await fetch(`${API_BASE_URL}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Computer Engineering',
          code: 'CE',
          instituteId: instituteId,
          status: 'active',
          establishmentYear: 1984
        })
      });
      
      if (response.ok) {
        const newDepartment = await response.json();
        departmentId = newDepartment.id;
        console.log('Created test department:', newDepartment.name);
      } else {
        console.error('Failed to create test department');
      }
    } else {
      departmentId = departments[0].id;
      console.log('Using existing department:', departments[0].name);
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
          subcode: 'TC101',
          subjectName: 'Test Course',
          description: 'Test Course Description',
          programId: programId,
          departmentId: departmentId,
          semester: 1,
          category: 'Core',
          credits: 4,
          theoryHours: 3,
          practicalHours: 1,
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

    // Check if we have faculty members
    response = await fetch(`${API_BASE_URL}/faculty`);
    let faculty = await response.json();
    
    if (!faculty || !Array.isArray(faculty) || faculty.length === 0) {
      // Create a test faculty member
      response = await fetch(`${API_BASE_URL}/faculty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'Faculty',
          staffCode: 'TF001',
          department: 'Computer Engineering',
          instituteEmail: 'test.faculty@gppalanpur.in',
          staffCategory: 'Teaching',
          status: 'active',
          instituteId: instituteId
        })
      });
      
      if (response.ok) {
        const newFaculty = await response.json();
        console.log('Created test faculty:', newFaculty.firstName, newFaculty.lastName);
      } else {
        console.error('Failed to create test faculty');
      }
    } else {
      console.log('Using existing faculty');
    }

    // Check if we have students and ensure they have required fields
    response = await fetch(`${API_BASE_URL}/students`);
    let students = await response.json();
    
    if (!students || !Array.isArray(students) || students.length === 0) {
      // Create a test student with all required fields
      response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentNo: 'TS2025001',
          enrollmentNumber: 'TS2025001', // API might expect this field name
          firstName: 'Test',
          lastName: 'Student',
          fullName: 'Test Student', // Ensure fullName is set
          personalEmail: 'test.student@example.com',
          instituteEmail: 'test.student@gppalanpur.in',
          programId: programId,
          department: departmentId,
          currentSemester: 1,
          status: 'active',
          instituteId: instituteId,
          gender: 'Male',
          contactNumber: '9876543210'
        })
      });
      
      if (response.ok) {
        const newStudent = await response.json();
        console.log('Created test student:', newStudent.firstName, newStudent.lastName);
      } else {
        const errorText = await response.text();
        console.error('Failed to create test student:', errorText);
      }
    } else {
      console.log('Using existing students');
      
      // Check if existing students have required fields and update if needed
      console.log('Checking existing students for required fields...');
      let studentsNeedingUpdate = 0;
      
      for (const student of students.slice(0, 5)) { // Check first 5 students
        if (!student.firstName) {
          studentsNeedingUpdate++;
          
          // Try to extract firstName from fullName or use default
          let firstName = 'Student';
          let lastName = 'User';
          
          if (student.fullName) {
            const nameParts = student.fullName.trim().split(' ');
            firstName = nameParts[0] || 'Student';
            lastName = nameParts.slice(1).join(' ') || 'User';
          }
          
          try {
            const updateResponse = await fetch(`${API_BASE_URL}/students/${student.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...student,
                firstName: firstName,
                lastName: lastName,
                fullName: student.fullName || `${firstName} ${lastName}`
              })
            });
            
            if (updateResponse.ok) {
              console.log(`✅ Updated student ${student.id} with firstName: ${firstName}`);
            } else {
              console.log(`❌ Failed to update student ${student.id}`);
            }
          } catch (error) {
            console.log(`Error updating student ${student.id}:`, error.message);
          }
        }
      }
      
      if (studentsNeedingUpdate > 0) {
        console.log(`Updated ${studentsNeedingUpdate} students with missing firstName field`);
      }
    }

    // Check if we have rooms (needed for timetable tests)
    response = await fetch(`${API_BASE_URL}/rooms`);
    let rooms = await response.json();
    
    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      // First, get a building to associate with the room
      response = await fetch(`${API_BASE_URL}/buildings`);
      let availableBuildings = await response.json();
      
      if (availableBuildings && availableBuildings.length > 0) {
        const buildingId = availableBuildings[0].id;
        
        // Create a test room
        response = await fetch(`${API_BASE_URL}/rooms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomNumber: 'TR101',
            name: 'Test Room 101',
            buildingId: buildingId,
            floor: 1,
            type: 'Classroom',
            capacity: 30,
            areaSqFt: 400,
            facilities: ['Projector', 'Whiteboard'],
            status: 'available',
            notes: 'Test room for e2e testing'
          })
        });
        
        if (response.ok) {
          const newRoom = await response.json();
          console.log('Created test room:', newRoom.name);
        } else {
          console.error('Failed to create test room');
        }
      }
    } else {
      console.log('Using existing rooms');
    }

    console.log('Comprehensive test data initialization complete');
    
    // Add some specific test data that tests expect
    console.log('Creating specific test entities for validation tests...');
    
    // Create specific program with expected ID format for migration tests
    try {
      const specificProgram = {
        id: 'prog_dme_gpp',
        name: 'Diploma in Mechanical Engineering',
        code: 'DME',
        description: 'Diploma program in Mechanical Engineering',
        instituteId: instituteId,
        durationYears: 3,
        degreeType: 'diploma',
        status: 'active'
      };
      
      const progResponse = await fetch(`${API_BASE_URL}/programs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specificProgram)
      });
      
      if (progResponse.ok) {
        console.log('Created specific program for tests: DME');
      }
    } catch (error) {
      console.log('Specific program creation (non-critical):', error.message);
    }
    
    // Create specific batch with expected ID format
    try {
      const specificBatch = {
        id: 'batch_dme_2023_gpp',
        name: 'DME Batch 2023',
        programId: 'prog_dme_gpp',
        startAcademicYear: 2023,
        endAcademicYear: 2026,
        maxIntake: 60,
        status: 'active'
      };
      
      const batchResponse = await fetch(`${API_BASE_URL}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specificBatch)
      });
      
      if (batchResponse.ok) {
        console.log('Created specific batch for tests: DME 2023');
      }
    } catch (error) {
      console.log('Specific batch creation (non-critical):', error.message);
    }
    
    console.log('Specific test entities creation complete');
    
    // Create additional students to meet test expectations (30+ students)
    console.log('Creating additional test students...');
    
    const totalStudentsResponse = await fetch(`${API_BASE_URL}/students`);
    const existingStudents = await totalStudentsResponse.json();
    const currentStudentCount = Array.isArray(existingStudents) ? existingStudents.length : 0;
    
    console.log(`Current student count: ${currentStudentCount}`);
    
    if (currentStudentCount < 30) {
      const studentsToCreate = 30 - currentStudentCount;
      console.log(`Creating ${studentsToCreate} additional students...`);
      
      for (let i = 0; i < studentsToCreate; i++) {
        try {
          const firstName = `Student${i + 1}`;
          const lastName = 'Test';
          const studentData = {
            enrollmentNumber: `TS${2025}${String(100 + i).padStart(3, '0')}`,
            enrollmentNo: `TS${2025}${String(100 + i).padStart(3, '0')}`, // backup field name
            firstName: firstName,
            lastName: lastName,
            fullName: `${firstName} ${lastName}`, // Ensure fullName is set
            personalEmail: `student${i + 1}.test@example.com`,
            instituteEmail: `student${i + 1}.test@gppalanpur.in`,
            programId: programId,
            department: departmentId,
            currentSemester: Math.floor(Math.random() * 8) + 1,
            status: 'active',
            gender: i % 2 === 0 ? 'Male' : 'Female',
            contactNumber: `987654${String(3210 + i).slice(-4)}`,
            instituteId: instituteId
          };
          
          const studentResponse = await fetch(`${API_BASE_URL}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
          });
          
          if (studentResponse.ok) {
            if (i === 0 || (i + 1) % 10 === 0) {
              console.log(`Created ${i + 1} students...`);
            }
          }
        } catch (error) {
          console.log(`Failed to create student ${i + 1}:`, error.message);
        }
      }
      console.log(`Completed creating additional students`);
    } else {
      console.log('Sufficient students already exist');
    }
  } catch (error) {
    console.error('Error initializing test data:', error);
  }
}

// Run the initialization
initializeTestData();
