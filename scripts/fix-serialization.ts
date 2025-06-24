#!/usr/bin/env tsx

/**
 * Fix Document Serialization
 * Ensures all documents can be properly serialized by the API
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = 'polymanager';

async function fixDocumentSerialization() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB for serialization fixes');
    
    const db = client.db(DATABASE_NAME);

    // Collections that need to be accessible via API
    const collections = [
      'programs', 'batches', 'faculty', 'rooms', 'buildings', 
      'departments', 'courses', 'assessments', 'committees', 
      'curriculum', 'students', 'timetables'
    ];

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        
        // Find all documents and ensure they have proper structure
        const documents = await collection.find({}).toArray();
        console.log(`Processing ${documents.length} documents in ${collectionName}`);
        
        for (const doc of documents) {
          // Ensure each document has an id field that matches _id
          const updateData: any = {};
          
          // Add id field if missing
          if (!doc.id && doc._id) {
            updateData.id = doc._id.toString();
          }
          
          // Ensure createdAt and updatedAt exist
          if (!doc.createdAt) {
            updateData.createdAt = new Date();
          }
          if (!doc.updatedAt) {
            updateData.updatedAt = new Date();
          }
          
          // Ensure isActive exists and is true
          if (doc.isActive === undefined) {
            updateData.isActive = true;
          }
          
          // Update if there are changes
          if (Object.keys(updateData).length > 0) {
            await collection.updateOne(
              { _id: doc._id },
              { $set: updateData }
            );
          }
        }
        
        console.log(`✅ Updated ${collectionName}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${collectionName}:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log('\n🎉 Document serialization fixes completed!');
    
  } catch (error) {
    console.error('❌ Error fixing serialization:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the serialization fixes
if (require.main === module) {
  fixDocumentSerialization().catch(console.error);
}

export { fixDocumentSerialization };
