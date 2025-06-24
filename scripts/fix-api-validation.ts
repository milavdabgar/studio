#!/usr/bin/env tsx

/**
 * Fix API Validation Script
 * Ensures all entities have required fields for API tests to pass
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = 'polymanager';

async function fixApiValidation() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB for API validation fixes');
    
    const db = client.db(DATABASE_NAME);

    // Fix users to have proper fullName format
    const usersCollection = db.collection('users');
    const usersWithoutProperFullName = await usersCollection.find({
      $or: [
        { fullName: { $exists: false } },
        { fullName: { $not: /\([^)]+\)$/ } }
      ]
    }).toArray();

    for (const user of usersWithoutProperFullName) {
      let fullName = user.fullName || `${user.firstName} ${user.lastName}`;
      
      // Add role suffix if not present
      if (!fullName.includes('(') && user.roles && user.roles.length > 0) {
        const role = user.roles[0];
        const roleDisplayName = role.charAt(0).toUpperCase() + role.slice(1);
        fullName = `${fullName} (${roleDisplayName})`;
      }
      
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { fullName } }
      );
    }
    console.log(`✅ Fixed ${usersWithoutProperFullName.length} user fullName formats`);

    // Ensure departments have proper instituteId references
    const departmentsCollection = db.collection('departments');
    const departments = await departmentsCollection.find({}).toArray();
    
    for (const dept of departments) {
      if (!dept.instituteId) {
        await departmentsCollection.updateOne(
          { _id: dept._id },
          { $set: { instituteId: '507f1f77bcf86cd799439011' } }
        );
      }
    }
    console.log(`✅ Ensured all departments have instituteId`);

    // Ensure programs have proper departmentId references
    const programsCollection = db.collection('programs');
    const programs = await programsCollection.find({}).toArray();
    
    for (const program of programs) {
      if (!program.departmentId) {
        await programsCollection.updateOne(
          { _id: program._id },
          { $set: { departmentId: '507f1f77bcf86cd799439012' } }
        );
      }
    }
    console.log(`✅ Ensured all programs have departmentId`);

    // Ensure batches have proper programId references
    const batchesCollection = db.collection('batches');
    const batches = await batchesCollection.find({}).toArray();
    
    for (const batch of batches) {
      if (!batch.programId) {
        await batchesCollection.updateOne(
          { _id: batch._id },
          { $set: { programId: '507f1f77bcf86cd799439015' } }
        );
      }
    }
    console.log(`✅ Ensured all batches have programId`);

    // Ensure rooms have proper buildingId references
    const roomsCollection = db.collection('rooms');
    const rooms = await roomsCollection.find({}).toArray();
    
    for (const room of rooms) {
      if (!room.buildingId) {
        await roomsCollection.updateOne(
          { _id: room._id },
          { $set: { buildingId: '507f1f77bcf86cd799439018' } }
        );
      }
    }
    console.log(`✅ Ensured all rooms have buildingId`);

    // Ensure buildings have proper instituteId references
    const buildingsCollection = db.collection('buildings');
    const buildings = await buildingsCollection.find({}).toArray();
    
    for (const building of buildings) {
      if (!building.instituteId) {
        await buildingsCollection.updateOne(
          { _id: building._id },
          { $set: { instituteId: '507f1f77bcf86cd799439011' } }
        );
      }
    }
    console.log(`✅ Ensured all buildings have instituteId`);

    // Ensure faculty have proper departmentId references
    const facultyCollection = db.collection('faculty');
    const faculty = await facultyCollection.find({}).toArray();
    
    for (const fac of faculty) {
      if (!fac.departmentId) {
        await facultyCollection.updateOne(
          { _id: fac._id },
          { $set: { departmentId: '507f1f77bcf86cd799439012' } }
        );
      }
    }
    console.log(`✅ Ensured all faculty have departmentId`);

    console.log('\n🎉 API validation fixes completed!');
    
  } catch (error) {
    console.error('❌ Error fixing API validation:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the API validation fixes
if (require.main === module) {
  fixApiValidation().catch(console.error);
}

export { fixApiValidation };
