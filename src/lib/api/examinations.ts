// src/lib/api/examinations.ts

export interface Examination {
  id: string;
  courseId: string;
  title: string;
  type: 'midterm' | 'final' | 'quiz' | 'assignment';
  date: string;
  duration: number; // in minutes
  maxMarks: number;
  venue: string;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExaminationResult {
  id: string;
  examinationId: string;
  studentId: string;
  marksObtained: number;
  grade?: string;
  remarks?: string;
  evaluatedBy: string;
  evaluatedAt: string;
}

export interface TimetableEntry {
  id: string;
  courseId: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
  facultyId: string;
  type: 'lecture' | 'lab' | 'examination';
}

// Mock data for development
const mockExaminations: Examination[] = [
  {
    id: '1',
    courseId: 'CS101',
    title: 'Introduction to Computer Science - Midterm',
    type: 'midterm',
    date: '2025-07-15T09:00:00Z',
    duration: 120,
    maxMarks: 100,
    venue: 'Room A-101',
    instructions: 'Bring calculator and writing materials',
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
  },
  {
    id: '2',
    courseId: 'CS102',
    title: 'Data Structures - Final Exam',
    type: 'final',
    date: '2025-07-20T14:00:00Z',
    duration: 180,
    maxMarks: 150,
    venue: 'Room B-201',
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
  },
];

const mockResults: ExaminationResult[] = [
  {
    id: '1',
    examinationId: '1',
    studentId: 'STU001',
    marksObtained: 85,
    grade: 'A',
    evaluatedBy: 'FAC001',
    evaluatedAt: '2025-07-16T10:00:00Z',
  },
  {
    id: '2',
    examinationId: '1',
    studentId: 'STU002',
    marksObtained: 78,
    grade: 'B+',
    evaluatedBy: 'FAC001',
    evaluatedAt: '2025-07-16T10:00:00Z',
  },
];

export async function getExaminations(): Promise<Examination[]> {
  // In a real app, this would make an API call
  return Promise.resolve(mockExaminations);
}

export async function getExamination(id: string): Promise<Examination | null> {
  const exam = mockExaminations.find(e => e.id === id);
  return Promise.resolve(exam || null);
}

export async function getExaminationResults(examId: string): Promise<ExaminationResult[]> {
  const results = mockResults.filter(r => r.examinationId === examId);
  return Promise.resolve(results);
}

export async function getExaminationTimetable(examId: string): Promise<TimetableEntry[]> {
  // Mock timetable data
  const timetable: TimetableEntry[] = [
    {
      id: '1',
      courseId: 'CS101',
      day: 'Monday',
      startTime: '09:00',
      endTime: '11:00',
      venue: 'Room A-101',
      facultyId: 'FAC001',
      type: 'examination',
    },
  ];
  return Promise.resolve(timetable);
}

export async function createExamination(examination: Omit<Examination, 'id' | 'createdAt' | 'updatedAt'>): Promise<Examination> {
  const newExam: Examination = {
    ...examination,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return Promise.resolve(newExam);
}

export async function updateExamination(id: string, updates: Partial<Examination>): Promise<Examination | null> {
  const exam = mockExaminations.find(e => e.id === id);
  if (!exam) return null;
  
  const updatedExam = {
    ...exam,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return Promise.resolve(updatedExam);
}

export async function deleteExamination(id: string): Promise<boolean> {
  return Promise.resolve(true);
}
