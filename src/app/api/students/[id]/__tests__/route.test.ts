import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import { StudentModel } from '@/lib/models';
import { connectMongoose } from '@/lib/mongodb';
import { userService } from '@/lib/api/users';
import { Types } from 'mongoose';

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
jest.mock('@/lib/models', () => ({
  StudentModel: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    findByIdAndDelete: jest.fn(),
  }
}));
jest.mock('@/lib/api/users', () => ({
  userService: {
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  }
}));

const mockConnectMongoose = connectMongoose as jest.MockedFunction<typeof connectMongoose>;
const mockStudentModel = StudentModel as jest.Mocked<typeof StudentModel>;
const mockUserService = userService as jest.Mocked<typeof userService>;

describe('/api/students/[id]', () => {
  const mockStudent = {
    _id: new Types.ObjectId().toString(),
    id: 'student_123',
    userId: 'user_123',
    enrollmentNumber: 'GP23CE001',
    gtuEnrollmentNumber: 'GTU23CE001',
    programId: 'prog_ce',
    department: 'Computer Engineering',
    batchId: 'batch_2023',
    currentSemester: 3,
    admissionDate: '2023-07-01',
    category: 'OPEN',
    shift: 'Morning',
    isComplete: false,
    termClose: false,
    isCancel: false,
    isPassAll: false,
    sem1Status: 'Passed',
    sem2Status: 'Passed',
    sem3Status: 'Pending',
    sem4Status: 'N/A',
    sem5Status: 'N/A',
    sem6Status: 'N/A',
    sem7Status: 'N/A',
    sem8Status: 'N/A',
    fullNameGtuFormat: 'JOHN SMITH',
    firstName: 'John',
    middleName: 'Kumar',
    lastName: 'Smith',
    gender: 'Male',
    dateOfBirth: '2005-05-15',
    bloodGroup: 'B+',
    aadharNumber: '123456789012',
    personalEmail: 'john.smith@gmail.com',
    instituteEmail: 'john.smith@gpp.edu.in',
    contactNumber: '+91-9876543210',
    address: '123 Main Street, City, State',
    guardianDetails: {
      name: 'Robert Smith',
      relation: 'Father',
      contactNumber: '+91-9876543211',
      occupation: 'Engineer',
      annualIncome: 500000
    },
    status: 'active',
    convocationYear: 2026,
    academicRemarks: 'Good student',
    instituteId: 'gpp_001',
    photoURL: 'https://example.com/photo.jpg',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockUser = {
    id: 'user_123',
    email: 'john.smith@gpp.edu.in',
    displayName: 'JOHN SMITH',
    isActive: true,
    photoURL: 'https://example.com/photo.jpg',
    authProviders: ['password' as const],
    roles: ['student' as const],
    currentRole: 'student' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectMongoose.mockResolvedValue(undefined);
  });

  describe('GET /api/students/[id]', () => {
    it('should return student by custom ID', async () => {
      const leanResult = Promise.resolve(mockStudent);
      mockStudentModel.findOne.mockReturnValue({ lean: () => leanResult } as any);
      
      const params = Promise.resolve({ id: 'student_123' });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockStudentModel.findOne).toHaveBeenCalledWith({ id: 'student_123' });
      expect(data.enrollmentNumber).toBe(mockStudent.enrollmentNumber);
      expect(data.id).toBe('student_123');
    });

    it('should return student by MongoDB ID if custom ID not found', async () => {
      const objectId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const studentWithObjectId = { ...mockStudent, _id: objectId, id: undefined };
      
      mockStudentModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) } as any);
      mockStudentModel.findById.mockReturnValue({ lean: () => Promise.resolve(studentWithObjectId) } as any);
      
      const params = Promise.resolve({ id: objectId });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockStudentModel.findOne).toHaveBeenCalledWith({ id: objectId });
      expect(mockStudentModel.findById).toHaveBeenCalledWith(objectId);
      expect(data.id).toBe(objectId);
    });

    it('should return 404 when student not found', async () => {
      mockStudentModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) } as any);
      mockStudentModel.findById.mockReturnValue({ lean: () => Promise.resolve(null) } as any);
      
      const params = Promise.resolve({ id: 'non_existent_id' });
      const response = await GET({} as NextRequest, { params });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe('Student not found');
    });

    it('should handle database errors', async () => {
      const errorMessage = 'Database connection failed';
      mockStudentModel.findOne.mockReturnValue({ lean: () => Promise.reject(new Error(errorMessage)) } as any);
      
      const params = Promise.resolve({ id: 'student_123' });
      const response = await GET({} as NextRequest, { params });
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe('Internal server error during student fetch.');
      expect(data.error).toBe(errorMessage);
    });
  });

  describe('PUT /api/students/[id]', () => {
    const updateData = {
      firstName: 'Jonathan',
      lastName: 'Smith',
      contactNumber: '+91-9876543219',
      currentSemester: 4,
      sem3Status: 'Passed' as const
    };

    it('should update student with valid data', async () => {
      const updatedStudent = { ...mockStudent, ...updateData };
      mockStudentModel.findOne.mockReturnValue({ lean: () => Promise.resolve(mockStudent) } as any);
      mockStudentModel.findOneAndUpdate.mockResolvedValue(updatedStudent);
      mockUserService.getUserById.mockResolvedValue(mockUser);
      
      const params = Promise.resolve({ id: 'student_123' });
      const request = new NextRequest('http://localhost/api/students/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      const response = await PUT(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.firstName).toBe(updateData.firstName);
      expect(data.currentSemester).toBe(updateData.currentSemester);
    });

    it('should return 404 when student not found', async () => {
      mockStudentModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) } as any);
      mockStudentModel.findById.mockReturnValue({ lean: () => Promise.resolve(null) } as any);
      
      const params = Promise.resolve({ id: 'non_existent_id' });
      const request = new NextRequest('http://localhost/api/students/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      const response = await PUT(request, { params });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe('Student not found');
    });

    it('should update student by MongoDB ID if custom ID not found', async () => {
      const objectId = '507f1f77bcf86cd799439011';
      const studentWithObjectId = { ...mockStudent, _id: objectId, id: undefined };
      const updatedStudent = { ...studentWithObjectId, ...updateData };
      
      mockStudentModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) } as any);
      mockStudentModel.findById.mockReturnValue({ lean: () => Promise.resolve(studentWithObjectId) } as any);
      mockStudentModel.findOneAndUpdate.mockResolvedValue(updatedStudent);
      mockUserService.getUserById.mockResolvedValue(mockUser);
      
      const params = Promise.resolve({ id: objectId });
      const request = new NextRequest('http://localhost/api/students/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      const response = await PUT(request, { params });
      expect(response.status).toBe(200);
    });

    it('should return 409 for duplicate enrollment number', async () => {
      const duplicateData = { enrollmentNumber: 'GP23CE002' };
      mockStudentModel.findOne
        .mockReturnValueOnce({ lean: () => Promise.resolve(mockStudent) } as any) // First call: find existing student
        .mockReturnValueOnce({ lean: () => Promise.resolve(null) } as any) // Check for duplicate enrollment
        .mockReturnValueOnce({ lean: () => Promise.resolve({ _id: 'other_student_id' }) } as any); // Found duplicate
      
      const params = Promise.resolve({ id: 'student_123' });
      const request = new NextRequest('http://localhost/api/students/123', {
        method: 'PUT',
        body: JSON.stringify(duplicateData),
      });
      
      const response = await PUT(request, { params });
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toContain('GP23CE002');
      expect(data.message).toContain('already exists');
    });

    it('should return 409 for duplicate institute email', async () => {
      const duplicateData = { instituteEmail: 'duplicate@gpp.edu.in' };
      mockStudentModel.findOne
        .mockReturnValueOnce({ lean: () => Promise.resolve(mockStudent) } as any) // Find existing student
        .mockReturnValueOnce({ lean: () => Promise.resolve({ _id: 'other_student_id' }) } as any); // Found duplicate email
      
      const params = Promise.resolve({ id: 'student_123' });
      const request = new NextRequest('http://localhost/api/students/123', {
        method: 'PUT',
        body: JSON.stringify(duplicateData),
      });
      
      const response = await PUT(request, { params });
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toContain('duplicate@gpp.edu.in');
      expect(data.message).toContain('already in use');
    });

    it('should return 404 if student not found after update', async () => {
      mockStudentModel.findOne.mockReturnValue({ lean: () => Promise.resolve(mockStudent) } as any);
      mockStudentModel.findOneAndUpdate.mockResolvedValue(null);
      
      const params = Promise.resolve({ id: 'student_123' });
      const request = new NextRequest('http://localhost/api/students/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      const response = await PUT(request, { params });
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe('Student not found');
    });

    it('should update linked user when student data changes', async () => {
      const updatedStudent = { ...mockStudent, firstName: 'Jonathan', personalEmail: 'jonathan@example.com' };
      mockStudentModel.findOne.mockReturnValue({ lean: () => Promise.resolve(mockStudent) } as any);
      mockStudentModel.findOneAndUpdate.mockResolvedValue(updatedStudent);
      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockUserService.updateUser.mockResolvedValue(undefined);
      
      const params = Promise.resolve({ id: 'student_123' });
      const request = new NextRequest('http://localhost/api/students/123', {
        method: 'PUT',
        body: JSON.stringify({ firstName: 'Jonathan', personalEmail: 'jonathan@example.com' }),
      });
      
      const response = await PUT(request, { params });
      expect(response.status).toBe(200);
      expect(mockUserService.updateUser).toHaveBeenCalled();
    });

    it('should handle user update errors gracefully', async () => {
      const updatedStudent = { ...mockStudent, firstName: 'Jonathan' };
      mockStudentModel.findOne.mockReturnValue({ lean: () => Promise.resolve(mockStudent) } as any);
      mockStudentModel.findOneAndUpdate.mockResolvedValue(updatedStudent);
      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockUserService.updateUser.mockRejectedValue(new Error('User update failed'));
      
      const params = Promise.resolve({ id: 'student_123' });
      const request = new NextRequest('http://localhost/api/students/123', {
        method: 'PUT',
        body: JSON.stringify({ firstName: 'Jonathan' }),
      });
      
      const response = await PUT(request, { params });
      expect(response.status).toBe(200); // Should still succeed despite user update failure
    });

    it('should handle database errors during update', async () => {
      const errorMessage = 'Database update failed';
      mockStudentModel.findOne.mockReturnValue({ lean: () => Promise.resolve(mockStudent) } as any);
      mockStudentModel.findOneAndUpdate.mockRejectedValue(new Error(errorMessage));
      
      const params = Promise.resolve({ id: 'student_123' });
      const request = new NextRequest('http://localhost/api/students/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      const response = await PUT(request, { params });
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe('Error updating student');
      expect(data.error).toBe(errorMessage);
    });
  });

  describe('DELETE /api/students/[id]', () => {
    it('should delete an existing student by custom ID', async () => {
      mockStudentModel.findOneAndDelete.mockReturnValue({ lean: () => Promise.resolve(mockStudent) } as any);
      mockUserService.deleteUser.mockResolvedValue(undefined);
      
      const params = Promise.resolve({ id: 'student_123' });
      const response = await DELETE({} as NextRequest, { params });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Student deleted successfully');
      expect(mockStudentModel.findOneAndDelete).toHaveBeenCalledWith({ id: 'student_123' });
      expect(mockUserService.deleteUser).toHaveBeenCalledWith('user_123');
    });

    it('should delete student by MongoDB ID if custom ID not found', async () => {
      const objectId = '507f1f77bcf86cd799439012'; // Valid ObjectId format
      const studentWithObjectId = { ...mockStudent, _id: objectId };
      
      mockStudentModel.findOneAndDelete.mockReturnValue({ lean: () => Promise.resolve(null) } as any);
      mockStudentModel.findByIdAndDelete.mockReturnValue({ lean: () => Promise.resolve(studentWithObjectId) } as any);
      mockUserService.deleteUser.mockResolvedValue(undefined);
      
      const params = Promise.resolve({ id: objectId });
      const response = await DELETE({} as NextRequest, { params });
      
      expect(response.status).toBe(200);
      expect(mockStudentModel.findOneAndDelete).toHaveBeenCalledWith({ id: objectId });
      expect(mockStudentModel.findByIdAndDelete).toHaveBeenCalledWith(objectId);
    });

    it('should return 404 when student not found', async () => {
      mockStudentModel.findOneAndDelete.mockReturnValue({ lean: () => Promise.resolve(null) } as any);
      mockStudentModel.findByIdAndDelete.mockReturnValue({ lean: () => Promise.resolve(null) } as any);
      
      const params = Promise.resolve({ id: 'non_existent_id' });
      const response = await DELETE({} as NextRequest, { params });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe('Student not found');
    });

    it('should handle database errors during deletion', async () => {
      const errorMessage = 'Database deletion failed';
      mockStudentModel.findOneAndDelete.mockReturnValue({ lean: () => Promise.reject(new Error(errorMessage)) } as any);
      
      const params = Promise.resolve({ id: 'student_123' });
      const response = await DELETE({} as NextRequest, { params });
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe('Error deleting student');
      expect(data.error).toBe(errorMessage);
    });

    it('should delete student without linked user', async () => {
      const studentWithoutUser = { ...mockStudent, userId: undefined };
      mockStudentModel.findOneAndDelete.mockReturnValue({ lean: () => Promise.resolve(studentWithoutUser) } as any);
      
      const params = Promise.resolve({ id: 'student_123' });
      const response = await DELETE({} as NextRequest, { params });
      
      expect(response.status).toBe(200);
      expect(mockUserService.deleteUser).not.toHaveBeenCalled();
    });

    it('should handle administrative user deletion warning', async () => {
      mockStudentModel.findOneAndDelete.mockReturnValue({ lean: () => Promise.resolve(mockStudent) } as any);
      const adminError = new Error('Cannot delete this administrative user');
      adminError.message = 'Cannot delete this administrative user';
      mockUserService.deleteUser.mockRejectedValue(adminError);
      
      const params = Promise.resolve({ id: 'student_123' });
      const response = await DELETE({} as NextRequest, { params });
      
      expect(response.status).toBe(200);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Administrative user'));
    });

    it('should handle user deletion with data.message administrative error', async () => {
      mockStudentModel.findOneAndDelete.mockReturnValue({ lean: () => Promise.resolve(mockStudent) } as any);
      const adminError = { data: { message: 'Cannot delete administrative user' } } as any;
      mockUserService.deleteUser.mockRejectedValue(adminError);
      
      const params = Promise.resolve({ id: 'student_123' });
      const response = await DELETE({} as NextRequest, { params });
      
      expect(response.status).toBe(200);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Administrative user'));
    });

    it('should handle other user deletion errors', async () => {
      mockStudentModel.findOneAndDelete.mockReturnValue({ lean: () => Promise.resolve(mockStudent) } as any);
      const otherError = new Error('Other user deletion error');
      mockUserService.deleteUser.mockRejectedValue(otherError);
      
      const params = Promise.resolve({ id: 'student_123' });
      const response = await DELETE({} as NextRequest, { params });
      
      expect(response.status).toBe(200);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to delete linked system user'), otherError);
    });
  });
});