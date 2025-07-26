import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { FacultyModel } from '@/lib/models';

export async function POST() {
  try {
    await connectMongoose();
    
    console.log('Starting faculty schema migration for researchInterests field...');
    
    // Find all faculty records where researchInterests is a string
    const facultyWithStringResearchInterests = await FacultyModel.find({
      researchInterests: { $type: 'string' }
    });
    
    console.log(`Found ${facultyWithStringResearchInterests.length} faculty records to migrate`);
    
    let migratedCount = 0;
    
    for (const faculty of facultyWithStringResearchInterests) {
      const researchInterests = faculty.researchInterests as unknown as string;
      
      if (researchInterests && researchInterests.trim()) {
        // Convert comma-separated string to array
        const researchInterestsArray = researchInterests
          .split(',')
          .map(item => item.trim())
          .filter(item => item);
        
        await FacultyModel.updateOne(
          { _id: faculty._id },
          { $set: { researchInterests: researchInterestsArray } }
        );
        
        migratedCount++;
        console.log(`Migrated faculty ${faculty.id || faculty._id}: "${researchInterests}" -> [${researchInterestsArray.join(', ')}]`);
      } else {
        // Set empty array for empty strings
        await FacultyModel.updateOne(
          { _id: faculty._id },
          { $set: { researchInterests: [] } }
        );
        
        migratedCount++;
        console.log(`Migrated faculty ${faculty.id || faculty._id}: empty string -> []`);
      }
    }
    
    console.log(`Migration completed. Migrated ${migratedCount} faculty records.`);
    
    return NextResponse.json({
      message: 'Faculty schema migration completed successfully',
      migratedCount,
      totalFound: facultyWithStringResearchInterests.length
    });
    
  } catch (error) {
    console.error('Error during faculty schema migration:', error);
    return NextResponse.json(
      { message: 'Error during migration', error: (error as Error).message },
      { status: 500 }
    );
  }
}