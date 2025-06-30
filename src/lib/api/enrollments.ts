import type { Enrollment, EnrollmentStatus } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const enrollmentService = {
  async getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    const response = await fetch(`${API_BASE_URL}/enrollments?studentId=${studentId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch enrollments for student' }));
      throw new Error(errorData.message || 'Failed to fetch enrollments for student');
    }
    return response.json();
  },

  async getEnrollmentsByCourseOffering(courseOfferingId: string): Promise<Enrollment[]> {
    const response = await fetch(`${API_BASE_URL}/enrollments?courseOfferingId=${courseOfferingId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch enrollments for course offering' }));
      throw new Error(errorData.message || 'Failed to fetch enrollments for course offering');
    }
    return response.json();
  },
  
  async getEnrollmentById(enrollmentId: string): Promise<Enrollment> {
    const response = await fetch(`${API_BASE_URL}/enrollments/${enrollmentId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch enrollment ${enrollmentId}` }));
      throw new Error(errorData.message || `Failed to fetch enrollment ${enrollmentId}`);
    }
    return response.json();
  },

  async createEnrollment(enrollmentData: { studentId: string; courseOfferingId: string; status?: EnrollmentStatus }): Promise<Enrollment> {
    const response = await fetch(`${API_BASE_URL}/enrollments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enrollmentData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create enrollment' }));
      throw new Error(errorData.message || 'Failed to create enrollment');
    }
    return response.json();
  },

  async updateEnrollmentStatus(enrollmentId: string, status: EnrollmentStatus): Promise<Enrollment> {
    const response = await fetch(`${API_BASE_URL}/enrollments/${enrollmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update enrollment status' }));
      throw new Error(errorData.message || 'Failed to update enrollment status');
    }
    return response.json();
  },

  async withdrawEnrollment(enrollmentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/enrollments/${enrollmentId}`, {
      method: 'DELETE', // Or PUT with status 'withdrawn' depending on API design
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to withdraw enrollment' }));
      throw new Error(errorData.message || 'Failed to withdraw enrollment');
    }
  },

  async getAllEnrollments(): Promise<Enrollment[]> {
    const response = await fetch(`${API_BASE_URL}/enrollments`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch enrollments' }));
      throw new Error(errorData.message || 'Failed to fetch enrollments');
    }
    return response.json();
  },
};
