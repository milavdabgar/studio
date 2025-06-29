#!/usr/bin/env node

/**
 * Faculty Data Migration Script
 * 
 * This script migrates existing faculty data from in-memory storage to MongoDB.
 * It preserves all existing data and maintains referential integrity with users.
 */

const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager';

// Sample in-memory data (replace with actual data from your store)
const sampleFacultyData = [
  {
    id: "fac_cs01_gpp",
    userId: "user_faculty_cs01_gpp",
    staffCode: "FCS01",
    gtuName: "PROF. FACULTY CS01 GPP",
    title: "Prof.",
    firstName: "CS01",
    lastName: "FACULTY",
    personalEmail: "faculty.cs01@example.com",
    instituteEmail: "faculty.cs01@gppalanpur.ac.in",
    department: "Computer Engineering",
    designation: "Lecturer",
    jobType: "Regular",
    staffCategory: "Teaching",
    status: "active",
    instituteId: "inst1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "fac_me01_gpp",
    userId: "user_faculty_me01_gpp",
    staffCode: "FME01",
    gtuName: "DR. PATEL RAJ KUMAR",
    title: "Dr.",
    firstName: "RAJ",
    middleName: "KUMAR",
    lastName: "PATEL",
    personalEmail: "faculty.me01@example.com",
    instituteEmail: "faculty.me01@gppalanpur.ac.in",
    department: "Mechanical Engineering",
    designation: "Associate Professor",
    jobType: "Regular",
    staffCategory: "Teaching",
    status: "active",
    instituteId: "inst1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "fac_hod_ce_gpp",
    userId: "user_hod_ce_gpp",
    staffCode: "HODCE",
    gtuName: "DR. HOD COMPUTER ENGINEERING",
    title: "Dr.",
    firstName: "COMPUTER",
    lastName: "HOD",
    personalEmail: "hod.ce@example.com",
    instituteEmail: "hod.ce@gppalanpur.ac.in",
    department: "Computer Engineering",
    designation: "Head of Department",
    jobType: "Regular",
    staffCategory: "Teaching",
    status: "active",
    instituteId: "inst1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "fac_cwan_conv_gpp",
    userId: "user_committee_convener_gpp",
    staffCode: "CWANCONV",
    gtuName: "CONVENER CWAN GPP",
    firstName: "CWAN",
    lastName: "CONVENER",
    personalEmail: "convener.cwan@example.com",
    instituteEmail: "convener.cwan@gppalanpur.ac.in",
    department: "General Department",
    designation: "Lecturer",
    jobType: "Regular",
    staffCategory: "Teaching",
    status: "active",
    instituteId: "inst1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

async function migrateFacultyToMongoDB() {
  let client;
  
  try {
    console.log('🚀 Starting faculty data migration to MongoDB...');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const facultyCollection = db.collection('faculties');
    
    // Check if faculty already exist
    const existingCount = await facultyCollection.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing faculty in MongoDB`);
      console.log('   Checking for duplicates and migrating new records only...');
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const faculty of sampleFacultyData) {
      try {
        // Check if faculty already exists (by staffCode or custom id)
        const existingFaculty = await facultyCollection.findOne({
          $or: [
            { staffCode: faculty.staffCode },
            { id: faculty.id }
          ]
        });
        
        if (existingFaculty) {
          console.log(`⏭️  Skipping ${faculty.staffCode} - already exists`);
          skippedCount++;
          continue;
        }
        
        // Ensure default values for MongoDB schema
        const facultyToInsert = {
          ...faculty,
          // Ensure all required fields have defaults
          staffCategory: faculty.staffCategory || 'Teaching',
          status: faculty.status || 'active',
          createdAt: faculty.createdAt || new Date().toISOString(),
          updatedAt: faculty.updatedAt || new Date().toISOString(),
        };
        
        // Insert the faculty
        await facultyCollection.insertOne(facultyToInsert);
        console.log(`✅ Migrated faculty: ${faculty.staffCode} (${faculty.gtuName || faculty.firstName + ' ' + faculty.lastName})`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating faculty ${faculty.staffCode}:`, error.message);
        errorCount++;
      }
    }
    
    // Create indexes for better performance
    console.log('📊 Creating database indexes...');
    await facultyCollection.createIndex({ staffCode: 1 }, { unique: true });
    await facultyCollection.createIndex({ id: 1 }, { unique: true, sparse: true });
    await facultyCollection.createIndex({ instituteEmail: 1 }, { unique: true });
    await facultyCollection.createIndex({ department: 1 });
    await facultyCollection.createIndex({ status: 1 });
    await facultyCollection.createIndex({ staffCategory: 1 });
    await facultyCollection.createIndex({ designation: 1 });
    console.log('✅ Database indexes created');
    
    // Summary
    console.log('\n🎉 Migration completed!');
    console.log(`📈 Summary:`);
    console.log(`   • Migrated: ${migratedCount} faculty`);
    console.log(`   • Skipped: ${skippedCount} faculty (already exist)`);
    console.log(`   • Errors: ${errorCount} faculty`);
    console.log(`   • Total in MongoDB: ${await facultyCollection.countDocuments()} faculty`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some faculty failed to migrate. Please check the errors above.');
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
function getInMemoryFacultyData() {
  try {
    // In a real scenario, you might need to:
    // 1. Start your Next.js app in a special mode to export the data
    // 2. Read from a backup file
    // 3. Connect to your running app and extract the data
    
    console.log('📝 Using sample data. In production, replace this with actual in-memory data extraction.');
    return sampleFacultyData;
  } catch (error) {
    console.error('Error reading in-memory data:', error);
    return [];
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateFacultyToMongoDB().catch(console.error);
}

module.exports = { migrateFacultyToMongoDB };