import type { RoomAllocation } from '@/types/entities';


export const roomAllocationService = {
  async getAllRoomAllocations(filters?: { roomId?: string, courseOfferingId?: string, facultyId?: string, date?: string }): Promise<RoomAllocation[]> {
    const queryParams = new URLSearchParams();
    if (filters?.roomId) queryParams.append('roomId', filters.roomId);
    if (filters?.courseOfferingId) queryParams.append('courseOfferingId', filters.courseOfferingId);
    if (filters?.facultyId) queryParams.append('facultyId', filters.facultyId);
    if (filters?.date) queryParams.append('date', filters.date); // Expects YYYY-MM-DD

    const response = await fetch(`http://localhost/api/room-allocations?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch room allocations' }));
      throw new Error(errorData.message || 'Failed to fetch room allocations');
    }
    return response.json();
  },

  async getRoomAllocationById(id: string): Promise<RoomAllocation> {
    const response = await fetch(`http://localhost/api/room-allocations/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch room allocation with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch room allocation with id ${id}`);
    }
    return response.json();
  },

  async createRoomAllocation(allocationData: Omit<RoomAllocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoomAllocation> {
    const response = await fetch(`http://localhost/api/room-allocations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(allocationData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create room allocation' }));
      throw new Error(errorData.message || 'Failed to create room allocation');
    }
    return response.json();
  },

  async updateRoomAllocation(id: string, allocationData: Partial<Omit<RoomAllocation, 'id' | 'createdAt' | 'updatedAt'>>): Promise<RoomAllocation> {
    const response = await fetch(`http://localhost/api/room-allocations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(allocationData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update room allocation' }));
      throw new Error(errorData.message || 'Failed to update room allocation');
    }
    return response.json();
  },

  async deleteRoomAllocation(id: string): Promise<void> {
    const response = await fetch(`http://localhost/api/room-allocations/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete room allocation with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete room allocation with id ${id}`);
    }
  },
};