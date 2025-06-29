#!/usr/bin/env node

/**
 * Project Teams Data Migration Script
 * 
 * This script migrates existing project teams data from in-memory storage to MongoDB.
 * It preserves all existing data and maintains team member relationships.
 */

const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager';

// Sample in-memory data (replace with actual data from your store)
const sampleProjectTeamsData = [
  { 
    id: "team_innovate_gpp", 
    name: "Team Innovate", 
    department: "dept_ce_gpp", 
    members: [{ 
      userId: "user_student_ce001_gpp", 
      name: "Student CE001", 
      enrollmentNo: "220010107001", 
      role: "Team Leader", 
      isLeader: true 
    }],
    eventId: "event_techfest_2024_gpp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: "team_ecosol_gpp", 
    name: "EcoSolutions", 
    department: "dept_ee_gpp", 
    members: [{ 
      userId: "user_student_me002_gpp", 
      name: "Student ME002", 
      enrollmentNo: "220010108002", 
      role: "Member", 
      isLeader: false 
    }], 
    eventId: "event_techfest_2024_gpp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "team_webdev_gpp",
    name: "WebDev Masters",
    department: "dept_ce_gpp",
    members: [
      {
        userId: "user_student_ce001_gpp",
        name: "Student CE001",
        enrollmentNo: "220010107001",
        role: "Team Leader",
        isLeader: true
      },
      {
        userId: "user_student_me002_gpp",
        name: "Student ME002",
        enrollmentNo: "220010108002",
        role: "Developer",
        isLeader: false
      }
    ],
    eventId: "event_hackathon_2024_gpp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

async function migrateProjectTeamsToMongoDB() {
  let client;
  
  try {
    console.log('🚀 Starting project teams data migration to MongoDB...');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const projectTeamsCollection = db.collection('projectteams');
    
    // Check if project teams already exist
    const existingCount = await projectTeamsCollection.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing project teams in MongoDB`);
      console.log('   Checking for duplicates and migrating new records only...');
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const team of sampleProjectTeamsData) {
      try {
        // Check if team already exists (by name or custom id)
        const existingTeam = await projectTeamsCollection.findOne({
          $or: [
            { name: team.name },
            { id: team.id }
          ]
        });
        
        if (existingTeam) {
          console.log(`⏭️  Skipping ${team.name} - already exists`);
          skippedCount++;
          continue;
        }
        
        // Ensure default values for MongoDB schema
        const teamToInsert = {
          ...team,
          // Ensure all required fields have defaults
          members: team.members || [],
          createdAt: team.createdAt || new Date().toISOString(),
          updatedAt: team.updatedAt || new Date().toISOString(),
        };
        
        // Insert the team
        await projectTeamsCollection.insertOne(teamToInsert);
        console.log(`✅ Migrated project team: ${team.name} (${team.members.length} members)`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating project team ${team.name}:`, error.message);
        errorCount++;
      }
    }
    
    // Create indexes for better performance
    console.log('📊 Creating database indexes...');
    await projectTeamsCollection.createIndex({ name: 1 });
    await projectTeamsCollection.createIndex({ id: 1 }, { unique: true, sparse: true });
    await projectTeamsCollection.createIndex({ department: 1 });
    await projectTeamsCollection.createIndex({ eventId: 1 });
    await projectTeamsCollection.createIndex({ 'members.userId': 1 });
    await projectTeamsCollection.createIndex({ 'members.enrollmentNo': 1 });
    console.log('✅ Database indexes created');
    
    // Summary
    console.log('\n🎉 Migration completed!');
    console.log(`📈 Summary:`);
    console.log(`   • Migrated: ${migratedCount} project teams`);
    console.log(`   • Skipped: ${skippedCount} project teams (already exist)`);
    console.log(`   • Errors: ${errorCount} project teams`);
    console.log(`   • Total in MongoDB: ${await projectTeamsCollection.countDocuments()} project teams`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some project teams failed to migrate. Please check the errors above.');
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

// Run migration if called directly
if (require.main === module) {
  migrateProjectTeamsToMongoDB().catch(console.error);
}

module.exports = { migrateProjectTeamsToMongoDB };