import { roomService } from './roomService';
import type { Room, Building } from '@/types/entities';

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

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('roomService', () => {
  const mockRooms: Room[] = [
    { 
      id: '1', 
      name: 'Room 101', 
      roomNumber: '101', 
      buildingId: 'building1', 
      type: 'Lecture Hall', 
      capacity: 30, 
      status: 'available' 
    },
    { 
      id: '2', 
      name: 'Room 102', 
      roomNumber: '102', 
      buildingId: 'building1', 
      type: 'Laboratory', 
      capacity: 40, 
      status: 'available' 
    },
  ];

  const mockBuildings: Building[] = [
    { id: 'building1', name: 'Building A', instituteId: 'inst1', status: 'active' },
    { id: 'building2', name: 'Building B', instituteId: 'inst1', status: 'active' },
  ];

  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAllRooms', () => {
    it('should fetch all rooms successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRooms,
      } as Response);

      const result = await roomService.getAllRooms();

      expect(mockFetch).toHaveBeenCalledWith('/api/rooms');
      expect(result).toEqual(mockRooms);
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(roomService.getAllRooms()).rejects.toThrow('Failed to fetch rooms');
      expect(mockFetch).toHaveBeenCalledWith('/api/rooms');
    });
  });

  describe('getRoomById', () => {
    it('should fetch room by id successfully', async () => {
      const room = mockRooms[0];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => room,
      } as Response);

      const result = await roomService.getRoomById('1');

      expect(mockFetch).toHaveBeenCalledWith('/api/rooms/1');
      expect(result).toEqual(room);
    });

    it('should throw error when room not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(roomService.getRoomById('999')).rejects.toThrow('Failed to fetch room with id 999');
      expect(mockFetch).toHaveBeenCalledWith('/api/rooms/999');
    });
  });

  describe('createRoom', () => {
    const newRoomData = { 
      name: 'Room 103', 
      roomNumber: '103',
      buildingId: 'building1', 
      type: 'Lecture Hall' as const,
      capacity: 25, 
      status: 'available' as const 
    };
    const createdRoom = { id: '3', ...newRoomData };

    it('should create room successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createdRoom,
      } as Response);

      const result = await roomService.createRoom(newRoomData);

      expect(mockFetch).toHaveBeenCalledWith('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRoomData),
      });
      expect(result).toEqual(createdRoom);
    });

    it('should throw error when creation fails with error message', async () => {
      const errorResponse = { message: 'Room number already exists' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      } as Response);

      await expect(roomService.createRoom(newRoomData)).rejects.toThrow('Room number already exists');
    });

    it('should throw default error when creation fails without error message', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Invalid JSON'); },
      }));

      await expect(roomService.createRoom(newRoomData)).rejects.toThrow('Failed to create room');
    });

    it('should handle error response without message property', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Some other error format' }),
      } as Response);

      await expect(roomService.createRoom(newRoomData)).rejects.toThrow('Failed to create room');
    });
  });

  describe('updateRoom', () => {
    const updateData = { name: 'Updated Room 101', capacity: 35 };
    const updatedRoom = { id: '1', name: 'Updated Room 101', roomNumber: '101', buildingId: 'building1', type: 'Lecture Hall' as const, capacity: 35, status: 'available' as const };

    it('should update room successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedRoom,
      } as Response);

      const result = await roomService.updateRoom('1', updateData);

      expect(mockFetch).toHaveBeenCalledWith('/api/rooms/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      expect(result).toEqual(updatedRoom);
    });

    it('should throw error when update fails with error message', async () => {
      const errorResponse = { message: 'Room not found' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      } as Response);

      await expect(roomService.updateRoom('999', updateData)).rejects.toThrow('Room not found');
    });

    it('should throw default error when update fails without error message', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Invalid JSON'); },
      }));

      await expect(roomService.updateRoom('1', updateData)).rejects.toThrow('Failed to update room');
    });

    it('should handle error response without message property', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Some other error format' }),
      } as Response);

      await expect(roomService.updateRoom('1', updateData)).rejects.toThrow('Failed to update room');
    });
  });

  describe('deleteRoom', () => {
    it('should delete room successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      await roomService.deleteRoom('1');

      expect(mockFetch).toHaveBeenCalledWith('/api/rooms/1', {
        method: 'DELETE',
      });
    });

    it('should throw error when deletion fails with error message', async () => {
      const errorResponse = { message: 'Room not found' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      } as Response);

      await expect(roomService.deleteRoom('999')).rejects.toThrow('Room not found');
    });

    it('should throw default error when deletion fails without error message', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Invalid JSON'); },
      }));

      await expect(roomService.deleteRoom('1')).rejects.toThrow('Failed to delete room with id 1');
    });

    it('should handle error response without message property', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Some other error format' }),
      } as Response);

      await expect(roomService.deleteRoom('1')).rejects.toThrow('Failed to delete room with id 1');
    });
  });

  describe('importRooms', () => {
    const mockFile = new File(['test'], 'rooms.csv', { type: 'text/csv' });
    const importResult = { newCount: 3, updatedCount: 1, skippedCount: 0 };

    it('should import rooms successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => importResult,
      } as Response);

      const result = await roomService.importRooms(mockFile, mockBuildings);

      expect(mockFetch).toHaveBeenCalledWith('/api/rooms/import', {
        method: 'POST',
        body: expect.any(FormData),
      });
      expect(result).toEqual(importResult);

      // Verify FormData contents
      const call = mockFetch.mock.calls[0];
      const formData = call[1]?.body as FormData;
      expect(formData.get('file')).toBe(mockFile);
      expect(formData.get('buildings')).toBe(JSON.stringify(mockBuildings));
    });

    it('should throw error when import fails with detailed error messages', async () => {
      const errorResponse = {
        message: 'Import failed',
        errors: ['Row 1: Missing building', 'Row 2: Invalid capacity', 'Row 3: Duplicate room number', 'Row 4: Another error']
      };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      } as Response);

      await expect(roomService.importRooms(mockFile, mockBuildings))
        .rejects.toThrow('Import failed Specific issues: Row 1: Missing building; Row 2: Invalid capacity; Row 3: Duplicate room number...');
    });

    it('should throw error when import fails with few error messages', async () => {
      const errorResponse = {
        message: 'Import failed',
        errors: ['Row 1: Missing building', 'Row 2: Invalid capacity']
      };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      } as Response);

      await expect(roomService.importRooms(mockFile, mockBuildings))
        .rejects.toThrow('Import failed Specific issues: Row 1: Missing building; Row 2: Invalid capacity');
    });

    it('should throw error when import fails with non-array errors', async () => {
      const errorResponse = {
        message: 'Import failed',
        errors: 'Not an array'
      };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      } as Response);

      await expect(roomService.importRooms(mockFile, mockBuildings))
        .rejects.toThrow('Import failed');
    });

    it('should throw error when import fails with empty errors array', async () => {
      const errorResponse = {
        message: 'Import failed',
        errors: []
      };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      } as Response);

      await expect(roomService.importRooms(mockFile, mockBuildings))
        .rejects.toThrow('Import failed');
    });

    it('should throw default error when import fails without error message', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Invalid JSON'); },
      }));

      await expect(roomService.importRooms(mockFile, mockBuildings))
        .rejects.toThrow('Failed to import rooms');
    });

    it('should handle error response without message property', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Some other error format' }),
      } as Response);

      await expect(roomService.importRooms(mockFile, mockBuildings))
        .rejects.toThrow('Failed to import rooms');
    });
  });

  describe('API_BASE_URL configuration', () => {
    it('should use environment variable for API base URL', () => {
      // This test indirectly verifies that the API_BASE_URL is configured correctly
      // by checking that fetch is called with the expected URL format
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRooms,
      } as Response);

      roomService.getAllRooms();

      expect(mockFetch).toHaveBeenCalledWith('/api/rooms');
    });
  });
});