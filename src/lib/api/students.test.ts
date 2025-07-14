import { studentService } from './students';
import type { Student, Program } from '@/types/entities';

// Setup fetch mock
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to create mock responses
const createMockResponse = (options: { ok: boolean; status?: number; json: () => Promise<unknown> }) => {
  return {
    ok: options.ok,
    status: options.status || (options.ok ? 200 : 500),
    json: options.json,
  } as Response;
};
describe('Students API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  const mockStudent: Student = {
    id: '1',
    enrollmentNumber: '123456',
    programId: 'prog1',
    currentSemester: 3,
    status: 'active' as const,
    userId: 'user1',
    instituteEmail: 'student1@institute.edu'
  };

  const mockStudents: Student[] = [
    mockStudent,
    {
      id: '2',
      enrollmentNumber: '654321',
      programId: 'prog2',
      currentSemester: 4,
      status: 'active' as const,
      userId: 'user2',
      instituteEmail: 'student2@institute.edu'
    }
  ];

  describe('getAllStudents', () => {
    it('should fetch all students', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockStudents
      }));

      const result = await studentService.getAllStudents();

      expect(mockFetch).toHaveBeenCalledWith(`/api/students`);
      expect(result).toEqual(mockStudents);
    });

    it('should throw an error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' })
      }));

      await expect(studentService.getAllStudents()).rejects.toThrow('Failed to fetch students');
    });
  });

  describe('getStudentById', () => {
    it('should fetch a single student by id', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockStudent
      }));

      const result = await studentService.getStudentById('1');

      expect(mockFetch).toHaveBeenCalledWith(`/api/students/1`);
      expect(result).toEqual(mockStudent);
    });

    it('should throw an error if student not found', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Student not found' })
      }));

      await expect(studentService.getStudentById('999')).rejects.toThrow('Failed to fetch student with id 999');
    });
  });

  describe('createStudent', () => {
    it('should create a new student', async () => {
      const newStudentData = {
        enrollmentNumber: '789012',
        programId: 'prog3',
        department: 'Mechanical Engineering',
        currentSemester: 1,
        status: 'active' as const,
        instituteId: 'inst1',
        instituteEmail: 'student3@institute.edu'
      };

      const createdStudent = {
        ...newStudentData,
        id: 'new-student-id',
        userId: 'new-user-id'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => createdStudent
      }));

      const result = await studentService.createStudent(newStudentData);

      expect(mockFetch).toHaveBeenCalledWith(`/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudentData)
      });
      expect(result).toEqual(createdStudent);
    });

    it('should throw an error if creation fails', async () => {
      const newStudentData = {
        enrollmentNumber: '789012',
        programId: 'prog3',
        department: 'Mechanical Engineering',
        currentSemester: 1,
        status: 'active' as const,
        instituteId: 'inst1',
        instituteEmail: 'student3@institute.edu'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Failed to create student' })
      }));

      await expect(studentService.createStudent(newStudentData)).rejects.toThrow('Failed to create student');
    });

    it('should handle JSON parse error during creation', async () => {
      const newStudentData = {
        enrollmentNumber: '789012',
        programId: 'prog3',
        department: 'Mechanical Engineering',
        currentSemester: 1,
        status: 'active' as const,
        instituteId: 'inst1',
        instituteEmail: 'student3@institute.edu'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Invalid JSON'); }
      }));

      await expect(studentService.createStudent(newStudentData)).rejects.toThrow('Failed to create student');
    });
  });

  describe('updateStudent', () => {
    it('should update an existing student', async () => {
      const updateData = {
        currentSemester: 4,
        status: 'graduated' as const
      };

      const updatedStudent = {
        ...mockStudent,
        ...updateData
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => updatedStudent
      }));

      const result = await studentService.updateStudent('1', updateData);

      expect(mockFetch).toHaveBeenCalledWith(`/api/students/1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      expect(result).toEqual(updatedStudent);
    });

    it('should throw an error if update fails', async () => {
      const updateData = {
        currentSemester: 4,
        status: 'graduated' as const
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Failed to update student' })
      }));

      await expect(studentService.updateStudent('1', updateData)).rejects.toThrow('Failed to update student');
    });

    it('should handle JSON parse error during update', async () => {
      const updateData = {
        currentSemester: 4,
        status: 'graduated' as const
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Invalid JSON'); }
      }));

      await expect(studentService.updateStudent('1', updateData)).rejects.toThrow('Failed to update student');
    });
  });

  describe('deleteStudent', () => {
    it('should delete a student', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => ({})
      }));

      await studentService.deleteStudent('1');

      expect(mockFetch).toHaveBeenCalledWith(`/api/students/1`, {
        method: 'DELETE'
      });
    });

    it('should throw an error if deletion fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Failed to delete student with id 1' })
      }));

      await expect(studentService.deleteStudent('1')).rejects.toThrow('Failed to delete student with id 1');
    });

    it('should handle JSON parse error during deletion', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Invalid JSON'); }
      }));

      await expect(studentService.deleteStudent('1')).rejects.toThrow('Failed to delete student with id 1');
    });
  });

  describe('importStudents', () => {
    it('should import students from a file', async () => {
      const mockFile = new File([''], 'test.csv');
      const mockPrograms: Program[] = [{ id: 'prog1', name: 'Program 1', code: 'PROG1', departmentId: 'dep1', instituteId: 'inst1', status: 'active' }];
      const mockResult = { newCount: 2, updatedCount: 1, skippedCount: 0 };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockResult
      }));

      const result = await studentService.importStudents(mockFile, mockPrograms);

      // Check that FormData was used correctly
      expect(mockFetch).toHaveBeenCalledWith(`/api/students/import`, {
        method: 'POST',
        body: expect.any(FormData)
      });
      expect(result).toEqual(mockResult);
    });

    it('should throw an error if import fails', async () => {
      const mockFile = new File([''], 'test.csv');
      const mockPrograms: Program[] = [{ id: 'prog1', name: 'Program 1', code: 'PROG1', departmentId: 'dep1', instituteId: 'inst1', status: 'active' }];

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ 
          message: 'Failed to import students', 
          errors: [{ message: 'Invalid format' }] 
        })
      }));

      await expect(studentService.importStudents(mockFile, mockPrograms)).rejects.toThrow(/Failed to import students/);
    });

    it('should handle JSON parse error during import', async () => {
      const mockFile = new File([''], 'test.csv');
      const mockPrograms: Program[] = [{ id: 'prog1', name: 'Program 1', code: 'PROG1', departmentId: 'dep1', instituteId: 'inst1', status: 'active' }];

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Invalid JSON'); }
      }));

      await expect(studentService.importStudents(mockFile, mockPrograms)).rejects.toThrow('Invalid JSON');
    });
  });

  describe('importGtuStudents', () => {
    it('should import GTU students from a file', async () => {
      const mockFile = new File([''], 'test.csv');
      const mockPrograms: Program[] = [{ id: 'prog1', name: 'Program 1', code: 'PROG1', departmentId: 'dep1', instituteId: 'inst1', status: 'active' }];
      const mockResult = { newCount: 3, updatedCount: 0, skippedCount: 1 };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockResult
      }));

      const result = await studentService.importGtuStudents(mockFile, mockPrograms);

      // Check that FormData was used correctly
      expect(mockFetch).toHaveBeenCalledWith(`/api/students/import-gtu`, {
        method: 'POST',
        body: expect.any(FormData)
      });
      expect(result).toEqual(mockResult);
    });

    it('should throw an error if GTU import fails', async () => {
      const mockFile = new File([''], 'test.csv');
      const mockPrograms: Program[] = [{ id: 'prog1', name: 'Program 1', code: 'PROG1', departmentId: 'dep1', instituteId: 'inst1', status: 'active' }];

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ 
          message: 'Failed to import GTU students data', 
          errors: [{ message: 'Invalid format' }] 
        })
      }));

      await expect(studentService.importGtuStudents(mockFile, mockPrograms)).rejects.toThrow(/Failed to import GTU students data/);
    });

    it('should handle JSON parse error during GTU import', async () => {
      const mockFile = new File([''], 'test.csv');
      const mockPrograms: Program[] = [{ id: 'prog1', name: 'Program 1', code: 'PROG1', departmentId: 'dep1', instituteId: 'inst1', status: 'active' }];

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Invalid JSON'); }
      }));

      await expect(studentService.importGtuStudents(mockFile, mockPrograms)).rejects.toThrow('Invalid JSON');
    });
  });
});