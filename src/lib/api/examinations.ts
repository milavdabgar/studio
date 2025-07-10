// src/lib/api/examinations.ts

import type { Examination } from '@/types/entities';

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
    name: 'Mid Semester Examination - Fall 2024',
    gtuExamCode: 'GTU_MID_2024_F',
    academicYear: '2024-25',
    examType: 'Mid Semester',
    startDate: '2025-07-15T09:00:00.000Z',
    endDate: '2025-07-25T17:00:00.000Z',
    programIds: ['prog_dce_gpp', 'prog_dme_gpp'],
    status: 'scheduled',
    examinationTimeTable: [
      {
        id: 'tt_1',
        examinationId: '1',
        courseId: 'CS101',
        courseName: 'Introduction to Computer Science',
        date: '2025-07-15T09:00:00.000Z',
        startTime: '09:00',
        endTime: '11:00',
        roomIds: ['room_a101', 'room_a102'],
        invigilatorIds: ['fac_001', 'fac_002']
      }
    ],
    createdAt: '2025-06-01T10:00:00.000Z',
    updatedAt: '2025-06-01T10:00:00.000Z',
  },
  {
    id: '2',
    name: 'End Semester Examination - Fall 2024',
    gtuExamCode: 'GTU_END_2024_F',
    academicYear: '2024-25',
    examType: 'End Semester Theory',
    startDate: '2025-07-20T14:00:00.000Z',
    endDate: '2025-07-30T17:00:00.000Z',
    programIds: ['prog_dce_gpp'],
    status: 'completed',
    createdAt: '2025-06-01T10:00:00.000Z',
    updatedAt: '2025-06-01T10:00:00.000Z',
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

export async function getExaminationTimetable(_examId?: string): Promise<TimetableEntry[]> {
  void _examId; // Unused in mock implementation
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
  console.log(`Mock delete examination: ${id}`);
  return Promise.resolve(true);
}

// Service object that groups all examination-related functions
export const examinationService = {
  getAllExaminations: getExaminations,
  getExaminationById: getExamination,
  getExaminationResults,
  getExaminationTimetable,
  createExamination,
  updateExamination,
  deleteExamination,
};
