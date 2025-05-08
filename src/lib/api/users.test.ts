import { userService } from './users';

import { User } from '@/types/entities';

// Mock the fetch function
global.fetch = jest.fn();

describe('User API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a user', async () => {
    const mockUser: User = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      roleId: '1',
    };
    const mockResponse = { ok: true, json: () => Promise.resolve(mockUser) };
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const user = await userService.createUser(mockUser);
    expect(fetch).toHaveBeenCalledWith('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockUser),
    });
    expect(user).toEqual(mockUser);
  });

  it('should get a user by ID', async () => {
    const mockUser: User = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      roleId: '1',
    };
    const mockResponse = { ok: true, json: () => Promise.resolve(mockUser) };
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const user = await userService.getUserById('1');
    expect(fetch).toHaveBeenCalledWith('/api/users/1');
    expect(user).toEqual(mockUser);
  });

  it('should get all users', async () => {
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'Test User 1',
        email: 'test1@example.com',
        password: 'password123',
        roleId: '1',
      },
      {
        id: '2',
        name: 'Test User 2',
        email: 'test2@example.com',
        password: 'password123',
        roleId: '1',
      },
    ];
    const mockResponse = { ok: true, json: () => Promise.resolve(mockUsers) };
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const users = await userService.getAllUsers();
    expect(fetch).toHaveBeenCalledWith('/api/users');
    expect(users).toEqual(mockUsers);
  });

  it('should update a user', async () => {
    const mockUser: User = {
      id: '1',
      name: 'Updated User',
      email: 'updated@example.com',
      password: 'password123',
      roleId: '1',
    };
    const mockResponse = { ok: true, json: () => Promise.resolve(mockUser) };
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const user = await userService.updateUser('1', mockUser);
    expect(fetch).toHaveBeenCalledWith('/api/users/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockUser),
    });
    expect(user).toEqual(mockUser);
  });

  it('should delete a user', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({}) };
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    await userService.deleteUser('1');
    expect(fetch).toHaveBeenCalledWith('/api/users/1', {
      method: 'DELETE',
    });
  });

  it('should import users', async () => {
    const mockUsers: User[] = [];
    const mockResponse = { ok: true, json: () => Promise.resolve(mockUsers) };
    (fetch as jest.Mock).mockResolvedValue(mockResponse); // Assuming importUsers also returns users or a success object
      const mockFile = new File([""], "filename", { type: 'text/csv' });
      const mockInstitutes: any[] = []; // Add mock data for institutes and roles
      const mockSystemRoles: any[] = [];
    const users = await userService.importUsers(mockFile, mockInstitutes, mockSystemRoles);
    expect(fetch).toHaveBeenCalledWith('/api/users/import', expect.anything());
  });

  it('should handle errors when creating a user', async () => {
    const mockUser: User = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      roleId: '1',
    };
    const mockResponse = { ok: false, json: () => Promise.resolve({}) };
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(userService.createUser(mockUser)).rejects.toThrow('Failed to create user');
  });

  it('should handle errors when getting a user', async () => {
    const mockResponse = { ok: false, json: () => Promise.resolve({}) };
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(userService.getUserById('1')).rejects.toThrow('Failed to fetch user');
  });

  it('should handle errors when getting users', async () => {
    const mockResponse = { ok: false, json: () => Promise.resolve({}) };
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(userService.getAllUsers()).rejects.toThrow('Failed to fetch users');
  });

  it('should handle errors when updating a user', async () => {
    const mockUser: User = {
        id: '1',
        name: 'Updated User',
        email: 'updated@example.com',
        password: 'password123',
        roleId: '1',
    };
    const mockResponse = { ok: false, json: () => Promise.resolve({}) };
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(userService.updateUser('1', mockUser)).rejects.toThrow('Failed to update user');
  });

  it('should handle errors when deleting a user', async () => {
    const mockResponse = { ok: false, json: () => Promise.resolve({}) };
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(userService.deleteUser('1')).rejects.toThrow('Failed to delete user with id 1');
  });
  it('should handle errors when importing users', async () => {
      const mockResponse = { ok: false, json: () => Promise.resolve({}) };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);
        const mockFile = new File([""], "filename", { type: 'text/csv' });

      await expect(userService.importUsers(mockFile, [], [])).rejects.toThrow('Failed to import users.');
    });
});