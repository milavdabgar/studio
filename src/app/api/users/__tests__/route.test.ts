import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { createMocks } from 'node-mocks-http';

// Mock the database service
jest.mock('@/lib/db', () => ({
  user: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Users API', () => {
  const mockUsers = [
    { id: 1, email: 'user1@example.com', name: 'User One', role: 'USER' },
    { id: 2, email: 'user2@example.com', name: 'User Two', role: 'ADMIN' },
  ];

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return a list of users', async () => {
      require('@/lib/db').user.findMany.mockResolvedValue(mockUsers);
      
      const { req } = createMocks({
        method: 'GET',
        url: '/api/users',
      });
      
      const response = await GET(req as unknown as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual(mockUsers);
      expect(require('@/lib/db').user.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
      });
    });

    it('should filter users by role', async () => {
      const adminUsers = mockUsers.filter(user => user.role === 'ADMIN');
      require('@/lib/db').user.findMany.mockResolvedValue(adminUsers);
      
      const { req } = createMocks({
        method: 'GET',
        url: '/api/users?role=ADMIN',
      });
      
      await GET(req as unknown as NextRequest);
      
      expect(require('@/lib/db').user.findMany).toHaveBeenCalledWith({
        where: { role: 'ADMIN' },
        select: expect.any(Object),
      });
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        email: 'new@example.com',
        name: 'New User',
        role: 'USER',
      };
      
      require('@/lib/db').user.create.mockResolvedValue({
        id: 3,
        ...newUser,
      });
      
      const { req } = createMocks({
        method: 'POST',
        url: '/api/users',
        body: newUser,
      });
      
      const response = await POST(req as unknown as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data).toEqual({
        id: 3,
        ...newUser,
      });
      expect(require('@/lib/db').user.create).toHaveBeenCalledWith({
        data: newUser,
      });
    });

    it('should validate request body', async () => {
      const invalidUser = {
        // Missing required fields
        name: 'Invalid User',
      };
      
      const { req } = createMocks({
        method: 'POST',
        url: '/api/users',
        body: invalidUser,
      });
      
      const response = await POST(req as unknown as NextRequest);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(require('@/lib/db').user.create).not.toHaveBeenCalled();
    });
  });
});

describe('User Detail API', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  };

  // Import the handlers dynamically to avoid hoisting issues
  let handlers: any;
  
  beforeAll(async () => {
    handlers = await import('../[id]/route');
  });

  describe('GET /api/users/[id]', () => {
    it('should return a user by id', async () => {
      require('@/lib/db').user.findUnique.mockResolvedValue(mockUser);
      
      const { req } = createMocks({
        method: 'GET',
        url: '/api/users/1',
      });
      
      const response = await handlers.GET(
        req as unknown as NextRequest,
        { params: { id: '1' } }
      );
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual(mockUser);
      expect(require('@/lib/db').user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.any(Object),
      });
    });

    it('should return 404 if user not found', async () => {
      require('@/lib/db').user.findUnique.mockResolvedValue(null);
      
      const { req } = createMocks({
        method: 'GET',
        url: '/api/users/999',
      });
      
      const response = await handlers.GET(
        req as unknown as NextRequest,
        { params: { id: '999' } }
      );
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('User not found');
    });
  });

  describe('PUT /api/users/[id]', () => {
    it('should update a user', async () => {
      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
      };
      
      require('@/lib/db').user.update.mockResolvedValue(updatedUser);
      
      const { req } = createMocks({
        method: 'PUT',
        url: '/api/users/1',
        body: { name: 'Updated Name' },
      });
      
      const response = await handlers.PUT(
        req as unknown as NextRequest,
        { params: { id: '1' } }
      );
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual(updatedUser);
      expect(require('@/lib/db').user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated Name' },
      });
    });
  });

  describe('DELETE /api/users/[id]', () => {
    it('should delete a user', async () => {
      require('@/lib/db').user.delete.mockResolvedValue(mockUser);
      
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/users/1',
      });
      
      const response = await handlers.DELETE(
        req as unknown as NextRequest,
        { params: { id: '1' } }
      );
      
      expect(response.status).toBe(204);
      expect(require('@/lib/db').user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
