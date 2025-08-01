import mongoose, { Schema, Document } from 'mongoose';
import type { 
  User, Role, Permission, Department, Course, Batch, Program, 
  Room, Building, Committee, Institute, Student, Faculty, ProjectTeam, ProjectEvent, Project, Assessment, Result, Enrollment, CourseOffering, Notification, StudentAssessmentScore, CourseMaterial, AttendanceRecord, Timetable, ProjectLocation, Curriculum, RoomAllocation, Examination, AcademicTerm, ProgramSemesterDateEntry, FacultyPreference, CoursePreference, TimePreference, TimeSlot
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
  principalId: { type: String }, // ID of the faculty member who is the Principal
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
  cctv: {
    installed: { type: Boolean, default: false },
    company: { type: String }, // e.g., "Digilink", "Hickvision"
    deviceNo: { type: String }, // e.g., "D31", "D09"
    ipAddress: { type: String }, // e.g., "10.169.24.27"
    username: { type: String }, // e.g., "admin"
    password: { type: String }, // e.g., "admin", "admin@123"
    status: { 
      type: String, 
      enum: ['working', 'down', 'maintenance', 'not_installed'],
      default: 'not_installed'
    }
  },
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
  committeeType: { type: String, default: 'Academic' },
  department: { type: String },
  chairperson: {
    userId: { type: String },
    name: { type: String },
    email: { type: String },
    contactNumber: { type: String }
  },
  establishedDate: { type: String },
  meetingSchedule: { type: String },
  responsibilities: [{ type: String }],
  instituteId: { type: String, required: true },
  formationDate: { type: String, required: true },
  dissolutionDate: { type: String },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'dissolved', 'suspended'], 
    required: true, 
    default: 'active' 
  },
  convenerId: { type: String },
  members: [{
    userId: { type: String, required: true },
    name: { type: String },
    email: { type: String },
    role: { type: String, required: true }, // CommitteeMemberRole
    contactNumber: { type: String },
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

// Academic Term Schema
interface IAcademicTerm extends Omit<AcademicTerm, 'id'>, Document {
  _id: string;
}

// Program-semester-date entry sub-schema
const programSemesterDateEntrySchema = new Schema({
  programs: [{ type: String, required: true }], // Array of program IDs (multiselect)
  semesters: [{ type: Number, required: true }], // Array of semester numbers (multiselect, filtered by term type)
  startDate: { type: String, required: true }, // ISO date string for this specific group
  endDate: { type: String, required: true } // ISO date string for this specific group
}, { _id: false });

const academicTermSchema = new Schema<IAcademicTerm>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  name: { type: String, required: true }, // "Odd Term 2024-25" (no program-specific)
  academicYear: { type: String, required: true },
  term: { type: String, enum: ['Odd', 'Even'], required: true },
  
  // Multiple entries - each can have different programs, semesters, and dates (table-like structure)
  dateEntries: [programSemesterDateEntrySchema],
  
  status: { type: String, enum: ['draft', 'active', 'completed', 'cancelled'], required: true, default: 'draft' },
  gtuCalendarUrl: { type: String },
  notes: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  
  // Legacy fields (for backward compatibility - will be removed in future)
  programId: { type: String }, // Deprecated
  semesters: [{ type: Number }], // Deprecated
  startDate: { type: String }, // Deprecated
  endDate: { type: String }, // Deprecated
  semesterDates: { type: Schema.Types.Mixed }, // Deprecated
  programAssignments: { type: Schema.Types.Mixed }, // Deprecated
  maxEnrollmentPerCourse: { type: Number } // Deprecated
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

academicTermSchema.pre('save', function(next) {
  // Generate custom ID if not provided
  if (!this.id) {
    this.id = this._id.toString();
  }
  
  // Generate name if not provided
  if (!this.name) {
    this.name = `${this.term} Term ${this.academicYear}`;
  }
  
  // Set updatedAt timestamp
  this.updatedAt = new Date().toISOString();
  
  // Validate date entries
  if (this.dateEntries && this.dateEntries.length > 0) {
    for (let i = 0; i < this.dateEntries.length; i++) {
      const entry = this.dateEntries[i];
      
      // Validate required fields
      if (!entry.programs || entry.programs.length === 0) {
        return next(new Error(`Date entry ${i + 1}: At least one program must be selected`));
      }
      
      if (!entry.semesters || entry.semesters.length === 0) {
        return next(new Error(`Date entry ${i + 1}: At least one semester must be selected`));
      }
      
      if (!entry.startDate || !entry.endDate) {
        return next(new Error(`Date entry ${i + 1}: Start date and end date are required`));
      }
      
      // Validate date formats and order
      const startDate = new Date(entry.startDate);
      const endDate = new Date(entry.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return next(new Error(`Date entry ${i + 1}: Invalid date format`));
      }
      
      if (startDate >= endDate) {
        return next(new Error(`Date entry ${i + 1}: Start date must be before end date`));
      }
      
      // Validate semester numbers (1-6 for diploma programs)
      const invalidSemesters = entry.semesters.filter(sem => sem < 1 || sem > 6);
      if (invalidSemesters.length > 0) {
        return next(new Error(`Date entry ${i + 1}: Invalid semester numbers: ${invalidSemesters.join(', ')}. Must be between 1 and 6`));
      }
      
      // Validate semester numbers match term type
      const termType = this.term;
      if (termType === 'Odd') {
        // Odd terms should only have odd semesters (1, 3, 5)
        const nonOddSemesters = entry.semesters.filter(sem => sem % 2 === 0);
        if (nonOddSemesters.length > 0) {
          return next(new Error(`Date entry ${i + 1}: Odd terms can only include odd semesters (1, 3, 5). Found: ${nonOddSemesters.join(', ')}`));
        }
      } else if (termType === 'Even') {
        // Even terms should only have even semesters (2, 4, 6)
        const nonEvenSemesters = entry.semesters.filter(sem => sem % 2 === 1);
        if (nonEvenSemesters.length > 0) {
          return next(new Error(`Date entry ${i + 1}: Even terms can only include even semesters (2, 4, 6). Found: ${nonEvenSemesters.join(', ')}`));
        }
      }
    }
  }
  
  (this as IAcademicTerm).updatedAt = new Date().toISOString();
  next();
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
  conditions: { type: Schema.Types.Mixed as unknown as mongoose.SchemaTypeOptions<Record<string, unknown>> }
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
  isSemiPractical: { type: Boolean, default: false },
  category: { type: String, required: true },
  effFrom: { type: String }, // Effective from (e.g., "2024-25")
  syllabusUrl: { type: String }, // GTU syllabus PDF URL
  remarks: { type: String },
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

const intakeCapacityRangeSchema = new Schema({
  fromYear: { type: Number, required: true },
  toYear: { type: Number }, // undefined means current/ongoing
  capacity: { type: Number, required: true },
  label: { type: String }
}, { _id: false });

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
  admissionCapacity: { type: Number }, // Legacy field
  intakeCapacityRanges: [intakeCapacityRangeSchema], // New range-based system
  currentIntakeCapacity: { type: Number }, // Legacy field - derived from ranges
  yearlyIntakeCapacities: { type: Schema.Types.Mixed }, // Legacy field - derived from ranges
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
        ret.id = ret._id.toString();
      }
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Curriculum Schema
interface ICurriculum extends Omit<Curriculum, 'id'>, Document {
  _id: string;
}

const curriculumSchema = new Schema<ICurriculum>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  programId: { type: String, required: true },
  version: { type: String, required: true },
  effectiveDate: { type: String, required: true },
  courses: [{
    courseId: { type: String, required: true },
    // Legacy fields for backward compatibility
    semester: { type: Number, required: true },
    isElective: { type: Boolean, required: true, default: false },
    // New fields for enhanced functionality
    isActive: { type: Boolean, default: true },
    customSemester: { type: Number }, // Optional override
    isCustomElective: { type: Boolean } // Optional override
  }],
  status: { type: String, enum: ['draft', 'active', 'archived'], required: true, default: 'draft' },
  isAutoGenerated: { type: Boolean, default: false },
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
  (this as { updatedAt?: string }).updatedAt = new Date().toISOString();
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

curriculumSchema.pre('save', function(next) {
  (this as ICurriculum).updatedAt = new Date().toISOString();
  next();
});

// Room Allocation Schema
interface IRoomAllocation extends Omit<RoomAllocation, 'id'>, Document {
  _id: string;
}

const roomAllocationSchema = new Schema<IRoomAllocation>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  roomId: { type: String, required: true },
  purpose: { type: String, enum: ['lecture', 'practical', 'exam', 'event', 'meeting', 'other'], required: true },
  courseOfferingId: { type: String },
  committeeId: { type: String },
  facultyId: { type: String },
  title: { type: String },
  dayOfWeek: { type: String },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isRecurring: { type: Boolean, default: false },
  recurrencePattern: { type: String },
  status: { type: String, enum: ['scheduled', 'cancelled', 'completed', 'ongoing'], required: true, default: 'scheduled' },
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

roomAllocationSchema.pre('save', function(next) {
  (this as IRoomAllocation).updatedAt = new Date().toISOString();
  next();
});

// Examination Schema
interface IExamination extends Omit<Examination, 'id'>, Document {
  _id: string;
}

const examinationTimeTableEntrySchema = new Schema({
  id: { type: String },
  examinationId: { type: String, required: true },
  courseId: { type: String, required: true },
  courseName: { type: String },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  roomId: { type: String },
  roomIds: [{ type: String }],
  invigilatorIds: [{ type: String }],
  notes: { type: String }
}, { _id: false });

const examinationSchema = new Schema<IExamination>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  name: { type: String, required: true },
  gtuExamCode: { type: String },
  academicYear: { type: String, required: true },
  examType: { type: String, enum: ['End Semester Theory', 'End Semester Practical/Viva', 'Mid Semester', 'Internal Continuous Evaluation', 'Other'], required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  programIds: [{ type: String, required: true }],
  status: { type: String, enum: ['scheduled', 'ongoing', 'completed', 'postponed', 'cancelled'], required: true, default: 'scheduled' },
  examinationTimeTable: [examinationTimeTableEntrySchema],
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

examinationSchema.pre('save', function(next) {
  (this as IExamination).updatedAt = new Date().toISOString();
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
  
  programId: { type: String, required: true }, // Reference to Program
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
  
  // LinkedIn-like Profile Sections
  profileSummary: { type: String },
  education: [{
    id: { type: String },
    institution: { type: String },
    degree: { type: String },
    fieldOfStudy: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    isCurrently: { type: Boolean, default: false },
    grade: { type: String },
    description: { type: String },
    activities: { type: String },
    location: { type: String },
    order: { type: Number, default: 0 }
  }],
  experience: [{
    id: { type: String },
    company: { type: String },
    position: { type: String },
    location: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    isCurrently: { type: Boolean, default: false },
    description: { type: String },
    responsibilities: [{ type: String }],
    achievements: [{ type: String }],
    skills: [{ type: String }],
    order: { type: Number, default: 0 }
  }],
  projects: [{
    id: { type: String },
    title: { type: String },
    description: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    isOngoing: { type: Boolean, default: false },
    technologies: [{ type: String }],
    role: { type: String },
    teamSize: { type: Number },
    projectUrl: { type: String },
    githubUrl: { type: String },
    images: [{ type: String }],
    achievements: [{ type: String }],
    order: { type: Number, default: 0 }
  }],
  skills: [{
    id: { type: String },
    name: { type: String },
    category: { type: String, enum: ['technical', 'soft', 'language', 'tool', 'other'], default: 'other' },
    proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' },
    endorsements: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
  }],
  achievements: [{
    id: { type: String },
    title: { type: String },
    description: { type: String },
    date: { type: String },
    category: { type: String, enum: ['academic', 'professional', 'competition', 'award', 'recognition', 'other'], default: 'other' },
    issuer: { type: String },
    certificateUrl: { type: String },
    order: { type: Number, default: 0 }
  }],
  certifications: [{
    id: { type: String },
    name: { type: String },
    issuer: { type: String },
    issueDate: { type: String },
    expiryDate: { type: String },
    date: { type: String },
    credentialId: { type: String },
    credentialUrl: { type: String },
    certificateUrl: { type: String },
    description: { type: String },
    skills: [{ type: String }],
    order: { type: Number, default: 0 }
  }],
  publications: [{
    id: { type: String },
    title: { type: String },
    type: { type: String, enum: ['journal', 'conference', 'book', 'chapter', 'article', 'thesis', 'other'], default: 'other' },
    authors: [{ type: String }],
    publicationDate: { type: String },
    date: { type: String },
    venue: { type: String },
    journal: { type: String },
    conference: { type: String },
    abstract: { type: String },
    description: { type: String },
    doi: { type: String },
    url: { type: String },
    order: { type: Number, default: 0 }
  }],
  languages: [{
    id: { type: String },
    name: { type: String },
    language: { type: String },
    proficiency: { type: String, enum: ['native', 'fluent', 'conversational', 'basic'], default: 'basic' },
    order: { type: Number, default: 0 }
  }],
  
  // Additional Professional Sections
  volunteerWork: [{
    id: { type: String },
    organization: { type: String },
    position: { type: String },
    role: { type: String },
    description: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    isCurrently: { type: Boolean, default: false },
    location: { type: String },
    skills: [{ type: String }],
    achievements: [{ type: String }],
    contactInfo: { type: String },
    order: { type: Number, default: 0 }
  }],
  professionalMemberships: [{
    id: { type: String },
    organization: { type: String },
    membershipType: { type: String },
    role: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    isCurrently: { type: Boolean, default: false },
    isLifetime: { type: Boolean, default: false },
    membershipId: { type: String },
    description: { type: String },
    benefits: [{ type: String }],
    order: { type: Number, default: 0 }
  }],
  awards: [{
    id: { type: String },
    title: { type: String },
    description: { type: String },
    date: { type: String },
    category: { type: String, enum: ['academic', 'professional', 'competition', 'award', 'recognition', 'other'], default: 'other' },
    issuer: { type: String },
    prize: { type: String },
    certificateUrl: { type: String },
    order: { type: Number, default: 0 }
  }],
  
  // Profile Settings
  profileVisibility: { type: String, enum: ['public', 'private', 'institute_only'], default: 'institute_only' },
  profileSettings: {
    showPersonalInfo: { type: Boolean, default: true },
    showContactInfo: { type: Boolean, default: true },
    showEducation: { type: Boolean, default: true },
    showExperience: { type: Boolean, default: true },
    showProjects: { type: Boolean, default: true },
    showSkills: { type: Boolean, default: true },
    showAchievements: { type: Boolean, default: true },
    showCertifications: { type: Boolean, default: true },
    showPublications: { type: Boolean, default: true },
    showLanguages: { type: Boolean, default: true },
    allowDownload: { type: Boolean, default: true },
    allowPrint: { type: Boolean, default: true },
    customUrl: { type: String }
  },
  
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
  this.updatedAt = new Date().toISOString();
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
  experienceYears: { type: String }, // Years of experience as string for compatibility
  
  // LinkedIn-like Profile Sections
  profileSummary: { type: String },
  education: [{
    id: { type: String },
    institution: { type: String },
    degree: { type: String },
    fieldOfStudy: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    isCurrently: { type: Boolean, default: false },
    grade: { type: String },
    description: { type: String },
    activities: { type: String },
    location: { type: String },
    order: { type: Number, default: 0 }
  }],
  experience: [{
    id: { type: String },
    company: { type: String },
    position: { type: String },
    location: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    isCurrently: { type: Boolean, default: false },
    description: { type: String },
    responsibilities: [{ type: String }],
    achievements: [{ type: String }],
    skills: [{ type: String }],
    order: { type: Number, default: 0 }
  }],
  projects: [{
    id: { type: String },
    title: { type: String },
    description: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    isOngoing: { type: Boolean, default: false },
    technologies: [{ type: String }],
    role: { type: String },
    teamSize: { type: Number },
    projectUrl: { type: String },
    githubUrl: { type: String },
    images: [{ type: String }],
    achievements: [{ type: String }],
    order: { type: Number, default: 0 }
  }],
  skills: [{
    id: { type: String },
    name: { type: String },
    category: { type: String, enum: ['technical', 'soft', 'language', 'tool', 'other'], default: 'other' },
    proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' },
    endorsements: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
  }],
  achievements: [{
    id: { type: String },
    title: { type: String },
    description: { type: String },
    date: { type: String },
    category: { type: String, enum: ['academic', 'professional', 'competition', 'award', 'recognition', 'other'], default: 'other' },
    issuer: { type: String },
    certificateUrl: { type: String },
    order: { type: Number, default: 0 }
  }],
  certifications: [{
    id: { type: String },
    name: { type: String },
    issuer: { type: String },
    issueDate: { type: String },
    expiryDate: { type: String },
    date: { type: String },
    credentialId: { type: String },
    credentialUrl: { type: String },
    certificateUrl: { type: String },
    description: { type: String },
    skills: [{ type: String }],
    order: { type: Number, default: 0 }
  }],
  awards: [{
    id: { type: String },
    title: { type: String },
    description: { type: String },
    date: { type: String },
    category: { type: String, enum: ['academic', 'professional', 'competition', 'award', 'recognition', 'other'], default: 'other' },
    issuer: { type: String },
    prize: { type: String },
    certificateUrl: { type: String },
    order: { type: Number, default: 0 }
  }],
  publications: [{
    id: { type: String },
    title: { type: String },
    type: { type: String, enum: ['journal', 'conference', 'book', 'chapter', 'article', 'thesis', 'other'], default: 'other' },
    authors: [{ type: String }],
    publicationDate: { type: String },
    date: { type: String },
    venue: { type: String },
    journal: { type: String },
    conference: { type: String },
    abstract: { type: String },
    description: { type: String },
    doi: { type: String },
    url: { type: String },
    order: { type: Number, default: 0 }
  }],
  languages: [{
    id: { type: String },
    name: { type: String },
    language: { type: String },
    proficiency: { type: String, enum: ['native', 'fluent', 'conversational', 'basic'], default: 'basic' },
    order: { type: Number, default: 0 }
  }],
  
  dateOfBirth: { type: String },
  joiningDate: { type: String },
  
  // Additional fields for compatibility
  gtuFacultyId: { type: String },
  fullName: { type: String },
  address: { type: String },
  isHOD: { type: Boolean, default: false },
  isPrincipal: { type: Boolean, default: false },
  researchInterests: [{ type: String }], // Array of strings to match TypeScript interface
  subjects: [{ type: String }], // Array of subjects taught by the faculty
  
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  maritalStatus: { type: String },
  aadharNumber: { type: String },
  panCardNumber: { type: String },
  gpfNpsNumber: { type: String },
  placeOfBirth: { type: String },
  nationality: { type: String },
  knownAs: { type: String },
  
  // Profile Settings
  profileVisibility: { type: String, enum: ['public', 'private', 'institute_only'], default: 'institute_only' },
  
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'retired', 'resigned', 'on_leave'],
    required: true,
    default: 'active'
  },
  
  instituteId: { type: String },
  photoURL: { type: String },
  
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
  (this as any).updatedAt = new Date().toISOString();
  next();
});

// FacultyPreference Schema
interface IFacultyPreference extends Omit<FacultyPreference, 'id'>, Document {
  _id: string;
}

const coursePreferenceSchema = new Schema({
  courseId: { type: String, required: true },
  preference: { type: String, enum: ['high', 'medium', 'low'], required: true },
  expertise: { type: Number, required: true, min: 1, max: 10 },
  previouslyTaught: { type: Boolean, required: true, default: false },
  maxSections: { type: Number, min: 1 }
}, { _id: false });

const timePreferenceSchema = new Schema({
  dayOfWeek: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  preference: { type: String, enum: ['preferred', 'available', 'avoid'], required: true }
}, { _id: false });

const timeSlotSchema = new Schema({
  dayOfWeek: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
}, { _id: false });

const facultyPreferenceSchema = new Schema<IFacultyPreference>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  facultyId: { type: String, required: true },
  academicYear: { type: String, required: true },
  semester: { type: Number, required: true, min: 1, max: 6 },
  preferredCourses: [coursePreferenceSchema],
  timePreferences: [timePreferenceSchema],
  roomPreferences: [{ type: String }], // Room IDs
  maxHoursPerWeek: { type: Number, required: true, default: 18, min: 1, max: 50 },
  maxConsecutiveHours: { type: Number, required: true, default: 4, min: 1, max: 8 },
  unavailableSlots: [timeSlotSchema],
  workingDays: [{ 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true 
  }],
  priority: { type: Number, required: true, default: 5, min: 1, max: 10 }, // Based on seniority, 1-10
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

// Add compound index for uniqueness (one preference per faculty per academic term and semester)
facultyPreferenceSchema.index({ facultyId: 1, academicYear: 1, semester: 1 }, { unique: true });

facultyPreferenceSchema.pre('save', function(next) {
  (this as IFacultyPreference).updatedAt = new Date().toISOString();
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

// Enrollment Schema
interface IEnrollment extends Omit<Enrollment, 'id'>, Document {
  _id: string;
}

const enrollmentSchema = new Schema<IEnrollment>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  
  studentId: { type: String, required: true },
  courseOfferingId: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['requested', 'enrolled', 'withdrawn', 'completed', 'failed', 'incomplete', 'rejected'], 
    required: true 
  },
  internalMarks: { type: Number },
  externalMarks: { type: Number },
  grade: { type: String },
  attendancePercentage: { type: Number },
  enrolledAt: { type: String },
  completedAt: { type: String },
  
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

enrollmentSchema.pre('save', function(next) {
  (this as IEnrollment).updatedAt = new Date().toISOString();
  next();
});

// CourseOffering Schema
interface ICourseOffering extends Omit<CourseOffering, 'id'>, Document {
  _id: string;
}

const courseOfferingSchema = new Schema<ICourseOffering>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  courseId: { type: String, required: true },
  academicTermId: { type: String, required: true }, // New primary field
  facultyIds: [{ type: String }],
  roomIds: [{ type: String }],
  status: { 
    type: String, 
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], 
    required: true, 
    default: 'scheduled' 
  },
  currentEnrollments: { type: Number, default: 0 },
  description: { type: String },
  
  // Legacy fields for backward compatibility (optional)
  batchId: { type: String },
  academicYear: { type: String },
  semester: { type: Number },
  startDate: { type: String },
  endDate: { type: String },
  programId: { type: String },
  maxEnrollments: { type: Number },
  
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

courseOfferingSchema.pre('save', function(next) {
  (this as unknown as ICourseOffering).updatedAt = new Date().toISOString();
  next();
});

// Notification Schema
interface INotification extends Omit<Notification, 'id'>, Document {
  _id: string;
}

const notificationSchema = new Schema<INotification>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  userId: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error', 'update', 'reminder', 'assignment_new', 'assignment_graded', 'enrollment_request', 'enrollment_approved', 'enrollment_rejected'], 
    required: true 
  },
  isRead: { type: Boolean, required: true, default: false },
  link: { type: String },
  relatedEntityId: { type: String },
  relatedEntityType: { type: String },
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

notificationSchema.pre('save', function(next) {
  (this as INotification).updatedAt = new Date().toISOString();
  next();
});

// StudentAssessmentScore Schema
interface IStudentAssessmentScore extends Omit<StudentAssessmentScore, 'id'>, Document {
  _id: string;
}

const studentAssessmentScoreSchema = new Schema<IStudentAssessmentScore>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  studentId: { type: String, required: true },
  assessmentId: { type: String, required: true },
  score: { type: Number },
  grade: { type: String },
  remarks: { type: String },
  submissionDate: { type: String },
  files: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number }
  }],
  comments: { type: String },
  evaluatedBy: { type: String },
  evaluatedAt: { type: String },
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

studentAssessmentScoreSchema.pre('save', function(next) {
  (this as IStudentAssessmentScore).updatedAt = new Date().toISOString();
  next();
});

// CourseMaterial Schema
interface ICourseMaterial extends Omit<CourseMaterial, 'id'>, Document {
  _id: string;
}

const courseMaterialSchema = new Schema<ICourseMaterial>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  courseOfferingId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  fileType: { 
    type: String, 
    enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'zip', 'link', 'video', 'image', 'other'],
    required: true 
  },
  filePathOrUrl: { type: String, required: true },
  fileName: { type: String },
  fileSize: { type: Number },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: String, required: true },
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

courseMaterialSchema.pre('save', function(next) {
  (this as ICourseMaterial).updatedAt = new Date().toISOString();
  next();
});

// AttendanceRecord Schema
interface IAttendanceRecord extends Omit<AttendanceRecord, 'id'>, Document {
  _id: string;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>({
  id: { type: String, unique: true, sparse: true }, // Custom ID field
  studentId: { type: String, required: true },
  courseOfferingId: { type: String, required: true },
  date: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late', 'excused'],
    required: true 
  },
  markedBy: { type: String, required: true },
  remarks: { type: String },
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

attendanceRecordSchema.pre('save', function(next) {
  (this as IAttendanceRecord).updatedAt = new Date().toISOString();
  next();
});

// Timetable Schema
interface ITimetable extends Omit<Timetable, 'id'>, Document {
  _id: string;
}

const timetableEntrySchema = new Schema({
  dayOfWeek: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  courseOfferingId: { type: String },
  courseId: { type: String, required: true },
  courseName: { type: String },
  facultyId: { type: String, required: true },
  roomId: { type: String, required: true },
  entryType: { 
    type: String, 
    enum: ['lecture', 'lab', 'tutorial', 'break', 'other'], 
    required: true 
  },
  notes: { type: String }
}, { _id: false });

const timetableSchema = new Schema<ITimetable>({
  id: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  academicYear: { type: String, required: true },
  semester: { type: Number, required: true },
  programId: { type: String, required: true },
  batchId: { type: String },
  version: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    required: true 
  },
  effectiveDate: { type: String, required: true },
  entries: [timetableEntrySchema],
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

timetableSchema.pre('save', function(next) {
  (this as ITimetable).updatedAt = new Date().toISOString();
  next();
});

// ProjectLocation Schema
interface IProjectLocation extends Omit<ProjectLocation, 'id'>, Document {
  _id: string;
}

const projectLocationSchema = new Schema<IProjectLocation>({
  id: { type: String, unique: true, sparse: true },
  locationId: { type: String, required: true },
  section: { type: String, required: true },
  position: { type: Number, required: true },
  department: { type: String },
  eventId: { type: String, required: true },
  projectId: { type: String },
  isAssigned: { type: Boolean, required: true, default: false },
  notes: { type: String },
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

projectLocationSchema.pre('save', function(next) {
  (this as IProjectLocation).updatedAt = new Date().toISOString();
  next();
});

// FeedbackAnalysis Schema
interface IFeedbackAnalysis extends Document {
  _id: string;
  id: string;
  originalFileName: string;
  analysisDate: string;
  subject_scores: Array<{
    Subject_Code: string;
    Subject_FullName: string;
    Faculty_Name: string;
    Faculty_Initial?: string;
    Subject_ShortForm?: string;
    Q1: number;
    Q2: number;
    Q3: number;
    Q4: number;
    Q5: number;
    Q6: number;
    Q7: number;
    Q8: number;
    Q9: number;
    Q10: number;
    Q11: number;
    Q12: number;
    Score: number;
  }>;
  faculty_scores: Array<{
    Faculty_Name: string;
    Faculty_Initial: string;
    Q1: number;
    Q2: number;
    Q3: number;
    Q4: number;
    Q5: number;
    Q6: number;
    Q7: number;
    Q8: number;
    Q9: number;
    Q10: number;
    Q11: number;
    Q12: number;
    Score: number;
  }>;
  semester_scores: Array<{
    Year: string;
    Term: string;
    Branch: string;
    Sem: string;
    Q1: number;
    Q2: number;
    Q3: number;
    Q4: number;
    Q5: number;
    Q6: number;
    Q7: number;
    Q8: number;
    Q9: number;
    Q10: number;
    Q11: number;
    Q12: number;
    Score: number;
  }>;
  branch_scores: Array<{
    Branch: string;
    Q1: number;
    Q2: number;
    Q3: number;
    Q4: number;
    Q5: number;
    Q6: number;
    Q7: number;
    Q8: number;
    Q9: number;
    Q10: number;
    Q11: number;
    Q12: number;
    Score: number;
  }>;
  term_year_scores: Array<{
    Year: string;
    Term: string;
    Q1: number;
    Q2: number;
    Q3: number;
    Q4: number;
    Q5: number;
    Q6: number;
    Q7: number;
    Q8: number;
    Q9: number;
    Q10: number;
    Q11: number;
    Q12: number;
    Score: number;
  }>;
  correlation_matrix?: { [key: string]: { [key: string]: number } };
  markdownReport: string;
  rawFeedbackData?: string;
}

const feedbackAnalysisSchema = new Schema<IFeedbackAnalysis>({
  id: { type: String, required: true, unique: true },
  originalFileName: { type: String, required: true },
  analysisDate: { type: String, required: true },
  subject_scores: [{
    Subject_Code: { type: String, required: true },
    Subject_FullName: { type: String, required: true },
    Faculty_Name: { type: String, required: true },
    Faculty_Initial: { type: String },
    Subject_ShortForm: { type: String },
    Q1: { type: Number, required: true },
    Q2: { type: Number, required: true },
    Q3: { type: Number, required: true },
    Q4: { type: Number, required: true },
    Q5: { type: Number, required: true },
    Q6: { type: Number, required: true },
    Q7: { type: Number, required: true },
    Q8: { type: Number, required: true },
    Q9: { type: Number, required: true },
    Q10: { type: Number, required: true },
    Q11: { type: Number, required: true },
    Q12: { type: Number, required: true },
    Score: { type: Number, required: true }
  }],
  faculty_scores: [{
    Faculty_Name: { type: String, required: true },
    Faculty_Initial: { type: String, required: true },
    Q1: { type: Number, required: true },
    Q2: { type: Number, required: true },
    Q3: { type: Number, required: true },
    Q4: { type: Number, required: true },
    Q5: { type: Number, required: true },
    Q6: { type: Number, required: true },
    Q7: { type: Number, required: true },
    Q8: { type: Number, required: true },
    Q9: { type: Number, required: true },
    Q10: { type: Number, required: true },
    Q11: { type: Number, required: true },
    Q12: { type: Number, required: true },
    Score: { type: Number, required: true }
  }],
  semester_scores: [{
    Year: { type: String, required: true },
    Term: { type: String, required: true },
    Branch: { type: String, required: true },
    Sem: { type: String, required: true },
    Q1: { type: Number, required: true },
    Q2: { type: Number, required: true },
    Q3: { type: Number, required: true },
    Q4: { type: Number, required: true },
    Q5: { type: Number, required: true },
    Q6: { type: Number, required: true },
    Q7: { type: Number, required: true },
    Q8: { type: Number, required: true },
    Q9: { type: Number, required: true },
    Q10: { type: Number, required: true },
    Q11: { type: Number, required: true },
    Q12: { type: Number, required: true },
    Score: { type: Number, required: true }
  }],
  branch_scores: [{
    Branch: { type: String, required: true },
    Q1: { type: Number, required: true },
    Q2: { type: Number, required: true },
    Q3: { type: Number, required: true },
    Q4: { type: Number, required: true },
    Q5: { type: Number, required: true },
    Q6: { type: Number, required: true },
    Q7: { type: Number, required: true },
    Q8: { type: Number, required: true },
    Q9: { type: Number, required: true },
    Q10: { type: Number, required: true },
    Q11: { type: Number, required: true },
    Q12: { type: Number, required: true },
    Score: { type: Number, required: true }
  }],
  term_year_scores: [{
    Year: { type: String, required: true },
    Term: { type: String, required: true },
    Q1: { type: Number, required: true },
    Q2: { type: Number, required: true },
    Q3: { type: Number, required: true },
    Q4: { type: Number, required: true },
    Q5: { type: Number, required: true },
    Q6: { type: Number, required: true },
    Q7: { type: Number, required: true },
    Q8: { type: Number, required: true },
    Q9: { type: Number, required: true },
    Q10: { type: Number, required: true },
    Q11: { type: Number, required: true },
    Q12: { type: Number, required: true },
    Score: { type: Number, required: true }
  }],
  correlation_matrix: { type: Schema.Types.Mixed },
  markdownReport: { type: String, required: true },
  rawFeedbackData: { type: String }
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

// Models
export const InstituteModel = mongoose.models.Institute || mongoose.model<IInstitute>('Institute', instituteSchema);
export const BuildingModel = mongoose.models.Building || mongoose.model<IBuilding>('Building', buildingSchema);
export const RoomModel = mongoose.models.Room || mongoose.model<IRoom>('Room', roomSchema);
export const CommitteeModel = mongoose.models.Committee || mongoose.model<ICommittee>('Committee', committeeSchema);
export const AcademicTermModel = mongoose.models.AcademicTerm || mongoose.model<IAcademicTerm>('AcademicTerm', academicTermSchema, 'academicterms');
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const RoleModel = mongoose.models.Role || mongoose.model<IRole>('Role', roleSchema);
export const PermissionModel = mongoose.models.Permission || mongoose.model<IPermission>('Permission', permissionSchema);
export const DepartmentModel = mongoose.models.Department || mongoose.model<IDepartment>('Department', departmentSchema);
export const CourseModel = mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);
export const BatchModel = mongoose.models.Batch || mongoose.model<IBatch>('Batch', batchSchema);
export const ProgramModel = mongoose.models.Program || mongoose.model<IProgram>('Program', programSchema);
export const CurriculumModel = mongoose.models.Curriculum || mongoose.model<ICurriculum>('Curriculum', curriculumSchema, 'curriculums');
export const RoomAllocationModel = mongoose.models.RoomAllocation || mongoose.model<IRoomAllocation>('RoomAllocation', roomAllocationSchema, 'roomallocations');
export const ExaminationModel = mongoose.models.Examination || mongoose.model<IExamination>('Examination', examinationSchema, 'examinations');
export const StudentModel = mongoose.models.Student || mongoose.model<IStudent>('Student', studentSchema);
export const FacultyModel = mongoose.models.Faculty || mongoose.model<IFaculty>('Faculty', facultySchema, 'faculties');
export const ProjectTeamModel = mongoose.models.ProjectTeam || mongoose.model<IProjectTeam>('ProjectTeam', projectTeamSchema, 'projectteams');
export const ProjectEventModel = mongoose.models.ProjectEvent || mongoose.model<IProjectEvent>('ProjectEvent', projectEventSchema, 'projectevents');
export const ProjectModel = mongoose.models.Project || mongoose.model<IProject>('Project', projectSchema, 'projects');
export const AssessmentModel = mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', assessmentSchema, 'assessments');
export const ResultModel = mongoose.models.Result || mongoose.model<IResult>('Result', resultSchema, 'results');
export const EnrollmentModel = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', enrollmentSchema, 'enrollments');
export const CourseOfferingModel = mongoose.models.CourseOffering || mongoose.model<ICourseOffering>('CourseOffering', courseOfferingSchema, 'courseofferings');
export const NotificationModel = mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema, 'notifications');
export const StudentAssessmentScoreModel = mongoose.models.StudentAssessmentScore || mongoose.model<IStudentAssessmentScore>('StudentAssessmentScore', studentAssessmentScoreSchema, 'studentassessmentscores');
export const CourseMaterialModel = mongoose.models.CourseMaterial || mongoose.model<ICourseMaterial>('CourseMaterial', courseMaterialSchema, 'coursematerials');
export const AttendanceRecordModel = mongoose.models.AttendanceRecord || mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceRecordSchema, 'attendancerecords');
export const TimetableModel = mongoose.models.Timetable || mongoose.model<ITimetable>('Timetable', timetableSchema, 'timetables');
export const ProjectLocationModel = mongoose.models.ProjectLocation || mongoose.model<IProjectLocation>('ProjectLocation', projectLocationSchema, 'projectlocations');
export const FeedbackAnalysisModel = mongoose.models.FeedbackAnalysis || mongoose.model<IFeedbackAnalysis>('FeedbackAnalysis', feedbackAnalysisSchema, 'feedbackanalyses');
export const FacultyPreferenceModel = mongoose.models.FacultyPreference || mongoose.model<IFacultyPreference>('FacultyPreference', facultyPreferenceSchema, 'facultypreferences');

// ===============================
// ALLOCATION MODELS (Phase 2)
// ===============================

interface IAllocationSession extends Document {
  id: string;
  name: string;
  academicYear: string;
  semesters: number[];
  targetPrograms: string[]; // Program IDs for ECE/ICT
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  createdBy: string; // User ID
  allocationMethod: 'preference_based' | 'manual' | 'hybrid';
  
  // Algorithm parameters
  algorithmSettings: {
    prioritizeSeniority: boolean;
    expertiseWeightage: number; // 0-1
    preferencePriorityWeightage: number; // 0-1
    workloadBalanceWeightage: number; // 0-1
    minimizeConflicts: boolean;
  };
  
  // Statistics
  statistics: {
    totalCourses: number;
    totalFaculty: number;
    allocatedCourses: number;
    unallocatedCourses: number;
    facultyWithFullLoad: number;
    conflictsDetected: number;
    averageSatisfactionScore: number;
  };
  
  // Session metadata
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

interface ICourseAllocation extends Document {
  id: string;
  sessionId: string; // Reference to AllocationSession
  courseOfferingId: string; // Reference to CourseOffering
  facultyId: string; // Assigned faculty
  
  // Assignment details
  assignmentType: 'theory' | 'lab' | 'tutorial' | 'project';
  hoursPerWeek: number;
  
  // Assignment metadata
  allocationScore: number; // Algorithm-calculated score (0-100)
  preferenceMatch: 'high' | 'medium' | 'low' | 'none'; // How well it matches faculty preference
  expertiseLevel: number; // Faculty expertise for this course (1-10)
  conflictLevel: 'none' | 'minor' | 'major'; // Conflict assessment
  
  // Manual adjustments
  isManualAssignment: boolean;
  originalFacultyId?: string; // If manually reassigned
  reassignmentReason?: string;
  
  // Approval workflow
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  reviewedBy?: string; // HOD or admin user ID
  reviewedAt?: string;
  reviewComments?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

interface IAllocationConflict extends Document {
  id: string;
  sessionId: string;
  conflictType: 
    | 'time_overlap' 
    | 'overload' 
    | 'underload' 
    | 'expertise_mismatch' 
    | 'preference_violation'
    | 'department_mismatch'
    | 'room_conflict'
    | 'consecutive_hours_violation'
    | 'unavailable_time_slot'
    | 'prerequisite_conflict'
    | 'capacity_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Conflict details
  facultyId?: string;
  courseOfferingIds: string[];
  description: string;
  
  // Resolution
  status: 'unresolved' | 'resolved' | 'ignored' | 'in_progress';
  resolutionSuggestions?: string[];
  recommendedAction?: 'reassign' | 'adjust_hours' | 'change_time' | 'add_faculty' | 'manual_review';
  autoResolvable: boolean;
  priority: number; // 1-10, higher = more urgent
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  alternativeSolutions?: {
    action: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    feasibility: 'easy' | 'moderate' | 'difficult';
  }[];
  
  createdAt: string;
  updatedAt: string;
}

// Allocation Session Schema
const allocationSessionSchema = new Schema<IAllocationSession>({
  id: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  academicYear: { type: String, required: true },
  semesters: [{ type: Number, required: true, min: 1, max: 6 }],
  targetPrograms: [{ type: String, required: true }],
  status: { 
    type: String, 
    enum: ['draft', 'in_progress', 'completed', 'archived'],
    default: 'draft'
  },
  createdBy: { type: String, required: true },
  allocationMethod: {
    type: String,
    enum: ['preference_based', 'manual', 'hybrid'],
    default: 'preference_based'
  },
  
  algorithmSettings: {
    prioritizeSeniority: { type: Boolean, default: true },
    expertiseWeightage: { type: Number, default: 0.4, min: 0, max: 1 },
    preferencePriorityWeightage: { type: Number, default: 0.3, min: 0, max: 1 },
    workloadBalanceWeightage: { type: Number, default: 0.2, min: 0, max: 1 },
    minimizeConflicts: { type: Boolean, default: true }
  },
  
  statistics: {
    totalCourses: { type: Number, default: 0 },
    totalFaculty: { type: Number, default: 0 },
    allocatedCourses: { type: Number, default: 0 },
    unallocatedCourses: { type: Number, default: 0 },
    facultyWithFullLoad: { type: Number, default: 0 },
    conflictsDetected: { type: Number, default: 0 },
    averageSatisfactionScore: { type: Number, default: 0 }
  },
  
  startedAt: { type: String },
  completedAt: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  notes: { type: String }
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

// Course Allocation Schema
const courseAllocationSchema = new Schema<ICourseAllocation>({
  id: { type: String, unique: true, sparse: true },
  sessionId: { type: String, required: true },
  courseOfferingId: { type: String, required: true },
  facultyId: { type: String, required: true },
  
  assignmentType: {
    type: String,
    enum: ['theory', 'lab', 'tutorial', 'project'],
    default: 'theory'
  },
  hoursPerWeek: { type: Number, required: true, min: 1, max: 20 },
  
  allocationScore: { type: Number, default: 0, min: 0, max: 100 },
  preferenceMatch: {
    type: String,
    enum: ['high', 'medium', 'low', 'none'],
    default: 'none'
  },
  expertiseLevel: { type: Number, default: 5, min: 1, max: 10 },
  conflictLevel: {
    type: String,
    enum: ['none', 'minor', 'major'],
    default: 'none'
  },
  
  isManualAssignment: { type: Boolean, default: false },
  originalFacultyId: { type: String },
  reassignmentReason: { type: String },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_review'],
    default: 'pending'
  },
  reviewedBy: { type: String },
  reviewedAt: { type: String },
  reviewComments: { type: String },
  
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
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

// Allocation Conflict Schema
const allocationConflictSchema = new Schema<IAllocationConflict>({
  id: { type: String, unique: true, sparse: true },
  sessionId: { type: String, required: true },
  conflictType: {
    type: String,
    enum: [
      'time_overlap', 
      'overload', 
      'underload', 
      'expertise_mismatch', 
      'preference_violation',
      'department_mismatch',
      'room_conflict',
      'consecutive_hours_violation',
      'unavailable_time_slot',
      'prerequisite_conflict',
      'capacity_exceeded'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  facultyId: { type: String },
  courseOfferingIds: [{ type: String, required: true }],
  description: { type: String, required: true },
  
  status: {
    type: String,
    enum: ['unresolved', 'resolved', 'ignored', 'in_progress'],
    default: 'unresolved'
  },
  resolutionSuggestions: [{ type: String }],
  recommendedAction: {
    type: String,
    enum: ['reassign', 'adjust_hours', 'change_time', 'add_faculty', 'manual_review']
  },
  autoResolvable: { type: Boolean, default: false },
  priority: { type: Number, min: 1, max: 10, default: 5 },
  resolvedBy: { type: String },
  resolvedAt: { type: String },
  resolutionNotes: { type: String },
  alternativeSolutions: [{
    action: { type: String, required: true },
    description: { type: String, required: true },
    impact: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      required: true 
    },
    feasibility: { 
      type: String, 
      enum: ['easy', 'moderate', 'difficult'],
      required: true 
    }
  }],
  
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
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

// Indexes for better performance
allocationSessionSchema.index({ academicYear: 1, status: 1 });
allocationSessionSchema.index({ createdBy: 1 });

courseAllocationSchema.index({ sessionId: 1 });
courseAllocationSchema.index({ facultyId: 1 });
courseAllocationSchema.index({ courseOfferingId: 1 });
courseAllocationSchema.index({ status: 1 });

allocationConflictSchema.index({ sessionId: 1 });
allocationConflictSchema.index({ status: 1, severity: 1 });

// Allocation Models
export const AllocationSessionModel = mongoose.models.AllocationSession || mongoose.model<IAllocationSession>('AllocationSession', allocationSessionSchema, 'allocationsessions');
export const CourseAllocationModel = mongoose.models.CourseAllocation || mongoose.model<ICourseAllocation>('CourseAllocation', courseAllocationSchema, 'courseallocations');
export const AllocationConflictModel = mongoose.models.AllocationConflict || mongoose.model<IAllocationConflict>('AllocationConflict', allocationConflictSchema, 'allocationconflicts');

// Export types
export type { IInstitute, IBuilding, IRoom, ICommittee, IAcademicTerm, IUser, IRole, IPermission, IDepartment, ICourse, IBatch, IProgram, ICurriculum, IRoomAllocation, IExamination, IStudent, IFaculty, IProjectTeam, IProjectEvent, IProject, IAssessment, IResult, IEnrollment, ICourseOffering, INotification, IStudentAssessmentScore, ICourseMaterial, IAttendanceRecord, ITimetable, IProjectLocation, IFeedbackAnalysis, IFacultyPreference, IAllocationSession, ICourseAllocation, IAllocationConflict };
