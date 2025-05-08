import { roomAllocationService } from './roomAllocations';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock the fetch function
jest.mock('./roomAllocations');
jest.mock('node-fetch');

const mockedFetch = jest.fn();
(global as any).fetch = mockedFetch; // Use 'global as any' for Jest in Node.js environment

describe('Room Allocations API', () => {

  beforeEach(() => {
    mockedFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('getRoomAllocations should return data', async () => {
    const mockData = [{ id: '1', roomId: 'room1', courseId: 'course1' }];
    mockedFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await roomAllocationService.getAllRoomAllocations();
    expect(mockedFetch).toHaveBeenCalledWith('/api/room-allocations');
    expect(result).toEqual(mockData);
  });

  it('getRoomAllocations should handle errors', async () => {
    mockedFetch.mockResolvedValue({ ok: false });

    await expect(roomAllocationService.getAllRoomAllocations()).rejects.toThrow('Failed to fetch room allocations');
  });

  it('getRoomAllocationById should return data', async () => {
    const mockData = { id: '1', roomId: 'room1', courseId: 'course1' };
    mockedFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await roomAllocationService.getRoomAllocationById('1');
    expect(mockedFetch).toHaveBeenCalledWith('/api/room-allocations/1');
    expect(result).toEqual(mockData);
  });

  it('getRoomAllocationById should handle errors', async () => {
    mockedFetch.mockResolvedValue({ ok: false });

    await expect(roomAllocationService.getRoomAllocationById('1')).rejects.toThrow('Failed to fetch room allocation with id 1');
  });

  it('createRoomAllocation should return data', async () => {
    const mockData = { id: '1', roomId: 'room1', courseId: 'course1' };
    mockedFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await roomAllocationService.createRoomAllocation(mockData);
    expect(mockedFetch).toHaveBeenCalledWith('/api/room-allocations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockData),
    });
    expect(result).toEqual(mockData);
  });

  it('createRoomAllocation should handle errors', async () => {
    mockedFetch.mockResolvedValue({ ok: false });
    const mockData = { id: '1', roomId: 'room1', courseId: 'course1' };

    await expect(roomAllocationService.createRoomAllocation(mockData)).rejects.toThrow('Failed to create room allocation');
  });

  it('updateRoomAllocation should return data', async () => {
    const mockData = { id: '1', roomId: 'room2', courseId: 'course2' };
    mockedFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await roomAllocationService.updateRoomAllocation('1', mockData);
    expect(mockedFetch).toHaveBeenCalledWith('/api/room-allocations/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockData),
    });
    expect(result).toEqual(mockData);
  });

  it('updateRoomAllocation should handle errors', async () => {
    mockedFetch.mockResolvedValue({ ok: false });
    const mockData = { id: '1', roomId: 'room2', courseId: 'course2' };

    await expect(roomAllocationService.updateRoomAllocation('1', mockData)).rejects.toThrow('Failed to update room allocation');
  });

  it('deleteRoomAllocation should return data', async () => {
    const mockData = { message: 'Room allocation deleted' };
    mockedFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    await roomAllocationService.deleteRoomAllocation('1');
    expect(mockedFetch).toHaveBeenCalledWith('/api/room-allocations/1', {
      method: 'DELETE',
    });
  });

  it('deleteRoomAllocation should handle errors', async () => {
    mockedFetch.mockResolvedValue({ ok: false });

    await expect(roomAllocationService.deleteRoomAllocation('1')).rejects.toThrow('Failed to delete room allocation with id 1');
  });
});