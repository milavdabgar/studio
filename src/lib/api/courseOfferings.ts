
import type { CourseOffering } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const courseOfferingService = {
  async getAllCourseOfferings(): Promise<CourseOffering[]> {
    const response = await fetch(`${API_BASE_URL}/course-offerings`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch course offerings' }));
      throw new Error(errorData.message || 'Failed to fetch course offerings');
    }
    return response.json();
  },

  async getCourseOfferingById(id: string): Promise<CourseOffering> {
    const response = await fetch(`${API_BASE_URL}/course-offerings/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch course offering with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch course offering with id ${id}`);
    }
    return response.json();
  },

  async createCourseOffering(courseOfferingData: Omit<CourseOffering, 'id' | 'createdAt' | 'updatedAt'>): Promise<CourseOffering> {
    const response = await fetch(`${API_BASE_URL}/course-offerings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseOfferingData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create course offering' }));
      throw new Error(errorData.message || 'Failed to create course offering');
    }
    return response.json();
  },

  async updateCourseOffering(id: string, courseOfferingData: Partial<Omit<CourseOffering, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CourseOffering> {
    const response = await fetch(`${API_BASE_URL}/course-offerings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseOfferingData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update course offering' }));
      throw new Error(errorData.message || 'Failed to update course offering');
    }
    return response.json();
  },

  async deleteCourseOffering(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/course-offerings/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete course offering with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete course offering with id ${id}`);
    }
  },
};
