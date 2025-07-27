#!/usr/bin/env node

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next';
const CURRENT_ACADEMIC_YEAR = '2025-26';

async function createCourseOfferingsForActiveBatches() {
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
    
    // Get all curricula and find active ones
    const allCurricula = await curriculumCollection.find({}).toArray();
    console.log(`Found ${allCurricula.length} total curricula`);
    
    const activeCurriculum = allCurricula.find(c => c.status === 'active');
    
    if (!activeCurriculum) {
      console.log('Available curricula statuses:', allCurricula.map(c => ({id: c.id, status: c.status})));
    }
    
    if (!activeCurriculum) {
      console.log('No active curriculum found');
      return;
    }
    
    console.log(`Found active curriculum: ${activeCurriculum.id} for program: ${activeCurriculum.programId}`);
    
    // Get batches that match this curriculum's program and are from 2024+
    const activeBatches = await batchesCollection.find({
      programId: activeCurriculum.programId,
      startAcademicYear: { $gte: 2024 }
    }).toArray();
    
    console.log(`Found ${activeBatches.length} active batches for this program`);
    
    if (activeBatches.length === 0) {
      console.log('No active batches found for this curriculum program');
      return;
    }
    
    // Get all courses
    const courses = await coursesCollection.find({}).toArray();
    console.log(`Found ${courses.length} courses`);
    
    // Get some faculty members for assignment
    const faculties = await facultiesCollection.find({}).limit(5).toArray();
    console.log(`Found ${faculties.length} faculty members`);
    
    // Get some rooms for assignment
    const rooms = await roomsCollection.find({}).limit(5).toArray();
    console.log(`Found ${rooms.length} rooms`);
    
    let createdCount = 0;
    
    for (const batch of activeBatches) {
      const batchId = batch._id.toString();
      console.log(`\nProcessing batch: ${batch.name} (${batchId})`);
      
      // Calculate which semester the batch should be in for 2025-26
      const batchStartYear = batch.startAcademicYear;
      const currentYear = 2025;
      const yearsElapsed = currentYear - batchStartYear;
      const semestersToCreate = [];
      
      // For now, create course offerings for semester 1 (where we have curriculum data)
      // This is a temporary solution to get the timetable system working
      semestersToCreate.push(1);
      
      console.log(`  Creating course offerings for semesters: ${semestersToCreate.join(', ')}`);
      
      for (const semester of semestersToCreate) {
        // Get courses for this semester from curriculum
        const semesterCourses = activeCurriculum.courses.filter(c => c.semester === semester);
        console.log(`  Found ${semesterCourses.length} courses for semester ${semester}`);
        
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
            batchId: batchId,
            courseId: course._id?.toString() || course.id,
            semester: semester,
            academicYear: CURRENT_ACADEMIC_YEAR
          });
          
          if (existingOffering) {
            console.log(`    Course offering already exists for ${course.subjectName}`);
            continue;
          }
          
          // Create course offering
          const courseOffering = {
            id: `co_${course._id?.toString() || course.id}_${batchId}_sem${semester}_${Date.now()}`,
            courseId: course._id?.toString() || course.id,
            batchId: batchId,
            academicYear: CURRENT_ACADEMIC_YEAR,
            semester: semester,
            facultyIds: faculties.slice(0, 2).map(f => f._id?.toString() || f.id),
            roomIds: rooms.slice(0, 2).map(r => r._id?.toString() || r.id),
            startDate: new Date('2025-07-15T00:00:00.000Z'),
            endDate: new Date('2025-11-15T00:00:00.000Z'),
            status: 'scheduled',
            currentEnrollments: 0,
            maxEnrollments: batch.maxIntake || 60,
            programId: activeCurriculum.programId,
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
    console.error('Error creating course offerings:', error);
  } finally {
    await client.close();
  }
}

// Run the script
createCourseOfferingsForActiveBatches().catch(console.error);