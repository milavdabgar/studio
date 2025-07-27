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

  async importCurricula(file: File, programs: Program[], courses: Course[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number; errors?: Array<{ message?: string; data?: unknown; row?: number }> }> {
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
        const errorSummary = responseData.errors.slice(0, 3).map((err: { message?: string; data?: unknown }) => err.message || JSON.stringify(err.data)).join('; ');
        detailedMessage += ` Specific issues: ${errorSummary}${responseData.errors.length > 3 ? '...' : ''}`;
      } else if (response.status === 500 && !responseData.message && !responseData.errors) {
        detailedMessage = 'Critical error during curriculum import process. Please check server logs.';
      }
      const error = new Error(detailedMessage) as Error & { data?: unknown };
      error.data = responseData; 
      throw error;
    }
    return responseData;
  },

  async autoGenerateCurriculum(programId: string, version: string, effectiveDate: string): Promise<Curriculum> {
    const response = await fetch(`${API_BASE_URL}/curriculum/auto-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ programId, version, effectiveDate }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to auto-generate curriculum' }));
      throw new Error(errorData.message || 'Failed to auto-generate curriculum');
    }
    return response.json();
  },

  async getCoursesByProgram(programId: string): Promise<Course[]> {
    const response = await fetch(`${API_BASE_URL}/courses?programId=${programId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch courses for program' }));
      throw new Error(errorData.message || 'Failed to fetch courses for program');
    }
    return response.json();
  },

  async autoGenerateAllCurricula(): Promise<{
    message: string;
    summary: {
      totalCurriculaGenerated: number;
      totalCurriculaReplaced: number;
      programsProcessed: number;
      curriculumRulesApplied: number;
    };
    details: {
      curriculumRules: Array<{
        academicYear: string;
        versionName: string;
        description: string;
      }>;
      generatedCurricula: Array<{
        programId: string;
        version: string;
        courseCount: number;
        effectiveDate: string;
      }>;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/curriculum/auto-generate-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to auto-generate all curricula' }));
      throw new Error(errorData.message || 'Failed to auto-generate all curricula');
    }
    return response.json();
  }
};