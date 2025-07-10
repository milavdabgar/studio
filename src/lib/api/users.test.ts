import { userService } from './users';
import { User, Institute, Role } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the fetch function
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Helper to create mock responses
const createMockResponse = (options: { ok: boolean; status?: number; json: () => Promise<unknown> }): Response => {
  return {
    ok: options.ok,
    status: options.status || (options.ok ? 200 : 500),
    statusText: '',
    json: options.json,
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

describe('User API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Create a mock user that matches the User interface
  const createMockUser = (id: string): User => ({
    id,
    email: `test${id}@example.com`,
    displayName: `Test User ${id}`,
    authProviders: ['password'],
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    isActive: true,
    isEmailVerified: true,
    roles: ['user'],
    currentRole: 'user',
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: false,
        sms: false
      },
      dashboard: {
        layout: 'default',
        favorites: []
      }
    },
    firstName: 'Test',
    lastName: 'User',
    password: 'password123' // Only for creation/update
  });

  it('should create a user', async () => {
    const mockUser = createMockUser('1');
    mockFetch.mockResolvedValue(createMockResponse({
      ok: true,
      json: async () => mockUser
    }));

    const user = await userService.createUser(mockUser);
    expect(fetch).toHaveBeenCalledWith('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockUser),
    });
    expect(user).toEqual(mockUser);
  });

  it('should get a user by ID', async () => {
    const mockUser = createMockUser('1');
    mockFetch.mockResolvedValue(createMockResponse({
      ok: true,
      json: async () => mockUser
    }));

    const user = await userService.getUserById('1');
    expect(fetch).toHaveBeenCalledWith('/api/users/1');
    expect(user).toEqual(mockUser);
  });

  it('should get all users', async () => {
    const mockUsers: User[] = [
      createMockUser('1'),
      createMockUser('2')
    ];
    mockFetch.mockResolvedValue(createMockResponse({
      ok: true,
      json: async () => mockUsers
    }));

    const users = await userService.getAllUsers();
    expect(fetch).toHaveBeenCalledWith('/api/users');
    expect(users).toEqual(mockUsers);
  });

  it('should update a user', async () => {
    const mockUser = {
      ...createMockUser('1'),
      displayName: 'Updated User',
      email: 'updated@example.com'
    };
    mockFetch.mockResolvedValue(createMockResponse({
      ok: true,
      json: async () => mockUser
    }));

    const user = await userService.updateUser('1', mockUser);
    expect(fetch).toHaveBeenCalledWith('/api/users/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockUser),
    });
    expect(user).toEqual(mockUser);
  });

  it('should delete a user', async () => {
    mockFetch.mockResolvedValue(createMockResponse({
      ok: true,
      json: async () => ({})
    }));

    await userService.deleteUser('1');
    expect(fetch).toHaveBeenCalledWith('/api/users/1', {
      method: 'DELETE',
    });
  });

  it('should import users', async () => {
    const mockResult = { 
      newCount: 2, 
      updatedCount: 1, 
      skippedCount: 0 
    };
    mockFetch.mockResolvedValue(createMockResponse({
      ok: true,
      json: async () => mockResult
    }));
    
    const mockFile = new File([""], "users.csv", { type: 'text/csv' });
    const mockInstitutes: Institute[] = [{ id: 'inst1', name: 'Test Institute', code: 'TI', status: 'active' }];
    const mockSystemRoles: Role[] = [{ id: 'role1', name: 'User', code: 'student' as any, description: 'User role', permissions: [] }]; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    const result = await userService.importUsers(mockFile, mockInstitutes, mockSystemRoles);
    expect(fetch).toHaveBeenCalledWith('/api/users/import', expect.anything());
    expect(result).toEqual(mockResult);
  });

  it('should handle errors when creating a user', async () => {
    const mockUser = createMockUser('1');
    mockFetch.mockResolvedValue(createMockResponse({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Failed to create user' })
    }));

    await expect(userService.createUser(mockUser)).rejects.toThrow('Failed to create user');
  });

  it('should handle errors when getting a user', async () => {
    mockFetch.mockResolvedValue(createMockResponse({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Failed to fetch user' })
    }));

    await expect(userService.getUserById('1')).rejects.toThrow('Failed to fetch user');
  });

  it('should handle errors when getting users', async () => {
    mockFetch.mockResolvedValue(createMockResponse({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Failed to fetch users' })
    }));

    await expect(userService.getAllUsers()).rejects.toThrow('Failed to fetch users');
  });

  it('should handle errors when updating a user', async () => {
    const mockUser = createMockUser('1');
    mockFetch.mockResolvedValue(createMockResponse({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Failed to update user' })
    }));

    await expect(userService.updateUser('1', mockUser)).rejects.toThrow('Failed to update user');
  });

  it('should handle errors when deleting a user', async () => {
    mockFetch.mockResolvedValue(createMockResponse({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Failed to delete user with id 1' })
    }));

    await expect(userService.deleteUser('1')).rejects.toThrow('Failed to delete user with id 1');
  });

  it('should handle errors when importing users', async () => {
    mockFetch.mockResolvedValue(createMockResponse({
      ok: false,
      status: 400,
      json: async () => ({ 
        message: 'Failed to import users',
        errors: ['Invalid CSV format', 'Missing required fields']
      })
    }));
    const mockFile = new File([""], "users.csv", { type: 'text/csv' });

    await expect(userService.importUsers(mockFile, [], [])).rejects.toThrow('Failed to import users');
  });

  it('should handle JSON parse errors', async () => {
    mockFetch.mockResolvedValue(createMockResponse({
      ok: false,
      status: 400,
      json: async () => { throw new Error('Invalid JSON'); }
    }));

    await expect(userService.getUserById('1')).rejects.toThrow('Failed to fetch user');
  });
});
