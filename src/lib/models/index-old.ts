import mongoose, { Schema, Document } from 'mongoose';
import type { 
  User, Role, Permission, Department, Course, Batch, Program
} from '@/types/entities';

// User Schema
interface IUser extends Omit<User, 'id'>, Document {
}

const userSchema = new Schema<IUser>({
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
  password: { type: String, select: false } // Don't return password by default
}, {
  timestamps: false, // We handle timestamps manually with ISO strings
  toJSON: {
    transform: function(doc, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Role Schema
interface IRole extends Omit<Role, 'id'>, Document {
}

const roleSchema = new Schema<IRole>({
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
    transform: function(doc, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Permission Schema
interface IPermission extends Omit<Permission, 'id'>, Document {
}

const permissionSchema = new Schema<IPermission>({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  resource: { type: String, required: true },
  action: { type: String, required: true },
  conditions: { type: Schema.Types.Mixed }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Department Schema
interface IDepartment extends Omit<Department, 'id'>, Document {
}

const departmentSchema = new Schema<IDepartment>({
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
    transform: function(doc, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Course Schema
interface ICourse extends Omit<Course, 'id'>, Document {
}

const courseSchema = new Schema<ICourse>({
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
    transform: function(doc, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Batch Schema
interface IBatch extends Omit<Batch, 'id'>, Document {
}

const batchSchema = new Schema<IBatch>({
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
    transform: function(doc, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Program Schema
interface IProgram extends Omit<Program, 'id'>, Document {
}

const programSchema = new Schema<IProgram>({
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
    transform: function(doc, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Update timestamps middleware
userSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

roleSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

departmentSchema.pre('save', function(this: IDepartment, next) {
  this.updatedAt = new Date().toISOString();
  next();
});

courseSchema.pre('save', function(this: ICourse, next) {
  this.updatedAt = new Date().toISOString();
  next();
});

batchSchema.pre('save', function(this: IBatch, next) {
  this.updatedAt = new Date().toISOString();
  next();
});

programSchema.pre('save', function(this: IProgram, next) {
  this.updatedAt = new Date().toISOString();
  next();
});

// Models
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const RoleModel = mongoose.models.Role || mongoose.model<IRole>('Role', roleSchema);
export const PermissionModel = mongoose.models.Permission || mongoose.model<IPermission>('Permission', permissionSchema);
export const DepartmentModel = mongoose.models.Department || mongoose.model<IDepartment>('Department', departmentSchema);
export const CourseModel = mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);
export const BatchModel = mongoose.models.Batch || mongoose.model<IBatch>('Batch', batchSchema);
export const ProgramModel = mongoose.models.Program || mongoose.model<IProgram>('Program', programSchema);

// Export types
export type { IUser, IRole, IPermission, IDepartment, ICourse, IBatch, IProgram };
