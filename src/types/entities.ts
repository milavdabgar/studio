export type Timestamp = string; // ISO 8601 format: "YYYY-MM-DDTHH:mm:ss.sssZ"

// User and Authentication
export interface User {
    id: string;
    email: string; 
    username?: string; 
    displayName: string; 
    photoURL?: string;
    phoneNumber?: string;
    
    authProviders: ('password' | 'google' | 'microsoft')[];
    
    createdAt?: Timestamp; 
    updatedAt?: Timestamp; 
    lastLoginAt?: Timestamp;
    isActive: boolean;
    isEmailVerified: boolean;
    
    roles: UserRole[]; 
    currentRole: UserRole; 
    
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
    fullName?: string; 
    firstName?: string;
    middleName?: string;
    lastName?: string;
}

export type SystemUser = User; 
export type UserRole = string; 


export interface Role {
    id: string;
    name: string; 
    code: string; 
    description: string;
    permissions: string[]; 
    isSystemRole?: boolean; 
    isCommitteeRole?: boolean; 
    committeeId?: string; 
    committeeCode?: string; 
    createdAt?: Timestamp; 
    updatedAt?: Timestamp; 
    
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
    resource: string; 
    action: 'create' | 'read' | 'update' | 'delete' | 'manage' | string; 
    conditions?: unknown; 
}

export interface RoleAssignment {
    id: string;
    userId: string;
    roleId: string; 
    assignedBy: string; 
    assignedAt: Timestamp;
    expiresAt?: Timestamp;
    
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

export interface Student {
    id: string; 
    userId?: string; 
    
    enrollmentNumber: string;
    gtuEnrollmentNumber?: string; 
    
    programId: string; 
    department: string; 
    batchId?: string; 
    currentSemester: number;
    admissionDate?: Timestamp;
    
    category?: string; 
    shift?: 'Morning' | 'Afternoon' | 'Evening' | string; 
    
    isComplete?: boolean;
    termClose?: boolean; 
    isCancel?: boolean; 
    isPassAll?: boolean; 
    sem1Status?: SemesterStatus;
    sem2Status?: SemesterStatus;
    sem3Status?: SemesterStatus;
    sem4Status?: SemesterStatus;
    sem5Status?: SemesterStatus;
    sem6Status?: SemesterStatus;
    sem7Status?: SemesterStatus;
    sem8Status?: SemesterStatus;
    
    fullNameGtuFormat?: string; 
    firstName?: string;
    middleName?: string;
    lastName?: string;
    gender?: 'Male' | 'Female' | 'Other' | string;
    dateOfBirth?: Timestamp; 
    bloodGroup?: string;
    aadharNumber?: string;
    
    personalEmail?: string;
    instituteEmail: string; 
    contactNumber?: string;
    address?: string; 
    
    guardianDetails?: {
        name: string;
        relation: string;
        contactNumber: string;
        occupation?: string;
        annualIncome?: number;
    };
    
    status: StudentStatus; 
    convocationYear?: number;
    
    instituteId?: string; 
    photoURL?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}


export type FacultyStatus = 'active' | 'inactive' | 'retired' | 'resigned' | 'on_leave';
export type JobType = 'Regular' | 'Adhoc' | 'Contractual' | 'Visiting' | 'Other';
export type Gender = 'Male' | 'Female' | 'Other' | string; 

export interface FacultyProfile {
    id: string;
    userId?: string; 
    
    staffCode: string; 
    employeeId?: string; 
    
    title?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    gtuName?: string; 
    personalEmail?: string;
    instituteEmail: string; 
    contactNumber?: string;
    
    department: string; 
    designation?: string;
    jobType?: JobType;
    instType?: string; 
    specializations?: string[];
    qualifications?: Qualification[];
    
    dateOfBirth?: Timestamp; 
    joiningDate?: Timestamp; 
    
    gender?: Gender; 
    maritalStatus?: string;
    aadharNumber?: string;
    panCardNumber?: string;
    gpfNpsNumber?: string; 
    placeOfBirth?: string;
    nationality?: string;
    knownAs?: string; 
    
    status: FacultyStatus;
    
    instituteId?: string; 
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}
export type Faculty = FacultyProfile;

export interface StaffProfile {
    id: string;
    userId: string; 
    
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
    code: string; 
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    administrators?: string[]; 
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface GTU {
    id: string;
    name: string;
    code: string; 
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    administrators?: string[]; 
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface Institute {
  id: string;
  name: string;
  code: string; 
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  domain?: string; 
  status: 'active' | 'inactive';
  establishmentYear?: number;
  administrators?: string[]; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Department {
  id:string;
  name: string;
  code: string; 
  description?: string;
  hodId?: string; 
  establishmentYear?: number;
  status: 'active' | 'inactive';
  instituteId: string; 
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
  formationDate: Timestamp; 
  dissolutionDate?: Timestamp; 
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
  assignmentDate: Timestamp; 
  endDate?: Timestamp; 
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
export type BuildingStatus = 'active' | 'inactive' | 'under_maintenance' | 'demolished';
export interface Building {
  id: string;
  name: string;
  code?: string; 
  description?: string;
  instituteId: string; 
  status: BuildingStatus;
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
    dayOfWeek?: DayOfWeek | string; 
    startTime: Timestamp; 
    endTime: Timestamp;   
    isRecurring?: boolean;
    recurrencePattern?: string; 
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
    weightage?: number; 
    assessmentDate?: Timestamp; 
    dueDate?: Timestamp; 
    status: AssessmentStatus;
    instructions?: string;
    facultyId?: string; 
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
    evaluatedBy?: string; 
    evaluatedAt?: Timestamp;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
    id: string;
    studentId: string; 
    courseOfferingId: string; 
    date: Timestamp; 
    status: AttendanceStatus;
    markedBy: string; 
    remarks?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface ResultSubject {
  code: string;
  name: string;
  credits: number;
  grade: string;
  isBacklog: boolean;
  theoryEseGrade?: string;
  theoryPaGrade?: string;
  theoryTotalGrade?: string;
  practicalPaGrade?: string;
  practicalVivaGrade?: string;
  practicalTotalGrade?: string;
}

export interface Result {
  _id: string; // Changed from id to _id to match reference
  st_id: string;
  enrollmentNo: string; 
  extype?: string;
  examid?: number;
  exam?: string;
  declarationDate?: Timestamp;
  academicYear?: string;
  semester: number;
  unitNo?: number;
  examNumber?: number;
  name: string; 
  instcode?: number;
  instName?: string;
  courseName?: string; // Can be derived if not directly available
  branchCode?: number;
  branchName: string;
  subjects: ResultSubject[];
  totalCredits: number;
  earnedCredits: number;
  spi: number;
  cpi: number;
  cgpa?: number;
  result: string; 
  trials?: number;
  remark?: string;
  currentBacklog?: number;
  totalBacklog?: number;
  uploadBatch: string; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UploadBatch {
  _id: string; // Typically corresponds to uploadBatch value in Result
  count: number;
  latestUpload: Timestamp;
}

export interface BranchAnalysis {
  _id: { // Grouping keys
    branchName: string;
    semester: number;
  };
  totalStudents: number;
  passCount: number;
  distinctionCount: number;
  firstClassCount: number;
  secondClassCount: number;
  passPercentage: number;
  avgSpi: number;
  avgCpi: number;
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

export type TimetableStatus = 'draft' | 'published' | 'archived';
export type TimetableEntryType = 'lecture' | 'lab' | 'tutorial' | 'break' | 'other';

export interface TimetableEntry {
    dayOfWeek: DayOfWeek;
    startTime: string; 
    endTime: string;   
    courseOfferingId?: string; 
    courseId: string; 
    facultyId: string;
    roomId: string;
    entryType: TimetableEntryType;
    notes?: string;
}

export interface Timetable {
    id: string;
    name: string; 
    academicYear: string; 
    semester: number;
    programId: string;
    batchId?: string; 
    version: string; 
    status: TimetableStatus;
    effectiveDate: Timestamp; 
    entries: TimetableEntry[];
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}


export interface Curriculum { 
    id: string;
    programId: string;
    version: string; 
    effectiveDate: Timestamp; 
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
    startDate: Timestamp; 
    endDate: Timestamp;   
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
    startDate: Timestamp; 
    endDate?: Timestamp;   
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}
    
