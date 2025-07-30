#!/usr/bin/env node

import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next';
const CURRENT_ACADEMIC_YEAR = '2025-26';
const SEMESTER = 5;
const EC_PROGRAM_ID = '687737021f12e82942cbcdda'; // Electronics & Communication Engineering
const EC_BATCH_11_2023_ID = '6886621e4ecffc262ee5ed12'; // 11-2023 batch

async function createECSem5CourseOfferings() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const coursesCollection = db.collection('courses');
    const batchesCollection = db.collection('batches');
    const courseOfferingsCollection = db.collection('courseofferings');
    const curriculumCollection = db.collection('curriculums');
    const facultiesCollection = db.collection('faculties');
    const roomsCollection = db.collection('rooms');
    
    // Get active curriculum for EC program
    const activeCurriculum = await curriculumCollection.findOne({
      programId: EC_PROGRAM_ID,
      status: 'active'
    });
    
    if (!activeCurriculum) {
      console.log('No active curriculum found for EC program');
      return;
    }
    
    console.log(`Found active curriculum: ${activeCurriculum.id || activeCurriculum._id} for EC program`);
    
    // Get the 11-2023 batch
    const batch = await batchesCollection.findOne({
      _id: new ObjectId(EC_BATCH_11_2023_ID)
    });
    
    if (!batch) {
      console.log('11-2023 batch not found');
      return;
    }
    
    console.log(`Found batch: ${batch.name}`);
    
    // Get all courses
    const courses = await coursesCollection.find({}).toArray();
    console.log(`Found ${courses.length} courses`);
    
    // Get some faculty members for assignment
    const faculties = await facultiesCollection.find({}).limit(10).toArray();
    console.log(`Found ${faculties.length} faculty members`);
    
    // Get some rooms for assignment
    const rooms = await roomsCollection.find({}).limit(10).toArray();
    console.log(`Found ${rooms.length} rooms`);
    
    let createdCount = 0;
    
    // Get courses for semester 5 from curriculum
    const semesterCourses = activeCurriculum.courses.filter(c => c.semester === SEMESTER);
    console.log(`Found ${semesterCourses.length} courses for semester ${SEMESTER} in curriculum`);
    
    if (semesterCourses.length === 0) {
      console.log('No courses found for semester 5 in curriculum. Let me check all semester courses...');
      
      // Debug: show all courses in curriculum with their semesters
      const allCurriculumCourses = activeCurriculum.courses;
      const semesterCounts = {};
      allCurriculumCourses.forEach(c => {
        semesterCounts[c.semester] = (semesterCounts[c.semester] || 0) + 1;
      });
      
      console.log('Courses by semester in curriculum:');
      Object.entries(semesterCounts).forEach(([sem, count]) => {
        console.log(`  Semester ${sem}: ${count} courses`);
      });
      
      // Let's try to find EC courses with semester 5 directly in the courses collection
      const directSem5Courses = await coursesCollection.find({
        programId: EC_PROGRAM_ID,
        semester: SEMESTER
      }).toArray();
      
      console.log(`Found ${directSem5Courses.length} EC courses with semester 5 directly in courses collection`);
      
      if (directSem5Courses.length > 0) {
        console.log('Using courses found directly in courses collection:');
        for (const course of directSem5Courses) {
          console.log(`  - ${course.subjectName} (${course.subcode})`);
          
          // Check if course offering already exists
          const existingOffering = await courseOfferingsCollection.findOne({
            batchId: EC_BATCH_11_2023_ID,
            courseId: course._id?.toString() || course.id,
            semester: SEMESTER,
            academicYear: CURRENT_ACADEMIC_YEAR
          });
          
          if (existingOffering) {
            console.log(`    Course offering already exists for ${course.subjectName}`);
            continue;
          }
          
          // Create course offering
          const courseOffering = {
            id: `co_${course._id?.toString() || course.id}_${EC_BATCH_11_2023_ID}_sem${SEMESTER}_${Date.now()}`,
            courseId: course._id?.toString() || course.id,
            batchId: EC_BATCH_11_2023_ID,
            academicYear: CURRENT_ACADEMIC_YEAR,
            semester: SEMESTER,
            facultyIds: faculties.slice(0, 2).map(f => f._id?.toString() || f.id),
            roomIds: rooms.slice(0, 2).map(r => r._id?.toString() || r.id),
            startDate: new Date('2025-07-30T00:00:00.000Z'),
            endDate: new Date('2025-11-30T00:00:00.000Z'),
            status: 'scheduled',
            currentEnrollments: 0,
            maxEnrollments: batch.maxIntake || 60,
            programId: EC_PROGRAM_ID,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await courseOfferingsCollection.insertOne(courseOffering);
          createdCount++;
          console.log(`    ✓ Created course offering for ${course.subjectName}`);
        }
      }
    } else {
      // Process courses from curriculum
      for (const curriculumCourse of semesterCourses) {
        // Find the actual course
        const course = courses.find(c => 
          c._id?.toString() === curriculumCourse.courseId || 
          c.id === curriculumCourse.courseId
        );
        
        if (!course) {
          console.log(`    Warning: Course ${curriculumCourse.courseId} not found`);
          continue;
        }
        
        // Check if course offering already exists
        const existingOffering = await courseOfferingsCollection.findOne({
          batchId: EC_BATCH_11_2023_ID,
          courseId: course._id?.toString() || course.id,
          semester: SEMESTER,
          academicYear: CURRENT_ACADEMIC_YEAR
        });
        
        if (existingOffering) {
          console.log(`    Course offering already exists for ${course.subjectName}`);
          continue;
        }
        
        // Create course offering
        const courseOffering = {
          id: `co_${course._id?.toString() || course.id}_${EC_BATCH_11_2023_ID}_sem${SEMESTER}_${Date.now()}`,
          courseId: course._id?.toString() || course.id,
          batchId: EC_BATCH_11_2023_ID,
          academicYear: CURRENT_ACADEMIC_YEAR,
          semester: SEMESTER,
          facultyIds: faculties.slice(0, 2).map(f => f._id?.toString() || f.id),
          roomIds: rooms.slice(0, 2).map(r => r._id?.toString() || r.id),
          startDate: new Date('2025-07-30T00:00:00.000Z'),
          endDate: new Date('2025-11-30T00:00:00.000Z'),
          status: 'scheduled',
          currentEnrollments: 0,
          maxEnrollments: batch.maxIntake || 60,
          programId: EC_PROGRAM_ID,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await courseOfferingsCollection.insertOne(courseOffering);
        createdCount++;
        console.log(`    ✓ Created course offering for ${course.subjectName}`);
      }
    }
    
    if (createdCount === 0) {
      console.log('\n❌ No course offerings were created. This might be because:');
      console.log('1. No semester 5 courses exist in the curriculum or courses collection');
      console.log('2. All course offerings already exist');
      console.log('3. The curriculum structure is different than expected');
    } else {
      console.log(`\n🎉 Successfully created ${createdCount} course offerings for EC Semester 5!`);
    }
    
  } catch (error) {
    console.error('Error creating course offerings:', error);
  } finally {
    await client.close();
  }
}

// Run the script
createECSem5CourseOfferings().catch(console.error);