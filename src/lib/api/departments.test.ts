import { departmentService } from './departments';
import type { Department } from '@/types/entities';
import { describe, it, expect, jest } from '@jest/globals';

// Mock the fetch function
// Create a proper mock for the Response object
const createMockResponse = (options: { ok: boolean; status?: number; statusText?: string; json?: () => Promise<any> }): Response => {
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

describe('Department API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDepartments', () => {
    it('should fetch and return a list of departments', async () => {
      const mockDepartments = [{ id: 1, name: 'Department 1' }, { id: 2, name: 'Department 2' }];
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockDepartments,
      }));

      const departments = await departmentService.getAllDepartments();
      expect(departments).toEqual(mockDepartments);
      expect(fetch).toHaveBeenCalledWith('/api/departments');
    });

    it('should throw an error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      }));

      await expect(departmentService.getAllDepartments()).rejects.toThrow('Failed to fetch departments');
    });
  });

  describe('getDepartment', () => {
    it('should fetch and return a single department', async () => {
      const mockDepartment = { id: 1, name: 'Department 1' };
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockDepartment,
      }));

      const department = await departmentService.getDepartmentById('1');
      expect(department).toEqual(mockDepartment);
      expect(fetch).toHaveBeenCalledWith('/api/departments/1');
    });

    it('should throw an error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }));

      await expect(departmentService.getDepartmentById('999')).rejects.toThrow('Failed to fetch department with id 999');
    });
  });

  describe('createDepartment', () => {
    it('should create a new department', async () => {
      const newDepartment = { name: 'New Department' };
      const createdDepartment = { id: 3, ...newDepartment };
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => createdDepartment,
      }));

      const department = await departmentService.createDepartment(newDepartment as Omit<Department, 'id'>);
      expect(department).toEqual(createdDepartment);
      expect(fetch).toHaveBeenCalledWith('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDepartment)
      });
    });

    it('should throw an error if creation fails', async () => {
        const newDepartment = { name: 'New Department' };
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      }));

      await expect(departmentService.createDepartment(newDepartment as Omit<Department, 'id'>)).rejects.toThrow('Failed to create department');
    });
  });

  describe('updateDepartment', () => {
    it('should update an existing department', async () => {
      const updatedDepartment = { id: 1, name: 'Updated Department' };
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => updatedDepartment,
      }));

      const department = await departmentService.updateDepartment('1', { name: 'Updated Department' });
      expect(department).toEqual(updatedDepartment);
      expect(fetch).toHaveBeenCalledWith('/api/departments/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Updated Department' })
      });
    });

    it('should throw an error if update fails', async () => {
        const updatedDepartment = { id: 1, name: 'Updated Department' };
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      }));

      await expect(departmentService.updateDepartment('1', { name: 'Updated Department' })).rejects.toThrow('Failed to update department');
    });
  });

  describe('deleteDepartment', () => {
    it('should delete a department', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true
      }));

      await departmentService.deleteDepartment('1');
      expect(fetch).toHaveBeenCalledWith('/api/departments/1', {
        method: 'DELETE'
      });
    });

    it('should throw an error if deletion fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }));

      await expect(departmentService.deleteDepartment('999')).rejects.toThrow('Failed to delete department with id 999');
    });
  });
});