export type Timestamp = string; // ISO 8601 format: "YYYY-MM-DDTHH:mm:ss.sssZ"

// Program-Semester-Date Entry for Academic Terms
export interface ProgramSemesterDateEntry {
    programs: string[]; // Array of program IDs (multiselect)
    semesters: number[]; // Array of semester numbers (multiselect, filtered by term type)
    startDate: string; // ISO date string for this specific group
    endDate: string; // ISO date string for this specific group
}

// Academic Term (Table-style entries)
export interface AcademicTerm {
    id: string;
    name: string; // "Odd Term 2024-25" or "Even Term 2024-25" (no program-specific name)
    academicYear: string; // "2024-25"
    term: 'Odd' | 'Even'; // Odd = Semesters 1,3,5 | Even = Semesters 2,4,6
    
    // Multiple entries - each can have different programs, semesters, and dates
    dateEntries: ProgramSemesterDateEntry[]; // Table-like structure
    
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    gtuCalendarUrl?: string; // Link to GTU academic calendar
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    
    // Legacy fields (kept for backward compatibility - will be removed in future)
    programId?: string; // Deprecated
    semesters?: number[]; // Deprecated
    startDate?: string; // Deprecated
    endDate?: string; // Deprecated
    semesterDates?: any[]; // Deprecated
    programAssignments?: any[]; // Deprecated
    maxEnrollmentPerCourse?: number; // Deprecated
}

// User and Authentication
export type UserRole = 
  | 'admin' 
  | 'student' 
  | 'faculty' 
  | 'hod' 
  | 'jury' 
  | 'unknown'
  | 'super_admin'
  | 'institute_admin'
  | 'department_admin'
  | 'committee_admin'
  | 'committee_convener'
  | 'committee_co_convener'
  | 'committee_member'
  | 'dte_admin'
  | 'gtu_admin'
  | 'lab_assistant'
  | 'clerical_staff'
  | string; 


export interface User {
    id: string;
    email: string; 
    username?: string; 
    displayName: string; 
    fullName?: string; 
    firstName?: string;
    middleName?: string;
    lastName?: string;
    photoURL?: string;
    phoneNumber?: string;
    departmentId?: string; 
    
    authProviders: ('password' | 'google' | 'microsoft')[];
    
    createdAt?: Timestamp; 
    updatedAt?: Timestamp; 
    lastLoginAt?: Timestamp;
    loginCount?: number;
    isActive: boolean;
    isEmailVerified?: boolean;
    
    roles: UserRole[]; 
    currentRole: UserRole; 
    
    preferences?: {
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
}
export type SystemUser = User;


export interface Role {
    id: string;
    name: string; 
    code: UserRole; 
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
    conditions?: Record<string, unknown>; 
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

// LinkedIn-like Profile Interfaces
export interface EducationEntry {
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
    isCurrently: boolean;
    grade?: string;
    description?: string;
    activities?: string;
    location?: string;
    order?: number;
}

export interface ExperienceEntry {
    id: string;
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrently: boolean;
    description?: string;
    responsibilities?: string[];
    achievements?: string[];
    skills?: string[];
    order?: number;
}

export interface ProjectEntry {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    isOngoing: boolean;
    technologies?: string[];
    role?: string;
    teamSize?: number;
    projectUrl?: string;
    githubUrl?: string;
    images?: string[];
    achievements?: string[];
    order?: number;
}

export interface SkillEntry {
    id: string;
    name: string;
    category: 'technical' | 'soft' | 'language' | 'tool' | 'other';
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    endorsements?: number;
    verified?: boolean;
    order?: number;
}

export interface AchievementEntry {
    id: string;
    title: string;
    description: string;
    date: string;
    category: 'academic' | 'professional' | 'competition' | 'award' | 'recognition' | 'other';
    issuer?: string;
    certificateUrl?: string;
    order?: number;
}

export interface CertificationEntry {
    id: string;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
    certificateUrl?: string;
    date?: string;
    description?: string;
    skills?: string[];
    order?: number;
}

export interface PublicationEntry {
    id: string;
    title: string;
    type: 'journal' | 'conference' | 'book' | 'chapter' | 'article' | 'thesis' | 'other';
    authors: string[];
    publicationDate: string;
    date?: string;
    venue?: string;
    journal?: string;
    conference?: string;
    abstract?: string;
    description?: string;
    doi?: string;
    url?: string;
    order?: number;
}

export interface LanguageEntry {
    id: string;
    name?: string;
    language: string;
    proficiency: 'native' | 'fluent' | 'conversational' | 'basic';
    order?: number;
}

export interface VolunteerEntry {
    id: string;
    organization: string;
    position: string;
    role?: string;
    startDate: string;
    endDate?: string;
    isCurrently: boolean;
    description?: string;
    skills?: string[];
    achievements?: string[];
    location?: string;
    contactInfo?: string;
    order?: number;
}

export interface ProfessionalMembershipEntry {
    id: string;
    organization: string;
    membershipType: string;
    role?: string;
    startDate: string;
    endDate?: string;
    isCurrently: boolean;
    isLifetime?: boolean;
    membershipId?: string;
    description?: string;
    benefits?: string[];
    order?: number;
}

export interface AwardEntry {
    id: string;
    title: string;
    issuer: string;
    date: string;
    category: 'academic' | 'professional' | 'competition' | 'recognition' | 'scholarship' | 'other';
    description?: string;
    prize?: string;
    certificateUrl?: string;
    order?: number;
}

export interface ReferenceEntry {
    id: string;
    name: string;
    position: string;
    company: string;
    email: string;
    phone?: string;
    relationship: 'supervisor' | 'colleague' | 'professor' | 'mentor' | 'other';
    description?: string;
    order?: number;
}

export interface ProfessionalDevelopmentEntry {
    id: string;
    title: string;
    provider: string;
    type: 'workshop' | 'seminar' | 'conference' | 'course' | 'bootcamp' | 'other';
    startDate: string;
    endDate?: string;
    duration?: string;
    description?: string;
    skills?: string[];
    certificateUrl?: string;
    order?: number;
}

export interface ProfileSettings {
    showPersonalInfo?: boolean;
    showContactInfo?: boolean;
    showEducation?: boolean;
    showExperience?: boolean;
    showProjects?: boolean;
    showSkills?: boolean;
    showAchievements?: boolean;
    showCertifications?: boolean;
    showPublications?: boolean;
    showLanguages?: boolean;
    showVolunteerWork?: boolean;
    showProfessionalMemberships?: boolean;
    showAwards?: boolean;
    showReferences?: boolean;
    showProfessionalDevelopment?: boolean;
    allowDownload?: boolean;
    allowPrint?: boolean;
    customUrl?: string;
}

export interface Student {
    id: string; 
    userId?: string; 
    
    enrollmentNumber: string; 
    
    programId: string; 
    batchId?: string; 
    currentSemester: number; // 1-6 for diploma programs
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
    // Diploma programs only have semesters 1-6, no sem7Status/sem8Status
    semesterStatuses?: Record<number, SemesterStatus>; // For dynamic semester access (1-6 for diploma)
    
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
    academicRemarks?: string; // Added for admin notes on academic progress
    
    // Additional fields for dashboard and academic tracking
    creditsEarned?: number;
    totalCredits?: number;
    cpi?: number; // Cumulative Performance Index
    studentId?: string; // Display ID
    programName?: string; // Program display name
    batchName?: string; // Batch display name
    
    instituteId?: string; 
    photoURL?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    isActive?: boolean; 
    
    // LinkedIn-like Profile Sections
    profileSummary?: string;
    careerObjective?: string;
    education?: EducationEntry[];
    experience?: ExperienceEntry[];
    projects?: ProjectEntry[];
    skills?: SkillEntry[];
    achievements?: AchievementEntry[];
    certifications?: CertificationEntry[];
    publications?: PublicationEntry[];
    languages?: LanguageEntry[];
    
    // Additional Professional Sections
    volunteerWork?: VolunteerEntry[];
    professionalMemberships?: ProfessionalMembershipEntry[];
    awards?: AwardEntry[];
    references?: ReferenceEntry[];
    professionalDevelopment?: ProfessionalDevelopmentEntry[];
    
    // Online Presence & Portfolio
    portfolioWebsite?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    twitterUrl?: string;
    personalWebsite?: string;
    
    // Additional Contact Information
    alternateEmail?: string;
    whatsappNumber?: string;
    linkedinProfile?: string;
    
    // Professional Interests
    careerInterests?: string[];
    industryInterests?: string[];
    
    // Profile Settings
    profileVisibility?: 'public' | 'private' | 'institute_only';
    profileSettings?: ProfileSettings;
}


export type FacultyStatus = 'active' | 'inactive' | 'retired' | 'resigned' | 'on_leave';
export type JobType = 'Regular' | 'Adhoc' | 'Contractual' | 'Visiting' | 'Other';
export type Gender = 'Male' | 'Female' | 'Other';
export type StaffCategory = 'Teaching' | 'Clerical' | 'Technical' | 'Support' | 'Administrative' | 'Other' | string;

export const STAFF_CATEGORY_OPTIONS: StaffCategory[] = ['Teaching', 'Clerical', 'Technical', 'Support', 'Administrative', 'Other'];


export interface FacultyProfile {
    id: string;
    userId?: string; 
    
    staffCode: string; 
    employeeId?: string; 
    gtuFacultyId?: string;
    
    photoURL?: string;
    
    title?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string; // For display purposes
    gtuName?: string; 
    email?: string; // Primary email field
    personalEmail?: string;
    instituteEmail: string; 
    contactNumber?: string;
    address?: string;
    
    department: string; 
    departmentId?: string; // Department ID reference
    designation?: string;
    jobType?: JobType;
    staffCategory?: StaffCategory; 
    category?: StaffCategory; // Alias for staffCategory
    instType?: string; 
    specializations?: string[];
    specialization?: string; // Singular form for backward compatibility
    qualifications?: Qualification[];
    qualification?: string; // String form for backward compatibility
    experienceYears?: string; // Renamed to avoid conflict
    
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
    
    // Additional faculty-specific fields
    isHOD?: boolean;
    isPrincipal?: boolean;
    researchInterests?: string[];
    subjects?: string[]; // Array of subjects taught by the faculty
    
    status: FacultyStatus;
    
    // LinkedIn-like Profile Sections
    profileSummary?: string;
    education?: EducationEntry[];
    experience?: ExperienceEntry[];
    projects?: ProjectEntry[];
    skills?: SkillEntry[];
    achievements?: AchievementEntry[];
    awards?: AwardEntry[];
    certifications?: CertificationEntry[];
    publications?: PublicationEntry[];
    languages?: LanguageEntry[];
    
    // Additional Professional Sections
    volunteerWork?: VolunteerEntry[];
    professionalMemberships?: ProfessionalMembershipEntry[];
    references?: ReferenceEntry[];
    professionalDevelopment?: ProfessionalDevelopmentEntry[];
    
    // Profile Settings
    profileVisibility?: 'public' | 'private' | 'institute_only';
    profileSettings?: ProfileSettings;
    
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
    
    staffCategory: 'Clerical' | 'Technical' | 'Support' | 'Administrative';
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
    description?: string;
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
  principalId?: string; // ID of the faculty member who is the Principal
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
  committeeType?: string;
  department?: string;
  chairperson?: {
    userId?: string;
    name?: string;
    email?: string;
    contactNumber?: string;
  };
  establishedDate?: string;
  meetingSchedule?: string;
  responsibilities?: string[];
  instituteId: string; 
  formationDate: Timestamp; 
  dissolutionDate?: Timestamp; 
  status: CommitteeStatus;
  convenerId?: string; 
  members?: Array<{
    userId: string;
    name?: string;
    email?: string;
    contactNumber?: string;
    role: CommitteeMemberRole; 
    assignmentDate: Timestamp;
    endDate?: Timestamp;
  }>;
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
export interface IntakeCapacityRange {
  fromYear: number;
  toYear?: number; // undefined means "current" or ongoing
  capacity: number;
  label?: string; // Optional label like "Current", "Expansion Phase", etc.
}

export interface Program {
  id: string;
  name: string; 
  code: string; 
  description?: string;
  departmentId: string; 
  instituteId: string; 
  degreeType?: 'Diploma' | 'Bachelor' | 'Master' | 'PhD' | 'Certificate' | string;
  duration?: number; // For backward compatibility 
  durationYears?: number;
  totalSemesters?: number;
  totalCredits?: number;
  curriculumVersion?: string;
  status: 'active' | 'inactive' | 'phasing_out';
  admissionCapacity?: number; // Legacy field - for backward compatibility
  intakeCapacityRanges?: IntakeCapacityRange[]; // [{ fromYear: 2021, toYear: undefined, capacity: 118 }, { fromYear: 2015, toYear: 2020, capacity: 90 }]
  yearlyIntakeCapacities?: Record<number, number>; // Legacy field - will be derived from ranges
  currentIntakeCapacity?: number; // Legacy field - will be derived from current range
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type BatchStatus = 'upcoming' | 'active' | 'completed' | 'inactive';
export interface Batch {
    id: string;
    name: string; 
    programId: string; 
    academicYear?: string;
    semester?: number;
    startAcademicYear: number; 
    endAcademicYear?: number; 
    status: BatchStatus;
    maxIntake?: number;
    strength?: number;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface Course {
  id: string;
  subcode: string; 
  subjectName: string;
  subjectCode?: string; // Subject code for display
  effFrom?: string; 
  syllabusUrl?: string; // GTU syllabus PDF URL
  
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
  oralPaMarks?: number;
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

export type CourseOfferingStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
export interface CourseOffering {
    id: string;
    courseId: string;
    academicTermId: string; // Reference to AcademicTerm (replaces batchId, academicYear, semester, startDate, endDate, maxEnrollments)
    facultyIds: string[]; 
    roomIds?: string[]; 
    status: CourseOfferingStatus;
    currentEnrollments?: number;
    description?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    
    // Legacy fields for backward compatibility - will be populated from AcademicTerm
    batchId?: string; 
    academicYear?: string; 
    semester?: number; 
    startDate?: Timestamp; 
    endDate?: Timestamp;   
    programId?: string; 
    maxEnrollments?: number;
}

export type EnrollmentStatus = 'requested' | 'enrolled' | 'withdrawn' | 'completed' | 'failed' | 'incomplete' | 'rejected';
export interface Enrollment {
    id: string;
    studentId: string; 
    courseOfferingId: string;
    
    status: EnrollmentStatus;
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

export type RoomType = 'Lecture Hall' | 'Laboratory' | 'Office' | 'Staff Room' | 'Workshop' | 'Library' | 'Store Room' | 'Seminar Hall' | 'Auditorium' | 'Computer Lab' | 'Lab' | 'Other';
export type RoomStatus = 'available' | 'occupied' | 'under_maintenance' | 'unavailable' | 'reserved' | 'active';

export interface CCTVInfo {
  installed: boolean;
  company?: string; // e.g., "Digilink", "Hickvision"
  deviceNo?: string; // e.g., "D31", "D09"
  ipAddress?: string; // e.g., "10.169.24.27"
  username?: string; // e.g., "admin"
  password?: string; // e.g., "admin", "admin@123"
  status?: 'working' | 'down' | 'maintenance' | 'not_installed';
}

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
  cctv?: CCTVInfo;
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
  marks?: number; // Alternative field name for score
  grade?: string;
  remarks?: string; 
  comments?: string; // Additional comments
  submissionDate?: Timestamp; 
  submittedAt?: Timestamp; // Alternative field name for submissionDate
  files?: Array<{ 
    name: string; 
    url: string; 
    type: string; 
    size?: number;
  }>;
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
  _id: string; 
  st_id?: string; // GTU specific student ID, often same as map_number
  studentId?: string; // Link to our Student model ID
  enrollmentNo: string; 
  extype?: string;
  examid?: number; // Can link to Examination.id or be GTU exam_id
  exam?: string; // Name of the exam
  declarationDate?: Timestamp;
  academicYear?: string;
  semester: number;
  unitNo?: number;
  examNumber?: number;
  name: string; 
  instcode?: number;
  instName?: string;
  courseName?: string; 
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
  programId?: string; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UploadBatch {
  _id: string; 
  count: number;
  latestUpload: Timestamp;
}

export interface BranchAnalysis {
  _id: { 
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

export interface ResultFilterParams {
  branchName?: string;
  semester?: number;
  academicYear?: string;
  examid?: number;
  examId?: string; // For formal Examination ID
  studentId?: string;
  uploadBatch?: string;
  page?: number;
  limit?: number;
  search?: string; // Added search parameter
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ResultsResponse {
  status: string;
  data: {
    results: Result[];
    pagination?: Pagination;
  };
}
export interface ResultDetailResponse {
  status: string;
  data: {
    result: Result;
  };
}
export interface BatchesResponse {
  status: string;
  data: {
    batches: UploadBatch[];
  };
}
export interface AnalysisResponse {
  status: string;
  data: {
    analysis: BranchAnalysis[];
  };
}
export interface ResultImportResponse {
  status: string;
  data: {
    batchId: string | null;
    importedCount: number;
    totalRows: number;
    error?: string; 
  };
  newCount?: number; 
  updatedCount?: number; 
  skippedCount?: number; 
  errors?: Array<{ row: number; message: string; data: Record<string, unknown> }>; 
}


export interface ResultDeleteBatchResponse {
  status: string;
  data: {
    deletedCount: number;
  };
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

// Timetable
export type TimetableStatus = 'draft' | 'published' | 'archived' | 'pending_approval';
export type TimetableEntryType = 'lecture' | 'lab' | 'tutorial' | 'break' | 'other';

export interface TimetableEntry {
    dayOfWeek: DayOfWeek;
    startTime: string; 
    endTime: string;   
    courseOfferingId?: string; 
    courseId: string; 
    courseName?: string; // For display
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
    createdBy?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    // Auto-generation metadata
    generationType?: 'manual' | 'auto_genetic' | 'auto_constraint';
    optimizationScore?: number;
    constraints?: TimetableConstraints;
    conflicts?: TimetableConflict[];
}

// Faculty Preferences for Timetable Generation
export interface FacultyPreference {
    id: string;
    facultyId: string;
    academicYear: string;
    semester: number;
    preferredCourses: CoursePreference[];
    timePreferences: TimePreference[];
    roomPreferences: string[]; // Room IDs
    maxHoursPerWeek: number;
    maxConsecutiveHours: number;
    unavailableSlots: TimeSlot[];
    workingDays: DayOfWeek[];
    priority: number; // Based on seniority, 1-10
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface CoursePreference {
    courseId: string;
    preference: 'high' | 'medium' | 'low';
    expertise: number; // 1-10 scale
    previouslyTaught: boolean;
    maxSections?: number;
}

export interface TimePreference {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    preference: 'preferred' | 'available' | 'avoid';
}

export interface TimeSlot {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
}

export interface TimetableConstraints {
    // Hard constraints (must be satisfied)
    noFacultyConflicts: boolean;
    noRoomConflicts: boolean;
    noStudentConflicts: boolean;
    respectFacultyUnavailability: boolean;
    respectRoomCapacity: boolean;
    
    // Soft constraints (preferred but not mandatory)
    respectFacultyPreferences: boolean;
    balanceWorkload: boolean;
    minimizeGaps: boolean;
    preferMorningSlots: boolean;
    groupSimilarCourses: boolean;
    
    // Custom constraints
    maxConsecutiveHours: number;
    maxDailyHours: number;
    lunchBreakRequired: boolean;
    lunchBreakStart: string;
    lunchBreakEnd: string;
}

export interface TimetableConflict {
    type: 'faculty' | 'room' | 'student' | 'time' | 'capacity' | 'room_conflict';
    severity: 'critical' | 'major' | 'minor' | 'high';
    description: string;
    affectedEntries: number[]; // indices in entries array
    suggestions?: string[];
    batchId?: string;
    roomId?: string;
    facultyId?: string;
    dayOfWeek?: string;
    timeSlot?: string;
}

export interface AutoGenerationRequest {
    academicYear: string;
    semester: number;
    batchIds: string[];
    algorithm: 'genetic' | 'constraint_satisfaction' | 'hybrid';
    constraints: TimetableConstraints;
    maxIterations?: number;
    populationSize?: number;
    mutationRate?: number;
    crossoverRate?: number;
    considerPreferences: boolean;
}

export interface AutoGenerationResult {
    success: boolean;
    timetables: Timetable[];
    optimizationScore: number;
    executionTime: number;
    iterations: number;
    conflicts: TimetableConflict[];
    recommendations: string[];
}

// Notification System Types
export type NotificationType = 
  | 'timetable_published' 
  | 'timetable_updated' 
  | 'class_cancelled' 
  | 'room_changed' 
  | 'faculty_changed'
  | 'schedule_conflict'
  | 'workload_alert'
  | 'maintenance_scheduled'
  | 'approval_pending'
  | 'approval_approved'
  | 'approval_rejected'
  | 'info' | 'success' | 'warning' | 'error' | 'update' | 'reminder' 
  | 'assignment_new' | 'assignment_graded' 
  | 'enrollment_request' | 'enrollment_approved' | 'enrollment_rejected' | 'enrollment_withdrawn'
  | 'project_status_change' | 'project_location_update' | 'event_schedule_update' | 'event_results_published'
  | 'meeting_scheduled' | 'new_material';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'whatsapp';

export type StakeholderType = 
  | 'student' 
  | 'faculty' 
  | 'hod' 
  | 'room_manager' 
  | 'lab_assistant' 
  | 'admin' 
  | 'parent'
  | 'dean'
  | 'registrar';

export interface NotificationPreference {
  id: string;
  userId: string;
  stakeholderType: StakeholderType;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    in_app: boolean;
    whatsapp: boolean;
  };
  notificationTypes: {
    [key in NotificationType]: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  userId?: string;
  recipientId: string;
  recipientType: StakeholderType;
  channels: NotificationChannel[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: {
    timetableId?: string;
    entryId?: string;
    roomId?: string;
    batchId?: string;
    facultyId?: string;
    programId?: string;
    changes?: TimetableChange[];
  };
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  scheduledAt?: Timestamp;
  sentAt?: Timestamp;
  readAt?: Timestamp;
  isRead?: boolean;
  link?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TimetableChange {
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: Timestamp;
  changedBy: string;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  stakeholderType: StakeholderType;
  channel: NotificationChannel;
  subject: string;
  template: string;
  variables: string[];
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Stakeholder View Types
export interface StudentTimetableView {
  studentId: string;
  currentClass?: {
    subject: string;
    faculty: string;
    room: string;
    startTime: string;
    endTime: string;
    timeRemaining?: number;
  };
  nextClass?: {
    subject: string;
    faculty: string;
    room: string;
    startTime: string;
    timeUntil?: number;
  };
  todaySchedule: ClassScheduleEntry[];
  weekSchedule: { [day: string]: ClassScheduleEntry[] };
  announcements: AnnouncementEntry[];
  conflicts: StudentConflict[];
  attendanceRequests?: AttendanceRequest[];
}

export interface ClassScheduleEntry {
  id: string;
  subject: string;
  subjectCode: string;
  faculty: string;
  room: string;
  building: string;
  startTime: string;
  endTime: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'exam';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
  changes?: {
    isChanged: boolean;
    originalRoom?: string;
    originalTime?: string;
    reason?: string;
  };
  materials?: {
    required: string[];
    recommended: string[];
  };
}

export interface FacultyTimetableView {
  facultyId: string;
  facultyName?: string;
  department?: string;
  totalCourses?: number;
  weeklyHours?: number;
  totalStudents?: number;
  assignedTimetables?: Timetable[];
  courseDistribution?: Array<{name: string; hours: number; color: string; courseName: string; percentage: number}>;
  performanceMetrics?: {
    attendance: number; 
    engagement: number;
    satisfaction: number;
    completion: number;
    completedClasses: number;
    remainingClasses: number;
    attendanceRate: number;
    satisfactionScore: number;
  };
  workloadAnalysis?: {
    weeklyHours: number;
    maxWeeklyHours: number;
    currentHours: number;
    maxHours: number;
    utilizationPercentage: number;
    courseCount: number;
    studentCount: number;
    overloadHours?: number;
    lectureHours: number;
    labHours: number;
    tutorialHours: number;
  };
  workloadAlerts?: WorkloadAlert[];
  currentClass?: {
    subject: string;
    batch: string;
    room: string;
    studentsCount: number;
    startTime: string;
    endTime: string;
    timeRemaining?: number;
  };
  nextClass?: {
    subject: string;
    batch: string;
    room: string;
    startTime: string;
    timeUntil?: number;
    studentsCount: number;
  };
  todaySchedule: FacultyScheduleEntry[];
  weekSchedule: { [day: string]: FacultyScheduleEntry[] };
  workloadSummary: {
    hoursToday: number;
    hoursThisWeek: number;
    maxWeeklyHours: number;
    consecutiveHours: number;
    maxConsecutiveHours: number;
    utilizationScore: number;
    status: 'underloaded' | 'optimal' | 'overloaded';
  };
  pendingTasks: FacultyTask[];
  alerts: FacultyAlert[];
}

export interface FacultyScheduleEntry {
  id: string;
  subject: string;
  subjectCode: string;
  batch: string;
  program: string;
  room: string;
  building: string;
  startTime: string;
  endTime: string;
  studentsCount: number;
  type: 'lecture' | 'lab' | 'tutorial' | 'exam';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  materials?: {
    uploaded: string[];
    pending: string[];
  };
  attendance?: {
    taken: boolean;
    present: number;
    total: number;
  };
}

export interface HODDashboardView {
  departmentId: string;
  departmentName: string;
  summary: {
    totalFaculty: number;
    activeFaculty: number;
    totalClasses: number;
    scheduledToday: number;
    roomsUtilized: number;
    averageUtilization: number;
  };
  facultyWorkload: {
    optimal: number;
    overloaded: number;
    underloaded: number;
  };
  todayHighlights: DepartmentHighlight[];
  alerts: DepartmentAlert[];
  pendingApprovals: ApprovalRequest[];
  roomUtilization: RoomUtilizationSummary[];
  upcomingEvents: DepartmentEvent[];
}

export interface RoomManagerView {
  buildingId: string;
  buildingName: string;
  floorId?: string;
  rooms: RoomStatus[];
  utilization: {
    current: number;
    target: number;
    peak: string;
    lowest: string;
  };
  maintenanceSchedule: MaintenanceEntry[];
  bookingRequests: BookingRequest[];
  alerts: RoomAlert[];
}

export interface RoomStatusInfo {
  id: string;
  roomNumber: string;
  name: string;
  type: string;
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  currentOccupancy?: {
    subject: string;
    faculty: string;
    studentsCount: number;
    startTime: string;
    endTime: string;
    timeRemaining: number;
  };
  nextBooking?: {
    subject: string;
    faculty: string;
    startTime: string;
    timeUntil: number;
  };
  equipment: {
    projector: boolean;
    computer: boolean;
    ac: boolean;
    wifi: boolean;
    whiteboard: boolean;
  };
  issues: RoomIssue[];
}

// Supporting Types
export interface AnnouncementEntry {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'urgent' | 'exam' | 'event';
  targetAudience: string[];
  publishedBy: string;
  publishedAt: Timestamp;
  expiresAt?: Timestamp;
}

export interface StudentConflict {
  type: 'schedule_overlap' | 'room_unavailable' | 'faculty_absent';
  description: string;
  affectedClasses: string[];
  severity: 'low' | 'medium' | 'high';
  resolution?: string;
}

export interface AttendanceRequest {
  classId: string;
  subject: string;
  date: string;
  status: 'pending' | 'marked_present' | 'marked_absent';
  deadline: Timestamp;
}

export interface FacultyTask {
  id: string;
  type: 'attendance' | 'material_upload' | 'grading' | 'evaluation';
  title: string;
  description: string;
  dueDate: Timestamp;
  priority: 'low' | 'medium' | 'high';
  relatedClass?: string;
}

export interface FacultyAlert {
  id: string;
  type: 'workload' | 'schedule_change' | 'room_change' | 'student_issue';
  message: string;
  severity: 'info' | 'warning' | 'error';
  actionRequired: boolean;
  actionUrl?: string;
}

export interface WorkloadAlert {
  id: string;
  type: 'overload' | 'underload' | 'imbalance';
  message: string;
  description?: string;
  severity: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recommendation?: string;
}

export interface DepartmentHighlight {
  type: 'achievement' | 'alert' | 'milestone' | 'resource_update';
  title: string;
  description: string;
  timestamp: Timestamp;
  priority: 'low' | 'medium' | 'high';
}

export interface DepartmentAlert {
  id: string;
  type: 'faculty_workload' | 'room_conflict' | 'schedule_issue' | 'resource_shortage';
  faculty?: string;
  room?: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  actionRequired: boolean;
  assignedTo?: string;
}

export interface ApprovalRequest {
  id: string;
  type: 'timetable_change' | 'leave_request' | 'resource_booking' | 'schedule_override';
  requestedBy: string;
  requestedAt: Timestamp;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected';
  approvalDeadline?: Timestamp;
}

export interface RoomUtilizationSummary {
  roomId: string;
  roomNumber: string;
  utilizationPercentage: number;
  hoursScheduled: number;
  totalHours: number;
  peakTime: string;
  status: 'underutilized' | 'optimal' | 'overutilized';
}

export interface DepartmentEvent {
  id: string;
  title: string;
  type: 'exam' | 'meeting' | 'workshop' | 'seminar' | 'holiday';
  startTime: Timestamp;
  endTime: Timestamp;
  location?: string;
  attendees?: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface MaintenanceEntry {
  id: string;
  roomId: string;
  type: 'cleaning' | 'repair' | 'upgrade' | 'inspection';
  description: string;
  scheduledAt: Timestamp;
  duration: number; // minutes
  assignedTo: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface BookingRequest {
  id: string;
  roomId: string;
  requestedBy: string;
  requestType: 'class' | 'meeting' | 'event' | 'maintenance';
  startTime: Timestamp;
  endTime: Timestamp;
  purpose: string;
  attendeeCount?: number;
  equipmentNeeded?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface RoomAlert {
  id: string;
  roomId: string;
  type: 'maintenance_due' | 'equipment_failure' | 'overcapacity' | 'booking_conflict';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  reportedAt: Timestamp;
  resolvedAt?: Timestamp;
  assignedTo?: string;
}

export interface RoomIssue {
  id: string;
  type: 'equipment' | 'cleanliness' | 'hvac' | 'network' | 'furniture';
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  reportedBy: string;
  reportedAt: Timestamp;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
}

// Curriculum
export interface Curriculum { 
    id: string;
    programId: string;
    version: string; 
    effectiveDate: Timestamp; 
    courses: Array<{ 
        courseId: string;
        // Legacy fields for backward compatibility
        semester: number;
        isElective: boolean;
        // New fields for enhanced functionality
        isActive?: boolean; // Whether this course is active in this curriculum version
        customSemester?: number; // Optional override if different from course default
        isCustomElective?: boolean; // Optional override if different from course default
    }>; 
    status: 'draft' | 'active' | 'archived';
    isAutoGenerated?: boolean; // Whether this was auto-generated from course data
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Examination
export type ExaminationType = 'End Semester Theory' | 'End Semester Practical/Viva' | 'Mid Semester' | 'Internal Continuous Evaluation' | 'Other';
export type ExaminationStatus = 'scheduled' | 'ongoing' | 'completed' | 'postponed' | 'cancelled';

export interface ExaminationTimeTableEntry {
  id?: string; 
  examinationId: string;
  courseId: string;
  courseName?: string; // For display
  date: Timestamp; 
  startTime: string; 
  endTime: string;   
  roomId?: string; 
  roomIds?: string[]; 
  invigilatorIds?: string[]; 
  notes?: string;
}

export interface Examination { 
    id: string;
    name: string; 
    gtuExamCode?: string;
    academicYear: string;
    examType: ExaminationType;
    startDate: Timestamp; 
    endDate: Timestamp;   
    programIds: string[]; 
    status: ExaminationStatus;
    examinationTimeTable?: ExaminationTimeTableEntry[];
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Faculty Assignment
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

// Project Fair Types
export type ProjectEventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export interface ProjectEventScheduleItem {
  time: string;
  activity: string;
  location: string;
  coordinator: {
    userId: string;
    name: string;
  };
  notes?: string;
}
export interface ProjectEvent {
  id: string;
  name: string;
  description?: string;
  academicYear: string;
  eventDate: Timestamp;
  registrationStartDate: Timestamp;
  registrationEndDate: Timestamp;
  status: ProjectEventStatus;
  isActive: boolean;
  publishResults?: boolean; 
  schedule?: ProjectEventScheduleItem[];
  departments?: string[]; 
  createdBy?: string; 
  updatedBy?: string; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProjectTeamMember {
  userId: string; 
  name: string; 
  enrollmentNo: string; 
  role: string; 
  isLeader: boolean;
  joinedAt?: Timestamp;
}

export interface ProjectTeam {
  id: string;
  name: string;
  description?: string;
  department: string; 
  members: ProjectTeamMember[];
  eventId: string; 
  maxMembers?: number;
  status?: 'active' | 'inactive' | 'completed';
  createdBy?: string; 
  updatedBy?: string; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProjectRequirements {
  power: boolean;
  internet: boolean;
  specialSpace: boolean;
  otherRequirements?: string;
}

export interface ProjectGuide {
  userId: string; 
  name: string;   
  department: string; 
  contactNumber?: string;
}

export interface ProjectEvaluationScore {
  criteriaId: string; 
  score: number;
  comments?: string;
}

export interface ProjectEvaluation {
  completed: boolean;
  score?: number; 
  feedback?: string;
  juryId?: string; 
  evaluatedAt?: Timestamp;
  criteriaScores?: ProjectEvaluationScore[]; 
}

export type ProjectStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed' | 'evaluated';

export interface Project {
  id: string;
  title: string;
  category: string; 
  abstract: string;
  department: string; 
  status: ProjectStatus;
  requirements: ProjectRequirements;
  guide: ProjectGuide;
  teamId: string; 
  eventId: string; 
  locationId?: string; 
  deptEvaluation?: ProjectEvaluation;
  centralEvaluation?: ProjectEvaluation;
  rank?: number; 
  prize?: string; 
  certificateUrl?: string;
  createdBy?: string; 
  updatedBy?: string; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProjectLocation {
  id: string; 
  locationId: string; 
  section: string; 
  position: number; 
  department?: string; 
  eventId: string; 
  projectId?: string; 
  isAssigned: boolean;
  notes?: string;
  createdBy?: string; 
  updatedBy?: string; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Course Materials
export type CourseMaterialFileType = 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'txt' | 'zip' | 'link' | 'video' | 'image' | 'other';

export interface CourseMaterial {
  id: string;
  courseOfferingId: string; 
  title: string;
  description?: string;
  fileType: CourseMaterialFileType;
  filePathOrUrl: string; 
  fileName?: string; 
  fileSize?: number; 
  uploadedBy: string; 
  uploadedAt: Timestamp;
  updatedAt?: Timestamp;
  
  // Additional fields for dashboard and resources
  isVisible?: boolean;
  type?: string; // Material type for categorization
  uploadDate?: Timestamp; // Alias for uploadedAt
  fileUrl?: string; // Direct file URL
  externalUrl?: string; // External link URL
}

// Extended Notification System for backward compatibility
export interface ExtendedNotification {
  id: string;
  userId: string; 
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string; 
  createdAt: Timestamp;
  updatedAt: Timestamp;
  relatedEntityId?: string; 
  relatedEntityType?: string; 
}


// For Project Fair API responses
export interface CertificateInfo {
  projectId: string;
  title: string;
  teamName?: string;
  teamMembers?: string[];
  departmentName?: string;
  score?: number;
  rank?: number;
  certificateType: 'participation' | 'department-winner' | 'institute-winner';
  eventName: string;
  eventDate: string; 
  downloadUrl: string;
}

export interface WinnersResponse {
  departmentWinners: Array<{
      department: Department; 
      winners: Array<Project & { rank: number }>;
  }>;
  instituteWinners: Array<Project & { rank: number }>;
}


// For Feedback Analysis
export interface FeedbackDataRow {
  Year: string;
  Term: string;
  Branch: string;
  Sem: string;
  Term_Start: string;
  Term_End: string;
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
  Score?: number; 
  [key: string]: string | number | undefined; 
}

export interface SubjectScore {
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
  Score: number; // Overall subject score
}

export interface FacultyScore {
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
  Score: number; // Overall faculty score
}

export interface SemesterScore {
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
  Score: number; // Overall semester score
}

export interface BranchScore {
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
  Score: number; // Overall branch score
}

export interface TermYearScore {
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
  Score: number; // Overall term-year score
}

export interface AnalysisResult {
  id: string;
  originalFileName: string;
  analysisDate: string; // ISO string
  subject_scores: SubjectScore[];
  faculty_scores: FacultyScore[];
  semester_scores: SemesterScore[];
  branch_scores: BranchScore[];
  term_year_scores: TermYearScore[];
  correlation_matrix?: { [key: string]: { [key: string]: number } }; 
  markdownReport: string; 
  rawFeedbackData?: string; 
}

// Reporting & Analytics Types

export interface AttendanceSummaryFilters {
  instituteId?: string;
  departmentId?: string;
  programId?: string;
  batchId?: string;
  courseOfferingId?: string;
  academicYear?: string;
  semester?: number;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
}

export interface CourseAttendanceSummary {
  courseOfferingId: string;
  courseName: string;
  courseCode: string;
  totalStudents: number;
  totalClasses: number;
  averageAttendance: number; // Percentage
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
}
export interface BatchAttendanceSummary {
  batchId: string;
  batchName: string;
  totalStudents: number;
  overallAttendance: number; // Percentage for the batch
  courseSummaries: CourseAttendanceSummary[];
}
export interface ProgramAttendanceSummary {
  programId: string;
  programName: string;
  programCode: string;
  totalStudents: number;
  overallAttendance: number; // Percentage for the program
  batchSummaries: BatchAttendanceSummary[];
}
export interface DepartmentAttendanceSummary {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  totalStudents: number;
  overallAttendance: number; // Percentage for the department
  programSummaries: ProgramAttendanceSummary[];
}
export interface InstituteAttendanceSummary {
  instituteId: string;
  instituteName: string;
  instituteCode: string;
  totalStudents: number;
  overallAttendance: number; // Percentage for the institute
  departmentSummaries: DepartmentAttendanceSummary[];
}

export interface OverallAttendanceSummary {
    totalStudents: number;
    totalClassesTakenOverall: number; 
    overallAttendancePercentage: number;
}

export interface AggregatedAttendanceReport {
  filtersApplied: AttendanceSummaryFilters;
  overallSummary: OverallAttendanceSummary;
  byInstitute: InstituteAttendanceSummary[];
  generatedAt: Timestamp;
}


export interface StudentStrengthData {
  instituteId: string;
  instituteName: string;
  instituteCode: string;
  totalStudents: number;
  programs: Array<{
    programId: string;
    programName: string;
    programCode: string;
    totalStudents: number;
    batches: Array<{
      batchId: string;
      batchName: string;
      totalStudents: number;
      semesters: Array<{
        semester: number;
        totalStudents: number;
      }>;
    }>;
  }>;
}

export interface StudentStrengthReport {
  byInstitute: StudentStrengthData[];
  overallTotal: number;
}

export interface CourseEnrollmentData {
    courseOfferingId: string;
    courseName: string;
    courseCode: string;
    programName: string;
    batchName: string;
    semester: number;
    academicYear: string;
    facultyNames: string[];
    enrolledStudents: number;
    maxIntake?: number; 
}

// Leave Management Types
export type LeaveType = 
  | 'casual' 
  | 'sick' 
  | 'earned' 
  | 'maternity' 
  | 'paternity' 
  | 'duty' 
  | 'unpaid' 
  | 'other';

export type LeaveRequestStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'cancelled'
  | 'taken';

export interface LeaveRequest {
  id: string;
  userId: string;
  facultyId?: string; // Faculty ID for faculty-specific leave requests
  type: LeaveType;
  leaveType?: LeaveType; // Alias for type
  reason: string;
  remarks?: string; // Additional remarks/comments
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  fromDate?: string; // Alias for startDate
  toDate?: string; // Alias for endDate
  isHalfDay?: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  totalDays: number;
  days?: number; // Alias for totalDays
  status: LeaveRequestStatus;
  appliedAt: Timestamp;
  actionTakenAt?: Timestamp;
  actionTakenBy?: string; // User ID of the person who approved/rejected
  rejectionReason?: string;
  
  // Additional administrative fields
  instituteId?: string;
  departmentId?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Project Fair Statistics and Evaluation Data
export interface ProjectStatistics {
  totalProjects: number;
  total: number;
  evaluated: number;
  pending: number;
  averageScore: number;
  departmentStats: Array<{
    departmentId: string;
    departmentName: string;
    projectCount: number;
  }>;
  departmentWise: Record<string, number>;
  statusCounts: Record<ProjectStatus, number>;
  data?: ProjectStatistics;
}

export interface EvaluationData {
  projectId: string;
  evaluatorId: string;
  scores: Record<string, number>;
  comments?: string;
  timestamp: Timestamp;
}

export interface CategoryCounts {
  [category: string]: number;
}

// ===============================
// ALLOCATION TYPES (Phase 2)
// ===============================

export interface AllocationSession {
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

export interface CourseAllocation {
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

export interface AllocationConflict {
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

// Extended interfaces for UI display
export interface AllocationSessionWithDetails extends AllocationSession {
  createdByName?: string;
  programNames?: string[];
  totalAllocations?: number;
}

export interface CourseAllocationWithDetails extends CourseAllocation {
  courseName?: string;
  facultyName?: string;
  facultyDepartment?: string;
  programName?: string;
  semesterLabel?: string;
}

export interface AllocationConflictWithDetails extends AllocationConflict {
  facultyName?: string;
  courseNames?: string[];
  sessionName?: string;
}

