
import type { Student, SystemUser } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Helper to create a SystemUser from Student data
const createSystemUserFromStudent = (student: Student): Omit<SystemUser, 'id' | 'password'> & { password?: string } => {
  const name = student.gtuName || `${student.firstName || ''} ${student.lastName || ''}`.trim();
  return {
    name: name || student.enrollmentNumber,
    email: student.instituteEmail, // Institute email for login
    roles: ['student'], // Default role
    status: student.status === 'active' ? 'active' : 'inactive',
    department: student.department,
    // Password for new user - enrollment number
    // This will be handled by the backend when creating a new user linked to student
  };
};

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

  async createStudent(studentData: Omit<Student, 'id'>): Promise<Student> {
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

  async updateStudent(id: string, studentData: Partial<Omit<Student, 'id'>>): Promise<Student> {
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

  async importStudents(file: File): Promise<{ newCount: number; updatedCount: number; skippedCount: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/students/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to import students (standard)' }));
      throw new Error(errorData.message || 'Failed to import students (standard)');
    }
    return response.json();
  },

  async importGtuStudents(file: File): Promise<{ newCount: number; updatedCount: number; skippedCount: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/students/import-gtu`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to import GTU students data' }));
      throw new Error(errorData.message || 'Failed to import GTU students data');
    }
    return response.json();
  }
};
