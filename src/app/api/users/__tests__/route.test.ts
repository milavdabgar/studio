import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock the database service
jest.mock('@/lib/db', () => ({
  user: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
}));

describe('Users API', () => {
  const mockUsers = [
    { id: 1, email: 'user1@example.com', name: 'User One', role: 'USER' },
    { id: 2, email: 'user2@example.com', name: 'User Two', role: 'ADMIN' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return a list of users', async () => {
      require('@/lib/db').user.findMany.mockResolvedValue(mockUsers);
      
      const mockRequest = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual(mockUsers);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        email: 'newuser@example.com',
        name: 'New User',
        role: 'USER',
      };
      
      const createdUser = { id: 3, ...newUser };
      require('@/lib/db').user.create.mockResolvedValue(createdUser);
      
      const mockRequest = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data).toEqual(createdUser);
    });
  });
});