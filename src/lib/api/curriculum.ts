import type { Curriculum, Program, Course } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const curriculumService = {
  async getAllCurricula(): Promise<Curriculum[]> {
    const response = await fetch(`${API_BASE_URL}/curriculum`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch curricula' }));
      throw new Error(errorData.message || 'Failed to fetch curricula');
    }
    return response.json();
  },

  async getCurriculumById(id: string): Promise<Curriculum> {
    const response = await fetch(`${API_BASE_URL}/curriculum/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch curriculum with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch curriculum with id ${id}`);
    }
    return response.json();
  },

  async createCurriculum(curriculumData: Omit<Curriculum, 'id' | 'createdAt' | 'updatedAt'>): Promise<Curriculum> {
    const response = await fetch(`${API_BASE_URL}/curriculum`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(curriculumData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create curriculum' }));
      throw new Error(errorData.message || 'Failed to create curriculum');
    }
    return response.json();
  },

  async updateCurriculum(id: string, curriculumData: Partial<Omit<Curriculum, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Curriculum> {
    const response = await fetch(`${API_BASE_URL}/curriculum/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(curriculumData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update curriculum' }));
      throw new Error(errorData.message || 'Failed to update curriculum');
    }
    return response.json();
  },

  async deleteCurriculum(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/curriculum/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete curriculum with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete curriculum with id ${id}`);
    }
  },

  async importCurricula(file: File, programs: Program[], courses: Course[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number; errors?: any[] }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('programs', JSON.stringify(programs));
    formData.append('courses', JSON.stringify(courses));

    const response = await fetch(`${API_BASE_URL}/curriculum/import`, {
      method: 'POST',
      body: formData,
    });

    const responseData = await response.json();
    if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import curricula.';
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        const errorSummary = responseData.errors.slice(0, 3).map((err: any) => err.message || JSON.stringify(err.data)).join('; ');
        detailedMessage += ` Specific issues: ${errorSummary}${responseData.errors.length > 3 ? '...' : ''}`;
      } else if (response.status === 500 && !responseData.message && !responseData.errors) {
        detailedMessage = 'Critical error during curriculum import process. Please check server logs.';
      }
      const error = new Error(detailedMessage) as any;
      error.data = responseData; 
      throw error;
    }
    return responseData;
  }
};