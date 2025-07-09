
import type { Timetable } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const timetableService = {
  async getAllTimetables(): Promise<Timetable[]> {
    const response = await fetch(`${API_BASE_URL}/timetables`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch timetables' }));
      throw new Error(errorData.message || 'Failed to fetch timetables');
    }
    return response.json();
  },

  async getTimetableById(id: string): Promise<Timetable> {
    const response = await fetch(`${API_BASE_URL}/timetables/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch timetable with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch timetable with id ${id}`);
    }
    return response.json();
  },

  async createTimetable(timetableData: Omit<Timetable, 'id' | 'createdAt' | 'updatedAt'>): Promise<Timetable> {
    const response = await fetch(`${API_BASE_URL}/timetables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(timetableData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create timetable' }));
      throw new Error(errorData.message || 'Failed to create timetable');
    }
    return response.json();
  },

  async updateTimetable(id: string, timetableData: Partial<Omit<Timetable, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Timetable> {
    const response = await fetch(`${API_BASE_URL}/timetables/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(timetableData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update timetable' }));
      throw new Error(errorData.message || 'Failed to update timetable');
    }
    return response.json();
  },

  async deleteTimetable(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/timetables/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete timetable with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete timetable with id ${id}`);
    }
  },
};
