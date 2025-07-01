import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { UserModel } from '@/lib/models';
import { connectMongoose } from '@/lib/mongodb';
import { instituteService } from '@/lib/api/institutes';

// Mock the dependencies
jest.mock('@/lib/mongodb');

// Create mock constructor and instance
const mockUserInstance = {
  save: jest.fn(),
  toJSON: jest.fn(),
};

jest.mock('@/lib/models', () => {
  const MockUserModelConstructor = jest.fn().mockImplementation(() => mockUserInstance);
  MockUserModelConstructor.find = jest.fn();
  MockUserModelConstructor.findOne = jest.fn();
  return {
    UserModel: MockUserModelConstructor
  };
});

jest.mock('@/lib/api/institutes', () => ({
  instituteService: {
    getInstituteById: jest.fn(),
  }
}));

const mockConnectMongoose = connectMongoose as jest.MockedFunction<typeof connectMongoose>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockInstituteService = instituteService as jest.Mocked<typeof instituteService>;

describe('/api/users', () => {
  const mockUsers = [
    {
      _id: '507f1f77bcf86cd799439011',
      displayName: 'John Smith',
      fullName: 'SMITH JOHN KUMAR',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@gmail.com',
      instituteEmail: 'john.smith@gpp.edu.in',
      roles: ['student'],
      currentRole: 'student',
      isActive: true,
      isEmailVerified: false,
      authProviders: ['password'],
      preferences: { theme: 'system', language: 'en' },
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      _id: '507f1f77bcf86cd799439012',
      displayName: 'Jane Doe',
      fullName: 'DOE JANE KUMAR',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@gmail.com',
      instituteEmail: 'jane.doe@gpp.edu.in',
      roles: ['faculty'],
      currentRole: 'faculty',
      isActive: true,
      isEmailVerified: true,
      authProviders: ['password'],
      preferences: { theme: 'light', language: 'en' },
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    }
  ];

  const mockInstitute = {
    id: 'inst_gpp',
    name: 'Government Polytechnic Palanpur',
    domain: 'gpp.edu.in'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectMongoose.mockResolvedValue(undefined);
    (mockUserModel as any).mockClear();
    mockUserInstance.save.mockClear();
    mockUserInstance.toJSON.mockClear();
  });

  describe('GET /api/users', () => {
    it('should return all users without passwords and with proper id mapping', async () => {
      const leanResult = Promise.resolve(mockUsers);
      mockUserModel.find.mockReturnValue({ lean: () => leanResult } as any);
      
      const response = await GET({} as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockUserModel.find).toHaveBeenCalledWith({}, '-password');
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].id).toBe('507f1f77bcf86cd799439011');
      expect(data[0].email).toBe('john.smith@gmail.com');
      expect(data[0]).not.toHaveProperty('password');
      expect(data[1].id).toBe('507f1f77bcf86cd799439012');
      expect(data[1].email).toBe('jane.doe@gmail.com');
    });

    it('should return empty array when no users exist', async () => {
      const leanResult = Promise.resolve([]);
      mockUserModel.find.mockReturnValue({ lean: () => leanResult } as any);
      
      const response = await GET({} as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      const errorMessage = 'Database connection failed';
      mockUserModel.find.mockReturnValue({ lean: () => Promise.reject(new Error(errorMessage)) } as any);
      
      const response = await GET({} as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error during user fetch.');
      expect(data.error).toBe(errorMessage);
    });
  });

  describe('POST /api/users', () => {
    const validUserData = {
      fullName: 'WILSON ALICE KUMAR',
      firstName: 'Alice',
      lastName: 'Wilson',
      email: 'alice.wilson@gmail.com',
      roles: ['student'],
      password: 'password123',
      instituteId: 'inst_gpp'
    };

    beforeEach(() => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockInstituteService.getInstituteById.mockResolvedValue(mockInstitute);
      mockUserInstance.save.mockResolvedValue(undefined);
      mockUserInstance.toJSON.mockReturnValue({
        ...validUserData,
        id: 'user_12345_abcdef',
        displayName: 'Alice Wilson',
        instituteEmail: 'alice.wilson@gpp.edu.in',
        authProviders: ['password'],
        isActive: true,
        isEmailVerified: false,
        currentRole: 'student',
        preferences: { theme: 'system', language: 'en' },
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    it('should create a new user with valid data', async () => {
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.firstName).toBe('Alice');
      expect(data.lastName).toBe('Wilson');
      expect(data.email).toBe('alice.wilson@gmail.com');
      expect(data.instituteEmail).toBe('alice.wilson@gpp.edu.in');
      expect(data.roles).toEqual(['student']);
      expect(data.currentRole).toBe('student');
      expect(data).not.toHaveProperty('password'); // Password should be excluded from response
      expect(mockUserModel).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Alice',
          lastName: 'Wilson',
          email: 'alice.wilson@gmail.com',
          instituteEmail: 'alice.wilson@gpp.edu.in',
          roles: ['student'],
          password: 'password123'
        })
      );
    });

    it('should return 400 for missing full name', async () => {
      const invalidData = { ...validUserData };
      delete (invalidData as any).fullName;
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Full Name (GTU Format) is required.');
    });

    it('should return 400 for empty full name', async () => {
      const invalidData = { ...validUserData, fullName: '   ' };
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Full Name (GTU Format) is required.');
    });

    it('should return 400 for missing first name', async () => {
      const invalidData = { ...validUserData };
      delete (invalidData as any).firstName;
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('First Name is required.');
    });

    it('should return 400 for missing last name', async () => {
      const invalidData = { ...validUserData };
      delete (invalidData as any).lastName;
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Last Name is required.');
    });

    it('should return 400 for missing email', async () => {
      const invalidData = { ...validUserData };
      delete (invalidData as any).email;
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Personal Email is required.');
    });

    it('should return 400 for missing roles', async () => {
      const invalidData = { ...validUserData };
      delete (invalidData as any).roles;
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('User must have at least one role.');
    });

    it('should return 400 for empty roles array', async () => {
      const invalidData = { ...validUserData, roles: [] };
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('User must have at least one role.');
    });

    it('should return 400 for missing password', async () => {
      const invalidData = { ...validUserData };
      delete (invalidData as any).password;
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Password must be at least 6 characters long for new users.');
    });

    it('should return 400 for short password', async () => {
      const invalidData = { ...validUserData, password: '12345' };
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Password must be at least 6 characters long for new users.');
    });

    it('should return 409 for duplicate email', async () => {
      mockUserModel.findOne.mockResolvedValue({
        email: 'alice.wilson@gmail.com'
      });
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(409);
      expect(data.message).toContain("User with personal email 'alice.wilson@gmail.com' already exists");
    });

    it('should use default domain when institute not found', async () => {
      mockInstituteService.getInstituteById.mockRejectedValue(new Error('Institute not found'));
      
      mockUserInstance.toJSON.mockReturnValue({
        ...validUserData,
        id: 'user_12345_abcdef',
        instituteEmail: 'alice.wilson@gpp.ac.in', // Default domain
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.instituteEmail).toBe('alice.wilson@gpp.ac.in');
    });

    it('should handle institute email conflicts by adding suffix', async () => {
      // First call for email check returns null (no conflict)
      // Second call for institute email check returns existing user
      // Third call for institute email with suffix returns null
      mockUserModel.findOne
        .mockResolvedValueOnce(null) // No personal email conflict
        .mockResolvedValueOnce({ instituteEmail: 'alice.wilson@gpp.edu.in' }) // Institute email conflict
        .mockResolvedValueOnce(null); // No conflict with alice.wilson1@gpp.edu.in
      
      mockUserInstance.toJSON.mockReturnValue({
        ...validUserData,
        id: 'user_12345_abcdef',
        instituteEmail: 'alice.wilson1@gpp.edu.in', // With suffix
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(mockUserModel).toHaveBeenCalledWith(
        expect.objectContaining({
          instituteEmail: 'alice.wilson1@gpp.edu.in'
        })
      );
    });

    it('should create user without optional institute ID', async () => {
      const dataWithoutInstitute = { ...validUserData };
      delete (dataWithoutInstitute as any).instituteId;
      
      mockUserInstance.toJSON.mockReturnValue({
        ...dataWithoutInstitute,
        id: 'user_12345_abcdef',
        instituteEmail: 'alice.wilson@gpp.ac.in', // Default domain
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(dataWithoutInstitute),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.instituteEmail).toBe('alice.wilson@gpp.ac.in');
    });

    it('should handle names with special characters in institute email generation', async () => {
      const dataWithSpecialChars = {
        ...validUserData,
        firstName: 'José-María',
        lastName: "O'Connor"
      };
      
      mockUserInstance.toJSON.mockReturnValue({
        ...dataWithSpecialChars,
        id: 'user_12345_abcdef',
        instituteEmail: 'josmara.oconnor@gpp.edu.in', // Special chars removed
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(dataWithSpecialChars),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(201);
      expect(mockUserModel).toHaveBeenCalledWith(
        expect.objectContaining({
          instituteEmail: 'josmara.oconnor@gpp.edu.in'
        })
      );
    });

    it('should set default display name when not provided', async () => {
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(201);
      expect(mockUserModel).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'Alice Wilson' // Generated from firstName + lastName
        })
      );
    });

    it('should use provided display name when given', async () => {
      const dataWithDisplayName = {
        ...validUserData,
        displayName: 'Alice W.'
      };
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(dataWithDisplayName),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(201);
      expect(mockUserModel).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'Alice W.'
        })
      );
    });

    it('should handle database errors during user creation', async () => {
      mockUserInstance.save.mockRejectedValue(new Error('Database save failed'));
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.message).toBe('Error creating user');
      expect(data.error).toBe('Database save failed');
    });

    it('should trim whitespace from string fields', async () => {
      const dataWithWhitespace = {
        ...validUserData,
        fullName: '  WILSON ALICE KUMAR  ',
        firstName: '  Alice  ',
        lastName: '  Wilson  ',
        email: '  alice.wilson@gmail.com  '
      };
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(dataWithWhitespace),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(201);
      expect(mockUserModel).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'WILSON ALICE KUMAR',
          firstName: 'Alice',
          lastName: 'Wilson',
          email: 'alice.wilson@gmail.com'
        })
      );
    });

    it('should handle case-insensitive email conflict checking', async () => {
      mockUserModel.findOne.mockImplementation((query) => {
        if (query.email && query.email.$regex) {
          return Promise.resolve({
            email: 'ALICE.WILSON@GMAIL.COM'
          });
        }
        return Promise.resolve(null);
      });
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(409);
      expect(data.message).toContain("User with personal email 'alice.wilson@gmail.com' already exists");
    });
  });
});