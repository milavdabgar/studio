import { describe, it, expect, jest } from '@jest/globals';
import { getRooms, getRoomById, createRoom, updateRoom, deleteRoom } from './roomService';
import * as api from '../api/rooms';

jest.mock('../api/rooms');

describe('RoomService', () => {
  const mockRooms = [
    { id: '1', name: 'Room 101', capacity: 30 },
    { id: '2', name: 'Room 102', capacity: 40 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRooms', () => {
    it('should return all rooms', async () => {
      (api.getRooms as jest.Mock).mockResolvedValue(mockRooms);
      const rooms = await getRooms();
      expect(rooms).toEqual(mockRooms);
      expect(api.getRooms).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if getRooms API call fails', async () => {
      (api.getRooms as jest.Mock).mockRejectedValue(new Error('API Error'));
      await expect(getRooms()).rejects.toThrow('API Error');
      expect(api.getRooms).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRoomById', () => {
    it('should return a room by ID', async () => {
      const roomId = '1';
      const expectedRoom = mockRooms[0];
      (api.getRoomById as jest.Mock).mockResolvedValue(expectedRoom);
      const room = await getRoomById(roomId);
      expect(room).toEqual(expectedRoom);
      expect(api.getRoomById).toHaveBeenCalledWith(roomId);
    });

    it('should throw an error if getRoomById API call fails', async () => {
      const roomId = '1';
      (api.getRoomById as jest.Mock).mockRejectedValue(new Error('API Error'));
      await expect(getRoomById(roomId)).rejects.toThrow('API Error');
      expect(api.getRoomById).toHaveBeenCalledWith(roomId);
    });
  });

  describe('createRoom', () => {
    it('should create a new room', async () => {
      const newRoomData = { name: 'Room 103', capacity: 50 };
      const createdRoom = { id: '3', ...newRoomData };
      (api.createRoom as jest.Mock).mockResolvedValue(createdRoom);
      const room = await createRoom(newRoomData);
      expect(room).toEqual(createdRoom);
      expect(api.createRoom).toHaveBeenCalledWith(newRoomData);
    });

    it('should throw an error if createRoom API call fails', async () => {
      const newRoomData = { name: 'Room 103', capacity: 50 };
      (api.createRoom as jest.Mock).mockRejectedValue(new Error('API Error'));
      await expect(createRoom(newRoomData)).rejects.toThrow('API Error');
      expect(api.createRoom).toHaveBeenCalledWith(newRoomData);
    });
  });

  describe('updateRoom', () => {
    it('should update an existing room', async () => {
      const roomId = '1';
      const updatedRoomData = { name: 'Room 101 Updated', capacity: 35 };
      const updatedRoom = { id: roomId, ...updatedRoomData };
      (api.updateRoom as jest.Mock).mockResolvedValue(updatedRoom);
      const room = await updateRoom(roomId, updatedRoomData);
      expect(room).toEqual(updatedRoom);
      expect(api.updateRoom).toHaveBeenCalledWith(roomId, updatedRoomData);
    });

    it('should throw an error if updateRoom API call fails', async () => {
      const roomId = '1';
      const updatedRoomData = { name: 'Room 101 Updated', capacity: 35 };
      (api.updateRoom as jest.Mock).mockRejectedValue(new Error('API Error'));
      await expect(updateRoom(roomId, updatedRoomData)).rejects.toThrow('API Error');
      expect(api.updateRoom).toHaveBeenCalledWith(roomId, updatedRoomData);
    });
  });

  describe('deleteRoom', () => {
    it('should delete a room', async () => {
      const roomId = '1';
      (api.deleteRoom as jest.Mock).mockResolvedValue(undefined);
      await deleteRoom(roomId);
      expect(api.deleteRoom).toHaveBeenCalledWith(roomId);
    });

    it('should throw an error if deleteRoom API call fails', async () => {
      const roomId = '1';
      (api.deleteRoom as jest.Mock).mockRejectedValue(new Error('API Error'));
      await expect(deleteRoom(roomId)).rejects.toThrow('API Error');
      expect(api.deleteRoom).toHaveBeenCalledWith(roomId);
    });
  });
});