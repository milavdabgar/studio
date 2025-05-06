
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
}

export interface Department {
  id:string;
  name: string;
  code: string;
  description?: string;
  hodId?: string;
  establishmentYear?: number;
  status: 'active' | 'inactive';
}

export interface Program {
  id: string;
  name: string;
  code: string;
  description?: string;
  departmentId: string;
  durationYears?: number;
  totalSemesters?: number;
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

export type UserRole = 'admin' | 'student' | 'faculty' | 'hod' | 'jury' | 'unknown';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  status: 'active' | 'inactive';
  department?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
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
  department: string;
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
  department: string;
  designation?: string;
  jobType?: JobType;
  instType?: string; 
  dateOfBirth?: string; 
  gender?: Gender;
  maritalStatus?: string;
  joiningDate?: string; 
  status: FacultyStatus;
  aadharNumber?: string;
  panCardNumber?: string;
  gpfNpsNumber?: string;
  placeOfBirth?: string;
  nationality?: string;
  knownAs?: string;
}
