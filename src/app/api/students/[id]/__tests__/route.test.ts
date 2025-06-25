import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import { userService } from '@/lib/api/users';
import type { Student, User } from '@/types/entities';

// Mock the user service
jest.mock('@/lib/api/users');
const mockUserService = userService as jest.Mocked<typeof userService>;

describe('/api/students/[id]', () => {
  const mockStudent: Student = {
    id: 'std_123',
    userId: 'user_123',
    enrollmentNumber: '220010107001',
    gtuEnrollmentNumber: '220010107001',
    programId: 'prog_dce_gpp',
    department: 'dept_ce_gpp',
    batchId: 'batch_dce_2022_gpp',
    currentSemester: 3,
    admissionDate: '2022-07-01T00:00:00.000Z',
    category: 'OPEN',
    shift: 'Morning',
    isComplete: false,
    termClose: false,
    isCancel: false,
    isPassAll: false,
    sem1Status: 'Passed',
    sem2Status: 'Passed',
    sem3Status: 'Pending',
    fullNameGtuFormat: 'DOE JOHN MICHAEL',
    firstName: 'JOHN',
    middleName: 'MICHAEL',
    lastName: 'DOE',
    gender: 'Male',
    dateOfBirth: '2003-08-15T00:00:00.000Z',
    personalEmail: 'student.ce001@example.com',
    instituteEmail: '220010107001@gppalanpur.ac.in',
    contactNumber: '9988776655',
    status: 'active',
    instituteId: 'inst1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const mockUser: User = {
    id: 'user_123',
    displayName: 'DOE JOHN MICHAEL',
    email: 'student.ce001@example.com',
    instituteEmail: '220010107001@gppalanpur.ac.in',
    roles: ['student'],
    currentRole: 'student',
    isActive: true,
    instituteId: 'inst1',
    fullName: 'DOE JOHN MICHAEL',
    firstName: 'JOHN',
    middleName: 'MICHAEL',
    lastName: 'DOE',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    authProviders: ['password'],
    isEmailVerified: false,
    preferences: {}
  };

  beforeEach(() => {
    // Reset global store before each test
    global.__API_STUDENTS_STORE__ = [mockStudent];
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockUserService.getUserById.mockResolvedValue(mockUser);
    mockUserService.updateUser.mockResolvedValue(mockUser);
    mockUserService.deleteUser.mockResolvedValue();
  });

  describe('GET /api/students/[id]', () => {
    it('should return student when found', async () => {
      const params = Promise.resolve({ id: 'std_123' });
      const request = new NextRequest('http://localhost/api/students/std_123');
      
      const response = await GET(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual(mockStudent);
    });

    it('should return 404 when student not found', async () => {
      const params = Promise.resolve({ id: 'nonexistent' });
      const request = new NextRequest('http://localhost/api/students/nonexistent');
      
      const response = await GET(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.message).toBe('Student not found');
    });
  });

  describe('PUT /api/students/[id]', () => {
    describe('Validation', () => {
      it('should return 404 when student not found', async () => {
        const params = Promise.resolve({ id: 'nonexistent' });
        const request = new NextRequest('http://localhost/api/students/nonexistent', {
          method: 'PUT',
          body: JSON.stringify({ firstName: 'Updated' }),
        });
        
        const response = await PUT(request, { params });
        const data = await response.json();
        
        expect(response.status).toBe(404);
        expect(data.message).toBe('Student not found');
      });

      it('should return 409 when enrollment number already exists', async () => {
        // Add another student to the store
        global.__API_STUDENTS_STORE__.push({
          ...mockStudent,
          id: 'std_456',
          enrollmentNumber: '999999999',
          instituteEmail: 'other@gppalanpur.ac.in'
        });
        
        const params = Promise.resolve({ id: 'std_123' });
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify({ enrollmentNumber: '999999999' }),
        });
        
        const response = await PUT(request, { params });
        const data = await response.json();
        
        expect(response.status).toBe(409);
        expect(data.message).toBe(`Enrollment number '999999999' already exists.`);
      });

      it('should return 409 when institute email already exists', async () => {
        global.__API_STUDENTS_STORE__.push({
          ...mockStudent,
          id: 'std_456',
          enrollmentNumber: '999999999',
          instituteEmail: 'existing@gppalanpur.ac.in'
        });
        
        const params = Promise.resolve({ id: 'std_123' });
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify({ instituteEmail: 'existing@gppalanpur.ac.in' }),
        });
        
        const response = await PUT(request, { params });
        const data = await response.json();
        
        expect(response.status).toBe(409);
        expect(data.message).toBe(`Institute email 'existing@gppalanpur.ac.in' is already in use.`);
      });

      it('should allow same enrollment number for same student', async () => {
        const params = Promise.resolve({ id: 'std_123' });
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify({ enrollmentNumber: '220010107001' }),
        });
        
        const response = await PUT(request, { params });
        
        expect(response.status).toBe(200);
      });

      it('should allow same institute email for same student', async () => {
        const params = Promise.resolve({ id: 'std_123' });
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify({ instituteEmail: '220010107001@gppalanpur.ac.in' }),
        });
        
        const response = await PUT(request, { params });
        
        expect(response.status).toBe(200);
      });
    });

    describe('Student Updates', () => {
      it('should update basic student fields', async () => {
        const params = Promise.resolve({ id: 'std_123' });
        const updateData = {
          firstName: 'JANE',
          lastName: 'SMITH',
          contactNumber: '9876543210',
          currentSemester: 4
        };
        
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        
        const response = await PUT(request, { params });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.firstName).toBe('JANE');
        expect(data.lastName).toBe('SMITH');
        expect(data.contactNumber).toBe('9876543210');
        expect(data.currentSemester).toBe(4);
        expect(data.updatedAt).toBeDefined();
        expect(new Date(data.updatedAt).getTime()).toBeGreaterThan(new Date(mockStudent.updatedAt).getTime());
      });

      it('should handle semester status updates', async () => {
        const params = Promise.resolve({ id: 'std_123' });
        const updateData = {
          sem3Status: 'Passed',
          sem4Status: 'Pending'
        };
        
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        
        const response = await PUT(request, { params });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.sem3Status).toBe('Passed');
        expect(data.sem4Status).toBe('Pending');
      });

      it('should handle boolean field updates', async () => {
        const params = Promise.resolve({ id: 'std_123' });
        const updateData = {
          isComplete: true,
          termClose: true,
          isPassAll: true
        };
        
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        
        const response = await PUT(request, { params });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.isComplete).toBe(true);
        expect(data.termClose).toBe(true);
        expect(data.isPassAll).toBe(true);
      });

      it('should handle optional field updates (undefined/null values)', async () => {
        const params = Promise.resolve({ id: 'std_123' });
        const updateData = {
          middleName: null,
          personalEmail: null,
          academicRemarks: null
        };
        
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        
        const response = await PUT(request, { params });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.middleName).toBeUndefined();
        expect(data.personalEmail).toBeUndefined();
        expect(data.academicRemarks).toBeUndefined();
      });

      it('should trim string values', async () => {
        const params = Promise.resolve({ id: 'std_123' });
        const updateData = {
          firstName: '  JANE  ',
          lastName: '  SMITH  ',
          contactNumber: '  9876543210  '
        };
        
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        
        const response = await PUT(request, { params });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.firstName).toBe('JANE');
        expect(data.lastName).toBe('SMITH');
        expect(data.contactNumber).toBe('9876543210');
      });

      it('should update global store', async () => {
        const params = Promise.resolve({ id: 'std_123' });
        const updateData = { firstName: 'UPDATED' };
        
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        
        await PUT(request, { params });
        
        const updatedStudent = global.__API_STUDENTS_STORE__.find(s => s.id === 'std_123');
        expect(updatedStudent?.firstName).toBe('UPDATED');
      });
    });

    describe('User Synchronization', () => {
      it('should update user when display name changes', async () => {
        const params = Promise.resolve({ id: 'std_123' });
        const updateData = { fullNameGtuFormat: 'SMITH JANE DOE' };
        
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        
        const response = await PUT(request, { params });
        
        expect(response.status).toBe(200);
        expect(mockUserService.updateUser).toHaveBeenCalledWith('user_123', {
          displayName: 'SMITH JANE DOE'
        });
      });

      it('should update user when status changes', async () => {
        const params = Promise.resolve({ id: 'std_123' });
        const updateData = { status: 'inactive' };
        
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        
        const response = await PUT(request, { params });
        
        expect(response.status).toBe(200);
        expect(mockUserService.updateUser).toHaveBeenCalledWith('user_123', {
          isActive: false
        });
      });

      it('should update user when personal email changes', async () => {
        const params = Promise.resolve({ id: 'std_123' });
        const updateData = { personalEmail: 'new.email@example.com' };
        
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        
        const response = await PUT(request, { params });
        
        expect(response.status).toBe(200);
        expect(mockUserService.updateUser).toHaveBeenCalledWith('user_123', {
          email: 'new.email@example.com'
        });
      });

      it('should update user when institute email changes', async () => {
        const params = Promise.resolve({ id: 'std_123' });
        const updateData = { instituteEmail: 'new@gppalanpur.ac.in' };
        
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        
        const response = await PUT(request, { params });
        
        expect(response.status).toBe(200);
        expect(mockUserService.updateUser).toHaveBeenCalledWith('user_123', {
          instituteEmail: 'new@gppalanpur.ac.in'
        });
      });

      it('should update user photo URL', async () => {
        const params = Promise.resolve({ id: 'std_123' });
        const updateData = { photoURL: 'https://example.com/photo.jpg' };
        
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        
        const response = await PUT(request, { params });
        
        expect(response.status).toBe(200);
        expect(mockUserService.updateUser).toHaveBeenCalledWith('user_123', {
          photoURL: 'https://example.com/photo.jpg'
        });
      });

      it('should handle user update failures gracefully', async () => {
        mockUserService.updateUser.mockRejectedValue(new Error('User update failed'));
        
        const params = Promise.resolve({ id: 'std_123' });
        const updateData = { fullNameGtuFormat: 'DOE UPDATED MICHAEL' };
        
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        
        const response = await PUT(request, { params });
        
        expect(response.status).toBe(200); // Student update should still succeed
        expect(mockUserService.updateUser).toHaveBeenCalled();
      });

      it('should not update user when no changes needed', async () => {
        const params = Promise.resolve({ id: 'std_123' });
        const updateData = { currentSemester: 4 }; // Non-user field
        
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        
        const response = await PUT(request, { params });
        
        expect(response.status).toBe(200);
        expect(mockUserService.updateUser).not.toHaveBeenCalled();
      });

      it('should handle student without userId', async () => {
        const studentWithoutUser = { ...mockStudent, userId: undefined };
        global.__API_STUDENTS_STORE__ = [studentWithoutUser];
        
        const params = Promise.resolve({ id: 'std_123' });
        const updateData = { firstName: 'UPDATED' };
        
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        
        const response = await PUT(request, { params });
        
        expect(response.status).toBe(200);
        expect(mockUserService.updateUser).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when JSON parsing fails', async () => {
        const params = Promise.resolve({ id: 'std_123' });
        const request = new NextRequest('http://localhost/api/students/std_123', {
          method: 'PUT',
          body: 'invalid json',
        });
        
        const response = await PUT(request, { params });
        const data = await response.json();
        
        expect(response.status).toBe(500);
        expect(data.message).toBe('Error updating student std_123');
        expect(data.error).toBeDefined();
      });
    });
  });

  describe('DELETE /api/students/[id]', () => {
    it('should delete student and linked user successfully', async () => {
      const params = Promise.resolve({ id: 'std_123' });
      const request = new NextRequest('http://localhost/api/students/std_123', {
        method: 'DELETE',
      });
      
      const response = await DELETE(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.message).toBe('Student deleted successfully');
      expect(global.__API_STUDENTS_STORE__).toHaveLength(0);
      expect(mockUserService.deleteUser).toHaveBeenCalledWith('user_123');
    });

    it('should return 404 when student not found', async () => {
      const params = Promise.resolve({ id: 'nonexistent' });
      const request = new NextRequest('http://localhost/api/students/nonexistent', {
        method: 'DELETE',
      });
      
      const response = await DELETE(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.message).toBe('Student not found');
      expect(mockUserService.deleteUser).not.toHaveBeenCalled();
    });

    it('should handle administrative user deletion gracefully', async () => {
      const adminError = new Error('Cannot delete this administrative user');
      mockUserService.deleteUser.mockRejectedValue(adminError);
      
      const params = Promise.resolve({ id: 'std_123' });
      const request = new NextRequest('http://localhost/api/students/std_123', {
        method: 'DELETE',
      });
      
      const response = await DELETE(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200); // Student should still be deleted
      expect(data.message).toBe('Student deleted successfully');
      expect(global.__API_STUDENTS_STORE__).toHaveLength(0);
    });

    it('should handle administrative user deletion with data field', async () => {
      const adminError = new Error('User delete failed') as Error & { data?: { message?: string } };
      adminError.data = { message: 'Cannot delete administrative user' };
      mockUserService.deleteUser.mockRejectedValue(adminError);
      
      const params = Promise.resolve({ id: 'std_123' });
      const request = new NextRequest('http://localhost/api/students/std_123', {
        method: 'DELETE',
      });
      
      const response = await DELETE(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.message).toBe('Student deleted successfully');
    });

    it('should handle other user deletion errors', async () => {
      mockUserService.deleteUser.mockRejectedValue(new Error('Database connection failed'));
      
      const params = Promise.resolve({ id: 'std_123' });
      const request = new NextRequest('http://localhost/api/students/std_123', {
        method: 'DELETE',
      });
      
      const response = await DELETE(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200); // Student should still be deleted
      expect(data.message).toBe('Student deleted successfully');
      expect(global.__API_STUDENTS_STORE__).toHaveLength(0);
    });

    it('should handle student without userId', async () => {
      const studentWithoutUser = { ...mockStudent, userId: undefined };
      global.__API_STUDENTS_STORE__ = [studentWithoutUser];
      
      const params = Promise.resolve({ id: 'std_123' });
      const request = new NextRequest('http://localhost/api/students/std_123', {
        method: 'DELETE',
      });
      
      const response = await DELETE(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.message).toBe('Student deleted successfully');
      expect(global.__API_STUDENTS_STORE__).toHaveLength(0);
      expect(mockUserService.deleteUser).not.toHaveBeenCalled();
    });

    it('should update global store correctly', async () => {
      // Add another student to verify correct deletion
      const anotherStudent = { ...mockStudent, id: 'std_456', enrollmentNumber: '999999' };
      global.__API_STUDENTS_STORE__.push(anotherStudent);
      
      const params = Promise.resolve({ id: 'std_123' });
      const request = new NextRequest('http://localhost/api/students/std_123', {
        method: 'DELETE',
      });
      
      const response = await DELETE(request, { params });
      
      expect(response.status).toBe(200);
      expect(global.__API_STUDENTS_STORE__).toHaveLength(1);
      expect(global.__API_STUDENTS_STORE__[0].id).toBe('std_456');
    });
  });
});