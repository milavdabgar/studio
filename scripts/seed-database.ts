import { connectMongoose, disconnectMongoDB } from '@/lib/mongodb';
import { UserModel, RoleModel } from '@/lib/models';

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

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await connectMongoose();
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await UserModel.deleteMany({});
    await RoleModel.deleteMany({});
    console.log('🧹 Cleared existing data');

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
    console.log(`📊 Final counts: ${userCount} users, ${roleCount} roles`);

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
