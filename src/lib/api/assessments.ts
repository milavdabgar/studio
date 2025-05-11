import type { Assessment, Course, Program, Batch } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const assessmentService = {
  async getAllAssessments(): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE_URL}/assessments`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch assessments' }));
      throw new Error(errorData.message || 'Failed to fetch assessments');
    }
    return response.json();
  },

  async getAssessmentById(id: string): Promise<Assessment> {
    const response = await fetch(`${API_BASE_URL}/assessments/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch assessment with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch assessment with id ${id}`);
    }
    return response.json();
  },

  async createAssessment(assessmentData: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assessment> {
    const response = await fetch(`${API_BASE_URL}/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assessmentData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create assessment' }));
      throw new Error(errorData.message || 'Failed to create assessment');
    }
    return response.json();
  },

  async updateAssessment(id: string, assessmentData: Partial<Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Assessment> {
    const response = await fetch(`${API_BASE_URL}/assessments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assessmentData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update assessment' }));
      throw new Error(errorData.message || 'Failed to update assessment');
    }
    return response.json();
  },

  async deleteAssessment(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/assessments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete assessment with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete assessment with id ${id}`);
    }
  },

  async importAssessments(file: File, courses: Course[], programs: Program[], batches: Batch[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number; errors?: Array<{ message?: string; data?: unknown; row?: number }> }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('courses', JSON.stringify(courses));
    formData.append('programs', JSON.stringify(programs));
    formData.append('batches', JSON.stringify(batches));


    const response = await fetch(`${API_BASE_URL}/assessments/import`, {
      method: 'POST',
      body: formData,
    });

    const responseData = await response.json();
    if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import assessments.';
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        const errorSummary = responseData.errors.slice(0, 3).map((err: { message?: string; data?: unknown }) => err.message || JSON.stringify(err.data)).join('; ');
        detailedMessage += ` Specific issues: ${errorSummary}${responseData.errors.length > 3 ? '...' : ''}`;
      } else if (response.status === 500 && !responseData.message && !responseData.errors) {
        detailedMessage = 'Critical error during assessment import process. Please check server logs.';
      }
      const error = new Error(detailedMessage) as Error & { data?: unknown };
      error.data = responseData; 
      throw error;
    }
    return responseData;
  }
};
