#!/usr/bin/env tsx

/**
 * Update Seeded Data to Match API Format
 * Ensures seeded data matches the exact format expected by the UI and API
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = 'polymanager';

async function updateSeededDataFormat() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB for format updates');
    
    const db = client.db(DATABASE_NAME);

    // Update programs to match API expectations
    const programsCollection = db.collection('programs');
    await programsCollection.updateMany(
      { code: { $in: ['DCE', 'DME', 'DEE'] } },
      { 
        $set: { 
          instituteId: 'inst1',
          degreeType: 'Diploma',
          status: 'active'
        }
      }
    );
    console.log('✅ Updated programs format');

    // Update faculty to match API expectations  
    const facultyCollection = db.collection('faculty');
    await facultyCollection.updateMany(
      { facultyId: { $in: ['FAC001', 'FAC002', 'FAC003'] } },
      { 
        $set: { 
          instituteId: 'inst1',
          status: 'active',
          staffCode: '',
          instituteEmail: ''
        }
      }
    );
    console.log('✅ Updated faculty format');

    // Update batches to match API expectations
    const batchesCollection = db.collection('batches');
    await batchesCollection.updateMany(
      { code: { $in: ['DCE24A', 'DME24A', 'DEE24A'] } },
      { 
        $set: { 
          instituteId: 'inst1',
          status: 'active'
        }
      }
    );
    console.log('✅ Updated batches format');

    // Update rooms to match API expectations
    const roomsCollection = db.collection('rooms');
    await roomsCollection.updateMany(
      { code: { $in: ['R101', 'R102', 'CL1'] } },
      { 
        $set: { 
          instituteId: 'inst1',
          status: 'active'
        }
      }
    );
    console.log('✅ Updated rooms format');

    // Update departments to match API expectations
    const departmentsCollection = db.collection('departments');
    await departmentsCollection.updateMany(
      { code: { $in: ['CE', 'ME', 'EE'] } },
      { 
        $set: { 
          instituteId: 'inst1',
          status: 'active'
        }
      }
    );
    console.log('✅ Updated departments format');

    // Update buildings to match API expectations
    const buildingsCollection = db.collection('buildings');
    await buildingsCollection.updateMany(
      { code: { $in: ['MAB', 'LAB'] } },
      { 
        $set: { 
          instituteId: 'inst1',
          status: 'active'
        }
      }
    );
    console.log('✅ Updated buildings format');

    // Make sure we have the right instituteId everywhere
    await db.collection('institutes').updateOne(
      { _id: { $exists: true } },
      { 
        $set: { 
          id: 'inst1',
          status: 'active'
        }
      }
    );
    console.log('✅ Updated institutes format');

    console.log('\n🎉 Format updates completed!');
    
  } catch (error) {
    console.error('❌ Error updating formats:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the format updates
if (require.main === module) {
  updateSeededDataFormat().catch(console.error);
}

export { updateSeededDataFormat };
