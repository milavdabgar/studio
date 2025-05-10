import { describe, it, expect, jest } from '@jest/globals';
import { roomService } from './roomService';
import type { Room, RoomType, RoomStatus } from '@/types/entities';

describe('RoomService', () => {
  const mockRooms: Room[] = [
    { id: '1', name: 'Room 101', roomNumber: '101', buildingId: 'building1', type: 'Lecture Hall' as RoomType, capacity: 30, status: 'available' as RoomStatus },
    { id: '2', name: 'Room 102', roomNumber: '102', buildingId: 'building1', type: 'Laboratory' as RoomType, capacity: 40, status: 'available' as RoomStatus },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRooms', () => {
    it('should return all rooms', async () => {
      jest.spyOn(roomService, 'getAllRooms').mockResolvedValue(mockRooms);
      const rooms = await roomService.getAllRooms();
      expect(rooms).toEqual(mockRooms);
      expect(roomService.getAllRooms).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if getAllRooms API call fails', async () => {
      jest.spyOn(roomService, 'getAllRooms').mockRejectedValue(new Error('API Error'));
      await expect(roomService.getAllRooms()).rejects.toThrow('API Error');
      expect(roomService.getAllRooms).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRoomById', () => {
    it('should return a room by ID', async () => {
      const roomId = '1';
      const expectedRoom = mockRooms[0];
      jest.spyOn(roomService, 'getRoomById').mockResolvedValue(expectedRoom);
      const room = await roomService.getRoomById(roomId);
      expect(room).toEqual(expectedRoom);
      expect(roomService.getRoomById).toHaveBeenCalledWith(roomId);
    });

    it('should throw an error if getRoomById API call fails', async () => {
      const roomId = '1';
      jest.spyOn(roomService, 'getRoomById').mockRejectedValue(new Error('API Error'));
      await expect(roomService.getRoomById(roomId)).rejects.toThrow('API Error');
      expect(roomService.getRoomById).toHaveBeenCalledWith(roomId);
    });
  });

  describe('createRoom', () => {
    it('should create a new room', async () => {
      const newRoomData = { name: 'Room 103', capacity: 50, buildingId: 'building1', floor: 1, roomNumber: '103', status: 'active' };
      const createdRoom = { id: '3', ...newRoomData };
      jest.spyOn(roomService, 'createRoom').mockResolvedValue(createdRoom);
      const room = await roomService.createRoom(newRoomData);
      expect(room).toEqual(createdRoom);
      expect(roomService.createRoom).toHaveBeenCalledWith(newRoomData);
    });

    it('should throw an error if createRoom API call fails', async () => {
      const newRoomData = { name: 'Room 103', capacity: 50, buildingId: 'building1', floor: 1, roomNumber: '103', status: 'active' };
      jest.spyOn(roomService, 'createRoom').mockRejectedValue(new Error('API Error'));
      await expect(roomService.createRoom(newRoomData)).rejects.toThrow('API Error');
      expect(roomService.createRoom).toHaveBeenCalledWith(newRoomData);
    });
  });

  describe('updateRoom', () => {
    it('should update an existing room', async () => {
      const roomId = '1';
      const updatedRoomData = { name: 'Room 101 Updated', capacity: 35 };
      const updatedRoom = { ...mockRooms[0], ...updatedRoomData };
      jest.spyOn(roomService, 'updateRoom').mockResolvedValue(updatedRoom);
      const room = await roomService.updateRoom(roomId, updatedRoomData);
      expect(room).toEqual(updatedRoom);
      expect(roomService.updateRoom).toHaveBeenCalledWith(roomId, updatedRoomData);
    });

    it('should throw an error if updateRoom API call fails', async () => {
      const roomId = '1';
      const updatedRoomData = { name: 'Room 101 Updated', capacity: 35 };
      jest.spyOn(roomService, 'updateRoom').mockRejectedValue(new Error('API Error'));
      await expect(roomService.updateRoom(roomId, updatedRoomData)).rejects.toThrow('API Error');
      expect(roomService.updateRoom).toHaveBeenCalledWith(roomId, updatedRoomData);
    });
  });

  describe('deleteRoom', () => {
    it('should delete a room', async () => {
      const roomId = '1';
      jest.spyOn(roomService, 'deleteRoom').mockResolvedValue(undefined);
      await roomService.deleteRoom(roomId);
      expect(roomService.deleteRoom).toHaveBeenCalledWith(roomId);
    });

    it('should throw an error if deleteRoom API call fails', async () => {
      const roomId = '1';
      jest.spyOn(roomService, 'deleteRoom').mockRejectedValue(new Error('API Error'));
      await expect(roomService.deleteRoom(roomId)).rejects.toThrow('API Error');
      expect(roomService.deleteRoom).toHaveBeenCalledWith(roomId);
    });
  });
});