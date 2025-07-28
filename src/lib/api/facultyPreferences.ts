import type { FacultyPreference } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const facultyPreferenceService = {
  async getAllPreferences(): Promise<FacultyPreference[]> {
    const response = await fetch(`${API_BASE_URL}/faculty-preferences`);
    if (!response.ok) {
      throw new Error('Failed to fetch faculty preferences');
    }
    return response.json();
  },

  async getPreferencesByFaculty(facultyId: string): Promise<FacultyPreference[]> {
    const response = await fetch(`${API_BASE_URL}/faculty-preferences?facultyId=${facultyId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch faculty preferences');
    }
    return response.json();
  },

  async getPreferencesByTerm(academicYear: string, semester: number): Promise<FacultyPreference[]> {
    const response = await fetch(`${API_BASE_URL}/faculty-preferences?academicYear=${academicYear}&semester=${semester}`);
    if (!response.ok) {
      throw new Error('Failed to fetch faculty preferences for term');
    }
    return response.json();
  },

  async createPreference(preference: Omit<FacultyPreference, 'id' | 'createdAt' | 'updatedAt'>): Promise<FacultyPreference> {
    const response = await fetch(`${API_BASE_URL}/faculty-preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preference),
    });
    if (!response.ok) {
      throw new Error('Failed to create faculty preference');
    }
    return response.json();
  },

  async updatePreference(id: string, preference: Partial<FacultyPreference>): Promise<FacultyPreference> {
    const response = await fetch(`${API_BASE_URL}/faculty-preferences/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preference),
    });
    if (!response.ok) {
      throw new Error('Failed to update faculty preference');
    }
    return response.json();
  },

  async deletePreference(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/faculty-preferences/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete faculty preference');
    }
  },
};