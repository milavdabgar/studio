import { connectMongoose, disconnectMongoDB } from '@/lib/mongodb';
import { 
  UserModel, RoleModel, DepartmentModel, CourseModel, 
  BatchModel, ProgramModel, InstituteModel, BuildingModel, RoomModel, CommitteeModel, StudentModel
} from '@/lib/models';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

// CSV file paths
const CSV_BASE_PATH = path.join(process.cwd(), 'data', 'csvs', 'portal-exports');
const CSV_FILES = {
  institutes: path.join(CSV_BASE_PATH, 'institutes_export.csv'),
  departments: path.join(CSV_BASE_PATH, 'departments_export.csv'),
  programs: path.join(CSV_BASE_PATH, 'programs_export.csv'),
  roles: path.join(CSV_BASE_PATH, 'roles_export.csv'),
};

// CSV parsing utility function
function parseCSV<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    
    if (!fs.existsSync(filePath)) {
      console.warn(`CSV file not found: ${filePath}`);
      resolve([]);
      return;
    }
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: T) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// CSV data transformation functions
function transformInstituteData(csvData: any[]): any[] {
  return csvData.map(row => ({
    id: row.id,
    name: row.name,
    code: row.code,
    domain: 'gppalanpur.ac.in', // Default domain
    address: row.address,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    website: row.website,
    status: row.status || 'active',
    establishmentYear: parseInt(row.establishmentYear) || new Date().getFullYear(),
    administrators: ['user_admin_gpp'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}

function transformDepartmentData(csvData: any[]): any[] {
  return csvData.map(row => ({
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description || '',
    instituteId: null, // Skip object ID - will be selected from dropdown
    status: row.status || 'active',
    establishmentYear: parseInt(row.establishmentYear) || 1984,
    hodId: null, // Skip object ID - will be selected from dropdown
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}

function transformProgramData(csvData: any[]): any[] {
  return csvData.map(row => ({
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description || '',
    departmentId: null, // Skip object ID - will be selected from dropdown
    instituteId: null, // Skip object ID - will be selected from dropdown
    degreeType: 'Diploma',
    durationYears: parseInt(row.durationYears) || 3,
    totalSemesters: parseInt(row.totalSemesters) || 6,
    totalCredits: 180,
    curriculumVersion: '2022-23',
    status: row.status || 'active',
    admissionCapacity: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}

function transformRoleData(csvData: any[]): any[] {
  return csvData.map(row => ({
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description || '',
    permissions: row.permissions ? row.permissions.split(';').filter((p: string) => p.trim()) : [],
    isSystemRole: row.isSystemRole === 'true',
    isCommitteeRole: row.isCommitteeRole === 'true',
    committeeId: null, // Skip object ID - will be selected from dropdown
    scope: {
      level: row.code === 'admin' ? 'institute' : 
             row.code === 'hod' ? 'department' : 
             row.code === 'faculty' ? 'institute' :
             row.code === 'student' ? 'institute' : 'institute'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}

// Initial user data (from current in-memory store)
const initialUsers = [
  {
    id: "user_admin_gpp",
    displayName: "GPP Super Admin",
    username: "gpp_superadmin",
    email: "admin@gppalanpur.ac.in",
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
  },
  {
    id: "user_student_ce001_gpp",
    displayName: "John Smith",
    username: "john_smith_ce001",
    email: "john.smith@student.gppalanpur.ac.in",
    instituteEmail: "john.smith@gppalanpur.ac.in",
    password: "Student@123",
    roles: ["student"],
    isActive: true,
    instituteId: "inst1",
    authProviders: ['password'],
    isEmailVerified: true,
    preferences: { theme: 'system', language: 'en' },
    fullName: "JOHN SMITH",
    firstName: "JOHN",
    lastName: "SMITH",
    currentRole: "student"
  },
  {
    id: "user_student_ce002_gpp",
    displayName: "Bob Wilson",
    username: "bob_wilson_ce002",
    email: "bob.wilson@student.gppalanpur.ac.in",
    instituteEmail: "bob.wilson@gppalanpur.ac.in",
    password: "Student@123",
    roles: ["student"],
    isActive: true,
    instituteId: "inst1",
    authProviders: ['password'],
    isEmailVerified: true,
    preferences: { theme: 'system', language: 'en' },
    fullName: "BOB WILSON",
    firstName: "BOB",
    lastName: "WILSON",
    currentRole: "student"
  },
  {
    id: "user_student_me001_gpp",
    displayName: "Alice Johnson",
    username: "alice_johnson_me001",
    email: "alice.johnson@student.gppalanpur.ac.in",
    instituteEmail: "alice.johnson@gppalanpur.ac.in",
    password: "Student@123",
    roles: ["student"],
    isActive: true,
    instituteId: "inst1",
    authProviders: ['password'],
    isEmailVerified: true,
    preferences: { theme: 'system', language: 'en' },
    fullName: "ALICE JOHNSON",
    firstName: "ALICE",
    lastName: "JOHNSON",
    currentRole: "student"
  }
];

// Function to create student data with correct program IDs
function createStudentData(programsData: any[], departmentsData: any[]): any[] {
  // Find the correct program IDs from CSV data
  const ceProgram = programsData.find(p => p.code === "11" || p.name.includes("Electronics & Communication"));
  const meProgram = programsData.find(p => p.code === "19" || p.name.includes("Mechanical"));
  const ceDepartment = departmentsData.find(d => d.code === "EC");
  const meDepartment = departmentsData.find(d => d.code === "ME");
  
  return [
    {
      id: "student_ce001_gpp",
      userId: "user_student_ce001_gpp",
      enrollmentNumber: "220010107001",
      firstName: "JOHN",
      lastName: "SMITH",
      fullNameGtuFormat: "JOHN SMITH",
      personalEmail: "john.smith@student.gppalanpur.ac.in",
      instituteEmail: "john.smith@gppalanpur.ac.in",
      programId: ceProgram?.id || "prog_dce_gpp",
      department: ceDepartment?.id || "dept_ce_gpp",
      batchId: "batch_dce_2022_gpp",
      status: "active",
      currentSemester: 5,
      creditsEarned: 120,
      totalCredits: 180,
      cpi: 8.5,
      admissionYear: 2022,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "student_ce002_gpp",
      userId: "user_student_ce002_gpp",
      enrollmentNumber: "220010107002",
      firstName: "BOB",
      lastName: "WILSON",
      fullNameGtuFormat: "BOB WILSON",
      personalEmail: "bob.wilson@student.gppalanpur.ac.in",
      instituteEmail: "bob.wilson@gppalanpur.ac.in",
      programId: ceProgram?.id || "prog_dce_gpp",
      department: ceDepartment?.id || "dept_ce_gpp",
      batchId: "batch_dce_2022_gpp",
      status: "active",
      currentSemester: 5,
      creditsEarned: 115,
      totalCredits: 180,
      cpi: 7.8,
      admissionYear: 2022,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "student_me001_gpp",
      userId: "user_student_me001_gpp",
      enrollmentNumber: "230010108001",
      firstName: "ALICE",
      lastName: "JOHNSON",
      fullNameGtuFormat: "ALICE JOHNSON",
      personalEmail: "alice.johnson@student.gppalanpur.ac.in",
      instituteEmail: "alice.johnson@gppalanpur.ac.in",
      programId: meProgram?.id || "prog_dme_gpp",
      department: meDepartment?.id || "dept_me_gpp",
      batchId: "batch_dme_2023_gpp",
      status: "active",
      currentSemester: 3,
      creditsEarned: 60,
      totalCredits: 180,
      cpi: 9.2,
      admissionYear: 2023,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

// Initial student profiles data (will be replaced with dynamic data)
const initialStudents = [];

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

// Function to create batch data with correct program IDs
function createBatchData(programsData: any[]): any[] {
  // Find the correct program IDs from CSV data
  const ceProgram = programsData.find(p => p.code === "11" || p.name.includes("Electronics & Communication"));
  const meProgram = programsData.find(p => p.code === "19" || p.name.includes("Mechanical"));
  
  return [
    {
      id: "batch_dce_2022_gpp",
      name: "DCE 2022-2025",
      programId: ceProgram?.id || "prog_dce_gpp",
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
      programId: meProgram?.id || "prog_dme_gpp", 
      startAcademicYear: 2023,
      endAcademicYear: 2026,
      status: "active",
      maxIntake: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

// Initial batches data (will be replaced with dynamic data)
const initialBatches = [];

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
    domain: "gppalanpur.ac.in",
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
    await StudentModel.deleteMany({});
    await CommitteeModel.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Load CSV data
    console.log('📊 Loading CSV data...');
    const [institutesCSV, departmentsCSV, programsCSV, rolesCSV] = await Promise.all([
      parseCSV(CSV_FILES.institutes),
      parseCSV(CSV_FILES.departments),
      parseCSV(CSV_FILES.programs),
      parseCSV(CSV_FILES.roles)
    ]);

    // Transform CSV data
    const institutesData = institutesCSV.length > 0 ? transformInstituteData(institutesCSV) : initialInstitutes;
    
    // Use first institute ID for departments and programs that need it
    const firstInstituteId = institutesData.length > 0 ? institutesData[0].id : 'inst1';
    
    const departmentsData = departmentsCSV.length > 0 ? 
      transformDepartmentData(departmentsCSV).map(dept => ({
        ...dept,
        instituteId: firstInstituteId // Use first institute ID as fallback
      })) : initialDepartments;
    
    const programsData = programsCSV.length > 0 ? 
      transformProgramData(programsCSV).map(prog => {
        // Find matching department from CSV data
        const matchingDept = departmentsData.find(dept => {
          const csvProgram = programsCSV.find((p: any) => p.id === prog.id);
          return dept.code === (csvProgram as any)?.departmentCode;
        });
        return {
          ...prog,
          instituteId: firstInstituteId, // Use first institute ID as fallback
          departmentId: matchingDept?.id || departmentsData[0]?.id || 'dept1' // Use matching or first department
        };
      }) : initialPrograms;
      
    const rolesData = rolesCSV.length > 0 ? transformRoleData(rolesCSV) : initialRoles;

    // Seed institutes first (as they're referenced by other entities)
    await InstituteModel.insertMany(institutesData);
    console.log(`✅ Seeded ${institutesData.length} institutes`);

    // Seed departments (as they're referenced by other entities)
    await DepartmentModel.insertMany(departmentsData);
    console.log(`✅ Seeded ${departmentsData.length} departments`);

    // Seed committees (depends on users and institutes)
    const committeeDocuments = initialCommittees.map(committee => {
      return {
        ...committee,
        instituteId: firstInstituteId // Use first institute ID as fallback
      };
    });
    
    await CommitteeModel.insertMany(committeeDocuments);
    console.log(`✅ Seeded ${initialCommittees.length} committees`);

    // Seed programs (depends on departments)
    await ProgramModel.insertMany(programsData);
    console.log(`✅ Seeded ${programsData.length} programs`);

    // Seed batches (depends on programs)
    const batchData = createBatchData(programsData);
    await BatchModel.insertMany(batchData);
    console.log(`✅ Seeded ${batchData.length} batches`);

    // Seed courses (depends on departments and programs)
    const courseDocuments = initialCourses.map(course => {
      return {
        ...course,
        departmentId: departmentsData[0]?.id || 'dept1', // Use first department
        programId: programsData[0]?.id || 'prog1' // Use first program
      };
    });
    
    await CourseModel.insertMany(courseDocuments);
    console.log(`✅ Seeded ${initialCourses.length} courses`);

    // Seed buildings
    const buildingDocuments = initialBuildings.map(building => {
      return {
        ...building,
        instituteId: firstInstituteId // Use first institute ID as fallback
      };
    });
    
    await BuildingModel.insertMany(buildingDocuments);
    console.log(`✅ Seeded ${buildingDocuments.length} buildings`);

    // Seed rooms
    const roomDocuments = initialRooms.map(room => {
      return {
        ...room,
        buildingId: buildingDocuments[0]?.id || 'bldg_admin_gpp' // Use first building ID
      };
    });
    
    await RoomModel.insertMany(roomDocuments);
    console.log(`✅ Seeded ${roomDocuments.length} rooms`);

    // Seed roles first
    await RoleModel.insertMany(rolesData);
    console.log(`✅ Seeded ${rolesData.length} roles`);

    // Seed users
    const userDocuments = initialUsers.map(user => {
      return {
        ...user, // Keep all fields including custom id
        instituteId: firstInstituteId, // Use first institute ID as fallback
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
    
    await UserModel.insertMany(userDocuments);
    console.log(`✅ Seeded ${initialUsers.length} users`);

    // Seed students (depends on users, programs, and batches)
    const studentData = createStudentData(programsData, departmentsData);
    await StudentModel.insertMany(studentData);
    console.log(`✅ Seeded ${studentData.length} students`);

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
    const studentCount = await StudentModel.countDocuments();
    
    console.log(`📊 Final counts:`);
    console.log(`  - ${userCount} users`);
    console.log(`  - ${roleCount} roles (${rolesCSV.length > 0 ? 'from CSV' : 'from default data'})`);
    console.log(`  - ${departmentCount} departments (${departmentsCSV.length > 0 ? 'from CSV' : 'from default data'})`);
    console.log(`  - ${committeeCount} committees`);
    console.log(`  - ${programCount} programs (${programsCSV.length > 0 ? 'from CSV' : 'from default data'})`);
    console.log(`  - ${batchCount} batches`);
    console.log(`  - ${courseCount} courses`);
    console.log(`  - ${instituteCount} institutes (${institutesCSV.length > 0 ? 'from CSV' : 'from default data'})`);
    console.log(`  - ${buildingCount} buildings`);
    console.log(`  - ${roomCount} rooms`);
    console.log(`  - ${studentCount} students`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await disconnectMongoDB();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
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
