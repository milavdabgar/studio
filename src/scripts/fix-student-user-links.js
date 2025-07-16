/**
 * Script to fix missing userId links between students and users
 * This can be run after GTU imports to ensure all students are properly linked
 */

const mongoose = require('mongoose');
const { connectMongoose } = require('../lib/mongodb');

// Import models
const { StudentModel, UserModel } = require('../lib/models');

async function fixStudentUserLinks() {
    try {
        // Connect to MongoDB
        await connectMongoose();
        console.log('Connected to MongoDB');

        // Find all students without userId
        const studentsWithoutUserId = await StudentModel.find({
            $or: [
                { userId: null },
                { userId: undefined },
                { userId: { $exists: false } }
            ]
        });

        console.log(`Found ${studentsWithoutUserId.length} students without userId`);

        let fixedCount = 0;
        let errorCount = 0;

        for (const student of studentsWithoutUserId) {
            try {
                // Find user by institute email
                const user = await UserModel.findOne({
                    instituteEmail: student.instituteEmail
                });

                if (user) {
                    // Update student with userId
                    await StudentModel.findByIdAndUpdate(
                        student._id,
                        { userId: user._id.toString() },
                        { new: true }
                    );
                    
                    console.log(`Fixed link for student ${student.enrollmentNumber} -> user ${user._id}`);
                    fixedCount++;
                } else {
                    console.warn(`No user found for student ${student.enrollmentNumber} with email ${student.instituteEmail}`);
                    errorCount++;
                }
            } catch (error) {
                console.error(`Error fixing student ${student.enrollmentNumber}:`, error.message);
                errorCount++;
            }
        }

        console.log(`\n✅ Fixed ${fixedCount} student-user links`);
        console.log(`❌ Failed to fix ${errorCount} links`);

        // Verify the fix
        const remainingBrokenLinks = await StudentModel.countDocuments({
            $or: [
                { userId: null },
                { userId: undefined },
                { userId: { $exists: false } }
            ]
        });

        console.log(`\n🔍 Remaining students without userId: ${remainingBrokenLinks}`);

        if (remainingBrokenLinks === 0) {
            console.log('🎉 All students now have proper userId links!');
        }

    } catch (error) {
        console.error('Error in fixStudentUserLinks:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run the script
fixStudentUserLinks();