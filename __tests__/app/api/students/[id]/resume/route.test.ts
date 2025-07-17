import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/students/[id]/resume/route';
import * as resumeGeneratorModule from '@/lib/services/resumeGenerator';
import { mockStudent, mockProgram, mockBatch, mockCourses } from '../../../../../mocks/resumeTestData.mock';

// Mock the database connection and models
jest.mock('@/lib/mongodb', () => ({
  connectMongoose: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/lib/models', () => ({
  StudentModel: {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
    }),
  },
  ProgramModel: {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
    }),
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
    }),
  },
  BatchModel: {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
    }),
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
    }),
  },
  CourseModel: {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
    }),
  },
}));

// Mock the resume generator
jest.mock('@/lib/services/resumeGenerator', () => ({
  resumeGenerator: {
    generateResumeData: jest.fn(),
    generatePDF: jest.fn(),
    generateDOCX: jest.fn(),
    generateHTML: jest.fn(),
    generatePlainText: jest.fn(),
    generateBiodataPDF: jest.fn(),
    generateResumePDF: jest.fn(),
    generateCVPDF: jest.fn(),
  },
}));

// Mock mongoose for ObjectId validation
jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn().mockReturnValue(true),
    },
  },
}));

describe('/api/students/[id]/resume', () => {
  let mockStudentModel: any;
  let mockProgramModel: any;
  let mockBatchModel: any;
  let mockCourseModel: any;
  let mockResumeGenerator: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Get mocked modules
    const { StudentModel, ProgramModel, BatchModel, CourseModel } = require('@/lib/models');
    mockStudentModel = StudentModel;
    mockProgramModel = ProgramModel;
    mockBatchModel = BatchModel;
    mockCourseModel = CourseModel;

    mockResumeGenerator = resumeGeneratorModule.resumeGenerator;

    // Set up default mock implementations
    mockStudentModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStudent),
      }),
    });
    mockProgramModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProgram),
      }),
    });
    mockProgramModel.findById.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProgram),
      }),
    });
    mockBatchModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBatch),
      }),
    });
    mockBatchModel.findById.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBatch),
      }),
    });
    mockCourseModel.find.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCourses),
      }),
    });

    mockResumeGenerator.generateResumeData.mockReturnValue({
      fullName: 'John Doe',
      email: 'john@example.com',
      enrollmentNumber: '21DCS123',
      program: 'Computer Science',
      currentSemester: 6,
      instituteEmail: 'john@edu.com',
    });

    mockResumeGenerator.generatePDF.mockResolvedValue(Buffer.from('mock-pdf-content'));
    mockResumeGenerator.generateDOCX.mockResolvedValue(Buffer.from('mock-docx-content'));
    mockResumeGenerator.generateHTML.mockReturnValue('<html>Mock HTML</html>');
    mockResumeGenerator.generatePlainText.mockReturnValue('Mock plain text');
    mockResumeGenerator.generateBiodataPDF.mockResolvedValue(Buffer.from('mock-biodata-pdf'));
    mockResumeGenerator.generateResumePDF.mockResolvedValue(Buffer.from('mock-resume-pdf'));
    mockResumeGenerator.generateCVPDF.mockResolvedValue(Buffer.from('mock-cv-pdf'));
  });

  describe('GET', () => {
    const createMockRequest = (url: string) => {
      return new Request(url) as NextRequest;
    };

    const createMockParams = (id: string) => ({
      params: Promise.resolve({ id }),
    });

    it('should generate PDF resume by default', async () => {
      const request = createMockRequest('http://localhost:3000/api/students/student-123/resume');
      const params = createMockParams('student-123');

      const response = await GET(request, params);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Disposition')).toContain('.pdf');

      expect(mockResumeGenerator.generatePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'John Doe',
          enrollmentNumber: '21DCS123',
        })
      );
    });

    it('should generate DOCX when format=docx', async () => {
      const request = createMockRequest('http://localhost:3000/api/students/student-123/resume?format=docx');
      const params = createMockParams('student-123');

      const response = await GET(request, params);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(response.headers.get('Content-Disposition')).toContain('.docx');

      expect(mockResumeGenerator.generateDOCX).toHaveBeenCalled();
    });

    it('should generate HTML when format=html', async () => {
      const request = createMockRequest('http://localhost:3000/api/students/student-123/resume?format=html');
      const params = createMockParams('student-123');

      const response = await GET(request, params);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      expect(response.headers.get('Content-Disposition')).toContain('.html');

      expect(mockResumeGenerator.generateHTML).toHaveBeenCalled();
    });

    it('should generate plain text when format=txt', async () => {
      const request = createMockRequest('http://localhost:3000/api/students/student-123/resume?format=txt');
      const params = createMockParams('student-123');

      const response = await GET(request, params);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain');
      expect(response.headers.get('Content-Disposition')).toContain('.txt');

      expect(mockResumeGenerator.generatePlainText).toHaveBeenCalled();
    });

    it('should generate biodata PDF when format=biodata', async () => {
      const request = createMockRequest('http://localhost:3000/api/students/student-123/resume?format=biodata');
      const params = createMockParams('student-123');

      const response = await GET(request, params);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain('_biodata.pdf');

      expect(mockResumeGenerator.generateBiodataPDF).toHaveBeenCalled();
    });

    it('should generate resume PDF when format=resume', async () => {
      const request = createMockRequest('http://localhost:3000/api/students/student-123/resume?format=resume');
      const params = createMockParams('student-123');

      const response = await GET(request, params);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain('_resume.pdf');

      expect(mockResumeGenerator.generateResumePDF).toHaveBeenCalled();
    });

    it('should generate CV PDF when format=cv', async () => {
      const request = createMockRequest('http://localhost:3000/api/students/student-123/resume?format=cv');
      const params = createMockParams('student-123');

      const response = await GET(request, params);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain('_cv.pdf');

      expect(mockResumeGenerator.generateCVPDF).toHaveBeenCalled();
    });

    it('should return 400 for invalid format', async () => {
      const request = createMockRequest('http://localhost:3000/api/students/student-123/resume?format=invalid');
      const params = createMockParams('student-123');

      const response = await GET(request, params);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid format');
    });

    it('should return 400 when student ID is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/students//resume');
      const params = createMockParams('');

      const response = await GET(request, params);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Student ID is required');
    });

    it('should return 404 when student not found', async () => {
      mockStudentModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const request = createMockRequest('http://localhost:3000/api/students/nonexistent/resume');
      const params = createMockParams('nonexistent');

      const response = await GET(request, params);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Student not found');
    });

    it('should handle PDF generation errors gracefully', async () => {
      mockResumeGenerator.generatePDF.mockRejectedValue(new Error('PDF generation failed'));

      const request = createMockRequest('http://localhost:3000/api/students/student-123/resume');
      const params = createMockParams('student-123');

      const response = await GET(request, params);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to generate resume');
      expect(body.details).toContain('PDF generation failed');
    });

    it('should set cache headers correctly', async () => {
      const request = createMockRequest('http://localhost:3000/api/students/student-123/resume');
      const params = createMockParams('student-123');

      const response = await GET(request, params);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });

    it('should handle program lookup with multiple strategies', async () => {
      // First call fails, second succeeds
      mockProgramModel.findOne
        .mockResolvedValueOnce(null) // First strategy (custom id) fails
        .mockResolvedValueOnce(mockProgram); // Second strategy (MongoDB ObjectId) succeeds

      const request = createMockRequest('http://localhost:3000/api/students/student-123/resume');
      const params = createMockParams('student-123');

      const response = await GET(request, params);

      expect(response.status).toBe(200);
      expect(mockProgramModel.findOne).toHaveBeenCalledTimes(2);
    });

    it('should handle missing program gracefully', async () => {
      mockProgramModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      mockProgramModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const request = createMockRequest('http://localhost:3000/api/students/student-123/resume');
      const params = createMockParams('student-123');

      const response = await GET(request, params);

      expect(response.status).toBe(200);
      expect(mockResumeGenerator.generateResumeData).toHaveBeenCalledWith(
        mockStudent,
        undefined, // program should be undefined
        expect.any(Object), // batch
        [], // results
        mockCourses
      );
    });
  });

  describe('POST', () => {
    const createMockPostRequest = (url: string, body: any) => {
      return new Request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }) as NextRequest;
    };

    const createMockParams = (id: string) => ({
      params: Promise.resolve({ id }),
    });

    it('should generate custom resume with enhanced data', async () => {
      const customData = {
        format: 'pdf',
        skills: [
          { name: 'Python', category: 'Programming', proficiency: 'Advanced' },
        ],
        projects: [
          { title: 'Custom Project', description: 'Custom description' },
        ],
      };

      const request = createMockPostRequest('http://localhost:3000/api/students/student-123/resume', customData);
      const params = createMockParams('student-123');

      const response = await POST(request, params);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');

      expect(mockResumeGenerator.generatePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          skills: customData.skills,
          projects: customData.projects,
        })
      );
    });

    it('should merge custom data with base resume data', async () => {
      const customData = {
        format: 'html',
        achievements: [
          { title: 'Custom Achievement', description: 'Custom description' },
        ],
      };

      const request = createMockPostRequest('http://localhost:3000/api/students/student-123/resume', customData);
      const params = createMockParams('student-123');

      const response = await POST(request, params);

      expect(response.status).toBe(200);
      expect(mockResumeGenerator.generateHTML).toHaveBeenCalledWith(
        expect.objectContaining({
          achievements: customData.achievements,
          fullName: 'John Doe', // Should include base data
        })
      );
    });

    it('should default to PDF format when format not specified', async () => {
      const customData = {
        skills: [{ name: 'React', category: 'Frontend', proficiency: 'Intermediate' }],
      };

      const request = createMockPostRequest('http://localhost:3000/api/students/student-123/resume', customData);
      const params = createMockParams('student-123');

      const response = await POST(request, params);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(mockResumeGenerator.generatePDF).toHaveBeenCalled();
    });

    it('should return 400 when student ID is missing', async () => {
      const request = createMockPostRequest('http://localhost:3000/api/students//resume', {});
      const params = createMockParams('');

      const response = await POST(request, params);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Student ID is required');
    });

    it('should return 404 when student not found', async () => {
      mockStudentModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const request = createMockPostRequest('http://localhost:3000/api/students/nonexistent/resume', {});
      const params = createMockParams('nonexistent');

      const response = await POST(request, params);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Student not found');
    });

    it('should handle POST errors gracefully', async () => {
      mockResumeGenerator.generatePDF.mockRejectedValue(new Error('Generation failed'));

      const request = createMockPostRequest('http://localhost:3000/api/students/student-123/resume', {});
      const params = createMockParams('student-123');

      const response = await POST(request, params);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to generate custom resume');
      expect(body.details).toContain('Generation failed');
    });

    it('should handle invalid JSON in request body', async () => {
      const invalidRequest = new Request('http://localhost:3000/api/students/student-123/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      }) as NextRequest;

      const params = createMockParams('student-123');

      const response = await POST(invalidRequest, params);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to generate custom resume');
    });
  });

  describe('Database Integration', () => {
    it('should connect to MongoDB before processing', async () => {
      const { connectMongoose } = require('@/lib/mongodb');
      
      const request = new Request('http://localhost:3000/api/students/student-123/resume') as NextRequest;
      const params = { params: Promise.resolve({ id: 'student-123' }) };

      await GET(request, params);

      expect(connectMongoose).toHaveBeenCalled();
    });

    it('should query all required models', async () => {
      const request = new Request('http://localhost:3000/api/students/student-123/resume') as NextRequest;
      const params = { params: Promise.resolve({ id: 'student-123' }) };

      await GET(request, params);

      expect(mockStudentModel.findOne).toHaveBeenCalledWith({ id: 'student-123' });
      expect(mockCourseModel.find).toHaveBeenCalled();
    });

    it('should handle database connection errors', async () => {
      const { connectMongoose } = require('@/lib/mongodb');
      connectMongoose.mockRejectedValue(new Error('Database connection failed'));

      const request = new Request('http://localhost:3000/api/students/student-123/resume') as NextRequest;
      const params = { params: Promise.resolve({ id: 'student-123' }) };

      const response = await GET(request, params);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to generate resume');
    });
  });
});