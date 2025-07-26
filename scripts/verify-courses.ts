import { connectMongoose, disconnectMongoDB } from '@/lib/mongodb';
import { CourseModel } from '@/lib/models';

async function verifyCourses() {
  try {
    await connectMongoose();
    
    const totalCourses = await CourseModel.countDocuments();
    const branchStats = await CourseModel.aggregate([
      { 
        $group: { 
          _id: { branchCode: '$branchCode', semester: '$semester' }, 
          count: { $sum: 1 },
          categories: { $addToSet: '$category' },
          sampleCourses: { $push: { subcode: '$subcode', name: '$subjectName' } }
        }
      },
      { $sort: { '_id.branchCode': 1, '_id.semester': 1 } }
    ]);

    console.log('📚 GTU Course Seeding Verification Report');
    console.log('=======================================');
    console.log(`Total Courses: ${totalCourses}`);
    console.log('');

    const branchMapping = {
      '06': 'Civil Engineering',
      '09': 'Electrical Engineering', 
      '11': 'Electronics & Communication',
      '16': 'Information Technology',
      '19': 'Mechanical Engineering',
      '32': 'Computer Engineering'
    };

    let totalBySemester = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    let totalByBranch: Record<string, number> = {};

    for (const stat of branchStats) {
      const branchName = branchMapping[stat._id.branchCode as keyof typeof branchMapping] || stat._id.branchCode;
      console.log(`📖 ${branchName} (Branch ${stat._id.branchCode}) - Semester ${stat._id.semester}`);
      console.log(`   Courses: ${stat.count}`);
      console.log(`   Categories: ${stat.categories.join(', ')}`);
      console.log(`   Sample: ${stat.sampleCourses.slice(0, 2).map((c: any) => c.subcode + ' - ' + c.name).join('; ')}`);
      console.log('');
      
      totalBySemester[stat._id.semester as keyof typeof totalBySemester] += stat.count;
      totalByBranch[stat._id.branchCode] = (totalByBranch[stat._id.branchCode] || 0) + stat.count;
    }

    console.log('📊 Summary Statistics:');
    console.log('======================');
    console.log('By Semester:');
    for (const [sem, count] of Object.entries(totalBySemester)) {
      console.log(`  Semester ${sem}: ${count} courses`);
    }
    
    console.log('\nBy Branch:');
    for (const [code, count] of Object.entries(totalByBranch)) {
      const branchName = branchMapping[code as keyof typeof branchMapping] || code;
      console.log(`  ${branchName} (${code}): ${count} courses`);
    }

    // Verify specific subjects exist
    console.log('\n🔍 Verification of Key Subjects:');
    console.log('=================================');
    
    const keySubjects = [
      'DI01000011', // Applied Mathematics
      'DI01000021', // Applied Physics  
      'DI01006011', // Civil - Surveying
      'DI01009011', // Electrical - Electrical Machines
      'DI01016011', // IT - Programming in C
      'DI01032011'  // Computer - Computer Programming
    ];

    for (const subcode of keySubjects) {
      const course = await CourseModel.findOne({ subcode });
      if (course) {
        console.log(`  ✅ ${subcode} - ${course.subjectName} (${course.category})`);
      } else {
        console.log(`  ❌ ${subcode} - Not found`);
      }
    }

    await disconnectMongoDB();
    
  } catch (error) {
    console.error('Error verifying courses:', error);
    await disconnectMongoDB();
  }
}

verifyCourses();