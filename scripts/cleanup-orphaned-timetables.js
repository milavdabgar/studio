import { MongoClient, ObjectId } from 'mongodb';

async function cleanupOrphanedTimetables() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('=== Cleaning Up Timetables with Non-existent Course References ===\n');
    
    // Get all timetables
    const timetables = await db.collection('timetables').find({}).toArray();
    console.log('Total timetables found:', timetables.length);
    
    // Get all courses for reference
    const courses = await db.collection('courses').find({}).toArray();
    console.log('Total courses found:', courses.length);
    
    // Find timetables with entries that reference non-existent courses
    const problematicTimetables = [];
    
    for (const timetable of timetables) {
      const hasOrphanedEntries = timetable.entries?.some(entry => 
        entry.courseId && !courses.find(c => c.id === entry.courseId)
      );
      
      if (hasOrphanedEntries) {
        const orphanedEntries = timetable.entries.filter(entry =>
          entry.courseId && !courses.find(c => c.id === entry.courseId)
        );
        
        problematicTimetables.push({
          timetable,
          orphanedEntries,
          orphanedCourseIds: orphanedEntries.map(e => e.courseId)
        });
      }
    }
    
    console.log('Timetables with orphaned course references found:', problematicTimetables.length);
    
    if (problematicTimetables.length === 0) {
      console.log('No timetables with orphaned course references to clean up. ✅');
      return;
    }
    
    console.log('\n=== Timetable Analysis ===');
    problematicTimetables.forEach((item, index) => {
      console.log(`${index + 1}. Timetable: ${item.timetable.name} (${item.timetable.id})`);
      console.log(`   Orphaned course IDs: ${item.orphanedCourseIds.join(', ')}`);
      console.log(`   Total entries: ${item.timetable.entries?.length || 0}`);
      console.log(`   Orphaned entries: ${item.orphanedEntries.length}`);
    });
    
    console.log('\n=== Cleanup Options ===');
    console.log('1. Delete entire timetables that have orphaned entries');
    console.log('2. Remove only the orphaned entries from timetables');
    console.log('\nFor safety, we will DELETE the entire problematic timetables.');
    
    console.log('\n=== Deleting Problematic Timetables ===');
    
    let deletedCount = 0;
    for (const item of problematicTimetables) {
      try {
        console.log(`Deleting timetable: ${item.timetable.name} (${item.timetable.id})`);
        const result = await db.collection('timetables').deleteOne({ _id: item.timetable._id });
        
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
    console.log(`Successfully deleted ${deletedCount} out of ${problematicTimetables.length} problematic timetables.`);
    
    // Verify cleanup
    const remainingTimetables = await db.collection('timetables').find({}).toArray();
    console.log(`Remaining timetables: ${remainingTimetables.length}`);
    
    // Check if any remaining timetables still have orphaned entries
    let hasRemainingIssues = false;
    for (const timetable of remainingTimetables) {
      const hasOrphanedEntries = timetable.entries?.some(entry => 
        entry.courseId && !courses.find(c => c.id === entry.courseId)
      );
      if (hasOrphanedEntries) {
        hasRemainingIssues = true;
        console.log(`⚠️  Timetable "${timetable.name}" still has orphaned course references`);
      }
    }
    
    if (!hasRemainingIssues) {
      console.log('✅ All timetables now have valid course references!');
    }
    
  } catch (error) {
    console.error('Cleanup error:', error);
  } finally {
    await client.close();
  }
}

// Run the cleanup function
cleanupOrphanedTimetables();