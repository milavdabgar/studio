
export type Timestamp = string;

// User and Authentication
export interface User {
    id: string;
    email: string; 
    username?: string; 
    displayName: string; 
    photoURL?: string;
    phoneNumber?: string;
    
    // Authentication
    authProviders: ('password' | 'google' | 'microsoft')[];
    
    // Status
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastLoginAt?: Timestamp;
    isActive: boolean;
    isEmailVerified: boolean;
    
    // Authorization (roles will store role names or codes, currentRole stores the active role name/code)
    roles: string[]; 
    currentRole: string; 
    
    // Settings
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
    // Additional fields that were in existing User and might be from spec's User or Profile models
    instituteId?: string; 
    instituteEmail?: string; 
    password?: string; // Only for creation/update, should not be stored directly accessible
    fullName?: string; // GTU Format Name: SURNAME NAME FATHERNAME
    firstName?: string;
    middleName?: string;
    lastName?: string;
}

export type SystemUser = User; // Alias for User
export type UserRole = string; // Represents role codes or names, to be decided by usage


export interface Role {
    id: string;
    name: string; // Display name, e.g., "CWAN Convener", "Administrator"
    code: string; // Unique machine-readable identifier, e.g., "cwan_convener", "admin"
    description: string;
    permissions: string[]; // Permission codes or keys
    isSystemRole?: boolean; 
    isCommitteeRole?: boolean; 
    committeeId?: string; // If it's a committee-specific role
    committeeCode?: string; // Committee code, for easier generation of unique role codes
    createdAt?: Timestamp; 
    updatedAt?: Timestamp; 
    
    // Scope of this role (if applicable)
    scope?: {
        level: 'system' | 'dte' | 'gtu' | 'institute' | 'department' | 'committee';
        instituteId?: string;
        departmentId?: string;
        committeeId?: string;
    };
}

export interface Permission {
    id: string;
    name: string;
    code: string;
    description: string;
    resource: string; // e.g., 'student_profile', 'course'
    action: 'create' | 'read' | 'update' | 'delete' | 'manage' | string; // 'manage' implies all CRUD
    conditions?: any; // For attribute-based access control (ABAC)
}

export interface RoleAssignment {
    id: string;
    userId: string;
    roleId: string; // Reference to Role.id
    assignedBy: string; // User ID of assigner
    assignedAt: Timestamp;
    expiresAt?: Timestamp;
    
    // Scope of this assignment (e.g., for a specific institute or department if the role is scoped)
    scope?: {
        instituteId?: string;
        departmentId?: string;
        committeeId?: string;
    };
    
    isActive: boolean;
}

// Profile Models
export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'dropped';
export type SemesterStatus = 'N/A' | 'Passed' | 'Pending' | 'Not Appeared';

export interface StudentProfile {
    id: string; 
    userId: string; // Link to User account
    
    // Identification
    enrollmentNumber: string;
    gtuEnrollmentNumber?: string; // If different from institute enrollment
    
    // Academic Info
    programId: string; // Link to Program
    // department: string; // departmentId is now derived via Program
    batchId?: string; // Link to Batch
    currentSemester: number;
    admissionDate: Timestamp;
    
    // Categories
    category?: string; // OPEN, OBC, SC, ST, EWS, etc.
    shift?: 'Morning' | 'Afternoon' | 'Evening' | string; // Make string to allow for 'Other' type values initially
    
    // Academic Status
    isComplete?: boolean;
    termClose?: boolean; // Indicates if term work is completed for current sem
    isCancel?: boolean; // Admission cancelled
    isPassAll?: boolean; // Passed all subjects up to current semester
    semesterStatuses?: Record<string, SemesterStatus>; // e.g., { "sem1": "Passed", "sem2": "Pending" }
    
    // Personal Details
    fullNameGtuFormat?: string; // SURNAME NAME FATHERNAME
    firstName?: string;
    middleName?: string;
    lastName?: string;
    gender?: 'Male' | 'Female' | 'Other' | string;
    dateOfBirth?: Timestamp;
    bloodGroup?: string;
    aadharNumber?: string;
    
    // Contact
    personalEmail?: string;
    instituteEmail: string; 
    contactNumber?: string;
    address?: Address;
    
    // Guardian
    guardianDetails?: {
        name: string;
        relation: string;
        contactNumber: string;
        occupation?: string;
        annualIncome?: number;
    };
    
    // Administrative
    status: StudentStatus; // Overall status
    convocationYear?: number;
    
    // System
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Renaming Student to StudentProfile
export type Student = StudentProfile;


export type FacultyStatus = 'active' | 'inactive' | 'retired' | 'resigned' | 'on_leave';
export type JobType = 'Regular' | 'Adhoc' | 'Contractual' | 'Visiting' | 'Other';
export type Gender = 'Male' | 'Female' | 'Other' | string; // Allow string for flexibility

export interface FacultyProfile {
    id: string;
    userId: string; // Link to User account
    
    // Identification
    staffCode: string; 
    employeeId?: string; // Government employee ID if applicable
    
    // Personal & Contact
    title?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    gtuName?: string; // Full name as per GTU records, if different
    personalEmail?: string;
    instituteEmail: string; 
    contactNumber?: string;
    
    // Professional
    department: string; // Department Name or ID (if linking to Department model directly)
    designation?: string;
    jobType?: JobType;
    instType?: string; // Institute Type (e.g., DI, DEG) as per GTU
    specializations?: string[];
    qualifications?: Qualification[];
    
    // Dates
    dateOfBirth?: Timestamp;
    joiningDate?: Timestamp;
    
    // Personal Details
    gender?: Gender; 
    maritalStatus?: string;
    aadharNumber?: string;
    panCardNumber?: string;
    gpfNpsNumber?: string; // GPF/NPS/PRAN Number
    placeOfBirth?: string;
    nationality?: string;
    knownAs?: string; // Alias or nickname
    
    // Status
    status: FacultyStatus;
    
    // System
    instituteId?: string; // Link to institute
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}
// Renaming Faculty to FacultyProfile
export type Faculty = FacultyProfile;

export interface StaffProfile {
    id: string;
    userId: string; // Link to User account
    
    // Identification
    staffCode: string;
    employeeId?: string;
    
    // Job Details
    staffCategory: 'Clerical' | 'Technical' | 'Support' | 'Administrative' | string;
    designation: string;
    department?: string; // Department Name or ID
    
    // Dates
    joiningDate?: Timestamp;
    dateOfBirth?: Timestamp;
    
    // Status
    status: 'active' | 'inactive' | 'on_leave' | 'retired' | 'resigned';
    
    // System
    instituteId?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Common Types for Profiles
export interface Address {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
}

export interface Qualification {
    degree: string;
    field: string;
    institution: string;
    year: number;
    grade?: string;
}


// Organizational Models
export interface DTE {
    id: string;
    name: string;
    code: string; // e.g., DTEGUJ
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    administrators?: string[]; // User IDs of DTE Admins
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface GTU {
    id: string;
    name: string;
    code: string; // e.g., GTU
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    administrators?: string[]; // User IDs of GTU Admins
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface Institute {
  id: string;
  name: string;
  code: string; // Short code, e.g., GPP
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  status: 'active' | 'inactive';
  establishmentYear?: number;
  domain?: string; // For generating institute-specific emails e.g., gppalanpur.in
  administrators?: string[]; // User IDs of Institute Admins
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Department {
  id:string;
  name: string;
  code: string; // Short code, e.g., CE, ME
  description?: string;
  hodId?: string; // User ID of HOD
  establishmentYear?: number;
  status: 'active' | 'inactive';
  instituteId: string; // Link to Institute
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type CommitteeStatus = 'active' | 'inactive' | 'dissolved';
export type CommitteeMemberRole = 'convener' | 'co_convener' | 'member' | 'chairperson' | 'secretary' | string;

export interface Committee {
  id: string;
  name: string;
  code: string; // Short code for the committee, e.g., ARC, IQAC
  description?: string;
  purpose: string;
  instituteId: string; // Link to Institute
  formationDate: Timestamp; 
  dissolutionDate?: Timestamp; 
  status: CommitteeStatus;
  convenerId?: string; // User ID of the convener
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CommitteeMember {
  id: string;
  committeeId: string;
  userId: string; 
  role: CommitteeMemberRole; 
  assignmentDate: Timestamp; 
  endDate?: Timestamp; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Academic Models
export interface Program {
  id: string;
  name: string; // e.g., Diploma in Computer Engineering
  code: string; // e.g., DCE
  description?: string;
  departmentId: string; 
  instituteId: string; // To associate program with an institute (useful if departments are shared or general)
  degreeType?: 'Diploma' | 'Bachelor' | 'Master' | 'PhD' | 'Certificate' | string;
  durationYears?: number;
  totalSemesters?: number;
  totalCredits?: number;
  curriculumVersion?: string;
  status: 'active' | 'inactive' | 'phasing_out';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Batch {
    id: string;
    name: string; // E.g., "2022-2025 CE", "Fall 2023"
    programId: string;
    academicYear: number; // Starting year, e.g., 2022
    startDate: Timestamp;
    endDate?: Timestamp;
    maxIntake?: number;
    actualIntake?: number;
    status: 'active' | 'inactive' | 'completed' | 'upcoming';
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface Course {
  id: string;
  subcode: string; // Subject code, e.g., 3330701
  subjectName: string;
  branchCode?: string; // Program/Branch specific code if any, e.g., 07 for CE in some systems
  effFrom?: string; // Effective from academic year, e.g., "2024-25"
  
  // Categorization
  category?: string; // e.g., "Basic Science", "Program Core", "Humanities"
  semester: number; 
  
  // Hours and Credits
  lectureHours: number; 
  tutorialHours: number; 
  practicalHours: number; 
  credits: number; // Auto-calculated: L + T + P (or as per specific rules)
  
  // Marks Distribution
  theoryEseMarks: number; // End Semester Exam (Theory)
  theoryPaMarks: number; // Progressive Assessment (Theory)
  practicalEseMarks: number; // End Semester Exam (Practical/Viva)
  practicalPaMarks: number; // Progressive Assessment (Practical/Internal)
  totalMarks: number; // Auto-calculated
  
  // Course Type & Properties
  isElective: boolean;
  isTheory: boolean;
  theoryExamDuration?: string; // e.g., "2.5 Hrs"
  isPractical: boolean;
  practicalExamDuration?: string; // e.g., "2 Hrs"
  isFunctional: boolean; // If it's a functional subject (directly related to program skills)
  isSemiPractical?: boolean; // If it has both theory and significant practical component
  
  // References
  departmentId: string; // Owning department
  programId: string; // Program this course belongs to
  
  // Additional Info
  remarks?: string;
  
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CourseOffering {
    id: string;
    courseId: string;
    batchId: string; // Links to a specific batch of students
    academicYear: string; // e.g., "2023-24"
    semester: number; // The semester in which this offering runs for the batch
    facultyIds: string[]; // IDs of faculty teaching this offering
    roomIds?: string[]; // IDs of rooms allocated
    startDate?: Timestamp;
    endDate?: Timestamp;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface Enrollment {
    id: string;
    studentProfileId: string;
    courseOfferingId: string;
    status: 'enrolled' | 'withdrawn' | 'completed' | 'failed' | 'incomplete';
    internalMarks?: number;
    externalMarks?: number;
    grade?: string;
    attendancePercentage?: number;
    enrolledAt?: Timestamp;
    completedAt?: Timestamp;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}


// Infrastructure Models
export interface Building {
  id: string;
  name: string;
  code?: string; // Short code for the building
  description?: string;
  instituteId: string; // Link to Institute
  status: 'active' | 'inactive' | 'under_maintenance' | 'demolished';
  constructionYear?: number;
  numberOfFloors?: number;
  totalAreaSqFt?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type RoomType = 'Lecture Hall' | 'Laboratory' | 'Office' | 'Staff Room' | 'Workshop' | 'Library' | 'Store Room' | 'Seminar Hall' | 'Auditorium' | 'Other';
export type RoomStatus = 'available' | 'occupied' | 'under_maintenance' | 'unavailable' | 'reserved';

export interface Room {
  id: string;
  roomNumber: string; 
  name?: string; // Optional name, e.g., "Physics Lab", "HOD Cabin"
  buildingId: string;
  floor?: number; // e.g., 0 for ground, 1 for first
  type: RoomType;
  capacity?: number;
  areaSqFt?: number;
  facilities?: string[]; // e.g., ["Projector", "AC", "Whiteboard"]
  status: RoomStatus;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RoomAllocation {
    id: string;
    roomId: string;
    purpose: 'lecture' | 'practical' | 'exam' | 'event' | 'meeting' | 'other';
    courseOfferingId?: string; // If allocated for a course
    committeeId?: string; // If allocated for a committee meeting
    facultyId?: string; // Faculty responsible or booking
    title?: string; // Title of event/meeting
    dayOfWeek?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | string;
    startTime: Timestamp; // Full datetime for specific events, or just time for recurring
    endTime: Timestamp;   // Full datetime for specific events, or just time for recurring
    isRecurring?: boolean;
    recurrencePattern?: string; // e.g., "weekly", "bi-weekly" (if isRecurring)
    status: 'scheduled' | 'cancelled' | 'completed' | 'ongoing';
    notes?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}


// Other common types from the specification
export interface StaffTransfer {
  id: string;
  userId: string;
  fromInstituteId: string;
  toInstituteId: string;
  transferOrderNumber: string;
  transferDate: Timestamp;
  transferType: 'promotion' | 'request' | 'administrative' | string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  remarks?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Curriculum { // From GTU section
    id: string;
    programId: string;
    version: string; // e.g., "v2023.1"
    effectiveDate: Timestamp;
    courses: Array<{ courseId: string, semester: number, isElective: boolean }>; // List of courses in this curriculum
    status: 'draft' | 'active' | 'archived';
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface Examination { // From GTU section
    id: string;
    name: string; // e.g., "Winter 2023 Regular Exam"
    gtuExamCode?: string;
    academicYear: string;
    examType: 'regular' | 'remedial' | 'internal' | 'external_practical';
    startDate: Timestamp;
    endDate: Timestamp;
    programs: string[]; // Program IDs included in this exam
    status: 'scheduled' | 'ongoing' | 'completed' | 'postponed' | 'cancelled';
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface FacultyAssignment { // From Personnel Models / Department Structure
    id: string;
    facultyProfileId: string;
    departmentId: string;
    academicYear: string;
    courseOfferingIds?: string[]; // For teaching assignments
    role?: 'teaching' | 'non_teaching_academic' | 'administrative' | string; // More specific role in department
    teachingHours?: number;
    assignmentType?: 'full_time' | 'part_time' | 'additional_charge';
    startDate: Timestamp;
    endDate?: Timestamp;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

    