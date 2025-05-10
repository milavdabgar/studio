export type Timestamp = string; // ISO 8601 format: "YYYY-MM-DDTHH:mm:ss.sssZ"

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
    createdAt?: Timestamp; // Made optional as it's auto-set by DB usually
    updatedAt?: Timestamp; // Made optional as it's auto-set by DB usually
    lastLoginAt?: Timestamp;
    isActive: boolean;
    isEmailVerified: boolean;
    
    // Authorization
    roles: UserRole[]; // Stores role CODES
    currentRole: UserRole; // Stores the active role CODE
    
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
export type UserRole = string; // Represents a role CODE


export interface Role {
    id: string;
    name: string; // Display name, e.g., "CWAN Convener", "Administrator"
    code: string; // Unique machine-readable identifier (lowercase), e.g., "cwan_convener", "admin"
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
    roleId: string; // Reference to Role.id (or perhaps Role.code for more resilience to ID changes)
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
    userId?: string; // Link to User account
    
    // Identification
    enrollmentNumber: string;
    gtuEnrollmentNumber?: string; // If different from institute enrollment
    
    // Academic Info
    programId: string; // Link to Program
    department: string; // Department ID (Derived from Program, but can be stored for denormalization/reporting)
    batchId?: string; // Link to Batch
    currentSemester: number;
    admissionDate?: Timestamp;
    
    // Categories
    category?: string; // OPEN, OBC, SC, ST, EWS, etc.
    shift?: 'Morning' | 'Afternoon' | 'Evening' | string; 
    
    // Academic Status
    isComplete?: boolean;
    termClose?: boolean; // Indicates if term work is completed for current sem
    isCancel?: boolean; // Admission cancelled
    isPassAll?: boolean; // Passed all subjects up to current semester
    sem1Status?: SemesterStatus;
    sem2Status?: SemesterStatus;
    sem3Status?: SemesterStatus;
    sem4Status?: SemesterStatus;
    sem5Status?: SemesterStatus;
    sem6Status?: SemesterStatus;
    sem7Status?: SemesterStatus;
    sem8Status?: SemesterStatus;
    
    // Personal Details
    fullNameGtuFormat?: string; // SURNAME NAME FATHERNAME
    firstName?: string;
    middleName?: string;
    lastName?: string;
    gender?: 'Male' | 'Female' | 'Other' | string;
    dateOfBirth?: Timestamp; // "YYYY-MM-DD"
    bloodGroup?: string;
    aadharNumber?: string;
    
    // Contact
    personalEmail?: string;
    instituteEmail: string; 
    contactNumber?: string;
    address?: string; // Simplified address for now
    
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
    instituteId?: string; // Store institute context
    photoURL?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export type Student = StudentProfile;


export type FacultyStatus = 'active' | 'inactive' | 'retired' | 'resigned' | 'on_leave';
export type JobType = 'Regular' | 'Adhoc' | 'Contractual' | 'Visiting' | 'Other';
export type Gender = 'Male' | 'Female' | 'Other' | string; 

export interface FacultyProfile {
    id: string;
    userId?: string; // Link to User account
    
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
    department: string; 
    designation?: string;
    jobType?: JobType;
    instType?: string; // Institute Type (e.g., DI, DEG) as per GTU
    specializations?: string[];
    qualifications?: Qualification[];
    
    // Dates
    dateOfBirth?: Timestamp; // "YYYY-MM-DD"
    joiningDate?: Timestamp; // "YYYY-MM-DD"
    
    // Personal Details
    gender?: Gender; 
    maritalStatus?: string;
    aadharNumber?: string;
    panCardNumber?: string;
    gpfNpsNumber?: string; 
    placeOfBirth?: string;
    nationality?: string;
    knownAs?: string; // Alias or nickname
    
    // Status
    status: FacultyStatus;
    
    // System
    instituteId?: string; 
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}
export type Faculty = FacultyProfile;

export interface StaffProfile {
    id: string;
    userId: string; // Link to User account
    
    staffCode: string;
    employeeId?: string;
    
    staffCategory: 'Clerical' | 'Technical' | 'Support' | 'Administrative' | string;
    designation: string;
    department?: string; 
    
    joiningDate?: Timestamp;
    dateOfBirth?: Timestamp;
    
    status: 'active' | 'inactive' | 'on_leave' | 'retired' | 'resigned';
    
    instituteId?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Common Types for Profiles
export interface Address { // Kept for potential future use, but student uses simplified string
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
  domain?: string; // e.g., gppalanpur.ac.in
  status: 'active' | 'inactive';
  establishmentYear?: number;
  administrators?: string[]; 
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
  code: string; 
  description?: string;
  purpose: string;
  instituteId: string; 
  formationDate: Timestamp; // "YYYY-MM-DD"
  dissolutionDate?: Timestamp; // "YYYY-MM-DD"
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
  assignmentDate: Timestamp; // "YYYY-MM-DD"
  endDate?: Timestamp; // "YYYY-MM-DD"
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Academic Models
export interface Program {
  id: string;
  name: string; 
  code: string; 
  description?: string;
  departmentId: string; 
  instituteId: string; 
  degreeType?: 'Diploma' | 'Bachelor' | 'Master' | 'PhD' | 'Certificate' | string;
  durationYears?: number;
  totalSemesters?: number;
  totalCredits?: number;
  curriculumVersion?: string;
  status: 'active' | 'inactive' | 'phasing_out';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type BatchStatus = 'upcoming' | 'active' | 'completed' | 'inactive';
export interface Batch {
    id: string;
    name: string; 
    programId: string; 
    startAcademicYear: number; 
    endAcademicYear?: number; 
    status: BatchStatus;
    maxIntake?: number;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface Course {
  id: string;
  subcode: string; 
  subjectName: string;
  branchCode?: string; 
  effFrom?: string; 
  
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
  
  departmentId: string; 
  programId: string; 
  
  remarks?: string;
  
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CourseOffering {
    id: string;
    courseId: string;
    batchId: string; 
    academicYear: string; 
    semester: number; 
    facultyIds: string[]; 
    roomIds?: string[]; 
    startDate?: Timestamp; // "YYYY-MM-DD"
    endDate?: Timestamp;   // "YYYY-MM-DD"
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
  code?: string; 
  description?: string;
  instituteId: string; 
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
  name?: string; 
  buildingId: string;
  floor?: number; 
  type: RoomType;
  capacity?: number;
  areaSqFt?: number;
  facilities?: string[]; 
  status: RoomStatus;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type RoomAllocationPurpose = 'lecture' | 'practical' | 'exam' | 'event' | 'meeting' | 'other';
export type RoomAllocationStatus = 'scheduled' | 'cancelled' | 'completed' | 'ongoing';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';


export interface RoomAllocation {
    id: string;
    roomId: string;
    purpose: RoomAllocationPurpose;
    courseOfferingId?: string; 
    committeeId?: string; 
    facultyId?: string; 
    title?: string; 
    dayOfWeek?: DayOfWeek | string; // Allows for 'Daily' or specific day.
    startTime: Timestamp; // ISO string "YYYY-MM-DDTHH:mm:ss.sssZ"
    endTime: Timestamp;   // ISO string "YYYY-MM-DDTHH:mm:ss.sssZ"
    isRecurring?: boolean;
    recurrencePattern?: string; // e.g., RRULE string or simple "daily", "weekly", "monthly"
    status: RoomAllocationStatus;
    notes?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}


// Assessment and Results
export type AssessmentType = 'Quiz' | 'Midterm' | 'Final Exam' | 'Assignment' | 'Project' | 'Lab Work' | 'Presentation' | 'Other';
export type AssessmentStatus = 'Draft' | 'Published' | 'Ongoing' | 'Completed' | 'Cancelled';

export interface Assessment {
    id: string;
    name: string;
    courseId: string; 
    programId: string; 
    batchId?: string; 
    type: AssessmentType;
    description?: string;
    maxMarks: number;
    passingMarks?: number;
    weightage?: number; // e.g., 0.20 for 20%
    assessmentDate?: Timestamp; // For timed exams
    dueDate?: Timestamp; // For assignments/projects
    status: AssessmentStatus;
    instructions?: string;
    facultyId?: string; // Creator/Assigner
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface StudentAssessmentScore {
    id: string;
    studentId: string;
    assessmentId: string;
    score?: number;
    grade?: string;
    remarks?: string;
    submissionDate?: Timestamp;
    evaluatedBy?: string; // facultyId
    evaluatedAt?: Timestamp;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
    id: string;
    studentId: string; // Link to StudentProfile.id
    courseOfferingId: string; // Identifies the specific class/lab session for a course
    date: Timestamp; // Date of the session, "YYYY-MM-DD"
    status: AttendanceStatus;
    markedBy: string; // facultyId who marked attendance
    remarks?: string;
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
  transferDate: Timestamp; // "YYYY-MM-DD"
  transferType: 'promotion' | 'request' | 'administrative' | string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  remarks?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type TimetableStatus = 'draft' | 'published' | 'archived';
export type TimetableEntryType = 'lecture' | 'lab' | 'tutorial' | 'break' | 'other';

export interface TimetableEntry {
    dayOfWeek: DayOfWeek;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    courseOfferingId?: string; // Link to specific offering for subject, batch
    courseId: string; // For display, actual link via CourseOffering
    facultyId: string;
    roomId: string;
    entryType: TimetableEntryType;
    notes?: string;
}

export interface Timetable {
    id: string;
    name: string; // e.g., "DCE Sem 3 (AY 2024-25)"
    academicYear: string; // e.g., "2024-25"
    semester: number;
    programId: string;
    batchId?: string; // Optional: For specific batch timetable
    version: string; // e.g., "1.0", "1.1-revised"
    status: TimetableStatus;
    effectiveDate: Timestamp; // "YYYY-MM-DD"
    entries: TimetableEntry[];
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}


export interface Curriculum { 
    id: string;
    programId: string;
    version: string; 
    effectiveDate: Timestamp; // "YYYY-MM-DD"
    courses: Array<{ 
        courseId: string, 
        semester: number, 
        isElective: boolean 
    }>; 
    status: 'draft' | 'active' | 'archived';
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface Examination { 
    id: string;
    name: string; 
    gtuExamCode?: string;
    academicYear: string;
    examType: 'regular' | 'remedial' | 'internal' | 'external_practical';
    startDate: Timestamp; // "YYYY-MM-DD"
    endDate: Timestamp;   // "YYYY-MM-DD"
    programs: string[]; 
    status: 'scheduled' | 'ongoing' | 'completed' | 'postponed' | 'cancelled';
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface FacultyAssignment { 
    id: string;
    facultyProfileId: string;
    departmentId: string;
    academicYear: string;
    courseOfferingIds?: string[]; 
    role?: 'teaching' | 'non_teaching_academic' | 'administrative' | string; 
    teachingHours?: number;
    assignmentType?: 'full_time' | 'part_time' | 'additional_charge';
    startDate: Timestamp; // "YYYY-MM-DD"
    endDate?: Timestamp;   // "YYYY-MM-DD"
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}
    
