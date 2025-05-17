

export type Timestamp = string; // ISO 8601 format: "YYYY-MM-DDTHH:mm:ss.sssZ"

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
    academicRemarks?: string; // Added for admin notes on academic progress
    
    instituteId?: string; 
    photoURL?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    isActive?: boolean; 
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
    staffCategory?: StaffCategory; 
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
  members?: Array<{
    userId: string;
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
  admissionCapacity?: number; 
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

export type CourseOfferingStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
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
    status: CourseOfferingStatus;
    programId?: string; 
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
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
  errors?: Array<{ row: number; message: string; data: any }>; 
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
export type TimetableStatus = 'draft' | 'published' | 'archived';
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
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Curriculum
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
}

export interface ProjectTeam {
  id: string;
  name: string;
  department: string; 
  members: ProjectTeamMember[];
  eventId: string; 
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
}

// Notification System
export type NotificationType = 
  | 'info' | 'success' | 'warning' | 'error' | 'update' | 'reminder' 
  | 'assignment_new' | 'assignment_graded' 
  | 'enrollment_request' | 'enrollment_approved' | 'enrollment_rejected' | 'enrollment_withdrawn'
  | 'project_status_change' | 'project_location_update' | 'event_schedule_update' | 'event_results_published'
  | 'meeting_scheduled' | 'new_material';

export interface Notification {
  id: string;
  userId: string; 
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string; 
  createdAt: Timestamp;
  updatedAt?: Timestamp;
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

