import { connectMongoose, disconnectMongoDB } from '@/lib/mongodb';
import { 
  UserModel, RoleModel, DepartmentModel, CourseModel, 
  BatchModel, ProgramModel 
} from '@/lib/models';

// Initial user data (from current in-memory store)
const initialUsers = [
  {
    id: "user_admin_gpp",
    displayName: "GPP Super Admin",
    username: "gpp_superadmin",
    email: "admin@gppalanpur.in",
    instituteEmail: "admin@gppalanpur.ac.in",
    password: "Admin@123",
    roles: ["super_admin", "admin"],
    isActive: true,
    instituteId: "inst1",
    authProviders: ['password'],
    isEmailVerified: true,
    preferences: { theme: 'system', language: 'en' },
    fullName: "ADMIN SUPER GPP",
    firstName: "SUPER",
    lastName: "ADMIN",
    currentRole: "super_admin"
  },
  {
    id: "user_hod_ce_gpp",
    displayName: "HOD Computer",
    username: "hod_ce_gpp",
    email: "hod.ce@example.com",
    instituteEmail: "hod.ce@gppalanpur.ac.in",
    password: "Password@123",
    roles: ["hod", "faculty"],
    isActive: true,
    instituteId: "inst1",
    authProviders: ['password'],
    isEmailVerified: true,
    preferences: { theme: 'system', language: 'en' },
    fullName: "HOD COMPUTER ENGINEERING",
    firstName: "COMPUTER",
    lastName: "ENGINEERING",
    currentRole: "hod"
  }
];

// Initial roles data (basic roles to start with)
const initialRoles = [
  {
    id: "role_super_admin",
    name: "Super Administrator",
    code: "super_admin",
    description: "System-wide administrative access",
    permissions: ["*"], // All permissions
    isSystemRole: true,
    scope: {
      level: "system"
    }
  },
  {
    id: "role_admin",
    name: "Administrator",
    code: "admin",
    description: "Administrative access to institute",
    permissions: [
      "users.manage",
      "roles.manage",
      "institutes.manage",
      "departments.manage"
    ],
    isSystemRole: false,
    scope: {
      level: "institute"
    }
  },
  {
    id: "role_hod",
    name: "Head of Department",
    code: "hod",
    description: "Head of academic department",
    permissions: [
      "department.manage",
      "faculty.manage",
      "students.view",
      "results.manage"
    ],
    isSystemRole: false,
    scope: {
      level: "department"
    }
  },
  {
    id: "role_faculty",
    name: "Faculty",
    code: "faculty",
    description: "Teaching staff member",
    permissions: [
      "students.view",
      "results.view",
      "attendance.manage"
    ],
    isSystemRole: false,
    scope: {
      level: "department"
    }
  },
  {
    id: "role_student",
    name: "Student",
    code: "student",
    description: "Student user",
    permissions: [
      "profile.view",
      "results.view.own",
      "attendance.view.own"
    ],
    isSystemRole: false,
    scope: {
      level: "institute"
    }
  }
];

// Initial departments data
const initialDepartments = [
  {
    id: "dept_ce_gpp",
    name: "Computer Engineering",
    code: "CE",
    instituteId: "inst1",
    status: "active",
    establishmentYear: 1984,
    hodId: "user_hod_ce_gpp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "dept_me_gpp", 
    name: "Mechanical Engineering",
    code: "ME",
    instituteId: "inst1",
    status: "active",
    establishmentYear: 1964,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "dept_gen_gpp",
    name: "General Department",
    code: "GEN", 
    instituteId: "inst1",
    status: "active",
    establishmentYear: 1964,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initial programs data
const initialPrograms = [
  {
    id: "prog_dce_gpp",
    name: "Diploma in Computer Engineering",
    code: "DCE",
    description: "3-year diploma program in Computer Engineering",
    departmentId: "dept_ce_gpp",
    instituteId: "inst1",
    degreeType: "Diploma",
    durationYears: 3,
    totalSemesters: 6,
    totalCredits: 180,
    curriculumVersion: "2022-23",
    status: "active",
    admissionCapacity: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prog_dme_gpp",
    name: "Diploma in Mechanical Engineering", 
    code: "DME",
    description: "3-year diploma program in Mechanical Engineering",
    departmentId: "dept_me_gpp",
    instituteId: "inst1",
    degreeType: "Diploma",
    durationYears: 3,
    totalSemesters: 6,
    totalCredits: 180,
    curriculumVersion: "2022-23",
    status: "active",
    admissionCapacity: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initial batches data
const initialBatches = [
  {
    id: "batch_dce_2022_gpp",
    name: "DCE 2022-2025",
    programId: "prog_dce_gpp",
    startAcademicYear: 2022,
    endAcademicYear: 2025,
    status: "active",
    maxIntake: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "batch_dme_2023_gpp",
    name: "DME 2023-2026",
    programId: "prog_dme_gpp", 
    startAcademicYear: 2023,
    endAcademicYear: 2026,
    status: "active",
    maxIntake: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initial courses data
const initialCourses = [
  {
    id: "course_cs101_dce_gpp",
    subcode: "CS101",
    subjectName: "Introduction to Programming",
    departmentId: "dept_ce_gpp",
    programId: "prog_dce_gpp",
    semester: 1,
    lectureHours: 3,
    tutorialHours: 1,
    practicalHours: 2,
    credits: 6,
    theoryEseMarks: 70,
    theoryPaMarks: 30,
    practicalEseMarks: 25,
    practicalPaMarks: 25,
    totalMarks: 150,
    isElective: false,
    isTheory: true,
    theoryExamDuration: "2.5 Hrs",
    isPractical: true,
    practicalExamDuration: "2 Hrs",
    isFunctional: true,
    category: "Program Core",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "course_math1_gen_gpp",
    subcode: "MA101",
    subjectName: "Mathematics-I",
    departmentId: "dept_gen_gpp",
    programId: "prog_dce_gpp",
    semester: 1,
    lectureHours: 3,
    tutorialHours: 1,
    practicalHours: 0,
    credits: 4,
    theoryEseMarks: 70,
    theoryPaMarks: 30,
    practicalEseMarks: 0,
    practicalPaMarks: 0,
    totalMarks: 100,
    isElective: false,
    isTheory: true,
    theoryExamDuration: "2.5 Hrs",
    isPractical: false,
    isFunctional: true,
    category: "Basic Science",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await connectMongoose();
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await UserModel.deleteMany({});
    await RoleModel.deleteMany({});
    await DepartmentModel.deleteMany({});
    await ProgramModel.deleteMany({});
    await BatchModel.deleteMany({});
    await CourseModel.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Seed departments first (as they're referenced by other entities)
    const departmentDocuments = initialDepartments.map(dept => {
      const { id, ...deptData } = dept;
      return deptData;
    });
    
    await DepartmentModel.insertMany(departmentDocuments);
    console.log(`✅ Seeded ${initialDepartments.length} departments`);

    // Seed programs (depends on departments)
    const programDocuments = initialPrograms.map(program => {
      const { id, ...programData } = program;
      return programData;
    });
    
    await ProgramModel.insertMany(programDocuments);
    console.log(`✅ Seeded ${initialPrograms.length} programs`);

    // Seed batches (depends on programs)
    const batchDocuments = initialBatches.map(batch => {
      const { id, ...batchData } = batch;
      return batchData;
    });
    
    await BatchModel.insertMany(batchDocuments);
    console.log(`✅ Seeded ${initialBatches.length} batches`);

    // Seed courses (depends on departments and programs)
    const courseDocuments = initialCourses.map(course => {
      const { id, ...courseData } = course;
      return courseData;
    });
    
    await CourseModel.insertMany(courseDocuments);
    console.log(`✅ Seeded ${initialCourses.length} courses`);

    // Seed roles first
    const roleDocuments = initialRoles.map(role => {
      const { id, ...roleData } = role;
      return roleData;
    });
    
    await RoleModel.insertMany(roleDocuments);
    console.log(`✅ Seeded ${initialRoles.length} roles`);

    // Seed users
    const userDocuments = initialUsers.map(user => {
      const { id, ...userData } = user;
      return {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
    
    await UserModel.insertMany(userDocuments);
    console.log(`✅ Seeded ${initialUsers.length} users`);

    console.log('🎉 Database seeding completed successfully!');

    // Verify seeded data
    const userCount = await UserModel.countDocuments();
    const roleCount = await RoleModel.countDocuments();
    const departmentCount = await DepartmentModel.countDocuments();
    const programCount = await ProgramModel.countDocuments();
    const batchCount = await BatchModel.countDocuments();
    const courseCount = await CourseModel.countDocuments();
    console.log(`📊 Final counts: ${userCount} users, ${roleCount} roles, ${departmentCount} departments, ${programCount} programs, ${batchCount} batches, ${courseCount} courses`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await disconnectMongoDB();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
