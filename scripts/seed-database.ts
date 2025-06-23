import { connectMongoose, disconnectMongoDB } from '@/lib/mongodb';
import { 
  UserModel, RoleModel, DepartmentModel, CourseModel, 
  BatchModel, ProgramModel, InstituteModel, BuildingModel, RoomModel, CommitteeModel
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

// Initial committees data
const initialCommittees = [
  {
    id: "cmt_arc_gpp",
    name: "Anti-Ragging Committee",
    code: "ARC_GPP",
    purpose: "To prevent ragging and ensure a safe campus environment.",
    instituteId: "inst1",
    formationDate: "2023-07-01",
    status: "active",
    convenerId: "user_hod_ce_gpp", // Example convener (HOD Computer)
    members: [
      {
        userId: "user_hod_ce_gpp",
        role: "convener",
        assignmentDate: "2023-07-01"
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cmt_cwan_gpp",
    name: "College Website & Network Committee",
    code: "CWAN_GPP",
    description: "Manages and maintains the college website and network infrastructure.",
    purpose: "To oversee digital presence and IT infrastructure.",
    instituteId: "inst1",
    formationDate: "2023-01-15",
    status: "active",
    convenerId: "user_admin_gpp", // Using admin as convener for this committee
    members: [
      {
        userId: "user_admin_gpp",
        role: "convener",
        assignmentDate: "2023-01-15"
      },
      {
        userId: "user_hod_ce_gpp",
        role: "member",
        assignmentDate: "2023-01-15"
      }
    ],
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

// Initial institutes data
const initialInstitutes = [
  {
    id: "inst1",
    name: "Government Polytechnic Palanpur",
    code: "GPP",
    address: "Jagana, Palanpur, Gujarat 385011",
    contactEmail: "gp-palanpur-dte@gujarat.gov.in",
    contactPhone: "02742-280126",
    website: "http://www.gppalanpur.ac.in",
    status: "active",
    establishmentYear: 1964,
    administrators: ["user_admin_gpp"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initial buildings data
const initialBuildings = [
  {
    id: "bldg_admin_gpp",
    name: "Administrative Block",
    code: "ADMIN",
    description: "Main administrative building",
    instituteId: "inst1",
    status: "active",
    constructionYear: 1964,
    numberOfFloors: 2,
    totalAreaSqFt: 5000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "bldg_academic_gpp",
    name: "Academic Block",
    code: "ACAD",
    description: "Main academic building with classrooms and labs",
    instituteId: "inst1",
    status: "active",
    constructionYear: 1984,
    numberOfFloors: 3,
    totalAreaSqFt: 12000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initial rooms data
const initialRooms = [
  {
    id: "room_101_admin_gpp",
    roomNumber: "101",
    name: "Principal Office",
    buildingId: "bldg_admin_gpp",
    floor: 1,
    type: "Office",
    capacity: 10,
    areaSqFt: 300,
    facilities: ["AC", "Computer", "Printer"],
    status: "available",
    notes: "Principal's office",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "room_201_acad_gpp",
    roomNumber: "201",
    name: "Computer Lab 1",
    buildingId: "bldg_academic_gpp",
    floor: 2,
    type: "Laboratory",
    capacity: 30,
    areaSqFt: 600,
    facilities: ["Computers", "Projector", "AC", "Whiteboard"],
    status: "available",
    notes: "Computer programming lab",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "room_301_acad_gpp",
    roomNumber: "301",
    name: "Lecture Hall A",
    buildingId: "bldg_academic_gpp",
    floor: 3,
    type: "Lecture Hall",
    capacity: 60,
    areaSqFt: 800,
    facilities: ["Projector", "Sound System", "Whiteboard"],
    status: "available",
    notes: "Main lecture hall for computer engineering",
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
    await InstituteModel.deleteMany({});
    await BuildingModel.deleteMany({});
    await RoomModel.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Seed institutes first (as they're referenced by other entities)
    const instituteDocuments = initialInstitutes.map(inst => {
      return inst; // Keep all fields including custom id
    });
    
    await InstituteModel.insertMany(instituteDocuments);
    console.log(`✅ Seeded ${instituteDocuments.length} institutes`);

    // Seed departments (as they're referenced by other entities)
    const departmentDocuments = initialDepartments.map(dept => {
      return dept; // Keep all fields including custom id
    });
    
    await DepartmentModel.insertMany(departmentDocuments);
    console.log(`✅ Seeded ${initialDepartments.length} departments`);

    // Seed committees (depends on users and institutes)
    const committeeDocuments = initialCommittees.map(committee => {
      return committee; // Keep all fields including custom id
    });
    
    await CommitteeModel.insertMany(committeeDocuments);
    console.log(`✅ Seeded ${initialCommittees.length} committees`);

    // Seed programs (depends on departments)
    const programDocuments = initialPrograms.map(program => {
      return program; // Keep all fields including custom id
    });
    
    await ProgramModel.insertMany(programDocuments);
    console.log(`✅ Seeded ${initialPrograms.length} programs`);

    // Seed batches (depends on programs)
    const batchDocuments = initialBatches.map(batch => {
      return batch; // Keep all fields including custom id
    });
    
    await BatchModel.insertMany(batchDocuments);
    console.log(`✅ Seeded ${initialBatches.length} batches`);

    // Seed courses (depends on departments and programs)
    const courseDocuments = initialCourses.map(course => {
      return course; // Keep all fields including custom id
    });
    
    await CourseModel.insertMany(courseDocuments);
    console.log(`✅ Seeded ${initialCourses.length} courses`);

    // Seed buildings
    const buildingDocuments = initialBuildings.map(building => {
      return building; // Keep all fields including custom id
    });
    
    await BuildingModel.insertMany(buildingDocuments);
    console.log(`✅ Seeded ${buildingDocuments.length} buildings`);

    // Seed rooms
    const roomDocuments = initialRooms.map(room => {
      return room; // Keep all fields including custom id
    });
    
    await RoomModel.insertMany(roomDocuments);
    console.log(`✅ Seeded ${roomDocuments.length} rooms`);

    // Seed roles first
    const roleDocuments = initialRoles.map(role => {
      return role; // Keep all fields including custom id
    });
    
    await RoleModel.insertMany(roleDocuments);
    console.log(`✅ Seeded ${initialRoles.length} roles`);

    // Seed users
    const userDocuments = initialUsers.map(user => {
      return {
        ...user, // Keep all fields including custom id
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
    const committeeCount = await CommitteeModel.countDocuments();
    const programCount = await ProgramModel.countDocuments();
    const batchCount = await BatchModel.countDocuments();
    const courseCount = await CourseModel.countDocuments();
    const instituteCount = await InstituteModel.countDocuments();
    const buildingCount = await BuildingModel.countDocuments();
    const roomCount = await RoomModel.countDocuments();
    console.log(`📊 Final counts: ${userCount} users, ${roleCount} roles, ${departmentCount} departments, ${committeeCount} committees, ${programCount} programs, ${batchCount} batches, ${courseCount} courses, ${instituteCount} institutes, ${buildingCount} buildings, ${roomCount} rooms`);

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
