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
  | string; // To allow for dynamic committee roles like 'cwan_gpp_convenor'


export interface User {
    id: string;
    email: string; 
    username?: string; 
    displayName: string; 
    fullName?: string; // As per GTU records: SURNAME NAME FATHERNAME
    firstName?: string;
    middleName?: string;
    lastName?: string;
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
    password?: string; // Only for creation/update, not for retrieval
}
export type SystemUser = User;


export interface Role {
    id: string;
    name: string; 
    code: UserRole; 
    description: string;
    permissions: string[]; 
    isSystemRole?: boolean; 
    isCommitteeRole?: boolean; // True if this role is specific to a committee
    committeeId?: string; // If it's a committee role, which committee it belongs to
    committeeCode?: string; // e.g., "CWAN"
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
    department: string; // Department ID, derived from Program
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
    
    fullNameGtuFormat?: string; // As per GTU records: SURNAME NAME FATHERNAME
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
    
    department: string; // Department Name (string) or ID
    designation?: string;
    jobType?: JobType;
    instType?: string; // GTU specific, e.g., 'DI' for Diploma Institute
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
  programId?: string; // Added to link result to a program
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

export interface ResultFilterParams {
  branchName?: string;
  semester?: number;
  academicYear?: string;
  examid?: number;
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
  newCount?: number; // For GTU import
  updatedCount?: number; // For GTU import
  skippedCount?: number; // For GTU import
  errors?: Array<{ row: number; message: string; data: any }>; // For GTU import
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
  departments?: string[]; // Array of Department IDs
  createdBy?: string; // User ID
  updatedBy?: string; // User ID
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProjectTeamMember {
  userId: string;
  name: string; // Denormalized for display
  enrollmentNo: string;
  role: string; // e.g., Team Leader, Developer, Designer
  isLeader: boolean;
}

export interface ProjectTeam {
  id: string;
  name: string;
  department: string; // Department ID
  members: ProjectTeamMember[];
  eventId: string; // ProjectEvent ID
  createdBy?: string; // User ID
  updatedBy?: string; // User ID
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
  userId: string; // Faculty User ID
  name: string;   // Denormalized
  department: string; // Department ID of Guide
  contactNumber?: string;
}

export interface ProjectEvaluationScore {
  criteriaId: string; // e.g., 'innovation', 'implementation'
  score: number;
  comments?: string;
}

export interface ProjectEvaluation {
  completed: boolean;
  score?: number; // Overall score (e.g., percentage)
  feedback?: string;
  juryId?: string; // User ID of Jury member
  evaluatedAt?: Timestamp;
  criteriaScores?: ProjectEvaluationScore[]; // Detailed scoring
}

export interface Project {
  id: string;
  title: string;
  category: string; // e.g., IoT, Web App, Hardware
  abstract: string;
  department: string; // Department ID
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed' | 'evaluated';
  requirements: ProjectRequirements;
  guide: ProjectGuide;
  teamId: string; // ProjectTeam ID
  eventId: string; // ProjectEvent ID
  locationId?: string; // Assigned stall/location ID (from ProjectLocation)
  deptEvaluation?: ProjectEvaluation;
  centralEvaluation?: ProjectEvaluation;
  rank?: number; // Overall rank in the fair
  prize?: string; // Prize won, if any
  certificateUrl?: string;
  createdBy?: string; // User ID (likely student leader or faculty)
  updatedBy?: string; // User ID
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProjectLocation {
  id: string;
  locationId: string; // User-friendly ID, e.g., A-01, B-12
  section: string; // e.g., A, B, North Wing
  position: number; // e.g., 1, 2, 12
  department?: string; // Department ID (if locations are dept-specific)
  eventId: string; // ProjectEvent ID
  projectId?: string; // Project ID if assigned
  isAssigned: boolean;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
    
```
  </change>
  <change>
    <file>src/app/api/project-events/route.ts</file>
    <description>Adapt ProjectEvent API route to match the updated ProjectEvent entity definition.</description>
    <content><![CDATA[// src/app/api/project-events/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectEvent, ProjectEventStatus } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: ProjectEvent[] | undefined;
}

const now = new Date().toISOString();

if (!global.__API_PROJECT_EVENTS_STORE__ || global.__API_PROJECT_EVENTS_STORE__.length === 0) {
  global.__API_PROJECT_EVENTS_STORE__ = [
    { 
      id: "event_techfest_2024_gpp", 
      name: "TechFest 2024",
      academicYear: "2024-25",
      description: "Annual technical project fair.",
      eventDate: "2025-03-15T00:00:00.000Z",
      registrationStartDate: "2024-12-01T00:00:00.000Z",
      registrationEndDate: "2025-01-31T00:00:00.000Z",
      status: "upcoming",
      isActive: true,
      departments: ["dept_ce_gpp", "dept_me_gpp"],
      createdBy: "user_admin_gpp",
      updatedBy: "user_admin_gpp",
      createdAt: now,
      updatedAt: now,
      schedule: [
        { time: "09:00 AM - 10:00 AM", activity: "Inauguration", location: "Auditorium", coordinator: { userId: "user_faculty_cs01_gpp", name: "Prof. CS01" }, notes: "Chief Guest to arrive by 8:45 AM" },
        { time: "10:00 AM - 01:00 PM", activity: "Project Expo Round 1", location: "Main Building Stalls", coordinator: { userId: "user_hod_ce_gpp", name: "HOD CE" }, notes: "Judges to visit stalls" }
      ],
      publishResults: false,
    },
  ];
}
let projectEventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__;

const generateEventId = (): string => `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isActiveParam = searchParams.get('isActive');

  let filteredEvents = [...projectEventsStore];

  if (isActiveParam === 'true') {
    filteredEvents = filteredEvents.filter(event => event.isActive);
  } else if (isActiveParam === 'false') {
    filteredEvents = filteredEvents.filter(event => !event.isActive);
  }
  
  filteredEvents.sort((a, b) => {
    const dateA = a.eventDate ? parseISO(a.eventDate).getTime() : 0;
    const dateB = b.eventDate ? parseISO(b.eventDate).getTime() : 0;
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    if (a.isActive) return dateA - dateB;
    return dateB - dateA; 
  });

  return NextResponse.json(filteredEvents);
}

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json() as Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'schedule'>;

    if (!eventData.name || !eventData.name.trim()) {
      return NextResponse.json({ message: 'Event Name is required.' }, { status: 400 });
    }
    if (!eventData.academicYear || !eventData.academicYear.trim()) {
      return NextResponse.json({ message: 'Academic Year is required.' }, { status: 400 });
    }
    if (!eventData.eventDate || !isValid(parseISO(eventData.eventDate))) {
      return NextResponse.json({ message: 'Valid Event Date is required.' }, { status: 400 });
    }
    if (!eventData.registrationStartDate || !isValid(parseISO(eventData.registrationStartDate))) {
      return NextResponse.json({ message: 'Valid Registration Start Date is required.' }, { status: 400 });
    }
    if (!eventData.registrationEndDate || !isValid(parseISO(eventData.registrationEndDate))) {
      return NextResponse.json({ message: 'Valid Registration End Date is required.' }, { status: 400 });
    }
    if (parseISO(eventData.registrationStartDate) >= parseISO(eventData.eventDate) || parseISO(eventData.registrationEndDate) >= parseISO(eventData.eventDate) || parseISO(eventData.registrationStartDate) >= parseISO(eventData.registrationEndDate)) {
        return NextResponse.json({ message: 'Event dates are illogical. Please check registration and event dates.' }, { status: 400 });
    }
    if (!eventData.status) {
        return NextResponse.json({ message: 'Event status is required.' }, { status: 400 });
    }


    const currentTimestamp = new Date().toISOString();
    const newEvent: ProjectEvent = {
      id: generateEventId(),
      name: eventData.name.trim(),
      description: eventData.description?.trim() || undefined,
      academicYear: eventData.academicYear.trim(),
      eventDate: eventData.eventDate,
      registrationStartDate: eventData.registrationStartDate,
      registrationEndDate: eventData.registrationEndDate,
      status: eventData.status,
      isActive: eventData.isActive === undefined ? true : eventData.isActive,
      publishResults: eventData.publishResults === undefined ? false : eventData.publishResults,
      schedule: [], 
      departments: eventData.departments || [],
      createdBy: "user_admin_placeholder", 
      updatedBy: "user_admin_placeholder",
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    projectEventsStore.push(newEvent);
    global.__API_PROJECT_EVENTS_STORE__ = projectEventsStore;
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating project event:', error);
    return NextResponse.json({ message: 'Error creating project event', error: (error as Error).message }, { status: 500 });
  }
}
```
  </change>
  <change>
    <file>src/app/api/project-events/[id]/route.ts</file>
    <description>Adapt ProjectEvent by ID API route to match the updated ProjectEvent entity definition.</description>
    <content><![CDATA[// src/app/api/project-events/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectEvent, ProjectEventStatus, ProjectEventScheduleItem } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: ProjectEvent[] | undefined;
}

if (!global.__API_PROJECT_EVENTS_STORE__) {
  global.__API_PROJECT_EVENTS_STORE__ = [];
}
let projectEventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const event = projectEventsStore.find(e => e.id === id);
  if (event) {
    return NextResponse.json(event);
  }
  return NextResponse.json({ message: 'Event not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const eventDataToUpdate = await request.json() as Partial<Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;
    const eventIndex = projectEventsStore.findIndex(e => e.id === id);

    if (eventIndex === -1) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    const existingEvent = projectEventsStore[eventIndex];

    // Validations
    if (eventDataToUpdate.name !== undefined && !eventDataToUpdate.name.trim()) {
        return NextResponse.json({ message: 'Event Name cannot be empty.' }, { status: 400 });
    }
    if (eventDataToUpdate.academicYear !== undefined && !eventDataToUpdate.academicYear.trim()) {
        return NextResponse.json({ message: 'Academic Year cannot be empty.' }, { status: 400 });
    }
    
    const newEventDate = eventDataToUpdate.eventDate ? parseISO(eventDataToUpdate.eventDate) : parseISO(existingEvent.eventDate);
    const newRegStartDate = eventDataToUpdate.registrationStartDate ? parseISO(eventDataToUpdate.registrationStartDate) : parseISO(existingEvent.registrationStartDate);
    const newRegEndDate = eventDataToUpdate.registrationEndDate ? parseISO(eventDataToUpdate.registrationEndDate) : parseISO(existingEvent.registrationEndDate);

    if (!isValid(newEventDate) || !isValid(newRegStartDate) || !isValid(newRegEndDate)) {
         return NextResponse.json({ message: 'Invalid date format provided.' }, { status: 400 });
    }
    if (newRegStartDate >= newEventDate || newRegEndDate >= newEventDate || newRegStartDate >= newRegEndDate) {
        return NextResponse.json({ message: 'Event dates are illogical. Please check registration and event dates.' }, { status: 400 });
    }
     if (eventDataToUpdate.status && !['upcoming', 'ongoing', 'completed', 'cancelled'].includes(eventDataToUpdate.status)) {
        return NextResponse.json({ message: 'Invalid event status.' }, { status: 400 });
    }


    const updatedEvent: ProjectEvent = {
      ...existingEvent,
      ...eventDataToUpdate,
      name: eventDataToUpdate.name?.trim() || existingEvent.name,
      description: eventDataToUpdate.description !== undefined ? eventDataToUpdate.description.trim() || undefined : existingEvent.description,
      academicYear: eventDataToUpdate.academicYear?.trim() || existingEvent.academicYear,
      eventDate: eventDataToUpdate.eventDate || existingEvent.eventDate,
      registrationStartDate: eventDataToUpdate.registrationStartDate || existingEvent.registrationStartDate,
      registrationEndDate: eventDataToUpdate.registrationEndDate || existingEvent.registrationEndDate,
      updatedBy: "user_admin_placeholder", // TODO: Get actual user ID
      updatedAt: new Date().toISOString(),
    };

    projectEventsStore[eventIndex] = updatedEvent;
    global.__API_PROJECT_EVENTS_STORE__ = projectEventsStore;
    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error(`Error updating event ${id}:`, error);
    return NextResponse.json({ message: `Error updating event ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const initialLength = projectEventsStore.length;
  projectEventsStore = projectEventsStore.filter(e => e.id !== id);

  if (projectEventsStore.length === initialLength) {
    return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  }
  global.__API_PROJECT_EVENTS_STORE__ = projectEventsStore;
  return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
}

// Specific route for updating schedule
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { id } = params; // This is the event ID
    if (request.nextUrl.pathname.endsWith('/schedule')) { // Check if it's a schedule update
        try {
            const { schedule } = await request.json() as { schedule: ProjectEventScheduleItem[] };
            const eventIndex = projectEventsStore.findIndex(e => e.id === id);

            if (eventIndex === -1) {
                return NextResponse.json({ message: 'Event not found for schedule update' }, { status: 404 });
            }

            projectEventsStore[eventIndex].schedule = schedule;
            projectEventsStore[eventIndex].updatedAt = new Date().toISOString();
            projectEventsStore[eventIndex].updatedBy = "user_admin_placeholder_schedule_patch"; // Placeholder
            global.__API_PROJECT_EVENTS_STORE__ = projectEventsStore;

            return NextResponse.json(projectEventsStore[eventIndex]);
        } catch (error) {
            console.error(`Error updating schedule for event ${id}:`, error);
            return NextResponse.json({ message: `Error updating schedule for event ${id}`, error: (error as Error).message }, { status: 500 });
        }
    }
    return NextResponse.json({ message: 'Invalid endpoint for PATCH' }, { status: 405 });
}
```
  </change>
  <change>
    <file>src/lib/api/projectEvents.ts</file>
    <description>Create a new service file for ProjectEvent CRUD operations.</description>
    <content><![CDATA[// src/lib/api/projectEvents.ts
import type { ProjectEvent, Department, ProjectEventScheduleItem } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const projectEventService = {
  async getAllEvents(filters: { isActive?: boolean } = {}): Promise<ProjectEvent[]> {
    const queryParams = new URLSearchParams();
    if (filters.isActive !== undefined) {
      queryParams.append('isActive', String(filters.isActive));
    }
    const response = await fetch(`${API_BASE_URL}/project-events?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch project events' }));
      throw new Error(errorData.message || 'Failed to fetch project events');
    }
    return response.json();
  },

  async getEventById(id: string): Promise<ProjectEvent> {
    const response = await fetch(`${API_BASE_URL}/project-events/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch event with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch event with id ${id}`);
    }
    return response.json();
  },

  async createEvent(eventData: Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'schedule'>): Promise<ProjectEvent> {
    const response = await fetch(`${API_BASE_URL}/project-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create event' }));
      throw new Error(errorData.message || 'Failed to create event');
    }
    return response.json();
  },

  async updateEvent(id: string, eventData: Partial<Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>): Promise<ProjectEvent> {
    const response = await fetch(`${API_BASE_URL}/project-events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update event' }));
      throw new Error(errorData.message || 'Failed to update event');
    }
    return response.json();
  },

  async deleteEvent(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/project-events/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete event with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete event with id ${id}`);
    }
  },
  
  async getEventSchedule(eventId: string): Promise<{ schedule: ProjectEventScheduleItem[], eventDate: string }> {
    // This is a simplified mock. In a real API, you'd fetch this from the event's data.
    const event = await this.getEventById(eventId);
    return { schedule: event.schedule || [], eventDate: event.eventDate };
  },

  async updateEventSchedule(eventId: string, scheduleData: { schedule: ProjectEventScheduleItem[] }): Promise<ProjectEvent> {
    const response = await fetch(`${API_BASE_URL}/project-events/${eventId}/schedule`, { // Assuming a PATCH endpoint for schedule
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update event schedule' }));
      throw new Error(errorData.message || 'Failed to update event schedule');
    }
    return response.json();
  },
  
  async publishEventResults(eventId: string, publish: boolean): Promise<ProjectEvent> {
     const response = await fetch(`${API_BASE_URL}/project-events/${eventId}`, { // Use main update endpoint
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publishResults: publish }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to ${publish ? 'publish' : 'unpublish'} results` }));
      throw new Error(errorData.message || `Failed to ${publish ? 'publish' : 'unpublish'} results`);
    }
    return response.json();
  },

  async importEvents(file: File, departments: Department[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number, errors?: any[] }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('departments', JSON.stringify(departments));

    const response = await fetch(`${API_BASE_URL}/project-events/import`, {
      method: 'POST',
      body: formData,
    });
    const responseData = await response.json();
    if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import project events.';
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        detailedMessage += ` Specific issues: ${responseData.errors.slice(0,3).map((e: any) => e.message || JSON.stringify(e.data)).join('; ')}${responseData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return responseData;
  },
};
```
  </change>
  <change>
    <file>src/app/api/project-events/[id]/schedule/route.ts</file>
    <description>Add a dedicated API route for updating an event's schedule via PATCH.</description>
    <content><![CDATA[// src/app/api/project-events/[id]/schedule/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectEvent, ProjectEventScheduleItem } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: ProjectEvent[] | undefined;
}

if (!global.__API_PROJECT_EVENTS_STORE__) {
  global.__API_PROJECT_EVENTS_STORE__ = [];
}
let projectEventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__;

interface RouteParams {
  params: {
    id: string; // Event ID
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: eventId } = params;
  try {
    const { schedule } = await request.json() as { schedule: ProjectEventScheduleItem[] };
    
    if (!Array.isArray(schedule)) {
        return NextResponse.json({ message: 'Invalid schedule data format. Expected an array.'}, { status: 400});
    }

    const eventIndex = projectEventsStore.findIndex(e => e.id === eventId);

    if (eventIndex === -1) {
      return NextResponse.json({ message: 'Event not found for schedule update' }, { status: 404 });
    }

    projectEventsStore[eventIndex].schedule = schedule;
    projectEventsStore[eventIndex].updatedAt = new Date().toISOString();
    projectEventsStore[eventIndex].updatedBy = "user_admin_placeholder_schedule_patch"; // TODO: Get actual user ID

    global.__API_PROJECT_EVENTS_STORE__ = projectEventsStore;

    return NextResponse.json(projectEventsStore[eventIndex]);
  } catch (error) {
    console.error(`Error updating schedule for event ${eventId}:`, error);
    return NextResponse.json({ message: `Error updating schedule for event ${eventId}`, error: (error as Error).message }, { status: 500 });
  }
}
```
  </change>
  <change>
    <file>src/app/api/project-events/import/route.ts</file>
    <description>Create API route for importing project events from CSV.</description>
    <content><![CDATA[// src/app/api/project-events/import/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectEvent, Department, ProjectEventStatus } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { isValid, parseISO, format } from 'date-fns';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: ProjectEvent[] | undefined;
}
if (!global.__API_PROJECT_EVENTS_STORE__) {
  global.__API_PROJECT_EVENTS_STORE__ = [];
}
let projectEventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__;

const generateIdForImport = (): string => `evt_imp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const EVENT_STATUS_OPTIONS_LOWER: string[] = ['upcoming', 'ongoing', 'completed', 'cancelled'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const departmentsJson = formData.get('departments') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }
    if (!departmentsJson) {
      return NextResponse.json({ message: 'Department data for mapping is missing.' }, { status: 400 });
    }
    const clientDepartments: Department[] = JSON.parse(departmentsJson);

    const fileText = await file.text();
    const { data: parsedData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, ''),
      dynamicTyping: false,
    });

    if (parseErrors.length > 0) {
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row + 2}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Project Events CSV file.', errors: errorMessages }, { status: 400 });
    }

    const header = Object.keys(parsedData[0] || {}).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
    const requiredHeaders = ['name', 'academicyear', 'eventdate', 'registrationstartdate', 'registrationenddate', 'status'];
    if (!requiredHeaders.every(rh => header.includes(rh))) {
      const missing = requiredHeaders.filter(rh => !header.includes(rh));
      return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const importErrors: { row: number; message: string; data: unknown }[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const rowIndex = i + 2;

      const name = row.name?.toString().trim();
      const academicYear = row.academicyear?.toString().trim();
      const eventDateStr = row.eventdate?.toString().trim();
      const regStartDateStr = row.registrationstartdate?.toString().trim();
      const regEndDateStr = row.registrationenddate?.toString().trim();
      const statusRaw = row.status?.toString().trim().toLowerCase();
      const status = EVENT_STATUS_OPTIONS_LOWER.includes(statusRaw) ? statusRaw as ProjectEventStatus : undefined;

      if (!name || !academicYear || !eventDateStr || !regStartDateStr || !regEndDateStr || !status) {
        importErrors.push({ row: rowIndex, message: "Missing required fields: name, academicYear, eventDate, registrationStartDate, registrationEndDate, or status.", data: row });
        skippedCount++; continue;
      }
      
      let eventDate: string, registrationStartDate: string, registrationEndDate: string;
      try {
        eventDate = format(parseISO(eventDateStr), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        registrationStartDate = format(parseISO(regStartDateStr), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        registrationEndDate = format(parseISO(regEndDateStr), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        if(!isValid(parseISO(eventDate)) || !isValid(parseISO(registrationStartDate)) || !isValid(parseISO(registrationEndDate))) throw new Error("Invalid date format");
      } catch(e) {
        importErrors.push({ row: rowIndex, message: `Invalid date format. Use YYYY-MM-DD or ISO string. Error: ${(e as Error).message}`, data: row });
        skippedCount++; continue;
      }
      if (parseISO(registrationStartDate) >= parseISO(eventDate) || parseISO(registrationEndDate) >= parseISO(eventDate) || parseISO(registrationStartDate) >= parseISO(registrationEndDate)) {
        importErrors.push({ row: rowIndex, message: 'Event dates are illogical.', data: row });
        skippedCount++; continue;
      }

      const departmentIds: string[] = [];
      const deptNames = row.departmentnames?.toString().split(';').map((n:string) => n.trim()).filter(Boolean);
      const deptCodes = row.departmentcodes?.toString().split(';').map((c:string) => c.trim().toUpperCase()).filter(Boolean);

      if (deptNames && deptNames.length > 0) {
        deptNames.forEach((deptName: string) => {
          const foundDept = clientDepartments.find(d => d.name.toLowerCase() === deptName.toLowerCase());
          if (foundDept && !departmentIds.includes(foundDept.id)) departmentIds.push(foundDept.id);
          else if (!foundDept) importErrors.push({row: rowIndex, message: `Department name '${deptName}' not found.`, data: row});
        });
      } else if (deptCodes && deptCodes.length > 0) {
         deptCodes.forEach((deptCode: string) => {
          const foundDept = clientDepartments.find(d => d.code.toUpperCase() === deptCode);
          if (foundDept && !departmentIds.includes(foundDept.id)) departmentIds.push(foundDept.id);
          else if (!foundDept) importErrors.push({row: rowIndex, message: `Department code '${deptCode}' not found.`, data: row});
        });
      }


      const eventDataFromCsv: Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'schedule'> = {
        name, academicYear, eventDate, registrationStartDate, registrationEndDate, status,
        description: row.description?.toString().trim() || undefined,
        isActive: String(row.isactive).toLowerCase() === 'true' || row.isactive === '1' || row.isactive === 1,
        publishResults: String(row.publishresults).toLowerCase() === 'true' || row.publishresults === '1' || row.publishresults === 1,
        departments: departmentIds.length > 0 ? departmentIds : undefined,
      };

      const idFromCsv = row.id?.toString().trim();
      let existingEventIndex = -1;

      if (idFromCsv) {
        existingEventIndex = projectEventsStore.findIndex(e => e.id === idFromCsv);
      } else {
        existingEventIndex = projectEventsStore.findIndex(e => e.name.toLowerCase() === name.toLowerCase() && e.academicYear === academicYear);
      }

      if (existingEventIndex !== -1) {
        projectEventsStore[existingEventIndex] = { ...projectEventsStore[existingEventIndex], ...eventDataFromCsv, schedule: projectEventsStore[existingEventIndex].schedule || [], updatedAt: now };
        updatedCount++;
      } else {
        if (projectEventsStore.some(e => e.name.toLowerCase() === name.toLowerCase() && e.academicYear === academicYear)) {
            importErrors.push({ row: rowIndex, message: `Event with name '${name}' and academic year '${academicYear}' already exists.`, data: row });
            skippedCount++; continue;
        }
        const newEvent: ProjectEvent = {
          id: idFromCsv || generateIdForImport(),
          ...eventDataFromCsv,
          schedule: [],
          createdBy: 'user_import_placeholder',
          updatedBy: 'user_import_placeholder',
          createdAt: now,
          updatedAt: now,
        };
        projectEventsStore.push(newEvent);
        newCount++;
      }
    }

    global.__API_PROJECT_EVENTS_STORE__ = projectEventsStore;

    if (importErrors.length > 0) {
        return NextResponse.json({ 
            message: `Project Events import partially completed with ${importErrors.length} issues.`, 
            newCount, 
            updatedCount, 
            skippedCount,
            errors: importErrors 
        }, { status: 207 }); 
    }
    return NextResponse.json({ message: 'Project Events imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Critical error during project event import process:', error);
    return NextResponse.json({ message: 'Critical error during project event import process.', error: (error as Error).message }, { status: 500 });
  }
}

```
  </change>
  <change>
    <file>src/app/admin/project-fair/events/[eventId]/dashboard/page.tsx</file>
    <description>New page for a specific Project Fair Event Dashboard.</description>
    <content><![CDATA[// src/app/admin/project-fair/events/[eventId]/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Users, Briefcase, CalendarCheck, Award, MapPin, ListChecks, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectEvent, Project, ProjectTeam, ProjectLocation, ProjectStatistics } from '@/types/entities';
import { projectEventService } from '@/lib/api/projectEvents';
import { projectService } from '@/lib/api/projects'; // Assuming this service exists
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProjectEventDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<ProjectEvent | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!eventId) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [eventData, projectsData, statsData] = await Promise.all([
          projectEventService.getEventById(eventId),
          projectService.getAllProjects({ eventId: eventId }), // Assuming getAllProjects filters by eventId
          projectService.getProjectStatistics(eventId) // Assuming this service exists
        ]);
        setEvent(eventData);
        setProjects(projectsData);
        setStats(statsData);
      } catch (error) {
        console.error("Failed to load event dashboard data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load event dashboard data." });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [eventId, toast]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!event) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground mb-4">Project Fair Event not found.</p>
        <Button onClick={() => router.push('/admin/project-fair/events')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events List
        </Button>
      </div>
    );
  }

  const dashboardCards = [
    { title: "Total Projects", value: stats?.total || projects.length, icon: Briefcase, color: "text-blue-500", href: `/admin/project-fair/events/${eventId}/projects` },
    { title: "Total Teams", value: new Set(projects.map(p => p.teamId)).size, icon: Users, color: "text-green-500", href: `/admin/project-fair/events/${eventId}/teams` },
    { title: "Evaluated Projects", value: stats?.evaluated || projects.filter(p => p.deptEvaluation?.completed || p.centralEvaluation?.completed).length, icon: CalendarCheck, color: "text-purple-500", href: `/admin/project-fair/events/${eventId}/evaluations` },
    { title: "Winners Published", value: event.publishResults ? "Yes" : "No", icon: Award, color: event.publishResults ? "text-yellow-500" : "text-gray-500", href: `/admin/project-fair/events/${eventId}/results` },
  ];

  const managementLinks = [
    { label: "Manage Projects", href: `/admin/project-fair/events/${eventId}/projects`, icon: Briefcase },
    { label: "Manage Teams", href: `/admin/project-fair/events/${eventId}/teams`, icon: Users },
    { label: "Assign Locations", href: `/admin/project-fair/events/${eventId}/locations`, icon: MapPin },
    { label: "Manage Schedule", href: `/admin/project-fair/events/${eventId}/schedule`, icon: ListChecks },
    { label: "Jury & Evaluations", href: `/admin/project-fair/events/${eventId}/evaluations`, icon: Award },
    { label: "Results & Certificates", href: `/admin/project-fair/events/${eventId}/results`, icon: CalendarCheck },
    { label: "Event Settings", href: `/admin/project-fair/events/edit/${eventId}`, icon: Settings },
  ];

  return (
    <div className="space-y-8">
       <Button variant="outline" onClick={() => router.push('/admin/project-fair/events')} className="mb-4 print:hidden">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Events
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">{event.name}</CardTitle>
          <CardDescription>
            {event.academicYear} | {format(new Date(event.eventDate), "PPP")} | Status: <span className={`font-semibold ${event.status === 'completed' ? 'text-green-600' : event.status === 'ongoing' ? 'text-blue-600' : 'text-yellow-600'}`}>{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">{event.description}</p>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {dashboardCards.map((card, idx) => (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  {card.href && (
                    <Link href={card.href} passHref>
                      <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">View/Manage</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
                <CardTitle className="text-xl">Event Management Links</CardTitle>
                <CardDescription>Quick access to manage different aspects of this event.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {managementLinks.map(link => (
                    <Link key={link.href} href={link.href} passHref>
                        <Button variant="outline" className="w-full justify-start gap-3 p-4 h-auto">
                            <link.icon className="h-5 w-5 text-primary"/>
                            <span className="text-sm">{link.label}</span>
                        </Button>
                    </Link>
                ))}
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
  );
}
```
  </change>
  <change>
    <file>src/app/admin/project-fair/events/edit/[eventId]/page.tsx</file>
    <description>New page for editing a specific Project Fair Event.</description>
    <content><![CDATA[// src/app/admin/project-fair/events/edit/[eventId]/page.tsx
"use client";
import ProjectEventForm from '@/components/admin/project-fair/ProjectEventForm'; // Assuming the form is generic
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { projectEventService } from '@/lib/api/projectEvents';
import type { ProjectEvent } from '@/types/entities';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export default function EditProjectEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<ProjectEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (eventId) {
      const fetchEvent = async () => {
        setIsLoading(true);
        try {
          const eventData = await projectEventService.getEventById(eventId);
          setEvent(eventData);
        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "Could not load event data for editing."});
          router.push('/admin/project-fair/events');
        }
        setIsLoading(false);
      };
      fetchEvent();
    }
  }, [eventId, router, toast]);

  const handleEventUpdated = (updatedEvent: ProjectEvent) => {
    toast({ title: "Success", description: `Event "${updatedEvent.name}" updated successfully.` });
    router.push(`/admin/project-fair/events/${updatedEvent.id}/dashboard`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!event) {
    return <div className="text-center py-10">Event not found or failed to load.</div>;
  }

  return (
    <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4 print:hidden">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Dashboard
        </Button>
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Edit Project Fair Event</CardTitle>
                <CardDescription>Modify the details for "{event.name}".</CardDescription>
            </CardHeader>
            <CardContent>
                <ProjectEventForm
                    existingEvent={event}
                    onEventSaved={handleEventUpdated}
                    onCancel={() => router.push(`/admin/project-fair/events/${eventId}/dashboard`)}
                />
            </CardContent>
        </Card>
    </div>
  );
}
```
  </change>
  <change>
    <file>src/components/admin/project-fair/ProjectEventForm.tsx</file>
    <description>New generic form component for creating/editing Project Fair Events.</description>
    <content><![CDATA[// src/components/admin/project-fair/ProjectEventForm.tsx
"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Loader2, Save, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import type { ProjectEvent, Department, ProjectEventStatus } from '@/types/entities';
import { projectEventService } from '@/lib/api/projectEvents';
import { departmentService } from '@/lib/api/departments';

interface ProjectEventFormProps {
  existingEvent?: ProjectEvent | null;
  onEventSaved: (event: ProjectEvent) => void;
  onCancel: () => void;
}

const EVENT_STATUS_OPTIONS: { value: ProjectEventStatus, label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const ProjectEventForm: React.FC<ProjectEventFormProps> = ({ existingEvent, onEventSaved, onCancel }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [name, setName] = useState(existingEvent?.name || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [academicYear, setAcademicYear] = useState(existingEvent?.academicYear || `${new Date().getFullYear()}-${(new Date().getFullYear() % 100) + 1}`);
  const [eventDate, setEventDate] = useState<Date | undefined>(existingEvent?.eventDate ? parseISO(existingEvent.eventDate) : undefined);
  const [registrationStartDate, setRegistrationStartDate] = useState<Date | undefined>(existingEvent?.registrationStartDate ? parseISO(existingEvent.registrationStartDate) : undefined);
  const [registrationEndDate, setRegistrationEndDate] = useState<Date | undefined>(existingEvent?.registrationEndDate ? parseISO(existingEvent.registrationEndDate) : undefined);
  const [status, setStatus] = useState<ProjectEventStatus>(existingEvent?.status || 'upcoming');
  const [isActive, setIsActive] = useState(existingEvent?.isActive === undefined ? true : existingEvent.isActive);
  const [publishResults, setPublishResults] = useState(existingEvent?.publishResults || false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(existingEvent?.departments || []);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const deptData = await departmentService.getAllDepartments();
        setDepartments(deptData);
      } catch (error) {
        toast({ variant: "destructive", title: "Error loading departments" });
      }
    };
    fetchDepts();
  }, [toast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !academicYear.trim() || !eventDate || !registrationStartDate || !registrationEndDate) {
      toast({ variant: "destructive", title: "Missing Information", description: "Name, Academic Year, and all Dates are required." });
      return;
    }
    if (registrationStartDate >= eventDate || registrationEndDate >= eventDate || registrationStartDate >= registrationEndDate) {
      toast({variant: "destructive", title: "Invalid Dates", description: "Event dates are illogical."});
      return;
    }

    setIsSubmitting(true);
    const eventDataPayload: Partial<Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'schedule'>> & { schedule?: ProjectEvent['schedule'] } = {
      name: name.trim(),
      description: description.trim() || undefined,
      academicYear: academicYear.trim(),
      eventDate: format(eventDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      registrationStartDate: format(registrationStartDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      registrationEndDate: format(registrationEndDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      status,
      isActive,
      publishResults,
      departments: selectedDepartments,
      schedule: existingEvent?.schedule || [], // Preserve existing schedule or init as empty
    };

    try {
      let savedEvent: ProjectEvent;
      if (existingEvent && existingEvent.id) {
        savedEvent = await projectEventService.updateEvent(existingEvent.id, eventDataPayload);
      } else {
        // For create, ensure no ID is passed. The service layer should handle Omit correctly.
        const createData = eventDataPayload as Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'schedule'> & {schedule: []};
        savedEvent = await projectEventService.createEvent(createData);
      }
      onEventSaved(savedEvent);
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><Label htmlFor="eventName">Event Name *</Label><Input id="eventName" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting} /></div>
        <div><Label htmlFor="academicYear">Academic Year *</Label><Input id="academicYear" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} required disabled={isSubmitting} /></div>
      </div>
      <div><Label htmlFor="eventDescription">Description</Label><Textarea id="eventDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={isSubmitting} /></div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div><Label htmlFor="eventDate">Event Date *</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !eventDate && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{eventDate ? format(eventDate, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus /></PopoverContent></Popover></div>
        <div><Label htmlFor="registrationStartDate">Registration Start *</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !registrationStartDate && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{registrationStartDate ? format(registrationStartDate, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={registrationStartDate} onSelect={setRegistrationStartDate} initialFocus /></PopoverContent></Popover></div>
        <div><Label htmlFor="registrationEndDate">Registration End *</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !registrationEndDate && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{registrationEndDate ? format(registrationEndDate, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={registrationEndDate} onSelect={setRegistrationEndDate} initialFocus /></PopoverContent></Popover></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div><Label htmlFor="status">Status *</Label><Select value={status} onValueChange={(v) => setStatus(v as ProjectEventStatus)} required disabled={isSubmitting}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EVENT_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select></div>
        <div className="flex items-center space-x-2 pt-2"><Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} disabled={isSubmitting} /><Label htmlFor="isActive">Is Active</Label></div>
        <div className="flex items-center space-x-2 pt-2"><Switch id="publishResults" checked={publishResults} onCheckedChange={setPublishResults} disabled={isSubmitting} /><Label htmlFor="publishResults">Publish Results</Label></div>
      </div>
      
      <div>
        <Label>Target Departments (Optional)</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-md max-h-48 overflow-y-auto bg-muted/20 mt-1">
            {departments.map(dept => (
                <div key={dept.id} className="flex items-center space-x-2">
                    <Checkbox 
                        id={`dept-check-${dept.id}`} 
                        checked={selectedDepartments.includes(dept.id)}
                        onCheckedChange={(checked) => {
                            setSelectedDepartments(prev => 
                                checked ? [...prev, dept.id] : prev.filter(id => id !== dept.id)
                            );
                        }}
                    />
                    <Label htmlFor={`dept-check-${dept.id}`} className="text-sm font-normal cursor-pointer">{dept.name} ({dept.code})</Label>
                </div>
            ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}><XCircle className="mr-2 h-4 w-4" />Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {existingEvent?.id ? "Save Changes" : "Create Event"}
        </Button>
      </div>
    </form>
  );
};

export default ProjectEventForm;
```
  </change>
  <change>
    <file>src/app/layout.tsx</file>
    <description>Add Project Fair Events link to admin sidebar.</description>
    <content><![CDATA[// src/app/layout.tsx
"use client"; 

import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster";
import { 
    Home, Settings, LogOut, UserCircle, BotMessageSquare, Briefcase, BookOpen, Award, CalendarCheck, 
    Loader2, UserCog, BookUser, Building2, BookCopy, ClipboardList, Landmark, 
    Building, DoorOpen, Users2 as CommitteeIcon, Users as UsersIconLucide, FileText as FileTextIcon, 
    BarChart3, CalendarRange, UserCheck as AttendanceIcon, Settings2 as ResourceIcon, Activity, Clock,
    ListChecks, BookOpenCheck, FilePieChart, BookOpenText, Upload
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { AppLogo } from '@/components/app-logo';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { UserRole as UserRoleCode, Role } from '@/types/entities'; 
import { roleService } from '@/lib/api/roles'; 
import { useToast } from '@/hooks/use-toast';


interface User {
  id?: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  dataAiHint?: string;
  activeRole: UserRoleCode; 
  availableRoles: UserRoleCode[]; 
}

const DEFAULT_USER: User = {
  name: 'Guest User',
  activeRole: 'unknown',
  availableRoles: ['unknown'],
  avatarUrl: 'https://picsum.photos/seed/guest/40/40',
  dataAiHint: 'user avatar'
};

const adminNavItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'admin-dashboard' }, 
  { href: '/admin/users', icon: UsersIconLucide, label: 'User Management', id: 'admin-users' },
  { href: '/admin/roles', icon: UserCog, label: 'Role Management', id: 'admin-roles' },
  { href: '/admin/institutes', icon: Landmark, label: 'Institutes', id: 'admin-institutes'},
  { href: '/admin/buildings', icon: Building, label: 'Buildings', id: 'admin-buildings'},
  { href: '/admin/rooms', icon: DoorOpen, label: 'Rooms', id: 'admin-rooms'},
  { href: '/admin/committees', icon: CommitteeIcon, label: 'Committees', id: 'admin-committees'},
  { href: '/admin/students', icon: BookUser, label: 'Student Mgt.', id: 'admin-students' },
  { href: '/admin/faculty', icon: UserCog, label: 'Faculty Mgt.', id: 'admin-faculty' }, 
  { href: '/admin/departments', icon: Building2, label: 'Departments', id: 'admin-departments' },
  { href: '/admin/programs', icon: BookCopy, label: 'Programs', id: 'admin-programs' },
  { href: '/admin/batches', icon: CalendarRange, label: 'Batches', id: 'admin-batches' },
  { href: '/admin/courses', icon: ClipboardList, label: 'Course Mgt.', id: 'admin-courses' },
  { href: '/admin/curriculum', icon: BookOpenText, label: 'Curriculum Mgt.', id: 'admin-curriculum' },
  { href: '/admin/assessments', icon: FileTextIcon, label: 'Assessments', id: 'admin-assessments' },
  { href: '/faculty/attendance/mark', icon: CalendarCheck, label: 'Mark Attendance', id: 'admin-mark-attendance-link' },
  { href: '/admin/resource-allocation', icon: ResourceIcon, label: 'Resource Allocation', id: 'admin-resource-allocation' },
  { href: '/admin/timetables', icon: Clock, label: 'Timetables', id: 'admin-timetables'},
  { href: '/admin/feedback-analysis', icon: BotMessageSquare, label: 'Feedback Analysis', id: 'admin-feedback' },
  { href: '/admin/reporting-analytics', icon: BarChart3, label: 'Reports & Analytics', id: 'admin-reporting' },
  { href: '/admin/project-fair/events', icon: Briefcase, label: 'Project Fair Events', id: 'admin-project-fair-events-link'},
  { href: '/admin/results/import', icon: Upload, label: 'Import Results', id: 'admin-import-results-link'}, // Changed Icon
  { href: '/admin/settings', icon: Settings, label: 'System Settings', id: 'admin-settings-link'},
];


const baseNavItems: Record<UserRoleCode, Array<{ href: string; icon: React.ElementType; label: string; id: string }>> = {
  admin: adminNavItems,
  student: [
    { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'student-dashboard' },
    { href: '/student/profile', icon: UserCircle, label: 'My Profile', id: 'student-profile' },
    { href: '/student/timetable', icon: Clock, label: 'My Timetable', id: 'student-timetable' },
    { href: '/student/attendance', icon: AttendanceIcon, label: 'My Attendance', id: 'student-attendance' },
    { href: '/student/courses', icon: BookOpen, label: 'My Courses', id: 'student-courses' },
    { href: '/student/assignments', icon: FileTextIcon, label: 'Assignments', id: 'student-assignments'},
    { href: '/student/results', icon: Award, label: 'My Results', id: 'student-results' },
    { href: '/student/materials', icon: BookOpenCheck, label: 'Study Materials', id: 'student-materials' },
    { href: '/project-fair/student', icon: FileTextIcon, label: 'My Project', id: 'student-project' }, 
  ],
  faculty: [
    { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'faculty-dashboard' },
    { href: '/faculty/profile', icon: UserCircle, label: 'My Profile', id: 'faculty-profile' },
    { href: '/faculty/timetable', icon: Clock, label: 'My Timetable', id: 'faculty-timetable' },
    { href: '/faculty/courses', icon: BookOpen, label: 'My Courses', id: 'faculty-courses' }, 
    { href: '/faculty/students', icon: UsersIconLucide, label: 'My Students', id: 'faculty-students'}, 
    { href: '/faculty/attendance/mark', icon: CalendarCheck, label: 'Mark Attendance', id: 'faculty-mark-attendance' },
    { href: '/faculty/attendance/reports', icon: BarChart3, label: 'Attendance Reports', id: 'faculty-attendance-reports' },
    { href: '/faculty/assessments/grade', icon: FilePieChart, label: 'Grade Assessments', id: 'faculty-grade-assessments' },
    { href: '/project-fair/jury', icon: FileTextIcon, label: 'Evaluate Projects', id: 'faculty-evaluate' }, 
    { href: '/admin/feedback-analysis', icon: BotMessageSquare, label: 'Feedback Analysis', id: 'faculty-feedback' }, 
  ],
  hod: [
    { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'hod-dashboard' },
    { href: '/admin/institutes', icon: Landmark, label: 'Institutes', id: 'hod-institutes'},
    { href: '/admin/buildings', icon: Building, label: 'Buildings', id: 'hod-buildings'},
    { href: '/admin/rooms', icon: DoorOpen, label: 'Rooms', id: 'hod-rooms'},
    { href: '/admin/committees', icon: CommitteeIcon, label: 'Committees', id: 'hod-committees'},
    { href: '/admin/departments', icon: Building2, label: 'My Department', id: 'hod-department' }, 
    { href: '/admin/programs', icon: BookCopy, label: 'Programs (Dept)', id: 'hod-programs' },
    { href: '/admin/batches', icon: CalendarRange, label: 'Batches (Dept)', id: 'hod-batches' },
    { href: '/admin/courses', icon: ClipboardList, label: 'Courses (Dept)', id: 'hod-courses' },
    { href: '/admin/curriculum', icon: BookOpenText, label: 'Curriculum (Dept)', id: 'hod-curriculum' },
    { href: '/admin/assessments', icon: FileTextIcon, label: 'Assessments (Dept)', id: 'hod-assessments' },
    { href: '/admin/attendance', icon: AttendanceIcon, label: 'Attendance (Dept)', id: 'hod-attendance-records' },
    { href: '/admin/resource-allocation', icon: ResourceIcon, label: 'Resource Allocation', id: 'hod-resource-allocation' },
    { href: '/admin/faculty', icon: UserCog, label: 'Faculty (Dept)', id: 'hod-faculty' },
    { href: '/admin/students', icon: BookUser, label: 'Students (Dept)', id: 'hod-students' },
    { href: '/admin/feedback-analysis', icon: BotMessageSquare, label: 'Feedback Analysis', id: 'hod-feedback' },
    { href: '/admin/reporting-analytics', icon: BarChart3, label: 'Reports & Analytics', id: 'hod-reporting' },
    { href: '/admin/project-fair/events', icon: Briefcase, label: 'Project Fair Admin', id: 'hod-project-fair' }, 
  ],
  jury: [
    { href: '/dashboard', icon: Home, label: 'Dashboard', id: 'jury-dashboard' },
    { href: '/project-fair/jury', icon: FileTextIcon, label: 'Evaluate Projects', id: 'jury-evaluate' }, 
  ],
  committee_convener: [ 
    { href: '/dashboard', icon: Home, label: 'Convener Dashboard', id: 'convener-dashboard' },
    { href: '/dashboard/committee', icon: CommitteeIcon, label: 'My Committee', id: 'convener-my-committee'},
    { href: '/committee/meetings', icon: CalendarCheck, label: 'Meetings', id: 'convener-meetings'}, 
    { href: '/admin/resource-allocation/rooms', icon: DoorOpen, label: 'Book Room', id: 'convener-book-room' }
  ],
  committee_co_convener: [
    { href: '/dashboard', icon: Home, label: 'Co-Convener Dashboard', id: 'co-convener-dashboard' },
    { href: '/dashboard/committee', icon: CommitteeIcon, label: 'My Committee', id: 'co-convener-my-committee'},
    { href: '/committee/meetings', icon: CalendarCheck, label: 'Meetings', id: 'co-convener-meetings'}, 
    { href: '/admin/resource-allocation/rooms', icon: DoorOpen, label: 'Book Room', id: 'co_convener-book-room' }
  ],
  committee_member: [
    { href: '/dashboard', icon: Home, label: 'Member Dashboard', id: 'member-dashboard' },
    { href: '/dashboard/committee', icon: CommitteeIcon, label: 'My Committee', id: 'member-my-committee'},
    { href: '/committee/tasks/my', icon: ListChecks, label: 'My Tasks', id: 'member-my-tasks'} 
  ],
  super_admin: adminNavItems, 
  dte_admin: [{ href: '/dashboard', icon: Home, label: 'DTE Dashboard', id: 'dte-admin-dashboard' }], 
  gtu_admin: [{ href: '/dashboard', icon: Home, label: 'GTU Dashboard', id: 'gtu-admin-dashboard' }], 
  institute_admin: [
    ...adminNavItems.filter(item => ![
      '/admin/users', '/admin/roles', '/admin/institutes' 
    ].includes(item.href)), 
    { href: '/dashboard', icon: Home, label: 'Institute Dashboard', id: 'institute-admin-dashboard' },
  ],
  department_admin: [ 
    { href: '/dashboard', icon: Home, label: 'Department Dashboard', id: 'department-admin-dashboard' },
    { href: '/admin/programs', icon: BookCopy, label: 'Programs (Dept)', id: 'dept-admin-programs' },
    { href: '/admin/batches', icon: CalendarRange, label: 'Batches (Dept)', id: 'dept-admin-batches' },
    { href: '/admin/courses', icon: ClipboardList, label: 'Courses (Dept)', id: 'dept-admin-courses' },
    { href: '/admin/curriculum', icon: BookOpenText, label: 'Curriculum (Dept)', id: 'dept-admin-curriculum' },
    { href: '/admin/assessments', icon: FileTextIcon, label: 'Assessments (Dept)', id: 'dept-admin-assessments' },
    { href: '/admin/attendance', icon: AttendanceIcon, label: 'Attendance (Dept)', id: 'dept-admin-attendance-records' },
    { href: '/admin/faculty', icon: UserCog, label: 'Faculty (Dept)', id: 'dept-admin-faculty' },
    { href: '/admin/students', icon: BookUser, label: 'Students (Dept)', id: 'dept-admin-students' },
    { href: '/admin/resource-allocation', icon: ResourceIcon, label: 'Resource Allocation', id: 'dept-admin-resource-allocation' },
    { href: '/admin/reporting-analytics', icon: BarChart3, label: 'Reports & Analytics', id: 'dept-admin-reporting' },
  ],
  committee_admin: [
    { href: '/dashboard', icon: Home, label: 'Committee Admin DB', id: 'committee-admin-dashboard' },
    { href: '/admin/committees', icon: CommitteeIcon, label: 'Manage Committees', id: 'committee-admin-committees' },
  ],
  lab_assistant: [{ href: '/dashboard', icon: Home, label: 'Lab Assistant Dashboard', id: 'lab-assistant-dashboard' }], 
  clerical_staff: [{ href: '/dashboard', icon: Home, label: 'Clerical Dashboard', id: 'clerical-dashboard' }], 
  unknown: [], 
};


const getNavItemsForRoleCode = (roleCode: UserRoleCode): Array<{ href: string; icon: React.ElementType; label: string; id: string }> => {
  const items = baseNavItems[roleCode] || baseNavItems['unknown']; 
  
  if (roleCode.startsWith('committee_') && !['committee_admin'].includes(roleCode) && !items.find(item => item.id.includes('-my-committee'))) {
     const committeeDashboardLink = { href: '/dashboard/committee', icon: CommitteeIcon, label: 'My Committee', id: `${roleCode}-my-committee`};
     if (!items.find(item => item.id === committeeDashboardLink.id)) {
       const specificItems = baseNavItems[roleCode as keyof typeof baseNavItems] || [];
       return [committeeDashboardLink, ...specificItems.filter(item => item.href !== '/dashboard')].sort((a,b) => a.label.localeCompare(b.label));
     }
  } else if (roleCode.endsWith('_convener') && !items.find(item => item.id.includes('-my-committee'))) {
    return getNavItemsForRoleCode('committee_convener');
  } else if (roleCode.endsWith('_co_convener') && !items.find(item => item.id.includes('-my-committee'))) {
    return getNavItemsForRoleCode('committee_co_convener');
  } else if (roleCode.endsWith('_member') && !items.find(item => item.id.includes('-my-committee'))) {
    return getNavItemsForRoleCode('committee_member');
  }


  const sortedItems = [...items]; 
  sortedItems.sort((a, b) => {
    if (a.label.includes('Dashboard')) return -1;
    if (b.label.includes('Dashboard')) return 1;
    return a.label.localeCompare(b.label);
  });
  return sortedItems;
};


function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookiePart = parts.pop();
    if (cookiePart) {
      return cookiePart.split(';').shift();
    }
  }
  return undefined;
}

interface ParsedUserCookie {
  id?: string;
  email: string;
  name: string;
  availableRoles: UserRoleCode[]; 
  activeRole: UserRoleCode; 
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [allSystemRoles, setAllSystemRoles] = useState<Role[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const parseUserCookie = (): ParsedUserCookie | null => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        return JSON.parse(decodedCookie) as ParsedUserCookie;
      } catch (error) {
        console.error("Failed to parse auth_user cookie:", error);
        if (typeof document !== 'undefined') {
            document.cookie = 'auth_user=;path=/;max-age=0'; 
        }
        return null;
      }
    }
    return null;
  }

  useEffect(() => {
    setIsMounted(true); 
    const parsedUser = parseUserCookie();
    if (parsedUser) {
      setCurrentUser({
        id: parsedUser.id,
        name: parsedUser.name || parsedUser.email, 
        activeRole: parsedUser.activeRole || 'unknown',
        availableRoles: parsedUser.availableRoles && parsedUser.availableRoles.length > 0 ? parsedUser.availableRoles : ['unknown'],
        email: parsedUser.email,
        avatarUrl: `https://picsum.photos/seed/${parsedUser.email}/40/40`, 
        dataAiHint: 'user avatar',
      });
    } else {
      setCurrentUser(DEFAULT_USER);
       if (!['/login', '/signup', '/'].includes(pathname)) {
         router.push('/login');
       }
    }
    
    const fetchRoles = async () => {
        try {
            const roles = await roleService.getAllRoles();
            setAllSystemRoles(roles);
        } catch (error) {
            toast({ variant: "destructive", title: "Error loading roles", description: (error as Error).message });
        }
    };
    fetchRoles();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]); // Removed toast from deps as it's stable.


  const handleRoleChange = (newRoleCode: UserRoleCode) => {
    const parsedUser = parseUserCookie();
    if (parsedUser && parsedUser.availableRoles.includes(newRoleCode)) {
        const updatedUserPayload = { ...parsedUser, activeRole: newRoleCode }; 
        const encodedUserPayload = encodeURIComponent(JSON.stringify(updatedUserPayload));
        if (typeof document !== 'undefined') {
          document.cookie = `auth_user=${encodedUserPayload};path=/;max-age=${60 * 60 * 24 * 7}`; 
        }
        setCurrentUser(prev => ({...prev, activeRole: newRoleCode}));
        
        const roleToActivate = allSystemRoles.find(r => r.code === newRoleCode);
        
        if(roleToActivate?.isCommitteeRole && !['committee_admin', 'admin', 'super_admin', 'hod', 'institute_admin'].includes(newRoleCode) ){ 
            router.push('/dashboard/committee');
        } else { 
            router.push('/dashboard'); 
        }
        router.refresh(); 
    } else {
        const roleDetails = allSystemRoles.find(r => r.code === newRoleCode);
        toast({ variant: "destructive", title: "Role Switch Failed", description: `Role '${roleDetails?.name || newRoleCode}' is not available for your account or is invalid.`})
    }
  };
  
  const activeRoleObject = allSystemRoles.find(r => r.code === currentUser.activeRole);
  const currentNavItems = getNavItemsForRoleCode(currentUser.activeRole);
  const hideSidebar = ['/login', '/signup', '/'].includes(pathname);


  if (!isMounted) { 
    return (
       <html lang="en" suppressHydrationWarning>
         <head>
            <title>PolyManager - Loading...</title>
            <meta name="description" content="College Management System for Government Polytechnic Palanpur" />
        </head>
        <body className={`${GeistSans.variable} antialiased`} suppressHydrationWarning={true}>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <Toaster />
        </body>
      </html>
    )
  }

  if (hideSidebar) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
            <title>PolyManager</title>
            <meta name="description" content="College Management System for Government Polytechnic Palanpur" />
        </head>
        <body className={`${GeistSans.variable} antialiased`} suppressHydrationWarning={true}>
          {children}
          <Toaster />
        </body>
      </html>
    );
  }


  return (
    <html lang="en" suppressHydrationWarning>
       <head>
            <title>PolyManager</title>
            <meta name="description" content="College Management System for Government Polytechnic Palanpur" />
        </head>
      <body className={`${GeistSans.variable} antialiased`} suppressHydrationWarning={true}>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader className="p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <AppLogo className="h-8 w-auto text-sidebar-primary" />
                <h1 className="text-xl font-semibold text-sidebar-foreground">PolyManager</h1>
              </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
              <SidebarMenu>
                {currentNavItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <Link href={item.href} passHref legacyBehavior>
                      <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard')} >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 mb-4">
                {currentUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint={currentUser.dataAiHint} className="h-10 w-10 rounded-full" />
                ) : (
                  <UserCircle className="h-10 w-10 rounded-full text-sidebar-foreground" />
                )}
                <div>
                  <p className="font-semibold text-sm text-sidebar-foreground">{currentUser.name}</p>
                  <p className="text-xs text-sidebar-foreground/70 capitalize">
                    Active: {activeRoleObject?.name || currentUser.activeRole}
                  </p>
                </div>
              </div>
              {currentUser.availableRoles.length > 1 && allSystemRoles.length > 0 && (
                <div className="mb-4">
                  <Label htmlFor="role-switcher" className="text-xs text-sidebar-foreground/70 mb-1 block">Switch Role:</Label>
                  <Select value={currentUser.activeRole} onValueChange={handleRoleChange}>
                    <SelectTrigger id="role-switcher" className="w-full bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border focus:ring-sidebar-ring text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-sidebar text-sidebar-foreground border-sidebar-border">
                      {currentUser.availableRoles.map(roleCode => { 
                        const roleObj = allSystemRoles.find(sysR => sysR.code === roleCode);
                        return roleObj ? (
                          <SelectItem key={roleObj.id} value={roleObj.code} className="text-xs focus:bg-sidebar-primary focus:text-sidebar-primary-foreground">
                            {roleObj.name}
                          </SelectItem>
                        ) : null;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center justify-between">
                <Link href="/admin/settings" passHref>
                  <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
                    <Settings />
                  </Button>
                </Link>
                <ThemeToggle />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-sidebar-foreground hover:bg-sidebar-accent"
                    onClick={() => {
                       if (typeof document !== 'undefined') {
                        document.cookie = 'auth_user=;path=/;max-age=0'; 
                       }
                       router.push('/login');
                    }}
                  >
                    <LogOut />
                  </Button>
              </div>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm">
              <SidebarTrigger />
              <div className="flex items-center gap-4">
                <span className="font-semibold">Welcome, {currentUser.name}! (Role: {activeRoleObject?.name || currentUser.activeRole})</span>
              </div>
            </header>
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
    
```
  </change>
  <change>
    <file>src/app/project-fair/admin/page.tsx</file>
    <description>Main admin page for Project Fair, similar to reference ProjectFairAdmin but using Next.js routing. Redirects to event management.</description>
    <content><![CDATA[// src/app/project-fair/admin/page.tsx
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ProjectFairAdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to a more specific project fair admin page, like event management
    router.replace('/admin/project-fair/events');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">Loading Project Fair Admin...</p>
    </div>
  );
}
```
  </change>
  <change>
    <file>src/app/admin/project-fair/events/[eventId]/page.tsx</file>
    <description>Delete placeholder page for event details, replaced by [eventId]/dashboard.</description>
    <content><![CDATA[