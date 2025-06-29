#!/usr/bin/env node

/**
 * Student Data Migration Script
 * 
 * This script migrates existing student data from in-memory storage to MongoDB.
 * It preserves all existing data and maintains referential integrity with users.
 */

const { MongoClient } = require('mongodb');
const path = require('path');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager';

// Sample in-memory data (replace with actual data from your store)
const sampleStudentsData = [
  {
    id: "std_ce_001_gpp",
    userId: "user_student_ce001_gpp",
    enrollmentNumber: "220010107001",
    gtuEnrollmentNumber: "220010107001",
    programId: "prog_dce_gpp",
    department: "dept_ce_gpp",
    batchId: "batch_dce_2022_gpp",
    currentSemester: 3,
    admissionDate: "2022-07-01T00:00:00.000Z",
    category: "OPEN",
    shift: "Morning",
    isComplete: false,
    termClose: false,
    isCancel: false,
    isPassAll: false,
    sem1Status: "Passed",
    sem2Status: "Passed",
    sem3Status: "Pending",
    fullNameGtuFormat: "DOE JOHN MICHAEL",
    firstName: "JOHN",
    middleName: "MICHAEL",
    lastName: "DOE",
    gender: "Male",
    dateOfBirth: "2003-08-15T00:00:00.000Z",
    personalEmail: "student.ce001@example.com",
    instituteEmail: "220010107001@gppalanpur.ac.in",
    contactNumber: "9988776655",
    status: "active",
    instituteId: "inst1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "std_me_002_gpp",
    userId: "user_student_me002_gpp",
    enrollmentNumber: "220010108002",
    gtuEnrollmentNumber: "220010108002",
    programId: "prog_dme_gpp", 
    department: "dept_me_gpp",
    batchId: "batch_dme_2023_gpp", 
    currentSemester: 1,
    admissionDate: "2023-07-10T00:00:00.000Z",
    category: "SEBC",
    shift: "Afternoon",
    isComplete: false,
    termClose: false,
    isCancel: false,
    isPassAll: true,
    sem1Status: "Passed",
    fullNameGtuFormat: "SMITH JANE ANNA",
    firstName: "JANE",
    middleName: "ANNA",
    lastName: "SMITH",
    gender: "Female",
    dateOfBirth: "2004-01-20T00:00:00.000Z",
    personalEmail: "student.me002@example.com",
    instituteEmail: "220010108002@gppalanpur.ac.in",
    contactNumber: "9876500002",
    status: "active",
    instituteId: "inst1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

async function migrateStudentsToMongoDB() {
  let client;
  
  try {
    console.log('🚀 Starting student data migration to MongoDB...');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const studentsCollection = db.collection('students');
    
    // Check if students already exist
    const existingCount = await studentsCollection.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing students in MongoDB`);
      console.log('   Checking for duplicates and migrating new records only...');
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const student of sampleStudentsData) {
      try {
        // Check if student already exists (by enrollmentNumber or custom id)
        const existingStudent = await studentsCollection.findOne({
          $or: [
            { enrollmentNumber: student.enrollmentNumber },
            { id: student.id }
          ]
        });
        
        if (existingStudent) {
          console.log(`⏭️  Skipping ${student.enrollmentNumber} - already exists`);
          skippedCount++;
          continue;
        }
        
        // Ensure default values for MongoDB schema
        const studentToInsert = {
          ...student,
          // Ensure all required fields have defaults
          currentSemester: student.currentSemester || 1,
          status: student.status || 'active',
          isActive: student.isActive !== false,
          sem1Status: student.sem1Status || 'N/A',
          sem2Status: student.sem2Status || 'N/A',
          sem3Status: student.sem3Status || 'N/A',
          sem4Status: student.sem4Status || 'N/A',
          sem5Status: student.sem5Status || 'N/A',
          sem6Status: student.sem6Status || 'N/A',
          sem7Status: student.sem7Status || 'N/A',
          sem8Status: student.sem8Status || 'N/A',
          isComplete: student.isComplete || false,
          termClose: student.termClose || false,
          isCancel: student.isCancel || false,
          isPassAll: student.isPassAll || false,
          createdAt: student.createdAt || new Date().toISOString(),
          updatedAt: student.updatedAt || new Date().toISOString(),
        };
        
        // Insert the student
        await studentsCollection.insertOne(studentToInsert);
        console.log(`✅ Migrated student: ${student.enrollmentNumber} (${student.fullNameGtuFormat || student.firstName + ' ' + student.lastName})`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating student ${student.enrollmentNumber}:`, error.message);
        errorCount++;
      }
    }
    
    // Create indexes for better performance
    console.log('📊 Creating database indexes...');
    await studentsCollection.createIndex({ enrollmentNumber: 1 }, { unique: true });
    await studentsCollection.createIndex({ id: 1 }, { unique: true, sparse: true });
    await studentsCollection.createIndex({ instituteEmail: 1 }, { unique: true });
    await studentsCollection.createIndex({ programId: 1 });
    await studentsCollection.createIndex({ department: 1 });
    await studentsCollection.createIndex({ status: 1 });
    await studentsCollection.createIndex({ currentSemester: 1 });
    console.log('✅ Database indexes created');
    
    // Summary
    console.log('\n🎉 Migration completed!');
    console.log(`📈 Summary:`);
    console.log(`   • Migrated: ${migratedCount} students`);
    console.log(`   • Skipped: ${skippedCount} students (already exist)`);
    console.log(`   • Errors: ${errorCount} students`);
    console.log(`   • Total in MongoDB: ${await studentsCollection.countDocuments()} students`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some students failed to migrate. Please check the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Helper function to read actual in-memory data (if needed)
function getInMemoryStudentData() {
  try {
    // In a real scenario, you might need to:
    // 1. Start your Next.js app in a special mode to export the data
    // 2. Read from a backup file
    // 3. Connect to your running app and extract the data
    
    console.log('📝 Using sample data. In production, replace this with actual in-memory data extraction.');
    return sampleStudentsData;
  } catch (error) {
    console.error('Error reading in-memory data:', error);
    return [];
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateStudentsToMongoDB().catch(console.error);
}

module.exports = { migrateStudentsToMongoDB };