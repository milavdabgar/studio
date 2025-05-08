import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  getDepartments,
  updateDepartment,
} from './departments';
import { describe, it, expect, jest } from '@jest/globals';

// Mock the fetch function
global.fetch = jest.fn();

describe('Department API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDepartments', () => {
    it('should fetch and return a list of departments', async () => {
      const mockDepartments = [{ id: 1, name: 'Department 1' }, { id: 2, name: 'Department 2' }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartments,
      });

      const departments = await getDepartments();
      expect(departments).toEqual(mockDepartments);
      expect(fetch).toHaveBeenCalledWith('/api/departments');
    });

    it('should throw an error if fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(getDepartments()).rejects.toThrow('Failed to fetch departments: 500 Internal Server Error');
    });
  });

  describe('getDepartment', () => {
    it('should fetch and return a single department', async () => {
      const mockDepartment = { id: 1, name: 'Department 1' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartment,
      });

      const department = await getDepartment(1);
      expect(department).toEqual(mockDepartment);
      expect(fetch).toHaveBeenCalledWith('/api/departments/1');
    });

    it('should throw an error if fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(getDepartment(999)).rejects.toThrow('Failed to fetch department: 404 Not Found');
    });
  });

  describe('createDepartment', () => {
    it('should create a new department', async () => {
      const newDepartment = { name: 'New Department' };
      const createdDepartment = { id: 3, ...newDepartment };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createdDepartment,
      });

      const department = await createDepartment(newDepartment);
      expect(department).toEqual(createdDepartment);
      expect(fetch).toHaveBeenCalledWith('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDepartment),
      });
    });

    it('should throw an error if creation fails', async () => {
        const newDepartment = { name: 'New Department' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      await expect(createDepartment(newDepartment)).rejects.toThrow('Failed to create department: 400 Bad Request');
    });
  });

  describe('updateDepartment', () => {
    it('should update an existing department', async () => {
      const updatedDepartment = { id: 1, name: 'Updated Department' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedDepartment,
      });

      const department = await updateDepartment(updatedDepartment);
      expect(department).toEqual(updatedDepartment);
      expect(fetch).toHaveBeenCalledWith('/api/departments/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedDepartment),
      });
    });

    it('should throw an error if update fails', async () => {
        const updatedDepartment = { id: 1, name: 'Updated Department' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      await expect(updateDepartment(updatedDepartment)).rejects.toThrow('Failed to update department: 400 Bad Request');
    });
  });

  describe('deleteDepartment', () => {
    it('should delete a department', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      await deleteDepartment(1);
      expect(fetch).toHaveBeenCalledWith('/api/departments/1', {
        method: 'DELETE',
      });
    });

    it('should throw an error if deletion fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(deleteDepartment(999)).rejects.toThrow('Failed to delete department: 404 Not Found');
    });
  });
});