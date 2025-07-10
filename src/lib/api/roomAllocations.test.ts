import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { roomAllocationService } from './roomAllocations';
import type { RoomAllocation } from '@/types/entities';

process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost';

// Create a proper mock for the Response object
const createMockResponse = (options: { ok: boolean; status?: number; statusText?: string; json?: () => Promise<unknown> }): Response => {
  const { ok, status = 200, statusText = '', json = async () => ({}) } = options;
  return {
    ok,
    status,
    statusText,
    json,
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(options),
    text: async () => '',
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    bodyUsed: false,
  } as Response;
};

// Mock fetch with proper return type
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;
describe('Room Allocations API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getRoomAllocations should return data', async () => {
    const mockData = [{ 
      id: '1', 
      roomId: 'room1', 
      courseOfferingId: 'course1', 
      facultyId: 'faculty1',
      status: 'scheduled' as RoomAllocation['status'],
      purpose: 'lecture' as RoomAllocation['purpose'],
      startTime: '2023-01-01T09:00:00.000Z',
      endTime: '2023-01-01T10:00:00.000Z'
    }] as RoomAllocation[];
    
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true,
      json: async () => mockData
    }));
    
    const result = await roomAllocationService.getAllRoomAllocations();
    expect(fetch).toHaveBeenCalledWith('http://localhost/api/room-allocations?');
    expect(result).toEqual(mockData);
  });

  it('getRoomAllocations should handle filters correctly', async () => {
    const mockData = [{ 
      id: '1', 
      roomId: 'room1', 
      courseOfferingId: 'course1', 
      facultyId: 'faculty1',
      status: 'scheduled' as RoomAllocation['status'],
      purpose: 'lecture' as RoomAllocation['purpose'],
      startTime: '2023-01-01T09:00:00.000Z',
      endTime: '2023-01-01T10:00:00.000Z'
    }] as RoomAllocation[];
    
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true,
      json: async () => mockData
    }));
    
    const filters = {
      roomId: 'room1',
      courseOfferingId: 'course1',
      facultyId: 'faculty1',
      date: '2023-01-01'
    };
    
    const result = await roomAllocationService.getAllRoomAllocations(filters);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost/api/room-allocations?roomId=room1&courseOfferingId=course1&facultyId=faculty1&date=2023-01-01'
    );
    expect(result).toEqual(mockData);
  });

  it('getRoomAllocations should handle partial filters correctly', async () => {
    const mockData = [{ 
      id: '1', 
      roomId: 'room1', 
      courseOfferingId: 'course1', 
      facultyId: 'faculty1',
      status: 'scheduled' as RoomAllocation['status'],
      purpose: 'lecture' as RoomAllocation['purpose'],
      startTime: '2023-01-01T09:00:00.000Z',
      endTime: '2023-01-01T10:00:00.000Z'
    }] as RoomAllocation[];
    
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true,
      json: async () => mockData
    }));
    
    const filters = {
      roomId: 'room1',
      // Only including roomId to test partial filters
    };
    
    const result = await roomAllocationService.getAllRoomAllocations(filters);
    expect(fetch).toHaveBeenCalledWith('http://localhost/api/room-allocations?roomId=room1');
    expect(result).toEqual(mockData);
  });

  it('getRoomAllocations should handle errors', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Failed to fetch room allocations' })
    }));
    
    await expect(roomAllocationService.getAllRoomAllocations()).rejects.toThrow('Failed to fetch room allocations');
  });

  it('getRoomAllocations should handle JSON parsing errors', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 500,
      json: async () => { throw new Error('Invalid JSON'); }
    }));
    
    await expect(roomAllocationService.getAllRoomAllocations()).rejects.toThrow('Failed to fetch room allocations');
  });

  it('getRoomAllocationById should return data', async () => {
    const mockData = { 
      id: '1', 
      roomId: 'room1', 
      courseOfferingId: 'course1', 
      facultyId: 'faculty1',
      status: 'scheduled' as RoomAllocation['status'],
      purpose: 'lecture' as RoomAllocation['purpose'],
      startTime: '2023-01-01T09:00:00.000Z',
      endTime: '2023-01-01T10:00:00.000Z'
    } as RoomAllocation;
    
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true,
      json: async () => mockData
    }));
    
    const result = await roomAllocationService.getRoomAllocationById('1');
    expect(fetch).toHaveBeenCalledWith('http://localhost/api/room-allocations/1');
    expect(result).toEqual(mockData);
  });

  it('getRoomAllocationById should handle errors', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Failed to fetch room allocation with id 1' })
    }));
    
    await expect(roomAllocationService.getRoomAllocationById('1')).rejects.toThrow('Failed to fetch room allocation with id 1');
    expect(fetch).toHaveBeenCalledWith('http://localhost/api/room-allocations/1');
  });

  it('getRoomAllocationById should handle JSON parsing errors', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 404,
      json: async () => { throw new Error('Invalid JSON'); }
    }));
    
    await expect(roomAllocationService.getRoomAllocationById('1')).rejects.toThrow('Failed to fetch room allocation with id 1');
    expect(fetch).toHaveBeenCalledWith('http://localhost/api/room-allocations/1');
  });

  it('createRoomAllocation should return data', async () => {
    const newAllocationData = { 
      roomId: 'room1', 
      courseOfferingId: 'course1', 
      facultyId: 'faculty1',
      status: 'scheduled' as RoomAllocation['status'],
      purpose: 'lecture' as RoomAllocation['purpose'],
      startTime: '2023-01-01T09:00:00.000Z',
      endTime: '2023-01-01T10:00:00.000Z'
    } as Omit<RoomAllocation, 'id' | 'createdAt' | 'updatedAt'>;
    
    const createdAllocation = { 
      id: '1', 
      ...newAllocationData 
    } as RoomAllocation;
    
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true,
      status: 201,
      json: async () => createdAllocation
    }));
    
    const result = await roomAllocationService.createRoomAllocation(newAllocationData);
    expect(fetch).toHaveBeenCalledWith('http://localhost/api/room-allocations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newAllocationData),
    });
    expect(result).toEqual(createdAllocation);
  });

  it('createRoomAllocation should handle errors', async () => {
    const newAllocationData = { 
      roomId: 'room1', 
      courseOfferingId: 'course1', 
      facultyId: 'faculty1',
      status: 'scheduled' as RoomAllocation['status'],
      purpose: 'lecture' as RoomAllocation['purpose'],
      startTime: '2023-01-01T09:00:00.000Z',
      endTime: '2023-01-01T10:00:00.000Z'
    } as Omit<RoomAllocation, 'id' | 'createdAt' | 'updatedAt'>;
    
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Failed to create room allocation' })
    }));
    
    await expect(roomAllocationService.createRoomAllocation(newAllocationData)).rejects.toThrow('Failed to create room allocation');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('createRoomAllocation should handle JSON parsing errors', async () => {
    const newAllocationData = { 
      roomId: 'room1', 
      courseOfferingId: 'course1', 
      facultyId: 'faculty1',
      status: 'scheduled' as RoomAllocation['status'],
      purpose: 'lecture' as RoomAllocation['purpose'],
      startTime: '2023-01-01T09:00:00.000Z',
      endTime: '2023-01-01T10:00:00.000Z'
    } as Omit<RoomAllocation, 'id' | 'createdAt' | 'updatedAt'>;
    
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 400,
      json: async () => { throw new Error('Invalid JSON'); }
    }));
    
    await expect(roomAllocationService.createRoomAllocation(newAllocationData)).rejects.toThrow('Failed to create room allocation');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('updateRoomAllocation should return data', async () => {
    const updateData = { 
      roomId: 'room2', 
      purpose: 'exam'
    } as Partial<Omit<RoomAllocation, 'id' | 'createdAt' | 'updatedAt'>>;
    
    const updatedAllocation = { 
      id: '1', 
      roomId: 'room2', 
      courseOfferingId: 'course1', 
      facultyId: 'faculty1',
      status: 'scheduled' as RoomAllocation['status'],
      purpose: 'exam' as RoomAllocation['purpose'],
      startTime: '2023-01-01T09:00:00.000Z',
      endTime: '2023-01-01T10:00:00.000Z'
    } as RoomAllocation;
    
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true,
      json: async () => updatedAllocation
    }));
    
    const result = await roomAllocationService.updateRoomAllocation('1', updateData);
    expect(fetch).toHaveBeenCalledWith('http://localhost/api/room-allocations/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    expect(result).toEqual(updatedAllocation);
  });


  it('updateRoomAllocation should handle errors', async () => {
    const updateData = { 
      roomId: 'room2', 
      purpose: 'exam'
    } as Partial<Omit<RoomAllocation, 'id' | 'createdAt' | 'updatedAt'>>;
    
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Failed to update room allocation' })
    }));
    
    await expect(roomAllocationService.updateRoomAllocation('1', updateData)).rejects.toThrow('Failed to update room allocation');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('updateRoomAllocation should handle JSON parsing errors', async () => {
    const updateData = { 
      roomId: 'room2', 
      purpose: 'exam'
    } as Partial<Omit<RoomAllocation, 'id' | 'createdAt' | 'updatedAt'>>;
    
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 404,
      json: async () => { throw new Error('Invalid JSON'); }
    }));
    
    await expect(roomAllocationService.updateRoomAllocation('1', updateData)).rejects.toThrow('Failed to update room allocation');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('deleteRoomAllocation should return data', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true
    }));

    await roomAllocationService.deleteRoomAllocation('1');
    expect(fetch).toHaveBeenCalledWith('http://localhost/api/room-allocations/1', {
      method: 'DELETE',
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('deleteRoomAllocation should handle errors', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Failed to delete room allocation with id 1'})
    }));
    
    await expect(roomAllocationService.deleteRoomAllocation('1')).rejects.toThrow('Failed to delete room allocation with id 1');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('deleteRoomAllocation should handle JSON parsing errors', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 404,
      json: async () => { throw new Error('Invalid JSON'); }
    }));
    
    await expect(roomAllocationService.deleteRoomAllocation('1')).rejects.toThrow('Failed to delete room allocation with id 1');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

});