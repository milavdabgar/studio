import { timetableService } from './timetables';
import type { Timetable, TimetableEntry } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Helper to create mock responses
const createMockResponse = (options: { ok: boolean; status?: number; json?: () => Promise<unknown>; statusText?: string }): Response => {
  return {
    ok: options.ok,
    status: options.status || (options.ok ? 200 : 500),
    statusText: options.statusText || (options.ok ? 'OK' : 'Error'),
    json: options.json || (async () => ({})),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(options),
    text: async () => JSON.stringify(await (options.json ? options.json() : {})),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    bodyUsed: false,
  } as Response;
};

// Mock fetch globally for all tests in this file
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('TimetableService API Tests', () => {
  const now = new Date().toISOString();
  const mockTimetableEntry: TimetableEntry = {
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    courseId: "course1",
    facultyId: "faculty1",
    roomId: "room1",
    entryType: "lecture",
  };
  const mockTimetable: Timetable = {
    id: "tt1",
    name: "Sem 1 Timetable",
    academicYear: "2023-24",
    semester: 1,
    programId: "prog1",
    batchId: "batch1",
    version: "1.0",
    status: "published",
    effectiveDate: now,
    entries: [mockTimetableEntry],
    createdAt: now,
    updatedAt: now,
  };
  const mockTimetables: Timetable[] = [mockTimetable];

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getAllTimetables', () => {
    it('should fetch all timetables successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockTimetables }));
      const result = await timetableService.getAllTimetables();
      expect(fetch).toHaveBeenCalledWith('/api/timetables');
      expect(result).toEqual(mockTimetables);
    });

    it('should throw an error if fetching all timetables fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Fetch error' }) }));
      await expect(timetableService.getAllTimetables()).rejects.toThrow('Fetch error');
    });
  });

  describe('getTimetableById', () => {
    it('should fetch a timetable by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockTimetable }));
      const result = await timetableService.getTimetableById('tt1');
      expect(fetch).toHaveBeenCalledWith('/api/timetables/tt1');
      expect(result).toEqual(mockTimetable);
    });

    it('should throw an error if fetching a timetable by ID fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Not found' }) }));
      await expect(timetableService.getTimetableById('unknown')).rejects.toThrow('Not found');
    });
  });

  describe('createTimetable', () => {
    const newTimetableData: Omit<Timetable, 'id' | 'createdAt' | 'updatedAt'> = {
      name: "New Sem Timetable",
      academicYear: "2024-25",
      semester: 2,
      programId: "prog2",
      batchId: "batch2",
      version: "1.0",
      status: "draft",
      effectiveDate: new Date().toISOString(),
      entries: [],
    };
    const createdTimetable: Timetable = { ...newTimetableData, id: 'tt_new', createdAt: now, updatedAt: now };

    it('should create a timetable successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => createdTimetable }));
      const result = await timetableService.createTimetable(newTimetableData);
      expect(fetch).toHaveBeenCalledWith('/api/timetables', expect.objectContaining({ method: 'POST', body: JSON.stringify(newTimetableData) }));
      expect(result).toEqual(createdTimetable);
    });

    it('should throw an error if creating a timetable fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 400, json: async () => ({ message: 'Creation failed' }) }));
      await expect(timetableService.createTimetable(newTimetableData)).rejects.toThrow('Creation failed');
    });
  });

  describe('updateTimetable', () => {
    const updateData: Partial<Omit<Timetable, 'id' | 'createdAt' | 'updatedAt'>> = { status: 'published' };
    const updatedTimetable: Timetable = { ...mockTimetable, status: 'published', updatedAt: new Date().toISOString() };

    it('should update a timetable successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => updatedTimetable }));
      const result = await timetableService.updateTimetable('tt1', updateData);
      expect(fetch).toHaveBeenCalledWith('/api/timetables/tt1', expect.objectContaining({ method: 'PUT', body: JSON.stringify(updateData) }));
      expect(result).toEqual(updatedTimetable);
    });

    it('should throw an error if updating a timetable fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 400, json: async () => ({ message: 'Update failed' }) }));
      await expect(timetableService.updateTimetable('tt1', updateData)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteTimetable', () => {
    it('should delete a timetable successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));
      await timetableService.deleteTimetable('tt1');
      expect(fetch).toHaveBeenCalledWith('/api/timetables/tt1', expect.objectContaining({ method: 'DELETE' }));
    });

    it('should throw an error if deleting a timetable fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 404, json: async () => ({ message: 'Delete failed' }) }));
      await expect(timetableService.deleteTimetable('tt1')).rejects.toThrow('Delete failed');
    });
  });
});
