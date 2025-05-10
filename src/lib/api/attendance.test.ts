import { describe, it, expect, jest } from '@jest/globals';
import { attendanceService } from './attendance';
import type { AttendanceRecord } from '@/types/entities';

// Mock the fetch function
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Attendance API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all attendance records', async () => {
    const mockResponse = [{ id: '1', date: '2023-01-01' }, { id: '2', date: '2023-01-02' }] as AttendanceRecord[];
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await attendanceService.getAttendanceRecords({});

    expect(fetch).toHaveBeenCalledWith('/api/attendance?');
    expect(result).toEqual(mockResponse);
  });

  it('should handle errors when fetching all attendance records', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' }),
    } as Response);

    await expect(attendanceService.getAttendanceRecords({})).rejects.toThrow('Server error');
  });

  it('should fetch attendance records by student ID', async () => {
    const mockResponse = [{ id: '1', date: '2023-01-01', studentId: '1' }] as AttendanceRecord[];
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await attendanceService.getAttendanceRecords({ studentId: '1' });

    expect(fetch).toHaveBeenCalledWith('/api/attendance?studentId=1');
    expect(result).toEqual(mockResponse);
  });

  it('should handle errors when fetching attendance records by student ID', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not found' }),
    } as Response);

    await expect(attendanceService.getAttendanceRecords({ studentId: '1' })).rejects.toThrow('Not found');
  });

  it('should mark attendance', async () => {
    const mockAttendanceData = { 
      date: '2023-01-03', 
      studentId: '1', 
      courseOfferingId: '101', 
      status: 'present',
      markedBy: 'teacher1'
    } as Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>;
    
    const mockResponse = [{ id: '3', ...mockAttendanceData }] as AttendanceRecord[];
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await attendanceService.markAttendance([mockAttendanceData]);

    expect(fetch).toHaveBeenCalledWith(`${'/api'}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([mockAttendanceData]),
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle errors when marking attendance', async () => {
    const mockAttendanceData = { 
      date: '2023-01-03', 
      studentId: '1', 
      courseOfferingId: '101', 
      status: 'present',
      markedBy: 'teacher1'
    } as Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>;
    
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Bad request' }),
    } as Response);

    await expect(attendanceService.markAttendance([mockAttendanceData])).rejects.toThrow('Bad request');
  });

  it('should update an existing attendance record', async () => {
    const mockAttendanceData = { 
      date: '2023-01-04',
      status: 'absent' 
    } as Partial<Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>>;
    
    const mockResponse = { 
      id: '1', 
      date: '2023-01-04',
      studentId: '1',
      courseOfferingId: '101',
      status: 'absent',
      markedBy: 'teacher1'
    } as AttendanceRecord;
    
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await attendanceService.updateAttendanceRecord('1', mockAttendanceData);

    expect(fetch).toHaveBeenCalledWith('/api/attendance/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockAttendanceData),
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle errors when updating an attendance record', async () => {
    const mockAttendanceData = { 
      date: '2023-01-04',
      status: 'absent' 
    } as Partial<Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>>;
    
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Bad request' }),
    } as Response);

    await expect(attendanceService.updateAttendanceRecord('1', mockAttendanceData)).rejects.toThrow('Bad request');
  });

  it('should delete an attendance record', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
    } as Response);

    await attendanceService.deleteAttendanceRecord('1');

    expect(fetch).toHaveBeenCalledWith('/api/attendance/1', {
      method: 'DELETE',
    });
  });

  it('should handle errors when deleting an attendance record', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Bad request' }),
    } as Response);

    await expect(attendanceService.deleteAttendanceRecord('1')).rejects.toThrow('Bad request');
  });
});