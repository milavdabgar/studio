import { reportService } from './reports';
import type { StudentStrengthReport, CourseEnrollmentData } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Helper to create mock responses
const createMockResponse = (options: { ok: boolean; status?: number; json?: () => Promise<any>; statusText?: string }): Response => {
  return {
    ok: options.ok,
    status: options.status || (options.ok ? 200 : 500),
    statusText: options.statusText || (options.ok ? 'OK' : 'Error'),
    json: options.json || (async () => ({})),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(options),
    text: async () => JSON.stringify(await (options.json ? options.json() : {})),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    bodyUsed: false,
  } as Response;
};

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('ReportService API Tests', () => {
  const mockStudentStrengthReport: StudentStrengthReport = {
    totalStudents: 1500,
    byInstitute: [
      { instituteName: "Institute A", count: 800 },
      { instituteName: "Institute B", count: 700 }
    ],
    byProgram: [
      { programName: "Computer Science", count: 600 },
      { programName: "Electrical Engineering", count: 500 },
      { programName: "Mechanical Engineering", count: 400 }
    ],
    bySemester: [
      { semester: 1, count: 300 },
      { semester: 2, count: 300 },
      { semester: 3, count: 250 },
      { semester: 4, count: 250 },
      { semester: 5, count: 200 },
      { semester: 6, count: 200 }
    ],
    generatedAt: new Date().toISOString()
  };

  const mockCourseEnrollmentData: CourseEnrollmentData[] = [
    {
      courseId: "course1",
      courseName: "Data Structures",
      courseCode: "CS201",
      enrolledStudents: 45,
      capacity: 50,
      enrollmentPercentage: 90,
      program: "Computer Science",
      semester: 3
    },
    {
      courseId: "course2",
      courseName: "Digital Circuits",
      courseCode: "EE101",
      enrolledStudents: 38,
      capacity: 40,
      enrollmentPercentage: 95,
      program: "Electrical Engineering",
      semester: 2
    }
  ];

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getStudentStrengthReport', () => {
    it('should fetch student strength report without filters', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockStudentStrengthReport }));
      const result = await reportService.getStudentStrengthReport();
      expect(fetch).toHaveBeenCalledWith('/api/reports/student-strength?');
      expect(result).toEqual(mockStudentStrengthReport);
    });

    it('should fetch student strength report with institute filter', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockStudentStrengthReport }));
      const result = await reportService.getStudentStrengthReport({ instituteId: 'inst1' });
      expect(fetch).toHaveBeenCalledWith('/api/reports/student-strength?instituteId=inst1');
      expect(result).toEqual(mockStudentStrengthReport);
    });

    it('should fetch student strength report with academic year filter', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockStudentStrengthReport }));
      const result = await reportService.getStudentStrengthReport({ academicYear: '2024-25' });
      expect(fetch).toHaveBeenCalledWith('/api/reports/student-strength?academicYear=2024-25');
      expect(result).toEqual(mockStudentStrengthReport);
    });

    it('should fetch student strength report with multiple filters', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockStudentStrengthReport }));
      const result = await reportService.getStudentStrengthReport({ 
        instituteId: 'inst1', 
        academicYear: '2024-25' 
      });
      expect(fetch).toHaveBeenCalledWith('/api/reports/student-strength?instituteId=inst1&academicYear=2024-25');
      expect(result).toEqual(mockStudentStrengthReport);
    });

    it('should throw error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        status: 500, 
        json: async () => ({ message: "Server Error" }) 
      }));
      await expect(reportService.getStudentStrengthReport()).rejects.toThrow("Server Error");
    });

    it('should handle JSON parse error', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        status: 500, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(reportService.getStudentStrengthReport()).rejects.toThrow('Failed to fetch student strength report');
    });
  });

  describe('getCourseEnrollmentReport', () => {
    it('should fetch course enrollment report without filters', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockCourseEnrollmentData }));
      const result = await reportService.getCourseEnrollmentReport();
      expect(fetch).toHaveBeenCalledWith('/api/reports/course-enrollments?');
      expect(result).toEqual(mockCourseEnrollmentData);
    });

    it('should fetch course enrollment report with program filter', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockCourseEnrollmentData }));
      const result = await reportService.getCourseEnrollmentReport({ programId: 'prog1' });
      expect(fetch).toHaveBeenCalledWith('/api/reports/course-enrollments?programId=prog1');
      expect(result).toEqual(mockCourseEnrollmentData);
    });

    it('should fetch course enrollment report with batch filter', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockCourseEnrollmentData }));
      const result = await reportService.getCourseEnrollmentReport({ batchId: 'batch1' });
      expect(fetch).toHaveBeenCalledWith('/api/reports/course-enrollments?batchId=batch1');
      expect(result).toEqual(mockCourseEnrollmentData);
    });

    it('should fetch course enrollment report with semester filter', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockCourseEnrollmentData }));
      const result = await reportService.getCourseEnrollmentReport({ semester: 3 });
      expect(fetch).toHaveBeenCalledWith('/api/reports/course-enrollments?semester=3');
      expect(result).toEqual(mockCourseEnrollmentData);
    });

    it('should fetch course enrollment report with all filters', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockCourseEnrollmentData }));
      const result = await reportService.getCourseEnrollmentReport({ 
        programId: 'prog1',
        batchId: 'batch1',
        academicYear: '2024-25',
        semester: 3
      });
      expect(fetch).toHaveBeenCalledWith('/api/reports/course-enrollments?programId=prog1&batchId=batch1&academicYear=2024-25&semester=3');
      expect(result).toEqual(mockCourseEnrollmentData);
    });

    it('should handle nested data response format', async () => {
      const nestedResponse = { data: mockCourseEnrollmentData };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => nestedResponse }));
      const result = await reportService.getCourseEnrollmentReport();
      expect(result).toEqual(mockCourseEnrollmentData);
    });

    it('should throw error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        status: 404, 
        json: async () => ({ message: "Report not found" }) 
      }));
      await expect(reportService.getCourseEnrollmentReport()).rejects.toThrow("Report not found");
    });

    it('should handle JSON parse error', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        status: 500, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(reportService.getCourseEnrollmentReport()).rejects.toThrow('Failed to fetch course enrollment report');
    });
  });
});