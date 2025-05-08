import { describe, it, expect, jest } from '@jest/globals';
import * as attendanceApi from './attendance';

// Mock the fetch function
global.fetch = jest.fn();

describe('Attendance API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all attendance records', async () => {
    const mockResponse = [{ id: 1, date: '2023-01-01' }, { id: 2, date: '2023-01-02' }];
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await attendanceApi.getAllAttendance();

    expect(fetch).toHaveBeenCalledWith('/api/attendance', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle errors when fetching all attendance records', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(attendanceApi.getAllAttendance()).rejects.toThrow('Failed to fetch attendance: 500');
  });

  it('should fetch a single attendance record by ID', async () => {
    const mockResponse = { id: 1, date: '2023-01-01' };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await attendanceApi.getAttendanceById('1');

    expect(fetch).toHaveBeenCalledWith('/api/attendance/1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle errors when fetching a single attendance record', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(attendanceApi.getAttendanceById('1')).rejects.toThrow('Failed to fetch attendance: 404');
  });

  it('should create a new attendance record', async () => {
    const mockAttendanceData = { date: '2023-01-03' };
    const mockResponse = { id: 3, ...mockAttendanceData };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await attendanceApi.createAttendance(mockAttendanceData);

    expect(fetch).toHaveBeenCalledWith('/api/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockAttendanceData),
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle errors when creating a new attendance record', async () => {
    const mockAttendanceData = { date: '2023-01-03' };
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
    });

    await expect(attendanceApi.createAttendance(mockAttendanceData)).rejects.toThrow('Failed to create attendance: 400');
  });

  it('should update an existing attendance record', async () => {
    const mockAttendanceData = { id: '1', date: '2023-01-04' };
    const mockResponse = { ...mockAttendanceData };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await attendanceApi.updateAttendance(mockAttendanceData);

    expect(fetch).toHaveBeenCalledWith('/api/attendance/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockAttendanceData),
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle errors when updating an attendance record', async () => {
    const mockAttendanceData = { id: '1', date: '2023-01-04' };
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
    });

    await expect(attendanceApi.updateAttendance(mockAttendanceData)).rejects.toThrow('Failed to update attendance: 400');
  });

  it('should delete an attendance record', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
    });

    await attendanceApi.deleteAttendance('1');

    expect(fetch).toHaveBeenCalledWith('/api/attendance/1', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should handle errors when deleting an attendance record', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
    });

    await expect(attendanceApi.deleteAttendance('1')).rejects.toThrow('Failed to delete attendance: 400');
  });
});