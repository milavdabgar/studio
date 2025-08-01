
import type { Room, Building, RoomAllocation, MaintenanceEntry, RoomIssue } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const roomService = {
  async getAllRooms(): Promise<Room[]> {
    const response = await fetch(`${API_BASE_URL}/rooms`);
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }
    return response.json();
  },

  async getRoomById(id: string): Promise<Room> {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch room with id ${id}`);
    }
    return response.json();
  },

  async createRoom(roomData: Omit<Room, 'id'>): Promise<Room> {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roomData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create room' }));
      throw new Error(errorData.message || 'Failed to create room');
    }
    return response.json();
  },

  async updateRoom(id: string, roomData: Partial<Omit<Room, 'id'>>): Promise<Room> {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roomData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update room' }));
      throw new Error(errorData.message || 'Failed to update room');
    }
    return response.json();
  },

  async deleteRoom(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete room with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete room with id ${id}`);
    }
  },

  async importRooms(file: File, buildings: Building[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('buildings', JSON.stringify(buildings));


    const response = await fetch(`${API_BASE_URL}/rooms/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to import rooms' }));
      let detailedMessage = errorData.message || 'Failed to import rooms';
      if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        detailedMessage += ` Specific issues: ${errorData.errors.slice(0, 3).join('; ')}${errorData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return response.json();
  },

  // Advanced room scheduling methods for Phase 3
  async getRoomAllocations(academicYear: string, semester: number): Promise<RoomAllocation[]> {
    const response = await fetch(`${API_BASE_URL}/rooms/allocations?academicYear=${academicYear}&semester=${semester}`);
    if (!response.ok) {
      // Return empty array if no allocations found (non-critical for generation)
      return [];
    }
    return response.json();
  },

  async getMaintenanceSchedule(): Promise<MaintenanceEntry[]> {
    const response = await fetch(`${API_BASE_URL}/rooms/maintenance`);
    if (!response.ok) {
      // Return empty array if no maintenance schedule (non-critical for generation)
      return [];
    }
    return response.json();
  },

  async getRoomIssues(): Promise<RoomIssue[]> {
    const response = await fetch(`${API_BASE_URL}/rooms/issues`);
    if (!response.ok) {
      // Return empty array if no issues found (non-critical for generation)
      return [];
    }
    return response.json();
  }
};
