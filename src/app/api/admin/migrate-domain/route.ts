import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { StudentModel, FacultyModel, UserModel } from '@/lib/models';

const OLD_DOMAIN = '@gppalanpur.in';
const NEW_DOMAIN = '@gppalanpur.ac.in';

interface MigrationResult {
  students: { found: number; updated: number; errors: number };
  faculty: { found: number; updated: number; errors: number };
  users: { found: number; updated: number; errors: number };
  success: boolean;
  message: string;
}

export async function POST() {
  try {
    await connectMongoose();
    
    const result: MigrationResult = {
      students: { found: 0, updated: 0, errors: 0 },
      faculty: { found: 0, updated: 0, errors: 0 },
      users: { found: 0, updated: 0, errors: 0 },
      success: false,
      message: ''
    };

    // Migrate Students
    try {
      const studentsToUpdate = await StudentModel.find({
        instituteEmail: { $regex: OLD_DOMAIN.replace('@', '\\@') + '$' }
      });
      
      result.students.found = studentsToUpdate.length;
      
      for (const student of studentsToUpdate) {
        try {
          const newEmail = student.instituteEmail.replace(OLD_DOMAIN, NEW_DOMAIN);
          await StudentModel.updateOne(
            { _id: student._id },
            { 
              $set: { 
                instituteEmail: newEmail,
                updatedAt: new Date().toISOString()
              }
            }
          );
          result.students.updated++;
        } catch (error) {
          result.students.errors++;
          console.error(`Error updating student ${student.enrollmentNumber}:`, error);
        }
      }
    } catch (error) {
      console.error('Error during student migration:', error);
    }

    // Migrate Faculty
    try {
      const facultyToUpdate = await FacultyModel.find({
        instituteEmail: { $regex: OLD_DOMAIN.replace('@', '\\@') + '$' }
      });
      
      result.faculty.found = facultyToUpdate.length;
      
      for (const faculty of facultyToUpdate) {
        try {
          const newEmail = faculty.instituteEmail.replace(OLD_DOMAIN, NEW_DOMAIN);
          await FacultyModel.updateOne(
            { _id: faculty._id },
            { 
              $set: { 
                instituteEmail: newEmail,
                updatedAt: new Date().toISOString()
              }
            }
          );
          result.faculty.updated++;
        } catch (error) {
          result.faculty.errors++;
          console.error(`Error updating faculty ${faculty.staffCode}:`, error);
        }
      }
    } catch (error) {
      console.error('Error during faculty migration:', error);
    }

    // Migrate Users
    try {
      const usersToUpdate = await UserModel.find({
        $or: [
          { email: { $regex: OLD_DOMAIN.replace('@', '\\@') + '$' } },
          { instituteEmail: { $regex: OLD_DOMAIN.replace('@', '\\@') + '$' } }
        ]
      });
      
      result.users.found = usersToUpdate.length;
      
      for (const user of usersToUpdate) {
        try {
          const updateFields: any = { updatedAt: new Date().toISOString() };
          
          if (user.email && user.email.endsWith(OLD_DOMAIN)) {
            updateFields.email = user.email.replace(OLD_DOMAIN, NEW_DOMAIN);
          }
          
          if (user.instituteEmail && user.instituteEmail.endsWith(OLD_DOMAIN)) {
            updateFields.instituteEmail = user.instituteEmail.replace(OLD_DOMAIN, NEW_DOMAIN);
          }
          
          await UserModel.updateOne({ _id: user._id }, { $set: updateFields });
          result.users.updated++;
        } catch (error) {
          result.users.errors++;
          console.error(`Error updating user ${user.email}:`, error);
        }
      }
    } catch (error) {
      console.error('Error during user migration:', error);
    }

    // Remove duplicate users (old domain ones if new domain exists)
    try {
      const oldDomainUsers = await UserModel.find({
        email: { $regex: OLD_DOMAIN.replace('@', '\\@') + '$' }
      });
      
      for (const oldUser of oldDomainUsers) {
        const newDomainEmail = oldUser.email.replace(OLD_DOMAIN, NEW_DOMAIN);
        const newDomainUser = await UserModel.findOne({ email: newDomainEmail });
        
        if (newDomainUser) {
          // Delete the old domain user since new domain user exists
          await UserModel.deleteOne({ _id: oldUser._id });
          console.log(`Removed duplicate user: ${oldUser.email}`);
        }
      }
    } catch (error) {
      console.error('Error during duplicate cleanup:', error);
    }

    const totalUpdated = result.students.updated + result.faculty.updated + result.users.updated;
    const totalErrors = result.students.errors + result.faculty.errors + result.users.errors;
    
    result.success = totalErrors === 0;
    result.message = `Migration completed: ${totalUpdated} records updated`;
    
    if (totalErrors > 0) {
      result.message += ` with ${totalErrors} errors`;
    }

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Domain migration failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        students: { found: 0, updated: 0, errors: 0 },
        faculty: { found: 0, updated: 0, errors: 0 },
        users: { found: 0, updated: 0, errors: 0 }
      },
      { status: 500 }
    );
  }
}