#!/usr/bin/env tsx

/**
 * Additional E2E Test Data Seeding
 * Adds specific data needed for dashboard and UI tests
 */

import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = 'polymanager';

async function seedAdditionalTestData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB for additional seeding');
    
    const db = client.db(DATABASE_NAME);

    // Add more students for dashboard tests
    const studentsCollection = db.collection('students');
    const additionalStudents = [
      {
        _id: new ObjectId(),
        enrollmentNumber: 'DCE240002',
        firstName: 'Carol',
        lastName: 'Davis',
        fullName: 'Carol Davis',
        email: 'carol.davis@student.gppalanpur.in',
        phone: '+91-9876543215',
        batchId: '507f1f77bcf86cd79943901d',
        programId: '507f1f77bcf86cd799439015',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        enrollmentNumber: 'DCE240003',
        firstName: 'David',
        lastName: 'Miller',
        fullName: 'David Miller',
        email: 'david.miller@student.gppalanpur.in',
        phone: '+91-9876543216',
        batchId: '507f1f77bcf86cd79943901d',
        programId: '507f1f77bcf86cd799439015',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const student of additionalStudents) {
      await studentsCollection.replaceOne(
        { _id: student._id },
        student,
        { upsert: true }
      );
    }
    console.log(`✅ Added ${additionalStudents.length} additional students`);

    // Add more users for dashboard user management tests
    const usersCollection = db.collection('users');
    const additionalUsers = [
      {
        _id: new ObjectId(),
        firstName: 'Test',
        lastName: 'User1',
        fullName: 'Test User1 (Faculty)',
        email: 'test.user1@gppalanpur.in',
        instituteEmail: 'test.user1@gppalanpur.in',
        password: '$2b$10$example.hash.for.password123',
        roles: ['faculty'],
        isActive: true,
        isEmailVerified: true,
        instituteId: '507f1f77bcf86cd799439011',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        firstName: 'Test',
        lastName: 'User2',
        fullName: 'Test User2 (Student)',
        email: 'test.user2@gppalanpur.in',
        instituteEmail: 'test.user2@gppalanpur.in',
        password: '$2b$10$example.hash.for.password123',
        roles: ['student'],
        isActive: true,
        isEmailVerified: true,
        instituteId: '507f1f77bcf86cd799439011',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        firstName: 'Deletable',
        lastName: 'User',
        fullName: 'Deletable User (Faculty)',
        email: 'deletable.user@gppalanpur.in',
        instituteEmail: 'deletable.user@gppalanpur.in',
        password: '$2b$10$example.hash.for.password123',
        roles: ['faculty'],
        isActive: true,
        isEmailVerified: true,
        instituteId: '507f1f77bcf86cd799439011',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const user of additionalUsers) {
      await usersCollection.replaceOne(
        { _id: user._id },
        user,
        { upsert: true }
      );
    }
    console.log(`✅ Added ${additionalUsers.length} additional users`);

    // Add course offerings for faculty portal tests
    const courseOfferingsCollection = db.collection('courseofferings');
    const courseOfferings = [
      {
        _id: new ObjectId(),
        courseId: '507f1f77bcf86cd799439025',
        batchId: '507f1f77bcf86cd79943901d',
        facultyId: '507f1f77bcf86cd799439020',
        semester: 1,
        year: 2024,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        courseId: '507f1f77bcf86cd799439026',
        batchId: '507f1f77bcf86cd79943901d',
        facultyId: '507f1f77bcf86cd799439020',
        semester: 2,
        year: 2024,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const offering of courseOfferings) {
      await courseOfferingsCollection.replaceOne(
        { _id: offering._id },
        offering,
        { upsert: true }
      );
    }
    console.log(`✅ Added ${courseOfferings.length} course offerings`);

    // Add project events for project fair tests
    const projectEventsCollection = db.collection('projectevents');
    const projectEvents = [
      {
        _id: new ObjectId(),
        title: 'Annual Project Fair 2024',
        description: 'Annual project exhibition for all departments',
        eventDate: new Date('2024-12-15'),
        venue: 'Main Auditorium',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const event of projectEvents) {
      await projectEventsCollection.replaceOne(
        { _id: event._id },
        event,
        { upsert: true }
      );
    }
    console.log(`✅ Added ${projectEvents.length} project events`);

    // Add results data for results management tests
    const resultsCollection = db.collection('results');
    const results = [
      {
        _id: new ObjectId(),
        studentId: '507f1f77bcf86cd799439023',
        courseId: '507f1f77bcf86cd799439025',
        assessmentId: '507f1f77bcf86cd79943902a',
        marks: 85,
        totalMarks: 100,
        percentage: 85,
        grade: 'A',
        semester: 1,
        year: 2024,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const result of results) {
      await resultsCollection.replaceOne(
        { _id: result._id },
        result,
        { upsert: true }
      );
    }
    console.log(`✅ Added ${results.length} results`);

    console.log('\n🎉 Additional test data seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding additional test data:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the additional seeding
if (require.main === module) {
  seedAdditionalTestData().catch(console.error);
}

export { seedAdditionalTestData };
