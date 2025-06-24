#!/usr/bin/env tsx

/**
 * Fix Missing IDs Script
 * Ensures all documents have proper _id fields for API tests
 */

import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = 'polymanager';

async function fixMissingIds() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);

    // Collections that need ID fixes
    const collectionsToFix = [
      'departments',
      'batches', 
      'programs',
      'faculty',
      'students',
      'courses',
      'buildings',
      'rooms',
      'assessments',
      'committees',
      'curriculum',
      'timetables',
      'users',
      'roles'
    ];

    for (const collectionName of collectionsToFix) {
      try {
        const collection = db.collection(collectionName);
        
        // Find documents without _id
        const documentsWithoutId = await collection.find({
          _id: { $exists: false }
        }).toArray();

        if (documentsWithoutId.length > 0) {
          console.log(`Found ${documentsWithoutId.length} documents without proper IDs in ${collectionName}`);
          
          // Update each document to have a proper ObjectId
          for (const doc of documentsWithoutId) {
            const newId = new ObjectId();
            await collection.updateOne(
              { _id: doc._id },
              { $set: { _id: newId } }
            );
          }
          
          console.log(`✅ Fixed IDs for ${documentsWithoutId.length} documents in ${collectionName}`);
        } else {
          console.log(`✅ All documents in ${collectionName} have proper IDs`);
        }

      } catch (error) {
        console.error(`❌ Error fixing IDs for ${collectionName}:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log('\n🎉 ID fixing completed!');
    
  } catch (error) {
    console.error('❌ Error fixing IDs:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the fixing
if (require.main === module) {
  fixMissingIds().catch(console.error);
}

export { fixMissingIds };
