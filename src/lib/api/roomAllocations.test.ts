import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import fetch from 'node-fetch';


process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost'
const fetchSpy = jest.spyOn(global, 'fetch');
import { roomAllocationService } from './roomAllocations';
describe('Room Allocations API', () => {
  it('getRoomAllocations should return data', async () => {
    fetchSpy.mockClear();    const mockData = [{ id: '1', roomId: 'room1', courseId: 'course1' }];    fetchSpy.mockResolvedValue({
 json: async () => mockData, ok: true
    });
    const result = await roomAllocationService.getAllRoomAllocations();
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost/api/room-allocations?', undefined);
    expect(result).toEqual(mockData);
  });

  it('getRoomAllocations should handle errors', async () => {
    fetchSpy.mockClear()
    const mockError = new Error('Failed to fetch room allocations');
    fetchSpy.mockResolvedValue({
      ok: false,
 json: async () => ({ message: 'Failed to fetch room allocations' })
    });
    await expect(roomAllocationService.getAllRoomAllocations()).rejects.toThrow('Failed to fetch room allocations');
  });

  it('getRoomAllocationById should return data', async () => {
    const mockData = { id: '1', roomId: 'room1', courseId: 'course1' };
    fetchSpy.mockResolvedValueOnce({
      json: async () => mockData,
 ok: true
    });
    const result = await roomAllocationService.getRoomAllocationById('1');
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost/api/room-allocations/1');
    expect(result).toEqual(mockData);
  });

  it('getRoomAllocationById should handle errors', async () => {
    const mockError = new Error('Failed to fetch room allocation with id 1');
    fetchSpy.mockResolvedValueOnce({
      ok: false,
 json: async () => ({ message: 'Failed to fetch room allocation with id 1' })
    });
    await expect(roomAllocationService.getRoomAllocationById('1')).rejects.toThrow('Failed to fetch room allocation with id 1');
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost/api/room-allocations/1');
  });

  it('createRoomAllocation should return data', async () => {
    const mockData = { id: '1', roomId: 'room1', courseId: 'course1' };
    fetchSpy.mockResolvedValueOnce({
      json: async () => mockData,
 ok: true

    });
    const result = await roomAllocationService.createRoomAllocation(mockData);
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost/api/room-allocations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockData),
    });
    expect(result).toEqual(mockData);
  });

  it('createRoomAllocation should handle errors', async () => {
    const mockData = { id: '1', roomId: 'room1', courseId: 'course1' };
    const mockError = new Error('Failed to create room allocation');
    fetchSpy.mockClear()
    fetchSpy.mockResolvedValueOnce({
      ok: false,
 json: async () => ({ message: 'Failed to create room allocation' })
    });
    await expect(roomAllocationService.createRoomAllocation(mockData)).rejects.toThrow('Failed to create room allocation');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('updateRoomAllocation should return data', async () => {
    const mockData = { id: '1', roomId: 'room2', courseId: 'course2' };
    fetchSpy.mockResolvedValueOnce({
      json: async () => mockData,
 ok: true

    });
    const result = await roomAllocationService.updateRoomAllocation('1', mockData);
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost/api/room-allocations/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockData),
    });
    expect(result).toEqual(mockData);
  });


  it('updateRoomAllocation should handle errors', async () => {
    const mockData = { id: '1', roomId: 'room2', courseId: 'course2' };
    const mockError = new Error('Failed to update room allocation');
    fetchSpy.mockResolvedValueOnce({
 ok: false,
      json: async () => ({ message: 'Failed to update room allocation' })

    });
    await expect(roomAllocationService.updateRoomAllocation('1', mockData)).rejects.toThrow('Failed to update room allocation');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('deleteRoomAllocation should return data', async () => {
    fetchSpy.mockClear()
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => {}, // Assuming delete returns nothing or an empty object

    });

    await roomAllocationService.deleteRoomAllocation('1');
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost/api/room-allocations/1', {
      method: 'DELETE',
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('deleteRoomAllocation should handle errors', async () => {
    fetchSpy.mockClear()
    fetchSpy.mockResolvedValueOnce({
      ok: false, json: async () => ({ message: 'Failed to delete room allocation with id 1'})

    });
    await expect(roomAllocationService.deleteRoomAllocation('1')).rejects.toThrow('Failed to delete room allocation with id 1');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

});