import {
  createProgram,
  getProgram,
  getPrograms,
  updateProgram,
  deleteProgram,
  importPrograms,
} from './programs';
import { mock } from 'jest-mock-extended';
import { db } from '@/lib/db';
import {
  programs,
  type Program,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

jest.mock('@/lib/db');

describe('Program API Functions', () => {
  const mockProgram: Program = {
    id: 'test-program-id',
    name: 'Test Program',
    instituteId: 'test-institute-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProgram', () => {
    it('should create a program', async () => {
      const mockDb = mock<typeof db>();
      (mockDb.insert as jest.Mock).mockReturnValueOnce({
        returning: jest.fn().mockResolvedValueOnce([mockProgram]),
      });
      const newProgramData = {
        name: 'Test Program',
        instituteId: 'test-institute-id',
      };
      const result = await createProgram(newProgramData, mockDb);
      expect(mockDb.insert).toHaveBeenCalledWith(programs);
      expect(result).toEqual(mockProgram);
    });

    it('should throw an error if creation fails', async () => {
      const mockDb = mock<typeof db>();
      (mockDb.insert as jest.Mock).mockRejectedValueOnce(new Error('Failed to create program'));
      const newProgramData = {
        name: 'Test Program',
        instituteId: 'test-institute-id',
      };
      await expect(createProgram(newProgramData, mockDb)).rejects.toThrow('Failed to create program');
    });
  });

  describe('getProgram', () => {
    it('should get a program by id', async () => {
      const mockDb = mock<typeof db>();
      (mockDb.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockResolvedValueOnce([mockProgram]),
        }),
      });
      const result = await getProgram(mockProgram.id, mockDb);
      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockProgram);
    });

    it('should throw an error if get fails', async () => {
      const mockDb = mock<typeof db>();
      (mockDb.select as jest.Mock).mockRejectedValueOnce(new Error('Failed to get program'));
      await expect(getProgram('test-program-id', mockDb)).rejects.toThrow('Failed to get program');
    });

    it('should return null if program is not found', async () => {
      const mockDb = mock<typeof db>();
        (mockDb.select as jest.Mock).mockReturnValueOnce({
          from: jest.fn().mockReturnValueOnce({
            where: jest.fn().mockResolvedValueOnce([]),
          }),
        });
      const result = await getProgram('non-existent-program-id', mockDb);
      expect(result).toBeNull();
    });
  });

  describe('getPrograms', () => {
    it('should get all programs', async () => {
      const mockDb = mock<typeof db>();
      (mockDb.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockResolvedValueOnce([mockProgram]),
      });
      const result = await getPrograms(mockDb);
      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual([mockProgram]);
    });

    it('should throw an error if get all fails', async () => {
      const mockDb = mock<typeof db>();
      (mockDb.select as jest.Mock).mockRejectedValueOnce(new Error('Failed to get programs'));
      await expect(getPrograms(mockDb)).rejects.toThrow('Failed to get programs');
    });
  });

  describe('updateProgram', () => {
    it('should update a program', async () => {
      const mockDb = mock<typeof db>();
      (mockDb.update as jest.Mock).mockReturnValueOnce({
        returning: jest.fn().mockResolvedValueOnce([mockProgram]),
      });
      const updatedProgramData = { name: 'Updated Test Program' };
      const result = await updateProgram(mockProgram.id, updatedProgramData, mockDb);
      expect(mockDb.update).toHaveBeenCalledWith(programs);
      expect(result).toEqual(mockProgram);
    });

    it('should throw an error if update fails', async () => {
      const mockDb = mock<typeof db>();
      (mockDb.update as jest.Mock).mockRejectedValueOnce(new Error('Failed to update program'));
      const updatedProgramData = { name: 'Updated Test Program' };
      await expect(updateProgram(mockProgram.id, updatedProgramData, mockDb)).rejects.toThrow('Failed to update program');
    });

    it('should return null if program is not found', async () => {
      const mockDb = mock<typeof db>();
      (mockDb.update as jest.Mock).mockReturnValueOnce({
        returning: jest.fn().mockResolvedValueOnce([]),
      });
      const updatedProgramData = { name: 'Updated Test Program' };
      const result = await updateProgram('non-existent-program-id', updatedProgramData, mockDb);
      expect(result).toBeNull();
    });
  });

  describe('deleteProgram', () => {
    it('should delete a program', async () => {
      const mockDb = mock<typeof db>();
      (mockDb.delete as jest.Mock).mockReturnValueOnce({
        returning: jest.fn().mockResolvedValueOnce([mockProgram]),
      });
      const result = await deleteProgram(mockProgram.id, mockDb);
      expect(mockDb.delete).toHaveBeenCalledWith(programs);
      expect(result).toEqual(mockProgram);
    });

    it('should throw an error if delete fails', async () => {
      const mockDb = mock<typeof db>();
      (mockDb.delete as jest.Mock).mockRejectedValueOnce(new Error('Failed to delete program'));
      await expect(deleteProgram(mockProgram.id, mockDb)).rejects.toThrow('Failed to delete program');
    });

    it('should return null if program is not found', async () => {
      const mockDb = mock<typeof db>();
      (mockDb.delete as jest.Mock).mockReturnValueOnce({
        returning: jest.fn().mockResolvedValueOnce([]),
      });
      const result = await deleteProgram('non-existent-program-id', mockDb);
      expect(result).toBeNull();
    });
  });

    describe('importPrograms', () => {
    it('should import programs', async () => {
      const mockDb = mock<typeof db>();
      const mockProgramsData = [{
        name: 'Test Program 1',
        instituteId: 'test-institute-id-1',
      },{
        name: 'Test Program 2',
        instituteId: 'test-institute-id-2',
      }];

      (mockDb.insert as jest.Mock).mockReturnValueOnce({
        returning: jest.fn().mockResolvedValueOnce([mockProgram]),
      });
      const result = await importPrograms(mockProgramsData, mockDb);
      expect(mockDb.insert).toHaveBeenCalledWith(programs);
    });

    it('should throw an error if import fails', async () => {
        const mockDb = mock<typeof db>();
        const mockProgramsData = [{
            name: 'Test Program 1',
            instituteId: 'test-institute-id-1',
        },{
            name: 'Test Program 2',
            instituteId: 'test-institute-id-2',
        }];
      (mockDb.insert as jest.Mock).mockRejectedValueOnce(new Error('Failed to import program'));
      await expect(importPrograms(mockProgramsData, mockDb)).rejects.toThrow('Failed to import program');
    });
  });
});