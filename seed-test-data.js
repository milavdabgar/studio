// Quick script to seed test data for E2E tests
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager';

const programs = [
  {
    id: 'prog_dce_gpp',
    name: 'Diploma in Computer Engineering',
    code: 'DCE',
    departmentId: 'dept_ce_gpp',
    duration: 3,
    durationType: 'years',
    maxSemesters: 6,
    credits: 180,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prog_dme_gpp',
    name: 'Diploma in Mechanical Engineering', 
    code: 'DME',
    departmentId: 'dept_me_gpp',
    duration: 3,
    durationType: 'years',
    maxSemesters: 6,
    credits: 180,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const courses = [
  {
    id: 'course_cs101_gpp',
    subcode: 'CS101',
    subjectName: 'Programming Fundamentals',
    departmentId: 'dept_ce_gpp',
    programId: 'prog_dce_gpp',
    semester: 1,
    category: 'Core',
    lectureHours: 3,
    tutorialHours: 1,
    practicalHours: 2,
    theoryEseMarks: 70,
    theoryPaMarks: 30,
    practicalEseMarks: 50,
    practicalPaMarks: 50,
    isElective: false,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'course_cs102_gpp',
    subcode: 'CS102',
    subjectName: 'Data Structures',
    departmentId: 'dept_ce_gpp',
    programId: 'prog_dce_gpp',
    semester: 2,
    category: 'Core',
    lectureHours: 4,
    tutorialHours: 0,
    practicalHours: 2,
    theoryEseMarks: 70,
    theoryPaMarks: 30,
    practicalEseMarks: 50,
    practicalPaMarks: 50,
    isElective: false,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'course_me101_gpp',
    subcode: 'ME101',
    subjectName: 'Engineering Mechanics',
    departmentId: 'dept_me_gpp',
    programId: 'prog_dme_gpp',
    semester: 1,
    category: 'Core',
    lectureHours: 3,
    tutorialHours: 1,
    practicalHours: 0,
    theoryEseMarks: 70,
    theoryPaMarks: 30,
    theoryOnly: true,
    isElective: false,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const batches = [
  {
    id: 'batch_dce_2024_gpp',
    name: 'DCE 2024-27',
    programId: 'prog_dce_gpp',
    startAcademicYear: 2024,
    endAcademicYear: 2027,
    maxIntake: 60,
    currentStrength: 45,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'batch_dme_2024_gpp',
    name: 'DME 2024-27',
    programId: 'prog_dme_gpp',
    startAcademicYear: 2024,
    endAcademicYear: 2027,
    maxIntake: 60,
    currentStrength: 50,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function seedData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Seed programs
    console.log('Seeding programs...');
    await db.collection('programs').deleteMany({}); // Clear existing
    await db.collection('programs').insertMany(programs);
    console.log(`✅ Seeded ${programs.length} programs`);
    
    // Seed courses
    console.log('Seeding courses...');
    await db.collection('courses').deleteMany({}); // Clear existing
    await db.collection('courses').insertMany(courses);
    console.log(`✅ Seeded ${courses.length} courses`);
    
    // Seed batches
    console.log('Seeding batches...');
    await db.collection('batches').deleteMany({}); // Clear existing
    await db.collection('batches').insertMany(batches);
    console.log(`✅ Seeded ${batches.length} batches`);
    
    console.log('🎉 Test data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

seedData();
