import type { AttendanceRecord } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const attendanceService = {
  async getAttendanceRecords(filters: { studentId?: string; courseOfferingId?: string; date?: string }): Promise<AttendanceRecord[]> {
    const queryParams = new URLSearchParams();
    if (filters.studentId) queryParams.append('studentId', filters.studentId);
    if (filters.courseOfferingId) queryParams.append('courseOfferingId', filters.courseOfferingId);
    if (filters.date) queryParams.append('date', filters.date);
    
    const response = await fetch(`${API_BASE_URL}/attendance?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch attendance records' }));
      throw new Error(errorData.message || 'Failed to fetch attendance records');
    }
    return response.json();
  },

  async markAttendance(records: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<AttendanceRecord[]> {
    const response = await fetch(`${API_BASE_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to mark attendance' }));
      throw new Error(errorData.message || 'Failed to mark attendance');
    }
    return response.json();
  },

  async updateAttendanceRecord(id: string, data: Partial<Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AttendanceRecord> {
    const response = await fetch(`${API_BASE_URL}/attendance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update attendance record' }));
      throw new Error(errorData.message || 'Failed to update attendance record');
    }
    return response.json();
  },

  async deleteAttendanceRecord(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/attendance/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete attendance record' }));
      throw new Error(errorData.message || 'Failed to delete attendance record');
    }
  },
};
    