
import type { StudentStrengthReport, CourseEnrollmentData } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const reportService = {
  async getStudentStrengthReport(filters?: { instituteId?: string; academicYear?: string }): Promise<StudentStrengthReport> {
    const queryParams = new URLSearchParams();
    if (filters?.instituteId) queryParams.append('instituteId', filters.instituteId);
    if (filters?.academicYear) queryParams.append('academicYear', filters.academicYear);
    
    const response = await fetch(`${API_BASE_URL}/reports/student-strength?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch student strength report' }));
      throw new Error(errorData.message || 'Failed to fetch student strength report');
    }
    return response.json();
  },

  async getCourseEnrollmentReport(filters?: { 
    programId?: string; 
    batchId?: string; 
    academicYear?: string;
    semester?: number; 
  }): Promise<CourseEnrollmentData[]> {
    const queryParams = new URLSearchParams();
    if (filters?.programId) queryParams.append('programId', filters.programId);
    if (filters?.batchId) queryParams.append('batchId', filters.batchId);
    if (filters?.academicYear) queryParams.append('academicYear', filters.academicYear);
    if (filters?.semester !== undefined) queryParams.append('semester', String(filters.semester));

    const response = await fetch(`${API_BASE_URL}/reports/course-enrollments?${queryParams.toString()}`);
     if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch course enrollment report' }));
      throw new Error(errorData.message || 'Failed to fetch course enrollment report');
    }
    const data = await response.json();
    return data.data || data; // Handle cases where data is nested under 'data' property
  },
};
