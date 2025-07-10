import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Unmock the roles module to test the actual implementation
jest.unmock('@/lib/api/roles');

import { roleService } from './roles';
import type { Role } from '@/types/entities';

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

describe('Role API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRole: Role = {
    id: '1',
    name: 'Admin Role',
    code: 'admin_role',
    permissions: ['manage_users', 'manage_roles', 'manage_settings'],
    description: 'Administrator role with full access',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  };

  const mockRoles: Role[] = [
    mockRole,
    {
      id: '2',
      name: 'Teacher Role',
      code: 'teacher_role',
      permissions: ['view_courses', 'grade_assignments'],
      description: 'Teacher role with limited access',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    }
  ];

  describe('getAllRoles', () => {
    it('should fetch all roles', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockRoles
      }));

      const roles = await roleService.getAllRoles();
      expect(roles).toEqual(mockRoles);
      expect(fetch).toHaveBeenCalledWith('/api/roles');
    });

    it('should throw an error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Failed to fetch roles' })
      }));

      await expect(roleService.getAllRoles()).rejects.toThrow('Failed to fetch roles');
    });
  });

  describe('getRoleById', () => {
    it('should fetch a single role by id', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockRole
      }));

      const role = await roleService.getRoleById('1');
      expect(role).toEqual(mockRole);
      expect(fetch).toHaveBeenCalledWith('/api/roles/1');
    });

    it('should throw an error if role not found', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Failed to fetch role with id 3' })
      }));

      await expect(roleService.getRoleById('3')).rejects.toThrow('Failed to fetch role with id 3');
    });
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      const newRoleData: Omit<Role, 'id'> = {
        name: 'New Role',
        code: 'new_role',
        permissions: ['view_courses', 'submit_assignments'],
        description: 'Student role',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      const createdRole = {
        ...newRoleData,
        id: '3'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        status: 201,
        json: async () => createdRole
      }));

      const role = await roleService.createRole(newRoleData);
      expect(role).toEqual(createdRole);
      expect(fetch).toHaveBeenCalledWith('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRoleData)
      });
    });

    it('should throw an error if creation fails', async () => {
      const newRoleData: Omit<Role, 'id'> = {
        name: 'New Role',
        code: 'new_role',
        permissions: ['view_courses', 'submit_assignments'],
        description: 'Student role',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Failed to create role' })
      }));

      await expect(roleService.createRole(newRoleData)).rejects.toThrow('Failed to create role');
    });

    it('should handle JSON parse error during creation', async () => {
      const newRoleData: Omit<Role, 'id'> = {
        name: 'New Role',
        code: 'new_role',
        permissions: ['view_courses', 'submit_assignments'],
        description: 'Student role',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Invalid JSON'); }
      }));

      await expect(roleService.createRole(newRoleData)).rejects.toThrow('Failed to create role');
    });
  });

  describe('updateRole', () => {
    it('should update an existing role', async () => {
      const updateData = {
        name: 'Updated Role',
        description: 'Updated description'
      };

      const updatedRole = {
        ...mockRole,
        ...updateData,
        updatedAt: '2023-01-02T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => updatedRole
      }));

      const role = await roleService.updateRole('1', updateData);
      expect(role).toEqual(updatedRole);
      expect(fetch).toHaveBeenCalledWith('/api/roles/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
    });

    it('should throw an error if update fails', async () => {
      const updateData = {
        name: 'Updated Role'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Failed to update role' })
      }));

      await expect(roleService.updateRole('3', updateData)).rejects.toThrow('Failed to update role');
    });

    it('should handle JSON parse error during update', async () => {
      const updateData = {
        name: 'Updated Role'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => { throw new Error('Invalid JSON'); }
      }));

      await expect(roleService.updateRole('3', updateData)).rejects.toThrow('Failed to update role');
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true
      }));

      await roleService.deleteRole('1');
      expect(fetch).toHaveBeenCalledWith('/api/roles/1', {
        method: 'DELETE'
      });
    });

    it('should throw an error if deletion fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Failed to delete role' })
      }));

      await expect(roleService.deleteRole('3')).rejects.toThrow('Failed to delete role');
    });

    it('should handle JSON parse error during deletion', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => { throw new Error('Invalid JSON'); }
      }));

      await expect(roleService.deleteRole('3')).rejects.toThrow('Failed to delete role');
    });
  });

  describe('importRoles', () => {
    it('should import roles from a file', async () => {
      const mockFile = new File(['test data'], 'roles.csv', { type: 'text/csv' });
      const mockResponse = { newCount: 3, updatedCount: 1, skippedCount: 0 };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockResponse
      }));

      const result = await roleService.importRoles(mockFile);
      expect(result).toEqual(mockResponse);
      
      // Check that FormData was created correctly
      expect(fetch).toHaveBeenCalledWith('/api/roles/import', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });

    it('should throw an error if import fails', async () => {
      const mockFile = new File(['test data'], 'roles.csv', { type: 'text/csv' });
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ 
          message: 'Failed to import roles',
          errors: [
            'Invalid CSV format',
            'Missing required fields',
            'Duplicate role names'
          ]
        })
      }));

      await expect(roleService.importRoles(mockFile)).rejects.toThrow(
        'Failed to import roles Specific issues: Invalid CSV format; Missing required fields; Duplicate role names'
      );
    });

    it('should handle JSON parse error during import', async () => {
      const mockFile = new File(['test data'], 'roles.csv', { type: 'text/csv' });
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Invalid JSON'); }
      }));

      await expect(roleService.importRoles(mockFile)).rejects.toThrow('Failed to import roles');
    });
  });
});
