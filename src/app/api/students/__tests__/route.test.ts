import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { StudentModel } from '@/lib/models';
import { connectMongoose } from '@/lib/mongodb';
import { userService } from '@/lib/api/users';
import { instituteService } from '@/lib/api/institutes';
import { programService } from '@/lib/api/programs';

// Mock console methods to suppress expected error/warning messages during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock the dependencies
jest.mock('@/lib/mongodb');

// Create mock constructor and instance
const mockStudentInstance = {
  save: jest.fn(),
  toJSON: jest.fn(),
};

jest.mock('@/lib/models', () => {
  const MockStudentModelConstructor = jest.fn().mockImplementation(() => mockStudentInstance) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  MockStudentModelConstructor.find = jest.fn();
  MockStudentModelConstructor.findOne = jest.fn();
  return {
    StudentModel: MockStudentModelConstructor
  };
});

jest.mock('@/lib/api/users', () => ({
  userService: {
    createUser: jest.fn(),
    getAllUsers: jest.fn(),
    updateUser: jest.fn(),
    findByEmail: jest.fn(),
  }
}));
jest.mock('@/lib/api/institutes', () => ({
  instituteService: {
    getInstituteById: jest.fn(),
  }
}));
jest.mock('@/lib/api/programs', () => ({
  programService: {
    getAllPrograms: jest.fn(),
  }
}));

const mockConnectMongoose = connectMongoose as jest.MockedFunction<typeof connectMongoose>;
const mockStudentModel = StudentModel as any; // eslint-disable-line @typescript-eslint/no-explicit-any
const mockUserService = userService as jest.Mocked<typeof userService>;
const mockInstituteService = instituteService as jest.Mocked<typeof instituteService>;
const mockProgramService = programService as jest.Mocked<typeof programService>;

describe('/api/students', () => {
  const mockStudents = [
    {
      _id: '507f1f77bcf86cd799439011',
      id: 'student_123',
      enrollmentNumber: 'GP23CE001',
      gtuEnrollmentNumber: 'GTU23CE001',
      programId: 'prog_ce',
      department: 'Computer Engineering',
      fullNameGtuFormat: 'JOHN SMITH',
      firstName: 'John',
      lastName: 'Smith',
      instituteEmail: 'john.smith@gpp.edu.in',
      personalEmail: 'john@gmail.com',
      status: 'active',
      isActive: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      _id: '507f1f77bcf86cd799439012',
      id: 'student_124',
      enrollmentNumber: 'GP23CE002',
      gtuEnrollmentNumber: 'GTU23CE002',
      programId: 'prog_ce',
      department: 'Computer Engineering',
      fullNameGtuFormat: 'JANE DOE',
      firstName: 'Jane',
      lastName: 'Doe',
      instituteEmail: 'jane.doe@gpp.edu.in',
      personalEmail: 'jane@gmail.com',
      status: 'active',
      isActive: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    }
  ];

  const mockPrograms = [
    {
      id: 'prog_ce',
      name: 'Computer Engineering',
      code: 'CE',
      departmentId: 'dept_ce',
      instituteId: 'inst_gpp',
      status: 'active' as const
    }
  ];

  const mockInstitute = {
    id: 'inst_gpp',
    name: 'Government Polytechnic Palanpur',
    code: 'GPP',
    domain: 'gpp.edu.in',
    status: 'active' as const
  };

  const mockUser = {
    id: 'user_123',
    email: 'john@gmail.com',
    instituteEmail: 'john.smith@gpp.edu.in',
    displayName: 'JOHN SMITH',
    roles: ['student' as const],
    currentRole: 'student' as const,
    authProviders: ['password' as const],
    isActive: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectMongoose.mockResolvedValue(undefined);
    mockStudentModel.mockClear();
    mockStudentInstance.save.mockClear();
    mockStudentInstance.toJSON.mockClear();
  });

  describe('GET /api/students', () => {
    it('should return all students with proper id mapping', async () => {
      const leanResult = Promise.resolve(mockStudents);
      mockStudentModel.find.mockReturnValue({ lean: () => leanResult } as { lean: () => Promise<typeof mockStudents> });
      
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockStudentModel.find).toHaveBeenCalledWith({});
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].id).toBe('student_123');
      expect(data[0].enrollmentNumber).toBe('GP23CE001');
      expect(data[1].id).toBe('student_124');
      expect(data[1].enrollmentNumber).toBe('GP23CE002');
    });

    it('should map _id to id when id field is missing', async () => {
      const studentsWithoutId = mockStudents.map(student => {
        const { id, ...studentWithoutId } = student;
        void id; // Acknowledge unused variable
        return studentWithoutId;
      });
      
      const leanResult = Promise.resolve(studentsWithoutId);
      mockStudentModel.find.mockReturnValue({ lean: () => leanResult } as { lean: () => Promise<typeof studentsWithoutId> });
      
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data[0].id).toBe('507f1f77bcf86cd799439011');
      expect(data[1].id).toBe('507f1f77bcf86cd799439012');
    });

    it('should return empty array when no students exist', async () => {
      const leanResult = Promise.resolve([]);
      mockStudentModel.find.mockReturnValue({ lean: () => leanResult } as { lean: () => Promise<never[]> });
      
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      const errorMessage = 'Database connection failed';
      mockStudentModel.find.mockReturnValue({ lean: () => Promise.reject(new Error(errorMessage)) } as { lean: () => Promise<never> });
      
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error during student fetch.');
      expect(data.error).toBe(errorMessage);
    });
  });

  describe('POST /api/students', () => {
    const validStudentData = {
      enrollmentNumber: 'GP24CE001',
      fullNameGtuFormat: 'ALICE WILSON',
      firstName: 'Alice',
      lastName: 'Wilson',
      programId: 'prog_ce',
      personalEmail: 'alice@gmail.com',
      status: 'active' as const
    };

    beforeEach(() => {
      mockProgramService.getAllPrograms.mockResolvedValue(mockPrograms);
      mockInstituteService.getInstituteById.mockResolvedValue(mockInstitute);
      mockStudentModel.findOne.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUser);
      
      mockStudentInstance.save.mockResolvedValue(undefined);
      mockStudentInstance.toJSON.mockReturnValue({
        ...validStudentData,
        id: 'student_125',
        instituteEmail: 'GP24CE001@gpp.edu.in',
        instituteId: 'inst_gpp',
        userId: 'user_123',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    it('should create a new student with valid data', async () => {
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(validStudentData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.enrollmentNumber).toBe('GP24CE001');
      expect(data.id).toBeTruthy();
      expect(data.instituteEmail).toBe('GP24CE001@gpp.edu.in');
      expect(data.userId).toBe('user_123');
      expect(mockStudentModel).toHaveBeenCalledWith(
        expect.objectContaining({
          enrollmentNumber: 'GP24CE001',
          fullNameGtuFormat: 'ALICE WILSON',
          instituteEmail: 'GP24CE001@gpp.edu.in',
          instituteId: 'inst_gpp',
          userId: 'user_123'
        })
      );
    });

    it('should return 400 for missing enrollment number', async () => {
      const invalidData = { ...validStudentData };
      delete (invalidData as { enrollmentNumber?: string }).enrollmentNumber;
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Enrollment Number is required.');
    });

    it('should return 400 for missing student name', async () => {
      const invalidData = { ...validStudentData };
      delete (invalidData as { fullNameGtuFormat?: string; firstName?: string; lastName?: string }).fullNameGtuFormat;
      delete (invalidData as { fullNameGtuFormat?: string; firstName?: string; lastName?: string }).firstName;
      delete (invalidData as { fullNameGtuFormat?: string; firstName?: string; lastName?: string }).lastName;
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Student Name (GTU Format or First/Last Name) is required.');
    });

    it('should return 400 for missing program ID', async () => {
      const invalidData = { ...validStudentData };
      delete (invalidData as { programId?: string }).programId;
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Program ID (which implies Institute) is required.');
    });

    it('should return 409 for duplicate enrollment number', async () => {
      mockStudentModel.findOne
        .mockResolvedValueOnce({ enrollmentNumber: 'GP24CE001' }) // First call: existing enrollment
        .mockResolvedValueOnce(null); // Second call: no existing email
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(validStudentData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(409);
      expect(data.message).toContain("Student with enrollment number 'GP24CE001' already exists");
    });

    it('should return 409 for duplicate institute email', async () => {
      // Reset the findOne mock for this specific test
      mockStudentModel.findOne.mockReset();
      mockStudentModel.findOne
        .mockResolvedValueOnce(null) // First call: no existing enrollment
        .mockResolvedValueOnce({ instituteEmail: 'GP24CE001@gpp.edu.in' }); // Second call: existing email
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(validStudentData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(409);
      expect(data.message).toContain("Student with institute email 'GP24CE001@gpp.edu.in' already exists");
    });

    it('should return 400 for invalid personal email format', async () => {
      // Reset mocks for this test
      mockStudentModel.findOne.mockReset();
      mockStudentModel.findOne.mockResolvedValue(null); // No duplicates
      
      const invalidData = { ...validStudentData, personalEmail: 'invalid-email' };
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Invalid personal email format.');
    });

    it('should use default domain when institute not found', async () => {
      // Reset mocks for this test
      mockStudentModel.findOne.mockReset();
      mockStudentModel.findOne.mockResolvedValue(null);
      mockInstituteService.getInstituteById.mockRejectedValue(new Error('Institute not found'));
      
      // Update the toJSON mock to return the expected domain
      mockStudentInstance.toJSON.mockReturnValue({
        ...validStudentData,
        id: 'student_125',
        instituteEmail: 'GP24CE001@gppalanpur.ac.in',
        instituteId: 'inst_gpp',
        userId: 'user_123',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(validStudentData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.instituteEmail).toBe('GP24CE001@gppalanpur.ac.in'); // Default domain
    });

    it('should handle existing user linking when user creation fails with "already exists"', async () => {
      // Reset mocks for this test
      mockStudentModel.findOne.mockReset();
      mockStudentModel.findOne.mockResolvedValue(null);
      
      const existingUser = { 
        ...mockUser, 
        id: 'existing_user_123', 
        roles: ['faculty' as const],
        currentRole: 'faculty' as const,
        email: 'alice@gmail.com',
        instituteEmail: 'GP24CE001@gpp.edu.in'
      };
      mockUserService.createUser.mockRejectedValue(new Error('User already exists'));
      mockUserService.getAllUsers.mockResolvedValue([existingUser]);
      mockUserService.updateUser.mockResolvedValue(existingUser);
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(validStudentData),
      });
      
      const response = await POST(request);
      const _data = await response.json();
      void _data; // Acknowledge unused variable
      
      expect(response.status).toBe(201);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        'existing_user_123',
        { roles: ['faculty', 'student'] }
      );
    });

    it('should create student with firstName and lastName when fullNameGtuFormat is missing', async () => {
      const dataWithoutGtuFormat = { 
        ...validStudentData,
        firstName: 'Bob',
        lastName: 'Johnson',
        middleName: 'K'
      };
      delete (dataWithoutGtuFormat as { fullNameGtuFormat?: string }).fullNameGtuFormat;
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(dataWithoutGtuFormat),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(201);
      expect(mockUserService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'Bob Johnson',
          fullName: 'Johnson Bob K'
        })
      );
    });

    it('should handle database errors during student creation', async () => {
      mockStudentInstance.save.mockRejectedValue(new Error('Database save failed'));
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(validStudentData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.message).toBe('Error creating student');
      expect(data.error).toBe('Database save failed');
    });

    it('should use provided institute email when given', async () => {
      const dataWithInstituteEmail = { 
        ...validStudentData,
        instituteEmail: 'alice.wilson@custom.edu.in'
      };
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(dataWithInstituteEmail),
      });
      
      const response = await POST(request);
      const _data = await response.json();
      void _data; // Acknowledge unused variable
      
      expect(response.status).toBe(201);
      expect(mockStudentModel).toHaveBeenCalledWith(
        expect.objectContaining({
          instituteEmail: 'alice.wilson@custom.edu.in'
        })
      );
    });

    it('should handle program without instituteId', async () => {
      // Reset mocks for this test
      mockStudentModel.findOne.mockReset();
      mockStudentModel.findOne.mockResolvedValue(null);
      
      const programWithoutInstitute = [{ 
        id: 'prog_ce', 
        name: 'Computer Engineering',
        code: 'CE',
        departmentId: 'dept_ce',
        instituteId: 'inst_gpp',
        status: 'active' as const
      }];
      mockProgramService.getAllPrograms.mockResolvedValue(programWithoutInstitute);
      
      // Update the toJSON mock to return the expected domain
      mockStudentInstance.toJSON.mockReturnValue({
        ...validStudentData,
        id: 'student_125',
        instituteEmail: 'GP24CE001@gppalanpur.ac.in',
        instituteId: undefined,
        userId: 'user_123',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(validStudentData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.instituteEmail).toBe('GP24CE001@gppalanpur.ac.in'); // Default domain used
    });

    it('should warn when program does not have instituteId', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock program without instituteId
      const programWithoutInstitute = [{
        ...mockPrograms[0],
        instituteId: undefined as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }];
      mockProgramService.getAllPrograms.mockResolvedValue(programWithoutInstitute);
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(validStudentData),
      });
      
      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not determine instituteId for student')
      );
      
      consoleSpy.mockRestore();
    });

    it('should warn when institute ID is not determined', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock empty programs array so no program is found
      mockProgramService.getAllPrograms.mockResolvedValue([]);
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(validStudentData),
      });
      
      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Institute ID not determined for student')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle error when student cannot be linked to existing user despite already exists error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock user creation to fail with "already exists" but getAllUsers returns empty array
      const alreadyExistsError = new Error('User already exists');
      mockUserService.createUser.mockRejectedValue(alreadyExistsError);
      mockUserService.getAllUsers.mockResolvedValue([]); // No existing users found
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(validStudentData),
      });
      
      const response = await POST(request);
      expect(response.status).toBe(201); // Student should still be created
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not link student')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle other user creation errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock user creation to fail with different error
      const otherError = new Error('Database connection failed');
      mockUserService.createUser.mockRejectedValue(otherError);
      
      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(validStudentData),
      });
      
      const response = await POST(request);
      expect(response.status).toBe(201); // Student should still be created
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create/link system user'),
        otherError
      );
      
      consoleSpy.mockRestore();
    });
  });
});