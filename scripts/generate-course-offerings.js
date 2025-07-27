#!/usr/bin/env node

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next';
const CURRENT_ACADEMIC_YEAR = '2025-26';

async function generateCourseOfferings() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const coursesCollection = db.collection('courses');
    const batchesCollection = db.collection('batches');
    const courseOfferingsCollection = db.collection('courseofferings');
    const curriculumsCollection = db.collection('curriculum');
    const programsCollection = db.collection('programs');
    const facultiesCollection = db.collection('faculties');
    const roomsCollection = db.collection('rooms');
    
    // Get all active batches (2024 start year and later)
    const activeBatches = await batchesCollection.find({
      startAcademicYear: { $gte: 2024 }
    }).toArray();
    
    console.log(`Found ${activeBatches.length} active batches`);
    
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
    
    for (const batch of activeBatches) {
      const batchId = batch.id || batch._id.toString();
      console.log(`\nProcessing batch: ${batch.name} (${batchId})`);
      
      // Get program for this batch
      const program = await programsCollection.findOne({ 
        $or: [
          { _id: batch.programId },
          { id: batch.programId }
        ]
      });
      
      if (!program) {
        console.log(`  Warning: No program found for batch ${batch.name}`);
        continue;
      }
      
      // Find curriculum for this program
      const curriculum = await curriculumsCollection.findOne({
        programId: { $in: [program._id?.toString(), program.id] },
        status: 'active'
      });
      
      if (!curriculum) {
        console.log(`  Warning: No active curriculum found for program ${program.name}`);
        continue;
      }
      
      // Calculate which semester the batch should be in for 2025-26
      const batchStartYear = batch.startAcademicYear;
      const currentYear = 2025;
      const yearsElapsed = currentYear - batchStartYear;
      const semestersToCreate = [];
      
      // Create course offerings for appropriate semesters
      if (yearsElapsed === 0) {
        // First year batch - create semester 1 and 2
        semestersToCreate.push(1, 2);
      } else if (yearsElapsed === 1) {
        // Second year batch - create semester 3 and 4
        semestersToCreate.push(3, 4);
      } else if (yearsElapsed === 2) {
        // Third year batch - create semester 5 and 6
        semestersToCreate.push(5, 6);
      }
      
      for (const semester of semestersToCreate) {
        console.log(`  Creating course offerings for semester ${semester}`);
        
        // Get courses for this semester from curriculum
        const semesterCourses = curriculum.courses.filter(c => c.semester === semester && c.isActive !== false);
        
        for (const curriculumCourse of semesterCourses) {
          // Find the actual course
          const course = courses.find(c => c.id === curriculumCourse.courseId || c._id?.toString() === curriculumCourse.courseId);
          
          if (!course) {
            console.log(`    Warning: Course ${curriculumCourse.courseId} not found`);
            continue;
          }
          
          // Check if course offering already exists
          const existingOffering = await courseOfferingsCollection.findOne({
            batchId: batchId,
            courseId: course.id || course._id?.toString(),
            semester: semester,
            academicYear: CURRENT_ACADEMIC_YEAR
          });
          
          if (existingOffering) {
            console.log(`    Course offering already exists for ${course.subjectName}`);
            continue;
          }
          
          // Create course offering
          const courseOffering = {
            id: `co_${course.id || course._id}_${batchId}_sem${semester}_${Date.now()}`,
            courseId: course.id || course._id?.toString(),
            batchId: batchId,
            academicYear: CURRENT_ACADEMIC_YEAR,
            semester: semester,
            facultyIds: faculties.slice(0, 2).map(f => f.id || f._id?.toString()), // Assign first 2 faculty
            roomIds: rooms.slice(0, 3).map(r => r.id || r._id?.toString()), // Assign first 3 rooms
            startDate: new Date('2025-07-15T00:00:00.000Z'),
            endDate: new Date('2025-11-15T00:00:00.000Z'),
            status: 'scheduled',
            currentEnrollments: 0,
            maxEnrollments: batch.maxIntake || 120,
            programId: program.id || program._id?.toString(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await courseOfferingsCollection.insertOne(courseOffering);
          createdCount++;
          console.log(`    ✓ Created course offering for ${course.subjectName}`);
        }
      }
    }
    
    console.log(`\n🎉 Successfully created ${createdCount} course offerings!`);
    
  } catch (error) {
    console.error('Error generating course offerings:', error);
  } finally {
    await client.close();
  }
}

// Run the script
generateCourseOfferings().catch(console.error);