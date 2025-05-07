
export interface Institute {
  id: string;
  name: string;
  code: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  status: 'active' | 'inactive';
  establishmentYear?: number;
  domain?: string; // For generating institute-specific emails e.g. gppalanpur.in
  administrators?: string[]; // User IDs of Institute Admins
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Department {
  id:string;
  name: string;
  code: string;
  description?: string;
  hodId?: string; // User ID
  establishmentYear?: number;
  status: 'active' | 'inactive';
  instituteId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  description?: string;
  departmentId: string; // Links to Department
  instituteId: string; // Links to Institute (derived from department or direct)
  degreeType?: 'Diploma' | 'Bachelor' | 'Master' | 'PhD' | 'Certificate';
  durationYears?: number;
  totalSemesters?: number;
  totalCredits?: number;
  status: 'active' | 'inactive';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Course {
  id: string;
  subcode: string; 
  branchCode?: string; 
  effFrom?: string; 
  subjectName: string;
  category?: string; 
  semester: number; 
  lectureHours: number; 
  tutorialHours: number; 
  practicalHours: number; 
  credits: number; 
  theoryEseMarks: number; 
  theoryPaMarks: number; 
  practicalEseMarks: number; 
  practicalPaMarks: number; 
  totalMarks: number; 
  isElective: boolean;
  isTheory: boolean;
  theoryExamDuration?: string; 
  isPractical: boolean;
  practicalExamDuration?: string;
  isFunctional: boolean;
  isSemiPractical?: boolean; 
  remarks?: string;
  departmentId: string; 
  programId: string; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Building {
  id: string;
  name: string;
  code?: string;
  description?: string;
  instituteId: string;
  status: 'active' | 'inactive' | 'under_maintenance';
  constructionYear?: number;
  numberOfFloors?: number;
  totalAreaSqFt?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type RoomType = 'Lecture Hall' | 'Laboratory' | 'Office' | 'Staff Room' | 'Workshop' | 'Library' | 'Store Room' | 'Other';
export type RoomStatus = 'available' | 'occupied' | 'under_maintenance' | 'unavailable';

export interface Room {
  id: string;
  roomNumber: string; 
  name?: string; 
  buildingId: string;
  floor?: number;
  type: RoomType;
  capacity?: number;
  areaSqFt?: number;
  status: RoomStatus;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type UserRole = 
  | 'admin' 
  | 'student' 
  | 'faculty' 
  | 'hod' 
  | 'jury' 
  | 'unknown' 
  | 'super_admin' 
  | 'dte_admin' 
  | 'gtu_admin' 
  | 'institute_admin' 
  | 'department_admin' 
  | 'committee_admin'
  | 'committee_convener' // New role
  | 'committee_co_convener' // New role
  | 'committee_member' // New role
  | 'lab_assistant' 
  | 'clerical_staff';

export interface User {
  id: string;
  email: string; 
  username?: string; 
  displayName: string; 
  photoURL?: string;
  phoneNumber?: string;
  
  authProviders: ('password' | 'google' | 'microsoft')[];
  
  createdAt: string; 
  updatedAt: string; 
  lastLoginAt?: string; 
  isActive: boolean; 
  isEmailVerified: boolean;
  
  roles: UserRole[]; 
  
  preferences: {
      theme?: 'light' | 'dark' | 'system';
      language?: string;
      notifications?: {
          email?: boolean;
          push?: boolean;
          sms?: boolean;
      };
      dashboard?: {
          layout?: string;
          favorites?: string[];
      };
  };

  instituteId?: string; 
  instituteEmail?: string; 
  password?: string; 
  fullName?: string; // GTU Format Name
}

// Renamed original User to SystemUser to avoid conflict with User from next-auth if used later
export type SystemUser = User;


export interface Role {
  id: string;
  name: string; 
  description: string;
  permissions: string[]; 
  code?: string; // Should map to UserRole values if we want to enforce consistency
  isSystemRole?: boolean; 
  createdAt?: string; 
  updatedAt?: string; 
}


export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'dropped';
export type SemesterStatus = 'Passed' | 'Pending' | 'Not Appeared' | 'N/A';

export interface Student {
  id: string; 
  enrollmentNumber: string;
  gtuName?: string; 
  firstName?: string;
  middleName?: string;
  lastName?: string;
  
  personalEmail?: string;
  instituteEmail: string; 
  
  programId: string; 
  department: string; // This is departmentId, derived from program
  branchCode?: string; 
  currentSemester: number;
  status: StudentStatus;
  
  contactNumber?: string;
  address?: string; 
  dateOfBirth?: string; 
  admissionDate?: string; 
  gender?: 'Male' | 'Female' | 'Other';
  convocationYear?: number;
  
  sem1Status?: SemesterStatus;
  sem2Status?: SemesterStatus;
  sem3Status?: SemesterStatus;
  sem4Status?: SemesterStatus;
  sem5Status?: SemesterStatus;
  sem6Status?: SemesterStatus;
  sem7Status?: SemesterStatus;
  sem8Status?: SemesterStatus;
  
  category?: string; 
  isComplete?: boolean; 
  termClose?: boolean; 
  isCancel?: boolean; 
  isPassAll?: boolean; 
  aadharNumber?: string;
  shift?: 'Morning' | 'Afternoon' | string; 
  
  userId?: string; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}


export type FacultyStatus = 'active' | 'inactive' | 'retired' | 'resigned' | 'on_leave';
export type JobType = 'Regular' | 'Adhoc' | 'Contractual' | 'Visiting' | 'Other';
export type Gender = 'Male' | 'Female' | 'Other'; // Re-defined Gender for consistency

export interface Faculty {
  id: string;
  staffCode: string; 
  gtuName?: string; 
  
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  
  personalEmail?: string;
  instituteEmail: string; 
  
  contactNumber?: string;
  department: string; 
  designation?: string;
  jobType?: JobType;
  instType?: string; 
  
  dateOfBirth?: string; 
  gender?: Gender; 
  maritalStatus?: string;
  joiningDate?: string; 
  
  status: FacultyStatus;
  
  qualifications?: string; 
  specializations?: string[];
  
  aadharNumber?: string;
  panCardNumber?: string;
  gpfNpsNumber?: string; 
  placeOfBirth?: string;
  nationality?: string;
  knownAs?: string; 
  
  userId?: string; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}


export type CommitteeStatus = 'active' | 'inactive' | 'dissolved';
export type CommitteeMemberRole = 'convener' | 'co_convener' | 'member';

export interface Committee {
  id: string;
  name: string;
  description?: string;
  purpose: string;
  instituteId: string; 
  formationDate: string; // ISO string YYYY-MM-DD
  dissolutionDate?: string; // ISO string YYYY-MM-DD
  status: CommitteeStatus;
  convenerId?: string; // User ID of the convener
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CommitteeMember {
  id: string;
  committeeId: string;
  userId: string; // Link to User
  role: CommitteeMemberRole;
  assignmentDate: string; // ISO string YYYY-MM-DD
  endDate?: string; // ISO string YYYY-MM-DD
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}


// Timestamp placeholder type
export type Timestamp = string; // For ISO date strings, or use Firebase's Timestamp type if integrating
