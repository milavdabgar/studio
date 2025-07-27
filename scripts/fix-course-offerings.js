#!/usr/bin/env node

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next';
const CURRENT_ACADEMIC_YEAR = '2025-26';

async function createCourseOfferingsForTimetabling() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const coursesCollection = db.collection('courses');
    const batchesCollection = db.collection('batches');
    const courseOfferingsCollection = db.collection('courseofferings');
    const facultiesCollection = db.collection('faculties');
    const roomsCollection = db.collection('rooms');
    
    // Get active batches (2024+) 
    const activeBatches = await batchesCollection.find({
      startAcademicYear: { $gte: 2024 }
    }).toArray();
    
    console.log(`Found ${activeBatches.length} active batches`);
    
    // Get first 10 courses to create basic course offerings
    const courses = await coursesCollection.find({}).limit(10).toArray();
    console.log(`Found ${courses.length} courses`);
    
    // Get faculty members
    const faculties = await facultiesCollection.find({}).limit(5).toArray();
    console.log(`Found ${faculties.length} faculty members`);
    
    // Get rooms
    const rooms = await roomsCollection.find({}).limit(5).toArray();
    console.log(`Found ${rooms.length} rooms`);
    
    let createdCount = 0;
    
    // For each active batch, create course offerings for semester 1
    for (const batch of activeBatches) {
      const batchId = batch._id.toString();
      console.log(`\nProcessing batch: ${batch.name} (${batchId})`);
      
      // Create course offerings for the first 3 courses in semester 1
      // This will provide enough data for timetable creation testing
      const coursesToAssign = courses.slice(0, 3);
      
      for (const course of coursesToAssign) {
        const courseId = course.id || course._id?.toString();
        
        // Check if course offering already exists
        const existingOffering = await courseOfferingsCollection.findOne({
          batchId: batchId,
          courseId: courseId,
          semester: 1,
          academicYear: CURRENT_ACADEMIC_YEAR
        });
        
        if (existingOffering) {
          console.log(`  Course offering already exists for ${course.subjectName}`);
          continue;
        }
        
        // Create course offering
        const courseOffering = {
          id: `co_${courseId}_${batchId}_sem1_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          courseId: courseId,
          batchId: batchId,
          academicYear: CURRENT_ACADEMIC_YEAR,
          semester: 1,
          facultyIds: faculties.slice(0, 2).map(f => f.id || f._id?.toString()),
          roomIds: rooms.slice(0, 2).map(r => r.id || r._id?.toString()),
          startDate: new Date('2025-07-15T00:00:00.000Z'),
          endDate: new Date('2025-11-15T00:00:00.000Z'),
          status: 'scheduled',
          currentEnrollments: 0,
          maxEnrollments: batch.maxIntake || 60,
          programId: batch.programId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await courseOfferingsCollection.insertOne(courseOffering);
        createdCount++;
        console.log(`  ✓ Created course offering for ${course.subjectName}`);
      }
    }
    
    console.log(`\n🎉 Successfully created ${createdCount} course offerings!`);
    console.log('Timetable creation should now be possible with batch 11-2024, semester 1, academic year 2025-26');
    
  } catch (error) {
    console.error('Error creating course offerings:', error);
  } finally {
    await client.close();
  }
}

// Run the script
createCourseOfferingsForTimetabling().catch(console.error);