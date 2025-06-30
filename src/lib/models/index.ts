import mongoose, { Schema, Document } from 'mongoose';
import type { 
  User, Role, Permission, Department, Course, Batch, Program, 
  Room, Building, Committee, Institute, Student, Faculty, ProjectTeam, ProjectEvent, ProjectEventScheduleItem, Project, ProjectRequirements, ProjectGuide, ProjectEvaluation, Assessment, Result, ResultSubject
} from '@/types/entities';

// Institute Schema
interface IInstitute extends Omit<Institute, 'id'>, Document {
  _id: string;
}

const instituteSchema = new Schema<IInstitute>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  address: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  website: { type: String },
  domain: { type: String },
  status: { type: String, enum: ['active', 'inactive'], required: true, default: 'active' },
  establishmentYear: { type: Number },
  administrators: [{ type: String }],
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      if (ret.id && typeof ret.id === 'string' && ret.id !== ret._id.toString()) {
        // Keep the custom id
      } else {
        ret.id = ret._id;
      }
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Building Schema
interface IBuilding extends Omit<Building, 'id'>, Document {
  _id: string;
}

const buildingSchema = new Schema<IBuilding>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  name: { type: String, required: true },
  code: { type: String },
  description: { type: String },
  instituteId: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'under_construction', 'maintenance'], required: true, default: 'active' },
  constructionYear: { type: Number },
  numberOfFloors: { type: Number },
  totalAreaSqFt: { type: Number },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      ret.id = ret.id || ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Room Schema
interface IRoom extends Omit<Room, 'id'>, Document {
  _id: string;
}

const roomSchema = new Schema<IRoom>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  roomNumber: { type: String, required: true },
  name: { type: String },
  buildingId: { type: String, required: true },
  floor: { type: Number },
  type: { 
    type: String, 
    enum: ['Lecture Hall', 'Laboratory', 'Office', 'Staff Room', 'Workshop', 'Library', 'Store Room', 'Seminar Hall', 'Auditorium', 'Other'], 
    required: true 
  },
  capacity: { type: Number },
  areaSqFt: { type: Number },
  facilities: [{ type: String }],
  status: { 
    type: String, 
    enum: ['available', 'occupied', 'under_maintenance', 'unavailable', 'reserved'], 
    required: true, 
    default: 'available' 
  },
  notes: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      ret.id = ret.id || ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Committee Schema
interface ICommittee extends Omit<Committee, 'id'>, Document {
  _id: string;
}

const committeeSchema = new Schema<ICommittee>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  purpose: { type: String, required: true },
  instituteId: { type: String, required: true },
  formationDate: { type: String, required: true },
  dissolutionDate: { type: String },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'dissolved'], 
    required: true, 
    default: 'active' 
  },
  convenerId: { type: String },
  members: [{
    userId: { type: String, required: true },
    role: { type: String, required: true }, // CommitteeMemberRole
    assignmentDate: { type: String, required: true },
    endDate: { type: String }
  }],
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      ret.id = ret.id || ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// User Schema
interface IUser extends Omit<User, 'id'>, Document {
  _id: string;
}

const userSchema = new Schema<IUser>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true, sparse: true },
  displayName: { type: String, required: true },
  fullName: { type: String },
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
  photoURL: { type: String },
  phoneNumber: { type: String },
  departmentId: { type: String },
  
  authProviders: [{ 
    type: String, 
    enum: ['password', 'google', 'microsoft'],
    required: true 
  }],
  
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  lastLoginAt: { type: String },
  isActive: { type: Boolean, required: true, default: true },
  isEmailVerified: { type: Boolean, default: false },
  
  roles: [{ type: String, required: true }],
  currentRole: { type: String, required: true },
  
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    dashboard: {
      layout: { type: String },
      favorites: [{ type: String }]
    }
  },
  
  instituteId: { type: String },
  instituteEmail: { type: String },
  
  password: { type: String }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      ret.id = ret.id || ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Never expose password in JSON
      return ret;
    }
  }
});

// Role Schema
interface IRole extends Omit<Role, 'id'>, Document {
  _id: string;
}

const roleSchema = new Schema<IRole>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  permissions: [{ type: String, required: true }],
  
  isSystemRole: { type: Boolean, default: false },
  isCommitteeRole: { type: Boolean, default: false },
  committeeId: { type: String },
  committeeCode: { type: String },
  
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  
  scope: {
    level: { 
      type: String, 
      enum: ['system', 'dte', 'gtu', 'institute', 'department', 'committee'],
      required: true
    },
    instituteId: { type: String },
    departmentId: { type: String },
    committeeId: { type: String }
  }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      ret.id = ret.id || ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Permission Schema
interface IPermission extends Omit<Permission, 'id'>, Document {
  _id: string;
}

const permissionSchema = new Schema<IPermission>({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  resource: { type: String, required: true },
  action: { type: String, required: true },
  conditions: { type: Schema.Types.Mixed as mongoose.SchemaTypeOptions<Record<string, unknown>> }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Department Schema
interface IDepartment extends Omit<Department, 'id'>, Document {
  _id: string;
}

const departmentSchema = new Schema<IDepartment>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  name: { type: String, required: true },
  code: { type: String, required: true },
  instituteId: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], required: true, default: 'active' },
  establishmentYear: { type: Number },
  hodId: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      ret.id = ret.id || ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Course Schema
interface ICourse extends Omit<Course, 'id'>, Document {
  _id: string;
}

const courseSchema = new Schema<ICourse>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  subcode: { type: String, required: true },
  subjectName: { type: String, required: true },
  departmentId: { type: String, required: true },
  programId: { type: String, required: true },
  semester: { type: Number, required: true },
  lectureHours: { type: Number, required: true },
  tutorialHours: { type: Number, required: true },
  practicalHours: { type: Number, required: true },
  credits: { type: Number, required: true },
  theoryEseMarks: { type: Number, required: true },
  theoryPaMarks: { type: Number, required: true },
  practicalEseMarks: { type: Number, required: true },
  practicalPaMarks: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  isElective: { type: Boolean, required: true, default: false },
  isTheory: { type: Boolean, required: true, default: true },
  theoryExamDuration: { type: String },
  isPractical: { type: Boolean, required: true, default: false },
  practicalExamDuration: { type: String },
  isFunctional: { type: Boolean, required: true, default: true },
  category: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      ret.id = ret.id || ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Batch Schema
interface IBatch extends Omit<Batch, 'id'>, Document {
  _id: string;
}

const batchSchema = new Schema<IBatch>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  name: { type: String, required: true },
  programId: { type: String, required: true },
  startAcademicYear: { type: Number, required: true },
  endAcademicYear: { type: Number, required: true },
  status: { type: String, enum: ['active', 'inactive', 'upcoming', 'completed'], required: true, default: 'active' },
  maxIntake: { type: Number, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      ret.id = ret.id || ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Program Schema
interface IProgram extends Omit<Program, 'id'>, Document {
  _id: string;
}

const programSchema = new Schema<IProgram>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  name: { type: String, required: true },
  code: { type: String, required: true },
  description: { type: String },
  departmentId: { type: String, required: true },
  instituteId: { type: String, required: true },
  degreeType: { type: String, enum: ['Diploma', 'Bachelor', 'Master', 'PhD', 'Certificate'] },
  durationYears: { type: Number },
  totalSemesters: { type: Number },
  totalCredits: { type: Number },
  curriculumVersion: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'phasing_out'], required: true, default: 'active' },
  admissionCapacity: { type: Number },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      ret.id = ret.id || ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Update timestamps middleware
instituteSchema.pre('save', function(next) {
  (this as IInstitute).updatedAt = new Date().toISOString();
  next();
});

buildingSchema.pre('save', function(next) {
  (this as IBuilding).updatedAt = new Date().toISOString();
  next();
});

roomSchema.pre('save', function(next) {
  (this as IRoom).updatedAt = new Date().toISOString();
  next();
});

committeeSchema.pre('save', function(next) {
  (this as ICommittee).updatedAt = new Date().toISOString();
  next();
});

userSchema.pre('save', function(next) {
  (this as IUser).updatedAt = new Date().toISOString();
  next();
});

roleSchema.pre('save', function(next) {
  (this as IRole).updatedAt = new Date().toISOString();
  next();
});

departmentSchema.pre('save', function(next) {
  (this as IDepartment).updatedAt = new Date().toISOString();
  next();
});

courseSchema.pre('save', function(next) {
  (this as ICourse).updatedAt = new Date().toISOString();
  next();
});

batchSchema.pre('save', function(next) {
  (this as IBatch).updatedAt = new Date().toISOString();
  next();
});

programSchema.pre('save', function(next) {
  (this as IProgram).updatedAt = new Date().toISOString();
  next();
});

// Student Schema
interface IStudent extends Omit<Student, 'id'>, Document {
  _id: string;
}

const studentSchema = new Schema<IStudent>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  userId: { type: String }, // Reference to User model
  
  enrollmentNumber: { type: String, required: true, unique: true },
  gtuEnrollmentNumber: { type: String },
  
  programId: { type: String, required: true }, // Reference to Program
  department: { type: String, required: true }, // Department ID
  batchId: { type: String }, // Reference to Batch
  currentSemester: { type: Number, required: true, default: 1 },
  admissionDate: { type: String },
  
  category: { type: String }, // OPEN, SEBC, SC, ST, etc.
  shift: { 
    type: String, 
    enum: ['Morning', 'Afternoon', 'Evening'], 
  },
  
  isComplete: { type: Boolean, default: false },
  termClose: { type: Boolean, default: false },
  isCancel: { type: Boolean, default: false },
  isPassAll: { type: Boolean, default: false },
  
  // Semester status tracking
  sem1Status: { type: String, enum: ['N/A', 'Passed', 'Pending', 'Not Appeared'], default: 'N/A' },
  sem2Status: { type: String, enum: ['N/A', 'Passed', 'Pending', 'Not Appeared'], default: 'N/A' },
  sem3Status: { type: String, enum: ['N/A', 'Passed', 'Pending', 'Not Appeared'], default: 'N/A' },
  sem4Status: { type: String, enum: ['N/A', 'Passed', 'Pending', 'Not Appeared'], default: 'N/A' },
  sem5Status: { type: String, enum: ['N/A', 'Passed', 'Pending', 'Not Appeared'], default: 'N/A' },
  sem6Status: { type: String, enum: ['N/A', 'Passed', 'Pending', 'Not Appeared'], default: 'N/A' },
  sem7Status: { type: String, enum: ['N/A', 'Passed', 'Pending', 'Not Appeared'], default: 'N/A' },
  sem8Status: { type: String, enum: ['N/A', 'Passed', 'Pending', 'Not Appeared'], default: 'N/A' },
  
  // Personal Information
  fullNameGtuFormat: { type: String },
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  dateOfBirth: { type: String },
  bloodGroup: { type: String },
  aadharNumber: { type: String },
  
  // Contact Information
  personalEmail: { type: String },
  instituteEmail: { type: String, required: true },
  contactNumber: { type: String },
  address: { type: String },
  
  // Guardian Details
  guardianDetails: {
    name: { type: String },
    relation: { type: String },
    contactNumber: { type: String },
    occupation: { type: String },
    annualIncome: { type: Number }
  },
  
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'graduated', 'dropped'], 
    required: true, 
    default: 'active' 
  },
  convocationYear: { type: Number },
  academicRemarks: { type: String },
  
  instituteId: { type: String },
  photoURL: { type: String },
  isActive: { type: Boolean, default: true },
  
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      ret.id = ret.id || ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

studentSchema.pre('save', function(next) {
  (this as IStudent).updatedAt = new Date().toISOString();
  next();
});

// Faculty Schema
interface IFaculty extends Omit<Faculty, 'id'>, Document {
  _id: string;
}

const facultySchema = new Schema<IFaculty>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  userId: { type: String }, // Reference to User model
  
  staffCode: { type: String, required: true, unique: true },
  employeeId: { type: String },
  
  title: { type: String },
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
  gtuName: { type: String },
  personalEmail: { type: String },
  instituteEmail: { type: String, required: true },
  contactNumber: { type: String },
  
  department: { type: String, required: true },
  designation: { type: String },
  jobType: { 
    type: String, 
    enum: ['Regular', 'Adhoc', 'Contractual', 'Visiting', 'Other']
  },
  staffCategory: { 
    type: String, 
    enum: ['Teaching', 'Clerical', 'Technical', 'Support', 'Administrative', 'Other'],
    default: 'Teaching'
  },
  category: { 
    type: String, 
    enum: ['Teaching', 'Clerical', 'Technical', 'Support', 'Administrative', 'Other']
  }, // Alias for staffCategory for compatibility
  instType: { type: String },
  specializations: [{ type: String }],
  specialization: { type: String }, // Single specialization field for compatibility
  qualifications: [{
    degree: { type: String },
    field: { type: String },
    institution: { type: String },
    year: { type: Number },
    percentage: { type: Number }
  }],
  qualification: { type: String }, // Single qualification field for compatibility
  experience: { type: Number }, // Years of experience
  
  dateOfBirth: { type: String },
  joiningDate: { type: String },
  
  // Additional fields for compatibility
  gtuFacultyId: { type: String },
  fullName: { type: String },
  address: { type: String },
  isHOD: { type: Boolean, default: false },
  isPrincipal: { type: Boolean, default: false },
  researchInterests: { type: String },
  
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  maritalStatus: { type: String },
  aadharNumber: { type: String },
  panCardNumber: { type: String },
  gpfNpsNumber: { type: String },
  placeOfBirth: { type: String },
  nationality: { type: String },
  knownAs: { type: String },
  
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'retired', 'resigned', 'on_leave'],
    required: true,
    default: 'active'
  },
  
  instituteId: { type: String },
  
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      ret.id = ret.id || ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

facultySchema.pre('save', function(next) {
  (this as IFaculty).updatedAt = new Date().toISOString();
  next();
});

// ProjectTeam Schema
interface IProjectTeam extends Omit<ProjectTeam, 'id'>, Document {
  _id: string;
}

const projectTeamSchema = new Schema<IProjectTeam>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  
  name: { type: String, required: true },
  description: { type: String },
  department: { type: String, required: true },
  eventId: { type: String, required: true },
  maxMembers: { type: Number },
  status: { type: String, enum: ['active', 'inactive', 'completed'], default: 'active' },
  
  members: [{
    userId: { type: String, required: true },
    name: { type: String, required: true },
    enrollmentNo: { type: String, required: true },
    role: { type: String, required: true },
    isLeader: { type: Boolean, required: true, default: false },
    joinedAt: { type: String, default: () => new Date().toISOString() }
  }],
  
  createdBy: { type: String },
  updatedBy: { type: String },
  
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      ret.id = ret.id || ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

projectTeamSchema.pre('save', function(next) {
  (this as IProjectTeam).updatedAt = new Date().toISOString();
  next();
});

// ProjectEvent Schema
interface IProjectEvent extends Omit<ProjectEvent, 'id'>, Document {
  _id: string;
}

const projectEventSchema = new Schema<IProjectEvent>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  
  name: { type: String, required: true },
  description: { type: String },
  academicYear: { type: String, required: true },
  eventDate: { type: String, required: true }, // ISO date string
  registrationStartDate: { type: String, required: true }, // ISO date string
  registrationEndDate: { type: String, required: true }, // ISO date string
  status: { 
    type: String, 
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], 
    required: true 
  },
  isActive: { type: Boolean, required: true, default: true },
  publishResults: { type: Boolean, default: false },
  
  schedule: [{
    time: { type: String, required: true },
    activity: { type: String, required: true },
    location: { type: String, required: true },
    coordinator: {
      userId: { type: String, required: true },
      name: { type: String, required: true }
    },
    notes: { type: String }
  }],
  
  departments: [{ type: String }],
  
  createdBy: { type: String },
  updatedBy: { type: String },
  
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      ret.id = ret.id || ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

projectEventSchema.pre('save', function(next) {
  (this as IProjectEvent).updatedAt = new Date().toISOString();
  next();
});

// Project Schema
interface IProject extends Omit<Project, 'id'>, Document {
  _id: string;
}

const projectSchema = new Schema<IProject>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  
  title: { type: String, required: true },
  category: { type: String, required: true },
  abstract: { type: String, required: true },
  department: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'approved', 'rejected', 'completed', 'evaluated'], 
    required: true 
  },
  
  requirements: {
    power: { type: Boolean, required: true },
    internet: { type: Boolean, required: true },
    specialSpace: { type: Boolean, required: true },
    otherRequirements: { type: String }
  },
  
  guide: {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    contactNumber: { type: String }
  },
  
  teamId: { type: String, required: true },
  eventId: { type: String, required: true },
  locationId: { type: String },
  
  deptEvaluation: {
    completed: { type: Boolean, required: true },
    score: { type: Number },
    feedback: { type: String },
    juryId: { type: String },
    evaluatedAt: { type: String },
    criteriaScores: [{
      criteriaId: { type: String, required: true },
      score: { type: Number, required: true },
      comments: { type: String }
    }]
  },
  
  centralEvaluation: {
    completed: { type: Boolean, required: true },
    score: { type: Number },
    feedback: { type: String },
    juryId: { type: String },
    evaluatedAt: { type: String },
    criteriaScores: [{
      criteriaId: { type: String, required: true },
      score: { type: Number, required: true },
      comments: { type: String }
    }]
  },
  
  rank: { type: Number },
  prize: { type: String },
  certificateUrl: { type: String },
  
  createdBy: { type: String },
  updatedBy: { type: String },
  
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      ret.id = ret.id || ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

projectSchema.pre('save', function(next) {
  (this as IProject).updatedAt = new Date().toISOString();
  next();
});

// Assessment Schema
interface IAssessment extends Omit<Assessment, 'id'>, Document {
  _id: string;
}

const assessmentSchema = new Schema<IAssessment>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  
  name: { type: String, required: true },
  courseId: { type: String, required: true },
  programId: { type: String, required: true },
  batchId: { type: String },
  type: { 
    type: String, 
    enum: ['Quiz', 'Midterm', 'Final Exam', 'Assignment', 'Project', 'Lab Work', 'Presentation', 'Other'], 
    required: true 
  },
  description: { type: String },
  maxMarks: { type: Number, required: true },
  passingMarks: { type: Number },
  weightage: { type: Number },
  assessmentDate: { type: String },
  dueDate: { type: String },
  status: { 
    type: String, 
    enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled'], 
    required: true 
  },
  instructions: { type: String },
  facultyId: { type: String },
  
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      // Use custom id if available, otherwise use _id
      ret.id = ret.id || ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

assessmentSchema.pre('save', function(next) {
  (this as IAssessment).updatedAt = new Date().toISOString();
  next();
});

// Result Schema
interface IResult extends Omit<Result, '_id'>, Document {
  _id: string;
}

const resultSubjectSchema = new Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  credits: { type: Number, required: true },
  grade: { type: String, required: true },
  isBacklog: { type: Boolean, required: true },
  theoryEseGrade: { type: String },
  theoryPaGrade: { type: String },
  theoryTotalGrade: { type: String },
  practicalPaGrade: { type: String },
  practicalVivaGrade: { type: String },
  practicalTotalGrade: { type: String }
}, { _id: false });

const resultSchema = new Schema<IResult>({
  st_id: { type: String },
  studentId: { type: String },
  enrollmentNo: { type: String, required: true },
  extype: { type: String },
  examid: { type: Number },
  exam: { type: String },
  declarationDate: { type: String },
  academicYear: { type: String },
  semester: { type: Number, required: true },
  unitNo: { type: Number },
  examNumber: { type: Number },
  name: { type: String, required: true },
  instcode: { type: Number },
  instName: { type: String },
  courseName: { type: String },
  branchCode: { type: Number },
  branchName: { type: String, required: true },
  subjects: [resultSubjectSchema],
  totalCredits: { type: Number, required: true },
  earnedCredits: { type: Number, required: true },
  spi: { type: Number, required: true },
  cpi: { type: Number, required: true },
  cgpa: { type: Number },
  result: { type: String, required: true },
  trials: { type: Number },
  remark: { type: String },
  currentBacklog: { type: Number },
  totalBacklog: { type: Number },
  uploadBatch: { type: String, required: true },
  programId: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: false,
  _id: true, // Let MongoDB handle _id generation
  toJSON: {
    transform: function(doc, ret) {
      // Keep _id as is for Results (compatibility with existing code)
      delete ret.__v;
      return ret;
    }
  }
});

resultSchema.pre('save', function(next) {
  (this as IResult).updatedAt = new Date().toISOString();
  next();
});

// Models
export const InstituteModel = mongoose.models.Institute || mongoose.model<IInstitute>('Institute', instituteSchema);
export const BuildingModel = mongoose.models.Building || mongoose.model<IBuilding>('Building', buildingSchema);
export const RoomModel = mongoose.models.Room || mongoose.model<IRoom>('Room', roomSchema);
export const CommitteeModel = mongoose.models.Committee || mongoose.model<ICommittee>('Committee', committeeSchema);
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const RoleModel = mongoose.models.Role || mongoose.model<IRole>('Role', roleSchema);
export const PermissionModel = mongoose.models.Permission || mongoose.model<IPermission>('Permission', permissionSchema);
export const DepartmentModel = mongoose.models.Department || mongoose.model<IDepartment>('Department', departmentSchema);
export const CourseModel = mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);
export const BatchModel = mongoose.models.Batch || mongoose.model<IBatch>('Batch', batchSchema);
export const ProgramModel = mongoose.models.Program || mongoose.model<IProgram>('Program', programSchema);
export const StudentModel = mongoose.models.Student || mongoose.model<IStudent>('Student', studentSchema);
export const FacultyModel = mongoose.models.Faculty || mongoose.model<IFaculty>('Faculty', facultySchema, 'faculties');
export const ProjectTeamModel = mongoose.models.ProjectTeam || mongoose.model<IProjectTeam>('ProjectTeam', projectTeamSchema, 'projectteams');
export const ProjectEventModel = mongoose.models.ProjectEvent || mongoose.model<IProjectEvent>('ProjectEvent', projectEventSchema, 'projectevents');
export const ProjectModel = mongoose.models.Project || mongoose.model<IProject>('Project', projectSchema, 'projects');
export const AssessmentModel = mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', assessmentSchema, 'assessments');
export const ResultModel = mongoose.models.Result || mongoose.model<IResult>('Result', resultSchema, 'results');

// Export types
export type { IInstitute, IBuilding, IRoom, ICommittee, IUser, IRole, IPermission, IDepartment, ICourse, IBatch, IProgram, IStudent, IFaculty, IProjectTeam, IProjectEvent, IProject, IAssessment, IResult };
