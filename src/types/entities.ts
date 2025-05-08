
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
  departmentId: string; 
  instituteId: string; 
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

// UserRole should represent the role CODE
export type UserRole = string;

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
  
  roles: UserRole[]; // Stores role CODES
  
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
  firstName?: string;
  middleName?: string;
  lastName?: string;
}

export type SystemUser = User;


export interface Role {
  id: string;
  name: string; // Display name, e.g., "CWAN Convener", "Administrator"
  code: string; // Unique machine-readable identifier, e.g., "cwan_convener", "admin"
  description: string;
  permissions: string[]; 
  isSystemRole?: boolean; 
  isCommitteeRole?: boolean; 
  committeeId?: string; 
  committeeCode?: string; // Store committee code for easier unique role code generation for committee roles
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
export type Gender = 'Male' | 'Female' | 'Other'; 

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
  department: string; // Department Name
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
  instituteId?: string; // Link to institute
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}


export type CommitteeStatus = 'active' | 'inactive' | 'dissolved';
export type CommitteeMemberRole = 'convener' | 'co_convener' | 'member';

export interface Committee {
  id: string;
  name: string;
  code: string; 
  description?: string;
  purpose: string;
  instituteId: string; 
  formationDate: string; 
  dissolutionDate?: string; 
  status: CommitteeStatus;
  convenerId?: string; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CommitteeMember {
  id: string;
  committeeId: string;
  userId: string; 
  role: CommitteeMemberRole; 
  assignmentDate: string; 
  endDate?: string; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}


export type Timestamp = string;
