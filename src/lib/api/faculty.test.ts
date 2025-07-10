import { facultyService } from './faculty';
import type { Faculty, Qualification, FacultyStatus } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Create a proper mock for the Response object
const createMockResponse = (options: { ok: boolean; status?: number; statusText?: string; json?: () => Promise<unknown> }): Response => {
  const { ok, status = 200, statusText = '', json = async () => ({}) } = options;
  return {
    ok,
    status,
    statusText,
    json,
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(options),
    text: async () => '',
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    bodyUsed: false,
  } as Response;
};

// Mock fetch with proper return type
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('Faculty API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Sample qualification object that matches the Qualification interface
  const sampleQualification: Qualification = {
    degree: 'PhD',
    field: 'Computer Science',
    institution: 'Test University',
    year: 2020
  };

  const sampleMastersQualification: Qualification = {
    degree: 'Masters',
    field: 'Data Science',
    institution: 'Test University',
    year: 2018
  };

  describe('getAllFaculty', () => {
    it('should fetch all faculty members', async () => {
      const mockFacultyList: Faculty[] = [
        {
          id: '1',
          userId: 'user-1',
          staffCode: 'TF1',
          firstName: 'Test',
          lastName: 'Faculty 1',
          personalEmail: 'test1@example.com',
          instituteEmail: 'test1@institute.edu',
          contactNumber: '1234567890',
          status: 'active' as FacultyStatus,
          department: 'Computer Science',
          designation: 'Professor',
          qualifications: [sampleQualification],
          specializations: ['Computer Science'],
          joiningDate: '2023-01-01T00:00:00.000Z',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          userId: 'user-2',
          staffCode: 'TF2',
          firstName: 'Test',
          lastName: 'Faculty 2',
          personalEmail: 'test2@example.com',
          instituteEmail: 'test2@institute.edu',
          contactNumber: '0987654321',
          status: 'active' as FacultyStatus,
          department: 'Computer Science',
          designation: 'Associate Professor',
          qualifications: [sampleMastersQualification],
          specializations: ['Data Science'],
          joiningDate: '2023-02-01T00:00:00.000Z',
          createdAt: '2023-02-01T00:00:00.000Z',
          updatedAt: '2023-02-01T00:00:00.000Z'
        }
      ];

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockFacultyList
      }));

      const result = await facultyService.getAllFaculty();
      expect(result).toEqual(mockFacultyList);
      expect(fetch).toHaveBeenCalledWith('/api/faculty');
    });

    it('should throw an error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      }));

      await expect(facultyService.getAllFaculty()).rejects.toThrow('Failed to fetch faculty list');
    });
  });

  describe('createFaculty', () => {
    it('should create a new faculty member', async () => {
      const facultyData: Omit<Faculty, 'id' | 'userId'> & { instituteId: string } = {
        staffCode: 'TF',
        firstName: 'Test',
        lastName: 'Faculty',
        personalEmail: 'test@example.com',
        instituteEmail: 'test@institute.edu',
        contactNumber: '1234567890',
        status: 'active' as FacultyStatus,
        department: 'Computer Science',
        designation: 'Professor',
        qualifications: [sampleQualification],
        specializations: ['Computer Science'],
        joiningDate: '2023-01-01T00:00:00.000Z',
        instituteId: 'inst-1'
      };
      
      const createdFaculty: Faculty = {
        ...facultyData,
        id: '1',
        userId: 'user-1',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        status: 201,
        json: async () => createdFaculty
      }));

      const result = await facultyService.createFaculty(facultyData);
      expect(result).toEqual(createdFaculty);
      expect(fetch).toHaveBeenCalledWith('/api/faculty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(facultyData)
      });
    });

    it('should throw an error if creation fails', async () => {
      const facultyData: Omit<Faculty, 'id' | 'userId'> & { instituteId: string } = {
        staffCode: 'TF',
        firstName: 'Test',
        lastName: 'Faculty',
        personalEmail: 'test@example.com',
        instituteEmail: 'test@institute.edu',
        contactNumber: '1234567890',
        status: 'active' as FacultyStatus,
        department: 'Computer Science',
        designation: 'Professor',
        qualifications: [sampleQualification],
        specializations: ['Computer Science'],
        joiningDate: '2023-01-01T00:00:00.000Z',
        instituteId: 'inst-1'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Failed to create faculty' })
      }));
      
      await expect(facultyService.createFaculty(facultyData)).rejects.toThrow('Failed to create faculty');
    });
  });

  describe('getFacultyById', () => {
    it('should fetch a faculty member by ID', async () => {
      const facultyId = '1';
      const faculty: Faculty = {
        id: '1',
        userId: 'user-1',
        staffCode: 'TF',
        firstName: 'Test',
        lastName: 'Faculty',
        personalEmail: 'test@example.com',
        instituteEmail: 'test@institute.edu',
        contactNumber: '1234567890',
        status: 'active' as FacultyStatus,
        department: 'Computer Science',
        designation: 'Professor',
        qualifications: [sampleQualification],
        specializations: ['Computer Science'],
        joiningDate: '2023-01-01T00:00:00.000Z',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => faculty
      }));

      const result = await facultyService.getFacultyById(facultyId);
      expect(result).toEqual(faculty);
      expect(fetch).toHaveBeenCalledWith('/api/faculty/1');
    });

    it('should throw an error if faculty is not found', async () => {
      const facultyId = '999';
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Faculty not found' })
      }));

      await expect(facultyService.getFacultyById(facultyId)).rejects.toThrow(`Failed to fetch faculty with id ${facultyId}`);
      expect(fetch).toHaveBeenCalledWith('/api/faculty/999');
    });
  });

  describe('updateFaculty', () => {
    it('should update a faculty member', async () => {
      const facultyId = '1';
      const updateData: Partial<Omit<Faculty, 'id'>> & { instituteId?: string } = {
        firstName: 'Updated',
        lastName: 'Faculty',
        designation: 'Senior Professor',
        qualifications: [
          sampleQualification,
          {
            degree: 'MBA',
            field: 'Business Administration',
            institution: 'Business School',
            year: 2015
          }
        ]
      };
      
      const updatedFaculty: Faculty = {
        id: '1',
        userId: 'user-1',
        staffCode: 'TF',
        firstName: 'Updated',
        lastName: 'Faculty',
        personalEmail: 'test@example.com',
        instituteEmail: 'test@institute.edu',
        contactNumber: '1234567890',
        status: 'active' as FacultyStatus,
        department: 'Computer Science',
        designation: 'Senior Professor',
        qualifications: [
          sampleQualification,
          {
            degree: 'MBA',
            field: 'Business Administration',
            institution: 'Business School',
            year: 2015
          }
        ],
        specializations: ['Computer Science'],
        joiningDate: '2023-01-01T00:00:00.000Z',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => updatedFaculty
      }));

      const result = await facultyService.updateFaculty(facultyId, updateData);
      expect(result).toEqual(updatedFaculty);
      expect(fetch).toHaveBeenCalledWith('/api/faculty/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
    });

    it('should throw an error if update fails', async () => {
      const facultyId = '1';
      const updateData: Partial<Omit<Faculty, 'id'>> = { 
        firstName: 'Updated',
        lastName: 'Faculty'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Failed to update faculty' })
      }));

      await expect(facultyService.updateFaculty(facultyId, updateData)).rejects.toThrow('Failed to update faculty');
    });
  });

  describe('deleteFaculty', () => {
    it('should delete a faculty member by ID', async () => {
      const facultyId = '1';

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true
      }));

      await facultyService.deleteFaculty(facultyId);
      expect(fetch).toHaveBeenCalledWith('/api/faculty/1', {
        method: 'DELETE'
      });
    });

    it('should throw an error if deletion fails', async () => {
      const facultyId = '1';

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        json: async () => ({ message: `Failed to delete faculty with id ${facultyId}` })
      }));

      await expect(facultyService.deleteFaculty(facultyId)).rejects.toThrow(`Failed to delete faculty with id ${facultyId}`);
    });
  });

  describe('importFaculty', () => {
    it('should import faculty members from a file', async () => {
      const mockFile = new File(['test data'], 'faculty.csv', { type: 'text/csv' });
      const instituteId = 'inst-1';
      const mockResponse = { newCount: 3, updatedCount: 1, skippedCount: 0 };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockResponse
      }));

      const result = await facultyService.importFaculty(mockFile, instituteId);
      expect(result).toEqual(mockResponse);
      
      // Check that FormData was created correctly
      expect(fetch).toHaveBeenCalledWith('/api/faculty/import', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });

    it('should throw an error if import fails', async () => {
      const mockFile = new File(['test data'], 'faculty.csv', { type: 'text/csv' });
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ 
          message: 'Failed to import faculty (standard)',
          errors: [
            { message: 'Invalid CSV format' },
            { message: 'Missing required fields' }
          ]
        })
      }));

      await expect(facultyService.importFaculty(mockFile)).rejects.toThrow(
        'Failed to import faculty (standard) Specific issues: Invalid CSV format; Missing required fields'
      );
    });
  });

  describe('importGtuFaculty', () => {
    it('should import GTU faculty members from a file', async () => {
      const mockFile = new File(['test data'], 'gtu_faculty.csv', { type: 'text/csv' });
      const instituteId = 'inst-1';
      const mockResponse = { newCount: 2, updatedCount: 0, skippedCount: 1 };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: async () => mockResponse
      }));

      const result = await facultyService.importGtuFaculty(mockFile, instituteId);
      expect(result).toEqual(mockResponse);
      
      // Check that FormData was created correctly
      expect(fetch).toHaveBeenCalledWith('/api/faculty/import-gtu', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });

    it('should throw an error if GTU import fails', async () => {
      const mockFile = new File(['test data'], 'gtu_faculty.csv', { type: 'text/csv' });
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        json: async () => ({ 
          message: 'Failed to import GTU faculty data',
          errors: [
            { message: 'Invalid format' },
            { data: { row: 2, error: 'Missing email' } }
          ]
        })
      }));

      await expect(facultyService.importGtuFaculty(mockFile)).rejects.toThrow(
        'Failed to import GTU faculty data Specific issues: Invalid format; {"row":2,"error":"Missing email"}'
      );
    });
  });
});
