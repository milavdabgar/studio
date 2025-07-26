
import type { Course, Department, Program } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const courseService = {
  async getAllCourses(): Promise<Course[]> {
    const response = await fetch(`${API_BASE_URL}/courses`);
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    return response.json();
  },

  async getCourseById(id: string): Promise<Course> {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch course with id ${id}`);
    }
    return response.json();
  },

  async createCourse(courseData: Omit<Course, 'id'>): Promise<Course> {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create course' }));
      throw new Error(errorData.message || 'Failed to create course');
    }
    return response.json();
  },

  async updateCourse(id: string, courseData: Partial<Omit<Course, 'id'>>): Promise<Course> {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update course' }));
      throw new Error(errorData.message || 'Failed to update course');
    }
    return response.json();
  },

  async deleteCourse(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete course with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete course with id ${id}`);
    }
  },

  async importCourses(file: File, departments: Department[], programs: Program[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number; isGTUFormat?: boolean; syllabusUrlsGenerated?: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('departments', JSON.stringify(departments));
    formData.append('programs', JSON.stringify(programs));

    const response = await fetch(`${API_BASE_URL}/courses/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to import courses' }));
      let detailedMessage = errorData.message || 'Failed to import courses';
      if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        detailedMessage += ` Specific issues: ${errorData.errors.slice(0, 3).join('; ')}${errorData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return response.json();
  }
};
