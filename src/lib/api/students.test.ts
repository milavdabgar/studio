import { studentService } from './students';

jest.mock('./students');

const mockedStudentService = studentService as jest.Mocked<typeof studentService>;
describe('Students API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createStudent', () => {
    it('should call the correct function with the correct data', async () => {
      const mockData = {
          id: '1',
          name: 'John Doe',
          rollNo: '123',
          email: 'john.doe@example.com',
          departmentId: 'dep1',
          programId: 'prog1',
          batchId: 'batch1',
      };
      mockedStudentService.createStudent.mockResolvedValue(mockData);

      const result = await studentService.createStudent(mockData);

      expect(mockedStudentService.createStudent).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockData);
    });
  });

  describe('getStudentById', () => {
    it('should call the correct function with the correct id', async () => {
      const mockData = {
        id: '1',
        name: 'John Doe',
        rollNo: '123',
        email: 'john.doe@example.com',
        departmentId: 'dep1',
        programId: 'prog1',
        batchId: 'batch1',
      };
      mockedStudentService.getStudentById.mockResolvedValue(mockData);

      const result = await studentService.getStudentById('1');

      expect(mockedStudentService.getStudentById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockData);
    });
  });

  describe('getStudents', () => {
    it('should call the correct function', async () => {
      const mockData = [
        {
          id: '1',
          name: 'John Doe',
          rollNo: '123',
          email: 'john.doe@example.com',
          departmentId: 'dep1',
          programId: 'prog1',
          batchId: 'batch1',
        },
        {
          id: '2',
          name: 'Jane Doe',
          rollNo: '456',
          email: 'jane.doe@example.com',
          departmentId: 'dep1',
          programId: 'prog1',
          batchId: 'batch1',
        }
      ];
      mockedStudentService.getAllStudents.mockResolvedValue(mockData as any);
      
      const result = await studentService.getAllStudents();
      expect(mockedStudentService.getAllStudents).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe('updateStudent', () => {
    it('should call the correct function with the correct id and data', async () => {
      const mockData = {
          id: '1',
          name: 'John Doe Updated',
          rollNo: '123',
          email: 'john.doe.updated@example.com',
          departmentId: 'dep1',
          programId: 'prog1',
          batchId: 'batch1',
      };
      mockedStudentService.updateStudent.mockResolvedValue(mockData);

      const result = await studentService.updateStudent('1', mockData);
      expect(mockedStudentService.updateStudent).toHaveBeenCalledWith('1', mockData);
      expect(result).toEqual(mockData);
    });
  });

  describe('deleteStudent', () => {
    it('should call the correct function with the correct id', async () => {
      mockedStudentService.deleteStudent.mockResolvedValue(undefined); // delete typically resolves with void or success indicator

      await studentService.deleteStudent('1');
      expect(mockedStudentService.deleteStudent).toHaveBeenCalledWith('1');
    });
  });

  describe('importStudents', () => {
    it('should call the correct function with the correct file and programs', async () => {
      const mockFile = new File([''], 'test.csv');
      const mockData = { newCount: 1, updatedCount: 0, skippedCount: 0 };
      const mockPrograms = [{ id: 'prog1', name: 'Program 1', departmentId: 'dep1' }];

      mockedStudentService.importStudents.mockResolvedValue(mockData);

      const result = await studentService.importStudents(mockFile, mockPrograms);
      
      expect(result).toEqual(mockData);
      // importStudents function in src/lib/api/students.ts expects programs array as well
      expect(mockedStudentService.importStudents).toHaveBeenCalledWith(mockFile, mockPrograms);
    });
  });

  describe('importGtuStudents', () => {
    it('should call the correct function with the correct file and programs', async () => {
      const mockFile = new File([''], 'test.csv');
      const mockData = { newCount: 1, updatedCount: 0, skippedCount: 0 };
      const mockPrograms = [{ id: 'prog1', name: 'Program 1', departmentId: 'dep1' }];

      mockedStudentService.importGtuStudents.mockResolvedValue(mockData);

      const result = await studentService.importGtuStudents(mockFile, mockPrograms);

      expect(result).toEqual(mockData);
      // importGtuStudents function in src/lib/api/students.ts expects programs array as well
      expect(mockedStudentService.importGtuStudents).toHaveBeenCalledWith(mockFile, mockPrograms);
    });
  });
});