import {
  createFaculty,
  getFaculty,
  getFaculties,
  updateFaculty,
  deleteFaculty,
  importFaculty,
  importGtuFaculty
} from './faculty';
import { mock, MockProxy } from 'jest-mock-extended';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

jest.mock('@/lib/db', () => ({
  prisma: mock<typeof prisma>()
}));

describe('Faculty API', () => {
  let mockPrisma: MockProxy<typeof prisma>;

  beforeEach(() => {
    mockPrisma = jest.mocked(prisma, true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFaculty', () => {
    it('should create a new faculty', async () => {
      const facultyData: Prisma.FacultyCreateInput = {
        name: 'Test Faculty',
        code: 'TF',
        email: 'test@example.com',
        phone: "1234567890"
      };
      const createdFaculty = { ...facultyData, id: '1' };
      mockPrisma.faculty.create.mockResolvedValue(createdFaculty);

      const result = await createFaculty(facultyData);

      expect(mockPrisma.faculty.create).toHaveBeenCalledWith({ data: facultyData });
      expect(result).toEqual(createdFaculty);
    });
  });

  describe('getFaculty', () => {
    it('should get a faculty by ID', async () => {
      const facultyId = '1';
      const faculty = { id: facultyId, name: 'Test Faculty', code: 'TF', email: 'test@example.com', phone: "1234567890" };
      mockPrisma.faculty.findUnique.mockResolvedValue(faculty);

      const result = await getFaculty(facultyId);

      expect(mockPrisma.faculty.findUnique).toHaveBeenCalledWith({ where: { id: facultyId } });
      expect(result).toEqual(faculty);
    });

    it('should return null if faculty is not found', async () => {
      const facultyId = '999';
      mockPrisma.faculty.findUnique.mockResolvedValue(null);

      const result = await getFaculty(facultyId);

      expect(mockPrisma.faculty.findUnique).toHaveBeenCalledWith({ where: { id: facultyId } });
      expect(result).toBeNull();
    });
  });

  describe('getFaculties', () => {
    it('should get all faculties', async () => {
      const faculties = [
        { id: '1', name: 'Test Faculty 1', code: 'TF1', email: 'test1@example.com', phone: "1234567890" },
        { id: '2', name: 'Test Faculty 2', code: 'TF2', email: 'test2@example.com', phone: "1234567890" },
      ];
      mockPrisma.faculty.findMany.mockResolvedValue(faculties);

      const result = await getFaculties();

      expect(mockPrisma.faculty.findMany).toHaveBeenCalled();
      expect(result).toEqual(faculties);
    });
  });

  describe('updateFaculty', () => {
    it('should update an existing faculty', async () => {
      const facultyId = '1';
      const updatedData: Prisma.FacultyUpdateInput = { name: 'Updated Faculty' };
      const updatedFaculty = { id: facultyId, name: 'Updated Faculty', code: 'TF', email: 'test@example.com', phone: "1234567890"};
      mockPrisma.faculty.update.mockResolvedValue(updatedFaculty);

      const result = await updateFaculty(facultyId, updatedData);

      expect(mockPrisma.faculty.update).toHaveBeenCalledWith({
        where: { id: facultyId },
        data: updatedData,
      });
      expect(result).toEqual(updatedFaculty);
    });
  });

  describe('deleteFaculty', () => {
    it('should delete a faculty by ID', async () => {
      const facultyId = '1';
      const deletedFaculty = { id: facultyId, name: 'Test Faculty', code: 'TF', email: 'test@example.com', phone: "1234567890" };
      mockPrisma.faculty.delete.mockResolvedValue(deletedFaculty);

      const result = await deleteFaculty(facultyId);

      expect(mockPrisma.faculty.delete).toHaveBeenCalledWith({ where: { id: facultyId } });
      expect(result).toEqual(deletedFaculty);
    });
  });

  describe('importFaculty', () => {
    it('should import faculties', async () => {
        const facultiesData = [
          { name: 'Test Faculty 1', code: 'TF1', email: 'test1@example.com', phone: '1234567890'},
          { name: 'Test Faculty 2', code: 'TF2', email: 'test2@example.com', phone: '1234567890' },
        ];
        const createdFaculties = facultiesData.map((faculty, index) => ({ ...faculty, id: `${index + 1}` }));
        mockPrisma.faculty.createMany.mockResolvedValue({count: facultiesData.length});
    
        const result = await importFaculty(facultiesData);
    
        expect(mockPrisma.faculty.createMany).toHaveBeenCalledWith({ data: facultiesData, skipDuplicates: true });
        expect(result).toEqual(createdFaculties.length);
      });
  });

    describe('importGtuFaculty', () => {
      it('should import GTU faculties', async () => {
          const facultiesData = [
            { faculty_name: 'Test Faculty 1', faculty_code: 'TF1', email: 'test1@example.com', phone_number: '1234567890'},
            { faculty_name: 'Test Faculty 2', faculty_code: 'TF2', email: 'test2@example.com', phone_number: '1234567890' },
          ];
          const createdFaculties = facultiesData.map((faculty, index) => ({ name: faculty.faculty_name, code: faculty.faculty_code, email: faculty.email, phone: faculty.phone_number }));
          mockPrisma.faculty.createMany.mockResolvedValue({count: facultiesData.length});
      
          const result = await importGtuFaculty(facultiesData);
      
          expect(mockPrisma.faculty.createMany).toHaveBeenCalledWith({ data: createdFaculties, skipDuplicates: true });
          expect(result).toEqual(createdFaculties.length);
        });
    });
});