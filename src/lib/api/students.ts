

import type { Student, Program } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const studentService = {
  async getAllStudents(): Promise<Student[]> {
    const response = await fetch(`${API_BASE_URL}/students`);
    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }
    return response.json();
  },

  async getStudentById(id: string): Promise<Student> {
    const response = await fetch(`${API_BASE_URL}/students/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch student with id ${id}`);
    }
    return response.json();
  },

  async createStudent(studentData: Omit<Student, 'id' | 'userId'> & { instituteId?: string }): Promise<Student> {
    // instituteId might be needed by the backend to create the User record correctly
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create student' }));
      throw new Error(errorData.message || 'Failed to create student');
    }
    return response.json();
  },

  async updateStudent(id: string, studentData: Partial<Omit<Student, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> & { instituteId?: string, academicRemarks?: string, currentSemester?: number, status?: Student['status'] }): Promise<Student> {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update student' }));
      throw new Error(errorData.message || 'Failed to update student');
    }
    return response.json();
  },

  async deleteStudent(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete student with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete student with id ${id}`);
    }
  },

  async removeStudentRole(studentId: string): Promise<{ userDeleted: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/remove-role`, {
      method: 'POST',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to remove student role for student ${studentId}` }));
      throw new Error(errorData.message || `Failed to remove student role for student ${studentId}`);
    }
    return response.json();
  },

  async importStudents(file: File, programs: Program[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number; errors?: Array<{ message?: string; data?: unknown; row?: number }> }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('programs', JSON.stringify(programs)); // Send programs for instituteId derivation

    const response = await fetch(`${API_BASE_URL}/students/import`, {
      method: 'POST',
      body: formData,
    });
    const responseData = await response.json();
    if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import students (standard)';
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
         detailedMessage += ` Specific issues: ${responseData.errors.slice(0,3).map((e: { message?: string; data?: unknown }) => { return e.message || JSON.stringify(e.data); }).join('; ')}${responseData.errors.length > 3 ? '...' : ''}`;
      }
      const error = new Error(detailedMessage) as Error & { data?: unknown };
      error.data = responseData;
      throw error;
    }
    return responseData;
  },

  async importGtuStudents(file: File, programs: Program[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number; errors?: Array<{ message?: string; data?: unknown; row?: number }> }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('programs', JSON.stringify(programs));

    const response = await fetch(`${API_BASE_URL}/students/import-gtu`, {
      method: 'POST',
      body: formData,
    });
     const responseData = await response.json();
    if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import GTU students data';
       if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
         detailedMessage += ` Specific issues: ${responseData.errors.slice(0,3).map((e: { message?: string; data?: unknown }) => { return e.message || JSON.stringify(e.data); }).join('; ')}${responseData.errors.length > 3 ? '...' : ''}`;
      }
      const error = new Error(detailedMessage) as Error & { data?: unknown };
      error.data = responseData;
      throw error;
    }
    return responseData;
  }
};
