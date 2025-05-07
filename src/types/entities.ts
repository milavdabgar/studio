
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
}

export interface Program {
  id: string;
  name: string;
  code: string;
  description?: string;
  departmentId: string; // Links to Department
  degreeType?: 'Diploma' | 'Bachelor' | 'Master' | 'PhD' | 'Certificate';
  durationYears?: number;
  totalSemesters?: number;
  totalCredits?: number;
  status: 'active' | 'inactive';
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
}

export type UserRole = 'admin' | 'student' | 'faculty' | 'hod' | 'jury' | 'unknown' | 'super_admin' | 'dte_admin' | 'gtu_admin' | 'institute_admin' | 'department_admin' | 'committee_admin' | 'lab_assistant' | 'clerical_staff';

// Updated User interface based on project specification
export interface User {
  id: string;
  email: string; // Personal email, can be login ID if username is not set
  username?: string; // Optional login username
  displayName: string; // Full name for display
  photoURL?: string;
  phoneNumber?: string;
  
  authProviders: ('password' | 'google' | 'microsoft')[];
  
  createdAt: string; // ISO string Timestamp
  updatedAt: string; // ISO string Timestamp
  lastLoginAt?: string; // ISO string Timestamp
  isActive: boolean; // Replaces 'status'
  isEmailVerified: boolean;
  
  roles: UserRole[]; // All assigned roles
  // currentRole is managed client-side via cookie, not stored in DB model directly

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

  instituteId?: string; // ID of the institute the user is primarily associated with
  instituteEmail?: string; // Institute-specific email, potentially used for login

  // Password is not part of the type sent to client unless for specific auth init scenarios.
  // It's handled by the backend.
  password?: string; 
}


export interface Role {
  id: string;
  name: string; // User-friendly name (e.g., "Site Administrator", "Content Editor")
  code: string; // Unique code (e.g., "admin", "editor") - should map to UserRole values
  description: string;
  permissions: string[]; // Array of permission codes
  isSystemRole?: boolean; // True if this role cannot be deleted/modified by regular admins
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
}


export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'dropped';
export type SemesterStatus = 'Passed' | 'Pending' | 'Not Appeared' | 'N/A';

export interface Student {
  id: string; // Links to User.id if a user account exists for the student
  enrollmentNumber: string;
  gtuName?: string; // Full name as per GTU records
  firstName?: string;
  middleName?: string;
  lastName?: string;
  
  personalEmail?: string;
  instituteEmail: string; // Derived: enrollmentNumber@instituteDomain
  
  programId: string; // Link to Program
  // department is derived from Program
  branchCode?: string; // From Program or Course
  currentSemester: number;
  status: StudentStatus;
  
  contactNumber?: string;
  address?: string; // Consider making this a structured Address type
  dateOfBirth?: string; // ISO string
  admissionDate?: string; // ISO string
  gender?: 'Male' | 'Female' | 'Other';
  convocationYear?: number;
  
  // Semester-wise status
  sem1Status?: SemesterStatus;
  sem2Status?: SemesterStatus;
  sem3Status?: SemesterStatus;
  sem4Status?: SemesterStatus;
  sem5Status?: SemesterStatus;
  sem6Status?: SemesterStatus;
  sem7Status?: SemesterStatus;
  sem8Status?: SemesterStatus;
  
  category?: string; // e.g., OPEN, SEBC, SC, ST
  isComplete?: boolean; // Overall program completion
  termClose?: boolean; // If term is closed for this student
  isCancel?: boolean; // If admission is cancelled
  isPassAll?: boolean; // If passed all subjects up to current sem
  aadharNumber?: string;
  shift?: 'Morning' | 'Afternoon' | string; // Or specific shift codes
  
  // User account linkage
  userId?: string; // ID of the corresponding User account
}


export type FacultyStatus = 'active' | 'inactive' | 'retired' | 'resigned' | 'on_leave';
export type JobType = 'Regular' | 'Adhoc' | 'Contractual' | 'Visiting' | 'Other';
export type Gender = 'Male' | 'Female' | 'Other';

export interface Faculty {
  id: string;
  staffCode: string; // Unique code for faculty
  gtuName?: string; // Full name as per GTU records
  
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  
  personalEmail?: string;
  instituteEmail: string; // Derived: firstName.lastName@instituteDomain
  
  contactNumber?: string;
  department: string; // Department name or ID
  designation?: string;
  jobType?: JobType;
  instType?: string; // Like DI, DE, Degree (GTU specific)
  
  dateOfBirth?: string; // ISO string
  gender?: Gender;
  maritalStatus?: string;
  joiningDate?: string; // ISO string
  
  status: FacultyStatus;
  
  // Additional details from spec
  qualifications?: string; // Could be an array of Qualification objects
  specializations?: string[];
  // serviceHistory: object; // This would be complex, maybe a sub-collection
  
  aadharNumber?: string;
  panCardNumber?: string;
  gpfNpsNumber?: string; // GPF/NPS number
  placeOfBirth?: string;
  nationality?: string;
  knownAs?: string; // Alias or common name
  
  // User account linkage
  userId?: string; // ID of the corresponding User account
}

// Timestamp placeholder type
export type Timestamp = string; // For ISO date strings, or use Firebase's Timestamp type if integrating
