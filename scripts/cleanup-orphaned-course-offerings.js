import { MongoClient, ObjectId } from 'mongodb';

async function cleanupOrphanedCourseOfferings() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('=== Cleaning Up Orphaned Course Offerings ===\n');
    
    // Get all course offerings
    const courseOfferings = await db.collection('courseofferings').find({}).toArray();
    console.log('Total course offerings found:', courseOfferings.length);
    
    // Get all courses for reference
    const courses = await db.collection('courses').find({}).toArray();
    console.log('Total courses found:', courses.length);
    
    // Find orphaned course offerings
    const orphanedOfferings = courseOfferings.filter(offering => 
      !courses.find(c => c.id === offering.courseId)
    );
    
    console.log('Orphaned course offerings found:', orphanedOfferings.length);
    
    if (orphanedOfferings.length === 0) {
      console.log('No orphaned course offerings to clean up. ✅');
      return;
    }
    
    console.log('\n=== Deleting Orphaned Course Offerings ===');
    
    let deletedCount = 0;
    for (const offering of orphanedOfferings) {
      try {
        console.log(`Deleting: ${offering.id} (courseId: ${offering.courseId})`);
        const result = await db.collection('courseofferings').deleteOne({ _id: offering._id });
        
        if (result.deletedCount === 1) {
          deletedCount++;
          console.log(`  ✅ Deleted successfully`);
        } else {
          console.log(`  ❌ Failed to delete`);
        }
      } catch (error) {
        console.log(`  ❌ Error deleting: ${error.message}`);
      }
    }
    
    console.log(`\n=== Cleanup Complete ===`);
    console.log(`Successfully deleted ${deletedCount} out of ${orphanedOfferings.length} orphaned course offerings.`);
    
    // Verify cleanup
    const remainingOrphaned = await db.collection('courseofferings').countDocuments({
      courseId: { $nin: courses.map(c => c.id) }
    });
    
    if (remainingOrphaned === 0) {
      console.log('✅ All orphaned course offerings have been cleaned up!');
    } else {
      console.log(`⚠️  ${remainingOrphaned} orphaned course offerings still remain.`);
    }
    
  } catch (error) {
    console.error('Cleanup error:', error);
  } finally {
    await client.close();
  }
}

// Run the cleanup function
cleanupOrphanedCourseOfferings();