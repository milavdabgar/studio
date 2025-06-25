import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { userService } from '@/lib/api/users';
import { instituteService } from '@/lib/api/institutes';
import { programService } from '@/lib/api/programs';
import type { Student, User, Institute, Program } from '@/types/entities';

// Mock the API services
jest.mock('@/lib/api/users');
jest.mock('@/lib/api/institutes');
jest.mock('@/lib/api/programs');

const mockUserService = userService as jest.Mocked<typeof userService>;
const mockInstituteService = instituteService as jest.Mocked<typeof instituteService>;
const mockProgramService = programService as jest.Mocked<typeof programService>;

describe('/api/students', () => {
  beforeEach(() => {
    // Reset all mocks first
    jest.clearAllMocks();
    
    // Reset global store before each test - must be done after import
    global.__API_STUDENTS_STORE__ = [];
    
    // Setup default mock responses
    mockProgramService.getAllPrograms.mockResolvedValue([
      {
        id: 'prog_dce_gpp',
        instituteId: 'inst1',
        name: 'Diploma in Civil Engineering',
        code: 'DCE',
        duration: '3 years',
        type: 'Diploma',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ] as Program[]);
    
    mockInstituteService.getInstituteById.mockResolvedValue({
      id: 'inst1',
      name: 'Government Polytechnic Palanpur',
      code: 'GPP',
      domain: 'gppalanpur.ac.in',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    } as Institute);
    
    mockUserService.createUser.mockResolvedValue({
      id: 'user_123',
      displayName: 'JOHN DOE',
      email: 'john@example.com',
      instituteEmail: '123456@gppalanpur.ac.in',
      roles: ['student'],
      isActive: true,
      instituteId: 'inst1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      authProviders: ['local'],
      isEmailVerified: false,
      preferences: {}
    } as User);
    
    mockUserService.getAllUsers.mockResolvedValue([]);
  });

  describe('GET /api/students', () => {
    it('should return students from store', async () => {
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      // The store may have default data, so just verify it's an array
    });

    it('should return all students when store has data', async () => {
      const mockStudents: Student[] = [
        {
          id: 'std_test_1',
          userId: 'user_test_1',
          enrollmentNumber: '123456789',
          gtuEnrollmentNumber: '123456789',
          programId: 'prog_1',
          department: 'dept_1',
          batchId: 'batch_1',
          currentSemester: 1,
          admissionDate: '2024-01-01T00:00:00.000Z',
          category: 'OPEN',
          shift: 'Morning',
          isComplete: false,
          termClose: false,
          isCancel: false,
          isPassAll: false,
          fullNameGtuFormat: 'DOE JOHN',
          firstName: 'JOHN',
          lastName: 'DOE',
          gender: 'Male',
          dateOfBirth: '2000-01-01T00:00:00.000Z',
          personalEmail: 'john@example.com',
          instituteEmail: '123456789@gppalanpur.ac.in',
          contactNumber: '9876543210',
          status: 'active',
          instituteId: 'inst1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];
      
      // Set specific test data
      global.__API_STUDENTS_STORE__ = mockStudents;
      
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual(mockStudents);
    });
  });

  describe('POST /api/students', () => {
    const validStudentData = {
      enrollmentNumber: '220010107001',
      gtuEnrollmentNumber: '220010107001',
      programId: 'prog_dce_gpp',
      department: 'dept_ce_gpp',
      batchId: 'batch_dce_2022_gpp',
      currentSemester: 1,
      admissionDate: '2022-07-01T00:00:00.000Z',
      category: 'OPEN',
      shift: 'Morning',
      isComplete: false,
      termClose: false,
      isCancel: false,
      isPassAll: false,
      fullNameGtuFormat: 'DOE JOHN MICHAEL',
      firstName: 'JOHN',
      middleName: 'MICHAEL',
      lastName: 'DOE',
      gender: 'Male',
      dateOfBirth: '2003-08-15T00:00:00.000Z',
      personalEmail: 'student.ce001@example.com',
      contactNumber: '9988776655',
      status: 'active',
      instituteId: 'inst1'
    };

    describe('Validation', () => {
      it('should return 400 when enrollment number is missing', async () => {
        const invalidData = { ...validStudentData };
        delete invalidData.enrollmentNumber;
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(invalidData),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.message).toBe('Enrollment Number is required.');
      });

      it('should return 400 when enrollment number is empty string', async () => {
        const invalidData = { ...validStudentData, enrollmentNumber: '   ' };
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(invalidData),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.message).toBe('Enrollment Number is required.');
      });

      it('should return 400 when name is missing (no fullNameGtuFormat and no firstName/lastName)', async () => {
        const invalidData = { ...validStudentData };
        delete invalidData.fullNameGtuFormat;
        delete invalidData.firstName;
        delete invalidData.lastName;
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(invalidData),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.message).toBe('Student Name (GTU Format or First/Last Name) is required.');
      });

      it('should return 400 when programId is missing', async () => {
        const invalidData = { ...validStudentData };
        delete invalidData.programId;
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(invalidData),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.message).toBe('Program ID (which implies Institute) is required.');
      });

      it('should return 400 when personal email format is invalid', async () => {
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

      it('should return 409 when enrollment number already exists', async () => {
        // Use a unique enrollment number that doesn't exist in default data
        const testEnrollmentNumber = '999999999';
        
        global.__API_STUDENTS_STORE__ = [{
          ...validStudentData,
          id: 'existing_student',
          userId: 'existing_user',
          enrollmentNumber: testEnrollmentNumber,
          instituteEmail: 'different@gppalanpur.ac.in',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        } as Student];
        
        const testData = { ...validStudentData, enrollmentNumber: testEnrollmentNumber };
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(testData),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(409);
        expect(data.message).toBe(`Student with enrollment number '${testEnrollmentNumber}' already exists.`);
      });

      it('should return 409 when institute email already exists', async () => {
        // Use a unique enrollment number and test institute email conflict
        const testInstituteEmail = 'test999999@gppalanpur.ac.in';
        
        global.__API_STUDENTS_STORE__ = [{
          ...validStudentData,
          id: 'existing_student',
          userId: 'existing_user',
          enrollmentNumber: '888888888',
          instituteEmail: testInstituteEmail,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        } as Student];
        
        const testData = { ...validStudentData, enrollmentNumber: '777777777', instituteEmail: testInstituteEmail };
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(testData),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(409);
        expect(data.message).toBe(`Student with institute email '${testInstituteEmail}' already exists.`);
      });
    });

    describe('Institute Domain Logic', () => {
      it('should use institute domain when available', async () => {
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(validStudentData),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(201);
        expect(data.instituteEmail).toBe('220010107001@gppalanpur.ac.in');
        expect(mockInstituteService.getInstituteById).toHaveBeenCalledWith('inst1');
      });

      it('should use default domain when institute fetch fails', async () => {
        mockInstituteService.getInstituteById.mockRejectedValue(new Error('Institute not found'));
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(validStudentData),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(201);
        expect(data.instituteEmail).toBe('220010107001@gpp.ac.in');
      });

      it('should derive instituteId from program when not provided', async () => {
        const dataWithoutInstituteId = { ...validStudentData };
        delete dataWithoutInstituteId.instituteId;
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(dataWithoutInstituteId),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(201);
        expect(data.instituteId).toBe('inst1');
        expect(mockProgramService.getAllPrograms).toHaveBeenCalled();
      });

      it('should use provided institute email when specified', async () => {
        const dataWithCustomEmail = { 
          ...validStudentData, 
          instituteEmail: 'custom@gppalanpur.ac.in' 
        };
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(dataWithCustomEmail),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(201);
        expect(data.instituteEmail).toBe('custom@gppalanpur.ac.in');
      });
    });

    describe('User Creation Integration', () => {
      it('should create new user successfully', async () => {
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(validStudentData),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(201);
        expect(data.userId).toBe('user_123');
        expect(mockUserService.createUser).toHaveBeenCalledWith({
          displayName: 'DOE JOHN MICHAEL',
          email: 'student.ce001@example.com',
          instituteEmail: '220010107001@gppalanpur.ac.in',
          password: '220010107001',
          roles: ['student'],
          isActive: true,
          instituteId: 'inst1',
          fullName: 'DOE JOHN MICHAEL',
          firstName: 'JOHN',
          middleName: 'MICHAEL',
          lastName: 'DOE'
        });
      });

      it('should use institute email as primary when personal email not provided', async () => {
        const dataWithoutPersonalEmail = { ...validStudentData };
        delete dataWithoutPersonalEmail.personalEmail;
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(dataWithoutPersonalEmail),
        });
        
        const response = await POST(request);
        
        expect(response.status).toBe(201);
        expect(mockUserService.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            email: '220010107001@gppalanpur.ac.in',
            instituteEmail: '220010107001@gppalanpur.ac.in'
          })
        );
      });

      it('should handle user creation error when user already exists', async () => {
        const existingUserError = new Error('User with this email already exists');
        existingUserError.message = 'User with this email already exists';
        mockUserService.createUser.mockRejectedValue(existingUserError);
        
        mockUserService.getAllUsers.mockResolvedValue([{
          id: 'existing_user',
          email: 'student.ce001@example.com',
          instituteEmail: '220010107001@gppalanpur.ac.in',
          roles: ['faculty'],
          displayName: 'Existing User',
          isActive: true,
          instituteId: 'inst1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          authProviders: ['local'],
          isEmailVerified: false,
          preferences: {}
        } as User]);
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(validStudentData),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(201);
        expect(data.userId).toBe('existing_user');
        expect(mockUserService.updateUser).toHaveBeenCalledWith('existing_user', {
          roles: ['faculty', 'student']
        });
      });

      it('should handle other user creation errors gracefully', async () => {
        mockUserService.createUser.mockRejectedValue(new Error('Database connection failed'));
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(validStudentData),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(201);
        expect(data.userId).toBeUndefined();
        // Student should still be created even if user creation fails
        expect(data.enrollmentNumber).toBe(validStudentData.enrollmentNumber);
      });
    });

    describe('Student Creation Success Cases', () => {
      it('should create student with minimal required data', async () => {
        // Clear store to avoid conflicts
        global.__API_STUDENTS_STORE__ = [];
        
        const minimalData = {
          enrollmentNumber: '123456789',
          programId: 'prog_dce_gpp',
          firstName: 'John',
          lastName: 'Doe'
        };
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(minimalData),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(201);
        expect(data.enrollmentNumber).toBe('123456789');
        expect(data.firstName).toBe('John');
        expect(data.lastName).toBe('Doe');
        expect(data.instituteEmail).toBe('123456789@gppalanpur.ac.in');
        expect(data.id).toBeDefined();
        expect(data.createdAt).toBeUndefined(); // Should not have createdAt/updatedAt in response
        expect(data.updatedAt).toBeUndefined();
      });

      it('should create student with only fullNameGtuFormat', async () => {
        // Clear store to avoid conflicts
        global.__API_STUDENTS_STORE__ = [];
        
        const dataWithGtuName = {
          enrollmentNumber: '987654321',
          programId: 'prog_dce_gpp',
          fullNameGtuFormat: 'DOE JOHN MICHAEL'
        };
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(dataWithGtuName),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(201);
        expect(data.fullNameGtuFormat).toBe('DOE JOHN MICHAEL');
        expect(mockUserService.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            displayName: 'DOE JOHN MICHAEL',
            fullName: 'DOE JOHN MICHAEL'
          })
        );
      });

      it('should add student to global store', async () => {
        // Clear store to ensure clean test
        global.__API_STUDENTS_STORE__ = [];
        
        const uniqueStudentData = { ...validStudentData, enrollmentNumber: '111111111' };
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(uniqueStudentData),
        });
        
        const response = await POST(request);
        
        expect(response.status).toBe(201);
        expect(global.__API_STUDENTS_STORE__).toHaveLength(1);
        expect(global.__API_STUDENTS_STORE__[0].enrollmentNumber).toBe(uniqueStudentData.enrollmentNumber);
      });

      it('should generate unique ID for each student', async () => {
        const request1 = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify({ ...validStudentData, enrollmentNumber: '111111' }),
        });
        
        const request2 = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify({ ...validStudentData, enrollmentNumber: '222222' }),
        });
        
        const response1 = await POST(request1);
        const response2 = await POST(request2);
        
        const data1 = await response1.json();
        const data2 = await response2.json();
        
        expect(response1.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(data1.id).not.toBe(data2.id);
        expect(data1.id).toMatch(/^std_\d+_[a-z0-9]+$/);
        expect(data2.id).toMatch(/^std_\d+_[a-z0-9]+$/);
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when JSON parsing fails', async () => {
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: 'invalid json',
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(500);
        expect(data.message).toBe('Error creating student');
        expect(data.error).toBeDefined();
      });

      it('should return 500 when service calls throw unexpected errors', async () => {
        mockProgramService.getAllPrograms.mockRejectedValue(new Error('Database error'));
        
        const request = new NextRequest('http://localhost/api/students', {
          method: 'POST',
          body: JSON.stringify(validStudentData),
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(500);
        expect(data.message).toBe('Error creating student');
        expect(data.error).toBe('Database error');
      });
    });
  });
});