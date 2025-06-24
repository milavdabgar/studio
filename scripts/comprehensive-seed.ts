#!/usr/bin/env tsx

/**
 * Comprehensive Database Seeding Script
 * Seeds all required data to make E2E tests pass 100%
 */

import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = 'polymanager';

interface SeedData {
  institutes: any[];
  departments: any[];
  programs: any[];
  batches: any[];
  faculty: any[];
  rooms: any[];
  buildings: any[];
  students: any[];
  courses: any[];
  curriculum: any[];
  assessments: any[];
  committees: any[];
  roles: any[];
  users: any[];
  timetables: any[];
}

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);

    // Get existing data counts
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Define seed data with proper relationships
    const seedData: SeedData = {
      institutes: [
        {
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          name: 'Government Polytechnic Palanpur',
          code: 'GPP',
          address: 'Palanpur, Gujarat',
          phone: '+91-2742-123456',
          email: 'info@gppalanpur.in',
          website: 'https://gppalanpur.in',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      departments: [
        {
          _id: new ObjectId('507f1f77bcf86cd799439012'),
          name: 'Computer Engineering',
          code: 'CE',
          description: 'Computer Engineering Department',
          instituteId: '507f1f77bcf86cd799439011',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439013'),
          name: 'Mechanical Engineering',
          code: 'ME',
          description: 'Mechanical Engineering Department',
          instituteId: '507f1f77bcf86cd799439011',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439014'),
          name: 'Electrical Engineering',
          code: 'EE',
          description: 'Electrical Engineering Department',
          instituteId: '507f1f77bcf86cd799439011',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      programs: [
        {
          _id: new ObjectId('507f1f77bcf86cd799439015'),
          name: 'Diploma in Computer Engineering',
          code: 'DCE',
          departmentId: '507f1f77bcf86cd799439012',
          duration: 3,
          totalSemesters: 6,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439016'),
          name: 'Diploma in Mechanical Engineering',
          code: 'DME',
          departmentId: '507f1f77bcf86cd799439013',
          duration: 3,
          totalSemesters: 6,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439017'),
          name: 'Diploma in Electrical Engineering',
          code: 'DEE',
          departmentId: '507f1f77bcf86cd799439014',
          duration: 3,
          totalSemesters: 6,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      buildings: [
        {
          _id: new ObjectId('507f1f77bcf86cd799439018'),
          name: 'Main Academic Block',
          code: 'MAB',
          instituteId: '507f1f77bcf86cd799439011',
          builtYear: 2000,
          floors: 3,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439019'),
          name: 'Laboratory Block',
          code: 'LAB',
          instituteId: '507f1f77bcf86cd799439011',
          builtYear: 2005,
          floors: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      rooms: [
        {
          _id: new ObjectId('507f1f77bcf86cd79943901a'),
          name: 'Room 101',
          code: 'R101',
          buildingId: '507f1f77bcf86cd799439018',
          floor: 1,
          capacity: 60,
          type: 'classroom',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd79943901b'),
          name: 'Room 102',
          code: 'R102',
          buildingId: '507f1f77bcf86cd799439018',
          floor: 1,
          capacity: 60,
          type: 'classroom',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd79943901c'),
          name: 'Computer Lab 1',
          code: 'CL1',
          buildingId: '507f1f77bcf86cd799439019',
          floor: 1,
          capacity: 30,
          type: 'laboratory',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      batches: [
        {
          _id: new ObjectId('507f1f77bcf86cd79943901d'),
          name: 'DCE-2024-A',
          code: 'DCE24A',
          programId: '507f1f77bcf86cd799439015',
          year: 2024,
          semester: 1,
          totalStudents: 60,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd79943901e'),
          name: 'DME-2024-A',
          code: 'DME24A',
          programId: '507f1f77bcf86cd799439016',
          year: 2024,
          semester: 1,
          totalStudents: 60,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd79943901f'),
          name: 'DEE-2024-A',
          code: 'DEE24A',
          programId: '507f1f77bcf86cd799439017',
          year: 2024,
          semester: 1,
          totalStudents: 60,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      faculty: [
        {
          _id: new ObjectId('507f1f77bcf86cd799439020'),
          facultyId: 'FAC001',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
          email: 'john.doe@gppalanpur.in',
          phone: '+91-9876543210',
          departmentId: '507f1f77bcf86cd799439012',
          designation: 'Assistant Professor',
          qualification: 'M.Tech',
          experience: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439021'),
          facultyId: 'FAC002',
          firstName: 'Jane',
          lastName: 'Smith',
          fullName: 'Jane Smith',
          email: 'jane.smith@gppalanpur.in',
          phone: '+91-9876543211',
          departmentId: '507f1f77bcf86cd799439013',
          designation: 'Associate Professor',
          qualification: 'M.Tech',
          experience: 8,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439022'),
          facultyId: 'FAC003',
          firstName: 'Mike',
          lastName: 'Johnson',
          fullName: 'Mike Johnson',
          email: 'mike.johnson@gppalanpur.in',
          phone: '+91-9876543212',
          departmentId: '507f1f77bcf86cd799439014',
          designation: 'Professor',
          qualification: 'Ph.D',
          experience: 12,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      students: [
        {
          _id: new ObjectId('507f1f77bcf86cd799439023'),
          enrollmentNumber: 'DCE240001',
          firstName: 'Alice',
          lastName: 'Brown',
          fullName: 'Alice Brown',
          email: 'alice.brown@student.gppalanpur.in',
          phone: '+91-9876543213',
          batchId: '507f1f77bcf86cd79943901d',
          programId: '507f1f77bcf86cd799439015',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439024'),
          enrollmentNumber: 'DME240001',
          firstName: 'Bob',
          lastName: 'Wilson',
          fullName: 'Bob Wilson',
          email: 'bob.wilson@student.gppalanpur.in',
          phone: '+91-9876543214',
          batchId: '507f1f77bcf86cd79943901e',
          programId: '507f1f77bcf86cd799439016',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      courses: [
        {
          _id: new ObjectId('507f1f77bcf86cd799439025'),
          name: 'Programming Fundamentals',
          code: 'PF101',
          programId: '507f1f77bcf86cd799439015',
          semester: 1,
          credits: 4,
          category: 'Program Core',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439026'),
          name: 'Data Structures',
          code: 'DS201',
          programId: '507f1f77bcf86cd799439015',
          semester: 2,
          credits: 4,
          category: 'Program Core',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439027'),
          name: 'Engineering Mechanics',
          code: 'EM101',
          programId: '507f1f77bcf86cd799439016',
          semester: 1,
          credits: 4,
          category: 'Program Core',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      curriculum: [
        {
          _id: new ObjectId('507f1f77bcf86cd799439028'),
          programId: '507f1f77bcf86cd799439015',
          semester: 1,
          courses: ['507f1f77bcf86cd799439025'],
          totalCredits: 20,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439029'),
          programId: '507f1f77bcf86cd799439015',
          semester: 2,
          courses: ['507f1f77bcf86cd799439026'],
          totalCredits: 20,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      assessments: [
        {
          _id: new ObjectId('507f1f77bcf86cd79943902a'),
          title: 'Mid Term Exam - Programming Fundamentals',
          courseId: '507f1f77bcf86cd799439025',
          batchId: '507f1f77bcf86cd79943901d',
          type: 'exam',
          totalMarks: 100,
          date: new Date('2024-06-15'),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd79943902b'),
          title: 'Assignment 1 - Data Structures',
          courseId: '507f1f77bcf86cd799439026',
          batchId: '507f1f77bcf86cd79943901d',
          type: 'assignment',
          totalMarks: 50,
          dueDate: new Date('2024-07-01'),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      committees: [
        {
          _id: new ObjectId('507f1f77bcf86cd79943902c'),
          name: 'Academic Committee',
          code: 'ACAD_COM',
          description: 'Committee for academic affairs',
          chairpersonId: '507f1f77bcf86cd799439020',
          members: ['507f1f77bcf86cd799439021', '507f1f77bcf86cd799439022'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd79943902d'),
          name: 'Examination Committee',
          code: 'EXAM_COM',
          description: 'Committee for examination management',
          chairpersonId: '507f1f77bcf86cd799439021',
          members: ['507f1f77bcf86cd799439020', '507f1f77bcf86cd799439022'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      roles: [
        {
          _id: new ObjectId('507f1f77bcf86cd79943902e'),
          name: 'Test Role',
          code: 'TEST_ROLE',
          description: 'Test role for E2E testing',
          permissions: ['read', 'write'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      users: [
        {
          _id: new ObjectId('507f1f77bcf86cd79943902f'),
          firstName: 'Test',
          lastName: 'Faculty',
          fullName: 'Test Faculty (Faculty)',
          email: 'faculty.test@gppalanpur.in',
          instituteEmail: 'faculty.test@gppalanpur.in',
          password: '$2b$10$example.hash.for.password123',
          roles: ['faculty'],
          isActive: true,
          isEmailVerified: true,
          instituteId: '507f1f77bcf86cd799439011',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439030'),
          firstName: 'Test',
          lastName: 'Student',
          fullName: 'Test Student (Student)',
          email: 'student.test@gppalanpur.in',
          instituteEmail: 'student.test@gppalanpur.in',
          password: '$2b$10$example.hash.for.password123',
          roles: ['student'],
          isActive: true,
          isEmailVerified: true,
          instituteId: '507f1f77bcf86cd799439011',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      timetables: [
        {
          _id: new ObjectId('507f1f77bcf86cd799439031'),
          batchId: '507f1f77bcf86cd79943901d',
          programId: '507f1f77bcf86cd799439015',
          semester: 1,
          dayOfWeek: 'Monday',
          timeSlot: '09:00-10:00',
          courseId: '507f1f77bcf86cd799439025',
          facultyId: '507f1f77bcf86cd799439020',
          roomId: '507f1f77bcf86cd79943901a',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439032'),
          batchId: '507f1f77bcf86cd79943901d',
          programId: '507f1f77bcf86cd799439015',
          semester: 1,
          dayOfWeek: 'Tuesday',
          timeSlot: '10:00-11:00',
          courseId: '507f1f77bcf86cd799439026',
          facultyId: '507f1f77bcf86cd799439020',
          roomId: '507f1f77bcf86cd79943901b',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    };

    // Insert or update each collection
    for (const [collectionName, documents] of Object.entries(seedData)) {
      if (documents.length === 0) continue;
      
      const collection = db.collection(collectionName);
      
      // Clear existing test data first (optional)
      // await collection.deleteMany({ createdAt: { $exists: true } });
      
      try {
        // Use upsert to avoid duplicates
        for (const doc of documents) {
          await collection.replaceOne(
            { _id: doc._id },
            doc,
            { upsert: true }
          );
        }
        console.log(`✅ Seeded ${documents.length} documents in ${collectionName}`);
      } catch (error) {
        console.error(`❌ Error seeding ${collectionName}:`, error);
      }
    }

    // Verify the seeded data
    console.log('\n📊 Database Summary:');
    for (const collectionName of Object.keys(seedData)) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`  ${collectionName}: ${count} documents`);
      } catch (error) {
        console.log(`  ${collectionName}: Error counting - ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase().catch(console.error);
}

export { seedDatabase };
